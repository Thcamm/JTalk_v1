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
  transferContent?: string;
}

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { fetchMe } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<"vietqr" | "momo">("vietqr");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [activeOrder, setActiveOrder] = useState<ActiveOrderState | null>(null);

  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [countdown, setCountdown] = useState(900); // 15 minutes
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

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
            accountNo: res.accountNo || "0868888888",
            accountName: res.accountName || "JTALK VIETNAM",
            transferContent: res.transferContent || res.orderCode,
          });
          setCountdown(900);
          toast.success("Mã VietQR đã sẵn sàng! Mời bạn quét mã qua app Ngân hàng.");
        } else {
          toast.error("Không thể tạo mã VietQR. Vui lòng thử lại!");
        }
      } else {
        const res = await paymentService.createMoMoPayment("monthly_99k");
        const orderCode = res.order?.orderCode || (res as any).orderCode;
        const payUrl = res.payUrl || (res as any).payUrl || "";
        const qrCodeUrl =
          res.qrCodeUrl ||
          (res as any).qrCodeUrl ||
          `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
            payUrl || "https://test-payment.momo.vn"
          )}`;

        if (orderCode && payUrl) {
          setActiveOrder({
            method: "momo",
            orderCode,
            amount: 99000,
            payUrl,
            qrCodeUrl,
            deeplink: res.deeplink,
          });
          setCountdown(900);
          toast.success("Mã QR MoMo Sandbox đã sẵn sàng! Mời bạn quét mã thanh toán.");
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

  const handleConfirmVietQR = async () => {
    if (!activeOrder?.orderCode) return;
    try {
      setVerifying(true);
      const res = await paymentService.confirmVietQRPayment(activeOrder.orderCode);
      if (res.success) {
        setPaymentSuccess(true);
        toast.success("Xác nhận thanh toán thành công! Gói Premium đã được kích hoạt.");
        await fetchMe();
      } else {
        toast.error(res.message || "Chưa ghi nhận giao dịch thành công. Vui lòng thử lại!");
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
                        <span>Đang kiểm tra giao dịch...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Tôi đã chuyển khoản - Kích hoạt ngay</span>
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
          /* Active MoMo QR Payment View (Prepared for Defense Day Demo) */
          <div className="bg-white dark:bg-slate-900 border-2 border-pink-500/30 rounded-3xl overflow-hidden shadow-xl animate-fade-in">
            {/* MoMo Header */}
            <div className="bg-gradient-to-r from-[#A50064] via-[#D82D8B] to-[#A50064] p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider backdrop-blur-md">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>MoMo Sandbox Test Gateway</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black">
                  Quét mã QR để thanh toán 99.000đ
                </h2>
                <p className="text-pink-100 text-xs">
                  Sử dụng ứng dụng MoMo Test trên điện thoại để quét mã QR bên dưới
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
              {/* Defense Demo Hint Box */}
              <div className="bg-pink-50/80 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/60 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#A50064] text-white flex items-center justify-center shrink-0 text-xs font-black">
                  DEMO
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <p className="font-bold text-[#A50064] dark:text-pink-300">
                    Hướng dẫn Demo Ngày Bảo Vệ Khóa Luận / Đồ Án:
                  </p>
                  <p className="text-2xs leading-relaxed">
                    Mở ứng dụng <strong>MoMo Test</strong> trên điện thoại đã chuẩn bị, chọn tính năng <strong>Quét Mã (QR)</strong> và hướng camera vào mã QR bên dưới. Hệ thống sẽ tự động cập nhật trạng thái ngay khi bạn xác nhận!
                  </p>
                </div>
              </div>

              {/* QR Code Canvas Frame */}
              <div className="flex flex-col items-center justify-center py-4 space-y-4">
                <div className="relative p-4 bg-white rounded-3xl border-2 border-slate-200 dark:border-slate-700 shadow-xl group">
                  <img
                    src={
                      activeOrder.qrCodeUrl ||
                      `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
                        activeOrder.payUrl
                      )}`
                    }
                    alt="MoMo Payment QR Code"
                    className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl select-none"
                  />

                  {/* MoMo Center Badge Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-xl bg-[#A50064] text-white font-black text-xs flex items-center justify-center shadow-md border-2 border-white">
                      MoMo
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Mã đơn:</span>
                    <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-rose-600 dark:text-rose-400">
                      {activeOrder.orderCode}
                    </span>
                    <button
                      onClick={() => copyToClipboard(activeOrder.orderCode, "Mã đơn hàng")}
                      className="p-1 hover:text-rose-600 transition-colors"
                      title="Sao chép mã đơn"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-2xs text-slate-400 flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>Hệ thống đang tự động lắng nghe giao dịch qua MoMo IPN...</span>
                  </p>
                </div>
              </div>

              {/* Actions & Fallbacks */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <a
                    href={activeOrder.payUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:flex-1 py-3 px-4 bg-[#A50064] hover:bg-[#8B0054] text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-[#A50064]/20"
                  >
                    <span>Mở cổng thanh toán MoMo Web</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>

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
                  <span>Cổng MoMo Sandbox đã cấu hình xác thực HMAC-SHA256 chuẩn bảo mật</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Initial Plan Selection & Pricing Card */
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
            <div className="relative bg-gradient-to-br from-rose-600 via-rose-700 to-slate-900 p-8 text-white overflow-hidden">
              {/* Subtle Ambient orbs */}
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-48 h-48 bg-rose-400/20 rounded-full blur-2xl pointer-events-none" />

              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-4 relative z-10">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
                <span>Nâng cấp tài khoản JTalk Premium</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight relative z-10">
                Bứt phá phản xạ nói tiếng Nhật cùng AI
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
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> Gói 30 ngày linh hoạt
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">JTalk Premium Pass (1 Tháng)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Thời hạn 30 ngày kể từ lúc kích hoạt thành công
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-3xl font-black text-rose-600 dark:text-rose-400">99.000đ</div>
                  <div className="text-xs text-slate-400 line-through">199.000đ (Tiết kiệm 50%)</div>
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
