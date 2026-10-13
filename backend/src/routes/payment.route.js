import express from "express";
import {
  createVietQRPayment,
  handleVietQRWebhook,
  confirmVietQRPayment,
  getOrderStatus,
  getMyOrders,
} from "../controllers/payment.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// 1. Webhook Callbacks (Public endpoints for SePay & VietQR)
router.post("/vietqr/webhook", handleVietQRWebhook);
router.post("/sepay/webhook", handleVietQRWebhook); // SePay Webhook endpoint

// 2. Create VietQR Payment (Authenticated user)
router.post("/vietqr/create", protectedRoute, createVietQRPayment);

// 3. Confirm payment status (Authenticated user)
router.post("/vietqr/confirm", protectedRoute, confirmVietQRPayment);

// 4. User payment history (Authenticated user)
router.get("/my-orders", protectedRoute, getMyOrders);

// 5. Check order payment status (Authenticated user)
router.get("/order/:orderCode", protectedRoute, getOrderStatus);

export default router;
