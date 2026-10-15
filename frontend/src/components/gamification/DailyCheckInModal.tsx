"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Flame } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/useAuthStore";
import { studylogService } from "@/services/studylog.service";
import { soundEffects } from "@/utils/soundEffects";

interface DailyCheckInModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  autoCheckDaily?: boolean;
}

/**
 * Streak Tier Configuration
 * Tier 1: 1–2 days (Amber Ember / Lửa Cam Hổ Phách)
 * Tier 2: 3–6 days (Crimson Blaze / Lửa Đỏ Nhiệt Huyết)
 * Tier 3: 7–13 days (Cyber Magenta / Lửa Hồng Tím Neon)
 * Tier 4: 14–29 days (Azure Plasma / Lửa Lam Thanh Khiết)
 * Tier 5: 30–99 days (Solar Gold / Lửa Hoàng Kim Siêu Cấp)
 * Tier 6: 100+ days (Prismatic Cosmic / Lửa Vũ Trụ Huyền Thoại)
 */
export interface StreakTierConfig {
  tier: 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
  badgeText: string;
  title: string;
  message: string;
  badgeClass: string;
  badgeIconClass: string;
  ambientAuraGradient: string;
  outerFlameColors: {
    stop0: string;
    stop25: string;
    stop60: string;
    stop100: string;
  };
  leftCrestColors: {
    stop0: string;
    stop100: string;
  };
  rightCrestColors: {
    stop0: string;
    stop100: string;
  };
  innerCoreColors: {
    stop0: string;
    stop40: string;
    stop75: string;
    stop100: string;
  };
  ribbonGradientClass: string;
  ribbonTailClass: string;
  ribbonShadow: string;
  dropShadow1: string;
  dropShadow2: string;
  emberColors: [string, string, string, string, string];
}

export const getStreakTier = (streak: number, displayName?: string): StreakTierConfig => {
  const learner = displayName ? displayName.split(" ").slice(-1)[0] : "bạn";

  // Tier 1: 1–2 days (Amber Ember)
  if (streak <= 2) {
    return {
      tier: 1,
      name: "Lửa Cam Hổ Phách",
      badgeText: streak === 1 ? "Ngọn lửa mới thắp" : "Lửa Cam Hổ Phách",
      title: streak === 1 ? "Streak badge unlocked!" : "Streak badge upgraded!",
      message:
        streak === 1
          ? `Chào mừng ${learner}! Bạn đã thắp sáng chuỗi ngày học đầu tiên cùng JTalk AI. Hãy tiếp tục giữ lửa ngày mai nhé!`
          : `Khởi đầu vững chắc ${learner}! Ngọn lửa cam hổ phách đã bừng sáng chuỗi 2 ngày. Hãy giữ đà tiến bước nhé!`,
      badgeClass: "bg-orange-500/20 border-orange-400/40 text-orange-300",
      badgeIconClass: "fill-orange-400 text-orange-400",
      ambientAuraGradient: "from-orange-600/35 via-amber-600/25 to-yellow-600/20",
      outerFlameColors: {
        stop0: "#f97316",
        stop25: "#fb923c",
        stop60: "#ea580c",
        stop100: "#c2410c",
      },
      leftCrestColors: {
        stop0: "#fbbf24",
        stop100: "#f97316",
      },
      rightCrestColors: {
        stop0: "#ea580c",
        stop100: "#f59e0b",
      },
      innerCoreColors: {
        stop0: "#ffffff",
        stop40: "#fef9c3",
        stop75: "#fde047",
        stop100: "#f59e0b",
      },
      ribbonGradientClass: "from-amber-700 via-orange-500 to-amber-600",
      ribbonTailClass: "bg-amber-950 border-orange-400/50",
      ribbonShadow: "rgba(249,115,22,0.75)",
      dropShadow1: "rgba(249,115,22,0.9)",
      dropShadow2: "rgba(245,158,11,0.6)",
      emberColors: [
        "bg-amber-300 shadow-[0_0_8px_#fde047]",
        "bg-orange-400 shadow-[0_0_10px_#fb923c]",
        "bg-yellow-200 shadow-[0_0_8px_#fef08a]",
        "bg-rose-400 shadow-[0_0_10px_#fb7185]",
        "bg-amber-100 shadow-[0_0_6px_#fef3c7]",
      ],
    };
  }

  // Tier 2: 3–6 days (Crimson Blaze)
  if (streak <= 6) {
    return {
      tier: 2,
      name: "Lửa Đỏ Nhiệt Huyết",
      badgeText: "Lửa Đỏ Nhiệt Huyết",
      title: "Streak badge upgraded!",
      message: `Rực cháy ${learner}! Nhiệt lượng chuỗi ${streak} ngày đang tăng vọt. Phản xạ Kaiwa đang dần ngấm sâu vào thói quen mỗi ngày!`,
      badgeClass: "bg-rose-500/20 border-rose-400/40 text-rose-300",
      badgeIconClass: "fill-rose-400 text-rose-400",
      ambientAuraGradient: "from-red-600/35 via-rose-600/30 to-pink-600/20",
      outerFlameColors: {
        stop0: "#ef4444",
        stop25: "#f43f5e",
        stop60: "#e11d48",
        stop100: "#be123c",
      },
      leftCrestColors: {
        stop0: "#fb7185",
        stop100: "#e11d48",
      },
      rightCrestColors: {
        stop0: "#f43f5e",
        stop100: "#9f1239",
      },
      innerCoreColors: {
        stop0: "#ffffff",
        stop40: "#ffe4e6",
        stop75: "#f43f5e",
        stop100: "#fda4af",
      },
      ribbonGradientClass: "from-rose-700 via-red-500 to-rose-600",
      ribbonTailClass: "bg-red-950 border-rose-400/50",
      ribbonShadow: "rgba(239,68,68,0.75)",
      dropShadow1: "rgba(239,68,68,0.9)",
      dropShadow2: "rgba(225,29,72,0.6)",
      emberColors: [
        "bg-rose-300 shadow-[0_0_8px_#fda4af]",
        "bg-red-400 shadow-[0_0_10px_#f87171]",
        "bg-pink-300 shadow-[0_0_8px_#f472b6]",
        "bg-amber-300 shadow-[0_0_10px_#fde047]",
        "bg-rose-100 shadow-[0_0_6px_#ffe4e6]",
      ],
    };
  }

  // Tier 3: 7–13 days (Cyber Magenta)
  if (streak <= 13) {
    return {
      tier: 3,
      name: "Lửa Hồng Tím Neon",
      badgeText: streak === 7 ? "Chiến binh 1 tuần" : "Lửa Hồng Tím Neon",
      title: "Streak badge upgraded!",
      message: `Đỉnh cao ${learner}! Ngọn lửa hồng tím neon rực sáng vinh danh ${streak} ngày bền bỉ. Cùng giữ vững phong độ đỉnh cao này nhé!`,
      badgeClass: "bg-fuchsia-500/20 border-fuchsia-400/40 text-fuchsia-300",
      badgeIconClass: "fill-fuchsia-400 text-fuchsia-400",
      ambientAuraGradient: "from-fuchsia-600/35 via-pink-600/30 to-purple-600/20",
      outerFlameColors: {
        stop0: "#f43f5e",
        stop25: "#ec4899",
        stop60: "#d946ef",
        stop100: "#8b5cf6",
      },
      leftCrestColors: {
        stop0: "#fb7185",
        stop100: "#d946ef",
      },
      rightCrestColors: {
        stop0: "#f43f5e",
        stop100: "#a855f7",
      },
      innerCoreColors: {
        stop0: "#ffffff",
        stop40: "#fff1f2",
        stop75: "#f472b6",
        stop100: "#c084fc",
      },
      ribbonGradientClass: "from-purple-600 via-fuchsia-500 to-pink-500",
      ribbonTailClass: "bg-purple-950 border-purple-400/50",
      ribbonShadow: "rgba(168,85,247,0.75)",
      dropShadow1: "rgba(236,72,153,0.9)",
      dropShadow2: "rgba(217,70,239,0.6)",
      emberColors: [
        "bg-amber-300 shadow-[0_0_8px_#fde047]",
        "bg-pink-400 shadow-[0_0_10px_#f472b6]",
        "bg-fuchsia-300 shadow-[0_0_8px_#f0abfc]",
        "bg-rose-400 shadow-[0_0_10px_#fb7185]",
        "bg-amber-200 shadow-[0_0_6px_#fef08a]",
      ],
    };
  }

  // Tier 4: 14–29 days (Azure Plasma)
  if (streak <= 29) {
    return {
      tier: 4,
      name: "Lửa Lam Thanh Khiết",
      badgeText: "Lửa Lam Thanh Khiết",
      title: "Streak badge upgraded!",
      message: `Phi thường ${learner}! Lửa lam nhiệt độ cao nhất biểu trưng cho sự chuẩn xác và tự tin vượt bậc sau ${streak} ngày luyện phản xạ liên tục!`,
      badgeClass: "bg-cyan-500/20 border-cyan-400/40 text-cyan-300",
      badgeIconClass: "fill-cyan-400 text-cyan-400",
      ambientAuraGradient: "from-cyan-600/35 via-blue-600/30 to-indigo-600/20",
      outerFlameColors: {
        stop0: "#06b6d4",
        stop25: "#0ea5e9",
        stop60: "#3b82f6",
        stop100: "#6366f1",
      },
      leftCrestColors: {
        stop0: "#38bdf8",
        stop100: "#2563eb",
      },
      rightCrestColors: {
        stop0: "#06b6d4",
        stop100: "#4f46e5",
      },
      innerCoreColors: {
        stop0: "#ffffff",
        stop40: "#ecfeff",
        stop75: "#67e8f9",
        stop100: "#93c5fd",
      },
      ribbonGradientClass: "from-blue-700 via-cyan-500 to-indigo-600",
      ribbonTailClass: "bg-blue-950 border-cyan-400/50",
      ribbonShadow: "rgba(6,182,212,0.75)",
      dropShadow1: "rgba(6,182,212,0.9)",
      dropShadow2: "rgba(59,130,246,0.6)",
      emberColors: [
        "bg-cyan-200 shadow-[0_0_8px_#a5f3fc]",
        "bg-sky-400 shadow-[0_0_10px_#38bdf8]",
        "bg-blue-300 shadow-[0_0_8px_#93c5fd]",
        "bg-teal-300 shadow-[0_0_10px_#5eead4]",
        "bg-white shadow-[0_0_6px_#ffffff]",
      ],
    };
  }

  // Tier 5: 30–99 days (Solar Gold)
  if (streak <= 99) {
    return {
      tier: 5,
      name: "Lửa Hoàng Kim Siêu Cấp",
      badgeText: "Lửa Hoàng Kim Siêu Cấp",
      title: "Streak badge upgraded!",
      message: `Kỳ tích xuất sắc ${learner}! Ngọn lửa hoàng kim mặt trời vinh danh ${streak} ngày đàm thoại không ngừng nghỉ cùng JTalk AI!`,
      badgeClass: "bg-amber-500/20 border-amber-400/40 text-amber-300",
      badgeIconClass: "fill-amber-400 text-amber-400",
      ambientAuraGradient: "from-yellow-500/35 via-amber-500/30 to-orange-500/25",
      outerFlameColors: {
        stop0: "#facc15",
        stop25: "#f59e0b",
        stop60: "#d97706",
        stop100: "#b45309",
      },
      leftCrestColors: {
        stop0: "#fde047",
        stop100: "#d97706",
      },
      rightCrestColors: {
        stop0: "#facc15",
        stop100: "#ea580c",
      },
      innerCoreColors: {
        stop0: "#ffffff",
        stop40: "#fefce8",
        stop75: "#fef08a",
        stop100: "#fde047",
      },
      ribbonGradientClass: "from-amber-600 via-yellow-400 to-amber-500",
      ribbonTailClass: "bg-amber-950 border-yellow-400/50",
      ribbonShadow: "rgba(234,179,8,0.8)",
      dropShadow1: "rgba(234,179,8,0.95)",
      dropShadow2: "rgba(245,158,11,0.7)",
      emberColors: [
        "bg-white shadow-[0_0_8px_#ffffff]",
        "bg-yellow-300 shadow-[0_0_10px_#fde047]",
        "bg-amber-300 shadow-[0_0_8px_#fcd34d]",
        "bg-orange-300 shadow-[0_0_10px_#fdba74]",
        "bg-yellow-100 shadow-[0_0_6px_#fef9c3]",
      ],
    };
  }

  // Tier 6: 100+ days (Prismatic Cosmic)
  return {
    tier: 6,
    name: "Lửa Vũ Trụ Huyền Thoại",
    badgeText: "Huyền thoại JTalk",
    title: "Streak badge upgraded!",
    message: `Huyền thoại JTalk ${learner}! Chuỗi ${streak} ngày đàm thoại vô tiền khoáng hậu. Bạn đã đạt tới cảnh giới ngọn lửa vũ trụ tối thượng!`,
    badgeClass: "bg-indigo-500/20 border-indigo-400/40 text-indigo-300",
    badgeIconClass: "fill-indigo-400 text-indigo-400",
    ambientAuraGradient: "from-indigo-500/35 via-purple-600/30 to-cyan-500/25",
    outerFlameColors: {
      stop0: "#38bdf8",
      stop25: "#ec4899",
      stop60: "#8b5cf6",
      stop100: "#6366f1",
    },
    leftCrestColors: {
      stop0: "#f472b6",
      stop100: "#8b5cf6",
    },
    rightCrestColors: {
      stop0: "#38bdf8",
      stop100: "#ec4899",
    },
    innerCoreColors: {
      stop0: "#ffffff",
      stop40: "#fdf4ff",
      stop75: "#e879f9",
      stop100: "#67e8f9",
    },
    ribbonGradientClass: "from-indigo-600 via-fuchsia-500 to-cyan-500",
    ribbonTailClass: "bg-indigo-950 border-fuchsia-400/50",
    ribbonShadow: "rgba(168,85,247,0.85)",
    dropShadow1: "rgba(168,85,247,0.95)",
    dropShadow2: "rgba(6,182,212,0.7)",
    emberColors: [
      "bg-white shadow-[0_0_8px_#ffffff]",
      "bg-fuchsia-300 shadow-[0_0_10px_#f0abfc]",
      "bg-cyan-300 shadow-[0_0_8px_#67e8f9]",
      "bg-pink-400 shadow-[0_0_10px_#f472b6]",
      "bg-indigo-200 shadow-[0_0_6px_#c7d2fe]",
    ],
  };
};

/**
 * Living Blazing Neon Flame Component with dynamic tier colors
 */
const LivingBlazingFlame: React.FC<{ streak: number; config: StreakTierConfig }> = ({
  streak,
  config,
}) => {
  return (
    <div className="relative w-72 h-80 sm:w-80 sm:h-88 flex items-center justify-center my-2 select-none mx-auto">
      {/* Dynamic Keyframes Styles tailored to tier colors */}
      <style>{`
        @keyframes flameFlicker {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            filter: drop-shadow(0 0 35px ${config.dropShadow1}) drop-shadow(0 0 70px ${config.dropShadow2});
          }
          20% {
            transform: scale(1.03, 0.97) rotate(-1.5deg) skewX(-1.2deg);
            filter: drop-shadow(0 0 45px ${config.dropShadow1}) drop-shadow(0 0 85px ${config.dropShadow2});
          }
          45% {
            transform: scale(0.97, 1.05) rotate(1.2deg) skewX(1deg);
            filter: drop-shadow(0 0 40px ${config.dropShadow1}) drop-shadow(0 0 75px ${config.dropShadow2});
          }
          70% {
            transform: scale(1.02, 1.02) rotate(-0.8deg) skewX(0.8deg);
            filter: drop-shadow(0 0 55px ${config.dropShadow1}) drop-shadow(0 0 95px ${config.dropShadow2});
          }
        }

        @keyframes flameLeftTongue {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.06, 0.94) rotate(-2.5deg) translateY(-2px); }
        }

        @keyframes flameRightTongue {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(0.95, 1.05) rotate(3deg) translateY(-3px); }
        }

        @keyframes innerCoreBreathe {
          0%, 100% { transform: scale(1) translateY(0); opacity: 0.95; }
          50% { transform: scale(0.93, 1.1) translateY(-6px); opacity: 1; filter: drop-shadow(0 0 16px rgba(255,255,255,1)); }
        }

        @keyframes radiantSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes heatPulse {
          0%, 100% { transform: scale(1); opacity: 0.35; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }

        @keyframes emberRiseA {
          0% { transform: translateY(30px) translateX(0) scale(0.6); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 0.8; }
          100% { transform: translateY(-160px) translateX(28px) scale(0.1); opacity: 0; }
        }

        @keyframes emberRiseB {
          0% { transform: translateY(40px) translateX(0) scale(0.8); opacity: 0; }
          25% { opacity: 1; }
          75% { opacity: 0.7; }
          100% { transform: translateY(-190px) translateX(-32px) scale(0.15); opacity: 0; }
        }

        @keyframes emberRiseC {
          0% { transform: translateY(20px) translateX(0) scale(0.7); opacity: 0; }
          20% { opacity: 0.9; }
          80% { opacity: 0.6; }
          100% { transform: translateY(-175px) translateX(18px) scale(0.1); opacity: 0; }
        }

        @keyframes emberRiseD {
          0% { transform: translateY(50px) translateX(0) scale(0.9); opacity: 0; }
          30% { opacity: 1; }
          70% { opacity: 0.7; }
          100% { transform: translateY(-210px) translateX(-18px) scale(0.2); opacity: 0; }
        }

        @keyframes ribbonBreathe {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2.5px); }
        }

        .flame-anim-main {
          animation: flameFlicker 1.4s ease-in-out infinite;
          transform-origin: 50% 90%;
        }

        .flame-anim-left {
          animation: flameLeftTongue 1.1s ease-in-out infinite;
          transform-origin: 30% 80%;
        }

        .flame-anim-right {
          animation: flameRightTongue 1.3s ease-in-out infinite;
          transform-origin: 70% 80%;
        }

        .flame-anim-inner {
          animation: innerCoreBreathe 0.9s ease-in-out infinite;
          transform-origin: 50% 85%;
        }

        .ambient-spin {
          animation: radiantSpin 24s linear infinite;
        }

        .heat-glow-pulse {
          animation: heatPulse 2s ease-in-out infinite;
        }

        .ember-1 { animation: emberRiseA 2.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite; }
        .ember-2 { animation: emberRiseB 2.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.5s infinite; }
        .ember-3 { animation: emberRiseC 2.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 1s infinite; }
        .ember-4 { animation: emberRiseD 2.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 1.5s infinite; }
        .ember-5 { animation: emberRiseA 2.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) 1.8s infinite; }

        .ribbon-float {
          animation: ribbonBreathe 2s ease-in-out infinite;
        }
      `}</style>

      {/* 1. Ambient Sunburst Light Rays behind the flame */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Soft rotating sunburst ray disc */}
        <div className="ambient-spin absolute w-72 h-72 sm:w-80 sm:h-80 opacity-40">
          <svg viewBox="0 0 200 200" className="w-full h-full fill-white/10">
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <polygon
                key={deg}
                points="100,100 95,0 105,0"
                transform={`rotate(${deg} 100 100)`}
              />
            ))}
          </svg>
        </div>

        {/* Pulsing Heat Halo */}
        <div
          className={`heat-glow-pulse w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-gradient-to-tr ${config.ambientAuraGradient} blur-3xl`}
        />
        <div className="absolute w-44 h-44 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* 2. Rising Dynamic Embers */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible z-20">
        <div className={`ember-1 absolute bottom-24 left-1/2 -translate-x-12 w-2 h-2 rounded-full ${config.emberColors[0]}`} />
        <div className={`ember-2 absolute bottom-24 left-1/2 translate-x-8 w-2.5 h-2.5 rounded-full ${config.emberColors[1]}`} />
        <div className={`ember-3 absolute bottom-20 left-1/2 -translate-x-6 w-1.5 h-1.5 rounded-full ${config.emberColors[2]}`} />
        <div className={`ember-4 absolute bottom-28 left-1/2 translate-x-12 w-2 h-2 rounded-full ${config.emberColors[3]}`} />
        <div className={`ember-5 absolute bottom-18 left-1/2 -translate-x-16 w-1.5 h-1.5 rounded-full ${config.emberColors[4]}`} />
      </div>

      {/* 3. The Dynamic Blazing Flame SVG */}
      <div className="relative z-10 w-48 h-56 sm:w-54 sm:h-64 flex items-center justify-center">
        <div className="flame-anim-main w-full h-full flex items-center justify-center">
          <svg
            viewBox="0 0 200 240"
            className="w-full h-full overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Outer Flame Gradient */}
              <linearGradient id="blazingOuterFlame" x1="100" y1="10" x2="100" y2="230" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={config.outerFlameColors.stop0} />
                <stop offset="25%" stopColor={config.outerFlameColors.stop25} />
                <stop offset="60%" stopColor={config.outerFlameColors.stop60} />
                <stop offset="100%" stopColor={config.outerFlameColors.stop100} />
              </linearGradient>

              {/* Left Crest Gradient */}
              <linearGradient id="blazingLeftCrest" x1="50" y1="30" x2="50" y2="180" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={config.leftCrestColors.stop0} />
                <stop offset="100%" stopColor={config.leftCrestColors.stop100} />
              </linearGradient>

              {/* Right Crest Gradient */}
              <linearGradient id="blazingRightCrest" x1="150" y1="30" x2="150" y2="180" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={config.rightCrestColors.stop0} />
                <stop offset="100%" stopColor={config.rightCrestColors.stop100} />
              </linearGradient>

              {/* Inner Core Flame Gradient */}
              <linearGradient id="blazingInnerCore" x1="100" y1="90" x2="100" y2="210" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={config.innerCoreColors.stop0} />
                <stop offset="40%" stopColor={config.innerCoreColors.stop40} />
                <stop offset="75%" stopColor={config.innerCoreColors.stop75} />
                <stop offset="100%" stopColor={config.innerCoreColors.stop100} />
              </linearGradient>
            </defs>

            {/* Layer 1: Outer Back Flame Silhouette */}
            <path
              d="M100 12 C108 45, 128 65, 142 85 C156 105, 168 130, 166 160 C163 196, 136 226, 100 228 C64 226, 37 196, 34 160 C32 130, 44 105, 58 85 C72 65, 92 45, 100 12 Z"
              fill="url(#blazingOuterFlame)"
            />

            {/* Layer 2: Dancing Left Flame Crest */}
            <g className="flame-anim-left">
              <path
                d="M100 12 C92 50, 60 75, 45 105 C38 118, 34 138, 34 155 C34 150, 28 132, 32 118 C38 98, 55 78, 70 62 C82 50, 94 32, 100 12 Z"
                fill="url(#blazingLeftCrest)"
                opacity="0.8"
              />
            </g>

            {/* Layer 3: Dancing Right Flame Crest */}
            <g className="flame-anim-right">
              <path
                d="M100 12 C108 50, 140 75, 155 105 C162 118, 166 138, 166 155 C166 150, 172 132, 168 118 C162 98, 145 78, 130 62 C118 50, 106 32, 100 12 Z"
                fill="url(#blazingRightCrest)"
                opacity="0.8"
              />
            </g>

            {/* Layer 4: Dynamic Center Flame Tongue Cuts */}
            <path
              d="M72 75 C82 100, 70 125, 62 145 C80 135, 95 110, 98 88 C98 105, 115 125, 128 140 C124 118, 134 98, 140 78 C148 105, 158 132, 152 165 C146 195, 126 218, 100 220 C74 218, 54 195, 48 165 C44 140, 52 110, 72 75 Z"
              fill="url(#blazingOuterFlame)"
            />

            {/* Layer 5: Glowing Breathing Inner Core */}
            <g className="flame-anim-inner">
              <path
                d="M100 95 C108 120, 132 145, 130 172 C128 194, 116 210, 100 210 C84 210, 72 194, 70 172 C68 145, 92 120, 100 95 Z"
                fill="url(#blazingInnerCore)"
              />
              <ellipse cx="100" cy="180" rx="14" ry="20" fill="#ffffff" opacity="0.95" filter="blur(2px)" />
            </g>
          </svg>
        </div>

        {/* 4. 3D Ribbon Banner With Big Streak Number */}
        <div className="ribbon-float absolute -bottom-3 sm:-bottom-4 left-1/2 -translate-x-1/2 w-[114%] flex items-center justify-center z-30">
          {/* Left Ribbon Tail */}
          <div className={`w-5 sm:w-6 h-10 sm:h-11 ${config.ribbonTailClass} -mr-2 skew-y-12 rounded-l-md shadow-lg border-y border-l`} />

          {/* Main Ribbon Center */}
          <div
            className={`relative px-6 sm:px-8 py-1.5 sm:py-2.5 rounded-2xl bg-gradient-to-r ${config.ribbonGradientClass} border-2 border-white/80 flex items-center justify-center min-w-[135px] sm:min-w-[165px]`}
            style={{
              boxShadow: `0 8px 30px ${config.ribbonShadow}`,
            }}
          >
            <span
              className="text-4xl sm:text-5xl font-black text-white tracking-tight italic select-none"
              style={{
                textShadow: "0 3px 8px rgba(0,0,0,0.45), 0 0 16px rgba(255,255,255,0.95)",
                WebkitTextStroke: "1px rgba(255,255,255,0.95)",
              }}
            >
              {streak}
            </span>
          </div>

          {/* Right Ribbon Tail */}
          <div className={`w-5 sm:w-6 h-10 sm:h-11 ${config.ribbonTailClass} -ml-2 -skew-y-12 rounded-r-md shadow-lg border-y border-r`} />
        </div>
      </div>
    </div>
  );
};

export const DailyCheckInModal: React.FC<DailyCheckInModalProps> = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  autoCheckDaily = true,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [latestStreak, setLatestStreak] = useState<number | null>(null);
  const { user, streak, practiceCountToday } = useAuth();
  const hasAutoCheckedRef = useRef(false);

  const isControlled = controlledIsOpen !== undefined;
  const showModal = isControlled ? controlledIsOpen : internalOpen;

  const displayStreak = Math.max(1, latestStreak ?? streak ?? 1);
  const tierConfig = useMemo(
    () => getStreakTier(displayStreak, user?.displayName || user?.username),
    [displayStreak, user?.displayName, user?.username]
  );

  const handleClose = () => {
    if (isControlled && controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalOpen(false);
    }
  };

  // 1. Tự động tính streak dưới nền khi người dùng đăng nhập hoặc vào ứng dụng
  useEffect(() => {
    if (!user?._id || hasAutoCheckedRef.current) return;
    hasAutoCheckedRef.current = true;

    const todayStr = new Date().toISOString().split("T")[0];
    const celebrationKey = `jtalk_streak_celebrated_${todayStr}_${user._id}`;
    const alreadyCelebratedToday = localStorage.getItem(celebrationKey) === "true";

    const runAutoCheckIn = async () => {
      try {
        const res = await studylogService.checkIn(todayStr);
        if (res.success) {
          // Cập nhật ngay chỉ số Gamification trong Auth Store (+20 XP, Streak)
          useAuthStore.getState().updateUserGamification({
            streak: res.streak,
            longestStreak: res.longestStreak,
            totalXp: res.totalXp,
            level: res.level,
          });

          useAuthStore.getState().updateUserDailyUsage({
            practiceCount: Math.max(1, practiceCountToday),
            minutesSpent: 5,
          });

          const currentEffectiveStreak = res.streak ?? streak;
          setLatestStreak(currentEffectiveStreak);

          // Nếu hôm nay chưa hiển thị chúc mừng và bật autoCheckDaily -> mở popup
          if (!alreadyCelebratedToday && autoCheckDaily && !isControlled) {
            localStorage.setItem(celebrationKey, "true");
            setTimeout(() => {
              setInternalOpen(true);
              soundEffects.playStreakCelebration();
            }, 700);
          }
        }
      } catch (err) {
        console.warn("[STREAK] Auto checkin check:", err);
      }
    };

    runAutoCheckIn();
  }, [user?._id, autoCheckDaily, isControlled, practiceCountToday, streak]);

  // 2. Khi người dùng click thủ công vào Huy hiệu Streak trên Navbar: mở modal và phát âm thanh
  useEffect(() => {
    if (isControlled && controlledIsOpen) {
      soundEffects.playStreakCelebration();
    }
  }, [isControlled, controlledIsOpen]);

  if (!showModal) return null;

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-950/92 backdrop-blur-2xl animate-in fade-in duration-300 cursor-pointer select-none overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      {/* Dynamic Ambient Radiant Aura tailored to tier */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] sm:w-[640px] sm:h-[640px] bg-gradient-to-tr ${tierConfig.ambientAuraGradient} rounded-full blur-3xl pointer-events-none transition-all duration-700`}
      />

      {/* Floating Free-Form Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-lg w-full animate-in zoom-in-95 duration-300 space-y-3">
        {/* Dynamic Header Badge */}
        <div
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs sm:text-sm font-black uppercase tracking-widest shadow-lg ${tierConfig.badgeClass} transition-colors duration-500`}
        >
          <Flame size={15} className={`${tierConfig.badgeIconClass} animate-pulse`} />
          <span>{tierConfig.badgeText}</span>
        </div>

        {/* Title */}
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
          {tierConfig.title}
        </h2>

        {/* Centerpiece: Living Blazing Flame with dynamic tier color */}
        <LivingBlazingFlame streak={displayStreak} config={tierConfig} />

        {/* Motivational Congratulatory Message */}
        <p className="text-sm sm:text-base text-purple-100/90 leading-relaxed font-medium max-w-sm sm:max-w-md mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] pt-2">
          {tierConfig.message}
        </p>

        {/* Subtle Tap Anywhere Prompt */}
        <p className="text-2xs sm:text-xs text-purple-300/40 hover:text-purple-300/70 font-semibold tracking-widest uppercase pt-8 animate-pulse transition-colors">
          Chạm bất kỳ đâu để tiếp tục
        </p>
      </div>
    </div>
  );
};

export const StreakCelebrationModal = DailyCheckInModal;
export default DailyCheckInModal;
