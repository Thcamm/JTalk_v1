import { useState } from "react";
import { Link } from "react-router";
import { Search, Flame, Sparkles, Mic, Gift } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Logout from "../auth/Logout";
import { PremiumModal } from "@/components/common/PremiumModal";
import { Badge } from "@/components/common/Badge";

export default function Navbar() {
  const { user, isPremium, streak, remainingFreePractices } = useAuth();
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 h-18 px-4 sm:px-8 flex items-center justify-between bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs font-sans">
        {/* Search input - Rounded full pill */}
        <div className="relative w-full max-w-md hidden sm:block">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Nhập từ khóa để tìm kiếm bài học, chủ đề..."
            className="h-10 w-full rounded-full bg-slate-100/80 pl-10 pr-4 text-xs font-medium outline-hidden border border-transparent transition-all focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Quick Action: Start AI Speaking */}
          <Link
            to="/speaking"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <Mic size={14} />
            <span>Luyện phản xạ ngay</span>
          </Link>

          {/* Daily Streak */}
          <div
            className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-800 shrink-0"
            title={`Chuỗi ${streak} ngày học liên tiếp`}
          >
            <Flame size={15} className="text-amber-500 fill-amber-500 animate-pulse" />
            <span>{streak} ngày</span>
          </div>

          {/* Quota / Premium Badge */}
          {isPremium ? (
            <Badge variant="premium" size="sm" icon={<Sparkles className="w-3 h-3" />}>
              Premium Vô Hạn
            </Badge>
          ) : (
            <button
              onClick={() => setShowPremiumModal(true)}
              type="button"
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer border ${
                remainingFreePractices > 0
                  ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300 font-bold"
              }`}
            >
              <Gift
                size={13}
                className={remainingFreePractices > 0 ? "text-emerald-600" : "text-rose-600"}
              />
              <span>
                {remainingFreePractices > 0
                  ? `Còn ${remainingFreePractices}/2 lượt`
                  : "Hết lượt (0/2)"}
              </span>
              <span
                className={`${
                  remainingFreePractices > 0 ? "text-emerald-600" : "text-rose-600"
                } font-bold underline ml-0.5`}
              >
                Nâng cấp
              </span>
            </button>
          )}

          {/* User Profile Avatar */}
          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-full p-1 hover:bg-slate-100 transition-colors"
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white font-bold text-sm flex items-center justify-center shadow-xs">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "T"}
            </div>
          </Link>

          <Logout />
        </div>
      </header>

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        reason="quota_exceeded"
      />
    </>
  );
}
