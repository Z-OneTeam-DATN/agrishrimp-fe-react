"use client";

export type OrderRealtimeConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export const ORDER_REALTIME_HEARTBEAT_MS = 10000;
export const ORDER_REALTIME_POLL_INTERVAL_MS = 8000;
export const ORDER_REALTIME_STALE_AFTER_MS = 25000;

type RealtimeHealthSnapshot = {
  connectionState: OrderRealtimeConnectionState;
  lastConnectedAt?: number | null;
  lastHeartbeatAt?: number | null;
  lastOrderEventAt?: number | null;
};

export const isOrderRealtimeFallbackActive = (
  snapshot: RealtimeHealthSnapshot,
  staleAfterMs: number = ORDER_REALTIME_STALE_AFTER_MS,
) => {
  if (
    snapshot.connectionState === "connecting" ||
    snapshot.connectionState === "reconnecting" ||
    snapshot.connectionState === "disconnected"
  ) {
    return true;
  }

  if (snapshot.connectionState !== "connected") {
    return false;
  }

  const lastHealthyAt = Math.max(
    snapshot.lastHeartbeatAt ?? 0,
    snapshot.lastOrderEventAt ?? 0,
    snapshot.lastConnectedAt ?? 0,
  );

  return lastHealthyAt > 0 && Date.now() - lastHealthyAt > staleAfterMs;
};

export const logOrderRealtimeDebug = (
  message: string,
  payload?: Record<string, unknown>,
) => {
  if (process.env.NODE_ENV === "production" || typeof console === "undefined") {
    return;
  }

  if (payload) {
    console.info("[order-realtime]", message, payload);
    return;
  }

  console.info("[order-realtime]", message);
};
