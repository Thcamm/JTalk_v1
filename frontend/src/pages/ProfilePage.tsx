import { useEffect, useState } from "react";
import { Link } from "react-router";
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
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { practiceService } from "@/services/practice.service";
import { StudyChart } from "@/components/dashboard/StudyChart";
import { StreakBadge } from "@/components/dashboard/StreakBadge";
import { PremiumModal } from "@/components/common/PremiumModal";
import { Badge } from "@/components/common/Badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import type { Practice, StudyLog } from "@/types";

export const ProfilePage = () => {
  const { user, isPremium, streak, remainingFreePractices, practiceCountToday } = useAuth();

  const [weeklyLogs, setWeeklyLogs] = useState<StudyLog[]>([]);
  const [practiceHistory, setPracticeHistory] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfileData = async () => {
      try {
        setLoading(true);

        const [weeklyRes, historyRes] = await Promise.allSettled([
          api.get("/studylogs/weekly"),
          practiceService.getPractices(),
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
    };
  }, [user?._id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Đang tải dữ liệu hồ sơ cá nhân..." />
      </div>
    );
  }

  const longestStreak = user?.gamification?.longestStreak || streak || 0;
  const totalXp = user?.gamification?.totalXp || 0;
  const targetLevel = user?.profile?.targetLevel || "N5";

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* 1. Profile Header Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white text-3xl font-black shadow-md">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "J"}
              </div>
              {isPremium && (
                <span className="absolute -top-1.5 -right-1.5 p-1 bg-amber-400 text-white rounded-full shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900">
                  {user?.displayName || user?.username || "Học viên JTalk"}
                </h1>
                {isPremium ? (
                  <Badge variant="premium" size="sm" icon={<Sparkles className="w-3 h-3" />}>
                    Premium Member
                  </Badge>
                ) : (
                  <Badge variant="secondary" size="sm">
                    Tài khoản Miễn phí
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500">{user?.email}</p>
              <div className="flex items-center gap-3 pt-1 text-xs text-slate-600 font-medium">
                <span>Mục tiêu: <strong className="text-emerald-600">{targetLevel} Kaiwa</strong></span>
                <span>•</span>
                <span>Tham gia từ {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "Hôm nay"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <StreakBadge streak={streak} />
          </div>
        </div>

        {/* 2. Gamification & Stat Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-4 h-4 fill-amber-500" />
              <span>Chuỗi Streak</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{streak} ngày</div>
            <p className="text-2xs text-slate-400">Kỷ lục: {longestStreak} ngày</p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center gap-2 text-blue-500 text-xs font-bold uppercase tracking-wider">
              <Mic className="w-4 h-4" />
              <span>Lượt luyện nói</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{practiceHistory.length}</div>
            <p className="text-2xs text-slate-400">Hôm nay: {practiceCountToday} lượt</p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-wider">
              <Award className="w-4 h-4" />
              <span>Điểm kinh nghiệm</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{totalXp} XP</div>
            <p className="text-2xs text-slate-400">Cấp độ {Math.floor(totalXp / 100) + 1}</p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center gap-2 text-indigo-500 text-xs font-bold uppercase tracking-wider">
              <Trophy className="w-4 h-4" />
              <span>Điểm TB phản xạ</span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {practiceHistory.length > 0
                ? Math.round(
                    practiceHistory.reduce((acc, curr) => acc + (curr.overallScore || curr.score || 80), 0) /
                      practiceHistory.length
                  )
                : 85}
              <span className="text-xs font-semibold text-slate-400">/100</span>
            </div>
            <p className="text-2xs text-slate-400">Chuẩn phát âm Tokyo</p>
          </div>
        </div>

        {/* 3. Subscription & Quota Card */}
        <div
          className={`rounded-3xl p-6 sm:p-8 border transition-all ${
            isPremium
              ? "bg-gradient-to-r from-emerald-50 to-teal-50/60 border-emerald-200 text-emerald-950"
              : "bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50/30 border-amber-200"
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/80 border border-current/20">
                {isPremium ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Gói Premium Đang Hoạt Động</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span>Hạn mức luyện nói miễn phí</span>
                  </>
                )}
              </div>

              <h3 className="text-xl font-black text-slate-900">
                {isPremium
                  ? "Bạn đang sở hữu quyền luyện nói không giới hạn!"
                  : `Hôm nay bạn còn ${remainingFreePractices}/2 lượt luyện nói miễn phí`}
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {isPremium
                  ? "Thỏa sức giao tiếp 24/7 với AI, mở khóa toàn bộ bài học Kaiwa N5-N4 và lưu trữ tiến độ không giới hạn."
                  : "Nâng cấp gói tháng chỉ 99.000đ để bứt phá phản xạ, chấm điểm chi tiết 4 tiêu chí và không lo hết lượt."}
              </p>
            </div>

            <div className="shrink-0 w-full sm:w-auto">
              {isPremium ? (
                <Link
                  to="/checkout"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-300 shadow-2xs transition-all"
                >
                  <span>Gia hạn thêm gói tháng</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  onClick={() => setShowPremiumModal(true)}
                  type="button"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#A50064] to-[#C41A7E] hover:brightness-105 text-white font-bold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Nâng cấp 99.000đ qua MoMo</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4. 7-Day Study Chart */}
        <StudyChart logs={weeklyLogs} />

        {/* 5. Recent Practice History */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Lịch sử luyện phản xạ gần đây</h3>
              <p className="text-xs text-slate-500">Các bài tập hội thoại đã được AI chấm điểm</p>
            </div>
            <Link
              to="/courses"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
            >
              <span>Vào bài học mới</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {practiceHistory.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-3">
              <Mic className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">Bạn chưa có bài luyện nói nào</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Hãy chọn một chủ đề giao tiếp và bắt đầu phản xạ cùng gia sư AI nhé!
              </p>
              <Link
                to="/courses"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-700 transition-colors"
              >
                <span>Bắt đầu bài học đầu tiên</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {practiceHistory.slice(0, 5).map((item) => {
                const lessonTitle =
                  typeof item.lessonId === "object" && item.lessonId
                    ? (item.lessonId as any).title
                    : item.sampleSentence;

                const score = item.overallScore || item.score || 80;

                return (
                  <div
                    key={item._id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-2 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-800 truncate">
                        {lessonTitle || "Luyện nói câu giao tiếp"}
                      </h4>
                      {item.transcript && (
                        <p className="text-xs text-slate-500 italic truncate font-sans">
                          "{item.transcript}"
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-2xs text-slate-400">
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

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right">
                        <div className="text-base font-black text-emerald-600">{score}đ</div>
                        <span className="text-2xs text-slate-400">Điểm phản xạ</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        reason="general"
      />
    </div>
  );
};

export default ProfilePage;
