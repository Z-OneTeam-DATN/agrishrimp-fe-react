"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  Package,
  Phone,
  RotateCcw,
  UserRound,
  Video,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { returnService } from "@/app/services/return.service";
import {
  ReturnRequestReceiveItemPayload,
  ReturnRefundMethod,
  ReturnRequest,
} from "@/app/types/return.types";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { usePermissions } from "@/hooks/usePermissions";
import { formatDate } from "@/lib/dateUtils";
import { P } from "@/lib/permissions";
import {
  getReturnHandlingLabel,
  getReturnIssueLabel,
  getReturnRefundLabel,
  getReturnStatusMeta,
} from "@/lib/return-request";
import { resolveImageUrl } from "@/lib/resolveImageUrl";
import { formatCurrency } from "@/lib/utils";

type ActionType = "approve" | "reject" | "receive" | "refund" | null;
const BANK_TRANSFER_REFUND_METHOD: ReturnRefundMethod = "BANK_TRANSFER";
type FetchDetailOptions = {
  background?: boolean;
  showError?: boolean;
};
type ReceiveItemFormState = {
  returnRequestItemId: number;
  restockQuantity: string;
  defectiveQuantity: string;
  itemNote: string;
};

function extractErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

function buildReceiveItemFormState(
  request: ReturnRequest,
): ReceiveItemFormState[] {
  return request.items.map((item) => {
    const restockQuantity = Number(item.restockQuantity || 0);
    const defectiveQuantity = Number(item.defectiveQuantity || 0);
    const hasPersistedBreakdown =
      restockQuantity + defectiveQuantity === Number(item.quantity) &&
      Number(item.quantity) > 0;

    return {
      returnRequestItemId: item.id,
      restockQuantity: String(
        hasPersistedBreakdown ? restockQuantity : Number(item.quantity),
      ),
      defectiveQuantity: String(
        hasPersistedBreakdown ? defectiveQuantity : 0,
      ),
      itemNote: "",
    };
  });
}

const MONO_STATUS_BADGE_CLASS =
  "inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700";
const MONO_OUTLINE_BUTTON_CLASS =
  "border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-700";
const MONO_INFO_PANEL_CLASS =
  "rounded-[4px] border border-blue-100 bg-blue-50 p-4 text-[13px] leading-6 text-blue-800";

export default function ReturnOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { hasPermission } = usePermissions();
  const canViewSystemOrders = hasPermission(P.ORDER_VIEW_ALL_BRANCHES);
  const canManageReturns = hasPermission(P.ORDER_UPDATE);

  const [request, setRequest] = useState<ReturnRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionOpen, setActionOpen] = useState<ActionType>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    internalNote: "",
    rejectReason: "",
    refundAmount: "",
    refundMethod: BANK_TRANSFER_REFUND_METHOD,
    receiveItems: [] as ReceiveItemFormState[],
  });
  const [receiveItemErrors, setReceiveItemErrors] = useState<Record<number, string>>({});

  const fetchDetail = useCallback(
    async ({ background = false, showError = false }: FetchDetailOptions = {}) => {
      try {
        if (!background) {
          setError(null);
          setLoading(true);
        }

        const data = canViewSystemOrders
          ? await returnService.getAdminReturnRequestDetail(id)
          : await returnService.getBranchReturnRequestDetail(id);

        setRequest(data);
        setError(null);
      } catch (err: any) {
        const message = extractErrorMessage(
          err,
          "Không thể tải chi tiết yêu cầu trả hàng lúc này.",
        );

        if (!background) {
          setError(message);
        }

        if (showError) {
          toast.error(message);
        }
      } finally {
        if (!background) {
          setLoading(false);
        }
      }
    },
    [canViewSystemOrders, id],
  );

  useEffect(() => {
    if (!request || actionOpen !== null || submitting) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      refundAmount:
        prev.refundAmount ||
        String(Math.round(Number(request.totalRefundAmount ?? 0))),
      refundMethod: request.refundMethod ?? BANK_TRANSFER_REFUND_METHOD,
      receiveItems: buildReceiveItemFormState(request),
    }));
    setReceiveItemErrors({});
  }, [actionOpen, request, submitting]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    if (actionOpen !== null || submitting) {
      return;
    }

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void fetchDetail({ background: true });
      }
    };

    const refreshNow = () => {
      void fetchDetail({ background: true });
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchDetail({ background: true });
      }
    }, 15000);

    window.addEventListener("focus", refreshNow);
    window.addEventListener("pageshow", refreshNow);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshNow);
      window.removeEventListener("pageshow", refreshNow);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [actionOpen, fetchDetail, submitting]);

  const statusMeta = useMemo(
    () => (request ? getReturnStatusMeta(request.status) : null),
    [request],
  );
  const imageEvidences = request?.evidences.filter((item) => item.mediaType === "IMAGE") ?? [];
  const videoEvidences = request?.evidences.filter((item) => item.mediaType === "VIDEO") ?? [];

  const canApprove = canManageReturns && request?.status === "PENDING";
  const canReject = canManageReturns && request?.status === "PENDING";
  const canReceive =
    canManageReturns &&
    request?.status === "APPROVED" &&
    request.requiresPhysicalReturn;
  const canRefund =
    canManageReturns &&
    !!request &&
    ((request.status === "APPROVED" && !request.requiresPhysicalReturn) ||
      request.status === "RECEIVED");
  const receiveSummary = useMemo(() => {
    if (!request) {
      return { restock: 0, defective: 0 };
    }

    return request.items.reduce(
      (totals, item) => ({
        restock: totals.restock + Number(item.restockQuantity || 0),
        defective: totals.defective + Number(item.defectiveQuantity || 0),
      }),
      { restock: 0, defective: 0 },
    );
  }, [request]);
  const showReceiveInventorySection =
    !!request && request.requiresPhysicalReturn && (canReceive || !!request.receivedAt);

  const updateReceiveItem = useCallback(
    (
      returnRequestItemId: number,
      field: keyof ReceiveItemFormState,
      value: string,
    ) => {
      setForm((prev) => ({
        ...prev,
        receiveItems: prev.receiveItems.map((item) =>
          item.returnRequestItemId === returnRequestItemId
            ? { ...item, [field]: value }
            : item,
        ),
      }));
      setReceiveItemErrors((prev) => {
        if (!prev[returnRequestItemId]) {
          return prev;
        }
        const next = { ...prev };
        delete next[returnRequestItemId];
        return next;
      });
    },
    [],
  );

  const validateReceiveItems = useCallback(() => {
    if (!request) {
      return null;
    }

    const errors: Record<number, string> = {};
    const payloadItems: ReturnRequestReceiveItemPayload[] = [];

    for (const item of request.items) {
      const row = form.receiveItems.find(
        (entry) => entry.returnRequestItemId === item.id,
      );
      if (!row) {
        errors[item.id] = "Thiếu cấu hình nhập kho cho sản phẩm này.";
        continue;
      }

      const restockQuantity = Number(row.restockQuantity || 0);
      const defectiveQuantity = Number(row.defectiveQuantity || 0);

      if (
        !Number.isInteger(restockQuantity) ||
        !Number.isInteger(defectiveQuantity) ||
        restockQuantity < 0 ||
        defectiveQuantity < 0
      ) {
        errors[item.id] =
          "Số lượng nhập lại và tồn lỗi phải là số nguyên không âm.";
        continue;
      }

      if (restockQuantity + defectiveQuantity !== Number(item.quantity)) {
        errors[item.id] = `Tổng nhập lại và tồn lỗi phải bằng ${item.quantity}.`;
        continue;
      }

      payloadItems.push({
        returnRequestItemId: item.id,
        restockQuantity,
        defectiveQuantity,
        itemNote: row.itemNote.trim() || undefined,
      });
    }

    setReceiveItemErrors(errors);
    if (Object.keys(errors).length > 0) {
      return null;
    }

    return payloadItems;
  }, [form.receiveItems, request]);

  const handleConfirmAction = async () => {
    if (!request || !actionOpen) return;

    if (actionOpen === "reject" && !form.rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối.");
      return;
    }

    if (actionOpen === "refund") {
      const refundAmount = Number(form.refundAmount);
      if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
        toast.error("Vui lòng nhập số tiền hoàn hợp lệ.");
        return;
      }
    }

    const receivePayload =
      actionOpen === "receive" ? validateReceiveItems() : null;
    if (actionOpen === "receive" && !receivePayload) {
      toast.error("Vui lòng kiểm tra lại số lượng nhập kho của từng sản phẩm.");
      return;
    }

    try {
      setSubmitting(true);

      let updatedRequest: ReturnRequest;

      if (actionOpen === "approve") {
        updatedRequest = canViewSystemOrders
          ? await returnService.approveAdminReturnRequest(request.id, {
              internalNote: form.internalNote.trim() || undefined,
            })
          : await returnService.approveBranchReturnRequest(request.id, {
              internalNote: form.internalNote.trim() || undefined,
            });
      } else if (actionOpen === "reject") {
        updatedRequest = canViewSystemOrders
          ? await returnService.rejectAdminReturnRequest(request.id, {
              rejectReason: form.rejectReason.trim(),
              internalNote: form.internalNote.trim() || undefined,
            })
          : await returnService.rejectBranchReturnRequest(request.id, {
              rejectReason: form.rejectReason.trim(),
              internalNote: form.internalNote.trim() || undefined,
            });
      } else if (actionOpen === "receive") {
        updatedRequest = canViewSystemOrders
          ? await returnService.receiveAdminReturnRequest(request.id, {
              internalNote: form.internalNote.trim() || undefined,
              items: receivePayload!,
            })
          : await returnService.receiveBranchReturnRequest(request.id, {
              internalNote: form.internalNote.trim() || undefined,
              items: receivePayload!,
            });
      } else {
        updatedRequest = canViewSystemOrders
          ? await returnService.refundAdminReturnRequest(request.id, {
              refundAmount: Number(form.refundAmount),
              refundMethod: form.refundMethod,
              internalNote: form.internalNote.trim() || undefined,
            })
          : await returnService.refundBranchReturnRequest(request.id, {
              refundAmount: Number(form.refundAmount),
              refundMethod: form.refundMethod,
              internalNote: form.internalNote.trim() || undefined,
            });
      }

      setRequest(updatedRequest);
      setActionOpen(null);
      setForm((prev) => ({
        ...prev,
        internalNote: "",
        rejectReason: "",
        refundAmount: String(Math.round(Number(updatedRequest.totalRefundAmount ?? 0))),
        refundMethod: updatedRequest.refundMethod ?? BANK_TRANSFER_REFUND_METHOD,
        receiveItems: buildReceiveItemFormState(updatedRequest),
      }));
      setReceiveItemErrors({});

      toast.success(
        actionOpen === "approve"
          ? "Đã duyệt yêu cầu trả hàng."
          : actionOpen === "reject"
            ? "Đã từ chối yêu cầu trả hàng."
            : actionOpen === "receive"
              ? "Đã xác nhận nhận lại hàng trả."
              : "Đã cập nhật hoàn tiền cho yêu cầu.",
      );
    } catch (err: any) {
      toast.error(
        extractErrorMessage(
          err,
          "Không thể cập nhật yêu cầu trả hàng lúc này.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !request || !statusMeta) {
    return (
      <div className="rounded-[4px] border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 text-blue-600" />
          <div className="space-y-3">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Không thể tải chi tiết yêu cầu
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {error ?? "Yêu cầu trả hàng này không tồn tại hoặc đã bị thay đổi."}
              </p>
            </div>
            <Link
              href="/admin/orders/return"
              className="inline-flex h-10 items-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5 text-slate-800">
        <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Link
                href="/admin/orders/return"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
              >
                <ArrowLeft size={16} />
                Quay lại danh sách trả hàng
              </Link>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-[22px] font-bold uppercase tracking-tight text-slate-900">
                    {request.code}
                  </h1>
                  <span
                    className={MONO_STATUS_BADGE_CLASS}
                  >
                    {statusMeta.label}
                  </span>
                  {!request.requiresPhysicalReturn ? (
                    <span className={MONO_STATUS_BADGE_CLASS}>
                      {getReturnHandlingLabel(request.handlingOption)}
                    </span>
                  ) : null}
                </div>
                <p className="text-[13px] text-slate-500">
                  Đơn hàng {request.orderCode} được gửi đến{" "}
                  <span className="font-semibold text-slate-700">
                    {request.branchName || "chi nhánh phục vụ"}
                  </span>{" "}
                  để xử lý thủ công.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {canApprove ? (
                <Button
                  type="button"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => setActionOpen("approve")}
                >
                  Duyệt
                </Button>
              ) : null}

              {canReject ? (
                <Button
                  type="button"
                  variant="outline"
                  className={MONO_OUTLINE_BUTTON_CLASS}
                  onClick={() => setActionOpen("reject")}
                >
                  Từ chối
                </Button>
              ) : null}

              {canReceive ? (
                <Button
                  type="button"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => setActionOpen("receive")}
                >
                  Đã nhận hàng
                </Button>
              ) : null}

              {canRefund ? (
                <Button
                  type="button"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => setActionOpen("refund")}
                >
                  Hoàn tiền
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {!request.requiresPhysicalReturn && (
          <div className={MONO_INFO_PANEL_CLASS}>
            Yêu cầu này đang đi theo phương án chỉ hoàn tiền. Chi nhánh phục vụ sẽ
            xác minh bằng chứng, duyệt và hoàn tiền trực tiếp cho khách hàng, không
            cần bước nhận lại hàng.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Tạm tính hoàn"
            value={formatCurrency(request.totalRefundAmount)}
            note="Giá trị gợi ý cho bước hoàn tiền thủ công"
            tone="rose"
          />
          <MetricCard
            label="Số sản phẩm"
            value={`${request.items.length}`}
            note="Tổng dòng sản phẩm trong yêu cầu"
            tone="slate"
          />
          <MetricCard
            label="Bằng chứng"
            value={`${request.evidences.length}`}
            note={`${imageEvidences.length} ảnh, ${videoEvidences.length} video`}
            tone="sky"
          />
          <MetricCard
            label="Ngày gửi"
            value={formatDate(request.createdAt)}
            note="Thời điểm khách tạo yêu cầu"
            tone="emerald"
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <Panel title="Thông tin khách hàng">
            <div className="grid gap-4 md:grid-cols-2">
              <InfoLine
                icon={<UserRound size={15} className="text-slate-400" />}
                label="Họ tên"
                value={request.customerName}
              />
              <InfoLine
                icon={<Phone size={15} className="text-slate-400" />}
                label="Số điện thoại"
                value={request.customerPhone}
              />
              <InfoLine
                icon={<CreditCard size={15} className="text-slate-400" />}
                label="Phương thức hoàn"
                value={getReturnRefundLabel(request.refundMethod)}
              />
              <InfoLine
                icon={<Package size={15} className="text-slate-400" />}
                label="Loại sự cố"
                value={getReturnIssueLabel(request.issueType)}
              />
              <InfoLine
                icon={<RotateCcw size={15} className="text-slate-400" />}
                label="Phương án xử lý"
                value={getReturnHandlingLabel(request.handlingOption)}
              />
              {request.refundMethod === "BANK_TRANSFER" ? (
                <>
                  <InfoLine
                    icon={<CreditCard size={15} className="text-slate-400" />}
                    label="Tên chủ tài khoản"
                    value={request.bankAccountName || "Khách hàng chưa cung cấp"}
                  />
                  <InfoLine
                    icon={<CreditCard size={15} className="text-slate-400" />}
                    label="Số tài khoản"
                    value={request.bankAccountNumber || "Khách hàng chưa cung cấp"}
                  />
                  <InfoLine
                    icon={<CreditCard size={15} className="text-slate-400" />}
                    label="Ngân hàng"
                    value={request.bankName || "Khách hàng chưa cung cấp"}
                  />
                  <InfoLine
                    icon={<CreditCard size={15} className="text-slate-400" />}
                    label="Chi nhánh ngân hàng"
                    value={request.bankBranch || "Khách hàng không cung cấp"}
                  />
                </>
              ) : (
                <InfoLine
                  icon={<CreditCard size={15} className="text-slate-400" />}
                  label="Cách hoàn tiền"
                  value="Khách nhận tiền mặt trực tiếp tại điểm xử lý gần"
                />
              )}
            </div>
          </Panel>

          <Panel title="Thông tin phiếu trả hàng">
            <div className="grid gap-4 md:grid-cols-2">
              <InfoLine
                icon={<RotateCcw size={15} className="text-slate-400" />}
                label="Mã yêu cầu"
                value={request.code}
              />
              <InfoLine
                icon={<Package size={15} className="text-slate-400" />}
                label="Mã đơn hàng"
                value={request.orderCode}
              />
              <InfoLine
                icon={<Package size={15} className="text-slate-400" />}
                label="Chi nhánh phục vụ"
                value={request.branchName || "Đang cập nhật"}
              />
              <InfoLine
                icon={<Clock3 size={15} className="text-slate-400" />}
                label="Ngày tạo"
                value={formatDate(request.createdAt)}
              />
              <InfoLine
                icon={<CheckCircle2 size={15} className="text-slate-400" />}
                label="Ngày duyệt"
                value={request.approvedAt ? formatDate(request.approvedAt) : "Chưa duyệt"}
              />
              <InfoLine
                icon={<Package size={15} className="text-slate-400" />}
                label="Ngày nhận hàng"
                value={request.receivedAt ? formatDate(request.receivedAt) : "Chưa nhận hàng"}
              />
              <InfoLine
                icon={<CreditCard size={15} className="text-slate-400" />}
                label="Ngày hoàn tiền"
                value={request.refundedAt ? formatDate(request.refundedAt) : "Chưa hoàn tiền"}
              />
              <InfoLine
                icon={<XCircle size={15} className="text-slate-400" />}
                label="Ngày từ chối"
                value={request.rejectedAt ? formatDate(request.rejectedAt) : "Chưa từ chối"}
              />
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <Panel title="Lý do và mô tả">
            <div className="space-y-4">
              <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  Lý do ngắn gọn
                </p>
                <p className="mt-2 text-[14px] font-medium text-slate-900">
                  {request.reason}
                </p>
              </div>

              <div className="rounded-[4px] border border-slate-200 bg-white p-4">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  Mô tả chi tiết
                </p>
                <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-slate-600">
                  {request.description}
                </p>
              </div>

              {request.rejectReason ? (
                <div className="rounded-[4px] border border-blue-100 bg-blue-50 p-4">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-blue-700">
                    Lý do từ chối
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-blue-800">
                    {request.rejectReason}
                  </p>
                </div>
              ) : null}

              {request.internalNote ? (
                <div className="rounded-[4px] border border-blue-100 bg-blue-50 p-4">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-blue-700">
                    Ghi chú nội bộ
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-blue-800">
                    {request.internalNote}
                  </p>
                </div>
              ) : null}
            </div>
          </Panel>

          <Panel title="Tiến trình xử lý">
            <div className="space-y-3">
              <TimelineItem
                done
                label="Khách tạo yêu cầu"
                value={formatDate(request.createdAt)}
              />
              <TimelineItem
                done={Boolean(request.approvedAt)}
                label="Duyệt yêu cầu"
                value={request.approvedAt ? formatDate(request.approvedAt) : "Đang chờ"}
              />
              {request.requiresPhysicalReturn ? (
                <TimelineItem
                  done={Boolean(request.receivedAt)}
                  label="Nhận lại hàng trả"
                  value={request.receivedAt ? formatDate(request.receivedAt) : "Đang chờ"}
                />
              ) : (
                <TimelineItem
                  done
                  label="Bỏ qua bước nhận hàng"
                  value="Yêu cầu chỉ hoàn tiền, không cần nhận lại hàng vật lý"
                />
              )}
              <TimelineItem
                done={Boolean(request.refundedAt)}
                label="Hoàn tiền"
                value={request.refundedAt ? formatDate(request.refundedAt) : "Đang chờ"}
              />
              <TimelineItem
                done={Boolean(request.rejectedAt)}
                label="Từ chối"
                value={request.rejectedAt ? formatDate(request.rejectedAt) : "Chưa từ chối"}
                tone={request.rejectedAt ? "rose" : "slate"}
              />
            </div>
          </Panel>
        </div>

        <Panel title="Sản phẩm trong yêu cầu">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Sản phẩm</th>
                  <th className="px-3 py-2 font-semibold">SKU</th>
                  <th className="px-3 py-2 font-semibold text-center">SL tra</th>
                  <th className="px-3 py-2 font-semibold text-center">Đã mua</th>
                  <th className="px-3 py-2 font-semibold text-center">Nhập lại</th>
                  <th className="px-3 py-2 font-semibold text-center">Tồn lỗi</th>
                  <th className="px-3 py-2 font-semibold text-right">Đơn giá</th>
                  <th className="px-3 py-2 font-semibold text-right">Tạm tính hoàn</th>
                </tr>
              </thead>
              <tbody>
                {request.items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100 text-[13px]">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={resolveImageUrl(item.image, "/placeholder.png")}
                          alt={item.productName}
                          className="h-14 w-14 rounded-[6px] border border-slate-200 object-cover"
                        />
                        <div>
                          <p className="font-semibold text-slate-800">{item.productName}</p>
                          <p className="text-[12px] text-slate-500">
                            {item.variantName || "Sản phẩm trong đơn"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{item.sku || "N/A"}</td>
                    <td className="px-3 py-3 text-center text-slate-700">{item.quantity}</td>
                    <td className="px-3 py-3 text-center text-slate-700">
                      {item.orderedQuantity}
                    </td>
                    <td className="px-3 py-3 text-center text-slate-700">
                      {item.restockQuantity ?? 0}
                    </td>
                    <td className="px-3 py-3 text-center text-slate-700">
                      {item.defectiveQuantity ?? 0}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-700">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-blue-700">
                      {formatCurrency(item.refundAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {request.receivedAt ? (
          <div className={MONO_INFO_PANEL_CLASS}>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">
                  Đã nhập lại kho sau khi thu hồi hàng trả
                </p>
                <p className="text-[13px] text-slate-600">
                  Nhập lại bán được:{" "}
                  <span className="font-semibold text-slate-900">
                    {receiveSummary.restock}
                  </span>
                  {" · "}
                  Tồn lỗi:{" "}
                  <span className="font-semibold text-slate-900">
                    {receiveSummary.defective}
                  </span>
                </p>
              </div>

              {request.receivedInventoryNoteId && request.receivedInventoryNoteCode ? (
                <Link
                  href={`/admin/receipts/${request.receivedInventoryNoteId}`}
                  className="inline-flex h-10 items-center rounded-md border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                >
                  Xem phiếu nhập {request.receivedInventoryNoteCode}
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <Panel title="Hình ảnh bằng chứng">
            {imageEvidences.length === 0 ? (
              <EmptyEvidence message="Khách hàng chưa tải lên hình ảnh." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {imageEvidences.map((item) => (
                  <a
                    key={item.id}
                    href={resolveImageUrl(item.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="overflow-hidden rounded-[6px] border border-slate-200 bg-white"
                  >
                    <img
                      src={resolveImageUrl(item.fileUrl)}
                      alt={item.fileName || "evidence-image"}
                      className="h-52 w-full object-cover"
                    />
                    <div className="border-t border-slate-100 p-3 text-[12px] text-slate-500">
                      {item.fileName || "Mở tệp gốc"}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Video bằng chứng">
            {videoEvidences.length === 0 ? (
              <EmptyEvidence message="Khách hàng chưa tải lên video." />
            ) : (
              <div className="space-y-4">
                {videoEvidences.map((item) => (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-[6px] border border-slate-200 bg-white"
                  >
                    <video
                      src={resolveImageUrl(item.fileUrl)}
                      controls
                      className="h-64 w-full bg-slate-950"
                    />
                    <div className="flex items-center gap-2 border-t border-slate-100 p-3 text-[12px] text-slate-500">
                      <Video size={14} />
                      <span>{item.fileName || "Video lỗi"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <Panel title="Xử lý thủ công">
          {showReceiveInventorySection ? (
            <div className="mb-5 space-y-4 rounded-[6px] border border-blue-100 bg-blue-50 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Phân loại hàng nhận lại vào kho
                  </p>
                  <p className="text-[13px] leading-6 text-slate-600">
                    Tách số lượng bán được và số lượng vào tồn lỗi cho từng SKU ngay ở bước nhận hàng.
                  </p>
                </div>
                <div className="rounded-md border border-blue-200 bg-white px-3 py-2 text-[12px] text-slate-600">
                  Tổng nhập lại:{" "}
                  <span className="font-semibold text-slate-900">
                    {form.receiveItems.reduce(
                      (sum, item) => sum + Number(item.restockQuantity || 0),
                      0,
                    )}
                  </span>
                  {" · "}
                  Tổng tồn lỗi:{" "}
                  <span className="font-semibold text-slate-900">
                    {form.receiveItems.reduce(
                      (sum, item) => sum + Number(item.defectiveQuantity || 0),
                      0,
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {request.items.map((item) => {
                  const row = form.receiveItems.find(
                    (entry) => entry.returnRequestItemId === item.id,
                  );

                  return (
                    <div
                      key={item.id}
                      className="rounded-[6px] border border-slate-200 bg-white p-4"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {item.productName}
                          </p>
                          <p className="text-[12px] text-slate-500">
                            {item.sku || "SKU chưa cập nhật"}
                            {" · "}
                            Số lượng trả: {item.quantity}
                          </p>
                        </div>
                        <p className="text-[12px] text-slate-500">
                          Tạm tính hoàn: {formatCurrency(item.refundAmount)}
                        </p>
                      </div>

                      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_1.3fr]">
                        <label className="space-y-2 text-sm">
                          <span className="font-medium text-slate-700">
                            Số lượng nhập lại bán được
                          </span>
                          <Input
                            type="number"
                            min={0}
                            value={row?.restockQuantity ?? String(item.quantity)}
                            disabled={!canReceive}
                            onChange={(event) =>
                              updateReceiveItem(
                                item.id,
                                "restockQuantity",
                                event.target.value,
                              )
                            }
                          />
                        </label>

                        <label className="space-y-2 text-sm">
                          <span className="font-medium text-slate-700">
                            Số lượng vào tồn lỗi
                          </span>
                          <Input
                            type="number"
                            min={0}
                            value={row?.defectiveQuantity ?? "0"}
                            disabled={!canReceive}
                            onChange={(event) =>
                              updateReceiveItem(
                                item.id,
                                "defectiveQuantity",
                                event.target.value,
                              )
                            }
                          />
                        </label>

                        <label className="space-y-2 text-sm">
                          <span className="font-medium text-slate-700">
                            Ghi chú xử lý dòng hàng
                          </span>
                          <Input
                            value={row?.itemNote ?? ""}
                            disabled={!canReceive}
                            onChange={(event) =>
                              updateReceiveItem(item.id, "itemNote", event.target.value)
                            }
                            placeholder="Ví dụ: bao bì rách, vào tồn lỗi 1 cái..."
                          />
                        </label>
                      </div>

                      {receiveItemErrors[item.id] ? (
                        <p className="mt-2 text-sm font-medium text-red-600">
                          {receiveItemErrors[item.id]}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Ghi chú nội bộ</span>
              <Textarea
                rows={4}
                value={form.internalNote}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, internalNote: event.target.value }))
                }
                placeholder="Ghi lại cách xử lý, thông tin đối soát, ghi chú demo..."
              />
            </label>

            <div className="space-y-4">
              <label className="space-y-2 text-sm">
                <span className="font-medium text-slate-700">Lý do từ chối</span>
                <Textarea
                  rows={3}
                  value={form.rejectReason}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, rejectReason: event.target.value }))
                  }
                  placeholder="Nhập khi cần từ chối yêu cầu..."
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-700">Số tiền hoàn</span>
                  <Input
                    type="number"
                    min={0}
                    value={form.refundAmount}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        refundAmount: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-700">Phương thức hoàn</span>
                  <Input value={getReturnRefundLabel(form.refundMethod)} readOnly disabled />
                </label>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {canApprove ? (
              <Button
                type="button"
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => setActionOpen("approve")}
              >
                Duyệt yêu cầu
              </Button>
            ) : null}
            {canReject ? (
              <Button
                type="button"
                variant="outline"
                  className={MONO_OUTLINE_BUTTON_CLASS}
                onClick={() => setActionOpen("reject")}
              >
                Từ chối
              </Button>
            ) : null}
            {canReceive ? (
              <Button
                type="button"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => setActionOpen("receive")}
              >
                Xác nhận đã nhận hàng
              </Button>
            ) : null}
            {canRefund ? (
              <Button
                type="button"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => setActionOpen("refund")}
              >
                Xác nhận hoàn tiền
              </Button>
            ) : null}
          </div>
        </Panel>
      </div>

      <AlertDialog open={actionOpen !== null} onOpenChange={(open) => !open && setActionOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionOpen === "approve"
                ? "Duyệt yêu cầu trả hàng"
                : actionOpen === "reject"
                  ? "Từ chối yêu cầu trả hàng"
                  : actionOpen === "receive"
                    ? "Xác nhận đã nhận lại hàng"
                    : "Xác nhận hoàn tiền"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionOpen === "approve"
                ? "Yêu cầu sẽ chuyển sang bước tiếp theo để chi nhánh hoặc admin xử lý thủ công."
                : actionOpen === "reject"
                  ? "Khách hàng sẽ nhìn thấy lý do từ chối trong danh sách yêu cầu của họ."
                  : actionOpen === "receive"
                    ? "Chỉ áp dụng cho trường hợp cần nhận lại hàng vật lý trước khi hoàn tiền."
                    : form.refundMethod === "CASH"
                      ? "Số tiền hoàn sẽ được ghi nhận với phương thức tiền mặt."
                      : "Số tiền hoàn sẽ được ghi nhận với phương thức chuyển khoản ngân hàng."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {actionOpen === "reject" ? (
            <div className="rounded-[6px] border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
              Lý do từ chối hiện tại:
              <br />
              {form.rejectReason.trim() || "Bạn chưa nhập lý do từ chối."}
            </div>
          ) : null}

          {actionOpen === "refund" ? (
            <div className="rounded-[6px] border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
              Số tiền hoàn: {formatCurrency(form.refundAmount || 0)}
              <br />
              Phương thức: {getReturnRefundLabel(form.refundMethod)}
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmAction();
              }}
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-[16px] font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function MetricCard({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: "slate" | "sky" | "emerald" | "rose";
}) {
  const className =
    tone === "slate"
      ? "border-blue-100 bg-white"
      : "border-blue-100 bg-blue-50";

  return (
    <div className={`rounded-[4px] border p-4 shadow-sm ${className}`}>
      <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-[22px] font-bold leading-none text-slate-900">{value}</p>
      <p className="mt-2 text-[11px] leading-5 text-slate-500">{note}</p>
    </div>
  );
}

function InfoLine({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-[12px] font-semibold text-slate-500">{label}</p>
        <p className="mt-1 text-[13px] text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function TimelineItem({
  done,
  label,
  value,
  tone = "emerald",
}: {
  done: boolean;
  label: string;
  value: string;
  tone?: "emerald" | "rose" | "slate";
}) {
  const dotClass = done ? "bg-blue-500" : "bg-slate-200";

  return (
    <div className="flex items-start gap-3 rounded-[4px] border border-blue-100 bg-blue-50 p-3">
      <div className={`mt-1 h-3 w-3 rounded-full ${dotClass}`} />
      <div>
        <p className="text-[13px] font-semibold text-slate-800">{label}</p>
        <p className="mt-1 text-[12px] text-slate-500">{value}</p>
      </div>
    </div>
  );
}

function EmptyEvidence({ message }: { message: string }) {
  return (
    <div className="rounded-[4px] border border-dashed border-blue-200 bg-blue-50 p-10 text-center text-[13px] text-slate-500">
      {message}
    </div>
  );
}
