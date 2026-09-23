import { Link } from "react-router";
import type { Course } from "@/types";
import { Lock, BookOpen, ChevronRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/common/Badge";

interface CourseCardProps {
  course: Course;
  isUserPremium?: boolean;
  onLockClick?: () => void;
}

export const CourseCard = ({
  course,
  isUserPremium = false,
  onLockClick,
}: CourseCardProps) => {
  const isLocked = course.isPremiumOnly && !isUserPremium;

  const getLevelColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case "N5":
        return "success";
      case "N4":
        return "primary";
      case "N3":
        return "warning";
      default:
        return "secondary";
    }
  };

  const cardContent = (
    <div className="group relative bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500 rounded-3xl p-5 shadow-xs hover:shadow-md hover:shadow-rose-500/5 transition-all duration-200 flex flex-col justify-between h-full overflow-hidden">
      {/* Top badges */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge variant={getLevelColor(course.level)} size="sm">
            {course.level || "N5"}
          </Badge>
          {course.isPremiumOnly ? (
            <Badge variant="premium" size="sm" icon={<Sparkles className="w-3 h-3 text-amber-300 animate-spin-slow" />}>
              Premium
            </Badge>
          ) : (
            <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Miễn phí
            </span>
          )}
        </div>

        {/* Thumbnail or Art */}
        <div className="w-full h-32 rounded-2xl bg-gradient-to-tr from-rose-100/60 via-amber-50/40 to-rose-50/60 dark:from-rose-950/40 dark:via-slate-800 dark:to-amber-950/30 flex items-center justify-center mb-4 overflow-hidden relative group-hover:scale-[1.02] transition-transform">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-3">
              <span className="text-3xl font-black text-rose-600/70 dark:text-rose-400/70 tracking-tight block">
                日本語
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium capitalize">
                {course.category || "Giao tiếp phản xạ"}
              </span>
            </div>
          )}

          {isLocked && (
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/95 dark:bg-slate-800 text-slate-800 dark:text-white flex items-center justify-center shadow-lg">
                <Lock className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          )}
        </div>

        {/* Title and Description */}
        <h3 className="font-bold text-base text-slate-800 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-1">
          {course.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
          {course.description || "Khóa học rèn luyện phản xạ phát âm và giao tiếp tự nhiên với AI."}
        </p>
      </div>

      {/* Footer link */}
      <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400">
        <span className="flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Vào học</span>
        </span>
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );

  if (isLocked && onLockClick) {
    return (
      <div onClick={onLockClick} className="cursor-pointer">
        {cardContent}
      </div>
    );
  }

  return <Link to={`/courses/${course._id}`}>{cardContent}</Link>;
};

export default CourseCard;
