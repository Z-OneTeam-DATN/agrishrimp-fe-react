"use client";

import React, { useState, useEffect } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { InventoryReceiptTable } from "@/components/inventory/InventoryReceiptTable";
import { InventoryApiService } from "@/app/services/inventory.service";
import { toast } from "sonner";
import { Loader2, FileText, AlertCircle, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

const warehouseFilters = [
  { label: "Tất cả kho", value: "all" },
  { label: "Kho Tổng (Trụ sở)", value: "tong" },
  { label: "Kho Sóc Trăng", value: "soc-trang" },
  { label: "Kho Bạc Liêu", value: "bac-lieu" },
];

export default function AdminReceiptListPage() {
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "history"
  const [receipts, setReceipts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteReceipt, setDeleteReceipt] = useState<{id: number, code: string} | null>(null);

  const fetchReceipts = async () => {
    setIsLoading(true);
    try {
      const data = await InventoryApiService.getAllReceipts();
      const rawData = Array.isArray(data) ? data : (data?.content || []);

      const formattedData = rawData.map((item: any) => {
        // LOGIC: Nếu không có supplierName (hoặc là N/A) và là phiếu nội bộ, hiện tên kho nguồn
        let displayPartner = item.supplierName;
        if (!displayPartner || displayPartner === "N/A") {
          displayPartner = item.importType === "INTERNAL" ? "[Nội bộ] Kho điều chuyển" : "N/A";
        }

        return {
          id: item.id,
          code: item.code || `PNK-${item.id}`,
          date: item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "Chưa xác định",
          supplier: displayPartner,
          importType: item.importType,
          warehouse: item.branchName || "Kho mặc định",
          total: item.totalAmount || 0,
          paid: item.paymentAmount || 0,
          debt: item.debtAmount || 0,
          status: item.status || "PENDING", // Trả về PENDING hoặc COMPLETED từ backend
          creator: item.deliverer || "Hệ thống",
        };
      });

      setReceipts(formattedData);
    } catch (error: any) {
      toast.error("Không thể kết nối đến máy chủ để tải danh sách phiếu");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const confirmDelete = async () => {
    if (!deleteReceipt) return;
    try {
      await InventoryApiService.deleteReceipt(deleteReceipt.id.toString());
      toast.success(`Đã xóa phiếu nhập "${deleteReceipt.code}" thành công!`);
      fetchReceipts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi xóa phiếu nhập!");
    } finally {
      setDeleteReceipt(null);
    }
  };

  // 1. Lọc dữ liệu theo tab hiện tại
  const displayData = receipts.filter((item) => {
    if (activeTab === "pending") {
      return item.status === "PENDING" || item.status === "PO";
    } else {
      return item.status === "COMPLETED" || item.status === "IMPORTED";
    }
  });

  return (
    <div className="space-y-0 flex flex-col h-full -m-4 md:-m-5 bg-[#f8f9fa] min-h-screen">

      {/* 2. Phần Header (Giống mẫu Export) */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between bg-white border-b">
        <div className="flex flex-col gap-1">
          <h1 className="text-[20px] font-black uppercase tracking-tight text-slate-800 flex items-center gap-2">
            <FileText className="text-blue-600" size={24}/>
            {activeTab === "pending" ? "Quản lý đơn chờ nhập kho" : "Lịch sử phiếu nhập kho"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <AdminPageHeader
            title=""
            addBtnLabel="Tạo phiếu nhập mới"
            addBtnHref="/admin/receipts/new"
          />
        </div>
      </div>

      {/* 3. Phần Tabs (Giống mẫu Export) */}
      <div className="bg-white border-b px-6 flex items-center h-[48px] gap-8">
        {[
          { id: "pending", label: "CHỜ XỬ LÝ" },
          { id: "history", label: "LỊCH SỬ ĐÃ NHẬP" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "h-full text-[12px] font-black border-b-2 px-1 tracking-wider transition-all",
              activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Phần Content */}
      <div className="p-6 flex-1 overflow-auto">
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col min-h-[500px]">

          <div className="flex items-center justify-between pr-4 bg-slate-50/50 border-b">
            <div className="flex-1">
              <AdminSearchFilter
                placeholder="Tìm mã phiếu, nhà cung cấp..."
                filter1Placeholder="Lọc theo kho"
                filter1Options={warehouseFilters}
                onRefresh={fetchReceipts}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={fetchReceipts} disabled={isLoading}>
              <RefreshCcw size={16} className={cn(isLoading && "animate-spin")} />
            </Button>
          </div>

          <div className="flex-1 relative">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
                <Loader2 className="h-8 w-8 animate-spin mb-3 text-blue-600" />
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Đang đồng bộ dữ liệu AgriShrimp...
                </p>
              </div>
            ) : displayData.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate-400">
                <div className="bg-slate-50 p-4 rounded-full mb-3">
                  <FileText className="opacity-20" size={40} />
                </div>
                <p className="text-xs font-bold uppercase tracking-tight">Không có dữ liệu</p>
                <p className="text-[11px] mt-1 text-slate-400">
                  {activeTab === "pending"
                    ? "Hiện không có đơn nào đang chờ nhập kho."
                    : "Chưa có lịch sử nhập kho nào được ghi nhận."}
                </p>
              </div>
            ) : (
              <InventoryReceiptTable
                 receipts={displayData}
                 onDeleteClick={(id, code) => setDeleteReceipt({id, code})}
              />
            )}
          </div>
        </div>
      </div>

      {/* Popup Xóa */}
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