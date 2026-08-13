"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, RefreshCcw, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { returnService } from "@/app/services/return.service";
import {
  ReturnRequest,
  ReturnRequestStatus,
} from "@/app/types/return.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/stores/useAuthStore";
import { formatDate } from "@/lib/dateUtils";
import { canUseBranchOrderRoutes, resolveOrderRouteAccess } from "@/lib/order-routing";
import { P } from "@/lib/permissions";
import {
  getReturnIssueLabel,
  getReturnStatusMeta,
  RETURN_STATUS_OPTIONS,
} from "@/lib/return-request";
import { formatCurrency } from "@/lib/utils";

function extractErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

export default function ReturnOrdersPage() {
  const user = useAuthStore((state) => state.user);
  const warehouseId = useAuthStore((state) => state.warehouseId);
  const { hasPermission } = usePermissions();
  const canViewSystemOrders = hasPermission(P.ORDER_VIEW);
  const canUseBranchOrders = canUseBranchOrderRoutes(user, warehouseId);
  const orderRouteAccess = resolveOrderRouteAccess({
    canViewSystemOrders,
    canUseBranchOrders,
  });

  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<ReturnRequestStatus | "ALL">("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadRequests = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = canViewSystemOrders
        ? await returnService.getAdminReturnRequests(status, search)
        : await returnService.getBranchReturnRequests(status, search);

      setRequests(data);
    } catch (error: any) {
      toast.error(
        extractErrorMessage(
          error,
          "Khong the tai danh sach yeu cau tra hang luc nay.",
        ),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, [canViewSystemOrders, search, status]);

  const summary = useMemo(() => {
    const pending = requests.filter((item) => item.status === "PENDING").length;
    const approved = requests.filter((item) =>
      ["APPROVED", "RECEIVED"].includes(item.status),
    ).length;
    const refunded = requests.filter((item) => item.status === "REFUNDED").length;
    const missingItem = requests.filter((item) => item.issueType === "MISSING_ITEM").length;

    return {
      total: requests.length,
      pending,
      approved,
      refunded,
      missingItem,
    };
  }, [requests]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5 text-slate-800">
      <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-[22px] font-bold uppercase tracking-tight text-slate-900">
              Tra hang
            </h1>
            <p className="text-[13px] text-slate-500">
              {canViewSystemOrders
                ? "Admin theo doi toan bo yeu cau tra hang va cac buoc xu ly thu cong."
                : "Chi nhanh phuc vu xu ly yeu cau tra hang cua don do minh dam nhiem."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-slate-200"
              onClick={() => void loadRequests(true)}
              disabled={refreshing}
            >
              <RefreshCcw
                size={15}
                className={refreshing ? "mr-2 animate-spin" : "mr-2"}
              />
              Lam moi
            </Button>
            <Link href={orderRouteAccess.defaultOrderListPath}>
              <Button className="bg-blue-600 text-white hover:bg-blue-700">
                Danh sach don hang
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Tong yeu cau" value={summary.total} />
        <SummaryCard label="Cho duyet" value={summary.pending} tone="amber" />
        <SummaryCard label="Dang xu ly" value={summary.approved} tone="sky" />
        <SummaryCard label="Da hoan tien" value={summary.refunded} tone="emerald" />
      </div>

      <div className="rounded-[4px] border border-sky-200 bg-sky-50 p-4 text-[13px] leading-6 text-sky-800">
        Co {summary.missingItem} yeu cau thuoc nhom thieu hang. Voi cac yeu cau nay,
        chi nhanh phuc vu se duyet va hoan tien truc tiep, khong can buoc nhan lai hang.
      </div>

      <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative w-full lg:max-w-[320px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
            />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tim ma phieu, ma don, ten hoac so dien thoai..."
              className="h-[38px] rounded-[4px] border-slate-200 bg-white pl-10 text-[13px] shadow-none"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as ReturnRequestStatus | "ALL")
            }
            className="h-[38px] rounded-[4px] border border-slate-200 bg-white px-3 text-[13px] text-slate-700"
          >
            {RETURN_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-[4px] border border-slate-200 bg-white shadow-sm">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <RotateCcw size={36} className="mb-3 opacity-30" />
            <p className="text-[13px] font-medium uppercase">
              Chua co yeu cau tra hang phu hop
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Ma phieu</th>
                  <th className="px-4 py-3 font-semibold">Ngay tao</th>
                  <th className="px-4 py-3 font-semibold">Don hang</th>
                  <th className="px-4 py-3 font-semibold">Khach hang</th>
                  <th className="px-4 py-3 font-semibold">Chi nhanh</th>
                  <th className="px-4 py-3 font-semibold">Loai su co</th>
                  <th className="px-4 py-3 font-semibold text-center">Trang thai</th>
                  <th className="px-4 py-3 font-semibold text-right">Tam tinh hoan</th>
                  <th className="px-4 py-3 font-semibold text-right">Chi tiet</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => {
                  const statusMeta = getReturnStatusMeta(request.status);

                  return (
                    <tr
                      key={request.id}
                      className="cursor-pointer border-t border-slate-100 text-[13px] transition-colors hover:bg-slate-50"
                      onClick={() => {
                        window.location.href = `/admin/orders/return/${request.id}`;
                      }}
                    >
                      <td className="px-4 py-3 font-semibold text-blue-600">
                        {request.code}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{request.orderCode}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-slate-800">
                            {request.customerName}
                          </span>
                          <span className="text-[12px] text-slate-500">
                            {request.customerPhone}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {request.branchName || "Dang cap nhat"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-700">
                            {getReturnIssueLabel(request.issueType)}
                          </span>
                          {!request.requiresPhysicalReturn ? (
                            <span className="text-[11px] font-medium text-sky-600">
                              Thieu hang, chi nhanh xu ly truc tiep
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-rose-600">
                        {formatCurrency(request.totalRefundAmount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/orders/return/${request.id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="text-[12px] font-semibold text-blue-600 hover:text-blue-800"
                        >
                          Mo chi tiet
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number;
  tone?: "slate" | "amber" | "sky" | "emerald";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200 bg-amber-50"
      : tone === "sky"
        ? "border-sky-200 bg-sky-50"
        : tone === "emerald"
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-white";

  return (
    <div className={`rounded-[4px] border p-4 shadow-sm ${toneClass}`}>
      <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-[26px] font-bold leading-none text-slate-900">
        {value.toLocaleString("vi-VN")}
      </p>
    </div>
  );
}
