import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Star,
  Zap,
  Flame,
  X,
} from "lucide-react";
import SidebarItem from "./SidebarItem";
import { sidebarItems } from "./sidebar-data";
import { useAuth } from "@/hooks/useAuth";
import { useSidebarStore } from "@/stores/useSidebarStore";
import { studylogService, type DailyStudyLog } from "@/services/studylog.service";

interface WeekDayInfo {
  label: string;
  dayNumber: number; // 1 (Th2) to 7 (CN)
  date: string; // YYYY-MM-DD
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  hasPracticed: boolean;
}

export default function Sidebar() {
  const { isPremium, streak, practiceCountToday } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebarStore();
  const [weeklyLogs, setWeeklyLogs] = useState<DailyStudyLog[]>([]);

  // Fetch real study logs for weekly progress
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

  // Compute 7 calendar days of the current week (Th2 -> CN) with accurate practice status
  const weekDays = useMemo<WeekDayInfo[]>(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday...
    const currentIsoDay = currentDay === 0 ? 7 : currentDay; // 1 (Mon) -> 7 (Sun)

    // Find Monday of the current week
    const monday = new Date(now);
    monday.setDate(now.getDate() - (currentIsoDay - 1));

    const weekLabels = [
      { label: "Th2", dayNumber: 1 },
      { label: "Th3", dayNumber: 2 },
      { label: "Th4", dayNumber: 3 },
      { label: "Th5", dayNumber: 4 },
      { label: "Th6", dayNumber: 5 },
      { label: "Th7", dayNumber: 6 },
      { label: "CN", dayNumber: 7 },
    ];

    const logMap = new Map<string, number>();
    weeklyLogs.forEach((l) => {
      if (l.date) {
        logMap.set(l.date, l.practiceCount || (l.minutesSpent > 0 ? 1 : 0));
      }
    });

    return weekLabels.map((item, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${day}`;

      const isToday = item.dayNumber === currentIsoDay;
      const isPast = item.dayNumber < currentIsoDay;
      const isFuture = item.dayNumber > currentIsoDay;

      let hasPracticed = false;

      if (isFuture) {
        hasPracticed = false;
      } else if (isToday) {
        const logged = logMap.get(dateStr) || 0;
        hasPracticed = practiceCountToday > 0 || logged > 0;
      } else {
        // Past day in current week
        if (logMap.has(dateStr)) {
          hasPracticed = (logMap.get(dateStr) || 0) > 0;
        } else if (streak > 0) {
          // Fallback streak mapping if logs haven't synced
          const daysAgo = currentIsoDay - item.dayNumber;
          if (practiceCountToday > 0) {
            hasPracticed = daysAgo < streak;
          } else {
            hasPracticed = daysAgo <= streak;
          }
        }
      }

      return {
        label: item.label,
        dayNumber: item.dayNumber,
        date: dateStr,
        isToday,
        isPast,
        isFuture,
        hasPracticed,
      };
    });
  }, [weeklyLogs, practiceCountToday, streak]);

  return (
    <>
      {/* Mobile Backdrop Overlay when open */}
      <div
        onClick={toggleSidebar}
        className={`lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity duration-300 ${
          isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      />

      <aside
        className={`fixed left-0 top-0 h-screen bg-white dark:bg-[#0f172a] border-r border-slate-200/80 dark:border-slate-800/80 shadow-xs z-50 flex flex-col justify-between font-sans transition-all duration-300 ${
          isCollapsed
            ? "w-20 max-lg:-translate-x-full lg:translate-x-0"
            : "w-64 translate-x-0 shadow-2xl lg:shadow-xs"
        }`}
      >
        <div className="overflow-y-auto no-scrollbar">
          {/* Top Header & Logo */}
          <div className="h-18 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800/80 relative">
            <Link to="/" className="flex items-center gap-2.5 min-w-0 group">
              {/* Mascot avatar */}
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 group-hover:rotate-3 transition-transform shrink-0">
                <span className="text-xl select-none">🐸</span>
              </div>

              {!isCollapsed && (
                <div className="min-w-0">
                  <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight block truncate">
                    JTalk
                  </span>
                  <span className="text-3xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block -mt-1 truncate">
                    AI Reflex Kaiwa
                  </span>
                </div>
              )}
            </Link>

            {/* Collapse toggle button */}
            <button
              onClick={toggleSidebar}
              type="button"
              className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn"}
            >
              {/* On mobile screens when expanded, show an X button to close easily */}
              <span className="lg:hidden">
                <X size={14} />
              </span>
              <span className="hidden lg:inline-flex">
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </span>
            </button>
          </div>

          {/* Weekly Streak Stars Widget (Only shown when expanded) */}
          {!isCollapsed && (
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center justify-between text-2xs font-extrabold text-slate-500 dark:text-slate-400 mb-1.5">
                <span>Streak tuần này</span>
                <span className="text-amber-500 dark:text-amber-400 flex items-center gap-0.5">
                  <Flame size={12} className="fill-amber-500" />
                  {streak} ngày
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {weekDays.map((day) => {
                  return (
                    <div
                      key={day.label}
                      className="flex flex-col items-center group relative"
                      title={`${day.label} (${day.date}): ${
                        day.hasPracticed
                          ? "Đã hoàn thành luyện nói"
                          : day.isToday
                          ? "Hôm nay - Luyện nói ngay để giữ streak!"
                          : day.isPast
                          ? "Chưa luyện tập"
                          : "Sắp tới"
                      }`}
                    >
                      <div className="h-4.5 flex items-center justify-center">
                        {day.hasPracticed ? (
                          <Star
                            size={13}
                            className="text-amber-400 fill-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.6)] animate-in fade-in zoom-in duration-200"
                          />
                        ) : day.isToday ? (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-amber-400 dark:border-amber-400 flex items-center justify-center animate-pulse">
                            <div className="w-1 h-1 rounded-full bg-amber-400" />
                          </div>
                        ) : (
                          <Star
                            size={13}
                            className="text-slate-300 dark:text-slate-700 stroke-1"
                          />
                        )}
                      </div>
                      <span
                        className={`text-3xs mt-0.5 font-bold transition-colors ${
                          day.isToday
                            ? "text-amber-600 dark:text-amber-400 font-black underline decoration-amber-400 decoration-2 underline-offset-2"
                            : day.hasPracticed
                            ? "text-slate-700 dark:text-slate-300 font-extrabold"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {day.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="p-3 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;

              return (
                <SidebarItem
                  key={item.to}
                  icon={<Icon size={18} />}
                  text={item.text}
                  to={item.to}
                  highlight={item.highlight}
                  isCollapsed={isCollapsed}
                />
              );
            })}
          </nav>
        </div>

        {/* Upgrade banner / Button at bottom */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80">
          {isCollapsed ? (
            <Link
              to="/checkout"
              className="w-11 h-11 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md hover:scale-105 transition-transform"
              title="Nâng cấp gói Premium"
            >
              <Sparkles size={18} className="text-amber-300" />
            </Link>
          ) : isPremium ? (
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 p-3 text-center">
              <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-1.5">
                <Zap size={14} className="text-amber-500 fill-amber-500" />
                <span>Gói Premium Vô Hạn</span>
              </span>
            </div>
          ) : (
            <Link
              to="/checkout"
              className="w-full py-3 px-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:brightness-105 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:shadow-emerald-500/20 active:translate-y-0.5 transition-all"
            >
              <Sparkles size={15} className="text-amber-300 animate-spin-slow" />
              <span>Nâng cấp Plus 99k</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
