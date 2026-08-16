"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Send, X, Minimize2, MessageCircle, Loader2, ImageIcon, Smile, Video, ShoppingBag, ClipboardList } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTypingStore } from "@/stores/useTypingStore";
import { ChatService } from "@/app/services/chat.service";
import { toast } from "sonner";
import StickerPicker from "./StickerPicker";
import MessageBubble, { TypingBubble, parseReactionsAndMessages } from "./MessageBubble";
import { useRouter } from "next/navigation";
import { PublicProductService } from "@/app/services/publicProduct.service";
import { resolveImageUrl } from "@/lib/resolveImageUrl";

const getFullImageUrl = (url?: string) => resolveImageUrl(url, "/placeholder.svg");
const getChatImageUrl = (url?: string) => resolveImageUrl(url, "");
export default function ChatWindow() {
  const { user } = useAuthStore();
  const router = useRouter();
  const {
    isOpen, closeChat,
    activeConversationId, setActiveConversation,
    messages, setMessages, addMessage,
    sendWsMessage,
    consultProduct, setConsultProduct,
  } = useChatStore();
  const { typingByConv } = useTypingStore();

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingConv, setIsLoadingConv] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [pickerProducts, setPickerProducts] = useState<any[]>([]);

  // Image/video preview before sending
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [pendingVideo, setPendingVideo] = useState<File | null>(null);
  const [pendingVideoPreview, setPendingVideoPreview] = useState<string | null>(null);

  // Quote reply state
  const [replyingTo, setReplyingTo] = useState<any | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const typingThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const convMessages = activeConversationId ? (messages[activeConversationId] ?? []) : [];

  const { reactionsMap: reactionsMapReal, visibleMessages: visibleMessagesReal } = useMemo(() => {
    return parseReactionsAndMessages(convMessages, user?.id);
  }, [convMessages, user?.id]);

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

  useEffect(() => {
    if (!isOpen || isMinimized || !activeConversationId) return;
    let cancelled = false;

    const refreshMessages = async () => {
      const currentMessages = useChatStore.getState().messages[activeConversationId] ?? [];
      if (currentMessages.some((msg) => msg.status === "sending")) return;

      try {
        const freshMessages = await ChatService.getMessages(activeConversationId);
        if (!cancelled) {
          setMessages(activeConversationId, freshMessages);
        }
      } catch {}
    };

    const interval = setInterval(refreshMessages, 3500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isOpen, isMinimized, activeConversationId, setMessages]);

  const scrollToBottom = useCallback((smooth = false) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto"
      });
      return;
    }
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
      });
    }
  }, []);

  // Instant scroll and repeat scroll on open / change conversation
  useEffect(() => {
    if (isOpen && !isMinimized && convMessages.length > 0) {
      scrollToBottom(false);
      let count = 0;
      const interval = setInterval(() => {
        scrollToBottom(false);
        count++;
        if (count >= 6) {
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isOpen, isMinimized, activeConversationId, scrollToBottom]);

  // Smooth scroll when new messages arrive
  useEffect(() => {
    if (isOpen && !isMinimized) {
      const timer = setTimeout(() => {
        scrollToBottom(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [convMessages.length, isOpen, isMinimized, scrollToBottom]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const getReplySnippet = (msg: any) => {
    if (!msg.content) return "";
    let snippet = msg.content;
    const replyMatch = snippet.match(/^\[REPLY:[^\]]+\]([\s\S]*)$/);
    if (replyMatch) snippet = replyMatch[1];
    snippet = snippet.replace(/\[CARD_META:[^\]]+\]/g, "");
    snippet = snippet.replace(/\[STICKER:[^\]]+\]/g, "Nhãn dán");
    return snippet.substring(0, 45);
  };

  const handleSend = useCallback(async () => {
    // If media pending, send it
    if (pendingImage || pendingVideo) {
      const file = pendingImage || pendingVideo!;
      const isImg = !!pendingImage;
      setPendingImage(null); setPendingImagePreview(null);
      setPendingVideo(null); setPendingVideoPreview(null);
      setIsSending(true);
      try {
        const msg = await ChatService.sendImage(activeConversationId!, file);
        addMessage(msg);
      } catch {
        toast.error(isImg ? "Gửi ảnh thất bại" : "Gửi video thất bại");
      } finally { setIsSending(false); }
      return;
    }
    const text = input.trim();
    if (!text || !activeConversationId) return;

    let contentToSend = text;
    if (replyingTo) {
      const snippet = getReplySnippet(replyingTo);
      contentToSend = `[REPLY:${replyingTo.id}|${replyingTo.senderName || "Shop"}|${snippet}]${text}`;
      setReplyingTo(null);
    }

    setInput("");
    // Optimistic send
    const localId = `local-${Date.now()}`;
    const optimistic = {
      id: -Date.now() as number,
      localId,
      conversationId: activeConversationId,
      senderId: user?.id ?? 0,
      senderName: user?.fullName ?? "",
      content: contentToSend,
      messageType: "TEXT" as const,
      isRead: false,
      createdAt: new Date().toISOString(),
      status: "sending" as const,
    };
    addMessage(optimistic);
    try {
      const msg = await ChatService.sendMessage(activeConversationId, contentToSend);
      addMessage({ ...msg, localId, status: "sent" as const });
    } catch {
      addMessage({ ...optimistic, status: "error" as const });
    }
  }, [input, activeConversationId, pendingImage, pendingVideo, user, addMessage, replyingTo]);

  const handleSendProduct = useCallback(async () => {
    if (!consultProduct || !activeConversationId || isSending) return;
    const cardMeta = JSON.stringify({
      id: consultProduct.id,
      name: consultProduct.name,
      price: consultProduct.price,
      imageUrl: getChatImageUrl(consultProduct.imageUrl),
      slug: consultProduct.slug,
    });
    const text = `Tôi muốn được tư vấn về sản phẩm này: ${consultProduct.name}\n[CARD_META:${cardMeta}]`;
    setIsSending(true);
    try {
      const msg = await ChatService.sendMessage(activeConversationId, text);
      addMessage(msg);
      setConsultProduct(null); // Gửi xong thì đóng card
    } catch {
      toast.error("Gửi thông tin sản phẩm thất bại");
    } finally {
      setIsSending(false);
    }
  }, [consultProduct, activeConversationId, isSending, addMessage, setConsultProduct]);

  // Image: show preview first
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setPendingImage(file);
    setPendingImagePreview(URL.createObjectURL(file));
    setPendingVideo(null); setPendingVideoPreview(null);
  };

  // Retry failed message
  const handleRetryMessage = useCallback(async (failedMsg: any) => {
    if (!activeConversationId) return;
    addMessage({ ...failedMsg, status: "sending" });
    try {
      const msg = await ChatService.sendMessage(activeConversationId, failedMsg.content);
      addMessage({ ...msg, localId: failedMsg.localId, status: "sent" });
    } catch {
      addMessage({ ...failedMsg, status: "error" });
    }
  }, [activeConversationId, addMessage]);

  const handleReact = useCallback(async (msg: any, emoji: string) => {
    if (!activeConversationId) return;
    const content = `[REACTION:${emoji}|${msg.id}]`;
    const localId = `local-react-${Date.now()}`;
    const optimistic = {
      id: -Date.now() as number,
      localId,
      conversationId: activeConversationId,
      senderId: user?.id ?? 0,
      senderName: user?.fullName ?? "",
      content,
      messageType: "TEXT" as const,
      isRead: false,
      createdAt: new Date().toISOString(),
      status: "sending" as const,
    };
    addMessage(optimistic);
    try {
      const serverMsg = await ChatService.sendMessage(activeConversationId, content);
      addMessage({ ...serverMsg, localId, status: "sent" as const });
    } catch {
      addMessage({ ...optimistic, status: "error" as const });
    }
  }, [activeConversationId, user, addMessage]);

  // Load products for picker popup
  useEffect(() => {
    if (showProductPicker && pickerProducts.length === 0) {
      PublicProductService.getList({ page: 0, size: 10 })
        .then((res) => {
          setPickerProducts(res.content || []);
        })
        .catch(() => {});
    }
  }, [showProductPicker, pickerProducts.length]);

  const handleSendSticker = async (stickerUrl: string) => {
    if (!activeConversationId || isSending) return;
    setIsSending(true);
    setShowStickerPicker(false);
    try {
      const text = `[STICKER:${stickerUrl}]`;
      const msg = await ChatService.sendMessage(activeConversationId, text);
      addMessage(msg);
    } catch {
      toast.error("Gửi sticker thất bại");
    } finally {
      setIsSending(false);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setPendingVideo(file);
    setPendingVideoPreview(URL.createObjectURL(file));
    setPendingImage(null); setPendingImagePreview(null);
  };

  const handleGoToOrders = () => {
    closeChat();
    router.push("/orders/list");
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
    <div className={`fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-[400px] md:w-[430px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 flex flex-col ${isMinimized ? "h-auto" : "h-[560px] md:h-[580px]"}`}>
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
          <div ref={messagesContainerRef} onLoadCapture={() => scrollToBottom(false)} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col gap-3 bg-gray-50 dark:bg-slate-800/50">
            {isLoadingConv ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            ) : visibleMessagesReal.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                <MessageCircle className="w-10 h-10 opacity-30" />
                <p className="text-sm">Bắt đầu cuộc trò chuyện</p>
                <p className="text-xs">Chúng tôi luôn sẵn sàng hỗ trợ bạn!</p>
              </div>
            ) : (
              visibleMessagesReal.map((msg, index) => (
                <MessageBubble
                  key={msg.localId ?? msg.id}
                  message={msg}
                  isOwn={msg.senderId === user?.id}
                  isLast={index === visibleMessagesReal.length - 1}
                  onRetry={handleRetryMessage}
                  onReply={setReplyingTo}
                  reactions={reactionsMapReal[msg.id]}
                  onReact={handleReact}
                />
              ))
            )}
            {activeConversationId && typingByConv[activeConversationId] && (
              <TypingBubble name="Shop" isAdmin={true} />
            )}
            <div ref={bottomRef} />
          </div>

          {/* Panel sản phẩm đang tư vấn (Shopee style) */}
          {consultProduct && (
            <div className="bg-slate-50 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 px-3 py-2 flex flex-col gap-1.5 animate-fadeIn relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Bạn đang trao đổi với Người bán về sản phẩm này</span>
                <button 
                  onClick={() => setConsultProduct(null)} 
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                  title="Đóng panel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-lg p-2 border border-gray-100 dark:border-slate-700 shadow-sm">
                <div className="w-12 h-12 relative rounded bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 overflow-hidden shrink-0">
                  <img src={getFullImageUrl(consultProduct.imageUrl)} alt="product" className="object-contain w-full h-full p-0.5" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <h4 className="text-xs font-bold text-gray-800 dark:text-gray-100 line-clamp-1 leading-tight">{consultProduct.name}</h4>
                  <span className="text-xs font-extrabold text-red-500">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(consultProduct.price)}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button 
                    onClick={() => setShowProductPicker(true)}
                    className="px-2.5 py-1.5 border border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full font-bold text-[9px] uppercase tracking-wider transition-colors"
                  >
                    Thay đổi
                  </button>
                  <button 
                    onClick={handleSendProduct}
                    disabled={isSending}
                    className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white rounded-full font-bold text-[9px] uppercase tracking-wider transition-colors"
                  >
                    Gửi sản phẩm
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sticker Picker Popover */}
          {showStickerPicker && (
            <StickerPicker
              onSelectSticker={handleSendSticker}
              onClose={() => setShowStickerPicker(false)}
              className="absolute bottom-[60px] left-4 w-[320px] max-w-[calc(100vw-3rem)]"
            />
          )}

          {/* Product Picker Popover */}
          {showProductPicker && (
            <div className="bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 px-3 py-2 flex flex-col gap-1.5 max-h-[180px] overflow-y-auto animate-fadeIn relative z-10">
              <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-slate-700">
                <span className="text-[10px] font-bold text-gray-500">Chọn sản phẩm tư vấn</span>
                <button onClick={() => setShowProductPicker(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                {pickerProducts.length === 0 ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                  </div>
                ) : (
                  pickerProducts.map((p) => {
                    const price = p.variants?.[0]?.price || p.price || 0;
                    const imageUrl = p.variants?.find((variant: any) => variant?.imageUrl)?.imageUrl || p.imageUrls?.[0] || "";
                    const resolvedImageUrl = getChatImageUrl(imageUrl);
                    return (
                      <div 
                        key={p.id}
                        onClick={() => {
                          setConsultProduct({
                            id: p.id,
                            name: p.name,
                            price: price,
                            imageUrl: resolvedImageUrl,
                            slug: p.slug,
                          });
                          setShowProductPicker(false);
                        }}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                      >
                        <div className="w-8 h-8 relative rounded bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 overflow-hidden shrink-0">
                          <img src={getFullImageUrl(imageUrl)} alt={p.name} className="object-contain w-full h-full p-0.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[10px] font-bold text-gray-800 dark:text-gray-100 truncate">{p.name}</h4>
                          <span className="text-[10px] font-extrabold text-red-500">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Image / Video Preview Strip */}
          {(pendingImagePreview || pendingVideoPreview) && (
            <div className="bg-gray-50 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 px-3 py-2 flex items-center gap-2">
              <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600">
                {pendingImagePreview && <img src={pendingImagePreview} alt="preview" className="w-full h-full object-cover" />}
                {pendingVideoPreview && <video src={pendingVideoPreview} className="w-full h-full object-cover" />}
                <button onClick={() => { setPendingImage(null); setPendingImagePreview(null); setPendingVideo(null); setPendingVideoPreview(null); }}
                  className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-gray-800/70 hover:bg-red-500 text-white rounded-full flex items-center justify-center">
                  <X className="w-2 h-2" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-500 truncate">{pendingImage?.name ?? pendingVideo?.name}</p>
                <p className="text-[9px] text-gray-400">Nhấn gửi để upload</p>
              </div>
              <button onClick={handleSend} disabled={isSending}
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-[10px] font-bold transition-colors disabled:opacity-50">
                {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                Gửi
              </button>
            </div>
          )}

          {/* Quote reply banner */}
          {replyingTo && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                <span className="font-bold shrink-0">Đang trả lời {replyingTo.senderName}:</span>
                <span className="italic truncate">"{replyingTo.content}"</span>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full shrink-0 ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Input area (Shopee style layout) */}
          <div className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 p-2.5 flex flex-col gap-2">
            {/* Input Row */}
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Nhập nội dung tin nhắn..."
                disabled={isSending}
                className="flex-1 px-3 py-2 bg-gray-100 dark:bg-slate-800 border-none rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 dark:text-gray-100 placeholder-gray-400 animate-fadeIn"
              />
              <button
                onClick={handleSend}
                disabled={(!input.trim() && !pendingImage && !pendingVideo) || isSending}
                className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-white" />
                )}
              </button>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-4 text-gray-400 dark:text-gray-500">
                {/* 1. Stickers */}
                <button onClick={() => { setShowStickerPicker(v => !v); setShowProductPicker(false); }} className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors" title="Stickers">
                  <Smile className="w-5 h-5" />
                </button>
                {/* 2. Gửi ảnh */}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                <button onClick={() => fileInputRef.current?.click()} className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors" title="Gửi ảnh">
                  <ImageIcon className="w-5 h-5" />
                </button>
                {/* 3. Gửi video */}
                <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />
                <button onClick={() => videoInputRef.current?.click()} className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors" title="Gửi video">
                  <Video className="w-5 h-5" />
                </button>
                {/* 4. Sản phẩm */}
                <button onClick={() => { setShowProductPicker(v => !v); setShowStickerPicker(false); }} className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors" title="Chọn sản phẩm tư vấn">
                  <ShoppingBag className="w-5 h-5" />
                </button>
                {/* 5. Đơn hàng */}
                <button onClick={handleGoToOrders} className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors" title="Đơn hàng của tôi">
                  <ClipboardList className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

