"use client";

import AdminAccessDenied from "@/components/admin/shared/AdminAccessDenied";
import { usePermissions } from "@/hooks/usePermissions";
import { canUseBranchOrderRoutes } from "@/lib/order-routing";
import { P } from "@/lib/permissions";
import { useAuthStore } from "@/stores/useAuthStore";
import AdminOrderListPage from "./AdminOrderListPage";
import BranchOrderListPage from "./BranchOrderListPage";
import type { OrderQuickFilterGroup, OrderQuickFilterId } from "./orderQuickFilters";

type OrderListEntryPageProps = {
  title: string;
  subtitle?: string;
  fixedStatusQuery?: string;
  layoutVariant?: "default" | "incomplete";
  quickFilterGroups?: OrderQuickFilterGroup[];
  defaultQuickFilterId?: OrderQuickFilterId;
};

export default function OrderListEntryPage({
  title,
  subtitle,
  fixedStatusQuery,
  layoutVariant = "default",
  quickFilterGroups,
  defaultQuickFilterId,
}: OrderListEntryPageProps) {
  const { hasPermission } = usePermissions();
  const { user, warehouseId } = useAuthStore();
  const canViewSystemOrders = hasPermission(P.ORDER_VIEW_ALL_BRANCHES);
  const canViewOrderModule = hasPermission(P.ORDER_VIEW);
  const canUseBranchOrders = canUseBranchOrderRoutes(user, warehouseId);

  if (canViewSystemOrders) {
    return (
      <AdminOrderListPage
        title={title}
        subtitle={subtitle}
        fixedStatusQuery={fixedStatusQuery}
        layoutVariant={layoutVariant}
        quickFilterGroups={quickFilterGroups}
        defaultQuickFilterId={defaultQuickFilterId}
      />
    );
  }

  if (canViewOrderModule && canUseBranchOrders) {
    return (
      <BranchOrderListPage
        title={title}
        subtitle={subtitle}
        fixedStatusQuery={fixedStatusQuery}
        quickFilterGroups={quickFilterGroups}
        defaultQuickFilterId={defaultQuickFilterId}
      />
    );
  }

  if (canViewOrderModule) {
    return (
      <AdminAccessDenied
        compact
        title="Tài khoản chưa được gán chi nhánh"
        description="Bạn đã có quyền xem đơn hàng nhưng tài khoản này chưa được gán chi nhánh và cũng không có quyền xem toàn hệ thống."
      />
    );
  }

  return <AdminAccessDenied compact />;
}
