import SpeakingPage from "@/views/SpeakingPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Luyện nói tiếng Nhật cùng AI - JTalk AI",
  description: "Luyện giao tiếp tiếng Nhật cùng AI Sensei chuẩn giọng Tokyo theo các tình huống thực tế.",
};

export default function Page() {
  return <SpeakingPage />;
}
