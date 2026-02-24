"use client";

import React, { useState, useEffect } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { InventoryReceiptTable } from "@/components/inventory/InventoryReceiptTable";
import { InventoryApiService } from "@/app/services/inventory.service";
import { toast } from "sonner";
import { Loader2, FileText, AlertCircle } from "lucide-react";
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

const statusFilters = [
  { label: "Tất cả trạng thái", value: "all" },
  { label: "Đã nhập kho", value: "IMPORTED" },
  { label: "Phiếu tạm", value: "PO" },
];

export default function AdminReceiptListPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- STATE QUẢN LÝ XÓA PHIẾU ---
  const [deleteReceipt, setDeleteReceipt] = useState<{id: number, code: string} | null>(null);

  const fetchReceipts = async () => {
    setIsLoading(true);
    try {
      const data = await InventoryApiService.getAllReceipts();
      const rawData = Array.isArray(data) ? data : (data?.content || []);

      const formattedData = rawData.map((item: any) => ({
        id: item.id,
        code: item.code || `PNK-${item.id}`,
        date: item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "Chưa xác định",
        supplier: item.supplierName || "N/A",
        warehouse: item.branchName || "Kho mặc định",
        total: item.totalAmount || 0,
        paid: item.paymentAmount || 0,
        debt: item.debtAmount || 0,
        status: item.status || "PO",
        creator: item.deliverer || "Hệ thống",
      }));

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

  // --- HÀM XÁC NHẬN XÓA ---
  const confirmDelete = async () => {
    if (!deleteReceipt) return;

    try {
      await InventoryApiService.deleteReceipt(deleteReceipt.id.toString());
      toast.success(`Đã xóa phiếu nhập "${deleteReceipt.code}" thành công!`);
      fetchReceipts(); // Cập nhật lại danh sách sau khi xóa
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi xóa phiếu nhập!");
    } finally {
      setDeleteReceipt(null);
    }
  };

  return (
    <div className="space-y-3">
      <AdminPageHeader
        title="Quản lý phiếu nhập hàng"
        addBtnLabel="Tạo phiếu nhập"
        addBtnHref="/admin/receipts/new"
      />

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
        <AdminSearchFilter
          placeholder="Tìm mã phiếu, nhà cung cấp..."
          filter1Placeholder="Lọc theo kho"
          filter1Options={warehouseFilters}
          filter2Placeholder="Trạng thái"
          filter2Options={statusFilters}
          onRefresh={fetchReceipts}
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white">
            <Loader2 className="h-8 w-8 animate-spin mb-3 text-blue-600" />
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              Đang đồng bộ dữ liệu AgriShrimp...
            </p>
          </div>
        ) : receipts.length > 0 ? (
          <InventoryReceiptTable
             receipts={receipts}
             onDeleteClick={(id, code) => setDeleteReceipt({id, code})}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white text-slate-400">
            <div className="bg-slate-50 p-4 rounded-full mb-3">
              <FileText className="opacity-20" size={40} />
            </div>
            <p className="text-xs font-bold uppercase tracking-tight">Không có phiếu nhập nào</p>
            <p className="text-[11px] mt-1 text-slate-400">Vui lòng kiểm tra lại bộ lọc hoặc tạo phiếu mới</p>
          </div>
        )}
      </div>

      {/* --- HỘP THOẠI XÁC NHẬN XÓA --- */}
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