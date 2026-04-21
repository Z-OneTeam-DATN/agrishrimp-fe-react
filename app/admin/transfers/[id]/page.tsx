"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowRightLeft,
  Ban,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  Edit,
  FileText,
  Package,
  Plus,
  Printer,
  Truck,
  X,
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
import { P } from "@/lib/permissions";
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

const DONE_STATUSES = ["COMPLETED"];
const CANCELLABLE_STATUSES = ["PENDING", "SOURCE_CONFIRMED", "APPROVED"];

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

  const { data: currentUser } = useCurrentUser();
  const { hasPermission } = usePermissions();

  const isAdmin =
    currentUser?.role?.id === 1 ||
    currentUser?.role?.displayName === "Quản trị viên";
  const canApproveTransfer = isAdmin || hasPermission(P.TRANSFER_APPROVE);
  const canOperateTransfer = isAdmin || hasPermission(P.TRANSFER_CREATE);

  // Chỉ user thuộc chi nhánh nguồn mới được xác nhận nguồn
  const isSourceBranchUser =
    currentUser?.branch?.id === transfer?.sourceBranchId;

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
    } catch (error: any) {
      const errData = error?.response?.data;
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

  const canSourceConfirm =
    isInternalSale &&
    status === "PENDING" &&
    canOperateTransfer &&
    !canApproveTransfer &&
    isSourceBranchUser;
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
    ["PENDING", "SOURCE_CONFIRMED", "APPROVED"].includes(status);

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

  const auditLogs = (() => {
    const logs = [
      {
        time: new Date(transfer.createdAt || Date.now()).toLocaleString(
          "vi-VN",
        ),
        user: "Hệ thống",
        action: "Khởi tạo phiếu",
        detail: "Phiếu điều chuyển được tạo và chờ xử lý.",
      },
    ];

    if (status === "SOURCE_CONFIRMED") {
      logs.unshift({
        time: new Date().toLocaleString("vi-VN"),
        user: "Chi nhánh nguồn",
        action: "Xác nhận nguồn",
        detail: "Đã xác nhận có hàng để chờ Admin duyệt.",
      });
    }
    if (["APPROVED", "SHIPPING", "INSPECTING", "COMPLETED"].includes(status)) {
      logs.unshift({
        time: new Date().toLocaleString("vi-VN"),
        user: "Admin",
        action: "Duyệt phiếu",
        detail: "Đã reserve hàng ở kho nguồn.",
      });
    }
    if (["SHIPPING", "INSPECTING", "COMPLETED"].includes(status)) {
      logs.unshift({
        time: new Date().toLocaleString("vi-VN"),
        user: "Kho nguồn",
        action: "Xuất kho vận chuyển",
        detail: "Hàng đã rời kho nguồn và đang trên đường giao tới kho nhận.",
      });
    }
    if (status === "INSPECTING") {
      logs.unshift({
        time: new Date().toLocaleString("vi-VN"),
        user: "Kho nhận",
        action: "Bắt đầu kiểm hàng",
        detail: "Kho nhận đang nhập số lượng đạt và số lượng lỗi/thiếu.",
      });
    }
    if (status === "COMPLETED") {
      logs.unshift({
        time: new Date().toLocaleString("vi-VN"),
        user: "Kho nhận",
        action: "Hoàn tất QC",
        detail:
          "Đã cộng kho nhận theo số lượng đạt và ghi nhận phần lỗi/thiếu.",
      });
    }
    if (status === "CANCELLED") {
      logs.unshift({
        time: new Date().toLocaleString("vi-VN"),
        user: "Hệ thống",
        action: "Hủy phiếu",
        detail: "Phiếu đã bị hủy trước khi hoàn tất điều chuyển.",
      });
    }

    return logs;
  })();

  return (
    <div className="min-h-screen space-y-4 bg-slate-50/30 p-4 pb-20">
      <div className="mb-2 flex items-center gap-4 px-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-8 w-8 text-slate-400"
        >
          <ChevronLeft size={20} />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-[18px] font-black uppercase tracking-tight text-[#1f1f1f]">
            Chi tiết phiếu điều chuyển
          </h1>
          <div className="mt-1 flex items-center gap-6 opacity-70">
            <div className="flex items-center space-x-2">
              <div
                className={cn(
                  "h-3.5 w-3.5 rounded-full border-[4px]",
                  !isInternalSale
                    ? "border-emerald-500 bg-white"
                    : "border-slate-300",
                )}
              />
              <Label
                className={cn(
                  "text-[11px] font-bold uppercase tracking-wider",
                  !isInternalSale ? "text-blue-600" : "text-slate-400",
                )}
              >
                Kho tổng → chi nhánh
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className={cn(
                  "h-3.5 w-3.5 rounded-full border-[4px]",
                  isInternalSale
                    ? "border-emerald-500 bg-white"
                    : "border-slate-300",
                )}
              />
              <Label
                className={cn(
                  "text-[11px] font-bold uppercase tracking-wider",
                  isInternalSale ? "text-blue-600" : "text-slate-400",
                )}
              >
                Chi nhánh ↔ chi nhánh
              </Label>
            </div>
          </div>
        </div>

        <div className="ms-auto flex items-center gap-2">
          <Button
            variant="outline"
            className="h-8 rounded-none border-slate-300 px-3 text-[11px] font-bold text-slate-600"
          >
            <Printer size={14} className="mr-1.5" />
            IN PHIẾU
          </Button>
          {canSourceConfirm && (
            <Button
              onClick={() =>
                void handleApiCall(
                  () => transferService.sourceConfirm(id as string),
                  "Đã xác nhận chi nhánh nguồn sẵn sàng điều chuyển.",
                )
              }
              disabled={isProcessing}
              className="rounded-none bg-amber-600 hover:bg-amber-700"
            >
              XÁC NHẬN NGUỒN
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
              className="rounded-none bg-blue-600 hover:bg-blue-700"
            >
              DUYỆT PHIẾU
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
              className="rounded-none bg-indigo-600 hover:bg-indigo-700"
            >
              XUẤT KHO
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
              className="rounded-none bg-amber-500 hover:bg-amber-600"
            >
              BẮT ĐẦU KIỂM HÀNG
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
                className="rounded-none bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckSquare size={14} className="mr-1.5" />
                NHẬN ĐỦ
              </Button>
              <Button
                onClick={openInspectModal}
                disabled={isProcessing}
                className="rounded-none bg-orange-500 hover:bg-orange-600"
              >
                <Package size={14} className="mr-1.5" />
                KIỂM ĐẾM CHI TIẾT
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
              className="rounded-none border-rose-200 text-rose-600 hover:bg-rose-50"
            >
              <Ban size={14} className="mr-1.5" />
              HỦY PHIẾU
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8"
          >
            <X size={20} />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between border border-[#dcdcdc] bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2 text-[14px] font-black uppercase tracking-tighter text-slate-800">
          Mã phiếu:{" "}
          <span className="text-blue-600">
            {transfer.transferCode || "---"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 border border-slate-200 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600">
            <ArrowDownToLine size={14} />
            Trạng thái: {status}
          </div>
        </div>
      </div>

      <div className="rounded-none border border-[#dcdcdc] bg-white p-6 shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          {steps.map((step, idx) => (
            <React.Fragment key={step.label}>
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                    step.status === "completed"
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : step.status === "active"
                        ? status === "CANCELLED"
                          ? "border-rose-500 bg-rose-500 text-white"
                          : "border-blue-600 bg-blue-600 text-white shadow-lg"
                        : "border-slate-200 bg-slate-50 text-slate-300",
                  )}
                >
                  <step.icon size={20} />
                </div>
                <span
                  className={cn(
                    "text-center text-[10px] font-black uppercase tracking-tighter",
                    step.status === "active"
                      ? status === "CANCELLED"
                        ? "text-rose-600"
                        : "text-blue-600"
                      : "text-slate-400",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className="relative mx-2 -mt-6 h-[3px] flex-1 bg-slate-100">
                  <div
                    className={cn(
                      "absolute inset-0 transition-all duration-500",
                      steps[idx].status === "completed"
                        ? "bg-emerald-500"
                        : "bg-transparent",
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">
          <div className="grid grid-cols-1 gap-6 rounded-none border border-[#dcdcdc] bg-white p-6 shadow-sm md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-blue-50 font-black text-blue-600">
                  XUẤT
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Kho nguồn
                  </p>
                  <p className="text-[15px] font-black uppercase text-slate-700">
                    {transfer.fromBranchName || "---"}
                  </p>
                </div>
              </div>
              <div className="rounded-none border border-slate-100 bg-slate-50 p-4">
                <p className="flex justify-between border-b border-slate-100 pb-2 text-[13px]">
                  <span className="text-slate-400">Ngày tạo:</span>
                  <span className="font-bold">
                    {transfer.createdAt
                      ? new Date(transfer.createdAt).toLocaleString("vi-VN")
                      : "---"}
                  </span>
                </p>
                <p className="mt-2 flex justify-between text-[13px]">
                  <span className="text-slate-400">Tổng số lượng:</span>
                  <span className="font-black text-blue-600">
                    {transfer.totalQuantity || 0}
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 font-black text-emerald-600">
                  NHẬN
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Kho nhận
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-black uppercase text-slate-700">
                      {transfer.toBranchName || "---"}
                    </p>
                    {canChangeDestination && (
                      <button
                        onClick={() => setShowChangeBranchModal(true)}
                        className="text-blue-500 transition-colors hover:text-blue-700"
                        title="Thay đổi chi nhánh nhận"
                      >
                        <Edit size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="rounded-none border border-slate-100 bg-slate-50 p-4">
                <p className="flex justify-between border-b border-slate-100 pb-2 text-[13px]">
                  <span className="text-slate-400">Loại điều chuyển:</span>
                  <span className="font-bold">
                    {isInternalSale
                      ? "Nội bộ giữa chi nhánh"
                      : "Kho tổng cấp phát"}
                  </span>
                </p>
                <p className="mt-2 flex justify-between text-[13px]">
                  <span className="text-slate-400">Mã tham chiếu:</span>
                  <span className="font-mono font-bold">
                    {transfer.referenceCode || "---"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-none border border-[#dcdcdc] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 border-b pb-3 text-[11px] font-black uppercase tracking-widest text-slate-700">
              <ArrowRightLeft size={15} />
              Danh sách sản phẩm điều chuyển
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="border-b bg-slate-50">
                  <tr className="text-[10px] uppercase text-slate-500">
                    <th className="p-3">Sản phẩm</th>
                    <th className="p-3 text-right">Yêu cầu</th>
                    <th className="p-3 text-right">Thực nhận</th>
                    <th className="p-3 text-right">Đạt</th>
                    <th className="p-3 text-right">Lỗi/thiếu</th>
                  </tr>
                </thead>
                <tbody>
                  {(transfer.items || []).map((item: any) => (
                    <tr
                      key={item.variantId}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
                      <td className="p-3">
                        <div className="font-bold text-slate-700">
                          {item.productName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.sku || item.variantSku || "---"}
                        </div>
                      </td>
                      <td className="p-3 text-right font-black text-slate-700">
                        {item.quantityRequested || 0}
                      </td>
                      <td className="p-3 text-right font-black text-blue-600">
                        {item.quantityReal || 0}
                      </td>
                      <td className="p-3 text-right font-black text-emerald-600">
                        {item.quantityAccepted || 0}
                      </td>
                      <td className="p-3 text-right font-black text-rose-600">
                        {item.quantityRejected || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-none border border-amber-100 bg-amber-50 p-5">
            <h3 className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase text-amber-600">
              <FileText size={14} />
              Diễn giải
            </h3>
            <p className="text-[13px] font-medium italic leading-relaxed text-amber-800">
              "
              {transfer.description ||
                "Không có ghi chú thêm cho phiếu điều chuyển này."}
              "
            </p>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-4">
          <div className="rounded-none border border-[#dcdcdc] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 border-b pb-3 text-[11px] font-black uppercase tracking-widest text-slate-700">
              <Package size={15} />
              Nhật ký xử lý
            </div>
            <div className="space-y-4">
              {auditLogs.map((log, idx) => (
                <div key={`${log.action}-${idx}`} className="relative pl-6">
                  <div className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <p className="text-[11px] font-black uppercase text-slate-700">
                    {log.action}
                  </p>
                  <p className="text-[11px] text-slate-500">{log.time}</p>
                  <p className="text-[12px] text-slate-600">{log.detail}</p>
                  <p className="text-[11px] italic text-slate-400">
                    {log.user}
                  </p>
                </div>
              ))}
            </div>
          </div>
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
                    <th className="p-3 text-center bg-emerald-50 text-emerald-700">
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
                      <td className="bg-emerald-50/30 p-3">
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
                          className="mx-auto h-8 w-24 rounded-none border-emerald-300 text-center font-black text-emerald-600"
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
                className="rounded-none bg-emerald-600 text-[12px] font-black text-white hover:bg-emerald-700"
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
