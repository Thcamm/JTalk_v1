import { useEffect, useState } from "react";
import { Link } from "react-router";
import { curriculumService } from "@/services/curriculum.service";
import { PremiumModal } from "@/components/common/PremiumModal";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import type { Course } from "@/types";
import { Search, Sparkles, CheckCircle2, ChevronRight, Lock } from "lucide-react";

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
      c.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLevel =
      levelFilter === "ALL" || c.level?.toUpperCase() === levelFilter;

    return matchesSearch && matchesLevel;
  });

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Nhập từ khóa để tìm kiếm chủ đề, khóa học..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 self-start sm:self-auto">
            {["ALL", "N5", "N4", "N3"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                type="button"
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  levelFilter === lvl
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {lvl === "ALL" ? "Tất cả" : lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Section 1: Chủ đề của tôi (Matching Image 4) */}
        <div className="space-y-3">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Chủ đề của tôi
          </h2>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 text-center sm:text-left text-xs text-slate-400">
            Bạn chưa tạo chủ đề riêng. Hãy khám phá và luyện tập từ các chủ đề phổ biến bên dưới.
          </div>
        </div>

        {/* Section 2: Chủ đề phổ biến with Badge (Matching Image 4) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Chủ đề phổ biến
            </h2>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-2xs font-bold">
              <CheckCircle2 size={12} className="text-emerald-600" />
              <span>JTalk biên soạn</span>
            </div>
          </div>

          {/* Horizontal Course Cards List (Matching Image 4) */}
          {loading ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner size="lg" label="Đang tải danh mục chủ đề..." />
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl p-6 text-xs text-slate-400">
              Không tìm thấy chủ đề nào phù hợp
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredCourses.map((course, idx) => {
                const isLocked = course.isPremiumOnly && !isPremium;
                const lessonsCount = course.totalLessons || (idx === 0 ? 12 : idx === 1 ? 7 : 10);
                const completedCount = 0;

                const cardContent = (
                  <div className="group bg-white border border-slate-200/90 hover:border-emerald-400 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer">
                    {/* Left: Thumbnail image */}
                    <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                      <div className="w-24 sm:w-32 h-20 sm:h-22 rounded-xl bg-slate-100 overflow-hidden shrink-0 relative group-hover:scale-102 transition-transform">
                        <img
                          src={
                            course.thumbnail ||
                            "https://images.unsplash.com/photo-1528164344705-475426879c0d?w=300&auto=format&fit=crop&q=80"
                          }
                          alt={course.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {isLocked && (
                          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center text-amber-300">
                            <Lock size={18} />
                          </div>
                        )}
                      </div>

                      {/* Center: Title, Description & Badges */}
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                            {course.title}
                          </h3>
                          {course.isPremiumOnly && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 text-3xs font-extrabold rounded-md border border-amber-200">
                              <Sparkles size={10} className="text-amber-500" />
                              PRO
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed">
                          {course.description}
                        </p>

                        {/* Badges Row (like Image 4) */}
                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-3xs font-extrabold uppercase">
                            {course.level || "N5"}
                          </span>

                          <span className="text-3xs text-slate-500 font-semibold">
                            {lessonsCount} bài luyện
                          </span>

                          {course.channelName && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-3xs font-semibold">
                              ▶ {course.channelName}
                            </span>
                          )}

                          {course.category &&
                            course.category.split("•").map((cat, cIdx) => (
                              <span
                                key={cIdx}
                                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-3xs font-medium"
                              >
                                {cat.trim()}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Progress Indicator (like Image 4) */}
                    <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-right space-y-1">
                        <div className="w-24 sm:w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{
                              width: `${(completedCount / lessonsCount) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-3xs text-slate-400 font-semibold block">
                          {completedCount}/{lessonsCount}
                        </span>
                      </div>

                      <ChevronRight
                        size={18}
                        className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all"
                      />
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
                  <Link key={course._id} to={`/courses/${course._id}`} className="block">
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
