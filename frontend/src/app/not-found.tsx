import { Link } from "@/lib/react-router-compat";
import { Sparkles, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-[#0b0f17] font-sans">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-500 via-rose-600 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-rose-500/20 mb-6 animate-bounce">
        <Sparkles size={40} />
      </div>

      <span className="text-4xl font-black text-rose-600 dark:text-rose-400 tracking-wider">
        404
      </span>
      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
        ページが見つかりません
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md">
        Rất tiếc, trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển sang đường dẫn khác.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 hover:brightness-105 active:scale-98 transition-all"
        >
          <Home size={16} />
          <span>Về Bảng điều khiển</span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all"
        >
          <ArrowLeft size={16} />
          <span>Trang chủ JTalk</span>
        </Link>
      </div>
    </div>
  );
}
