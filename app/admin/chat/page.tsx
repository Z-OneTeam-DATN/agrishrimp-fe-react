"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  Pin, Send, Loader2, MessageCircle, ImageIcon,
  Bell, Star, Mail, CheckCircle2, BellOff, Archive, Smile, Video, X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatService, CannedResponseService, CannedResponse } from "@/app/services/chat.service";
import { EmployeeService } from "@/app/services/employee.service";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTypingStore } from "@/stores/useTypingStore";
import { Conversation, ChatMessage } from "@/app/types/chat.types";
import { UserResponse } from "@/app/types/employee.schema";
import ConversationSidebar from "@/components/chat/ConversationSidebar";
import MessageBubble, { TypingBubble, parseReactionsAndMessages } from "@/components/chat/MessageBubble";
import PinProductModal from "@/components/chat/PinProductModal";
import StickerPicker from "@/components/chat/StickerPicker";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const getFullImageUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const origin = process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:8004";
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function AdminChatPage() {
  const { user } = useAuthStore();
  const {
    conversations, setConversations,
    activeConversationId, setActiveConversation,
    messages, setMessages, addMessage,
    sendWsMessage,
    viewersByConv,
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

  const [mutedConvs, setMutedConvs] = useState<number[]>([]);
  const [starredConvs, setStarredConvs] = useState<number[]>([]);

  // AlertDialog confirm archive states
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [conversationToArchive, setConversationToArchive] = useState<number | null>(null);

  // Quote reply state
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Image/video preview state (show preview before sending)
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [pendingVideo, setPendingVideo] = useState<File | null>(null);
  const [pendingVideoPreview, setPendingVideoPreview] = useState<string | null>(null);

  // Sticker picker
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  const videoInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    try {
      const muted = localStorage.getItem("agrishrimp_muted_convs");
      if (muted) setMutedConvs(JSON.parse(muted));
      const starred = localStorage.getItem("agrishrimp_starred_convs");
      if (starred) setStarredConvs(JSON.parse(starred));
    } catch {}
  }, []);

  const toggleMute = (convId: number) => {
    const isCurrentlyMuted = mutedConvs.includes(convId);
    const updated = isCurrentlyMuted
      ? mutedConvs.filter((id) => id !== convId)
      : [...mutedConvs, convId];
    setMutedConvs(updated);
    localStorage.setItem("agrishrimp_muted_convs", JSON.stringify(updated));
    toast.success(isCurrentlyMuted ? "Đã bật nhận thông báo cho cuộc hội thoại này" : "Đã tắt nhận thông báo cho cuộc hội thoại này");
  };

  const toggleStar = (convId: number) => {
    const isCurrentlyStarred = starredConvs.includes(convId);
    const updated = isCurrentlyStarred
      ? starredConvs.filter((id) => id !== convId)
      : [...starredConvs, convId];
    setStarredConvs(updated);
    localStorage.setItem("agrishrimp_starred_convs", JSON.stringify(updated));
    toast.success(isCurrentlyStarred ? "Đã bỏ đánh dấu sao" : "Đã đánh dấu sao hội thoại");
  };

  const handleMarkUnread = async (convId: number) => {
    try {
      await ChatService.markAsUnread(convId);
      setConversations(
        conversations.map((c) => (c.id === convId ? { ...c, unreadByShop: 1 } : c))
      );
      toast.success("Đã đánh dấu chưa đọc");
    } catch {
      toast.error("Không thể đánh dấu chưa đọc");
    }
  };

  const handleToggleStatus = async (convId: number, currentStatus: "OPEN" | "CLOSED") => {
    const nextStatus = currentStatus === "OPEN" ? "CLOSED" : "OPEN";
    try {
      await ChatService.updateStatus(convId, nextStatus);
      setConversations(
        conversations.map((c) => (c.id === convId ? { ...c, status: nextStatus } : c))
      );
      toast.success(nextStatus === "CLOSED" ? "Đã đóng cuộc trò chuyện" : "Đã mở lại cuộc trò chuyện");
    } catch {
      toast.error("Cập nhật trạng thái thất bại");
    }
  };

  const handleArchiveConversation = async (convId: number) => {
    try {
      await ChatService.updateStatus(convId, "CLOSED");
      setConversations(
        conversations.map((c) => (c.id === convId ? { ...c, status: "CLOSED" } : c))
      );
      setActiveConversation(null); // Bỏ chọn
      toast.success("Đã lưu trữ cuộc trò chuyện thành công");
    } catch {
      toast.error("Không thể lưu trữ cuộc trò chuyện");
    }
  };

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear pending media when conversation changes
  useEffect(() => {
    setPendingImage(null);
    setPendingImagePreview(null);
    setPendingVideo(null);
    setPendingVideoPreview(null);
    setShowStickerPicker(false);
  }, [activeConversationId]);

  const activeConv = conversations.find((c) => c.id === activeConversationId) ?? null;
  const convMessages = activeConversationId ? (messages[activeConversationId] ?? []) : [];
  
  const { reactionsMap, visibleMessages } = useMemo(() => {
    return parseReactionsAndMessages(convMessages, activeConv?.customerId);
  }, [convMessages, activeConv?.customerId]);

  const currentViewers = activeConversationId ? (viewersByConv[activeConversationId] ?? []) : [];
  const otherViewers = currentViewers
    .filter((v) => v.userId !== user?.id)
    .map((v) => v.username);

  // Send JOIN/LEAVE messages for chat active viewers
  useEffect(() => {
    if (!activeConversationId || !sendWsMessage) return;

    sendWsMessage("/app/chat.viewing", {
      conversationId: activeConversationId,
      status: "JOIN",
    });

    return () => {
      sendWsMessage("/app/chat.viewing", {
        conversationId: activeConversationId,
        status: "LEAVE",
      });
    };
  }, [activeConversationId, sendWsMessage]);

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

  // Load messages (clean reload to avoid flashing/stale data)
  useEffect(() => {
    if (!activeConversationId) return;
    let cancelled = false;
    setIsLoadingMsgs(true);

    ChatService.getMessages(activeConversationId)
      .then((msgs) => { if (!cancelled) setMessages(activeConversationId, msgs); })
      .catch(() => { if (!cancelled) toast.error("Không thể tải tin nhắn"); })
      .finally(() => { if (!cancelled) setIsLoadingMsgs(false); });

    return () => { cancelled = true; };
  }, [activeConversationId, setMessages]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convMessages.length]);

  const handleSelectConv = useCallback(async (conv: Conversation) => {
    setActiveConversation(conv.id);
    try {
      await ChatService.markAsRead(conv.id);
      setConversations(
        conversations.map((item) =>
          item.id === conv.id ? { ...item, unreadByShop: 0 } : item
        )
      );
    } catch {}
  }, [setActiveConversation, conversations, setConversations]);

  const handleAssign = useCallback(async (staffId: number | null) => {
    if (!activeConversationId) return;
    try {
      const updated = await ChatService.assignStaff(activeConversationId, staffId);
      setConversations(conversations.map((c) => c.id === activeConversationId ? { ...c, ...updated } : c));
    } catch {
      toast.error("Phân công thất bại");
    }
  }, [activeConversationId, conversations, setConversations]);

  // Image: show preview first, send on submit
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversationId) return;
    e.target.value = "";
    const objectUrl = URL.createObjectURL(file);
    setPendingImage(file);
    setPendingImagePreview(objectUrl);
    setPendingVideo(null);
    setPendingVideoPreview(null);
  };

  // Video: show preview first, send on submit
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversationId) return;
    e.target.value = "";
    const objectUrl = URL.createObjectURL(file);
    setPendingVideo(file);
    setPendingVideoPreview(objectUrl);
    setPendingImage(null);
    setPendingImagePreview(null);
  };

  // Send sticker
  const handleSendSticker = async (stickerUrl: string) => {
    if (!activeConversationId) return;
    setShowStickerPicker(false);
    const localId = `local-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: -Date.now(), localId,
      conversationId: activeConversationId,
      senderId: user?.id ?? 0,
      senderName: user?.fullName ?? "",
      content: `[STICKER:${stickerUrl}]`,
      messageType: "TEXT",
      isRead: false,
      createdAt: new Date().toISOString(),
      status: "sending",
    };
    addMessage(optimistic);
    try {
      const msg = await ChatService.sendMessage(activeConversationId, `[STICKER:${stickerUrl}]`);
      addMessage({ ...msg, localId });
    } catch {
      addMessage({ ...optimistic, status: "error" });
    }
  };

  // Retry sending a failed message
  const handleRetryMessage = useCallback(async (failedMsg: ChatMessage) => {
    if (!activeConversationId) return;
    addMessage({ ...failedMsg, status: "sending" });
    try {
      const msg = await ChatService.sendMessage(activeConversationId, failedMsg.content);
      addMessage({ ...msg, localId: failedMsg.localId, status: "sent" });
    } catch {
      addMessage({ ...failedMsg, status: "error" });
    }
  }, [activeConversationId, addMessage]);

  const handleReact = useCallback(async (msg: ChatMessage, emoji: string) => {
    if (!activeConversationId) return;
    const content = `[REACTION:${emoji}|${msg.id}]`;
    const localId = `local-react-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: -Date.now(),
      localId,
      conversationId: activeConversationId,
      senderId: user?.id ?? 0,
      senderName: user?.fullName ?? "",
      content,
      messageType: "TEXT",
      isRead: false,
      createdAt: new Date().toISOString(),
      status: "sending",
    };
    addMessage(optimistic);
    try {
      const serverMsg = await ChatService.sendMessage(activeConversationId, content);
      addMessage({ ...serverMsg, localId, status: "sent" });
    } catch {
      addMessage({ ...optimistic, status: "error" });
    }
  }, [activeConversationId, user, addMessage]);

  // Send pending image/video or text
  const handleSendMedia = async () => {
    if (!activeConversationId) return;
    if (pendingImage) {
      const file = pendingImage;
      setPendingImage(null); setPendingImagePreview(null);
      setIsSending(true);
      try {
        const msg = await ChatService.sendImage(activeConversationId, file);
        addMessage(msg);
      } catch {
        toast.error("Gửi ảnh thất bại");
      } finally { setIsSending(false); }
    } else if (pendingVideo) {
      const file = pendingVideo;
      setPendingVideo(null); setPendingVideoPreview(null);
      setIsSending(true);
      try {
        const msg = await ChatService.sendImage(activeConversationId, file);
        addMessage(msg);
      } catch {
        toast.error("Gửi video thất bại");
      } finally { setIsSending(false); }
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

  const getReplySnippet = (msg: ChatMessage) => {
    if (!msg.content) return "";
    let snippet = msg.content;
    const replyMatch = snippet.match(/^\[REPLY:[^\]]+\]([\s\S]*)$/);
    if (replyMatch) {
      snippet = replyMatch[1];
    }
    snippet = snippet.replace(/\[CARD_META:[^\]]+\]/g, "");
    snippet = snippet.replace(/\[STICKER:[^\]]+\]/g, "Nhãn dán");
    return snippet.substring(0, 45);
  };

  const handleSend = useCallback(async () => {
    // If there's pending media, send that first
    if (pendingImage || pendingVideo) {
      await handleSendMedia();
      return;
    }
    const text = input.trim();
    if (!text || !activeConversationId) return;

    let contentToSend = text;
    if (replyingTo) {
      const snippet = getReplySnippet(replyingTo);
      contentToSend = `[REPLY:${replyingTo.id}|${replyingTo.senderName || "Người dùng"}|${snippet}]${text}`;
      setReplyingTo(null);
    }

    setInput("");
    setCannedSuggestions([]);
    // Optimistic: push a "sending" message immediately
    const localId = `local-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: -Date.now(), localId,
      conversationId: activeConversationId,
      senderId: user?.id ?? 0,
      senderName: user?.fullName ?? "",
      content: contentToSend,
      messageType: "TEXT",
      isRead: false,
      createdAt: new Date().toISOString(),
      status: "sending",
    };
    addMessage(optimistic);
    try {
      const msg = await ChatService.sendMessage(activeConversationId, contentToSend);
      addMessage({ ...msg, localId, status: "sent" });
    } catch {
      addMessage({ ...optimistic, status: "error" });
    } finally {
      inputRef.current?.focus();
    }
  }, [input, activeConversationId, pendingImage, pendingVideo, user, addMessage, replyingTo]);

  const assignedStaffName = activeConv?.assignedStaffName;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white border-t border-gray-200">
      {/* ═══ LEFT: Conversation list ═══ */}
      <div className="w-[360px] shrink-0 border-r border-gray-200 flex flex-col bg-white">
        <ConversationSidebar
          conversations={conversations.filter((c) => c.status !== "CLOSED")}
          activeId={activeConversationId}
          onSelect={handleSelectConv}
          isLoading={isLoadingConvs}
          starredIds={starredConvs}
        />
      </div>

      {/* ═══ RIGHT: Chat area ═══ */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {!activeConv ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
            <img src="/images/logo_arishrimp_tachnen.png" className="w-24 h-24 object-contain mb-2 opacity-80" alt="AgriShrimp Logo" />
            <p className="text-base font-semibold text-gray-800">Hệ thống tư vấn AgriShrimp</p>
            <p className="text-sm text-gray-500">Chọn một cuộc trò chuyện để bắt đầu tư vấn khách hàng</p>
          </div>
        ) : (
          <>
            {/* ── Chat header ── */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
              {/* Customer avatar > handler avatar breadcrumb */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={getFullImageUrl(activeConv.customerAvatar)} />
                  <AvatarFallback className="bg-gray-300 text-gray-700 font-semibold text-sm">
                    {activeConv.customerName?.charAt(0) ?? "K"}
                  </AvatarFallback>
                </Avatar>
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                {/* Staff (handler) avatar */}
                <Avatar className="w-9 h-9 ring-2 ring-[#0084ff] ring-offset-1">
                  <AvatarImage src={user?.avatar?.imageUrl ?? undefined} />
                  <AvatarFallback className="bg-[#0084ff] text-white font-semibold text-sm">
                    {user?.fullName?.charAt(0) ?? "A"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[15px] text-gray-900 truncate">
                  {activeConv.customerName}
                </p>
                <p className="text-xs text-[#0084ff] font-medium">
                  Đang xử lý bởi <span className="font-semibold">{user?.fullName ?? "Bạn"}</span>
                </p>
              </div>

              {/* Action icons — Messenger Business style */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleMute(activeConv.id)}
                  className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                    mutedConvs.includes(activeConv.id)
                      ? "text-rose-500 hover:bg-rose-50"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                  title={mutedConvs.includes(activeConv.id) ? "Bật thông báo" : "Tắt thông báo"}
                >
                  {mutedConvs.includes(activeConv.id) ? (
                    <BellOff className="w-[18px] h-[18px]" />
                  ) : (
                    <Bell className="w-[18px] h-[18px]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConversationToArchive(activeConv.id);
                    setArchiveConfirmOpen(true);
                  }}
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
                  title="Đóng và lưu trữ cuộc trò chuyện"
                >
                  <Archive className="w-[18px] h-[18px]" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleStar(activeConv.id)}
                  className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                    starredConvs.includes(activeConv.id)
                      ? "text-amber-500 hover:bg-amber-50"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                  title={starredConvs.includes(activeConv.id) ? "Bỏ đánh dấu sao" : "Đánh dấu sao"}
                >
                  <Star
                    className={`w-[18px] h-[18px] ${
                      starredConvs.includes(activeConv.id) ? "fill-amber-400 text-amber-500" : ""
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkUnread(activeConv.id)}
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
                  title="Đánh dấu chưa đọc"
                >
                  <Mail className="w-[18px] h-[18px]" />
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleStatus(activeConv.id, activeConv.status)}
                  className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                    activeConv.status === "CLOSED"
                      ? "text-emerald-500 hover:bg-emerald-50"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                  title={activeConv.status === "CLOSED" ? "Mở lại cuộc trò chuyện" : "Đóng cuộc trò chuyện"}
                >
                  <CheckCircle2
                    className={`w-[18px] h-[18px] ${
                      activeConv.status === "CLOSED" ? "fill-emerald-100 text-emerald-600" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* ── Active viewers banner ── */}
            {otherViewers.length > 0 && (
              <div className="bg-amber-50 text-amber-700 px-4 py-2 text-xs font-semibold border-b border-amber-100 flex items-center gap-1.5 animate-pulse shrink-0">
                <span>⚠️</span>
                <span>{otherViewers.join(" và ")} đang xử lý đoạn chat này...</span>
              </div>
            )}

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 bg-white">
              {isLoadingMsgs ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 text-[#0084ff] animate-spin" />
                </div>
              ) : visibleMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                  <MessageCircle className="w-10 h-10 opacity-20" />
                  <p className="text-sm">Chưa có tin nhắn</p>
                </div>
              ) : (
                visibleMessages.map((msg, index) => (
                  <MessageBubble
                    key={msg.localId ?? msg.id}
                    message={msg}
                    isOwn={msg.senderId !== activeConv?.customerId}
                    isLast={index === visibleMessages.length - 1}
                    onRetry={handleRetryMessage}
                    isAdminWorkspace={true}
                    onReply={setReplyingTo}
                    reactions={reactionsMap[msg.id]}
                    onReact={handleReact}
                  />
                ))
              )}
              {activeConversationId && typingByConv[activeConversationId] && (
                <TypingBubble 
                  name={activeConv?.customerName || "Khách hàng"} 
                  avatarUrl={activeConv?.customerAvatar} 
                />
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

            {/* ── Sticker Picker ── */}
            {showStickerPicker && (
              <StickerPicker
                onSelectSticker={handleSendSticker}
                onClose={() => setShowStickerPicker(false)}
                className="absolute bottom-[60px] left-4"
              />
            )}

            {/* ── Image / Video Preview Strip ── */}
            {(pendingImagePreview || pendingVideoPreview) && (
              <div className="bg-gray-50 border-t border-gray-100 px-4 py-2 flex items-center gap-3">
                <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                  {pendingImagePreview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pendingImagePreview} alt="preview" className="w-full h-full object-cover" />
                  )}
                  {pendingVideoPreview && (
                    <video src={pendingVideoPreview} className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={() => { setPendingImage(null); setPendingImagePreview(null); setPendingVideo(null); setPendingVideoPreview(null); }}
                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-gray-800/70 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 truncate font-medium">{pendingImage?.name ?? pendingVideo?.name}</p>
                  <p className="text-[10px] text-gray-400">Nhấn Gửi để upload {pendingImage ? "ảnh" : "video"}</p>
                </div>
                <button onClick={handleSend} disabled={isSending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0084ff] hover:bg-blue-600 text-white rounded-full text-xs font-semibold transition-colors disabled:opacity-50">
                  {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Gửi
                </button>
              </div>
            )}

            {/* ── Replying To Banner ── */}
            {replyingTo && (
              <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-gray-150 animate-slideUp shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                  <span className="font-bold shrink-0">Đang trả lời {replyingTo.senderName}:</span>
                  <span className="italic truncate">"{replyingTo.content}"</span>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-gray-400 hover:text-gray-600 p-0.5 hover:bg-slate-100 rounded-full shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* ── Input bar ── */}
            <div className="px-4 py-3 border-t border-gray-200 bg-white flex items-center gap-3">
              {/* Page avatar */}
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src="/images/logo_arishrimp.jpg" />
                <AvatarFallback className="bg-gray-200 text-gray-600 text-xs font-bold">AS</AvatarFallback>
              </Avatar>

              {/* Hidden file inputs */}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />

              <div className="flex-1 flex items-center bg-[#f0f2f5] rounded-full px-4 py-2.5 gap-2.5 border border-gray-100 shadow-sm">
                {/* 1. Sticker Picker */}
                <button onClick={() => setShowStickerPicker(v => !v)}
                  className="text-gray-400 hover:text-blue-500 transition-colors shrink-0" title="Stickers">
                  <Smile className="w-5 h-5" />
                </button>

                <input
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Trả lời trong Messenger..."
                  className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-500"
                />

                {/* 2. Image Select */}
                <button onClick={() => fileInputRef.current?.click()} disabled={isSending}
                  className="text-gray-400 hover:text-blue-500 transition-colors shrink-0 disabled:opacity-40"
                  title="Gửi ảnh">
                  <ImageIcon className="w-5 h-5" />
                </button>

                {/* 3. Video Select */}
                <button onClick={() => videoInputRef.current?.click()} disabled={isSending}
                  className="text-gray-400 hover:text-blue-500 transition-colors shrink-0 disabled:opacity-40"
                  title="Gửi video">
                  <Video className="w-5 h-5" />
                </button>

                {/* 4. Pin Product */}
                <button onClick={() => setIsPinModalOpen(true)}
                  className="text-gray-400 hover:text-blue-500 transition-colors shrink-0"
                  title="Ghim sản phẩm">
                  <Pin className="w-5 h-5 rotate-45" />
                </button>
              </div>

              {/* Action icons (outside the pill) */}
              <div className="flex items-center shrink-0">
                {(input.trim() || pendingImage || pendingVideo) ? (
                  <button onClick={handleSend} disabled={isSending}
                    className="w-10 h-10 flex items-center justify-center bg-[#0084ff] hover:bg-blue-600 text-white rounded-full transition-all disabled:opacity-50 active:scale-95 shadow-sm">
                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                ) : (
                  <button onClick={() => handleSendSticker("https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/512.gif")}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-all active:scale-95" title="Gửi like">
                    <span className="text-xl">👍</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

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

      {/* AlertDialog confirm archive */}
      <AlertDialog open={archiveConfirmOpen} onOpenChange={setArchiveConfirmOpen}>
        <AlertDialogContent className="rounded-3xl dark:bg-slate-900 border dark:border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">Lưu trữ cuộc trò chuyện</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-500 dark:text-gray-400">
              Bạn có chắc chắn muốn lưu trữ cuộc trò chuyện này? Hành động này sẽ đóng cuộc trò chuyện.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl border border-gray-200 hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800">Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                if (conversationToArchive !== null) {
                  handleArchiveConversation(conversationToArchive);
                }
              }}
            >
              Đồng ý
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
