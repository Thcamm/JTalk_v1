import express from "express";
import {
  createLesson,
  deleteLesson,
  getLessonById,
  getLessons,
  updateLesson,
} from "../controllers/lesson.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getLessons);
router.get("/:id", getLessonById);

// Protected write operations
router.post("/", protectedRoute, createLesson);
router.patch("/:id", protectedRoute, updateLesson);
router.delete("/:id", protectedRoute, deleteLesson);

export default router;
