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
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-md flex flex-col items-center max-w-sm w-full text-center space-y-4">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
          <h2 className="text-lg font-bold text-slate-800">Đang xác thực giao dịch MoMo...</h2>
          <p className="text-xs text-slate-500">Vui lòng đợi giây lát trong khi hệ thống kích hoạt gói Premium cho bạn.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl shadow-lg p-6 sm:p-8 text-center space-y-6">
        {isSuccess ? (
          <>
            {/* Celebration Icon */}
            <div className="relative mx-auto w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm animate-in zoom-in-75 duration-300">
              <CheckCircle2 className="w-12 h-12" />
              <span className="absolute -top-1 -right-1 p-1 bg-amber-400 text-white rounded-full">
                <Sparkles className="w-4 h-4" />
              </span>
            </div>

            <div className="space-y-2">
              <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider">
                Thanh toán thành công 🎉
              </div>
              <h1 className="text-2xl font-black text-slate-900">
                Chào mừng bạn đến với JTalk Premium!
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                Tài khoản của bạn đã được kích hoạt đặc quyền luyện nói phản xạ không giới hạn trong 30 ngày.
              </p>
            </div>

            {/* Order Details receipt */}
            <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2.5 text-left border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-slate-800">{orderInfo.orderCode || orderId || "MOMO_PREMIUM"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gói đăng ký:</span>
                <span className="font-semibold text-slate-800">JTalk Premium (30 ngày)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số tiền:</span>
                <span className="font-bold text-emerald-600">{Number(orderInfo.amount || 99000).toLocaleString("vi-VN")} đ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phương thức:</span>
                <span className="font-medium text-[#A50064]">Ví MoMo (HMAC-SHA256)</span>
              </div>
            </div>

            {/* CTA Button */}
            <Link
              to="/courses"
              className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Bắt đầu luyện nói ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        ) : (
          <>
            {/* Error state */}
            <div className="mx-auto w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shadow-sm animate-in zoom-in-75 duration-300">
              <XCircle className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <div className="inline-block px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-bold uppercase tracking-wider">
                Thanh toán chưa hoàn tất
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
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
