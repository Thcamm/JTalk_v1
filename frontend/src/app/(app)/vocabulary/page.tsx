import VocabularyNotebookPage from "@/views/VocabularyNotebookPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sổ tay Từ vựng & Thẻ Flashcard 3D - JTalk AI",
  description: "Lưu trữ từ vựng mới, ôn tập phản xạ với thẻ Flashcard 3D lật hai mặt kèm phát âm tiếng Nhật chuẩn.",
};

export default function Page() {
  return <VocabularyNotebookPage />;
}
