"use client";

import dynamic from "next/dynamic";
import { MessageCircle } from "lucide-react";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePathname } from "next/navigation";

const ChatWindow = dynamic(() => import("./ChatWindow"), { ssr: false });
const ChatUnreadBanner = dynamic(() => import("./ChatUnreadBanner"), { ssr: false });

export default function ChatWidget() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const { isOpen, toggleChat } = useChatStore();

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

      {/* FAB button — only show when chat is closed */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          aria-label="Mở chat với shop"
          className="fixed bottom-36 right-4 md:bottom-24 md:right-6 z-50 rounded-full bg-blue-500 hover:bg-blue-600 shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
          style={{ width: "52px", height: "52px" }}
        >
          <MessageCircle className="w-6 h-6 text-white" />
          <span className="absolute inset-0 rounded-full bg-blue-400 opacity-30 animate-ping" />
        </button>
      )}
    </>
  );
}

