import CourseVideoStudyPage from "@/views/CourseVideoStudyPage";
import AuthGuard from "@/components/auth/AuthGuard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bài học Video & Shadowing - JTalk",
  description: "Học tiếng Nhật qua bài giảng video tương tác, luyện nghe ngấm và shadowing chuẩn phát âm.",
};

export default function Page() {
  return (
    <AuthGuard>
      <CourseVideoStudyPage />
    </AuthGuard>
  );
}
