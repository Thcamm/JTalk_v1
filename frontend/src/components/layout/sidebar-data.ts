import {
  Home,
  Mic,
  Video,
  BookOpen,
  Trophy,
  User,
} from "lucide-react";

export const sidebarItems = [
  {
    icon: Home,
    text: "Trang chủ",
    to: "/dashboard",
  },
  {
    icon: Video,
    text: "Thư viện Video",
    to: "/courses",
  },
  {
    icon: Mic,
    text: "Luyện nói AI",
    to: "/speaking",
  },
  {
    icon: BookOpen,
    text: "Sổ tay Từ vựng",
    to: "/vocabulary",
  },
  {
    icon: Trophy,
    text: "Bảng xếp hạng",
    to: "/leaderboard",
  },
  {
    icon: User,
    text: "Hồ sơ & Tiến trình",
    to: "/profile",
  },
];
