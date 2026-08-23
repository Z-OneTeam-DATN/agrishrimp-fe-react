import { create } from "zustand";
import { OrderRealtimeEvent } from "@/app/types/order.types";
import { OrderRealtimeConnectionState } from "@/lib/order-realtime";

type OrderRealtimeStore = {
  connectionState: OrderRealtimeConnectionState;
  subscribedTopics: string[];
  lastConnectedAt: number | null;
  lastDisconnectedAt: number | null;
  lastHeartbeatAt: number | null;
  lastOrderEventAt: number | null;
  lastTransportActivityAt: number | null;
  lastEventType: string | null;
  lastOrderId: number | null;
  markConnecting: (topics?: string[]) => void;
  markConnected: (topics?: string[]) => void;
  markReconnecting: (topics?: string[]) => void;
  markDisconnected: (topics?: string[]) => void;
  markHeartbeatReceived: () => void;
  markOrderEventReceived: (event: OrderRealtimeEvent) => void;
  reset: () => void;
};

const now = () => Date.now();

const INITIAL_STATE = {
  connectionState: "idle" as OrderRealtimeConnectionState,
  subscribedTopics: [] as string[],
  lastConnectedAt: null,
  lastDisconnectedAt: null,
  lastHeartbeatAt: null,
  lastOrderEventAt: null,
  lastTransportActivityAt: null,
  lastEventType: null,
  lastOrderId: null,
};

export const useOrderRealtimeStore = create<OrderRealtimeStore>((set) => ({
  ...INITIAL_STATE,

  markConnecting: (topics = []) =>
    set((state) => ({
      connectionState:
        state.connectionState === "connected" ||
        state.connectionState === "reconnecting"
          ? "reconnecting"
          : "connecting",
      subscribedTopics: topics,
      lastTransportActivityAt: now(),
    })),

  markConnected: (topics = []) =>
    set({
      connectionState: "connected",
      subscribedTopics: topics,
      lastConnectedAt: now(),
      lastHeartbeatAt: now(),
      lastTransportActivityAt: now(),
    }),

  markReconnecting: (topics = []) =>
    set({
      connectionState: "reconnecting",
      subscribedTopics: topics,
      lastTransportActivityAt: now(),
    }),

  markDisconnected: (topics = []) =>
    set({
      connectionState: "disconnected",
      subscribedTopics: topics,
      lastDisconnectedAt: now(),
      lastTransportActivityAt: now(),
    }),

  markHeartbeatReceived: () =>
    set({
      connectionState: "connected",
      lastHeartbeatAt: now(),
      lastTransportActivityAt: now(),
    }),

  markOrderEventReceived: (event) =>
    set({
      connectionState: "connected",
      lastOrderEventAt: now(),
      lastTransportActivityAt: now(),
      lastEventType: event.eventType ?? null,
      lastOrderId: event.orderId ?? null,
    }),

  reset: () => set(INITIAL_STATE),
}));
