"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Plus, RefreshCcw, Search } from "lucide-react";
import { InventoryReceiptTable } from "@/components/inventory/InventoryReceiptTable";
import { InventoryApiService } from "@/app/services/inventory.service";
import { branchService } from "@/app/services/branchService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { getErrorMessage } from "@/lib/axios";
import AdminDataSyncLoader from "@/components/admin/shared/AdminDataSyncLoader";
import { cn, formatNumber } from "@/lib/utils";

const PAGE_SIZE = 20;

export default function AdminReceiptListPage() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteReceipt, setDeleteReceipt] = useState<{ id: number; code: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [warehouseOptions, setWarehouseOptions] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchReceipts = async () => {
    setIsLoading(true);
    try {
      const data = await InventoryApiService.getAllReceipts();
      const rawData = Array.isArray(data) ? data : data?.content || [];
      setReceipts(rawData.map((item: any) => ({
        id: item.id,
        code: item.code || item.receiptCode || `PNK-${item.id}`,
        date: item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "Chưa xác định",
        dateValue: (item.entryDate || item.receiptDate || item.createdAt || "").slice(0, 10),
        supplier: item.supplierName && item.supplierName !== "N/A"
          ? item.supplierName
          : item.importType === "INTERNAL" ? "Kho nội bộ" : "Chưa xác định",
        importType: item.importType,
        warehouse: item.branchName || "Kho tổng",
        total: Number(item.totalAmount) || 0,
        paid: Number(item.paymentAmount) || 0,
        debt: Number(item.debtAmount ?? ((item.totalAmount || 0) - (item.paymentAmount || 0))) || 0,
        status: String(item.status || "PENDING").toUpperCase(),
        creator: item.creatorName || item.createdByName || item.creator || "Hệ thống",
      })));
    } catch {
      toast.error("Không thể tải danh sách phiếu nhập");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchReceipts();
    void (async () => {
      try {
        const data = await branchService.getAll();
        const list = Array.isArray(data) ? data : data.content || [];
        setWarehouseOptions(list.map((branch: any) => ({
          label: branch.name || branch.branchName,
          value: branch.name || branch.branchName,
        })));
      } catch (error) {
        console.error("Không thể tải danh sách kho", error);
      }
    })();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedWarehouse, selectedStatus, selectedDate]);

  const filteredData = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    return receipts.filter((item) => {
      const matchesKeyword = !keyword
        || item.code.toLowerCase().includes(keyword)
        || item.supplier.toLowerCase().includes(keyword);
      const matchesWarehouse = selectedWarehouse === "all" || item.warehouse === selectedWarehouse;
      const matchesDate = !selectedDate || item.dateValue === selectedDate;
      const matchesStatus = selectedStatus === "all"
        || (selectedStatus === "pending" && ["PENDING", "PO"].includes(item.status))
        || (selectedStatus === "completed" && ["APPROVED", "COMPLETED", "IMPORTED"].includes(item.status))
        || (selectedStatus === "cancelled" && ["CANCELLED", "REJECTED"].includes(item.status));
      return matchesKeyword && matchesWarehouse && matchesDate && matchesStatus;
    });
  }, [receipts, searchQuery, selectedWarehouse, selectedStatus, selectedDate]);

  const summary = useMemo(() => receipts.reduce(
    (result, item) => {
      result.totalValue += item.status === "CANCELLED" || item.status === "REJECTED" ? 0 : item.total;
      result.totalDebt += item.status === "CANCELLED" || item.status === "REJECTED" ? 0 : item.debt;
      if (["PENDING", "PO"].includes(item.status)) result.pending += 1;
      return result;
    },
    { totalValue: 0, totalDebt: 0, pending: 0 },
  ), [receipts]);

  const statusTabs = [
    { id: "all", label: "Tất cả" },
    { id: "pending", label: "Chờ duyệt" },
    { id: "completed", label: "Đã nhập kho" },
    { id: "cancelled", label: "Đã hủy" },
  ];

  const statusCounts = useMemo(() => ({
    all: receipts.length,
    pending: receipts.filter((item) => ["PENDING", "PO"].includes(item.status)).length,
    completed: receipts.filter((item) => ["APPROVED", "COMPLETED", "IMPORTED"].includes(item.status)).length,
    cancelled: receipts.filter((item) => ["CANCELLED", "REJECTED"].includes(item.status)).length,
  }), [receipts]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const displayData = filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const confirmDelete = async () => {
    if (!deleteReceipt) return;
    try {
      await InventoryApiService.deleteReceipt(String(deleteReceipt.id));
      toast.success(`Đã xóa phiếu ${deleteReceipt.code}`);
      await fetchReceipts();
    } catch (error) {
      toast.error(getErrorMessage(error as AxiosError));
    } finally {
      setDeleteReceipt(null);
    }
  };

  return (
    <div className="space-y-4 px-1 pb-8">
      <div className="mb-8 mt-2 space-y-4">
        <h1 className="text-[20px] font-semibold uppercase text-slate-900">Quản lý phiếu nhập</h1>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:max-w-[540px]">
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger className="h-[38px] border-slate-200 bg-white text-[13px] shadow-none">
                <SelectValue placeholder="Tất cả kho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả kho</SelectItem>
                {warehouseOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="h-[38px] border-slate-200 bg-white text-[13px] shadow-none"
            />
          </div>
          <Button
            className="h-[38px] bg-emerald-600 px-4 text-[13px] font-medium hover:bg-emerald-700"
            onClick={() => router.push("/admin/receipts/select-request")}
          >
            <Plus size={16} className="mr-2" />
            Thêm phiếu nhập
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          {[
            { title: "Tổng phiếu nhập", value: receipts.length, description: "Toàn bộ phiếu nhập đã lập" },
            { title: "Tổng giá trị nhập", value: `${formatNumber(summary.totalValue)} ₫`, description: "Không tính phiếu đã hủy" },
            { title: "Công nợ còn lại", value: `${formatNumber(summary.totalDebt)} ₫`, description: "Số tiền còn phải thanh toán" },
            { title: "Đang chờ duyệt", value: summary.pending, description: "Phiếu cần tiếp tục xử lý" },
          ].map((card) => (
            <div key={card.title} className="rounded-[4px] border border-[#dcdcdc] bg-white p-3 shadow-sm">
              <p className="text-[11px] font-semibold text-slate-400">{card.title}</p>
              <div className="mt-3 space-y-1">
                <p className="text-[20px] font-semibold leading-none text-slate-900">{card.value}</p>
                <p className="text-[10px] leading-4 text-slate-500">{card.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                className={cn(
                  "h-[34px] rounded-[4px] border px-3 text-[12px] font-medium transition-colors",
                  selectedStatus === tab.id
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                )}
              >
                {tab.label}
                <span className="ml-2 text-[11px] text-slate-400">
                  {(statusCounts as Record<string, number>)[tab.id] ?? 0}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2">
          <div className="relative w-full xl:max-w-[380px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm mã phiếu, nhà cung cấp..."
              className="h-[38px] border-slate-200 bg-white pl-10 text-[13px] shadow-none"
            />
          </div>
          <Button type="button" variant="outline" size="icon" className="h-[38px] w-[38px]" onClick={() => void fetchReceipts()} disabled={isLoading}>
            <RefreshCcw size={15} className={isLoading ? "animate-spin" : ""} />
          </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
        {isLoading ? (
          <AdminDataSyncLoader />
        ) : displayData.length > 0 ? (
          <InventoryReceiptTable
            receipts={displayData}
            totalCount={filteredData.length}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            onDeleteClick={(id, code) => setDeleteReceipt({ id, code })}
          />
        ) : (
          <div className="py-16 text-center text-[12px] text-slate-400">Không có phiếu nhập phù hợp bộ lọc</div>
        )}
      </div>

      <AlertDialog open={Boolean(deleteReceipt)} onOpenChange={(open) => !open && setDeleteReceipt(null)}>
        <AlertDialogContent className="max-w-[420px] rounded-[4px] border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-[16px] font-semibold text-slate-900">
              <AlertCircle size={18} className="text-rose-500" />
              Xóa phiếu nhập
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] text-slate-500">
              Phiếu {deleteReceipt?.code} sẽ bị xóa và không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 text-[12px] font-medium">Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="h-9 bg-rose-600 text-[12px] font-medium hover:bg-rose-700">
              Xóa phiếu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
