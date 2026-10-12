"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
  Flame,
  Clock,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/useAuthStore";
import { practiceService } from "@/services/practice.service";
import { studylogService, type DailyStudyLog } from "@/services/studylog.service";
import { userService } from "@/services/user.service";
import { toast } from "sonner";
import { playHankoStampAudio } from "./HankoStampCard";

interface Quest {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  current: number;
  target: number;
  unit?: string;
  xpReward: number;
  actionUrl: string;
  actionText: string;
  questType: "daily" | "weekly";
}

export function DailyQuestsWidget() {
  const { user, streak, practiceCountToday } = useAuth();
  const [activeTab, setActiveTab] = useState<"daily" | "weekly">("daily");
  const [claimedQuests, setClaimedQuests] = useState<Record<string, boolean>>({});
  const [bonusClaimed, setBonusClaimed] = useState<Record<string, boolean>>({
    daily: false,
    weekly: false,
  });
  const [highScoreAchieved, setHighScoreAchieved] = useState(false);
  const [vocabReviewedCount, setVocabReviewedCount] = useState(0);
  const [weeklyLogs, setWeeklyLogs] = useState<DailyStudyLog[]>([]);
  const [claimingQuestId, setClaimingQuestId] = useState<string | null>(null);

  const todayKey = new Date().toISOString().split("T")[0];

  // Calculate ISO week identifier for weekly storage key
  const getWeekId = useCallback(() => {
    const d = new Date();
    const dayNr = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - dayNr + 3);
    const firstThursday = d.getTime();
    d.setMonth(0, 1);
    if (d.getDay() !== 4) {
      d.setMonth(0, 1 + ((4 - d.getDay() + 7) % 7));
    }
    const weekNumber = 1 + Math.ceil((firstThursday - d.getTime()) / 604800000);
    return `${d.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
  }, []);

  const weekKey = useMemo(() => getWeekId(), [getWeekId]);
  const storageKey = `jtalk_quests_${user?._id || "guest"}_${todayKey}`;
  const weeklyStorageKey = `jtalk_weekly_quests_${user?._id || "guest"}_${weekKey}`;

  // Load claim states from backend user profile or local fallback
  useEffect(() => {
    const backendClaimedMap: Record<string, boolean> = {};

    if (user?.gamification?.claimedQuests) {
      user.gamification.claimedQuests.forEach((q) => {
        if (q.dateKey === todayKey || q.dateKey === weekKey) {
          backendClaimedMap[q.questId] = true;
        }
      });
    }

    try {
      const savedDaily = localStorage.getItem(storageKey);
      const savedWeekly = localStorage.getItem(weeklyStorageKey);

      let localClaimed: Record<string, boolean> = {};
      let dailyBonus = false;
      let weeklyBonus = false;

      if (savedDaily) {
        const parsed = JSON.parse(savedDaily);
        localClaimed = { ...localClaimed, ...(parsed.claimed || {}) };
        dailyBonus = Boolean(parsed.bonusClaimed);
      }
      if (savedWeekly) {
        const parsed = JSON.parse(savedWeekly);
        localClaimed = { ...localClaimed, ...(parsed.claimed || {}) };
        weeklyBonus = Boolean(parsed.bonusClaimed);
      }

      setClaimedQuests({
        ...localClaimed,
        ...backendClaimedMap,
      });

      setBonusClaimed({
        daily: dailyBonus || Boolean(backendClaimedMap["quest_grand_bonus"]),
        weekly: weeklyBonus || Boolean(backendClaimedMap["quest_weekly_grand"]),
      });

      // Check reviewed vocabulary count from localStorage
      const savedVocab = localStorage.getItem(`jtalk_vocab_reviewed_${todayKey}`);
      if (savedVocab) {
        setVocabReviewedCount(parseInt(savedVocab, 10) || 0);
      } else {
        setVocabReviewedCount(3);
      }
    } catch {
      // Ignore storage errors
    }
  }, [user?.gamification?.claimedQuests, storageKey, weeklyStorageKey, todayKey, weekKey]);

  // Check practice history and weekly stats
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

    studylogService
      .getWeeklyLogs()
      .then((logs) => {
        if (isMounted && logs && logs.length > 0) {
          setWeeklyLogs(logs);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute weekly totals from weeklyLogs
  const weeklyStats = useMemo(() => {
    let totalMinutes = 0;
    let totalPractices = 0;
    weeklyLogs.forEach((l) => {
      totalMinutes += l.minutesSpent || 0;
      totalPractices += l.practiceCount || 0;
    });

    if (totalPractices === 0 && practiceCountToday > 0) {
      totalPractices = practiceCountToday;
      totalMinutes = practiceCountToday * 5;
    }

    return {
      minutes: totalMinutes,
      practices: totalPractices,
    };
  }, [weeklyLogs, practiceCountToday]);

  // Quests definitions
  const dailyQuests: Quest[] = useMemo(
    () => [
      {
        id: "quest_speaking",
        title: "Luyện 1 bài hội thoại Kaiwa",
        description: "Thực hành đối đáp với AI trong phòng Luyện nói",
        icon: Mic,
        color: "from-rose-500 to-pink-500",
        current: Math.min(1, Math.max(practiceCountToday, 0)),
        target: 1,
        unit: "bài",
        xpReward: 50,
        actionUrl: "/speaking",
        actionText: "Luyện ngay",
        questType: "daily",
      },
      {
        id: "quest_vocab",
        title: "Ôn tập 5 từ vựng Sổ tay",
        description: "Lật thẻ Flashcard 3D và luyện phát âm chuẩn Tokyo",
        icon: BookOpen,
        color: "from-amber-500 to-orange-500",
        current: Math.min(5, vocabReviewedCount),
        target: 5,
        unit: "từ",
        xpReward: 30,
        actionUrl: "/vocabulary",
        actionText: "Ôn từ vựng",
        questType: "daily",
      },
      {
        id: "quest_score",
        title: "Đạt điểm phát âm phản xạ ≥ 80",
        description: "Hoàn thành câu thoại với độ chuẩn xác và lưu loát cao",
        icon: Award,
        color: "from-emerald-500 to-teal-500",
        current: highScoreAchieved ? 1 : 0,
        target: 1,
        unit: "lần",
        xpReward: 40,
        actionUrl: "/speaking",
        actionText: "Thử sức",
        questType: "daily",
      },
    ],
    [practiceCountToday, vocabReviewedCount, highScoreAchieved]
  );

  const weeklyQuests: Quest[] = useMemo(
    () => [
      {
        id: "quest_weekly_streak",
        title: "Duy trì ngọn lửa Streak 3 ngày",
        description: "Học tập kiên trì và điểm danh ít nhất 3 ngày trong tuần",
        icon: Flame,
        color: "from-rose-500 to-amber-500",
        current: Math.min(3, streak || 0),
        target: 3,
        unit: "ngày",
        xpReward: 100,
        actionUrl: "/speaking",
        actionText: "Duy trì streak",
        questType: "weekly",
      },
      {
        id: "quest_weekly_minutes",
        title: "Tích lũy 30 phút luyện Kaiwa",
        description: "Rèn luyện phản xạ đối đáp và nghe nói trong tuần",
        icon: Clock,
        color: "from-blue-500 to-cyan-500",
        current: Math.min(30, weeklyStats.minutes),
        target: 30,
        unit: "phút",
        xpReward: 120,
        actionUrl: "/speaking",
        actionText: "Luyện nói",
        questType: "weekly",
      },
      {
        id: "quest_weekly_practices",
        title: "Hoàn thành 5 bài luyện nói",
        description: "Thực hành đa dạng các tình huống hội thoại thực tế",
        icon: Calendar,
        color: "from-purple-500 to-indigo-500",
        current: Math.min(5, weeklyStats.practices),
        target: 5,
        unit: "bài",
        xpReward: 150,
        actionUrl: "/speaking",
        actionText: "Vào phòng học",
        questType: "weekly",
      },
    ],
    [streak, weeklyStats]
  );

  const activeQuests = activeTab === "daily" ? dailyQuests : weeklyQuests;
  const completedCount = activeQuests.filter((q) => q.current >= q.target).length;
  const allCompleted = completedCount === activeQuests.length;
  const isCurrentBonusClaimed = bonusClaimed[activeTab];

  // Claim single quest reward
  const handleClaimReward = async (quest: Quest) => {
    if (claimedQuests[quest.id] || claimingQuestId) return;

    setClaimingQuestId(quest.id);
    playHankoStampAudio();

    try {
      const res = await userService.claimQuestReward({
        questId: quest.id,
        xpReward: quest.xpReward,
        questType: quest.questType,
      });

      if (res.success || res.alreadyClaimed) {
        if (res.totalXp) {
          useAuthStore.getState().updateUserGamification({
            totalXp: res.totalXp,
            level: res.level,
          });
        }

        const updated = { ...claimedQuests, [quest.id]: true };
        setClaimedQuests(updated);

        const currentStorageKey = quest.questType === "weekly" ? weeklyStorageKey : storageKey;
        try {
          localStorage.setItem(
            currentStorageKey,
            JSON.stringify({
              claimed: updated,
              bonusClaimed: bonusClaimed[quest.questType],
            })
          );
        } catch {}

        toast.success(
          res.message || `Nhận thưởng thành công! Bạn nhận được +${quest.xpReward} XP 🎉`
        );
      } else {
        toast.error(res.message || "Không thể nhận thưởng lúc này");
      }
    } catch (err: any) {
      console.error("Lỗi nhận thưởng:", err);
      toast.error(err?.response?.data?.message || "Lỗi kết nối máy chủ nhận thưởng!");
    } finally {
      setClaimingQuestId(null);
    }
  };

  // Claim grand chest bonus
  const handleClaimGrandBonus = async () => {
    if (isCurrentBonusClaimed || !allCompleted || claimingQuestId) return;

    const chestId = activeTab === "daily" ? "quest_grand_bonus" : "quest_weekly_grand";
    const bonusXp = activeTab === "daily" ? 60 : 200;

    setClaimingQuestId(chestId);
    playHankoStampAudio();

    try {
      const res = await userService.claimQuestReward({
        questId: chestId,
        xpReward: bonusXp,
        questType: activeTab,
      });

      if (res.success || res.alreadyClaimed) {
        if (res.totalXp) {
          useAuthStore.getState().updateUserGamification({
            totalXp: res.totalXp,
            level: res.level,
          });
        }

        setBonusClaimed((prev) => ({ ...prev, [activeTab]: true }));

        const currentStorageKey = activeTab === "weekly" ? weeklyStorageKey : storageKey;
        try {
          localStorage.setItem(
            currentStorageKey,
            JSON.stringify({
              claimed: claimedQuests,
              bonusClaimed: true,
            })
          );
        } catch {}

        toast.success(
          res.message ||
            `🎊 Tuyệt vời! Bạn đã hoàn thành toàn bộ nhiệm vụ ${
              activeTab === "daily" ? "ngày" : "tuần"
            } và nhận thêm +${bonusXp} XP!`
        );
      } else {
        toast.error(res.message || "Không thể mở rương lúc này");
      }
    } catch (err: any) {
      console.error("Lỗi mở rương:", err);
      toast.error(err?.response?.data?.message || "Lỗi khi mở rương thưởng!");
    } finally {
      setClaimingQuestId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
      {/* Header with Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 text-2xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nhiệm vụ & Mục tiêu • クエスト</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {activeTab === "daily" ? "Nhiệm Vụ Hôm Nay" : "Nhiệm Vụ Tuần Này"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {activeTab === "daily"
              ? "Hoàn thành các thử thách ngắn để nhận điểm kinh nghiệm XP và tăng cấp mỗi ngày"
              : "Duy trì kỷ luật học tập hàng tuần để nhận rương kho báu XP khổng lồ"}
          </p>
        </div>

        {/* Tab Buttons & Progress Pill */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Tab switch */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <button
              type="button"
              onClick={() => setActiveTab("daily")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === "daily"
                  ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-300 shadow-2xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Nhiệm vụ ngày
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("weekly")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === "weekly"
                  ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-300 shadow-2xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Nhiệm vụ tuần
            </button>
          </div>

          {/* Progress pill */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-2 px-3.5">
            <div className="text-right">
              <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                {completedCount}/{activeQuests.length}
              </div>
              <span className="text-3xs text-slate-400 font-bold block">
                {allCompleted ? "Hoàn thành" : "Đang làm"}
              </span>
            </div>

            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
              {allCompleted ? (
                <Check className="w-4 h-4 stroke-[3]" />
              ) : (
                `${Math.round((completedCount / activeQuests.length) * 100)}%`
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quests Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {activeQuests.map((quest) => {
          const Icon = quest.icon;
          const isDone = quest.current >= quest.target;
          const isClaimed = !!claimedQuests[quest.id];
          const isClaiming = claimingQuestId === quest.id;
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
                      Tiến độ: {quest.current}/{quest.target} {quest.unit || ""}
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
                    disabled={isClaiming}
                    onClick={() => handleClaimReward(quest)}
                    type="button"
                    className={`w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-70 text-amber-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer ${
                      isClaiming ? "animate-pulse" : ""
                    }`}
                  >
                    <Gift className="w-4 h-4 fill-current" />
                    <span>{isClaiming ? "Đang nhận..." : `Nhận +${quest.xpReward} XP`}</span>
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

      {/* Grand Chest Bonus Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 dark:from-amber-950/30 dark:via-rose-950/30 dark:to-slate-900 border border-amber-300/80 dark:border-amber-800/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center shrink-0 shadow-md">
            <Gift className="w-6 h-6 animate-float" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {activeTab === "daily" ? "Rương Thưởng Hoàn Tất Ngày" : "Rương Thưởng Mục Tiêu Tuần"}
              </span>
              <span className="px-1.5 py-0.2 rounded-md bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200 text-3xs font-extrabold">
                {activeTab === "daily" ? "+60 XP BONUS" : "+200 XP BONUS"}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              {activeTab === "daily"
                ? "Hoàn thành cả 3 nhiệm vụ ngày hôm nay để mở khóa rương kho báu đặc biệt!"
                : "Hoàn tất cả 3 nhiệm vụ tuần để mở khóa kho báu XP thăng hạng nhanh!"}
            </p>
          </div>
        </div>

        <div className="shrink-0 self-end sm:self-auto">
          {isCurrentBonusClaimed ? (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Đã mở rương {activeTab === "daily" ? "ngày" : "tuần"}</span>
            </span>
          ) : allCompleted ? (
            <button
              onClick={handleClaimGrandBonus}
              disabled={Boolean(claimingQuestId)}
              type="button"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:brightness-105 active:scale-95 disabled:opacity-60 text-white font-black text-xs rounded-xl shadow-md shadow-amber-500/25 transition-all cursor-pointer animate-pulse"
            >
              {claimingQuestId ? "Đang mở rương..." : `Mở Rương +${activeTab === "daily" ? 60 : 200} XP`}
            </button>
          ) : (
            <span className="text-2xs text-slate-400 font-bold">
              Còn {activeQuests.length - completedCount} nhiệm vụ nữa
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default DailyQuestsWidget;
