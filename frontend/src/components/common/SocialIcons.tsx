"use client";

import React from "react";
import { SOCIAL_LINKS } from "@/constants/socialLinks";
import { Sparkles, ExternalLink, Heart } from "lucide-react";

export interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Icon Facebook chuẩn vector SVG
 */
export function FacebookIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

/**
 * Icon TikTok chuẩn vector SVG
 */
export function TikTokIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

/**
 * Banner / Card thu hút Follow Facebook & TikTok nổi bật cho Trang Dashboard / Homepage
 */
export function SocialCommunityCard({
  variant = "dashboard",
}: {
  variant?: "dashboard" | "landing" | "compact" | "admin";
}) {
  const isAdmin = variant === "admin";

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 shadow-md group transition-all ${
        isAdmin
          ? "bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/40 border border-indigo-800/60 text-white"
          : "bg-gradient-to-r from-blue-600/10 via-rose-500/10 to-indigo-600/10 dark:from-blue-950/40 dark:via-rose-950/30 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-900/40 shadow-xs"
      }`}
    >
      {/* Background Glow */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-xl">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-3xs font-black uppercase tracking-wider shadow-2xs ${
              isAdmin
                ? "bg-indigo-500/20 border border-indigo-400/30 text-indigo-300"
                : "bg-white/80 dark:bg-slate-900/80 border border-blue-200/80 dark:border-blue-800/60 text-blue-700 dark:text-blue-300"
            }`}
          >
            <Sparkles size={11} className="text-amber-500 fill-amber-500" />
            <span>{isAdmin ? "Kênh Truyền Thông JTalk (Admin View)" : "Cộng Đồng Học Tiếng Nhật JTalk"}</span>
          </div>

          <h3
            className={`text-base sm:text-lg font-black tracking-tight flex items-center gap-2 ${
              isAdmin ? "text-white" : "text-slate-900 dark:text-white"
            }`}
          >
            <span>{isAdmin ? "Kênh Mạng Xã Hội Fanpage & TikTok Chính Thức" : "Kết nối cùng JTalk trên Mạng Xã Hội"}</span>
            <Heart size={16} className="text-rose-500 fill-rose-500 animate-pulse" />
          </h3>

          <p
            className={`text-xs leading-relaxed font-medium ${
              isAdmin ? "text-slate-300" : "text-slate-600 dark:text-slate-300"
            }`}
          >
            {SOCIAL_LINKS.callToAction}
          </p>
        </div>

        {/* 2 Nút Follow Facebook & TikTok */}
        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 flex-wrap">
          {/* Nút Facebook */}
          <a
            href={SOCIAL_LINKS.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-extrabold text-xs shadow-md shadow-blue-600/25 active:scale-95 transition-all cursor-pointer group/fb"
            title="Truy cập Fanpage Facebook JTalk"
          >
            <div className="p-1 rounded-lg bg-white/20 group-hover/fb:scale-110 transition-transform">
              <FacebookIcon size={14} className="text-white fill-white" />
            </div>
            <span>Follow Fanpage</span>
            <ExternalLink size={12} className="opacity-70 group-hover/fb:translate-x-0.5 transition-transform" />
          </a>

          {/* Nút TikTok */}
          <a
            href={SOCIAL_LINKS.tiktok}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-2xl bg-black dark:bg-white hover:bg-slate-900 dark:hover:bg-slate-100 text-white dark:text-black font-extrabold text-xs shadow-md shadow-black/25 active:scale-95 transition-all cursor-pointer group/tt"
            title={`Truy cập Kênh TikTok ${SOCIAL_LINKS.tiktokName}`}
          >
            <div className="p-1 rounded-lg bg-white/20 dark:bg-black/10 group-hover/tt:scale-110 transition-transform">
              <TikTokIcon size={14} className="text-white dark:text-black fill-current" />
            </div>
            <span>Follow TikTok</span>
            <ExternalLink size={12} className="opacity-70 group-hover/tt:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Widget thu gọn chuyên dùng cho Sidebar (cả Sidebar học viên và AdminSidebar)
 */
export function SocialSidebarWidget({
  isCollapsed = false,
  theme = "student",
}: {
  isCollapsed?: boolean;
  theme?: "student" | "admin";
}) {
  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-2 py-2">
        <a
          href={SOCIAL_LINKS.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-xl bg-[#1877F2]/15 hover:bg-[#1877F2] text-[#1877F2] hover:text-white flex items-center justify-center transition-all shadow-2xs hover:scale-110 cursor-pointer"
          title={`Fanpage Facebook: ${SOCIAL_LINKS.facebookName}`}
        >
          <FacebookIcon size={15} />
        </a>
        <a
          href={SOCIAL_LINKS.tiktok}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-xl bg-slate-800/60 dark:bg-slate-800 hover:bg-black dark:hover:bg-white text-slate-700 dark:text-slate-300 hover:text-white dark:hover:text-black flex items-center justify-center transition-all shadow-2xs hover:scale-110 cursor-pointer"
          title={`Kênh TikTok: ${SOCIAL_LINKS.tiktokName}`}
        >
          <TikTokIcon size={15} />
        </a>
      </div>
    );
  }

  const isDarkAdmin = theme === "admin";

  return (
    <div
      className={`rounded-2xl p-3 border transition-all ${
        isDarkAdmin
          ? "bg-slate-900/80 border-slate-800 text-slate-200"
          : "bg-gradient-to-br from-blue-50/60 via-purple-50/40 to-rose-50/60 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300"
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-1">
          <Sparkles size={11} className="text-rose-500" />
          <span>Kênh Truyền Thông</span>
        </span>
        <span className="text-3xs font-bold text-rose-600 dark:text-rose-400">
          Follow nhận quà 🎁
        </span>
      </div>

      <p className="text-3xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-2 font-medium">
        Bí kíp & Minigame hàng tuần
      </p>

      <div className="grid grid-cols-2 gap-2">
        <a
          href={SOCIAL_LINKS.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-3xs font-extrabold shadow-2xs hover:scale-102 active:scale-98 transition-all cursor-pointer"
          title={`Theo dõi Fanpage: ${SOCIAL_LINKS.facebookName}`}
        >
          <FacebookIcon size={12} className="text-white fill-white shrink-0" />
          <span>Facebook</span>
        </a>

        <a
          href={SOCIAL_LINKS.tiktok}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black dark:bg-white hover:bg-slate-900 dark:hover:bg-slate-100 text-white dark:text-black text-3xs font-extrabold shadow-2xs hover:scale-102 active:scale-98 transition-all cursor-pointer"
          title={`Theo dõi Kênh TikTok: ${SOCIAL_LINKS.tiktokName}`}
        >
          <TikTokIcon size={12} className="fill-current shrink-0" />
          <span>TikTok</span>
        </a>
      </div>
    </div>
  );
}
