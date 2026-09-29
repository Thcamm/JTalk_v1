import ProfilePage from "@/views/ProfilePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hồ sơ cá nhân & Thống kê - JTalk AI",
  description: "Xem hồ sơ học viên, chuỗi ngày Streak, lịch sử luyện nói và gói hội viên JTalk.",
};

export default function Page() {
  return <ProfilePage />;
}
