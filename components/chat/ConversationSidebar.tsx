"use client";

import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Conversation } from "@/app/types/chat.types";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Clock3, MessageCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ChatConversationMeta,
  ChatConversationMetaMap,
  ChatQueueTab,
  getPriorityMeta,
  getStageMeta,
  isWaitingConversation,
} from "@/lib/chat-workspace";

const TABS: Array<{ id: ChatQueueTab; label: string }> = [
  { id: "latest", label: "Mới nhất" },
  { id: "read", label: "Đã đọc" },
  { id: "waiting", label: "Đang chờ" },
  { id: "assigned", label: "Đã phân công" },
];

interface Props {
  conversations: Conversation[];
  activeId: number | null;
  onSelect: (conv: Conversation) => void;
  metaByConversationId: ChatConversationMetaMap;
  isLoading?: boolean;
}

function formatConversationTime(date?: string) {
  if (!date) {
    return "Mới";
  }

  const distance = formatDistanceToNow(new Date(date), {
    addSuffix: false,
    locale: vi,
  });

  return distance.replace(" trước", "").replace("khoảng ", "~");
}

export default function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  metaByConversationId,
  isLoading,
}: Props) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ChatQueueTab>("latest");

  const conversationItems = useMemo(() => {
    return conversations
      .map((conversation) => ({
        conversation,
        meta: metaByConversationId[conversation.id] as ChatConversationMeta,
      }))
      .sort((a, b) => {
        const aTime = a.conversation.lastMessageAt
          ? new Date(a.conversation.lastMessageAt).getTime()
          : 0;
        const bTime = b.conversation.lastMessageAt
          ? new Date(b.conversation.lastMessageAt).getTime()
          : 0;
        return bTime - aTime;
      });
  }, [conversations, metaByConversationId]);

  const counts = useMemo(() => {
    return {
      latest: conversationItems.length,
      read: conversationItems.filter(
        ({ conversation }) => conversation.unreadByShop === 0,
      ).length,
      waiting: conversationItems.filter(({ conversation, meta }) =>
        isWaitingConversation(conversation, meta),
      ).length,
      assigned: conversationItems.filter(
        ({ conversation }) => Boolean(conversation.assignedStaffId),
      ).length,
    };
  }, [conversationItems]);

  const filtered = useMemo(() => {
    return conversationItems.filter(({ conversation, meta }) => {
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery =
        !normalizedQuery ||
        conversation.customerName?.toLowerCase().includes(normalizedQuery) ||
        conversation.lastMessage?.toLowerCase().includes(normalizedQuery) ||
        meta.label.toLowerCase().includes(normalizedQuery);

      const matchesTab =
        activeTab === "latest" ||
        (activeTab === "read" && conversation.unreadByShop === 0) ||
        (activeTab === "waiting" && isWaitingConversation(conversation, meta)) ||
        (activeTab === "assigned" && Boolean(conversation.assignedStaffId));

      return matchesQuery && matchesTab;
    });
  }, [activeTab, conversationItems, query]);

  if (isLoading) {
    return (
      <div className="flex h-full flex-col bg-white">
        <div className="border-b border-gray-200 px-4 py-4">
          <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-3 w-48 animate-pulse rounded bg-gray-100" />
        </div>
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 animate-pulse"
          >
            <div className="h-11 w-11 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-gray-200 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0084ff]">
              Advisor Inbox
            </p>
            <h2 className="mt-1 text-[18px] font-semibold text-gray-900">
              Hộp thư tư vấn khách hàng
            </h2>
            <p className="mt-1 text-[12px] text-gray-500">
              Phân loại theo ưu tiên, giai đoạn và trạng thái phản hồi.
            </p>
          </div>
          <div className="rounded-2xl border border-[#dbeafe] bg-[#f0f7ff] px-3 py-2 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4b84d9]">
              Hội thoại mở
            </p>
            <p className="mt-1 text-lg font-semibold text-[#0f172a]">
              {counts.latest}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-gray-200 bg-[#f8fafc] px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              Đã đọc
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{counts.read}</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-600">
              Đang chờ
            </p>
            <p className="mt-1 text-sm font-semibold text-amber-700">{counts.waiting}</p>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 px-3 py-3">
        <div className="flex items-center gap-2 rounded-full bg-[#f0f2f5] px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-gray-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo tên khách, nội dung hoặc nhãn..."
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 border-b border-gray-200 px-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative px-2 py-3 text-center text-[12px] font-medium transition-colors",
              activeTab === tab.id
                ? "text-[#0084ff]"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700",
            )}
          >
            <span className="block truncate">{tab.label}</span>
            <span className="mt-1 block text-[11px] font-semibold">
              {counts[tab.id]}
            </span>
            {activeTab === tab.id ? (
              <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#0084ff]" />
            ) : null}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex h-52 flex-col items-center justify-center gap-2 px-6 text-center text-gray-400">
            <MessageCircle className="h-8 w-8 opacity-40" />
            <p className="text-sm">
              {query ? "Không tìm thấy hội thoại phù hợp" : "Chưa có hội thoại để hiển thị"}
            </p>
          </div>
        ) : (
          filtered.map(({ conversation, meta }) => {
            const isActive = conversation.id === activeId;
            const hasUnread = conversation.unreadByShop > 0;
            const priority = getPriorityMeta(meta.priority);
            const stage = getStageMeta(meta.stage);

            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => onSelect(conversation)}
                className={cn(
                  "w-full border-b border-gray-100 px-4 py-3 text-left transition-colors",
                  isActive ? "bg-[#ebf5ff]" : "hover:bg-[#f8fafc]",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conversation.customerAvatar} />
                      <AvatarFallback className="bg-gray-300 text-sm font-semibold text-gray-700">
                        {conversation.customerName?.charAt(0) ?? "K"}
                      </AvatarFallback>
                    </Avatar>
                    {hasUnread ? (
                      <span className="absolute -right-1 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#0084ff] px-1">
                        <span className="text-[10px] font-bold text-white">
                          {conversation.unreadByShop > 9 ? "9+" : conversation.unreadByShop}
                        </span>
                      </span>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "truncate text-[14px]",
                          hasUnread ? "font-bold text-gray-900" : "font-medium text-gray-800",
                        )}
                      >
                        {conversation.customerName}
                      </p>
                      <span className="shrink-0 text-[11px] text-gray-400">
                        {formatConversationTime(conversation.lastMessageAt)}
                      </span>
                    </div>

                    <p
                      className={cn(
                        "mt-0.5 truncate text-[12.5px]",
                        hasUnread ? "font-medium text-gray-700" : "text-gray-500",
                      )}
                    >
                      {conversation.lastMessage
                        ? `Bạn: ${conversation.lastMessage}`
                        : "Khách vừa bắt đầu cuộc trò chuyện"}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          priority.badgeClassName,
                        )}
                      >
                        {priority.shortLabel}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          stage.badgeClassName,
                        )}
                      >
                        {stage.shortLabel}
                      </span>
                      {conversation.assignedStaffName ? (
                        <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                          {conversation.assignedStaffName}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        {meta.label ? (
                          <span className="truncate rounded-full bg-[#eef2ff] px-2 py-0.5 text-[10px] font-medium text-[#4f46e5]">
                            {meta.label}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400">
                            Chưa có nhãn nội bộ
                          </span>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-1 text-[10px] text-gray-400">
                        <Clock3 className="h-3.5 w-3.5" />
                        {conversation.status === "OPEN" ? "Đang mở" : "Đã đóng"}
                      </div>
                    </div>
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
