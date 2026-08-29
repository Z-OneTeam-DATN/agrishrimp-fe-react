"use client";

import Link from "next/link";
import { ChevronDown, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { ReturnRequest } from "@/app/types/return.types";
import { formatDate } from "@/lib/dateUtils";
import {
  getReturnHandlingLabel,
  getReturnIssueLabel,
  getReturnRefundLabel,
  getReturnStatusMeta,
} from "@/lib/return-request";
import { cn, formatCurrency } from "@/lib/utils";

type UserReturnRequestAccordionListProps = {
  requests: ReturnRequest[];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionHref?: string;
  emptyActionLabel?: string;
};

export function filterUserReturnRequests(
  requests: ReturnRequest[],
  keyword: string,
) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return requests;
  }

  return requests.filter((request) => {
    const searchableValues = [
      request.code,
      request.orderCode,
      request.reason,
      request.description,
      ...request.items.flatMap((item) => [
        item.productName,
        item.variantName,
        item.sku,
      ]),
    ];

    return searchableValues.some((value) =>
      value?.toLowerCase().includes(normalizedKeyword),
    );
  });
}

export function UserReturnRequestAccordionList({
  requests,
  emptyTitle = "Chưa có yêu cầu trả hàng",
  emptyDescription = "Khi bạn gửi yêu cầu từ đơn đã giao, phiếu xử lý sẽ hiển thị tại đây.",
  emptyActionHref,
  emptyActionLabel,
}: UserReturnRequestAccordionListProps) {
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  const expandedIdSet = useMemo(() => new Set(expandedIds), [expandedIds]);

  const toggleRequest = (requestId: number) => {
    setExpandedIds((current) =>
      current.includes(requestId)
        ? current.filter((id) => id !== requestId)
        : [...current, requestId],
    );
  };

  if (requests.length === 0) {
    return (
      <div className="border border-[#d8e6f5] bg-white px-6 py-12 text-center">
        <RotateCcw className="mx-auto h-8 w-8 text-[#9ab7d3]" />
        <h2 className="mt-4 text-lg font-semibold text-[#12385b]">
          {emptyTitle}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
          {emptyDescription}
        </p>
        {emptyActionHref && emptyActionLabel ? (
          <Link
            href={emptyActionHref}
            className="mt-5 inline-flex h-10 items-center bg-[#1965a2] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#145486]"
          >
            {emptyActionLabel}
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => {
        const statusMeta = getReturnStatusMeta(request.status);
        const isExpanded = expandedIdSet.has(request.id);
        const imageCount = request.evidences.filter(
          (item) => item.mediaType === "IMAGE",
        ).length;
        const videoCount = request.evidences.filter(
          (item) => item.mediaType === "VIDEO",
        ).length;

        return (
          <section
            key={request.id}
            className="overflow-hidden border border-[#d8e6f5] bg-white"
          >
            <button
              type="button"
              onClick={() => toggleRequest(request.id)}
              className="flex w-full flex-col gap-4 px-4 py-4 text-left transition-colors hover:bg-[#f8fbff] md:px-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold text-[#12385b]">
                    {request.code}
                  </span>
                  <span className="border border-[#d8e6f5] bg-[#f5f9ff] px-2 py-1 text-xs font-semibold text-[#1965a2]">
                    {statusMeta.label}
                  </span>
                  {!request.requiresPhysicalReturn ? (
                    <span className="border border-[#d8e6f5] bg-white px-2 py-1 text-xs text-[#1965a2]">
                      {getReturnHandlingLabel(request.handlingOption)}
                    </span>
                  ) : null}
                </div>

                <ChevronDown
                  className={cn(
                    "mt-1 h-4 w-4 shrink-0 text-[#1965a2] transition-transform",
                    isExpanded && "rotate-180",
                  )}
                />
              </div>

              <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Mã đơn
                  </p>
                  <p className="mt-1 font-medium text-[#12385b]">
                    {request.orderCode}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Ngày gửi
                  </p>
                  <p className="mt-1 font-medium text-[#12385b]">
                    {formatDate(request.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Sản phẩm trả
                  </p>
                  <p className="mt-1 font-medium text-[#12385b]">
                    {request.items.length} sản phẩm
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Tạm tính hoàn
                  </p>
                  <p className="mt-1 font-semibold text-[#1965a2]">
                    {formatCurrency(request.totalRefundAmount)}
                  </p>
                </div>
              </div>
            </button>

            {isExpanded ? (
              <div className="border-t border-[#d8e6f5] bg-[#fbfdff] px-4 py-4 md:px-5">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="border border-[#d8e6f5] bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Loại sự cố
                        </p>
                        <p className="mt-1 font-medium text-[#12385b]">
                          {getReturnIssueLabel(request.issueType)}
                        </p>
                      </div>
                      <div className="border border-[#d8e6f5] bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Phương án xử lý
                        </p>
                        <p className="mt-1 font-medium text-[#12385b]">
                          {getReturnHandlingLabel(request.handlingOption)}
                        </p>
                      </div>
                      <div className="border border-[#d8e6f5] bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Hoàn tiền
                        </p>
                        <p className="mt-1 font-medium text-[#12385b]">
                          {getReturnRefundLabel(request.refundMethod)}
                        </p>
                      </div>
                    </div>

                    <div className="border border-[#d8e6f5] bg-white px-4 py-3">
                      <p className="text-sm font-semibold text-[#12385b]">
                        Lý do
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        {request.reason}
                      </p>
                      {request.description ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-500">
                          {request.description}
                        </p>
                      ) : null}
                    </div>

                    {request.rejectReason ? (
                      <div className="border border-[#d8e6f5] bg-white px-4 py-3">
                        <p className="text-sm font-semibold text-[#12385b]">
                          Ghi chú từ chối
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          {request.rejectReason}
                        </p>
                      </div>
                    ) : null}

                    {request.internalNote ? (
                      <div className="border border-[#d8e6f5] bg-white px-4 py-3">
                        <p className="text-sm font-semibold text-[#12385b]">
                          Ghi chú xử lý
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                          {request.internalNote}
                        </p>
                      </div>
                    ) : null}

                    {request.status === "REFUNDED" ? (
                      <div className="border border-[#d8e6f5] bg-white px-4 py-3">
                        <p className="text-sm font-semibold text-[#12385b]">
                          Thông tin hoàn tiền
                        </p>
                        <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                          <p>
                            Phương thức:{" "}
                            <span className="font-medium text-[#12385b]">
                              {getReturnRefundLabel(request.refundMethod)}
                            </span>
                          </p>
                          <p>
                            Cập nhật:{" "}
                            <span className="font-medium text-[#12385b]">
                              {request.refundedAt
                                ? formatDate(request.refundedAt)
                                : "Đang cập nhật"}
                            </span>
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-4">
                    <div className="border border-[#d8e6f5] bg-white px-4 py-3">
                      <p className="text-sm font-semibold text-[#12385b]">
                        Sản phẩm trả
                      </p>
                      <div className="mt-3 space-y-3">
                        {request.items.map((item) => (
                          <div
                            key={item.id}
                            className="border border-[#eef4fb] bg-[#fbfdff] px-3 py-3"
                          >
                            <p className="text-sm font-medium text-[#12385b]">
                              {item.productName}
                            </p>
                            <div className="mt-2 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                              <p>SKU: {item.sku || "Đang cập nhật"}</p>
                              <p>Số lượng trả: {item.quantity}</p>
                              <p>Đã mua: {item.orderedQuantity}</p>
                              <p className="font-medium text-[#1965a2]">
                                Hoàn: {formatCurrency(item.refundAmount)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border border-[#d8e6f5] bg-white px-4 py-3">
                      <p className="text-sm font-semibold text-[#12385b]">
                        Bằng chứng đã gửi
                      </p>
                      <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                        <p>
                          Hình ảnh:{" "}
                          <span className="font-medium text-[#12385b]">
                            {imageCount}
                          </span>
                        </p>
                        <p>
                          Video:{" "}
                          <span className="font-medium text-[#12385b]">
                            {videoCount}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
