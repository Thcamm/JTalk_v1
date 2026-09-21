import PracticeService from "../services/practice.service.js";
import AiService from "../services/ai.service.js";
import Practice from "../models/Practice.js";
import { successResponse, errorResponse, paginatedResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";

/**
 * POST /api/v1/practices/process-voice
 * Receives audio file, uploads to cloud storage, calls STT & LLM 4-criteria assessment
 */
export const processVoice = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { lessonId, sampleSentence, transcript: clientTranscript } = req.body;

    let fileBuffer = null;
    let mimeType = "audio/wav";
    let originalName = "recording.wav";

    // Case 1: Audio uploaded as multipart file
    if (req.file) {
      fileBuffer = req.file.buffer;
      mimeType = req.file.mimetype;
      originalName = req.file.originalname;
    }
    // Case 2: Audio sent as base64 string
    else if (req.body.audioBase64) {
      const base64Data = req.body.audioBase64.replace(/^data:audio\/\w+;base64,/, "");
      fileBuffer = Buffer.from(base64Data, "base64");
      mimeType = req.body.mimeType || "audio/wav";
      originalName = `recording_${Date.now()}.wav`;
    }
    // Case 3: Nhận diện giọng nói trực tiếp từ Web Speech API trên trình duyệt
    else if (!clientTranscript) {
      return errorResponse(
        res,
        "Vui lòng tải lên file ghi âm (.mp3, .wav), chuỗi audioBase64 hoặc kết quả nhận diện (transcript) từ Web Speech API.",
        400
      );
    }

    const result = await PracticeService.processVoice({
      userId,
      lessonId,
      fileBuffer,
      originalName,
      mimeType,
      sampleSentence,
      transcript: clientTranscript,
    });

    return successResponse(res, result, "Chấm điểm phản xạ giọng nói hoàn tất!");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/practices/text-to-speech
 * Generates native Japanese audio using Google Cloud Text-to-Speech
 */
export const synthesizeVoice = async (req, res, next) => {
  try {
    const { text, voiceName, gender } = req.body;
    if (!text) {
      return errorResponse(res, "Vui lòng cung cấp văn bản tiếng Nhật (text).", 400);
    }

    const result = await AiService.textToSpeechWithGoogle(text, voiceName, gender);

    return successResponse(res, result, "Tạo giọng phát âm tiếng Nhật thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/practices/save
 * Saves practice results, increments today's studylog, updates user streak
 */
export const savePractice = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      lessonId,
      sampleSentence,
      transcript,
      scores,
      overallScore,
      wordFeedback,
      feedback,
      durationSeconds,
      audioUrl,
    } = req.body;

    if (!lessonId) {
      return errorResponse(res, "Thiếu thông tin lessonId.", 400);
    }

    const savedResult = await PracticeService.savePractice({
      userId,
      lessonId,
      sampleSentence,
      transcript,
      scores,
      overallScore,
      wordFeedback,
      feedback,
      durationSeconds,
      audioUrl,
    });

    return res.status(201).json({
      success: true,
      message: "Lưu kết quả luyện tập thành công!",
      data: savedResult,
      practice: savedResult.practice, // Compatibility for frontend
      gamification: savedResult.gamification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/practices/history
 * Returns paginated practice history for the authenticated user
 */
export const getPracticeHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const { practices, total, page: currentPage, limit: currentLimit } =
      await PracticeService.getHistory(userId, { page, limit });

    return paginatedResponse(
      res,
      practices,
      total,
      currentPage,
      currentLimit,
      "Lấy lịch sử luyện tập thành công"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/practices (or /api/practices)
 * Default practice listing for the user (compatible with frontend)
 */
export const getPractices = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const practices = await Practice.find({ userId })
      .populate("lessonId", "title sampleSentence translation level duration")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: practices,
      practices, // For frontend compatibility (res.data.practices)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/practices/:id
 */
export const getPracticeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const practice = await PracticeService.getById(id, userId);

    return res.status(200).json({
      success: true,
      data: practice,
      practice, // For frontend compatibility
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/practices (Create initial practice session - compatibility)
 */
export const createPractice = async (req, res, next) => {
  try {
    const { lessonId, sampleSentence, audioUrl, transcript } = req.body;
    const userId = req.user._id;

    const saved = await PracticeService.savePractice({
      userId,
      lessonId,
      sampleSentence,
      transcript,
      audioUrl,
      durationSeconds: 10,
    });

    return res.status(201).json({
      success: true,
      practice: saved.practice,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/practices/:id
 */
export const updatePractice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, "Practice ID không hợp lệ.", 400);
    }

    const practice = await Practice.findOneAndUpdate(
      { _id: id, userId },
      { $set: req.body },
      { new: true }
    ).populate("lessonId", "title sampleSentence translation level duration");

    if (!practice) {
      return errorResponse(res, "Không tìm thấy bài luyện tập.", 404);
    }

    return res.status(200).json({
      success: true,
      practice,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/practices/:id
 */
export const deletePractice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, "Practice ID không hợp lệ.", 400);
    }

    const result = await Practice.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      return errorResponse(res, "Không tìm thấy bài luyện tập.", 404);
    }

    return successResponse(res, null, "Xoá bài luyện tập thành công!");
  } catch (error) {
    next(error);
  }
};
