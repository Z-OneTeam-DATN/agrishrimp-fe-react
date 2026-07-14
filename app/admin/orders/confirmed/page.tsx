import AdminOrderListPage from "@/components/admin/orders/AdminOrderListPage";

export default function ConfirmedOrdersPage() {
  return (
    <AdminOrderListPage title="Đã xác nhận" fixedStatus="CONFIRMED" />
  );
}

