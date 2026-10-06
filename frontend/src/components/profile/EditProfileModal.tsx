"use client";

import { useState } from "react";
import { X, User, Target, Clock, Sparkles, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { userService } from "@/services/user.service";
import type { User as UserType } from "@/types";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  onSuccess?: () => void;
}

const JLPT_LEVELS = [
  { level: "N5" as const, name: "N5 Nhập môn", desc: "Phản xạ câu ngắn, chào hỏi cơ bản" },
  { level: "N4" as const, name: "N4 Sơ cấp", desc: "Hội thoại sinh hoạt, nhà hàng, mua sắm" },
  { level: "N3" as const, name: "N3 Trung cấp", desc: "Giao tiếp công sở, HORENSO, đời sống" },
  { level: "N2" as const, name: "N2 Cao cấp", desc: "Phỏng vấn Shinsotsu, đàm phán dự án" },
  { level: "N1" as const, name: "N1 Thành thạo", desc: "Trình độ tiệm cận người bản xứ" },
];

const GOALS = [
  { id: "daily_conversation" as const, label: "Hội thoại đời sống", icon: "💬" },
  { id: "interview" as const, label: "Phỏng vấn xin việc", icon: "💼" },
  { id: "business" as const, label: "Tiếng Nhật công sở", icon: "🏢" },
  { id: "travel" as const, label: "Du lịch & Giao lưu", icon: "✈️" },
];

const TARGET_MINUTES = [15, 30, 45, 60];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [targetLevel, setTargetLevel] = useState<"N5" | "N4" | "N3" | "N2" | "N1">(
    user?.profile?.targetLevel || "N5"
  );
  const [goal, setGoal] = useState<"daily_conversation" | "interview" | "business" | "travel">(
    user?.profile?.goal || "daily_conversation"
  );
  const [dailyTargetMinutes, setDailyTargetMinutes] = useState<number>(
    user?.profile?.dailyTargetMinutes || 15
  );
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Vui lòng nhập tên hiển thị.");
      return;
    }

    try {
      setSubmitting(true);
      await userService.updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        targetLevel,
        goal,
        dailyTargetMinutes,
      });

      toast.success("Cập nhật thông tin hồ sơ thành công!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Cập nhật hồ sơ thất bại";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Chỉnh sửa Hồ sơ Học viên
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cập nhật thông tin cá nhân và lộ trình mục tiêu JLPT
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
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tên hiển thị <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="ví dụ: Nguyễn Minh Nam"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Giới thiệu bản thân (Bio)
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Chia sẻ ngắn về mục tiêu học tiếng Nhật hoặc sở thích của bạn..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 resize-none"
            />
          </div>

          {/* JLPT Target Level */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Target size={14} className="text-rose-500" />
              <span>Mục tiêu trình độ JLPT</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {JLPT_LEVELS.map((lvl) => {
                const isSelected = targetLevel === lvl.level;
                return (
                  <button
                    key={lvl.level}
                    type="button"
                    onClick={() => setTargetLevel(lvl.level)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? "bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-100 shadow-xs ring-1 ring-rose-500"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:border-slate-400"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg font-black text-2xs flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-rose-600 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {lvl.level}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold">{lvl.name}</div>
                      <div className="text-3xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {lvl.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Learning Goal */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Sparkles size={14} className="text-amber-500" />
              <span>Mục đích học chính</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map((g) => {
                const isSelected = goal === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoal(g.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? "bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-900 dark:text-amber-100 ring-1 ring-amber-500"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                    }`}
                  >
                    <span className="text-base">{g.icon}</span>
                    <span className="text-xs font-bold truncate">{g.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Target Minutes */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Clock size={14} className="text-indigo-500" />
              <span>Thời gian luyện phản xạ mỗi ngày</span>
            </label>
            <div className="flex items-center gap-2">
              {TARGET_MINUTES.map((m) => {
                const isSelected = dailyTargetMinutes === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDailyTargetMinutes(m)}
                    className={`flex-1 py-2 px-3 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                    }`}
                  >
                    {m} phút
                  </button>
                );
              })}
            </div>
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
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:brightness-105 text-white text-xs font-black shadow-md shadow-rose-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Lưu Hồ Sơ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
