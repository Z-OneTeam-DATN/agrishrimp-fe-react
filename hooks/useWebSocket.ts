"use client";

import { useEffect, useRef, useCallback } from "react";
import { Client, StompSubscription } from "@stomp/stompjs";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { useTypingStore } from "@/stores/useTypingStore";
import { ChatMessage, Notification } from "@/app/types/chat.types";
import { OrderRealtimeEvent } from "@/app/types/order.types";
import { ChatService } from "@/app/services/chat.service";
import { usePermissions } from "@/hooks/usePermissions";
import {
  ORDER_REALTIME_HEARTBEAT_MS,
  logOrderRealtimeDebug,
} from "@/lib/order-realtime";
import { canUseBranchOrderRoutes } from "@/lib/order-routing";
import { markOrderRefreshNeeded } from "@/lib/order-refresh";
import { P } from "@/lib/permissions";
import { normalizeRoleSlug } from "@/lib/roles";
import { useOrderRealtimeStore } from "@/stores/useOrderRealtimeStore";

// Use SOCKET_URL (no /api suffix) to build the correct ws-native endpoint
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8004";

function buildWsUrl(socketUrl: string) {
  const base = socketUrl.replace(/\/$/, "").replace(/^http:/, "ws:").replace(/^https:/, "wss:");
  return `${base}/ws-native`;
}

export function useWebSocket() {
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<StompSubscription[]>([]);
  const orderRefreshTimerRef = useRef<number | null>(null);
  const { user, accessToken, isAuthenticated, warehouseId } = useAuthStore();
  const { hasPermission } = usePermissions();
  const { addMessage, updateConversationLastMsg, addOrUpdateConversation, markConvRead } = useChatStore();
  const { addNotification } = useNotificationStore();
  const { setTyping } = useTypingStore();
  const roleSlug = normalizeRoleSlug((user as any)?.role);
  const isStaff = Boolean(roleSlug && roleSlug !== "CUSTOMER");
  const canViewSystemOrders = hasPermission(P.ORDER_VIEW_ALL_BRANCHES);
  const canUseBranchOrders =
    hasPermission(P.ORDER_VIEW) &&
    canUseBranchOrderRoutes(user, warehouseId) &&
    !canViewSystemOrders;
  const branchRealtimeScopeId = user?.branch?.id ?? warehouseId ?? null;
  const {
    markConnecting: markOrderRealtimeConnecting,
    markConnected: markOrderRealtimeConnected,
    markReconnecting: markOrderRealtimeReconnecting,
    markDisconnected: markOrderRealtimeDisconnected,
    markHeartbeatReceived: markOrderRealtimeHeartbeatReceived,
    markOrderEventReceived: markOrderRealtimeEventReceived,
    reset: resetOrderRealtimeState,
  } = useOrderRealtimeStore((state) => ({
    markConnecting: state.markConnecting,
    markConnected: state.markConnected,
    markReconnecting: state.markReconnecting,
    markDisconnected: state.markDisconnected,
    markHeartbeatReceived: state.markHeartbeatReceived,
    markOrderEventReceived: state.markOrderEventReceived,
    reset: state.reset,
  }));

  const getOrderRealtimeTopics = useCallback(() => {
    if (canViewSystemOrders) {
      return ["/topic/orders/all"];
    }

    if (canUseBranchOrders && branchRealtimeScopeId) {
      return [`/topic/orders/branch/${branchRealtimeScopeId}`];
    }

    return [];
  }, [branchRealtimeScopeId, canUseBranchOrders, canViewSystemOrders]);

  const disconnect = useCallback(() => {
    subscriptionsRef.current.forEach((s) => { try { s.unsubscribe(); } catch {} });
    subscriptionsRef.current = [];
    if (orderRefreshTimerRef.current !== null) {
      window.clearTimeout(orderRefreshTimerRef.current);
      orderRefreshTimerRef.current = null;
    }
    if (clientRef.current) {
      clientRef.current.deactivate();
    }
    clientRef.current = null;
    resetOrderRealtimeState();
  }, [resetOrderRealtimeState]);

  const attemptsRef = useRef(0);

  const queueOrderRefresh = useCallback((event: OrderRealtimeEvent) => {
    if (typeof window === "undefined") {
      return;
    }

    if (orderRefreshTimerRef.current !== null) {
      window.clearTimeout(orderRefreshTimerRef.current);
    }

    orderRefreshTimerRef.current = window.setTimeout(() => {
      markOrderRefreshNeeded({
        scope: canViewSystemOrders ? "admin" : "branch",
        orderId: event.orderId,
        branchIds: event.branchIds ?? [],
        eventType: event.eventType,
        occurredAt: event.occurredAt ?? undefined,
        reason: "websocket",
      });
      orderRefreshTimerRef.current = null;
    }, 250);
  }, [canViewSystemOrders]);

  /**
   * Handle an incoming shop message (from /topic/shop-messages):
   * 1. Add the message to the messages map
   * 2. Update conversation's lastMessage + lastMessageAt + unreadByShop
   * 3. If conversation is not yet in the store (brand-new customer), fetch it and add it
   */
  const handleShopMessage = useCallback(async (msg: ChatMessage) => {
    addMessage(msg);
    const activeId = useChatStore.getState().activeConversationId;
    if (activeId === msg.conversationId) {
      ChatService.markAsRead(msg.conversationId).catch(() => {});
    }
    const convExists = useChatStore.getState().conversations.some((c) => c.id === msg.conversationId);
    if (convExists) {
      updateConversationLastMsg(msg.conversationId, msg);
    } else {
      // New conversation: fetch full details and add to store
      try {
        const conv = await ChatService.getConversationById(msg.conversationId);
        addOrUpdateConversation(conv);
      } catch {
        // Fallback: still show message preview with minimal data
        updateConversationLastMsg(msg.conversationId, msg);
      }
    }
  }, [addMessage, updateConversationLastMsg, addOrUpdateConversation]);

  const connect = useCallback(() => {
    if (!isAuthenticated || !user?.id || !accessToken) return;
    if (clientRef.current?.connected) return;

    attemptsRef.current = 0;
    const orderTopics = getOrderRealtimeTopics();
    markOrderRealtimeConnecting(orderTopics);
    logOrderRealtimeDebug("Opening order WebSocket connection", {
      brokerURL: buildWsUrl(SOCKET_URL),
      orderTopics,
      userId: user.id,
    });

    const client = new Client({
      brokerURL: buildWsUrl(SOCKET_URL),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 10000,
      heartbeatIncoming: ORDER_REALTIME_HEARTBEAT_MS,
      heartbeatOutgoing: ORDER_REALTIME_HEARTBEAT_MS,
      onConnect: () => {
        attemptsRef.current = 0;
        markOrderRealtimeConnected(orderTopics);
        logOrderRealtimeDebug("Order WebSocket connected", {
          orderTopics,
          userId: user.id,
        });
        const msgSub = client.subscribe(
          `/user/queue/messages`,
          (frame) => {
            try {
              const payload = JSON.parse(frame.body);
              // READ_RECEIPT: admin read our messages → update isRead state
              if (payload.type === "READ_RECEIPT") {
                markConvRead(payload.conversationId as number, false); // false = not customer read
                return;
              }
              const msg: ChatMessage = payload as ChatMessage;

              // Deduplicate: skip WS echo if this message (by real id) is already
              // in the store — happens when the HTTP response commits before WS push.
              const alreadyInStore = (useChatStore.getState().messages[msg.conversationId] ?? [])
                .some((m) => m.id === msg.id && m.id > 0);
              if (alreadyInStore) return;

              addMessage(msg);
              
              const activeId = useChatStore.getState().activeConversationId;
              if (activeId === msg.conversationId) {
                ChatService.markAsRead(msg.conversationId).catch(() => {});
              }
              
              updateConversationLastMsg(msg.conversationId, msg);
            } catch {}
          }
        );

        const notifSub = client.subscribe(
          `/user/queue/notifications`,
          (frame) => {
            try {
              const notif: Notification = JSON.parse(frame.body);
              addNotification(notif);
            } catch {}
          }
        );

        // Typing: customer receives staff typing events
        const typingSub = client.subscribe(
          `/user/queue/typing`,
          (frame) => {
            try {
              const { conversationId, senderId } = JSON.parse(frame.body);
              if (senderId && senderId !== user?.id) {
                setTyping(conversationId);
              }
            } catch {}
          }
        );

        const subs = [msgSub, notifSub, typingSub];

        // Shop staff: broadcast message + typing channels
        if (isStaff) {
          const shopSub = client.subscribe("/topic/shop-messages", (frame) => {
            try {
              const msg: ChatMessage = JSON.parse(frame.body);
              void handleShopMessage(msg);
            } catch {}
          });
          const shopTypingSub = client.subscribe("/topic/shop-typing", (frame) => {
            try {
              const { conversationId, senderId } = JSON.parse(frame.body);
              if (senderId && senderId !== user?.id) {
                setTyping(conversationId);
              }
            } catch {}
          });
          const shopViewersSub = client.subscribe("/topic/shop-viewers", (frame) => {
            try {
              const { conversationId, viewers } = JSON.parse(frame.body);
              useChatStore.getState().setViewers(conversationId, viewers);
            } catch {}
          });
          subs.push(shopSub, shopTypingSub, shopViewersSub);
        }

        if (canViewSystemOrders) {
          const orderSub = client.subscribe("/topic/orders/all", (frame) => {
            try {
              const event: OrderRealtimeEvent = JSON.parse(frame.body);
              if (event?.orderId) {
                markOrderRealtimeEventReceived(event);
                logOrderRealtimeDebug("Received system order realtime event", {
                  eventType: event.eventType,
                  orderId: event.orderId,
                  orderCode: event.orderCode ?? undefined,
                  branchIds: event.branchIds ?? [],
                });
                queueOrderRefresh(event);
              }
            } catch {}
          });
          subs.push(orderSub);
        } else if (canUseBranchOrders && branchRealtimeScopeId) {
          const branchOrderSub = client.subscribe(
            `/topic/orders/branch/${branchRealtimeScopeId}`,
            (frame) => {
              try {
                const event: OrderRealtimeEvent = JSON.parse(frame.body);
                if (event?.orderId) {
                  markOrderRealtimeEventReceived(event);
                  logOrderRealtimeDebug("Received branch order realtime event", {
                    eventType: event.eventType,
                    orderId: event.orderId,
                    orderCode: event.orderCode ?? undefined,
                    branchIds: event.branchIds ?? [],
                  });
                  queueOrderRefresh(event);
                }
              } catch {}
            },
          );
          subs.push(branchOrderSub);
        }

        subscriptionsRef.current = subs;
      },
      onHeartbeatReceived: () => {
        markOrderRealtimeHeartbeatReceived();
      },
      onHeartbeatLost: () => {
        markOrderRealtimeReconnecting(orderTopics);
        logOrderRealtimeDebug("Order WebSocket heartbeat lost", {
          orderTopics,
          userId: user.id,
        });
      },
      onDisconnect: () => {
        subscriptionsRef.current = [];
        markOrderRealtimeDisconnected(orderTopics);
        logOrderRealtimeDebug("Order WebSocket disconnected", {
          orderTopics,
          userId: user.id,
        });
      },
      onWebSocketClose: (event) => {
        subscriptionsRef.current = [];
        markOrderRealtimeReconnecting(orderTopics);
        logOrderRealtimeDebug("Order WebSocket closed", {
          code: event.code,
          reason: event.reason || "unknown",
          orderTopics,
          userId: user.id,
        });
      },
      onWebSocketError: () => {
        attemptsRef.current += 1;
        markOrderRealtimeReconnecting(orderTopics);
        logOrderRealtimeDebug("Order WebSocket error", {
          attempts: attemptsRef.current,
          orderTopics,
          userId: user.id,
        });
      },
      onStompError: (frame) => {
        attemptsRef.current += 1;
        markOrderRealtimeReconnecting(orderTopics);
        console.warn("STOMP error", frame.headers?.message);
        logOrderRealtimeDebug("Order STOMP error", {
          message: frame.headers?.message ?? "unknown",
          attempts: attemptsRef.current,
          orderTopics,
          userId: user.id,
        });
      },
    });

    clientRef.current = client;
    client.activate();
  }, [isAuthenticated, user?.id, accessToken, isStaff, addMessage, updateConversationLastMsg, addOrUpdateConversation, addNotification, setTyping, handleShopMessage, markConvRead, canUseBranchOrders, canViewSystemOrders, branchRealtimeScopeId, queueOrderRefresh, getOrderRealtimeTopics, markOrderRealtimeConnecting, markOrderRealtimeConnected, markOrderRealtimeReconnecting, markOrderRealtimeDisconnected, markOrderRealtimeHeartbeatReceived, markOrderRealtimeEventReceived, user?.id]);

  useEffect(() => {
    connect();
    return () => { disconnect(); };
  }, [connect, disconnect]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id || !accessToken) {
      resetOrderRealtimeState();
    }
  }, [accessToken, isAuthenticated, resetOrderRealtimeState, user?.id]);

  const sendMessage = useCallback((destination: string, body: any) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({ destination, body: JSON.stringify(body) });
    }
  }, []);

  const { setSendWsMessage } = useChatStore();
  useEffect(() => {
    setSendWsMessage(sendMessage);
    return () => setSendWsMessage(null);
  }, [sendMessage, setSendWsMessage]);

  return { sendMessage, client: clientRef.current };
}
