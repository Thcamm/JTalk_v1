import express from "express";
import {
  createTopic,
  deleteTopic,
  getTopicById,
  getTopics,
  updateTopic,
} from "../controllers/topic.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getTopics);
router.get("/:id", getTopicById);

// Protected write operations
router.post("/", protectedRoute, createTopic);
router.patch("/:id", protectedRoute, updateTopic);
router.delete("/:id", protectedRoute, deleteTopic);

export default router;
