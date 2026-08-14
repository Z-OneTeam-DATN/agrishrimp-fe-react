import {
  ReturnIssueType,
  ReturnRefundMethod,
  ReturnRequestStatus,
} from "@/app/types/return.types";

export const RETURN_STATUS_OPTIONS: Array<{
  label: string;
  value: ReturnRequestStatus | "ALL";
}> = [
  { label: "Tất cả", value: "ALL" },
  { label: "Chờ duyệt", value: "PENDING" },
  { label: "Đã duyệt", value: "APPROVED" },
  { label: "Đã nhận hàng", value: "RECEIVED" },
  { label: "Đã hoàn tiền", value: "REFUNDED" },
  { label: "Đã từ chối", value: "REJECTED" },
];

export const RETURN_ISSUE_OPTIONS: Array<{
  label: string;
  value: ReturnIssueType;
}> = [
  { label: "Sản phẩm lỗi / hư hỏng", value: "DAMAGED" },
  { label: "Giao sai sản phẩm", value: "WRONG_ITEM" },
  { label: "Đơn hàng thiếu sản phẩm", value: "MISSING_ITEM" },
  { label: "Lý do khác", value: "OTHER" },
];

export const RETURN_REFUND_OPTIONS: Array<{
  label: string;
  value: ReturnRefundMethod;
}> = [{ label: "Chuyển khoản", value: "BANK_TRANSFER" }];

export function getReturnStatusMeta(status: ReturnRequestStatus) {
  switch (status) {
    case "PENDING":
      return {
        label: "Chờ duyệt",
        className: "border-amber-200 bg-amber-50 text-amber-700",
      };
    case "APPROVED":
      return {
        label: "Đã duyệt",
        className: "border-sky-200 bg-sky-50 text-sky-700",
      };
    case "RECEIVED":
      return {
        label: "Đã nhận hàng",
        className: "border-indigo-200 bg-indigo-50 text-indigo-700",
      };
    case "REFUNDED":
      return {
        label: "Đã hoàn tiền",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "REJECTED":
      return {
        label: "Đã từ chối",
        className: "border-rose-200 bg-rose-50 text-rose-700",
      };
    default:
      return {
        label: status,
        className: "border-slate-200 bg-slate-50 text-slate-700",
      };
  }
}

export function getReturnIssueLabel(issueType: ReturnIssueType) {
  return (
    RETURN_ISSUE_OPTIONS.find((item) => item.value === issueType)?.label ??
    issueType
  );
}

export function getReturnRefundLabel(refundMethod: ReturnRefundMethod) {
  switch (refundMethod) {
    case "BANK_TRANSFER":
      return "Chuyển khoản";
    case "CASH":
      return "Tiền mặt";
    default:
      return refundMethod;
  }
}
