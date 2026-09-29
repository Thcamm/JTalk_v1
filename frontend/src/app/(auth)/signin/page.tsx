import { Suspense } from "react";
import SignInPage from "@/views/SignInPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng nhập - JTalk AI Japanese Academy",
  description: "Đăng nhập tài khoản JTalk để tiếp tục luyện phản xạ tiếng Nhật cùng AI Sensei.",
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
      <SignInPage />
    </Suspense>
  );
}
