import { LegacyOrderRouteRedirect } from "@/components/admin/orders/LegacyOrderRouteRedirect";

export default function AdminOrderCreatePage() {
  return (
    <LegacyOrderRouteRedirect message="Tạo đơn bằng màn quản trị cũ đã được khóa. Đang chuyển sang luồng đơn hàng mới..." />
  );
}
