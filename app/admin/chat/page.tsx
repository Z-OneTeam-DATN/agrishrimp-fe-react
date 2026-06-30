"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Pin, Send, Loader2, MessageCircle, Users, ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatService, CannedResponseService, CannedResponse } from "@/app/services/chat.service";
import { EmployeeService } from "@/app/services/employee.service";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTypingStore } from "@/stores/useTypingStore";
import { Conversation } from "@/app/types/chat.types";
import { UserResponse } from "@/app/types/employee.schema";
import ConversationSidebar from "@/components/chat/ConversationSidebar";
import MessageBubble, { TypingBubble } from "@/components/chat/MessageBubble";
import PinProductModal from "@/components/chat/PinProductModal";
import { toast } from "sonner";

export default function AdminChatPage() {
  const { user } = useAuthStore();
  const {
    conversations, setConversations,
    activeConversationId, setActiveConversation,
    messages, setMessages, addMessage,
    sendWsMessage,
  } = useChatStore();
  const { typingByConv } = useTypingStore();

  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<UserResponse[]>([]);
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
  const [cannedSuggestions, setCannedSuggestions] = useState<CannedResponse[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeConv = conversations.find((c) => c.id === activeConversationId) ?? null;
  const convMessages = activeConversationId ? (messages[activeConversationId] ?? []) : [];

  // Load all conversations + staff list
  useEffect(() => {
    const load = async () => {
      try {
        const [convData, staffData, cannedData] = await Promise.allSettled([
          ChatService.getAllConversations(0, 50),
          EmployeeService.getAll({ size: 100 }),
          CannedResponseService.getAll(),
        ]);
        if (convData.status === "fulfilled") setConversations(convData.value.content);
        else toast.error("Không thể tải danh sách chat");
        if (staffData.status === "fulfilled") setStaffList(staffData.value.content ?? []);
        if (cannedData.status === "fulfilled") setCannedResponses(cannedData.value);
      } finally {
        setIsLoadingConvs(false);
      }
    };
    load();
  }, [setConversations]);

  // Load messages when active conversation changes — stale-while-revalidate
  useEffect(() => {
    if (!activeConversationId) return;
    let cancelled = false;

    const hasCached = (useChatStore.getState().messages[activeConversationId]?.length ?? 0) > 0;
    if (!hasCached) setIsLoadingMsgs(true);

    ChatService.getMessages(activeConversationId)
      .then((msgs) => { if (!cancelled) setMessages(activeConversationId, msgs); })
      .catch(() => { if (!hasCached && !cancelled) toast.error("Không thể tải tin nhắn"); })
      .finally(() => { if (!cancelled) setIsLoadingMsgs(false); });

    return () => { cancelled = true; };
  }, [activeConversationId, setMessages]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convMessages.length]);

  const handleSelectConv = useCallback((conv: Conversation) => {
    setActiveConversation(conv.id);
    ChatService.markAsRead(conv.id).catch(() => {});
  }, [setActiveConversation]);

  const handleAssign = useCallback(async (staffId: number | null) => {
    if (!activeConversationId) return;
    try {
      const updated = await ChatService.assignStaff(activeConversationId, staffId);
      setConversations(conversations.map((c) => c.id === activeConversationId ? { ...c, ...updated } : c));
    } catch {
      toast.error("Phân công thất bại");
    }
  }, [activeConversationId, conversations, setConversations]);

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
    const val = e.target.value;
    setInput(val);

    // Canned response suggestions: show when input starts with /
    if (val.startsWith("/")) {
      const query = val.slice(1).toLowerCase();
      const matches = cannedResponses.filter((cr) =>
        cr.shortcut.toLowerCase().includes(query) || cr.content.toLowerCase().includes(query)
      );
      setCannedSuggestions(matches);
    } else {
      setCannedSuggestions([]);
    }

    if (!activeConversationId || !sendWsMessage || typingThrottleRef.current) return;
    sendWsMessage("/app/chat.typing", { conversationId: activeConversationId });
    typingThrottleRef.current = setTimeout(() => {
      typingThrottleRef.current = null;
    }, 1500);
  };

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !activeConversationId || isSending) return;
    setInput("");
    setIsSending(true);
    try {
      const msg = await ChatService.sendMessage(activeConversationId, text);
      addMessage(msg);
    } catch {
      toast.error("Gửi thất bại");
      setInput(text);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [input, activeConversationId, isSending, addMessage]);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow border border-gray-100 dark:border-slate-700">
      {/* Left: Conversation list */}
      <div className="w-72 shrink-0 border-r border-gray-100 dark:border-slate-700 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-gray-800 dark:text-white text-sm">Cuộc trò chuyện</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationSidebar
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={handleSelectConv}
            isLoading={isLoadingConvs}
          />
        </div>
      </div>

      {/* Right: Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeConv ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
            <MessageCircle className="w-14 h-14 opacity-20" />
            <p className="text-base font-medium">Chọn một cuộc trò chuyện</p>
            <p className="text-sm">để bắt đầu tư vấn khách hàng</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900">
              <Avatar className="w-9 h-9">
                <AvatarImage src={activeConv.customerAvatar} />
                <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-sm">
                  {activeConv.customerName?.charAt(0) ?? "K"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm text-gray-800 dark:text-white">{activeConv.customerName}</p>
                <p className="text-xs text-gray-400">Khách hàng</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {staffList.length > 0 && (
                  <select
                    value={activeConv.assignedStaffId ?? ""}
                    onChange={(e) => handleAssign(e.target.value ? Number(e.target.value) : null)}
                    className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                    title="Phân công nhân viên"
                  >
                    <option value="">— Chưa phân công —</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>{s.fullName}</option>
                    ))}
                  </select>
                )}
                <button
                  onClick={() => setIsPinModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/40 rounded-lg transition-colors"
                >
                  <Pin className="w-3.5 h-3.5" />
                  Ghim sản phẩm
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 bg-gray-50 dark:bg-slate-800/40">
              {isLoadingMsgs ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              ) : convMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                  <MessageCircle className="w-10 h-10 opacity-20" />
                  <p className="text-sm">Chưa có tin nhắn</p>
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
                <TypingBubble />
              )}
              <div ref={bottomRef} />
            </div>

            {/* Canned response suggestions */}
            {cannedSuggestions.length > 0 && (
              <div className="border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 max-h-48 overflow-y-auto">
                {cannedSuggestions.map((cr) => (
                  <button
                    key={cr.id}
                    onClick={() => { setInput(cr.content); setCannedSuggestions([]); inputRef.current?.focus(); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-gray-50 dark:border-slate-700/50 last:border-0"
                  >
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 mr-2">/{cr.shortcut}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{cr.content}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center gap-2">
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
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={`Trả lời ${activeConv.customerName}...`}
                className="flex-1 bg-gray-100 dark:bg-slate-700 text-sm rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-400 dark:text-gray-100 placeholder-gray-400"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isSending}
                className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
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

      {/* Pin Product Modal */}
      {activeConversationId && (
        <PinProductModal
          conversationId={activeConversationId}
          open={isPinModalOpen}
          onClose={() => setIsPinModalOpen(false)}
          onPinned={() => {
            ChatService.getMessages(activeConversationId)
              .then((msgs) => setMessages(activeConversationId, msgs))
              .catch(() => {});
          }}
        />
      )}
    </div>
  );
}

