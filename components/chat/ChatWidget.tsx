"use client";

import dynamic from "next/dynamic";
import { MessageCircle, X } from "lucide-react";
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

      {/* FAB button */}
      <button
        onClick={toggleChat}
        aria-label="Mở chat với shop"
        className={`fixed bottom-36 right-4 md:bottom-24 md:right-6 z-50 w-13 h-13 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center ${
          isOpen
            ? "bg-gray-600 hover:bg-gray-700"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
        style={{ width: "52px", height: "52px" }}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-blue-400 opacity-30 animate-ping" />
        )}
      </button>
    </>
  );
}

