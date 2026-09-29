"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "@/lib/react-router-compat";
import {
  Flame,
  Sparkles,
  Gift,
  ArrowRight,
  Volume2,
  CheckCircle2,
  Trophy,
  X,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { studylogService, type DailyStudyLog } from "@/services/studylog.service";

interface HankoStampCardProps {
  className?: string;
  onStampSuccess?: () => void;
}

interface DayStampInfo {
  label: string; // "Thứ 2", "Thứ 3", ...
  shortLabel: string; // "T2", "T3", "T4", "T5", "T6", "T7", "CN"
  dayNumber: number; // 1 (Th2) to 7 (CN)
  dayOfMonth: number; // 28, 29, 30, 1...
  dateFormatted: string; // "28/9", "29/9"
  date: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  hasPracticed: boolean;
  minutesSpent: number;
  practiceCount: number;
  stampTilt: number; // Random tilt angle for realism (-5 to 5 deg)
}

// Play authentic wooden stamp sound using Web Audio API
export const playHankoStampAudio = () => {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
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

    // 3. High harmonic sparkle chime (reward feeling)
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

  // Compute 7 days of the week in pure Vietnamese
  const weekDays = useMemo<DayStampInfo[]>(() => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentIsoDay = currentDay === 0 ? 7 : currentDay;

    const monday = new Date(now);
    monday.setDate(now.getDate() - (currentIsoDay - 1));

    const dayMeta = [
      { label: "Thứ 2", shortLabel: "T2", dayNumber: 1, tilt: -3.5 },
      { label: "Thứ 3", shortLabel: "T3", dayNumber: 2, tilt: 4.0 },
      { label: "Thứ 4", shortLabel: "T4", dayNumber: 3, tilt: -2.0 },
      { label: "Thứ 5", shortLabel: "T5", dayNumber: 4, tilt: 4.5 },
      { label: "Thứ 6", shortLabel: "T6", dayNumber: 5, tilt: -4.0 },
      { label: "Thứ 7", shortLabel: "T7", dayNumber: 6, tilt: 2.5 },
      { label: "Chủ nhật", shortLabel: "CN", dayNumber: 7, tilt: -1.5 },
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
      const dayOfMonth = d.getDate();
      const dateFormatted = `${dayOfMonth}/${d.getMonth() + 1}`;

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
        hasPracticed =
          practiceCountToday > 0 ||
          (log?.practiceCount || 0) > 0 ||
          demoStampedToday;
        if (demoStampedToday && practiceCount === 0) {
          practiceCount = 1;
          minutesSpent = Math.max(minutesSpent, 5);
        }
      } else {
        if (log) {
          hasPracticed =
            (log.practiceCount || 0) > 0 || (log.minutesSpent || 0) > 0;
        } else if (streak > 0) {
          const daysAgo = currentIsoDay - item.dayNumber;
          hasPracticed =
            practiceCountToday > 0 ? daysAgo < streak : daysAgo <= streak;
          if (hasPracticed) {
            practiceCount = Math.max(1, practiceCount);
            minutesSpent = Math.max(10, minutesSpent);
          }
        }
      }

      return {
        label: item.label,
        shortLabel: item.shortLabel,
        dayNumber: item.dayNumber,
        dayOfMonth,
        dateFormatted,
        date: dateStr,
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
      className={`relative overflow-hidden rounded-3xl border border-rose-200/90 dark:border-rose-900/40 bg-gradient-to-br from-rose-50/70 via-white to-amber-50/50 dark:from-slate-900 dark:via-[#111827] dark:to-rose-950/20 p-5 sm:p-6 shadow-xs font-sans transition-all ${className}`}
    >
      {/* Decorative Ambient Accents */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-rose-200/20 dark:bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-200/20 dark:bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          {/* Badge Icon */}
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex flex-col items-center justify-center font-black shadow-md shadow-rose-600/20 border-2 border-white/60 dark:border-rose-400/40 shrink-0">
            <Calendar size={18} />
            <span className="text-3xs font-black tracking-wider uppercase mt-0.5">
              7 NGÀY
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Thẻ Điểm Danh 7 Ngày
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                Mục tiêu tuần
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Luyện nói ít nhất 1 bài mỗi ngày để tích mộc điểm danh và duy trì chuỗi Streak!
            </p>
          </div>
        </div>

        {/* Top Right: Streak & Action */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 border border-rose-200 dark:border-rose-900/60 text-xs font-black text-rose-600 dark:text-rose-400 shadow-2xs">
            <Flame size={14} className="fill-rose-500 text-rose-500 animate-pulse" />
            <span>{streak} ngày liên tiếp</span>
          </div>

          <button
            onClick={handleTriggerDemoStamp}
            type="button"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100/80 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 hover:bg-amber-200/70 border border-amber-200/80 dark:border-amber-800/60 transition-all active:scale-95 cursor-pointer shadow-2xs"
            title="Thử hiệu ứng đóng dấu với âm thanh mộc gỗ"
          >
            <Volume2 size={13} />
            <span>Thử đóng dấu</span>
          </button>
        </div>
      </div>

      {/* 7-Day Grid Layout */}
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
              {/* Day Header - Clean, non-redundant, modern */}
              <div className="text-center w-full">
                <span
                  className={`text-xs sm:text-sm font-black block tracking-tight leading-tight ${
                    day.isToday
                      ? "text-rose-600 dark:text-rose-400"
                      : isStamped
                      ? "text-slate-800 dark:text-slate-200"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {day.shortLabel}
                </span>
                <span
                  className={`text-3xs sm:text-2xs font-semibold block leading-tight mt-0.5 ${
                    day.isToday
                      ? "text-rose-500/80 dark:text-rose-400/80 font-bold"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {day.dateFormatted}
                </span>
              </div>

              {/* Central Stamp Area */}
              <div className="h-13 sm:h-16 flex items-center justify-center my-1 relative w-full">
                {isStamped ? (
                  /* Red Vermilion Stamp Visual (Pure Vietnamese, high-contrast ink seal) */
                  <div
                    style={{ transform: `rotate(${day.stampTilt}deg)` }}
                    className={`relative w-11 h-11 sm:w-14 sm:h-14 rounded-full border-2 border-rose-600 dark:border-rose-500 bg-rose-100/90 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 flex flex-col items-center justify-center font-sans shadow-sm shadow-rose-500/10 dark:shadow-rose-950/40 select-none ${
                      day.isToday && justStamped
                        ? "animate-bounce scale-110"
                        : "transition-transform group-hover:scale-105"
                    }`}
                  >
                    {/* Inner seal circle */}
                    <div className="absolute inset-0.5 sm:inset-1 rounded-full border border-rose-500/50 dark:border-rose-400/40 pointer-events-none" />

                    {/* Checkmark icon */}
                    <CheckCircle2
                      size={14}
                      className="sm:w-4 sm:h-4 text-rose-600 dark:text-rose-400 stroke-[2.5]"
                    />

                    {/* Single line, strictly whitespace-nowrap, never overflows */}
                    <span className="text-[9px] sm:text-[10px] font-black tracking-wider uppercase whitespace-nowrap text-rose-700 dark:text-rose-300 leading-none mt-0.5">
                      ĐÃ HỌC
                    </span>

                    {/* Sparkle badge for today */}
                    {day.isToday && (
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-xs">
                        <Sparkles size={8} className="sm:w-2.5 sm:h-2.5" />
                      </div>
                    )}
                  </div>
                ) : isInteractive ? (
                  /* Today Pending: Prompting to Practice */
                  <Link
                    to="/speaking"
                    onClick={(e) => e.stopPropagation()}
                    className="w-10 h-10 sm:w-13 sm:h-13 rounded-full border-2 border-dashed border-rose-400 dark:border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 flex flex-col items-center justify-center font-bold hover:scale-105 active:scale-95 transition-transform shadow-xs animate-pulse"
                    title="Luyện nói ngay để điểm danh hôm nay!"
                  >
                    <span className="text-3xs sm:text-2xs font-black leading-none">Học</span>
                    <span className="text-4xs sm:text-3xs font-extrabold text-rose-500 dark:text-rose-400 leading-none mt-0.5">ngay</span>
                  </Link>
                ) : (
                  /* Empty Dashed Circle for other days */
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-center text-slate-400 dark:text-slate-500 text-2xs sm:text-xs font-bold">
                    <span>{day.dayOfMonth}</span>
                  </div>
                )}
              </div>

              {/* Day Bottom Status */}
              <div className="w-full text-center">
                {isStamped ? (
                  <span className="inline-block text-3xs sm:text-2xs font-black text-rose-700 dark:text-rose-300 bg-rose-100/90 dark:bg-rose-950/80 border border-rose-200/80 dark:border-rose-900/60 px-1.5 py-0.5 rounded-md leading-none">
                    {day.minutesSpent > 0 ? `${day.minutesSpent}p` : "Đạt"}
                  </span>
                ) : day.isToday ? (
                  <span className="inline-block text-3xs sm:text-2xs font-extrabold text-amber-700 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/80 border border-amber-200/80 dark:border-amber-900/60 px-1.5 py-0.5 rounded-md leading-none animate-pulse">
                    Hôm nay
                  </span>
                ) : (
                  <span className="text-3xs sm:text-2xs font-medium text-slate-400 dark:text-slate-600 leading-none">
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
            <span>Tiến độ tuần: {practicedCount}/7 ngày</span>
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
                ? "Đã hoàn thành mục tiêu tuần!"
                : `Còn ${7 - practicedCount} ngày để hoàn thành tuần`}
            </span>
          </div>

          {!todayItem?.hasPracticed && (
            <Link
              to="/speaking"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-xs hover:shadow-md transition-all active:scale-95"
            >
              <span>Luyện nói ngay</span>
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
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-300 flex items-center justify-center font-black text-sm">
                  {selectedDay.shortLabel}
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    {selectedDay.label} ({selectedDay.date})
                  </h4>
                  <p className="text-3xs text-slate-500 dark:text-slate-400 font-medium">
                    Nhật ký học tập trong tuần
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
                  Trạng thái điểm danh:
                </span>
                {selectedDay.hasPracticed ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rose-600 dark:text-rose-400">
                    <CheckCircle2 size={14} />
                    <span>Đã hoàn thành</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-400">
                    Chưa điểm danh
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
                    Bài luyện nói
                  </span>
                  <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {selectedDay.practiceCount} bài
                  </p>
                </div>
              </div>
            </div>

            {selectedDay.isToday && !selectedDay.hasPracticed && (
              <Link
                to="/speaking"
                onClick={() => setSelectedDay(null)}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Luyện nói để điểm danh hôm nay</span>
                <ArrowRight size={13} />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HankoStampCard;
