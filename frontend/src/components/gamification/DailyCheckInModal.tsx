"use client";

import React, { useState, useEffect } from "react";
import { X, Flame, Sparkles, Trophy, Calendar, ArrowRight } from "lucide-react";
import { HankoStampCard } from "./HankoStampCard";
import { Link } from "@/lib/react-router-compat";
import { useAuth } from "@/hooks/useAuth";

interface DailyCheckInModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  autoCheckDaily?: boolean;
}

export const DailyCheckInModal: React.FC<DailyCheckInModalProps> = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  autoCheckDaily = true,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const { streak } = useAuth();

  const isControlled = controlledIsOpen !== undefined;
  const showModal = isControlled ? controlledIsOpen : internalOpen;

  const handleClose = () => {
    if (isControlled && controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalOpen(false);
    }
  };

  // Check once per day on mount if autoCheckDaily is enabled
  useEffect(() => {
    if (!autoCheckDaily || isControlled) return;

    try {
      const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const lastSeen = localStorage.getItem("jtalk_daily_checkin_seen");

      if (lastSeen !== todayStr) {
        // Delay slightly for smooth page load transition
        const timer = setTimeout(() => {
          setInternalOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore storage access errors
    }
  }, [autoCheckDaily, isControlled]);

  const handleDismissToday = () => {
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      localStorage.setItem("jtalk_daily_checkin_seen", todayStr);
    } catch {
      // ignore
    }
    handleClose();
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Decorative Header Banner */}
        <div className="relative bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 p-6 text-white overflow-hidden">
          {/* Subtle Ambient orbs */}
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleDismissToday}
            type="button"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold tracking-wide uppercase flex items-center gap-1.5">
              <Calendar size={12} />
              <span>Điểm danh hàng ngày</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/30 text-amber-100 text-xs font-bold flex items-center gap-1">
              <Flame size={12} className="fill-amber-300 text-amber-300" />
              <span>Chuỗi {streak} ngày</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Thẻ Điểm Danh 7 Ngày
          </h2>
          <p className="text-xs sm:text-sm text-rose-100 mt-1">
            Luyện nói ít nhất 1 bài mỗi ngày để tích mộc điểm danh và duy trì chuỗi ngày học liên tục!
          </p>
        </div>

        {/* Modal Body - Embedded Hanko Card */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <HankoStampCard className="border-0 shadow-none p-0 bg-transparent" />

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Link
              to="/speaking"
              onClick={handleDismissToday}
              className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-rose-600 to-amber-500 hover:brightness-105 active:scale-[0.98] text-white text-sm font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Sparkles size={16} />
              <span>Luyện nói tích dấu ngay</span>
              <ArrowRight size={14} />
            </Link>

            <button
              onClick={handleDismissToday}
              type="button"
              className="w-full sm:w-auto py-3 px-4 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              Đã hiểu, đóng lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyCheckInModal;
