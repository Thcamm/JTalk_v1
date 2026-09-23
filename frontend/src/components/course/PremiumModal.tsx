import { Crown, Sparkles } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function PremiumModal({
  open,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 text-center shadow-2xl space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-500 shadow-sm">
          <Crown className="w-9 h-9 animate-bounce text-amber-500" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Tính năng JTalk Premium
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Chấm điểm phát âm bằng AI chuẩn bản xứ chỉ dành cho thành viên Premium.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <button
            type="button"
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:brightness-105 active:scale-98 text-white font-bold shadow-md hover:shadow-lg hover:shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
            <span>Nâng cấp Premium ngay</span>
          </button>

          <button
            onClick={onClose}
            type="button"
            className="w-full h-12 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}