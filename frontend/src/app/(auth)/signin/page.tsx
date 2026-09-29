import SignInPage from "@/views/SignInPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng nhập - JTalk AI Japanese Academy",
  description: "Đăng nhập tài khoản JTalk để tiếp tục luyện phản xạ tiếng Nhật cùng AI Sensei.",
};

export default function Page() {
  return <SignInPage />;
}
