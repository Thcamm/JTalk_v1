import { useEffect, useState, useRef } from "react";
import { Link } from "react-router";
import {
  Flame,
  Clock3,
  Mic,
  Sparkles,
  ChevronRight,
  Calendar,
  Compass,
  CheckCircle2,
  TrendingUp,
  Play,
  Pause,
  ArrowUpRight,
  Video,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { practiceService } from "@/services/practice.service";
import { PremiumModal } from "@/components/common/PremiumModal";
import { HankoStampCard } from "@/components/gamification/HankoStampCard";
import type { Practice } from "@/types";

export const DashboardPage = () => {
  const { user, isPremium, streak, remainingFreePractices } = useAuth();

  const [practices, setPractices] = useState<Practice[]>([]);
  const [loadingPractices, setLoadingPractices] = useState(true);
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

    const fetchHistory = async () => {
      try {
        const data = await practiceService.getPractices();
        if (isMounted && data) {
          setPractices(data);
        }
      } catch (err) {
        console.error("Lỗi khi tải lịch sử luyện tập:", err);
      } finally {
        if (isMounted) setLoadingPractices(false);
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const minutesToday = user?.dailyUsage?.minutesSpent || 0;
  const targetMinutes = user?.profile?.dailyTargetMinutes || 15;
  const targetPercent = Math.min(100, Math.round((minutesToday / targetMinutes) * 100));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* 1. Subheader Navigation Pills */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black bg-rose-600 text-white shadow-xs">
            <Compass size={14} />
            <span>TỔNG QUAN HỌC TẬP</span>
          </div>
          <Link
            to="/speaking"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <span>Phòng Luyện AI</span>
          </Link>
          <Link
            to="/courses"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <span>Video Bài Giảng</span>
          </Link>
        </div>

        <Link
          to="/speaking"
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rose-600 dark:text-rose-400 hover:underline"
        >
          <span>Luyện phản xạ ngay</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* 2. Welcome Bento Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-rose-500/10 dark:from-rose-950/40 dark:via-slate-900/60 dark:to-indigo-950/30 border border-rose-200/80 dark:border-rose-800/60 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 transition-colors">
        {/* Background Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-rose-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2.5 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/90 dark:bg-slate-800/90 border border-rose-200 dark:border-rose-800/80 rounded-full text-2xs font-extrabold text-rose-800 dark:text-rose-300 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 animate-spin-slow" />
            <span>AI Reflex Studio • Tokyo Dialect</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Xin chào, {user?.displayName || user?.username || "học viên"}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Rèn luyện thói quen phản xạ tự nhiên mỗi ngày: Lắng nghe âm điệu chuẩn, tự tin cất giọng và để Sensei AI chấm điểm phát âm cho bạn nhé!
          </p>
        </div>

        {/* 3 Right Quick Metrics Bento Cards */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 w-full lg:w-auto shrink-0 relative z-10">
          {/* Metric 1: Minutes Today */}
          <div className="bg-white/95 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 text-center shadow-xs hover:border-rose-300 transition-all group">
            <p className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              HÔM NAY
            </p>
            <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {minutesToday}
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                /{targetMinutes}
              </span>
            </p>
            <span className="text-3xs font-bold text-slate-400 dark:text-slate-400">phút</span>
          </div>

          {/* Metric 2: Streak */}
          <div className="bg-rose-50/95 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 rounded-2xl p-4 text-center shadow-xs hover:scale-102 transition-transform">
            <p className="text-3xs font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-300">
              STREAK
            </p>
            <p className="text-lg sm:text-2xl font-black text-rose-900 dark:text-rose-200 mt-1 flex items-center justify-center gap-1.5">
              <Flame size={20} className="fill-rose-500 text-rose-500 animate-pulse shrink-0" />
              <span>{streak}</span>
            </p>
            <span className="text-3xs font-bold text-rose-700 dark:text-rose-300">ngày liên tiếp</span>
          </div>

          {/* Metric 3: Goal */}
          <div className="bg-amber-50/95 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl p-4 text-center shadow-xs hover:scale-102 transition-transform">
            <p className="text-3xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              MỤC TIÊU
            </p>
            <p className="text-lg sm:text-2xl font-black text-amber-800 dark:text-amber-300 mt-1">
              {targetPercent}%
            </p>
            <span className="text-3xs font-bold text-amber-600 dark:text-amber-400">hoàn thành</span>
          </div>
        </div>
      </div>

      {/* 2.5. Japanese Hanko Stamp Card (Thẻ điểm danh mộc đỏ Radio Taisou) */}
      <HankoStampCard />

      {/* 3. Section: Khám phá tính năng (Gen-Z Bento Feature Cards) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Khám phá tính năng nổi bật
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Các công cụ học tập thông minh giúp sinh viên làm chủ giao tiếp Kaiwa và tự tin phỏng vấn
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pillar 1: Luyện Phản Xạ Kaiwa AI */}
          <Link
            to="/speaking"
            className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500 rounded-3xl p-5 shadow-xs hover:shadow-lg hover:shadow-rose-500/5 transition-all duration-300 flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-108 transition-transform shadow-2xs border border-rose-100/60 dark:border-rose-900/40">
                  <Mic size={22} className="animate-pulse" />
                </div>
                <span className="px-2 py-0.5 text-3xs font-extrabold bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-full border border-rose-200/60 dark:border-rose-800/60">
                  CORE AI
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  Luyện Phản Xạ Kaiwa AI
                </h3>
                <p className="text-2xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 font-medium leading-relaxed">
                  Nhập vai tình huống thực tế, đối đáp tốc độ 5s và AI chấm điểm phát âm tức thì
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-3xs font-bold text-rose-600 dark:text-rose-400 group-hover:underline">
              <span>Vào phòng luyện</span>
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Pillar 2: Kho Video Bài Giảng & Shadowing */}
          <Link
            to="/courses"
            className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 rounded-3xl p-5 shadow-xs hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-108 transition-transform shadow-2xs border border-amber-100/60 dark:border-amber-900/40">
                  <Video size={22} className="animate-float" />
                </div>
                <span className="px-2 py-0.5 text-3xs font-extrabold bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-full border border-amber-200/60 dark:border-amber-800/60">
                  SHADOWING
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Video Bài Giảng AI
                </h3>
                <p className="text-2xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 font-medium leading-relaxed">
                  Micro-learning 5 phút, phụ đề Furigana từng chữ và luyện đọc đuổi chuẩn Tokyo
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-3xs font-bold text-amber-600 dark:text-amber-400 group-hover:underline">
              <span>Xem bài học</span>
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Pillar 3: Tiến trình & Thống kê */}
          <Link
            to="/progress"
            className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500 rounded-3xl p-5 shadow-xs hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-108 transition-transform shadow-2xs border border-purple-100/60 dark:border-purple-900/40">
                  <TrendingUp size={22} className="animate-bounce" />
                </div>
                <span className="px-2 py-0.5 text-3xs font-extrabold bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-full border border-purple-200/60 dark:border-purple-800/60">
                  ANALYTICS
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Tiến Trình & Thống Kê
                </h3>
                <p className="text-2xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 font-medium leading-relaxed">
                  Biểu đồ học tập 7 ngày và phân tích chi tiết 4 tiêu chí phát âm chuyên sâu
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-3xs font-bold text-purple-600 dark:text-purple-400 group-hover:underline">
              <span>Xem báo cáo</span>
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Pillar 4: Gói Hội Viên JTalk Premium */}
          <div
            onClick={() => setShowPremiumModal(true)}
            className="group bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-rose-500/10 dark:from-rose-950/30 dark:to-amber-950/20 border border-rose-200/80 dark:border-rose-800/60 hover:border-rose-400 dark:hover:border-rose-500 rounded-3xl p-5 shadow-xs hover:shadow-lg hover:shadow-rose-500/5 transition-all duration-300 flex flex-col justify-between gap-4 cursor-pointer"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0 group-hover:scale-108 transition-transform shadow-2xs border border-rose-200/60 dark:border-rose-800/60">
                  <Sparkles size={22} className="text-rose-600 dark:text-rose-400 animate-spin-slow" />
                </div>
                <span className="px-2 py-0.5 text-3xs font-black bg-rose-500 text-white rounded-full shadow-2xs">
                  PRO VIP
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-rose-900 dark:text-rose-200 group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors">
                  Hội Viên Premium 99k
                </h3>
                <p className="text-2xs text-rose-800/80 dark:text-rose-300/80 line-clamp-2 mt-1 font-medium leading-relaxed">
                  {isPremium
                    ? "Tài khoản Premium không giới hạn lượt luyện nói & kho kịch bản"
                    : `Không giới hạn lượt đối đáp 24/7 (còn ${remainingFreePractices}/2 lượt Free)`}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-rose-200/60 dark:border-rose-800/60 text-3xs font-bold text-rose-600 dark:text-rose-400 group-hover:underline">
              <span>{isPremium ? "Chi tiết gói" : "Nâng cấp ngay"}</span>
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Section: Lịch sử học 30 ngày & Lượt luyện phản xạ gần nhất */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Lịch sử học 30 ngày
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Theo dõi sự tiến bộ đều đặn và tần suất luyện nói mỗi ngày
            </p>
          </div>
          <Link
            to="/progress"
            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Xem chi tiết biểu đồ</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* 3 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-2xs">
              <Flame size={22} className="fill-rose-500 text-rose-500 animate-pulse" />
            </div>
            <div>
              <p className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Streak hiện tại
              </p>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">{streak} ngày</h4>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
              <Calendar size={22} />
            </div>
            <div>
              <p className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Ngày đã học
              </p>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">
                {Math.min(streak, 30)}/30 ngày
              </h4>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
              <Clock3 size={22} />
            </div>
            <div>
              <p className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Tổng thời lượng
              </p>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">
                {minutesToday} phút
              </h4>
            </div>
          </div>
        </div>

        {/* Practice Recent List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Lượt luyện phản xạ gần nhất
            </h3>
            <Link
              to="/profile"
              className="text-2xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
            >
              Xem tất cả
            </Link>
          </div>

          {loadingPractices ? (
            <p className="text-xs text-slate-400 py-8 text-center animate-pulse">
              Đang đồng bộ kết quả luyện tập từ đám mây...
            </p>
          ) : practices.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl space-y-2.5 border border-dashed border-slate-200 dark:border-slate-700">
              <Mic className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Bạn chưa có bài luyện phản xạ nào hôm nay
              </p>
              <Link
                to="/speaking"
                className="inline-block text-xs font-black text-rose-600 dark:text-rose-400 underline underline-offset-4"
              >
                Bắt đầu một kịch bản nói ngay
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {practices.slice(0, 3).map((p) => {
                const score = p.overallScore || p.score || 80;
                return (
                  <div
                    key={p._id}
                    className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 rounded-2xl px-3 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate flex items-center gap-2">
                        <CheckCircle2 size={15} className="text-rose-500 shrink-0" />
                        <span>{p.sampleSentence || "Luyện đàm thoại phản xạ"}</span>
                      </h4>
                      {p.transcript && (
                        <p className="text-2xs text-slate-500 dark:text-slate-400 italic truncate pl-6 font-sans">
                          "{p.transcript}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {p.audioUrl && (
                        <button
                          onClick={() => togglePlayAudio(p._id, p.audioUrl)}
                          type="button"
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                            playingAudioId === p._id
                              ? "bg-rose-600 text-white animate-pulse"
                              : "bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          }`}
                          title="Nghe lại giọng nói của bạn"
                        >
                          {playingAudioId === p._id ? (
                            <>
                              <Pause size={12} className="fill-current" />
                              <span>Dừng</span>
                            </>
                          ) : (
                            <>
                              <Play size={12} className="fill-current ml-0.5" />
                              <span>Nghe</span>
                            </>
                          )}
                        </button>
                      )}

                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-xl shadow-2xs ${
                          score >= 80
                            ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                            : score >= 60
                            ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
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
      </div>

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        reason="quota_exceeded"
      />
    </div>
  );
};

export default DashboardPage;
