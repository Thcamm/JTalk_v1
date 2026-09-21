import { useEffect } from "react";
import { BrowserRouter } from "react-router";
import { Toaster } from "sonner";
import AppRoutes from "./routes";
import { useAuthStore } from "./stores/useAuthStore";
import { useThemeStore } from "./stores/useThemeStore";

function App() {
  useEffect(() => {
    // Khởi tạo chế độ giao diện Dark / Light Mode
    useThemeStore.getState().initTheme();

    // Khôi phục phiên làm việc và đồng bộ hạn mức quota khi tải ứng dụng
    useAuthStore.getState().fetchMe().catch(() => {
      // Guest mode: Không có phiên đăng nhập, tiếp tục với hạn mức theo thiết bị
    });
  }, []);

  return (
    <>
      <Toaster richColors />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </>
  );
}

export default App;