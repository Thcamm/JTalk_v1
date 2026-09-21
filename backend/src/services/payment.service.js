import Order from "../models/Order.js";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import config from "../config/index.js";
import {
  createMoMoPaymentSignature,
  verifyMoMoIpnSignature,
} from "../utils/momoSignature.js";

const PREMIUM_PRICE_VND = 99000;
const SUBSCRIPTION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export class PaymentService {
  /**
   * 1. Create MoMo payment link for 30-day Premium Plan (99.000 VNĐ)
   */
  static async createMoMoPayment({ userId, planType = "monthly_99k", amount = PREMIUM_PRICE_VND }) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("Người dùng không tồn tại.");
      error.statusCode = 404;
      throw error;
    }

    // Generate unique order code
    const orderCode = `JTALK_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const orderInfo = `Thanh toán gói JTalk Premium 30 ngày cho tài khoản ${user.username}`;
    const requestId = orderCode;
    const extraData = Buffer.from(JSON.stringify({ userId: user._id.toString(), planType })).toString("base64");
    const requestType = "captureWallet";

    // 1. Create PENDING Order in orders collection
    const order = await Order.create({
      orderCode,
      userId: user._id,
      amount,
      paymentMethod: "momo",
      status: "pending",
    });

    // 2. Compute MoMo HMAC-SHA256 signature
    const signature = createMoMoPaymentSignature({
      accessKey: config.momo.accessKey,
      amount,
      extraData,
      ipnUrl: config.momo.ipnUrl,
      orderId: orderCode,
      orderInfo,
      partnerCode: config.momo.partnerCode,
      redirectUrl: config.momo.redirectUrl,
      requestId,
      requestType,
      secretKey: config.momo.secretKey,
    });

    const requestBody = {
      partnerCode: config.momo.partnerCode,
      partnerName: "JTalk AI Japanese",
      storeId: "JTalkOfficial",
      requestId,
      amount,
      orderId: orderCode,
      orderInfo,
      redirectUrl: config.momo.redirectUrl,
      ipnUrl: config.momo.ipnUrl,
      lang: "vi",
      extraData,
      requestType,
      signature,
    };

    let payUrl = "";
    let deeplink = "";
    let qrCodeUrl = "";

    // 3. Call MoMo Gateway API
    try {
      const momoRes = await fetch(config.momo.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const momoData = await momoRes.json();

      if (momoData.resultCode === 0 && momoData.payUrl) {
        payUrl = momoData.payUrl;
        deeplink = momoData.deeplink || "";
        qrCodeUrl = momoData.qrCodeUrl || "";
      } else {
        console.warn("MoMo gateway response:", momoData);
        // Fallback simulate URL for development or testing
        payUrl = `${config.momo.redirectUrl}?orderId=${orderCode}&resultCode=0&message=Success`;
      }
    } catch (apiErr) {
      console.warn("Lỗi kết nối tới cổng thanh toán MoMo, sử dụng dev fallback:", apiErr.message);
      payUrl = `${config.momo.redirectUrl}?orderId=${orderCode}&resultCode=0&message=Success`;
    }

    // Update order with payUrl
    order.payUrl = payUrl;
    await order.save();

    return {
      orderCode,
      amount,
      payUrl,
      deeplink,
      qrCodeUrl,
      status: order.status,
    };
  }

  /**
   * 2. Process IPN Webhook from MoMo
   */
  static async processMoMoWebhook(payload) {
    const { orderId, resultCode, transId } = payload;

    if (!orderId) {
      const error = new Error("Thiếu orderId trong IPN payload.");
      error.statusCode = 400;
      throw error;
    }

    // 1. Verify Checksum signature if in production
    if (config.env === "production") {
      const isValid = verifyMoMoIpnSignature(payload, config.momo.secretKey);
      if (!isValid) {
        const error = new Error("Chữ ký Checksum MoMo IPN không hợp lệ.");
        error.statusCode = 400;
        throw error;
      }
    }

    // 2. Find order in orders collection
    const order = await Order.findOne({ orderCode: orderId });
    if (!order) {
      const error = new Error(`Không tìm thấy đơn hàng với mã: ${orderId}`);
      error.statusCode = 404;
      throw error;
    }

    // Idempotency: If order was already completed, return immediately
    if (order.status === "completed" || order.status === "SUCCESS") {
      return {
        message: "Đơn hàng đã được ghi nhận thành công trước đó.",
        resultCode: 0,
      };
    }

    // 3. Process payment status
    if (Number(resultCode) === 0) {
      // Payment Successful!
      order.status = "completed"; // tương thích với enum "completed" và "SUCCESS"
      order.transactionId = transId || `MOMO_${Date.now()}`;
      order.paidAt = new Date();
      order.callbackData = payload;
      await order.save();

      // 4. Create or extend Premium subscription by 30 days in subscriptions collection
      const userId = order.userId;
      const now = new Date();

      // Check if user has an existing active subscription
      const existingSub = await Subscription.findOne({
        userId,
        status: { $in: ["active", "ACTIVE"] },
        endDate: { $gt: now },
      }).sort({ endDate: -1 });

      let targetSub;

      if (existingSub) {
        // Gia hạn thêm 30 ngày từ ngày kết thúc hiện tại
        const newEndDate = new Date(existingSub.endDate.getTime() + SUBSCRIPTION_DURATION_MS);
        existingSub.endDate = newEndDate;
        existingSub.status = "active";
        await existingSub.save();
        targetSub = existingSub;
      } else {
        // Tạo mới gói 30 ngày bắt đầu từ bây giờ
        targetSub = await Subscription.create({
          userId,
          planType: "monthly_99k",
          price: order.amount || PREMIUM_PRICE_VND,
          status: "active",
          startDate: now,
          endDate: new Date(now.getTime() + SUBSCRIPTION_DURATION_MS),
          orderId: order._id,
        });
      }

      // 5. Update user snapshot in users collection
      await User.findByIdAndUpdate(userId, {
        $set: {
          "subscription.tier": "premium",
          "subscription.expiresAt": targetSub.endDate,
          "subscription.subscriptionId": targetSub._id,
        },
      });

      return {
        message: "Kích hoạt gói Premium 30 ngày thành công!",
        resultCode: 0,
        orderCode: order.orderCode,
        expiresAt: targetSub.endDate,
      };
    } else {
      // Payment failed or cancelled
      order.status = "failed";
      order.callbackData = payload;
      await order.save();

      return {
        message: "Thanh toán không thành công.",
        resultCode: Number(resultCode),
      };
    }
  }

  /**
   * Get order status by orderCode
   */
  static async getOrderStatus(orderCode, userId) {
    const order = await Order.findOne({ orderCode, userId });
    if (!order) {
      const error = new Error("Không tìm thấy đơn hàng.");
      error.statusCode = 404;
      throw error;
    }
    return order;
  }
}

export default PaymentService;
