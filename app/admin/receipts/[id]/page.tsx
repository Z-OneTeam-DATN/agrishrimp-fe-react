"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { InventoryApiService } from "@/app/services/inventory.service";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ChevronLeft,
  Printer,
  CheckCircle2,
  Package,
  X,
  Ban,
  CheckSquare,
  ImageIcon,
  AlertCircle,
  Wallet,
  PlusCircle,
  Pencil,
  Copy,
  Loader2,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { SharedDatePicker } from "@/components/admin/shared/BirthDatePicker";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/stores/useAuthStore";
import { P } from "@/lib/permissions";
import { getErrorMessage } from "@/lib/axios";

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

export default function ReceiptDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { hasPermission } = usePermissions();
  const { user } = useAuthStore();

  // AlertDialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
    variant?: "default" | "destructive";
  }>({
    open: false,
    title: "",
    description: "",
    action: () => {},
  });

  const showConfirm = (title: string, description: string, action: () => void, variant: "default" | "destructive" = "default") => {
    setConfirmConfig({ open: true, title, description, action, variant });
  };

  // Kiểm tra quyền
  const isAdmin = user?.role?.slug === "ADMIN";
  const canSeePrice = isAdmin || hasPermission(P.IMPORT_VIEW) || hasPermission(P.CHECK_VIEW);
  const canApprove = isAdmin || hasPermission(P.IMPORT_APPROVE);
  const canCreateReturn = isAdmin || hasPermission(P.EXPORT_CREATE);

  // Modal States
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [inspectItems, setInspectItems] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "TRANSFER",
    paymentDate: new Date().toISOString().slice(0, 10),
    referenceCode: "",
    note: "",
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [data, payments] = await Promise.all([
        InventoryApiService.getReceiptDetail(id as string),
        InventoryApiService.getReceiptPayments(id as string),
      ]);
      setReceipt(data);
      setPaymentHistory(Array.isArray(payments) ? payments : []);
    } catch (error) {
      toast.error("Lỗi tải dữ liệu. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleApiCall = async (action: () => Promise<any>, successMsg: string) => {
    setIsProcessing(true);
    try {
      await action();
      toast.success(successMsg);
      await fetchData();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const currentDebt = Number(
    receipt?.debtAmount ?? ((receipt?.totalAmount || 0) - (receipt?.paymentAmount || 0)),
  );
  const canRecordPayment =
    (isAdmin || hasPermission(P.REPORT_FINANCE_VIEW) || hasPermission(P.IMPORT_APPROVE)) &&
    receipt?.status === "COMPLETED" &&
    currentDebt > 0;
  const hasRejectedItems = (receipt?.items || []).some(
    (item: any) => Number(item.quantityRejected || 0) > 0,
  );
  const canCreateSupplierReturn =
    canCreateReturn &&
    hasRejectedItems &&
    receipt?.status === "COMPLETED";

  const openPaymentModal = (payFull = false) => {
    setPaymentForm({
      amount: payFull ? String(currentDebt) : "",
      paymentMethod: "TRANSFER",
      paymentDate: new Date().toISOString().slice(0, 10),
      referenceCode: "",
      note: "",
    });
    setShowPaymentModal(true);
  };

  const submitPayment = async () => {
    const amount = Number(paymentForm.amount || 0);
    if (!amount || amount <= 0) {
      toast.error("Vui lòng nhập số tiền thanh toán hợp lệ");
      return;
    }
    if (amount > currentDebt) {
      toast.error("Số tiền thanh toán vượt quá công nợ còn lại");
      return;
    }

    setIsProcessing(true);
    try {
      await InventoryApiService.createReceiptPayment(id as string, {
        amount,
        paymentMethod: paymentForm.paymentMethod,
        paymentDate: paymentForm.paymentDate,
        referenceCode: paymentForm.referenceCode,
        note: paymentForm.note,
      });
      toast.success("Đã ghi nhận thanh toán NCC");
      setShowPaymentModal(false);
      await fetchData();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  // GIAI ĐOẠN 2: Duyệt phiếu (POST)
  const handleApprove = () => {
    showConfirm(
      "Xác nhận duyệt phiếu",
      "Phiếu sẽ chuyển sang trạng thái chờ kiểm hàng. Tồn kho và công nợ chỉ được ghi nhận khi hoàn tất nhập kho.",
      () => handleApiCall(() => InventoryApiService.approveReceipt(id as string), "Đã duyệt phiếu thành công!")
    );
  };

  const handleReject = () => {
    showConfirm(
      "Xác nhận từ chối phiếu",
      "Hành động này sẽ từ chối kế hoạch nhập hàng hiện tại. Bạn có chắc chắn không?",
      () => handleApiCall(() => InventoryApiService.rejectReceipt(id as string), "Đã từ chối phiếu nhập!"),
      "destructive"
    );
  };

  const handleCancel = () => {
    showConfirm(
      "Xác nhận hủy phiếu",
      "Bạn có chắc chắn muốn hủy phiếu nhập hàng này không? Hành động này không thể hoàn tác.",
      () => handleApiCall(() => InventoryApiService.rejectReceipt(id as string), "Đã hủy phiếu thành công!"),
      "destructive"
    );
  };

  const handleCreateSupplierReturn = () => {
    if (!receipt) return;
    const query = new URLSearchParams({
      exportType: "RETURN",
      fromReceiptId: String(receipt.id || id),
    });
    router.push(`/admin/exports/new-command?${query.toString()}`);
  };


  const handlePrintLabels = () => {
    if (!receipt) return;

    const escapeHtml = (value: any) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const labels = (receipt.items || [])
      .filter((item: any) => Number(item.quantityAccepted || 0) > 0)
      .map((item: any) => {
        const acceptedQty = Number(item.quantityAccepted || 0);
        const barcodeValue = `${receipt.code || receipt.receiptCode || id}-${item.productCode}-${item.lotNumber || "DEFAULT"}`;

        return `
          <section class="label">
            <div class="label__top">
              <strong>${escapeHtml(item.productName)}</strong>
              <span>${acceptedQty} ${escapeHtml(item.unit || "cai")}</span>
            </div>
            <div class="label__meta">
              <span>SKU: ${escapeHtml(item.productCode)}</span>
              <span>Lo: ${escapeHtml(item.lotNumber || "DEFAULT")}</span>
              <span>HSD: ${escapeHtml(item.expiryDate || "---")}</span>
            </div>
            <div class="barcode">${escapeHtml(barcodeValue)}</div>
            <div class="receipt">PN: ${escapeHtml(receipt.code || receipt.receiptCode || id)}</div>
          </section>
        `;
      })
      .join("");

    if (!labels) {
      toast.error("Khong co hang dat QC de in nhan.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      toast.error("Trinh duyet dang chan cua so in nhan.");
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>In nhan ${escapeHtml(receipt.code || receipt.receiptCode || id)}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 16px; font-family: Arial, sans-serif; color: #111827; }
            .sheet { display: grid; grid-template-columns: repeat(2, 88mm); gap: 8mm; align-items: start; }
            .label { width: 88mm; min-height: 52mm; border: 1px solid #111827; padding: 8px; break-inside: avoid; page-break-inside: avoid; }
            .label__top { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; text-transform: uppercase; }
            .label__top strong { max-width: 62mm; line-height: 1.25; }
            .label__top span { white-space: nowrap; font-weight: 700; }
            .label__meta { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 8px; margin-top: 8px; font-size: 10px; }
            .barcode { margin-top: 10px; padding: 8px 6px; border: 1px solid #d1d5db; font-family: "Courier New", monospace; font-size: 11px; letter-spacing: 1px; text-align: center; overflow-wrap: anywhere; }
            .receipt { margin-top: 6px; font-size: 10px; font-weight: 700; text-align: right; }
            @media print {
              body { padding: 0; }
              .sheet { gap: 4mm; }
              .label { margin: 0; }
            }
          </style>
        </head>
        <body><main class="sheet">${labels}</main></body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };
  // GIAI ĐOẠN 3: Kiểm đếm QC & Nhập kho
  const openInspectModal = () => {
    setInspectItems((receipt?.items || []).map((i: any) => ({
      ...i,
      plannedQuantity: i.plannedQuantity || i.quantity || 0,
      quantityDelivered: i.quantityReal || i.plannedQuantity || i.quantity || 0,
      quantityAccepted: i.quantityAccepted || i.plannedQuantity || i.quantity || 0,
      quantityRejected: 0,
      lotNumber: i.lotNumber || "",
      expiryDate: i.expiryDate || "",
      note: ""
    })));
    setShowInspectModal(true);
  };

  const submitInspect = () => {
    // Validation logic QC: phân tách rõ NCC giao / đạt QC / lỗi
    for (const item of inspectItems) {
      const planned = Number(item.plannedQuantity) || 0;
      const delivered = Number(item.quantityDelivered) || 0;
      const accepted = Number(item.quantityAccepted) || 0;
      const rejected = Number(item.quantityRejected) || 0;

      if (delivered > planned) {
        toast.error(`SP ${item.productName}: Số NCC giao (${delivered}) không được lớn hơn số lượng của đợt này (${planned})`);
        return;
      }
      if (accepted + rejected !== delivered) {
        toast.error(`SP ${item.productName}: Đạt QC + Lỗi phải đúng bằng số NCC giao`);
        return;
      }
      if (delivered < 0 || accepted < 0 || rejected < 0) {
        toast.error(`SP ${item.productName}: Số lượng giao/đạt/lỗi không được âm`);
        return;
      }

      if (delivered > 0 && (!item.lotNumber?.trim() || !item.expiryDate)) {
        toast.error(`SP ${item.productName}: Vui lòng điền đầy đủ Số lô và Hạn dùng`);
        return;
      }
      if ((rejected > 0 || delivered < planned) && !item.note?.trim()) {
        toast.error(`SP ${item.productName}: Vui lòng ghi rõ lý do lỗi hoặc phần giao thiếu`);
        return;
      }
    }

    showConfirm(
      "Xác nhận nhập kho",
      "Hệ thống sẽ cập nhật tồn kho thực tế ngay lập tức. Bạn đã kiểm tra kỹ số lượng thực nhận chưa?",
      () => {
        const payload = inspectItems.map((i) => ({
          productCode: i.productCode,
          quantityReal: Number(i.quantityAccepted || 0),
          quantityDelivered: Number(i.quantityDelivered || 0),
          quantityRejected: Number(i.quantityRejected || 0),
          lotNumber: i.lotNumber,
          expiryDate: i.expiryDate,
          note: i.note || ""
        }));

        handleApiCall(() => InventoryApiService.completeReceipt(id as string, { items: payload }), "Hoàn tất nhập kho thành công!");
        setShowInspectModal(false);
      }
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={30} />
      </div>
    );
  }
  if (!receipt) {
    return (
      <div className="p-10 text-center text-[13px] font-medium text-rose-600">
        Phiếu nhập không tồn tại
      </div>
    );
  }

  const statusLabel: Record<string, string> = {
    PLANNING: "Đang lập",
    PENDING: "Chờ duyệt",
    APPROVED: "Chờ kiểm hàng",
    COMPLETED: "Đã hoàn tất",
    IMPORTED: "Đã nhập kho",
    REJECTED: "Đã từ chối",
    CANCELLED: "Đã hủy",
  };
  const isQCMode = ["COMPLETED", "IMPORTED"].includes(receipt.status);
  const copyValue = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(`Đã sao chép ${label}`);
  };

  return (
    <div className="min-h-screen space-y-5 px-1 pb-[104px] text-slate-900">
      <div className="flex flex-col gap-4 pt-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9 text-slate-500"
            title="Quay lại"
          >
            <ChevronLeft size={18} />
          </Button>
          <div>
            <h1 className="text-[20px] font-semibold uppercase text-slate-900">
              Chi tiết phiếu nhập
            </h1>
            <p className="mt-1 text-[10.5px] text-slate-500">
              {receipt.receiptCode || receipt.code} · {statusLabel[receipt.status] || receipt.status}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="h-10 px-3 text-[12px] font-medium" onClick={() => window.print()}>
            <Printer size={14} className="mr-2" />
            In phiếu
          </Button>
          {receipt.status === "PENDING" && (
            <Button
              variant="outline"
              className="h-10 px-3 text-[12px] font-medium"
              onClick={() => router.push(`/admin/receipts/new?id=${id}`)}
            >
              <Pencil size={14} className="mr-2" />
              Chỉnh sửa
            </Button>
          )}
          {receipt.status === "PENDING" && canApprove ? (
            <>
              <Button
                onClick={handleApprove}
                disabled={isProcessing}
                className="h-10 bg-blue-600 px-4 text-[12px] font-semibold hover:bg-blue-700"
              >
                Duyệt phiếu
              </Button>
              <Button
                onClick={handleReject}
                disabled={isProcessing}
                variant="outline"
                className="h-10 border-rose-200 px-4 text-[12px] font-medium text-rose-600"
              >
                Từ chối
              </Button>
            </>
          ) : null}
          {receipt.status === "APPROVED" && canApprove ? (
            <Button
              onClick={openInspectModal}
              disabled={isProcessing}
              className="h-10 bg-blue-600 px-4 text-[12px] font-semibold hover:bg-blue-700"
            >
              <CheckSquare size={14} className="mr-2" />
              Kiểm hàng và nhập kho
            </Button>
          ) : null}
          {receipt.status === "COMPLETED" ? (
            <Button
              onClick={handlePrintLabels}
              variant="outline"
              className="h-10 px-3 text-[12px] font-medium"
            >
              <Printer size={14} className="mr-2" />
              In nhãn
            </Button>
          ) : null}
          {canCreateSupplierReturn ? (
            <Button
              onClick={handleCreateSupplierReturn}
              disabled={isProcessing}
              variant="outline"
              className="h-10 border-rose-200 px-3 text-[12px] font-medium text-rose-600"
            >
              <Package size={14} className="mr-2" />
              Xuất trả NCC
            </Button>
          ) : null}
          {["PENDING", "APPROVED"].includes(receipt.status) ? (
            <Button
              onClick={handleCancel}
              disabled={isProcessing}
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-rose-500"
              title="Hủy phiếu"
            >
              <Ban size={16} />
            </Button>
          ) : null}
        </div>
      </div>

      <section className="border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 border-b border-slate-200 pb-4">
          <h2 className="text-[12px] font-semibold text-slate-900">
            1. Thông tin phiếu nhập
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
          {[
            ["Mã phiếu", receipt.receiptCode || receipt.code, true],
            ["Trạng thái", statusLabel[receipt.status] || receipt.status, false],
            ["Phiếu yêu cầu", receipt.purchaseRequestCode || "Chưa liên kết", Boolean(receipt.purchaseRequestCode)],
            ["Nhà cung cấp", receipt.supplierName || "-", false],
            ["Mã nhà cung cấp", receipt.supplierCode || "-", Boolean(receipt.supplierCode)],
            ["Kho nhập", receipt.branchName || "-", false],
            ["Ngày nhập", receipt.entryDate ? new Date(receipt.entryDate).toLocaleDateString("vi-VN") : "-", false],
            ["Người giao hàng", receipt.deliverer || "-", false],
            ["Tổng giá trị", `${formatNumber(receipt.totalAmount || 0)} ₫`, false],
          ].map(([label, value, copyable]) => (
            <div key={String(label)} className="space-y-2">
              <Label className="text-[10.5px] font-semibold text-slate-500">
                {label}
              </Label>
              <div className="relative">
                <Input
                  readOnly
                  value={String(value)}
                  className="h-10 border-slate-200 bg-slate-50 pr-10 text-[13px] font-normal shadow-none"
                />
                {copyable ? (
                  <button
                    type="button"
                    className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-slate-400 hover:text-slate-700"
                    title={`Sao chép ${label}`}
                    onClick={() => copyValue(String(value), String(label).toLowerCase())}
                  >
                    <Copy size={14} />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
          <div className="space-y-2 sm:col-span-2 xl:col-span-3">
            <Label className="text-[10.5px] font-semibold text-slate-500">
              Ghi chú
            </Label>
            <div className="min-h-16 border border-slate-200 bg-slate-50 p-3 text-[12px] leading-relaxed text-slate-600">
              {receipt.note || "Không có ghi chú"}
            </div>
          </div>
        </div>
        <p className="mt-5 border-t border-slate-100 pt-4 text-[10.5px] text-slate-400">
          Tạo bởi {receipt.creatorName || "Không xác định"} · Ngày tạo{" "}
          {receipt.createdAt ? new Date(receipt.createdAt).toLocaleString("vi-VN") : "-"} · Cập nhật{" "}
          {receipt.updatedAt ? new Date(receipt.updatedAt).toLocaleString("vi-VN") : "-"}
        </p>
      </section>

      <section className="overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-[12px] font-semibold text-slate-900">
            2. Hàng hóa nhập kho
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] table-fixed text-[12px]">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-500">
              <tr>
                <th className="w-[28%] px-5 py-3 text-left font-medium">Sản phẩm</th>
                <th className="w-[12%] px-3 py-3 text-left font-medium">Lô / hạn dùng</th>
                <th className="w-[8%] px-3 py-3 text-right font-medium">Dự kiến</th>
                {isQCMode ? (
                  <>
                    <th className="w-[8%] px-3 py-3 text-right font-medium">SL giao</th>
                    <th className="w-[8%] px-3 py-3 text-right font-medium">SL đạt</th>
                    <th className="w-[7%] px-3 py-3 text-right font-medium">SL lỗi</th>
                  </>
                ) : null}
                <th className="w-[12%] px-3 py-3 text-right font-medium">Giá nhập</th>
                <th className="w-[12%] px-5 py-3 text-right font-medium">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {(receipt.items || []).map((item: any, index: number) => {
                const planned = Number(item.plannedQuantity || item.quantity || 0);
                const delivered = Number(item.quantityReal || item.quantityDelivered || 0);
                const accepted = Number(item.quantityAccepted || 0);
                const rejected = Number(item.quantityRejected || 0);
                return (
                  <tr key={item.id || `${item.productCode}-${index}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-slate-200 bg-white">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon size={15} className="text-slate-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[12.5px] font-semibold text-slate-800">{item.productName}</p>
                          <p className="mt-0.5 truncate text-[10px] text-slate-400">{item.productCode} · {item.unit || "Cái"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      <p className="truncate">{item.lotNumber || "-"}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">{item.expiryDate || "-"}</p>
                    </td>
                    <td className="px-3 py-3 text-right font-medium">{formatNumber(planned)}</td>
                    {isQCMode ? (
                      <>
                        <td className="px-3 py-3 text-right">{formatNumber(delivered)}</td>
                        <td className="px-3 py-3 text-right">{formatNumber(accepted)}</td>
                        <td className="px-3 py-3 text-right">{rejected ? formatNumber(rejected) : "-"}</td>
                      </>
                    ) : null}
                    <td className="px-3 py-3 text-right">{canSeePrice ? `${formatNumber(item.importPrice || 0)} ₫` : "-"}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-800">
                      {canSeePrice ? `${formatNumber((isQCMode ? accepted : planned) * Number(item.importPrice || 0))} ₫` : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[12px] font-semibold text-slate-900">
            3. Thanh toán nhà cung cấp
          </h2>
          {canRecordPayment ? (
            <div className="flex gap-2">
              <Button variant="outline" className="h-9 px-3 text-[11px] font-medium" onClick={() => openPaymentModal(true)}>
                <Wallet size={13} className="mr-2" />
                Thanh toán đủ
              </Button>
              <Button className="h-9 bg-blue-600 px-3 text-[11px] font-semibold hover:bg-blue-700" onClick={() => openPaymentModal(false)}>
                <PlusCircle size={13} className="mr-2" />
                Ghi nhận thanh toán
              </Button>
            </div>
          ) : null}
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <p className="text-[10.5px] font-semibold text-slate-500">Giá trị phải trả</p>
            <p className="mt-2 text-[13px] font-semibold text-slate-800">{formatNumber(receipt.totalAmount || 0)} ₫</p>
          </div>
          <div>
            <p className="text-[10.5px] font-semibold text-slate-500">Đã thanh toán</p>
            <p className="mt-2 text-[13px] font-semibold text-slate-800">{formatNumber(receipt.paymentAmount || 0)} ₫</p>
          </div>
          <div>
            <p className="text-[10.5px] font-semibold text-slate-500">Còn nợ</p>
            <p className="mt-2 text-[13px] font-semibold text-slate-800">{formatNumber(currentDebt)} ₫</p>
          </div>
        </div>
        <div className="mt-6 border-t border-slate-100 pt-4">
          <p className="mb-3 text-[10.5px] font-semibold text-slate-500">Lịch sử thanh toán</p>
          {paymentHistory.length === 0 ? (
            <p className="text-[11.5px] text-slate-400">Chưa có thanh toán nào được ghi nhận.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {paymentHistory.map((payment) => (
                <div key={payment.id} className="grid grid-cols-1 gap-2 py-3 text-[11.5px] sm:grid-cols-4">
                  <span className="font-semibold text-slate-800">{formatNumber(payment.amount || 0)} ₫</span>
                  <span className="text-slate-500">{payment.paymentMethod}</span>
                  <span className="text-slate-500">{payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString("vi-VN") : "-"}</span>
                  <span className="text-slate-400">{payment.referenceCode || payment.note || "-"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* MODAL GIAI ĐOẠN 3: KIỂM ĐẾM QC & XÁC NHẬN NHẬP (Lời khuyên UI) */}
      {showInspectModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
           <div className="flex max-h-[92vh] w-full max-w-[1150px] flex-col rounded-md border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 p-5">
                <div className="flex flex-col">
                   <h3 className="flex items-center gap-2 text-[15px] font-semibold text-slate-900"><CheckSquare size={18} className="text-blue-600"/> Kiểm hàng và nhập kho</h3>
                   <p className="mt-1 text-[10.5px] text-slate-500">Xác nhận số lượng giao, số lượng đạt và hàng lỗi.</p>
                </div>
                <button onClick={() => setShowInspectModal(false)} className="text-slate-400 hover:text-slate-700"><X size={20}/></button>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
                 <table className="w-full border border-slate-200 bg-white text-left text-[12px]">
                    <thead className="sticky top-0 z-10 border-b bg-slate-50">
                       <tr className="text-[10.5px] font-medium text-slate-500">
                          <th className="p-4 border-r w-[240px]">Sản phẩm / SKU</th>
                          <th className="p-4 text-center border-r w-[140px]">Số lô / hạn dùng</th>
                          <th className="p-4 text-center border-r w-[90px]">Dự kiến</th>
                          <th className="p-4 text-center border-r w-[120px]">SL giao</th>
                          <th className="p-4 text-center border-r w-[120px]">SL đạt</th>
                          <th className="p-4 text-center border-r w-[100px]">SL lỗi</th>
                          <th className="p-4 text-left">Lý do lỗi / Ghi chú</th>
                       </tr>
                    </thead>
                    <tbody>
                       {inspectItems.map((item, idx) => {
                           const planned = item.plannedQuantity || 0;
                           const delivered = Number(item.quantityDelivered) || 0;
                           const accepted = Number(item.quantityAccepted) || 0;
                           const rejected = Number(item.quantityRejected) || 0;
                           const isNoteRequired = rejected > 0 || delivered < planned;

                          return (
                         <tr key={idx} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 border-r">
                              <p className="font-semibold leading-tight text-slate-700">{item.productName}</p>
                              <p className="text-[10px] font-mono text-slate-400 mt-1">#{item.productCode}</p>
                            </td>
                            
                            <td className="p-2 border-r space-y-1 bg-slate-50/30">
                               <Input 
                                 placeholder="Số lô hàng..."
                                 value={item.lotNumber || ""}
                                 onChange={(e) => {
                                   const newItems = [...inspectItems];
                                   newItems[idx].lotNumber = e.target.value;
                                   setInspectItems(newItems);
                                 }}
                                 className="h-9 rounded-md border-slate-200 bg-white text-[11px] font-medium shadow-none"
                               />
                               <SharedDatePicker
                                 value={item.expiryDate || ""}
                                 onChange={(nextValue) => {
                                   const newItems = [...inspectItems];
                                   newItems[idx].expiryDate = nextValue;
                                   setInspectItems(newItems);
                                 }}
                                 placeholder="Hạn dùng"
                                 variant="compact"
                                 buttonClassName="h-9 rounded-md border-slate-200 bg-white text-[11px] shadow-none"
                               />
                            </td>

                            <td className="border-r p-4 text-center text-[13px] font-semibold text-slate-600">{planned}</td>
                            
                            <td className="border-r p-2">
                               <Input 
                                 type="number"
                                 min={0}
                                 value={item.quantityDelivered}
                                 onChange={(e) => {
                                   const newItems = [...inspectItems];
                                   newItems[idx].quantityDelivered = e.target.value;
                                   setInspectItems(newItems);
                                 }}
                                  className="h-10 w-full rounded-md border-slate-200 bg-white text-right font-medium shadow-none"
                                />
                             </td>

                            <td className="border-r p-2">
                               <Input 
                                 type="number"
                                 min={0}
                                 value={item.quantityAccepted} 
                                 onChange={(e) => {
                                   const newItems = [...inspectItems];
                                   newItems[idx].quantityAccepted = e.target.value;
                                   setInspectItems(newItems);
                                 }}
                                 className="h-10 w-full rounded-md border-slate-200 bg-white text-right font-medium shadow-none"
                               />
                               <div className="mt-1 text-right text-[10.5px] text-slate-500">
                                 Thực nhập kho <span className="font-semibold text-slate-700">{formatNumber(accepted)}</span>
                               </div>
                             </td>

                            <td className="border-r p-2">
                               <Input
                                 type="number"
                                 min={0}
                                 value={item.quantityRejected}
                                 onChange={(e) => {
                                   const newItems = [...inspectItems];
                                   newItems[idx].quantityRejected = e.target.value;
                                   setInspectItems(newItems);
                                 }}
                                 className="h-10 w-full rounded-md border-slate-200 bg-white text-right font-medium shadow-none"
                               />
                            </td>

                            <td className="p-2">
                               <Input 
                                 value={item.note || ""} 
                                 onChange={(e) => {
                                   const newItems = [...inspectItems];
                                   newItems[idx].note = e.target.value;
                                   setInspectItems(newItems);
                                 }}
                                 placeholder={isNoteRequired ? "Bắt buộc: Nêu lý do lỗi hoặc giao thiếu..." : "Ghi chú thêm..."} 
                                 className={cn(
                                   "h-10 rounded-md border-slate-200 bg-white text-[11px] font-normal shadow-none",
                                   isNoteRequired ? "border-rose-400 bg-rose-50 ring-1 ring-rose-200" : ""
                                 )}
                               />
                            </td>
                         </tr>
                       )})}
                    </tbody>
                 </table>
              </div>
              <div className="flex justify-end gap-3 border-t bg-white p-5">
                 <Button variant="outline" onClick={() => setShowInspectModal(false)} className="h-10 px-6 text-[12px] font-medium">Hủy</Button>
                 <Button onClick={submitInspect} disabled={isProcessing} className="flex h-10 items-center gap-2 bg-blue-600 px-6 text-[12px] font-semibold text-white hover:bg-blue-700"><CheckCircle2 size={16}/> Hoàn tất nhập kho</Button>
              </div>
           </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-[560px] rounded-md border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">Ghi nhận thanh toán NCC</h3>
                <p className="text-[11px] text-slate-400 mt-1">Phiếu {receipt.code} · Còn nợ {formatNumber(currentDebt)} ₫</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10.5px] font-semibold text-slate-500">Số tiền thanh toán</Label>
                  <Input
                    type="number"
                    min={0}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="h-10 rounded-md border-slate-200 text-right text-[13px] font-normal shadow-none"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10.5px] font-semibold text-slate-500">Ngày thanh toán</Label>
                  <SharedDatePicker
                    value={paymentForm.paymentDate}
                    onChange={(nextValue) => setPaymentForm({ ...paymentForm, paymentDate: nextValue })}
                    placeholder="Chọn ngày"
                    variant="compact"
                    buttonClassName="h-10 rounded-md border-slate-200 text-[13px] shadow-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10.5px] font-semibold text-slate-500">Phương thức</Label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="h-10 w-full border border-slate-200 px-3 text-[13px] font-medium outline-none"
                  >
                    <option value="TRANSFER">Chuyển khoản</option>
                    <option value="CASH">Tiền mặt</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10.5px] font-semibold text-slate-500">Tham chiếu</Label>
                  <Input
                    value={paymentForm.referenceCode}
                    onChange={(e) => setPaymentForm({ ...paymentForm, referenceCode: e.target.value })}
                    className="h-10 rounded-md border-slate-200 text-[13px] shadow-none"
                    placeholder="UNC / mã giao dịch..."
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10.5px] font-semibold text-slate-500">Ghi chú</Label>
                <Input
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                  className="h-10 rounded-md border-slate-200 text-[13px] shadow-none"
                  placeholder="Ví dụ: thanh toán đợt 1, chuyển khoản ngân hàng..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t bg-slate-50 px-5 py-4">
              <Button
                variant="outline"
                className="h-10 px-5 text-[12px] font-medium"
                onClick={() => setShowPaymentModal(false)}
                disabled={isProcessing}
              >
                Hủy
              </Button>
              <Button
                className="h-10 bg-blue-600 px-5 text-[12px] font-semibold hover:bg-blue-700"
                onClick={submitPayment}
                disabled={isProcessing}
              >
                {isProcessing ? "Đang ghi nhận..." : "Xác nhận thanh toán"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AlertDialog dành cho các xác nhận quan trọng */}
      <AlertDialog open={confirmConfig.open} onOpenChange={(o) => setConfirmConfig({ ...confirmConfig, open: o })}>
        <AlertDialogContent className="rounded-md border border-slate-200 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
              <AlertCircle className={cn("h-5 w-5", confirmConfig.variant === "destructive" ? "text-rose-500" : "text-blue-600")} />
              {confirmConfig.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-[12px] font-normal leading-relaxed text-slate-500">
              {confirmConfig.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 pt-4">
            <AlertDialogCancel className="h-10 rounded-md border-slate-200 px-6 text-[12px] font-medium text-slate-600 hover:bg-slate-50">Quay lại</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmConfig.action}
              className={cn(
                "h-10 rounded-md px-8 text-[12px] font-semibold transition-colors",
                confirmConfig.variant === "destructive" ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

