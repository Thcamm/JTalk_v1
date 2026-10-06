"use client";

import { Link } from "@/lib/react-router-compat";
import { Home, Video, BookOpen, Mic, Sparkles } from "lucide-react";
import { JapaneseMascot } from "@/components/common/JapaneseMascot";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/40 via-rose-50/30 to-slate-50 dark:from-[#0b0f17] dark:via-slate-950 dark:to-[#090d14] flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
      {/* Ambient Cherry Blossom Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 dark:bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full space-y-6">
        {/* Mascot */}
        <div className="flex justify-center transition-transform hover:scale-105 duration-300">
          <JapaneseMascot type="shiba-lost" size={190} />
        </div>

        {/* Bilingual Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-100/80 dark:bg-rose-950/60 border border-rose-300/80 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            404 • ページが見つかりません
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Ô kìa! Bạn bị lạc đường rồi sao?
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            あれ？道に迷っちゃったみたいですね。
            <br />
            Trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển sang đường dẫn khác. Chú cún Shiba sẽ dẫn bạn quay về lộ trình học an toàn nhé!
          </p>
        </div>

        {/* Quick Route Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-sm shadow-lg shadow-rose-500/20 hover:brightness-105 active:scale-95 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Về Bảng điều khiển</span>
          </Link>

          <Link
            to="/courses"
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-bold text-sm shadow-sm hover:border-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
          >
            <Video className="w-4 h-4 text-rose-500" />
            <span>Xem Video Bài giảng</span>
          </Link>

          <Link
            to="/speaking"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <Mic className="w-4 h-4 text-indigo-500" />
            <span>Luyện nói phản xạ AI</span>
          </Link>

          <Link
            to="/vocabulary"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <BookOpen className="w-4 h-4 text-emerald-500" />
            <span>Sổ tay từ vựng & Flashcards</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
