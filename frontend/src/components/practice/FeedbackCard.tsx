import type { ProcessVoiceResponse } from "@/types";
import { Lightbulb, ArrowRight, RotateCcw } from "lucide-react";

interface FeedbackCardProps {
  evaluation: ProcessVoiceResponse;
  onRetry: () => void;
  onNext?: () => void;
  hasNext?: boolean;
  className?: string;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({
  evaluation,
  onRetry,
  onNext,
  hasNext = false,
  className = "",
}) => {
  const { scores, overallScore, feedback } = evaluation;

  // Rating and color scheme based on overall score
  const getScoreTheme = (score: number) => {
    if (score >= 85) {
      return {
        label: "Xuất sắc! (素晴らしい)",
        bg: "from-emerald-500 to-teal-600",
        text: "text-emerald-600",
        badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    }
    if (score >= 70) {
      return {
        label: "Rất tốt! (よくできました)",
        bg: "from-blue-500 to-cyan-600",
        text: "text-blue-600",
        badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
      };
    }
    if (score >= 50) {
      return {
        label: "Khá ổn! Cố gắng thêm nhé (頑張って)",
        bg: "from-amber-500 to-yellow-600",
        text: "text-amber-600",
        badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
      };
    }
    return {
      label: "Hãy luyện tập thêm một lần nữa",
      bg: "from-rose-500 to-orange-600",
      text: "text-rose-600",
      badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
    };
  };

  const theme = getScoreTheme(overallScore);

  const criteria = [
    {
      title: "Phát âm (Pronunciation)",
      score: scores?.pronunciation ?? overallScore,
      color: "bg-emerald-500",
    },
    {
      title: "Lưu loát (Fluency)",
      score: scores?.fluency ?? overallScore,
      color: "bg-blue-500",
    },
    {
      title: "Độ chính xác (Accuracy)",
      score: scores?.accuracy ?? overallScore,
      color: "bg-teal-500",
    },
    {
      title: "Độ đầy đủ (Completeness)",
      score: scores?.completeness ?? overallScore,
      color: "bg-indigo-500",
    },
  ];

  return (
    <div
      className={`bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-6 animate-in fade-in zoom-in-95 duration-200 ${className}`}
    >
      {/* Header with Overall Score Gauge */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div
            className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${theme.bg} text-white flex flex-col items-center justify-center shadow-md`}
          >
            <span className="text-3xl font-black leading-none">{overallScore}</span>
            <span className="text-2xs font-bold uppercase tracking-wider opacity-90">/ 100</span>
          </div>

          <div>
            <div className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border mb-1 ${theme.badgeBg}`}>
              {theme.label}
            </div>
            <h4 className="text-lg font-bold text-slate-800">Kết quả đánh giá phản xạ</h4>
            <p className="text-xs text-slate-500">Chấm điểm tự động bằng mô hình AI chuẩn Nhật</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRetry}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Luyện lại
          </button>
          {hasNext && onNext && (
            <button
              onClick={onNext}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <span>Câu kế tiếp</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4 Criteria Progress Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {criteria.map((item, idx) => (
          <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-600 font-semibold">{item.title}</span>
              <span className="font-bold text-slate-800">{item.score}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${item.color} rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${Math.max(5, item.score)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* AI Advice & Suggestions */}
      {(feedback?.generalAdvice || (feedback?.grammarSuggestions && feedback.grammarSuggestions.length > 0)) && (
        <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
            <Lightbulb className="w-4 h-4 text-emerald-600" />
            <span>Lời khuyên của gia sư AI</span>
          </div>

          {feedback.generalAdvice && (
            <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed font-medium">
              {feedback.generalAdvice}
            </p>
          )}

          {feedback.grammarSuggestions && feedback.grammarSuggestions.length > 0 && (
            <div className="space-y-1 pt-1">
              <span className="text-xs font-semibold text-emerald-900">Mẫu câu nói tự nhiên hơn:</span>
              <ul className="list-disc list-inside text-xs text-emerald-800 space-y-0.5 pl-1">
                {feedback.grammarSuggestions.map((sug, i) => (
                  <li key={i}>{sug}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedbackCard;
