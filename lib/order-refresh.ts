const ADMIN_ORDER_REFRESH_SIGNAL_KEY = "agrishrimp-admin-orders-refresh";
export const ORDER_REFRESH_EVENT = "agrishrimp:orders-refresh";

export type OrderRefreshScope = "all" | "admin" | "branch";

export type OrderRefreshDetail = {
  signal: number;
  scope?: OrderRefreshScope;
  orderId?: number | null;
  branchIds?: number[];
  eventType?: string;
  occurredAt?: string;
  reason?: string;
};

const canUseSessionStorage = () =>
  typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

const dispatchOrderRefreshEvent = (detail: OrderRefreshDetail) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<OrderRefreshDetail>(ORDER_REFRESH_EVENT, {
      detail,
    }),
  );
};

export const markOrderRefreshNeeded = (
  detail: Omit<OrderRefreshDetail, "signal"> = {},
) => {
  if (!canUseSessionStorage()) {
    return;
  }

  try {
    const signal = Date.now();
    window.sessionStorage.setItem(
      ADMIN_ORDER_REFRESH_SIGNAL_KEY,
      String(signal),
    );
    dispatchOrderRefreshEvent({
      signal,
      scope: detail.scope ?? "all",
      orderId: detail.orderId ?? null,
      branchIds: detail.branchIds ?? [],
      eventType: detail.eventType,
      occurredAt: detail.occurredAt,
      reason: detail.reason,
    });
  } catch {
    // ignore storage failures so order actions are not blocked
  }
};

export const markAdminOrdersRefreshNeeded = (
  detail: Omit<OrderRefreshDetail, "signal"> = {},
) => {
  markOrderRefreshNeeded(detail);
};

export const readAdminOrdersRefreshSignal = () => {
  if (!canUseSessionStorage()) {
    return 0;
  }

  try {
    return Number(window.sessionStorage.getItem(ADMIN_ORDER_REFRESH_SIGNAL_KEY) ?? 0) || 0;
  } catch {
    return 0;
  }
};

export const subscribeToOrderRefresh = (
  listener: (detail: OrderRefreshDetail) => void,
) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = (event: Event) => {
    listener((event as CustomEvent<OrderRefreshDetail>).detail);
  };

  window.addEventListener(ORDER_REFRESH_EVENT, handler as EventListener);

  return () => {
    window.removeEventListener(ORDER_REFRESH_EVENT, handler as EventListener);
  };
};
