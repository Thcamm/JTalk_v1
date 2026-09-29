import PracticeRoomPage from "@/views/PracticeRoomPage";
import AuthGuard from "@/components/auth/AuthGuard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Luyện nói phản xạ AI - JTalk",
  description: "Phòng luyện nói phản xạ giao tiếp tiếng Nhật thông minh cùng AI gia sư.",
};

export default function Page() {
  return (
    <AuthGuard>
      <PracticeRoomPage />
    </AuthGuard>
  );
}
