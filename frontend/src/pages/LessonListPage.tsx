import { useEffect, useState } from "react";
import { useParams } from "react-router";

import LessonCard from "@/components/speaking/LessonCard";
import LessonIntroModal from "@/components/speaking/LessonIntroModal";
import { lessonService } from "@/services/lesson.service";
import type { Lesson } from "@/types";

const fallbackLessons = [
  {
    _id: "1",
    title: "Gặp gỡ và chào hỏi",
    sampleSentence: "こんにちは",
    translation: "Xin chào",
  },
  {
    _id: "2",
    title: "Tự giới thiệu",
    sampleSentence: "はじめまして、わたしはマリアです。",
    translation: "Rất vui được gặp bạn, tôi là Maria.",
  },
];

export default function LessonListPage() {
  const { topicId } = useParams<{ topicId?: string }>();
  const [lessons, setLessons] = useState<Array<{ id: string; title: string; japanese: string }>>([]);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setLoading(true);
        const data: Lesson[] = await lessonService.getLessons(topicId);

        if (data && data.length > 0) {
          setLessons(
            data.map((l) => ({
              id: l._id,
              title: l.title,
              japanese: l.sampleSentence,
            }))
          );
        } else {
          setLessons(
            fallbackLessons.map((l) => ({
              id: l._id,
              title: l.title,
              japanese: l.sampleSentence,
            }))
          );
        }
      } catch (err) {
        console.error("Lỗi khi tải bài học:", err);
        setLessons(
          fallbackLessons.map((l) => ({
            id: l._id,
            title: l.title,
            japanese: l.sampleSentence,
          }))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, [topicId]);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold">Danh sách bài học (Daily Conversation)</h1>

      <p className="text-muted-foreground mt-2">Topic ID: {topicId}</p>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Đang tải danh sách bài học...</div>
      ) : (
        <div className="mt-8 space-y-4">
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              title={lesson.title}
              japanese={lesson.japanese}
              onClick={() => setSelectedLesson(lesson.id)}
            />
          ))}
        </div>
      )}

      {selectedLesson && (
        <LessonIntroModal
          lessonId={selectedLesson}
          onClose={() => setSelectedLesson(null)}
        />
      )}
    </div>
  );
}