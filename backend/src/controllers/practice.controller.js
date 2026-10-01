import PracticeService from "../services/practice.service.js";
import AiService from "../services/ai.service.js";
import VoicevoxService from "../services/voicevox.service.js";
import EdgeTtsService, { EDGE_JAPANESE_VOICES } from "../services/edgeTts.service.js";
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
 * Generates natural Japanese studio audio using Microsoft Edge Neural TTS (with OpenAI/Google fallback)
 */
export const synthesizeVoice = async (req, res, next) => {
  try {
    const { text, voiceName, gender, rate, speedScale, pitchScale } = req.body;
    if (!text || !text.trim()) {
      return errorResponse(res, "Vui lòng cung cấp văn bản tiếng Nhật (text).", 400);
    }

    let selectedVoice = voiceName;
    if (!selectedVoice && gender) {
      selectedVoice = gender === "MALE" ? EDGE_JAPANESE_VOICES.KEITA : EDGE_JAPANESE_VOICES.NANAMI;
    }

    const result = await EdgeTtsService.synthesize({
      text,
      voice: selectedVoice,
      rate: rate || speedScale || 0.95,
      pitch: pitchScale || 0,
    });

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
      quota: savedResult.quota,
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

/**
 * POST /api/v1/practices/roleplay-chat
 * Real-time freeform conversation turn with AI
 */
export const aiRoleplayChat = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { lessonId, scenarioTitle, level, conversationHistory, userMessage } = req.body;

    const result = await PracticeService.handleRoleplayChat({
      userId,
      lessonId,
      scenarioTitle,
      level,
      conversationHistory,
      userMessage,
    });

    return successResponse(res, result, "Nhận phản hồi từ gia sư AI thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/practices/voicevox
 * Synthesizes studio-grade native Japanese audio via Voicevox Engine (Local)
 * with transparent auto-fallback to Microsoft Edge Neural TTS on Web Production.
 */
export const synthesizeVoicevox = async (req, res, next) => {
  try {
    const { text, speakerId, speedScale, pitchScale } = req.body;
    if (!text || !text.trim()) {
      return errorResponse(res, "Vui lòng cung cấp văn bản tiếng Nhật (text).", 400);
    }

    // 1. Try Voicevox Local Engine first (if developer is running desktop app)
    const result = await VoicevoxService.synthesize({
      text,
      speakerId: speakerId !== undefined && speakerId !== null ? parseInt(speakerId, 10) : undefined,
      speedScale: speedScale !== undefined ? parseFloat(speedScale) : 0.95,
      pitchScale: pitchScale !== undefined ? parseFloat(pitchScale) : 0.0,
    });

    if (result && result.audioContent) {
      return successResponse(res, result, "Tạo giọng phát âm Voicevox thành công!");
    }

    // 2. Seamless Cloud Production Fallback: Microsoft Edge Neural TTS
    // Automatically map legacy speakerId to studio-grade Japanese voice
    const edgeVoice = EdgeTtsService.mapVoicevoxSpeakerToEdge(speakerId);
    const edgeResult = await EdgeTtsService.synthesize({
      text,
      voice: edgeVoice,
      rate: speedScale !== undefined ? parseFloat(speedScale) : 0.95,
      pitch: pitchScale !== undefined ? parseFloat(pitchScale) : 0.0,
    });

    return successResponse(
      res,
      {
        ...edgeResult,
        speakerId: speakerId ?? 2,
        isFallback: true,
      },
      "Tạo giọng phát âm tiếng Nhật thành công (Microsoft Edge Neural Engine)!"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/practices/voicevox/status
 * Returns health status and available speakers of Voicevox & Edge TTS Engines
 */
export const getVoicevoxStatus = async (req, res, next) => {
  try {
    const health = await VoicevoxService.checkHealth();
    const voicevoxSpeakers = health.isOnline ? await VoicevoxService.getSpeakers() : [];

    const edgeSpeakers = [
      {
        name: "七海 (Nanami) - Chuẩn Tokyo (Khuyên dùng)",
        speaker_uuid: "edge-ja-jp-nanami",
        styles: [{ id: 2, name: "Giáo viên Nữ bản ngữ" }],
        voice: EDGE_JAPANESE_VOICES.NANAMI,
      },
      {
        name: "圭太 (Keita) - Chuẩn Tokyo",
        speaker_uuid: "edge-ja-jp-keita",
        styles: [{ id: 13, name: "Nam công sở & Hội thoại" }],
        voice: EDGE_JAPANESE_VOICES.KEITA,
      },
      {
        name: "葵 (Aoi) - Tự nhiên, dễ thương",
        speaker_uuid: "edge-ja-jp-aoi",
        styles: [{ id: 3, name: "Nữ trẻ trung" }],
        voice: EDGE_JAPANESE_VOICES.AOI,
      },
    ];

    return successResponse(
      res,
      {
        ...health,
        speakers: health.isOnline ? voicevoxSpeakers : edgeSpeakers,
        edgeSpeakers,
        edgeTtsActive: true,
      },
      "Kiểm tra trạng thái Voice TTS Engine hoàn tất!"
    );
  } catch (error) {
    next(error);
  }
};


