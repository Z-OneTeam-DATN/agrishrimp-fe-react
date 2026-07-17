"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Check, CheckCheck, Loader2, AlertCircle, RotateCcw, Smile, CornerUpLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatMessage } from "@/app/types/chat.types";
import PinnedProductCard from "./PinnedProductCard";
import { formatDate } from "@/lib/dateUtils";

interface Props {
  message: ChatMessage;
  isOwn: boolean;
  isLast?: boolean;
  onRetry?: (message: ChatMessage) => void;
  isAdminWorkspace?: boolean;
  onReply?: (message: ChatMessage) => void;
  reactions?: {
    admin?: string;
    customer?: string;
  };
  onReact?: (message: ChatMessage, emoji: string) => void;
}

interface MessageReactions {
  [msgId: number]: {
    admin?: string;
    customer?: string;
  };
}

export function parseReactionsAndMessages(messages: ChatMessage[], customerId?: number) {
  const reactionsMap: MessageReactions = {};
  const visibleMessages: ChatMessage[] = [];

  for (const msg of messages) {
    const content = msg.content || "";
    const reactionMatch = content.match(/^\[REACTION:([^|]+)\|(-?\d+)\]$/);
    if (reactionMatch) {
      const emoji = reactionMatch[1];
      const targetMsgId = parseInt(reactionMatch[2], 10);
      const isCustomer = customerId && msg.senderId === customerId;

      if (!reactionsMap[targetMsgId]) {
        reactionsMap[targetMsgId] = {};
      }

      if (emoji === "REMOVE") {
        if (isCustomer) {
          delete reactionsMap[targetMsgId].customer;
        } else {
          delete reactionsMap[targetMsgId].admin;
        }
      } else {
        if (isCustomer) {
          reactionsMap[targetMsgId].customer = emoji;
        } else {
          reactionsMap[targetMsgId].admin = emoji;
        }
      }
    } else {
      visibleMessages.push(msg);
    }
  }

  return { reactionsMap, visibleMessages };
}

const getFullImageUrl = (url?: string) => {
  if (!url) return "/placeholder.svg";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const origin = process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:8004";
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
};

interface ParsedCardMeta {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  slug: string;
}

interface ReplyInfo {
  id: string;
  sender: string;
  snippet: string;
}

function parseMessageContent(content: string): { 
  cleanText: string; 
  cardMeta: ParsedCardMeta | null; 
  stickerUrl: string;
  replyInfo: ReplyInfo | null;
} {
  let cleanText = content;

  // Extract REPLY prefix if any: [REPLY:id|senderName|snippetText]
  const replyMatch = cleanText.match(/^\[REPLY:([^|]+)\|([^|]+)\|([^\]]+)\]([\s\S]*)$/);
  let replyInfo: ReplyInfo | null = null;
  if (replyMatch) {
    replyInfo = {
      id: replyMatch[1],
      sender: replyMatch[2],
      snippet: replyMatch[3]
    };
    cleanText = replyMatch[4];
  }

  const cardMatch = cleanText.match(/\[CARD_META:([^\]]+)\]/);
  let cardMeta = null;
  if (cardMatch) {
    try {
      const rawJson = cardMatch[1];
      const parsed = JSON.parse(rawJson) as ParsedCardMeta;
      parsed.name = decodeURIComponent(parsed.name);
      parsed.imageUrl = decodeURIComponent(parsed.imageUrl);
      cardMeta = parsed;
      cleanText = cleanText.replace(/\[CARD_META:[^\]]+\]/, "").trim();
    } catch {}
  }
  const stickerMatch = cleanText.match(/^\[STICKER:([^\]]+)\]$/);
  let stickerUrl = "";
  if (stickerMatch) {
    stickerUrl = stickerMatch[1];
    cleanText = "";
  }
  return { cleanText, cardMeta, stickerUrl, replyInfo };
}

const isVideoFile = (url?: string) => {
  if (!url) return false;
  return url.toLowerCase().match(/\.(mp4|webm|ogg|mov|avi|3gp)$/) || url.includes("/video/upload/");
};

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

export default function MessageBubble({ message, isOwn, isLast, onRetry, isAdminWorkspace, onReply, reactions, onReact }: Props) {
  const time = message.createdAt ? formatDate(message.createdAt, "HH:mm") : "";
  const { cleanText, cardMeta, stickerUrl, replyInfo } = parseMessageContent(message.content || "");
  const sendStatus = message.status;
  const isError = sendStatus === "error";
  const isSending = sendStatus === "sending";

  const isSenderAdmin = isAdminWorkspace ? isOwn : !isOwn;
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);

  const adminReaction = reactions?.admin;
  const customerReaction = reactions?.customer;

  const activeReactions: string[] = [];
  if (adminReaction) activeReactions.push(adminReaction);
  if (customerReaction) activeReactions.push(customerReaction);

  const uniqueEmojis = Array.from(new Set(activeReactions));
  const totalReactionCount = activeReactions.length;

  const handleReactClick = (emoji: string) => {
    if (onReact) {
      const currentUserReaction = isAdminWorkspace ? reactions?.admin : reactions?.customer;
      if (currentUserReaction === emoji) {
        onReact(message, "REMOVE");
      } else {
        onReact(message, emoji);
      }
    }
    setShowEmojiMenu(false);
  };

  const handleBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReact) {
      const currentUserReaction = isAdminWorkspace ? reactions?.admin : reactions?.customer;
      if (currentUserReaction) {
        onReact(message, "REMOVE");
      }
    }
  };

  const handleScrollToMessage = () => {
    if (!replyInfo) return;
    const targetElement = document.getElementById(`msg-${replyInfo.id}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      targetElement.style.backgroundColor = "rgba(251, 191, 36, 0.25)"; // Soft amber/yellow
      setTimeout(() => {
        targetElement.style.backgroundColor = "";
      }, 1500);
    }
  };

  return (
    <div 
      id={`msg-${message.id}`}
      className={`group relative flex items-end gap-2 p-1 rounded-lg transition-all duration-500 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
    >
      {isSenderAdmin ? (
        <div className="relative w-7 h-7 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-white">
          <Image src="/images/logo_arishrimp.jpg" alt="AgriShrimp" fill className="object-cover" unoptimized />
        </div>
      ) : (
        <Avatar className="w-7 h-7 shrink-0">
          <AvatarImage src={getFullImageUrl(message.senderAvatar)} />
          <AvatarFallback className="text-xs bg-gray-200 text-gray-600 font-medium">
            {message.senderName?.charAt(0) ?? "?"}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message Column */}
      <div className={`flex flex-col gap-0.5 max-w-[65%] ${isOwn ? "items-end" : "items-start"}`}>
        {/* Quote Reply Header */}
        {replyInfo && (
          <div 
            onClick={handleScrollToMessage}
            className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 mb-1 max-w-[240px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl px-2.5 py-1 border-l-2 border-blue-500 cursor-pointer select-none transition-colors"
            title="Nhấp để đi tới tin nhắn gốc"
          >
            <span className="font-bold shrink-0">{replyInfo.sender}:</span>
            <span className="italic truncate">"{replyInfo.snippet}"</span>
          </div>
        )}

        <div className="relative">
          {stickerUrl ? (
            <div className="relative overflow-hidden max-w-[80px] select-none p-1">
              <img src={stickerUrl} alt="Sticker" className="w-16 h-16 object-contain animate-pulse" />
            </div>
          ) : message.messageType === "PINNED_PRODUCT" && message.pinnedProduct ? (
            <div className="flex flex-col gap-1">
              {cleanText && (
                <div className={`px-3 py-2 text-[15px] leading-relaxed ${isOwn ? "bg-[#0084ff] text-white rounded-[18px] rounded-br-[4px]" : "bg-[#f0f0f0] text-gray-900 rounded-[18px] rounded-bl-[4px]"}`}>
                  {cleanText}
                </div>
              )}
              <PinnedProductCard product={message.pinnedProduct} />
            </div>
          ) : message.messageType === "IMAGE" && message.imageUrl ? (
            isVideoFile(message.imageUrl) ? (
              <div className="relative overflow-hidden max-w-[220px] rounded-lg">
                <video controls src={message.imageUrl} className="w-full max-h-[220px] object-cover bg-black" />
              </div>
            ) : (
              <div className="relative overflow-hidden max-w-[220px] cursor-pointer rounded-lg" onClick={() => window.open(message.imageUrl, "_blank")}>
                <Image src={message.imageUrl} alt="Ảnh chat" width={220} height={220} className="object-cover hover:opacity-90 transition-opacity" />
              </div>
            )
          ) : (
            <div className="flex flex-col gap-1.5">
              {cleanText && (
                <div className={`px-3 py-2 text-[15px] leading-relaxed ${isOwn ? (isError ? "bg-red-50 border border-red-200 text-gray-900 rounded-[18px] rounded-br-[4px]" : "bg-[#0084ff] text-white rounded-[18px] rounded-br-[4px]") : "bg-[#f0f0f0] text-gray-900 rounded-[18px] rounded-bl-[4px]"}`}>
                  {cleanText}
                </div>
              )}
              {cardMeta && (
                <div onClick={() => window.open(`/san-pham/${cardMeta.slug}`, "_blank")} className="flex items-center gap-3 bg-white border rounded-xl p-2.5 shadow-sm hover:shadow-md cursor-pointer transition-all hover:bg-slate-50 max-w-[280px]">
                  <div className="w-14 h-14 relative rounded bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                    <img src={getFullImageUrl(cardMeta.imageUrl)} alt="product" className="object-contain w-full h-full p-0.5" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <h4 className="text-[12px] font-bold text-gray-800 line-clamp-2 leading-snug">{cardMeta.name}</h4>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-[12px] font-extrabold text-red-500">{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(cardMeta.price)}</span>
                      <span className="text-[9px] font-medium text-blue-500 hover:underline shrink-0">Xem chi tiết</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reaction Badge overlay — aligned on the bottom corner of the bubble */}
          {totalReactionCount > 0 && (
            <div 
              onClick={handleBadgeClick}
              className={`absolute -bottom-2.5 ${isOwn ? "left-2" : "right-2"} bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-sm rounded-full px-1.5 py-0.5 text-[11px] select-none z-10 flex items-center gap-0.5 cursor-pointer hover:scale-105 active:scale-95 transition-transform animate-fadeIn`}
            >
              <span>{uniqueEmojis.join("")}</span>
              <span className="text-[10px] text-gray-500 font-bold">{totalReactionCount}</span>
            </div>
          )}
        </div>

        {isAdminWorkspace && isSenderAdmin && message.senderName && (
          <div className={`w-full flex items-center gap-1 text-[10px] text-gray-500 mt-0.5 font-medium ${isOwn ? "justify-end" : "justify-start"}`}>
            <span>Người gửi:</span>
            <span className="font-semibold text-slate-700">{message.senderName}</span>
          </div>
        )}
        <div className={`flex items-center gap-1 px-0.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[11px] text-gray-400">{time}</span>
          {isOwn && (
            <>
              {isSending && <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />}
              {isError && (
                <button onClick={() => onRetry?.(message)} className="flex items-center gap-1 text-[10px] text-red-500 hover:text-red-600 font-medium transition-colors" title="Gửi lại tin nhắn">
                  <AlertCircle className="w-3 h-3" />
                  <span>Lỗi · Gửi lại</span>
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
              {!isSending && !isError && isLast && (
                message.isRead ? <CheckCheck className="w-3.5 h-3.5 text-[#0084ff]" /> : <Check className="w-3.5 h-3.5 text-gray-400" />
              )}
            </>
          )}
        </div>
      </div>

      {/* Action buttons (React, Reply) on hover — visible for all chat windows */}
      <div className={`opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0 ${isOwn ? "flex-row-reverse" : "flex-row"} self-center`}>
          {/* Reaction Emoji Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiMenu(!showEmojiMenu)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              title="Thả cảm xúc"
            >
              <Smile className="w-4 h-4" />
            </button>
            
            {showEmojiMenu && (
              <div className={`absolute bottom-8 bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.12)] rounded-full px-2 py-1 flex items-center gap-1.5 z-50 animate-fadeIn ${isOwn ? "right-0" : "left-0"}`}>
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReactClick(emoji)}
                    className="text-base hover:scale-125 active:scale-95 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reply Button */}
          {onReply && (
            <button
              onClick={() => onReply(message)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              title="Trả lời"
            >
              <CornerUpLeft className="w-4 h-4" />
            </button>
          )}
        </div>
    </div>
  );
}

export function TypingBubble({ name, avatarUrl, isAdmin }: { name?: string; avatarUrl?: string; isAdmin?: boolean }) {
  return (
    <div className="flex items-end gap-2">
      {isAdmin ? (
        <div className="relative w-7 h-7 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-white">
          <Image src="/images/logo_arishrimp.jpg" alt="AgriShrimp" fill className="object-cover" unoptimized />
        </div>
      ) : (
        <Avatar className="w-7 h-7 shrink-0">
          {avatarUrl && <AvatarImage src={getFullImageUrl(avatarUrl)} />}
          <AvatarFallback className="text-xs bg-gray-200 text-gray-600 font-medium">{name?.charAt(0) ?? "S"}</AvatarFallback>
        </Avatar>
      )}
      <div className="bg-[#f0f0f0] rounded-[18px] rounded-bl-[4px] px-4 py-3 flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}
