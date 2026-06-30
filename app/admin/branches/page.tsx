"use client";

import React, { useState, useEffect } from "react";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminBranchTable } from "@/components/admin/AdminBranchTable";
// Đã sửa: Viết thường chữ b
import { branchService } from "@/app/services/branchService";
import { toast } from "sonner";
import { Loader2, AlertTriangle, AlertCircle, Plus } from "lucide-react";
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

import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AdminDataSyncLoader from "@/components/admin/shared/AdminDataSyncLoader";

const statusFilters = [
  { label: "Tất cả trạng thái", value: "all" },
  { label: "Đang hoạt động", value: "ACTIVE" },
  { label: "Ngừng hoạt động", value: "INACTIVE" },
];

export default function BranchManagementPage() {
  const { hasPermission } = usePermissions();
  const router = useRouter();
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State để quản lý AlertDialog xóa
  const [deleteBranch, setDeleteBranch] = useState<{id: number, name: string} | null>(null);

  useEffect(() => {
    if (!hasPermission(P.BRANCH_VIEW)) {
      router.push("/admin/forbidden");
      return;
    }
    fetchBranches();
  }, [hasPermission]);

  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      // Đã sửa: branchService chữ thường và bỏ .data
      const res = await branchService.getAll();
      setBranches(res?.content || res || []);
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
      // Đã sửa: branchService chữ thường
      await branchService.delete(deleteBranch.id);
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
      <div className="mt-2 mb-8">
        <div className="mb-4">
          <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
            Chi nhánh & kho
          </h1>
        </div>

        <AdminSearchFilter
          placeholder="Tìm tên, mã chi nhánh, người phụ trách..."
          containerClassName="bg-transparent border-b-0 px-0 pt-0"
          hideFilter1
          filter2Placeholder="Trạng thái vận hành"
          filter2Options={statusFilters}
          onRefresh={fetchBranches}
          trailingContent={
            hasPermission(P.BRANCH_CREATE) ? (
              <Link href="/admin/branches/add">
                <Button className="h-[38px] px-4 text-[14px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-all">
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm chi nhánh
                </Button>
              </Link>
            ) : null
          }
        />

        <div className="bg-white border border-[#dcdcdc] shadow-sm overflow-hidden">
          {isLoading ? (
            <AdminDataSyncLoader />
          ) : branches.length > 0 ? (
            <AdminBranchTable
              branches={branches}
              onDeleteClick={(id, name) => setDeleteBranch({id, name})}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white text-slate-400">
              <AlertTriangle className="mb-2 opacity-20" size={40} />
              <p className="text-xs font-medium uppercase">Chưa có dữ liệu chi nhánh</p>
            </div>
          )}
        </div>
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

