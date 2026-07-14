import { OrderStatus } from "@/app/types/order.types";

export type AdminOrderPageStatus = Exclude<OrderStatus, "RETURNED">;

export type AdminOrderStatusPage = {
  slug: string;
  status: AdminOrderPageStatus;
  label: string;
};

export const ADMIN_ORDER_STATUS_PAGES = [
  {
    slug: "pending",
    status: "PENDING",
    label: "Chờ xác nhận",
  },
  {
    slug: "awaiting-payment",
    status: "AWAITING_PAYMENT",
    label: "Chờ thanh toán",
  },
  {
    slug: "awaiting-replenishment",
    status: "AWAITING_REPLENISHMENT",
    label: "Đơn thiếu hàng",
  },
  {
    slug: "confirmed",
    status: "CONFIRMED",
    label: "Đã xác nhận",
  },
  {
    slug: "processing",
    status: "PROCESSING",
    label: "Đang chuẩn bị",
  },
  {
    slug: "ready-for-pickup",
    status: "READY_FOR_PICKUP",
    label: "Chờ bàn giao",
  },
  {
    slug: "shipping",
    status: "SHIPPING",
    label: "Đang giao hàng",
  },
  {
    slug: "received",
    status: "RECEIVED",
    label: "Đã giao hàng",
  },
  {
    slug: "completed",
    status: "COMPLETED",
    label: "Hoàn thành",
  },
  {
    slug: "cancelled",
    status: "CANCELLED",
    label: "Đã hủy",
  },
] as const satisfies readonly AdminOrderStatusPage[];

export type AdminOrderStatusSlug =
  (typeof ADMIN_ORDER_STATUS_PAGES)[number]["slug"];

export const getAdminOrderStatusHref = (slug: AdminOrderStatusSlug) =>
  `/admin/orders/${slug}`;
