"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  adminService,
  type AdminStatsResponse,
} from "@/services/admin.service";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { YouTubeIcon } from "@/components/common/YouTubeIcon";
import {
  Users,
  Video,
  Mic,
  BookOpen,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Shield,
  Clock,
  Award,
  TrendingUp,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await adminService.getStats();
        if (isMounted) {
          setStats(data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(
            err.response?.data?.message || "Không thể tải số liệu thống kê."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <LoadingSpinner size="lg" label="Đang tải dữ liệu tổng quan..." />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-2xl border border-rose-900/60 bg-rose-950/20 p-6 text-center text-rose-300">
        <p className="font-bold">{error || "Đã xảy ra lỗi khi tải dữ liệu."}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 px-4 py-2 rounded-xl bg-rose-700 text-white text-xs font-bold hover:bg-rose-600 transition-colors"
        >
          Tải lại trang
        </button>
      </div>
    );
  }

  const { kpi, recentUsers, recentLessons } = stats;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Welcome */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/90 via-slate-900 to-slate-900 border border-indigo-800/60 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-extrabold uppercase tracking-wider mb-2">
              <Sparkles size={13} className="text-indigo-400" />
              <span>Bảng điều khiển Trung tâm</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Chào mừng trở lại, Quản trị viên JTalk AI
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl">
              Giám sát hệ thống học tiếng Nhật trực tuyến, quản lý các bài giảng video YouTube, điều phối học viên và phân quyền Premium thời gian thực.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/admin/lessons/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
            >
              <PlusCircle size={16} />
              <span>+ Thêm Video Mới</span>
            </Link>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Users */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800/90 shadow-lg relative overflow-hidden group hover:border-indigo-600/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tổng Học Viên
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">
              {kpi.totalUsers.toLocaleString()}
            </span>
            <span className="text-xs text-indigo-400 font-bold">học viên</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span>Premium: <strong className="text-amber-400">{kpi.totalPremiumUsers}</strong></span>
            <span>Admin: <strong className="text-indigo-400">{kpi.totalAdmins}</strong></span>
          </div>
        </div>

        {/* KPI 2: Total Lessons & Video */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800/90 shadow-lg relative overflow-hidden group hover:border-red-600/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Bài Giảng & Video
            </span>
            <div className="w-10 h-10 rounded-2xl bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-400">
              <Video size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">
              {kpi.totalLessons}
            </span>
            <span className="text-xs text-red-400 font-bold">bài học</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <div className="flex items-center gap-1 text-slate-300">
              <YouTubeIcon size={14} className="text-red-500" />
              <span>{kpi.totalVideoLessons} video YouTube</span>
            </div>
            <Link
              href="/admin/lessons"
              className="text-indigo-400 hover:text-indigo-300 font-bold"
            >
              Quản lý →
            </Link>
          </div>
        </div>

        {/* KPI 3: Speaking & Practice completed */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800/90 shadow-lg relative overflow-hidden group hover:border-emerald-600/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Lượt Luyện Phản Xạ
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Mic size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">
              {kpi.totalPractices.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-400 font-bold">lượt hoàn thành</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span className="flex items-center gap-1">
              <TrendingUp size={13} className="text-emerald-400" />
              Tương tác liên tục
            </span>
            <span className="text-emerald-400 font-bold">AI Active</span>
          </div>
        </div>

        {/* KPI 4: Courses & Topics */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800/90 shadow-lg relative overflow-hidden group hover:border-amber-600/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Khóa Học & Chủ Đề
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <BookOpen size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">
              {kpi.totalCourses}
            </span>
            <span className="text-xs text-amber-400 font-bold">khóa học</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span>{kpi.totalTopics} chủ đề luyện nói</span>
            <Link
              href="/admin/courses"
              className="text-amber-400 hover:text-amber-300 font-bold"
            >
              Xem tất cả →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Users & Recent Lessons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Recent Users */}
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-indigo-400" />
                <h3 className="text-base font-black text-white">Học Viên Mới Nhất</h3>
              </div>
              <Link
                href="/admin/users"
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>Xem tất cả</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-slate-800/60">
              {recentUsers.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-500">
                  Chưa có người dùng nào.
                </p>
              ) : (
                recentUsers.slice(0, 5).map((user) => (
                  <div
                    key={user._id}
                    className="py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-indigo-300 shrink-0">
                        {user.displayName ? user.displayName.charAt(0) : "U"}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-200 truncate">
                          {user.displayName || user.username}
                        </div>
                        <div className="text-slate-400 text-[11px] truncate font-mono">
                          {user.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {user.role === "admin" ? (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black uppercase">
                          Admin
                        </span>
                      ) : user.subscription?.tier === "premium" ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase">
                          Premium
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-bold">
                          Free
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : ""}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4">
            <Link
              href="/admin/users"
              className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Mở danh sách quản trị người dùng & phân quyền</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Section 2: Recent Lessons */}
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Video size={18} className="text-red-400" />
                <h3 className="text-base font-black text-white">Bài Học & Video Mới</h3>
              </div>
              <Link
                href="/admin/lessons"
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>Xem tất cả</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-slate-800/60">
              {recentLessons.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-500">
                  Chưa có bài học nào.
                </p>
              ) : (
                recentLessons.slice(0, 5).map((lesson) => (
                  <div
                    key={lesson._id}
                    className="py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {lesson.youtubeId ? (
                        <div className="w-10 h-7 rounded-lg overflow-hidden bg-black shrink-0 relative border border-slate-800">
                          <img
                            src={`https://img.youtube.com/vi/${lesson.youtubeId}/default.jpg`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                          <BookOpen size={14} />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="font-bold text-slate-200 truncate">
                          {lesson.title}
                        </div>
                        <div className="text-slate-400 text-[11px] truncate">
                          {lesson.topicId?.name || "Chưa gắn chủ đề"} •{" "}
                          <span className="font-mono text-indigo-400">
                            {lesson.level || "N5"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {lesson.youtubeId && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-800/60 text-[9px] font-black uppercase">
                          <YouTubeIcon size={11} />
                          <span>Video</span>
                        </span>
                      )}

                      <Link
                        href={`/admin/lessons/${lesson._id}`}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors"
                      >
                        Sửa
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4">
            <Link
              href="/admin/lessons/new"
              className="w-full py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>+ Thêm bài giảng video YouTube mới</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
