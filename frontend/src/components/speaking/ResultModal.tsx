import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Practice } from "@/types";

type Props = {
  open: boolean;
  practice: Practice | null;
  onClose: () => void;
  onRetry: () => void;
};

export default function ResultModal({
  open,
  practice,
  onClose,
  onRetry,
}: Props) {
  if (!open) return null;

  const status = practice?.status || "pending";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold">Kết quả luyện tập</h2>

          {status === "pending" && (
            <div className="mt-6 p-6 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800">
              <p className="text-lg font-semibold">Bài luyện tập đã được ghi nhận</p>
              <p className="text-sm text-amber-700 mt-1">
                Đang chờ đánh giá (AI Evaluation is not available yet).
              </p>
            </div>
          )}

          {status === "processing" && (
            <div className="mt-6 p-6 rounded-2xl bg-blue-50 border border-blue-100 text-blue-800">
              <p className="text-lg font-semibold">AI đang phân tích bài nói của bạn...</p>
            </div>
          )}

          {status === "failed" && (
            <div className="mt-6 p-6 rounded-2xl bg-red-50 border border-red-100 text-red-800">
              <p className="text-lg font-semibold">Xử lý bài luyện tập thất bại</p>
              <p className="text-sm text-red-600 mt-1">Vui lòng thử lại sau.</p>
            </div>
          )}

          {status === "completed" && (
            <>
              {practice?.score !== undefined ? (
                <div className="text-8xl font-black text-emerald-500 mt-4">
                  {practice.score}
                </div>
              ) : (
                <div className="mt-4 p-4 rounded-xl bg-muted text-muted-foreground font-medium">
                  Chưa có điểm đánh giá
                </div>
              )}
            </>
          )}
        </div>

        {/* Practice Details */}
        {practice && (
          <div className="mt-6 space-y-4">
            <div className="bg-muted/50 p-4 rounded-2xl border text-sm">
              <span className="font-semibold text-muted-foreground block mb-1">
                Câu mẫu bài học:
              </span>
              <p className="font-medium text-foreground">{practice.sampleSentence}</p>
            </div>

            {practice.transcript && (
              <div className="bg-muted/50 p-4 rounded-2xl border text-sm">
                <span className="font-semibold text-muted-foreground block mb-1">
                  Văn bản ghi âm (Transcript):
                </span>
                <p className="font-medium text-foreground">{practice.transcript}</p>
              </div>
            )}

            {practice.createdAt && (
              <div className="text-xs text-muted-foreground text-right">
                Thời gian tạo: {new Date(practice.createdAt).toLocaleString("vi-VN")}
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 mt-8">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Đóng
          </Button>

          <Button className="flex-1 bg-pink-500 hover:bg-pink-600 text-white" onClick={onRetry}>
            Luyện tập lại
          </Button>
        </div>
      </div>
    </div>
  );
}