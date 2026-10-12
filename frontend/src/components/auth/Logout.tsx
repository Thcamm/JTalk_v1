"use client";

import { useState } from "react";
import { LogOut, X, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "@/lib/react-router-compat";

const Logout = () => {
  const { signOut } = useAuthStore();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      setShowConfirm(false);
      navigate("/signin");
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        type="button"
        title="Đăng xuất"
        className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 flex items-center justify-center transition-all cursor-pointer"
        aria-label="Đăng xuất"
      >
        <LogOut size={15} />
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4"
            role="dialog"
            aria-modal="true"
          >
            {/* Close icon button */}
            <button
              onClick={() => setShowConfirm(false)}
              type="button"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={15} />
            </button>

            {/* Warning Icon & Heading */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Xác nhận đăng xuất
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Bạn có chắc chắn muốn đăng xuất không?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Phiên học và tiến trình luyện nói của bạn đã được tự động lưu an toàn trên hệ thống.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isLoggingOut}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md shadow-rose-600/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <LogOut size={13} />
                <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Logout;

