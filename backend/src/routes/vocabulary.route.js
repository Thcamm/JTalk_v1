import express from "express";
import {
  getVocabularies,
  createVocabulary,
  toggleMastered,
  deleteVocabulary,
  reviewSRS,
  getDueReviewCount,
} from "../controllers/vocabulary.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectedRoute);

router.get("/", getVocabularies);
router.get("/due-count", getDueReviewCount);
router.post("/", createVocabulary);
router.post("/:id/srs-review", reviewSRS);
router.patch("/:id/mastered", toggleMastered);
router.delete("/:id", deleteVocabulary);

export default router;
