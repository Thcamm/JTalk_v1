import SignUpPage from "@/views/SignUpPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng ký tài khoản - JTalk AI Japanese Academy",
  description: "Tạo tài khoản JTalk miễn phí để trải nghiệm luyện nói phản xạ tiếng Nhật chuẩn Tokyo.",
};

export default function Page() {
  return <SignUpPage />;
}
