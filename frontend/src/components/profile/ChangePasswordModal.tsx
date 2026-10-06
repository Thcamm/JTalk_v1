"use client";

import { useState } from "react";
import { X, Lock, Eye, EyeOff, ShieldCheck, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { userService } from "@/services/user.service";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  // Password strength calculation
  const getStrength = (pwd: string) => {
    if (!pwd) return { level: 0, text: "", color: "bg-slate-200" };
    if (pwd.length < 6) return { level: 1, text: "Yếu (tối thiểu 6 ký tự)", color: "bg-rose-500" };
    let score = 1;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 2) return { level: 2, text: "Trung bình", color: "bg-amber-500" };
    return { level: 3, text: "Mạnh và an toàn", color: "bg-emerald-500" };
  };

  const strength = getStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
      return;
    }

    try {
      setSubmitting(true);
      await userService.changePassword({
        currentPassword,
        newPassword,
      });

      toast.success("Đổi mật khẩu thành công! Tài khoản của bạn đã được bảo vệ an toàn.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Đổi mật khẩu thất bại";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Đổi Mật Khẩu
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bảo vệ tài khoản và thông tin học tập của bạn
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Mật khẩu hiện tại <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu đang dùng..."
                className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự..."
                className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Strength meter */}
            {newPassword && (
              <div className="space-y-1 pt-1">
                <div className="flex items-center gap-1.5 h-1.5 w-full">
                  <div
                    className={`h-full flex-1 rounded-full ${
                      strength.level >= 1 ? strength.color : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  />
                  <div
                    className={`h-full flex-1 rounded-full ${
                      strength.level >= 2 ? strength.color : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  />
                  <div
                    className={`h-full flex-1 rounded-full ${
                      strength.level >= 3 ? strength.color : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between text-3xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>Độ mạnh: {strength.text}</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới..."
                className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-3xs text-rose-500 font-semibold">
                Mật khẩu xác nhận chưa khớp với mật khẩu mới.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:brightness-105 text-white text-xs font-black shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={14} />
                  <span>Cập Nhật Mật Khẩu</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
