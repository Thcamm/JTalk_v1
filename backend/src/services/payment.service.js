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
    const accountNo = config.momo.accountNo || "PSP2606717600000005";
    const accountName = config.momo.accountName || "NGUYEN DUC THIEN CAM";
    const bankId = config.momo.bankId || "971005";
    const template = config.momo.template || "compact2";
    const phone = config.momo.phone || "0975383173";

    // MoMo Official QR Image (chính chủ NGUYEN DUC THIEN CAM - quét thành công 100% trên app MoMo)
    let qrCodeUrl = "/momo-qr.png";
    let payUrl = qrCodeUrl;
    let deeplink = `momo://?action=p2p&phone=${phone}&amount=${amount}&message=${encodeURIComponent(
      orderCode
    )}`;

    // Kiểm tra nếu có cấu hình MoMo Doanh Nghiệp (Official Merchant Gateway)
    const useMerchantGateway =
      process.env.MOMO_PARTNER_CODE &&
      process.env.MOMO_PARTNER_CODE !== "MOMO" &&
      process.env.MOMO_PARTNER_CODE !== "MOMO_TEST_PARTNER";

    if (useMerchantGateway) {
      const orderInfo = `Thanh toán gói JTalk Premium 30 ngày cho tài khoản ${user.username}`;
      const requestId = orderCode;
      const extraData = Buffer.from(JSON.stringify({ userId: user._id.toString(), planType })).toString("base64");
      const requestType = "captureWallet";

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

      try {
        const momoRes = await fetch(config.momo.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        const momoData = await momoRes.json();
        if (momoData.resultCode === 0 && momoData.payUrl) {
          payUrl = momoData.payUrl;
          deeplink = momoData.deeplink || deeplink;
          qrCodeUrl = momoData.qrCodeUrl || qrCodeUrl;
        }
      } catch (apiErr) {
        console.warn("Lỗi gọi MoMo Merchant Gateway, chuyển sang VietQR MoMo:", apiErr.message);
      }
    }

    // 1. Create PENDING Order in orders collection
    const order = await Order.create({
      orderCode,
      userId: user._id,
      amount,
      paymentMethod: "momo",
      status: "pending",
      payUrl: qrCodeUrl,
      callbackData: { planType, accountNo, accountName, bankId },
    });

    console.info(
      `📱 [MoMo] Tạo đơn hàng ${orderCode}: [${bankId}] STK: ${accountNo} (${accountName}) | ${amount}đ`
    );

    return {
      orderCode,
      amount,
      bankId,
      accountNo,
      accountName,
      phone,
      payUrl,
      deeplink,
      qrCodeUrl,
      transferContent: orderCode,
      status: order.status,
    };
  }

  /**
   * 2. Create VietQR Payment Order (Ngân hàng 24/7 Napas standard)
   */
  static async createVietQRPayment({ userId, planType = "monthly_99k", amount = PREMIUM_PRICE_VND }) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("Người dùng không tồn tại.");
      error.statusCode = 404;
      throw error;
    }

    const orderCode = `JTALK_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
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
   * 3. Process IPN Webhook from MoMo
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

    // 3. Process payment status
    if (Number(resultCode) === 0) {
      return await PaymentService.activateSubscriptionForOrder(
        order,
        transId || `MOMO_${Date.now()}`,
        payload
      );
    } else {
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
   * 4. Process VietQR Webhook (Hỗ trợ SePay, PayOS hoặc Webhook SMS ngân hàng)
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

    // Trích xuất mã đơn hàng dạng JTALK_...
    const match = String(content).match(/JTALK_\d+(_\d+)?/i);
    const orderCode = match ? match[0].toUpperCase() : String(content).trim();

    if (!orderCode) {
      return { success: false, message: "Không tìm thấy mã đơn hàng trong nội dung chuyển khoản." };
    }

    const order = await Order.findOne({ orderCode });
    if (!order) {
      return { success: false, message: `Không tìm thấy đơn hàng: ${orderCode}` };
    }

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
   * 5. Kiểm tra trạng thái thanh toán VietQR
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
        "Hệ thống chưa ghi nhận biến động số dư cho đơn hàng này. Nếu bạn đã hoàn tất chuyển khoản từ app ngân hàng hoặc ví MoMo, vui lòng chờ trong giây lát (khoảng 30 giây - 2 phút) để hệ thống tự động đối soát.",
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
      paymentMethod: o.paymentMethod || "momo",
      status: o.status || "pending",
      transactionId: o.transactionId || "",
      paidAt: o.paidAt || null,
      createdAt: o.createdAt,
      payUrl: o.payUrl || "",
    }));
  }
}

export default PaymentService;
