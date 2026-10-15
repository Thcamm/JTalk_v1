"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Volume2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Trophy,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Check,
  Zap,
  BookmarkPlus,
  Play,
  Award,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { soundEffects } from "@/utils/soundEffects";
import { translateToVietnamese } from "@/utils/japaneseMeaningTranslator";
import {
  generateVocabularyQuiz,
  type QuizItemSource,
  type QuizQuestion,
  type QuizQuestionType,
} from "@/utils/vocabularyQuizGenerator";

interface VocabularyQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  vocabList: QuizItemSource[];
  title?: string;
  defaultQuestionCount?: number;
  onSaveWrongWordsToNotebook?: (wrongWords: QuizItemSource[]) => Promise<void>;
  onEarnXp?: (xp: number) => void;
}

export function VocabularyQuizModal({
  isOpen,
  onClose,
  vocabList,
  title = "Bài Kiểm Tra Từ Vựng Trắc Nghiệm",
  defaultQuestionCount = 10,
  onSaveWrongWordsToNotebook,
  onEarnXp,
}: VocabularyQuizModalProps) {
  // Trạng thái màn hình: "setup" | "quiz" | "result"
  const [stage, setStage] = useState<"setup" | "quiz" | "result">("setup");

  // Setting bài kiểm tra
  const [questionCount, setQuestionCount] = useState<number>(defaultQuestionCount);
  const [selectedTypes, setSelectedTypes] = useState<QuizQuestionType[]>([
    "jp_to_vi",
    "vi_to_jp",
    "kanji_to_furi",
  ]);
  const [timeLimitPerQuestion, setTimeLimitPerQuestion] = useState<number>(0); // 0 = Không giới hạn, 15 = 15 giây

  // Trạng thái làm bài kiểm tra
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<
    Array<{
      questionId: string;
      selectedKey: "A" | "B" | "C" | "D" | null;
      isCorrect: boolean;
      timeSpent: number;
    }>
  >([]);

  // Đang chọn đáp án hiện tại
  const [selectedKey, setSelectedKey] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Câu hỏi đang mở rộng xem giải thích chi tiết ở màn hình kết quả
  const [expandedResultQuestionId, setExpandedResultQuestionId] = useState<string | null>(null);

  // Đang lưu các từ sai vào sổ tay
  const [isSavingWrongWords, setIsSavingWrongWords] = useState(false);
  const [savedWrongSuccess, setSavedWrongSuccess] = useState(false);

  // Cập nhật defaultQuestionCount khi mở modal
  useEffect(() => {
    if (isOpen) {
      setStage("setup");
      const safeCount = Math.min(
        Math.max(5, defaultQuestionCount),
        Math.max(5, vocabList.length)
      );
      setQuestionCount(safeCount);
      setUserAnswers([]);
      setSelectedKey(null);
      setIsAnswerSubmitted(false);
      setSavedWrongSuccess(false);
      setExpandedResultQuestionId(null);
    }
  }, [isOpen, defaultQuestionCount, vocabList.length]);

  // Hẹn giờ cho từng câu hỏi
  useEffect(() => {
    if (stage !== "quiz" || isAnswerSubmitted || timeLimitPerQuestion <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setTimeLeft(timeLimitPerQuestion);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage, currentIndex, isAnswerSubmitted, timeLimitPerQuestion]);

  if (!isOpen) return null;

  // Phát âm tiếng Nhật chuẩn
  const speakJapanese = (text?: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!text || typeof window === "undefined" || !("speechSynthesis" in window))
      return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      utterance.rate = 0.85;

      const jaVoice = window.speechSynthesis
        .getVoices()
        .find(
          (v) =>
            v.lang === "ja-JP" ||
            v.lang.startsWith("ja") ||
            v.name.toLowerCase().includes("japanese")
        );
      if (jaVoice) utterance.voice = jaVoice;

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech error:", err);
    }
  };

  // Khởi động bài kiểm tra
  const handleStartQuiz = () => {
    if (vocabList.length < 2) {
      toast.warning("Cần tối thiểu 2 từ vựng để tạo bài kiểm tra trắc nghiệm");
      return;
    }

    const generated = generateVocabularyQuiz(vocabList, {
      questionCount,
      types: selectedTypes.length > 0 ? selectedTypes : undefined,
    });

    if (generated.length === 0) {
      toast.error("Không thể tạo câu hỏi từ danh sách từ vựng này.");
      return;
    }

    setQuestions(generated);
    setCurrentIndex(0);
    setUserAnswers([]);
    setSelectedKey(null);
    setIsAnswerSubmitted(false);
    setSavedWrongSuccess(false);
    setStage("quiz");
    soundEffects.playTap();
  };

  // Xử lý hết giờ
  const handleTimeOut = () => {
    if (isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);
    soundEffects.playTap();

    const currQ = questions[currentIndex];
    setUserAnswers((prev) => [
      ...prev,
      {
        questionId: currQ.id,
        selectedKey: null,
        isCorrect: false,
        timeSpent: timeLimitPerQuestion,
      },
    ]);
  };

  // Chọn đáp án
  const handleSelectOption = (key: "A" | "B" | "C" | "D") => {
    if (isAnswerSubmitted) return;

    setSelectedKey(key);
    setIsAnswerSubmitted(true);

    const currQ = questions[currentIndex];
    const isCorrect = key === currQ.correctKey;

    if (isCorrect) {
      soundEffects.playGood();
    } else {
      soundEffects.playTap();
    }

    setUserAnswers((prev) => [
      ...prev,
      {
        questionId: currQ.id,
        selectedKey: key,
        isCorrect,
        timeSpent: timeLimitPerQuestion > 0 ? timeLimitPerQuestion - timeLeft : 0,
      },
    ]);
  };

  // Chuyển sang câu tiếp theo
  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedKey(null);
      setIsAnswerSubmitted(false);
    } else {
      // Đã hoàn thành toàn bộ bài thi
      finishQuiz();
    }
  };

  // Kết thúc bài thi và chuyển sang màn hình kết quả
  const finishQuiz = () => {
    setStage("result");

    const firstWrong = questions.find((q) => {
      const ans = userAnswers.find((a) => a.questionId === q.id);
      return !ans?.isCorrect;
    });
    setExpandedResultQuestionId(firstWrong ? firstWrong.id : (questions[0]?.id || null));

    const correctCount = userAnswers.filter((a) => a.isCorrect).length;
    const percentage = Math.round((correctCount / questions.length) * 100);

    if (percentage >= 80) {
      soundEffects.playSuccess();
    } else {
      soundEffects.playEncourage();
    }

    // Thưởng XP nếu có callback
    const earnedXp = Math.max(10, correctCount * 5);
    if (onEarnXp) {
      onEarnXp(earnedXp);
    }
  };

  // Danh sách từ làm sai
  const wrongQuestions = questions.filter((q) => {
    const ans = userAnswers.find((a) => a.questionId === q.id);
    return !ans?.isCorrect;
  });

  // Lưu các từ làm sai vào Sổ tay cá nhân
  const handleSaveWrongWords = async () => {
    if (!onSaveWrongWordsToNotebook || wrongQuestions.length === 0) return;

    try {
      setIsSavingWrongWords(true);
      await onSaveWrongWordsToNotebook(wrongQuestions.map((q) => q.sourceItem));
      soundEffects.playSuccess();
      toast.success(
        `Đã lưu ${wrongQuestions.length} từ vựng làm sai vào Sổ tay ôn tập của bạn!`
      );
      setSavedWrongSuccess(true);
    } catch {
      toast.error("Có lỗi xảy ra khi lưu từ vào sổ tay.");
    } finally {
      setIsSavingWrongWords(false);
    }
  };

  // Câu hỏi hiện tại
  const currentQuestion = questions[currentIndex];
  const correctCount = userAnswers.filter((a) => a.isCorrect).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs font-sans text-slate-800 dark:text-slate-100">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* ================= HEADER ================= */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/60 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-400/30 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                {title}
              </h3>
              <p className="text-3xs text-slate-500 dark:text-slate-400 font-medium">
                Kho {vocabList.length} từ vựng • Trắc nghiệm
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ================= NỘI DUNG CHÍNH THEO STAGE ================= */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* ========================================================================= */}
          {/* STAGE 1: CÀI ĐẶT BÀI KIỂM TRA (SETUP) */}
          {/* ========================================================================= */}
          {stage === "setup" && (
            <div className="space-y-6">
              {/* Giới thiệu */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/40 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
                    Thiết lập bài kiểm tra trắc nghiệm
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Hệ thống sẽ tự động xáo trộn và tạo câu hỏi kèm 3 đáp án gây nhiễu chính xác từ kho từ vựng đã chọn.
                  </p>
                </div>
              </div>

              {/* 1. Chọn số lượng câu hỏi */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>1. Số lượng câu hỏi muốn kiểm tra:</span>
                  <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400">
                    {questionCount} câu hỏi
                  </span>
                </label>

                {/* Chips chọn nhanh */}
                <div className="flex items-center gap-2 flex-wrap">
                  {[5, 10, 15, 20, 30].map((count) => {
                    if (count > vocabList.length && count !== 5) return null;
                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setQuestionCount(count)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          questionCount === count
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        {count} câu
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setQuestionCount(vocabList.length)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      questionCount === vocabList.length
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    Tất cả ({vocabList.length} câu)
                  </button>
                </div>

                {/* Range Slider tùy chỉnh */}
                <input
                  type="range"
                  min={Math.min(2, vocabList.length)}
                  max={Math.min(100, vocabList.length)}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer mt-2"
                />
              </div>

              {/* 2. Dạng câu hỏi ưu tiên */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
                  2. Dạng câu hỏi trắc nghiệm:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: "jp_to_vi" as QuizQuestionType,
                      title: "Nhật ➔ Việt",
                      desc: "Đọc từ tiếng Nhật, chọn nghĩa tiếng Việt",
                    },
                    {
                      id: "vi_to_jp" as QuizQuestionType,
                      title: "Việt ➔ Nhật",
                      desc: "Đọc nghĩa tiếng Việt, chọn từ tiếng Nhật",
                    },
                    {
                      id: "kanji_to_furi" as QuizQuestionType,
                      title: "Đọc Furigana",
                      desc: "Chọn cách đọc Hiragana cho chữ Hán",
                    },
                  ].map((t) => {
                    const isSelected = selectedTypes.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (selectedTypes.length > 1) {
                              setSelectedTypes(selectedTypes.filter((x) => x !== t.id));
                            } else {
                              toast.warning("Cần giữ ít nhất một dạng câu hỏi!");
                            }
                          } else {
                            setSelectedTypes([...selectedTypes, t.id]);
                          }
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 shadow-2xs"
                            : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {t.title}
                          </span>
                          {isSelected ? (
                            <Check size={14} className="text-indigo-600" />
                          ) : null}
                        </div>
                        <p className="text-3xs text-slate-500 leading-tight">
                          {t.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Tùy chọn Hẹn giờ */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
                  3. Thời gian trả lời mỗi câu:
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { value: 0, label: "Không giới hạn" },
                    { value: 10, label: "10 giây / câu" },
                    { value: 15, label: "15 giây / câu" },
                    { value: 25, label: "25 giây / câu" },
                  ].map((timer) => (
                    <button
                      key={timer.value}
                      type="button"
                      onClick={() => setTimeLimitPerQuestion(timer.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        timeLimitPerQuestion === timer.value
                          ? "bg-indigo-600 text-white shadow-2xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {timer.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nút Bắt đầu */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartQuiz}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:brightness-105 active:scale-98 text-white font-black text-xs sm:text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Play size={16} className="fill-white" />
                  <span>Bắt đầu làm bài kiểm tra ({questionCount} câu)</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STAGE 2: MÀN HÌNH LÀM BÀI TRẮC NGHIỆM (ACTIVE QUIZ) */}
          {/* ========================================================================= */}
          {stage === "quiz" && currentQuestion && (
            <div className="space-y-6">
              {/* Header tiến độ & Hẹn giờ */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    Câu {currentIndex + 1} / {questions.length}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-3xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {currentQuestion.type === "jp_to_vi"
                      ? "Nhật ➔ Việt"
                      : currentQuestion.type === "vi_to_jp"
                      ? "Việt ➔ Nhật"
                      : "Cách đọc Hiragana"}
                  </span>
                </div>

                {/* Hẹn giờ đếm ngược */}
                {timeLimitPerQuestion > 0 && (
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                      timeLeft <= 5
                        ? "bg-rose-500/20 text-rose-500 animate-pulse border border-rose-500/40"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <Clock size={13} />
                    <span>{timeLeft}s</span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-rose-500 transition-all duration-300"
                  style={{
                    width: `${((currentIndex + 1) / questions.length) * 100}%`,
                  }}
                />
              </div>

              {/* THẺ CÂU HỎI */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-rose-500/5 border-2 border-indigo-200/80 dark:border-indigo-900/50 text-center space-y-3 relative shadow-xs">
                <div className="text-3xs uppercase tracking-widest font-black text-indigo-600 dark:text-indigo-400">
                  Câu hỏi kiểm tra:
                </div>

                <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-wide">
                  {currentQuestion.questionText}
                </div>

                {currentQuestion.questionSubText && (
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {currentQuestion.questionSubText}
                  </div>
                )}

                {/* Loa phát âm */}
                {currentQuestion.audioText && (
                  <button
                    type="button"
                    onClick={(e) => speakJapanese(currentQuestion.audioText, e)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Volume2 size={14} />
                    <span>Nghe phát âm</span>
                  </button>
                )}
              </div>

              {/* 4 ĐÁP ÁN A, B, C, D */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQuestion.options.map((option) => {
                  const isChosen = selectedKey === option.key;
                  const isCorrect = option.key === currentQuestion.correctKey;

                  let style =
                    "bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-800 dark:text-slate-100";

                  if (isAnswerSubmitted) {
                    if (isCorrect) {
                      style =
                        "bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-md shadow-emerald-500/20";
                    } else if (isChosen && !isCorrect) {
                      style =
                        "bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 text-rose-800 dark:text-rose-300 shadow-md shadow-rose-500/20";
                    } else {
                      style =
                        "opacity-50 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800";
                    }
                  }

                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => handleSelectOption(option.key)}
                      disabled={isAnswerSubmitted}
                      className={`p-4 rounded-2xl text-left transition-all flex items-center justify-between gap-3 cursor-pointer select-none active:scale-98 ${style}`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isAnswerSubmitted && isCorrect
                              ? "bg-emerald-500 text-white"
                              : isAnswerSubmitted && isChosen && !isCorrect
                              ? "bg-rose-500 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {option.key}
                        </span>

                        <div>
                          <div className="text-xs sm:text-sm font-bold leading-tight">
                            {option.text}
                          </div>
                          {option.subText && (
                            <div className="text-3xs text-slate-400 font-mono mt-0.5">
                              {option.subText}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Icon kết quả */}
                      {isAnswerSubmitted && isCorrect && (
                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                      )}
                      {isAnswerSubmitted && isChosen && !isCorrect && (
                        <XCircle size={18} className="text-rose-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Giải thích chi tiết sau khi chọn đáp án */}
              {isAnswerSubmitted && (() => {
                const selectedOption = currentQuestion.options.find((o) => o.key === selectedKey);
                const correctOption = currentQuestion.options.find((o) => o.key === currentQuestion.correctKey);
                const isCorrect = selectedKey === currentQuestion.correctKey;

                return (
                  <div
                    className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 animate-fade-in shadow-xs ${
                      isCorrect
                        ? "bg-emerald-50/80 dark:bg-emerald-950/25 border-emerald-300 dark:border-emerald-800/60"
                        : "bg-rose-50/80 dark:bg-rose-950/25 border-rose-300 dark:border-rose-800/60"
                    }`}
                  >
                    {/* Header thông báo kết quả */}
                    <div className="flex items-center justify-between gap-2 border-b pb-2.5 border-slate-200/60 dark:border-slate-800/60">
                      <div className="flex items-center gap-2">
                        {isCorrect ? (
                          <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
                        )}
                        <span
                          className={`text-xs sm:text-sm font-black ${
                            isCorrect
                              ? "text-emerald-700 dark:text-emerald-300"
                              : "text-rose-700 dark:text-rose-300"
                          }`}
                        >
                          {isCorrect
                            ? "🎉 Chính xác! Bạn đã ghi nhớ từ này rất tốt"
                            : "❌ Chưa chính xác! Cùng xem đối chiếu để nhớ từ này nhé"}
                        </span>
                      </div>

                      <span className="text-3xs font-extrabold px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider shrink-0">
                        Đáp án đúng: {currentQuestion.correctKey}
                      </span>
                    </div>

                    {/* Khung đối chiếu so sánh trực quan khi chọn sai */}
                    {!isCorrect && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {/* Lựa chọn của bạn */}
                        <div className="p-3 rounded-xl bg-rose-100/60 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/50 space-y-1">
                          <div className="text-3xs font-black uppercase text-rose-700 dark:text-rose-300 flex items-center gap-1">
                            <XCircle size={12} />
                            <span>Bạn đã chọn: ({selectedKey || "Hết giờ"})</span>
                          </div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {selectedOption
                              ? (currentQuestion.type === "jp_to_vi"
                                  ? translateToVietnamese(selectedOption.detailKanji, selectedOption.text)
                                  : selectedOption.text)
                              : "Chưa chọn kịp (Hết giờ)"}
                          </div>
                          {selectedOption && (
                            <div className="text-3xs text-rose-800 dark:text-rose-200 font-medium">
                              💡 Nghĩa của từ này:{" "}
                              <span className="font-bold underline">
                                {translateToVietnamese(
                                  selectedOption.detailKanji,
                                  selectedOption.detailMeaning || selectedOption.text
                                )}
                              </span>
                              {selectedOption.detailKanji && selectedOption.detailKanji !== selectedOption.text && (
                                <span className="ml-1 opacity-80">({selectedOption.detailKanji})</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Đáp án chính xác */}
                        <div className="p-3 rounded-xl bg-emerald-100/60 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 space-y-1">
                          <div className="text-3xs font-black uppercase text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            <span>Đáp án đúng: ({currentQuestion.correctKey})</span>
                          </div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {correctOption?.text}
                          </div>
                          <div className="text-3xs text-emerald-800 dark:text-emerald-200 font-medium">
                            💡 Nghĩa chuẩn: <span className="font-bold underline">{currentQuestion.explanation.meaning}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Chi tiết từ vựng và câu ví dụ */}
                    <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
                            {currentQuestion.explanation.kanji}
                          </span>
                          {currentQuestion.explanation.furigana && (
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold font-mono">
                              【{currentQuestion.explanation.furigana}】
                            </span>
                          )}
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            : {currentQuestion.explanation.meaning}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => speakJapanese(currentQuestion.audioText, e)}
                          className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shrink-0 cursor-pointer"
                          title="Nghe phát âm từ vựng"
                        >
                          <Volume2 size={16} />
                        </button>
                      </div>

                      {/* Câu ví dụ ngữ cảnh */}
                      {currentQuestion.explanation.exampleSentence && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="text-slate-900 dark:text-slate-100 font-medium text-xs">
                              {currentQuestion.explanation.exampleSentence}
                            </div>
                            <div className="text-3xs text-slate-500 dark:text-slate-400 italic">
                              {currentQuestion.explanation.exampleTranslation}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => speakJapanese(currentQuestion.explanation.exampleSentence, e)}
                            className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0 cursor-pointer"
                            title="Nghe câu ví dụ"
                          >
                            <Volume2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Nút Câu tiếp theo */}
                    <div className="pt-1 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-xs inline-flex items-center gap-2 shadow-md shadow-indigo-600/30 cursor-pointer transition-all"
                      >
                        <span>
                          {currentIndex < questions.length - 1
                            ? "Câu tiếp theo"
                            : "Xem kết quả bài thi"}
                        </span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STAGE 3: MÀN HÌNH KẾT QUẢ & TỔNG KẾT (RESULT SUMMARY) */}
          {/* ========================================================================= */}
          {stage === "result" && (
            <div className="space-y-6">
              {/* Card Tổng kết điểm */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-rose-500/10 border-2 border-indigo-200/80 dark:border-indigo-900/50 text-center space-y-3 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-400/30 flex items-center justify-center mx-auto shadow-md">
                  <Trophy size={28} />
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    Kết Quả Bài Kiểm Tra
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {correctCount >= questions.length * 0.9
                      ? "🏆 Xuất sắc! Bạn đã ghi nhớ từ vựng rất vững vàng!"
                      : correctCount >= questions.length * 0.7
                      ? "🎉 Làm tốt lắm! Tiếp tục duy trì phong độ nhé!"
                      : "💪 Đừng nản lòng! Hãy ôn lại các từ chưa thuộc trong Sổ tay nhé!"}
                  </p>
                </div>

                {/* Điểm số */}
                <div className="flex items-center justify-center gap-6 py-2">
                  <div>
                    <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider block">
                      Đúng
                    </span>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {correctCount} / {questions.length}
                    </span>
                  </div>

                  <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />

                  <div>
                    <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider block">
                      Tỷ lệ
                    </span>
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      {Math.round((correctCount / questions.length) * 100)}%
                    </span>
                  </div>

                  <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />

                  <div>
                    <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider block">
                      Thưởng XP
                    </span>
                    <span className="text-2xl font-black text-amber-500 flex items-center gap-1 justify-center">
                      <Zap size={18} className="fill-amber-500" />
                      +{Math.max(10, correctCount * 5)}
                    </span>
                  </div>
                </div>

                {/* Nút lưu từ sai vào Sổ tay */}
                {wrongQuestions.length > 0 && onSaveWrongWordsToNotebook && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSaveWrongWords}
                      disabled={isSavingWrongWords || savedWrongSuccess}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        savedWrongSuccess
                          ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-300 cursor-default"
                          : "bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30"
                      }`}
                    >
                      {savedWrongSuccess ? (
                        <>
                          <Check size={14} />
                          <span>Đã lưu {wrongQuestions.length} từ sai vào Sổ tay!</span>
                        </>
                      ) : (
                        <>
                          <BookmarkPlus size={14} />
                          <span>
                            {isSavingWrongWords
                              ? "Đang lưu..."
                              : `Lưu ${wrongQuestions.length} từ làm sai vào Sổ tay để ôn`}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Danh sách review câu hỏi */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-200 px-1">
                  <span>Chi tiết từng câu hỏi ({questions.length} câu):</span>
                  <span className="text-3xs font-semibold text-slate-400">
                    Bấm vào câu bất kỳ để xem đối chiếu & giải thích
                  </span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {questions.map((q, idx) => {
                    const ans = userAnswers.find((a) => a.questionId === q.id);
                    const isRight = ans?.isCorrect;
                    const isExpanded = expandedResultQuestionId === q.id;
                    const selectedOpt = q.options.find((o) => o.key === ans?.selectedKey);
                    const correctOpt = q.options.find((o) => o.key === q.correctKey);

                    return (
                      <div
                        key={q.id}
                        className={`rounded-2xl border text-xs overflow-hidden transition-all ${
                          isRight
                            ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40"
                            : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40"
                        }`}
                      >
                        {/* Header của từng câu */}
                        <div
                          onClick={() => setExpandedResultQuestionId(isExpanded ? null : q.id)}
                          className="p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-5 h-5 rounded-lg flex items-center justify-center font-bold text-3xs shrink-0 ${
                                isRight
                                  ? "bg-emerald-500 text-white"
                                  : "bg-rose-500 text-white"
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                                <span>{q.questionText}</span>
                                {q.questionSubText && (
                                  <span className="text-3xs font-normal text-slate-500">({q.questionSubText})</span>
                                )}
                              </div>
                              <div className="text-3xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                                <span>
                                  Đáp án: <strong className="text-emerald-600 dark:text-emerald-400">({q.correctKey}) {q.explanation.meaning}</strong>
                                </span>
                                {!isRight && (
                                  <span className="text-rose-500 font-semibold">
                                    • Bạn chọn: ({ans?.selectedKey || "Trống"})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => speakJapanese(q.audioText, e)}
                              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Nghe phát âm"
                            >
                              <Volume2 size={15} />
                            </button>
                            <button
                              type="button"
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </div>
                        </div>

                        {/* Nội dung giải thích chi tiết khi click mở rộng */}
                        {isExpanded && (
                          <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2.5 bg-white/50 dark:bg-slate-900/40 animate-fade-in">
                            {/* Phân tích đáp án đã chọn vs đáp án đúng */}
                            {!isRight && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs pt-1">
                                <div className="p-2.5 rounded-xl bg-rose-100/60 dark:bg-rose-900/30 border border-rose-200/80 dark:border-rose-800/40">
                                  <div className="font-bold text-rose-700 dark:text-rose-300">
                                    ❌ Bạn đã chọn: ({ans?.selectedKey || "Không chọn"}){" "}
                                    {selectedOpt
                                      ? (q.type === "jp_to_vi"
                                          ? translateToVietnamese(selectedOpt.detailKanji, selectedOpt.text)
                                          : selectedOpt.text)
                                      : "Chưa chọn"}
                                  </div>
                                  {selectedOpt && (
                                    <div className="text-3xs text-rose-800 dark:text-rose-200 mt-0.5">
                                      Nghĩa của từ này:{" "}
                                      <span className="font-bold underline">
                                        {translateToVietnamese(
                                          selectedOpt.detailKanji,
                                          selectedOpt.detailMeaning || selectedOpt.text
                                        )}
                                      </span>
                                      {selectedOpt.detailKanji && selectedOpt.detailKanji !== selectedOpt.text && (
                                        <span className="ml-1 opacity-80">({selectedOpt.detailKanji})</span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="p-2.5 rounded-xl bg-emerald-100/60 dark:bg-emerald-900/30 border border-emerald-200/80 dark:border-emerald-800/40">
                                  <div className="font-bold text-emerald-700 dark:text-emerald-300">
                                    ✅ Đáp án đúng: ({q.correctKey}) {correctOpt?.text}
                                  </div>
                                  <div className="text-3xs text-emerald-800 dark:text-emerald-200 mt-0.5">
                                    Nghĩa chuẩn: <span className="font-bold underline">{q.explanation.meaning}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Chi tiết từ vựng và câu ví dụ */}
                            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-2xs">
                              <div className="flex items-center justify-between">
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                  <span className="font-black text-slate-900 dark:text-white text-xs">
                                    {q.explanation.kanji}
                                  </span>
                                  {q.explanation.furigana && (
                                    <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">
                                      【{q.explanation.furigana}】
                                    </span>
                                  )}
                                  <span className="text-slate-600 dark:text-slate-300">
                                    : {q.explanation.meaning}
                                  </span>
                                </div>
                              </div>

                              {q.explanation.exampleSentence && (
                                <div className="text-3xs text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                  <span>
                                    Ví dụ: {q.explanation.exampleSentence} ({q.explanation.exampleTranslation})
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => speakJapanese(q.explanation.exampleSentence, e)}
                                    className="p-1 text-slate-400 hover:text-indigo-600 shrink-0 cursor-pointer"
                                    title="Nghe câu ví dụ"
                                  >
                                    <Volume2 size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                >
                  Đóng bài thi
                </button>

                <button
                  type="button"
                  onClick={() => setStage("setup")}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer transition-all"
                >
                  <RotateCcw size={14} />
                  <span>Làm lại bài kiểm tra</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VocabularyQuizModal;
