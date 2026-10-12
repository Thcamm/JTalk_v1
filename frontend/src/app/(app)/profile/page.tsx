import ProfilePage from "@/views/ProfilePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hồ sơ cá nhân & Tiến trình học tập - JTalk AI",
  description: "Xem hồ sơ học viên, chuỗi ngày Streak, tiến trình học tập, lịch sử luyện phản xạ và gói hội viên JTalk.",
};

export default function Page() {
  return <ProfilePage />;
}
