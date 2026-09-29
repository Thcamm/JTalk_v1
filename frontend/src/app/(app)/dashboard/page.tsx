import DashboardPage from "@/views/DashboardPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bảng điều khiển học tập - JTalk AI",
  description: "Theo dõi tiến độ học tiếng Nhật, điểm danh hằng ngày và bài học gợi ý.",
};

export default function Page() {
  return <DashboardPage />;
}
