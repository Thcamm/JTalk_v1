import Order from "../models/Order.js";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import config from "../config/index.js";

const PREMIUM_PRICE_VND = 99000;
const SUBSCRIPTION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export class PaymentService {
  /**
   * 1. Create VietQR Payment Order (Ngân hàng 24/7 Napas standard qua SePay)
   */
  static async createVietQRPayment({ userId, planType = "monthly_99k", amount = PREMIUM_PRICE_VND }) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("Người dùng không tồn tại.");
      error.statusCode = 404;
      throw error;
    }

    if (user.role === "admin") {
      const error = new Error("Tài khoản Quản trị viên (Admin) đã sở hữu toàn bộ đặc quyền VIP vĩnh viễn.");
      error.statusCode = 400;
      throw error;
    }

    // Kiểm tra thời hạn gói: Chỉ cho phép đăng ký / gia hạn khi gói đã hết hạn hoặc còn <= 3 ngày
    if (user.subscription?.tier === "premium" && user.subscription?.expiresAt) {
      const diffMs = new Date(user.subscription.expiresAt).getTime() - Date.now();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (daysRemaining > 3) {
        const expiryFormatted = new Date(user.subscription.expiresAt).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        const error = new Error(
          `Gói Premium của bạn đang có hiệu lực đến ngày ${expiryFormatted} (còn ${daysRemaining} ngày sử dụng). Bạn có thể gia hạn khi gói còn dưới 3 ngày.`
        );
        error.statusCode = 400;
        throw error;
      }
    }

    // Generate unique order code (không dùng dấu gạch dưới để tránh bị ngân hàng/MoMo lọc bỏ khi chuyển khoản)
    const orderCode = `JTALK${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
    const bankId = config.vietqr.bankId;
    const accountNo = config.vietqr.accountNo;
    const accountName = config.vietqr.accountName;
    const template = config.vietqr.template;

    // Standard VietQR Image Generator API (Napas 247)
    const qrCodeUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amount}&addInfo=${encodeURIComponent(
      orderCode
    )}&accountName=${encodeURIComponent(accountName)}`;

    console.info(
      `🏦 [VietQR] Tạo đơn hàng ${orderCode}: Ngân hàng ${bankId} | STK: ${accountNo} | Tên: ${accountName} | ${amount}đ`
    );

    const order = await Order.create({
      orderCode,
      userId: user._id,
      amount,
      paymentMethod: "vietqr",
      status: "pending",
      payUrl: qrCodeUrl,
      callbackData: { planType },
    });

    return {
      orderCode,
      amount,
      bankId,
      accountNo,
      accountName,
      qrCodeUrl,
      payUrl: qrCodeUrl,
      transferContent: orderCode,
      status: order.status,
    };
  }

  /**
   * Helper: Activate 30-day Premium Subscription for a paid order
   */
  static async activateSubscriptionForOrder(order, transactionId, rawData = {}) {
    if (order.status === "completed" || order.status === "SUCCESS") {
      return {
        message: "Đơn hàng đã được ghi nhận thành công trước đó.",
        resultCode: 0,
        orderCode: order.orderCode,
      };
    }

    order.status = "completed";
    order.transactionId = transactionId || `TX_${Date.now()}`;
    order.paidAt = new Date();
    order.callbackData = rawData;
    await order.save();

    const userId = order.userId;
    const now = new Date();

    const existingSub = await Subscription.findOne({
      userId,
      status: { $in: ["active", "ACTIVE"] },
      endDate: { $gt: now },
    }).sort({ endDate: -1 });

    let targetSub;
    if (existingSub) {
      const newEndDate = new Date(existingSub.endDate.getTime() + SUBSCRIPTION_DURATION_MS);
      existingSub.endDate = newEndDate;
      existingSub.status = "active";
      await existingSub.save();
      targetSub = existingSub;
    } else {
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
  }

  /**
   * 2. Process VietQR Webhook (Hỗ trợ SePay, PayOS hoặc Webhook SMS ngân hàng)
   */
  static async processVietQRWebhook(payload) {
    const content =
      payload.content ||
      payload.orderCode ||
      payload.addInfo ||
      payload.description ||
      payload.data?.description ||
      payload.data?.orderCode ||
      "";

    console.info("🔍 [VietQR Webhook] Phân tích nội dung chuyển khoản:", content);

    // 1. Trích xuất mã đơn hàng có tiền tố JTALK (hỗ trợ có hoặc không có dấu gạch dưới / khoảng trắng)
    const match = String(content).match(/JTALK[_\s-]?\d+([_\s-]?\d+)?/i);
    const rawMatchedCode = match ? match[0].toUpperCase() : "";

    let order = null;

    // A. Thử tìm chính xác theo mã trích xuất trực tiếp
    if (rawMatchedCode) {
      order = await Order.findOne({ orderCode: rawMatchedCode });
    }

    // B. Đối soát thông minh: Khi ngân hàng / MoMo tự động lọc bỏ dấu gạch dưới (VD: JTALK_179190... -> JTALK179190...)
    if (!order) {
      const numberMatch = String(content).match(/JTALK[_\s-]*([0-9\s_-]+)/i);
      if (numberMatch) {
        const cleanContentDigits = numberMatch[1].replace(/[^0-9]/g, "");
        if (cleanContentDigits) {
          // Tìm trong các đơn hàng pending gần nhất (trong 48 giờ qua)
          const candidateOrders = await Order.find({
            status: "pending",
            createdAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
          }).sort({ createdAt: -1 });

          order = candidateOrders.find((o) => {
            const dbDigits = String(o.orderCode || "").replace(/[^0-9]/g, "");
            return (
              dbDigits &&
              (dbDigits === cleanContentDigits ||
                cleanContentDigits.includes(dbDigits) ||
                dbDigits.includes(cleanContentDigits))
            );
          });

          // Nếu vẫn chưa thấy, mở rộng tìm kiếm tất cả các đơn JTALK gần đây
          if (!order) {
            const allCandidateOrders = await Order.find({
              orderCode: /^JTALK/i,
            })
              .sort({ createdAt: -1 })
              .limit(100);

            order = allCandidateOrders.find((o) => {
              const dbDigits = String(o.orderCode || "").replace(/[^0-9]/g, "");
              return (
                dbDigits &&
                (dbDigits === cleanContentDigits ||
                  cleanContentDigits.includes(dbDigits) ||
                  dbDigits.includes(cleanContentDigits))
              );
            });
          }
        }
      }
    }

    // C. Thử tìm chính xác theo toàn bộ nội dung nếu không có tiền tố JTALK
    if (!order && content) {
      order = await Order.findOne({ orderCode: String(content).trim() });
    }

    if (!order) {
      console.warn("⚠️ [VietQR Webhook] Không tìm thấy đơn hàng cho nội dung:", content);
      return {
        success: false,
        message: `Không tìm thấy đơn hàng tương ứng với nội dung chuyển khoản: "${content}"`,
      };
    }

    console.info(`✅ [VietQR Webhook] Đã khớp thành công đơn hàng: ${order.orderCode} (ID: ${order._id})`);

    // Kiểm tra số tiền chuyển khoản nếu webhook có dữ liệu amount
    const incomingAmount = Number(
      payload.amount ||
      payload.transferAmount ||
      payload.data?.amount ||
      0
    );
    if (incomingAmount > 0 && incomingAmount < (order.amount || PREMIUM_PRICE_VND)) {
      return {
        success: false,
        message: `Số tiền chuyển khoản (${incomingAmount}đ) không đủ so với giá trị đơn hàng (${order.amount || PREMIUM_PRICE_VND}đ).`,
      };
    }

    const transId = payload.id || payload.referenceCode || payload.data?.paymentLinkId || `VQR_${Date.now()}`;
    const result = await PaymentService.activateSubscriptionForOrder(order, transId, payload);

    return {
      success: true,
      resultCode: 0,
      ...result,
    };
  }

  /**
   * 3. Kiểm tra trạng thái thanh toán VietQR
   * BẢO MẬT: Tuyệt đối KHÔNG tự ý kích hoạt gói Premium chỉ dựa trên click từ phía client.
   * Chỉ kích hoạt khi:
   *  - Đã có Webhook ngân hàng (SePay, PayOS hoặc SMS forwarder) xác nhận biến động số dư thực tế.
   *  - Hoặc Quản trị viên (Admin) chủ động xác nhận thủ công (forceApprove = true).
   */
  static async confirmVietQRPayment(orderCode, userId, options = {}) {
    const order = await Order.findOne({ orderCode, userId });
    if (!order) {
      const error = new Error("Không tìm thấy đơn hàng.");
      error.statusCode = 404;
      throw error;
    }

    // 1. Đơn hàng đã hoàn tất trước đó qua Webhook ngân hàng
    if (order.status === "completed" || order.status === "SUCCESS") {
      return {
        success: true,
        status: "completed",
        message: "Đơn hàng đã được xác nhận thanh toán thành công!",
        orderCode: order.orderCode,
        paidAt: order.paidAt,
      };
    }

    // 2. Quản trị viên (Admin) chủ động duyệt thủ công
    if (options.isAdmin && options.forceApprove) {
      const transId = `ADMIN_FORCE_${Date.now()}`;
      const activation = await PaymentService.activateSubscriptionForOrder(order, transId, {
        approvedBy: userId,
        approvedAt: new Date(),
        reason: "Admin manual verification",
      });

      return {
        success: true,
        status: "completed",
        message: "Quản trị viên đã xác nhận đơn hàng thành công!",
        orderCode: order.orderCode,
        ...activation,
      };
    }

    // 3. Chưa nhận được giao dịch từ ngân hàng -> KHÔNG cấp quyền Premium
    return {
      success: false,
      status: "pending",
      message:
        "Hệ thống chưa ghi nhận biến động số dư cho đơn hàng này. Nếu bạn đã hoàn tất chuyển khoản từ app ngân hàng hoặc ví điện tử, vui lòng chờ trong giây lát (khoảng 30 giây - 2 phút) để hệ thống tự động đối soát.",
      orderCode: order.orderCode,
    };
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

  /**
   * 4. Get list of orders for a user (Payment History)
   */
  static async getUserOrders(userId) {
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return orders.map((o) => ({
      _id: o._id,
      orderCode: o.orderCode,
      amount: o.amount || 99000,
      paymentMethod: o.paymentMethod || "vietqr",
      status: o.status || "pending",
      transactionId: o.transactionId || "",
      paidAt: o.paidAt || null,
      createdAt: o.createdAt,
      payUrl: o.payUrl || "",
    }));
  }
}

export default PaymentService;
