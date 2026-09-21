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
            <span className="absolute w-28 h-28 rounded-full bg-emerald-500/20 animate-ping duration-1000" />
            <span className="absolute w-24 h-24 rounded-full bg-emerald-500/30 animate-pulse duration-700" />
          </>
        )}

        <button
          onClick={handleClick}
          disabled={disabled || isEvaluating}
          type="button"
          className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 active:scale-95 cursor-pointer ${
            isEvaluating
              ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              : isRecording
              ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200 ring-4 ring-rose-200"
              : "bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white shadow-emerald-200 hover:shadow-xl ring-4 ring-emerald-100"
          }`}
          title={isRecording ? "Dừng nói và chấm điểm" : "Bắt đầu nói tiếng Nhật"}
        >
          {isEvaluating ? (
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          ) : isRecording ? (
            <Square className="w-7 h-7 fill-white" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </button>
      </div>

      {/* Status & Instructions */}
      <div className="text-center">
        {isEvaluating ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            AI đang phân tích 4 tiêu chí...
          </div>
        ) : isRecording ? (
          <div className="space-y-1">
            <span className="inline-block px-2.5 py-0.5 bg-rose-100 text-rose-700 font-mono font-bold text-xs rounded-full">
              🔴 Đang thu âm: {formatTime(durationSeconds)}
            </span>
            <p className="text-xs text-slate-500 font-medium">Nhấn vào nút đỏ khi nói xong</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-slate-700">Nhấn để bắt đầu nói</p>
            <p className="text-xs text-slate-400">Giao tiếp tự nhiên, không cần áp lực</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MicRecorder;
