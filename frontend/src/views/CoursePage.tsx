"use client";

import { useEffect, useState } from "react";
import { Link } from "@/lib/react-router-compat";
import { curriculumService } from "@/services/curriculum.service";
import { PremiumModal } from "@/components/common/PremiumModal";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import type { Course } from "@/types";
import {
  Search,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Lock,
  Play,
  BookOpen,
  Video,
  Clock,
  Tv,
  Globe,
  Zap,
  ExternalLink,
} from "lucide-react";

type SourceFilterType = "ALL" | "COMMUNITY" | "JTALK";

export const CoursePage = () => {
  const { isPremium } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilterType>("ALL");
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchCourses = async () => {
      try {
        setLoading(true);
        const data = await curriculumService.getCourses();
        if (isMounted && data && data.length > 0) {
          setCourses(data);
        } else if (isMounted) {
          // Default initial courses matching verified reference
          setCourses([
            {
              _id: "c-keigo-sambon",
              title: "Kính ngữ và Văn hóa Giao tiếp Chuẩn Nhật",
              description: "Tuyển tập video bài giảng Kính ngữ thực tế: Thể lịch sự (Teineigo), Tôn kính ngữ (Sonkeigo), Khiêm nhường ngữ (Kenjougo) và luyện phản xạ tự nhiên.",
              level: "N4",
              category: "Kính ngữ • Văn hóa ứng xử",
              courseType: "video_series",
              sourceType: "community",
              channelName: "三本塾 -Sambon Juku-",
              channelUrl: "https://www.youtube.com/@SambonJuku",
              thumbnail: "https://images.unsplash.com/photo-1528164344705-475426879c0d?w=400&auto=format&fit=crop&q=80",
              isPublished: true,
              isPremiumOnly: false,
              totalLessons: 2,
              totalVideos: 2,
              totalDurationMinutes: 10,
              orderIndex: 1,
            },
            {
              _id: "c-n5-beginner",
              title: "Giao tiếp Nhập môn – Phản xạ Cơ bản",
              description: "Luyện tập phản xạ giao tiếp đời sống hàng ngày từ con số 0 cùng trợ lý AI.",
              level: "N5",
              category: "Giao tiếp đời sống • Luyện nói phản xạ",
              courseType: "ai_kaiwa",
              sourceType: "jtalk",
              channelName: "JTalk AI Studio",
              thumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&auto=format&fit=crop&q=80",
              isPublished: true,
              isPremiumOnly: true,
              totalLessons: 3,
              totalVideos: 0,
              totalDurationMinutes: 15,
              orderIndex: 2,
            },
            {
              _id: "c-n4-intermediate",
              title: "Giao tiếp Đời sống và Tình huống Công sở",
              description: "Kịch bản giao tiếp đời sống mở rộng, gọi món nhà hàng, khám bệnh và phỏng vấn cơ bản.",
              level: "N4",
              category: "Công sở • Nhà hàng • Phỏng vấn",
              courseType: "ai_kaiwa",
              sourceType: "jtalk",
              channelName: "JTalk AI Studio",
              thumbnail: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&auto=format&fit=crop&q=80",
              isPublished: true,
              isPremiumOnly: true,
              totalLessons: 3,
              totalVideos: 0,
              totalDurationMinutes: 15,
              orderIndex: 3,
            },
            {
              _id: "c-business-n3",
              title: "Tiếng Nhật Doanh nghiệp và Làm việc",
              description: "Kịch bản giao tiếp công sở chuyên sâu, quy tắc báo cáo HORENSO, trao đổi dự án và làm việc cùng đối tác.",
              level: "N3",
              category: "Công sở • Báo cáo công việc • Đàm phán",
              courseType: "ai_kaiwa",
              sourceType: "jtalk",
              channelName: "JTalk AI Studio",
              thumbnail: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=400&auto=format&fit=crop&q=80",
              isPublished: true,
              isPremiumOnly: true,
              totalLessons: 2,
              totalVideos: 0,
              totalDurationMinutes: 10,
              orderIndex: 4,
            },
            {
              _id: "c-minna-n5",
              title: "Giáo trình Minna – 25 Tình huống Giao tiếp Thực tế",
              description: "Giáo trình sơ cấp 1: 25 bài video hội thoại, mỗi bài gồm Từ vựng, Ngữ pháp, Hội thoại, Hán tự và Luyện phản xạ tự nhiên.",
              level: "N5",
              category: "Tình huống thực tế • Ngữ pháp",
              courseType: "video_series",
              sourceType: "community",
              channelName: "Dũng Mori / Nihongo no Mori",
              channelUrl: "https://www.youtube.com/@dungmori",
              thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&auto=format&fit=crop&q=80",
              isPublished: true,
              isPremiumOnly: false,
              totalLessons: 1,
              totalVideos: 1,
              totalDurationMinutes: 5,
              orderIndex: 5,
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to load courses:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatCourseTitle = (title: string): string => {
    let t = title || "";
    if (t.includes("Kính ngữ") || t.includes("Sambon")) {
      return "Kính ngữ và Văn hóa Giao tiếp Chuẩn Nhật";
    }
    if (t.includes("Beginner") || t.includes("Nhập môn")) {
      return "Giao tiếp Nhập môn – Phản xạ Cơ bản";
    }
    if (t.includes("Intermediate") || t.includes("Đời sống")) {
      return "Giao tiếp Đời sống và Tình huống Công sở";
    }
    if (t.includes("Business") || t.includes("Doanh nghiệp")) {
      return "Tiếng Nhật Doanh nghiệp và Làm việc";
    }
    if (t.includes("Minna")) {
      return "Giáo trình Minna – 25 Tình huống Giao tiếp Thực tế";
    }
    return t
      .replace(/\s*\([^)]*\)/g, "")
      .replace(/Kaiwa/gi, "Giao tiếp")
      .replace(/Tokyo Accent/gi, "")
      .replace(/Beginner/gi, "Nhập môn")
      .replace(/Intermediate/gi, "Trung cấp")
      .replace(/Business Japanese/gi, "Tiếng Nhật Doanh nghiệp")
      .replace(/\s*N[1-5]\b/gi, "")
      .trim();
  };

  const formatCategoryTag = (cat: string): string => {
    const trimmed = cat.trim();
    if (trimmed === "kaiwa") return "Giao tiếp";
    if (trimmed === "daily") return "Đời sống";
    if (trimmed === "business") return "Công sở";
    if (trimmed === "grammar") return "Ngữ pháp";
    return trimmed
      .replace(/kaiwa/gi, "Giao tiếp")
      .replace(/daily/gi, "Đời sống")
      .replace(/business/gi, "Công sở")
      .replace(/shadowing/gi, "Phản xạ");
  };

  const getSourceType = (c: Course): "community" | "jtalk" => {
    if (c.sourceType === "jtalk") return "jtalk";
    if (c.channelName && c.channelName.toLowerCase().includes("jtalk")) return "jtalk";
    if (c.courseType === "ai_kaiwa") return "jtalk";
    if (c.isPremiumOnly) return "jtalk";
    const titleLower = (c.title || "").toLowerCase();
    if (
      titleLower.includes("nhập môn") ||
      titleLower.includes("doanh nghiệp") ||
      titleLower.includes("beginner") ||
      titleLower.includes("intermediate") ||
      titleLower.includes("business")
    ) {
      return "jtalk";
    }
    return c.sourceType || "community";
  };

  const filteredCourses = courses.filter((c) => {
    const sType = getSourceType(c);
    const displayTitle = formatCourseTitle(c.title);
    const matchesSource =
      sourceFilter === "ALL" ||
      (sourceFilter === "COMMUNITY" && sType === "community") ||
      (sourceFilter === "JTALK" && sType === "jtalk");

    const matchesSearch =
      displayTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.channelName?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSource && matchesSearch;
  });

  const communityCount = courses.filter((c) => getSourceType(c) === "community").length;
  const jtalkCount = courses.filter((c) => getSourceType(c) === "jtalk").length;

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-[#0b0f17] p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-7">
        {/* 1. Header & Bento Hero for Video Library */}
        <div className="relative overflow-hidden bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-rose-500/10 dark:from-rose-950/40 dark:via-slate-900/60 dark:to-amber-950/30 border border-rose-200/80 dark:border-rose-800/60 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/90 dark:bg-slate-800/90 border border-rose-200 dark:border-rose-800/80 rounded-full text-2xs font-extrabold text-rose-800 dark:text-rose-300 shadow-2xs">
              <Video className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 animate-float" />
              <span>Thư Viện Video & Shadowing Thực Tế</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Thư viện Video Giao tiếp Nhật Bản
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Kho video thực tế phong phú từ cộng đồng bản xứ (miễn phí 100%) và các lộ trình video bài giảng độc quyền tích hợp phòng luyện nói AI 1-1 từ JTalk.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <Link
              to="/speaking"
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:brightness-105 active:translate-y-0.5 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg hover:shadow-rose-500/20 transition-all"
            >
              <Sparkles size={15} className="text-amber-300 animate-spin-slow" />
              <span>Phòng Nói Đối Đáp AI</span>
            </Link>
          </div>
        </div>

        {/* 2. Source Type Selector Tabs (Cộng đồng vs JTalk Độc quyền) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
            <button
              onClick={() => setSourceFilter("ALL")}
              type="button"
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-2xs whitespace-nowrap ${
                sourceFilter === "ALL"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span>🌟 Tất cả</span>
              <span className="px-1.5 py-0.2 rounded-full text-3xs font-mono bg-slate-700/20 dark:bg-slate-200/20">
                {courses.length}
              </span>
            </button>

            <button
              onClick={() => setSourceFilter("COMMUNITY")}
              type="button"
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-2xs whitespace-nowrap ${
                sourceFilter === "COMMUNITY"
                  ? "bg-emerald-600 dark:bg-emerald-500 text-white shadow-emerald-600/20 shadow-md"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Globe size={14} className={sourceFilter === "COMMUNITY" ? "text-emerald-100" : "text-emerald-600"} />
              <span>Video từ Cộng đồng</span>
              <span className="px-1.5 py-0.2 rounded-full text-3xs font-extrabold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Free
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-3xs font-mono opacity-80">
                {communityCount}
              </span>
            </button>

            <button
              onClick={() => setSourceFilter("JTALK")}
              type="button"
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-2xs whitespace-nowrap ${
                sourceFilter === "JTALK"
                  ? "bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-rose-600/20 shadow-md"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Zap size={14} className={sourceFilter === "JTALK" ? "text-amber-200" : "text-amber-500"} />
              <span>JTalk Độc quyền</span>
              <span className="px-1.5 py-0.2 rounded-full text-3xs font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 flex items-center gap-0.5">
                <Lock size={9} />
                PRO
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-3xs font-mono opacity-80">
                {jtalkCount}
              </span>
            </button>
          </div>

          <div className="text-2xs font-semibold text-slate-500 dark:text-slate-400">
            {sourceFilter === "COMMUNITY" && (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                ✓ Video YouTube chuẩn bản xứ, nhúng trực tiếp và hoàn toàn miễn phí
              </span>
            )}
            {sourceFilter === "JTALK" && (
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                ★ Chuỗi bài giảng AI Studio độc quyền, kèm phòng luyện nói tương tác
              </span>
            )}
          </div>
        </div>

        {/* 3. Search Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm chủ đề, kênh YouTube, Minna, giao tiếp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-full text-xs font-medium dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:focus:border-rose-400 transition-all shadow-2xs placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <span>Thiết kế dành riêng cho người mới học phản xạ giao tiếp</span>
          </div>
        </div>

        {/* 4. Video Topics Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {sourceFilter === "COMMUNITY"
                  ? "Video từ Cộng đồng & Kênh YouTube"
                  : sourceFilter === "JTALK"
                  ? "Chủ đề Độc quyền JTalk AI Studio"
                  : "Tất cả chủ đề video"}
              </h2>
            </div>

            <span className="text-xs font-bold text-slate-400">
              {filteredCourses.length} chủ đề video
            </span>
          </div>

          {/* Bento Course Cards Grid */}
          {loading ? (
            <div className="py-24 flex justify-center">
              <LoadingSpinner size="lg" label="Đang tải danh mục thư viện video..." />
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Không tìm thấy chủ đề video nào phù hợp với bộ lọc hiện tại
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSourceFilter("ALL");
                }}
                className="text-xs font-black text-rose-600 dark:text-rose-400 underline underline-offset-4 cursor-pointer"
              >
                Xóa toàn bộ bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCourses.map((course, idx) => {
                const sType = getSourceType(course);
                const isCommunity = sType === "community";
                const isLocked = !isCommunity && course.isPremiumOnly && !isPremium;
                const lessonsCount = course.totalLessons || (idx === 0 ? 12 : idx === 1 ? 7 : 10);
                const videosCount = course.totalVideos !== undefined ? course.totalVideos : (course.courseType === "video_series" ? lessonsCount : 0);
                const durationMins = course.totalDurationMinutes || lessonsCount * 5;
                const completedCount = 0;

                const cardContent = (
                  <div
                    className={`group relative bg-white dark:bg-slate-900 border rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden h-full ${
                      isCommunity
                        ? "border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-emerald-500/5"
                        : "border-slate-200/80 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-rose-500/5"
                    }`}
                  >
                    {/* Background Decorative Gradient */}
                    <div
                      className={`absolute top-0 right-0 w-36 h-36 rounded-bl-full pointer-events-none transition-transform group-hover:scale-125 duration-500 ${
                        isCommunity
                          ? "bg-gradient-to-bl from-emerald-500/10 via-transparent to-transparent"
                          : "bg-gradient-to-bl from-rose-500/10 via-transparent to-transparent"
                      }`}
                    />

                    <div className="space-y-4">
                      {/* Top Thumbnail & Header */}
                      <div className="flex items-start gap-4">
                        <div className="w-24 sm:w-28 h-24 sm:h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 relative group-hover:scale-103 transition-transform duration-300 shadow-xs">
                          <img
                            src={
                              course.thumbnail ||
                              "https://images.unsplash.com/photo-1528164344705-475426879c0d?w=300&auto=format&fit=crop&q=80"
                            }
                            alt={course.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {isLocked ? (
                            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-2xs flex flex-col items-center justify-center text-amber-300 gap-1 p-1 text-center">
                              <Lock size={20} className="text-amber-400 animate-pulse" />
                              <span className="text-[9px] font-black uppercase text-amber-200">Gói PRO</span>
                            </div>
                          ) : (
                            <div className="absolute inset-0 bg-rose-600/0 group-hover:bg-rose-600/20 transition-colors flex items-center justify-center">
                              <div className="w-9 h-9 rounded-full bg-white/95 text-rose-600 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
                                <Play size={16} className="fill-current ml-0.5" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Title and Source Badges */}
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Source Type Badge */}
                            {isCommunity ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-3xs font-extrabold">
                                <Globe size={11} className="text-emerald-500" />
                                Cộng đồng (Free)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-3xs font-extrabold">
                                <Zap size={11} className="text-amber-500" />
                                JTalk Độc quyền
                              </span>
                            )}

                            {/* Lock or Unlocked Badge */}
                            {isLocked ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-3xs font-extrabold rounded-lg border border-amber-200 dark:border-amber-800">
                                <Lock size={10} className="text-amber-600" />
                                PRO ONLY
                              </span>
                            ) : !isCommunity && isPremium ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-3xs font-extrabold rounded-lg border border-emerald-200 dark:border-emerald-800">
                                <Sparkles size={10} className="text-emerald-600" />
                                Đã mở khóa
                              </span>
                            ) : null}
                          </div>

                          <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-1">
                            {formatCourseTitle(course.title)}
                          </h3>

                          {course.channelName && (
                            <div className="flex items-center gap-1.5 text-3xs font-bold text-slate-500 dark:text-slate-400">
                              <Tv size={12} className={isCommunity ? "text-emerald-600" : "text-amber-500"} />
                              <span>{isCommunity ? `Kênh: ${course.channelName}` : course.channelName}</span>
                            </div>
                          )}

                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
                            {course.description ? course.description.replace(/Khóa học/gi, "Chuỗi") : ""}
                          </p>
                        </div>
                      </div>

                      {/* Quick Meta Pills: Duration, Videos, Tags */}
                      <div className="flex items-center gap-2 flex-wrap text-3xs text-slate-500 dark:text-slate-400 font-semibold pt-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80">
                          <Clock size={11} className="text-slate-400" />
                          <span>{durationMins} phút</span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80">
                          <Video size={11} className="text-slate-400" />
                          <span>{videosCount > 0 ? `${videosCount} video` : `${lessonsCount} bài`}</span>
                        </span>
                        {course.tags && course.tags.length > 0 && course.tags.slice(0, 2).map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60 text-3xs font-bold"
                          >
                            #{formatCategoryTag(tag)}
                          </span>
                        ))}
                      </div>

                      {/* Badges / Categories */}
                      {course.category && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {course.category.split("•").map((cat, cIdx) => (
                            <span
                              key={cIdx}
                              className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-3xs font-medium"
                            >
                              {formatCategoryTag(cat)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Progress Bar & Footer Action */}
                    <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center justify-between text-2xs font-extrabold">
                          <span className="text-slate-400">Tiến trình</span>
                          <span className="text-rose-600 dark:text-rose-400 font-bold">
                            {completedCount}/{lessonsCount} bài
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full"
                            style={{
                              width: `${(completedCount / lessonsCount) * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      {isLocked ? (
                        <div className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-black group-hover:bg-amber-100 transition-colors">
                          <Lock size={13} className="text-amber-600" />
                          <span>Mở khóa PRO</span>
                        </div>
                      ) : (
                        <div className="shrink-0 flex items-center gap-1 text-xs font-black text-rose-600 dark:text-rose-400 group-hover:translate-x-1 transition-transform">
                          <span>Vào học</span>
                          <ChevronRight size={15} />
                        </div>
                      )}
                    </div>
                  </div>
                );

                if (isLocked) {
                  return (
                    <div key={course._id} onClick={() => setShowPremiumModal(true)}>
                      {cardContent}
                    </div>
                  );
                }

                return (
                  <Link key={course._id} to={`/courses/${course._id}`} className="block h-full">
                    {cardContent}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        reason="premium_lesson"
      />
    </div>
  );
};

export default CoursePage;
