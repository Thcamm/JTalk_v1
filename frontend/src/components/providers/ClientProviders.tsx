"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";
import { useThemeStore } from "@/stores/useThemeStore";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Khởi tạo chế độ giao diện Dark / Light Mode
    useThemeStore.getState().initTheme();

    // Khôi phục phiên làm việc êm dịu (silent session restore) nếu người dùng đã đăng nhập trước đó
    useAuthStore.getState().initSession();
  }, []);

  return (
    <>
      <Toaster richColors position="top-right" />
      {children}
    </>
  );
}
