import AdminOrderListPage from "@/components/admin/orders/AdminOrderListPage";

export default function IncompleteOrdersPage() {
  return (
    <AdminOrderListPage
      title="Đơn hàng chưa hoàn tất"
      subtitle="Bao gồm đơn chờ thanh toán, thanh toán lỗi hoặc hết hạn, thanh toán một phần và đơn đã hủy."
      fixedStatusQuery="INCOMPLETE"
    />
  );
}
