import mongoose from "mongoose";
import Practice from "../models/Practice.js";
import Lesson from "../models/Lesson.js";
import User from "../models/User.js";
import StorageService from "./storage.service.js";
import AiService from "./ai.service.js";
import StudyLogService from "./studylog.service.js";
import { calculateNewStreak } from "../utils/dateUtils.js";

export class PracticeService {
  /**
   * 1. Process Voice: Upload audio, run STT (or use Web Speech API transcript) and evaluate with LLM
   */
  static async processVoice({
    userId,
    lessonId,
    fileBuffer,
    originalName,
    mimeType,
    sampleSentence: clientSentence,
    transcript: clientTranscript,
  }) {
    let targetSentence = clientSentence || "";
    let vocabularyList = [];
    let level = "N5";

    // If lessonId provided, load lesson to get accurate target sentence & vocab
    if (lessonId && mongoose.Types.ObjectId.isValid(lessonId)) {
      const lesson = await Lesson.findById(lessonId);
      if (lesson) {
        targetSentence = targetSentence || lesson.sampleSentence || (lesson.dialogues?.[0]?.japanese) || "";
        vocabularyList = lesson.vocabularyList || [];
        level = lesson.level || "N5";
      }
    }

    // Step A: Upload audio if audio buffer is provided
    let audioUrl = "";
    if (fileBuffer) {
      audioUrl = await StorageService.uploadAudio(fileBuffer, originalName, mimeType, userId);
    }

    // Step B: Speech-to-Text
    // Ưu tiên 1: Dùng trực tiếp transcript từ Web Speech API trên trình duyệt (Tiết kiệm 100% chi phí STT)
    // Ưu tiên 2: Gọi STT Cloud (Google Cloud / OpenAI Whisper / Azure) nếu có file audio
    let transcript = clientTranscript ? clientTranscript.trim() : "";
    if (!transcript && fileBuffer) {
      transcript = await AiService.speechToText(fileBuffer, mimeType, targetSentence);
    }
    if (!transcript) {
      transcript = targetSentence || "こんにちは";
    }

    // Step C: LLM Multi-Criteria Assessment (OpenAI / Claude)
    const evaluation = await AiService.evaluateSpeechReflex({
      transcript,
      expectedSentence: targetSentence,
      vocabularyList,
      level,
    });

    return {
      audioUrl,
      transcript,
      targetSentence,
      scores: evaluation.scores,
      overallScore: evaluation.overallScore,
      wordFeedback: evaluation.wordFeedback,
      feedback: evaluation.feedback,
    };
  }

  /**
   * 2. Save Practice Result: Saves to practices collection, updates studylogs and updates streak in users
   */
  static async savePractice({
    userId,
    lessonId,
    sampleSentence,
    transcript,
    scores,
    overallScore,
    wordFeedback,
    feedback,
    durationSeconds = 15,
    audioUrl = "",
  }) {
    if (!lessonId || !mongoose.Types.ObjectId.isValid(lessonId)) {
      const error = new Error("lessonId không hợp lệ hoặc bị thiếu.");
      error.statusCode = 400;
      throw error;
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      const error = new Error("Không tìm thấy bài học tương ứng.");
      error.statusCode = 404;
      throw error;
    }

    const calculatedOverall =
      overallScore !== undefined
        ? overallScore
        : scores
        ? Math.round(
            (scores.pronunciation || 0) * 0.3 +
              (scores.accuracy || 0) * 0.3 +
              (scores.fluency || 0) * 0.2 +
              (scores.completeness || 0) * 0.2
          )
        : 80;

    // 1. Lưu kết quả vào collection practices
    const practice = await Practice.create({
      userId,
      lessonId,
      sampleSentence: sampleSentence || lesson.sampleSentence || "",
      durationSeconds,
      audioUrl,
      transcript: transcript || "",
      status: "completed",
      score: calculatedOverall,
      overallScore: calculatedOverall,
      scores: scores || {
        pronunciation: calculatedOverall,
        accuracy: calculatedOverall,
        fluency: calculatedOverall,
        completeness: calculatedOverall,
      },
      wordFeedback: wordFeedback || [],
      feedback: feedback || {},
      completedAt: new Date(),
    });

    // 2. Ghi nhận/cộng dồn nhật ký học tập ngày hôm nay vào collection studylogs
    const minutesSpent = Math.max(1, Math.ceil(durationSeconds / 60));
    const xpEarned = Math.max(10, Math.round(calculatedOverall / 5)); // 10-20 XP per session

    await StudyLogService.recordStudyProgress({
      userId,
      minutesSpent,
      practiceCount: 1,
      xpEarned,
      lessonsCompleted: 1,
    });

    // 3. Tính toán và cộng dồn Streak trong collection users
    const user = await User.findById(userId);
    let streakResult = { newStreak: 1, newLongestStreak: 1, isStreakIncremented: false };

    if (user) {
      const currentStreak = user.gamification?.streak || 0;
      const currentLongest = user.gamification?.longestStreak || 0;
      const lastActive = user.gamification?.lastActiveDate;

      streakResult = calculateNewStreak(lastActive, currentStreak, currentLongest);

      user.gamification = {
        ...user.gamification,
        streak: streakResult.newStreak,
        longestStreak: streakResult.newLongestStreak,
        lastActiveDate: new Date(),
        totalXp: (user.gamification?.totalXp || 0) + xpEarned,
      };

      await user.save();
    }

    const populatedPractice = await Practice.findById(practice._id).populate(
      "lessonId",
      "title sampleSentence translation level duration"
    );

    return {
      practice: populatedPractice,
      gamification: {
        streak: streakResult.newStreak,
        longestStreak: streakResult.newLongestStreak,
        xpEarned,
        isStreakIncremented: streakResult.isStreakIncremented,
      },
    };
  }

  /**
   * 3. Get user practice history (paginated)
   */
  static async getHistory(userId, { page = 1, limit = 10 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [practices, total] = await Promise.all([
      Practice.find({ userId })
        .populate("lessonId", "title sampleSentence translation level duration")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Practice.countDocuments({ userId }),
    ]);

    return {
      practices,
      total,
      page: pageNum,
      limit: limitNum,
    };
  }

  /**
   * 4. Get practice detail by ID
   */
  static async getById(practiceId, userId) {
    if (!mongoose.Types.ObjectId.isValid(practiceId)) {
      const error = new Error("Practice ID không hợp lệ.");
      error.statusCode = 400;
      throw error;
    }

    const practice = await Practice.findOne({ _id: practiceId, userId }).populate(
      "lessonId",
      "title sampleSentence translation level duration dialogues vocabularyList"
    );

    if (!practice) {
      const error = new Error("Không tìm thấy bài luyện tập.");
      error.statusCode = 404;
      throw error;
    }

    return practice;
  }
}

export default PracticeService;
