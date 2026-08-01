import { OrderStatus } from "@/app/types/order.types";

export type UserOrderStage =
  | "PENDING"
  | "READY_FOR_PICKUP"
  | "SHIPPING"
  | "COMPLETED"
  | "RETURNED"
  | "CANCELLED";

export type UserOrderFilter = "ALL" | UserOrderStage;

export const USER_ORDER_TABS: Array<{ label: string; value: UserOrderFilter }> = [
  { label: "Tất cả", value: "ALL" },
  { label: "Chờ xác nhận", value: "PENDING" },
  { label: "Chờ lấy hàng", value: "READY_FOR_PICKUP" },
  { label: "Chờ giao hàng", value: "SHIPPING" },
  { label: "Đã giao", value: "COMPLETED" },
  { label: "Trả hàng", value: "RETURNED" },
  { label: "Đã hủy", value: "CANCELLED" },
];

export function getUserOrderStage(status: OrderStatus): UserOrderStage {
  if (
    status === "PENDING_PAYMENT" ||
    status === "PENDING_AUTO_APPROVAL" ||
    status === "AWAITING_PAYMENT" ||
    status === "PENDING"
  ) {
    return "PENDING";
  }

  if (
    status === "PENDING_SHORTAGE_REVIEW" ||
    status === "PENDING_TRANSFER" ||
    status === "AWAITING_REPLENISHMENT" ||
    status === "CONFIRMED" ||
    status === "PROCESSING" ||
    status === "READY_FOR_PICKUP"
  ) {
    return "READY_FOR_PICKUP";
  }

  if (status === "SHIPPING") {
    return "SHIPPING";
  }

  if (status === "RECEIVED" || status === "COMPLETED") {
    return "COMPLETED";
  }

  if (status === "RETURNED") {
    return "RETURNED";
  }

  return "CANCELLED";
}

export function matchesUserOrderFilter(
  status: OrderStatus,
  filter: UserOrderFilter,
): boolean {
  if (filter === "ALL") {
    return true;
  }

  return getUserOrderStage(status) === filter;
}

export function normalizeUserOrderFilter(
  value?: string | null,
): UserOrderFilter {
  if (!value || value === "ALL") {
    return "ALL";
  }

  if (
    value === "PENDING_PAYMENT" ||
    value === "PENDING_AUTO_APPROVAL" ||
    value === "AWAITING_PAYMENT" ||
    value === "PENDING"
  ) {
    return "PENDING";
  }

  if (
    value === "PENDING_SHORTAGE_REVIEW" ||
    value === "PENDING_TRANSFER" ||
    value === "AWAITING_REPLENISHMENT" ||
    value === "CONFIRMED" ||
    value === "PROCESSING" ||
    value === "READY_FOR_PICKUP"
  ) {
    return "READY_FOR_PICKUP";
  }

  if (value === "SHIPPING") {
    return "SHIPPING";
  }

  if (value === "RECEIVED" || value === "COMPLETED") {
    return "COMPLETED";
  }

  if (value === "RETURNED") {
    return "RETURNED";
  }

  if (value === "CANCELLED") {
    return "CANCELLED";
  }

  return "ALL";
}
