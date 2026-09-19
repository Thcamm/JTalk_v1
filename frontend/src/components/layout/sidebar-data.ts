import {
  Home,
  Mic,
  GraduationCap,
  Settings,
  ChartNoAxesColumn
} from "lucide-react";

export const sidebarItems = [
  {
    icon: Home,
    text: "Trang chủ",
    to: "/",
  },
  {
    icon: Mic,
    text: "Luyện nói",
    to: "/speaking",
  },
  {
    icon: GraduationCap,
    text: "Khóa học",
    to: "/courses",
  },
  {
    icon: Settings,
    text: "Cài đặt",
    to: "/settings",
  },
  {
  icon: ChartNoAxesColumn,
  text: "Tiến trình",
  to: "/progress",
},
];