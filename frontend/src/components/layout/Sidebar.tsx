import { Link } from "react-router";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Star,
  Zap,
} from "lucide-react";
import SidebarItem from "./SidebarItem";
import { sidebarItems } from "./sidebar-data";
import { useAuth } from "@/hooks/useAuth";
import { useSidebarStore } from "@/stores/useSidebarStore";

export default function Sidebar() {
  const { isPremium, streak } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebarStore();

  // Days of week for streak widget
  const daysOfWeek = [
    { label: "Th2", key: 1 },
    { label: "Th3", key: 2 },
    { label: "Th4", key: 3 },
    { label: "Th5", key: 4 },
    { label: "Th6", key: 5 },
    { label: "Th7", key: 6 },
    { label: "CN", key: 0 },
  ];

  // Get current day of week (0 is Sunday, 1 is Monday...)
  const currentDayIndex = new Date().getDay();

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-200/80 shadow-xs z-40 flex flex-col justify-between font-sans transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="overflow-y-auto no-scrollbar">
        {/* Top Header & Logo */}
        <div className="h-18 flex items-center justify-between px-4 border-b border-slate-100 relative">
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            {/* Mascot avatar */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-green-500 flex items-center justify-center text-white font-black text-xl shadow-xs shrink-0 group hover:scale-105 transition-transform">
              <span className="text-xl">🐸</span>
            </div>

            {!isCollapsed && (
              <div className="min-w-0">
                <span className="text-lg font-black text-slate-900 tracking-tight block truncate">
                  JTalk
                </span>
                <span className="text-3xs font-bold text-emerald-600 uppercase tracking-wider block -mt-1 truncate">
                  AI Reflex Kaiwa
                </span>
              </div>
            )}
          </Link>

          {/* Collapse toggle button */}
          <button
            onClick={toggleSidebar}
            type="button"
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Weekly Streak Stars Widget (Only shown when expanded) */}
        {!isCollapsed && (
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center justify-between text-2xs font-bold text-slate-500 mb-1.5">
              <span>Streak tuần này</span>
              <span className="text-amber-500 flex items-center gap-0.5">
                🔥 {streak} ngày
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {daysOfWeek.map((day) => {
                const isPastOrToday =
                  day.key <= currentDayIndex || (day.key === 0 && currentDayIndex === 0);
                const hasStreak = isPastOrToday && streak > 0;

                return (
                  <div key={day.label} className="flex flex-col items-center">
                    <Star
                      size={14}
                      className={
                        hasStreak
                          ? "text-emerald-500 fill-emerald-500"
                          : "text-slate-300 stroke-1"
                      }
                    />
                    <span className="text-3xs text-slate-400 mt-0.5">{day.label}</span>
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
      <div className="p-3">
        {isCollapsed ? (
          <Link
            to="/checkout"
            className="w-10 h-10 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md hover:scale-105 transition-transform"
            title="Nâng cấp gói Premium"
          >
            <Sparkles size={18} className="text-amber-300" />
          </Link>
        ) : isPremium ? (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-center">
            <span className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1">
              <Zap size={14} className="text-amber-500 fill-amber-500" />
              <span>Gói Premium Vô Hạn</span>
            </span>
          </div>
        ) : (
          <Link
            to="/checkout"
            className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:opacity-95 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <Sparkles size={15} className="text-amber-300" />
            <span>Nâng cấp Plus 99k</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
