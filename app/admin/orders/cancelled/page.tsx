import AdminOrderListPage from "@/components/admin/orders/AdminOrderListPage";

export default function CancelledOrdersPage() {
  return (
    <AdminOrderListPage title="Đã hủy" fixedStatus="CANCELLED" />
  );
}

