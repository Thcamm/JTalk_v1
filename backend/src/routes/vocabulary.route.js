import express from "express";
import {
  getVocabularies,
  getSystemVocabularies,
  saveSystemVocabToNotebook,
  createVocabulary,
  toggleMastered,
  deleteVocabulary,
  reviewSRS,
  getDueReviewCount,
} from "../controllers/vocabulary.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectedRoute);

// System Master Bank endpoints for learners
router.get("/system", getSystemVocabularies);
router.post("/save-from-system", saveSystemVocabToNotebook);

// Personal Notebook endpoints
router.get("/", getVocabularies);
router.get("/due-count", getDueReviewCount);
router.post("/", createVocabulary);
router.post("/:id/srs-review", reviewSRS);
router.patch("/:id/mastered", toggleMastered);
router.delete("/:id", deleteVocabulary);

export default router;
