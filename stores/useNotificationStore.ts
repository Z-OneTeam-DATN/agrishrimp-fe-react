import { create } from "zustand";
import { Notification } from "@/app/types/chat.types";

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;

  setNotifications: (n: Notification[]) => void;
  addNotification: (n: Notification) => void;
  setUnreadCount: (count: number) => void;
  decrementUnread: () => void;
  markRead: (id: number) => void;
  markAllRead: () => void;
  toggleOpen: () => void;
  closeDropdown: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,

  setNotifications: (notifications) => set({ notifications }),

  addNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications].slice(0, 50),
      unreadCount: s.unreadCount + 1,
    })),

  setUnreadCount: (unreadCount) => set({ unreadCount }),

  decrementUnread: () =>
    set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),

  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, s.unreadCount - (s.notifications.find((n) => n.id === id && !n.isRead) ? 1 : 0)),
    })),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  closeDropdown: () => set({ isOpen: false }),
}));
