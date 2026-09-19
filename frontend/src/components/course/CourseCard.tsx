import { useNavigate } from "react-router";

type Props = {
  id: number;
  title: string;
  description: string;
  language: string;
  lessons: number;
  topics: number;
};

const CourseCard = ({
  id,
  title,
  description,
  language,
  lessons,
  topics,
}: Props) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/courses/${id}`)}
      className="
        border
        rounded-2xl
        p-5
        bg-card
        hover:shadow-lg
        transition
        cursor-pointer
      "
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="
            px-3
            py-1
            rounded-full
            bg-primary/10
            text-primary
            text-xs
            font-medium
          "
        >
          {language}
        </span>
      </div>

      <h3 className="font-bold text-lg mb-2">
        {title}
      </h3>

      <p className="text-muted-foreground text-sm mb-5">
        {description}
      </p>

      <div className="flex justify-between text-sm">
        <span>📚 {lessons} bài học</span>
        <span>🗂️ {topics} chủ đề</span>
      </div>
    </div>
  );
};

export default CourseCard;