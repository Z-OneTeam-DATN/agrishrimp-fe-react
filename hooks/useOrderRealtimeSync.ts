"use client";

import { MutableRefObject, useCallback, useEffect, useRef } from "react";
import {
  ORDER_REALTIME_POLL_INTERVAL_MS,
  ORDER_REALTIME_STALE_AFTER_MS,
  isOrderRealtimeFallbackActive,
} from "@/lib/order-realtime";
import {
  readAdminOrdersRefreshSignal,
  subscribeToOrderRefresh,
} from "@/lib/order-refresh";
import { useOrderRealtimeStore } from "@/stores/useOrderRealtimeStore";

type UseOrderRealtimeSyncOptions = {
  enabled: boolean;
  lastRefreshSignalRef: MutableRefObject<number>;
  onBackgroundRefresh: () => void | Promise<void>;
  pollIntervalMs?: number;
  staleAfterMs?: number;
};

export function useOrderRealtimeSync({
  enabled,
  lastRefreshSignalRef,
  onBackgroundRefresh,
  pollIntervalMs = ORDER_REALTIME_POLL_INTERVAL_MS,
  staleAfterMs = ORDER_REALTIME_STALE_AFTER_MS,
}: UseOrderRealtimeSyncOptions) {
  const lastFallbackRefreshAtRef = useRef(0);

  const shouldUseFallbackPolling = useCallback(() => {
    const state = useOrderRealtimeStore.getState();
    return isOrderRealtimeFallbackActive(
      {
        connectionState: state.connectionState,
        lastConnectedAt: state.lastConnectedAt,
        lastHeartbeatAt: state.lastHeartbeatAt,
        lastOrderEventAt: state.lastOrderEventAt,
      },
      staleAfterMs,
    );
  }, [staleAfterMs]);

  const runBackgroundRefresh = useCallback(() => {
    void onBackgroundRefresh();
  }, [onBackgroundRefresh]);

  const triggerFallbackRefresh = useCallback(() => {
    if (!enabled || typeof document === "undefined") {
      return;
    }

    if (document.visibilityState !== "visible" || !shouldUseFallbackPolling()) {
      return;
    }

    const now = Date.now();
    if (now - lastFallbackRefreshAtRef.current < pollIntervalMs - 250) {
      return;
    }

    lastFallbackRefreshAtRef.current = now;
    runBackgroundRefresh();
  }, [enabled, pollIntervalMs, runBackgroundRefresh, shouldUseFallbackPolling]);

  const refreshIfNeeded = useCallback(() => {
    const nextSignal = readAdminOrdersRefreshSignal();
    if (nextSignal > lastRefreshSignalRef.current) {
      lastRefreshSignalRef.current = nextSignal;
      runBackgroundRefresh();
      return;
    }

    triggerFallbackRefresh();
  }, [lastRefreshSignalRef, runBackgroundRefresh, triggerFallbackRefresh]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshIfNeeded();
      }
    };

    const unsubscribe = subscribeToOrderRefresh(() => {
      refreshIfNeeded();
    });

    window.addEventListener("focus", refreshIfNeeded);
    window.addEventListener("pageshow", refreshIfNeeded);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      unsubscribe();
      window.removeEventListener("focus", refreshIfNeeded);
      window.removeEventListener("pageshow", refreshIfNeeded);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, refreshIfNeeded]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    triggerFallbackRefresh();

    const intervalId = window.setInterval(() => {
      triggerFallbackRefresh();
    }, pollIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled, pollIntervalMs, triggerFallbackRefresh]);
}
