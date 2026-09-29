import CheckoutPage from "@/views/CheckoutPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nâng cấp Premium - JTalk AI",
  description: "Mở khóa vô hạn lượt luyện nói phản xạ tiếng Nhật và truy cập toàn bộ kịch bản giao tiếp thực chiến.",
};

export default function Page() {
  return <CheckoutPage />;
}
