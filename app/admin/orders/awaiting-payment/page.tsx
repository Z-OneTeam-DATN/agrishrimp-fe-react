import AdminOrderListPage from "@/components/admin/orders/AdminOrderListPage";

export default function AwaitingPaymentOrdersPage() {
  return (
    <AdminOrderListPage
      title="Chờ thanh toán"
      fixedStatus="AWAITING_PAYMENT"
    />
  );
}

