"use client";

import React from "react";
import { Pencil, Trash2, Shield } from "lucide-react";
import Link from "next/link";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

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
  onPageChange 
}: AdminRoleTableProps) {
  const [deleteId, setDeleteId] = React.useState<number | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      setIsDeleting(true);
      await RoleService.delete(deleteId);
      toast.success("Xóa vai trò thành công");
      onRefresh?.();
    } catch (error: any) {
      const status = error.response?.status;
      if (status === 403) {
        toast.error("Không được phép xóa vai trò mặc định của hệ thống.");
      } else if (status === 404) {
        toast.error("Vai trò này đã bị xóa hoặc không tồn tại.");
        onRefresh?.();
      } else if (status === 409) {
        toast.error("Không thể xóa vai trò đang có nhân viên đảm nhiệm. Vui lòng chuyển đổi vai trò cho nhân viên trước.");
      } else {
        toast.error("Có lỗi xảy ra, vui lòng thử lại sau");
      }
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const totalPages = Math.ceil(totalElements / pageSize);

  return (
    <div className="w-full">
      <Table className="table-custom border-collapse min-w-[1000px]">
        <TableHeader>
          <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
            <TableHead className="w-[40px] text-center p-2"><Checkbox className="h-3.5 w-3.5" /></TableHead>
            <TableHead className="w-[100px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pl-4">ID</TableHead>
            <TableHead className="font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Tên vai trò & Mô tả</TableHead>
            <TableHead className="w-[180px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 text-center">Trạng thái</TableHead>
            <TableHead className="w-[180px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 text-center">Loại</TableHead>
            <TableHead className="w-[100px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pr-4">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(roles || []).map((role) => (
            <TableRow key={role.id} className="hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors">
              <TableCell className="text-center p-2"><Checkbox className="h-3.5 w-3.5" /></TableCell>
              <TableCell className="text-[12px] font-bold text-slate-500 pl-4">#{role.id}</TableCell>
              <TableCell className="p-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-[10px] font-bold border border-slate-200 uppercase">
                    {(role.displayName || role.slug || "??").substring(0, 2)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-slate-800 uppercase tracking-tighter">{role.displayName || role.slug}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium italic">
                      {role.slug} • {role.description || "Không có mô tả"}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="p-2 text-center">
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-tight",
                  role.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                )}>
                  {role.isActive ? "Đang hoạt động" : "Tạm ngưng"}
                </span>
              </TableCell>
              <TableCell className="p-2 text-center">
                <div className="flex flex-col">
                  <span className={cn(
                    "text-[11px] font-bold",
                    role.isSystem ? "text-amber-600" : "text-blue-600"
                  )}>
                    {role.isSystem ? "HỆ THỐNG" : "TÙY CHỈNH"}
                  </span>
                </div>
              </TableCell>
              <TableCell className="p-2 text-right pr-4">
                <div className="flex justify-end gap-1">
                  <Link href={role.isSystem ? "#" : `/admin/employees/roles/edit/${role.id}`}>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={cn(
                        "h-7 w-7",
                        role.isSystem ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-100"
                      )}
                      disabled={role.isSystem}
                    >
                      <Pencil size={14} className={role.isSystem ? "text-slate-400" : "text-blue-600"} />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "h-7 w-7",
                      role.isSystem ? "opacity-30 cursor-not-allowed" : "hover:bg-rose-50"
                    )}
                    disabled={role.isSystem}
                    onClick={() => setDeleteId(role.id)}
                  >
                    <Trash2 size={14} className={role.isSystem ? "text-slate-400" : "text-rose-600"} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-[4px] border-[#dcdcdc]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px] font-bold uppercase tracking-tight">Xác nhận xóa vai trò</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] text-slate-500">
              Bạn có chắc chắn muốn xóa vai trò này không? Hành động này không thể hoàn tác và sẽ ảnh hưởng đến việc phân quyền nhân sự.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 text-[11px] font-bold uppercase rounded-[4px]">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="h-9 text-[11px] font-bold uppercase bg-rose-600 hover:bg-rose-700 text-white rounded-[4px]"
              disabled={isDeleting}
            >
              {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between px-3 py-2 border-t border-[#eee] bg-[#f8f9fa]">
        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
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
          <Button variant="outline" size="sm" className="h-6 min-w-[24px] px-1 text-[10px] bg-emerald-600 text-white border-emerald-600 font-bold">
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
