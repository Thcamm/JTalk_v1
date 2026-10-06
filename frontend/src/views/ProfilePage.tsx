"use client";

import { useEffect, useState, useRef } from "react";
import { Link } from "@/lib/react-router-compat";
import {
  Flame,
  Trophy,
  Award,
  Sparkles,
  Zap,
  Calendar,
  Clock,
  Mic,
  ChevronRight,
  Play,
  Pause,
  ShieldCheck,
  UserCog,
  KeyRound,
  Receipt,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  Landmark,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { practiceService } from "@/services/practice.service";
import { paymentService, type OrderItem } from "@/services/payment.service";
import { StudyChart } from "@/components/dashboard/StudyChart";
import { StreakBadge } from "@/components/dashboard/StreakBadge";
import { PremiumModal } from "@/components/common/PremiumModal";
import { Badge } from "@/components/common/Badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { ChangePasswordModal } from "@/components/profile/ChangePasswordModal";
import { JapaneseMascot } from "@/components/common/JapaneseMascot";
import { toast } from "sonner";
import type { Practice, StudyLog } from "@/types";

export const ProfilePage = () => {
  const { user, isPremium, streak, remainingFreePractices, practiceCountToday, fetchMe } = useAuth();

  const [activeTab, setActiveTab] = useState<"study" | "orders">("study");
  const [weeklyLogs, setWeeklyLogs] = useState<StudyLog[]>([]);
  const [practiceHistory, setPracticeHistory] = useState<Practice[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlayAudio = (id: string, audioUrl?: string) => {
    if (!audioUrl) return;

    if (playingAudioId === id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingAudioId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setPlayingAudioId(id);

    audio.onended = () => {
      setPlayingAudioId(null);
      audioRef.current = null;
    };
    audio.onerror = () => {
      setPlayingAudioId(null);
      audioRef.current = null;
    };
    audio.play().catch(() => {
      setPlayingAudioId(null);
      audioRef.current = null;
    });
  };

  useEffect(() => {
    let isMounted = true;

    const loadProfileData = async () => {
      try {
        setLoading(true);

        const [weeklyRes, historyRes, ordersRes] = await Promise.allSettled([
          api.get("/studylogs/weekly"),
          practiceService.getPractices(),
          paymentService.getMyOrders(),
        ]);

        if (isMounted) {
          if (weeklyRes.status === "fulfilled") {
            const data = weeklyRes.value.data?.data || weeklyRes.value.data?.weeklyData || [];
            // Map keys
            const logs: StudyLog[] = data.map((d: any) => ({
              _id: d.date,
              userId: user?._id || "",
              date: d.date,
              minutesSpent: d.minutesSpent || 0,
              practiceCount: d.practiceCount || 0,
              xpEarned: d.xpEarned || 0,
              lessonsCompleted: d.lessonsCompleted || 0,
              createdAt: d.date,
              updatedAt: d.date,
            }));
            setWeeklyLogs(logs);
          }

          if (historyRes.status === "fulfilled") {
            setPracticeHistory(historyRes.value || []);
          }

          if (ordersRes.status === "fulfilled") {
            setOrders(ordersRes.value || []);
          }
        }
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProfileData();

    return () => {
      isMounted = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [user?._id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60 dark:bg-[#0b0f17] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Đang tải dữ liệu hồ sơ sinh viên..." />
      </div>
    );
  }

  const longestStreak = user?.gamification?.longestStreak || streak || 0;
  const totalXp = user?.gamification?.totalXp || 0;
  const targetLevel = user?.profile?.targetLevel || "N5";

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-[#0b0f17] py-8 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* 1. Profile Header Bento Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
          {/* Subtle Ambient Background Mesh */}
          <div className="absolute top-0 right-0 w-60 h-60 bg-gradient-to-bl from-rose-500/10 via-amber-500/5 to-transparent rounded-bl-full pointer-events-none" />

          <div className="flex items-center gap-5 relative z-10">
            <div className="relative group">
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-3xl p-1 bg-gradient-to-tr from-rose-500 via-rose-600 to-amber-500 shadow-md group-hover:scale-103 transition-transform">
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 dark:bg-slate-800 flex items-center justify-center text-white text-3xl font-black border-2 border-white dark:border-slate-900">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "J"}
                </div>
              </div>
              {isPremium && (
                <span className="absolute -top-1.5 -right-1.5 p-1.5 bg-amber-400 text-white rounded-full shadow-md animate-bounce">
                  <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                </span>
              )}
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                  {user?.displayName || user?.username || "Học viên JTalk"}
                </h1>
                {isPremium ? (
                  <Badge variant="premium" size="sm" icon={<Sparkles className="w-3 h-3 animate-spin-slow" />}>
                    Premium Member
                  </Badge>
                ) : (
                  <Badge variant="secondary" size="sm">
                    Tài khoản Miễn phí
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
              <div className="flex items-center gap-3 pt-1 text-xs text-slate-600 dark:text-slate-400 font-bold flex-wrap">
                <span>
                  Mục tiêu: <strong className="text-rose-600 dark:text-rose-400">{targetLevel} Kaiwa</strong>
                </span>
                <span>•</span>
                <span>
                  Gia nhập: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "Gần đây"}
                </span>
              </div>

              {/* Profile Management Actions */}
              <div className="flex items-center gap-2 pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                >
                  <UserCog size={13} className="text-rose-500" />
                  <span>Sửa thông tin & Mục tiêu</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                >
                  <KeyRound size={13} className="text-amber-500" />
                  <span>Đổi mật khẩu</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto relative z-10">
            <StreakBadge streak={streak} />
          </div>
        </div>

        {/* 2. Gamification & Stat Counters Bento Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-1 hover:border-rose-400 transition-colors">
            <div className="flex items-center gap-2 text-rose-500 text-xs font-black uppercase tracking-wider">
              <Flame className="w-4 h-4 fill-rose-500 animate-bounce" />
              <span>Chuỗi Streak</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{streak} ngày</div>
            <p className="text-2xs font-bold text-slate-400">Kỷ lục: {longestStreak} ngày</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-1 hover:border-blue-400 transition-colors">
            <div className="flex items-center gap-2 text-blue-500 text-xs font-black uppercase tracking-wider">
              <Mic className="w-4 h-4 animate-pulse" />
              <span>Lượt luyện nói</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{practiceHistory.length}</div>
            <p className="text-2xs font-bold text-slate-400">Hôm nay: {practiceCountToday} lượt</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-1 hover:border-rose-400 transition-colors">
            <div className="flex items-center gap-2 text-rose-500 text-xs font-black uppercase tracking-wider">
              <Award className="w-4 h-4 animate-float" />
              <span>Điểm kinh nghiệm</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{totalXp} XP</div>
            <p className="text-2xs font-bold text-slate-400">Cấp độ {Math.floor(totalXp / 100) + 1}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-1 hover:border-amber-400 transition-colors">
            <div className="flex items-center gap-2 text-amber-500 text-xs font-black uppercase tracking-wider">
              <Trophy className="w-4 h-4 animate-bounce" />
              <span>Điểm TB phản xạ</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {practiceHistory.length > 0
                ? Math.round(
                    practiceHistory.reduce((acc, curr) => acc + (curr.overallScore || curr.score || 80), 0) /
                      practiceHistory.length
                  )
                : 85}
              <span className="text-xs font-semibold text-slate-400">/100</span>
            </div>
            <p className="text-2xs font-bold text-slate-400">Chuẩn phát âm Tokyo</p>
          </div>
        </div>

        {/* 3. Subscription & Quota Bento Card */}
        {user?.role === "admin" ? (
          <div className="rounded-3xl p-6 sm:p-8 border bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-indigo-950/30 border-indigo-800/60 text-white transition-all shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Quản trị viên Hệ thống (System Admin)</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Tài khoản Quản trị viên cấp cao
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                  Bạn có toàn quyền truy cập tất cả tài nguyên, bài giảng video, phòng luyện nói AI và Cổng Quản trị JTalk Studio mà không bị giới hạn bất kỳ hạn mức nào.
                </p>
              </div>

              <div className="shrink-0 w-full sm:w-auto">
                <Link
                  to="/admin"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <ShieldCheck size={16} />
                  <span>Vào Cổng Quản Trị</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`rounded-3xl p-6 sm:p-8 border transition-all ${
              isPremium
                ? "bg-gradient-to-r from-rose-50 to-amber-50/60 dark:from-rose-950/40 dark:to-amber-950/30 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-200"
                : "bg-gradient-to-r from-amber-50 via-rose-50/50 to-amber-50/30 dark:from-amber-950/40 dark:via-rose-950/30 dark:to-amber-950/20 border-amber-200/90 dark:border-amber-800/80"
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-white/90 dark:bg-slate-900/90 border border-current/20 shadow-2xs">
                  {isPremium ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
                      <span>Gói Premium Đang Hoạt Động</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Hạn mức luyện nói miễn phí</span>
                    </>
                  )}
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {isPremium
                    ? "Bạn đang sở hữu quyền luyện nói không giới hạn!"
                    : `Hôm nay bạn còn ${remainingFreePractices}/2 lượt luyện nói miễn phí`}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {isPremium
                    ? "Thỏa sức giao tiếp 24/7 với AI, mở khóa toàn bộ bài học Kaiwa N5-N4 và lưu trữ tiến độ không giới hạn trên đám mây Cloudinary."
                    : "Nâng cấp gói tháng chỉ 99.000đ để bứt phá phản xạ, chấm điểm chi tiết 4 tiêu chí và không lo hết lượt."}
                </p>
              </div>

              <div className="shrink-0 w-full sm:w-auto">
                {isPremium ? (
                  <Link
                    to="/checkout"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-rose-700 dark:text-rose-300 font-extrabold text-xs rounded-2xl border border-rose-300 dark:border-rose-700 shadow-2xs transition-all"
                  >
                    <span>Gia hạn thêm gói tháng</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    onClick={() => setShowPremiumModal(true)}
                    type="button"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:brightness-105 active:translate-y-0.5 text-white font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg hover:shadow-rose-500/20 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
                    <span>Nâng cấp gói Premium 99.000đ</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. Tab Switcher: Tiến trình học tập vs Lịch sử thanh toán */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab("study")}
            type="button"
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "study"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Tiến trình & Lịch sử học tập</span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            type="button"
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "orders"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Lịch sử thanh toán</span>
            {orders.length > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-3xs font-extrabold ${
                  activeTab === "orders"
                    ? "bg-white/20 text-white"
                    : "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400"
                }`}
              >
                {orders.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Study Progress & Practice History */}
        {activeTab === "study" && (
          <div className="space-y-8 animate-fade-in">
            {/* 7-Day Study Chart */}
            <StudyChart logs={weeklyLogs} />

            {/* Recent Practice History with Cloud Audio Playback */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Lịch sử luyện phản xạ gần đây
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Các bài tập hội thoại đã được AI chấm điểm và ghi âm giọng nói
                  </p>
                </div>
                <Link
                  to="/courses"
                  className="text-xs font-black text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>Vào bài học mới</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {practiceHistory.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl space-y-3">
                  <Mic className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Bạn chưa có bài luyện nói nào
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Hãy chọn một chủ đề giao tiếp và bắt đầu phản xạ cùng gia sư AI nhé!
                  </p>
                  <Link
                    to="/courses"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:brightness-105 active:translate-y-0.5 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg hover:shadow-rose-500/20 transition-all"
                  >
                    <span>Bắt đầu bài học đầu tiên</span>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {practiceHistory.slice(0, 8).map((item) => {
                    const lessonTitle =
                      typeof item.lessonId === "object" && item.lessonId
                        ? (item.lessonId as any).title
                        : item.sampleSentence;

                    const score = item.overallScore || item.score || 80;

                    return (
                      <div
                        key={item._id}
                        className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 rounded-2xl px-3 transition-colors"
                      >
                        <div className="space-y-1.5 min-w-0">
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-200 truncate">
                            {lessonTitle || "Luyện nói câu giao tiếp"}
                          </h4>
                          {item.transcript && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 italic truncate font-sans">
                              &quot;{item.transcript}&quot;
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-2xs text-slate-400 dark:text-slate-500 font-semibold">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(item.completedAt || item.createdAt).toLocaleDateString("vi-VN")}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.durationSeconds || 15}s
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                          {item.audioUrl && (
                            <button
                              onClick={() => togglePlayAudio(item._id, item.audioUrl)}
                              type="button"
                              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                                playingAudioId === item._id
                                  ? "bg-rose-600 text-white animate-pulse"
                                  : "bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              }`}
                              title="Nghe lại giọng nói của bạn"
                            >
                              {playingAudioId === item._id ? (
                                <>
                                  <Pause className="w-3.5 h-3.5 fill-current" />
                                  <span>Dừng</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                  <span>Nghe lại</span>
                                </>
                              )}
                            </button>
                          )}

                          <div className="text-right">
                            <div className="text-base font-black text-rose-600 dark:text-rose-400">{score}đ</div>
                            <span className="text-3xs text-slate-400 font-bold">Điểm phản xạ</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Payment & Order History */}
        {activeTab === "orders" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-rose-500" />
                  <span>Lịch sử thanh toán & Đơn hàng</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Theo dõi danh sách các đơn thanh toán gói JTalk Premium 99.000đ/tháng
                </p>
              </div>

              <Link
                to="/checkout"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-500 text-white rounded-xl text-xs font-extrabold shadow-sm hover:brightness-105 active:scale-95 transition-all self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nâng cấp / Gia hạn Premium</span>
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-14 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl space-y-4">
                <div className="flex justify-center">
                  <JapaneseMascot type="cat-lucky" size={130} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Bạn chưa có giao dịch thanh toán nào
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Nâng cấp gói JTalk Premium chỉ 99.000đ/tháng để thỏa sức giao tiếp tiếng Nhật 24/7 không giới hạn lượt.
                  </p>
                </div>
                <Link
                  to="/checkout"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:brightness-105 active:scale-95 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Nâng cấp 99.000đ qua VietQR / MoMo</span>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-3xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <th className="pb-3 px-3">Mã đơn hàng</th>
                      <th className="pb-3 px-3">Thời gian</th>
                      <th className="pb-3 px-3">Số tiền</th>
                      <th className="pb-3 px-3">Phương thức</th>
                      <th className="pb-3 px-3">Trạng thái</th>
                      <th className="pb-3 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {orders.map((order) => {
                      const st = (order.status || "").toLowerCase();
                      const isCompleted = st === "completed" || st === "success";
                      const isPending = st === "pending";

                      return (
                        <tr
                          key={order._id || order.orderCode}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Order Code */}
                          <td className="py-4 px-3 font-medium">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                {order.orderCode}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(order.orderCode);
                                  toast.success("Đã sao chép mã đơn: " + order.orderCode);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                title="Sao chép mã đơn"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            {order.transactionId && (
                              <p className="text-3xs text-slate-400 font-mono mt-0.5">
                                TxID: {order.transactionId}
                              </p>
                            )}
                          </td>

                          {/* Date */}
                          <td className="py-4 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {new Date(order.paidAt || order.createdAt).toLocaleDateString("vi-VN", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="py-4 px-3 font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                            {(order.amount || 99000).toLocaleString("vi-VN")} đ
                          </td>

                          {/* Payment Method */}
                          <td className="py-4 px-3">
                            {order.paymentMethod === "vietqr" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-900/50 text-2xs font-bold whitespace-nowrap">
                                <Landmark className="w-3 h-3" />
                                <span>VietQR 24/7</span>
                              </span>
                            ) : order.paymentMethod === "vnpay" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/50 text-2xs font-bold whitespace-nowrap">
                                VNPay
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-pink-50 dark:bg-pink-950/40 text-[#A50064] dark:text-pink-300 border border-pink-200/80 dark:border-pink-900/50 text-2xs font-bold whitespace-nowrap">
                                Ví MoMo
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-3 whitespace-nowrap">
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-2xs font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span>Thành công</span>
                              </span>
                            ) : isPending ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-2xs font-extrabold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
                                <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400 animate-pulse" />
                                <span>Chờ thanh toán</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-2xs font-extrabold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800">
                                <XCircle className="w-3 h-3 text-rose-500" />
                                <span>Đã hủy</span>
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-3 text-right whitespace-nowrap">
                            {isPending && order.payUrl ? (
                              <a
                                href={order.payUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-2xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                              >
                                <span>Tiếp tục</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : isCompleted ? (
                              <span className="text-3xs text-emerald-600 dark:text-emerald-400 font-bold">
                                Gói 30 ngày
                              </span>
                            ) : (
                              <Link
                                to="/checkout"
                                className="text-2xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
                              >
                                Tạo lại
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        reason="general"
      />

      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        user={user}
        onSuccess={() => fetchMe()}
      />

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </div>
  );
};

export default ProfilePage;
