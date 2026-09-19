import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";

const ProtectedRoute = () => {
  const { accessToken, refresh } = useAuthStore();
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const state = useAuthStore.getState();
      if (!state.accessToken) {
        try {
          await refresh();
        } catch {
          // session unavailable
        }
      }
      if (isMounted) {
        setStarting(false);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [refresh]);

  if (starting) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground font-medium">
        Đang tải trang...
      </div>
    );
  }

  if (!accessToken) {
    return (
      <Navigate
        to="/signin"
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
