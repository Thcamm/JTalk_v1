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
  cleanDuplicateVideosHandler,
} from "../controllers/admin.controller.js";
import {
  importVocabulary,
  importVocabularyToLesson,
  getAdminVocabularies,
  createAdminVocabulary,
  updateAdminVocabulary,
  deleteAdminVocabulary,
  deleteAdminVocabularyBulk,
  enrichVocabularyWithAiHandler,
} from "../controllers/admin.vocabulary.controller.js";
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
router.post("/clean-duplicate-videos", cleanDuplicateVideosHandler);
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

// 6. Vocabulary & Master Bank Bulk Management
router.get("/vocabulary", getAdminVocabularies);
router.post("/vocabulary", createAdminVocabulary);
router.post("/vocabulary/ai-enrich", enrichVocabularyWithAiHandler);
router.post("/vocabulary/import", importVocabulary);
router.post("/vocabulary/import-to-lesson", importVocabularyToLesson);
router.delete("/vocabulary/bulk", deleteAdminVocabularyBulk);
router.patch("/vocabulary/:id", updateAdminVocabulary);
router.delete("/vocabulary/:id", deleteAdminVocabulary);

export default router;
