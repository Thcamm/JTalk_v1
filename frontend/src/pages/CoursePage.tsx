import { useEffect, useState } from "react";
import { Link } from "react-router";
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
  GraduationCap,
} from "lucide-react";

export const CoursePage = () => {
  const { isPremium } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
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
          // Default initial courses matching Image 4 reference
          setCourses([
            {
              _id: "c-minna-n5",
              title: "Minna no Nihongo I – N5",
              description: "Giáo trình sơ cấp 1: 25 bài, mỗi bài gồm Từ vựng, Ngữ pháp, Hội thoại, Hán tự và Kiểm tra.",
              level: "N5",
              category: "Giao tiếp hằng ngày • Luyện thi",
              thumbnail: "https://images.unsplash.com/photo-1528164344705-475426879c0d?w=400&auto=format&fit=crop&q=80",
              isPublished: true,
              isPremiumOnly: false,
              orderIndex: 1,
            },
            {
              _id: "c-pm-interview",
              title: "Near-line PM interview",
              description: "Khoá học luyện phỏng vấn và trao đổi yêu cầu dự án dành cho Project Manager / Team Leader.",
              level: "N5",
              category: "Công sở • Kinh doanh",
              thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&auto=format&fit=crop&q=80",
              isPublished: true,
              isPremiumOnly: false,
              orderIndex: 2,
            },
            {
              _id: "c-ba-brse",
              title: "BA / BRSE Interview & Kaiwa",
              description: "Luyện đối đáp giao tiếp kỹ thuật và phỏng vấn vị trí Kỹ sư cầu nối BRSE và Business Analyst.",
              level: "N5",
              category: "Kinh doanh • Công sở • Phỏng vấn • Thuyết trình",
              thumbnail: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&auto=format&fit=crop&q=80",
              isPublished: true,
              isPremiumOnly: true,
              orderIndex: 3,
            },
            {
              _id: "c-it-comtor",
              title: "IT COMTOR Interview",
              description: "Khoá học luyện phỏng vấn các câu hỏi xoay quanh nghiệp vụ Thông dịch viên Công nghệ thông tin IT Comtor.",
              level: "N4",
              category: "Phỏng vấn • Công sở IT",
              thumbnail: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop&q=80",
              isPublished: true,
              isPremiumOnly: true,
              orderIndex: 4,
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

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLevel =
      levelFilter === "ALL" ||
      c.level?.toUpperCase() === levelFilter ||
      (levelFilter === "IT" && (c.title.includes("IT") || c.title.includes("PM") || c.title.includes("BRSE")));

    return matchesSearch && matchesLevel;
  });

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-[#0b0f17] p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 1. Header & Bento Hero for Courses */}
        <div className="relative overflow-hidden bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-rose-500/10 dark:from-rose-950/40 dark:via-slate-900/60 dark:to-amber-950/30 border border-rose-200/80 dark:border-rose-800/60 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/90 dark:bg-slate-800/90 border border-rose-200 dark:border-rose-800/80 rounded-full text-2xs font-extrabold text-rose-800 dark:text-rose-300 shadow-2xs">
              <GraduationCap className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 animate-float" />
              <span>Khoá Học Video & Phản Xạ Kaiwa</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Lộ trình bài giảng Kaiwa 5 phút
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Thiết kế dạng micro-learning tối ưu cho sinh viên: Mỗi video bài giảng kéo dài 5 phút, phụ đề phân tích Furigana từng chữ và tích hợp bài tập Shadowing luyện nói ngay tại chỗ.
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

        {/* 2. Top Search & Filter Pills */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm bài học Minna, phỏng vấn IT, BrSE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-full text-xs font-medium dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:focus:border-rose-400 transition-all shadow-2xs placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Level Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 self-start sm:self-auto w-full sm:w-auto no-scrollbar">
            {[
              { id: "ALL", label: "Tất cả" },
              { id: "N5", label: "N5 Sơ cấp" },
              { id: "N4", label: "N4 Trung cấp" },
              { id: "N3", label: "N3 Thượng cấp" },
              { id: "IT", label: "Công sở & IT" },
            ].map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => setLevelFilter(lvl.id)}
                type="button"
                className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                  levelFilter === lvl.id
                    ? "bg-rose-600 dark:bg-rose-500 text-white shadow-rose-600/20"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Section: Chủ đề phổ biến with Verified Badge */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Chủ đề biên soạn chuẩn
              </h2>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-300/80 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-2xs font-extrabold">
                <CheckCircle2 size={12} className="text-rose-600 dark:text-rose-400 animate-bounce" />
                <span>Tokyo Accent</span>
              </div>
            </div>

            <span className="text-xs font-bold text-slate-400">
              {filteredCourses.length} khóa học
            </span>
          </div>

          {/* Bento Course Cards Grid */}
          {loading ? (
            <div className="py-24 flex justify-center">
              <LoadingSpinner size="lg" label="Đang tải danh mục khóa học..." />
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Không tìm thấy khóa học nào phù hợp với bộ lọc
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setLevelFilter("ALL");
                }}
                className="text-xs font-black text-rose-600 dark:text-rose-400 underline underline-offset-4 cursor-pointer"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCourses.map((course, idx) => {
                const isLocked = course.isPremiumOnly && !isPremium;
                const lessonsCount = course.totalLessons || (idx === 0 ? 12 : idx === 1 ? 7 : 10);
                const completedCount = 0;

                const cardContent = (
                  <div className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500 rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-xl hover:shadow-rose-500/5 transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden h-full">
                    {/* Background Decorative Gradient */}
                    <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-rose-500/10 via-transparent to-transparent rounded-bl-full pointer-events-none transition-transform group-hover:scale-125 duration-500" />

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
                            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center text-amber-300">
                              <Lock size={20} />
                            </div>
                          ) : (
                            <div className="absolute inset-0 bg-rose-600/0 group-hover:bg-rose-600/20 transition-colors flex items-center justify-center">
                              <div className="w-9 h-9 rounded-full bg-white/95 text-rose-600 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
                                <Play size={16} className="fill-current ml-0.5" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Title, Level, and Subtitle */}
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-lg bg-rose-600 dark:bg-rose-500 text-white text-3xs font-black uppercase shadow-2xs">
                              {course.level || "N5"}
                            </span>
                            {course.isPremiumOnly && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-3xs font-extrabold rounded-lg border border-amber-200 dark:border-amber-800">
                                <Sparkles size={10} className="text-amber-500 animate-spin-slow" />
                                PRO ONLY
                              </span>
                            )}
                            <span className="text-3xs font-bold text-slate-400">
                              {lessonsCount} bài học
                            </span>
                          </div>

                          <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-1">
                            {course.title}
                          </h3>

                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
                            {course.description}
                          </p>
                        </div>
                      </div>

                      {/* Badges / Categories */}
                      {course.category && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {course.category.split("•").map((cat, cIdx) => (
                            <span
                              key={cIdx}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-3xs font-bold"
                            >
                              {cat.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Progress Bar & Footer */}
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

                      <div className="shrink-0 flex items-center gap-1 text-xs font-black text-rose-600 dark:text-rose-400 group-hover:translate-x-1 transition-transform">
                        <span>Vào học</span>
                        <ChevronRight size={15} />
                      </div>
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
