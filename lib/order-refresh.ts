const ADMIN_ORDER_REFRESH_SIGNAL_KEY = "agrishrimp-admin-orders-refresh";

const canUseSessionStorage = () =>
  typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

export const markAdminOrdersRefreshNeeded = () => {
  if (!canUseSessionStorage()) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      ADMIN_ORDER_REFRESH_SIGNAL_KEY,
      String(Date.now()),
    );
  } catch {
    // ignore storage failures so order actions are not blocked
  }
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
