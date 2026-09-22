import express from "express";
import {
  getTopics,
  getTopicById,
  getTopicLessons,
  createTopic,
  updateTopic,
  deleteTopic,
} from "../controllers/topic.controller.js";
import { protectedRoute, optionalAuth } from "../middleware/auth.middleware.js";
import { checkTopicPremiumAccess } from "../middleware/premium.middleware.js";

const router = express.Router();

// GET /api/v1/topics: Lấy danh sách chủ đề
router.get("/", getTopics);

// GET /api/v1/topics/:id: Lấy chi tiết chủ đề (kiểm tra quyền nếu chủ đề Premium)
router.get("/:id", optionalAuth, checkTopicPremiumAccess, getTopicById);

// GET /api/v1/topics/:id/lessons: Lấy danh sách bài học thuộc topic
router.get("/:id/lessons", getTopicLessons);

// Admin write operations
router.post("/", protectedRoute, createTopic);
router.patch("/:id", protectedRoute, updateTopic);
router.delete("/:id", protectedRoute, deleteTopic);

export default router;
