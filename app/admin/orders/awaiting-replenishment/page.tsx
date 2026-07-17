import AdminOrderListPage from "@/components/admin/orders/AdminOrderListPage";

export default function AwaitingReplenishmentOrdersPage() {
  return (
    <AdminOrderListPage
      title="Đơn thiếu hàng"
      fixedStatus="AWAITING_REPLENISHMENT"
    />
  );
}
