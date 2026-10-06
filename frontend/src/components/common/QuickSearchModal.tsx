"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "@/lib/react-router-compat";
import {
  Search,
  X,
  Video,
  Mic,
  BookOpen,
  Home,
  User,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Flame,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: "navigation" | "lesson" | "speaking" | "vocabulary";
  url: string;
  badge?: string;
  icon?: any;
}

const STATIC_SEARCH_ITEMS: SearchItem[] = [
  // Navigation
  {
    id: "nav-home",
    title: "Trang chủ & Bảng điều khiển",
    subtitle: "Xem tiến độ học tập, bài học tiếp theo và chuỗi ngày Streak",
    category: "navigation",
    url: "/dashboard",
    badge: "Trang chính",
    icon: Home,
  },
  {
    id: "nav-courses",
    title: "Thư viện Video Bài giảng",
    subtitle: "Khám phá video bài giảng thực tế theo cấp độ JLPT N5 - N1",
    category: "navigation",
    url: "/courses",
    badge: "Thư viện",
    icon: Video,
  },
  {
    id: "nav-speaking",
    title: "Phòng Luyện nói AI & Phản xạ",
    subtitle: "Luyện phát âm, đối đáp tự do và shadowing đa tình huống",
    category: "navigation",
    url: "/speaking",
    badge: "Thực hành",
    icon: Mic,
  },
  {
    id: "nav-vocab",
    title: "Sổ tay Từ vựng & Thẻ Flashcard",
    subtitle: "Ôn tập từ mới, lật thẻ 3D hai mặt kèm phát âm Tokyo",
    category: "navigation",
    url: "/vocabulary",
    badge: "Sổ tay",
    icon: BookOpen,
  },
  {
    id: "nav-leaderboard",
    title: "Bảng Vàng Xếp Hạng & Vinh Danh",
    subtitle: "Xem top học viên xuất sắc, bục vinh danh và đua điểm kinh nghiệm XP",
    category: "navigation",
    url: "/leaderboard",
    badge: "Bảng vàng",
    icon: Trophy,
  },
  {
    id: "nav-progress",
    title: "Tiến trình & Thống kê cá nhân",
    subtitle: "Báo cáo phát âm, điểm số phản xạ và lịch sử bài thực hành",
    category: "navigation",
    url: "/progress",
    badge: "Báo cáo",
    icon: TrendingUp,
  },
  {
    id: "nav-profile",
    title: "Trang cá nhân & Bảo mật",
    subtitle: "Chỉnh sửa thông tin, đặt mục tiêu JLPT và đổi mật khẩu",
    category: "navigation",
    url: "/profile",
    badge: "Hồ sơ",
    icon: User,
  },
  {
    id: "nav-premium",
    title: "Gói Hội viên JTalk Premium",
    subtitle: "Mở khóa vô hạn lượt luyện nói AI và kịch bản chuyên sâu",
    category: "navigation",
    url: "/checkout",
    badge: "Nâng cấp",
    icon: Sparkles,
  },

  // Video Lessons
  {
    id: "lesson-baito",
    title: "コンビニの接客用語 - Tiếng Nhật Làm thêm Konbini",
    subtitle: "Bài học Video Shadowing • 5 phút • JLPT N4",
    category: "lesson",
    url: "/courses/67890abcdef1234567890001",
    badge: "Video N4",
    icon: Video,
  },
  {
    id: "lesson-ramen",
    title: "ラーメン屋での注文 - Gọi món tại Quán Ramen Nhật Bản",
    subtitle: "Bài học Video Shadowing • 4 phút • JLPT N5",
    category: "lesson",
    url: "/courses/67890abcdef1234567890002",
    badge: "Video N5",
    icon: Video,
  },
  {
    id: "lesson-shinjuku",
    title: "新宿駅で乗り換え - Hỏi đường & Chuyển tàu Shinjuku",
    subtitle: "Bài học Video Shadowing • 3 phút • JLPT N5",
    category: "lesson",
    url: "/courses/67890abcdef1234567890003",
    badge: "Video N5",
    icon: Video,
  },
  {
    id: "lesson-keigo",
    title: "ビジネス敬語入門 - Kính ngữ Nhập môn Giao tiếp Công sở",
    subtitle: "Bài học Video Shadowing • 7 phút • JLPT N3",
    category: "lesson",
    url: "/courses/67890abcdef1234567890004",
    badge: "Video N3",
    icon: Video,
  },

  // Speaking Scenarios
  {
    id: "speak-intro",
    title: "新しいクラスでの自己紹介 - Tự giới thiệu bản thân",
    subtitle: "Kịch bản đối thoại phản xạ 6 lượt • JLPT N5",
    category: "speaking",
    url: "/speaking/topic/sc-1",
    badge: "Luyện nói N5",
    icon: Mic,
  },
  {
    id: "speak-daily",
    title: "毎日の生活と習慣 - Cuộc sống và thói quen hàng ngày",
    subtitle: "Kịch bản đối thoại phản xạ 6 lượt • JLPT N5",
    category: "speaking",
    url: "/speaking/topic/sc-2",
    badge: "Luyện nói N5",
    icon: Mic,
  },
  {
    id: "speak-izakaya",
    title: "居酒屋で飲み会・同僚と乾杯 - Nhậu nhẹt tại quán Izakaya",
    subtitle: "Kịch bản đối thoại phản xạ thực chiến • JLPT N4",
    category: "speaking",
    url: "/speaking/topic/sc-4",
    badge: "Luyện nói N4",
    icon: Mic,
  },
  {
    id: "speak-interview",
    title: "採用面接・自己PRと志望動機 - Phỏng vấn xin việc Baito / IT",
    subtitle: "Kịch bản phỏng vấn tuyển dụng chuyên sâu • JLPT N4",
    category: "speaking",
    url: "/speaking/topic/sc-6",
    badge: "Luyện nói N4",
    icon: Mic,
  },

  // Vocabulary
  {
    id: "voc-otsukare",
    title: "お疲れ様です (Otsukaresama desu)",
    subtitle: "Cảm ơn vì đã vất vả (Chào hỏi đồng nghiệp tan ca) • N4",
    category: "vocabulary",
    url: "/vocabulary",
    badge: "Từ vựng N4",
    icon: BookOpen,
  },
  {
    id: "voc-hajime",
    title: "初めまして (Hajimemashite)",
    subtitle: "Rất hân hạnh được gặp bạn lần đầu • N5",
    category: "vocabulary",
    url: "/vocabulary",
    badge: "Từ vựng N5",
    icon: BookOpen,
  },
  {
    id: "voc-enryo",
    title: "遠慮なく (Enryo naku)",
    subtitle: "Đừng ngại ngùng, cứ tự nhiên • N3",
    category: "vocabulary",
    url: "/vocabulary",
    badge: "Từ vựng N3",
    icon: BookOpen,
  },
];

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickSearchModal({ isOpen, onClose }: QuickSearchModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Combined items (including Admin portal if user is admin)
  const allItems = useMemo(() => {
    const list = [...STATIC_SEARCH_ITEMS];
    if (user?.role === "admin") {
      list.unshift({
        id: "nav-admin",
        title: "Cổng Quản trị Admin Portal",
        subtitle: "Quản lý bài giảng video, học viên, khóa học và thống kê",
        category: "navigation",
        url: "/admin",
        badge: "Admin",
        icon: ShieldCheck,
      });
    }
    return list;
  }, [user]);

  // Filtered results
  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      return allItems.slice(0, 8); // Top recommendations
    }
    const q = query.trim().toLowerCase();
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.badge?.toLowerCase().includes(q)
    );
  }, [allItems, query]);

  // Keyboard navigation inside dialog
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected) {
          navigate(selected.url);
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <Search className="w-5 h-5 text-rose-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Tìm bài giảng video, kịch bản hội thoại, từ vựng hoặc điều hướng nhanh..."
            className="w-full bg-transparent border-none pl-3 pr-8 text-sm sm:text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md">
              ESC
            </span>
          )}
        </div>

        {/* Search Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Search className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Không tìm thấy kết quả nào cho &quot;{query}&quot;
              </p>
              <p className="text-xs text-slate-400">
                Hãy thử tìm kiếm với các từ khóa khác như &quot;Konbini&quot;, &quot;Shinjuku&quot;, &quot;Keigo&quot; hoặc &quot;Luyện nói&quot;.
              </p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon || ChevronRight;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    navigate(item.url);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`group flex items-center justify-between p-3 sm:p-3.5 rounded-2xl cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? "bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100 border border-rose-200/80 dark:border-rose-900/60 shadow-xs"
                      : "hover:bg-slate-100/70 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "bg-rose-500 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-rose-500"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold truncate block">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span
                            className={`px-2 py-0.2 rounded-md text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                              isSelected
                                ? "bg-rose-200/80 dark:bg-rose-900 text-rose-800 dark:text-rose-200"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-4 h-4 shrink-0 ml-3 transition-transform ${
                      isSelected
                        ? "text-rose-500 translate-x-0.5 opacity-100"
                        : "text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100"
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/30 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">↑</kbd>{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">↓</kbd> Di chuyển
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">↵</kbd> Mở liên kết
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">ESC</kbd> Thoát
            </span>
          </div>

          <span className="font-semibold text-rose-500">JTalk AI Command Search</span>
        </div>
      </div>
    </div>
  );
}
