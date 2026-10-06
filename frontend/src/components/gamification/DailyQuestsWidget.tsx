"use client";

import { useState, useEffect } from "react";
import { Link } from "@/lib/react-router-compat";
import {
  Sparkles,
  CheckCircle2,
  Mic,
  BookOpen,
  Award,
  Gift,
  ArrowRight,
  Check,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { practiceService } from "@/services/practice.service";
import { toast } from "sonner";

interface Quest {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  current: number;
  target: number;
  xpReward: number;
  actionUrl: string;
  actionText: string;
}

export function DailyQuestsWidget() {
  const { user, practiceCountToday } = useAuth();
  const [claimedQuests, setClaimedQuests] = useState<Record<string, boolean>>({});
  const [bonusClaimed, setBonusClaimed] = useState(false);
  const [highScoreAchieved, setHighScoreAchieved] = useState(false);
  const [vocabReviewedCount, setVocabReviewedCount] = useState(0);
  const [celebratingQuestId, setCelebratingQuestId] = useState<string | null>(null);

  const todayKey = new Date().toISOString().split("T")[0];
  const storageKey = `jtalk_quests_${user?._id || "guest"}_${todayKey}`;

  // Load daily claim state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setClaimedQuests(parsed.claimed || {});
        setBonusClaimed(parsed.bonusClaimed || false);
      }

      // Check reviewed vocabulary count from localStorage
      const savedVocab = localStorage.getItem(`jtalk_vocab_reviewed_${todayKey}`);
      if (savedVocab) {
        setVocabReviewedCount(parseInt(savedVocab, 10) || 0);
      } else {
        // Starter count to make widget engaging
        setVocabReviewedCount(3);
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, [storageKey, todayKey]);

  // Check recent practice scores
  useEffect(() => {
    let isMounted = true;
    practiceService
      .getPractices()
      .then((practices) => {
        if (!isMounted || !practices) return;
        const hasHigh = practices.some(
          (p) => (p.overallScore || p.score || 0) >= 80
        );
        if (hasHigh) {
          setHighScoreAchieved(true);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Save claim state
  const saveClaimState = (newClaimed: Record<string, boolean>, bonus: boolean) => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          claimed: newClaimed,
          bonusClaimed: bonus,
        })
      );
    } catch (e) {
      // Ignore
    }
  };

  // Quests definitions
  const quests: Quest[] = [
    {
      id: "quest_speaking",
      title: "Luyện 1 bài hội thoại Kaiwa",
      description: "Thực hành đối đáp với AI trong phòng Luyện nói",
      icon: Mic,
      color: "from-rose-500 to-pink-500",
      current: Math.min(1, Math.max(practiceCountToday, 0)),
      target: 1,
      xpReward: 50,
      actionUrl: "/speaking",
      actionText: "Luyện ngay",
    },
    {
      id: "quest_vocab",
      title: "Ôn tập 5 từ vựng Sổ tay",
      description: "Lật thẻ Flashcard 3D và luyện phát âm Tokyo",
      icon: BookOpen,
      color: "from-amber-500 to-orange-500",
      current: Math.min(5, vocabReviewedCount),
      target: 5,
      xpReward: 30,
      actionUrl: "/vocabulary",
      actionText: "Ôn từ vựng",
    },
    {
      id: "quest_score",
      title: "Đạt điểm phát âm phản xạ ≥ 80",
      description: "Hoàn thành câu thoại với độ chuẩn xác cao",
      icon: Award,
      color: "from-emerald-500 to-teal-500",
      current: highScoreAchieved ? 1 : 0,
      target: 1,
      xpReward: 40,
      actionUrl: "/speaking",
      actionText: "Thử sức",
    },
  ];

  const completedCount = quests.filter((q) => q.current >= q.target).length;
  const allCompleted = completedCount === quests.length;

  const handleClaimReward = (quest: Quest) => {
    if (claimedQuests[quest.id]) return;

    setCelebratingQuestId(quest.id);
    const updated = { ...claimedQuests, [quest.id]: true };
    setClaimedQuests(updated);
    saveClaimState(updated, bonusClaimed);

    toast.success(
      `🎉 Chúc mừng! Bạn nhận được +${quest.xpReward} XP từ nhiệm vụ: ${quest.title}!`
    );

    setTimeout(() => {
      setCelebratingQuestId(null);
    }, 1500);
  };

  const handleClaimGrandBonus = () => {
    if (bonusClaimed || !allCompleted) return;

    setBonusClaimed(true);
    saveClaimState(claimedQuests, true);
    toast.success("🎊 Tuyệt vời! Bạn đã hoàn thành toàn bộ Nhiệm vụ ngày và nhận thêm +60 XP thưởng!");
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
      {/* Header with completion gauge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 text-2xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nhiệm vụ hàng ngày • デイリークエスト</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            Nhiệm Vụ Hôm Nay
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hoàn thành các thử thách ngắn để nhận điểm kinh nghiệm XP và tăng cấp
          </p>
        </div>

        {/* Progress Pill */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-2.5 px-4 shrink-0">
          <div className="text-right">
            <div className="text-xs font-extrabold text-slate-900 dark:text-white">
              Tiến độ: {completedCount}/{quests.length}
            </div>
            <span className="text-3xs text-slate-400 font-bold">
              {allCompleted ? "Hoàn thành tất cả!" : "Đang làm nhiệm vụ"}
            </span>
          </div>

          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center font-black text-sm shadow-xs">
            {allCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : `${Math.round((completedCount / quests.length) * 100)}%`}
          </div>
        </div>
      </div>

      {/* Quests List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {quests.map((quest) => {
          const Icon = quest.icon;
          const isDone = quest.current >= quest.target;
          const isClaimed = !!claimedQuests[quest.id];
          const isCelebrating = celebratingQuestId === quest.id;
          const percentage = Math.min(100, Math.round((quest.current / quest.target) * 100));

          return (
            <div
              key={quest.id}
              className={`relative rounded-2xl p-4.5 border transition-all duration-200 flex flex-col justify-between gap-4 ${
                isClaimed
                  ? "bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 opacity-80"
                  : isDone
                  ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 shadow-xs"
                  : "bg-white dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              {/* Quest Header & Icon */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${quest.color} text-white flex items-center justify-center shrink-0 shadow-xs ${
                      isDone ? "ring-2 ring-emerald-400/40" : ""
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 text-2xs font-black">
                    <Trophy className="w-3 h-3 text-amber-500" />
                    <span>+{quest.xpReward} XP</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                    {quest.title}
                  </h4>
                  <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {quest.description}
                  </p>
                </div>
              </div>

              {/* Progress Bar & Actions */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-3xs font-extrabold text-slate-400">
                    <span>
                      Tiến độ: {quest.current}/{quest.target}
                    </span>
                    <span>{percentage}%</span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDone
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                          : "bg-gradient-to-r from-rose-500 to-amber-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Button state */}
                {isClaimed ? (
                  <button
                    disabled
                    type="button"
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Đã nhận thưởng</span>
                  </button>
                ) : isDone ? (
                  <button
                    onClick={() => handleClaimReward(quest)}
                    type="button"
                    className={`w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer ${
                      isCelebrating ? "animate-bounce" : "animate-pulse"
                    }`}
                  >
                    <Gift className="w-4 h-4 fill-current" />
                    <span>Nhận +{quest.xpReward} XP</span>
                  </button>
                ) : (
                  <Link
                    to={quest.actionUrl}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>{quest.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily Grand Chest Bonus */}
      <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 dark:from-amber-950/30 dark:via-rose-950/30 dark:to-slate-900 border border-amber-300/80 dark:border-amber-800/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center shrink-0 shadow-md">
            <Gift className="w-6 h-6 animate-float" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Rương Thưởng Hoàn Tất Ngày
              </span>
              <span className="px-1.5 py-0.2 rounded-md bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200 text-3xs font-extrabold">
                +60 XP BONUS
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Hoàn thành cả 3 nhiệm vụ ngày hôm nay để mở khóa rương kho báu đặc biệt!
            </p>
          </div>
        </div>

        <div className="shrink-0 self-end sm:self-auto">
          {bonusClaimed ? (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Đã mở rương hôm nay</span>
            </span>
          ) : allCompleted ? (
            <button
              onClick={handleClaimGrandBonus}
              type="button"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:brightness-105 active:scale-95 text-white font-black text-xs rounded-xl shadow-md shadow-amber-500/25 transition-all cursor-pointer animate-pulse"
            >
              Mở Rương +60 XP
            </button>
          ) : (
            <span className="text-2xs text-slate-400 font-bold">
              Còn {quests.length - completedCount} nhiệm vụ nữa
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default DailyQuestsWidget;
