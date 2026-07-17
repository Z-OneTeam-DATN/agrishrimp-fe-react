export type MessageType = "TEXT" | "PINNED_PRODUCT" | "IMAGE";
export type ConversationStatus = "OPEN" | "CLOSED";
export type NotificationType = "CHAT" | "ORDER" | "SYSTEM";

export interface PinnedProductInfo {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string;
  thumbnailUrl?: string;
}

export type MessageSendStatus = "sending" | "sent" | "error";

export interface ChatMessage {
  id: number;
  localId?: string; // used for optimistic messages before server confirms
  conversationId: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: MessageType;
  pinnedProduct?: PinnedProductInfo;
  imageUrl?: string;
  isRead: boolean;
  createdAt: string;
  status?: MessageSendStatus; // undefined = normal server message (treated as "sent")
}

export interface Conversation {
  id: number;
  customerId: number;
  customerName: string;
  customerAvatar?: string;
  status: ConversationStatus;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadByShop: number;
  unreadByCustomer: number;
  assignedStaffId?: number;
  assignedStaffName?: string;
  lastSenderId?: number;
}

export interface Notification {
  id: number;
  title: string;
  content: string;
  notificationType: NotificationType;
  isRead: boolean;
  referenceId?: number;
  createdAt: string;
}

export interface NotificationPage {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  number: number;
}
