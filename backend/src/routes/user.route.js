import express from "express";
import { getMe, updateProfile } from "../controllers/user.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// All user management routes require authenticated user
router.use(protectedRoute);

// GET /api/v1/users/me (or /api/users/me)
router.get("/me", getMe);

// PATCH /api/v1/users/me
router.patch("/me", updateProfile);

export default router;
