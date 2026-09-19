import { useState } from "react";
import { useParams } from "react-router";

import LessonCard from "@/components/speaking/LessonCard";
import LessonIntroModal from "@/components/speaking/LessonIntroModal";

const lessons = [
  {
    id: 1,
    title: "Gặp gỡ và chào hỏi",
    japanese: "あいさつ",
  },
  {
    id: 2,
    title: "Tự giới thiệu",
    japanese: "自己紹介",
  },
  {
    id: 3,
    title: "Giới thiệu người khác",
    japanese: "他人紹介",
  },
  {
    id: 4,
    title: "Tạm biệt",
    japanese: "さようなら",
  },
  {
    id: 5,
    title: "Cái gì? Ở đâu?",
    japanese: "何？どこ？",
  },
  {
    id: 6,
    title: "Khi nào? Ai?",
    japanese: "いつ？だれ？",
  },
];

export default function LessonListPage() {
  const { topicId } = useParams();

  const [selectedLesson, setSelectedLesson] =
    useState<number | null>(null);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold">
        Daily Conversation
      </h1>

      <p className="text-muted-foreground mt-2">
        Topic ID: {topicId}
      </p>

      <div className="mt-8 space-y-4">
        {lessons.map((lesson) => (
          <LessonCard
            key={lesson.id}
            title={lesson.title}
            japanese={lesson.japanese}
            onClick={() =>
              setSelectedLesson(lesson.id)
            }
          />
        ))}
      </div>

      {selectedLesson && (
        <LessonIntroModal
          lessonId={selectedLesson}
          onClose={() =>
            setSelectedLesson(null)
          }
        />
      )}
    </div>
  );
}