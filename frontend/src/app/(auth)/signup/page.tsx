import { Suspense } from "react";
import SignUpPage from "@/views/SignUpPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng ký tài khoản - JTalk AI Japanese Academy",
  description: "Tạo tài khoản JTalk miễn phí để trải nghiệm luyện nói phản xạ tiếng Nhật chuẩn Tokyo.",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b0f17]">
          <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SignUpPage />
    </Suspense>
  );
}
