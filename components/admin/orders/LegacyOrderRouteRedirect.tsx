"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getOrderListPath } from "@/lib/order-routing";
import { useAuthStore } from "@/stores/useAuthStore";

export function LegacyOrderRouteRedirect({
  message = "Màn quản lý đơn hàng cũ đã được khóa. Đang chuyển sang luồng mới...",
}: {
  message?: string;
}) {
  const router = useRouter();
  const { user, isLoadingAuth } = useAuthStore();
  const targetPath = getOrderListPath(user);

  useEffect(() => {
    if (isLoadingAuth) {
      return;
    }

    router.replace(targetPath);
  }, [isLoadingAuth, router, targetPath]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-500">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      <p className="max-w-md text-center text-sm">{message}</p>
    </div>
  );
}
