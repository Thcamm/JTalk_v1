import { Mic, Square, Loader2, Sparkles } from "lucide-react";

interface MicRecorderProps {
  isRecording: boolean;
  isEvaluating: boolean;
  durationSeconds: number;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
  className?: string;
}

export const MicRecorder = ({
  isRecording,
  isEvaluating,
  durationSeconds,
  onStart,
  onStop,
  disabled = false,
  className = "",
}: MicRecorderProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleClick = () => {
    if (disabled || isEvaluating) return;
    if (isRecording) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      {/* Central Mic Button */}
      <div className="relative flex items-center justify-center">
        {/* Animated pulse rings during recording */}
        {isRecording && (
          <>
            <span className="absolute w-28 h-28 rounded-full bg-rose-500/20 animate-ping duration-1000" />
            <span className="absolute w-24 h-24 rounded-full bg-rose-500/30 animate-pulse duration-700" />
          </>
        )}

        <button
          onClick={handleClick}
          disabled={disabled || isEvaluating}
          type="button"
          className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 active:scale-95 cursor-pointer ${
            isEvaluating
              ? "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed"
              : isRecording
              ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200 dark:shadow-rose-950/50 ring-4 ring-rose-200 dark:ring-rose-900/50 animate-pulse"
              : "bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 hover:brightness-110 text-white shadow-rose-200 dark:shadow-rose-950/50 hover:shadow-xl ring-4 ring-rose-100 dark:ring-rose-900/40"
          }`}
          title={isRecording ? "Dừng nói và chấm điểm" : "Bắt đầu nói tiếng Nhật"}
        >
          {isEvaluating ? (
            <Loader2 className="w-8 h-8 animate-spin text-rose-600 dark:text-rose-400" />
          ) : isRecording ? (
            <Square className="w-7 h-7 fill-white" />
          ) : (
            <Mic className="w-8 h-8 animate-pulse" />
          )}
        </button>
      </div>

      {/* Status & Instructions */}
      <div className="text-center">
        {isEvaluating ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-full text-xs font-semibold text-rose-700 dark:text-rose-300 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
            AI đang phân tích 4 tiêu chí...
          </div>
        ) : isRecording ? (
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 font-mono font-bold text-xs rounded-full border border-rose-200/50 dark:border-rose-800/60">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Đang thu âm: {formatTime(durationSeconds)}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Nhấn vào nút đỏ khi nói xong</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Nhấn để bắt đầu nói</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Giao tiếp tự nhiên, không cần áp lực</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MicRecorder;
