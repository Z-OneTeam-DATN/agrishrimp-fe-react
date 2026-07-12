"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Plus, Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuthStore } from "@/stores/useAuthStore";
import { isAdminRole, isManagerRole } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/axios";
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
import { PurchaseRequestApiService } from "@/app/services/purchase.service";
import type { PurchaseRequestResponse } from "@/app/types/purchase.schema";
import { PR_STATUS_LABEL } from "@/app/types/purchase.schema";

// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "all",              label: "Tất cả" },
  { id: "PENDING_APPROVAL", label: "Chờ duyệt" },
  { id: "APPROVED",         label: "Đã duyệt" },
  { id: "SENT_TO_SUPPLIER", label: "Gửi NCC" },
  { id: "SUPPLIER_CONFIRMED", label: "NCC xác nhận" },
  { id: "PREPARING", label: "Đang chuẩn bị" },
  { id: "DELIVERING", label: "Đang giao" },
  { id: "PARTIALLY_RECEIVED", label: "Nhận một phần" },
  { id: "COMPLETED",        label: "Hoàn tất" },
  { id: "CANCELLED",        label: "Đã hủy" },
] as const;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

// ─────────────────────────────────────────────────────────────────────────────

export default function PurchaseRequestListPage() {
  const { data: currentUser } = useCurrentUser();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isLoadingAuth = useAuthStore((state) => state.isLoadingAuth);
  const warehouseId = useAuthStore((state) => state.warehouseId);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [data, setData]           = useState<PurchaseRequestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch]       = useState("");
  const [cancelTarget, setCancelTarget] = useState<PurchaseRequestResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;
  const isWarehouseUser =
    (currentUser?.branch?.name?.toLowerCase().includes("kho tổng") ?? false) ||
    warehouseId === 1;
  const canAccessPurchaseRequests =
    isAdminRole(currentUser?.role) ||
    (isWarehouseUser && isManagerRole(currentUser?.role));

  const fetchAll = async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const list = await PurchaseRequestApiService.getAll();
      setData(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error(getErrorMessage(err as any));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoadingAuth) {
      return;
    }

    if (!canAccessPurchaseRequests || !accessToken) {
      setIsLoading(false);
      return;
    }

    void fetchAll();
  }, [accessToken, canAccessPurchaseRequests, isLoadingAuth]);
  useEffect(() => { setCurrentPage(1); }, [activeTab, search]);

  const filtered = useMemo(() => {
    return data.filter((pr) => {
      if (activeTab !== "all" && pr.status !== activeTab) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !pr.code?.toLowerCase().includes(q) &&
          !pr.supplierName?.toLowerCase().includes(q) &&
          !pr.branchName?.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [data, activeTab, search]);

  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE);
  const displayData = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data.length };
    TABS.slice(1).forEach((t) => {
      c[t.id] = data.filter((pr) => pr.status === t.id).length;
    });
    return c;
  }, [data]);

  const summaryCards = useMemo(() => [
    {
      title: "Tổng yêu cầu",
      value: data.length,
      description: "Toàn bộ phiếu yêu cầu đã lập",
    },
    {
      title: "Chờ duyệt",
      value: counts.PENDING_APPROVAL ?? 0,
      description: "Phiếu cần xác nhận trước khi gửi NCC",
    },
    {
      title: "Đang nhập",
      value:
        (counts.SENT_TO_SUPPLIER ?? 0) +
        (counts.SUPPLIER_CONFIRMED ?? 0) +
        (counts.PREPARING ?? 0) +
        (counts.DELIVERING ?? 0) +
        (counts.PARTIALLY_RECEIVED ?? 0),
      description: "Đã gửi NCC, đang xử lý hoặc đang nhận hàng",
    },
    {
      title: "Tổng giá trị",
      value: formatCurrency(
        data.reduce((sum, pr) => sum + (Number(pr.totalAmount) || 0), 0),
      ),
      description: "Giá trị dự kiến của các yêu cầu",
    },
  ], [counts, data]);

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      await PurchaseRequestApiService.cancel(cancelTarget.id);
      toast.success(`Đã hủy phiếu "${cancelTarget.code}"`);
      fetchAll();
    } catch (err) {
      toast.error(getErrorMessage(err as any));
    } finally {
      setCancelTarget(null);
    }
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 px-1 pb-8 text-slate-900">
      <div className="mb-8 mt-2 space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <h1 className="text-[20px] font-semibold uppercase text-slate-900">
            Phiếu yêu cầu mua hàng NCC
          </h1>
          {canAccessPurchaseRequests && (
            <Link href="/admin/purchase-requests/new">
              <Button className="h-[38px] bg-blue-600 px-4 text-[13px] font-medium text-white shadow-sm hover:bg-blue-700">
                <Plus size={16} className="mr-2" />
                Lập phiếu yêu cầu
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.title}
              className="rounded-[4px] border border-slate-200 bg-white p-3 shadow-sm"
            >
              <p className="text-[11px] font-semibold text-slate-400">
                {card.title}
              </p>
              <div className="mt-3 space-y-1">
                <p className="text-[20px] font-semibold leading-none text-slate-900">
                  {card.value}
                </p>
                <p className="text-[10px] leading-4 text-slate-500">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {TABS.map((tab) => {
              const count = counts[tab.id] ?? 0;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "h-[34px] rounded-[4px] border px-3 text-[12px] font-medium transition-colors",
                    activeTab === tab.id
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                  )}
                >
                  {tab.label}
                  <span className="ml-2 text-[11px] text-slate-400">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full xl:w-[300px]">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm mã phiếu, nhà cung cấp..."
                className="h-[38px] w-full rounded-[4px] border border-slate-200 bg-white pl-10 pr-3 text-[13px] shadow-none outline-none focus:border-blue-300"
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[4px] border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
            </div>
          ) : displayData.length === 0 ? (
            <div className="py-20 text-center text-[12px] text-slate-400">
              Không có dữ liệu phù hợp
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] table-fixed text-[11.5px]">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="w-[16%] px-4 py-3 text-left text-[10.5px] font-medium text-slate-500">Mã phiếu</th>
                    <th className="w-[26%] px-4 py-3 text-left text-[10.5px] font-medium text-slate-500">Nhà cung cấp</th>
                    <th className="w-[18%] px-4 py-3 text-left text-[10.5px] font-medium text-slate-500">Chi nhánh</th>
                    <th className="w-[13%] px-4 py-3 text-left text-[10.5px] font-medium text-slate-500">Trạng thái</th>
                    <th className="w-[12%] px-4 py-3 text-right text-[10.5px] font-medium text-slate-500">Tổng tiền</th>
                    <th className="w-[7%] px-4 py-3 text-center text-[10.5px] font-medium text-slate-500">Đợt nhập</th>
                    <th className="w-[8%] px-4 py-3 text-right text-[10.5px] font-medium text-slate-500">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {displayData.map((pr) => (
                    <tr
                      key={pr.id}
                      className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="text-[12px] font-semibold text-slate-900">
                          {pr.code}
                        </div>
                        <div className="mt-1 text-[10.5px] text-slate-400">
                          {formatDate(pr.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="truncate text-[12px] font-semibold text-slate-800">
                          {pr.supplierName || "—"}
                        </div>
                        <div className="mt-1 text-[10.5px] text-slate-400">
                          {pr.createdByName || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11.5px] text-slate-600">
                        <span className="block truncate whitespace-nowrap">
                          {pr.branchName || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11.5px] text-slate-600">
                        {PR_STATUS_LABEL[pr.status] || pr.status}
                      </td>
                      <td className="px-4 py-3 text-right text-[11.5px] font-medium text-slate-800">
                        {formatCurrency(pr.totalAmount ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-center text-[11.5px] text-slate-600">
                        {pr.completedReceiptCount ?? 0}/{pr.totalReceiptCount ?? 0}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/purchase-requests/${pr.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center text-slate-400 transition-colors hover:text-slate-700"
                          title="Xem chi tiết"
                        >
                          <Eye size={15} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3">
              <span className="text-[11px] font-medium text-slate-500">
                Hiển thị {displayData.length} trong {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="h-8 rounded-[4px] border-slate-200 text-[12px] font-medium"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Trước
                </Button>
                <span className="text-[12px] font-medium text-slate-600">
                  {currentPage}/{totalPages}
                </span>
                <Button
                  variant="outline"
                  className="h-8 rounded-[4px] border-slate-200 text-[12px] font-medium"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <AlertDialogContent className="bg-white rounded-[6px] border border-slate-200 shadow-xl max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 font-bold text-[16px]">Xác nhận hủy phiếu</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 text-[13px]">
              Bạn có chắc muốn hủy phiếu <strong>{cancelTarget?.code}</strong>? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-[12px] font-bold">Bỏ qua</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} className="bg-red-600 hover:bg-red-700 h-8 text-[12px] font-bold">
              Xác nhận hủy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

