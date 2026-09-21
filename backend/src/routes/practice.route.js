import express from "express";
import {
  createPractice,
  deletePractice,
  getPracticeById,
  getPractices,
  updatePractice,
} from "../controllers/practice.controller.js";

const router = express.Router();

router.post("/", createPractice);
router.get("/", getPractices);
router.get("/:id", getPracticeById);
router.patch("/:id", updatePractice);
router.delete("/:id", deletePractice);

export default router;
