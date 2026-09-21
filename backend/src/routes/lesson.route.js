import express from "express";
import {
  getLessons,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
} from "../controllers/lesson.controller.js";
import { protectedRoute, optionalAuth } from "../middleware/auth.middleware.js";
import { checkLessonPremiumAccess } from "../middleware/premium.middleware.js";

const router = express.Router();

// GET /api/v1/lessons: Lấy danh sách bài học
router.get("/", getLessons);

// GET /api/v1/lessons/:id: Chi tiết bài học (Middleware kiểm tra quyền nếu bài/topic là Premium)
router.get("/:id", optionalAuth, checkLessonPremiumAccess, getLessonById);

// Admin write operations
router.post("/", protectedRoute, createLesson);
router.patch("/:id", protectedRoute, updateLesson);
router.delete("/:id", protectedRoute, deleteLesson);

export default router;
