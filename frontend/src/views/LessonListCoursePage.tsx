"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "@/lib/react-router-compat";
import { curriculumService } from "@/services/curriculum.service";
import { LessonItem } from "@/components/dashboard/LessonItem";
import { PremiumModal } from "@/components/common/PremiumModal";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Badge } from "@/components/common/Badge";
import { useAuth } from "@/hooks/useAuth";
import type { Course, Topic, Lesson } from "@/types";
import {
  ArrowLeft,
  Sparkles,
  Play,
  Clock,
  Video,
  Tv,
  Search,
  BookOpen,
  CheckCircle2,
  ListFilter,
  Globe,
  Zap,
  ExternalLink,
} from "lucide-react";

export const LessonListCoursePage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { isPremium } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchCourseData = async () => {
      if (!courseId) return;
      try {
        setLoading(true);

        const [courseData, topicList, lessonList] = await Promise.allSettled([
          curriculumService.getCourseById(courseId),
          curriculumService.getCourseTopics(courseId),
          curriculumService.getCourseLessons(courseId),
        ]);

        if (isMounted) {
          // 1. Course Data
          if (courseData.status === "fulfilled" && courseData.value) {
            setCourse(courseData.value);
          } else {
            setCourse({
              _id: courseId,
              title: "Chủ đề đàm thoại giao tiếp",
              description: "Rèn luyện phản xạ giao tiếp tự nhiên với gia sư AI và video bài giảng.",
              level: "N5",
              category: "Giao tiếp",
              courseType: "video_series",
              isPublished: true,
              isPremiumOnly: false,
              orderIndex: 1,
            });
          }

          // 2. Topics Data
          let fetchedTopics: Topic[] = [];
          if (topicList.status === "fulfilled" && topicList.value?.length > 0) {
            fetchedTopics = topicList.value;
          }
          setTopics(fetchedTopics);

          // 3. Lessons Data
          if (lessonList.status === "fulfilled" && Array.isArray(lessonList.value)) {
            setAllLessons(lessonList.value);
          } else {
            setAllLessons([]);
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải thông tin khóa học:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCourseData();

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  // Filter lessons based on selected topic and search query
  const filteredLessons = useMemo(() => {
    return allLessons.filter((lesson) => {
      // Topic match
      let matchesTopic = true;
      if (selectedTopicId !== "ALL") {
        const rawTopicId =
          typeof lesson.topicId === "object" && lesson.topicId
            ? (lesson.topicId as any)._id
            : (lesson.topicId as string);
        matchesTopic = rawTopicId === selectedTopicId;
      }

      // Search match
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        matchesSearch =
          lesson.title.toLowerCase().includes(q) ||
          (lesson.sampleSentence && lesson.sampleSentence.toLowerCase().includes(q)) ||
          (lesson.translation && lesson.translation.toLowerCase().includes(q));
      }

      return matchesTopic && matchesSearch;
    });
  }, [allLessons, selectedTopicId, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60 dark:bg-[#0b0f17] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Đang tải danh sách bài học và video..." />
      </div>
    );
  }

  const firstLesson = allLessons.length > 0 ? allLessons[0] : null;
  const totalMins = course?.totalDurationMinutes || allLessons.reduce((acc, l) => acc + (l.durationMinutes || 5), 0);
  const totalVideos = course?.totalVideos || allLessons.filter((l) => l.youtubeId || l.videoUrl || l.lessonType === "video").length;

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-[#0b0f17] p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation & Header Actions */}
        <div className="flex items-center justify-between">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Thư viện Video</span>
          </Link>

          {!isPremium && (
            <button
              onClick={() => setShowPremiumModal(true)}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
              <span>Nâng cấp Pro 99k/tháng</span>
            </button>
          )}
        </div>

        {/* Enhanced Course Banner with Playlist Info */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            {/* Badges Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              {course?.sourceType === "jtalk" || course?.channelName?.toLowerCase().includes("jtalk") ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-3xs font-extrabold">
                  <Zap size={11} className="text-amber-500" />
                  JTalk Độc quyền
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-3xs font-extrabold">
                  <Globe size={11} className="text-emerald-500" />
                  Video Cộng đồng (Free)
                </span>
              )}

              {course?.channelName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-3xs font-bold">
                  <Tv size={11} className="text-rose-500" />
                  Kênh: {course.channelName}
                </span>
              )}

              {course?.channelUrl && (
                <a
                  href={course.channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:underline text-3xs font-bold"
                  title="Ghé thăm kênh YouTube gốc"
                >
                  <span>Kênh gốc</span>
                  <ExternalLink size={10} />
                </a>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {course?.title
                ? course.title
                    .replace(/\s*\([^)]*\)/g, "")
                    .replace(/Kaiwa/gi, "Giao tiếp")
                    .replace(/Beginner/gi, "Nhập môn")
                    .replace(/Intermediate/gi, "Trung cấp")
                    .replace(/Business Japanese/gi, "Tiếng Nhật Doanh nghiệp")
                : "Chủ đề Video Giao tiếp"}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {course?.description
                ? course.description.replace(/Khóa học/gi, "Chuỗi").replace(/Shadowing/gi, "phản xạ")
                : "Kho bài giảng và video thực chiến. Học viên vừa xem video, vừa luyện nhại giọng với độ chính xác cao."}
            </p>

            {/* Source Copyright Notice */}
            {course?.sourceType === "jtalk" || course?.channelName?.toLowerCase().includes("jtalk") ? (
              <p className="text-3xs text-amber-700 dark:text-amber-400 font-semibold pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                <Zap size={11} />
                <span>Nội dung được biên soạn độc quyền bởi JTalk AI Studio kết hợp chấm phát âm và luyện phản xạ tương tác.</span>
              </p>
            ) : (
              <p className="text-3xs text-slate-500 dark:text-slate-400 font-medium pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                <Globe size={11} className="text-emerald-600 shrink-0" />
                <span>Video được nhúng trực tiếp qua YouTube Player từ kênh tác giả nhằm mục đích hỗ trợ học tập phi thương mại. Mọi quyền sở hữu thuộc về chủ kênh.</span>
              </p>
            )}

            {/* Quick Stats: Duration, Total Lessons, Videos */}
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 pt-1">
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} className="text-rose-500" />
                <span>Tổng {totalMins} phút</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Video size={14} className="text-rose-500" />
                <span>{totalVideos > 0 ? `${totalVideos} video bài giảng` : `${allLessons.length} bài học`}</span>
              </span>
              {topics.length > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen size={14} className="text-rose-500" />
                  <span>{topics.length} chương / chủ đề</span>
                </span>
              )}
            </div>
          </div>

          {/* Quick Play First Lesson Action Button */}
          {firstLesson && (
            <div className="shrink-0 w-full sm:w-auto">
              <Link
                to={`/courses/${courseId}/lesson/${firstLesson._id}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:brightness-105 active:translate-y-0.5 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg hover:shadow-rose-500/20 transition-all"
              >
                <Play size={15} className="fill-current ml-0.5" />
                <span>Bắt đầu học ngay (Tập 1)</span>
              </Link>
            </div>
          )}
        </div>

        {/* Filter Controls: Search & Topic Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {/* Chapter / Topic Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedTopicId("ALL")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                selectedTopicId === "ALL"
                  ? "bg-rose-600 dark:bg-rose-500 text-white shadow-rose-600/20"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Tất cả video ({allLessons.length})
            </button>

            {topics.map((t) => {
              const isSelected = selectedTopicId === t._id;
              const count = allLessons.filter((l) => {
                const rawTopicId =
                  typeof l.topicId === "object" && l.topicId ? (l.topicId as any)._id : (l.topicId as string);
                return rawTopicId === t._id;
              }).length;

              return (
                <button
                  key={t._id}
                  type="button"
                  onClick={() => setSelectedTopicId(t._id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                    isSelected
                      ? "bg-rose-600 dark:bg-rose-500 text-white shadow-rose-600/20"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {t.name} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>

          {/* Search in Course */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm video, mẫu câu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-medium dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-2xs placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Video Playlist Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <ListFilter size={16} className="text-rose-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Danh sách video bài học ({filteredLessons.length})
            </h3>
          </div>

          <span className="text-xs font-semibold text-slate-400">
            {course?.courseType === "video_series" ? "Chuỗi bài giảng YouTube liên tục" : "Kịch bản giao tiếp tương tác"}
          </span>
        </div>

        {/* Lessons / Videos List */}
        {filteredLessons.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-3">
            <Video className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Không tìm thấy video bài giảng nào phù hợp
            </p>
            <button
              onClick={() => {
                setSelectedTopicId("ALL");
                setSearchQuery("");
              }}
              className="text-xs font-black text-rose-600 dark:text-rose-400 underline underline-offset-4 cursor-pointer"
            >
              Hiển thị lại toàn bộ video
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLessons.map((lesson, idx) => (
              <LessonItem
                key={lesson._id}
                lesson={lesson}
                courseId={courseId}
                index={idx}
                isUserPremium={isPremium}
                onLockClick={() => setShowPremiumModal(true)}
              />
            ))}
          </div>
        )}
      </div>

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        reason="premium_lesson"
      />
    </div>
  );
};

export default LessonListCoursePage;
