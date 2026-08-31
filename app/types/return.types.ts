export type ReturnEvidenceType = "IMAGE" | "VIDEO";

export type ReturnIssueType =
  | "DAMAGED"
  | "WRONG_ITEM"
  | "MISSING_ITEM"
  | "OTHER";

export type ReturnRefundMethod = "BANK_TRANSFER" | "CASH";

export type ReturnHandlingOption = "REFUND_ONLY" | "RETURN_AND_REFUND";

export type ReturnRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "RECEIVED"
  | "REFUNDED";

export type ReturnItemSourceType = "ORDER_ITEM" | "SUB_ORDER_ITEM";

export interface ReturnDraftItem {
  sourceType: ReturnItemSourceType;
  sourceItemId: number;
  productVariantId: number | null;
  subOrderId: number | null;
  branchId: number | null;
  branchName: string | null;
  productName: string;
  variantName: string | null;
  sku: string | null;
  image: string | null;
  orderedQuantity: number;
  maxReturnQuantity: number;
  unitPrice: number;
  totalPrice: number;
  allowedRefundMethods: ReturnRefundMethod[];
  cashRefundEligible: boolean | null;
  cashRefundDistanceKm: number | null;
}

export interface ReturnOrderDraft {
  orderId: number;
  orderCode: string;
  orderStatus: string | null;
  customerName: string | null;
  customerPhone: string | null;
  singleBranchOnly: boolean | null;
  canCreateRequest?: boolean | null;
  existingRequestId?: number | null;
  existingRequestCode?: string | null;
  message: string | null;
  items: ReturnDraftItem[];
}

export interface ReturnEvidencePayload {
  mediaType: ReturnEvidenceType;
  fileUrl: string;
  publicId?: string | null;
  fileName?: string | null;
}

export interface ReturnRequestItemPayload {
  sourceType: ReturnItemSourceType;
  sourceItemId: number;
  quantity: number;
}

export interface CreateReturnRequestPayload {
  orderId: number;
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankName?: string | null;
  bankBranch?: string | null;
  issueType: ReturnIssueType;
  handlingOption: ReturnHandlingOption;
  refundMethod: ReturnRefundMethod;
  reason: string;
  description: string;
  items: ReturnRequestItemPayload[];
  evidences: ReturnEvidencePayload[];
}

export interface ReturnRequestItem {
  id: number;
  sourceType: ReturnItemSourceType;
  sourceItemId: number;
  productVariantId: number | null;
  subOrderId: number | null;
  productName: string;
  variantName: string | null;
  sku: string | null;
  image: string | null;
  quantity: number;
  orderedQuantity: number;
  unitPrice: number;
  refundAmount: number;
  restockQuantity: number;
  defectiveQuantity: number;
}

export interface ReturnRequestEvidence {
  id: number;
  mediaType: ReturnEvidenceType;
  fileUrl: string;
  publicId?: string | null;
  fileName?: string | null;
}

export interface ReturnRequest {
  id: number;
  code: string;
  status: ReturnRequestStatus;
  issueType: ReturnIssueType;
  handlingOption: ReturnHandlingOption;
  refundMethod: ReturnRefundMethod;
  requiresPhysicalReturn: boolean;
  orderId: number;
  orderCode: string;
  branchId: number | null;
  branchName: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankName: string | null;
  bankBranch?: string | null;
  reason: string;
  description: string;
  rejectReason?: string | null;
  internalNote?: string | null;
  totalRefundAmount: number;
  receivedInventoryNoteId?: number | null;
  receivedInventoryNoteCode?: string | null;
  createdAt: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  receivedAt?: string | null;
  refundedAt?: string | null;
  items: ReturnRequestItem[];
  evidences: ReturnRequestEvidence[];
}

export interface ReturnRequestApprovePayload {
  internalNote?: string;
}

export interface ReturnRequestRejectPayload {
  rejectReason: string;
  internalNote?: string;
}

export interface ReturnRequestReceiveItemPayload {
  returnRequestItemId: number;
  restockQuantity: number;
  defectiveQuantity: number;
  itemNote?: string | null;
}

export interface ReturnRequestReceivePayload {
  internalNote?: string;
  items: ReturnRequestReceiveItemPayload[];
}

export interface ReturnRequestRefundPayload {
  refundAmount: number;
  refundMethod?: ReturnRefundMethod;
  internalNote?: string;
}
