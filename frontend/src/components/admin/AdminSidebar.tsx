"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Video,
  BookOpen,
  Users,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  X,
} from "lucide-react";
import { useSidebarStore } from "@/stores/useSidebarStore";
import { useAuth } from "@/hooks/useAuth";

const adminNavItems = [
  {
    text: "Tổng quan",
    to: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    text: "Video & Bài học",
    to: "/admin/lessons",
    icon: Video,
    badge: "YouTube",
  },
  {
    text: "Khóa học & Chủ đề",
    to: "/admin/courses",
    icon: BookOpen,
  },
  {
    text: "Quản lý Người dùng",
    to: "/admin/users",
    icon: Users,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isCollapsed, toggleSidebar, setCollapsed } = useSidebarStore();

  useEffect(() => {
    // Auto-collapse sidebar on mobile/tablet viewports (< 1024px)
    const handleResize = () => {
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        setCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setCollapsed]);

  const handleMobileClose = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setCollapsed(true);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        onClick={toggleSidebar}
        className={`lg:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 transition-opacity duration-300 ${
          isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      />

      <aside
        className={`fixed left-0 top-0 h-screen bg-slate-900 border-r border-slate-800 text-slate-100 z-50 flex flex-col justify-between font-sans transition-all duration-300 shadow-2xl ${
          isCollapsed
            ? "w-20 max-lg:-translate-x-full lg:translate-x-0"
            : "w-64 max-w-[85vw] translate-x-0"
        }`}
      >
        {/* Desktop Collapse toggle button (Floating on right border, never overlaps logo) */}
        <button
          onClick={toggleSidebar}
          type="button"
          className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 shadow-lg text-slate-300 hover:text-white hover:bg-slate-700 items-center justify-center transition-all cursor-pointer z-50 hover:scale-110 active:scale-95"
          title={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
        >
          {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>

        <div className="overflow-y-auto no-scrollbar flex-1">
          {/* Header & Logo */}
          <div
            className={`h-18 flex items-center border-b border-slate-800 relative bg-slate-900/90 backdrop-blur-md transition-all ${
              isCollapsed ? "justify-center px-2" : "justify-between px-4"
            }`}
          >
            <Link
              href="/admin"
              onClick={handleMobileClose}
              className={`flex items-center gap-2.5 min-w-0 group ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 group-hover:rotate-3 transition-transform shrink-0">
                <ShieldCheck size={22} className="text-white" />
              </div>

              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-black text-white tracking-tight block truncate">
                      JTalk AI
                    </span>
                    <span className="rounded-md bg-indigo-500/20 border border-indigo-400/30 px-1.5 py-0.2 text-[10px] font-black text-indigo-300 uppercase tracking-wider">
                      ADMIN
                    </span>
                  </div>
                  <span className="text-3xs font-extrabold text-slate-400 uppercase tracking-widest block -mt-0.5 truncate">
                    Cổng Quản Trị Hệ Thống
                  </span>
                </div>
              )}
            </Link>

            {/* Mobile close button (only visible when drawer is open on mobile) */}
            <button
              onClick={toggleSidebar}
              type="button"
              className="lg:hidden w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Đóng menu"
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            <div className="px-3 pt-2 pb-1">
              {!isCollapsed ? (
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Quản lý nội dung
                </span>
              ) : (
                <div className="h-2" />
              )}
            </div>

            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.to
                : pathname?.startsWith(item.to);

              return (
                <Link
                  key={item.to}
                  href={item.to}
                  onClick={handleMobileClose}
                  title={isCollapsed ? item.text : undefined}
                  className={`
                    flex items-center gap-3.5
                    ${isCollapsed ? "justify-center px-2 py-3" : "px-3.5 py-3"}
                    rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 group relative
                    ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-black"
                        : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
                    }
                  `}
                >
                  <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">
                    <Icon size={18} />
                  </span>
                  {!isCollapsed && (
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <span className="truncate tracking-tight">{item.text}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                  {isCollapsed && <span className="sr-only">{item.text}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / Return to Student Dashboard */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60">
          <Link
            href="/dashboard"
            onClick={handleMobileClose}
            title={isCollapsed ? "Về Trang học viên" : undefined}
            className={`
              flex items-center gap-3
              ${isCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}
              rounded-xl font-bold text-xs text-indigo-300 hover:text-white bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/60 transition-all group
            `}
          >
            <GraduationCap
              size={18}
              className="text-indigo-400 group-hover:scale-110 transition-transform shrink-0"
            />
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <span className="block truncate font-bold text-xs">Về Trang học viên</span>
                <span className="block truncate text-[10px] text-slate-400">
                  Luyện nói & Thực hành
                </span>
              </div>
            )}
          </Link>

          {!isCollapsed && user && (
            <div className="mt-3 px-2 flex items-center justify-between text-[11px] text-slate-400">
              <span className="truncate font-mono">{user.email}</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
