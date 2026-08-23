export type OrderQuickFilterId = "all" | "shortage" | "unpaid" | "cancelled";

export type OrderQuickFilterGroup = {
  id: OrderQuickFilterId;
  label: string;
  description: string;
  statusQuery?: string;
};

export const INCOMPLETE_ORDER_QUICK_FILTERS: OrderQuickFilterGroup[] = [
  {
    id: "all",
    label: "Tất cả chưa hoàn tất",
    description: "Đơn còn mở về vận hành hoặc tài chính",
    statusQuery: "INCOMPLETE",
  },
  {
    id: "shortage",
    label: "Thiếu hàng",
    description: "Đơn thiếu hàng hoặc đang chờ bổ sung",
    statusQuery: "INCOMPLETE_SHORTAGE",
  },
  {
    id: "unpaid",
    label: "Chưa thanh toán",
    description: "Đơn chưa khép thanh toán",
    statusQuery: "INCOMPLETE_UNPAID",
  },
  {
    id: "cancelled",
    label: "Đã hủy",
    description: "Đơn đã hủy nhưng chưa khép tài chính",
    statusQuery: "INCOMPLETE_CANCELLED",
  },
];
