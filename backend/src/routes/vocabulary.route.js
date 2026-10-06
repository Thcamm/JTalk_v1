import express from "express";
import {
  getVocabularies,
  createVocabulary,
  toggleMastered,
  deleteVocabulary,
} from "../controllers/vocabulary.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectedRoute);

router.get("/", getVocabularies);
router.post("/", createVocabulary);
router.patch("/:id/mastered", toggleMastered);
router.delete("/:id", deleteVocabulary);

export default router;
