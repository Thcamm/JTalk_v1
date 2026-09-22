import {
  Home,
  Mic,
  GraduationCap,
  ChartNoAxesColumn,
  User,
  Sparkles,
} from "lucide-react";

export const sidebarItems = [
  {
    icon: Home,
    text: "Trang chủ",
    to: "/",
  },
  {
    icon: GraduationCap,
    text: "Khóa học",
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
    text: "Gói Premium 99k",
    to: "/checkout",
    highlight: true,
  },
];
