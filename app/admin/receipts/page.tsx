"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { InventoryReceiptTable } from "@/components/inventory/InventoryReceiptTable";
import { InventoryApiService } from "@/app/services/inventory.service";
import { branchService } from "@/app/services/branchService";
import { toast } from "sonner";
import { Loader2, FileText, AlertCircle, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

export default function AdminReceiptListPage() {
  const [activeTab, setActiveTab] = useState("all"); 
  const [receipts, setReceipts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteReceipt, setDeleteReceipt] = useState<{id: number, code: string} | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [warehouseOptions, setWarehouseOptions] = useState<any[]>([{ label: "Tất cả kho", value: "all" }]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const fetchReceipts = async () => {
    setIsLoading(true);
    try {
      const data = await InventoryApiService.getAllReceipts();
      const rawData = Array.isArray(data) ? data : (data?.content || []);

      const formattedData = rawData.map((item: any) => {
        let displayPartner = item.supplierName;
        if (!displayPartner || displayPartner === "N/A") {
          displayPartner = item.importType === "INTERNAL" ? "[Nội bộ] Kho gửi" : "N/A";
        }

        return {
          id: item.id,
          code: item.code || item.receiptCode || `PNK-${item.id}`,
          date: item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "Chưa xác định",
          supplier: displayPartner,
          importType: item.importType,
          warehouse: item.branchName || "Kho tổng",
          total: item.totalAmount || 0,
          paid: item.paymentAmount || 0,
          debt: item.debtAmount ?? ((item.totalAmount || 0) - (item.paymentAmount || 0)),
          status: (item.status || "PENDING").toUpperCase(),
          creator: item.creatorName || item.createdByName || item.creator || "Hệ thống",
        };
      });

      setReceipts(formattedData);
    } catch (error: any) {
      toast.error("Lỗi tải danh sách phiếu nhập");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
    (async () => {
      try {
        const data = await branchService.getAll();
        const list = Array.isArray(data) ? data : (data.content || []);
        const options = list.map((b: any) => ({
          label: b.name || b.branchName,
          value: b.name || b.branchName
        }));
        setWarehouseOptions([{ label: "Tất cả kho", value: "all" }, ...options]);
      } catch (e) { console.error("Lỗi tải danh sách kho:", e); }
    })();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedWarehouse]);

  const confirmDelete = async () => {
    if (!deleteReceipt) return;
    try {
      await InventoryApiService.deleteReceipt(deleteReceipt.id.toString());
      toast.success(`Đã xóa phiếu "${deleteReceipt.code}" thành công!`);
      fetchReceipts();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleteReceipt(null);
    }
  };

  const filteredData = receipts.filter((item) => {
    let matchTab = true;
    if (activeTab === "pending") matchTab = item.status === "PENDING" || item.status === "PO";
    else if (activeTab === "completed") matchTab = item.status === "APPROVED" || item.status === "COMPLETED" || item.status === "IMPORTED";
    else if (activeTab === "cancelled") matchTab = item.status === "CANCELLED" || item.status === "REJECTED";
    if (!matchTab) return false;

    if (selectedWarehouse !== "all" && item.warehouse !== selectedWarehouse) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!item.code.toLowerCase().includes(q) && !item.supplier.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const displayData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const counts = useMemo(() => {
    return {
      all: receipts.length,
      pending: receipts.filter(r => r.status === "PENDING" || r.status === "PO").length,
      completed: receipts.filter(r => r.status === "APPROVED" || r.status === "COMPLETED" || r.status === "IMPORTED").length,
      cancelled: receipts.filter(r => r.status === "CANCELLED" || r.status === "REJECTED").length,
    };
  }, [receipts]);

  const tabs = [
    { id: "all", label: "TẤT CẢ" },
    { id: "pending", label: "CHỜ DUYỆT" },
    { id: "completed", label: "ĐÃ NHẬP KHO" },
    { id: "cancelled", label: "ĐÃ HỦY" },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] -m-4 md:-m-5 bg-[#f8f9fa] overflow-hidden">
      {/* Header Section */}
      <div className="bg-white border-b shrink-0">
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-[16px] font-black uppercase tracking-tight text-slate-700 flex items-center gap-2">
              <FileText className="text-slate-400" size={18}/>
              Danh sách phiếu nhập hàng
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <AdminPageHeader title="" addBtnLabel="Lập phiếu nhập" addBtnHref="/admin/receipts/new" />
          </div>
        </div>

        <div className="px-6 flex items-center h-[48px] gap-8">
          {tabs.map((tab) => {
            const hasItems = (counts as any)[tab.id] > 0;
            const showRedDot = tab.id === "pending" && hasItems;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "h-full text-[12px] font-black border-b-2 px-1 tracking-wider transition-all relative",
                  activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                {tab.label}
                {showRedDot && (
                  <span className="absolute top-2 -right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                )}
                {activeTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600"></span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 flex flex-col min-h-0">
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col h-full overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between pr-4 bg-slate-50/50 border-b shrink-0">
            <div className="flex-1">
              <AdminSearchFilter
                placeholder="Tìm mã phiếu, nhà cung cấp..."
                filter1Placeholder="Lọc theo kho"
                filter1Options={warehouseOptions}
                onRefresh={fetchReceipts}
                onSearch={setSearchQuery}
                onFilter1Change={setSelectedWarehouse}
                hideFilter2={true}
                hideSort={true}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={fetchReceipts} disabled={isLoading}>
              <RefreshCcw size={16} className={cn(isLoading && "animate-spin")} />
            </Button>
          </div>

          {/* Table Container */}
          <div className="flex-1 min-h-0 bg-white relative">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
                <Loader2 className="h-8 w-8 animate-spin mb-3 text-blue-600" />
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 text-center px-10">Đang đồng bộ dữ liệu AgriShrimp...</p>
              </div>
            ) : displayData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <div className="bg-slate-50 p-4 rounded-full mb-3"><FileText className="opacity-20" size={40} /></div>
                <p className="text-xs font-bold uppercase tracking-tight">Không có dữ liệu phù hợp</p>
              </div>
            ) : (
              <InventoryReceiptTable
                 receipts={displayData}
                 totalCount={totalItems}
                 currentPage={currentPage}
                 totalPages={totalPages}
                 onPageChange={setCurrentPage}
                 onDeleteClick={(id, code) => setDeleteReceipt({id, code})}
              />
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteReceipt} onOpenChange={() => setDeleteReceipt(null)}>
        <AlertDialogContent className="bg-white rounded-[6px] border border-slate-200 shadow-xl max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 font-bold text-[16px] uppercase tracking-tight flex items-center gap-2">
              <AlertCircle size={20} /> Xác nhận xóa phiếu tạm
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 text-[13px]">
              Bạn có chắc chắn muốn xóa phiếu nhập <span className="font-bold text-slate-900">"{deleteReceipt?.code}"</span>? <br />
              <span className="text-[11px] text-rose-500 font-medium italic">*Hành động này không thể hoàn tác.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-[32px] text-[12px] font-bold border-slate-300 rounded-[3px]">HỦY BỎ</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white h-[32px] text-[12px] font-bold rounded-[3px]">ĐỒNG Ý XÓA</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
