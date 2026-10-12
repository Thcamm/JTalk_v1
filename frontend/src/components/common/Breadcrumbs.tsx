"use client";

import React, { useMemo } from "react";
import { Link, useLocation } from "@/lib/react-router-compat";
import { Home, ChevronRight } from "lucide-react";

interface CrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs() {
  const location = useLocation();
  const pathname = location.pathname || "";

  const crumbs = useMemo<CrumbItem[]>(() => {
    // Hidden on home, dashboard and auth pages
    if (
      !pathname ||
      pathname === "/" ||
      pathname === "/dashboard" ||
      pathname === "/welcome" ||
      pathname === "/signin" ||
      pathname === "/signup"
    ) {
      return [];
    }

    // Direct routing definitions
    if (pathname === "/courses") {
      return [{ label: "Thư viện Video" }];
    }

    if (pathname.startsWith("/courses/") && pathname.includes("/lesson/")) {
      const parts = pathname.split("/");
      const courseId = parts[2];
      return [
        { label: "Thư viện Video", href: "/courses" },
        { label: "Khóa học", href: `/courses/${courseId}` },
        { label: "Học Video & Shadowing" },
      ];
    }

    if (pathname.startsWith("/courses/learn/") || pathname.startsWith("/learn/")) {
      return [
        { label: "Thư viện Video", href: "/courses" },
        { label: "Học Video & Shadowing" },
      ];
    }

    if (pathname.startsWith("/courses/")) {
      return [
        { label: "Thư viện Video", href: "/courses" },
        { label: "Chi tiết Khóa học & Bài học" },
      ];
    }

    if (pathname === "/speaking") {
      return [{ label: "Luyện nói AI" }];
    }

    if (pathname.startsWith("/speaking/topic/")) {
      return [
        { label: "Luyện nói AI", href: "/speaking" },
        { label: "Chủ đề Kaiwa" },
      ];
    }

    if (
      pathname.startsWith("/practice/") ||
      pathname.startsWith("/speaking/practice/") ||
      pathname.endsWith("/speaking")
    ) {
      return [
        { label: "Luyện nói AI", href: "/speaking" },
        { label: "Phòng Luyện Đối Thoại AI 1-1" },
      ];
    }

    if (pathname === "/vocabulary") {
      return [{ label: "Sổ tay Từ vựng" }];
    }

    if (pathname === "/leaderboard") {
      return [{ label: "Bảng xếp hạng" }];
    }

    if (pathname === "/progress" || pathname === "/profile") {
      return [{ label: "Hồ sơ & Tiến trình" }];
    }

    if (pathname === "/checkout") {
      return [{ label: "Nâng cấp Gói Premium" }];
    }

    if (pathname === "/payment/momo/callback") {
      return [
        { label: "Gói Premium", href: "/checkout" },
        { label: "Kết quả thanh toán MoMo" },
      ];
    }

    // Admin portal routes
    if (pathname === "/admin") {
      return [{ label: "Cổng Quản Trị" }];
    }

    if (pathname.startsWith("/admin/courses")) {
      return [
        { label: "Cổng Quản Trị", href: "/admin" },
        { label: "Quản lý Khóa học & Video" },
      ];
    }

    if (pathname.startsWith("/admin/lessons")) {
      return [
        { label: "Cổng Quản Trị", href: "/admin" },
        { label: "Quản lý Bài học" },
      ];
    }

    if (pathname.startsWith("/admin/users")) {
      return [
        { label: "Cổng Quản Trị", href: "/admin" },
        { label: "Quản lý Người dùng" },
      ];
    }

    // Fallback: Segment by slash
    const segments = pathname.split("/").filter(Boolean);
    const result: CrumbItem[] = [];
    let currentPath = "";

    segments.forEach((seg, idx) => {
      currentPath += `/${seg}`;
      const isLast = idx === segments.length - 1;
      const formatted = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
      result.push({
        label: formatted,
        href: isLast ? undefined : currentPath,
      });
    });

    return result;
  }, [pathname]);

  if (crumbs.length === 0) {
    return null;
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pt-4 pb-1 transition-colors">
      <nav
        aria-label="Breadcrumb"
        className="max-w-7xl mx-auto flex items-center flex-wrap gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-sans"
      >
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-rose-600 dark:hover:text-rose-400 font-bold transition-all text-slate-600 dark:text-slate-300"
          title="Trang chủ"
        >
          <Home size={13} className="shrink-0 text-slate-400 dark:text-slate-500" />
          <span>Trang chủ</span>
        </Link>

        {crumbs.map((crumb, idx) => {
          const isLast = idx === crumbs.length - 1;

          return (
            <React.Fragment key={`${crumb.label}-${idx}`}>
              <ChevronRight
                size={12}
                className="text-slate-300 dark:text-slate-600 shrink-0 select-none"
              />

              {crumb.href && !isLast ? (
                <Link
                  to={crumb.href}
                  className="py-1 px-2 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-rose-600 dark:hover:text-rose-400 font-semibold transition-all max-w-[200px] truncate"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="py-1 px-2 font-extrabold text-slate-900 dark:text-white max-w-[260px] truncate">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
}

export default Breadcrumbs;
