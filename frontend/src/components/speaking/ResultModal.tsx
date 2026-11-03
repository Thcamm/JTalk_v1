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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-xl max-h-[92vh] overflow-y-auto relative shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center pt-2 sm:pt-0">
          <h2 className="text-xl sm:text-2xl font-black">Kết quả luyện tập</h2>

          {status === "pending" && (
            <div className="mt-4 sm:mt-6 p-4 sm:p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
              <p className="text-base sm:text-lg font-semibold">Bài luyện tập đã được ghi nhận</p>
              <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 mt-1">
                Đang chờ đánh giá (AI Evaluation is not available yet).
              </p>
            </div>
          )}

          {status === "processing" && (
            <div className="mt-4 sm:mt-6 p-4 sm:p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200">
              <p className="text-base sm:text-lg font-semibold">AI đang phân tích bài nói của bạn...</p>
            </div>
          )}

          {status === "failed" && (
            <div className="mt-4 sm:mt-6 p-4 sm:p-6 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
              <p className="text-base sm:text-lg font-semibold">Xử lý bài luyện tập thất bại</p>
              <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-1">Vui lòng thử lại sau.</p>
            </div>
          )}

          {status === "completed" && (
            <>
              {practice?.score !== undefined ? (
                <div className="flex items-baseline justify-center gap-1.5 mt-3 sm:mt-4 animate-in zoom-in-50 duration-300">
                  <span className="text-5xl sm:text-6xl md:text-7xl font-black text-rose-600 dark:text-rose-400 leading-none">
                    {practice.score}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-slate-400">/ 100</span>
                </div>
              ) : (
                <div className="mt-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium text-sm">
                  Chưa có điểm đánh giá
                </div>
              )}
            </>
          )}
        </div>

        {/* Practice Details */}
        {practice && (
          <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm">
              <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Câu mẫu bài học:
              </span>
              <p className="font-medium text-slate-800 dark:text-slate-200 break-words">{practice.sampleSentence}</p>
            </div>

            {practice.transcript && (
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm">
                <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Văn bản ghi âm (Transcript):
                </span>
                <p className="font-medium text-slate-800 dark:text-slate-200 break-words">{practice.transcript}</p>
              </div>
            )}

            {practice.createdAt && (
              <div className="text-3xs sm:text-xs text-slate-400 dark:text-slate-500 text-right">
                Thời gian tạo: {new Date(practice.createdAt).toLocaleString("vi-VN")}
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 mt-6 sm:mt-8">
          <Button variant="outline" className="w-full sm:flex-1 text-xs sm:text-sm h-10 sm:h-11" onClick={onClose}>
            Đóng
          </Button>

          <Button className="w-full sm:flex-1 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:brightness-105 text-white font-bold text-xs sm:text-sm h-10 sm:h-11 cursor-pointer" onClick={onRetry}>
            Luyện tập lại
          </Button>
        </div>
      </div>
    </div>
  );
}