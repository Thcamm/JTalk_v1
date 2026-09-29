import ProgressPage from "@/views/ProgressPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tiến trình & Thống kê học tập - JTalk AI",
  description: "Biểu đồ thời gian luyện tập 7 ngày, tổng số phút học và tiến độ hoàn thành các khóa học.",
};

export default function Page() {
  return <ProgressPage />;
}
