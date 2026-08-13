"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminBranchTable } from "@/components/admin/AdminBranchTable";
// Đã sửa: Viết thường chữ b
import { branchService } from "@/app/services/branchService";
import { toast } from "sonner";
import { AlertTriangle, AlertCircle, Plus } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  const normalizeSearchText = (value: unknown) =>
    String(value || "")
      .toLocaleLowerCase("vi-VN")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const getBranchLocationName = (branch: any, key: "province" | "district" | "ward") =>
    branch?.[`${key}Name`] ?? branch?.[key] ?? "";

  const filteredBranches = useMemo(() => {
    const keyword = normalizeSearchText(searchTerm);

    return branches.filter((branch: any) => {
      const matchesStatus =
        statusFilter === "all" || branch.status === statusFilter;

      if (!matchesStatus) return false;
      if (!keyword) return true;

      const searchable = [
        branch.name,
        branch.branchCode,
        branch.phone,
        branch.email,
        branch.addressDetail,
        getBranchLocationName(branch, "province"),
        getBranchLocationName(branch, "district"),
        getBranchLocationName(branch, "ward"),
        ...(Array.isArray(branch.managerNames) ? branch.managerNames : []),
      ]
        .map(normalizeSearchText)
        .join(" ");

      return searchable.includes(keyword);
    });
  }, [branches, searchTerm, statusFilter]);

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
          hideSort
          hideRefreshButton
          filter2Placeholder="Trạng thái vận hành"
          filter2Options={statusFilters}
          defaultFilter2Value={statusFilter}
          onSearch={setSearchTerm}
          onFilter2Change={setStatusFilter}
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
          ) : filteredBranches.length > 0 ? (
            <AdminBranchTable
              branches={filteredBranches}
              onDeleteClick={(id, name) => setDeleteBranch({id, name})}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white text-slate-400">
              <AlertTriangle className="mb-2 opacity-20" size={40} />
              <p className="text-xs font-medium uppercase">
                Không tìm thấy chi nhánh phù hợp
              </p>
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

