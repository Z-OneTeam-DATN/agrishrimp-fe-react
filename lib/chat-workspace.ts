import { Conversation } from "@/app/types/chat.types";

export type ChatQueueTab = "latest" | "read" | "waiting" | "assigned";
export type ChatPriority = "urgent" | "high" | "normal" | "low";
export type ChatStage =
  | "new"
  | "qualified"
  | "consulting"
  | "quoted"
  | "waiting"
  | "won"
  | "follow_up";

export interface ChatConversationMeta {
  priority: ChatPriority;
  stage: ChatStage;
  label: string;
}

export type ChatConversationMetaMap = Record<number, ChatConversationMeta>;

export const CHAT_PRIORITY_OPTIONS: Array<{
  value: ChatPriority;
  label: string;
  shortLabel: string;
  badgeClassName: string;
}> = [
  {
    value: "urgent",
    label: "Ưu tiên gấp",
    shortLabel: "Gấp",
    badgeClassName: "border-rose-200 bg-rose-50 text-rose-700",
  },
  {
    value: "high",
    label: "Ưu tiên cao",
    shortLabel: "Cao",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    value: "normal",
    label: "Thông thường",
    shortLabel: "Chuẩn",
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
  },
  {
    value: "low",
    label: "Theo dõi nhẹ",
    shortLabel: "Nhẹ",
    badgeClassName: "border-slate-200 bg-slate-100 text-slate-600",
  },
];

export const CHAT_STAGE_OPTIONS: Array<{
  value: ChatStage;
  label: string;
  shortLabel: string;
  badgeClassName: string;
}> = [
  {
    value: "new",
    label: "Mới tiếp nhận",
    shortLabel: "Mới",
    badgeClassName: "border-violet-200 bg-violet-50 text-violet-700",
  },
  {
    value: "qualified",
    label: "Đã rõ nhu cầu",
    shortLabel: "Nhu cầu rõ",
    badgeClassName: "border-cyan-200 bg-cyan-50 text-cyan-700",
  },
  {
    value: "consulting",
    label: "Đang tư vấn",
    shortLabel: "Tư vấn",
    badgeClassName: "border-blue-200 bg-blue-50 text-blue-700",
  },
  {
    value: "quoted",
    label: "Đã gửi báo giá",
    shortLabel: "Báo giá",
    badgeClassName: "border-indigo-200 bg-indigo-50 text-indigo-700",
  },
  {
    value: "waiting",
    label: "Đang chờ phản hồi",
    shortLabel: "Đang chờ",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    value: "won",
    label: "Chuẩn bị chốt đơn",
    shortLabel: "Chốt đơn",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    value: "follow_up",
    label: "Chăm sóc lại",
    shortLabel: "CSKH lại",
    badgeClassName: "border-slate-200 bg-slate-100 text-slate-700",
  },
];

const STORAGE_KEY = "advisor_chat_workspace_meta_v1";

export function deriveConversationMeta(
  conversation: Conversation,
  stored?: Partial<ChatConversationMeta>,
): ChatConversationMeta {
  const defaultPriority: ChatPriority =
    conversation.unreadByShop >= 3
      ? "urgent"
      : conversation.unreadByShop > 0
        ? "high"
        : "normal";

  const defaultStage: ChatStage =
    conversation.status === "CLOSED"
      ? "follow_up"
      : conversation.assignedStaffId
        ? "consulting"
        : "new";

  return {
    priority: stored?.priority ?? defaultPriority,
    stage: stored?.stage ?? defaultStage,
    label: stored?.label?.trim() ?? "",
  };
}

export function readConversationMetaMap(): ChatConversationMetaMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Record<string, Partial<ChatConversationMeta>>;
    return Object.entries(parsed).reduce<ChatConversationMetaMap>((acc, [key, value]) => {
      const id = Number(key);
      if (Number.isFinite(id) && value) {
        acc[id] = {
          priority: isChatPriority(value.priority) ? value.priority : "normal",
          stage: isChatStage(value.stage) ? value.stage : "new",
          label: typeof value.label === "string" ? value.label : "",
        };
      }
      return acc;
    }, {});
  } catch {
    return {};
  }
}

export function writeConversationMetaMap(metaMap: ChatConversationMetaMap) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(metaMap));
}

export function isWaitingConversation(
  conversation: Conversation,
  meta: ChatConversationMeta,
) {
  return (
    conversation.status === "OPEN" &&
    (conversation.unreadByShop > 0 ||
      meta.stage === "waiting" ||
      !conversation.assignedStaffId)
  );
}

export function getPriorityMeta(priority: ChatPriority) {
  return (
    CHAT_PRIORITY_OPTIONS.find((item) => item.value === priority) ??
    CHAT_PRIORITY_OPTIONS[2]
  );
}

export function getStageMeta(stage: ChatStage) {
  return (
    CHAT_STAGE_OPTIONS.find((item) => item.value === stage) ??
    CHAT_STAGE_OPTIONS[0]
  );
}

export function getSuggestedTasks(stage: ChatStage) {
  switch (stage) {
    case "new":
      return [
        "Xác nhận lời chào và nguồn khách",
        "Hỏi nhanh nhu cầu nuôi hoặc mua hàng",
        "Xin khu vực giao hàng hoặc chi nhánh hỗ trợ",
      ];
    case "qualified":
      return [
        "Chốt rõ số lượng, size hoặc dòng sản phẩm",
        "Kiểm tra tồn kho hoặc thời gian giao",
        "Gắn nhãn khách cũ, đại lý, nhà hàng nếu cần",
      ];
    case "consulting":
      return [
        "Tư vấn quy cách, công dụng, combo phù hợp",
        "Gửi hình ảnh thật hoặc sản phẩm ghim",
        "Xử lý câu hỏi so sánh giá và chất lượng",
      ];
    case "quoted":
      return [
        "Gửi báo giá và ưu đãi hiện tại",
        "Xin thông tin nhận hàng và số điện thoại",
        "Xác nhận lại giá chốt trước khi lên đơn",
      ];
    case "waiting":
      return [
        "Đặt lịch nhắc lại khách",
        "Ghi ngắn gọn lý do khách đang chờ",
        "Chuẩn bị mẫu phản hồi follow-up nhanh",
      ];
    case "won":
      return [
        "Chốt địa chỉ nhận hàng",
        "Bàn giao thông tin cho đội lên đơn",
        "Nhắc xác nhận cọc hoặc hình thức thanh toán",
      ];
    case "follow_up":
      return [
        "Hỏi khách phản hồi sau mua",
        "Gợi ý mua lại hoặc upsell phù hợp",
        "Xin đánh giá hoặc giới thiệu thêm nhu cầu",
      ];
    default:
      return [];
  }
}

function isChatPriority(value: unknown): value is ChatPriority {
  return CHAT_PRIORITY_OPTIONS.some((item) => item.value === value);
}

function isChatStage(value: unknown): value is ChatStage {
  return CHAT_STAGE_OPTIONS.some((item) => item.value === value);
}
