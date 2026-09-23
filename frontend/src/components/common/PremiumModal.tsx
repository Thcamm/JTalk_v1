import { useState } from "react";
import { X, Sparkles, Check, ShieldCheck, Zap, ArrowRight, Loader2 } from "lucide-react";
import { paymentService } from "@/services/payment.service";
import { toast } from "sonner";

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: "quota_exceeded" | "premium_lesson" | "general";
}

export const PremiumModal = ({
  isOpen,
  onClose,
  reason = "general",
}: PremiumModalProps) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleMoMoPayment = async () => {
    try {
      setLoading(true);
      const res = await paymentService.createMoMoPayment("monthly_99k");

      if (res.payUrl) {
        toast.success("Đang chuyển hướng đến cổng thanh toán MoMo...");
        window.location.href = res.payUrl;
      } else {
        toast.info(res.message || "Tạo yêu cầu thanh toán thành công! Vui lòng làm theo hướng dẫn.");
      }
    } catch (error: unknown) {
      console.error("Payment error:", error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(
        err.response?.data?.message || err.message || "Không thể khởi tạo thanh toán MoMo lúc này."
      );
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    "Luyện phản xạ nói không giới hạn 24/7 với gia sư AI thông minh",
    "Mở khóa toàn bộ kho hội thoại đời sống, Kaiwa & Business N5 - N4",
    "Chấm điểm chi tiết 4 tiêu chí: Phát âm, Trôi chảy, Chính xác, Đầy đủ",
    "Phân tích từ lỗi từng câu (xanh/đỏ) kèm gợi ý cách sửa tức thì",
    "Lưu trữ toàn bộ tiến độ, streak & biểu đồ phân tích 7 ngày",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className="relative bg-gradient-to-br from-rose-600 via-rose-700 to-slate-900 p-6 text-white text-center overflow-hidden">
          {/* Subtle Ambient orbs */}
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-rose-400/20 rounded-full blur-2xl pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 rounded-full transition-colors cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-3 relative z-10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
            <span>JTalk Premium Pass</span>
          </div>

          <h3 className="text-2xl font-bold tracking-tight relative z-10">
            {reason === "quota_exceeded"
              ? "Bạn đã đạt hạn mức miễn phí hôm nay"
              : reason === "premium_lesson"
              ? "Bài học dành cho thành viên Premium"
              : "Nâng tầm phản xạ tiếng Nhật"}
          </h3>
          <p className="text-rose-100/90 text-sm mt-1.5 max-w-sm mx-auto relative z-10 font-medium">
            {reason === "quota_exceeded"
              ? "Tài khoản Miễn phí được tối đa 2 lượt nói/ngày. Nâng cấp để luyện tập không giới hạn!"
              : "Luyện nói tự tin, sửa lỗi phát âm và bứt phá phản xạ giao tiếp mỗi ngày."}
          </p>
        </div>

        {/* Pricing & Offer Card */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="bg-rose-50/40 dark:bg-rose-950/20 border-2 border-rose-500/30 dark:border-rose-800/60 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded-md mb-1">
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> Gói 30 ngày phổ biến nhất
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Gói Tháng Không Giới Hạn</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tự động kích hoạt ngay sau thanh toán</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">99.000đ</div>
              <div className="text-xs text-slate-400 line-through">199.000đ</div>
            </div>
          </div>

          {/* Benefits list */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Đặc quyền gói Premium
            </h5>
            <div className="space-y-2.5">
              {benefits.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-tight">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action button */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleMoMoPayment}
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:brightness-105 active:translate-y-0.5 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:shadow-rose-500/20 transition-all duration-200 flex items-center justify-center gap-2.5 active:scale-[0.99] disabled:opacity-70 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang kết nối MoMo...</span>
                </>
              ) : (
                <>
                  <span>Thanh toán 99.000đ qua MoMo</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-rose-500" />
              <span>Thanh toán bảo mật chuẩn HMAC-SHA256 qua cổng MoMo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;
