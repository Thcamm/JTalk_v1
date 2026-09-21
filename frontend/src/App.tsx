import { useEffect } from "react";
import { BrowserRouter } from "react-router";
import { Toaster } from "sonner";
import AppRoutes from "./routes";
import { useAuthStore } from "./stores/useAuthStore";

function App() {
  useEffect(() => {
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