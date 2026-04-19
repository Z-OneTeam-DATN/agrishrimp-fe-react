"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, ShoppingCart, RefreshCcw, Plus } from "lucide-react";
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
import type { PurchaseRequestResponse, PurchaseRequestStatus } from "@/app/types/purchase.schema";
import { PR_STATUS_LABEL, PR_STATUS_COLOR } from "@/app/types/purchase.schema";

// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "all",              label: "TẤT CẢ" },
  { id: "DRAFT",            label: "NHÁP" },
  { id: "PENDING_APPROVAL", label: "CHỜ DUYỆT" },
  { id: "APPROVED",         label: "ĐÃ DUYỆT" },
  { id: "SENT_TO_SUPPLIER", label: "GỬI NCC" },
  { id: "PARTIALLY_RECEIVED", label: "NHẬN MỘT PHẦN" },
  { id: "COMPLETED",        label: "HOÀN TẤT" },
  { id: "CANCELLED",        label: "ĐÃ HỦY" },
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
  const warehouseId = useAuthStore((state) => state.warehouseId);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [data, setData]           = useState<PurchaseRequestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch]       = useState("");
  const [cancelTarget, setCancelTarget] = useState<PurchaseRequestResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const isWarehouseUser =
    (currentUser?.branch?.name?.toLowerCase().includes("kho tổng") ?? false) ||
    warehouseId === 1;
  const canAccessPurchaseRequests =
    isAdminRole(currentUser?.role) ||
    (isWarehouseUser && isManagerRole(currentUser?.role));

  const fetchAll = async () => {
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

  useEffect(() => { fetchAll(); }, []);
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
    <div className="flex flex-col h-[calc(100vh-80px)] -m-4 md:-m-5 bg-[#f8f9fa] overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b shrink-0">
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <h1 className="text-[16px] font-black uppercase tracking-tight text-slate-700 flex items-center gap-2">
            <ShoppingCart className="text-slate-400" size={18} />
            Phiếu yêu cầu mua hàng NCC
          </h1>
          {canAccessPurchaseRequests && <Link href="/admin/purchase-requests/new">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-[12px] font-bold rounded-[3px]">
              <Plus size={14} className="mr-1" />
              Lập phiếu yêu cầu
            </Button>
          </Link>}
        </div>

        {/* Tabs */}
        <div className="px-6 flex items-center h-[48px] gap-6 overflow-x-auto">
          {TABS.map((tab) => {
            const count = counts[tab.id] ?? 0;
            const isAlert = (tab.id === "PENDING_APPROVAL" || tab.id === "APPROVED") && count > 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "h-full text-[11px] font-black border-b-2 px-1 tracking-wider transition-all relative whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className="ml-1 text-[10px] font-bold text-slate-500">({count})</span>
                )}
                {isAlert && (
                  <span className="absolute top-2 -right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 flex flex-col min-h-0">
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col h-full overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-2 border-b bg-slate-50/50 shrink-0">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã phiếu, nhà cung cấp..."
              className="flex-1 max-w-[320px] h-8 border border-slate-200 rounded-[3px] px-3 text-[12px] focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Button variant="ghost" size="sm" onClick={fetchAll} disabled={isLoading}>
              <RefreshCcw size={14} className={cn(isLoading && "animate-spin")} />
            </Button>
          </div>

          {/* Table */}
          <div className="flex-1 min-h-0 overflow-auto">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
              </div>
            ) : displayData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <ShoppingCart size={40} className="opacity-20 mb-3" />
                <p className="text-xs font-bold uppercase tracking-tight">Không có dữ liệu phù hợp</p>
              </div>
            ) : (
              <table className="w-full text-[12px]">
                <thead className="bg-slate-50 border-b sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-black text-slate-500 uppercase tracking-wider">Mã phiếu</th>
                    <th className="px-4 py-2.5 text-left font-black text-slate-500 uppercase tracking-wider">Nhà cung cấp</th>
                    <th className="px-4 py-2.5 text-left font-black text-slate-500 uppercase tracking-wider">Chi nhánh</th>
                    <th className="px-4 py-2.5 text-center font-black text-slate-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-4 py-2.5 text-right font-black text-slate-500 uppercase tracking-wider">Tổng tiền</th>
                    <th className="px-4 py-2.5 text-center font-black text-slate-500 uppercase tracking-wider">Đợt nhập</th>
                    <th className="px-4 py-2.5 text-left font-black text-slate-500 uppercase tracking-wider">Ngày tạo</th>
                    <th className="px-4 py-2.5 text-left font-black text-slate-500 uppercase tracking-wider">Người tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {displayData.map((pr, idx) => (
                    <tr
                      key={pr.id}
                      onClick={() => window.location.href = `/admin/purchase-requests/${pr.id}`}
                      className={cn(
                        "cursor-pointer border-b transition-colors hover:bg-blue-50/50",
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                      )}
                    >
                      <td className="px-4 py-2.5">
                        <span className="font-bold text-blue-600 hover:underline">{pr.code}</span>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-700">{pr.supplierName || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-500">{pr.branchName || "—"}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={cn(
                          "inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
                          PR_STATUS_COLOR[pr.status]
                        )}>
                          {PR_STATUS_LABEL[pr.status]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-700">
                        {formatCurrency(pr.totalAmount ?? 0)}
                      </td>
                      <td className="px-4 py-2.5 text-center text-slate-500">
                        {pr.completedReceiptCount ?? 0}/{pr.totalReceiptCount ?? 0}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">{formatDate(pr.createdAt)}</td>
                      <td className="px-4 py-2.5 text-slate-500">{pr.createdByName || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2 border-t bg-white shrink-0">
              <span className="text-[11px] text-slate-500">
                {filtered.length} kết quả — trang {currentPage}/{totalPages}
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7 text-[11px]"
                  disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                  Trước
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[11px]"
                  disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
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
