"use client";

import { use, useEffect, useMemo, useState } from "react";
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
  RefreshCcw,
  RotateCcw,
  UserRound,
  Video,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { returnService } from "@/app/services/return.service";
import {
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
  getReturnIssueLabel,
  getReturnRefundLabel,
  getReturnStatusMeta,
} from "@/lib/return-request";
import { resolveImageUrl } from "@/lib/resolveImageUrl";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";

type ActionType = "approve" | "reject" | "receive" | "refund" | null;

function extractErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

export default function ReturnOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const user = useAuthStore((state) => state.user);
  const { hasPermission } = usePermissions();
  const canViewSystemOrders = hasPermission(P.ORDER_VIEW);

  const [request, setRequest] = useState<ReturnRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionOpen, setActionOpen] = useState<ActionType>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    internalNote: "",
    rejectReason: "",
    refundAmount: "",
    refundMethod: "BANK_TRANSFER" as ReturnRefundMethod,
  });

  const fetchDetail = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = canViewSystemOrders
        ? await returnService.getAdminReturnRequestDetail(id)
        : await returnService.getBranchReturnRequestDetail(id);

      setRequest(data);
      setForm((prev) => ({
        ...prev,
        refundAmount:
          prev.refundAmount ||
          String(Math.round(Number(data.totalRefundAmount ?? 0))),
        refundMethod: data.refundMethod,
      }));
    } catch (err: any) {
      setError(
        extractErrorMessage(
          err,
          "Khong the tai chi tiet yeu cau tra hang luc nay.",
        ),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchDetail();
  }, [canViewSystemOrders, id]);

  const statusMeta = useMemo(
    () => (request ? getReturnStatusMeta(request.status) : null),
    [request],
  );
  const imageEvidences = request?.evidences.filter((item) => item.mediaType === "IMAGE") ?? [];
  const videoEvidences = request?.evidences.filter((item) => item.mediaType === "VIDEO") ?? [];

  const canApprove = request?.status === "PENDING";
  const canReject = request?.status === "PENDING";
  const canReceive = request?.status === "APPROVED" && request.requiresPhysicalReturn;
  const canRefund =
    !!request &&
    ((request.status === "APPROVED" && !request.requiresPhysicalReturn) ||
      request.status === "RECEIVED");

  const handleConfirmAction = async () => {
    if (!request || !actionOpen) return;

    if (actionOpen === "reject" && !form.rejectReason.trim()) {
      toast.error("Vui long nhap ly do tu choi.");
      return;
    }

    if (actionOpen === "refund") {
      const refundAmount = Number(form.refundAmount);
      if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
        toast.error("Vui long nhap so tien hoan hop le.");
        return;
      }
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
            })
          : await returnService.receiveBranchReturnRequest(request.id, {
              internalNote: form.internalNote.trim() || undefined,
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
        refundMethod: updatedRequest.refundMethod,
      }));

      toast.success(
        actionOpen === "approve"
          ? "Da duyet yeu cau tra hang."
          : actionOpen === "reject"
            ? "Da tu choi yeu cau tra hang."
            : actionOpen === "receive"
              ? "Da xac nhan nhan lai hang tra."
              : "Da cap nhat hoan tien cho yeu cau.",
      );
    } catch (err: any) {
      toast.error(
        extractErrorMessage(
          err,
          "Khong the cap nhat yeu cau tra hang luc nay.",
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
      <div className="rounded-[4px] border border-rose-100 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 text-rose-500" />
          <div className="space-y-3">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Khong the tai chi tiet yeu cau
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {error ?? "Yeu cau tra hang nay khong ton tai hoac da bi thay doi."}
              </p>
            </div>
            <Link
              href="/admin/orders/return"
              className="inline-flex h-10 items-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Quay lai danh sach
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
                Quay lai danh sach tra hang
              </Link>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-[22px] font-bold uppercase tracking-tight text-slate-900">
                    {request.code}
                  </h1>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}
                  >
                    {statusMeta.label}
                  </span>
                  {!request.requiresPhysicalReturn ? (
                    <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                      Thieu hang, chi nhanh xu ly truc tiep
                    </span>
                  ) : null}
                </div>
                <p className="text-[13px] text-slate-500">
                  Don hang {request.orderCode} duoc gui den{" "}
                  <span className="font-semibold text-slate-700">
                    {request.branchName || "chi nhanh phuc vu"}
                  </span>{" "}
                  de xu ly thu cong.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-slate-200"
                onClick={() => void fetchDetail(true)}
                disabled={refreshing}
              >
                <RefreshCcw
                  size={15}
                  className={refreshing ? "mr-2 animate-spin" : "mr-2"}
                />
                Lam moi
              </Button>

              {canApprove ? (
                <Button
                  type="button"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => setActionOpen("approve")}
                >
                  Duyet
                </Button>
              ) : null}

              {canReject ? (
                <Button
                  type="button"
                  variant="outline"
                  className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  onClick={() => setActionOpen("reject")}
                >
                  Tu choi
                </Button>
              ) : null}

              {canReceive ? (
                <Button
                  type="button"
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                  onClick={() => setActionOpen("receive")}
                >
                  Da nhan hang
                </Button>
              ) : null}

              {canRefund ? (
                <Button
                  type="button"
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => setActionOpen("refund")}
                >
                  Hoan tien
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {!request.requiresPhysicalReturn && (
          <div className="rounded-[4px] border border-sky-200 bg-sky-50 p-4 text-[13px] leading-6 text-sky-800">
            Yeu cau nay thuoc truong hop thieu hang. Chi nhanh phuc vu se xac minh bang chung,
            duyet va hoan tien truc tiep cho khach hang, khong can buoc nhan lai hang.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Tam tinh hoan"
            value={formatCurrency(request.totalRefundAmount)}
            note="Gia tri goi y cho buoc hoan tien thu cong"
            tone="rose"
          />
          <MetricCard
            label="So san pham"
            value={`${request.items.length}`}
            note="Tong dong san pham trong yeu cau"
            tone="slate"
          />
          <MetricCard
            label="Bang chung"
            value={`${request.evidences.length}`}
            note={`${imageEvidences.length} anh, ${videoEvidences.length} video`}
            tone="sky"
          />
          <MetricCard
            label="Ngay gui"
            value={formatDate(request.createdAt)}
            note="Thoi diem khach tao yeu cau"
            tone="emerald"
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <Panel title="Thong tin khach hang">
            <div className="grid gap-4 md:grid-cols-2">
              <InfoLine
                icon={<UserRound size={15} className="text-slate-400" />}
                label="Ho ten"
                value={request.customerName}
              />
              <InfoLine
                icon={<Phone size={15} className="text-slate-400" />}
                label="So dien thoai"
                value={request.customerPhone}
              />
              <InfoLine
                icon={<CreditCard size={15} className="text-slate-400" />}
                label="Phuong thuc hoan"
                value={getReturnRefundLabel(request.refundMethod)}
              />
              <InfoLine
                icon={<Package size={15} className="text-slate-400" />}
                label="Loai su co"
                value={getReturnIssueLabel(request.issueType)}
              />
              <InfoLine
                icon={<CreditCard size={15} className="text-slate-400" />}
                label="Ten chu tai khoan"
                value={request.bankAccountName}
              />
              <InfoLine
                icon={<CreditCard size={15} className="text-slate-400" />}
                label="So tai khoan"
                value={request.bankAccountNumber}
              />
              <InfoLine
                icon={<CreditCard size={15} className="text-slate-400" />}
                label="Ngan hang"
                value={request.bankName}
              />
              <InfoLine
                icon={<CreditCard size={15} className="text-slate-400" />}
                label="Chi nhanh ngan hang"
                value={request.bankBranch || "Khach hang khong cung cap"}
              />
            </div>
          </Panel>

          <Panel title="Thong tin phieu tra hang">
            <div className="grid gap-4 md:grid-cols-2">
              <InfoLine
                icon={<RotateCcw size={15} className="text-slate-400" />}
                label="Ma yeu cau"
                value={request.code}
              />
              <InfoLine
                icon={<Package size={15} className="text-slate-400" />}
                label="Ma don hang"
                value={request.orderCode}
              />
              <InfoLine
                icon={<Package size={15} className="text-slate-400" />}
                label="Chi nhanh phuc vu"
                value={request.branchName || "Dang cap nhat"}
              />
              <InfoLine
                icon={<Clock3 size={15} className="text-slate-400" />}
                label="Ngay tao"
                value={formatDate(request.createdAt)}
              />
              <InfoLine
                icon={<CheckCircle2 size={15} className="text-slate-400" />}
                label="Ngay duyet"
                value={request.approvedAt ? formatDate(request.approvedAt) : "Chua duyet"}
              />
              <InfoLine
                icon={<Package size={15} className="text-slate-400" />}
                label="Ngay nhan hang"
                value={request.receivedAt ? formatDate(request.receivedAt) : "Chua nhan hang"}
              />
              <InfoLine
                icon={<CreditCard size={15} className="text-slate-400" />}
                label="Ngay hoan tien"
                value={request.refundedAt ? formatDate(request.refundedAt) : "Chua hoan tien"}
              />
              <InfoLine
                icon={<XCircle size={15} className="text-slate-400" />}
                label="Ngay tu choi"
                value={request.rejectedAt ? formatDate(request.rejectedAt) : "Chua tu choi"}
              />
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <Panel title="Ly do va mo ta">
            <div className="space-y-4">
              <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  Ly do ngan gon
                </p>
                <p className="mt-2 text-[14px] font-medium text-slate-900">
                  {request.reason}
                </p>
              </div>

              <div className="rounded-[4px] border border-slate-200 bg-white p-4">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  Mo ta chi tiet
                </p>
                <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-slate-600">
                  {request.description}
                </p>
              </div>

              {request.rejectReason ? (
                <div className="rounded-[4px] border border-rose-200 bg-rose-50 p-4">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-rose-700">
                    Ly do tu choi
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-rose-700">
                    {request.rejectReason}
                  </p>
                </div>
              ) : null}

              {request.internalNote ? (
                <div className="rounded-[4px] border border-amber-200 bg-amber-50 p-4">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-amber-700">
                    Ghi chu noi bo
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-amber-800">
                    {request.internalNote}
                  </p>
                </div>
              ) : null}
            </div>
          </Panel>

          <Panel title="Tien trinh xu ly">
            <div className="space-y-3">
              <TimelineItem
                done
                label="Khach tao yeu cau"
                value={formatDate(request.createdAt)}
              />
              <TimelineItem
                done={Boolean(request.approvedAt)}
                label="Duyet yeu cau"
                value={request.approvedAt ? formatDate(request.approvedAt) : "Dang cho"}
              />
              {request.requiresPhysicalReturn ? (
                <TimelineItem
                  done={Boolean(request.receivedAt)}
                  label="Nhan lai hang tra"
                  value={request.receivedAt ? formatDate(request.receivedAt) : "Dang cho"}
                />
              ) : (
                <TimelineItem
                  done
                  label="Bo qua buoc nhan hang"
                  value="Truong hop thieu hang do chi nhanh xu ly truc tiep"
                />
              )}
              <TimelineItem
                done={Boolean(request.refundedAt)}
                label="Hoan tien"
                value={request.refundedAt ? formatDate(request.refundedAt) : "Dang cho"}
              />
              <TimelineItem
                done={Boolean(request.rejectedAt)}
                label="Tu choi"
                value={request.rejectedAt ? formatDate(request.rejectedAt) : "Chua tu choi"}
                tone={request.rejectedAt ? "rose" : "slate"}
              />
            </div>
          </Panel>
        </div>

        <Panel title="San pham trong yeu cau">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">San pham</th>
                  <th className="px-3 py-2 font-semibold">SKU</th>
                  <th className="px-3 py-2 font-semibold text-center">SL tra</th>
                  <th className="px-3 py-2 font-semibold text-center">Da mua</th>
                  <th className="px-3 py-2 font-semibold text-right">Don gia</th>
                  <th className="px-3 py-2 font-semibold text-right">Tam tinh hoan</th>
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
                            {item.variantName || "San pham trong don"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{item.sku || "N/A"}</td>
                    <td className="px-3 py-3 text-center text-slate-700">{item.quantity}</td>
                    <td className="px-3 py-3 text-center text-slate-700">
                      {item.orderedQuantity}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-700">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-rose-600">
                      {formatCurrency(item.refundAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <Panel title="Hinh anh bang chung">
            {imageEvidences.length === 0 ? (
              <EmptyEvidence message="Khach hang chua tai len hinh anh." />
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
                      {item.fileName || "Mo tep goc"}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Video bang chung">
            {videoEvidences.length === 0 ? (
              <EmptyEvidence message="Khach hang chua tai len video." />
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
                      <span>{item.fileName || "Video loi"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <Panel title="Xu ly thu cong">
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Ghi chu noi bo</span>
              <Textarea
                rows={4}
                value={form.internalNote}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, internalNote: event.target.value }))
                }
                placeholder="Ghi lai cach xu ly, thong tin doi soat, ghi chu demo..."
              />
            </label>

            <div className="space-y-4">
              <label className="space-y-2 text-sm">
                <span className="font-medium text-slate-700">Ly do tu choi</span>
                <Textarea
                  rows={3}
                  value={form.rejectReason}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, rejectReason: event.target.value }))
                  }
                  placeholder="Nhap khi can tu choi yeu cau..."
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-700">So tien hoan</span>
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
                  <span className="font-medium text-slate-700">Phuong thuc hoan</span>
                  <select
                    value={form.refundMethod}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        refundMethod: event.target.value as ReturnRefundMethod,
                      }))
                    }
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="BANK_TRANSFER">Chuyen khoan</option>
                    <option value="CASH">Tien mat</option>
                  </select>
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
                Duyet yeu cau
              </Button>
            ) : null}
            {canReject ? (
              <Button
                type="button"
                variant="outline"
                className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                onClick={() => setActionOpen("reject")}
              >
                Tu choi
              </Button>
            ) : null}
            {canReceive ? (
              <Button
                type="button"
                className="bg-indigo-600 text-white hover:bg-indigo-700"
                onClick={() => setActionOpen("receive")}
              >
                Xac nhan da nhan hang
              </Button>
            ) : null}
            {canRefund ? (
              <Button
                type="button"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => setActionOpen("refund")}
              >
                Xac nhan hoan tien
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
                ? "Duyet yeu cau tra hang"
                : actionOpen === "reject"
                  ? "Tu choi yeu cau tra hang"
                  : actionOpen === "receive"
                    ? "Xac nhan da nhan lai hang"
                    : "Xac nhan hoan tien"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionOpen === "approve"
                ? "Yeu cau se chuyen sang buoc tiep theo de chi nhanh hoac admin xu ly thu cong."
                : actionOpen === "reject"
                  ? "Khach hang se nhin thay ly do tu choi trong danh sach yeu cau cua ho."
                  : actionOpen === "receive"
                    ? "Chi ap dung cho truong hop can nhan lai hang vat ly truoc khi hoan tien."
                    : "So tien va phuong thuc hoan se duoc ghi nhan trong luong demo."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {actionOpen === "reject" ? (
            <div className="rounded-[6px] border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
              Ly do tu choi hien tai:
              <br />
              {form.rejectReason.trim() || "Ban chua nhap ly do tu choi."}
            </div>
          ) : null}

          {actionOpen === "refund" ? (
            <div className="rounded-[6px] border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">
              So tien hoan: {formatCurrency(form.refundAmount || 0)}
              <br />
              Phuong thuc: {getReturnRefundLabel(form.refundMethod)}
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Huy</AlertDialogCancel>
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
                  Dang xu ly...
                </>
              ) : (
                "Xac nhan"
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
    tone === "sky"
      ? "border-sky-200 bg-sky-50"
      : tone === "emerald"
        ? "border-emerald-200 bg-emerald-50"
        : tone === "rose"
          ? "border-rose-200 bg-rose-50"
          : "border-slate-200 bg-white";

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
  const dotClass = done
    ? tone === "rose"
      ? "bg-rose-500"
      : tone === "slate"
        ? "bg-slate-500"
        : "bg-emerald-500"
    : "bg-slate-200";

  return (
    <div className="flex items-start gap-3 rounded-[4px] border border-slate-200 bg-slate-50 p-3">
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
    <div className="rounded-[4px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-[13px] text-slate-500">
      {message}
    </div>
  );
}
