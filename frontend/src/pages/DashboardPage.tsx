import { useEffect, useState, useRef } from "react";
import { Link } from "react-router";
import {
  Flame,
  Clock3,
  Mic,
  Sparkles,
  ChevronRight,
  Zap,
  BookOpen,
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
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black bg-emerald-600 text-white shadow-xs">
            <Compass size={14} />
            <span>TỔNG QUAN HỌC TẬP</span>
          </div>
          <Link
            to="/speaking"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <span>Phòng Luyện AI</span>
          </Link>
          <Link
            to="/courses"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <span>Video Bài Giảng</span>
          </Link>
        </div>

        <Link
          to="/speaking"
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          <span>Luyện phản xạ ngay</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* 2. Welcome Bento Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-indigo-500/10 dark:from-emerald-950/40 dark:via-slate-900/60 dark:to-indigo-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 transition-colors">
        {/* Background Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2.5 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/90 dark:bg-slate-800/90 border border-emerald-200 dark:border-emerald-800/80 rounded-full text-2xs font-extrabold text-emerald-800 dark:text-emerald-300 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-spin-slow" />
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
          <div className="bg-white/95 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 text-center shadow-xs hover:border-emerald-300 transition-all group">
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
          <div className="bg-amber-50/95 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl p-4 text-center shadow-xs hover:scale-102 transition-transform">
            <p className="text-3xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              STREAK
            </p>
            <p className="text-lg sm:text-2xl font-black text-amber-900 dark:text-amber-200 mt-1 flex items-center justify-center gap-1">
              🔥 {streak}
            </p>
            <span className="text-3xs font-bold text-amber-700 dark:text-amber-300">ngày liên tiếp</span>
          </div>

          {/* Metric 3: Goal */}
          <div className="bg-emerald-50/95 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-4 text-center shadow-xs hover:scale-102 transition-transform">
            <p className="text-3xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              MỤC TIÊU
            </p>
            <p className="text-lg sm:text-2xl font-black text-emerald-800 dark:text-emerald-300 mt-1">
              {targetPercent}%
            </p>
            <span className="text-3xs font-bold text-emerald-600 dark:text-emerald-400">hoàn thành</span>
          </div>
        </div>
      </div>

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Luyện Speaking AI */}
          <Link
            to="/speaking"
            className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 rounded-3xl p-5 shadow-xs hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-108 transition-transform shadow-2xs">
                <Mic size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Luyện Speaking AI
                  </h3>
                  <span className="px-1.5 py-0.5 text-3xs font-extrabold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-md">
                    HOT
                  </span>
                </div>
                <p className="text-2xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-medium">
                  Nhập vai tình huống thực tế, AI chấm điểm phản xạ tức thì
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>

          {/* Card 2: Video Khóa học Sensei */}
          <Link
            to="/courses"
            className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 rounded-3xl p-5 shadow-xs hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-108 transition-transform shadow-2xs">
                <Video size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Video Bài Giảng AI
                  </h3>
                  <span className="px-1.5 py-0.5 text-3xs font-extrabold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-md">
                    5 PHÚT
                  </span>
                </div>
                <p className="text-2xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-medium">
                  Phụ đề Furigana từng chữ, timeline click-to-seek tiện lợi
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>

          {/* Card 3: Phản xạ nhanh 5s */}
          <Link
            to="/speaking"
            className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 rounded-3xl p-5 shadow-xs hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-108 transition-transform shadow-2xs">
                <Zap size={22} className="fill-amber-500 text-amber-500" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Phản xạ tốc độ 5s
                </h3>
                <p className="text-2xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-medium">
                  Luyện đối đáp chớp nhoáng với bộ đếm giờ áp lực thực chiến
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>

          {/* Card 4: Tiến trình & Thống kê */}
          <Link
            to="/progress"
            className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 rounded-3xl p-5 shadow-xs hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-108 transition-transform shadow-2xs">
                <TrendingUp size={22} />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Tiến trình & Thống kê
                </h3>
                <p className="text-2xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-medium">
                  Biểu đồ 7 ngày và phân tích chi tiết 4 tiêu chí phát âm
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>

          {/* Card 5: Phỏng vấn IT & Business */}
          <Link
            to="/courses"
            className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 rounded-3xl p-5 shadow-xs hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-108 transition-transform shadow-2xs">
                <BookOpen size={22} />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Phỏng vấn IT & Business
                </h3>
                <p className="text-2xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-medium">
                  Kỹ năng BrSE, IT Comtor và văn hóa công sở Nhật Bản
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>

          {/* Card 6: Gói Plus 99k */}
          <div
            onClick={() => setShowPremiumModal(true)}
            className="group bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/60 rounded-3xl p-5 shadow-xs hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 flex items-center justify-between gap-4 cursor-pointer"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-108 transition-transform shadow-2xs">
                <Sparkles size={22} className="text-amber-600 dark:text-amber-400 animate-spin-slow" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-amber-900 dark:text-amber-200">
                    Nâng cấp Premium 99k
                  </h3>
                  <span className="px-1.5 py-0.5 text-3xs font-black bg-amber-400 text-amber-950 rounded-md">
                    PRO
                  </span>
                </div>
                <p className="text-2xs text-amber-800/80 dark:text-amber-300/80 line-clamp-1 mt-0.5 font-medium">
                  {isPremium ? "Tài khoản Premium không giới hạn" : `Còn ${remainingFreePractices}/2 lượt Free hôm nay`}
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-amber-400 dark:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0" />
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
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Xem chi tiết biểu đồ</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* 3 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
              <Flame size={22} className="fill-amber-500 text-amber-500" />
            </div>
            <div>
              <p className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Streak hiện tại
              </p>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">{streak} ngày</h4>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
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
              className="text-2xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
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
                className="inline-block text-xs font-black text-emerald-600 dark:text-emerald-400 underline underline-offset-4"
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
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
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
                              ? "bg-emerald-600 text-white animate-pulse"
                              : "bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
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
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
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
