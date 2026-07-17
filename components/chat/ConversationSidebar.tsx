"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Conversation } from "@/app/types/chat.types";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { MessageCircle, Search } from "lucide-react";
import { parseLocalDateTime } from "@/lib/dateUtils";

type FilterTab = "all" | "unread" | "assigned";

const TABS: Array<{ id: FilterTab; label: string }> = [
  { id: "all", label: "Tất cả" },
  { id: "unread", label: "Chưa đọc" },
  { id: "assigned", label: "Đã phân công" },
];

interface Props {
  conversations: Conversation[];
  activeId: number | null;
  onSelect: (conv: Conversation) => void;
  isLoading?: boolean;
}

export default function ConversationSidebar({ conversations, activeId, onSelect, isLoading }: Props) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const filtered = conversations.filter((c) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      c.customerName?.toLowerCase().includes(q) ||
      c.lastMessage?.toLowerCase().includes(q);

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "unread" && c.unreadByShop > 0) ||
      (activeTab === "assigned" && Boolean(c.assignedStaffId));

    return matchesQuery && matchesTab;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse border-b border-gray-100">
            <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex items-center gap-2 bg-[#f0f2f5] rounded-full px-3 py-1.5">
          <Search className="w-4 h-4 text-gray-500 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm"
            className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-0 border-b border-gray-200 px-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-center py-2.5 text-[13px] font-medium transition-colors relative ${
              activeTab === tab.id
                ? "text-[#0084ff]"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#0084ff]" />
            )}
          </button>
        ))}
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
            <MessageCircle className="w-8 h-8 opacity-40" />
            <p className="text-sm">{query ? "Không tìm thấy kết quả" : "Chưa có cuộc trò chuyện"}</p>
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive = conv.id === activeId;
            const hasUnread = conv.unreadByShop > 0;
            const timeAgo = conv.lastMessageAt
              ? formatDistanceToNow(parseLocalDateTime(conv.lastMessageAt), { addSuffix: false, locale: vi })
              : "";

            // Shorten time display like Messenger: "T4", "10:32", "2 giờ"
            const shortTime = timeAgo
              .replace(" trước", "")
              .replace("khoảng ", "~");

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={`flex items-center gap-3 px-3 py-2.5 w-full text-left transition-colors ${
                  isActive
                    ? "bg-[#ebf5ff]"
                    : "hover:bg-[#f2f2f2]"
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={conv.customerAvatar} />
                    <AvatarFallback className="bg-gray-300 text-gray-700 font-semibold text-sm">
                      {conv.customerName?.charAt(0) ?? "K"}
                    </AvatarFallback>
                  </Avatar>
                  {hasUnread && (
                    <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] bg-[#0084ff] rounded-full flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">{conv.unreadByShop > 9 ? "9+" : conv.unreadByShop}</span>
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-[14px] truncate ${hasUnread ? "font-bold text-gray-900" : "font-normal text-gray-700"}`}>
                      {conv.customerName}
                    </p>
                    <span className="text-[12px] text-gray-400 shrink-0">{shortTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className={`text-[13px] truncate flex-1 ${hasUnread ? "font-semibold text-gray-800" : "text-gray-500"}`}>
                      {conv.lastMessage
                        ? `Bạn: ${conv.lastMessage}`
                        : "Bắt đầu cuộc trò chuyện"
                      }
                    </p>
                  </div>
                  {/* Tags row */}
                  <div className="flex items-center gap-1.5 mt-1">
                    {conv.assignedStaffName && (
                      <span className="text-[11px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-sm truncate max-w-[80px]">
                        {conv.assignedStaffName}
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400">
                      {conv.status === "OPEN" ? "● Tiếp nhận" : "○ Đã đóng"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
