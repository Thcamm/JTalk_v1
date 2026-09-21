import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { curriculumService } from "@/services/curriculum.service";
import { LessonItem } from "@/components/dashboard/LessonItem";
import { PremiumModal } from "@/components/common/PremiumModal";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Badge } from "@/components/common/Badge";
import { useAuth } from "@/hooks/useAuth";
import type { Course, Topic, Lesson } from "@/types";
import { ArrowLeft, Sparkles, Folder } from "lucide-react";

export const LessonListCoursePage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { isPremium } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // 1. Fetch Course and Topics
  useEffect(() => {
    let isMounted = true;

    const fetchCourseAndTopics = async () => {
      if (!courseId) return;
      try {
        setLoading(true);

        const [courseData, topicList] = await Promise.allSettled([
          curriculumService.getCourseById(courseId),
          curriculumService.getCourseTopics(courseId),
        ]);

        if (isMounted) {
          if (courseData.status === "fulfilled" && courseData.value) {
            setCourse(courseData.value);
          } else {
            setCourse({
              _id: courseId,
              title: "Khóa học đàm thoại Kaiwa",
              description: "Rèn luyện phản xạ giao tiếp tự nhiên với gia sư AI.",
              level: "N5",
              category: "kaiwa",
              isPublished: true,
              isPremiumOnly: false,
              orderIndex: 1,
            });
          }

          let fetchedTopics: Topic[] = [];
          if (topicList.status === "fulfilled" && topicList.value?.length > 0) {
            fetchedTopics = topicList.value;
          } else {
            // Demo topic fallback
            fetchedTopics = [
              {
                _id: "topic-1",
                name: "Chào hỏi & Làm quen lần đầu",
                description: "Các mẫu câu tự giới thiệu bản thân và hỏi thăm thông tin.",
                level: "N5",
                isPublished: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                _id: "topic-2",
                name: "Mua sắm & Ăn uống tại nhà hàng",
                description: "Hỏi giá tiền, thanh toán và gọi món ăn tại Nhật Bản.",
                level: "N5",
                isPublished: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                _id: "topic-3",
                name: "Hỏi đường & Di chuyển tàu điện ngầm",
                description: "Tìm ga tàu, hỏi cách mua vé và chuyển tuyến JR/Metro.",
                level: "N5",
                isPublished: true,
                isPremiumOnly: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ];
          }

          setTopics(fetchedTopics);
          if (fetchedTopics.length > 0) {
            setSelectedTopicId(fetchedTopics[0]._id);
          }
        }
      } catch (err) {
        console.error("Error loading course details:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCourseAndTopics();

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  // 2. Fetch Lessons when selectedTopicId changes
  useEffect(() => {
    let isMounted = true;

    const fetchLessons = async () => {
      if (!selectedTopicId) return;

      try {
        setLoadingLessons(true);
        const data = await curriculumService.getTopicLessons(selectedTopicId);
        if (isMounted) {
          if (data && data.length > 0) {
            setLessons(data);
          } else {
            // Default fallback lessons
            setLessons([
              {
                _id: `${selectedTopicId}-lesson-1`,
                topicId: selectedTopicId,
                title: "Bài 1: Lần đầu gặp gỡ (Hajimemashite)",
                sampleSentence: "はじめまして、ナムと申します。どうぞよろしくお願いします。",
                translation: "Rất vui được gặp bạn, tôi tên là Nam. Mong được giúp đỡ.",
                level: "N5",
                duration: "5 phút",
                isPublished: true,
                isPremiumOnly: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                _id: `${selectedTopicId}-lesson-2`,
                topicId: selectedTopicId,
                title: "Bài 2: Giới thiệu quê quán và nghề nghiệp",
                sampleSentence: "私はベトナムから来ました。エンジニアです。",
                translation: "Tôi đến từ Việt Nam. Tôi là một kỹ sư.",
                level: "N5",
                duration: "7 phút",
                isPublished: true,
                isPremiumOnly: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                _id: `${selectedTopicId}-lesson-3`,
                topicId: selectedTopicId,
                title: "Bài 3: Trò chuyện về sở thích (Shumi)",
                sampleSentence: "私の趣味は音楽を聴くことと旅行です。",
                translation: "Sở thích của tôi là nghe nhạc và đi du lịch.",
                level: "N5",
                duration: "10 phút",
                isPublished: true,
                isPremiumOnly: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ]);
          }
        }
      } catch (err) {
        console.error("Error loading lessons:", err);
      } finally {
        if (isMounted) setLoadingLessons(false);
      }
    };

    fetchLessons();

    return () => {
      isMounted = false;
    };
  }, [selectedTopicId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Đang tải danh sách bài học..." />
      </div>
    );
  }

  const currentTopic = topics.find((t) => t._id === selectedTopicId) || topics[0];

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tất cả khóa học</span>
          </Link>

          {!isPremium && (
            <button
              onClick={() => setShowPremiumModal(true)}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Gói Premium 99k/tháng</span>
            </button>
          )}
        </div>

        {/* Course Banner */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm">
                {course?.level || "N5"}
              </Badge>
              <span className="text-xs text-slate-400 font-medium">Khóa học đàm thoại</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              {course?.title || "Khóa học Kaiwa"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {course?.description || "Chọn chủ đề và bài học để vào phòng luyện phản xạ nói cùng AI."}
            </p>
          </div>
        </div>

        {/* Layout: Topics Sidebar + Lessons List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Topics Navigation Column */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
              Danh sách chủ đề ({topics.length})
            </h3>
            <div className="space-y-2">
              {topics.map((t) => {
                const isSelected = t._id === selectedTopicId;
                const isTopicLocked = t.isPremiumOnly && !isPremium;

                return (
                  <button
                    key={t._id}
                    onClick={() => setSelectedTopicId(t._id)}
                    type="button"
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold shadow-2xs ring-1 ring-emerald-400"
                        : "bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Folder className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm truncate">{t.name}</p>
                        {t.description && (
                          <p className="text-2xs text-slate-400 truncate font-normal">
                            {t.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {isTopicLocked && (
                      <Badge variant="premium" size="sm">
                        Khóa
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lessons List Column */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {currentTopic?.name || "Danh sách bài học"}
                </h3>
                <p className="text-xs text-slate-500">
                  {lessons.length} bài luyện phản xạ giọng nói
                </p>
              </div>
            </div>

            {loadingLessons ? (
              <div className="py-16 flex justify-center">
                <LoadingSpinner size="md" label="Đang tải các bài học..." />
              </div>
            ) : lessons.length === 0 ? (
              <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl p-6">
                <p className="text-sm font-semibold text-slate-600">
                  Chủ đề này chưa có bài học nào
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {lessons.map((lesson, idx) => (
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

export default LessonListCoursePage;
