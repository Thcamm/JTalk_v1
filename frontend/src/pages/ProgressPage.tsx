import { useEffect, useState, useMemo, type ReactNode } from "react";
import { Link } from "react-router";
import {
  Flame,
  Clock3,
  Trophy,
  Target,
  Award,
  BookOpen,
  Mic,
  Calendar,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
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
import { curriculumService } from "@/services/curriculum.service";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Badge } from "@/components/common/Badge";
import type { Practice, Course } from "@/types";

export default function ProgressPage() {
  const { user, streak } = useAuth();

  const [weeklyLogs, setWeeklyLogs] = useState<DailyStudyLog[]>([]);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [logsData, practicesData, coursesData] = await Promise.all([
          studylogService.getWeeklyLogs(),
          practiceService.getPractices(),
          curriculumService.getCourses(),
        ]);

        if (isMounted) {
          setWeeklyLogs(logsData || []);
          setPractices(practicesData || []);
          setCourses(coursesData || []);
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu tiến trình học:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Format chart data for past 7 days
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

    // Default 7 days ending today if empty
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

  // Aggregate statistics
  const totalMinutes = useMemo(() => {
    const weeklySum = chartData.reduce((acc, curr) => acc + curr.minutes, 0);
    return Math.max(weeklySum, user?.dailyUsage?.minutesSpent || 0);
  }, [chartData, user]);

  const totalPractices = useMemo(() => {
    return practices.length;
  }, [practices]);

  const averageScore = useMemo(() => {
    if (practices.length === 0) return 0;
    const total = practices.reduce(
      (sum, p) => sum + (p.overallScore || p.score || 0),
      0
    );
    return Math.round(total / practices.length);
  }, [practices]);

  const totalXp = useMemo(() => {
    if (user?.gamification?.totalXp) return user.gamification.totalXp;
    return totalPractices * 15;
  }, [user, totalPractices]);

  // Achievements calculation
  const achievements = useMemo<{
    id: string;
    title: string;
    description: string;
    icon: ReactNode;
    unlocked: boolean;
    progress: string;
  }[]>(() => [
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
  ], [totalPractices, streak, practices, totalMinutes]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60 dark:bg-[#0b0f17] flex items-center justify-center p-8 transition-colors">
        <LoadingSpinner size="lg" label="Đang tải dữ liệu tiến trình & thống kê..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-[#0b0f17] p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
              Báo cáo học tập & phân tích phản xạ
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Tiến trình & Thống kê
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Theo dõi sự tiến bộ hàng ngày, thời lượng đàm thoại và phân tích điểm số phản xạ AI
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/speaking"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:brightness-105 active:translate-y-0.5 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg hover:shadow-rose-500/20 transition-all cursor-pointer"
            >
              <Mic className="w-4 h-4 animate-pulse" />
              <span>Vào luyện phản xạ AI</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 1. Overview 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Streak */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Chuỗi Streak
              </p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">{streak} ngày</h3>
              <p className="text-2xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                <span>Kỷ lục: {user?.gamification?.longestStreak || streak} ngày</span>
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-800/60 shadow-2xs">
              <Flame className="w-7 h-7 fill-rose-500 text-rose-500 animate-bounce" />
            </div>
          </div>

          {/* Card 2: Total Time */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Thời gian 7 ngày
              </p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">{totalMinutes} phút</h3>
              <p className="text-2xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                <Clock3 className="w-3.5 h-3.5" />
                <span>Hôm nay: {user?.dailyUsage?.minutesSpent || 0} phút</span>
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-800/60 shadow-2xs">
              <Clock3 className="w-7 h-7 animate-float" />
            </div>
          </div>

          {/* Card 3: Experience Points */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Kinh nghiệm tích lũy
              </p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">{totalXp} XP</h3>
              <p className="text-2xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>Cấp độ 1 • Sơ cấp N5</span>
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/60 shadow-2xs">
              <Trophy className="w-7 h-7 animate-bounce" />
            </div>
          </div>

          {/* Card 4: Average Reflex Score */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Điểm TB Phản xạ
              </p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                {averageScore > 0 ? `${averageScore}đ` : "Chưa có"}
              </h3>
              <p className="text-2xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                <Target className="w-3.5 h-3.5" />
                <span>Tổng {totalPractices} bài đã làm</span>
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-800/60 shadow-2xs">
              <Target className="w-7 h-7 animate-spin-slow" />
            </div>
          </div>
        </div>

        {/* 2. Main Analytics: Weekly Chart & Course Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 7-day Bar Chart (2 cols) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-rose-500 animate-pulse" />
                  <span>Biểu đồ thời gian luyện phản xạ 7 ngày gần nhất</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Đo lường số phút nói và số câu phản xạ tiếng Nhật thực tế
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-rose-500 inline-block" />
                  <span>{totalMinutes} phút học</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-amber-400 inline-block" />
                  <span>{totalPractices} lượt luyện</span>
                </div>
              </div>
            </div>

            <div className="w-full h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748B" }}
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
                          <div className="bg-slate-900 text-white text-xs rounded-xl py-2.5 px-3.5 shadow-xl space-y-1.5">
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
                  <Bar dataKey="minutes" radius={[8, 8, 0, 0]} maxBarSize={40}>
                    {chartData.map((entry, index) => {
                      const isToday =
                        entry.day === "Hôm nay" ||
                        index === chartData.length - 1;
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
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tiến độ khóa học</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Các lộ trình đang tham gia</p>
                </div>
                <Link to="/courses" className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline">
                  Xem tất cả
                </Link>
              </div>

              <div className="space-y-4 mt-4">
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
                      <div key={course._id} className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                            {course.title}
                          </span>
                          <span className="font-bold text-rose-600 dark:text-rose-400 shrink-0">
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
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Tiếp tục bài học trong lộ trình</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 3. Recent Activity Feed & Real Achievements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Practice Log Feed */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Hoạt động luyện nói gần đây</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Các lượt chấm phản xạ đã được lưu vào hệ thống</p>
              </div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 px-2.5 py-1 rounded-lg">
                {practices.length} lượt lưu
              </span>
            </div>

            {practices.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl space-y-2 border border-dashed border-slate-200 dark:border-slate-700">
                <Mic className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Bạn chưa có bài luyện nói nào được ghi nhận
                </p>
                <Link
                  to="/speaking"
                  className="inline-block text-xs font-bold text-rose-600 dark:text-rose-400 underline underline-offset-4"
                >
                  Bắt đầu bài luyện phản xạ đầu tiên
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {practices.slice(0, 5).map((practice) => {
                  const score = practice.overallScore || practice.score || 80;
                  const dateStr = practice.createdAt
                    ? new Date(practice.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Hôm nay";

                  return (
                    <div
                      key={practice._id}
                      className="py-3.5 flex items-start justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 rounded-xl px-2 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                          <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate">
                            {practice.sampleSentence || "Câu phản xạ hội thoại"}
                          </h4>
                        </div>

                        {practice.transcript && (
                          <p className="text-2xs text-slate-500 dark:text-slate-400 italic truncate pl-4">
                            "{practice.transcript}"
                          </p>
                        )}

                        <p className="text-2xs text-slate-400 pl-4">{dateStr}</p>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
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
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Real Achievements System */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Huy hiệu & Thành tích</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Mở khóa thành tích khi kiên trì luyện phản xạ</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 px-2.5 py-1 rounded-lg">
                <Award className="w-3.5 h-3.5 text-amber-500 animate-float" />
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
                      : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 opacity-70"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>{item.icon}</div>
                    {item.unlocked ? (
                      <span className="inline-flex items-center gap-1 text-2xs font-bold text-rose-700 dark:text-rose-300 bg-rose-100/80 dark:bg-rose-900/60 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-rose-600" />
                        <span>Mở khóa</span>
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
        </div>
      </div>
    </div>
  );
}
