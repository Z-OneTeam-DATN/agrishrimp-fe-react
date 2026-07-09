import { LegacyOrderRouteRedirect } from "@/components/admin/orders/LegacyOrderRouteRedirect";

export default function AdminOrderDetailPage() {
  return (
    <LegacyOrderRouteRedirect message="Chi tiết đơn hàng ở màn cũ đã được khóa. Đang chuyển sang danh sách đơn hàng theo luồng mới..." />
  );
}
