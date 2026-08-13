import AdminOrderListPage, {
  type AdminOrderStatusGroup,
} from "@/components/admin/orders/AdminOrderListPage";

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
  return (
    <AdminOrderListPage
      title="Xử lý đơn hàng"
      subtitle="Gom các trạng thái cần xử lý theo từng bước vận hành để quản trị theo dõi nhanh hơn."
      statusGroups={ORDER_PROCESSING_GROUPS}
      defaultStatusGroupId="pending"
    />
  );
}
