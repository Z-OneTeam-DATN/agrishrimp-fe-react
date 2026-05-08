"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import { useAuthStore } from "@/stores/useAuthStore";

type StompContextValue = {
  client: Client | null;
  connected: boolean;
};

const StompContext = createContext<StompContextValue>({ client: null, connected: false });

export function useStompClient() {
  return useContext(StompContext);
}

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 10_000;

function buildBrokerUrl(): string {
  const base = process.env.NEXT_PUBLIC_SOCKET_URL ?? "";
  const wsBase = base.replace(/^https:\/\//, "wss://").replace(/^http:\/\//, "ws://");
  return `${wsBase.replace(/\/$/, "")}/ws-native`;
}

export default function StompProvider({ children }: { children: React.ReactNode }) {
  const clientRef = useRef<Client | null>(null);
  const attemptsRef = useRef(0);
  const [connected, setConnected] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    // Only connect when the user is authenticated
    if (!accessToken) {
      clientRef.current?.deactivate();
      clientRef.current = null;
      setConnected(false);
      return;
    }

    const brokerURL = buildBrokerUrl();
    if (!brokerURL || brokerURL === "/ws-native") return;

    attemptsRef.current = 0;

    const client = new Client({
      brokerURL,
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: RECONNECT_DELAY_MS,
      onConnect: () => {
        attemptsRef.current = 0;
        setConnected(true);
      },
      onDisconnect: () => {
        setConnected(false);
      },
      onWebSocketError: () => {
        attemptsRef.current += 1;
        if (attemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          client.deactivate();
        }
      },
      onStompError: () => {
        attemptsRef.current += 1;
        if (attemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          client.deactivate();
        }
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
  }, [accessToken]);

  return (
    <StompContext.Provider value={{ client: clientRef.current, connected }}>
      {children}
    </StompContext.Provider>
  );
}
