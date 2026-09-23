import { useNavigate } from "react-router";
import { BookOpen, FolderGit2 } from "lucide-react";

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
      className="group border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 bg-white dark:bg-slate-900 hover:border-rose-300 dark:hover:border-rose-800 hover:shadow-xl transition-all cursor-pointer space-y-4"
    >
      <div className="flex items-center justify-between">
        <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold">
          {language}
        </span>
      </div>

      <div>
        <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
          {title}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 line-clamp-2">
          {description}
        </p>
      </div>

      <div className="flex justify-between items-center text-xs font-medium text-slate-600 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
        <span className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-rose-500 animate-float" />
          <span>{lessons} bài học</span>
        </span>
        <span className="flex items-center gap-1.5">
          <FolderGit2 className="w-3.5 h-3.5 text-amber-500" />
          <span>{topics} chủ đề</span>
        </span>
      </div>
    </div>
  );
};

export default CourseCard;