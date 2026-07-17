"use client";

import dynamic from "next/dynamic";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePathname } from "next/navigation";

const ChatWindow = dynamic(() => import("./ChatWindow"), { ssr: false });
const ChatUnreadBanner = dynamic(() => import("./ChatUnreadBanner"), { ssr: false });

export default function ChatWidget() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();

  // Hide on admin/auth/ai-doctor pages
  if (
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/advisor") ||
    pathname?.startsWith("/chat") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/ai-doctor")
  ) {
    return null;
  }

  // Only show for authenticated users
  if (!isAuthenticated) return null;

  return (
    <>
      <ChatUnreadBanner />
      <ChatWindow />
    </>
  );
}
