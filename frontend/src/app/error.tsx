"use client";

import { useEffect } from "react";
import { Link } from "@/lib/react-router-compat";
import { RotateCcw, Home, Sparkles, HelpCircle } from "lucide-react";
import { JapaneseMascot } from "@/components/common/JapaneseMascot";

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
    <div className="min-h-screen bg-gradient-to-b from-rose-50/40 via-slate-50 to-slate-100 dark:from-[#0b0f17] dark:via-slate-950 dark:to-[#090d14] text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
      {/* Background Soft Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 dark:bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full space-y-6">
        {/* Maneki Neko Repair Mascot */}
        <div className="flex justify-center transition-transform hover:scale-105 duration-300">
          <JapaneseMascot type="cat-repair" size={190} />
        </div>

        {/* Bilingual Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-100/80 dark:bg-rose-950/60 border border-rose-300/80 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            申し訳ございません • Xin thứ lỗi
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Đã xảy ra sự cố trên trang
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed font-medium">
            システムエラーが発生しました。
            <br />
            Hệ thống vừa gặp phải sự cố không mong muốn khi xử lý dữ liệu. Chú mèo Maneki Neko đang khẩn trương khắc phục để bạn tiếp tục bài học!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            type="button"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:brightness-105 text-white font-bold text-sm shadow-lg shadow-rose-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Thử tải lại trang</span>
          </button>

          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm shadow-sm transition-all active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Về Bảng điều khiển</span>
          </Link>
        </div>

        <p className="text-[11px] text-slate-400">
          Mã lỗi: {error.digest || "ERR_PAGE_LOAD"} • Đội ngũ kỹ thuật JTalk đã ghi nhận log sự cố
        </p>
      </div>
    </div>
  );
}
