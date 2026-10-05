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

// -------------------------------------------------------------
// Public TTS Audio endpoints (Cho phép phát âm không cần chặn bởi token)
// -------------------------------------------------------------
/**
 * POST /api/v1/practices/text-to-speech
 * Tạo giọng phát âm tiếng Nhật từ văn bản (Microsoft Edge Neural TTS / Cloud Studio Audio)
 */
router.post("/text-to-speech", synthesizeVoice);

/**
 * POST /api/v1/practices/voicevox
 * Tương thích ngược Voicevox Engine (Tự động fallback sang Edge TTS trên Web Production)
 */
router.post("/voicevox", synthesizeVoicevox);

/**
 * GET /api/v1/practices/voicevox/status
 * Trạng thái Engine và danh sách nhân vật giọng đọc
 */
router.get("/voicevox/status", getVoicevoxStatus);

// -------------------------------------------------------------
// Protected practice endpoints (Yêu cầu đăng nhập & tính quota)
// -------------------------------------------------------------
router.use(protectedRoute);

/**
 * POST /api/v1/practices/process-voice
 * Chấm điểm phát âm tiếng Nhật 4 tiêu chí (Phát âm, Lưu loát, Ngữ pháp, Từ vựng)
 */
router.post("/process-voice", checkPracticeQuota, handleAudioUpload("audio"), processVoice);

/**
 * POST /api/v1/practices/roleplay-chat
 * Hội thoại tương tác trực tiếp với gia sư AI
 */
router.post("/roleplay-chat", aiRoleplayChat);

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
