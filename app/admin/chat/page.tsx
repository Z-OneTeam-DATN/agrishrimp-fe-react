"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CheckCircle2,
  ImageIcon,
  Loader2,
  Mail,
  MessageCircle,
  Pin,
  SearchCheck,
  Send,
  Star,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CannedResponse,
  CannedResponseService,
  ChatService,
} from "@/app/services/chat.service";
import { EmployeeService } from "@/app/services/employee.service";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTypingStore } from "@/stores/useTypingStore";
import { Conversation } from "@/app/types/chat.types";
import { UserResponse } from "@/app/types/employee.schema";
import ConversationSidebar from "@/components/chat/ConversationSidebar";
import MessageBubble, { TypingBubble } from "@/components/chat/MessageBubble";
import PinProductModal from "@/components/chat/PinProductModal";
import { cn } from "@/lib/utils";
import {
  CHAT_PRIORITY_OPTIONS,
  CHAT_STAGE_OPTIONS,
  ChatConversationMetaMap,
  deriveConversationMeta,
  getPriorityMeta,
  getStageMeta,
  getSuggestedTasks,
  readConversationMetaMap,
  writeConversationMetaMap,
} from "@/lib/chat-workspace";
import { toast } from "sonner";

function formatDetailTime(value?: string) {
  if (!value) {
    return "Chưa có cập nhật";
  }

  return format(new Date(value), "HH:mm - dd/MM", {
    locale: vi,
  });
}

export default function AdminChatPage() {
  const { user } = useAuthStore();
  const {
    conversations,
    setConversations,
    activeConversationId,
    setActiveConversation,
    messages,
    setMessages,
    addMessage,
    updateConversationLastMsg,
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
  const [conversationMetaMap, setConversationMetaMap] =
    useState<ChatConversationMetaMap>({});
  const [isMetaReady, setIsMetaReady] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeConv =
    conversations.find((conversation) => conversation.id === activeConversationId) ??
    null;
  const convMessages = activeConversationId
    ? (messages[activeConversationId] ?? [])
    : [];

  useEffect(() => {
    setConversationMetaMap(readConversationMetaMap());
    setIsMetaReady(true);
  }, []);

  useEffect(() => {
    if (isMetaReady) {
      writeConversationMetaMap(conversationMetaMap);
    }
  }, [conversationMetaMap, isMetaReady]);

  const conversationMetaById = useMemo(() => {
    return conversations.reduce<ChatConversationMetaMap>((acc, conversation) => {
      acc[conversation.id] = deriveConversationMeta(
        conversation,
        conversationMetaMap[conversation.id],
      );
      return acc;
    }, {});
  }, [conversationMetaMap, conversations]);

  const activeMeta = activeConv
    ? conversationMetaById[activeConv.id]
    : null;
  const activePriority = activeMeta
    ? getPriorityMeta(activeMeta.priority)
    : null;
  const activeStage = activeMeta ? getStageMeta(activeMeta.stage) : null;
  const suggestedTasks = activeMeta ? getSuggestedTasks(activeMeta.stage) : [];

  useEffect(() => {
    const load = async () => {
      try {
        const [convData, staffData, cannedData] = await Promise.allSettled([
          ChatService.getAllConversations(0, 50),
          EmployeeService.getAll({ size: 100 }),
          CannedResponseService.getAll(),
        ]);

        if (convData.status === "fulfilled") {
          setConversations(convData.value.content);
        } else {
          toast.error("Không thể tải danh sách chat");
        }

        if (staffData.status === "fulfilled") {
          setStaffList(staffData.value.content ?? []);
        }

        if (cannedData.status === "fulfilled") {
          setCannedResponses(cannedData.value);
        }
      } finally {
        setIsLoadingConvs(false);
      }
    };

    void load();
  }, [setConversations]);

  useEffect(() => {
    if (!activeConversationId) {
      return;
    }

    let cancelled = false;
    const hasCached =
      (useChatStore.getState().messages[activeConversationId]?.length ?? 0) > 0;

    if (!hasCached) {
      setIsLoadingMsgs(true);
    }

    ChatService.getMessages(activeConversationId)
      .then((msgs) => {
        if (!cancelled) {
          setMessages(activeConversationId, msgs);
        }
      })
      .catch(() => {
        if (!hasCached && !cancelled) {
          toast.error("Không thể tải tin nhắn");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingMsgs(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeConversationId, setMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convMessages.length]);

  const handleSelectConv = useCallback(
    (conversation: Conversation) => {
      setActiveConversation(conversation.id);
      setConversations(
        conversations.map((item) =>
          item.id === conversation.id ? { ...item, unreadByShop: 0 } : item,
        ),
      );
      ChatService.markAsRead(conversation.id).catch(() => {});
    },
    [conversations, setActiveConversation, setConversations],
  );

  const handleAssign = useCallback(
    async (staffId: number | null) => {
      if (!activeConversationId) {
        return;
      }

      try {
        const updated = await ChatService.assignStaff(activeConversationId, staffId);
        setConversations(
          conversations.map((conversation) =>
            conversation.id === activeConversationId
              ? { ...conversation, ...updated }
              : conversation,
          ),
        );
      } catch {
        toast.error("Phân công thất bại");
      }
    },
    [activeConversationId, conversations, setConversations],
  );

  const updateActiveMeta = useCallback(
    (patch: Partial<(typeof conversationMetaMap)[number]>) => {
      if (!activeConv) {
        return;
      }

      setConversationMetaMap((current) => ({
        ...current,
        [activeConv.id]: {
          ...deriveConversationMeta(activeConv, current[activeConv.id]),
          ...patch,
        },
      }));
    },
    [activeConv],
  );

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeConversationId) {
      return;
    }

    event.target.value = "";
    setIsSending(true);

    try {
      const message = await ChatService.sendImage(activeConversationId, file);
      addMessage(message);
      updateConversationLastMsg(activeConversationId, message);
    } catch {
      toast.error("Gửi ảnh thất bại");
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInput(value);

    if (value.startsWith("/")) {
      const query = value.slice(1).toLowerCase();
      setCannedSuggestions(
        cannedResponses.filter(
          (response) =>
            response.shortcut.toLowerCase().includes(query) ||
            response.content.toLowerCase().includes(query),
        ),
      );
    } else {
      setCannedSuggestions([]);
    }

    if (!activeConversationId || !sendWsMessage || typingThrottleRef.current) {
      return;
    }

    sendWsMessage("/app/chat.typing", { conversationId: activeConversationId });
    typingThrottleRef.current = setTimeout(() => {
      typingThrottleRef.current = null;
    }, 1500);
  };

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !activeConversationId || isSending) {
      return;
    }

    setInput("");
    setCannedSuggestions([]);
    setIsSending(true);

    try {
      const message = await ChatService.sendMessage(activeConversationId, text);
      addMessage(message);
      updateConversationLastMsg(activeConversationId, message);
      if (activeMeta?.stage === "new") {
        updateActiveMeta({ stage: "consulting" });
      }
    } catch {
      toast.error("Gửi thất bại");
      setInput(text);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [
    activeConversationId,
    activeMeta?.stage,
    addMessage,
    input,
    isSending,
    updateActiveMeta,
    updateConversationLastMsg,
  ]);

  return (
    <div className="flex h-[calc(100vh-64px)] border-t border-gray-200 bg-white">
      <div className="w-[400px] shrink-0 border-r border-gray-200 bg-white">
        <ConversationSidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={handleSelectConv}
          metaByConversationId={conversationMetaById}
          isLoading={isLoadingConvs}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col bg-[#f8fafc]">
        {!activeConv ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
            <MessageCircle className="h-16 w-16 opacity-15" />
            <p className="text-base font-medium text-gray-500">
              Chọn một cuộc trò chuyện
            </p>
            <p className="text-sm text-gray-400">
              để bắt đầu tư vấn, gán ưu tiên và theo dõi giai đoạn xử lý
            </p>
          </div>
        ) : (
          <>
            <div className="border-b border-gray-200 bg-white px-5 py-4">
              <div className="flex flex-wrap items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={activeConv.customerAvatar} />
                  <AvatarFallback className="bg-gray-300 text-sm font-semibold text-gray-700">
                    {activeConv.customerName?.charAt(0) ?? "K"}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0084ff]">
                    Hội thoại tư vấn #{activeConv.id}
                  </p>
                  <h1 className="mt-1 truncate text-[22px] font-semibold text-gray-900">
                    {activeConv.customerName}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>
                      {activeConv.assignedStaffName
                        ? `Phụ trách: ${activeConv.assignedStaffName}`
                        : "Chưa phân công"}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span>Cập nhật: {formatDetailTime(activeConv.lastMessageAt)}</span>
                    <span className="text-gray-300">•</span>
                    <span>
                      {activeConv.unreadByShop > 0
                        ? `${activeConv.unreadByShop} tin chưa đọc`
                        : "Đã đọc hết"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
                    title="Theo dõi"
                  >
                    <Bell className="h-[18px] w-[18px]" />
                  </button>
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
                    title="Xóa"
                  >
                    <Trash2 className="h-[18px] w-[18px]" />
                  </button>
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
                    title="Đánh dấu sao"
                  >
                    <Star className="h-[18px] w-[18px]" />
                  </button>
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
                    title="Email"
                  >
                    <Mail className="h-[18px] w-[18px]" />
                  </button>
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
                    title="Đánh dấu đã xử lý"
                  >
                    <CheckCircle2 className="h-[18px] w-[18px]" />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.1fr)_220px_220px_240px]">
                <div className="rounded-2xl border border-gray-200 bg-[#f8fafc] px-4 py-3">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Nhãn nội bộ
                  </label>
                  <input
                    value={activeMeta?.label ?? ""}
                    onChange={(event) => updateActiveMeta({ label: event.target.value })}
                    placeholder="VD: Khách cũ, cần báo giá, đại lý..."
                    className="mt-2 w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                  />
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Mức ưu tiên
                  </label>
                  <select
                    value={activeMeta?.priority ?? "normal"}
                    onChange={(event) =>
                      updateActiveMeta({
                        priority: event.target.value as (typeof CHAT_PRIORITY_OPTIONS)[number]["value"],
                      })
                    }
                    className="mt-2 w-full bg-transparent text-sm font-medium text-gray-800 outline-none"
                  >
                    {CHAT_PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Giai đoạn xử lý
                  </label>
                  <select
                    value={activeMeta?.stage ?? "new"}
                    onChange={(event) =>
                      updateActiveMeta({
                        stage: event.target.value as (typeof CHAT_STAGE_OPTIONS)[number]["value"],
                      })
                    }
                    className="mt-2 w-full bg-transparent text-sm font-medium text-gray-800 outline-none"
                  >
                    {CHAT_STAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Phân công phụ trách
                  </label>
                  <select
                    value={activeConv.assignedStaffId ?? ""}
                    onChange={(event) =>
                      void handleAssign(
                        event.target.value ? Number(event.target.value) : null,
                      )
                    }
                    className="mt-2 w-full bg-transparent text-sm font-medium text-gray-800 outline-none"
                  >
                    <option value="">Chưa phân công</option>
                    {staffList.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {activePriority ? (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                      activePriority.badgeClassName,
                    )}
                  >
                    {activePriority.label}
                  </span>
                ) : null}
                {activeStage ? (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                      activeStage.badgeClassName,
                    )}
                  >
                    {activeStage.label}
                  </span>
                ) : null}
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                  {activeConv.status === "OPEN" ? "Đang mở" : "Đã đóng"}
                </span>
              </div>

              <div className="mt-4 rounded-2xl border border-[#dbeafe] bg-[#f8fbff] px-4 py-4">
                <div className="flex items-center gap-2">
                  <SearchCheck className="h-4 w-4 text-[#0084ff]" />
                  <p className="text-sm font-semibold text-gray-900">
                    Tác vụ gợi ý tiếp theo
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestedTasks.map((task) => (
                    <span
                      key={task}
                      className="rounded-full border border-[#dbeafe] bg-white px-3 py-1.5 text-[11px] font-medium text-gray-600"
                    >
                      {task}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto bg-white px-4 py-4">
                {isLoadingMsgs ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-[#0084ff]" />
                  </div>
                ) : convMessages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
                    <MessageCircle className="h-10 w-10 opacity-20" />
                    <p className="text-sm">Chưa có tin nhắn</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {convMessages.map((message, index) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={message.senderId === user?.id}
                        isLast={index === convMessages.length - 1}
                      />
                    ))}
                    {activeConversationId && typingByConv[activeConversationId] ? (
                      <TypingBubble />
                    ) : null}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              {cannedSuggestions.length > 0 ? (
                <div className="max-h-48 overflow-y-auto border-t border-gray-200 bg-white">
                  {cannedSuggestions.map((response) => (
                    <button
                      key={response.id}
                      onClick={() => {
                        setInput(response.content);
                        setCannedSuggestions([]);
                        inputRef.current?.focus();
                      }}
                      className="w-full border-b border-gray-100 px-4 py-2.5 text-left transition-colors hover:bg-[#f0f2f5] last:border-0"
                    >
                      <span className="mr-2 text-xs font-semibold text-[#0084ff]">
                        /{response.shortcut}
                      </span>
                      <span className="truncate text-sm text-gray-600">
                        {response.content}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="flex items-center gap-3 border-t border-gray-200 bg-white px-4 py-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src="/images/logo_arishrimp.jpg" />
                  <AvatarFallback className="bg-gray-200 text-xs font-bold text-gray-600">
                    AS
                  </AvatarFallback>
                </Avatar>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />

                <div className="flex flex-1 items-center rounded-full bg-[#f0f2f5] px-4 py-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void handleSend();
                      }
                    }}
                    placeholder="Trả lời trong Messenger..."
                    className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-500"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSending}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[#0084ff] transition-colors hover:bg-gray-100 disabled:opacity-40"
                    title="Đính kèm ảnh"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setIsPinModalOpen(true)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[#0084ff] transition-colors hover:bg-gray-100"
                    title="Ghim sản phẩm"
                  >
                    <Pin className="h-5 w-5" />
                  </button>
                  {input.trim() ? (
                    <button
                      onClick={() => void handleSend()}
                      disabled={isSending}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[#0084ff] transition-colors hover:bg-gray-100 disabled:opacity-40"
                    >
                      {isSending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </button>
                  ) : (
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[#0084ff] transition-colors hover:bg-gray-100"
                      title="Gửi like"
                    >
                      <span className="text-lg">👍</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {activeConversationId ? (
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
      ) : null}
    </div>
  );
}
