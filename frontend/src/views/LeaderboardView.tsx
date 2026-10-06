"use client";

import { useState, useEffect } from "react";
import { Link } from "@/lib/react-router-compat";
import {
  Trophy,
  Flame,
  Crown,
  Sparkles,
  ArrowUpRight,
  Mic,
} from "lucide-react";
import { userService, type LeaderboardUser } from "@/services/user.service";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export const LeaderboardView = () => {
  const { user } = useAuth();
  const [type, setType] = useState<"xp" | "streak">("xp");
  const [timeframe, setTimeframe] = useState<"all" | "week" | "month">("all");
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const res = await userService.getLeaderboard(type, timeframe, 30);
        if (isMounted) {
          setLeaderboard(res.leaderboard);
          setCurrentUserRank(res.currentUser || null);
        }
      } catch (err) {
        console.error("Lỗi khi tải bảng xếp hạng:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLeaderboard();

    return () => {
      isMounted = false;
    };
  }, [type, timeframe]);

  // Extract Top 3 for Podium
  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];
  const remainingLearners = leaderboard.slice(3);

  // Next rank distance calculation
  const nextTargetUser =
    currentUserRank && currentUserRank.rank > 1
      ? leaderboard.find((u) => u.rank === currentUserRank.rank - 1)
      : null;

  const pointsToNextRank =
    nextTargetUser && currentUserRank
      ? type === "xp"
        ? Math.max(0, nextTargetUser.totalXp - currentUserRank.totalXp)
        : Math.max(0, nextTargetUser.streak - currentUserRank.streak)
      : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 font-sans transition-colors duration-200">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-indigo-500/10 dark:from-amber-950/40 dark:via-rose-950/40 dark:to-slate-900/60 border border-amber-200/80 dark:border-amber-800/60 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300/80 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-full text-xs font-black uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Bảng Vàng Vinh Danh JTalk • ランキング</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Bảng Xếp Hạng Cao Thủ Luyện Nói
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            Tích lũy điểm kinh nghiệm XP qua từng bài luyện Kaiwa, hoàn thành nhiệm vụ ngày và giữ vững chuỗi ngọn lửa Streak để ghi danh trên bảng vàng!
          </p>
        </div>

        <Link
          to="/speaking"
          className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:brightness-105 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
        >
          <Mic className="w-4 h-4 animate-pulse" />
          <span>Luyện Nói Kiếm XP Ngay</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 2. Filter Controls (Criterion & Timeframe) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Metric Selector (XP vs Streak) */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 self-start">
          <button
            onClick={() => setType("xp")}
            type="button"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              type === "xp"
                ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Điểm Kinh Nghiệm (XP)</span>
          </button>

          <button
            onClick={() => setType("streak")}
            type="button"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              type === "streak"
                ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Flame className="w-4 h-4 fill-rose-500 text-rose-500" />
            <span>Chuỗi Học (Streak)</span>
          </button>
        </div>

        {/* Timeframe Selector (Tuần / Tháng / Tất cả) */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 self-start sm:self-auto">
          <button
            onClick={() => setTimeframe("week")}
            type="button"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              timeframe === "week"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Tuần này
          </button>
          <button
            onClick={() => setTimeframe("month")}
            type="button"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              timeframe === "month"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Tháng này
          </button>
          <button
            onClick={() => setTimeframe("all")}
            type="button"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              timeframe === "all"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Tất cả thời gian
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <LoadingSpinner size="lg" />
          <p className="text-xs font-bold text-slate-400">Đang tổng hợp dữ liệu bảng xếp hạng...</p>
        </div>
      ) : (
        <>
          {/* 3. Top 3 Podium (Bục Vinh Danh 3D) */}
          <div className="bg-gradient-to-b from-white via-slate-50/50 to-slate-100/80 dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xs">
            <div className="text-center mb-8 space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-rose-500">
                Top 3 Quán Quân & Á Quân
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Bục Vinh Danh Ngôi Sao JTalk
              </h2>
            </div>

            <div className="flex items-end justify-center gap-3 sm:gap-6 max-w-2xl mx-auto pt-6">
              {/* Podium #2 - Silver (Bạc) */}
              {top2 && (
                <div className="flex-1 flex flex-col items-center animate-fade-in">
                  <div className="relative mb-3 flex flex-col items-center">
                    <span className="text-2xs font-extrabold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-1 border border-slate-300 dark:border-slate-700 shadow-2xs">
                      #2 Á Quân
                    </span>

                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-tr from-slate-400 via-slate-200 to-slate-300 shadow-lg">
                      <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-white dark:border-slate-900">
                        {top2.avatarUrl ? (
                          <img
                            src={top2.avatarUrl}
                            alt={top2.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-base font-black text-slate-700 dark:text-slate-300">
                            {top2.displayName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-700 border-2 border-white dark:border-slate-900 flex items-center justify-center text-3xs font-black text-slate-800 dark:text-white">
                        🥈
                      </div>
                    </div>

                    <h4 className="mt-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white text-center max-w-[120px] truncate">
                      {top2.displayName}
                    </h4>
                    <span className="text-3xs font-extrabold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {top2.targetLevel}
                    </span>
                    <div className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300 mt-1">
                      {type === "xp" ? `${top2.totalXp} XP` : `${top2.streak} ngày`}
                    </div>
                  </div>

                  {/* Silver Pillar */}
                  <div className="w-full h-28 sm:h-36 rounded-t-2xl bg-gradient-to-b from-slate-300 via-slate-200 to-slate-300/80 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900 border-t-2 border-x-2 border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center shadow-md">
                    <span className="text-3xl sm:text-4xl font-black text-slate-500 dark:text-slate-400/80">
                      2
                    </span>
                  </div>
                </div>
              )}

              {/* Podium #1 - Gold (Vàng) */}
              {top1 && (
                <div className="flex-1 flex flex-col items-center animate-fade-in -mt-6">
                  <div className="relative mb-3 flex flex-col items-center">
                    <div className="animate-bounce">
                      <Crown className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 fill-amber-400 drop-shadow-md" />
                    </div>

                    <span className="text-2xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 mb-1 border border-amber-300 shadow-xs font-mono">
                      #1 QUÁN QUÂN
                    </span>

                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-amber-500 via-amber-200 to-amber-400 shadow-xl shadow-amber-500/25 ring-4 ring-amber-400/20">
                      <div className="w-full h-full rounded-full overflow-hidden bg-amber-50 dark:bg-slate-800 flex items-center justify-center border-2 border-white dark:border-slate-900">
                        {top1.avatarUrl ? (
                          <img
                            src={top1.avatarUrl}
                            alt={top1.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl font-black text-amber-800 dark:text-amber-300">
                            {top1.displayName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-400 border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs font-black text-amber-950 shadow-md">
                        🥇
                      </div>
                    </div>

                    <h4 className="mt-2 text-sm sm:text-base font-black text-slate-900 dark:text-white text-center max-w-[140px] truncate">
                      {top1.displayName}
                    </h4>
                    <span className="text-3xs font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300/80">
                      {top1.targetLevel} • Level {top1.level}
                    </span>
                    <div className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
                      <span>{type === "xp" ? `${top1.totalXp} XP` : `${top1.streak} ngày`}</span>
                    </div>
                  </div>

                  {/* Gold Pillar */}
                  <div className="w-full h-36 sm:h-48 rounded-t-2xl bg-gradient-to-b from-amber-400 via-amber-300 to-amber-400/80 dark:from-amber-600 dark:via-amber-700 dark:to-amber-900 border-t-2 border-x-2 border-amber-300 dark:border-amber-500 flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-2xs pointer-events-none" />
                    <span className="text-4xl sm:text-5xl font-black text-amber-950 dark:text-amber-200">
                      1
                    </span>
                  </div>
                </div>
              )}

              {/* Podium #3 - Bronze (Đồng) */}
              {top3 && (
                <div className="flex-1 flex flex-col items-center animate-fade-in">
                  <div className="relative mb-3 flex flex-col items-center">
                    <span className="text-2xs font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 mb-1 border border-amber-200 dark:border-amber-900 shadow-2xs">
                      #3 Quý Quân
                    </span>

                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-800 shadow-lg">
                      <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-white dark:border-slate-900">
                        {top3.avatarUrl ? (
                          <img
                            src={top3.avatarUrl}
                            alt={top3.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-base font-black text-slate-700 dark:text-slate-300">
                            {top3.displayName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-700 border-2 border-white dark:border-slate-900 flex items-center justify-center text-3xs font-black text-white">
                        🥉
                      </div>
                    </div>

                    <h4 className="mt-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white text-center max-w-[120px] truncate">
                      {top3.displayName}
                    </h4>
                    <span className="text-3xs font-extrabold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {top3.targetLevel}
                    </span>
                    <div className="text-xs sm:text-sm font-black text-amber-700 dark:text-amber-400 mt-1">
                      {type === "xp" ? `${top3.totalXp} XP` : `${top3.streak} ngày`}
                    </div>
                  </div>

                  {/* Bronze Pillar */}
                  <div className="w-full h-24 sm:h-28 rounded-t-2xl bg-gradient-to-b from-amber-600/60 via-amber-700/60 to-amber-800/80 dark:from-amber-800 dark:via-amber-900 dark:to-slate-950 border-t-2 border-x-2 border-amber-600 dark:border-amber-800 flex flex-col items-center justify-center shadow-md">
                    <span className="text-3xl sm:text-4xl font-black text-amber-200/80 dark:text-amber-300/80">
                      3
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Current Logged-in User Floating / Highlight Bar */}
          {currentUserRank && (
            <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-scale-up">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white font-black text-lg shrink-0 shadow-xs">
                  #{currentUserRank.rank}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-base sm:text-lg">
                      {currentUserRank.displayName} (Bạn)
                    </span>
                    {currentUserRank.isPremium && (
                      <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold bg-amber-400 text-amber-950">
                        PRO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-rose-100 font-medium">
                    {pointsToNextRank > 0 ? (
                      <>
                        Chỉ còn <span className="font-bold underline">{pointsToNextRank} {type === "xp" ? "XP" : "ngày"}</span> nữa để vượt lên thứ hạng #{currentUserRank.rank - 1}!
                      </>
                    ) : currentUserRank.rank === 1 ? (
                      "Bạn đang là Quán Quân dẫn đầu toàn bảng xếp hạng! Giữ vững phong độ nhé."
                    ) : (
                      "Tiếp tục luyện tập mỗi ngày để bứt phá lên Top 3 bảng vàng."
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                <div className="text-right">
                  <div className="text-xl sm:text-2xl font-black">
                    {type === "xp" ? `${currentUserRank.totalXp} XP` : `${currentUserRank.streak} ngày`}
                  </div>
                  <span className="text-3xs text-rose-100 font-bold uppercase tracking-wider">
                    {type === "xp" ? "Điểm tích lũy" : "Chuỗi Streak"}
                  </span>
                </div>

                <Link
                  to="/speaking"
                  className="px-4 py-2.5 bg-white text-rose-600 hover:bg-rose-50 rounded-2xl text-xs font-black shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  Luyện nói ngay
                </Link>
              </div>
            </div>
          )}

          {/* 5. Ranked Learners List (Rank #4+) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                Danh Sách Xếp Hạng Chi Tiết
              </h3>
              <span className="text-xs text-slate-400 font-semibold">
                Hiển thị top {leaderboard.length} học viên
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {remainingLearners.map((learner) => {
                const isCurrentUser = user?._id && learner._id === user._id.toString();

                return (
                  <div
                    key={learner._id}
                    className={`py-3.5 px-3 sm:px-4 rounded-2xl flex items-center justify-between gap-3 transition-colors ${
                      isCurrentUser
                        ? "bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Rank Index */}
                      <span className="w-8 text-center text-sm font-black text-slate-400 dark:text-slate-500 font-mono shrink-0">
                        #{learner.rank}
                      </span>

                      {/* Avatar */}
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                        {learner.avatarUrl ? (
                          <img
                            src={learner.avatarUrl}
                            alt={learner.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                            {learner.displayName.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Name & Badges */}
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-extrabold truncate ${
                              isCurrentUser
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-slate-900 dark:text-white"
                            }`}
                          >
                            {learner.displayName}
                          </span>
                          {isCurrentUser && (
                            <span className="px-1.5 py-0.2 rounded text-3xs font-extrabold bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 shrink-0">
                              Bạn
                            </span>
                          )}
                          {learner.isPremium && (
                            <span className="px-1.5 py-0.2 rounded text-3xs font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300/80 shrink-0">
                              PRO
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-3xs text-slate-400 font-semibold">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                            {learner.targetLevel}
                          </span>
                          <span>•</span>
                          <span>Cấp độ {learner.level}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-rose-500 font-bold">
                            <Flame className="w-3 h-3 fill-current" />
                            {learner.streak} ngày
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right shrink-0">
                      <div className="text-base font-black text-slate-900 dark:text-white">
                        {type === "xp" ? `${learner.totalXp} XP` : `${learner.streak} ngày`}
                      </div>
                      <span className="text-3xs text-slate-400 font-bold">
                        {type === "xp" ? "Tổng điểm" : "Streak"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LeaderboardView;
