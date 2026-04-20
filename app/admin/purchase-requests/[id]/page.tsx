"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Loader2,
  ChevronLeft,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  AlertTriangle,
  XCircle,
  Plus,
  RefreshCcw,
  Package,
  FileText,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/axios";
import { PurchaseRequestApiService } from "@/app/services/purchase.service";
import { InventoryApiService } from "@/app/services/inventory.service";
import type {
  PurchaseRequestResponse,
  PurchaseRequestStatus,
} from "@/app/types/purchase.schema";
import { PR_STATUS_LABEL, PR_STATUS_COLOR } from "@/app/types/purchase.schema";

// ─────────────────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n);
}
function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
function fmtDateTime(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("vi-VN");
}

const RECEIPT_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Chờ duyệt", cls: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "Đã duyệt", cls: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "Hoàn tất", cls: "bg-green-100 text-green-700" },
  REJECTED: { label: "Từ chối", cls: "bg-red-100 text-red-600" },
  CANCELLED: { label: "Đã hủy", cls: "bg-gray-100 text-gray-500" },
};

// ─────────────────────────────────────────────────────────────────────────────

export default function PurchaseRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [pr, setPr] = useState<PurchaseRequestResponse | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [receiptHistoryDetails, setReceiptHistoryDetails] = useState<
    Record<number, any>
  >({});
  const [confirmAction, setConfirmAction] = useState<{
    type:
      | "submit"
      | "approve"
      | "reject"
      | "sendToSupplier"
      | "cancel"
      | "close";
    label: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await PurchaseRequestApiService.getById(id);
      setPr(data);
    } catch (err) {
      toast.error(getErrorMessage(err as any));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!pr?.goodsReceipts?.length) {
      setReceiptHistoryDetails({});
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const entries = await Promise.all(
          pr.goodsReceipts.map(async (receipt) => {
            const detail = await InventoryApiService.getReceiptDetail(
              receipt.id,
            );
            return [receipt.id, detail] as const;
          }),
        );

        if (!cancelled) {
          setReceiptHistoryDetails(Object.fromEntries(entries));
        }
      } catch {
        if (!cancelled) {
          setReceiptHistoryDetails({});
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pr?.goodsReceipts]);

  // ── Actions ─────────────────────────────────────────────────────────────

  const executeAction = async () => {
    if (!confirmAction || !pr) return;
    setActionLoading(true);
    try {
      switch (confirmAction.type) {
        case "submit":
          await PurchaseRequestApiService.submit(pr.id);
          break;
        case "approve":
          await PurchaseRequestApiService.approve(pr.id);
          break;
        case "reject":
          await PurchaseRequestApiService.reject(pr.id);
          break;
        case "sendToSupplier":
          await PurchaseRequestApiService.sendToSupplier(pr.id);
          break;
        case "cancel":
          await PurchaseRequestApiService.cancel(pr.id);
          break;
        case "close":
          await PurchaseRequestApiService.close(pr.id);
          break;
        default:
          return;
      }
      toast.success("Cập nhật thành công");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err as any));
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  // ── Tạo phiếu nhập từ phần còn thiếu ────────────────────────────────────
  // Điều hướng tới trang tạo phiếu nhập mới với purchaseRequestId pre-set
  const handleCreateReceipt = () => {
    router.push(
      `/admin/receipts/new?purchaseRequestId=${pr?.id}&supplierCode=${pr?.supplierCode}&branchName=${encodeURIComponent(pr?.branchName ?? "")}`,
    );
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!pr) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        Không tìm thấy phiếu yêu cầu
      </div>
    );
  }

  const canCreateReceipt = ["SENT_TO_SUPPLIER", "PARTIALLY_RECEIVED"].includes(
    pr.status,
  );
  const hasRemaining = pr.items?.some((i) => (i.remainingQty ?? 0) > 0);

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-5">
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="h-8 px-2"
          >
            <ChevronLeft size={16} />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[16px] font-black uppercase tracking-tight text-slate-700">
                {pr.code}
              </h1>
              <span
                className={cn(
                  "inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
                  PR_STATUS_COLOR[pr.status],
                )}
              >
                {PR_STATUS_LABEL[pr.status]}
              </span>
            </div>
            <p className="text-[12px] text-slate-400">
              Tạo lúc {fmtDateTime(pr.createdAt)} bởi {pr.createdByName}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={load} disabled={isLoading}>
            <RefreshCcw size={14} className={cn(isLoading && "animate-spin")} />
          </Button>

          {pr.status === "DRAFT" && (
            <>
              <Link href={`/admin/purchase-requests/${pr.id}/edit`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[12px] font-bold"
                >
                  Sửa
                </Button>
              </Link>
              <Button
                size="sm"
                className="h-8 bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-bold rounded-[3px]"
                onClick={() =>
                  setConfirmAction({ type: "submit", label: "Gửi duyệt" })
                }
              >
                Gửi duyệt
              </Button>
            </>
          )}

          {pr.status === "PENDING_APPROVAL" && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[12px] font-bold text-red-600 border-red-200"
                onClick={() =>
                  setConfirmAction({
                    type: "reject",
                    label: "Từ chối (trả về Nháp)",
                  })
                }
              >
                Từ chối
              </Button>
              <Button
                size="sm"
                className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold rounded-[3px]"
                onClick={() =>
                  setConfirmAction({ type: "approve", label: "Duyệt phiếu" })
                }
              >
                Duyệt
              </Button>
            </>
          )}

          {pr.status === "APPROVED" && (
            <Button
              size="sm"
              className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-bold rounded-[3px]"
              onClick={() =>
                setConfirmAction({
                  type: "sendToSupplier",
                  label: "Gửi cho nhà cung cấp",
                })
              }
            >
              <Truck size={13} className="mr-1.5" />
              Gửi NCC
            </Button>
          )}

          {canCreateReceipt && hasRemaining && (
            <Button
              size="sm"
              className="h-8 bg-green-600 hover:bg-green-700 text-white text-[12px] font-bold rounded-[3px]"
              onClick={handleCreateReceipt}
            >
              <Plus size={13} className="mr-1.5" />
              Tạo đợt nhập
            </Button>
          )}

          {["SENT_TO_SUPPLIER", "PARTIALLY_RECEIVED"].includes(pr.status) && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[12px] font-bold text-gray-600"
              onClick={() =>
                setConfirmAction({
                  type: "close",
                  label: "Đóng phiếu (force close)",
                })
              }
            >
              Đóng phiếu
            </Button>
          )}

          {["DRAFT", "PENDING_APPROVAL", "APPROVED"].includes(pr.status) && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[12px] font-bold text-red-500 border-red-200"
              onClick={() =>
                setConfirmAction({ type: "cancel", label: "Hủy phiếu yêu cầu" })
              }
            >
              Hủy
            </Button>
          )}
        </div>
      </div>

      {/* ── Info Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Nhà cung cấp",
            value: `${pr.supplierName} (${pr.supplierCode})`,
            icon: <Package size={14} />,
          },
          {
            label: "Chi nhánh nhận",
            value: pr.branchName,
            icon: <PackageCheck size={14} />,
          },
          {
            label: "Ngày tạo phiếu",
            value: fmtDate(pr.createdAt),
            icon: <CalendarDays size={14} />,
          },
          {
            label: "Tổng giá trị",
            value: fmtCurrency(pr.totalAmount ?? 0),
            icon: <FileText size={14} />,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
              {card.icon} {card.label}
            </div>
            <div className="text-[13px] font-bold text-slate-700 truncate">
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Items Table ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm">
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <h2 className="text-[13px] font-black uppercase tracking-wider text-slate-600">
            Danh sách hàng hóa
          </h2>
          <span className="text-[11px] text-slate-400">
            {pr.items?.length ?? 0} mặt hàng
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-4 py-2.5 text-left font-black text-slate-500 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-4 py-2.5 text-center font-black text-slate-500 uppercase tracking-wider">
                  Yêu cầu
                </th>
                <th className="px-4 py-2.5 text-center font-black text-slate-500 uppercase tracking-wider">
                  NCC giao
                </th>
                <th className="px-4 py-2.5 text-center font-black text-slate-500 uppercase tracking-wider text-green-700">
                  Đạt QC
                </th>
                <th className="px-4 py-2.5 text-center font-black text-slate-500 uppercase tracking-wider text-red-600">
                  Lỗi
                </th>
                <th className="px-4 py-2.5 text-center font-black text-slate-500 uppercase tracking-wider text-orange-600">
                  Còn thiếu
                </th>
                <th className="px-4 py-2.5 text-right font-black text-slate-500 uppercase tracking-wider">
                  Đơn giá
                </th>
                <th className="px-4 py-2.5 text-right font-black text-slate-500 uppercase tracking-wider">
                  Thành tiền
                </th>
              </tr>
            </thead>
            <tbody>
              {(pr.items ?? []).map((item, idx) => {
                const fulfilled =
                  (item.acceptedQty ?? 0) >= (item.requestedQty ?? 0);
                return (
                  <tr
                    key={item.id ?? idx}
                    className={cn(
                      "border-b",
                      fulfilled ? "bg-green-50/30" : "bg-white",
                    )}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-7 h-7 rounded object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium text-slate-700">
                            {item.productName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {item.productCode}
                          </div>
                        </div>
                        {fulfilled && (
                          <CheckCircle2
                            size={13}
                            className="text-green-500 ml-1"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center font-semibold">
                      {item.requestedQty}
                    </td>
                    <td className="px-4 py-2.5 text-center text-slate-600">
                      {item.deliveredQty}
                    </td>
                    <td className="px-4 py-2.5 text-center text-green-700 font-bold">
                      {item.acceptedQty}
                    </td>
                    <td className="px-4 py-2.5 text-center text-red-600 font-semibold">
                      {item.defectiveQty}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={cn(
                          "inline-block px-2 py-0.5 rounded text-[10px] font-bold",
                          (item.remainingQty ?? 0) > 0
                            ? "bg-orange-100 text-orange-700"
                            : "bg-green-100 text-green-700",
                        )}
                      >
                        {item.remainingQty ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-600">
                      {fmtCurrency(item.unitPrice ?? 0)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-700">
                      {fmtCurrency(
                        (item.requestedQty ?? 0) * (item.unitPrice ?? 0),
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Goods Receipts Timeline ───────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm">
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <h2 className="text-[13px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Truck size={14} />
            Lịch sử đợt nhập hàng
          </h2>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>
              {pr.completedReceiptCount}/{pr.totalReceiptCount} đợt hoàn tất
            </span>
            {canCreateReceipt && hasRemaining && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] font-bold border-green-300 text-green-700 hover:bg-green-50"
                onClick={handleCreateReceipt}
              >
                <Plus size={12} className="mr-1" />
                Tạo đợt nhập mới
              </Button>
            )}
          </div>
        </div>

        {!pr.goodsReceipts || pr.goodsReceipts.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            <Truck size={32} className="mx-auto opacity-20 mb-2" />
            <p className="text-[12px]">Chưa có đợt nhập hàng nào.</p>
            {canCreateReceipt && (
              <Button
                size="sm"
                className="mt-3 bg-green-600 hover:bg-green-700 text-white h-8 text-[12px] font-bold rounded-[3px]"
                onClick={handleCreateReceipt}
              >
                <Plus size={13} className="mr-1.5" /> Tạo đợt nhập đầu tiên
              </Button>
            )}
          </div>
        ) : (
          <div className="p-5">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-100" />

              <div className="space-y-4">
                {pr.goodsReceipts.map((receipt, idx) => {
                  const statusInfo = RECEIPT_STATUS_MAP[receipt.status] ?? {
                    label: receipt.status,
                    cls: "bg-gray-100 text-gray-600",
                  };
                  return (
                    <div key={receipt.id} className="relative flex gap-4 pl-2">
                      {/* Timeline dot */}
                      <div
                        className={cn(
                          "relative z-10 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold",
                          receipt.status === "COMPLETED"
                            ? "bg-green-500"
                            : receipt.status === "PENDING"
                              ? "bg-amber-400"
                              : receipt.status === "APPROVED"
                                ? "bg-blue-500"
                                : receipt.status === "CANCELLED"
                                  ? "bg-gray-400"
                                  : "bg-red-400",
                        )}
                      >
                        {idx + 1}
                      </div>

                      {/* Card */}
                      <div className="flex-1 bg-slate-50 border border-slate-200 rounded-[4px] p-3 hover:border-blue-200 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-600">
                              Đợt {idx + 1}
                            </span>
                            <Link
                              href={`/admin/receipts/${receipt.id}`}
                              className="font-bold text-blue-600 text-[13px] hover:underline"
                            >
                              {receipt.code}
                            </Link>
                            <span
                              className={cn(
                                "inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                                statusInfo.cls,
                              )}
                            >
                              {statusInfo.label}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {fmtDateTime(receipt.createdAt)}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center">
                            <div className="text-[10px] text-slate-400 mb-0.5">
                              NCC giao
                            </div>
                            <div className="font-bold text-slate-700">
                              {receipt.totalDelivered}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] text-slate-400 mb-0.5">
                              Đạt QC
                            </div>
                            <div className="font-bold text-green-700">
                              {receipt.totalAccepted}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] text-slate-400 mb-0.5">
                              Lỗi
                            </div>
                            <div className="font-bold text-red-600">
                              {receipt.totalDefective}
                            </div>
                          </div>
                        </div>

                        {receiptHistoryDetails[receipt.id]?.items?.length ? (
                          <div className="mt-3 overflow-x-auto rounded border border-slate-200 bg-white">
                            <table className="min-w-[760px] w-full text-[11px]">
                              <thead className="bg-slate-50">
                                <tr className="text-slate-500 uppercase">
                                  <th className="px-3 py-2 text-left font-black">
                                    Sản phẩm / SKU
                                  </th>
                                  <th className="px-3 py-2 text-left font-black">
                                    Số lô / Hạn dùng
                                  </th>
                                  <th className="px-3 py-2 text-right font-black">
                                    Nhập đợt này
                                  </th>
                                  <th className="px-3 py-2 text-right font-black">
                                    Hàng lỗi
                                  </th>
                                  <th className="px-3 py-2 text-right font-black">
                                    Đơn giá
                                  </th>
                                  <th className="px-3 py-2 text-left font-black">
                                    Ghi chú
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {receiptHistoryDetails[receipt.id].items.map(
                                  (item: any, itemIdx: number) => (
                                    <tr
                                      key={`${receipt.id}-${item.id ?? item.productVariantId ?? itemIdx}`}
                                      className="border-t border-slate-100"
                                    >
                                      <td className="px-3 py-2">
                                        <div className="font-semibold text-slate-700">
                                          {item.productName}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono">
                                          {item.productCode || item.sku}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 text-slate-500">
                                        <div>
                                          {item.lotNumber ||
                                            item.batchNumber ||
                                            "—"}
                                        </div>
                                        <div className="text-[10px]">
                                          {item.expiryDate || "—"}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 text-right font-bold text-slate-700">
                                        {item.quantityReal ?? 0}
                                      </td>
                                      <td className="px-3 py-2 text-right font-bold text-red-600">
                                        {item.quantityRejected ?? 0}
                                      </td>
                                      <td className="px-3 py-2 text-right font-semibold text-slate-700">
                                        {fmtCurrency(
                                          item.importPrice ?? item.price ?? 0,
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-slate-500">
                                        {item.note || "—"}
                                      </td>
                                    </tr>
                                  ),
                                )}
                              </tbody>
                            </table>
                          </div>
                        ) : null}

                        {receipt.createdByName && (
                          <p className="text-[10px] text-slate-400 mt-2">
                            Bởi: {receipt.createdByName}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Confirm Action Dialog ────────────────────────────────────────── */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
      >
        <AlertDialogContent className="bg-white rounded-[6px] border border-slate-200 shadow-xl max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800 font-bold text-[16px]">
              Xác nhận: {confirmAction?.label}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 text-[13px]">
              Bạn có chắc chắn muốn thực hiện thao tác này trên phiếu{" "}
              <strong>{pr.code}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="h-8 text-[12px] font-bold"
              disabled={actionLoading}
            >
              Hủy bỏ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAction}
              disabled={actionLoading}
              className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold"
            >
              {actionLoading ? (
                <Loader2 size={13} className="animate-spin mr-1.5" />
              ) : null}
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
