import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import TopicSideBar from "@/components/course/TopicSideBar";
import LessonCard from "@/components/course/LessonCard";
import QuizCard from "@/components/course/QuizCard";
import { topics } from "@/data/courses";

export default function LessonListCoursePage() {
  const [selectedTopic, setSelectedTopic] =
    useState(topics[0].id);

  const navigate = useNavigate();

  const { courseId } = useParams();

  const currentTopic =
    topics.find(
      (topic) => topic.id === selectedTopic
    ) || topics[0];

  return (
    <div className="flex gap-8 p-8">

      <TopicSideBar
        topics={topics}
        selectedTopic={selectedTopic}
        onSelect={setSelectedTopic}
      />

      <div className="flex-1">

        <h1 className="text-3xl font-bold mb-6">
          {currentTopic.title}
        </h1>

        <div className="space-y-4">

          {currentTopic.lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              title={lesson.title}
              image={lesson.image}
              duration={lesson.duration}
              onClick={() =>
                navigate(
                  `/courses/${courseId}/lesson/${lesson.id}/speaking`
                )
              }
            />
          ))}

          {currentTopic.quiz && (
            <QuizCard
              questions={
                currentTopic.quiz.questions
              }
              passScore={
                currentTopic.quiz.passScore
              }
            />
          )}

        </div>
      </div>
    </div>
  );
}