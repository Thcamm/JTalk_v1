import { useEffect, useState, useRef } from "react";
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
  Play,
  Pause,
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
                  <span>Nâng cấp 99.000đ qua MoMo</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4. 7-Day Study Chart */}
        <StudyChart logs={weeklyLogs} />

        {/* 5. Recent Practice History with Cloud Audio Playback */}
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
                          "{item.transcript}"
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

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        reason="general"
      />
    </div>
  );
};

export default ProfilePage;
