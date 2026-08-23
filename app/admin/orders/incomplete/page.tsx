import OrderListEntryPage from "@/components/admin/orders/OrderListEntryPage";
import { INCOMPLETE_ORDER_QUICK_FILTERS } from "@/components/admin/orders/orderQuickFilters";

export default function IncompleteOrdersPage() {
  return (
    <OrderListEntryPage
      title="Đơn hàng chưa hoàn tất"
      subtitle="Bao gồm đơn chờ xử lý, đơn thiếu hàng, đơn đang thực hiện, đơn đã giao chưa hoàn tất và đơn đã hủy chưa khép tài chính."
      quickFilterGroups={INCOMPLETE_ORDER_QUICK_FILTERS}
      defaultQuickFilterId="all"
    />
  );
}
