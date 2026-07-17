import { create } from "zustand";
import { ChatMessage, Conversation } from "@/app/types/chat.types";

export interface ConsultProduct {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  slug: string;
}

export interface Viewer {
  userId: number;
  username: string;
}

interface ChatStore {
  isOpen: boolean;
  conversations: Conversation[];
  activeConversationId: number | null;
  messages: Record<number, ChatMessage[]>;
  unreadByConv: Record<number, number>;
  sendWsMessage: ((destination: string, body: any) => void) | null;
  consultProduct: ConsultProduct | null;
  viewersByConv: Record<number, Viewer[]>;

  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  setConversations: (convs: Conversation[]) => void;
  setActiveConversation: (id: number | null) => void;
  setMessages: (convId: number, msgs: ChatMessage[]) => void;
  addMessage: (msg: ChatMessage) => void;
  markConvRead: (convId: number, isCustomer: boolean) => void;
  updateConversationLastMsg: (convId: number, msg: ChatMessage) => void;
  addOrUpdateConversation: (conv: Conversation) => void;
  setSendWsMessage: (fn: ((destination: string, body: any) => void) | null) => void;
  setConsultProduct: (product: ConsultProduct | null) => void;
  setViewers: (convId: number, viewers: Viewer[]) => void;
}

/** Sort conversations by lastMessageAt DESC so newest appears first */
function sortConversations(convs: Conversation[]): Conversation[] {
  return [...convs].sort((a, b) => {
    const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return tb - ta;
  });
}

export const useChatStore = create<ChatStore>((set, get) => ({
  isOpen: false,
  conversations: [],
  activeConversationId: null,
  messages: {},
  unreadByConv: {},
  sendWsMessage: null,
  consultProduct: null,
  viewersByConv: {},

  openChat: () => set({ isOpen: true }),
  closeChat: () => set({ isOpen: false }),
  toggleChat: () => set((s) => ({ isOpen: !s.isOpen })),

  setConversations: (convs) => set({ conversations: sortConversations(convs) }),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setMessages: (convId, msgs) =>
    set((s) => ({ messages: { ...s.messages, [convId]: msgs } })),

  addMessage: (msg) =>
    set((s) => {
      const existing = s.messages[msg.conversationId] ?? [];

      // If msg has a localId, replace the optimistic placeholder with the same localId
      if (msg.localId) {
        const replaced = existing.map((m) =>
          m.localId === msg.localId ? { ...msg } : m
        );
        // If nothing was replaced, just append
        const found = existing.some((m) => m.localId === msg.localId);
        return {
          messages: {
            ...s.messages,
            [msg.conversationId]: found ? replaced : [...existing, msg],
          },
        };
      }

      // Regular server message: deduplicate by id, update if status changed
      const existingIdx = existing.findIndex((m) => m.id === msg.id);
      if (existingIdx >= 0) {
        // Update in place (e.g. status change)
        const updated = [...existing];
        updated[existingIdx] = { ...existing[existingIdx], ...msg };
        return { messages: { ...s.messages, [msg.conversationId]: updated } };
      }

      return {
        messages: {
          ...s.messages,
          [msg.conversationId]: [...existing, msg],
        },
      };
    }),


  markConvRead: (convId, isCustomer) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === convId
          ? {
              ...c,
              unreadByCustomer: isCustomer ? 0 : c.unreadByCustomer,
              unreadByShop: !isCustomer ? 0 : c.unreadByShop,
            }
          : c
      ),
      // Also mark all messages in this conversation as read
      messages: {
        ...s.messages,
        [convId]: (s.messages[convId] ?? []).map((m) => ({ ...m, isRead: true })),
      },
    })),

  updateConversationLastMsg: (convId, msg) =>
    set((s) => {
      const activeId = s.activeConversationId;
      const updated = s.conversations.map((c) =>
        c.id === convId
          ? {
              ...c,
              lastMessage: msg.content || (msg.messageType === "IMAGE" ? "[Hình ảnh]" : ""),
              lastMessageAt: msg.createdAt,
              status: "OPEN" as const,
              lastSenderId: msg.senderId,
              // Only increment unread when not actively viewing this conversation
              unreadByShop: c.id === activeId ? 0 : (c.unreadByShop ?? 0) + 1,
            }
          : c
      );
      return { conversations: sortConversations(updated) };
    }),

  addOrUpdateConversation: (conv) =>
    set((s) => {
      const exists = s.conversations.some((c) => c.id === conv.id);
      const next = exists
        ? s.conversations.map((c) => (c.id === conv.id ? { ...c, ...conv } : c))
        : [conv, ...s.conversations];
      return { conversations: sortConversations(next) };
    }),

  setSendWsMessage: (fn) => set({ sendWsMessage: fn }),

  setConsultProduct: (product) => set({ consultProduct: product }),

  setViewers: (convId, viewers) =>
    set((s) => ({
      viewersByConv: { ...s.viewersByConv, [convId]: viewers },
    })),
}));
