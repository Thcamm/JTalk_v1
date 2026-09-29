"use client";

import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/lib/react-router-compat";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { accessToken, user, fetchMe, refresh } = useAuthStore();
  const [starting, setStarting] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const state = useAuthStore.getState();
      if (!state.accessToken || !state.user) {
        try {
          await refresh();
          await fetchMe();
        } catch {
          // session unavailable
        }
      }
      if (isMounted) {
        setStarting(false);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [refresh, fetchMe]);

  useEffect(() => {
    if (!starting && !accessToken) {
      router.replace("/signin?redirect=/admin");
    }
  }, [starting, accessToken, router]);

  if (starting) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-white">
        <LoadingSpinner size="lg" label="Đang xác thực quyền Quản trị viên..." />
      </div>
    );
  }

  if (!accessToken) {
    return null;
  }

  // If user is authenticated but not an admin -> 403 Forbidden screen
  if (user && user.role !== "admin") {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 p-4 text-white">
        <div className="max-w-md w-full rounded-3xl border border-rose-900/60 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-950 text-rose-500 border border-rose-800">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
            Không có quyền truy cập
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            Khu vực này chỉ dành riêng cho Quản trị viên của <strong className="text-rose-400">JTalk AI</strong>. Tài khoản của bạn (<span className="text-slate-300 font-mono">{user.email}</span>) hiện có vai trò là <span className="font-bold text-amber-400">Học viên</span>.
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              to="/dashboard"
              className="flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-xs sm:text-sm font-bold text-white hover:bg-rose-500 transition-colors shadow-md shadow-rose-600/20"
            >
              <Home size={16} />
              <span>Về Trang học viên</span>
            </Link>
            <button
              onClick={() => router.back()}
              type="button"
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 px-5 py-3 text-xs sm:text-sm font-bold text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Quay lại trang trước</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
