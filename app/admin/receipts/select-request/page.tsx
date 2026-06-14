"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { PurchaseRequestApiService } from "@/app/services/purchase.service";
import type { PurchaseRequestResponse } from "@/app/types/purchase.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminDataSyncLoader from "@/components/admin/shared/AdminDataSyncLoader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE = 20;

type SelectablePurchaseRequest = PurchaseRequestResponse & {
  remainingItemsCount: number;
  remainingQty: number;
  canCreateReceipt: boolean;
};

const statusLabel: Record<string, string> = {
  DRAFT: "Nháp",
  PENDING: "Chờ duyệt",
  PENDING_APPROVAL: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  SENT_TO_SUPPLIER: "Đã gửi NCC",
  PARTIALLY_RECEIVED: "Nhập một phần",
  COMPLETED: "Hoàn tất",
  REJECTED: "Từ chối",
  CANCELLED: "Đã hủy",
};

export default function SelectPurchaseRequestForReceiptPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<SelectablePurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("all");
  const [createdDate, setCreatedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);
      try {
        const data = await PurchaseRequestApiService.getAll();
        const list = Array.isArray(data) ? data : [];
        const enriched = await Promise.all(
          list.map(async (request) => {
            try {
              const remainingItems =
                await PurchaseRequestApiService.getRemainingItems(request.id);
              const validRemainingItems = (remainingItems || []).filter(
                (item) => Number(item.remainingQty ?? 0) > 0,
              );
              return {
                ...request,
                remainingItemsCount: validRemainingItems.length,
                remainingQty: validRemainingItems.reduce(
                  (sum, item) => sum + Number(item.remainingQty ?? 0),
                  0,
                ),
                canCreateReceipt: validRemainingItems.length > 0,
              };
            } catch {
              return {
                ...request,
                remainingItemsCount: 0,
                remainingQty: 0,
                canCreateReceipt: false,
              };
            }
          }),
        );
        setRequests(enriched);
      } catch {
        toast.error("Không thể tải danh sách phiếu yêu cầu mua");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchRequests();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [createdDate, keyword, status]);

  const rows = useMemo(() => {
    const text = keyword.trim().toLowerCase();
    return requests
      .filter((request) => {
        const matchesKeyword =
          !text ||
          String(request.code || "").toLowerCase().includes(text) ||
          String(request.supplierName || "").toLowerCase().includes(text) ||
          String(request.supplierCode || "").toLowerCase().includes(text);
        const matchesStatus = status === "all" || request.status === status;
        const matchesDate =
          !createdDate ||
          (request.createdAt &&
            new Date(request.createdAt).toISOString().slice(0, 10) ===
              createdDate);
        return (
          request.canCreateReceipt &&
          matchesKeyword &&
          matchesStatus &&
          matchesDate
        );
      });
  }, [createdDate, keyword, requests, status]);

  const statusOptions = useMemo(() => {
    return Array.from(new Set(requests.map((request) => request.status).filter(Boolean)));
  }, [requests]);

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const displayRows = rows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const firstItem = rows.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(currentPage * PAGE_SIZE, rows.length);

  const handleSelect = (request: SelectablePurchaseRequest) => {
    if (!request.canCreateReceipt) return;
    const params = new URLSearchParams({
      purchaseRequestId: String(request.id),
      supplierCode: request.supplierCode || "",
      branchName: request.branchName || "",
    });
    router.push(`/admin/receipts/new?${params.toString()}`);
  };

  return (
    <div className="space-y-5 px-1 pb-8 text-slate-900">
      <div className="flex flex-col gap-4 pt-2 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-[20px] font-semibold uppercase text-slate-900">
          Chọn phiếu yêu cầu mua
        </h1>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-[480px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
            />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm mã phiếu, nhà cung cấp..."
              className="h-[38px] border-slate-200 bg-white pl-10 text-[13px] shadow-none"
            />
          </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <div className="relative w-full sm:w-[190px]">
            <CalendarDays
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
            />
            <Input
              type="date"
              value={createdDate}
              onChange={(event) => setCreatedDate(event.target.value)}
              className="h-[38px] border-slate-200 bg-white pl-10 text-[13px] shadow-none"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-[38px] w-full border-slate-200 bg-white text-[13px] shadow-none lg:w-[220px]">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {statusOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {statusLabel[option] || option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <AdminDataSyncLoader />
        ) : displayRows.length === 0 ? (
          <div className="py-16 text-center text-[12px] text-slate-400">
            Không có phiếu yêu cầu nào còn hàng cần nhập
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-[12px]">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-500">
                  <tr>
                    <th className="w-[18%] px-5 py-3 text-left font-medium">Mã phiếu</th>
                    <th className="w-[28%] px-3 py-3 text-left font-medium">Nhà cung cấp</th>
                    <th className="w-[18%] px-3 py-3 text-left font-medium">Kho nhận</th>
                    <th className="w-[14%] px-3 py-3 text-left font-medium">Trạng thái</th>
                    <th className="w-[12%] px-3 py-3 text-right font-medium">Còn nhập</th>
                    <th className="w-[10%] px-5 py-3 text-right font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-5 py-3">
                        <p className="text-[12.5px] font-semibold text-slate-800">
                          {request.code}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {request.createdAt
                            ? new Date(request.createdAt).toLocaleDateString("vi-VN")
                            : "Không có ngày"}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="line-clamp-1 font-medium text-slate-700">
                          {request.supplierName || "Chưa có NCC"}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {request.supplierCode || "-"}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {request.branchName || "-"}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {statusLabel[request.status] || request.status}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <p className="font-semibold text-slate-800">
                          {request.remainingItemsCount} mặt hàng
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {request.remainingQty} sản phẩm
                        </p>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          type="button"
                          className="h-8 bg-emerald-600 px-3 text-[11px] font-medium hover:bg-emerald-700"
                          onClick={() => handleSelect(request)}
                        >
                          <Check size={13} className="mr-1.5" />
                          Chọn
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-slate-500">
                Hiển thị {firstItem} - {lastItem} trong {rows.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-[11px] font-medium"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => page - 1)}
                >
                  Trước
                </Button>
                <span className="min-w-[60px] text-center text-[11px] text-slate-500">
                  {currentPage} / {totalPages || 1}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-[11px] font-medium"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage((page) => page + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
