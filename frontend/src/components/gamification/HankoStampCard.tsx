import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router";
import {
  Flame,
  Sparkles,
  Gift,
  ArrowRight,
  Volume2,
  CheckCircle2,
  Trophy,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { studylogService, type DailyStudyLog } from "@/services/studylog.service";

interface HankoStampCardProps {
  className?: string;
  onStampSuccess?: () => void;
}

interface DayStampInfo {
  label: string;
  dayNumber: number; // 1 (Th2) to 7 (CN)
  date: string;
  dayShortJp: string; // 月, 火, 水, 木, 金, 土, 日
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  hasPracticed: boolean;
  minutesSpent: number;
  practiceCount: number;
  stampTilt: number; // Random tilt angle for realism (-6 to 6 deg)
}

// Play authentic wooden Hanko stamp sound using Web Audio API
export const playHankoStampAudio = () => {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const now = ctx.currentTime;

    // 1. Heavy wooden thud (low-frequency impulse)
    const oscThud = ctx.createOscillator();
    const gainThud = ctx.createGain();

    oscThud.type = "sine";
    oscThud.frequency.setValueAtTime(140, now);
    oscThud.frequency.exponentialRampToValueAtTime(35, now + 0.12);

    gainThud.gain.setValueAtTime(1.0, now);
    gainThud.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    oscThud.connect(gainThud);
    gainThud.connect(ctx.destination);

    oscThud.start(now);
    oscThud.stop(now + 0.16);

    // 2. Paper slap & ink contact noise
    const oscSlap = ctx.createOscillator();
    const gainSlap = ctx.createGain();

    oscSlap.type = "triangle";
    oscSlap.frequency.setValueAtTime(320, now + 0.01);
    oscSlap.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    gainSlap.gain.setValueAtTime(0.4, now + 0.01);
    gainSlap.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    oscSlap.connect(gainSlap);
    gainSlap.connect(ctx.destination);

    oscSlap.start(now + 0.01);
    oscSlap.stop(now + 0.1);

    // 3. High harmonic sparkle chime (satisfying reward feeling)
    const oscChime = ctx.createOscillator();
    const gainChime = ctx.createGain();

    oscChime.type = "sine";
    oscChime.frequency.setValueAtTime(880, now + 0.06);
    oscChime.frequency.exponentialRampToValueAtTime(1760, now + 0.28);

    gainChime.gain.setValueAtTime(0.2, now + 0.06);
    gainChime.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    oscChime.connect(gainChime);
    gainChime.connect(ctx.destination);

    oscChime.start(now + 0.06);
    oscChime.stop(now + 0.36);
  } catch (err) {
    console.debug("Web Audio effect prevented:", err);
  }
};

export const HankoStampCard: React.FC<HankoStampCardProps> = ({
  className = "",
}) => {
  const { streak, practiceCountToday } = useAuth();
  const [weeklyLogs, setWeeklyLogs] = useState<DailyStudyLog[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayStampInfo | null>(null);
  const [justStamped, setJustStamped] = useState(false);
  const [demoStampedToday, setDemoStampedToday] = useState(false);

  // Fetch weekly study records
  useEffect(() => {
    let isMounted = true;
    studylogService.getWeeklyLogs().then((logs) => {
      if (isMounted && logs && logs.length > 0) {
        setWeeklyLogs(logs);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [practiceCountToday]);

  // Compute 7 days with realistic stamp tilt and status
  const weekDays = useMemo<DayStampInfo[]>(() => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentIsoDay = currentDay === 0 ? 7 : currentDay;

    const monday = new Date(now);
    monday.setDate(now.getDate() - (currentIsoDay - 1));

    const dayMeta = [
      { label: "Thứ 2", dayShortJp: "月", dayNumber: 1, tilt: -3.5 },
      { label: "Thứ 3", dayShortJp: "火", dayNumber: 2, tilt: 4.2 },
      { label: "Thứ 4", dayShortJp: "水", dayNumber: 3, tilt: -2.1 },
      { label: "Thứ 5", dayShortJp: "木", dayNumber: 4, tilt: 5.0 },
      { label: "Thứ 6", dayShortJp: "金", dayNumber: 5, tilt: -4.5 },
      { label: "Thứ 7", dayShortJp: "土", dayNumber: 6, tilt: 2.8 },
      { label: "Chủ nhật", dayShortJp: "日", dayNumber: 7, tilt: -1.5 },
    ];

    const logMap = new Map<string, DailyStudyLog>();
    weeklyLogs.forEach((l) => {
      if (l.date) {
        logMap.set(l.date, l);
      }
    });

    return dayMeta.map((item, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${day}`;

      const isToday = item.dayNumber === currentIsoDay;
      const isPast = item.dayNumber < currentIsoDay;
      const isFuture = item.dayNumber > currentIsoDay;

      const log = logMap.get(dateStr);
      let hasPracticed = false;
      let minutesSpent = log?.minutesSpent || 0;
      let practiceCount = log?.practiceCount || 0;

      if (isFuture) {
        hasPracticed = false;
      } else if (isToday) {
        hasPracticed = practiceCountToday > 0 || (log?.practiceCount || 0) > 0 || demoStampedToday;
        if (demoStampedToday && practiceCount === 0) {
          practiceCount = 1;
          minutesSpent = Math.max(minutesSpent, 5);
        }
      } else {
        if (log) {
          hasPracticed = (log.practiceCount || 0) > 0 || (log.minutesSpent || 0) > 0;
        } else if (streak > 0) {
          const daysAgo = currentIsoDay - item.dayNumber;
          hasPracticed = practiceCountToday > 0 ? daysAgo < streak : daysAgo <= streak;
          if (hasPracticed) {
            practiceCount = Math.max(1, practiceCount);
            minutesSpent = Math.max(10, minutesSpent);
          }
        }
      }

      return {
        label: item.label,
        dayNumber: item.dayNumber,
        date: dateStr,
        dayShortJp: item.dayShortJp,
        isToday,
        isPast,
        isFuture,
        hasPracticed,
        minutesSpent,
        practiceCount,
        stampTilt: item.tilt,
      };
    });
  }, [weeklyLogs, practiceCountToday, streak, demoStampedToday]);

  const practicedCount = useMemo(() => {
    return weekDays.filter((d) => d.hasPracticed).length;
  }, [weekDays]);

  const todayItem = useMemo(() => {
    return weekDays.find((d) => d.isToday);
  }, [weekDays]);

  // Demo action to test the stamp feel immediately
  const handleTriggerDemoStamp = useCallback(() => {
    playHankoStampAudio();
    setJustStamped(true);
    setDemoStampedToday(true);
    setTimeout(() => {
      setJustStamped(false);
    }, 1200);
  }, []);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-rose-200/90 dark:border-rose-900/40 bg-gradient-to-br from-rose-50/70 via-white to-amber-50/50 dark:from-slate-900 dark:via-[#111827] dark:to-rose-950/20 p-5 sm:p-6 shadow-sm font-sans transition-all ${className}`}
    >
      {/* Decorative Traditional Japanese Kamon / Sakura Ambient Accents */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-rose-200/20 dark:bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-200/20 dark:bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          {/* Traditional Inkan / Hanko Seal Icon */}
          <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex flex-col items-center justify-center font-black shadow-md shadow-rose-600/20 border-2 border-white/60 dark:border-rose-400/40 shrink-0">
            <span className="text-xs font-bold leading-none tracking-tighter">出席</span>
            <span className="text-2xs font-extrabold leading-none mt-0.5 opacity-90">判子</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Thẻ Điểm Danh Hanko 7 Ngày
              </h3>
              <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                ラジオ体操風
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Hoàn thành bài luyện nói mỗi ngày để được đóng mộc đỏ may mắn「済」
            </p>
          </div>
        </div>

        {/* Top Right: Streak & Weekly Progress */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 border border-rose-200 dark:border-rose-900/60 text-xs font-black text-rose-600 dark:text-rose-400 shadow-2xs">
            <Flame size={14} className="fill-rose-500 text-rose-500 animate-pulse" />
            <span>{streak} ngày liên tiếp</span>
          </div>

          <button
            onClick={handleTriggerDemoStamp}
            type="button"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100/80 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 hover:bg-amber-200/70 border border-amber-200/80 dark:border-amber-800/60 transition-all active:scale-95 cursor-pointer shadow-2xs"
            title="Thử hiệu ứng đóng dấu Hanko với âm thanh mộc gỗ"
          >
            <Volume2 size={13} />
            <span>Thử đóng dấu</span>
          </button>
        </div>
      </div>

      {/* 7-Day Stamp Grid (Authentic Japanese Stamp Card Layout) */}
      <div className="mt-5 grid grid-cols-7 gap-2 sm:gap-3.5 relative z-10">
        {weekDays.map((day) => {
          const isStamped = day.hasPracticed;
          const isInteractive = day.isToday && !isStamped;

          return (
            <div
              key={day.dayNumber}
              onClick={() => setSelectedDay(day)}
              className={`group relative flex flex-col items-center justify-between rounded-2xl p-2 sm:p-3 border transition-all duration-300 cursor-pointer select-none ${
                day.isToday
                  ? "bg-white dark:bg-slate-800/95 border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20 shadow-md"
                  : isStamped
                  ? "bg-white/80 dark:bg-slate-800/60 border-rose-200/80 dark:border-rose-900/50 hover:border-rose-300 shadow-2xs"
                  : day.isPast
                  ? "bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-70"
                  : "bg-slate-50/50 dark:bg-slate-900/20 border-dashed border-slate-300 dark:border-slate-800 opacity-60"
              }`}
            >
              {/* Day Header */}
              <div className="text-center w-full">
                <span
                  className={`text-3xs sm:text-2xs font-black uppercase tracking-wider block ${
                    day.isToday
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {day.label}
                </span>
                <span className="text-3xs font-extrabold text-slate-400 dark:text-slate-500 block -mt-0.5">
                  ({day.dayShortJp})
                </span>
              </div>

              {/* Central Stamp Area */}
              <div className="h-14 sm:h-18 flex items-center justify-center my-1 relative w-full">
                {isStamped ? (
                  /* Red Vermilion Hanko Stamp Visual (朱肉・判子) */
                  <div
                    style={{ transform: `rotate(${day.stampTilt}deg)` }}
                    className={`relative w-11 h-11 sm:w-14 sm:h-14 rounded-full border-2 sm:border-[2.5px] border-rose-600 dark:border-rose-500 text-rose-600 dark:text-rose-500 flex flex-col items-center justify-center font-serif shadow-xs ${
                      day.isToday && justStamped ? "animate-bounce scale-110" : "transition-transform group-hover:scale-108"
                    }`}
                  >
                    {/* Inner seal circle */}
                    <div className="absolute inset-0.5 sm:inset-1 rounded-full border border-rose-500/40 pointer-events-none" />

                    {/* Red Ink Seal Character (済 / Sumi - Completed) */}
                    <span className="text-sm sm:text-lg font-black tracking-tight leading-none">
                      済
                    </span>
                    <span className="text-4xs sm:text-3xs font-extrabold uppercase tracking-widest opacity-80 scale-90 -mt-0.5">
                      OK
                    </span>

                    {/* Sparkle badge for today */}
                    {day.isToday && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-xs">
                        <Sparkles size={9} />
                      </div>
                    )}
                  </div>
                ) : isInteractive ? (
                  /* Today Pending: Prompting to Stamp */
                  <Link
                    to="/speaking"
                    onClick={(e) => e.stopPropagation()}
                    className="w-10 h-10 sm:w-13 sm:h-13 rounded-full border-2 border-dashed border-rose-400 dark:border-rose-500/80 bg-rose-50/80 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 flex flex-col items-center justify-center font-bold text-3xs sm:text-2xs hover:scale-108 active:scale-95 transition-transform animate-pulse"
                    title="Luyện phản xạ ngay để đóng mộc!"
                  >
                    <span>Luyện</span>
                    <span className="text-4xs -mt-0.5">nói</span>
                  </Link>
                ) : (
                  /* Empty Dashed Circle for other days */
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-600 text-xs">
                    <span>{day.dayNumber}</span>
                  </div>
                )}
              </div>

              {/* Day Bottom Status */}
              <div className="w-full text-center">
                {isStamped ? (
                  <span className="inline-block text-4xs sm:text-3xs font-black text-rose-700 dark:text-rose-300 bg-rose-100/90 dark:bg-rose-950/80 px-1 sm:px-1.5 py-0.5 rounded-md">
                    {day.minutesSpent > 0 ? `${day.minutesSpent}p` : "Xong"}
                  </span>
                ) : day.isToday ? (
                  <span className="inline-block text-4xs sm:text-3xs font-extrabold text-amber-700 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/80 px-1 py-0.5 rounded-md animate-pulse">
                    Hôm nay
                  </span>
                ) : (
                  <span className="text-4xs sm:text-3xs font-medium text-slate-400">
                    --
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Weekly Progress Bar & Reward Milestone */}
      <div className="mt-5 pt-4 border-t border-rose-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs relative z-10">
        <div className="flex-1 max-w-md">
          <div className="flex items-center justify-between text-2xs font-extrabold text-slate-600 dark:text-slate-300 mb-1.5">
            <span>Tiến độ tuần: {practicedCount}/7 dấu</span>
            <span className="text-rose-600 dark:text-rose-400 font-black">
              {Math.round((practicedCount / 7) * 100)}%
            </span>
          </div>

          {/* Progress track */}
          <div className="h-2 w-full rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 transition-all duration-500"
              style={{ width: `${(practicedCount / 7) * 100}%` }}
            />
          </div>
        </div>

        {/* Milestone reward & practice action */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-2xs font-extrabold text-slate-500 dark:text-slate-400">
            {practicedCount === 7 ? (
              <Trophy size={14} className="text-amber-500 animate-bounce" />
            ) : (
              <Gift size={14} className="text-amber-500" />
            )}
            <span>
              {practicedCount === 7
                ? "Đã mở khóa danh hiệu tuần!"
                : `Còn ${7 - practicedCount} ngày để nhận rương quà`}
            </span>
          </div>

          {!todayItem?.hasPracticed && (
            <Link
              to="/speaking"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-xs hover:shadow-md transition-all active:scale-95"
            >
              <span>Luyện để đóng dấu</span>
              <ArrowRight size={13} />
            </Link>
          )}
        </div>
      </div>

      {/* Modal/Tooltip when clicking on a day */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-2xs">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-3xl p-5 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-300 flex items-center justify-center font-bold text-xs">
                  {selectedDay.dayShortJp}
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    {selectedDay.label} ({selectedDay.date})
                  </h4>
                  <p className="text-3xs text-slate-500 dark:text-slate-400 font-medium">
                    Chi tiết nhật ký điểm danh
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDay(null)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Đóng"
              >
                <X size={14} />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Trạng thái mộc Hanko:
                </span>
                {selectedDay.hasPracticed ? (
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-rose-600 dark:text-rose-400">
                    <CheckCircle2 size={14} />
                    <span>Đã đóng dấu 「済」</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-400">
                    Chưa đóng dấu
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-3xs font-extrabold text-slate-400 uppercase">
                    Thời lượng
                  </span>
                  <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {selectedDay.minutesSpent} phút
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-3xs font-extrabold text-slate-400 uppercase">
                    Bài phản xạ
                  </span>
                  <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {selectedDay.practiceCount} bài
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedDay(null)}
                type="button"
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Đóng
              </button>

              {selectedDay.isToday && !selectedDay.hasPracticed && (
                <Link
                  to="/speaking"
                  onClick={() => setSelectedDay(null)}
                  className="flex-1 py-2.5 rounded-2xl text-xs font-black text-center bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition"
                >
                  Luyện nói ngay
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HankoStampCard;
