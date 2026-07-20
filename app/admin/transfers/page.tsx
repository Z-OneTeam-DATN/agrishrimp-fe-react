"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AdminTransferTable } from "@/components/admin/AdminTransferTable";
import { apiJava } from "@/lib/axios";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeftRight,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import AdminDataSyncLoader from "@/components/admin/shared/AdminDataSyncLoader";
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
import { getCurrentWeekRange, isDateInRange } from "@/lib/admin-date-filter";

type TransferRow = {
  id: string;
  code?: string;
  transferCode?: string;
  transferType?: string;
  status?: string;
  fromBranchName?: string;
  sourceBranchName?: string;
  toBranchName?: string;
  destBranchName?: string;
  referenceCode?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  transferDate?: string;
  deadline?: string;
};

type WarehouseOption = {
  label: string;
  value: string;
};

export default function AdminTransferListPage() {
  const defaultDateRange = useMemo(() => getCurrentWeekRange(), []);
  const [activeTab, setActiveTab] = useState("all");
  const [transfers, setTransfers] = useState<TransferRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTransfer, setDeleteTransfer] = useState<{
    id: string;
    code: string;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [fromDate, setFromDate] = useState(defaultDateRange.fromDate);
  const [toDate, setToDate] = useState(defaultDateRange.toDate);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const fetchTransfers = async () => {
    setIsLoading(true);
    try {
      const res = await apiJava.get("/transfers", {
        params: {
          keyword: searchQuery || undefined,
          status: "all",
          size: 1000,
        },
      });

      const rawData = Array.isArray(res.data) ? res.data : res.data?.content || [];
      setTransfers(rawData);
    } catch {
      toast.error("Không thể tải danh sách phiếu điều chuyển");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const warehouseOptions = useMemo<WarehouseOption[]>(() => {
    const branchNames = new Set<string>();

    transfers.forEach((item) => {
      const from = item.fromBranchName || item.sourceBranchName;
      const to = item.toBranchName || item.destBranchName;

      if (typeof from === "string" && from.trim()) branchNames.add(from.trim());
      if (typeof to === "string" && to.trim()) branchNames.add(to.trim());
    });

    return [
      { label: "Tất cả kho", value: "all" },
      ...Array.from(branchNames).map((name) => ({
        label: name,
        value: name,
      })),
    ];
  }, [transfers]);

  const confirmDelete = async () => {
    if (!deleteTransfer) return;
    try {
      await apiJava.delete(`/transfers/${deleteTransfer.id}`);
      toast.success(`Đã xóa phiếu điều chuyển "${deleteTransfer.code}"`);
      fetchTransfers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi xóa phiếu!");
    } finally {
      setDeleteTransfer(null);
    }
  };

  const baseFilteredData = useMemo(() => {
    return transfers.filter((item) => {
      if (selectedWarehouse !== "all") {
        const from = item.fromBranchName || item.sourceBranchName || "";
        const to = item.toBranchName || item.destBranchName || "";
        if (from !== selectedWarehouse && to !== selectedWarehouse) return false;
      }

      if (!isDateInRange(item.createdAt, fromDate, toDate)) {
        return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const code = (item.transferCode || item.code || "").toLowerCase();
        const from = (item.fromBranchName || item.sourceBranchName || "").toLowerCase();
        const to = (item.toBranchName || item.destBranchName || "").toLowerCase();
        if (!code.includes(q) && !from.includes(q) && !to.includes(q)) return false;
      }

      return true;
    });
  }, [transfers, searchQuery, selectedWarehouse, fromDate, toDate]);

  const filteredData = useMemo(() => {
    return baseFilteredData.filter((item) => {
      let matchTab = true;
      const status = (item.status || "").toUpperCase();

      if (activeTab === "pending") matchTab = status === "PENDING";
      else if (activeTab === "approved") matchTab = status === "APPROVED";
      else if (activeTab === "shipping") {
        matchTab = status === "SHIPPING" || status === "TRANSIT";
      } else if (activeTab === "completed") matchTab = status === "COMPLETED";
      else if (activeTab === "cancelled") {
        matchTab = status === "CANCELLED" || status === "REJECTED";
      }

      return matchTab;
    });
  }, [baseFilteredData, activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedWarehouse, fromDate, toDate, transfers.length]);

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const displayData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const hasActiveFilters =
    activeTab !== "all" || selectedWarehouse !== "all" || !!searchQuery.trim() || !!fromDate || !!toDate;
  const emptyMessage =
    transfers.length === 0 && !hasActiveFilters
      ? "Chưa có lệnh điều chuyển nào"
      : "Không có dữ liệu phù hợp";

  const tabs = [
    { id: "all", label: "Tất cả" },
    { id: "pending", label: "Chờ duyệt" },
    { id: "approved", label: "Đã duyệt" },
    { id: "shipping", label: "Đang chuyển" },
    { id: "completed", label: "Hoàn thành" },
    { id: "cancelled", label: "Đã hủy" },
  ];

  const counts = useMemo(() => {
    const s = (status: string) => (status || "").toUpperCase();
    return {
      all: baseFilteredData.length,
      pending: baseFilteredData.filter((t) => s(t.status || "") === "PENDING").length,
      approved: baseFilteredData.filter((t) => s(t.status || "") === "APPROVED").length,
      shipping: baseFilteredData.filter((t) => {
        const currentStatus = s(t.status || "");
        return currentStatus === "SHIPPING" || currentStatus === "TRANSIT";
      }).length,
      completed: baseFilteredData.filter((t) => s(t.status || "") === "COMPLETED").length,
      cancelled: baseFilteredData.filter((t) => {
        const currentStatus = s(t.status || "");
        return currentStatus === "CANCELLED" || currentStatus === "REJECTED";
      }).length,
    };
  }, [baseFilteredData]);

  const summaryCards = [
    {
      title: "Phiếu chờ duyệt",
      value: counts.pending,
      description: "Đang chờ xác nhận để tạo lệnh điều chuyển",
    },
    {
      title: "Đã duyệt",
      value: counts.approved,
      description: "Sẵn sàng xuất kho hoặc bàn giao cho vận chuyển",
    },
    {
      title: "Đang chuyển",
      value: counts.shipping,
      description: "Hàng đang trên đường tới kho hoặc chi nhánh nhận",
    },
    {
      title: "Hoàn thành",
      value: counts.completed,
      description: "Phiếu đã nhận đủ và hoàn tất điều chuyển",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="mt-2 mb-8 space-y-4 px-1">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
              Danh sách điều chuyển hàng hóa
            </h1>
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="w-full xl:max-w-[260px]">
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger className="h-[38px] w-full rounded-md border-slate-200 bg-white text-[13px] shadow-none focus:ring-0">
                <SelectValue placeholder="Lọc theo kho" />
              </SelectTrigger>
              <SelectContent>
                {warehouseOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              className="h-[38px] bg-blue-600 px-4 text-[13px] font-medium text-white shadow-sm hover:bg-blue-700"
              onClick={() => window.location.assign("/admin/transfers/new")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Lập lệnh điều chuyển
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.title}
              className="rounded-[4px] border border-[#dcdcdc] bg-white p-3 shadow-sm"
            >
              <div>
                <p className="text-[11px] font-semibold text-slate-400">
                  {card.title}
                </p>
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-[22px] font-semibold leading-none tracking-tight text-slate-900">
                  {card.value}
                </p>
                <p className="text-[10px] leading-4.5 text-slate-500">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => {
              const count = (counts as Record<string, number>)[tab.id] ?? 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "h-[34px] rounded-[4px] border px-3 text-[12px] font-medium transition-colors",
                    activeTab === tab.id
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-600",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "ml-2 text-[11px]",
                      activeTab === tab.id ? "text-blue-500" : "text-slate-400",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative w-full sm:w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <Input
                placeholder="Tìm mã lệnh, chi nhánh..."
                className="h-[38px] rounded-md border-slate-200 bg-white pl-10 text-[13px] shadow-none focus-visible:ring-blue-500/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-[38px] rounded-md border-slate-200 bg-white text-[13px] shadow-none focus-visible:ring-blue-500/20 sm:w-[150px]"
            />
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-[38px] rounded-md border-slate-200 bg-white text-[13px] shadow-none focus-visible:ring-blue-500/20 sm:w-[150px]"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
          {isLoading ? (
            <AdminDataSyncLoader />
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-white py-20 text-slate-400">
              <ArrowLeftRight className="mb-2 opacity-20" size={40} />
              <p className="text-xs font-medium uppercase">{emptyMessage}</p>
            </div>
          ) : (
            <AdminTransferTable
              data={displayData}
              totalCount={totalItems}
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              selectedIds={[]}
              onSelectionChange={() => {}}
              onDelete={(id) => {
                const item = transfers.find((t) => t.id === id);
                setDeleteTransfer({
                  id,
                  code: item?.transferCode || item?.code || "N/A",
                });
              }}
            />
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteTransfer} onOpenChange={() => setDeleteTransfer(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-[6px] border border-slate-200 bg-white shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-[16px] font-bold uppercase tracking-tight text-red-600">
              <AlertCircle size={20} /> Xác nhận xóa lệnh điều chuyển
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] text-slate-600">
              Bạn có chắc chắn muốn xóa lệnh{" "}
              <span className="font-bold text-slate-900">"{deleteTransfer?.code}"</span>?
              <br />
              <span className="text-[11px] font-medium italic text-rose-500">
                *Hành động này không thể hoàn tác.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-[32px] rounded-[3px] border-slate-300 text-[12px] font-bold">
              HỦY BỎ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="h-[32px] rounded-[3px] bg-red-600 text-[12px] font-bold text-white hover:bg-red-700"
            >
              ĐỒNG Ý XÓA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
