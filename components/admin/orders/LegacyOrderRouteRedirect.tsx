"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { canUseBranchOrderRoutes, resolveOrderRouteAccess } from "@/lib/order-routing";
import { P } from "@/lib/permissions";
import { useAuthStore } from "@/stores/useAuthStore";

export function LegacyOrderRouteRedirect({
  message = "MĂ n quáº£n lĂ½ Ä‘Æ¡n hĂ ng cÅ© Ä‘Ă£ Ä‘Æ°á»£c khĂ³a. Äang chuyá»ƒn sang luá»“ng má»›i...",
}: {
  message?: string;
}) {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const { user, isLoadingAuth, warehouseId } = useAuthStore();
  const canViewSystemOrders = hasPermission(P.ORDER_VIEW_ALL_BRANCHES);
  const canUseBranchOrders = canUseBranchOrderRoutes(user, warehouseId);
  const canViewOrderModule = hasPermission(P.ORDER_VIEW);
  const targetPath = useMemo(
    () => {
      if (!canViewSystemOrders && canViewOrderModule && !canUseBranchOrders) {
        return "/admin/orders-processing";
      }

      return resolveOrderRouteAccess({
        canViewSystemOrders,
        canUseBranchOrders,
      }).orderListPath;
    },
    [canUseBranchOrders, canViewOrderModule, canViewSystemOrders],
  );

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
