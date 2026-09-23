import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router";
import { CheckCircle2, XCircle, Sparkles, ArrowRight, Loader2, RotateCcw } from "lucide-react";
import { paymentService } from "@/services/payment.service";
import { useAuth } from "@/hooks/useAuth";

export const MoMoCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const { fetchMe, updateUserSubscription } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderInfo, setOrderInfo] = useState<{
    orderCode?: string;
    amount?: number;
    endDate?: string;
  }>({});

  const orderId = searchParams.get("orderId") || searchParams.get("orderCode");
  const resultCode = searchParams.get("resultCode");
  const message = searchParams.get("message");

  useEffect(() => {
    let isMounted = true;

    const verifyTransaction = async () => {
      setLoading(true);

      // MoMo resultCode "0" means success
      if (resultCode === "0") {
        setIsSuccess(true);
        updateUserSubscription({ tier: "premium" });
      }

      if (orderId) {
        try {
          const statusRes = await paymentService.getOrderStatus(orderId);
          if (isMounted) {
            if (statusRes.order?.status === "completed" || resultCode === "0") {
              setIsSuccess(true);
              updateUserSubscription({ tier: "premium" });
              setOrderInfo({
                orderCode: statusRes.order?.orderCode || orderId,
                amount: statusRes.order?.amount || 99000,
                endDate: statusRes.subscription?.endDate,
              });
              // Refresh user data in background
              fetchMe().catch(() => {});
            } else if (statusRes.order?.status === "failed") {
              setIsSuccess(false);
              setErrorMessage("Giao dịch không thành công hoặc đã bị từ chối.");
            }
          }
        } catch (err) {
          console.error("Failed to fetch order status:", err);
          // If MoMo returned resultCode 0, still treat as success
          if (resultCode === "0" && isMounted) {
            setIsSuccess(true);
            setOrderInfo({ orderCode: orderId, amount: 99000 });
          }
        }
      } else if (resultCode !== "0") {
        setIsSuccess(false);
        setErrorMessage(message || "Giao dịch đã bị hủy hoặc chưa hoàn tất.");
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    verifyTransaction();

    return () => {
      isMounted = false;
    };
  }, [orderId, resultCode, message]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60 dark:bg-[#0b0f17] flex flex-col items-center justify-center p-4 transition-colors duration-200">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-md flex flex-col items-center max-w-sm w-full text-center space-y-4">
          <Loader2 className="w-12 h-12 text-rose-500 animate-spin" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Đang xác thực giao dịch MoMo...</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Vui lòng đợi giây lát trong khi hệ thống kích hoạt gói Premium cho bạn.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-[#0b0f17] flex items-center justify-center p-4 font-sans transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-lg p-6 sm:p-8 text-center space-y-6">
        {isSuccess ? (
          <>
            {/* Celebration Icon */}
            <div className="relative mx-auto w-20 h-20 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm animate-in zoom-in-75 duration-300">
              <CheckCircle2 className="w-12 h-12 animate-bounce" />
              <span className="absolute -top-1 -right-1 p-1 bg-amber-400 text-white rounded-full shadow-xs">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
              </span>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-full text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
                <span>Thanh toán thành công</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                Chào mừng bạn đến với JTalk Premium!
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Tài khoản của bạn đã được kích hoạt đặc quyền luyện nói phản xạ không giới hạn trong 30 ngày.
              </p>
            </div>

            {/* Order Details receipt */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 text-xs space-y-2.5 text-left border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{orderInfo.orderCode || orderId || "MOMO_PREMIUM"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Gói đăng ký:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">JTalk Premium (30 ngày)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Số tiền:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{Number(orderInfo.amount || 99000).toLocaleString("vi-VN")} đ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Phương thức:</span>
                <span className="font-medium text-[#A50064] dark:text-pink-400">Ví MoMo (HMAC-SHA256)</span>
              </div>
            </div>

            {/* CTA Button */}
            <Link
              to="/courses"
              className="w-full py-4 px-6 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:brightness-105 active:translate-y-0.5 text-white font-bold rounded-2xl shadow-md hover:shadow-lg hover:shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Bắt đầu luyện nói ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        ) : (
          <>
            {/* Error state */}
            <div className="mx-auto w-20 h-20 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm animate-in zoom-in-75 duration-300">
              <XCircle className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <div className="inline-block px-3 py-1 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-full text-xs font-bold uppercase tracking-wider">
                Thanh toán chưa hoàn tất
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Giao dịch chưa thành công
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                {errorMessage || "Bạn đã hủy giao dịch hoặc có gián đoạn kết nối tới cổng thanh toán MoMo."}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                to="/checkout"
                className="w-full py-3.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Thử thanh toán lại</span>
              </Link>
              <Link
                to="/"
                className="block text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Quay về trang chủ
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MoMoCallbackPage;
