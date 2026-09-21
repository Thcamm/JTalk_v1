import { useState } from "react";
import type { WordFeedback } from "@/types";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface WordHighlightProps {
  wordFeedback?: WordFeedback[];
  fallbackText?: string;
  className?: string;
}

export const WordHighlight: React.FC<WordHighlightProps> = ({
  wordFeedback,
  fallbackText,
  className = "",
}) => {
  const [selectedWord, setSelectedWord] = useState<WordFeedback | null>(null);

  if (!wordFeedback || wordFeedback.length === 0) {
    if (!fallbackText) return null;
    return (
      <div className={`p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80 rounded-2xl ${className}`}>
        <p className="text-base text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
          {fallbackText}
        </p>
      </div>
    );
  }

  const correctCount = wordFeedback.filter((w) => w.isCorrect).length;
  const accuracyPercent = Math.round((correctCount / wordFeedback.length) * 100);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Legend & Stats */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="font-medium text-emerald-700 dark:text-emerald-300">Phát âm chuẩn</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span className="font-medium text-rose-700 dark:text-rose-300">Cần chỉnh sửa</span>
          </span>
        </div>
        <div className="font-semibold text-slate-600 dark:text-slate-400">
          Chính xác: <span className="text-emerald-600 dark:text-emerald-400">{accuracyPercent}%</span> ({correctCount}/{wordFeedback.length})
        </div>
      </div>

      {/* Words Grid / Flow */}
      <div className="flex flex-wrap gap-2 p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs transition-colors">
        {wordFeedback.map((item, index) => {
          const isSelected = selectedWord === item;

          return (
            <button
              key={`${item.word}-${index}`}
              onClick={() => setSelectedWord(isSelected ? null : item)}
              type="button"
              className={`group relative inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-base font-semibold border transition-all duration-150 cursor-pointer ${
                item.isCorrect
                  ? "bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
                  : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60 animate-pulse-subtle"
              } ${isSelected ? "ring-2 ring-offset-1 ring-blue-400" : ""}`}
            >
              <span>{item.word}</span>
              {item.isCorrect ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 opacity-60 group-hover:opacity-100 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Popover / Detail for selected word */}
      {selectedWord && (
        <div
          className={`p-3.5 rounded-xl border text-sm animate-in fade-in slide-in-from-top-1 duration-150 ${
            selectedWord.isCorrect
              ? "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100"
              : "bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-base">Từ: 「{selectedWord.word}」</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/70 dark:bg-slate-900/70">
              {selectedWord.isCorrect ? "Chính xác ✓" : `Lỗi: ${selectedWord.errorType || "Phát âm"}`}
            </span>
          </div>

          {selectedWord.suggestion && (
            <p className="mt-1 text-xs leading-relaxed">
              <strong>Gợi ý AI:</strong> {selectedWord.suggestion}
            </p>
          )}
          {selectedWord.accuracyScore !== undefined && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Điểm tương đồng âm: <strong>{selectedWord.accuracyScore}/100</strong>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default WordHighlight;
