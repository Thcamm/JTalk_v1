import express from "express";
import {
  getStats,
  getUsers,
  updateUserRole,
  updateUserSubscription,
  deleteUser,
  getAdminLessons,
  getAdminCourses,
  createAdminCourse,
  updateAdminCourse,
  deleteAdminCourse,
  getAdminTopics,
  createAdminTopic,
  getYoutubeTranscript,
  enrichSubtitlesWithAi,
} from "../controllers/admin.controller.js";
import {
  createLesson,
  updateLesson,
  deleteLesson,
} from "../controllers/lesson.controller.js";
import { protectedRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Strict security: ALL admin endpoints require valid JWT AND admin role
router.use(protectedRoute, adminRoute);

// 1. Overview KPIs & Stats
router.get("/stats", getStats);

// 2. User Management
router.get("/users", getUsers);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/subscription", updateUserSubscription);
router.delete("/users/:id", deleteUser);

// 3. Lesson & Video Management & YouTube Transcript Extraction
router.get("/youtube/transcript", getYoutubeTranscript);
router.post("/subtitles/enrich", enrichSubtitlesWithAi);
router.get("/lessons", getAdminLessons);
router.post("/lessons", createLesson);
router.patch("/lessons/:id", updateLesson);
router.delete("/lessons/:id", deleteLesson);

// 4. Course Management
router.get("/courses", getAdminCourses);
router.post("/courses", createAdminCourse);
router.patch("/courses/:id", updateAdminCourse);
router.delete("/courses/:id", deleteAdminCourse);

// 5. Topic Management
router.get("/topics", getAdminTopics);
router.post("/topics", createAdminTopic);

export default router;
