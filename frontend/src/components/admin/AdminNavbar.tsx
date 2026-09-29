"use client";

import { useSidebarStore } from "@/stores/useSidebarStore";
import { useAuth } from "@/hooks/useAuth";
import { useThemeStore } from "@/stores/useThemeStore";
import Logout from "@/components/auth/Logout";
import Link from "next/link";
import {
  Menu,
  PlusCircle,
  Sun,
  Moon,
  Shield,
  Video,
  ExternalLink,
} from "lucide-react";

export default function AdminNavbar() {
  const { toggleSidebar } = useSidebarStore();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <header className="sticky top-0 z-30 h-18 px-4 sm:px-8 flex items-center justify-between gap-4 bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-800 text-slate-100 shadow-sm font-sans transition-colors duration-200">
      {/* Left: Mobile menu trigger & portal title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          type="button"
          className="lg:hidden w-9 h-9 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-400">
              JTalk Studio
            </span>
            <span className="text-slate-600 font-mono">/</span>
          </div>
          <span className="text-sm font-bold text-slate-200">
            Hệ thống Quản trị & Nội dung
          </span>
        </div>
      </div>

      {/* Right: Quick actions, Theme Toggle, Admin User info, Logout */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Action: New YouTube Lesson */}
        <Link
          href="/admin/lessons/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
        >
          <Video size={14} className="text-red-300" />
          <span className="hidden xs:inline">+ Thêm Video YouTube</span>
          <span className="xs:hidden">+ Video</span>
        </Link>

        {/* View Student Site Link */}
        <Link
          href="/dashboard"
          target="_blank"
          title="Mở giao diện Học viên trong tab mới"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors"
        >
          <span>Xem web</span>
          <ExternalLink size={13} className="text-slate-400" />
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          type="button"
          className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 flex items-center justify-center transition-colors cursor-pointer"
          title="Chuyển đổi giao diện Sáng / Tối"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Admin profile pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow-xs ring-2 ring-indigo-500/40">
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "A"}
          </div>
          <div className="hidden xl:block text-left text-xs">
            <span className="block font-bold text-slate-200 truncate max-w-[120px]">
              {user?.displayName || user?.username || "Admin"}
            </span>
            <span className="block text-[10px] text-indigo-400 font-black uppercase">
              Quản trị viên
            </span>
          </div>
          <Logout />
        </div>
      </div>
    </header>
  );
}
