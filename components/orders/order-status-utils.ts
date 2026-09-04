import { MyOrder } from "@/app/types/order.types";
import { parseLocalDateTime } from "@/lib/dateUtils";

const CUSTOMER_CONFIRM_RECEIVED_WINDOW_HOURS = 72;
const CUSTOMER_CANCEL_WINDOW_MINUTES = 5;

export type UserOrderStage =
  | "PENDING"
  | "READY_FOR_PICKUP"
  | "SHIPPING"
  | "COMPLETED"
  | "RETURNED"
  | "CANCELLED";

export type UserOrderFilter = "ALL" | UserOrderStage;

type CustomerOrderStageSource = Pick<
  MyOrder,
  "status" | "statusUpdatedAt" | "canConfirmReceived"
>;

type CustomerOrderCancelSource = Pick<
  MyOrder,
  "status" | "createdAt" | "canCancel"
>;

export const USER_ORDER_TABS: Array<{ label: string; value: UserOrderFilter }> =
  [
    { label: "Tất cả", value: "ALL" },
    { label: "Chờ xác nhận", value: "PENDING" },
    { label: "Chờ lấy hàng", value: "READY_FOR_PICKUP" },
    { label: "Chờ giao hàng", value: "SHIPPING" },
    { label: "Đã giao", value: "COMPLETED" },
    { label: "Trả hàng", value: "RETURNED" },
    { label: "Đã hủy", value: "CANCELLED" },
  ];

export function canCustomerConfirmReceivedAction(
  order: CustomerOrderStageSource,
): boolean {
  if (typeof order.canConfirmReceived === "boolean") {
    return order.canConfirmReceived;
  }

  if (order.status !== "SHIPPING" && order.status !== "COMPLETED") {
    return false;
  }

  if (!order.statusUpdatedAt) {
    return true;
  }

  const statusUpdatedAt = parseLocalDateTime(order.statusUpdatedAt);
  if (Number.isNaN(statusUpdatedAt.getTime())) {
    return true;
  }

  return (
    Date.now() - statusUpdatedAt.getTime() <=
    CUSTOMER_CONFIRM_RECEIVED_WINDOW_HOURS * 60 * 60 * 1000
  );
}

export function getCustomerCancelDeadlineMs(
  order: CustomerOrderCancelSource,
): number | null {
  const createdAt = parseLocalDateTime(order.createdAt);
  if (Number.isNaN(createdAt.getTime())) {
    return null;
  }

  return (
    createdAt.getTime() +
    CUSTOMER_CANCEL_WINDOW_MINUTES * 60 * 1000
  );
}

export function getCustomerCancelRemainingMs(
  order: CustomerOrderCancelSource,
  now: number = Date.now(),
): number | null {
  const deadlineMs = getCustomerCancelDeadlineMs(order);
  if (deadlineMs == null) {
    return null;
  }

  return Math.max(0, deadlineMs - now);
}

export function canCustomerCancelAction(
  order: CustomerOrderCancelSource,
  now: number = Date.now(),
): boolean {
  const hasBackendFlag = typeof order.canCancel === "boolean";
  if (hasBackendFlag && !order.canCancel) {
    return false;
  }

  if (
    !hasBackendFlag &&
    !["PENDING_PAYMENT", "PENDING_AUTO_APPROVAL", "AWAITING_PAYMENT", "PENDING"].includes(
      order.status,
    )
  ) {
    return false;
  }

  const remainingMs = getCustomerCancelRemainingMs(order, now);
  return remainingMs == null ? Boolean(order.canCancel ?? true) : remainingMs > 0;
}

export function getUserOrderStage(order: CustomerOrderStageSource): UserOrderStage {
  const { status } = order;

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

  if (status === "COMPLETED") {
    return canCustomerConfirmReceivedAction(order)
      ? "SHIPPING"
      : "COMPLETED";
  }

  if (status === "RECEIVED") {
    return "COMPLETED";
  }

  if (status === "RETURNED") {
    return "RETURNED";
  }

  return "CANCELLED";
}

export function matchesUserOrderFilter(
  order: CustomerOrderStageSource,
  filter: UserOrderFilter,
): boolean {
  if (filter === "ALL") {
    return true;
  }

  return getUserOrderStage(order) === filter;
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

export function isCustomerOrderDelivered(order: CustomerOrderStageSource) {
  return getUserOrderStage(order) === "COMPLETED";
}
