import PaymentService from "../services/payment.service.js";
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
