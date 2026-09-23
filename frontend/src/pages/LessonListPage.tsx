import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, BookOpen } from "lucide-react";

import { lessonService } from "@/services/lesson.service";
import { topicService } from "@/services/topic.service";
import { LessonItem } from "@/components/dashboard/LessonItem";
import { PremiumModal } from "@/components/common/PremiumModal";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import type { Lesson, Topic } from "@/types";

export default function LessonListPage() {
  const { topicId } = useParams<{ topicId?: string }>();
  const { isPremium } = useAuth();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        if (topicId) {
          const [topicData, lessonsData] = await Promise.allSettled([
            topicService.getTopicById(topicId),
            lessonService.getLessons(topicId),
          ]);

          if (isMounted) {
            if (topicData.status === "fulfilled" && topicData.value) {
              setTopic(topicData.value);
            }
            if (lessonsData.status === "fulfilled" && lessonsData.value && lessonsData.value.length > 0) {
              setLessons(lessonsData.value);
            } else {
              // Fallback demo lessons
              setLessons([
                {
                  _id: "demo-l1",
                  topicId: topicId || "demo-t1",
                  title: "Lần đầu gặp gỡ & Chào hỏi",
                  sampleSentence: "はじめまして、どうぞよろしくおねがいします。",
                  translation: "Rất vui được gặp bạn, mong bạn giúp đỡ.",
                  level: "N5",
                  duration: "3 phút",
                  isPremiumOnly: false,
                  isPublished: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  dialogues: [
                    {
                      order: 1,
                      speaker: "ai",
                      japanese: "はじめまして、どうぞよろしくおねがいします。",
                      romaji: "Hajimemashite, douzo yoroshiku onegaishimasu.",
                      translation: "Rất vui được gặp bạn, mong bạn giúp đỡ.",
                    },
                  ],
                },
                {
                  _id: "demo-l2",
                  topicId: topicId || "demo-t1",
                  title: "Hỏi thăm quê quán & Nghề nghiệp",
                  sampleSentence: "お仕事は何をされていますか？",
                  translation: "Hiện tại bạn đang làm công việc gì thế ạ?",
                  level: "N5",
                  duration: "4 phút",
                  isPremiumOnly: false,
                  isPublished: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  dialogues: [
                    {
                      order: 1,
                      speaker: "ai",
                      japanese: "お仕事は何をされていますか？",
                      romaji: "Oshigoto wa nani o sarete imasu ka?",
                      translation: "Hiện tại bạn đang làm công việc gì thế ạ?",
                    },
                  ],
                },
                {
                  _id: "demo-l3",
                  topicId: topicId || "demo-t1",
                  title: "Trao đổi danh thiếp kinh doanh (Business Meishi)",
                  sampleSentence: "お名刺をちょうだいいたします。",
                  translation: "Tôi xin phép được nhận danh thiếp của quý khách.",
                  level: "N4",
                  duration: "5 phút",
                  isPremiumOnly: true,
                  isPublished: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  dialogues: [
                    {
                      order: 1,
                      speaker: "ai",
                      japanese: "お名刺をちょうだいいたします。",
                      romaji: "Omeishi o choudai itashimasu.",
                      translation: "Tôi xin phép được nhận danh thiếp của quý khách.",
                    },
                  ],
                },
              ]);
            }
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải bài học chủ đề:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [topicId]);

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-[#0b0f17] p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div>
          <Link
            to="/speaking"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại phòng Luyện nói AI</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-2xs font-bold uppercase tracking-wider mb-2">
                <BookOpen className="w-3 h-3 animate-float" />
                <span>Chủ đề Kaiwa</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {topic?.name || "Danh sách bài luyện phản xạ"}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {topic?.description || "Chọn bài học để vào phòng luyện nói và chấm điểm 4 tiêu chí cùng AI"}
              </p>
            </div>
          </div>
        </div>

        {/* Lessons List */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" label="Đang tải các bài học..." />
          </div>
        ) : (
          <div className="space-y-3.5">
            {lessons.map((lesson, idx) => (
              <LessonItem
                key={lesson._id}
                lesson={lesson}
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
}
