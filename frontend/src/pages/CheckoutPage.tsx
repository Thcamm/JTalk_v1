import { useState } from "react";
import { useNavigate } from "react-router";
import { Sparkles, Check, ShieldCheck, Zap, ArrowLeft, Loader2, ArrowRight } from "lucide-react";
import { paymentService } from "@/services/payment.service";
import { toast } from "sonner";

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleMoMoPayment = async () => {
    try {
      setLoading(true);
      const res = await paymentService.createMoMoPayment("monthly_99k");

      if (res.payUrl) {
        toast.success("Đang chuyển hướng sang cổng thanh toán MoMo...");
        window.location.href = res.payUrl;
      } else {
        toast.info(res.message || "Tạo giao dịch thành công!");
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

        {/* Hero Card */}
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

            {/* Payment Method Details */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Phương thức thanh toán:</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-50 dark:bg-pink-950/40 text-[#A50064] dark:text-pink-300 border border-pink-200 dark:border-pink-800 rounded-lg text-xs font-bold">
                  Ví Điện Tử MoMo
                </span>
              </div>

              <button
                onClick={handleMoMoPayment}
                disabled={loading}
                type="button"
                className="w-full py-4 px-6 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:brightness-105 active:translate-y-0.5 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:shadow-rose-500/20 transition-all duration-200 flex items-center justify-center gap-2.5 active:scale-[0.99] disabled:opacity-70 cursor-pointer text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang kết nối cổng thanh toán MoMo...</span>
                  </>
                ) : (
                  <>
                    <span>Thanh toán 99.000đ với MoMo</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-rose-500" />
                <span>Thanh toán an toàn, xác thực mã hóa tức thì qua MoMo IPN</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
