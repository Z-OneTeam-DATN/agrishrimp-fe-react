"use client";

import Image from "next/image";
import { Check, CheckCheck, Bot } from "lucide-react";
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

  const isBot = message.senderName === "AgriShrimp Bot";

  return (
    <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {!isOwn && (
        <div className="relative shrink-0">
          <Avatar className="w-7 h-7">
            <AvatarImage src={message.senderAvatar} />
            <AvatarFallback className="text-xs bg-teal-100 text-teal-700">
              {message.senderName?.charAt(0) ?? "?"}
            </AvatarFallback>
          </Avatar>
          {isBot && (
            <span className="absolute -bottom-1 -right-1 bg-amber-400 rounded-full p-0.5">
              <Bot className="w-2.5 h-2.5 text-white" />
            </span>
          )}
        </div>
      )}

      <div className={`flex flex-col gap-0.5 max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
        {message.messageType === "PINNED_PRODUCT" && message.pinnedProduct ? (
          <div className="flex flex-col gap-1">
            {message.content && (
              <div className={`px-3 py-2 rounded-2xl text-sm ${
                isOwn ? "bg-teal-500 text-white rounded-br-sm" : "bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 rounded-bl-sm shadow-sm"
              }`}>
                {message.content}
              </div>
            )}
            <PinnedProductCard product={message.pinnedProduct} />
          </div>
        ) : message.messageType === "IMAGE" && message.imageUrl ? (
          <div className="relative rounded-xl overflow-hidden max-w-[200px] cursor-pointer"
            onClick={() => window.open(message.imageUrl, "_blank")}>
            <Image
              src={message.imageUrl}
              alt="Ảnh chat"
              width={200}
              height={200}
              className="object-cover rounded-xl hover:opacity-90 transition-opacity"
            />
          </div>
        ) : (
          <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
            isOwn
              ? "bg-teal-500 text-white rounded-br-sm"
              : "bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 rounded-bl-sm shadow-sm"
          }`}>
            {message.content}
          </div>
        )}

        {/* Time + read receipt */}
        <div className={`flex items-center gap-1 px-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[10px] text-gray-400">{time}</span>
          {isOwn && isLast && (
            message.isRead
              ? <CheckCheck className="w-3.5 h-3.5 text-teal-400" />
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
        <AvatarFallback className="text-xs bg-teal-100 text-teal-700">
          {name?.charAt(0) ?? "S"}
        </AvatarFallback>
      </Avatar>
      <div className="bg-white dark:bg-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}
