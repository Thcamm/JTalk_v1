"use client";

import { useEffect } from "react";
import { Link } from "@/lib/react-router-compat";
import { RotateCcw, ArrowLeft, Tv, AlertCircle } from "lucide-react";

export default function LessonVideoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Lỗi tải trang học video:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center mb-5 shadow-xl">
        <Tv className="w-8 h-8" />
      </div>

      <h1 className="text-xl sm:text-2xl font-black text-white mb-2">
        Không thể tải phòng học video
      </h1>

      <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
        Đã có sự cố khi kết nối dữ liệu video hoặc phụ đề bài học. Bạn có thể bấm thử lại hoặc quay lại danh sách bài học.
      </p>

      {error?.message && (
        <div className="mb-6 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-3xs text-slate-500 font-mono max-w-md truncate flex items-center gap-2">
          <AlertCircle size={12} className="text-rose-500 shrink-0" />
          <span className="truncate">{error.message}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          type="button"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-lg transition-transform hover:scale-103 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Thử tải lại</span>
        </button>

        <Link
          to="/courses"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs sm:text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Thư viện Video</span>
        </Link>
      </div>
    </div>
  );
}
