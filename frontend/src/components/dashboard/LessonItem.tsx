import { Link } from "react-router";
import type { Lesson } from "@/types";
import { Mic, Clock, Lock, Sparkles, ChevronRight, Play } from "lucide-react";
import { Badge } from "@/components/common/Badge";

interface LessonItemProps {
  lesson: Lesson;
  courseId?: string;
  isUserPremium?: boolean;
  onLockClick?: () => void;
  index?: number;
}

export const LessonItem = ({
  lesson,
  courseId,
  isUserPremium = false,
  onLockClick,
  index,
}: LessonItemProps) => {
  const isLocked = lesson.isPremiumOnly && !isUserPremium;
  const isVideoLesson = Boolean(lesson.youtubeId || lesson.videoUrl || courseId);

  const destinationUrl = isVideoLesson
    ? `/courses/${courseId || "video"}/lesson/${lesson._id}`
    : `/practice/${lesson._id}`;

  const content = (
    <div className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-500 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all duration-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Index & Title */}
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        {index !== undefined && (
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-rose-100 dark:group-hover:bg-rose-950/60 group-hover:text-rose-700 dark:group-hover:text-rose-300 transition-colors">
            {index + 1}
          </div>
        )}

        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-sm text-slate-800 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors truncate">
              {lesson.title}
            </h4>
            <Badge variant="secondary" size="sm">
              {lesson.level || "N5"}
            </Badge>
            {lesson.isPremiumOnly && (
              <Badge variant="premium" size="sm" icon={<Sparkles className="w-2.5 h-2.5 animate-spin-slow" />}>
                Premium
              </Badge>
            )}
          </div>

          {lesson.sampleSentence && (
            <p className="text-xs text-slate-600 font-medium truncate font-sans">
              「{lesson.sampleSentence}」
              {lesson.translation && (
                <span className="text-slate-400 font-normal ml-1">
                  - {lesson.translation}
                </span>
              )}
            </p>
          )}

          <div className="flex items-center gap-3 text-2xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lesson.duration || `${lesson.durationMinutes || 5} phút`}
            </span>
            {lesson.dialogues && lesson.dialogues.length > 0 && (
              <span>• {lesson.dialogues.length} câu phản xạ</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="w-full sm:w-auto flex items-center justify-end">
        {isLocked ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              onLockClick?.();
            }}
            type="button"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Mở khóa Premium</span>
          </button>
        ) : (
          <span className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-500 group-hover:brightness-105 text-white rounded-xl text-xs font-bold shadow-2xs group-hover:shadow-xs transition-all">
            {isVideoLesson ? <Play className="w-3.5 h-3.5 fill-current animate-pulse" /> : <Mic className="w-3.5 h-3.5 animate-pulse" />}
            <span>{isVideoLesson ? "Học Video & Shadowing" : "Luyện nói AI"}</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        )}
      </div>
    </div>
  );

  if (isLocked) {
    return <div onClick={onLockClick}>{content}</div>;
  }

  return <Link to={destinationUrl} className="block">{content}</Link>;
};

export default LessonItem;
