"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@/lib/react-router-compat";
import {
  Sparkles,
  Check,
  ShieldCheck,
  Zap,
  ArrowLeft,
  Loader2,
  ArrowRight,
  QrCode,
  ExternalLink,
  Clock,
  CheckCircle2,
  Copy,
  Smartphone,
  Landmark,
  Info,
  Crown,
  Mic,
} from "lucide-react";
import { paymentService } from "@/services/payment.service";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ActiveOrderState {
  method: "vietqr" | "momo";
  orderCode: string;
  amount: number;
  payUrl: string;
  qrCodeUrl: string;
  deeplink?: string;
  bankId?: string;
  accountNo?: string;
  accountName?: string;
  phone?: string;
  transferContent?: string;
}

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user, isPremium, fetchMe } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<"vietqr" | "momo">("vietqr");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [activeOrder, setActiveOrder] = useState<ActiveOrderState | null>(null);
  const [showRenewForm, setShowRenewForm] = useState(false);

  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [countdown, setCountdown] = useState(900); // 15 minutes
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const formatExpiryDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return null;
    }
  };

  const getDaysRemaining = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const target = new Date(dateStr).getTime();
      if (isNaN(target)) return null;
      const diffMs = target - Date.now();
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 0;
    } catch {
      return null;
    }
  };

  const expiryFormatted = formatExpiryDate(user?.subscription?.expiresAt);
  const daysRemaining = getDaysRemaining(user?.subscription?.expiresAt);

  // Timer countdown for active order
  useEffect(() => {
    if (!activeOrder || paymentSuccess) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeOrder, paymentSuccess]);

  // Format countdown mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Auto-polling order status while waiting for payment
  useEffect(() => {
    if (!activeOrder || paymentSuccess) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await paymentService.getOrderStatus(activeOrder.orderCode);
        const st = (res.order?.status || "").toLowerCase();
        if (st === "completed" || st === "success") {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setPaymentSuccess(true);
          toast.success("Thanh toán thành công! Gói Premium đã được kích hoạt.");
          await fetchMe();
        }
      } catch {
        // Silently continue polling
      }
    }, 3000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [activeOrder, paymentSuccess, fetchMe]);

  const handleCreatePayment = async () => {
    try {
      setLoading(true);

      if (selectedMethod === "vietqr") {
        const res = await paymentService.createVietQRPayment("monthly_99k");
        if (res.orderCode && res.qrCodeUrl) {
          setActiveOrder({
            method: "vietqr",
            orderCode: res.orderCode,
            amount: res.amount || 99000,
            payUrl: res.payUrl || res.qrCodeUrl,
            qrCodeUrl: res.qrCodeUrl,
            bankId: res.bankId || "MB",
            accountNo: res.accountNo || "0975383173",
            accountName: res.accountName || "JTALK",
            transferContent: res.transferContent || res.orderCode,
          });
          setCountdown(900);
          toast.success("Mã VietQR đã sẵn sàng! Mời bạn quét mã qua app Ngân hàng.");
        } else {
          toast.error("Không thể tạo mã VietQR. Vui lòng thử lại!");
        }
      } else {
        const res = await paymentService.createMoMoPayment("monthly_99k");
        const orderCode = res.orderCode || res.order?.orderCode;
        const payUrl = res.payUrl || "/momo-qr.png";
        const qrCodeUrl = res.qrCodeUrl || "/momo-qr.png";

        if (orderCode && (payUrl || qrCodeUrl)) {
          setActiveOrder({
            method: "momo",
            orderCode,
            amount: res.amount || 99000,
            payUrl,
            qrCodeUrl,
            deeplink: res.deeplink,
            bankId: res.bankId || "971005",
            accountNo: res.accountNo || "PSP2606717600000005",
            phone: res.phone || "0975383173",
            accountName: res.accountName || "NGUYEN DUC THIEN CAM",
            transferContent: res.transferContent || orderCode,
          });
          setCountdown(900);
          toast.success("Mã QR Ví MoMo đã sẵn sàng! Mời bạn quét mã thanh toán.");
        } else {
          toast.error("Không nhận được mã thanh toán từ MoMo.");
        }
      }
    } catch (err: unknown) {
      console.error("Payment creation error:", err);
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(
        errorObj.response?.data?.message ||
          errorObj.message ||
          "Không thể tạo đơn thanh toán lúc này. Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!activeOrder?.orderCode) return;
    try {
      setVerifying(true);
      const res =
        activeOrder.method === "momo"
          ? await paymentService.confirmMoMoPayment(activeOrder.orderCode)
          : await paymentService.confirmVietQRPayment(activeOrder.orderCode);
      if (res.success && res.status === "completed") {
        setPaymentSuccess(true);
        toast.success("Xác nhận thanh toán thành công! Gói Premium đã được kích hoạt.");
        await fetchMe();
      } else {
        toast.info(
          res.message ||
            "Hệ thống đang chờ xác nhận từ ngân hàng hoặc ví MoMo. Nếu bạn vừa chuyển khoản, vui lòng đợi trong giây lát để hệ thống tự động kiểm tra."
        );
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(
        errorObj.response?.data?.message ||
          errorObj.message ||
          "Đang xác minh giao dịch... Vui lòng đợi trong giây lát hoặc thử lại."
      );
    } finally {
      setVerifying(false);
    }
  };

  // Backward compatibility alias
  const handleConfirmVietQR = handleConfirmPayment;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}: ${text}`);
  };

  const perks = [
    "Không giới hạn số lượt luyện nói phản xạ với AI mỗi ngày",
    "Mở khóa toàn bộ bài học đàm thoại Kaiwa & Business N5 - N4",
    "Chấm điểm chi tiết 4 tiêu chí: Phát âm, Trôi chảy, Chính xác, Đầy đủ",
    "Phân tích lỗi từng từ (xanh/đỏ) kèm gợi ý cải thiện khẩu hình",
    "Lưu trữ tiến độ, chuỗi ngày học liên tục (Streak) và báo cáo phân tích",
    "Hỗ trợ ưu tiên và cập nhật nội dung bài học mới liên tục",
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-[#0b0f17] py-8 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-200">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation */}
        <button
          onClick={() => navigate(-1)}
          type="button"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>

        {/* Success Modal / Card State */}
        {paymentSuccess ? (
          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6 animate-scale-up">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Kích hoạt thành công</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Chào mừng bạn đến với JTalk Premium!
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                Đơn hàng <span className="font-bold text-slate-900 dark:text-white">{activeOrder?.orderCode}</span> đã được thanh toán thành công 99.000đ. Tài khoản của bạn đã được nâng cấp 30 ngày luyện nói phản xạ không giới hạn!
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate("/speaking")}
                type="button"
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:brightness-105 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
              >
                Vào Phòng Luyện Nói AI Ngay
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                type="button"
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-2xl transition-all cursor-pointer"
              >
                Về Bảng Điều Khiển
              </button>
            </div>
          </div>
        ) : activeOrder?.method === "vietqr" ? (
          /* Active VietQR Payment View (Napas 247 Instant Transfer) */
          <div className="bg-white dark:bg-slate-900 border-2 border-indigo-500/30 rounded-3xl overflow-hidden shadow-xl animate-fade-in">
            {/* VietQR Header */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-slate-900 p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider backdrop-blur-md">
                  <Landmark className="w-3.5 h-3.5" />
                  <span>VietQR · Chuyển khoản liên ngân hàng 24/7</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black">
                  Quét mã VietQR để thanh toán 99.000đ
                </h2>
                <p className="text-indigo-100 text-xs">
                  Mở ứng dụng Mobile Banking của bất kỳ ngân hàng nào để quét mã QR
                </p>
              </div>

              <div className="bg-white/15 px-4 py-2 rounded-2xl backdrop-blur-md text-right shrink-0">
                <div className="text-3xs uppercase tracking-wider font-extrabold text-indigo-200 flex items-center justify-end gap-1">
                  <Clock className="w-3 h-3" /> Hết hạn trong
                </div>
                <div className="text-xl font-black font-mono tracking-wider">{formatTime(countdown)}</div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* QR Code Canvas Frame */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="relative p-3 bg-white rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 shadow-md">
                    <img
                      src={activeOrder.qrCodeUrl}
                      alt="VietQR Napas Payment"
                      className="w-56 h-56 sm:w-60 sm:h-60 object-contain rounded-lg select-none"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Quét mã bằng app ngân hàng bất kỳ
                    </p>
                    <p className="text-2xs text-slate-500 dark:text-slate-400">
                      MB, Vietcombank, Techcombank, VPBank, ACB, BIDV...
                    </p>
                  </div>
                </div>

                {/* Transfer Info Details with 1-click Copy */}
                <div className="space-y-3">
                  <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Ngân hàng thụ hưởng:</span>
                      <span className="font-bold text-slate-900 dark:text-white uppercase">
                        {activeOrder.bankId || "MB Bank"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Chủ tài khoản:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {activeOrder.accountName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-indigo-100 dark:border-indigo-900/40">
                      <span className="text-slate-500 dark:text-slate-400">Số tài khoản:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-indigo-700 dark:text-indigo-300">
                          {activeOrder.accountNo}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(activeOrder.accountNo || "", "Số tài khoản")}
                          className="p-1 hover:text-indigo-600 transition-colors"
                          title="Sao chép số tài khoản"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-500 hover:text-indigo-600" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Số tiền:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                          {activeOrder.amount.toLocaleString("vi-VN")}đ
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(String(activeOrder.amount), "Số tiền")}
                          className="p-1 hover:text-rose-600 transition-colors"
                          title="Sao chép số tiền"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Crucial: Transfer Content Note */}
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" />
                        <span>Nội dung chuyển khoản (bắt buộc):</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(activeOrder.transferContent || activeOrder.orderCode, "Nội dung chuyển khoản")}
                        className="inline-flex items-center gap-1 text-2xs font-bold text-amber-800 dark:text-amber-200 bg-amber-200/60 dark:bg-amber-900/40 px-2 py-0.5 rounded-md hover:bg-amber-200 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Sao chép</span>
                      </button>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-amber-300/80 dark:border-amber-700 text-center font-mono font-black text-sm text-amber-800 dark:text-amber-200 tracking-wider">
                      {activeOrder.transferContent || activeOrder.orderCode}
                    </div>
                    <p className="text-3xs text-amber-700 dark:text-amber-400 leading-tight">
                      Vui lòng giữ nguyên nội dung chuyển khoản để hệ thống tự động nhận diện và kích hoạt.
                    </p>
                  </div>

                  {/* Auto-polling indicator */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center space-y-1">
                    <p className="text-2xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>Hệ thống đang tự động lắng nghe giao dịch chuyển khoản...</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions & Instant Confirmation */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={handleConfirmVietQR}
                    disabled={verifying}
                    type="button"
                    className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-70"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang kiểm tra biến động số dư...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Tôi đã chuyển khoản - Kiểm tra trạng thái</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveOrder(null)}
                    type="button"
                    className="w-full sm:w-auto py-3 px-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
                  >
                    Hủy & Chọn lại
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-2xs text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Xử lý tự động 24/7 qua cổng liên ngân hàng VietQR Napas chuẩn quốc gia</span>
                </div>
              </div>
            </div>
          </div>
        ) : activeOrder?.method === "momo" ? (
          /* Active MoMo QR Payment View (Personal MoMo P2P Scanner) */
          <div className="bg-white dark:bg-slate-900 border-2 border-pink-500/30 rounded-3xl overflow-hidden shadow-xl animate-fade-in">
            {/* MoMo Header */}
            <div className="bg-gradient-to-r from-[#A50064] via-[#D82D8B] to-[#A50064] p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider backdrop-blur-md">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Ví điện tử MoMo 24/7</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black">
                  Quét mã MoMo để thanh toán 99.000đ
                </h2>
                <p className="text-pink-100 text-xs">
                  Mở ứng dụng MoMo trên điện thoại để quét mã QR hoặc chuyển tiền trực tiếp
                </p>
              </div>

              <div className="bg-white/15 px-4 py-2 rounded-2xl backdrop-blur-md text-right shrink-0">
                <div className="text-3xs uppercase tracking-wider font-extrabold text-pink-200 flex items-center justify-end gap-1">
                  <Clock className="w-3 h-3" /> Hết hạn trong
                </div>
                <div className="text-xl font-black font-mono tracking-wider">{formatTime(countdown)}</div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* QR Code Canvas Frame */}
                <div className="flex flex-col items-center justify-center p-4 bg-pink-50/40 dark:bg-pink-950/20 rounded-2xl border border-pink-200/80 dark:border-pink-900/60 space-y-3">
                  <div className="relative p-2.5 bg-white rounded-2xl border-2 border-pink-300 dark:border-pink-800 shadow-md">
                    <img
                      src={activeOrder.qrCodeUrl || "/momo-qr.png"}
                      alt="MoMo Transfer QR Code"
                      className="w-56 h-auto sm:w-60 max-h-80 object-contain rounded-xl select-none"
                    />
                  </div>
                  <div className="text-center space-y-0.5">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Mở app MoMo để quét mã QR
                    </p>
                    <p className="text-2xs text-slate-500 dark:text-slate-400">
                      Tự động điền sẵn 99.000đ & nhận diện NGUYEN DUC THIEN CAM
                    </p>
                  </div>
                </div>

                {/* Transfer Info Details with 1-click Copy */}
                <div className="space-y-3">
                  <div className="p-3.5 bg-pink-50/60 dark:bg-pink-950/40 border border-pink-100 dark:border-pink-900/60 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Ngân hàng / Cổng nhận:</span>
                      <span className="font-bold text-[#A50064] dark:text-pink-300 flex items-center gap-1">
                        <Smartphone className="w-3.5 h-3.5" /> Ví MoMo (Napas)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Chủ tài khoản:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {activeOrder.accountName || "NGUYEN DUC THIEN CAM"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-pink-100 dark:border-pink-900/40">
                      <span className="text-slate-500 dark:text-slate-400">Số tài khoản (STK):</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-[#A50064] dark:text-pink-300 text-sm">
                          {activeOrder.accountNo || activeOrder.phone || "PSP2606717600000005"}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(activeOrder.accountNo || activeOrder.phone || "PSP2606717600000005", "Số tài khoản MoMo")}
                          className="p-1 hover:text-[#A50064] transition-colors"
                          title="Sao chép số tài khoản MoMo"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-500 hover:text-[#A50064]" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Số tiền:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                          {activeOrder.amount.toLocaleString("vi-VN")}đ
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(String(activeOrder.amount), "Số tiền")}
                          className="p-1 hover:text-rose-600 transition-colors"
                          title="Sao chép số tiền"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Crucial: Transfer Content Note */}
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" />
                        <span>Lời nhắn / Lời chuyển tiền (bắt buộc):</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(activeOrder.transferContent || activeOrder.orderCode, "Lời nhắn MoMo")}
                        className="inline-flex items-center gap-1 text-2xs font-bold text-amber-800 dark:text-amber-200 bg-amber-200/60 dark:bg-amber-900/40 px-2 py-0.5 rounded-md hover:bg-amber-200 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Sao chép</span>
                      </button>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-amber-300/80 dark:border-amber-700 text-center font-mono font-black text-sm text-amber-800 dark:text-amber-200 tracking-wider">
                      {activeOrder.transferContent || activeOrder.orderCode}
                    </div>
                    <p className="text-3xs text-amber-700 dark:text-amber-400 leading-tight">
                      * Vui lòng điền chính xác lời nhắn để hệ thống tự động nhận diện và kích hoạt Premium cho bạn!
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center space-y-1">
                    <p className="text-2xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>Hệ thống đang tự động lắng nghe giao dịch chuyển khoản qua MoMo...</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions & Instant Confirmation */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={handleConfirmPayment}
                    disabled={verifying}
                    type="button"
                    className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-[#A50064] to-[#D82D8B] hover:brightness-105 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-pink-600/20 cursor-pointer disabled:opacity-70"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang kiểm tra biến động số dư...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Tôi đã chuyển tiền MoMo - Kiểm tra trạng thái</span>
                      </>
                    )}
                  </button>

                  {activeOrder.deeplink && (
                    <a
                      href={activeOrder.deeplink}
                      className="w-full sm:w-auto py-3 px-4 bg-pink-100 dark:bg-pink-950/60 hover:bg-pink-200 text-[#A50064] dark:text-pink-300 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Mở App MoMo</span>
                    </a>
                  )}

                  <button
                    onClick={() => setActiveOrder(null)}
                    type="button"
                    className="w-full sm:w-auto py-3 px-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
                  >
                    Hủy & Chọn lại
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-2xs text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Xử lý tự động 24/7 qua Ví điện tử MoMo chính chủ NGUYEN DUC THIEN CAM</span>
                </div>
              </div>
            </div>
          </div>
        ) : isPremium && !showRenewForm ? (
          /* Màn hình Gói Premium Đã Kích Hoạt / Đang Hoạt Động */
          <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-800/60 rounded-3xl overflow-hidden shadow-xl animate-fade-in">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 p-8 sm:p-10 text-white overflow-hidden">
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-56 h-56 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-56 h-56 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 border border-white/25 text-white text-xs font-black uppercase tracking-wider backdrop-blur-md mb-4 shadow-xs relative z-10">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span>Gói Dịch Vụ Đã Kích Hoạt · Đang Hoạt Động</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight relative z-10">
                Tài Khoản JTalk Premium Của Bạn
              </h1>
              <p className="text-emerald-100/90 text-sm sm:text-base mt-2 max-w-xl relative z-10 font-medium leading-relaxed">
                Xin chào <span className="font-bold text-white">{user?.displayName || user?.username}</span>! Bạn đang sở hữu trọn bộ đặc quyền cao cấp nhất của JTalk AI để bứt phá phản xạ giao tiếp tiếng Nhật.
              </p>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-8 space-y-8">
              {/* 3 Status Bento Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Trạng thái */}
                <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                      Trạng thái gói
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Đang hoạt động</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  </div>
                  <p className="text-2xs font-semibold text-emerald-700/90 dark:text-emerald-400/90">
                    {user?.role === "admin" ? "Đặc quyền Quản trị viên" : "JTalk Premium Pass (30 ngày)"}
                  </p>
                </div>

                {/* Thời hạn sử dụng */}
                <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                      Thời hạn sử dụng
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                    {user?.role === "admin"
                      ? "Vô thời hạn"
                      : expiryFormatted || "30 ngày"}
                  </div>
                  <p className="text-2xs font-semibold text-amber-700/90 dark:text-amber-400/90">
                    {user?.role === "admin"
                      ? "Trọn đời hệ thống"
                      : daysRemaining !== null
                      ? `Còn lại ${daysRemaining} ngày sử dụng`
                      : "Đang có hiệu lực"}
                  </p>
                </div>

                {/* Hạn mức đàm thoại */}
                <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
                      Lượt đàm thoại AI
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
                      <Zap className="w-4 h-4 fill-indigo-600 dark:fill-indigo-400" />
                    </div>
                  </div>
                  <div className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400">
                    Vô hạn lượt
                  </div>
                  <p className="text-2xs font-semibold text-indigo-700/90 dark:text-indigo-400/90">
                    Không giới hạn số bài luyện/ngày
                  </p>
                </div>
              </div>

              {/* Danh sách đặc quyền VIP */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Toàn bộ đặc quyền VIP đã kích hoạt</span>
                  </h3>
                  <span className="text-2xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
                    Đã mở khóa 100%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {perks.map((perk, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-tight">
                        {perk}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nút hành động chính */}
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={() => navigate("/speaking")}
                    type="button"
                    className="w-full sm:flex-1 py-4 px-6 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:brightness-105 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                  >
                    <Mic className="w-5 h-5 animate-pulse" />
                    <span>Luyện Nói Phản Xạ AI Ngay</span>
                    <ArrowRight className="w-4 h-4 ml-auto sm:ml-0" />
                  </button>

                  <button
                    onClick={() => navigate("/courses")}
                    type="button"
                    className="w-full sm:w-auto py-4 px-6 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm sm:text-base rounded-2xl transition-all cursor-pointer"
                  >
                    <span>Khám Phá Khóa Học</span>
                  </button>

                  <button
                    onClick={() => navigate("/dashboard")}
                    type="button"
                    className="w-full sm:w-auto py-4 px-6 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm sm:text-base rounded-2xl transition-all cursor-pointer"
                  >
                    <span>Bảng Điều Khiển</span>
                  </button>
                </div>

                {/* Banner tùy chọn gia hạn nếu cần */}
                {user?.role !== "admin" && (
                  <div className="pt-2">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-center sm:text-left">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Bạn muốn gia hạn thêm thời gian sử dụng?
                        </p>
                        <p className="text-2xs text-slate-500 dark:text-slate-400">
                          30 ngày mới sẽ được tự động cộng dồn nối tiếp vào hạn dùng hiện tại của bạn.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowRenewForm(true)}
                        className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs hover:border-slate-400"
                      >
                        Gia hạn thêm gói (99.000đ)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Initial Plan Selection & Pricing Card */
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs space-y-0">
            {/* Top banner if in renew mode */}
            {isPremium && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Chế độ gia hạn gói Premium
                    </p>
                    <p className="text-2xs text-slate-500 dark:text-slate-400">
                      Thời gian 30 ngày sẽ được tự động cộng dồn nối tiếp vào hạn dùng hiện tại của bạn.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRenewForm(false)}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer shrink-0"
                >
                  ← Quay lại thông tin gói đã kích hoạt
                </button>
              </div>
            )}

            <div className="relative bg-gradient-to-br from-rose-600 via-rose-700 to-slate-900 p-8 text-white overflow-hidden">
              {/* Subtle Ambient orbs */}
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-48 h-48 bg-rose-400/20 rounded-full blur-2xl pointer-events-none" />

              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-4 relative z-10">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
                <span>{isPremium ? "Gia hạn tài khoản JTalk Premium" : "Nâng cấp tài khoản JTalk Premium"}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight relative z-10">
                {isPremium ? "Tiếp tục bứt phá phản xạ nói cùng AI" : "Bứt phá phản xạ nói tiếng Nhật cùng AI"}
              </h1>
              <p className="text-rose-100 text-sm mt-2 max-w-xl relative z-10 font-medium leading-relaxed">
                Tự tin giao tiếp tiếng Nhật trôi chảy, sửa lỗi phát âm và luyện phản xạ không giới hạn
                mỗi ngày.
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              {/* Plan selection box */}
              <div className="border-2 border-rose-500/30 dark:border-rose-800/60 bg-rose-50/40 dark:bg-rose-950/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-bold">
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> {isPremium ? "Gia hạn thêm 30 ngày" : "Gói 30 ngày linh hoạt"}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {isPremium ? "Gia Hạn Premium Pass (+30 Ngày)" : "JTalk Premium Pass (1 Tháng)"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isPremium ? "Cộng dồn thêm 30 ngày vào tài khoản của bạn" : "Thời hạn 30 ngày kể từ lúc kích hoạt thành công"}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-3xl font-black text-rose-600 dark:text-rose-400">99.000đ</div>
                </div>
              </div>

              {/* List of perks */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Toàn bộ quyền lợi của bạn
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {perks.map((perk, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-tight">
                        {perk}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Chọn phương thức thanh toán:
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Bảo mật chuẩn SSL
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* VietQR Option - Recommended */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("vietqr")}
                    className={`relative p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selectedMethod === "vietqr"
                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-md shadow-indigo-600/10"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                        <Landmark className="w-5 h-5" />
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        Khuyên dùng
                      </span>
                    </div>

                    <div className="mt-3 space-y-1">
                      <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Chuyển khoản VietQR</span>
                      </div>
                      <p className="text-2xs text-slate-500 dark:text-slate-400 leading-snug">
                        Napas 24/7 · Hỗ trợ app MB, VCB, TCB, VPB, BIDV...
                      </p>
                    </div>

                    {selectedMethod === "vietqr" && (
                      <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>

                  {/* MoMo Option - Sandbox */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("momo")}
                    className={`relative p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selectedMethod === "momo"
                        ? "border-[#A50064] bg-pink-50/50 dark:bg-pink-950/30 shadow-md shadow-pink-500/10"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[#A50064] text-white flex items-center justify-center font-black text-xs">
                        MoMo
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300">
                        Sandbox Demo
                      </span>
                    </div>

                    <div className="mt-3 space-y-1">
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        Ví Điện Tử MoMo
                      </div>
                      <p className="text-2xs text-slate-500 dark:text-slate-400 leading-snug">
                        Thử nghiệm qua App MoMo Test (Ngày bảo vệ)
                      </p>
                    </div>

                    {selectedMethod === "momo" && (
                      <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-[#A50064] text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                </div>

                {/* Submit button */}
                <button
                  onClick={handleCreatePayment}
                  disabled={loading}
                  type="button"
                  className={`w-full py-4 px-6 text-white font-extrabold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2.5 active:scale-[0.99] disabled:opacity-70 cursor-pointer text-base ${
                    selectedMethod === "vietqr"
                      ? "bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-700 hover:brightness-105 shadow-indigo-600/20"
                      : "bg-gradient-to-r from-pink-600 via-[#A50064] to-rose-600 hover:brightness-105 shadow-pink-600/20"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Đang tạo mã thanh toán {selectedMethod === "vietqr" ? "VietQR" : "MoMo"}...</span>
                    </>
                  ) : (
                    <>
                      <QrCode className="w-5 h-5" />
                      <span>
                        Tạo mã QR {selectedMethod === "vietqr" ? "VietQR (99.000đ)" : "MoMo Sandbox (99.000đ)"}
                      </span>
                      <ArrowRight className="w-5 h-5 ml-auto" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Kích hoạt tự động sau khi quét mã · Hỗ trợ bảo vệ đồ án và triển khai thực tế</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
