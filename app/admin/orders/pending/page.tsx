import AdminOrderListPage from "@/components/admin/orders/AdminOrderListPage";

export default function PendingOrdersPage() {
  return (
    <AdminOrderListPage title="Chờ xác nhận" fixedStatus="PENDING" />
  );
}

