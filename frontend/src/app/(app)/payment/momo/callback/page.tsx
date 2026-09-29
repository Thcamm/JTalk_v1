import { Suspense } from "react";
import MoMoCallbackPage from "@/views/MoMoCallbackPage";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <LoadingSpinner size="lg" label="Đang xác thực kết quả thanh toán..." />
        </div>
      }
    >
      <MoMoCallbackPage />
    </Suspense>
  );
}
