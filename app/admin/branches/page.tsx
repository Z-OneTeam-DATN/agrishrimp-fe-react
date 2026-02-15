"use client";

import React, { useState, useEffect } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminBranchTable } from "@/components/admin/AdminBranchTable";
import { BranchService } from "@/app/services/branchService";
import { toast } from "sonner";
import { Loader2, AlertTriangle, AlertCircle } from "lucide-react";
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

const statusFilters = [
  { label: "Tất cả trạng thái", value: "all" },
  { label: "Đang hoạt động", value: "ACTIVE" },
  { label: "Ngừng hoạt động", value: "INACTIVE" },
];

export default function BranchManagementPage() {
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State để quản lý AlertDialog xóa
  const [deleteBranch, setDeleteBranch] = useState<{id: number, name: string} | null>(null);

  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      const res = await BranchService.getAll();
      setBranches(res.data);
    } catch (error: any) {
      toast.error("Không thể kết nối đến máy chủ");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  // Hàm xử lý khi người dùng đồng ý xóa trên Dialog
  const confirmDelete = async () => {
    if (!deleteBranch) return;

    try {
      await BranchService.delete(deleteBranch.id);
      toast.success(`Đã xóa chi nhánh "${deleteBranch.name}" thành công!`);
      fetchBranches(); // Reload danh sách
    } catch (error: any) {
      const msg = error.response?.data?.message || "Không thể xóa chi nhánh có dữ liệu giao dịch!";
      toast.error(msg);
    } finally {
      setDeleteBranch(null);
    }
  };

  return (
    <div className="space-y-3">
      <AdminPageHeader
        title="Hệ thống chi nhánh & Kho hàng"
        addBtnLabel="Thêm chi nhánh"
        addBtnHref="/admin/branches/add"
      />

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm overflow-hidden mb-8">
        <AdminSearchFilter
          placeholder="Tìm tên, mã chi nhánh, người phụ trách..."
          filter2Placeholder="Trạng thái vận hành"
          filter2Options={statusFilters}
          onRefresh={fetchBranches}
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white">
            <Loader2 className="h-8 w-8 animate-spin mb-3 text-emerald-600" />
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Đang đồng bộ dữ liệu...</p>
          </div>
        ) : branches.length > 0 ? (
          <AdminBranchTable
            branches={branches}
            onDeleteClick={(id, name) => setDeleteBranch({id, name})} // Mở dialog
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white text-slate-400">
            <AlertTriangle className="mb-2 opacity-20" size={40} />
            <p className="text-xs font-bold uppercase">Chưa có dữ liệu chi nhánh</p>
          </div>
        )}
      </div>

      {/*AlertDialog xác nhận xóa giống Category */}
      <AlertDialog open={!!deleteBranch} onOpenChange={() => setDeleteBranch(null)}>
        <AlertDialogContent className="bg-white rounded-[6px] border border-slate-200 shadow-xl max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 font-bold text-[16px] uppercase tracking-tight flex items-center gap-2">
              <AlertCircle size={20} /> Xác nhận xóa chi nhánh
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 text-[13px]">
              Bạn có chắc chắn muốn xóa chi nhánh <span className="font-bold text-slate-900">"{deleteBranch?.name}"</span>? <br />

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