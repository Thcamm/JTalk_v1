"use client";

import { Link } from "@/lib/react-router-compat";
import type { Lesson } from "@/types";
import { Mic, Clock, Lock, Sparkles, ChevronRight, Play, Video, Tv } from "lucide-react";
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
  const isVideoLesson = Boolean(lesson.youtubeId || lesson.videoUrl || lesson.lessonType === "video");
  const epNum = lesson.episodeNumber || (lesson.orderIndex ? lesson.orderIndex : index !== undefined ? index + 1 : 1);

  const destinationUrl = isVideoLesson
    ? `/courses/${courseId || "video"}/lesson/${lesson._id}`
    : `/practice/${lesson._id}`;

  const content = (
    <div className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-500 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all duration-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Index & Title */}
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        {/* Episode or Video Thumbnail Preview */}
        {lesson.youtubeId ? (
          <div className="relative w-16 sm:w-20 h-10 sm:h-12 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200/80 dark:border-slate-800 shadow-2xs group-hover:scale-103 transition-transform">
            <img
              src={`https://img.youtube.com/vi/${lesson.youtubeId}/mqdefault.jpg`}
              alt={lesson.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-xs">
                <Play size={10} className="fill-current ml-0.5" />
              </div>
            </div>
            <div className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/75 text-[9px] font-mono text-white font-bold">
              #{epNum}
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-xs flex flex-col items-center justify-center shrink-0 mt-0.5 group-hover:bg-rose-100 dark:group-hover:bg-rose-950/60 group-hover:text-rose-700 dark:group-hover:text-rose-300 transition-colors">
            <span className="text-[9px] uppercase text-slate-400 font-semibold leading-none">Tập</span>
            <span className="text-sm font-black leading-none mt-0.5">{epNum}</span>
          </div>
        )}

        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-sm text-slate-800 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors truncate">
              {lesson.title}
            </h4>
            {lesson.lessonType === "video" && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/70 border border-rose-200/80 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-3xs font-extrabold">
                <Video size={10} />
                Video
              </span>
            )}
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

          <div className="flex items-center gap-3 text-2xs text-slate-400 flex-wrap">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3" />
              {lesson.duration || `${lesson.durationMinutes || 5} phút`}
            </span>
            {lesson.channelName && (
              <span className="flex items-center gap-1 font-bold text-slate-500 dark:text-slate-400">
                <Tv className="w-3 h-3 text-rose-500" />
                {lesson.channelName}
              </span>
            )}
            {lesson.subtitles && lesson.subtitles.length > 0 && (
              <span>• {lesson.subtitles.length} câu phụ đề</span>
            )}
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
