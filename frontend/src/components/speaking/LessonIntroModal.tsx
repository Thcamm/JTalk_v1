import {
  X,
  MapPin,
  Users,
  Target,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";

interface Props {
  lessonId: string | number;
  onClose: () => void;
}

export default function LessonIntroModal({
  lessonId,
  onClose,
}: Props) {
  const navigate = useNavigate();

  return (
    <div
      className="
      fixed inset-0
      bg-black/40
      backdrop-blur-sm
      flex
      items-center
      justify-center
      z-50
    "
    >
      <div
        className="
          bg-white dark:bg-slate-900
          border border-slate-200 dark:border-slate-800
          text-slate-900 dark:text-white
          w-full
          max-w-3xl
          rounded-3xl
          p-8
          shadow-xl
        "
      >
        {/* Header */}

        <div className="flex justify-between">
          <div>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold">
              <BookOpen size={18} className="animate-float" />
              <span>Kịch bản hội thoại</span>
            </div>

            <h2 className="mt-3 text-3xl font-bold">
              図書館での勉強相談
            </h2>

            <p className="mt-2 text-muted-foreground">
              Luyện phản xạ giao tiếp trong môi trường học tập
            </p>
          </div>


          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X />
          </button>
        </div>

        {/* Context */}

        <div className="mt-6 space-y-4">

          <div className="rounded-2xl border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/20 p-4">
            <MapPin size={18} className="text-rose-600 dark:text-rose-400" />

            <p className="mt-2 text-muted-foreground">
              Bạn đang học ở thư viện và gặp khó khăn
              với một bài tập tiếng Nhật. Aki ngồi
              cạnh và sẵn sàng giúp bạn giải thích
              vấn đề.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <Users size={18} className="text-amber-500" />

            <p className="font-medium">
              Aki (あき)
            </p>

            <p className="text-muted-foreground">
              AI Japanese Tutor
            </p>
          </div>

          <div className="rounded-2xl border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/20 p-4">
            <Target
              size={18}
              className="text-rose-600 dark:text-rose-400 animate-spin-slow"
            />

            <ul className="mt-3 space-y-2">
              <li className="flex items-center gap-3">
                <CheckCircle2
                  size={18}
                  className="text-rose-500"
                />
                <span>こんにちは</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2
                  size={18}
                  className="text-rose-500"
                />
                <span>手伝ってください</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2
                  size={18}
                  className="text-rose-500"
                />
                <span>ありがとうございます</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Footer */}

        <div className="mt-8 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Đóng
          </Button>

          <Button
            onClick={() =>
              navigate(
                `/speaking/practice/${lessonId}`
              )
            }
            className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:brightness-105 text-white font-bold cursor-pointer"
          >
            Đã hiểu, bắt đầu nào!
          </Button>
        </div>
      </div>
    </div>
  );
}