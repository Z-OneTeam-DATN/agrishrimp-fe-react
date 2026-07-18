"use client";

import { useEffect, useRef, useCallback } from "react";
import { Client, StompSubscription } from "@stomp/stompjs";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { useTypingStore } from "@/stores/useTypingStore";
import { ChatMessage, Notification } from "@/app/types/chat.types";
import { ChatService } from "@/app/services/chat.service";

// Use SOCKET_URL (no /api suffix) to build the correct ws-native endpoint
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8004";

function buildWsUrl(socketUrl: string) {
  const base = socketUrl.replace(/\/$/, "").replace(/^http:/, "ws:").replace(/^https:/, "wss:");
  return `${base}/ws-native`;
}

const MAX_RECONNECT_ATTEMPTS = 5;

export function useWebSocket() {
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<StompSubscription[]>([]);
  const { user, accessToken, isAuthenticated } = useAuthStore();
  const { addMessage, updateConversationLastMsg, addOrUpdateConversation, markConvRead } = useChatStore();
  const { addNotification } = useNotificationStore();
  const { setTyping } = useTypingStore();
  const roleSlug = (user as any)?.role?.slug as string | undefined;
  const isStaff = roleSlug && roleSlug !== "customer" && roleSlug !== "khach-hang";

  const disconnect = useCallback(() => {
    subscriptionsRef.current.forEach((s) => { try { s.unsubscribe(); } catch {} });
    subscriptionsRef.current = [];
    if (clientRef.current?.connected) {
      clientRef.current.deactivate();
    }
    clientRef.current = null;
  }, []);

  const attemptsRef = useRef(0);

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

    const client = new Client({
      brokerURL: buildWsUrl(SOCKET_URL),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 10000,
      onConnect: () => {
        attemptsRef.current = 0;
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

        subscriptionsRef.current = subs;
      },
      onDisconnect: () => {
        subscriptionsRef.current = [];
      },
      onWebSocketError: () => {
        attemptsRef.current += 1;
        if (attemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          client.deactivate();
        }
      },
      onStompError: (frame) => {
        attemptsRef.current += 1;
        if (attemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          client.deactivate();
        }
        console.warn("STOMP error", frame.headers?.message);
      },
    });

    clientRef.current = client;
    client.activate();
  }, [isAuthenticated, user?.id, accessToken, isStaff, addMessage, updateConversationLastMsg, addOrUpdateConversation, addNotification, setTyping, handleShopMessage, markConvRead]);

  useEffect(() => {
    connect();
    return () => { disconnect(); };
  }, [connect, disconnect]);

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
