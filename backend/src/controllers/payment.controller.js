import PaymentService from "../services/payment.service.js";
import config from "../config/index.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

/**
 * POST /api/v1/payments/momo/create
 * Creates MoMo payment order for 99.000 VNĐ Premium subscription
 */
export const createMoMoPayment = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { planType, amount } = req.body;

    const paymentResult = await PaymentService.createMoMoPayment({
      userId,
      planType: planType || "monthly_99k",
      amount: amount || 99000,
    });

    return successResponse(
      res,
      paymentResult,
      "Tạo yêu cầu thanh toán MoMo thành công!",
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/payments/vietqr/create
 * Creates VietQR payment order for 99.000 VNĐ Premium subscription
 */
export const createVietQRPayment = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { planType, amount } = req.body;

    const paymentResult = await PaymentService.createVietQRPayment({
      userId,
      planType: planType || "monthly_99k",
      amount: amount || 99000,
    });

    return successResponse(
      res,
      paymentResult,
      "Tạo mã thanh toán VietQR thành công!",
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/payments/vietqr/webhook
 * Receives Webhook notification from SePay, PayOS, or Banking SMS forwarder
 */
export const handleVietQRWebhook = async (req, res, next) => {
  try {
    const configuredApiKey = config.vietqr?.webhookApiKey;
    if (configuredApiKey) {
      const authHeader = req.headers["authorization"] || req.headers["x-api-key"] || "";
      const token = authHeader.replace(/^Apikey\s+/i, "").replace(/^Bearer\s+/i, "").trim();
      if (token && token !== configuredApiKey) {
        console.warn("VietQR Webhook bị từ chối: API Key không khớp");
        return res.status(401).json({
          success: false,
          message: "API Key không hợp lệ",
        });
      }
    }

    console.info("Nhận VietQR Webhook notification:", req.body);
    const result = await PaymentService.processVietQRWebhook(req.body);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Lỗi xử lý VietQR Webhook:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi xử lý Webhook VietQR",
    });
  }
};

/**
 * POST /api/v1/payments/vietqr/confirm
 * Manual / test confirmation of VietQR payment
 */
export const confirmVietQRPayment = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { orderCode } = req.body;

    if (!orderCode) {
      return errorResponse(res, "Vui lòng cung cấp mã đơn hàng", 400);
    }

    const result = await PaymentService.confirmVietQRPayment(orderCode, userId);

    return successResponse(res, result, "Xác nhận thanh toán thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/payments/momo/webhook (IPN)
 * Receives Instant Payment Notification (IPN) callback from MoMo
 */
export const handleMoMoWebhook = async (req, res, next) => {
  try {
    console.info("Nhận MoMo Webhook IPN:", req.body);
    const result = await PaymentService.processMoMoWebhook(req.body);

    // MoMo expects standard HTTP 200 or 204 with JSON status
    return res.status(200).json(result);
  } catch (error) {
    console.error("Lỗi xử lý MoMo Webhook:", error.message);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Lỗi xử lý IPN MoMo",
      resultCode: error.statusCode || 500,
    });
  }
};

/**
 * GET /api/v1/payments/order/:orderCode
 * Check order status
 */
export const getOrderStatus = async (req, res, next) => {
  try {
    const { orderCode } = req.params;
    const userId = req.user._id;

    const order = await PaymentService.getOrderStatus(orderCode, userId);

    return successResponse(res, order, "Lấy thông tin đơn hàng thành công");
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/payments/my-orders
 * Get list of orders for the logged-in user
 */
export const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const orders = await PaymentService.getUserOrders(userId);

    return successResponse(res, orders, "Lấy lịch sử thanh toán thành công!");
  } catch (error) {
    next(error);
  }
};
