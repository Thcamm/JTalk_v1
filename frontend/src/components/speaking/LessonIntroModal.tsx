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
  lessonId: number;
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
          bg-white
          w-full
          max-w-3xl
          rounded-3xl
          p-8
        "
      >
        {/* Header */}

        <div className="flex justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary font-medium">
              <BookOpen size={18} />
              <span>Kịch bản hội thoại</span>
            </div>

            <h2 className="mt-3 text-3xl font-bold">
              図書館での勉強相談
            </h2>

            <p className="mt-2 text-muted-foreground">
              Luyện phản xạ giao tiếp trong môi trường học tập
            </p>
          </div>


          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* Context */}

        <div className="mt-6 space-y-4">

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <MapPin size={18} className="text-emerald-600" />

            <p className="mt-2 text-muted-foreground">
              Bạn đang học ở thư viện và gặp khó khăn
              với một bài tập tiếng Nhật. Aki ngồi
              cạnh và sẵn sàng giúp bạn giải thích
              vấn đề.
            </p>
          </div>

          <div className="rounded-2xl border p-4">
            <Users size={18} className="text-primary" />

            <p className="font-medium">
              Aki (あき)
            </p>

            <p className="text-muted-foreground">
              AI Japanese Tutor
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <Target
              size={18}
              className="text-primary"
            />

            <ul className="mt-3 space-y-2">
              <li className="flex items-center gap-3">
                <CheckCircle2
                  size={18}
                  className="text-emerald-500"
                />
                <span>こんにちは</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2
                  size={18}
                  className="text-emerald-500"
                />
                <span>手伝ってください</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2
                  size={18}
                  className="text-emerald-500"
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
          >
            Đã hiểu, bắt đầu nào!
          </Button>
        </div>
      </div>
    </div>
  );
}