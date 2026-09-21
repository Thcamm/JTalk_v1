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
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className="relative bg-gradient-to-br from-emerald-500 via-teal-600 to-blue-600 p-6 text-white text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            JTalk Premium Pass
          </div>

          <h3 className="text-2xl font-bold tracking-tight">
            {reason === "quota_exceeded"
              ? "Bạn đã đạt hạn mức miễn phí hôm nay"
              : reason === "premium_lesson"
              ? "Bài học dành cho thành viên Premium"
              : "Nâng tầm phản xạ tiếng Nhật"}
          </h3>
          <p className="text-emerald-100 text-sm mt-1.5 max-w-sm mx-auto">
            {reason === "quota_exceeded"
              ? "Tài khoản Miễn phí được tối đa 2 lượt nói/ngày. Nâng cấp để luyện tập không giới hạn!"
              : "Luyện nói tự tin, sửa lỗi phát âm và bứt phá phản xạ giao tiếp mỗi ngày."}
          </p>
        </div>

        {/* Pricing & Offer Card */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="bg-slate-50 border-2 border-emerald-500/30 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md mb-1">
                <Zap className="w-3 h-3" /> Gói 30 ngày phổ biến nhất
              </div>
              <h4 className="text-lg font-bold text-slate-900">Gói Tháng Không Giới Hạn</h4>
              <p className="text-xs text-slate-500">Tự động kích hoạt ngay sau thanh toán</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-emerald-600">99.000đ</div>
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
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-sm text-slate-700 font-medium leading-tight">
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
              className="w-full py-4 px-6 bg-gradient-to-r from-[#A50064] via-[#C41A7E] to-[#D82D8B] hover:brightness-105 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2.5 active:scale-[0.99] disabled:opacity-70 cursor-pointer"
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
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Thanh toán bảo mật chuẩn HMAC-SHA256 qua cổng MoMo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;
