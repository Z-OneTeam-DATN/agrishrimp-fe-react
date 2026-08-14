"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, RefreshCcw, RotateCcw } from "lucide-react";
import { returnService } from "@/app/services/return.service";
import { ReturnRequest } from "@/app/types/return.types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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

function getLatestUpdate(request: ReturnRequest) {
  return (
    request.refundedAt ||
    request.rejectedAt ||
    request.receivedAt ||
    request.approvedAt ||
    request.createdAt
  );
}

function getUserStatusClass(status: ReturnRequest["status"]) {
  switch (status) {
    case "PENDING":
      return "border-blue-300 bg-blue-50 text-blue-700";
    case "APPROVED":
      return "border-blue-400 bg-blue-100 text-blue-800";
    case "RECEIVED":
      return "border-slate-300 bg-slate-50 text-slate-700";
    case "REFUNDED":
      return "border-blue-500 bg-blue-800 text-white";
    case "REJECTED":
      return "border-slate-400 bg-slate-700 text-white";
    default:
      return "border-blue-200 bg-white text-blue-900";
  }
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
          "Không thể tải danh sách yêu cầu trả hàng lúc này.",
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

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64 rounded-none" />
        <Skeleton className="h-20 w-full rounded-none" />
        <Skeleton className="h-48 w-full rounded-none" />
      </div>
    );
  }

  return (
    <div className="space-y-4 text-blue-950">
      <div className="border border-blue-200 bg-white p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Link
              href="/orders/list?status=COMPLETED"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900"
            >
              <ArrowLeft size={16} />
              Quay lại đơn đã giao
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-blue-950">
                Phiếu trả hàng của tôi
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Theo dõi thông tin đơn trả, sản phẩm trả và tiến trình xử lý của chi nhánh.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-none border-blue-200 text-blue-900 hover:bg-blue-50"
              onClick={() => void loadRequests(true)}
              disabled={refreshing}
            >
              <RefreshCcw
                size={15}
                className={refreshing ? "mr-2 animate-spin" : "mr-2"}
              />
              Tải lại
            </Button>
            <Link href="/orders/list?status=COMPLETED">
              <Button className="rounded-none bg-blue-800 text-white hover:bg-blue-900">
                Đơn đã giao
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {error ? (
        <div className="border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          {error}
        </div>
      ) : null}

      {requests.length === 0 ? (
        <div className="border border-blue-200 bg-white p-10 text-center">
          <RotateCcw className="mx-auto text-blue-300" size={32} />
          <h2 className="mt-4 text-lg font-semibold text-blue-950">
            Chưa có yêu cầu trả hàng
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Khi gửi yêu cầu từ đơn đã giao, bạn sẽ theo dõi được thông tin đơn trả tại đây.
          </p>
          <Link
            href="/orders/list?status=COMPLETED"
            className="mt-5 inline-flex h-10 items-center bg-blue-800 px-4 text-sm font-semibold text-white hover:bg-blue-900"
          >
            Tạo yêu cầu mới
          </Link>
        </div>
      ) : (
        <Accordion type="single" collapsible className="border border-blue-200 bg-white">
          {requests.map((request) => {
            const statusMeta = getReturnStatusMeta(request.status);
            const statusClassName = getUserStatusClass(request.status);

            return (
              <AccordionItem
                key={request.id}
                value={`request-${request.id}`}
                className="border-b border-blue-200 last:border-b-0"
              >
                <AccordionTrigger className="px-4 py-4 hover:no-underline">
                  <div className="grid w-full gap-3 text-left md:grid-cols-[1.45fr_1fr_1fr_auto] md:items-center">
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-blue-950">
                        {request.code}
                      </p>
                      <p className="text-sm text-slate-600">
                        Đơn hàng {request.orderCode} • Gửi ngày {formatDate(request.createdAt)}
                      </p>
                    </div>

                    <div className="text-sm text-slate-600">
                      <p className="font-medium text-blue-900">Chi nhánh xử lý</p>
                      <p>{request.branchName || "Đang cập nhật"}</p>
                    </div>

                    <div className="text-sm text-slate-600">
                      <p className="font-medium text-blue-900">Tạm hoàn</p>
                      <p>{formatCurrency(request.totalRefundAmount)}</p>
                    </div>

                    <div className="flex flex-col items-start gap-2 md:items-end">
                      <span
                        className={`inline-flex border px-2.5 py-1 text-xs font-semibold ${statusClassName}`}
                      >
                        {statusMeta.label}
                      </span>
                      <span className="text-xs text-slate-500">
                        Cập nhật {formatDate(getLatestUpdate(request))}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="border-t border-blue-200 bg-blue-50/40 px-4 pb-4 pt-4">
                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <DetailTile label="Mã đơn trả" value={request.code} />
                      <DetailTile label="Mã đơn hàng" value={request.orderCode} />
                      <DetailTile
                        label="Loại sự cố"
                        value={getReturnIssueLabel(request.issueType)}
                      />
                      <DetailTile
                        label="Phương thức hoàn"
                        value={getReturnRefundLabel(request.refundMethod)}
                      />
                      <DetailTile label="Người nhận hoàn" value={request.customerName} />
                      <DetailTile label="Số điện thoại" value={request.customerPhone} />
                      <DetailTile
                        label="Ngân hàng"
                        value={`${request.bankName} • ${request.bankAccountNumber}`}
                      />
                      <DetailTile
                        label="Chi nhánh ngân hàng"
                        value={request.bankBranch || "Không cung cấp"}
                      />
                    </div>

                    {!request.requiresPhysicalReturn ? (
                      <div className="border border-blue-200 bg-white p-3 text-sm text-blue-900">
                        Đơn trả này thuộc trường hợp thiếu hàng. Chi nhánh sẽ xác minh và hoàn tiền trực tiếp, không cần nhận lại hàng vật lý.
                      </div>
                    ) : null}

                    <div className="border border-blue-200 bg-white p-4">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-900">
                        Lý do trả hàng
                      </h3>
                      <p className="mt-2 text-sm font-medium text-blue-950">
                        {request.reason}
                      </p>
                      {request.description ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                          {request.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="border border-blue-200 bg-white">
                      <div className="border-b border-blue-200 bg-blue-50 px-4 py-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-900">
                          Thông tin sản phẩm trả
                        </h3>
                      </div>
                      <div className="divide-y divide-blue-100">
                        {request.items.map((item) => (
                          <div
                            key={item.id}
                            className="grid gap-2 px-4 py-3 md:grid-cols-[minmax(0,1.6fr)_0.8fr_0.8fr_0.8fr]"
                          >
                            <div>
                              <p className="font-medium text-blue-950">{item.productName}</p>
                              <p className="text-sm text-slate-500">
                                {item.variantName || item.sku || "Sản phẩm trong đơn"}
                              </p>
                            </div>
                            <div className="text-sm text-slate-600">
                              <p className="font-medium text-blue-900">Số lượng trả</p>
                              <p>{item.quantity}</p>
                            </div>
                            <div className="text-sm text-slate-600">
                              <p className="font-medium text-blue-900">Đơn giá</p>
                              <p>{formatCurrency(item.unitPrice)}</p>
                            </div>
                            <div className="text-sm text-slate-600">
                              <p className="font-medium text-blue-900">Hoàn dự kiến</p>
                              <p>{formatCurrency(item.refundAmount)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {request.rejectReason ? (
                      <div className="border border-blue-200 bg-white p-4 text-sm text-blue-950">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={16} className="mt-0.5 shrink-0 text-blue-700" />
                          <div>
                            <p className="font-semibold text-blue-900">Lý do từ chối</p>
                            <p className="mt-1 text-slate-600">{request.rejectReason}</p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {request.status === "REFUNDED" ? (
                      <div className="border border-blue-200 bg-white p-4 text-sm text-blue-950">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-blue-700" />
                          <div>
                            <p className="font-semibold text-blue-900">Yêu cầu đã hoàn tiền</p>
                            <p className="mt-1 text-slate-600">
                              Thời gian cập nhật:{" "}
                              {request.refundedAt ? formatDate(request.refundedAt) : "Đang cập nhật"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-blue-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
        {label}
      </p>
      <p className="mt-2 text-sm text-blue-950">{value}</p>
    </div>
  );
}
