"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import {
  AlertCircle,
  ArrowDownToLine,
  Ban,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  DollarSign,
  Edit,
  Package,
  Plus,
  Printer,
  Truck,
} from "lucide-react";

import { transferService } from "@/app/services/transfer.service";
import { branchService } from "@/app/services/branchService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermissions } from "@/hooks/usePermissions";
import { formatDate } from "@/lib/dateUtils";
import { P } from "@/lib/permissions";
import { getTransferStatusLabel } from "@/lib/transfer-status";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";

type InspectItem = {
  variantId: number;
  productName: string;
  quantityRequested: number;
  quantityReal: number;
  quantityAccepted: number;
  quantityRejected: number;
  note: string;
};

type AuditLog = {
  time: string;
  user: string;
  action: string;
  detail: string;
};

const DONE_STATUSES = ["COMPLETED"];
const CANCELLABLE_STATUSES = ["PENDING", "SOURCE_CONFIRMED", "APPROVED"];

const resolveTransferErrorMessage = (error: unknown) => {
  if (isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (data && typeof data === "object") {
      const message =
        (typeof data.detail === "string" && data.detail) ||
        (typeof data.message === "string" && data.message) ||
        (typeof data.error === "string" && data.error) ||
        (typeof data.title === "string" && data.title);

      if (message) {
        return message;
      }

      if (Array.isArray(data.details) && data.details.length > 0) {
        const detailMessage = data.details
          .map((detail: any) =>
            typeof detail === "string" ? detail : detail?.message,
          )
          .filter(Boolean)
          .join(". ");

        if (detailMessage) {
          return detailMessage;
        }
      }
    }

    if (typeof error.message === "string" && error.message.trim()) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "ÄĂ£ xáº£y ra lá»—i há»‡ thá»‘ng";
};

export default function TransferDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [transfer, setTransfer] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showChangeBranchModal, setShowChangeBranchModal] = useState(false);
  const [newBranchId, setNewBranchId] = useState("");
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [inspectItems, setInspectItems] = useState<InspectItem[]>([]);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [settlementAmount, setSettlementAmount] = useState("");

  const { data: currentUser } = useCurrentUser();
  const { hasPermission } = usePermissions();
  const warehouseId = useAuthStore((state) => state.warehouseId);

  const canApproveTransfer = hasPermission(P.TRANSFER_APPROVE);
  const canUpdateTransfer = hasPermission(P.TRANSFER_UPDATE);
  const canOperateTransfer =
    hasPermission(P.TRANSFER_CREATE) || canUpdateTransfer;
  const currentUserBranchId =
    currentUser?.branch?.id ??
    (currentUser as any)?.branchId ??
    warehouseId ??
    null;
  const transferSourceBranchId =
    transfer?.sourceBranchId ??
    transfer?.fromBranchId ??
    transfer?.sourceBranch?.id ??
    null;

  // Chỉ user thuộc chi nhánh nguồn mới được xác nhận nguồn
  const isSourceBranchUser =
    currentUserBranchId != null &&
    transferSourceBranchId != null &&
    String(currentUserBranchId) === String(transferSourceBranchId);

  useEffect(() => {
    void fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [transferData, branchData] = await Promise.all([
        transferService.getById(id as string),
        branchService.getAll(),
      ]);
      setTransfer(transferData);
      setBranches(branchData || []);
    } catch {
      toast.error("Lỗi tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleApiCall = async (
    action: () => Promise<unknown>,
    successMessage: string,
    afterSuccess?: () => void,
  ) => {
    setIsProcessing(true);
    try {
      await action();
      toast.success(successMessage);
      afterSuccess?.();
      await fetchData();
    } catch (error: unknown) {
      const errData = resolveTransferErrorMessage(error);
      if (typeof errData === "string") {
        toast.error(errData);
      } else {
        toast.error(
          String(
            errData?.detail || errData?.message || "Đã xảy ra lỗi hệ thống",
          ),
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const openInspectModal = () => {
    const items = (transfer?.items || []).map((item: any) => ({
      variantId: item.variantId,
      productName: item.productName,
      quantityRequested: Number(item.quantityRequested || 0),
      quantityReal: Number(item.quantityRequested || 0),
      quantityAccepted: Number(item.quantityRequested || 0),
      quantityRejected: 0,
      note: "",
    }));
    setInspectItems(items);
    setShowInspectModal(true);
  };

  const updateInspectItem = (
    index: number,
    field: "quantityAccepted" | "quantityRejected" | "note",
    value: string,
  ) => {
    setInspectItems((prev) => {
      const next = [...prev];
      const item = { ...next[index] };

      if (field === "note") {
        item.note = value;
      } else {
        const numericValue = Math.max(0, Number(value || 0));
        item[field] = numericValue;
        item.quantityReal =
          Number(item.quantityAccepted || 0) +
          Number(item.quantityRejected || 0);
      }

      next[index] = item;
      return next;
    });
  };

  const submitInspect = async () => {
    for (const item of inspectItems) {
      const requested = Number(item.quantityRequested || 0);
      const accepted = Number(item.quantityAccepted || 0);
      const rejected = Number(item.quantityRejected || 0);
      const real = accepted + rejected;

      if (real > requested) {
        toast.error(
          `Sản phẩm ${item.productName} có số lượng kiểm nhận vượt quá số lượng điều chuyển.`,
        );
        return;
      }
      if ((rejected > 0 || real < requested) && !item.note.trim()) {
        toast.error(
          `Vui lòng nhập ghi chú cho sản phẩm ${item.productName} khi có hàng lỗi hoặc thiếu.`,
        );
        return;
      }
    }

    const payload = inspectItems.map((item) => ({
      variantId: item.variantId,
      quantityReal:
        Number(item.quantityAccepted || 0) + Number(item.quantityRejected || 0),
      quantityAccepted: Number(item.quantityAccepted || 0),
      quantityRejected: Number(item.quantityRejected || 0),
      note: item.note.trim(),
    }));

    await handleApiCall(
      () => transferService.receive(id as string, payload),
      "Đã kiểm đếm và nhập kho thành công!",
      () => setShowInspectModal(false),
    );
  };

  const submitSettlement = async () => {
    const amount = Number(settlementAmount || 0);
    if (!amount || amount <= 0) {
      toast.error("Vui lòng nhập số tiền thanh toán hợp lệ.");
      return;
    }
    if (amount > outstandingAmount) {
      toast.error("Số tiền thanh toán vượt quá công nợ còn lại.");
      return;
    }

    await handleApiCall(
      () => transferService.settlePayment(id as string, amount),
      "Đã ghi nhận thanh toán nội bộ thành công!",
      () => {
        setShowSettlementModal(false);
        setSettlementAmount("");
      },
    );
  };

  if (loading) {
    return (
      <div className="p-10 text-center italic text-slate-400">
        Đang tải dữ liệu...
      </div>
    );
  }
  if (!transfer) {
    return (
      <div className="p-10 text-center font-bold text-rose-500">
        LỖI: PHIẾU KHÔNG TỒN TẠI
      </div>
    );
  }

  const status = String(transfer.status || "").toUpperCase();
  const isInternalSale =
    String(transfer.transferBusinessType || "").toUpperCase() ===
    "INTERNAL_SALE";
  const statusLabel = getTransferStatusLabel(
    status,
    transfer.transferBusinessType,
  );

  const canSourceConfirm =
    isInternalSale &&
    status === "PENDING" &&
    canOperateTransfer &&
    isSourceBranchUser;
  const canEdit =
    canUpdateTransfer && ["PENDING", "SOURCE_CONFIRMED"].includes(status);
  const canApprove =
    canApproveTransfer &&
    ((!isInternalSale && status === "PENDING") ||
      (isInternalSale && status === "SOURCE_CONFIRMED"));
  const canShip = canApproveTransfer && status === "APPROVED";
  const canStartInspection = canOperateTransfer && status === "SHIPPING";
  const canReceive = canOperateTransfer && status === "INSPECTING";
  const canCancel =
    (canOperateTransfer || canApproveTransfer) &&
    CANCELLABLE_STATUSES.includes(status);
  const canChangeDestination =
    (canOperateTransfer || canApproveTransfer) &&
    ["PENDING", "SOURCE_CONFIRMED"].includes(status);
  const outstandingAmount = Number(transfer.outstandingAmount || 0);
  const paidAmount = Number(transfer.paidAmount || 0);
  const canSettlePayment =
    isInternalSale &&
    status === "COMPLETED" &&
    canUpdateTransfer &&
    outstandingAmount > 0;

  const steps = [
    {
      label: "Khởi tạo",
      status: "completed",
      icon: Plus,
    },
    {
      label: isInternalSale ? "Chờ xác nhận nguồn" : "Chờ duyệt",
      status:
        status === "PENDING" || status === "SOURCE_CONFIRMED"
          ? "active"
          : DONE_STATUSES.includes(status) ||
              ["APPROVED", "SHIPPING", "INSPECTING"].includes(status)
            ? "completed"
            : "upcoming",
      icon: AlertCircle,
    },
    {
      label: "Đã duyệt",
      status:
        status === "APPROVED"
          ? "active"
          : DONE_STATUSES.includes(status) ||
              ["SHIPPING", "INSPECTING"].includes(status)
            ? "completed"
            : "upcoming",
      icon: CheckCircle2,
    },
    {
      label: "Đang vận chuyển",
      status: ["SHIPPING", "INSPECTING"].includes(status)
        ? "active"
        : DONE_STATUSES.includes(status)
          ? "completed"
          : "upcoming",
      icon: Truck,
    },
    {
      label: status === "CANCELLED" ? "Đã hủy" : "Hoàn tất",
      status:
        status === "COMPLETED" || status === "CANCELLED"
          ? "active"
          : "upcoming",
      icon: status === "CANCELLED" ? Ban : ArrowDownToLine,
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      time: transfer.createdAt,
      user: transfer.createdByName || "Hệ thống",
      action: "Khởi tạo phiếu",
      detail: transfer.createdByBranchName
        ? `Chi nhánh tạo phiếu: ${transfer.createdByBranchName}.`
        : "Phiếu điều chuyển đã được khởi tạo và chờ xử lý.",
    },
    transfer.sourceConfirmedAt
      ? {
          time: transfer.sourceConfirmedAt,
          user:
            transfer.sourceConfirmedByName ||
            transfer.fromBranchName ||
            "Chi nhánh nguồn",
          action: "Chi nhánh nguồn đồng ý điều chuyển",
          detail: `Đã xác nhận xuất từ ${transfer.fromBranchName || "chi nhánh nguồn"} sang ${transfer.toBranchName || "chi nhánh nhận"}.`,
        }
      : null,
    transfer.approvedAt
      ? {
          time: transfer.approvedAt,
          user: transfer.approvedByName || "Người duyệt",
          action: "Duyệt phiếu",
          detail: "Phiếu đã đủ thông tin và được phép điều chuyển.",
        }
      : null,
    transfer.shippedAt
      ? {
          time: transfer.shippedAt,
          user:
            transfer.shippedByName ||
            transfer.fromBranchName ||
            "Chi nhánh xuất",
          action: "Xuất kho vận chuyển",
          detail: "Hàng đã rời kho nguồn và chuyển sang trạng thái vận chuyển.",
        }
      : null,
    transfer.inspectionStartedAt
      ? {
          time: transfer.inspectionStartedAt,
          user:
            transfer.inspectionStartedByName ||
            transfer.toBranchName ||
            "Chi nhánh nhận",
          action: "Bắt đầu kiểm hàng",
          detail: "Chi nhánh nhận bắt đầu kiểm đếm và đối soát hàng thực nhận.",
        }
      : null,
    transfer.receivedAt
      ? {
          time: transfer.receivedAt,
          user:
            transfer.receivedByName ||
            transfer.toBranchName ||
            "Chi nhánh nhận",
          action: "Hoàn tất kiểm nhận",
          detail: "Đã nhập hàng đạt và chuyển hàng lỗi hoặc thiếu sang kho rủi ro.",
        }
      : null,
    transfer.settledAt
      ? {
          time: transfer.settledAt,
          user: transfer.settledByName || "Kế toán nội bộ",
          action: "Ghi nhận thanh toán",
          detail: `Đã ghi nhận thanh toán ${paidAmount.toLocaleString("vi-VN")}đ cho phiếu điều chuyển nội bộ.`,
        }
      : null,
  ]
    .filter((log): log is AuditLog => Boolean(log))
    .sort(
      (a: any, b: any) =>
        new Date(b.time).getTime() - new Date(a.time).getTime(),
    );

  const fieldLabelClass = "text-[10.5px] font-semibold text-slate-500";
  const fieldControlClass =
    "h-[38px] text-[13px] font-normal text-slate-800 shadow-none placeholder:text-slate-400";
  const selectTriggerClass =
    "h-[38px] text-[13px] font-normal text-slate-800 data-[placeholder]:text-slate-400";
  const readOnlyInputClass = cn(
    fieldControlClass,
    "border-slate-200 bg-slate-50 text-slate-600",
  );
  const sectionCardClass = "border border-slate-200 bg-white p-6 shadow-sm";
  const sectionTitleClass = "text-[11px] font-bold text-slate-800";
  const formatAuditLogTime = (value?: string) => {
    if (!value) return "---";
    const formatted = formatDate(value, "dd/MM/yyyy HH:mm:ss");
    return formatted === "N/A" ? value : formatted;
  };
  const getAuditLogActionLabel = (log: AuditLog) => {
    if (log.time === transfer.createdAt) return "Tạo phiếu";
    if (log.time === transfer.sourceConfirmedAt) return "Xác nhận nguồn";
    if (log.time === transfer.approvedAt) return "Duyệt phiếu";
    if (log.time === transfer.shippedAt) return "Xuất hàng";
    if (log.time === transfer.inspectionStartedAt) return "Bắt đầu kiểm hàng";
    if (log.time === transfer.receivedAt) return "Nhập hàng";
    if (log.time === transfer.settledAt) return "Ghi nhận thanh toán";
    return log.action;
  };
  const getAuditLogBranch = (log: AuditLog) => {
    if (log.time === transfer.createdAt) {
      return transfer.createdByBranchName || transfer.fromBranchName || "---";
    }
    if (log.time === transfer.sourceConfirmedAt || log.time === transfer.shippedAt) {
      return transfer.fromBranchName || "---";
    }
    if (
      log.time === transfer.inspectionStartedAt ||
      log.time === transfer.receivedAt ||
      log.time === transfer.settledAt
    ) {
      return transfer.toBranchName || transfer.fromBranchName || "---";
    }
    if (log.time === transfer.approvedAt) {
      return (
        transfer.createdByBranchName ||
        transfer.fromBranchName ||
        transfer.toBranchName ||
        "---"
      );
    }
    return "---";
  };
  const formatDateTimeLocal = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 16);
  };
  const findBranchIdByName = (name?: string) =>
    branches.find((branch) => branch.name === name)?.id;
  const sourceBranchValue = String(
    transfer.sourceBranchId ||
      transfer.fromBranchId ||
      findBranchIdByName(transfer.fromBranchName) ||
      "",
  );
  const destinationBranchValue = String(
    transfer.destinationBranchId ||
      transfer.toBranchId ||
      transfer.destBranchId ||
      findBranchIdByName(transfer.toBranchName) ||
      "",
  );

  return (
    <div className="space-y-3 pb-[100px] text-slate-800">
      <div className="mt-2 mb-8 space-y-4 px-1">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8 rounded-[4px] text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <ChevronLeft size={18} />
          </Button>
          <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
            Chi tiết phiếu điều chuyển hàng hóa
          </h1>
        </div>
      </div>

      <div className="border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2">
          {steps.map((step, idx) => (
            <React.Fragment key={step.label}>
              <div className="relative z-10 flex min-w-0 flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border text-[10px] transition-colors",
                    step.status === "completed"
                      ? "border-blue-200 bg-blue-50 text-blue-600"
                      : step.status === "active"
                        ? status === "CANCELLED"
                          ? "border-rose-200 bg-rose-50 text-rose-600"
                          : "border-sky-200 bg-sky-50 text-sky-600"
                        : "border-slate-200 bg-slate-50 text-slate-300",
                  )}
                >
                  <step.icon size={15} />
                </div>
                <span
                  className={cn(
                    "text-center text-[10px] font-medium",
                    step.status === "active"
                      ? status === "CANCELLED"
                        ? "text-rose-600"
                        : "text-sky-600"
                      : "text-slate-500",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className="relative -mt-5 h-px flex-1 bg-slate-200">
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 transition-all duration-500",
                      steps[idx].status === "completed"
                        ? "w-full bg-blue-300"
                        : "w-0 bg-transparent",
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="space-y-5 px-1">
        <div className={sectionCardClass}>
          <div className="border-b border-slate-200 pb-3">
            <span className={sectionTitleClass}>
              1. Thông tin lệnh điều chuyển hàng hóa
            </span>
          </div>

          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>
                  Loại nghiệp vụ điều chuyển *
                </Label>
                <Select value={transfer.transferBusinessType || "STOCK_TRANSFER"} disabled>
                  <SelectTrigger className={cn(selectTriggerClass, "border-slate-200 bg-slate-50")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STOCK_TRANSFER">
                      Điều chuyển kho thuần
                    </SelectItem>
                    <SelectItem value="INTERNAL_SALE">
                      Bán nội bộ (có hạch toán)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>Chi nhánh xuất hàng *</Label>
                <Select value={sourceBranchValue || undefined} disabled>
                  <SelectTrigger className={cn(selectTriggerClass, "border-slate-200 bg-slate-50")}>
                    <SelectValue placeholder={transfer.fromBranchName || "---"} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={String(branch.id)}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>Chi nhánh nhận hàng *</Label>
                <div className="flex gap-2">
                  <Select value={destinationBranchValue || undefined} disabled>
                    <SelectTrigger className={cn(selectTriggerClass, "border-slate-200 bg-slate-50")}>
                      <SelectValue placeholder={transfer.toBranchName || "---"} />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={String(branch.id)}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {canChangeDestination && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowChangeBranchModal(true)}
                      className="h-[38px] shrink-0 rounded-[4px] border-slate-200 px-3 text-[12px] text-slate-500"
                      title="Thay đổi chi nhánh nhận"
                    >
                      <Edit size={13} />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>
                  Lý do điều chuyển / Diễn giải *
                </Label>
                <Input
                  value={transfer.description || ""}
                  readOnly
                  className={readOnlyInputClass}
                  placeholder="Nhập lý do điều chuyển..."
                />
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>Mã phiếu hệ thống</Label>
                <Input
                  value={transfer.transferCode || transfer.code || ""}
                  readOnly
                  className={readOnlyInputClass}
                />
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>Ngày điều chuyển (24H) *</Label>
                <Input
                  type="datetime-local"
                  value={formatDateTimeLocal(transfer.transferDate || transfer.deadline || transfer.createdAt)}
                  readOnly
                  className={readOnlyInputClass}
                />
              </div>


              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>Tham chiếu chứng từ *</Label>
                <Input
                  value={transfer.referenceCode || ""}
                  readOnly
                  className={readOnlyInputClass}
                />
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>Người vận chuyển</Label>
                <Input
                  value={transfer.transporter || ""}
                  readOnly
                  className={readOnlyInputClass}
                />
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>Phương tiện</Label>
                <Input
                  value={transfer.vehicle || ""}
                  readOnly
                  className={readOnlyInputClass}
                />
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>Lệnh điều phối</Label>
                <Input
                  value={transfer.dispatchOrder || ""}
                  readOnly
                  className={readOnlyInputClass}
                />
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className={fieldLabelClass}>Trạng thái phiếu</Label>
                <Input
                  value={statusLabel}
                  readOnly
                  className={readOnlyInputClass}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={sectionCardClass}>
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <span className={sectionTitleClass}>2. Nhật ký xử lý</span>
          </div>
          <div className="mt-4 space-y-1.5">
            {auditLogs.map((log, idx) => (
              <p
                key={`${log.action}-${idx}`}
                className="border-b border-slate-100 py-2 text-[12px] text-slate-700 last:border-b-0"
              >
                {formatAuditLogTime(log.time)} - {log.user} - {getAuditLogActionLabel(log)} -{" "}
                {getAuditLogBranch(log)}
              </p>
            ))}
          </div>
        </div>

        <div className={sectionCardClass}>
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <span className={sectionTitleClass}>3. Danh sách vật tư điều chuyển</span>
            <span className="text-[11px] font-semibold text-slate-500">
              Tổng số lượng: {transfer.totalQuantity || 0}
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#ccc] bg-[#f0f0f0]">
                  <th className="w-[52px] px-3 py-3 text-[10px] font-semibold text-[#1f1f1f]">
                    STT
                  </th>
                  <th className="px-3 py-3 text-[10px] font-semibold text-[#1f1f1f]">
                    Sản phẩm / SKU
                  </th>
                  <th className="w-[96px] px-3 py-3 text-right text-[10px] font-semibold text-[#1f1f1f]">
                    Yêu cầu
                  </th>
                  <th className="w-[96px] px-3 py-3 text-right text-[10px] font-semibold text-[#1f1f1f]">
                    Thực nhận
                  </th>
                  <th className="w-[96px] px-3 py-3 text-right text-[10px] font-semibold text-[#1f1f1f]">
                    Đạt
                  </th>
                  <th className="w-[96px] px-3 py-3 text-right text-[10px] font-semibold text-[#1f1f1f]">
                    Lỗi/thiếu
                  </th>
                  {isInternalSale && (
                    <th className="w-[130px] px-3 py-3 text-right text-[10px] font-semibold text-[#1f1f1f]">
                      Đơn giá
                    </th>
                  )}
                  <th className="w-[180px] px-3 py-3 text-[10px] font-semibold text-[#1f1f1f]">
                    Ghi chú
                  </th>
                </tr>
              </thead>
              <tbody>
                {(transfer.items || []).length > 0 ? (
                  (transfer.items || []).map((item: any, index: number) => (
                    <tr
                      key={item.variantId || item.sku || index}
                      className="border-b border-[#eee] transition-colors hover:bg-[#f0f8ff]"
                    >
                      <td className="px-3 py-3 text-[11px] font-medium text-slate-500">
                        {index + 1}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-[11px] font-semibold text-slate-800">
                          {item.productName}
                        </div>
                        <div className="mt-0.5 text-[10px] text-slate-400">
                          {item.sku || item.variantSku || "---"}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Input
                          value={item.quantityRequested || 0}
                          readOnly
                          className="ml-auto h-8 w-20 rounded-[4px] border-slate-200 bg-slate-50 text-right text-[12px] shadow-none"
                        />
                      </td>
                      <td className="px-3 py-3 text-right text-[11px] font-semibold text-blue-600">
                        {item.quantityReal || 0}
                      </td>
                      <td className="px-3 py-3 text-right text-[11px] font-semibold text-blue-600">
                        {item.quantityAccepted || 0}
                      </td>
                      <td className="px-3 py-3 text-right text-[11px] font-semibold text-rose-600">
                        {item.quantityRejected || 0}
                      </td>
                      {isInternalSale && (
                        <td className="px-3 py-3 text-right text-[11px] font-semibold text-slate-600">
                          {Number(item.unitTransferPrice || 0).toLocaleString("vi-VN")}đ
                        </td>
                      )}
                      <td className="px-3 py-3 text-[11px] text-slate-500">
                        {item.itemNote || item.note || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={isInternalSale ? 8 : 7}
                      className="h-[160px] text-center text-[12px] font-medium text-slate-400"
                    >
                      Không có vật tư điều chuyển.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {isInternalSale && (
          <div className={sectionCardClass}>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className={sectionTitleClass}>4. Thanh toán nội bộ</span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="text-[10px] font-semibold text-slate-400">Tổng giá trị hàng đạt</p>
                <p className="mt-2 text-[16px] font-semibold text-slate-900">
                  {Number(transfer.transferAmount || 0).toLocaleString("vi-VN")}đ
                </p>
              </div>
              <div className="rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="text-[10px] font-semibold text-slate-400">Đã thanh toán</p>
                <p className="mt-2 text-[16px] font-semibold text-emerald-700">
                  {paidAmount.toLocaleString("vi-VN")}đ
                </p>
              </div>
              <div className="rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="text-[10px] font-semibold text-slate-400">Còn phải thanh toán</p>
                <p className="mt-2 text-[16px] font-semibold text-amber-700">
                  {outstandingAmount.toLocaleString("vi-VN")}đ
                </p>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              Biên lợi nhuận tối thiểu áp dụng:{" "}
              <span className="font-semibold text-slate-700">
                Nhap tay theo thoa thuan
              </span>
            </p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-[999] border-t border-slate-200 bg-white px-4 py-3 lg:left-[260px]">
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-10 min-w-[110px] rounded-md border-slate-300 bg-white px-6 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
          >
            <Printer size={15} className="mr-2" />
            In phiếu
          </Button>
          {canEdit && (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/transfers/new?editId=${id}`)}
              className="h-10 min-w-[130px] rounded-md border-slate-300 bg-white px-6 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
            >
              <Edit size={15} className="mr-2" />
              Sửa phiếu
            </Button>
          )}
          {canSourceConfirm && (
            <Button
              onClick={() =>
                void handleApiCall(
                  () => transferService.sourceConfirm(id as string),
                  "Đã xác nhận chi nhánh nguồn sẵn sàng điều chuyển.",
                )
              }
              disabled={isProcessing}
              className="h-10 min-w-[150px] rounded-md bg-amber-600 px-6 text-[13px] font-semibold text-white hover:bg-amber-700"
            >
              Xác nhận nguồn
            </Button>
          )}
          {canApprove && (
            <Button
              onClick={() =>
                void handleApiCall(
                  () => transferService.approve(id as string),
                  "Đã duyệt phiếu điều chuyển.",
                )
              }
              disabled={isProcessing}
              className="h-10 min-w-[130px] rounded-md bg-blue-600 px-6 text-[13px] font-semibold text-white hover:bg-blue-700"
            >
              Duyệt phiếu
            </Button>
          )}
          {canShip && (
            <Button
              onClick={() =>
                void handleApiCall(
                  () => transferService.ship(id as string),
                  "Đã xuất kho và chuyển sang trạng thái vận chuyển.",
                )
              }
              disabled={isProcessing}
              className="h-10 min-w-[130px] rounded-md bg-indigo-600 px-6 text-[13px] font-semibold text-white hover:bg-indigo-700"
            >
              Xuất kho
            </Button>
          )}
          {canStartInspection && (
            <Button
              onClick={() =>
                void handleApiCall(
                  () => transferService.startInspection(id as string),
                  "Đã bắt đầu kiểm hàng.",
                )
              }
              disabled={isProcessing}
              className="h-10 min-w-[160px] rounded-md bg-amber-500 px-6 text-[13px] font-semibold text-white hover:bg-amber-600"
            >
              Bắt đầu kiểm hàng
            </Button>
          )}
          {canReceive && (
            <>
              <Button
                onClick={() =>
                  void handleApiCall(
                    () =>
                      transferService.receive(
                        id as string,
                        (transfer.items || []).map((item: any) => ({
                          variantId: item.variantId,
                          quantityReal: Number(item.quantityRequested || 0),
                          quantityAccepted: Number(item.quantityRequested || 0),
                          quantityRejected: 0,
                          note: "",
                        })),
                      ),
                    "Đã hoàn tất kiểm hàng và nhập kho nhận.",
                  )
                }
                disabled={isProcessing}
                className="h-10 min-w-[120px] rounded-md bg-blue-600 px-6 text-[13px] font-semibold text-white hover:bg-blue-700"
              >
                <CheckSquare size={15} className="mr-2" />
                Nhận đủ
              </Button>
              <Button
                onClick={openInspectModal}
                disabled={isProcessing}
                className="h-10 min-w-[160px] rounded-md bg-orange-500 px-6 text-[13px] font-semibold text-white hover:bg-orange-600"
              >
                <Package size={15} className="mr-2" />
                Kiểm đếm chi tiết
              </Button>
            </>
          )}
          {canCancel && (
            <Button
              onClick={() =>
                void handleApiCall(
                  () => transferService.cancel(id as string),
                  "Đã hủy phiếu thành công!",
                )
              }
              disabled={isProcessing}
              variant="outline"
              className="h-10 min-w-[120px] rounded-md border-rose-200 px-6 text-[13px] font-semibold text-rose-600 hover:bg-rose-50"
            >
              <Ban size={15} className="mr-2" />
              Hủy phiếu
            </Button>
          )}
          {canSettlePayment && (
            <Button
              type="button"
              onClick={() => setShowSettlementModal(true)}
              disabled={isProcessing}
              className="h-10 min-w-[170px] rounded-md bg-emerald-600 px-6 text-[13px] font-semibold text-white hover:bg-emerald-700"
            >
              <DollarSign size={15} className="mr-2" />
              Ghi nhận thanh toán
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="h-10 min-w-[110px] rounded-md border-slate-300 bg-white px-6 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
          >
            Đóng
          </Button>
        </div>
      </div>

      {showChangeBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md space-y-4 rounded-none bg-white p-6 shadow-2xl">
            <h3 className="border-b pb-2 text-[14px] font-black uppercase">
              Thay đổi chi nhánh nhận
            </h3>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-500">
                Chọn chi nhánh mới:
              </Label>
              <Select
                value={newBranchId || undefined}
                onValueChange={setNewBranchId}
              >
                <SelectTrigger className="rounded-none border-slate-300 font-bold">
                  <SelectValue placeholder="Chọn chi nhánh..." />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {branches.map((branch) => (
                    <SelectItem
                      key={branch.id}
                      value={String(branch.id)}
                      disabled={branch.name === transfer.fromBranchName}
                    >
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowChangeBranchModal(false)}
                className="rounded-none text-[11px] font-bold"
              >
                HỦY
              </Button>
              <Button
                onClick={() =>
                  void handleApiCall(
                    () =>
                      transferService.changeDestination(
                        id as string,
                        newBranchId,
                      ),
                    "Đã đổi chi nhánh nhận thành công!",
                    () => setShowChangeBranchModal(false),
                  )
                }
                disabled={isProcessing || !newBranchId}
                className="rounded-none bg-blue-600 text-[11px] font-black text-white hover:bg-blue-700"
              >
                XÁC NHẬN ĐỔI
              </Button>
            </div>
          </div>
        </div>
      )}

      {showSettlementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md space-y-4 rounded-none bg-white p-6 shadow-2xl">
            <h3 className="border-b pb-2 text-[14px] font-black uppercase">
              Ghi nhận thanh toán nội bộ
            </h3>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-500">
                Số tiền thanh toán:
              </Label>
              <Input
                type="number"
                min={0}
                value={settlementAmount}
                onChange={(e) => setSettlementAmount(e.target.value)}
                placeholder={`Tối đa ${outstandingAmount.toLocaleString("vi-VN")}đ`}
                className="rounded-none border-slate-300"
              />
              <p className="text-[11px] text-slate-400">
                Còn phải thanh toán: {outstandingAmount.toLocaleString("vi-VN")}đ
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowSettlementModal(false)}
                className="rounded-none text-[11px] font-bold"
              >
                HỦY
              </Button>
              <Button
                onClick={() => void submitSettlement()}
                disabled={isProcessing}
                className="rounded-none bg-emerald-600 text-[11px] font-black text-white hover:bg-emerald-700"
              >
                XÁC NHẬN THANH TOÁN
              </Button>
            </div>
          </div>
        </div>
      )}

      {showInspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-none bg-white p-6 shadow-2xl">
            <h3 className="mb-4 flex items-center gap-2 border-b pb-3 text-[15px] font-black uppercase">
              <Package size={18} className="text-amber-600" />
              Phiếu kiểm đếm và nhận hàng
            </h3>
            <div className="mb-4 rounded-none border border-blue-100 bg-blue-50 p-3 text-[12px] text-blue-800">
              Kho nhận phải nhập riêng số lượng đạt và số lượng lỗi/thiếu. Hệ
              thống sẽ tự tính tổng thực nhận cho từng dòng.
            </div>
            <div className="flex-1 overflow-y-auto border border-slate-200">
              <table className="w-full text-left text-[12px]">
                <thead className="sticky top-0 border-b bg-slate-50">
                  <tr className="text-[10px] uppercase text-slate-500">
                    <th className="p-3">Sản phẩm</th>
                    <th className="p-3 text-center">Yêu cầu</th>
                    <th className="p-3 text-center bg-blue-50 text-blue-700">
                      Đạt
                    </th>
                    <th className="p-3 text-center bg-rose-50 text-rose-700">
                      Lỗi/thiếu
                    </th>
                    <th className="p-3 text-center bg-blue-50 text-blue-700">
                      Thực nhận
                    </th>
                    <th className="p-3">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {inspectItems.map((item, idx) => (
                    <tr
                      key={item.variantId}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
                      <td className="p-3 font-bold text-slate-700">
                        {item.productName}
                      </td>
                      <td className="p-3 text-center font-black">
                        {item.quantityRequested}
                      </td>
                      <td className="bg-blue-50/30 p-3">
                        <Input
                          type="number"
                          min={0}
                          value={item.quantityAccepted}
                          onChange={(e) =>
                            updateInspectItem(
                              idx,
                              "quantityAccepted",
                              e.target.value,
                            )
                          }
                          className="mx-auto h-8 w-24 rounded-none border-blue-300 text-center font-black text-blue-600"
                        />
                      </td>
                      <td className="bg-rose-50/30 p-3">
                        <Input
                          type="number"
                          min={0}
                          value={item.quantityRejected}
                          onChange={(e) =>
                            updateInspectItem(
                              idx,
                              "quantityRejected",
                              e.target.value,
                            )
                          }
                          className="mx-auto h-8 w-24 rounded-none border-rose-300 text-center font-black text-rose-600"
                        />
                      </td>
                      <td className="bg-blue-50/30 p-3 text-center font-black text-blue-600">
                        {item.quantityReal}
                      </td>
                      <td className="p-3">
                        <Input
                          value={item.note}
                          onChange={(e) =>
                            updateInspectItem(idx, "note", e.target.value)
                          }
                          placeholder="Lý do thiếu hoặc hư hỏng..."
                          className="h-8 rounded-none border-slate-200 text-[11px]"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-auto flex justify-end gap-3 pt-5">
              <Button
                variant="outline"
                onClick={() => setShowInspectModal(false)}
                className="rounded-none text-[12px] font-bold"
              >
                HỦY BỎ
              </Button>
              <Button
                onClick={() => void submitInspect()}
                disabled={isProcessing}
                className="rounded-none bg-blue-600 text-[12px] font-black text-white hover:bg-blue-700"
              >
                <CheckSquare size={16} className="mr-2" />
                LƯU KIỂM ĐẾM VÀ NHẬP KHO
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
