import OrderListEntryPage from "@/components/admin/orders/OrderListEntryPage";

export default function IncompleteOrdersPage() {
  return (
    <OrderListEntryPage
      title="Đơn hàng chưa hoàn tất"
      subtitle="Bao gồm đơn chờ thanh toán, thanh toán lỗi hoặc hết hạn, thanh toán một phần và đơn đã hủy."
      fixedStatusQuery="INCOMPLETE"
    />
  );
}
