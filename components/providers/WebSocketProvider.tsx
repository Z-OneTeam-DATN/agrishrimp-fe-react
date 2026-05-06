"use client";

import { useWebSocket } from "@/hooks/useWebSocket";
import { useWebPush } from "@/hooks/useWebPush";

export default function WebSocketProvider() {
  useWebSocket();
  useWebPush();
  return null;
}
