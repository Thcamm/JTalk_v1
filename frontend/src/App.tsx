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

    // Khôi phục phiên làm việc êm dịu nếu đã đăng nhập trước đó
    useAuthStore.getState().initSession();
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