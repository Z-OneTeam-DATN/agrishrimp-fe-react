"use client";

import AdminOrderListPage, {
  type AdminOrderStatusGroup,
} from "@/components/admin/orders/AdminOrderListPage";
import AdminAccessDenied from "@/components/admin/shared/AdminAccessDenied";
import { usePermissions } from "@/hooks/usePermissions";
import { canUseBranchOrderRoutes } from "@/lib/order-routing";
import { P } from "@/lib/permissions";
import { useAuthStore } from "@/stores/useAuthStore";
import BranchOrderProcessingPage from "./page.codex";

const ORDER_PROCESSING_GROUPS: AdminOrderStatusGroup[] = [
  {
    id: "pending",
    label: "Chờ xác nhận",
    status: "PENDING,PENDING_AUTO_APPROVAL",
  },
  {
    id: "confirmed",
    label: "Đã xác nhận",
    status: "CONFIRMED",
  },
  {
    id: "processing",
    label: "Đang chuẩn bị",
    status: "PROCESSING",
  },
  {
    id: "ready-for-pickup",
    label: "Chờ bàn giao",
    status: "READY_FOR_PICKUP",
  },
  {
    id: "shipping",
    label: "Đang giao hàng",
    status: "SHIPPING",
  },
  {
    id: "completed",
    label: "Đã hoàn thành",
    status: "RECEIVED,COMPLETED",
  },
  {
    id: "shortage",
    label: "Đơn thiếu hàng",
    status:
      "AWAITING_REPLENISHMENT,PENDING_SHORTAGE_REVIEW,PENDING_TRANSFER",
  },
];

export default function OrderProcessingPage() {
  const { hasPermission } = usePermissions();
  const { user, warehouseId } = useAuthStore();
  const canViewSystemOrders = hasPermission(P.ORDER_VIEW_ALL_BRANCHES);
  const canViewOrderModule = hasPermission(P.ORDER_VIEW);
  const canUseBranchOrders = canUseBranchOrderRoutes(user, warehouseId);

  if (canViewSystemOrders) {
    return (
      <AdminOrderListPage
        title="Xử lý đơn hàng"
        subtitle="Gom các trạng thái cần xử lý theo từng bước vận hành để quản trị theo dõi nhanh hơn."
        statusGroups={ORDER_PROCESSING_GROUPS}
        defaultStatusGroupId="pending"
      />
    );
  }

  if (canViewOrderModule && canUseBranchOrders) {
    return <BranchOrderProcessingPage />;
  }

  if (canViewOrderModule) {
    return (
      <AdminAccessDenied
        compact
        title="Tài khoản chưa được gán chi nhánh"
        description="Bạn đã có quyền xem đơn hàng nhưng tài khoản này chưa được gán chi nhánh và cũng không có quyền xem tất cả chi nhánh."
      />
    );
  }

  return <AdminAccessDenied compact />;
}
