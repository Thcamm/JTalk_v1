import api from "@/services/api";

export interface CreateMoMoPaymentResponse {
  success: boolean;
  message?: string;
  order?: {
    _id: string;
    orderCode: string;
    amount: number;
    status: string;
  };
  payUrl?: string;
  qrCodeUrl?: string;
  deeplink?: string;
}

export interface CreateVietQRPaymentResponse {
  success: boolean;
  message?: string;
  orderCode?: string;
  amount?: number;
  bankId?: string;
  accountNo?: string;
  accountName?: string;
  qrCodeUrl?: string;
  payUrl?: string;
  transferContent?: string;
  status?: string;
}

export interface ConfirmVietQRPaymentResponse {
  success: boolean;
  message?: string;
  orderCode?: string;
}

export interface OrderStatusResponse {
  success: boolean;
  order: {
    _id: string;
    orderCode: string;
    amount: number;
    status: "pending" | "completed" | "failed" | "cancelled";
    paidAt?: string;
  };
  subscription?: {
    status: string;
    endDate: string;
  };
}

export interface OrderItem {
  _id: string;
  orderCode: string;
  amount: number;
  paymentMethod: "momo" | "vnpay" | "vietqr" | string;
  status: "pending" | "completed" | "failed" | "cancelled" | string;
  transactionId?: string;
  paidAt?: string | null;
  createdAt: string;
  payUrl?: string;
}

export const paymentService = {
  /**
   * Create VietQR payment for 99,000 VND / 30-day Premium plan
   */
  createVietQRPayment: async (planType: string = "monthly_99k"): Promise<CreateVietQRPaymentResponse> => {
    const res = await api.post("/payments/vietqr/create", { planType });
    const payload = res.data?.data || res.data;
    return {
      ...payload,
      success: res.data?.success !== false,
      message: res.data?.message || payload?.message,
    };
  },

  /**
   * Confirm VietQR payment manually or verify transfer
   */
  confirmVietQRPayment: async (orderCode: string): Promise<ConfirmVietQRPaymentResponse> => {
    const res = await api.post("/payments/vietqr/confirm", { orderCode });
    const payload = res.data?.data || res.data;
    return {
      ...payload,
      success: res.data?.success !== false,
      message: res.data?.message || payload?.message,
    };
  },

  /**
   * Create MoMo payment for 99,000 VND / 30-day Premium plan
   */
  createMoMoPayment: async (planType: string = "monthly_99k"): Promise<CreateMoMoPaymentResponse> => {
    const res = await api.post("/payments/momo/create", { planType });
    const payload = res.data?.data || res.data;
    return {
      ...payload,
      success: res.data?.success !== false,
      message: res.data?.message || payload?.message,
    };
  },

  /**
   * Check order status after returning from MoMo gateway callback or via auto-polling
   */
  getOrderStatus: async (orderCode: string): Promise<OrderStatusResponse> => {
    const res = await api.get(`/payments/order/${orderCode}`);
    const payload = res.data?.data || res.data;
    return {
      success: res.data?.success !== false,
      order: payload?.order || payload,
      subscription: payload?.subscription,
    };
  },

  /**
   * Fetch order history for the current logged-in user
   */
  getMyOrders: async (): Promise<OrderItem[]> => {
    const res = await api.get("/payments/my-orders");
    const items = res.data?.data || res.data;
    return Array.isArray(items) ? items : [];
  },
};

export default paymentService;
