import express from "express";
import {
  getMe,
  updateProfile,
  changePassword,
  getLeaderboard,
  claimQuest,
  buyStreakFreeze,
  claimPracticeBonus,
  completeOnboardingQuiz,
} from "../controllers/user.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// All user management routes require authenticated user
router.use(protectedRoute);

// GET /api/v1/users/leaderboard
router.get("/leaderboard", getLeaderboard);

// POST /api/v1/users/claim-quest
router.post("/claim-quest", claimQuest);

// POST /api/v1/users/buy-streak-freeze
router.post("/buy-streak-freeze", buyStreakFreeze);

// POST /api/v1/users/claim-practice-bonus
router.post("/claim-practice-bonus", claimPracticeBonus);

// POST /api/v1/users/onboarding-quiz
router.post("/onboarding-quiz", completeOnboardingQuiz);

// GET /api/v1/users/me (or /api/users/me)
router.get("/me", getMe);

// PATCH /api/v1/users/me
router.patch("/me", updateProfile);

// PATCH & POST /api/v1/users/change-password
router.patch("/change-password", changePassword);
router.post("/change-password", changePassword);

export default router;
