"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  RefreshCcw,
  RotateCcw,
} from "lucide-react";
import { returnService } from "@/app/services/return.service";
import { ReturnRequest } from "@/app/types/return.types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/dateUtils";
import {
  getReturnIssueLabel,
  getReturnRefundLabel,
  getReturnStatusMeta,
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

export default function ReturnListPage() {
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = async (showRefreshing = false) => {
    try {
      setError(null);
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await returnService.getMyReturnRequests();
      setRequests(data);
    } catch (err: any) {
      setError(
        extractErrorMessage(
          err,
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
  }, []);

  const summary = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((item) => item.status === "PENDING").length,
      resolved: requests.filter((item) =>
        ["REFUNDED", "REJECTED"].includes(item.status),
      ).length,
    };
  }, [requests]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Link
              href="/orders/list?status=COMPLETED"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#1965a2]"
            >
              <ArrowLeft size={16} />
              Quay lai don da giao
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Yeu cau tra hang cua toi
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Theo doi luong tra hang thu cong va trang thai xu ly cua chi nhanh.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadRequests(true)}
              disabled={refreshing}
            >
              <RefreshCcw
                size={15}
                className={refreshing ? "mr-2 animate-spin" : "mr-2"}
              />
              Tai lai
            </Button>
            <Link href="/orders/list?status=COMPLETED">
              <Button className="bg-[#1965a2] text-white hover:bg-[#145486]">
                Don da giao
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Tong yeu cau</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.total}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-sm text-amber-700">Dang cho xu ly</p>
          <p className="mt-2 text-2xl font-semibold text-amber-900">{summary.pending}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-sm text-emerald-700">Da ket thuc</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-900">
            {summary.resolved}
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-100 bg-white p-5 text-sm text-rose-600 shadow-sm">
          {error}
        </div>
      ) : null}

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <RotateCcw className="mx-auto text-slate-300" size={32} />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Chua co yeu cau tra hang
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Khi gui yeu cau tu don da giao, ban se theo doi duoc tien trinh xu ly tai day.
          </p>
          <Link
            href="/orders/list?status=COMPLETED"
            className="mt-5 inline-flex h-10 items-center rounded-md bg-[#1965a2] px-4 text-sm font-semibold text-white hover:bg-[#145486]"
          >
            Tao yeu cau moi
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const statusMeta = getReturnStatusMeta(request.status);

            return (
              <div
                key={request.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-900">
                        {request.code}
                      </h2>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}
                      >
                        {statusMeta.label}
                      </span>
                      {!request.requiresPhysicalReturn && (
                        <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                          Chi nhanh xu ly thieu hang
                        </span>
                      )}
                    </div>

                    <div className="grid gap-2 text-sm text-slate-500 md:grid-cols-2">
                      <p>
                        <span className="font-medium text-slate-700">Don hang:</span>{" "}
                        {request.orderCode}
                      </p>
                      <p>
                        <span className="font-medium text-slate-700">Chi nhanh:</span>{" "}
                        {request.branchName || "Dang cap nhat"}
                      </p>
                      <p>
                        <span className="font-medium text-slate-700">Loai su co:</span>{" "}
                        {getReturnIssueLabel(request.issueType)}
                      </p>
                      <p>
                        <span className="font-medium text-slate-700">Hoan tien:</span>{" "}
                        {getReturnRefundLabel(request.refundMethod)}
                      </p>
                      <p>
                        <span className="font-medium text-slate-700">Ngay gui:</span>{" "}
                        {formatDate(request.createdAt)}
                      </p>
                      <p>
                        <span className="font-medium text-slate-700">Tam tinh hoan:</span>{" "}
                        <span className="font-semibold text-rose-600">
                          {formatCurrency(request.totalRefundAmount)}
                        </span>
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                      <p className="font-medium text-slate-800">Ly do</p>
                      <p className="mt-1">{request.reason}</p>
                      {request.description ? (
                        <p className="mt-2 text-slate-500">{request.description}</p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      {request.items.map((item) => (
                        <span
                          key={item.id}
                          className="rounded-full bg-slate-100 px-2.5 py-1"
                        >
                          {item.productName} x{item.quantity}
                        </span>
                      ))}
                    </div>

                    {request.rejectReason ? (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={16} className="mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium">Ly do tu choi</p>
                            <p className="mt-1">{request.rejectReason}</p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {request.status === "REFUNDED" ? (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium">Yeu cau da hoan tien</p>
                            <p className="mt-1">
                              Thoi gian cap nhat:{" "}
                              {request.refundedAt ? formatDate(request.refundedAt) : "Dang cap nhat"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
