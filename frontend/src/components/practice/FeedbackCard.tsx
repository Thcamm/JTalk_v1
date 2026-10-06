import { useState, useRef, useEffect } from "react";
import type { ProcessVoiceResponse } from "@/types";
import {
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Play,
  Pause,
  Volume2,
  Mic,
  Headphones,
} from "lucide-react";

interface FeedbackCardProps {
  evaluation: ProcessVoiceResponse;
  userAudioUrl?: string | null;
  nativeSentence?: string;
  onPlayNative?: (text?: string) => void;
  onRetry: () => void;
  onNext?: () => void;
  hasNext?: boolean;
  className?: string;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({
  evaluation,
  userAudioUrl,
  nativeSentence,
  onPlayNative,
  onRetry,
  onNext,
  hasNext = false,
  className = "",
}) => {
  const { scores, overallScore, feedback } = evaluation;

  // User recorded audio player state
  const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false);
  const [userAudioProgress, setUserAudioProgress] = useState(0);
  const userAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = userAudioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setUserAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlayingUserAudio(false);
      setUserAudioProgress(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      try {
        audio.pause();
      } catch (_) {}
    };
  }, [userAudioUrl]);

  const toggleUserAudio = () => {
    if (!userAudioRef.current) return;
    if (isPlayingUserAudio) {
      userAudioRef.current.pause();
      setIsPlayingUserAudio(false);
    } else {
      userAudioRef.current.play().then(() => setIsPlayingUserAudio(true)).catch(console.error);
    }
  };

  // Rating and color scheme based on overall score
  const getScoreTheme = (score: number) => {
    if (score >= 85) {
      return {
        label: "Xuất sắc! (素晴らしい)",
        bg: "from-rose-500 via-rose-600 to-amber-500",
        text: "text-rose-600 dark:text-rose-400",
        badgeBg: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
      };
    }
    if (score >= 70) {
      return {
        label: "Rất tốt! (よくできました)",
        bg: "from-amber-500 to-yellow-600",
        text: "text-amber-600 dark:text-amber-400",
        badgeBg: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      };
    }
    if (score >= 50) {
      return {
        label: "Khá ổn! Cố gắng thêm nhé (頑張って)",
        bg: "from-blue-500 to-indigo-600",
        text: "text-blue-600 dark:text-blue-400",
        badgeBg: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      };
    }
    return {
      label: "Hãy luyện tập thêm một lần nữa",
      bg: "from-slate-600 to-slate-800",
      text: "text-slate-600 dark:text-slate-400",
      badgeBg: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    };
  };

  const theme = getScoreTheme(overallScore);

  const criteria = [
    {
      title: "Phát âm (Pronunciation)",
      score: scores?.pronunciation ?? overallScore,
      color: "bg-rose-500",
    },
    {
      title: "Lưu loát (Fluency)",
      score: scores?.fluency ?? overallScore,
      color: "bg-amber-500",
    },
    {
      title: "Độ chính xác (Accuracy)",
      score: scores?.accuracy ?? overallScore,
      color: "bg-indigo-500",
    },
    {
      title: "Độ đầy đủ (Completeness)",
      score: scores?.completeness ?? overallScore,
      color: "bg-emerald-500",
    },
  ];

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-6 animate-in fade-in zoom-in-95 duration-200 transition-colors ${className}`}
    >
      {/* Header with Overall Score Gauge */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
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
            <h4 className="text-lg font-bold text-slate-800 dark:text-white">Kết quả đánh giá phản xạ</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Chấm điểm tự động bằng mô hình AI chuẩn Nhật</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRetry}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Luyện lại
          </button>
          {hasNext && onNext && (
            <button
              onClick={onNext}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:brightness-105 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
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
          <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-600 dark:text-slate-300 font-semibold">{item.title}</span>
              <span className="font-bold text-slate-800 dark:text-white">{item.score}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${item.color} rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${Math.max(5, item.score)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* AUDIO COMPARISON: Nghe lại giọng thu âm & Đối chiếu giọng mẫu */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-rose-50/40 to-slate-50 dark:from-slate-800/60 dark:via-rose-950/20 dark:to-slate-800/60 border border-slate-200 dark:border-slate-700/70 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-rose-500" />
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Đối chiếu âm thanh phát âm
            </h5>
          </div>
          <span className="text-[11px] text-slate-400">So sánh ngữ điệu & trường âm</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* 1. User Recorded Audio Playback */}
          <div className="p-3 bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/50 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <Mic className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                  Giọng thu âm của bạn
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {userAudioUrl ? (isPlayingUserAudio ? "Đang phát..." : "Bấm để nghe lại") : "Ghi âm trực tiếp"}
                </span>
              </div>
            </div>

            {userAudioUrl ? (
              <div className="flex items-center gap-2">
                <audio ref={userAudioRef} src={userAudioUrl} preload="auto" className="hidden" />
                <button
                  type="button"
                  onClick={toggleUserAudio}
                  className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  {isPlayingUserAudio ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" /> Dừng
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" /> Nghe
                    </>
                  )}
                </button>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400 italic">Đã xử lý âm</span>
            )}
          </div>

          {/* 2. Native Model Audio Playback */}
          <div className="p-3 bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900/50 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shrink-0">
                <Volume2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                  Giọng mẫu bản xứ
                </span>
                <span className="text-[11px] text-slate-400 block">Phát âm Tokyo chuẩn</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onPlayNative?.(nativeSentence || evaluation.targetSentence)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Volume2 className="w-3.5 h-3.5" /> Nghe mẫu
            </button>
          </div>
        </div>

        {/* User audio progress indicator */}
        {isPlayingUserAudio && (
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden mt-1">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-100"
              style={{ width: `${userAudioProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* AI Advice & Suggestions */}
      {(feedback?.generalAdvice || (feedback?.grammarSuggestions && feedback.grammarSuggestions.length > 0)) && (
        <div className="p-4 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 rounded-2xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
            <Lightbulb className="w-4 h-4 text-amber-500 animate-spin-slow" />
            <span>Lời khuyên của gia sư AI</span>
          </div>

          {feedback.generalAdvice && (
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {feedback.generalAdvice}
            </p>
          )}

          {feedback.grammarSuggestions && feedback.grammarSuggestions.length > 0 && (
            <div className="space-y-1 pt-1">
              <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">Mẫu câu nói tự nhiên hơn:</span>
              <ul className="list-disc list-inside text-xs text-amber-800 dark:text-amber-300 space-y-0.5 pl-1">
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
