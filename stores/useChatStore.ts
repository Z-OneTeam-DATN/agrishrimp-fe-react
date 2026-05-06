import { create } from "zustand";
import { ChatMessage, Conversation } from "@/app/types/chat.types";

interface ChatStore {
  isOpen: boolean;
  conversations: Conversation[];
  activeConversationId: number | null;
  messages: Record<number, ChatMessage[]>;
  unreadByConv: Record<number, number>;
  sendWsMessage: ((destination: string, body: object) => void) | null;

  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  setConversations: (convs: Conversation[]) => void;
  setActiveConversation: (id: number) => void;
  setMessages: (convId: number, msgs: ChatMessage[]) => void;
  addMessage: (msg: ChatMessage) => void;
  markConvRead: (convId: number, isCustomer: boolean) => void;
  updateConversationLastMsg: (convId: number, msg: ChatMessage) => void;
  setSendWsMessage: (fn: ((destination: string, body: object) => void) | null) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  isOpen: false,
  conversations: [],
  activeConversationId: null,
  messages: {},
  unreadByConv: {},
  sendWsMessage: null,

  openChat: () => set({ isOpen: true }),
  closeChat: () => set({ isOpen: false }),
  toggleChat: () => set((s) => ({ isOpen: !s.isOpen })),

  setConversations: (convs) => set({ conversations: convs }),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setMessages: (convId, msgs) =>
    set((s) => ({ messages: { ...s.messages, [convId]: msgs } })),

  addMessage: (msg) =>
    set((s) => {
      const existing = s.messages[msg.conversationId] ?? [];
      const alreadyExists = existing.some((m) => m.id === msg.id);
      if (alreadyExists) return s;
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
          ? { ...c, unreadByCustomer: isCustomer ? 0 : c.unreadByCustomer, unreadByShop: !isCustomer ? 0 : c.unreadByShop }
          : c
      ),
    })),

  updateConversationLastMsg: (convId, msg) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === convId
          ? { ...c, lastMessage: msg.content, lastMessageAt: msg.createdAt }
          : c
      ),
    })),

  setSendWsMessage: (fn) => set({ sendWsMessage: fn }),
}));
