"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Loader2,
  ChevronLeft,
  CheckCircle2,
  Truck,
  Plus,
  RefreshCcw,
  Mail,
  Printer,
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
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { resolveImageUrl } from "@/lib/resolveImageUrl";
import { PurchaseRequestApiService } from "@/app/services/purchase.service";
import { InventoryApiService } from "@/app/services/inventory.service";
import type { PurchaseRequestResponse } from "@/app/types/purchase.schema";
import { PR_STATUS_LABEL } from "@/app/types/purchase.schema";

// ─────────────────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n);
}
function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtDateTime(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("vi-VN");
}

const RECEIPT_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Chờ duyệt", cls: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "Đã duyệt", cls: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "Hoàn tất", cls: "bg-blue-100 text-blue-700" },
  REJECTED: { label: "Từ chối", cls: "bg-red-100 text-red-600" },
  CANCELLED: { label: "Đã hủy", cls: "bg-gray-100 text-gray-500" },
};

function fmtMoneyPlain(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(value) || 0)} đ`;
}

function fmtQuantity(value: unknown) {
  return new Intl.NumberFormat("vi-VN").format(Number(value) || 0);
}

function fmtPrintDate(value?: string | null) {
  if (!value) return "---";
  return new Date(value).toLocaleDateString("vi-VN");
}

function fmtPrintDateTime(value?: string | null) {
  if (!value) return "---";
  const date = new Date(value);
  return `${date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })} ngày ${date.toLocaleDateString("vi-VN")}`;
}

function getReceiptResultLabel(status?: string) {
  const normalized = String(status || "").toUpperCase();
  return RECEIPT_STATUS_MAP[normalized]?.label || status || "---";
}

function PurchaseRequestPrintView({
  pr,
  receiptHistoryDetails,
}: {
  pr: PurchaseRequestResponse;
  receiptHistoryDetails: Record<number, any>;
}) {
  const totalItemCount = pr.items?.length ?? 0;
  const totalAmount = Number(pr.totalAmount ?? 0);
  const today = new Date();
  const receiptRows =
    pr.goodsReceipts?.map((receipt, index) => {
      const detail = receiptHistoryDetails[receipt.id];
      const firstItem = detail?.items?.[0];
      const batchSummary = detail?.items?.length
        ? detail.items
            .map((item: any) =>
              [
                item.lotNumber || item.batchNumber,
                item.expiryDate ? `HSD ${fmtPrintDate(item.expiryDate)}` : "",
              ]
                .filter(Boolean)
                .join(" - "),
            )
            .filter(Boolean)
            .join("\n")
        : "---";

      return {
        index: index + 1,
        code: receipt.code,
        createdAt: fmtPrintDateTime(receipt.createdAt),
        batchSummary,
        delivered: receipt.totalDelivered ?? 0,
        defective: receipt.totalDefective ?? 0,
        result: getReceiptResultLabel(receipt.status),
        note: detail?.note || firstItem?.note || "Không có ghi chú",
      };
    }) ?? [];
  const deliveredTotal = pr.items.reduce(
    (sum, item) => sum + Number(item.deliveredQty ?? 0),
    0,
  );
  const acceptedTotal = pr.items.reduce(
    (sum, item) => sum + Number(item.acceptedQty ?? 0),
    0,
  );
  const defectiveTotal = pr.items.reduce(
    (sum, item) => sum + Number(item.defectiveQty ?? 0),
    0,
  );
  const remainingTotal = pr.items.reduce(
    (sum, item) => sum + Number(item.remainingQty ?? 0),
    0,
  );

  return (
    <div className="purchase-request-print">
      <style jsx global>{`
        .purchase-request-print {
          display: none;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }

          body * {
            visibility: hidden !important;
          }

          .purchase-request-print,
          .purchase-request-print * {
            visibility: visible !important;
          }

          .purchase-request-print {
            display: block !important;
            position: absolute;
            inset: 0 auto auto 0;
            width: 100%;
            background: white;
            color: #000;
            font-family: "Times New Roman", Times, serif;
            font-size: 11px;
            line-height: 1.18;
          }

          .pr-print-page {
            min-height: 277mm;
            position: relative;
            padding-bottom: 18mm;
          }

          .pr-print-header {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20mm;
            text-align: center;
            font-weight: 700;
          }

          .pr-print-title {
            margin-top: 7mm;
            text-align: center;
            color: #173f73;
            font-weight: 700;
            text-transform: uppercase;
          }

          .pr-print-title h1 {
            margin: 0;
            font-size: 18px;
            line-height: 1.1;
          }

          .pr-print-title h2 {
            margin: 0;
            font-size: 14px;
            line-height: 1.1;
          }

          .pr-print-section-title {
            margin: 4mm 0 1.5mm;
            color: #173f73;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .pr-print-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          .pr-print-table th {
            background: #17476f;
            color: white;
            font-weight: 700;
            text-align: center;
          }

          .pr-print-table th,
          .pr-print-table td {
            border: 1px solid #9aa9b6;
            padding: 4px 5px;
            vertical-align: middle;
          }

          .pr-print-meta td {
            height: 22px;
          }

          .pr-print-total-row td {
            background: #eef3f8;
            font-weight: 700;
          }

          .pr-print-signatures {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            margin-top: 8mm;
            text-align: center;
            gap: 5mm;
          }

          .pr-print-signature-title {
            font-weight: 700;
            text-transform: uppercase;
          }

          .pr-print-signature-note {
            margin-top: 1mm;
            font-size: 10px;
            font-style: italic;
          }

          .pr-print-signer {
            margin-top: 19mm;
            font-weight: 700;
          }

          .pr-print-footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            display: flex;
            justify-content: space-between;
            border-top: 1px solid #9aa9b6;
            padding-top: 2mm;
            font-size: 9px;
            color: #555;
          }
        }
      `}</style>

      <div className="pr-print-page">
        <div className="pr-print-header">
          <div>
            <div>HỆ THỐNG AGRISHRIMP</div>
            <div>Số: {pr.code}</div>
          </div>
          <div>
            <div>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div>Độc lập - Tự do - Hạnh phúc</div>
          </div>
        </div>

        <div className="pr-print-title">
          <h1>Phiếu Yêu Cầu Nhập Hàng</h1>
          <h2>Từ Nhà Cung Cấp</h2>
        </div>

        <table className="pr-print-table pr-print-meta">
          <tbody>
            <tr>
              <td>
                <strong>Mã phiếu:</strong> {pr.code}
              </td>
              <td>
                <strong>Trạng thái:</strong>{" "}
                {PR_STATUS_LABEL[pr.status] || pr.status}
              </td>
            </tr>
            <tr>
              <td>
                <strong>Ngày tạo phiếu:</strong> {fmtPrintDateTime(pr.createdAt)}
              </td>
              <td>
                <strong>Người tạo:</strong> {pr.createdByName || "---"}
              </td>
            </tr>
            <tr>
              <td>
                <strong>Nhà cung cấp:</strong> {pr.supplierName || "---"}
              </td>
              <td>
                <strong>Chi nhánh nhận:</strong> {pr.branchName || "---"}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="pr-print-section-title">
          I. Nội Dung Yêu Cầu Nhập Hàng
        </div>
        <table className="pr-print-table">
          <thead>
            <tr>
              <th style={{ width: "8%" }}>STT</th>
              <th style={{ width: "27%" }}>Sản phẩm / SKU</th>
              <th style={{ width: "9%" }}>Yêu cầu</th>
              <th style={{ width: "9%" }}>NCC giao</th>
              <th style={{ width: "9%" }}>Đạt QC</th>
              <th style={{ width: "8%" }}>Lỗi</th>
              <th style={{ width: "9%" }}>Còn thiếu</th>
              <th style={{ width: "10%" }}>Đơn giá</th>
              <th style={{ width: "11%" }}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {(pr.items ?? []).map((item, index) => {
              const amount =
                Number(item.requestedQty ?? 0) * Number(item.unitPrice ?? 0);
              return (
                <tr key={item.id ?? index}>
                  <td style={{ textAlign: "center" }}>{index + 1}</td>
                  <td>
                    <strong>{item.productName}</strong>
                    <br />
                    <span>{item.productCode}</span>
                  </td>
                  <td style={{ textAlign: "center", fontWeight: 700 }}>
                    {fmtQuantity(item.requestedQty)}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {fmtQuantity(item.deliveredQty)}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {fmtQuantity(item.acceptedQty)}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {fmtQuantity(item.defectiveQty)}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {fmtQuantity(item.remainingQty)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {fmtMoneyPlain(item.unitPrice ?? 0)}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    {fmtMoneyPlain(amount)}
                  </td>
                </tr>
              );
            })}
            <tr className="pr-print-total-row">
              <td colSpan={7} style={{ textAlign: "right" }}>
                Tổng số mặt hàng
              </td>
              <td colSpan={2} style={{ textAlign: "center" }}>
                {String(totalItemCount).padStart(2, "0")}
              </td>
            </tr>
            <tr className="pr-print-total-row">
              <td colSpan={7} style={{ textAlign: "right" }}>
                Tổng giá trị yêu cầu
              </td>
              <td colSpan={2} style={{ textAlign: "right", color: "#173f73" }}>
                {fmtMoneyPlain(totalAmount)}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="pr-print-section-title">
          II. Kết Quả Nhập Hàng Và Kiểm Tra Chất Lượng
        </div>
        <table className="pr-print-table">
          <thead>
            <tr>
              <th style={{ width: "12%" }}>Đợt nhập</th>
              <th style={{ width: "21%" }}>Mã phiếu nhập / Thời gian</th>
              <th style={{ width: "19%" }}>Số lô / Hạn dùng</th>
              <th style={{ width: "14%" }}>Nhập đợt này</th>
              <th style={{ width: "14%" }}>Hàng lỗi</th>
              <th style={{ width: "20%" }}>Kết quả</th>
            </tr>
          </thead>
          <tbody>
            {receiptRows.length > 0 ? (
              receiptRows.map((row) => (
                <tr key={`${row.code}-${row.index}`}>
                  <td style={{ textAlign: "center" }}>Đợt {row.index}</td>
                  <td style={{ textAlign: "center", fontWeight: 700 }}>
                    {row.code}
                    <br />
                    {row.createdAt}
                  </td>
                  <td style={{ textAlign: "center", whiteSpace: "pre-line" }}>
                    {row.batchSummary}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {fmtQuantity(row.delivered)}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {fmtQuantity(row.defective)}
                  </td>
                  <td style={{ textAlign: "center", fontWeight: 700 }}>
                    {row.result}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", fontStyle: "italic" }}>
                  Chưa có đợt nhập hàng.
                </td>
              </tr>
            )}
            <tr>
              <td style={{ textAlign: "center", fontWeight: 700 }}>Ghi chú</td>
              <td colSpan={5} style={{ fontStyle: "italic" }}>
                {receiptRows[0]?.note || pr.note || "Không có ghi chú"}
              </td>
            </tr>
          </tbody>
        </table>

        <p style={{ margin: "4mm 0 0" }}>
          <strong>Diễn giải:</strong> Nhà cung cấp đã giao{" "}
          {fmtQuantity(deliveredTotal)} đơn vị; {fmtQuantity(acceptedTotal)} đơn vị
          đạt kiểm tra chất lượng, {fmtQuantity(defectiveTotal)} đơn vị lỗi.
          Phiếu hiện còn thiếu {fmtQuantity(remainingTotal)} đơn vị đạt yêu cầu
          so với số lượng đề nghị.
        </p>

        <div className="pr-print-section-title">III. Xác Nhận Và Phê Duyệt</div>
        <p style={{ margin: 0 }}>
          Đề nghị các bộ phận liên quan đối chiếu chứng từ, số lượng thực nhận,
          kết quả QC và thực hiện các bước nhập kho, xử lý hàng lỗi/còn thiếu
          theo quy định của đơn vị.
        </p>

        <div style={{ marginTop: "3mm", textAlign: "right", fontStyle: "italic" }}>
          Cần Thơ, ngày {String(today.getDate()).padStart(2, "0")} tháng{" "}
          {String(today.getMonth() + 1).padStart(2, "0")} năm{" "}
          {today.getFullYear()}
        </div>

        <div className="pr-print-signatures">
          <div>
            <div className="pr-print-signature-title">Người lập phiếu</div>
            <div className="pr-print-signature-note">(Ký, ghi rõ họ tên)</div>
            <div className="pr-print-signer">{pr.createdByName || ""}</div>
          </div>
          <div>
            <div className="pr-print-signature-title">Bộ phận QC</div>
            <div className="pr-print-signature-note">(Ký, ghi rõ họ tên)</div>
          </div>
          <div>
            <div className="pr-print-signature-title">Thủ kho</div>
            <div className="pr-print-signature-note">(Ký, ghi rõ họ tên)</div>
          </div>
          <div>
            <div className="pr-print-signature-title">Người phê duyệt</div>
            <div className="pr-print-signature-note">(Ký, ghi rõ họ tên)</div>
          </div>
        </div>

        <div className="pr-print-footer">
          <span>Biểu mẫu: Phiếu yêu cầu nhập hàng từ nhà cung cấp</span>
          <span>Trang 1</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function PurchaseRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { hasPermission } = usePermissions();

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
      | "resendToSupplier"
      | "confirmSupplier"
      | "markDelivering"
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
        case "resendToSupplier":
          await PurchaseRequestApiService.resendToSupplier(pr.id);
          break;
        case "confirmSupplier":
          await PurchaseRequestApiService.confirmSupplier(pr.id);
          break;
        case "markDelivering":
          await PurchaseRequestApiService.markDelivering(pr.id);
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
      toast.success(
        confirmAction.type === "resendToSupplier"
          ? "Đã gửi lại email cho NCC"
          : "Cập nhật thành công",
      );
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

  const itemProgressMap = useMemo(() => {
    const totals = new Map<
      string,
      { deliveredQty: number; defectiveQty: number }
    >();

    Object.values(receiptHistoryDetails).forEach((receipt: any) => {
      (receipt?.items || []).forEach((item: any) => {
        const productCode = String(item.productCode || item.sku || "").trim();
        if (!productCode) return;

        const deliveredQty = Number(
          item.quantityReal ?? item.deliveredQty ?? item.quantityDelivered ?? 0,
        );
        const defectiveQty = Number(
          item.quantityRejected ?? item.defectiveQty ?? 0,
        );
        const current = totals.get(productCode) || {
          deliveredQty: 0,
          defectiveQty: 0,
        };

        current.deliveredQty += deliveredQty;
        current.defectiveQty += defectiveQty;
        totals.set(productCode, current);
      });
    });

    return totals;
  }, [receiptHistoryDetails]);

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

  const canCreateReceipt =
    ["DELIVERING", "PARTIALLY_RECEIVED"].includes(pr.status) &&
    hasPermission(P.IMPORT_CREATE);
  const canCreatePurchaseRequest = hasPermission(P.PURCHASE_REQUEST_CREATE);
  const canUpdatePurchaseRequest = hasPermission(P.PURCHASE_REQUEST_UPDATE);
  const canApprovePurchaseRequest = hasPermission(P.PURCHASE_REQUEST_APPROVE);
  const hasRemaining = pr.items?.some((i) => (i.remainingQty ?? 0) > 0);

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 px-1 pb-8 pt-2 text-slate-900">
      <PurchaseRequestPrintView
        pr={pr}
        receiptHistoryDetails={receiptHistoryDetails}
      />

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
              <h1 className="text-[20px] font-semibold uppercase text-slate-900">
                Cập nhật phiếu yêu cầu {pr.code}
              </h1>
              <span className="text-[12px] font-medium text-slate-500">
                {PR_STATUS_LABEL[pr.status]}
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400">
              Tạo lúc {fmtDateTime(pr.createdAt)} bởi {pr.createdByName}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={load} disabled={isLoading}>
            <RefreshCcw size={14} className={cn(isLoading && "animate-spin")} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-[4px] border-slate-200 text-[12px] font-medium text-slate-700"
            onClick={() => window.print()}
          >
            <Printer size={13} className="mr-1.5" />
            In phiếu
          </Button>

          {pr.status === "DRAFT" && (
            <>
              {canUpdatePurchaseRequest && (
              <Link href={`/admin/purchase-requests/${pr.id}/edit`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-[4px] border-slate-200 text-[12px] font-medium"
                >
                  Sửa
                </Button>
              </Link>
              )}
              {canCreatePurchaseRequest && (
              <Button
                size="sm"
                className="h-8 rounded-[4px] bg-blue-600 text-[12px] font-medium text-white hover:bg-blue-700"
                onClick={() =>
                  setConfirmAction({ type: "submit", label: "Gửi duyệt" })
                }
              >
                Gửi duyệt
              </Button>
              )}
            </>
          )}

          {pr.status === "PENDING_APPROVAL" && canApprovePurchaseRequest && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-[4px] border-rose-200 text-[12px] font-medium text-rose-600"
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
                className="h-8 rounded-[4px] bg-blue-600 text-[12px] font-medium text-white hover:bg-blue-700"
                onClick={() =>
                  setConfirmAction({ type: "approve", label: "Duyệt phiếu" })
                }
              >
                Duyệt
              </Button>
            </>
          )}

          {pr.status === "APPROVED" && canUpdatePurchaseRequest && (
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

          {pr.status === "SENT_TO_SUPPLIER" && canUpdatePurchaseRequest && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-[4px] border-indigo-200 text-[12px] font-medium text-indigo-600 hover:bg-indigo-50"
                onClick={() =>
                  setConfirmAction({
                    type: "resendToSupplier",
                    label: "Gửi lại email cho nhà cung cấp",
                  })
                }
              >
                <Mail size={13} className="mr-1.5" />
                Gửi lại mail
              </Button>
              <Button
                size="sm"
                className="h-8 rounded-[4px] bg-cyan-600 text-[12px] font-medium text-white hover:bg-cyan-700"
                onClick={() =>
                  setConfirmAction({
                    type: "confirmSupplier",
                    label: "Ghi nhận NCC xác nhận",
                  })
                }
              >
                NCC xác nhận
              </Button>
            </>
          )}

          {pr.status === "SUPPLIER_CONFIRMED" && canUpdatePurchaseRequest && (
            <Button
              size="sm"
              className="h-8 rounded-[4px] bg-emerald-600 text-[12px] font-medium text-white hover:bg-emerald-700"
              onClick={() =>
                setConfirmAction({
                  type: "markDelivering",
                  label: "Chuyển sang chờ giao hàng",
                })
              }
            >
              Chờ giao hàng
            </Button>
          )}

          {canCreateReceipt && hasRemaining && (
            <Button
              size="sm"
              className="h-8 rounded-[4px] bg-blue-600 text-[12px] font-medium text-white hover:bg-blue-700"
              onClick={handleCreateReceipt}
            >
              <Plus size={13} className="mr-1.5" />
              Tạo đợt nhập
            </Button>
          )}

          {["PARTIALLY_RECEIVED", "COMPLETED"].includes(pr.status) &&
            canApprovePurchaseRequest && (
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

          {[
            "DRAFT",
            "PENDING_APPROVAL",
            "APPROVED",
            "SENT_TO_SUPPLIER",
            "SUPPLIER_CONFIRMED",
            "DELIVERING",
          ].includes(pr.status) &&
            (pr.totalReceiptCount ?? 0) === 0 &&
            canUpdatePurchaseRequest && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-[4px] border-rose-200 text-[12px] font-medium text-rose-600"
                onClick={() =>
                  setConfirmAction({
                    type: "cancel",
                    label: "Hủy phiếu yêu cầu",
                  })
                }
              >
                Hủy
              </Button>
            )}
        </div>
      </div>

      {/* ── Info Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Nhà cung cấp",
            value: `${pr.supplierName} (${pr.supplierCode})`,
          },
          {
            label: "Chi nhánh nhận",
            value: pr.branchName,
          },
          {
            label: "Ngày tạo phiếu",
            value: fmtDate(pr.createdAt),
          },
          {
            label: "Tổng giá trị",
            value: fmtCurrency(pr.totalAmount ?? 0),
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-[4px] border border-slate-200 bg-white p-3 shadow-sm"
          >
            <div className="mb-3 text-[11px] font-semibold text-slate-400">
              {card.label}
            </div>
            <div className="truncate text-[13px] font-semibold text-slate-900">
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Items Table ───────────────────────────────────────────────────── */}
      <div className="border border-slate-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <h2 className="text-[12px] font-semibold text-slate-900">
            1. Danh sách hàng hóa
          </h2>
          <span className="text-[11px] text-slate-400">
            {pr.items?.length ?? 0} mặt hàng
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] table-fixed text-[12px]">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="w-[28%] px-4 py-3 text-left text-[11px] font-medium text-slate-500">
                  Sản phẩm
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-medium text-slate-500">
                  Yêu cầu
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-medium text-slate-500">
                  NCC giao
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-medium text-slate-500">
                  Đạt QC
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-medium text-slate-500">
                  Lỗi
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-medium text-slate-500">
                  Còn thiếu
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-medium text-slate-500">
                  Đơn giá
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-medium text-slate-500">
                  Thành tiền
                </th>
              </tr>
            </thead>
            <tbody>
              {(pr.items ?? []).map((item, idx) => {
                const progress = itemProgressMap.get(
                  String(item.productCode || "").trim(),
                );
                const requestedQty = Number(item.requestedQty ?? 0);
                const deliveredQty =
                  progress?.deliveredQty ?? Number(item.deliveredQty ?? 0);
                const defectiveQty =
                  progress?.defectiveQty ?? Number(item.defectiveQty ?? 0);
                const acceptedQty = Math.max(deliveredQty - defectiveQty, 0);
                const remainingQty = Math.max(
                  Number(item.remainingQty ?? requestedQty - acceptedQty),
                  0,
                );
                const fulfilled =
                  deliveredQty >= requestedQty && requestedQty > 0;
                const productImageSrc = resolveImageUrl(
                  item.imageUrl,
                  "/placeholder.svg",
                );
                return (
                  <tr
                    key={item.id ?? idx}
                    className={cn(
                      "h-[58px] border-b border-slate-100 hover:bg-slate-50",
                    )}
                  >
                    <td className="px-4 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <img
                          src={productImageSrc}
                          alt=""
                          className="h-7 w-7 shrink-0 rounded border border-slate-100 object-cover"
                          onError={(event) => {
                            event.currentTarget.src = "/placeholder.svg";
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div
                            className="truncate text-[12.5px] font-semibold text-slate-800"
                            title={item.productName || ""}
                          >
                            {item.productName}
                          </div>
                          <div
                            className="truncate text-[10.5px] text-slate-400"
                            title={item.productCode || ""}
                          >
                            {item.productCode}
                          </div>
                        </div>
                        {fulfilled && (
                          <CheckCircle2
                            size={13}
                            className="ml-1 shrink-0 text-blue-500"
                          />
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-center font-semibold">
                      {requestedQty}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-center text-slate-600">
                      {deliveredQty}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-center font-medium text-slate-700">
                      {acceptedQty}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-center font-medium text-slate-700">
                      {defectiveQty}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-center">{remainingQty}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-right text-slate-600">
                      {fmtCurrency(item.unitPrice ?? 0)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right font-semibold text-slate-700">
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
      <div className="border border-slate-200 bg-white shadow-sm">
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <h2 className="text-[12px] font-semibold text-slate-900">
            2. Lịch sử đợt nhập hàng
          </h2>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>
              {pr.completedReceiptCount}/{pr.totalReceiptCount} đợt hoàn tất
            </span>
            {canCreateReceipt && hasRemaining && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-[4px] border-slate-200 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
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
                className="mt-3 h-8 rounded-[4px] bg-blue-600 text-[12px] font-medium text-white hover:bg-blue-700"
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
                          "relative z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] font-semibold text-slate-500",
                        )}
                      >
                        {idx + 1}
                      </div>

                      {/* Card */}
                      <div className="flex-1 rounded-[4px] border border-slate-200 bg-slate-50 p-3 transition-colors hover:bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10.5px] font-medium text-slate-500">
                              Đợt {idx + 1}
                            </span>
                            <Link
                              href={`/admin/receipts/${receipt.id}`}
                              className="text-[13px] font-semibold text-slate-800 hover:text-blue-700"
                            >
                              {receipt.code}
                            </Link>
                            <span className="text-[10.5px] font-medium text-slate-500">
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
                            <div className="font-semibold text-slate-700">
                              {receipt.totalDelivered}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] text-slate-400 mb-0.5">
                              Đạt QC
                            </div>
                            <div className="font-semibold text-slate-700">
                              {receipt.totalAccepted}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] text-slate-400 mb-0.5">
                              Lỗi
                            </div>
                            <div className="font-semibold text-slate-700">
                              {receipt.totalDefective}
                            </div>
                          </div>
                        </div>

                        {receiptHistoryDetails[receipt.id]?.items?.length ? (
                          <div className="mt-3 overflow-x-auto rounded border border-slate-200 bg-white">
                            <table className="min-w-[760px] w-full text-[11px]">
                              <thead className="bg-slate-50">
                                <tr className="text-slate-500">
                                  <th className="px-3 py-2 text-left font-medium">
                                    Sản phẩm / SKU
                                  </th>
                                  <th className="px-3 py-2 text-left font-medium">
                                    Số lô / Hạn dùng
                                  </th>
                                  <th className="px-3 py-2 text-right font-medium">
                                    Nhập đợt này
                                  </th>
                                  <th className="px-3 py-2 text-right font-medium">
                                    Hàng lỗi
                                  </th>
                                  <th className="px-3 py-2 text-right font-medium">
                                    Đơn giá
                                  </th>
                                  <th className="px-3 py-2 text-left font-medium">
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
                                      <td className="px-3 py-2 text-right font-medium text-slate-700">
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
