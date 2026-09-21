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
      <div className={`p-4 bg-slate-50 border border-slate-100 rounded-2xl ${className}`}>
        <p className="text-base text-slate-800 font-medium leading-relaxed">
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
      <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="font-medium text-emerald-700">Phát âm chuẩn</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span className="font-medium text-rose-700">Cần chỉnh sửa</span>
          </span>
        </div>
        <div className="font-semibold text-slate-600">
          Chính xác: <span className="text-emerald-600">{accuracyPercent}%</span> ({correctCount}/{wordFeedback.length})
        </div>
      </div>

      {/* Words Grid / Flow */}
      <div className="flex flex-wrap gap-2 p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        {wordFeedback.map((item, index) => {
          const isSelected = selectedWord === item;

          return (
            <button
              key={`${item.word}-${index}`}
              onClick={() => setSelectedWord(isSelected ? null : item)}
              type="button"
              className={`group relative inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-base font-semibold border transition-all duration-150 cursor-pointer ${
                item.isCorrect
                  ? "bg-emerald-50/80 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                  : "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 animate-pulse-subtle"
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
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-base">Từ: 「{selectedWord.word}」</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/70">
              {selectedWord.isCorrect ? "Chính xác ✓" : `Lỗi: ${selectedWord.errorType || "Phát âm"}`}
            </span>
          </div>

          {selectedWord.suggestion && (
            <p className="mt-1 text-xs leading-relaxed">
              <strong>Gợi ý AI:</strong> {selectedWord.suggestion}
            </p>
          )}
          {selectedWord.accuracyScore !== undefined && (
            <p className="mt-0.5 text-xs text-slate-500">
              Điểm tương đồng âm: <strong>{selectedWord.accuracyScore}/100</strong>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default WordHighlight;
