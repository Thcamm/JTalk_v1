"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  BookOpen,
  Layers,
  Search,
  Plus,
  Volume2,
  CheckCircle2,
  Circle,
  Trash2,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Sparkles,
  Filter,
  Check,
  X,
  Eye,
  EyeOff,
  Flame,
  BrainCircuit,
  Clock,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  vocabularyService,
  DEFAULT_STARTER_VOCABULARY,
} from "@/services/vocabulary.service";
import { userService } from "@/services/user.service";
import { soundEffects } from "@/utils/soundEffects";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/useAuthStore";
import type { VocabularyItem, CreateVocabularyPayload } from "@/types";

export default function VocabularyNotebookPage() {
  const { user, isPremium, bonusPractices, canEarnBonus, fetchMe } = useAuth();
  const [activeTab, setActiveTab] = useState<"notebook" | "flashcard">("notebook");
  const [vocabularies, setVocabularies] = useState<VocabularyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dueCount, setDueCount] = useState<number>(0);
  const [isReviewingSRS, setIsReviewingSRS] = useState(false);
  const [claimingBonus, setClaimingBonus] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const reviewsToday = user?.dailyUsage?.vocabReviewsToday ?? user?.quota?.vocabReviewsToday ?? 0;
  const reviewsTarget = (bonusPractices + 1) * 5;
  const canClaimBonusNow = canEarnBonus && reviewsToday >= reviewsTarget;

  const handleClaimBonusInNotebook = async () => {
    try {
      setClaimingBonus(true);
      const res = await userService.claimPracticeBonus();
      if (res.success) {
        soundEffects.playSuccess();
        toast.success(res.message);
        await fetchMe();
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Chưa đủ điều kiện đổi lượt nói."
      );
    } finally {
      setClaimingBonus(false);
    }
  };

  // Flashcard Deck State
  const [cardIndex, setCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [showFuriganaOnFront, setShowFuriganaOnFront] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Form State for Add Word
  const [formData, setFormData] = useState<CreateVocabularyPayload>({
    kanji: "",
    furigana: "",
    romaji: "",
    meaning: "",
    level: "N5",
    wordType: "phrase",
    exampleSentence: "",
    exampleTranslation: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load initial vocabularies and due count
  const loadVocabularies = useCallback(async () => {
    setIsLoading(true);
    try {
      const [items, due] = await Promise.all([
        vocabularyService.getVocabularies({
          level: selectedLevel,
          isMastered: selectedStatus === "due" ? "all" : selectedStatus,
          isDue: selectedStatus === "due" ? "true" : undefined,
          search: searchQuery,
        }),
        vocabularyService.getDueCount(),
      ]);
      setVocabularies(items.length > 0 ? items : DEFAULT_STARTER_VOCABULARY);
      setDueCount(due);
    } catch {
      setVocabularies(DEFAULT_STARTER_VOCABULARY);
    } finally {
      setIsLoading(false);
    }
  }, [selectedLevel, selectedStatus, searchQuery]);

  useEffect(() => {
    loadVocabularies();
  }, [loadVocabularies]);

  // SRS Stage Info Helper
  const getSRSStageInfo = (stage: number = 0) => {
    switch (stage) {
      case 1:
        return { label: "Bắt đầu", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300" };
      case 2:
        return { label: "Nhận biết", color: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-300" };
      case 3:
        return { label: "Củng cố", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300" };
      case 4:
        return { label: "Thành thạo", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300" };
      case 5:
        return { label: "Bậc thầy", color: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300" };
      default:
        return { label: "Mới lưu", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300" };
    }
  };

  // Speech synthesis for native Japanese audio
  const speakJapanese = (text: string) => {
    if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.info("Trình duyệt không hỗ trợ phát âm tiếng Nhật.");
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      utterance.rate = 0.85;

      const voices = window.speechSynthesis.getVoices();
      const jaVoice = voices.find(
        (v) =>
          v.lang === "ja-JP" ||
          v.lang.startsWith("ja") ||
          v.name.toLowerCase().includes("japanese")
      );
      if (jaVoice) {
        utterance.voice = jaVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("SpeechSynthesis error:", e);
      setIsSpeaking(false);
    }
  };

  // Handle Spaced Repetition Review (SM-2)
  const handleReviewSRS = async (
    item: VocabularyItem,
    rating: "again" | "hard" | "good" | "easy",
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();
    if (isReviewingSRS) return;
    setIsReviewingSRS(true);

    // Play micro sound feedback
    if (rating === "again") soundEffects.playTap();
    else if (rating === "hard") soundEffects.playEncourage();
    else if (rating === "good") soundEffects.playGood();
    else soundEffects.playSuccess();

    try {
      const res = await vocabularyService.reviewSRS(item._id, rating);
      const updated = res.item || {
        ...item,
        srsStage: res.srsStage,
        interval: res.interval,
        nextReviewDate: res.nextReviewDate,
        isMastered: res.srsStage >= 4,
      };

      setVocabularies((prev) =>
        prev.map((v) => (v._id === item._id ? { ...v, ...updated } : v))
      );

      if (res.totalXp) {
        useAuthStore.getState().updateUserGamification({
          totalXp: res.totalXp,
          level: res.level,
        });
      }

      const anyRes = res as any;
      if (typeof anyRes.vocabReviewsToday === "number") {
        useAuthStore.getState().updateUserDailyUsage({
          practiceCount: user?.dailyUsage?.practiceCount || 0,
          vocabReviewsToday: anyRes.vocabReviewsToday,
        });
      }

      if (anyRes.canClaimBonus) {
        soundEffects.playSuccess();
        toast.success("🎉 Bạn đã ôn đủ 5 thẻ từ vựng! Hãy bấm nhận +1 lượt nói miễn phí hôm nay ⚡", {
          duration: 5000,
        });
      }

      const ratingNames = {
        again: "🔴 Quên - Ôn lại sau 1 ngày",
        hard: "🟡 Khó - Chu kỳ ngắn",
        good: "🟢 Nhớ tốt - +5 XP!",
        easy: "⚡ Rất dễ - Chu kỳ dài (+5 XP!)",
      };
      toast.success(ratingNames[rating]);

      setDueCount((prev) => Math.max(0, prev - 1));

      // Auto advance to next flashcard
      setTimeout(() => {
        handleNextCard();
      }, 300);
    } catch {
      // Local fallback
      let newStage = item.srsStage || 0;
      if (rating === "again") newStage = Math.max(0, newStage - 1);
      else if (rating === "hard") newStage = Math.min(5, Math.max(1, newStage));
      else newStage = Math.min(5, newStage + 1);

      setVocabularies((prev) =>
        prev.map((v) =>
          v._id === item._id
            ? {
                ...v,
                srsStage: newStage,
                isMastered: newStage >= 4,
              }
            : v
        )
      );

      toast.success("Đã ghi nhận ôn tập thẻ! +5 XP");
      setTimeout(() => {
        handleNextCard();
      }, 300);
    } finally {
      setIsReviewingSRS(false);
    }
  };

  // Toggle Mastered state
  const handleToggleMastered = async (item: VocabularyItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const updated = await vocabularyService.toggleMastered(item._id, !item.isMastered);
      setVocabularies((prev) =>
        prev.map((v) => (v._id === item._id ? { ...v, isMastered: updated.isMastered } : v))
      );
      toast.success(
        !item.isMastered
          ? `Đã đánh dấu thuộc từ "${item.kanji}"!`
          : `Đã đưa từ "${item.kanji}" vào mục cần ôn tập.`
      );
    } catch {
      // Local fallback
      setVocabularies((prev) =>
        prev.map((v) => (v._id === item._id ? { ...v, isMastered: !v.isMastered } : v))
      );
      toast.success("Đã cập nhật trạng thái từ vựng!");
    }
  };

  // Delete Vocabulary
  const handleDeleteWord = async (id: string, kanji: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm(`Bạn có chắc muốn xóa từ "${kanji}" khỏi sổ tay không?`)) return;

    try {
      await vocabularyService.deleteVocabulary(id);
      setVocabularies((prev) => prev.filter((v) => v._id !== id));
      toast.success(`Đã xóa từ "${kanji}" khỏi sổ tay.`);
    } catch {
      setVocabularies((prev) => prev.filter((v) => v._id !== id));
      toast.success(`Đã xóa từ "${kanji}".`);
    }
  };

  // Add Word Handler
  const handleAddWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kanji.trim() || !formData.meaning.trim()) {
      toast.error("Vui lòng nhập từ tiếng Nhật và nghĩa tiếng Việt.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await vocabularyService.createVocabulary(formData);
      setVocabularies((prev) => [created, ...prev]);
      toast.success(`Đã thêm từ "${formData.kanji}" vào sổ tay!`);
      setIsAddModalOpen(false);
      setFormData({
        kanji: "",
        furigana: "",
        romaji: "",
        meaning: "",
        level: "N5",
        wordType: "phrase",
        exampleSentence: "",
        exampleTranslation: "",
      });
    } catch {
      // Offline fallback
      const localItem: VocabularyItem = {
        _id: "local-" + Date.now(),
        kanji: formData.kanji.trim(),
        furigana: formData.furigana?.trim(),
        romaji: formData.romaji?.trim(),
        meaning: formData.meaning.trim(),
        level: formData.level || "N5",
        wordType: formData.wordType || "phrase",
        exampleSentence: formData.exampleSentence?.trim(),
        exampleTranslation: formData.exampleTranslation?.trim(),
        isMastered: false,
        reviewCount: 0,
      };
      setVocabularies((prev) => [localItem, ...prev]);
      toast.success(`Đã thêm từ "${formData.kanji}" vào sổ tay!`);
      setIsAddModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Vocabularies
  const filteredList = useMemo(() => {
    return vocabularies.filter((v) => {
      if (selectedLevel !== "all" && v.level !== selectedLevel) return false;
      if (selectedStatus === "mastered" && !v.isMastered) return false;
      if (selectedStatus === "learning" && v.isMastered) return false;
      if (selectedStatus === "due") {
        const isDue = !v.nextReviewDate || new Date(v.nextReviewDate).getTime() <= Date.now();
        if (!isDue) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return (
          v.kanji.toLowerCase().includes(q) ||
          v.furigana?.toLowerCase().includes(q) ||
          v.romaji?.toLowerCase().includes(q) ||
          v.meaning.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [vocabularies, selectedLevel, selectedStatus, searchQuery]);

  // Flashcards deck list
  const flashcardList = useMemo(() => {
    return filteredList.length > 0 ? filteredList : vocabularies;
  }, [filteredList, vocabularies]);

  const currentFlashcard = flashcardList[cardIndex] || flashcardList[0];

  // Flashcard controls
  const handleNextCard = () => {
    setIsCardFlipped(false);
    setCardIndex((prev) => (prev + 1) % flashcardList.length);
  };

  const handlePrevCard = () => {
    setIsCardFlipped(false);
    setCardIndex((prev) => (prev - 1 + flashcardList.length) % flashcardList.length);
  };

  const handleShuffleCards = () => {
    setIsCardFlipped(false);
    setCardIndex(0);
    setVocabularies((prev) => [...prev].sort(() => Math.random() - 0.5));
    toast.success("Đã xáo trộn thứ tự thẻ Flashcard!");
  };

  // Keyboard navigation for Flashcards
  useEffect(() => {
    if (activeTab !== "flashcard") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsCardFlipped((prev) => !prev);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNextCard();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrevCard();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, flashcardList.length]);

  // Stats calculation
  const totalWords = vocabularies.length;
  const masteredCount = vocabularies.filter((v) => v.isMastered).length;
  const learningCount = totalWords - masteredCount;
  const masteryRate = totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 p-8 sm:p-10 text-white shadow-xl shadow-rose-500/10">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Kho Từ Vựng Cá Nhân
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Sổ Tay Từ Vựng & Thẻ Flashcard
              </h1>
              <p className="text-white/80 text-sm sm:text-base max-w-2xl">
                Lưu trữ các từ vựng mới từ video bài giảng, luyện phản xạ ghi nhớ chuyên sâu với hiệu ứng lật thẻ 3D và phát âm chuẩn bản xứ.
              </p>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white text-rose-600 hover:bg-rose-50 font-bold text-sm shadow-lg shadow-black/10 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              Thêm Từ Mới
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-3.5 pt-6 border-t border-white/15">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
              <span className="text-white/70 text-xs font-medium block">Tổng số từ</span>
              <span className="text-2xl font-black mt-1 block">{totalWords}</span>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-amber-300/30">
              <div className="flex items-center justify-between">
                <span className="text-amber-200 text-xs font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Đến hạn ôn
                </span>
                {dueCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                    SRS
                  </span>
                )}
              </div>
              <span className="text-2xl font-black text-amber-200 mt-1 block">{dueCount}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
              <span className="text-white/70 text-xs font-medium block">Đã ghi nhớ</span>
              <span className="text-2xl font-black text-emerald-300 mt-1 block">{masteredCount}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
              <span className="text-white/70 text-xs font-medium block">Đang ôn tập</span>
              <span className="text-2xl font-black text-sky-200 mt-1 block">{learningCount}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
              <span className="text-white/70 text-xs font-medium block">Tỉ lệ thuộc</span>
              <span className="text-2xl font-black text-sky-300 mt-1 block">{masteryRate}%</span>
            </div>
          </div>
        </div>

        {/* Practice-to-Earn Quota Banner (Duolingo Heart/Energy Mechanism) */}
        {!isPremium && canEarnBonus && (
          <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 dark:from-amber-950/30 dark:via-rose-950/30 dark:to-slate-900/40 border border-amber-300/80 dark:border-amber-800/60 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-300/40">
                <Zap size={22} className="fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    Luyện Tập Hồi Lượt Nói • Practice to Earn
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-3xs font-extrabold border border-amber-300/60">
                    Đã nhận {bonusPractices}/2 lượt hôm nay
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Ôn tập mỗi 5 thẻ Flashcard để nạp thêm +1 lượt nói miễn phí trong phòng luyện Kaiwa AI!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
              <div className="text-right hidden sm:block">
                <span className="text-3xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Tiến độ hôm nay
                </span>
                <p className="text-sm font-black text-slate-900 dark:text-white font-mono">
                  {reviewsToday}/{reviewsTarget} thẻ
                </p>
              </div>

              {canClaimBonusNow ? (
                <button
                  onClick={handleClaimBonusInNotebook}
                  disabled={claimingBonus}
                  type="button"
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-105 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Zap size={15} className="fill-white" />
                  <span>{claimingBonus ? "Đang nhận..." : `Nhận +1 Lượt Nói Ngay! ⚡`}</span>
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab("flashcard")}
                  type="button"
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-500 hover:brightness-105 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Layers size={15} />
                  <span>Ôn Thẻ Flashcard ({reviewsToday}/{reviewsTarget})</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation Tabs (Sổ tay vs Flashcard) */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex gap-2 p-1.5 bg-slate-200/70 dark:bg-slate-900 rounded-2xl border border-slate-300/50 dark:border-slate-800">
            <button
              onClick={() => setActiveTab("notebook")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === "notebook"
                  ? "bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Sổ tay danh sách ({filteredList.length})
            </button>
            <button
              onClick={() => {
                setActiveTab("flashcard");
                setIsCardFlipped(false);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === "flashcard"
                  ? "bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Layers className="w-4 h-4" />
              Thẻ Flashcard 3D
            </button>
          </div>

          {activeTab === "flashcard" && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[11px]">Space</span> Lật thẻ
              <span className="mx-1">•</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[11px]">←</span> / <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[11px]">→</span> Chuyển từ
            </div>
          )}
        </div>

        {/* TAB 1: SỔ TAY TỪ VỰNG (DANH SÁCH & BỘ LỌC) */}
        {activeTab === "notebook" && (
          <div className="space-y-6">
            {/* Filter Controls Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo Kanji, Furigana, Romaji hoặc nghĩa tiếng Việt..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Level selector */}
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Cấp độ:
                  </span>
                  {["all", "N5", "N4", "N3", "N2", "N1"].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setSelectedLevel(lvl)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedLevel === lvl
                          ? "bg-rose-500 text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {lvl === "all" ? "Tất cả" : lvl}
                    </button>
                  ))}
                </div>

                {/* Status selector */}
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">Trạng thái:</span>
                  <button
                    onClick={() => setSelectedStatus("all")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedStatus === "all"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => setSelectedStatus("mastered")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedStatus === "mastered"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Đã thuộc
                  </button>
                  <button
                    onClick={() => setSelectedStatus("learning")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedStatus === "learning"
                        ? "bg-amber-600 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Cần ôn
                  </button>
                  <button
                    onClick={() => setSelectedStatus("due")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      selectedStatus === "due"
                        ? "bg-rose-600 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>Đến hạn ({dueCount})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Vocabulary Grid */}
            {isLoading ? (
              <div className="py-20 text-center space-y-3">
                <RotateCw className="w-8 h-8 text-rose-500 animate-spin mx-auto" />
                <p className="text-slate-500 text-sm">Đang tải sổ tay từ vựng...</p>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4">
                <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    Không tìm thấy từ vựng nào
                  </h3>
                  <p className="text-slate-500 text-sm max-w-md mx-auto">
                    {searchQuery
                      ? "Không có từ nào phù hợp với từ khóa tìm kiếm của bạn. Hãy thử từ khóa khác."
                      : "Sổ tay của bạn chưa có từ nào trong bộ lọc này. Hãy thêm từ vựng mới hoặc lưu từ các bài học video nhé!"}
                  </p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold shadow-md shadow-rose-500/20"
                >
                  <Plus className="w-4 h-4" /> Thêm từ mới ngay
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredList.map((item) => (
                  <div
                    key={item._id}
                    className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between hover:border-rose-400 dark:hover:border-rose-500/50"
                  >
                    <div className="space-y-3">
                      {/* Top Badges & Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider ${
                              item.level === "N5"
                                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                                : item.level === "N4"
                                ? "bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-300 dark:border-sky-800"
                                : item.level === "N3"
                                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800"
                                : "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-800"
                            }`}
                          >
                            {item.level}
                          </span>
                          {item.wordType && (
                            <span className="text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                              {item.wordType}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => speakJapanese(item.kanji)}
                            title="Nghe phát âm"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleToggleMastered(item, e)}
                            title={item.isMastered ? "Đã thuộc" : "Đánh dấu đã thuộc"}
                            className={`p-1.5 rounded-lg transition-colors ${
                              item.isMastered
                                ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                : "text-slate-300 hover:text-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                          >
                            {item.isMastered ? (
                              <CheckCircle2 className="w-4 h-4 fill-emerald-100 dark:fill-emerald-950" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={(e) => handleDeleteWord(item._id, item.kanji, e)}
                            title="Xóa khỏi sổ tay"
                            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Main Kanji & Furigana */}
                      <div>
                        {item.furigana && (
                          <span className="text-xs font-semibold text-rose-500 dark:text-rose-400 block tracking-wide">
                            {item.furigana}
                          </span>
                        )}
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                          {item.kanji}
                        </h3>
                        {item.romaji && (
                          <span className="text-xs font-mono text-slate-400 block mt-0.5">
                            {item.romaji}
                          </span>
                        )}
                      </div>

                      {/* Meaning in Vietnamese */}
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 border-l-2 border-rose-400 pl-2.5 py-0.5">
                        {item.meaning}
                      </p>

                      {/* Example sentence if any */}
                      {item.exampleSentence && (
                        <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl space-y-1">
                          <p className="font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                            <span>{item.exampleSentence}</span>
                            <button
                              onClick={() => speakJapanese(item.exampleSentence || "")}
                              className="text-slate-400 hover:text-rose-500 p-0.5"
                            >
                              <Volume2 className="w-3 h-3" />
                            </button>
                          </p>
                          {item.exampleTranslation && (
                            <p className="text-slate-500 text-[11px] italic">
                              {item.exampleTranslation}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                            getSRSStageInfo(item.srsStage).color
                          }`}
                        >
                          {getSRSStageInfo(item.srsStage).label}
                        </span>
                        <span className="text-slate-400">
                          {item.interval ? `${item.interval} ngày` : `Ôn ${item.reviewCount || 0} lần`}
                        </span>
                      </div>

                      {item.nextReviewDate && new Date(item.nextReviewDate).getTime() <= Date.now() ? (
                        <span className="text-rose-500 font-extrabold flex items-center gap-1 animate-pulse">
                          <Clock className="w-3 h-3" /> Đến hạn ôn
                        </span>
                      ) : (
                        <span
                          className={
                            item.isMastered
                              ? "text-emerald-500 font-bold"
                              : "text-amber-500 font-medium"
                          }
                        >
                          {item.isMastered ? "✓ Đã ghi nhớ" : "○ Đang luyện tập"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: THẺ FLASHCARD 3D (FLIP CARD INTERACTIVE) */}
        {activeTab === "flashcard" && (
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Top Deck Stats & Controls */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold px-3 py-1 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  Thẻ {cardIndex + 1} / {flashcardList.length}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {currentFlashcard.isMastered ? (
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Đã thuộc
                    </span>
                  ) : (
                    <span className="text-amber-500 font-medium flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Cần ôn tập
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFuriganaOnFront((prev) => !prev)}
                  title="Ẩn / Hiện Furigana mặt trước"
                  className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    showFuriganaOnFront
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 border-rose-200 dark:border-rose-900"
                  }`}
                >
                  {showFuriganaOnFront ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span className="hidden sm:inline">Furigana</span>
                </button>

                <button
                  onClick={handleShuffleCards}
                  title="Xáo trộn thẻ"
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 text-xs font-semibold"
                >
                  <Shuffle className="w-4 h-4" />
                  <span className="hidden sm:inline">Xáo trộn</span>
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-rose-500 to-indigo-600 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${((cardIndex + 1) / flashcardList.length) * 100}%`,
                }}
              />
            </div>

            {/* 3D PERSPECTIVE FLIP CARD CONTAINER */}
            <div
              className="relative w-full min-h-[450px] sm:min-h-[490px] cursor-pointer select-none [perspective:1200px]"
              onClick={() => setIsCardFlipped((prev) => !prev)}
            >
              <div
                className={`relative w-full min-h-[450px] sm:min-h-[490px] rounded-3xl transition-transform duration-500 [transform-style:preserve-3d] shadow-2xl ${
                  isCardFlipped ? "[transform:rotateY(180deg)]" : ""
                }`}
              >
                {/* MẶT TRƯỚC (FRONT): KANJI & PHÁT ÂM */}
                <div className="absolute inset-0 w-full h-full rounded-3xl p-6 sm:p-9 flex flex-col justify-between bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 [backface-visibility:hidden] shadow-lg">
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl bg-rose-500 text-white font-extrabold text-xs tracking-wider uppercase">
                        {currentFlashcard.level}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                          getSRSStageInfo(currentFlashcard.srsStage).color
                        }`}
                      >
                        {getSRSStageInfo(currentFlashcard.srsStage).label}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakJapanese(currentFlashcard.kanji);
                      }}
                      className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:scale-110 active:scale-95 transition-all shadow-sm"
                      title="Phát âm tiếng Nhật"
                    >
                      <Volume2 className={`w-6 h-6 ${isSpeaking ? "animate-pulse text-indigo-600" : ""}`} />
                    </button>
                  </div>

                  {/* Card Body: Big Kanji */}
                  <div className="text-center space-y-3 my-auto py-4">
                    {showFuriganaOnFront && currentFlashcard.furigana && (
                      <span className="text-lg sm:text-xl font-bold text-rose-500 dark:text-rose-400 tracking-wide block animate-fade-in">
                        {currentFlashcard.furigana}
                      </span>
                    )}
                    <h2 className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
                      {currentFlashcard.kanji}
                    </h2>
                    {currentFlashcard.romaji && (
                      <p className="text-sm font-mono text-slate-400">
                        {currentFlashcard.romaji}
                      </p>
                    )}
                  </div>

                  {/* Card Footer: Hint to flip */}
                  <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 group-hover:text-rose-500 transition-colors">
                      <RotateCw className="w-3.5 h-3.5" /> Bấm vào thẻ để lật xem nghĩa & đánh giá SRS
                    </span>
                  </div>
                </div>

                {/* MẶT SAU (BACK): NGHĨA TIẾNG VIỆT & ĐÁNH GIÁ SRS SM-2 */}
                <div className="absolute inset-0 w-full h-full rounded-3xl p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white border-2 border-indigo-600/50 [transform:rotateY(180deg)] [backface-visibility:hidden] shadow-xl">
                  {/* Card Header Back */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl bg-indigo-500/30 text-indigo-300 font-bold text-xs uppercase">
                        {currentFlashcard.wordType || "Từ vựng"}
                      </span>
                      <span className="text-xs font-semibold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <BrainCircuit className="w-3 h-3" />
                        SRS {getSRSStageInfo(currentFlashcard.srsStage).label}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakJapanese(currentFlashcard.kanji);
                      }}
                      className="p-2.5 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Card Body Back */}
                  <div className="space-y-3 my-auto py-2">
                    <div className="space-y-0.5">
                      <span className="text-xs font-medium text-indigo-300 block">Nghĩa tiếng Việt</span>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-300">
                        {currentFlashcard.meaning}
                      </h3>
                    </div>

                    {currentFlashcard.exampleSentence && (
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 space-y-1 border border-white/10">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-white">
                            {currentFlashcard.exampleSentence}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              speakJapanese(currentFlashcard.exampleSentence || "");
                            }}
                            className="p-1 text-white/70 hover:text-white"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {currentFlashcard.exampleTranslation && (
                          <p className="text-xs text-white/70 italic">
                            {currentFlashcard.exampleTranslation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer Back: 4-Tier Spaced Repetition Bar */}
                  <div className="pt-3 border-t border-white/10 space-y-2.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between text-2xs font-semibold text-indigo-300 px-0.5">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        Đánh giá mức độ phản xạ để xếp lịch ôn:
                      </span>
                      <span className="text-white/60">
                        Space: Lật lại
                      </span>
                    </div>

                    {/* 4 SuperMemo SM-2 Evaluation Buttons */}
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={(e) => handleReviewSRS(currentFlashcard, "again", e)}
                        disabled={isReviewingSRS}
                        className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-red-500/20 hover:bg-red-500/35 border border-red-500/50 text-red-200 transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
                        title="Quên từ này, cần ôn lại ngay"
                      >
                        <span className="text-xs font-black">🔴 Quên</span>
                        <span className="text-[10px] text-white/60 mt-0.5 font-mono">1 ngày</span>
                      </button>

                      <button
                        onClick={(e) => handleReviewSRS(currentFlashcard, "hard", e)}
                        disabled={isReviewingSRS}
                        className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/50 text-amber-200 transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
                        title="Khó nhớ, tốn thời gian suy nghĩ"
                      >
                        <span className="text-xs font-black">🟡 Khó</span>
                        <span className="text-[10px] text-white/60 mt-0.5 font-mono">2-3 ngày</span>
                      </button>

                      <button
                        onClick={(e) => handleReviewSRS(currentFlashcard, "good", e)}
                        disabled={isReviewingSRS}
                        className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/40 border border-emerald-500/50 text-emerald-200 transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
                        title="Nhớ tốt với một chút suy nghĩ (+5 XP)"
                      >
                        <span className="text-xs font-black">🟢 Tốt</span>
                        <span className="text-[10px] text-emerald-300 mt-0.5 font-mono">6 ngày</span>
                      </button>

                      <button
                        onClick={(e) => handleReviewSRS(currentFlashcard, "easy", e)}
                        disabled={isReviewingSRS}
                        className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-sky-500/25 hover:bg-sky-500/40 border border-sky-500/50 text-sky-200 transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
                        title="Rất dễ dàng, phản xạ tức thì (+5 XP)"
                      >
                        <span className="text-xs font-black">⚡ Rất dễ</span>
                        <span className="text-[10px] text-sky-300 mt-0.5 font-mono">10 ngày</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Deck Navigation Controls */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={handlePrevCard}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-bold text-sm shadow-sm hover:border-rose-400 transition-all hover:scale-105 active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" /> Thẻ trước
              </button>

              <button
                onClick={() => setIsCardFlipped((prev) => !prev)}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-rose-500/25 hover:opacity-95 transition-all hover:scale-105 active:scale-95"
              >
                <RotateCw className="w-5 h-5" /> Lật thẻ (Space)
              </button>

              <button
                onClick={handleNextCard}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-bold text-sm shadow-sm hover:border-rose-400 transition-all hover:scale-105 active:scale-95"
              >
                Thẻ tiếp <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* MODAL: THÊM TỪ VỰNG MỚI */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-up">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Thêm Từ Vựng Vào Sổ Tay
                    </h3>
                    <p className="text-xs text-slate-500">
                      Lưu trữ từ mới để ôn tập với Flashcard hàng ngày
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleAddWordSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Kanji */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Từ tiếng Nhật (Kanji / Kana) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.kanji}
                      onChange={(e) => setFormData({ ...formData, kanji: e.target.value })}
                      placeholder="Ví dụ: お疲れ様です, 遠慮なく..."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                    />
                  </div>

                  {/* Furigana */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Cách đọc Furigana (Hiragana)
                    </label>
                    <input
                      type="text"
                      value={formData.furigana}
                      onChange={(e) => setFormData({ ...formData, furigana: e.target.value })}
                      placeholder="Ví dụ: おつかれさまです"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                    />
                  </div>

                  {/* Romaji */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Phiên âm Romaji
                    </label>
                    <input
                      type="text"
                      value={formData.romaji}
                      onChange={(e) => setFormData({ ...formData, romaji: e.target.value })}
                      placeholder="Ví dụ: otsukaresama desu"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                    />
                  </div>

                  {/* Meaning */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Nghĩa tiếng Việt <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.meaning}
                      onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                      placeholder="Ví dụ: Cảm ơn vì đã vất vả (chào khi tan ca)"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                    />
                  </div>

                  {/* JLPT Level */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Cấp độ JLPT
                    </label>
                    <select
                      value={formData.level}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          level: e.target.value as "N5" | "N4" | "N3" | "N2" | "N1",
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                    >
                      <option value="N5">N5 (Sơ cấp)</option>
                      <option value="N4">N4 (Sơ trung cấp)</option>
                      <option value="N3">N3 (Trung cấp)</option>
                      <option value="N2">N2 (Trung cao cấp)</option>
                      <option value="N1">N1 (Cao cấp)</option>
                    </select>
                  </div>

                  {/* Word Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Từ loại
                    </label>
                    <select
                      value={formData.wordType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          wordType: e.target.value as "noun" | "verb" | "adjective" | "adverb" | "phrase" | "other",
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                    >
                      <option value="phrase">Cụm từ / Thành ngữ</option>
                      <option value="noun">Danh từ</option>
                      <option value="verb">Động từ</option>
                      <option value="adjective">Tính từ</option>
                      <option value="adverb">Phó từ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>

                  {/* Example sentence */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Câu ví dụ tiếng Nhật (tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={formData.exampleSentence}
                      onChange={(e) => setFormData({ ...formData, exampleSentence: e.target.value })}
                      placeholder="Ví dụ: 今日も一日お疲れ様でした。"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                    />
                  </div>

                  {/* Example translation */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Dịch nghĩa câu ví dụ (tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={formData.exampleTranslation}
                      onChange={(e) => setFormData({ ...formData, exampleTranslation: e.target.value })}
                      placeholder="Ví dụ: Hôm nay bạn đã vất vả cả một ngày rồi."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                    />
                  </div>
                </div>

                {/* Submit buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-md shadow-rose-500/25 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" /> Đang lưu...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Lưu từ vựng
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
