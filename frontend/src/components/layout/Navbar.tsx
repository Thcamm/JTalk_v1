import { useState } from "react";
import { Link } from "react-router";
import {
  Search,
  Flame,
  Sparkles,
  Mic,
  Gift,
  Sun,
  Moon,
  Menu,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSidebarStore } from "@/stores/useSidebarStore";
import { useThemeStore } from "@/stores/useThemeStore";
import Logout from "../auth/Logout";
import { PremiumModal } from "@/components/common/PremiumModal";
import { Badge } from "@/components/common/Badge";

export default function Navbar() {
  const { user, isPremium, streak, remainingFreePractices } = useAuth();
  const { toggleSidebar } = useSidebarStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const targetLevel = user?.profile?.targetLevel || "N5";
  const xpPoints = user?.gamification?.totalXp || 0;

  return (
    <>
      <header className="sticky top-0 z-30 h-18 px-4 sm:px-8 flex items-center justify-between gap-4 bg-white/85 dark:bg-[#0f172a]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-2xs font-sans transition-colors duration-200">
        {/* Left Section: Mobile Menu Trigger & Search */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          {/* Mobile Menu Button */}
          <button
            onClick={toggleSidebar}
            type="button"
            className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Toggle navigation menu"
          >
            <Menu size={18} />
          </button>

          {/* Search input - Rounded full pill with keyboard shortcut */}
          <div className="relative w-full hidden sm:block">
            <Search
              size={15}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
            <input
              placeholder="Tìm bài học, kịch bản phỏng vấn, từ vựng..."
              className="h-10 w-full rounded-full bg-slate-100/90 dark:bg-slate-800/70 pl-10 pr-12 text-xs font-medium outline-hidden border border-transparent dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all focus:bg-white dark:focus:bg-slate-800 focus:border-rose-500 dark:focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 shadow-2xs"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-3xs font-bold text-slate-400 dark:text-slate-500 bg-white/80 dark:bg-slate-700/80 px-1.5 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-600">
              ⌘K
            </span>
          </div>
        </div>

        {/* Right Section: Badges, Actions, Theme Toggle & User */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Quick Action: Start AI Speaking */}
          <Link
            to="/speaking"
            className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white rounded-full text-xs font-bold shadow-xs hover:shadow-md hover:shadow-rose-500/20 active:scale-97 transition-all cursor-pointer"
          >
            <Mic size={14} className="animate-pulse" />
            <span>Luyện phản xạ</span>
          </Link>

          {/* Daily Streak Badge */}
          <div
            className="flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 px-3 py-1.5 text-xs font-black text-rose-900 dark:text-rose-200 shrink-0 cursor-default hover:scale-103 transition-transform"
            title={`Bạn đang giữ chuỗi ${streak} ngày học liên tiếp!`}
          >
            <Flame size={15} className="text-rose-500 fill-rose-500 animate-pulse" />
            <span>{streak} ngày</span>
          </div>

          {/* XP Pill (Hidden on mobile) */}
          {xpPoints > 0 && (
            <div
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-full text-xs font-black text-amber-900 dark:text-amber-200 shrink-0"
              title={`Tổng điểm kinh nghiệm: ${xpPoints} XP`}
            >
              <Trophy size={13} className="text-amber-500" />
              <span>{xpPoints} XP</span>
            </div>
          )}

          {/* Quota / Premium Badge */}
          {isPremium ? (
            <Badge variant="premium" size="sm" icon={<Sparkles className="w-3 h-3" />}>
              PRO Vô Hạn
            </Badge>
          ) : (
            <button
              onClick={() => setShowPremiumModal(true)}
              type="button"
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border shadow-2xs ${
                remainingFreePractices > 0
                  ? "bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60"
                  : "bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 text-rose-700 dark:text-rose-300 border-rose-300/80 dark:border-rose-800/60 animate-pulse"
              }`}
            >
              <Gift
                size={13}
                className="text-rose-600 dark:text-rose-400"
              />
              <span>
                {remainingFreePractices > 0
                  ? `Còn ${remainingFreePractices}/2 lượt`
                  : "Hết lượt (0/2)"}
              </span>
              <span className="font-extrabold underline underline-offset-2 ml-0.5">
                Nâng cấp
              </span>
            </button>
          )}

          {/* Theme Toggle Button (Light / Dark) */}
          <button
            onClick={toggleTheme}
            type="button"
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            title={isDark ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
            aria-label="Toggle color theme"
          >
            {isDark ? (
              <Sun size={16} className="text-amber-400 animate-spin-slow" />
            ) : (
              <Moon size={16} className="text-slate-600" />
            )}
          </button>

          {/* User Profile Avatar with Level Ring */}
          <Link
            to="/profile"
            className="flex items-center gap-2 group relative p-0.5 rounded-full"
            title="Xem hồ sơ cá nhân"
          >
            <div className="h-9 w-9 rounded-full p-0.5 bg-gradient-to-tr from-rose-500 via-rose-600 to-amber-500 group-hover:scale-105 transition-transform shadow-2xs">
              <div className="w-full h-full rounded-full bg-rose-600 dark:bg-slate-900 text-white font-black text-xs flex items-center justify-center border-2 border-white dark:border-[#0f172a]">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "J"}
              </div>
            </div>
            <span className="hidden xl:inline-block text-2xs font-extrabold px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              {targetLevel}
            </span>
          </Link>

          {/* Discreet Logout Icon */}
          <Logout />
        </div>
      </header>

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        reason="quota_exceeded"
      />
    </>
  );
}
