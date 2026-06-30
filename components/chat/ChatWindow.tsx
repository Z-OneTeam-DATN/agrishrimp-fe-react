"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Send, X, Minimize2, MessageCircle, Loader2, ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTypingStore } from "@/stores/useTypingStore";
import { ChatService } from "@/app/services/chat.service";
import { toast } from "sonner";
import MessageBubble, { TypingBubble } from "./MessageBubble";

export default function ChatWindow() {
  const { user } = useAuthStore();
  const {
    isOpen, closeChat,
    activeConversationId, setActiveConversation,
    messages, setMessages, addMessage,
    sendWsMessage,
  } = useChatStore();
  const { typingByConv } = useTypingStore();

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingConv, setIsLoadingConv] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const convMessages = activeConversationId ? (messages[activeConversationId] ?? []) : [];

  // Keep a ref so the effect can read the latest value without triggering re-runs
  const convIdRef = useRef<number | null>(activeConversationId);
  useEffect(() => { convIdRef.current = activeConversationId; }, [activeConversationId]);

  // Stale-while-revalidate: show cached messages instantly, refresh silently in background
  useEffect(() => {
    if (!isOpen || !user?.id) return;
    let cancelled = false;

    const init = async () => {
      let convId = convIdRef.current;

      // Resolve conversation if not yet known
      if (!convId) {
        try {
          const conv = await ChatService.getMyConversation();
          if (cancelled) return;
          setActiveConversation(conv.id);
          convId = conv.id;
        } catch {
          if (!cancelled) toast.error("Không thể kết nối tới chat");
          return;
        }
      }

      // Only show spinner when there is no cached data at all
      const hasCached = (useChatStore.getState().messages[convId]?.length ?? 0) > 0;
      if (!hasCached) setIsLoadingConv(true);

      try {
        const msgs = await ChatService.getMessages(convId);
        if (!cancelled) setMessages(convId, msgs);
      } catch {
        if (!hasCached && !cancelled) toast.error("Không thể tải tin nhắn");
      } finally {
        if (!cancelled) setIsLoadingConv(false);
      }
    };

    init();
    return () => { cancelled = true; };
  }, [isOpen, user?.id, setActiveConversation, setMessages]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convMessages.length]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !activeConversationId || isSending) return;

    setInput("");
    setIsSending(true);
    try {
      const msg = await ChatService.sendMessage(activeConversationId, text);
      addMessage(msg);
    } catch {
      toast.error("Gửi tin nhắn thất bại");
      setInput(text);
    } finally {
      setIsSending(false);
    }
  }, [input, activeConversationId, isSending, addMessage]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversationId) return;
    e.target.value = "";
    setIsSending(true);
    try {
      const msg = await ChatService.sendImage(activeConversationId, file);
      addMessage(msg);
    } catch {
      toast.error("Gửi ảnh thất bại");
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!activeConversationId || !sendWsMessage || typingThrottleRef.current) return;
    sendWsMessage("/app/chat.typing", { conversationId: activeConversationId });
    typingThrottleRef.current = setTimeout(() => {
      typingThrottleRef.current = null;
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-blue-600 dark:bg-blue-700">
        <div className="relative">
          <Avatar className="w-9 h-9">
            <AvatarImage src="/images/logo_arishrimp.jpg" alt="Shop" />
            <AvatarFallback className="bg-white text-blue-600 text-sm font-bold">AS</AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-blue-400 rounded-full border-2 border-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">AgriShrimp Shop</p>
          <p className="text-xs text-blue-100">Thường trả lời trong vài phút</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized((v) => !v)}
            className="text-blue-100 hover:text-white p-1 rounded-lg hover:bg-blue-500/50 transition-colors"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={closeChat}
            className="text-blue-100 hover:text-white p-1 rounded-lg hover:bg-blue-500/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages area */}
          <div className="flex-1 h-[380px] overflow-y-auto px-4 py-3 flex flex-col gap-3 bg-gray-50 dark:bg-slate-800/50">
            {isLoadingConv ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            ) : convMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                <MessageCircle className="w-10 h-10 opacity-30" />
                <p className="text-sm">Bắt đầu cuộc trò chuyện</p>
                <p className="text-xs">Chúng tôi luôn sẵn sàng hỗ trợ bạn!</p>
              </div>
            ) : (
              convMessages.map((msg, index) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.senderId === user?.id}
                  isLast={index === convMessages.length - 1}
                />
              ))
            )}
            {activeConversationId && typingByConv[activeConversationId] && (
              <TypingBubble name="Shop" />
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="px-3 py-3 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending}
              className="text-gray-400 hover:text-blue-500 disabled:opacity-40 transition-colors shrink-0"
              title="Gửi ảnh"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn..."
              className="flex-1 bg-gray-100 dark:bg-slate-700 text-sm rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-400 dark:text-gray-100 placeholder-gray-400"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              className="w-9 h-9 rounded-full bg-blue-500 hover:bg-blue-600 disabled:opacity-40 flex items-center justify-center transition-colors"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

