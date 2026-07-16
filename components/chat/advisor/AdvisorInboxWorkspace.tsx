"use client";

import { useEffect, useRef, useState } from "react";
import {
  BellDot,
  ImageIcon,
  Loader2,
  MessageCircleMore,
  Pin,
  Search,
  SendHorizonal,
  Sparkles,
  Tag,
  UserRoundSearch,
  Users,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatService, CannedResponseService, CannedResponse } from "@/app/services/chat.service";
import { EmployeeService } from "@/app/services/employee.service";
import { Conversation } from "@/app/types/chat.types";
import { UserResponse } from "@/app/types/employee.schema";
import MessageBubble, { TypingBubble } from "@/components/chat/MessageBubble";
import PinProductModal from "@/components/chat/PinProductModal";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useTypingStore } from "@/stores/useTypingStore";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { toast } from "sonner";

type InboxTab = "all" | "unread" | "assigned";

const FILTER_TABS: Array<{ id: InboxTab; label: string }> = [
  { id: "all", label: "Tất cả" },
  { id: "unread", label: "Chưa đọc" },
  { id: "assigned", label: "Đã phân công" },
];

export default function AdvisorInboxWorkspace() {
  const { user } = useAuthStore();
  const { hasPermission } = usePermissions();
  const canManageChat = hasPermission(P.CHAT_MANAGE);
  const {
    conversations,
    setConversations,
    activeConversationId,
    setActiveConversation,
    messages,
    setMessages,
    addMessage,
    sendWsMessage,
  } = useChatStore();
  const { typingByConv } = useTypingStore();

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<InboxTab>("all");
  const [input, setInput] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<UserResponse[]>([]);
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
  const [cannedSuggestions, setCannedSuggestions] = useState<CannedResponse[]>([]);

  const composerRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeConversationId) ?? null;
  const activeMessages = activeConversationId ? (messages[activeConversationId] ?? []) : [];

  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        const [conversationResult, staffResult, cannedResult] = await Promise.allSettled([
          ChatService.getAllConversations(0, 100),
          EmployeeService.getAll({ size: 100 }),
          CannedResponseService.getAll(),
        ]);

        if (conversationResult.status === "fulfilled") {
          setConversations(conversationResult.value.content);
        } else {
          toast.error("Không thể tải danh sách hội thoại.");
        }

        if (staffResult.status === "fulfilled") {
          setStaffList(staffResult.value.content ?? []);
        }

        if (cannedResult.status === "fulfilled") {
          setCannedResponses(cannedResult.value);
        }
      } finally {
        setIsLoadingConversations(false);
      }
    };

    void loadWorkspace();
  }, [setConversations]);

  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversation(conversations[0].id);
    }
  }, [activeConversationId, conversations, setActiveConversation]);

  useEffect(() => {
    if (!activeConversationId) {
      return;
    }

    let cancelled = false;
    const hasCachedMessages =
      (useChatStore.getState().messages[activeConversationId]?.length ?? 0) > 0;

    if (!hasCachedMessages) {
      setIsLoadingMessages(true);
    }

    ChatService.getMessages(activeConversationId)
      .then((result) => {
        if (!cancelled) {
          setMessages(activeConversationId, result);
        }
      })
      .catch(() => {
        if (!cancelled && !hasCachedMessages) {
          toast.error("Không thể tải lịch sử hội thoại.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingMessages(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeConversationId, setMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length]);

  const filteredConversations = conversations.filter((conversation) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      conversation.customerName?.toLowerCase().includes(normalizedQuery) ||
      conversation.lastMessage?.toLowerCase().includes(normalizedQuery);

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "unread" && conversation.unreadByShop > 0) ||
      (activeTab === "assigned" && Boolean(conversation.assignedStaffId));

    return matchesQuery && matchesTab;
  });

  const unreadCount = conversations.filter((conversation) => conversation.unreadByShop > 0).length;
  const assignedCount = conversations.filter((conversation) => Boolean(conversation.assignedStaffId)).length;
  const mineCount = conversations.filter((conversation) => conversation.assignedStaffId === user?.id).length;

  const quickReplies = cannedResponses.slice(0, 4);

  const handleSelectConversation = async (conversation: Conversation) => {
    setActiveConversation(conversation.id);
    try {
      await ChatService.markAsRead(conversation.id);
      setConversations(
        conversations.map((item) =>
          item.id === conversation.id ? { ...item, unreadByShop: 0 } : item
        )
      );
    } catch {}
  };

  const handleAssignConversation = async (staffId: number | null) => {
    if (!activeConversationId) {
      return;
    }

    try {
      const updatedConversation = await ChatService.assignStaff(activeConversationId, staffId);
      setConversations(
        conversations.map((conversation) =>
          conversation.id === activeConversationId
            ? { ...conversation, ...updatedConversation }
            : conversation
        )
      );
      toast.success(staffId ? "Đã cập nhật người phụ trách." : "Đã bỏ phân công.");
    } catch {
      toast.error("Không thể cập nhật người phụ trách.");
    }
  };

  const handleImageSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !activeConversationId) {
      return;
    }

    event.target.value = "";
    setIsSending(true);

    try {
      const message = await ChatService.sendImage(activeConversationId, file);
      addMessage(message);
    } catch {
      toast.error("Gửi ảnh thất bại.");
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);

    if (value.startsWith("/")) {
      const keyword = value.slice(1).toLowerCase();
      setCannedSuggestions(
        cannedResponses.filter(
          (response) =>
            response.shortcut.toLowerCase().includes(keyword) ||
            response.content.toLowerCase().includes(keyword)
        )
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

  const handleSendMessage = async () => {
    const content = input.trim();
    if (!content || !activeConversationId || isSending) {
      return;
    }

    setInput("");
    setCannedSuggestions([]);
    setIsSending(true);

    try {
      const message = await ChatService.sendMessage(activeConversationId, content);
      addMessage(message);
      setConversations(
        conversations.map((conversation) =>
          conversation.id === activeConversationId
            ? {
                ...conversation,
                lastMessage: content,
                lastMessageAt: new Date().toISOString(),
              }
            : conversation
        )
      );
    } catch {
      toast.error("Gửi tin nhắn thất bại.");
      setInput(content);
    } finally {
      setIsSending(false);
      composerRef.current?.focus();
    }
  };

  const renderConversationTime = (conversation: Conversation) => {
    if (!conversation.lastMessageAt) {
      return "Mới tạo";
    }

    return formatDistanceToNow(new Date(conversation.lastMessageAt), {
      addSuffix: true,
      locale: vi,
    });
  };

  const renderLastActive = () => {
    if (!activeConversation?.lastMessageAt) {
      return "Chưa có hoạt động gần đây";
    }

    return format(new Date(activeConversation.lastMessageAt), "HH:mm - dd/MM", {
      locale: vi,
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.12),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef4ff_100%)] px-4 py-4 text-slate-900 md:px-6">
      <div className="mx-auto flex max-w-[1680px] flex-col gap-4">
        <header className="rounded-[28px] border border-white/80 bg-white/85 p-4 shadow-[0_22px_70px_rgba(15,23,42,0.08)] backdrop-blur xl:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0f766e] via-[#0ea5a4] to-[#38bdf8] text-white shadow-lg">
                <MessageCircleMore className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0f766e]">
                  AgriShrimp Advisor Suite
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Hộp thư tư vấn khách hàng
                </h1>
                <p className="text-sm text-slate-500">
                  Workspace riêng cho tư vấn viên, tách biệt khỏi khu vực quản trị chung.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                  Hội thoại mở
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {conversations.length}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-500">
                  Chưa đọc
                </p>
                <p className="mt-2 text-2xl font-semibold text-amber-600">
                  {unreadCount}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-600">
                  Của tôi
                </p>
                <p className="mt-2 text-2xl font-semibold text-emerald-700">
                  {mineCount}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
          <aside className="rounded-[28px] border border-white/80 bg-white/88 p-4 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Danh sách hội thoại
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  Inbox đội tư vấn
                </h2>
              </div>
              <div className="rounded-2xl bg-slate-100 px-3 py-2 text-right">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                  Đã phân công
                </p>
                <p className="text-sm font-semibold text-slate-700">{assignedCount}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm theo tên khách hoặc nội dung..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {FILTER_TABS.map((tab) => {
                const count =
                  tab.id === "all"
                    ? conversations.length
                    : tab.id === "unread"
                      ? unreadCount
                      : assignedCount;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-2xl px-3 py-3 text-left transition ${
                      activeTab === tab.id
                        ? "bg-slate-900 text-white shadow-lg"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-xs font-medium uppercase tracking-[0.16em]">
                      {tab.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold">{count}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 max-h-[calc(100vh-330px)] space-y-2 overflow-y-auto pr-1">
              {isLoadingConversations ? (
                <div className="space-y-3 py-2">
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="animate-pulse rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-full bg-slate-200" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-3/4 rounded bg-slate-200" />
                          <div className="h-3 w-1/2 rounded bg-slate-200" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                  <Users className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-4 text-sm font-medium text-slate-600">
                    Không có hội thoại phù hợp
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Thử đổi bộ lọc hoặc từ khóa tìm kiếm.
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const isActive = conversation.id === activeConversationId;
                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => void handleSelectConversation(conversation)}
                      className={`w-full rounded-[24px] border p-4 text-left transition ${
                        isActive
                          ? "border-slate-900 bg-slate-900 text-white shadow-[0_20px_45px_rgba(15,23,42,0.22)]"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative shrink-0">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={conversation.customerAvatar} />
                            <AvatarFallback
                              className={`text-sm font-semibold ${
                                isActive
                                  ? "bg-white/20 text-white"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {conversation.customerName?.charAt(0) ?? "K"}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.unreadByShop > 0 ? (
                            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                              {conversation.unreadByShop > 9 ? "9+" : conversation.unreadByShop}
                            </span>
                          ) : null}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold">
                              {conversation.customerName}
                            </p>
                            <span
                              className={`shrink-0 text-[11px] ${
                                isActive ? "text-white/70" : "text-slate-400"
                              }`}
                            >
                              {renderConversationTime(conversation)}
                            </span>
                          </div>

                          <p
                            className={`mt-1 line-clamp-2 text-sm ${
                              isActive ? "text-white/80" : "text-slate-500"
                            }`}
                          >
                            {conversation.lastMessage || "Khách hàng vừa bắt đầu cuộc trò chuyện."}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                                isActive
                                  ? "bg-white/15 text-white"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {conversation.status === "OPEN" ? "Đang mở" : "Đã đóng"}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                                isActive
                                  ? "bg-emerald-400/20 text-emerald-100"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {conversation.assignedStaffName || "Chưa phân công"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="flex min-h-[720px] flex-col rounded-[30px] border border-white/80 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            {!activeConversation ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-slate-100 text-slate-400">
                  <MessageCircleMore className="h-10 w-10" />
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-slate-900">
                  Chọn một khách hàng để bắt đầu tư vấn
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Mọi cuộc trò chuyện sẽ hiển thị tại đây cùng gợi ý phản hồi, lịch sử và thông tin phân công.
                </p>
              </div>
            ) : (
              <>
                <div className="border-b border-slate-100 px-5 py-4 xl:px-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-white shadow">
                        <AvatarImage src={activeConversation.customerAvatar} />
                        <AvatarFallback className="bg-slate-100 text-slate-700">
                          {activeConversation.customerName?.charAt(0) ?? "K"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-semibold text-slate-900">
                            {activeConversation.customerName}
                          </h2>
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                            Đang hoạt động
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          Cập nhật cuối: {renderLastActive()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                      {canManageChat ? (
                        <select
                          value={activeConversation.assignedStaffId ?? ""}
                          onChange={(event) =>
                            void handleAssignConversation(
                              event.target.value ? Number(event.target.value) : null
                            )
                          }
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                        >
                          <option value="">Phân công người phụ trách</option>
                          {staffList.map((staff) => (
                            <option key={staff.id} value={staff.id}>
                              {staff.fullName}
                            </option>
                          ))}
                        </select>
                      ) : null}

                      {canManageChat ? (
                        <button
                          type="button"
                          onClick={() => setIsPinModalOpen(true)}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          <Pin className="h-4 w-4" />
                          Ghim sản phẩm
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,_rgba(248,250,252,0.78),_rgba(255,255,255,0.96))] px-5 py-5 xl:px-6">
                  {isLoadingMessages ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                  ) : activeMessages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-100 text-slate-400">
                        <BellDot className="h-7 w-7" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-slate-900">
                        Chưa có nội dung trao đổi
                      </h3>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                        Hãy gửi lời chào đầu tiên hoặc chọn một phản hồi mẫu để bắt đầu cuộc trò chuyện.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeMessages.map((message, index) => (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          isOwn={message.senderId === user?.id}
                          isLast={index === activeMessages.length - 1}
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
                  <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 xl:px-6">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      <Sparkles className="h-3.5 w-3.5" />
                      Gợi ý phản hồi
                    </div>
                    <div className="flex max-h-40 flex-col gap-2 overflow-y-auto">
                      {cannedSuggestions.map((response) => (
                        <button
                          key={response.id}
                          type="button"
                          onClick={() => {
                            setInput(response.content);
                            setCannedSuggestions([]);
                            composerRef.current?.focus();
                          }}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          <span className="text-xs font-semibold text-[#0f766e]">
                            /{response.shortcut}
                          </span>
                          <p className="mt-1 text-sm text-slate-600">{response.content}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="border-t border-slate-100 bg-white px-4 py-4 xl:px-6">
                  <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-3 shadow-inner">
                    <div className="flex items-end gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSending}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-500 transition hover:text-slate-700 disabled:opacity-50"
                        title="Gửi hình ảnh"
                      >
                        <ImageIcon className="h-5 w-5" />
                      </button>
                      <textarea
                        ref={composerRef}
                        value={input}
                        onChange={(event) => handleInputChange(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            void handleSendMessage();
                          }
                        }}
                        rows={1}
                        placeholder={`Trả lời ${activeConversation.customerName}...`}
                        className="min-h-[52px] flex-1 resize-none border-0 bg-transparent px-1 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => void handleSendMessage()}
                        disabled={!input.trim() || isSending}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white transition hover:bg-slate-800 disabled:opacity-40"
                      >
                        {isSending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <SendHorizonal className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </div>
                </div>
              </>
            )}
          </section>

          <aside className="rounded-[28px] border border-white/80 bg-white/88 p-4 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="rounded-[24px] bg-slate-900 px-4 py-4 text-white">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 ring-2 ring-white/20">
                  <AvatarImage src={user?.avatar?.imageUrl ?? undefined} />
                  <AvatarFallback className="bg-white/10 text-white">
                    {user?.fullName?.charAt(0) ?? "A"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">
                    {user?.fullName || "Tư vấn viên"}
                  </p>
                  <p className="text-xs text-white/70">
                    {canManageChat ? "Có quyền điều phối hội thoại" : "Tư vấn viên"}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-3 text-sm text-white/80">
                <Sparkles className="h-4 w-4 text-amber-300" />
                Giữ nhịp phản hồi nhanh, rõ ràng và đúng ngữ cảnh đơn hàng.
              </div>
            </div>

            <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <UserRoundSearch className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Hồ sơ cuộc trò chuyện
                </h3>
              </div>

              {activeConversation ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      Khách hàng
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {activeConversation.customerName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Mã hội thoại #{activeConversation.id}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        Chưa đọc
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {activeConversation.unreadByShop}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        Trạng thái
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {activeConversation.status === "OPEN" ? "Mở" : "Đóng"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      Người phụ trách
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {activeConversation.assignedStaffName || "Chưa phân công"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Cập nhật: {renderLastActive()}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-slate-500">
                  Chọn một hội thoại để xem thông tin khách hàng và trạng thái xử lý.
                </p>
              )}
            </div>

            <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Phản hồi nhanh
                </h3>
              </div>

              {quickReplies.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {quickReplies.map((response) => (
                    <button
                      key={response.id}
                      type="button"
                      onClick={() => {
                        setInput(response.content);
                        composerRef.current?.focus();
                      }}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <p className="text-xs font-semibold text-[#0f766e]">
                        /{response.shortcut}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                        {response.content}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-slate-500">
                  Chưa có phản hồi mẫu. Bạn có thể tạo nhanh bằng chức năng quản lý chat hiện tại.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>

      {activeConversationId ? (
        <PinProductModal
          conversationId={activeConversationId}
          open={isPinModalOpen}
          onClose={() => setIsPinModalOpen(false)}
          onPinned={() => {
            ChatService.getMessages(activeConversationId)
              .then((result) => setMessages(activeConversationId, result))
              .catch(() => {});
          }}
        />
      ) : null}
    </div>
  );
}
