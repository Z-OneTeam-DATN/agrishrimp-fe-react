"use client";

import { useEffect, useRef, useCallback } from "react";
import { Client, StompSubscription } from "@stomp/stompjs";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { useTypingStore } from "@/stores/useTypingStore";
import { ChatMessage, Notification } from "@/app/types/chat.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8004";

function buildWsUrl(apiUrl: string) {
  const base = apiUrl.replace(/^http/, "ws").replace(/^https/, "wss");
  return `${base}/ws-native`;
}

export function useWebSocket() {
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<StompSubscription[]>([]);
  const { user, accessToken, isAuthenticated } = useAuthStore();
  const { addMessage, updateConversationLastMsg } = useChatStore();
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

  const connect = useCallback(() => {
    if (!isAuthenticated || !user?.id || !accessToken) return;
    if (clientRef.current?.connected) return;

    const client = new Client({
      brokerURL: buildWsUrl(API_URL),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,
      onConnect: () => {
        const msgSub = client.subscribe(
          `/user/${user.id}/queue/messages`,
          (frame) => {
            try {
              const msg: ChatMessage = JSON.parse(frame.body);
              addMessage(msg);
              updateConversationLastMsg(msg.conversationId, msg);
            } catch {}
          }
        );

        const notifSub = client.subscribe(
          `/user/${user.id}/queue/notifications`,
          (frame) => {
            try {
              const notif: Notification = JSON.parse(frame.body);
              addNotification(notif);
            } catch {}
          }
        );

        // Typing: customer receives staff typing events
        const typingSub = client.subscribe(
          `/user/${user.id}/queue/typing`,
          (frame) => {
            try {
              const { conversationId } = JSON.parse(frame.body);
              setTyping(conversationId);
            } catch {}
          }
        );

        const subs = [msgSub, notifSub, typingSub];

        // Shop staff: broadcast message + typing channels
        if (isStaff) {
          const shopSub = client.subscribe("/topic/shop-messages", (frame) => {
            try {
              const msg: ChatMessage = JSON.parse(frame.body);
              addMessage(msg);
              updateConversationLastMsg(msg.conversationId, msg);
            } catch {}
          });
          const shopTypingSub = client.subscribe("/topic/shop-typing", (frame) => {
            try {
              const { conversationId } = JSON.parse(frame.body);
              setTyping(conversationId);
            } catch {}
          });
          subs.push(shopSub, shopTypingSub);
        }

        subscriptionsRef.current = subs;
      },
      onDisconnect: () => {
        subscriptionsRef.current = [];
      },
      onStompError: (frame) => {
        console.warn("STOMP error", frame.headers?.message);
      },
    });

    clientRef.current = client;
    client.activate();
  }, [isAuthenticated, user?.id, accessToken, isStaff, addMessage, updateConversationLastMsg, addNotification, setTyping]);

  useEffect(() => {
    connect();
    return () => { disconnect(); };
  }, [connect, disconnect]);

  const sendMessage = useCallback((destination: string, body: object) => {
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
