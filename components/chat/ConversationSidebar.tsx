"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Conversation } from "@/app/types/chat.types";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { MessageCircle, Search } from "lucide-react";

interface Props {
  conversations: Conversation[];
  activeId: number | null;
  onSelect: (conv: Conversation) => void;
  isLoading?: boolean;
}

export default function ConversationSidebar({ conversations, activeId, onSelect, isLoading }: Props) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? conversations.filter(
        (c) =>
          c.customerName?.toLowerCase().includes(query.toLowerCase()) ||
          c.lastMessage?.toLowerCase().includes(query.toLowerCase())
      )
    : conversations;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
            <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-slate-600 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-lg px-3 py-1.5">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm..."
            className="flex-1 bg-transparent text-sm outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
            <MessageCircle className="w-8 h-8 opacity-40" />
            <p className="text-sm">{query ? "Không tìm thấy kết quả" : "Chưa có cuộc trò chuyện"}</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100 dark:divide-slate-700">
            {filtered.map((conv) => {
              const isActive = conv.id === activeId;
              const hasUnread = conv.unreadByShop > 0;
              const timeAgo = conv.lastMessageAt
                ? formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true, locale: vi })
                : "";

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv)}
                  className={`flex items-center gap-3 px-4 py-3 w-full text-left transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50 ${
                    isActive ? "bg-teal-50 dark:bg-teal-900/30" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar className="w-11 h-11">
                      <AvatarImage src={conv.customerAvatar} />
                      <AvatarFallback className="bg-teal-100 text-teal-700 font-semibold text-sm">
                        {conv.customerName?.charAt(0) ?? "K"}
                      </AvatarFallback>
                    </Avatar>
                    {hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-[9px] text-white font-bold">{conv.unreadByShop > 9 ? "9+" : conv.unreadByShop}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-sm truncate ${hasUnread ? "font-semibold text-gray-900 dark:text-white" : "font-medium text-gray-700 dark:text-gray-300"}`}>
                        {conv.customerName}
                      </p>
                      <span className="text-[10px] text-gray-400 shrink-0">{timeAgo}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <p className={`text-xs truncate flex-1 ${hasUnread ? "text-gray-800 dark:text-gray-200" : "text-gray-500 dark:text-gray-400"}`}>
                        {conv.lastMessage || "Bắt đầu cuộc trò chuyện"}
                      </p>
                      {conv.assignedStaffName && (
                        <span className="text-[9px] bg-teal-100 dark:bg-teal-800/40 text-teal-700 dark:text-teal-300 px-1 py-0.5 rounded shrink-0 truncate max-w-[60px]">
                          {conv.assignedStaffName}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
