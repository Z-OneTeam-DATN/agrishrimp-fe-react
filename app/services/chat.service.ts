import { apiJava } from "@/lib/axios";
import { ChatMessage, Conversation, NotificationPage, Notification } from "@/app/types/chat.types";

const PREFIX = "/v1/chat";

function getConfig() {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return { headers: token ? { Authorization: `Bearer ${token}` } : {} };
}

export class ChatService {
  static async getMyConversation(): Promise<Conversation> {
    const res = await apiJava.get<Conversation>(`${PREFIX}/my-conversation`, getConfig());
    return res.data;
  }

  static async getAllConversations(page = 0, size = 20): Promise<{ content: Conversation[]; totalElements: number }> {
    const res = await apiJava.get(`${PREFIX}/conversations`, { ...getConfig(), params: { page, size } });
    return res.data;
  }

  static async getMessages(conversationId: number): Promise<ChatMessage[]> {
    const res = await apiJava.get<ChatMessage[]>(`${PREFIX}/conversations/${conversationId}/messages`, getConfig());
    return res.data;
  }

  static async sendMessage(conversationId: number, content: string): Promise<ChatMessage> {
    const res = await apiJava.post<ChatMessage>(
      `${PREFIX}/conversations/${conversationId}/send`,
      { conversationId, content, messageType: "TEXT" },
      getConfig()
    );
    return res.data;
  }

  static async sendImage(conversationId: number, file: File): Promise<ChatMessage> {
    const form = new FormData();
    form.append("file", file);
    const res = await apiJava.post<ChatMessage>(
      `${PREFIX}/conversations/${conversationId}/send-image`,
      form,
      { ...getConfig(), headers: { ...getConfig().headers, "Content-Type": "multipart/form-data" } }
    );
    return res.data;
  }

  static async pinProduct(conversationId: number, productId: number, message?: string): Promise<ChatMessage> {
    const res = await apiJava.post<ChatMessage>(
      `${PREFIX}/conversations/${conversationId}/pin-product`,
      { productId, message },
      getConfig()
    );
    return res.data;
  }

  static async assignStaff(conversationId: number, staffId: number | null): Promise<Conversation> {
    const params = staffId != null ? { staffId } : {};
    const res = await apiJava.put<Conversation>(
      `${PREFIX}/conversations/${conversationId}/assign`,
      {},
      { ...getConfig(), params }
    );
    return res.data;
  }

  static async updateStatus(conversationId: number, status: "OPEN" | "CLOSED"): Promise<Conversation> {
    const res = await apiJava.put<Conversation>(
      `${PREFIX}/conversations/${conversationId}/status`,
      {},
      { ...getConfig(), params: { status } }
    );
    return res.data;
  }

  static async markAsUnread(conversationId: number): Promise<Conversation> {
    const res = await apiJava.put<Conversation>(
      `${PREFIX}/conversations/${conversationId}/unread`,
      {},
      getConfig()
    );
    return res.data;
  }

  static async getConversationById(conversationId: number): Promise<Conversation> {
    const res = await apiJava.get<Conversation>(`${PREFIX}/conversations/${conversationId}`, getConfig());
    return res.data;
  }

  static async markAsRead(conversationId: number): Promise<void> {
    await apiJava.put(`${PREFIX}/conversations/${conversationId}/read`, {}, getConfig());
  }

  static async getStickerPacks(): Promise<any[]> {
    const res = await apiJava.get<any[]>(`${PREFIX}/stickers`, getConfig());
    return res.data;
  }
}

export class NotificationService {
  static async getNotifications(page = 0, size = 15): Promise<NotificationPage> {
    const res = await apiJava.get<NotificationPage>("/v1/notifications", {
      ...getConfig(),
      params: { page, size },
    });
    return res.data;
  }

  static async getUnreadCount(): Promise<number> {
    const res = await apiJava.get<{ count: number }>("/v1/notifications/unread-count", getConfig());
    return res.data.count;
  }

  static async markAllAsRead(): Promise<void> {
    await apiJava.put("/v1/notifications/read-all", {}, getConfig());
  }

  static async markAsRead(id: number): Promise<void> {
    await apiJava.put(`/v1/notifications/${id}/read`, {}, getConfig());
  }
}
