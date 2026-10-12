import express from "express";
import {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  signUp,
  signIn,
  signOut,
  refreshToken,
} from "../controllers/auth.controller.js";

const router = express.Router();

// Production endpoints (/api/v1/auth)
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Backward-compatible aliases for existing client
router.post("/signup", signUp);
router.post("/signin", signIn);
router.post("/signout", signOut);

export default router;
