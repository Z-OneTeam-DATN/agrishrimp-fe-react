"use client";

import Image from "next/image";
import { Check, CheckCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatMessage } from "@/app/types/chat.types";
import PinnedProductCard from "./PinnedProductCard";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { formatDate } from "@/lib/dateUtils";

interface Props {
  message: ChatMessage;
  isOwn: boolean;
  isLast?: boolean;
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

function parseCardMeta(content: string): { cleanText: string; cardMeta: ParsedCardMeta | null } {
  const match = content.match(/\[CARD_META:([^\]]+)\]/);
  if (!match) return { cleanText: content, cardMeta: null };

  try {
    const rawJson = match[1];
    const parsed = JSON.parse(rawJson) as ParsedCardMeta;
    parsed.name = decodeURIComponent(parsed.name);
    parsed.imageUrl = decodeURIComponent(parsed.imageUrl);
    const cleanText = content.replace(/\[CARD_META:[^\]]+\]/, "").trim();
    return { cleanText, cardMeta: parsed };
  } catch {
    return { cleanText: content, cardMeta: null };
  }
}

export default function MessageBubble({ message, isOwn, isLast }: Props) {
  const time = message.createdAt
    ? formatDate(message.createdAt, "HH:mm")
    : "";

  const { cleanText, cardMeta } = parseCardMeta(message.content || "");

  return (
    <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {!isOwn && (
        <Avatar className="w-7 h-7 shrink-0">
          <AvatarImage src={message.senderAvatar} />
          <AvatarFallback className="text-xs bg-gray-200 text-gray-600 font-medium">
            {message.senderName?.charAt(0) ?? "?"}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`flex flex-col gap-0.5 max-w-[65%] ${isOwn ? "items-end" : "items-start"}`}>
        {message.messageType === "PINNED_PRODUCT" && message.pinnedProduct ? (
          <div className="flex flex-col gap-1">
            {message.content && (
              <div className={`px-3 py-2 text-[15px] leading-relaxed ${
                isOwn
                  ? "bg-[#0084ff] text-white rounded-[18px] rounded-br-[4px]"
                  : "bg-[#f0f0f0] text-gray-900 rounded-[18px] rounded-bl-[4px]"
              }`}>
                {message.content}
              </div>
            )}
            <PinnedProductCard product={message.pinnedProduct} />
          </div>
        ) : message.messageType === "IMAGE" && message.imageUrl ? (
          <div
            className="relative overflow-hidden max-w-[220px] cursor-pointer rounded-lg"
            onClick={() => window.open(message.imageUrl, "_blank")}
          >
            <Image
              src={message.imageUrl}
              alt="Ảnh chat"
              width={220}
              height={220}
              className="object-cover hover:opacity-90 transition-opacity"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {cleanText && (
              <div className={`px-3 py-2 text-[15px] leading-relaxed ${
                isOwn
                  ? "bg-[#0084ff] text-white rounded-[18px] rounded-br-[4px]"
                  : "bg-[#f0f0f0] text-gray-900 rounded-[18px] rounded-bl-[4px]"
              }`}>
                {cleanText}
              </div>
            )}
            {cardMeta && (
              <div 
                onClick={() => window.open(`/san-pham/${cardMeta.slug}`, "_blank")}
                className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-700 rounded-xl p-2.5 shadow-sm hover:shadow-md cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/80 max-w-[280px]"
              >
                <div className="w-14 h-14 relative rounded bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 overflow-hidden shrink-0">
                  <img src={getFullImageUrl(cardMeta.imageUrl)} alt="product" className="object-contain w-full h-full p-0.5" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <h4 className="text-[12px] font-bold text-gray-800 dark:text-gray-100 line-clamp-2 leading-snug">{cardMeta.name}</h4>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-[12px] font-extrabold text-red-500">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cardMeta.price)}</span>
                    <span className="text-[9px] font-medium text-blue-500 hover:underline shrink-0">Xem chi tiết</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Time + read receipt */}
        <div className={`flex items-center gap-1 px-0.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[11px] text-gray-400">{time}</span>
          {isOwn && isLast && (
            message.isRead
              ? <CheckCheck className="w-3.5 h-3.5 text-[#0084ff]" />
              : <Check className="w-3.5 h-3.5 text-gray-400" />
          )}
        </div>
      </div>
    </div>
  );
}

/** Typing dots indicator */
export function TypingBubble({ name }: { name?: string }) {
  return (
    <div className="flex items-end gap-2">
      <Avatar className="w-7 h-7 shrink-0">
        <AvatarFallback className="text-xs bg-gray-200 text-gray-600 font-medium">
          {name?.charAt(0) ?? "S"}
        </AvatarFallback>
      </Avatar>
      <div className="bg-[#f0f0f0] rounded-[18px] rounded-bl-[4px] px-4 py-3 flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}
