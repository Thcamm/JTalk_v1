"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Trophy,
  Target,
  Briefcase,
  Compass,
  Tv,
  GraduationCap,
  Clock3,
  Award,
} from "lucide-react";
import { userService } from "@/services/user.service";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/useAuthStore";
import { soundEffects } from "@/utils/soundEffects";
import { Confetti } from "@/components/common/Confetti";
import { toast } from "sonner";
import { Link } from "@/lib/react-router-compat";

interface OnboardingQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

const GOAL_OPTIONS = [
  {
    id: "daily_conversation",
    icon: <Compass className="w-5 h-5 text-emerald-500" />,
    title: "Hội thoại & Đời sống",
    desc: "Mua sắm, ăn uống, hỏi đường, giao tiếp hàng ngày tự tin khi sang Nhật",
    badge: "Phổ biến",
  },
  {
    id: "interview",
    icon: <Briefcase className="w-5 h-5 text-indigo-500" />,
    title: "Công việc & Phỏng vấn",
    desc: "Đi làm công ty Nhật, IT, thông dịch, thương mại và phỏng vấn xin việc",
    badge: "Thực tế",
  },
  {
    id: "business",
    icon: <GraduationCap className="w-5 h-5 text-amber-500" />,
    title: "Tiếng Nhật công sở",
    desc: "Giao tiếp đồng nghiệp, đối tác và tác phong làm việc chuẩn phong cách Nhật",
    badge: "Chuyên sâu",
  },
  {
    id: "travel",
    icon: <Tv className="w-5 h-5 text-pink-500" />,
    title: "Du lịch & Giao lưu văn hóa",
    desc: "Xem anime, du lịch khám phá Nhật Bản và kết bạn giao tiếp tự nhiên",
    badge: "Yêu thích",
  },
];

const LEVEL_OPTIONS = [
  {
    id: "N5",
    level: "N5",
    title: "Mới bắt đầu (Beginner)",
    desc: "Chưa biết gì hoặc mới thuộc bảng chữ cái Hiragana/Katakana",
    badge: "Khuyên dùng",
  },
  {
    id: "N4",
    level: "N4",
    title: "Sơ cấp (Elementary)",
    desc: "Có thể nói câu ngắn, chào hỏi đơn giản và hiểu từ vựng cơ bản",
    badge: "Cơ bản",
  },
  {
    id: "N3",
    level: "N3",
    title: "Trung cấp (Intermediate)",
    desc: "Giao tiếp đời thường ổn định, muốn nâng cao tốc độ phản xạ tự nhiên",
    badge: "Tăng tốc",
  },
  {
    id: "N2",
    level: "N2",
    title: "Nâng cao (Upper Intermediate)",
    desc: "Tự tin thảo luận chủ đề đa dạng, chuẩn bị cho môi trường làm việc",
    badge: "Chuyên sâu",
  },
];

const DURATION_OPTIONS = [
  {
    minutes: 5,
    title: "5 phút / ngày",
    desc: "Nhẹ nhàng, thư giãn và duy trì ngọn lửa Streak bền bỉ",
    badge: "Dễ duy trì",
  },
  {
    minutes: 10,
    title: "10 phút / ngày",
    desc: "Mức độ tiêu chuẩn đề xuất của JTalk cho hiệu quả tối ưu",
    badge: "Đề xuất ⭐",
  },
  {
    minutes: 15,
    title: "15 phút / ngày",
    desc: "Bứt phá nhanh khả năng bật phản xạ và ngữ điệu Tokyo",
    badge: "Tăng tốc",
  },
  {
    minutes: 25,
    title: "25 phút / ngày",
    desc: "Luyện tập chuyên sâu cấp tốc để chuẩn bị xuất cảnh hoặc phỏng vấn",
    badge: "Chuyên sâu",
  },
];

export const OnboardingQuizModal: React.FC<OnboardingQuizModalProps> = ({
  isOpen,
  onClose,
  onCompleted,
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [goal, setGoal] = useState<"daily_conversation" | "interview" | "business" | "travel">("daily_conversation");
  const [targetLevel, setTargetLevel] = useState<"N5" | "N4" | "N3" | "N2" | "N1">("N5");
  const [dailyTargetMinutes, setDailyTargetMinutes] = useState<number>(10);

  const [loading, setLoading] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleNext = () => {
    soundEffects.playTap();
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    soundEffects.playTap();
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const res = await userService.completeOnboardingQuiz({
        targetLevel,
        goal,
        dailyTargetMinutes,
      });

      // Update local zustand store
      const currentXp = user?.gamification?.totalXp || 0;
      const earnedXp = (res as any).xpAwarded || res.xpEarned || 50;
      useAuthStore.getState().updateUserGamification({
        onboardingCompleted: true,
        totalXp: currentXp + earnedXp,
      });

      if (user?.profile) {
        useAuthStore.getState().updateUser({
          profile: {
            ...user.profile,
            targetLevel,
            goal,
            dailyTargetMinutes,
          },
        });
      }

      setIsCompleted(true);
      setShowConfetti(true);
      soundEffects.playSuccess();
      toast.success(res.message || "Hoàn thành thiết lập lộ trình! Nhận ngay +50 XP");

      if (onCompleted) {
        onCompleted();
      }
    } catch (err: any) {
      console.error("Lỗi khi hoàn tất khảo sát:", err);
      toast.error(err.response?.data?.message || "Không thể lưu kết quả khảo sát");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <Confetti active={showConfetti} duration={3500} onComplete={() => setShowConfetti(false)} />

      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden animate-scale-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Đóng khảo sát"
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {!isCompleted ? (
          <div className="space-y-6">
            {/* Header with Progress Steps */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xs font-black uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                  <Sparkles size={12} className="animate-pulse" />
                  Khảo sát lộ trình cá nhân hóa
                </span>
                <span className="text-3xs font-bold text-slate-400">
                  Bước {step}/3 • Thưởng +50 XP
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-300 rounded-full"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>

            {/* Step 1: Goal */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    Mục tiêu luyện nói chính của bạn là gì?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Sensei AI sẽ ưu tiên các chủ đề hội thoại và từ vựng phù hợp với nhu cầu của bạn.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {GOAL_OPTIONS.map((opt) => {
                    const isSelected = goal === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setGoal(opt.id as any);
                          soundEffects.playTap();
                        }}
                        className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-rose-50/80 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600 shadow-xs ring-2 ring-rose-500/20"
                            : "bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            {opt.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {opt.title}
                              </span>
                              <span className="text-3xs font-extrabold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                {opt.badge}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {opt.desc}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? "border-rose-500 bg-rose-500 text-white"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {isSelected && <CheckCircle2 size={14} className="stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Target Level */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    Trình độ Kaiwa hiện tại của bạn ở mức nào?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    JTalk sẽ gợi ý tốc độ nói và độ phức tạp câu thoại vừa vặn với khả năng của bạn.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {LEVEL_OPTIONS.map((opt) => {
                    const isSelected = targetLevel === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setTargetLevel(opt.id as any);
                          soundEffects.playTap();
                        }}
                        className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-rose-50/80 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600 shadow-xs ring-2 ring-rose-500/20"
                            : "bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="w-8 h-8 rounded-xl bg-rose-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                            {opt.level}
                          </span>
                          <span className="text-3xs font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {opt.badge}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {opt.title}
                          </h4>
                          <p className="text-3xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                            {opt.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Daily Target Minutes */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    Mục tiêu luyện tập mỗi ngày của bạn?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Thiết lập thời gian cam kết mỗi ngày giúp duy trì ngọn lửa Streak bền bỉ nhất.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {DURATION_OPTIONS.map((opt) => {
                    const isSelected = dailyTargetMinutes === opt.minutes;
                    return (
                      <button
                        key={opt.minutes}
                        type="button"
                        onClick={() => {
                          setDailyTargetMinutes(opt.minutes);
                          soundEffects.playTap();
                        }}
                        className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-rose-50/80 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600 shadow-xs ring-2 ring-rose-500/20"
                            : "bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-black text-rose-600 dark:text-rose-400">
                            <Clock3 size={16} />
                            <span>{opt.minutes} Phút</span>
                          </div>
                          <span className="text-3xs font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {opt.badge}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {opt.title}
                          </h4>
                          <p className="text-3xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                            {opt.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Quay lại</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white text-xs font-black shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Đang lưu...</span>
                ) : step === 3 ? (
                  <>
                    <span>Hoàn tất & Nhận +50 XP 🎉</span>
                    <Sparkles size={14} />
                  </>
                ) : (
                  <>
                    <span>Tiếp tục</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Completion Celebration View */
          <div className="text-center py-6 space-y-6">
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 via-rose-500 to-pink-500 flex items-center justify-center text-white shadow-xl mx-auto animate-bounce-gentle">
                <Trophy size={40} className="fill-amber-200 text-amber-200" />
              </div>
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-rose-600 text-white text-3xs font-black shadow-md whitespace-nowrap">
                +50 XP Chào mừng
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Chào mừng bạn bắt đầu lộ trình Kaiwa!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Hệ thống đã điều chỉnh AI theo cấp độ <span className="font-bold text-rose-600">{targetLevel}</span>, mục tiêu <span className="font-bold text-rose-600">{dailyTargetMinutes} phút/ngày</span> và thưởng ngay <span className="font-bold text-amber-500">+50 XP</span> vào tài khoản.
              </p>
            </div>

            {/* Summary Bento Chips */}
            <div className="grid grid-cols-3 gap-2.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center">
              <div>
                <span className="text-3xs text-slate-400 font-bold uppercase block">Trình độ</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">{targetLevel}</span>
              </div>
              <div>
                <span className="text-3xs text-slate-400 font-bold uppercase block">Mục tiêu</span>
                <span className="text-sm font-black text-rose-600 dark:text-rose-400">{dailyTargetMinutes} phút</span>
              </div>
              <div>
                <span className="text-3xs text-slate-400 font-bold uppercase block">Thưởng XP</span>
                <span className="text-sm font-black text-amber-500">+50 XP</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Về bảng điều khiển
              </button>
              <Link
                to="/speaking"
                onClick={onClose}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-500 text-white text-xs font-black shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Luyện nói ngay</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default OnboardingQuizModal;
