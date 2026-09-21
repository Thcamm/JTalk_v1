import express from "express";
import {
  createMoMoPayment,
  handleMoMoWebhook,
  getOrderStatus,
} from "../controllers/payment.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// 1. IPN Webhook from MoMo Gateway (Public endpoint for MoMo server callbacks)
router.post("/momo/webhook", handleMoMoWebhook);

// 2. Create MoMo payment link (Authenticated user)
router.post("/momo/create", protectedRoute, createMoMoPayment);

// 3. Check order payment status (Authenticated user)
router.get("/order/:orderCode", protectedRoute, getOrderStatus);

export default router;
