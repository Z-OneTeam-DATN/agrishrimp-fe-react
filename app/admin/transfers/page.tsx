"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminTransferTable } from "@/components/admin/AdminTransferTable";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { apiJava } from "@/lib/axios";
import { toast } from "sonner";
import {
  Loader2,
  AlertCircle,
  RefreshCcw,
  ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
};

type WarehouseOption = {
  label: string;
  value: string;
};

export default function AdminTransferListPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [transfers, setTransfers] = useState<TransferRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTransfer, setDeleteTransfer] = useState<{
    id: string;
    code: string;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

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
    } catch (error: any) {
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

  const filteredData = useMemo(() => {
    return transfers.filter((item) => {
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

      if (!matchTab) return false;

      if (selectedWarehouse !== "all") {
        const from = item.fromBranchName || item.sourceBranchName || "";
        const to = item.toBranchName || item.destBranchName || "";
        if (from !== selectedWarehouse && to !== selectedWarehouse) return false;
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
  }, [transfers, activeTab, searchQuery, selectedWarehouse]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedWarehouse, transfers.length]);

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const displayData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const hasActiveFilters =
    activeTab !== "all" || selectedWarehouse !== "all" || !!searchQuery.trim();
  const emptyMessage =
    transfers.length === 0 && !hasActiveFilters
      ? "Chưa có lệnh điều chuyển nào"
      : "Không có dữ liệu phù hợp";

  const tabs = [
    { id: "all", label: "TẤT CẢ" },
    { id: "pending", label: "CHỜ DUYỆT" },
    { id: "approved", label: "ĐÃ DUYỆT" },
    { id: "shipping", label: "ĐANG CHUYỂN" },
    { id: "completed", label: "HOÀN THÀNH" },
    { id: "cancelled", label: "ĐÃ HỦY" },
  ];

  const counts = useMemo(() => {
    const s = (status: string) => (status || "").toUpperCase();
    return {
      all: transfers.length,
      pending: transfers.filter((t) => s(t.status || "") === "PENDING").length,
      approved: transfers.filter((t) => s(t.status || "") === "APPROVED").length,
      shipping: transfers.filter((t) => {
        const currentStatus = s(t.status || "");
        return currentStatus === "SHIPPING" || currentStatus === "TRANSIT";
      }).length,
      completed: transfers.filter((t) => s(t.status || "") === "COMPLETED").length,
      cancelled: transfers.filter((t) => {
        const currentStatus = s(t.status || "");
        return currentStatus === "CANCELLED" || currentStatus === "REJECTED";
      }).length,
    };
  }, [transfers]);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] -m-4 md:-m-5 bg-[#f8f9fa] overflow-hidden">
      <div className="bg-white border-b shrink-0">
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-[16px] font-black uppercase tracking-tight text-slate-700 flex items-center gap-2">
              <ArrowLeftRight className="text-slate-400" size={18} />
              Danh sách điều chuyển hàng hóa
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <AdminPageHeader
              title=""
              addBtnLabel="Lập lệnh điều chuyển"
              addBtnHref="/admin/transfers/new"
            />
          </div>
        </div>

        <div className="px-6 flex items-center h-[48px] gap-8">
          {tabs.map((tab) => {
            const hasItems = (counts as Record<string, number>)[tab.id] > 0;
            const showRedDot = (tab.id === "pending" || tab.id === "approved") && hasItems;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "h-full text-[12px] font-black border-b-2 px-1 tracking-wider transition-all relative",
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-400 hover:text-slate-600",
                )}
              >
                {tab.label}
                {showRedDot && (
                  <span className="absolute top-2 -right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                )}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col min-h-0">
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between pr-4 bg-slate-50/50 border-b shrink-0">
            <div className="flex-1">
              <AdminSearchFilter
                placeholder="Tìm mã lệnh, chi nhánh..."
                filter1Placeholder="Lọc theo kho"
                filter1Options={warehouseOptions}
                onRefresh={fetchTransfers}
                onSearch={setSearchQuery}
                onFilter1Change={setSelectedWarehouse}
                hideFilter2={true}
                hideSort={true}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={fetchTransfers} disabled={isLoading}>
              <RefreshCcw size={16} className={cn(isLoading && "animate-spin")} />
            </Button>
          </div>

          <div className="flex-1 min-h-0 bg-white relative">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
                <Loader2 className="h-8 w-8 animate-spin mb-3 text-blue-600" />
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 text-center px-10">
                  Đang truy xuất dữ liệu vận chuyển...
                </p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <div className="bg-slate-50 p-4 rounded-full mb-3">
                  <ArrowLeftRight className="opacity-20" size={40} />
                </div>
                <p className="text-xs font-bold uppercase tracking-tight">
                  {emptyMessage}
                </p>
              </div>
            ) : (
              <AdminTransferTable
                data={displayData}
                totalCount={totalItems}
                currentPage={currentPage}
                totalPages={totalPages}
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
      </div>

      <AlertDialog open={!!deleteTransfer} onOpenChange={() => setDeleteTransfer(null)}>
        <AlertDialogContent className="bg-white rounded-[6px] border border-slate-200 shadow-xl max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 font-bold text-[16px] uppercase tracking-tight flex items-center gap-2">
              <AlertCircle size={20} /> Xác nhận xóa lệnh điều chuyển
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 text-[13px]">
              Bạn có chắc chắn muốn xóa lệnh{" "}
              <span className="font-bold text-slate-900">"{deleteTransfer?.code}"</span>?
              <br />
              <span className="text-[11px] text-rose-500 font-medium italic">
                *Hành động này không thể hoàn tác.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-[32px] text-[12px] font-bold border-slate-300 rounded-[3px]">
              HỦY BỎ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white h-[32px] text-[12px] font-bold rounded-[3px]"
            >
              ĐỒNG Ý XÓA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
