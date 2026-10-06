"use client";

import { useEffect } from "react";
import { Link } from "@/lib/react-router-compat";
import { RotateCcw, Home, AlertTriangle } from "lucide-react";

export default function RootGlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Lỗi ứng dụng JTalk:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-5 shadow-lg">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2">
        Đã xảy ra sự cố trên trang
      </h1>

      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
        Hệ thống vừa gặp phải sự cố không mong muốn khi tải dữ liệu. Vui lòng bấm thử lại hoặc quay về Trang chủ.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          type="button"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-md transition-transform hover:scale-103 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Thử tải lại</span>
        </button>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm shadow-xs transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Về Trang chủ</span>
        </Link>
      </div>
    </div>
  );
}
