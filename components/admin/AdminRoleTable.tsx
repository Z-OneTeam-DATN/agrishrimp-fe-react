"use client";

import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/axios";

import { RoleType } from "@/app/types/role.schema";

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
import { RoleService } from "@/app/services/RoleService";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { normalizeRoleSlug } from "@/lib/roles";
import { useAuthStore } from "@/stores/useAuthStore";

interface AdminRoleTableProps {
  roles: RoleType[];
  onRefresh?: () => void;
  totalElements?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

export function AdminRoleTable({
  roles,
  onRefresh,
  totalElements = 0,
  currentPage = 0,
  pageSize = 10,
  onPageChange,
}: AdminRoleTableProps) {
  const { hasPermission } = usePermissions();
  const currentUser = useAuthStore((state) => state.user);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const isSuperAdmin = normalizeRoleSlug(currentUser?.role) === "SUPER_ADMIN";
  const canUpdateRole = hasPermission(P.ROLE_UPDATE);
  const canDeleteRole = hasPermission(P.ROLE_DELETE);

  const formatRoleName = (value?: string) => {
    const source = (value || "").trim();
    if (!source) return "Không có tên";

    const normalized = source.toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  const handleDelete = async () => {
    if (!deleteId || !canDeleteRole) return;

    try {
      setIsDeleting(true);
      await RoleService.delete(deleteId);
      toast.success("Xóa vai trò thành công");
      onRefresh?.();
    } catch (error: any) {
      const status = error.response?.status;
      const message = getErrorMessage(error);

      if (status === 403) {
        toast.error(message || "Bạn không có quyền xóa vai trò này.");
      } else if (status === 404) {
        toast.error(message || "Vai trò này đã bị xóa hoặc không tồn tại.");
        onRefresh?.();
      } else if (status === 409) {
        toast.error(
          message ||
            "Không thể xóa vai trò đang có nhân viên đảm nhiệm. Vui lòng chuyển đổi vai trò cho nhân viên trước.",
        );
      } else {
        toast.error(message || "Có lỗi xảy ra, vui lòng thử lại sau");
      }
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const totalPages = Math.ceil(totalElements / pageSize);

  return (
    <div className="w-full overflow-hidden border border-[#dcdcdc] bg-white shadow-sm">
      <Table className="table-custom border-collapse min-w-[860px]">
        <TableHeader>
          <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
            <TableHead className="w-[100px] font-semibold text-[#1f1f1f] text-[12px] p-2 pl-4">
              Stt
            </TableHead>
            <TableHead className="w-[360px] font-semibold text-[#1f1f1f] text-[12px] p-2">
              Tên vai trò
            </TableHead>
            <TableHead className="font-semibold text-[#1f1f1f] text-[12px] p-2">
              Mô tả
            </TableHead>
            <TableHead className="w-[180px] font-semibold text-[#1f1f1f] text-[12px] p-2 text-center">
              Số lượng thành viên
            </TableHead>
            <TableHead className="w-[180px] font-semibold text-[#1f1f1f] text-[12px] p-2 text-center">
              Trạng thái
            </TableHead>
            <TableHead className="w-[100px] text-right font-semibold text-[#1f1f1f] text-[12px] p-2 pr-4">
              Thao tác
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(roles || []).map((role, index) => {
            const isSuperAdminRole =
              normalizeRoleSlug(role.slug) === "SUPER_ADMIN";
            const canUpdateThisRole =
              canUpdateRole &&
              (!role.isSystem || (isSuperAdmin && !isSuperAdminRole));
            const canDeleteThisRole = canDeleteRole && !role.isSystem;

            return (
              <TableRow
                key={role.id}
                className="hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors"
              >
                <TableCell className="text-[12px] font-semibold text-slate-500 pl-4">
                  {currentPage * pageSize + index + 1}
                </TableCell>
                <TableCell className="p-2">
                  <span className="text-[14px] text-slate-800">
                    {formatRoleName(role.displayName || role.slug)}
                  </span>
                </TableCell>
                <TableCell className="p-2">
                  <span className="text-[13px] text-slate-500">
                    {role.description?.trim() || "Chưa có mô tả"}
                  </span>
                </TableCell>
                <TableCell className="p-2 text-center text-[13px] font-medium text-slate-600">
                  {role.memberCount ?? 0}
                </TableCell>
                <TableCell className="p-2 text-center text-[13px] font-medium text-slate-600">
                  {role.isActive ? "đang hoạt động" : "tạm ngưng"}
                </TableCell>
                <TableCell className="p-2 text-right pr-4">
                  <div className="flex justify-end gap-1">
                    {canUpdateRole && (
                      <Link
                        href={
                          canUpdateThisRole
                            ? `/admin/employees/roles/edit/${role.id}`
                            : "#"
                        }
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-7 w-7",
                            canUpdateThisRole
                              ? "hover:bg-slate-100"
                              : "opacity-30 cursor-not-allowed",
                          )}
                          disabled={!canUpdateThisRole}
                        >
                          <Pencil
                            size={14}
                            className={
                              canUpdateThisRole
                                ? "text-blue-600"
                                : "text-slate-400"
                            }
                          />
                        </Button>
                      </Link>
                    )}
                    {canDeleteRole && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-7 w-7",
                          canDeleteThisRole
                            ? "hover:bg-rose-50"
                            : "opacity-30 cursor-not-allowed",
                        )}
                        disabled={!canDeleteThisRole}
                        onClick={() => setDeleteId(role.id)}
                      >
                        <Trash2
                          size={14}
                          className={
                            canDeleteThisRole
                              ? "text-rose-600"
                              : "text-slate-400"
                          }
                        />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="rounded-[4px] border-[#dcdcdc]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px] font-bold uppercase tracking-tight">
              Xác nhận xóa vai trò
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] text-slate-500">
              Bạn có chắc chắn muốn xóa vai trò này không? Hành động này không
              thể hoàn tác và sẽ ảnh hưởng đến việc phân quyền nhân sự.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 text-[11px] font-bold uppercase rounded-[4px]">
              Hủy bỏ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="h-9 text-[11px] font-bold uppercase bg-rose-600 hover:bg-rose-700 text-white rounded-[4px]"
              disabled={isDeleting || !canDeleteRole}
            >
              {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between px-3 py-2 border-t border-[#eee] bg-[#f8f9fa]">
        <p className="text-[11px] text-gray-400 font-bold">
          Tìm thấy {totalElements} vai trò hệ thống
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[10px] font-bold bg-white border-[#ddd] disabled:opacity-50"
            disabled={currentPage === 0}
            onClick={() => onPageChange?.(currentPage - 1)}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 min-w-[24px] px-1 text-[10px] bg-blue-600 text-white border-blue-600 font-bold"
          >
            {currentPage + 1} / {totalPages || 1}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[10px] font-bold bg-white border-[#ddd] disabled:opacity-50"
            disabled={currentPage >= totalPages - 1}
            onClick={() => onPageChange?.(currentPage + 1)}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}
