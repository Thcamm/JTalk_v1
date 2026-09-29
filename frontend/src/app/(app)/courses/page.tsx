import CoursePage from "@/views/CoursePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Khóa học tiếng Nhật giao tiếp - JTalk AI",
  description: "Danh sách các khóa học Shadowing video, Kính ngữ Sambon Juku, và Hội thoại Kaiwa từ N5 đến N1.",
};

export default function Page() {
  return <CoursePage />;
}
