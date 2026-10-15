"use client";

import { useEffect, useState, useMemo, useRef, type ReactNode } from "react";
import { Link, useSearchParams } from "@/lib/react-router-compat";
import {
  Flame,
  Trophy,
  Award,
  Sparkles,
  Zap,
  Calendar,
  Clock,
  Clock3,
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
  TrendingUp,
  Target,
  BookOpen,
  Lock,
  ArrowUpRight,
  Crown,
  Eye,
  EyeOff,
  User,
  Mail,
  Check,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

import { useAuth } from "@/hooks/useAuth";
import { studylogService, type DailyStudyLog } from "@/services/studylog.service";
import { practiceService } from "@/services/practice.service";
import { paymentService, type OrderItem } from "@/services/payment.service";
import { curriculumService } from "@/services/curriculum.service";
import { StreakBadge } from "@/components/dashboard/StreakBadge";
import { PremiumModal } from "@/components/common/PremiumModal";
import { Badge } from "@/components/common/Badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { ChangePasswordModal } from "@/components/profile/ChangePasswordModal";
import { OnboardingQuizModal } from "@/components/gamification/OnboardingQuizModal";
import { JapaneseMascot } from "@/components/common/JapaneseMascot";
import { toast } from "sonner";
import { userService } from "@/services/user.service";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Practice, Course } from "@/types";

interface ProfilePageProps {
  defaultTab?: "progress" | "practices" | "orders" | "settings";
}

export const ProfilePage = ({ defaultTab }: ProfilePageProps = {}) => {
  const { user, isPremium, streak, remainingFreePractices, practiceCountToday, fetchMe } = useAuth();
  const [searchParams] = useSearchParams();

  // Tab initialization: defaultTab prop > URL search param "?tab=..." > "progress"
  const tabFromQuery = searchParams.get("tab") as "progress" | "practices" | "orders" | "settings" | null;
  const initialTab =
    defaultTab ||
    (tabFromQuery === "practices" || tabFromQuery === "orders" || tabFromQuery === "settings" || tabFromQuery === "progress"
      ? tabFromQuery
      : "progress");

  const [activeTab, setActiveTab] = useState<"progress" | "practices" | "orders" | "settings">(initialTab);
  const [weeklyLogs, setWeeklyLogs] = useState<DailyStudyLog[]>([]);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // States for Profile In-Page Editor
  const [profileLastName, setProfileLastName] = useState("");
  const [profileFirstName, setProfileFirstName] = useState("");
  const [profileDisplayName, setProfileDisplayName] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileTargetLevel, setProfileTargetLevel] = useState<"N5" | "N4" | "N3" | "N2" | "N1">("N5");
  const [profileGoal, setProfileGoal] = useState<"daily_conversation" | "interview" | "business" | "travel">("daily_conversation");
  const [profileDailyMinutes, setProfileDailyMinutes] = useState<number>(15);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // States for In-Page Change Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showOnboardingQuiz, setShowOnboardingQuiz] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize and prefill profile information whenever user state changes
  useEffect(() => {
    if (user) {
      let initialLastName = user.lastName || "";
      let initialFirstName = user.firstName || "";
      if (!initialLastName && !initialFirstName && user.displayName) {
        const parts = user.displayName.trim().split(/\s+/);
        if (parts.length === 1) {
          initialFirstName = parts[0];
        } else if (parts.length > 1) {
          initialFirstName = parts[parts.length - 1];
          initialLastName = parts.slice(0, parts.length - 1).join(" ");
        }
      }
      setProfileLastName(initialLastName);
      setProfileFirstName(initialFirstName);
      setProfileDisplayName(user.displayName || "");
      setProfileBio(user.bio || "");
      setProfileTargetLevel(user.profile?.targetLevel || "N5");
      setProfileGoal(user.profile?.goal || "daily_conversation");
      setProfileDailyMinutes(user.profile?.dailyTargetMinutes || 15);
    }
  }, [user]);

  // Password strength meter
  const newPasswordStrength = useMemo(() => {
    if (!newPassword) return { level: 0, text: "", color: "bg-slate-200" };
    if (newPassword.length < 6) return { level: 1, text: "Yếu (tối thiểu 6 ký tự)", color: "bg-rose-500" };
    let score = 1;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    if (score <= 2) return { level: 2, text: "Trung bình", color: "bg-amber-500" };
    return { level: 3, text: "Mạnh và an toàn", color: "bg-emerald-500" };
  }, [newPassword]);

  // Handler for saving in-page profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileDisplayName.trim() && !profileFirstName.trim()) {
      toast.error("Vui lòng nhập họ tên của bạn.");
      return;
    }

    try {
      setIsSavingProfile(true);
      const updated = await userService.updateProfile({
        firstName: profileFirstName.trim(),
        lastName: profileLastName.trim(),
        displayName: profileDisplayName.trim() || `${profileLastName} ${profileFirstName}`.trim(),
        bio: profileBio.trim(),
        targetLevel: profileTargetLevel,
        goal: profileGoal,
        dailyTargetMinutes: profileDailyMinutes,
      });

      if (updated) {
        useAuthStore.getState().updateUser({
          firstName: updated.firstName || profileFirstName.trim(),
          lastName: updated.lastName || profileLastName.trim(),
          displayName: updated.displayName || profileDisplayName.trim() || `${profileLastName} ${profileFirstName}`.trim(),
          bio: updated.bio,
          profile: updated.profile,
        });
      }

      toast.success("Cập nhật thông tin hồ sơ thành công!");
      await fetchMe();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Cập nhật hồ sơ thất bại";
      toast.error(msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handler for in-page change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (currentPassword === newPassword) {
      toast.error("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
      return;
    }

    try {
      setIsChangingPass(true);
      await userService.changePassword({
        currentPassword,
        newPassword,
      });
      toast.success("Đổi mật khẩu thành công! Tài khoản của bạn đã được bảo vệ.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Đổi mật khẩu thất bại";
      toast.error(msg);
    } finally {
      setIsChangingPass(false);
    }
  };

  // Audio playback handler
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

    const loadData = async () => {
      try {
        setLoading(true);

        const [logsRes, practicesRes, ordersRes, coursesRes] = await Promise.allSettled([
          studylogService.getWeeklyLogs(),
          practiceService.getPractices(),
          paymentService.getMyOrders(),
          curriculumService.getCourses(),
        ]);

        if (isMounted) {
          if (logsRes.status === "fulfilled") {
            setWeeklyLogs(logsRes.value || []);
          }
          if (practicesRes.status === "fulfilled") {
            setPractices(practicesRes.value || []);
          }
          if (ordersRes.status === "fulfilled") {
            setOrders(ordersRes.value || []);
          }
          if (coursesRes.status === "fulfilled") {
            setCourses(coursesRes.value || []);
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu trang cá nhân & tiến trình:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [user?._id]);

  // Format 7-day chart data
  const chartData = useMemo(() => {
    if (weeklyLogs.length > 0) {
      return weeklyLogs.map((log) => ({
        day: log.day,
        date: log.date,
        minutes: log.minutesSpent || 0,
        practices: log.practiceCount || 0,
        xp: log.xpEarned || 0,
      }));
    }

    // Default 7 days ending today
    const days = [];
    const today = new Date();
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayName = i === 0 ? "Hôm nay" : dayNames[d.getDay()];
      days.push({
        day: dayName,
        date: dateStr,
        minutes: 0,
        practices: 0,
        xp: 0,
      });
    }
    return days;
  }, [weeklyLogs]);

  // Computed summary metrics
  const totalMinutes = useMemo(() => {
    const weeklySum = chartData.reduce((acc, curr) => acc + curr.minutes, 0);
    return Math.max(weeklySum, user?.dailyUsage?.minutesSpent || 0);
  }, [chartData, user]);

  const totalPractices = practices.length;

  const averageScore = useMemo(() => {
    if (practices.length === 0) return 85;
    const total = practices.reduce(
      (sum, p) => sum + (p.overallScore || p.score || 80),
      0
    );
    return Math.round(total / practices.length);
  }, [practices]);

  const totalXp = user?.gamification?.totalXp || totalPractices * 15;
  const longestStreak = user?.gamification?.longestStreak || streak || 0;
  const targetLevel = user?.profile?.targetLevel || "N5";
  const userLevel = user?.gamification?.level || Math.floor(totalXp / 100) + 1;

  // Real Achievements
  const achievements = useMemo<{
    id: string;
    title: string;
    description: string;
    icon: ReactNode;
    unlocked: boolean;
    progress: string;
  }[]>(
    () => [
      {
        id: "first_practice",
        title: "Phát âm đầu tiên",
        description: "Hoàn thành bài luyện nói phản xạ đầu tiên",
        icon: (
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Mic className="w-5 h-5 animate-pulse" />
          </div>
        ),
        unlocked: totalPractices >= 1,
        progress: totalPractices >= 1 ? "1/1" : "0/1",
      },
      {
        id: "streak_3",
        title: "Bền bỉ 3 ngày",
        description: "Duy trì chuỗi học liên tiếp từ 3 ngày",
        icon: (
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Flame className="w-5 h-5 fill-rose-500 text-rose-500 animate-bounce" />
          </div>
        ),
        unlocked: streak >= 3,
        progress: `${Math.min(streak, 3)}/3 ngày`,
      },
      {
        id: "high_score",
        title: "Phản xạ xuất sắc",
        description: "Đạt từ 80/100 điểm phản xạ trở lên trong 1 bài",
        icon: (
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Target className="w-5 h-5 animate-spin-slow" />
          </div>
        ),
        unlocked: practices.some((p) => (p.overallScore || p.score || 0) >= 80),
        progress: practices.some((p) => (p.overallScore || p.score || 0) >= 80)
          ? "Đạt được"
          : "Chưa đạt",
      },
      {
        id: "study_time",
        title: "Học viên siêng năng",
        description: "Tích lũy trên 15 phút luyện nói cùng AI",
        icon: (
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Award className="w-5 h-5 animate-float" />
          </div>
        ),
        unlocked: totalMinutes >= 15,
        progress: `${Math.min(totalMinutes, 15)}/15 phút`,
      },
    ],
    [totalPractices, streak, practices, totalMinutes]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60 dark:bg-[#0b0f17] flex items-center justify-center p-8 transition-colors">
        <LoadingSpinner size="lg" label="Đang tải dữ liệu hồ sơ & tiến trình học tập..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-[#0b0f17] py-6 sm:py-8 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-7">
        {/* ========================================================
            1. BENTO PROFILE HERO: Avatar, Identity & VIP Status
        ======================================================== */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
          {/* Ambient Background Gradient Orbs */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-rose-500/10 via-amber-500/5 to-transparent rounded-bl-full pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            {/* User Identity Info */}
            <div className="flex items-center gap-5">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl p-1 bg-gradient-to-tr from-rose-500 via-rose-600 to-amber-500 shadow-md group-hover:scale-102 transition-transform">
                  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 dark:bg-slate-800 flex items-center justify-center text-white text-3xl sm:text-4xl font-black border-2 border-white dark:border-slate-900 shadow-inner">
                    {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "J"}
                  </div>
                </div>
                {isPremium && (
                  <span
                    className="absolute -top-1.5 -right-1.5 p-1.5 bg-amber-400 text-white rounded-full shadow-md animate-bounce"
                    title="Hội viên Premium VIP"
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                  </span>
                )}
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                    {user?.displayName || user?.username || "Học viên JTalk"}
                  </h1>

                  {user?.role === "admin" ? (
                    <Badge variant="primary" size="sm" icon={<ShieldCheck className="w-3 h-3 text-indigo-400" />}>
                      Quản Trị Viên
                    </Badge>
                  ) : isPremium ? (
                    <Badge variant="premium" size="sm" icon={<Crown className="w-3 h-3 text-amber-500 fill-amber-500" />}>
                      Premium Member
                    </Badge>
                  ) : (
                    <Badge variant="secondary" size="sm">
                      Tài khoản Miễn phí
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>

                <div className="flex items-center gap-3 pt-0.5 text-xs text-slate-600 dark:text-slate-400 font-bold flex-wrap">
                  <span>
                    Mục tiêu: <strong className="text-rose-600 dark:text-rose-400">{targetLevel} Kaiwa</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Cấp độ: <strong className="text-amber-600 dark:text-amber-400">Level {userLevel}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Gia nhập: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "Gần đây"}
                  </span>
                </div>

                {/* Edit & Security Action Buttons */}
                <div className="flex items-center gap-2 pt-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActiveTab("settings")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98 ${
                      activeTab === "settings"
                        ? "bg-rose-600 text-white shadow-rose-500/20"
                        : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <UserCog size={13} className={activeTab === "settings" ? "text-white" : "text-rose-500"} />
                    <span>Sửa hồ sơ & Mật khẩu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowChangePasswordModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                  >
                    <KeyRound size={13} className="text-amber-500" />
                    <span>Đổi mật khẩu nhanh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowOnboardingQuiz(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98 border border-amber-200 dark:border-amber-800/80"
                  >
                    <Sparkles size={13} className="text-amber-500 fill-amber-500" />
                    <span>Khảo sát lộ trình Kaiwa</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Streak & Plan Card Header Right */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 w-full lg:w-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <StreakBadge streak={streak} />
              </div>

              {/* Mini Subscription Callout */}
              {user?.role === "admin" ? (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:scale-102 transition-transform"
                >
                  <ShieldCheck size={14} className="text-indigo-500" />
                  <span>Vào Cổng Quản Trị</span>
                  <ChevronRight size={13} />
                </Link>
              ) : isPremium ? (
                <Link
                  to="/checkout"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold hover:scale-102 transition-transform group"
                >
                  <Crown size={14} className="text-amber-500 fill-amber-500" />
                  <span>VIP Không giới hạn</span>
                  <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPremiumModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold hover:scale-102 transition-transform cursor-pointer"
                >
                  <Zap size={14} className="text-amber-500 fill-amber-500" />
                  <span>Còn {remainingFreePractices}/5 lượt miễn phí hôm nay</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================
            2. FOUR CORE STAT METRICS: Bento Grid Strip
        ======================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Chuỗi Streak */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-2xs space-y-1 hover:border-rose-400 transition-colors">
            <div className="flex items-center gap-2 text-rose-500 text-xs font-black uppercase tracking-wider">
              <Flame className="w-4 h-4 fill-rose-500 animate-bounce" />
              <span>Chuỗi Streak</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {streak} ngày
            </div>
            <p className="text-2xs font-bold text-slate-400">Kỷ lục: {longestStreak} ngày</p>
          </div>

          {/* Metric 2: Thời gian học 7 ngày */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-2xs space-y-1 hover:border-purple-400 transition-colors">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-xs font-black uppercase tracking-wider">
              <Clock3 className="w-4 h-4 animate-float" />
              <span>Thời gian 7 ngày</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {totalMinutes} phút
            </div>
            <p className="text-2xs font-bold text-slate-400">
              Hôm nay: {user?.dailyUsage?.minutesSpent || 0} phút
            </p>
          </div>

          {/* Metric 3: Lượt luyện & Điểm phản xạ TB */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-2xs space-y-1 hover:border-rose-400 transition-colors">
            <div className="flex items-center gap-2 text-rose-500 text-xs font-black uppercase tracking-wider">
              <Mic className="w-4 h-4 animate-pulse" />
              <span>Luyện phản xạ</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {totalPractices} bài
            </div>
            <p className="text-2xs font-bold text-slate-400">
              TB {averageScore}/100đ Tokyo
            </p>
          </div>

          {/* Metric 4: Điểm kinh nghiệm & Cấp độ */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-2xs space-y-1 hover:border-amber-400 transition-colors">
            <div className="flex items-center gap-2 text-amber-500 text-xs font-black uppercase tracking-wider">
              <Trophy className="w-4 h-4 animate-bounce" />
              <span>Kinh nghiệm tích lũy</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {totalXp} XP
            </div>
            <p className="text-2xs font-bold text-slate-400">
              Cấp độ {userLevel} • Sơ cấp {targetLevel}
            </p>
          </div>
        </div>

        {/* ========================================================
            3. SEGMENTED TAB NAVIGATION BAR
        ======================================================== */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3 overflow-x-auto no-scrollbar">
          {/* Tab 1: Tiến trình & Thống kê */}
          <button
            onClick={() => setActiveTab("progress")}
            type="button"
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "progress"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Tiến trình & Thống kê</span>
            <span
              className={`px-2 py-0.5 rounded-full text-3xs font-extrabold ${
                activeTab === "progress"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              7 ngày qua
            </span>
          </button>

          {/* Tab 2: Lịch sử luyện phản xạ */}
          <button
            onClick={() => setActiveTab("practices")}
            type="button"
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "practices"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Lịch sử luyện phản xạ & Audio</span>
            {practices.length > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-3xs font-extrabold ${
                  activeTab === "practices"
                    ? "bg-white/20 text-white"
                    : "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400"
                }`}
              >
                {practices.length}
              </span>
            )}
          </button>

          {/* Tab 3: Gói cước & Đơn hàng */}
          <button
            onClick={() => setActiveTab("orders")}
            type="button"
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "orders"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Gói cước & Đơn hàng</span>
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

          {/* Tab 4: Cài đặt hồ sơ & Mật khẩu */}
          <button
            onClick={() => setActiveTab("settings")}
            type="button"
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "settings"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <UserCog className="w-4 h-4" />
            <span>Cài đặt hồ sơ & Mật khẩu</span>
          </button>
        </div>

        {/* ========================================================
            TAB 1: TIẾN TRÌNH & THÀNH TÍCH (Progress & Analytics)
        ======================================================== */}
        {activeTab === "progress" && (
          <div className="space-y-7 animate-in fade-in duration-200">
            {/* Top Row: Weekly Chart (2 cols) & Course Progress (1 col) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 7-Day Interactive Bar Chart */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-rose-500 animate-pulse" />
                      <span>Biểu đồ thời gian luyện phản xạ 7 ngày</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Đo lường thời lượng nói thực tế và số lượt phản xạ cùng AI
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-md bg-rose-500 inline-block shadow-2xs" />
                      <span>{totalMinutes} phút học</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-md bg-amber-400 inline-block shadow-2xs" />
                      <span>{totalPractices} lượt luyện</span>
                    </div>
                  </div>
                </div>

                <div className="w-full h-64 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#94A3B8" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "#94A3B8" }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white text-xs rounded-xl py-2.5 px-3.5 shadow-xl space-y-1.5 border border-slate-800">
                                <p className="font-bold border-b border-slate-700 pb-1 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  <span>{data.day} ({data.date})</span>
                                </p>
                                <p className="text-rose-400 font-semibold flex items-center gap-1.5">
                                  <Clock3 className="w-3.5 h-3.5 text-rose-400" />
                                  <span>Thời gian: {data.minutes} phút</span>
                                </p>
                                <p className="text-amber-400 flex items-center gap-1.5">
                                  <Mic className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Luyện nói: {data.practices} lượt</span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="minutes" radius={[8, 8, 0, 0]} maxBarSize={38}>
                        {chartData.map((entry, index) => {
                          const isToday =
                            entry.day === "Hôm nay" || index === chartData.length - 1;
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={isToday ? "#f43f5e" : "#fda4af"}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Course Progress Card (1 col) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        Tiến độ khóa học
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Các lộ trình giao tiếp đang theo học
                      </p>
                    </div>
                    <Link
                      to="/courses"
                      className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                    >
                      Xem tất cả
                    </Link>
                  </div>

                  <div className="space-y-3.5 mt-4">
                    {courses.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400">
                        Chưa có dữ liệu khóa học
                      </div>
                    ) : (
                      courses.slice(0, 3).map((course, idx) => {
                        const completedCount = idx === 0 ? Math.min(totalPractices, 10) : 0;
                        const totalLessons = 10;
                        const percent = Math.min(100, Math.round((completedCount / totalLessons) * 100));

                        return (
                          <div
                            key={course._id}
                            className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                                {course.title}
                              </span>
                              <span className="font-extrabold text-rose-600 dark:text-rose-400 shrink-0">
                                {percent}%
                              </span>
                            </div>

                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-2xs text-slate-400">
                              <span>{completedCount}/{totalLessons} bài hoàn thành</span>
                              <Badge variant={course.level === "N4" ? "primary" : "secondary"} size="sm">
                                {course.level || "N5"}
                              </Badge>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/courses"
                    className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Tiếp tục bài học trong lộ trình</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Row: Achievements & Learning Motivation Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Real Achievements System (2 cols) */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-500" />
                      <span>Huy hiệu & Thành tích đạt được</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Mở khóa các cột mốc vinh danh khi kiên trì luyện phản xạ mỗi ngày
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 px-2.5 py-1 rounded-lg">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
                    <span>
                      {achievements.filter((a) => a.unlocked).length}/{achievements.length} Đã mở
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {achievements.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        item.unlocked
                          ? "bg-rose-50/40 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-800/80 shadow-2xs"
                          : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 opacity-75"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>{item.icon}</div>
                        {item.unlocked ? (
                          <span className="inline-flex items-center gap-1 text-2xs font-bold text-rose-700 dark:text-rose-300 bg-rose-100/80 dark:bg-rose-900/60 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-rose-600" />
                            <span>Đã mở khóa</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-2xs font-medium text-slate-400 bg-slate-200/70 dark:bg-slate-700/60 px-2 py-0.5 rounded-full">
                            <Lock className="w-3 h-3" />
                            <span>{item.progress}</span>
                          </span>
                        )}
                      </div>

                      <h4 className="mt-2.5 font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                        {item.title}
                      </h4>
                      <p className="mt-0.5 text-2xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Japanese Mascot & Daily Tip Box (1 col) */}
              <div className="bg-gradient-to-br from-rose-50/60 via-amber-50/40 to-slate-50 dark:from-slate-900 dark:via-rose-950/20 dark:to-slate-900 border border-rose-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-2xs flex flex-col justify-between items-center text-center space-y-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-white/80 dark:bg-slate-800 border border-rose-200/60 dark:border-rose-900/40 rounded-full text-2xs font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    <span>Bí quyết phản xạ 10 phút/ngày</span>
                  </div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    Kiên trì là chìa khóa Kaiwa!
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    Mỗi ngày chỉ cần 10–15 phút luyện nói cùng gia sư AI sẽ giúp bạn cải thiện tốc độ bật từ vựng tiếng Nhật lên 40% chỉ sau 4 tuần.
                  </p>
                </div>

                <div className="py-2">
                  <JapaneseMascot type="cat-lucky" size={110} />
                </div>

                <Link
                  to="/speaking"
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:brightness-105 active:scale-98 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Mic className="w-3.5 h-3.5 animate-pulse" />
                  <span>Vào phòng luyện phản xạ ngay</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: LỊCH SỬ LUYỆN PHẢN XẠ & AUDIO (Practices Feed)
        ======================================================== */}
        {activeTab === "practices" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Mic className="w-5 h-5 text-rose-500" />
                  <span>Lịch sử luyện phản xạ & Bản ghi giọng nói</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Nghe lại bản thu âm giọng nói của bạn trên Cloudinary và xem chi tiết điểm số AI
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 px-3 py-1.5 rounded-xl">
                  {practices.length} bài đã lưu
                </span>
                <Link
                  to="/speaking"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:brightness-105 active:scale-98 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Luyện bài mới</span>
                </Link>
              </div>
            </div>

            {practices.length === 0 ? (
              <div className="text-center py-14 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl space-y-4">
                <div className="flex justify-center">
                  <JapaneseMascot type="cat-lucky" size={120} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Bạn chưa có bài luyện nói nào được lưu
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Hãy vào phòng luyện phản xạ AI, bật micro và đối đáp cùng gia sư ảo để lưu lại tiến độ nhé!
                  </p>
                </div>
                <Link
                  to="/speaking"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:brightness-105 active:scale-95 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition-all"
                >
                  <Mic className="w-4 h-4 text-white animate-pulse" />
                  <span>Bắt đầu bài luyện phản xạ đầu tiên</span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {practices.map((item) => {
                  const lessonTitle =
                    typeof item.lessonId === "object" && item.lessonId
                      ? (item.lessonId as any).title
                      : item.sampleSentence;

                  const score = item.overallScore || item.score || 80;

                  return (
                    <div
                      key={item._id}
                      className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 rounded-2xl px-3 transition-colors"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-200 truncate">
                            {lessonTitle || "Luyện nói câu giao tiếp"}
                          </h4>
                        </div>

                        {item.transcript && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 italic font-sans pl-4">
                            &quot;{item.transcript}&quot;
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-2xs text-slate-400 dark:text-slate-500 font-semibold pl-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.completedAt || item.createdAt).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.durationSeconds || 15} giây
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

                        <div className="text-right min-w-[70px]">
                          <span
                            className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                              score >= 80
                                ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                : score >= 60
                                ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                            }`}
                          >
                            {score}đ
                          </span>
                          <span className="text-3xs text-slate-400 font-bold block mt-0.5">Phản xạ</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 3: GÓI CƯỚC & ĐƠN HÀNG (Billing & Order History)
        ======================================================== */}
        {activeTab === "orders" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Subscription Summary Banner */}
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
                          <span>
                            {user?.role === "admin"
                              ? "Quản trị viên · VIP Trọn đời"
                              : user?.subscription?.expiresAt
                              ? `Hạn dùng: ${new Date(user.subscription.expiresAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })} (còn ${Math.max(0, Math.ceil((new Date(user.subscription.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} ngày)`
                              : "Gói Premium Đang Hoạt Động"}
                          </span>
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
                        : `Hôm nay bạn còn ${remainingFreePractices}/5 lượt luyện nói miễn phí`}
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
                        <span>Chi tiết gói & Quản lý</span>
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

            {/* Orders Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
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
                    <JapaneseMascot type="cat-lucky" size={120} />
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
                    <span>Nâng cấp 99.000đ qua VietQR 24/7</span>
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
                                  className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
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
                              {order.paymentMethod === "vnpay" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/50 text-2xs font-bold whitespace-nowrap">
                                  VNPay
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-900/50 text-2xs font-bold whitespace-nowrap">
                                  <Landmark className="w-3 h-3" />
                                  <span>VietQR 24/7</span>
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
          </div>
        )}

        {/* ========================================================
            TAB 4: CÀI ĐẶT HỒ SƠ & MẬT KHẨU (Settings & Security)
        ======================================================== */}
        {activeTab === "settings" && (
          <div className="space-y-7 animate-in fade-in duration-200">
            {/* Top Info Banner */}
            <div className="rounded-3xl p-6 sm:p-7 bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-transparent border border-rose-200/60 dark:border-rose-900/40 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    <UserCog size={13} />
                    <span>Quản lý Tài Khoản & Bảo Mật</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    Chỉnh sửa Hồ sơ & Đổi Mật khẩu
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Cập nhật họ tên, mục tiêu luyện Kaiwa và bảo mật tài khoản của bạn.
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Mã tài khoản: <code className="text-2xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300">{user?._id?.slice(-8) || "JTalk"}</code>
                  </span>
                </div>
              </div>
            </div>

            {/* Grid 2 Columns: Profile on the left, Password on the right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
              {/* Column 1: Chỉnh sửa Hồ sơ cá nhân (7 cols) */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                      <User size={20} />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        Thông tin cá nhân & Lộ trình
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Chỉnh sửa trực tiếp họ tên và mục tiêu học tập
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  {/* Account Identifiers (Locked / Fixed) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60">
                    {/* Username - Locked */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <Lock size={12} className="text-slate-400" />
                          <span>Tên đăng nhập</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={user?.username || ""}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 text-xs font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed select-all"
                        title="Tên đăng nhập cố định, không thể thay đổi"
                      />
                    </div>

                    {/* Email - Linked */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <Mail size={12} className="text-slate-400" />
                          <span>Email liên kết</span>
                        </label>
                      </div>
                      <input
                        type="email"
                        readOnly
                        disabled
                        value={user?.email || ""}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 text-xs font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed select-all"
                        title="Email nhận mã OTP khi khôi phục mật khẩu"
                      />
                    </div>
                  </div>

                  {/* Prefilled First & Last Names */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Họ và tên đệm
                      </label>
                      <input
                        type="text"
                        value={profileLastName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProfileLastName(val);
                          const combined = `${val} ${profileFirstName}`.trim();
                          if (combined) setProfileDisplayName(combined);
                        }}
                        placeholder="ví dụ: Nguyễn Văn"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Tên <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={profileFirstName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProfileFirstName(val);
                          const combined = `${profileLastName} ${val}`.trim();
                          if (combined) setProfileDisplayName(combined);
                        }}
                        placeholder="ví dụ: Nam"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  {/* Display Name */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Tên hiển thị công khai <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-3xs text-slate-400">Tự động cập nhật theo Họ & Tên</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={profileDisplayName}
                      onChange={(e) => setProfileDisplayName(e.target.value)}
                      placeholder="ví dụ: Nguyễn Văn Nam"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  {/* Bio */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Giới thiệu ngắn (Bio)
                    </label>
                    <textarea
                      rows={2}
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      placeholder="Mục tiêu của tôi là đỗ N3 và giao tiếp tự tin khi đi phỏng vấn..."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 resize-none"
                    />
                  </div>

                  {/* JLPT Target Level */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Target size={14} className="text-rose-500" />
                      <span>Mục tiêu trình độ JLPT</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {(["N5", "N4", "N3", "N2", "N1"] as const).map((lvl) => {
                        const isSelected = profileTargetLevel === lvl;
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setProfileTargetLevel(lvl)}
                            className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs ${
                              isSelected
                                ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                                : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                            }`}
                          >
                            {lvl}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Goal and Daily Minutes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <Sparkles size={14} className="text-amber-500" />
                        <span>Mục đích học</span>
                      </label>
                      <select
                        value={profileGoal}
                        onChange={(e) => setProfileGoal(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                      >
                        <option value="daily_conversation">💬 Hội thoại đời sống</option>
                        <option value="interview">💼 Phỏng vấn xin việc</option>
                        <option value="business">🏢 Tiếng Nhật công sở</option>
                        <option value="travel">✈️ Du lịch & Giao lưu</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <Clock size={14} className="text-indigo-500" />
                        <span>Mục tiêu mỗi ngày</span>
                      </label>
                      <select
                        value={profileDailyMinutes}
                        onChange={(e) => setProfileDailyMinutes(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                      >
                        <option value={15}>15 phút / ngày</option>
                        <option value={30}>30 phút / ngày</option>
                        <option value={45}>45 phút / ngày</option>
                        <option value={60}>60 phút / ngày</option>
                      </select>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:brightness-105 text-white text-xs font-black shadow-md shadow-rose-500/25 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
                    >
                      {isSavingProfile ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>Đang lưu thông tin...</span>
                        </>
                      ) : (
                        <>
                          <Check size={15} />
                          <span>Lưu Thay Đổi Hồ Sơ</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Column 2: Đổi Mật Khẩu (5 cols) */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                      <KeyRound size={20} />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        Đổi mật khẩu tài khoản
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Bảo vệ tài khoản với mật khẩu mạnh
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Mật khẩu hiện tại <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? "text" : "password"}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Nhập mật khẩu hiện tại"
                        className="w-full px-4 py-2.5 pr-11 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Mật khẩu mới <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Tối thiểu 6 ký tự"
                        className="w-full px-4 py-2.5 pr-11 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {newPassword && (
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-3xs font-bold">
                          <span className="text-slate-500">Độ bảo mật:</span>
                          <span
                            className={
                              newPasswordStrength.level === 3
                                ? "text-emerald-500"
                                : newPasswordStrength.level === 2
                                ? "text-amber-500"
                                : "text-rose-500"
                            }
                          >
                            {newPasswordStrength.text}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${newPasswordStrength.color}`}
                            style={{ width: `${(newPasswordStrength.level / 3) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                        className="w-full px-4 py-2.5 pr-11 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {confirmPassword && (
                      <p
                        className={`text-3xs font-bold ${
                          newPassword === confirmPassword ? "text-emerald-500" : "text-rose-500"
                        }`}
                      >
                        {newPassword === confirmPassword
                          ? "✓ Mật khẩu xác nhận trùng khớp"
                          : "✕ Mật khẩu xác nhận chưa khớp"}
                      </p>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-3xs text-slate-500 dark:text-slate-400 space-y-1">
                    <p className="font-bold text-slate-700 dark:text-slate-300">💡 Lời khuyên an toàn:</p>
                    <p>• Sử dụng ít nhất 6 ký tự kết hợp chữ in hoa, số và ký hiệu.</p>
                    <p>• Không đặt mật khẩu trùng với tên đăng nhập hoặc ngày sinh.</p>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isChangingPass}
                      className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:brightness-105 text-white text-xs font-black shadow-md shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
                    >
                      {isChangingPass ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>Đang đổi mật khẩu...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound size={15} />
                          <span>Cập Nhật Mật Khẩu</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global Modals */}
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

      <OnboardingQuizModal
        isOpen={showOnboardingQuiz}
        onClose={() => setShowOnboardingQuiz(false)}
        onCompleted={() => fetchMe()}
      />
    </div>
  );
};

export default ProfilePage;
