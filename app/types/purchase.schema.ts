import { z } from "zod";

// PURCHASE REQUEST STATUS

export type PurchaseRequestStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "SENT_TO_SUPPLIER"
  | "SUPPLIER_CONFIRMED"
  | "DELIVERING"
  | "PARTIALLY_RECEIVED"
  | "COMPLETED"
  | "CANCELLED"
  | "CLOSED";

export const PR_STATUS_LABEL: Record<PurchaseRequestStatus, string> = {
  DRAFT: "Nhập",
  PENDING_APPROVAL: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  SENT_TO_SUPPLIER: "Đã gửi NCC",
  SUPPLIER_CONFIRMED: "NCC xác nhận",
  DELIVERING: "Chờ giao hàng",
  PARTIALLY_RECEIVED: "Đã nhận một phần",
  COMPLETED: "Đã nhận đủ",
  CANCELLED: "Đã hủy",
  CLOSED: "Đã đóng",
};

export const PR_STATUS_COLOR: Record<PurchaseRequestStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  SENT_TO_SUPPLIER: "bg-indigo-100 text-indigo-700",
  SUPPLIER_CONFIRMED: "bg-cyan-100 text-cyan-700",
  DELIVERING: "bg-emerald-100 text-emerald-700",
  PARTIALLY_RECEIVED: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-red-100 text-red-600",
  CLOSED: "bg-gray-100 text-gray-600",
};

// SCHEMAS - TAO / SUA PHIEU YEU CAU MUA

function parseNumberInput(value: unknown) {
  if (typeof value !== "string") return value;

  const normalized = value.replace(/[.,\s]/g, "").trim();
  if (!normalized) return undefined;

  return Number(normalized);
}

export const PurchaseRequestItemSchema = z.object({
  productCode: z.string().min(1, "Vui lòng chọn sản phẩm"),
  productName: z.string().default(""),
  imageUrl: z.string().optional(),
  requestedQty: z.preprocess(
    parseNumberInput,
    z
      .number({
        required_error: "Vui lòng nhập số lượng",
        invalid_type_error: "Số lượng phải là số hợp lệ",
      })
      .min(1, "Số lượng phải >= 1"),
  ),
  unitPrice: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? 0 : parseNumberInput(v)),
    z
      .number({
        invalid_type_error: "Đơn giá phải là số hợp lệ",
      })
      .min(0, "Đơn giá không được âm")
      .default(0),
  ),
  note: z.string().nullable().optional(),
});

export const PurchaseRequestSchema = z.object({
  supplierCode: z.string().min(1, "Vui lòng chọn nhà cung cấp"),
  supplierName: z.string().optional(),
  branchId: z.coerce.number().min(1, "Vui lòng chọn chi nhánh nhận hàng"),
  branchName: z.string().min(1, "Vui lòng chọn chi nhánh nhận hàng"),
  expectedDeliveryDate: z.string().optional().default(""),
  note: z.string().optional().default(""),
  items: z
    .array(PurchaseRequestItemSchema)
    .min(1, "Cần ít nhất 1 mặt hàng"),
});

export type PurchaseRequestItem = z.infer<typeof PurchaseRequestItemSchema>;
export type PurchaseRequestForm = z.infer<typeof PurchaseRequestSchema>;

// RESPONSE TYPES (khop voi PurchaseRequestResponse Java)

export interface PurchaseRequestItemResponse {
  id: number;
  productVariantId: number;
  productCode: string;
  productName: string;
  imageUrl?: string;
  requestedQty: number;
  deliveredQty: number;
  acceptedQty: number;
  defectiveQty: number;
  remainingQty: number;
  unitPrice: number;
  note?: string;
}

export interface GoodsReceiptSummary {
  id: number;
  code: string;
  status: string;
  createdAt: string;
  createdByName: string;
  totalDelivered: number;
  totalAccepted: number;
  totalDefective: number;
}

export interface PurchaseRequestResponse {
  id: number;
  code: string;
  status: PurchaseRequestStatus;
  supplierId?: number;
  supplierName: string;
  supplierCode: string;
  branchId?: number;
  branchName: string;
  createdAt: string;
  updatedAt: string;
  expectedDeliveryDate?: string;
  approvedAt?: string;
  sentToSupplierAt?: string;
  completedAt?: string;
  createdByName: string;
  approvedByName?: string;
  totalAmount: number;
  note?: string;
  totalReceiptCount: number;
  completedReceiptCount: number;
  items: PurchaseRequestItemResponse[];
  goodsReceipts: GoodsReceiptSummary[];
}
