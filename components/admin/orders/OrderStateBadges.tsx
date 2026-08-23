import { BranchOrder, MyOrder, OrderStatus } from "@/app/types/order.types";
import { parseLocalDateTime } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import { ORDER_LIST_BADGE_CLASS } from "./orderListStyles";

type BadgeTone = {
  label: string;
  styles: string;
};

type BadgeVariant = "default" | "monochrome" | "order-list-monochrome";

type DeliveryState =
  | "NOT_STARTED"
  | "PREPARING"
  | "WAITING_HANDOVER"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

const ORDER_WORKFLOW_STATUS_MAP: Record<string, BadgeTone> = {
  PENDING_PAYMENT: {
    label: "Chờ thanh toán",
    styles: "bg-[#fff7e6] text-[#fa8c16] border-[#ffe7ba]",
  },
  PENDING_AUTO_APPROVAL: {
    label: "Chờ tự xác nhận",
    styles: "bg-[#fff7e6] text-[#fa8c16] border-[#ffe7ba]",
  },
  PENDING_SHORTAGE_REVIEW: {
    label: "Chờ xử lý thiếu hàng",
    styles: "bg-rose-50 text-rose-600 border-rose-200",
  },
  PENDING_TRANSFER: {
    label: "Chờ điều chuyển",
    styles: "bg-orange-50 text-orange-600 border-orange-200",
  },
  AWAITING_REPLENISHMENT: {
    label: "Đơn thiếu hàng",
    styles: "bg-rose-50 text-rose-600 border-rose-200",
  },
  PENDING: {
    label: "Chờ xác nhận",
    styles: "bg-[#fff7e6] text-[#fa8c16] border-[#ffe7ba]",
  },
  AWAITING_PAYMENT: {
    label: "Chờ thanh toán",
    styles: "bg-[#fff7e6] text-[#fa8c16] border-[#ffe7ba]",
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    styles: "bg-[#e6f7ff] text-[#1890ff] border-[#91d5ff]",
  },
  PROCESSING: {
    label: "Đang chuẩn bị",
    styles: "bg-[#fffbe6] text-[#d4b106] border-[#ffe58f]",
  },
  READY_FOR_PICKUP: {
    label: "Chờ bàn giao",
    styles: "bg-teal-50 text-teal-700 border-teal-200",
  },
  SHIPPING: {
    label: "Đang giao hàng",
    styles: "bg-[#f9f0ff] text-[#722ed1] border-[#d3adf7]",
  },
  RECEIVED: {
    label: "Đã giao hàng",
    styles: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  COMPLETED: {
    label: "Hoàn thành",
    styles: "bg-[#f6ffed] text-[#52c41a] border-[#b7eb8f]",
  },
  CANCELLED: {
    label: "Đã hủy",
    styles: "bg-[#fff1f0] text-[#f5222d] border-[#ffa39e]",
  },
  RETURNED: {
    label: "Trả hàng",
    styles: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

const PAYMENT_STATUS_MAP: Record<string, BadgeTone> = {
  PAID: {
    label: "Đã thanh toán",
    styles: "bg-[#f6ffed] text-[#52c41a] border-[#b7eb8f]",
  },
  UNPAID: {
    label: "Chưa thanh toán",
    styles: "bg-[#fff7e6] text-[#fa8c16] border-[#ffe7ba]",
  },
  PARTIAL: {
    label: "Thanh toán một phần",
    styles: "bg-blue-50 text-blue-600 border-blue-200",
  },
  PENDING_TRANSFER_CONFIRMATION: {
    label: "Chờ xác nhận chuyển khoản",
    styles: "bg-violet-50 text-violet-700 border-violet-200",
  },
  REFUNDED: {
    label: "Đã hoàn tiền",
    styles: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

PAYMENT_STATUS_MAP.PENDING = PAYMENT_STATUS_MAP.UNPAID;
PAYMENT_STATUS_MAP.PARTIALLY_PAID = PAYMENT_STATUS_MAP.PARTIAL;
PAYMENT_STATUS_MAP.PENDING_VERIFICATION =
  PAYMENT_STATUS_MAP.PENDING_TRANSFER_CONFIRMATION;
PAYMENT_STATUS_MAP.FAILED = {
  label: "Thanh toán lỗi",
  styles: "bg-rose-50 text-rose-700 border-rose-200",
};
PAYMENT_STATUS_MAP.EXPIRED = {
  label: "Hết hạn thanh toán",
  styles: "bg-slate-100 text-slate-600 border-slate-200",
};
PAYMENT_STATUS_MAP.REFUND_PENDING = {
  label: "Chờ hoàn tiền",
  styles: "bg-slate-100 text-slate-600 border-slate-200",
};

const DELIVERY_STATUS_MAP: Record<DeliveryState, BadgeTone> = {
  NOT_STARTED: {
    label: "Chưa giao",
    styles: "bg-slate-100 text-slate-600 border-slate-200",
  },
  PREPARING: {
    label: "Đang chuẩn bị",
    styles: "bg-amber-50 text-amber-700 border-amber-200",
  },
  WAITING_HANDOVER: {
    label: "Chờ bàn giao",
    styles: "bg-teal-50 text-teal-700 border-teal-200",
  },
  IN_TRANSIT: {
    label: "Đang giao",
    styles: "bg-violet-50 text-violet-700 border-violet-200",
  },
  DELIVERED: {
    label: "Đã giao",
    styles: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  CANCELLED: {
    label: "Đã hủy",
    styles: "bg-rose-50 text-rose-700 border-rose-200",
  },
  RETURNED: {
    label: "Trả hàng",
    styles: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

const INVENTORY_STATUS_MAP: Record<"IN_STOCK" | "SHORTAGE", BadgeTone> = {
  IN_STOCK: {
    label: "Đủ hàng",
    styles: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  SHORTAGE: {
    label: "Thiếu hàng",
    styles: "bg-rose-50 text-rose-600 border-rose-200",
  },
};

const MONOCHROME_BADGE_STYLES =
  "w-[132px] justify-center border-blue-200 bg-white text-center text-blue-700";

const renderBadge = (
  tone: BadgeTone,
  variant: BadgeVariant = "default",
) => (
  <span
    className={cn(
      "inline-flex w-fit whitespace-nowrap items-center rounded-[10px] border px-2.5 py-0.5 text-[11px] font-medium",
      variant === "monochrome"
        ? MONOCHROME_BADGE_STYLES
        : variant === "order-list-monochrome"
          ? ORDER_LIST_BADGE_CLASS
          : tone.styles,
    )}
  >
    {tone.label}
  </span>
);

const normalizeWorkflowStatus = (status: OrderStatus | string) => {
  switch (status) {
    case "PENDING_PAYMENT":
      return "AWAITING_PAYMENT";
    case "PENDING_AUTO_APPROVAL":
      return "PENDING";
    case "PENDING_SHORTAGE_REVIEW":
    case "PENDING_TRANSFER":
      return "AWAITING_REPLENISHMENT";
    default:
      return status;
  }
};

export type OrderWorkflowAction = {
  label: string;
  nextStatus: Exclude<
    OrderStatus,
    | "PENDING_PAYMENT"
    | "PENDING_AUTO_APPROVAL"
    | "PENDING_SHORTAGE_REVIEW"
    | "PENDING_TRANSFER"
  >;
};

export const getOrderCode = (order: Pick<MyOrder, "orderCode" | "code">) =>
  order.orderCode ?? order.code;

export const getOrderBranchNames = (
  order: Pick<MyOrder, "branchName" | "subOrders">,
) => {
  const rawNames = [
    order.branchName,
    ...(order.subOrders ?? []).map((subOrder) => subOrder.branchName),
  ];

  return Array.from(
    new Set(
      rawNames
        .map((name) => name?.trim())
        .filter((name): name is string => Boolean(name)),
    ),
  );
};

export const getOrderBranchSummary = (
  order: Pick<MyOrder, "branchName" | "subOrders">,
) => {
  const names = getOrderBranchNames(order);

  if (names.length === 0) {
    return "Chưa gán chi nhánh";
  }

  if (names.length === 1) {
    return names[0];
  }

  return `${names[0]} +${names.length - 1} chi nhánh`;
};

export const getOrderMissingSkuCount = (
  order: Pick<MyOrder, "items" | "status">,
) => {
  const count = (order.items ?? []).filter(
    (item) => Number(item.missingQuantity ?? 0) > 0,
  ).length;
  const normalizedStatus = normalizeWorkflowStatus(order.status);

  return normalizedStatus === "AWAITING_REPLENISHMENT"
    ? Math.max(1, count)
    : count;
};

export const getOrderMissingUnitCount = (
  order: Pick<MyOrder, "items" | "status">,
) =>
  (order.items ?? []).reduce(
    (sum, item) => sum + Number(item.missingQuantity ?? 0),
    0,
  );

export const hasOrderShortage = (order: Pick<MyOrder, "items" | "status">) =>
  normalizeWorkflowStatus(order.status) === "AWAITING_REPLENISHMENT" ||
  (order.items ?? []).some((item) => Number(item.missingQuantity ?? 0) > 0);

const REPLENISHMENT_REQUESTABLE_STATUSES: OrderStatus[] = [
  "PENDING",
  "AWAITING_REPLENISHMENT",
];

const hasRequestableSubOrder = (order: Pick<MyOrder, "subOrders">) =>
  (order.subOrders ?? []).some((subOrder) =>
    subOrder?.status
      ? REPLENISHMENT_REQUESTABLE_STATUSES.includes(
          subOrder.status as OrderStatus,
        )
      : false,
  );

export const getOrderInventoryStatus = (
  order: Pick<MyOrder, "items" | "status">,
) => (hasOrderShortage(order) ? "SHORTAGE" : "IN_STOCK");

export const isReplenishmentWorkflowStatus = (status: OrderStatus | string) =>
  ["AWAITING_REPLENISHMENT", "PENDING_SHORTAGE_REVIEW"].includes(status);

export const canRequestReplenishmentAction = (
  order: Pick<MyOrder, "status" | "items" | "subOrders">,
) =>
  hasOrderShortage(order) &&
  ((order.subOrders?.length ?? 0) > 0
    ? hasRequestableSubOrder(order)
    : REPLENISHMENT_REQUESTABLE_STATUSES.includes(order.status));

export const canRequestBranchReplenishmentAction = (
  order: Pick<BranchOrder, "subOrderStatus" | "items">,
) =>
  REPLENISHMENT_REQUESTABLE_STATUSES.includes(order.subOrderStatus) &&
  (order.items ?? []).some((item) => Number(item.missingQuantity ?? 0) > 0);

export const matchesAdminOrderStatusFilter = (
  status: OrderStatus | string,
  filter: OrderStatus | "ALL",
) => filter === "ALL" || normalizeWorkflowStatus(status) === filter;

export const getNextOrderWorkflowAction = (
  order: Pick<MyOrder, "status" | "items">,
): OrderWorkflowAction | null => {
  if (hasOrderShortage(order)) {
    return null;
  }

  if (
    [
      "PENDING_PAYMENT",
      "PENDING_SHORTAGE_REVIEW",
      "PENDING_TRANSFER",
      "AWAITING_REPLENISHMENT",
      "AWAITING_PAYMENT",
    ].includes(order.status)
  ) {
    return null;
  }

  const status = normalizeWorkflowStatus(order.status);

  switch (status) {
    case "PENDING":
      return { label: "Xác nhận đơn", nextStatus: "CONFIRMED" };
    case "CONFIRMED":
      return { label: "Chuyển chuẩn bị", nextStatus: "PROCESSING" };
    case "PROCESSING":
      return { label: "Chờ bàn giao", nextStatus: "READY_FOR_PICKUP" };
    case "READY_FOR_PICKUP":
      return { label: "Chuyển giao hàng", nextStatus: "SHIPPING" };
    case "SHIPPING":
      return { label: "Xác nhận đã giao", nextStatus: "RECEIVED" };
    case "RECEIVED":
      return { label: "Hoàn thành đơn", nextStatus: "COMPLETED" };
    default:
      return null;
  }
};

export const getDeliveryStatusFromOrder = (
  status: OrderStatus | string,
): DeliveryState => {
  switch (normalizeWorkflowStatus(status)) {
    case "PROCESSING":
      return "PREPARING";
    case "READY_FOR_PICKUP":
      return "WAITING_HANDOVER";
    case "SHIPPING":
      return "IN_TRANSIT";
    case "RECEIVED":
    case "COMPLETED":
      return "DELIVERED";
    case "CANCELLED":
      return "CANCELLED";
    case "RETURNED":
      return "RETURNED";
    default:
      return "NOT_STARTED";
  }
};

export const isOrderProcessingOverdue = (
  order: Pick<MyOrder, "createdAt" | "status">,
  thresholdHours = 24,
) => {
  if (["RECEIVED", "COMPLETED", "CANCELLED", "RETURNED"].includes(order.status)) {
    return false;
  }

  const createdAt = parseLocalDateTime(order.createdAt).getTime();
  if (Number.isNaN(createdAt)) {
    return false;
  }

  return Date.now() - createdAt >= thresholdHours * 60 * 60 * 1000;
};

export const isOrderCreatedToday = (order: Pick<MyOrder, "createdAt">) => {
  const createdAt = parseLocalDateTime(order.createdAt);
  if (Number.isNaN(createdAt.getTime())) {
    return false;
  }

  const now = new Date();
  return (
    createdAt.getDate() === now.getDate() &&
    createdAt.getMonth() === now.getMonth() &&
    createdAt.getFullYear() === now.getFullYear()
  );
};

export const getOrderRevenueValue = (
  order: Pick<MyOrder, "finalAmount" | "totalAmount">,
) => Number(order.finalAmount ?? order.totalAmount ?? 0);

export const canApprovePackedAndShip = (order: MyOrder, detail?: MyOrder) => {
  const orderDetail = detail ?? order;
  const hasActiveSubOrders =
    (orderDetail.subOrders ?? []).filter(
      (subOrder) => !["CANCELLED", "RETURNED"].includes(subOrder.status),
    ).length > 0;
  const status = normalizeWorkflowStatus(order.status);

  return !hasActiveSubOrders && status === "READY_FOR_PICKUP";
};

export function OrderWorkflowBadge({
  status,
  variant = "default",
}: {
  status: OrderStatus | string;
  variant?: BadgeVariant;
}) {
  const tone =
    ORDER_WORKFLOW_STATUS_MAP[status] ??
    ORDER_WORKFLOW_STATUS_MAP[normalizeWorkflowStatus(status)] ?? {
      label: status,
      styles: "bg-slate-100 text-slate-600 border-slate-200",
    };

  return renderBadge(tone, variant);
}

export function PaymentStatusBadge({
  status,
  variant = "default",
}: {
  status: string;
  variant?: BadgeVariant;
}) {
  const tone = PAYMENT_STATUS_MAP[status] ?? {
    label: status,
    styles: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return renderBadge(tone, variant);
}

export function DeliveryStatusBadge({
  status,
  variant = "default",
}: {
  status: OrderStatus | string;
  variant?: BadgeVariant;
}) {
  return renderBadge(
    DELIVERY_STATUS_MAP[getDeliveryStatusFromOrder(status)],
    variant,
  );
}

export function InventoryStatusBadge({
  order,
  variant = "default",
}: {
  order: Pick<MyOrder, "items" | "status">;
  variant?: BadgeVariant;
}) {
  return renderBadge(
    INVENTORY_STATUS_MAP[getOrderInventoryStatus(order)],
    variant,
  );
}
