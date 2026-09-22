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

export const paymentService = {
  /**
   * Create MoMo payment for 99,000 VND / 30-day Premium plan
   */
  createMoMoPayment: async (planType: string = "monthly_99k"): Promise<CreateMoMoPaymentResponse> => {
    const res = await api.post("/payments/momo/create", { planType });
    return res.data;
  },

  /**
   * Check order status after returning from MoMo gateway callback
   */
  getOrderStatus: async (orderCode: string): Promise<OrderStatusResponse> => {
    const res = await api.get(`/payments/order/${orderCode}`);
    return res.data;
  },
};

export default paymentService;
