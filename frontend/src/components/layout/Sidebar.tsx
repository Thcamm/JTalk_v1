"use client";

import { useState, useEffect } from "react";
import { Link } from "@/lib/react-router-compat";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Zap,
  X,
  ShieldCheck,
} from "lucide-react";
import SidebarItem from "./SidebarItem";
import { sidebarItems } from "./sidebar-data";
import { useAuth } from "@/hooks/useAuth";
import { useSidebarStore } from "@/stores/useSidebarStore";

export default function Sidebar() {
  const { isPremium, user } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebarStore();

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
            <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0 group">
              {/* Mascot / Logo avatar */}
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 group-hover:rotate-3 transition-transform shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 rounded-2xl animate-pulse" />
                <Sparkles size={20} className="text-white animate-spin-slow relative z-10" />
              </div>

              {!isCollapsed && (
                <div className="min-w-0">
                  <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight block truncate">
                    JTalk AI
                  </span>
                  <span className="text-3xs font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-widest block -mt-1 truncate">
                    Luyện Nói Tiếng Nhật
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

            {user?.role === "admin" && (
              <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                <SidebarItem
                  icon={<ShieldCheck size={18} className="text-indigo-500" />}
                  text="Cổng Quản Trị"
                  to="/admin"
                  highlight={false}
                  isCollapsed={isCollapsed}
                />
              </div>
            )}
          </nav>
        </div>

        {/* Upgrade banner / Button at bottom */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80">
          {user?.role === "admin" ? (
            isCollapsed ? (
              <Link
                to="/admin"
                className="w-11 h-11 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:scale-105 transition-transform"
                title="Cổng Quản trị viên"
              >
                <ShieldCheck size={18} />
              </Link>
            ) : (
              <div className="rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 p-3 text-center">
                <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 flex items-center justify-center gap-1.5">
                  <ShieldCheck size={14} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Quản Trị Viên</span>
                </span>
                <span className="text-[10px] text-indigo-700/80 dark:text-indigo-400/80 block mt-0.5 font-bold">
                  Toàn quyền hệ thống
                </span>
              </div>
            )
          ) : isCollapsed ? (
            <Link
              to="/checkout"
              className="w-11 h-11 mx-auto rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20 hover:scale-105 transition-transform"
              title="Nâng cấp gói Premium"
            >
              <Sparkles size={18} className="text-amber-200" />
            </Link>
          ) : isPremium ? (
            <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 p-3 text-center">
              <span className="text-xs font-black text-rose-800 dark:text-rose-300 flex items-center justify-center gap-1.5">
                <Zap size={14} className="text-amber-500 fill-amber-500" />
                <span>Gói Premium Vô Hạn</span>
              </span>
            </div>
          ) : (
            <Link
              to="/checkout"
              className="w-full py-3 px-3.5 bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:brightness-105 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 hover:shadow-lg active:translate-y-0.5 transition-all"
            >
              <Sparkles size={15} className="text-amber-200 animate-spin-slow" />
              <span>Nâng cấp Premium</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
