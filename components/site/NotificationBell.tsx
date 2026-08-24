"use client";

import { useEffect, useRef } from "react";
import { Bell, CheckCheck, MessageCircle, Package } from "lucide-react";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { NotificationService } from "@/app/services/chat.service";
import { Notification, NotificationType } from "@/app/types/chat.types";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";

function NotificationIcon({ type }: { type: NotificationType }) {
  if (type === "CHAT") return <MessageCircle className="w-4 h-4 text-blue-500" />;
  if (type === "ORDER") return <Package className="w-4 h-4 text-blue-500" />;
  return <Bell className="w-4 h-4 text-gray-400" />;
}

function NotificationMedia({ notification }: { notification: Notification }) {
  if (!notification.imageUrl) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
        <NotificationIcon type={notification.notificationType} />
      </div>
    );
  }

  return (
    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
      <img
        src={notification.imageUrl}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
        onError={(event) => {
          event.currentTarget.style.display = "none";
          event.currentTarget.nextElementSibling?.classList.remove("hidden");
          event.currentTarget.nextElementSibling?.classList.add("flex");
        }}
      />
      <div className="hidden h-full w-full items-center justify-center bg-blue-50">
        <NotificationIcon type={notification.notificationType} />
      </div>
    </div>
  );
}

export default function NotificationBell() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const {
    notifications, unreadCount, isOpen,
    setNotifications, setUnreadCount, markRead, markAllRead, toggleOpen, closeDropdown,
  } = useNotificationStore();

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load initial notifications
  useEffect(() => {
    if (!accessToken) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const load = async () => {
      try {
        const [page, count] = await Promise.all([
          NotificationService.getNotifications(0, 15),
          NotificationService.getUnreadCount(),
        ]);
        setNotifications(page.content ?? []);
        setUnreadCount(count);
      } catch {}
    };
    load();
  }, [accessToken, setNotifications, setUnreadCount]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, closeDropdown]);

  const handleMarkAll = async () => {
    try {
      await NotificationService.markAllAsRead();
      markAllRead();
    } catch {
      toast.error("Không thể đánh dấu đã đọc");
    }
  };

  const handleMarkOne = async (n: Notification) => {
    if (n.isRead) return;
    try {
      await NotificationService.markAsRead(n.id);
      markRead(n.id);
    } catch {}
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleOpen}
        aria-label="Thông báo"
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm transition-colors hover:bg-gray-100"
      >
        <Bell className="h-[18px] w-[18px] text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-0.5 text-[8px] font-bold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 z-[60] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2">
                <Bell className="w-8 h-8 opacity-30" />
                <p className="text-sm">Không có thông báo</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleMarkOne(n)}
                  className={`flex items-start gap-3 px-4 py-3 w-full text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors border-b border-gray-50 dark:border-slate-700/50 last:border-0 ${
                    !n.isRead ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    <NotificationMedia notification={n} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-tight ${!n.isRead ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.content}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: vi })}
                    </p>
                  </div>
                  {!n.isRead && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

