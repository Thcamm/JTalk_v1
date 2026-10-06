import LeaderboardView from "@/views/LeaderboardView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bảng Xếp Hạng & Vinh Danh - JTalk AI",
  description: "Bảng vàng vinh danh top học viên luyện nói phản xạ xuất sắc nhất JTalk AI.",
};

export default function LeaderboardPage() {
  return <LeaderboardView />;
}
