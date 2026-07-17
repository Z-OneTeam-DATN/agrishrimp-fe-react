"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Pin, Send, Loader2, MessageCircle, ImageIcon,
  Bell, Trash2, Star, Mail, CheckCircle2,
} from "lucide-react";
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

  // Load conversations + staff + canned responses
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

  // Load messages (stale-while-revalidate)
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

    if (val.startsWith("/")) {
      const query = val.slice(1).toLowerCase();
      setCannedSuggestions(
        cannedResponses.filter((cr) =>
          cr.shortcut.toLowerCase().includes(query) || cr.content.toLowerCase().includes(query)
        )
      );
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
    setCannedSuggestions([]);
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

  const assignedStaffName = activeConv?.assignedStaffName;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white border-t border-gray-200">
      {/* ═══ LEFT: Conversation list ═══ */}
      <div className="w-[360px] shrink-0 border-r border-gray-200 flex flex-col bg-white">
        <ConversationSidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={handleSelectConv}
          isLoading={isLoadingConvs}
        />
      </div>

      {/* ═══ RIGHT: Chat area ═══ */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {!activeConv ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
            <MessageCircle className="w-16 h-16 opacity-15" />
            <p className="text-base font-medium text-gray-500">Chọn một cuộc trò chuyện</p>
            <p className="text-sm text-gray-400">để bắt đầu tư vấn khách hàng</p>
          </div>
        ) : (
          <>
            {/* ── Chat header ── */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
              {/* Customer info */}
              <Avatar className="w-10 h-10">
                <AvatarImage src={activeConv.customerAvatar} />
                <AvatarFallback className="bg-gray-300 text-gray-700 font-semibold text-sm">
                  {activeConv.customerName?.charAt(0) ?? "K"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[15px] text-gray-900 truncate">
                  {activeConv.customerName}
                </p>
                <p className="text-xs text-gray-500">
                  {assignedStaffName
                    ? `Đã chỉ định cho ${assignedStaffName}`
                    : "Chưa phân công"}
                  {staffList.length > 0 && (
                    <>
                      {" · "}
                      <select
                        value={activeConv.assignedStaffId ?? ""}
                        onChange={(e) => handleAssign(e.target.value ? Number(e.target.value) : null)}
                        className="text-xs text-[#0084ff] bg-transparent outline-none cursor-pointer hover:underline"
                      >
                        <option value="">Chọn nhân viên</option>
                        {staffList.map((s) => (
                          <option key={s.id} value={s.id}>{s.fullName}</option>
                        ))}
                      </select>
                    </>
                  )}
                </p>
              </div>

              {/* Action icons — Messenger Business style */}
              <div className="flex items-center gap-1">
                <button
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                  title="Thông báo"
                >
                  <Bell className="w-[18px] h-[18px]" />
                </button>
                <button
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                  title="Xóa"
                >
                  <Trash2 className="w-[18px] h-[18px]" />
                </button>
                <button
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                  title="Đánh dấu"
                >
                  <Star className="w-[18px] h-[18px]" />
                </button>
                <button
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                  title="Email"
                >
                  <Mail className="w-[18px] h-[18px]" />
                </button>
                <button
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                  title="Đánh dấu đã xử lý"
                >
                  <CheckCircle2 className="w-[18px] h-[18px]" />
                </button>
              </div>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 bg-white">
              {isLoadingMsgs ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 text-[#0084ff] animate-spin" />
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

            {/* ── Canned response suggestions ── */}
            {cannedSuggestions.length > 0 && (
              <div className="border-t border-gray-200 bg-white max-h-48 overflow-y-auto">
                {cannedSuggestions.map((cr) => (
                  <button
                    key={cr.id}
                    onClick={() => { setInput(cr.content); setCannedSuggestions([]); inputRef.current?.focus(); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#f0f2f5] border-b border-gray-100 last:border-0 transition-colors"
                  >
                    <span className="text-xs font-semibold text-[#0084ff] mr-2">/{cr.shortcut}</span>
                    <span className="text-sm text-gray-600 truncate">{cr.content}</span>
                  </button>
                ))}
              </div>
            )}

            {/* ── Input bar ── */}
            <div className="px-4 py-3 border-t border-gray-200 bg-white flex items-center gap-3">
              {/* Page avatar */}
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src="/images/logo_arishrimp.jpg" />
                <AvatarFallback className="bg-gray-200 text-gray-600 text-xs font-bold">AS</AvatarFallback>
              </Avatar>

              {/* Input field */}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <div className="flex-1 flex items-center bg-[#f0f2f5] rounded-full px-4 py-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Trả lời trong Messenger..."
                  className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-500"
                />
              </div>

              {/* Action icons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSending}
                  className="w-8 h-8 flex items-center justify-center text-[#0084ff] hover:bg-gray-100 rounded-full transition-colors disabled:opacity-40"
                  title="Đính kèm ảnh"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsPinModalOpen(true)}
                  className="w-8 h-8 flex items-center justify-center text-[#0084ff] hover:bg-gray-100 rounded-full transition-colors"
                  title="Ghim sản phẩm"
                >
                  <Pin className="w-5 h-5" />
                </button>
                {input.trim() ? (
                  <button
                    onClick={handleSend}
                    disabled={isSending}
                    className="w-8 h-8 flex items-center justify-center text-[#0084ff] hover:bg-gray-100 rounded-full transition-colors disabled:opacity-40"
                  >
                    {isSending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                ) : (
                  <button
                    className="w-8 h-8 flex items-center justify-center text-[#0084ff] hover:bg-gray-100 rounded-full transition-colors"
                    title="Gửi like"
                  >
                    <span className="text-lg">👍</span>
                  </button>
                )}
              </div>
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
