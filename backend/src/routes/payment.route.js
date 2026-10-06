import express from "express";
import {
  createMoMoPayment,
  handleMoMoWebhook,
  createVietQRPayment,
  handleVietQRWebhook,
  confirmVietQRPayment,
  getOrderStatus,
  getMyOrders,
} from "../controllers/payment.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// 1. Webhook Callbacks (Public endpoints)
router.post("/momo/webhook", handleMoMoWebhook);
router.post("/vietqr/webhook", handleVietQRWebhook);
router.post("/sepay/webhook", handleVietQRWebhook); // Alias for SePay webhook compatibility

// 2. Create Payment (Authenticated user)
router.post("/momo/create", protectedRoute, createMoMoPayment);
router.post("/vietqr/create", protectedRoute, createVietQRPayment);

// 3. Confirm VietQR payment (Authenticated user)
router.post("/vietqr/confirm", protectedRoute, confirmVietQRPayment);

// 4. User payment history (Authenticated user)
router.get("/my-orders", protectedRoute, getMyOrders);

// 5. Check order payment status (Authenticated user)
router.get("/order/:orderCode", protectedRoute, getOrderStatus);

export default router;
