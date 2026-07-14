import AdminOrderListPage from "@/components/admin/orders/AdminOrderListPage";

export default function ReadyForPickupOrdersPage() {
  return (
    <AdminOrderListPage
      title="Chờ bàn giao"
      fixedStatus="READY_FOR_PICKUP"
    />
  );
}

