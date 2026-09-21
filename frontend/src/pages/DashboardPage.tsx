import { useEffect, useState } from "react";
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
  const [activeTab, setActiveTab] = useState<"home" | "community">("home");

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
    };
  }, []);

  const minutesToday = user?.dailyUsage?.minutesSpent || 0;
  const targetMinutes = user?.profile?.dailyTargetMinutes || 15;
  const targetPercent = Math.min(100, Math.round((minutesToday / targetMinutes) * 100));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* 1. Subheader Navigation Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab("home")}
          type="button"
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "home"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80"
          }`}
        >
          <Compass size={15} />
          <span>TRANG CHỦ</span>
        </button>

        <button
          onClick={() => setActiveTab("community")}
          type="button"
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "community"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80"
          }`}
        >
          <span>👥 CỘNG ĐỒNG & THỬ THÁCH</span>
        </button>
      </div>

      {/* 2. Welcome Banner (Mascot & Pastel Green Card style like Corodomo) */}
      <div className="bg-[#EBF7F2] border border-emerald-200/80 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 border border-emerald-200 rounded-full text-2xs font-bold text-emerald-800">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dashboard học tập phản xạ</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Xin chào, {user?.displayName || user?.username || "bạn"} 👋
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Một nơi để theo dõi nhịp học, giữ chuỗi streak và quay lại đúng bài cần luyện phản xạ nói tiếng Nhật cùng AI.
          </p>
        </div>

        {/* 3 Right Quick Metrics Cards */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 w-full lg:w-auto shrink-0">
          {/* Metric 1: Minutes Today */}
          <div className="bg-white/90 border border-emerald-100 rounded-2xl p-3.5 sm:p-4 text-center shadow-2xs">
            <p className="text-3xs font-bold uppercase tracking-wider text-slate-400">HÔM NAY</p>
            <p className="text-lg sm:text-xl font-black text-slate-800 mt-1">
              {minutesToday}<span className="text-xs font-normal text-slate-400">/{targetMinutes}</span>
            </p>
            <span className="text-3xs text-slate-400">phút</span>
          </div>

          {/* Metric 2: Streak */}
          <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3.5 sm:p-4 text-center shadow-2xs">
            <p className="text-3xs font-bold uppercase tracking-wider text-amber-700">STREAK</p>
            <p className="text-lg sm:text-xl font-black text-amber-900 mt-1 flex items-center justify-center gap-0.5">
              🔥 {streak}
            </p>
            <span className="text-3xs text-amber-700 font-semibold">ngày</span>
          </div>

          {/* Metric 3: Goal */}
          <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-3.5 sm:p-4 text-center shadow-2xs">
            <p className="text-3xs font-bold uppercase tracking-wider text-emerald-700">MỤC TIÊU</p>
            <p className="text-lg sm:text-xl font-black text-emerald-800 mt-1">{targetPercent}%</p>
            <span className="text-3xs text-emerald-600 font-semibold">hôm nay</span>
          </div>
        </div>
      </div>

      {/* 3. Section: Khám phá tính năng (Feature Explorer Grid like reference Image 1) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">Khám phá tính năng</h2>
          <p className="text-xs text-slate-500">
            Các công cụ học tập thông minh để bạn luyện nghe, phản xạ nói và chấm điểm phát âm
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Kho Kịch bản Kaiwa */}
          <Link
            to="/speaking"
            className="group bg-white border border-slate-200/80 hover:border-emerald-300 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <span className="text-xl">🎙️</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1">
                  <span>Luyện Speaking AI</span>
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </h3>
                <p className="text-2xs text-slate-500 line-clamp-1 mt-0.5">
                  Luyện nói với AI và nhập vai tình huống thực tế
                </p>
              </div>
            </div>
          </Link>

          {/* Card 2: Lộ trình khóa học */}
          <Link
            to="/courses"
            className="group bg-white border border-slate-200/80 hover:border-emerald-300 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <BookOpen size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1">
                  <span>Khóa học Kaiwa</span>
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </h3>
                <p className="text-2xs text-slate-500 line-clamp-1 mt-0.5">
                  Lộ trình luyện phản xạ Minna no Nihongo N5 - N4
                </p>
              </div>
            </div>
          </Link>

          {/* Card 3: Thử thách phản xạ nhanh 5s */}
          <Link
            to="/speaking"
            className="group bg-white border border-slate-200/80 hover:border-emerald-300 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Zap size={20} className="fill-amber-500 text-amber-500" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1">
                  <span>Phản xạ nhanh 5s</span>
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </h3>
                <p className="text-2xs text-slate-500 line-clamp-1 mt-0.5">
                  Thử thách nghe câu hỏi và đối đáp dưới 5 giây
                </p>
              </div>
            </div>
          </Link>

          {/* Card 4: Tiến trình & Thống kê */}
          <Link
            to="/progress"
            className="group bg-white border border-slate-200/80 hover:border-emerald-300 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <TrendingUp size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1">
                  <span>Tiến trình & Thống kê</span>
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </h3>
                <p className="text-2xs text-slate-500 line-clamp-1 mt-0.5">
                  Biểu đồ 7 ngày và phân tích 4 tiêu chí phát âm
                </p>
              </div>
            </div>
          </Link>

          {/* Card 5: Phỏng vấn IT & Doanh nghiệp */}
          <Link
            to="/courses"
            className="group bg-white border border-slate-200/80 hover:border-emerald-300 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <span className="text-xl">💼</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1">
                  <span>Kịch bản Business & Phỏng vấn</span>
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </h3>
                <p className="text-2xs text-slate-500 line-clamp-1 mt-0.5">
                  Phản xạ BrSE, Comtor và giao tiếp công sở Nhật
                </p>
              </div>
            </div>
          </Link>

          {/* Card 6: Gói Premium Plus */}
          <div
            onClick={() => setShowPremiumModal(true)}
            className="group bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-4 cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Sparkles size={20} className="text-amber-600" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-amber-900 flex items-center gap-1">
                  <span>Nâng cấp Premium 99k</span>
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </h3>
                <p className="text-2xs text-amber-700 line-clamp-1 mt-0.5">
                  {isPremium ? "Tài khoản Premium không giới hạn" : `Còn ${remainingFreePractices}/2 lượt Free hôm nay`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Section: Lịch sử học 30 ngày & Báo cáo phản xạ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Lịch sử học 30 ngày</h2>
            <p className="text-xs text-slate-500">
              Theo dõi streak và thời gian học mỗi ngày
            </p>
          </div>
          <Link
            to="/progress"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>Xem chi tiết biểu đồ</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* 3 Metric Cards (like in reference Image 1) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Flame size={20} className="fill-amber-500 text-amber-500" />
            </div>
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
                Streak hiện tại
              </p>
              <h4 className="text-xl font-black text-slate-900">{streak} ngày</h4>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
                Ngày đã học
              </p>
              <h4 className="text-xl font-black text-slate-900">
                {Math.min(streak, 30)}/30 ngày
              </h4>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Clock3 size={20} />
            </div>
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
                Tổng thời gian
              </p>
              <h4 className="text-xl font-black text-slate-900">
                {minutesToday} phút
              </h4>
            </div>
          </div>
        </div>

        {/* Practice Recent List */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900">Lượt luyện phản xạ gần nhất</h3>

          {loadingPractices ? (
            <p className="text-xs text-slate-400 py-6 text-center animate-pulse">
              Đang đồng bộ kết quả luyện tập...
            </p>
          ) : practices.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-2xl space-y-2">
              <Mic className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">
                Bạn chưa có bài luyện phản xạ nào hôm nay
              </p>
              <Link
                to="/speaking"
                className="inline-block text-xs font-bold text-emerald-600 underline"
              >
                Bắt đầu một kịch bản nói ngay
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {practices.slice(0, 3).map((p) => {
                const score = p.overallScore || p.score || 80;
                return (
                  <div
                    key={p._id}
                    className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/60 rounded-xl px-2 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-800 truncate flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                        <span>{p.sampleSentence || "Luyện đàm thoại phản xạ"}</span>
                      </h4>
                      {p.transcript && (
                        <p className="text-2xs text-slate-500 italic truncate pl-5">
                          "{p.transcript}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                          score >= 80
                            ? "bg-emerald-50 text-emerald-700"
                            : score >= 60
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
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
