"use client";

import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { accessToken, fetchMe, refresh } = useAuthStore();
  const [starting, setStarting] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const state = useAuthStore.getState();
      if (!state.accessToken) {
        try {
          await refresh();
          await fetchMe();
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
  }, [refresh, fetchMe]);

  useEffect(() => {
    if (!starting && !accessToken) {
      router.replace("/signin");
    }
  }, [starting, accessToken, router]);

  if (starting) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-[#0b0f17]">
        <LoadingSpinner size="lg" label="Đang kiểm tra phiên làm việc..." />
      </div>
    );
  }

  if (!accessToken) {
    return null;
  }

  return <>{children}</>;
}
