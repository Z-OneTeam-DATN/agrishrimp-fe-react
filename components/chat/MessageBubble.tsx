"use client";

import Image from "next/image";
import { Check, CheckCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatMessage } from "@/app/types/chat.types";
import PinnedProductCard from "./PinnedProductCard";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface Props {
  message: ChatMessage;
  isOwn: boolean;
  isLast?: boolean;
}

export default function MessageBubble({ message, isOwn, isLast }: Props) {
  const time = message.createdAt
    ? format(new Date(message.createdAt), "HH:mm", { locale: vi })
    : "";

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
          <div className={`px-3 py-2 text-[15px] leading-relaxed ${
            isOwn
              ? "bg-[#0084ff] text-white rounded-[18px] rounded-br-[4px]"
              : "bg-[#f0f0f0] text-gray-900 rounded-[18px] rounded-bl-[4px]"
          }`}>
            {message.content}
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
