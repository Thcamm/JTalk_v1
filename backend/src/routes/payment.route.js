import express from "express";
import path from "path";
import fs from "fs";
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

// 0. Static QR code assets
router.get("/momo-qr.png", (req, res) => {
  const localFile = path.resolve(process.cwd(), "uploads", "momo-qr.png");
  if (fs.existsSync(localFile)) {
    return res.sendFile(localFile);
  }
  const frontendFile = path.resolve(process.cwd(), "..", "frontend", "public", "momo-qr.png");
  if (fs.existsSync(frontendFile)) {
    return res.sendFile(frontendFile);
  }
  return res.status(404).send("MoMo QR image not found");
});

// 1. Webhook Callbacks (Public endpoints)
router.post("/momo/webhook", handleMoMoWebhook);
router.post("/vietqr/webhook", handleVietQRWebhook);
router.post("/sepay/webhook", handleVietQRWebhook); // Alias for SePay webhook compatibility

// 2. Create Payment (Authenticated user)
router.post("/momo/create", protectedRoute, createMoMoPayment);
router.post("/vietqr/create", protectedRoute, createVietQRPayment);

// 3. Confirm payment status (Authenticated user)
router.post("/vietqr/confirm", protectedRoute, confirmVietQRPayment);
router.post("/momo/confirm", protectedRoute, confirmVietQRPayment);

// 4. User payment history (Authenticated user)
router.get("/my-orders", protectedRoute, getMyOrders);

// 5. Check order payment status (Authenticated user)
router.get("/order/:orderCode", protectedRoute, getOrderStatus);

export default router;
