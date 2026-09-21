import { Flame } from "lucide-react";

interface StreakBadgeProps {
  streak: number;
  className?: string;
  showText?: boolean;
}

export const StreakBadge = ({
  streak = 0,
  className = "",
  showText = true,
}: StreakBadgeProps) => {
  const isZero = streak === 0;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs transition-transform hover:scale-105 select-none ${
        isZero
          ? "bg-slate-100 text-slate-500 border border-slate-200"
          : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs shadow-orange-200"
      } ${className}`}
      title={
        isZero
          ? "Chưa có chuỗi ngày học liên tiếp. Hãy luyện nói hôm nay để bắt đầu!"
          : `Tuyệt vời! Bạn đang duy trì chuỗi ${streak} ngày học liên tục!`
      }
    >
      <Flame className={`w-4 h-4 ${isZero ? "text-slate-400" : "text-yellow-200 fill-yellow-200 animate-pulse"}`} />
      <span className="font-extrabold">{streak}</span>
      {showText && <span className="opacity-90 font-medium">ngày liên tục</span>}
    </div>
  );
};

export default StreakBadge;
