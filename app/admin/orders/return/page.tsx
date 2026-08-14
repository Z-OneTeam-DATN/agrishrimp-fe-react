"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
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
import { formatDate } from "@/lib/dateUtils";
import {
  canUseBranchOrderRoutes,
  resolveOrderRouteAccess,
} from "@/lib/order-routing";
import { P } from "@/lib/permissions";
import {
  getReturnIssueLabel,
  getReturnStatusMeta,
  RETURN_STATUS_OPTIONS,
} from "@/lib/return-request";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";

function extractErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

type LoadRequestOptions = {
  background?: boolean;
  showError?: boolean;
};

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
  const [status, setStatus] = useState<ReturnRequestStatus | "ALL">("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadRequests = useCallback(
    async ({ background = false, showError = true }: LoadRequestOptions = {}) => {
      try {
        if (!background) {
          setLoading(true);
        }

        const data = canViewSystemOrders
          ? await returnService.getAdminReturnRequests(status, search)
          : await returnService.getBranchReturnRequests(status, search);

        setRequests(data);
      } catch (error: any) {
        if (showError) {
          toast.error(
            extractErrorMessage(
              error,
              "Không thể tải danh sách yêu cầu trả hàng lúc này.",
            ),
          );
        }
      } finally {
        if (!background) {
          setLoading(false);
        }
      }
    },
    [canViewSystemOrders, search, status],
  );

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void loadRequests({ background: true, showError: false });
      }
    };

    const refreshNow = () => {
      void loadRequests({ background: true, showError: false });
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadRequests({ background: true, showError: false });
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
  }, [loadRequests]);

  const summary = useMemo(() => {
    const pending = requests.filter((item) => item.status === "PENDING").length;
    const approved = requests.filter((item) =>
      ["APPROVED", "RECEIVED"].includes(item.status),
    ).length;
    const refunded = requests.filter((item) => item.status === "REFUNDED").length;
    const missingItem = requests.filter(
      (item) => item.issueType === "MISSING_ITEM",
    ).length;

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
      <div className="rounded-[4px] border border-blue-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-[22px] font-bold uppercase tracking-tight text-slate-900">
              Trả hàng
            </h1>
            <p className="text-[13px] text-slate-500">
              {canViewSystemOrders
                ? "Admin theo dõi toàn bộ yêu cầu trả hàng và các bước xử lý thủ công."
                : "Chi nhánh phục vụ xử lý yêu cầu trả hàng của các đơn do mình đảm nhiệm."}
            </p>
          </div>

          <Link href={orderRouteAccess.defaultOrderListPath}>
            <Button className="bg-blue-600 text-white hover:bg-blue-700">
              Danh sách đơn hàng
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Tổng yêu cầu" value={summary.total} />
        <SummaryCard label="Chờ duyệt" value={summary.pending} />
        <SummaryCard label="Đang xử lý" value={summary.approved} />
        <SummaryCard label="Đã hoàn tiền" value={summary.refunded} />
      </div>

      <div className="rounded-[4px] border border-blue-200 bg-blue-50 p-4 text-[13px] leading-6 text-blue-800">
        Có {summary.missingItem} yêu cầu thuộc nhóm thiếu hàng. Với các yêu cầu này,
        chi nhánh phục vụ sẽ duyệt và hoàn tiền trực tiếp, không cần bước nhận lại
        hàng.
      </div>

      <div className="rounded-[4px] border border-blue-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative w-full lg:max-w-[320px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
            />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm mã phiếu, mã đơn, tên hoặc số điện thoại..."
              className="h-[38px] rounded-[4px] border-blue-100 bg-white pl-10 text-[13px] shadow-none"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as ReturnRequestStatus | "ALL")
            }
            className="h-[38px] rounded-[4px] border border-blue-100 bg-white px-3 text-[13px] text-slate-700"
          >
            {RETURN_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-[4px] border border-blue-100 bg-white shadow-sm">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <RotateCcw size={36} className="mb-3 opacity-30" />
            <p className="text-[13px] font-medium uppercase">
              Chưa có yêu cầu trả hàng phù hợp
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left">
              <thead className="border-b border-blue-100 bg-blue-50 text-[11px] uppercase tracking-wide text-blue-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Mã phiếu</th>
                  <th className="px-4 py-3 font-semibold">Ngày tạo</th>
                  <th className="px-4 py-3 font-semibold">Đơn hàng</th>
                  <th className="px-4 py-3 font-semibold">Khách hàng</th>
                  <th className="px-4 py-3 font-semibold">Chi nhánh</th>
                  <th className="px-4 py-3 font-semibold">Loại sự cố</th>
                  <th className="px-4 py-3 font-semibold text-center">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold text-right">Tạm tính hoàn</th>
                  <th className="px-4 py-3 font-semibold text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => {
                  const statusMeta = getReturnStatusMeta(request.status);

                  return (
                    <tr
                      key={request.id}
                      className="cursor-pointer border-t border-blue-50 text-[13px] transition-colors hover:bg-blue-50/40"
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
                        {request.branchName || "Đang cập nhật"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-700">
                            {getReturnIssueLabel(request.issueType)}
                          </span>
                          {!request.requiresPhysicalReturn ? (
                            <span className="text-[11px] font-medium text-blue-600">
                              Thiếu hàng, chi nhánh xử lý trực tiếp
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getBlueReturnStatusClass(request.status)}`}
                        >
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-700">
                        {formatCurrency(request.totalRefundAmount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/orders/return/${request.id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="text-[12px] font-semibold text-blue-600 hover:text-blue-800"
                        >
                          Mở chi tiết
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
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[4px] border border-blue-100 bg-white p-4 shadow-sm">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-[26px] font-bold leading-none text-blue-700">
        {value.toLocaleString("vi-VN")}
      </p>
    </div>
  );
}

function getBlueReturnStatusClass(status: ReturnRequestStatus) {
  switch (status) {
    case "PENDING":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "APPROVED":
      return "border-blue-300 bg-blue-100 text-blue-800";
    case "RECEIVED":
      return "border-blue-300 bg-white text-blue-700";
    case "REFUNDED":
      return "border-blue-600 bg-blue-600 text-white";
    case "REJECTED":
      return "border-blue-400 bg-white text-blue-600";
    default:
      return "border-blue-200 bg-white text-blue-700";
  }
}
