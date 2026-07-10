"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { apiJava } from "@/lib/axios";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function getAuthHeader() {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useWebPush() {
  const { isAuthenticated, isLoadingAuth, accessToken, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || isLoadingAuth || !accessToken || !user?.id) return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const controller = new AbortController();
    let cancelled = false;

    const register = async () => {
      try {
        // Fetch VAPID public key
        const { data } = await apiJava.get<{ publicKey: string }>("/v1/notifications/vapid-public-key", {
          headers: getAuthHeader(),
          signal: controller.signal,
        });
        if (cancelled) return;
        if (!data.publicKey || data.publicKey.trim() === "") return;

        const reg = await navigator.serviceWorker.register("/sw.js");
        if (cancelled) return;
        await navigator.serviceWorker.ready;
        if (cancelled) return;

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          await sendSubscriptionToServer(existing);
          return;
        }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(data.publicKey),
        });

        await sendSubscriptionToServer(sub);
      } catch (e) {
        // Silently fail — Web Push is optional
      }
    };

    register();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [accessToken, isAuthenticated, isLoadingAuth, user?.id]);
}

async function sendSubscriptionToServer(sub: PushSubscription) {
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;
  try {
    const token = localStorage.getItem("accessToken");
    await apiJava.post(
      "/v1/notifications/subscribe",
      { endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth },
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
  } catch {}
}
