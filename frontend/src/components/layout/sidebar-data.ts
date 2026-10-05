import {
  Home,
  Mic,
  Video,
  ChartNoAxesColumn,
  User,
  Sparkles,
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
    icon: ChartNoAxesColumn,
    text: "Tiến trình & Thống kê",
    to: "/progress",
  },
  {
    icon: User,
    text: "Trang cá nhân",
    to: "/profile",
  },
  {
    icon: Sparkles,
    text: "Gói Premium",
    to: "/checkout",
    highlight: true,
  },
];
