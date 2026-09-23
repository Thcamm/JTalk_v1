import express from "express";
import {
  processVoice,
  savePractice,
  synthesizeVoice,
  getPracticeHistory,
  getPractices,
  getPracticeById,
  createPractice,
  updatePractice,
  deletePractice,
  aiRoleplayChat,
  synthesizeVoicevox,
  getVoicevoxStatus,
} from "../controllers/practice.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";
import { checkPracticeQuota } from "../middleware/quota.middleware.js";
import { handleAudioUpload } from "../middleware/upload.middleware.js";

const router = express.Router();

// All practice endpoints require authentication
router.use(protectedRoute);

/**
 * POST /api/v1/practices/process-voice
 * Middleware chain:
 * 1. protectedRoute (check token)
 * 2. checkPracticeQuota (verify Free <= 2/day or Premium unlimited)
 * 3. handleAudioUpload("audio") (parse audio file via multer)
 * 4. processVoice (Upload cloud -> STT Azure/Whisper -> LLM 4 criteria assessment)
 */
router.post("/process-voice", checkPracticeQuota, handleAudioUpload("audio"), processVoice);

/**
 * POST /api/v1/practices/roleplay-chat
 * Real-time freeform roleplay conversational AI partner
 */
router.post("/roleplay-chat", aiRoleplayChat);

/**
 * POST /api/v1/practices/text-to-speech
 * Tạo giọng phát âm tiếng Nhật từ văn bản (Google Cloud TTS)
 */
router.post("/text-to-speech", synthesizeVoice);

/**
 * POST /api/v1/practices/voicevox
 * Tạo giọng phát âm chất lượng phòng thu từ Voicevox Engine (Mã nguồn mở AI Nhật Bản)
 */
router.post("/voicevox", synthesizeVoicevox);

/**
 * GET /api/v1/practices/voicevox/status
 * Kiểm tra trạng thái kết nối & danh sách nhân vật Voicevox (Shikoku Metan, Zundamon, Aoyama Ryusei)
 */
router.get("/voicevox/status", getVoicevoxStatus);

/**
 * POST /api/v1/practices/save
 * Lưu kết quả vào `practices`, cập nhật `studylogs` hôm nay & cộng dồn streak trong `users`
 */
router.post("/save", savePractice);

/**
 * GET /api/v1/practices/history
 * Lấy lịch sử luyện tập phân trang
 */
router.get("/history", getPracticeHistory);

// Standard CRUD endpoints
router.get("/", getPractices);
router.get("/:id", getPracticeById);
router.post("/", createPractice);
router.patch("/:id", updatePractice);
router.delete("/:id", deletePractice);

export default router;
