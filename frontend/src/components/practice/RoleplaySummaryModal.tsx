import React from "react";
import {
  Trophy,
  Sparkles,
  RotateCcw,
  MessageSquare,
  CheckCircle2,
  Clock,
  Flame,
  Award,
  X,
  Lightbulb,
} from "lucide-react";

interface BetterExpressionItem {
  original?: string;
  better: string;
  furigana?: string;
}

interface RoleplaySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  scenarioTitle: string;
  level?: string;
  overallScore: number;
  userTurns: number;
  durationSeconds: number;
  xpEarned?: number;
  strengths?: string[];
  betterExpressions?: BetterExpressionItem[];
}

export const RoleplaySummaryModal: React.FC<RoleplaySummaryModalProps> = ({
  isOpen,
  onClose,
  onRestart,
  scenarioTitle,
  level = "N5",
  overallScore,
  userTurns,
  durationSeconds,
  xpEarned = 30,
  strengths = [],
  betterExpressions = [],
}) => {
  if (!isOpen) return null;

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  const timeFormatted = minutes > 0 ? `${minutes}p ${seconds}s` : `${seconds}s`;

  // Determine badge title and color based on overallScore
  let badgeTitle = "Bậc Thầy Giao Tiếp Kaiwa";
  let badgeColor = "from-amber-500 to-rose-500";
  let badgeDescription = "Phản xạ tự nhiên, ngữ điệu lưu loát và đối đáp chuẩn bản xứ!";

  if (overallScore < 70) {
    badgeTitle = "Khởi Đầu Tự Tin";
    badgeColor = "from-blue-500 to-indigo-500";
    badgeDescription = "Bạn đã hoàn thành trọn vẹn buổi đối đáp. Hãy rèn luyện thêm để tự nhiên hơn!";
  } else if (overallScore < 85) {
    badgeTitle = "Giao Tiếp Lưu Loát";
    badgeColor = "from-emerald-500 to-teal-500";
    badgeDescription = "Nắm bắt ngữ cảnh tốt, phản xạ nhanh và truyền đạt ý rõ ràng!";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Decorative background glow */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-rose-500/15 via-amber-500/10 to-transparent pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer z-10"
          title="Đóng xem lại hội thoại"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Content with Scroll */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto scrollbar-thin">
          {/* Header Trophy & Title */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-amber-300 text-white shadow-lg shadow-rose-500/25 animate-bounce">
              <Trophy className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-800 text-2xs font-bold text-rose-700 dark:text-rose-300">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Hoàn thành đàm thoại Kaiwa tự do</span>
                <span className="w-1 h-1 rounded-full bg-rose-400" />
                <span>{level}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {scenarioTitle}
              </h2>
            </div>
          </div>

          {/* Score & Badge Highlight Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-50 via-rose-50/40 to-amber-50/40 dark:from-slate-800/80 dark:via-rose-950/20 dark:to-amber-950/20 border border-rose-200/70 dark:border-rose-900/50 text-center space-y-3 shadow-xs">
            <div className="flex items-center justify-center gap-3">
              <div className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
                {overallScore}
              </div>
              <div className="text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Điểm phản xạ
                </span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  / 100 Điểm Tự Nhiên
                </span>
              </div>
            </div>

            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r ${badgeColor} text-white text-xs font-bold shadow-xs`}>
              <Award className="w-4 h-4" />
              <span>{badgeTitle}</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              {badgeDescription}
            </p>
          </div>

          {/* 4 Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center space-y-1">
              <div className="flex items-center justify-center text-rose-500">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                {userTurns}
              </div>
              <div className="text-3xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Lượt đối đáp
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center space-y-1">
              <div className="flex items-center justify-center text-amber-500">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                {timeFormatted}
              </div>
              <div className="text-3xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Thời lượng
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center space-y-1">
              <div className="flex items-center justify-center text-amber-500">
                <Flame className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
                +{xpEarned} XP
              </div>
              <div className="text-3xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Kinh nghiệm
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center space-y-1">
              <div className="flex items-center justify-center text-emerald-500">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                100%
              </div>
              <div className="text-3xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Hoàn thành
              </div>
            </div>
          </div>

          {/* AI Sensei's Strengths & Feedback */}
          {strengths.length > 0 && (
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Điểm mạnh ghi nhận từ Sensei AI:</span>
              </div>
              <ul className="space-y-1.5 pl-1">
                {strengths.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-emerald-900 dark:text-emerald-200">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Better Expressions Section (if available) */}
          {betterExpressions.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Cách nói tự nhiên hơn học được trong buổi này:</span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                {betterExpressions.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-1 text-xs"
                  >
                    {item.original && (
                      <div className="text-2xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold">Bạn nói:</span> {item.original}
                      </div>
                    )}
                    <div className="text-rose-700 dark:text-rose-300 font-bold font-sans">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Chuẩn hơn:</span>{" "}
                      {item.better}
                    </div>
                    {item.furigana && (
                      <div className="text-2xs font-semibold text-rose-600/80 dark:text-rose-400/80 font-sans tracking-wide">
                        {item.furigana}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            type="button"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Xem lại cuộc trò chuyện</span>
          </button>

          <button
            onClick={onRestart}
            type="button"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:brightness-105 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Luyện tập lại từ đầu</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleplaySummaryModal;
