"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { InventoryReceiptTable } from "@/components/inventory/InventoryReceiptTable";
import { InventoryApiService } from "@/app/services/inventory.service";
import { toast } from "sonner";
import { Loader2, AlertCircle, X, Printer, CheckCircle2, Trash2, Search, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  // Thay đổi State activeTab
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "history"
  const [receipts, setReceipts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteReceipt, setDeleteReceipt] = useState<{ id: number; code: string } | null>(null);

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
          status: item.status || "PENDING", // PENDING hoặc COMPLETED
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
      // Update UI immediately without refetching for better UX
      setReceipts((prev) => prev.filter((r) => r.id !== deleteReceipt.id));
      setSelectedIds((prev) => prev.filter((id) => id !== deleteReceipt.id.toString()));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi xóa phiếu nhập!");
    } finally {
      setDeleteReceipt(null);
    }
  };

  // ✅ LOGIC LỌC DỮ LIỆU THEO TAB (Sử dụng useMemo)
  const displayData = useMemo(() => {
    return receipts.filter((item) => {
      // 1. Lọc theo Tab
      let matchesTab = false;
      if (activeTab === "pending") {
        matchesTab = item.status === "PENDING" || item.status === "PO";
      } else {
        matchesTab = item.status === "COMPLETED" || item.status === "IMPORTED";
      }

      // 2. Lọc theo Keyword (Mã phiếu hoặc Nhà cung cấp)
      let matchesKeyword = true;
      if (keyword.trim()) {
        const lowerKeyword = keyword.toLowerCase();
        matchesKeyword =
          item.code.toLowerCase().includes(lowerKeyword) ||
          item.supplier.toLowerCase().includes(lowerKeyword);
      }

      return matchesTab && matchesKeyword;
    });
  }, [receipts, activeTab, keyword]);

  // Tính toán số lượng huy hiệu cho Tabs
  const pendingCount = receipts.filter(t => t.status === "PENDING" || t.status === "PO").length;
  const historyCount = receipts.filter(t => t.status === "COMPLETED" || t.status === "IMPORTED").length;

  return (
    <div className="space-y-4">
      {/* Sử dụng Component AdminPageHeader giống mẫu */}
      <AdminPageHeader
        title="Quản lý nhập kho"
        addBtnLabel="Tạo phiếu nhập mới"
        addBtnHref="/admin/transfers/new"
        tabs={[
          {
            id: "pending",
            label: "Chờ xử lý",
            count: pendingCount,
            color: "text-amber-600",
          },
          {
            id: "history",
            label: "Lịch sử",
            count: historyCount,
            color: "text-slate-600",
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden mb-8">
        {selectedIds.length > 0 ? (
          <div className="p-3 bg-slate-900 text-white flex items-center justify-between animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-4">
              <span className="text-[12px] font-black uppercase tracking-widest">
                Đã chọn {selectedIds.length} phiếu nhập kho
              </span>
              <div className="h-4 w-[1px] bg-slate-700" />
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="h-8 text-[11px] font-bold text-white hover:bg-slate-800 uppercase tracking-tighter">
                  <Printer size={14} className="mr-1.5" /> In phiếu loạt
                </Button>
                {activeTab === "pending" && (
                  <>
                    <Button variant="ghost" className="h-8 text-[11px] font-bold text-white hover:bg-slate-800 uppercase tracking-tighter">
                      <CheckCircle2 size={14} className="mr-1.5" /> Duyệt hàng loạt
                    </Button>
                    <Button variant="ghost" className="h-8 text-[11px] font-bold text-rose-400 hover:bg-rose-900/30 uppercase tracking-tighter">
                      <Trash2 size={14} className="mr-1.5" /> Hủy hàng loạt
                    </Button>
                  </>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedIds([])} className="text-slate-400 hover:text-white">
              <X size={18} />
            </Button>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 border-b border-[#eee] flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Tìm mã phiếu, nhà cung cấp..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-9 pl-10 text-[13px] border-slate-200 focus:border-blue-500 rounded-none shadow-none bg-white"
              />
            </div>
            {/* Nếu cần Dropdown lọc kho như thiết kế cũ thì có thể đặt ở đây */}
          </div>
        )}

        <div className="relative">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center bg-white/80 z-10 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mb-3 text-blue-600" />
              <p className="text-[11px] font-black uppercase tracking-widest">
                Đang tải dữ liệu...
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
                  ? "Hiện không có đơn nào đang chờ xử lý."
                  : "Chưa có lịch sử nhập kho nào được ghi nhận."}
              </p>
            </div>
          ) : (
            // Component Table của bạn (cần nhận prop selectedIds và onSelectionChange nếu bạn đã code checkbox bên trong)
            <InventoryReceiptTable
              receipts={displayData}
              onDeleteClick={(id, code) => setDeleteReceipt({ id, code })}
            />
          )}
        </div>
      </div>

      {/* Popup Xóa Phiếu Nhập */}
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