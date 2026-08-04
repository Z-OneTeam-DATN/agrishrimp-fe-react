"use client";

import React from "react";
import { AxiosError } from "axios";
import { Pencil, Lock, LockOpen, Phone, Calendar, User as UserIcon, Mail, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { UserResponse } from "@/app/types/employee.schema";
import { toast } from "sonner";
import { EmployeeService } from "@/app/services/employee.service";
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
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";

interface AdminEmployeeTableProps {
  employees: UserResponse[];
  onRefresh?: () => void;
  totalElements?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

const getEmployeeRoleLabel = (employee: UserResponse) => {
  if (employee.isSystemAccount) return "Quản trị viên";
  return employee.role?.displayName || "N/A";
};

export function AdminEmployeeTable({ 
  employees, 
  onRefresh, 
  totalElements = 0,
  currentPage = 0,
  pageSize = 20,
  onPageChange
}: AdminEmployeeTableProps) {
  const { hasPermission } = usePermissions();
  const [statusTarget, setStatusTarget] = React.useState<UserResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<UserResponse | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
  const [isDeletingPermanently, setIsDeletingPermanently] = React.useState(false);
  const [resendingId, setResendingId] = React.useState<number | null>(null);

  const handleResendCredentials = async (empId: number) => {
    try {
      setResendingId(empId);
      const msg = await EmployeeService.resendCredentials(empId);
      toast.success(msg || "Đã gửi lại email thông tin tài khoản.");
    } catch {
      toast.error("Không thể gửi lại email. Vui lòng thử lại.");
    } finally {
      setResendingId(null);
    }
  };

  const handleToggleStatus = async () => {
    if (!statusTarget) return;

    try {
      setIsUpdatingStatus(true);
      const nextStatus = statusTarget.status === "INACTIVE" ? "ACTIVE" : "INACTIVE";
      await EmployeeService.updateStatus(statusTarget.id, nextStatus);
      const action = statusTarget.status === "INACTIVE" ? "Mở lại" : "Tạm khóa";
      toast.success(`${action} nhân viên thành công`);
      onRefresh?.();
    } catch (error) {
      toast.error(getErrorMessage(error as AxiosError));
    } finally {
      setIsUpdatingStatus(false);
      setStatusTarget(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeletingPermanently(true);
      await EmployeeService.deletePermanently(deleteTarget.id);
      toast.success("Đã xóa vĩnh viễn nhân viên.");
      onRefresh?.();
    } catch (error) {
      toast.error(getErrorMessage(error as AxiosError));
    } finally {
      setIsDeletingPermanently(false);
      setDeleteTarget(null);
    }
  };

  const getStatusDialogTitle = () => {
    if (!statusTarget) return "Xác nhận thay đổi trạng thái";
    return statusTarget.status === "INACTIVE" 
      ? "Xác nhận mở lại tài khoản"
      : "Xác nhận tạm khóa tài khoản";
  };

  const getStatusDialogMessage = () => {
    if (!statusTarget) return "";
    if (statusTarget.status === "INACTIVE") {
      return `Bạn có chắc chắn muốn mở lại tài khoản cho nhân viên "${statusTarget.fullName}" không?`;
    }
    return `Bạn có chắc chắn muốn tạm khóa tài khoản nhân viên "${statusTarget.fullName}" không?`;
  };

  const getStatusButtonText = () => {
    if (!statusTarget) return "Xác nhận";
    return statusTarget.status === "INACTIVE" 
      ? "Xác nhận mở lại"
      : "Xác nhận tạm khóa";
  };

  const canAction = hasPermission(P.STAFF_UPDATE) || hasPermission(P.STAFF_DELETE);
  const totalPages = Math.ceil(totalElements / pageSize);

  return (
    <div className="w-full overflow-hidden border border-[#dcdcdc] bg-white shadow-sm">
      <Table className="table-custom border-collapse min-w-[1120px]">
        <TableHeader>
          <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
            <TableHead className="w-[90px] font-semibold text-[#1f1f1f] text-[12px] p-2 pl-4">STT</TableHead>
            <TableHead className="w-[300px] font-semibold text-[#1f1f1f] text-[12px] p-2">Họ tên</TableHead>
            <TableHead className="w-[220px] font-semibold text-[#1f1f1f] text-[12px] p-2">Liên hệ</TableHead>
            <TableHead className="w-[220px] font-semibold text-[#1f1f1f] text-[12px] p-2">Chi nhánh</TableHead>
            <TableHead className="w-[180px] font-semibold text-[#1f1f1f] text-[12px] p-2">Vai trò</TableHead>
            <TableHead className="w-[130px] font-semibold text-[#1f1f1f] text-[12px] p-2 text-center">Trạng thái</TableHead>
            {canAction && <TableHead className="w-[120px] text-right font-semibold text-[#1f1f1f] text-[12px] p-2 pr-4">Thao tác</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {(employees || []).map((emp, index) => (
            <TableRow key={emp.id} className="hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors">
              <TableCell className="text-[12px] font-semibold text-slate-500 pl-4">
                {currentPage * pageSize + index + 1}
              </TableCell>
              <TableCell className="p-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-[10px] font-bold border border-slate-200 overflow-hidden">
                    {emp.avatarUrl ? <img src={emp.avatarUrl} alt={emp.fullName} className="w-full h-full object-cover" /> : <UserIcon size={16} />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-medium text-slate-800">{emp.fullName}</span>
                    <span className="text-[10px] text-slate-400 font-medium not-italic">{emp.email}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="p-2">
                <div className="flex flex-col gap-0.5">
                  {emp.phoneNumber && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium not-italic">
                      <Phone size={10} className="text-slate-400" /> {emp.phoneNumber}
                    </div>
                  )}
                  {emp.citizenId && (
                    <div className="text-[10px] text-slate-400 font-medium not-italic">CCCD: {emp.citizenId}</div>
                  )}
                </div>
              </TableCell>
              <TableCell className="p-2">
                <div className="flex flex-col">
                  {emp.branch?.name && (
                    <span className="text-[12px] font-medium text-blue-600">{emp.branch.name}</span>
                  )}
                  {emp.createdAt && (
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Calendar size={10} /> {new Date(emp.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="p-2">
                <span className="text-[12px] font-medium text-slate-800">
                  {getEmployeeRoleLabel(emp)}
                </span>
              </TableCell>
              <TableCell className="p-2 text-center">
                <span className="text-[12px] font-medium text-slate-800 whitespace-nowrap">
                  {emp.status === "ACTIVE" ? "Hoạt động" : "Tạm khóa"}
                </span>
              </TableCell>
              {canAction && (
                <TableCell className="p-2 text-right pr-4">
                  <div className="flex justify-end gap-1.5">
                    {hasPermission(P.STAFF_UPDATE) && (
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 hover:bg-sky-50"
                        title="Gửi lại email tài khoản"
                        disabled={resendingId === emp.id}
                        onClick={() => handleResendCredentials(emp.id)}
                      >
                        <Mail size={14} className="text-sky-500" />
                      </Button>
                    )}
                    {hasPermission(P.STAFF_UPDATE) && (
                      <Link href={`/admin/employees/edit/${emp.id}`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100">
                          <Pencil size={14} className="text-blue-600" />
                        </Button>
                      </Link>
                    )}
                    {hasPermission(P.STAFF_DELETE) && !emp.isSystemAccount && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-7 w-7",
                          emp.status === "INACTIVE" ? "hover:bg-sky-50" : "hover:bg-rose-50",
                        )}
                        title={emp.status === "INACTIVE" ? "Mở lại tài khoản" : "Tạm khóa tài khoản"}
                        onClick={() => setStatusTarget(emp)}
                      >
                        {emp.status === "INACTIVE" ? (
                          <LockOpen size={14} className="text-sky-600" />
                        ) : (
                          <Lock size={14} className="text-rose-600" />
                        )}
                      </Button>
                    )}
                    {/* Tai khoan vai tro he thong (SUPER_ADMIN/ADMIN): backend chan moi thao tac
                        khoa/xoa vo dieu kien — an ca 2 nut. Nhan vien da phat sinh du lieu: chi
                        an rieng nut xoa vinh vien, van cho tam khoa binh thuong. */}
                    {hasPermission(P.STAFF_DELETE) && !emp.isSystemAccount && !emp.hasGeneratedData && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-rose-50"
                        title="Xóa vĩnh viễn nhân viên tạo nhầm"
                        onClick={() => setDeleteTarget(emp)}
                      >
                        <Trash2 size={14} className="text-rose-600" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between px-3 py-2 border-t border-[#eee] bg-[#f8f9fa]">
        <p className="text-[11px] text-gray-400 font-medium">
          Tổng số {totalElements} nhân sự
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] font-bold bg-white border-[#ddd] disabled:opacity-50" disabled={currentPage === 0} onClick={() => onPageChange?.(currentPage - 1)}>Trước</Button>
          <Button variant="outline" size="sm" className="h-6 min-w-[24px] px-1 text-[10px] bg-blue-600 text-white border-blue-600 font-bold">
            {currentPage + 1} / {totalPages || 1}
          </Button>
          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] font-bold bg-white border-[#ddd] disabled:opacity-50" disabled={currentPage >= totalPages - 1} onClick={() => onPageChange?.(currentPage + 1)}>Sau</Button>
        </div>
      </div>

      <AlertDialog open={!!statusTarget} onOpenChange={(open) => !open && setStatusTarget(null)}>
        <AlertDialogContent className="rounded-[4px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px] font-bold uppercase">{getStatusDialogTitle()}</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px]">
              {getStatusDialogMessage()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 text-[11px] font-bold uppercase">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleToggleStatus(); }} className={cn("h-9 text-[11px] font-bold uppercase text-white", statusTarget?.status === "INACTIVE" ? "bg-blue-600 hover:bg-blue-700" : "bg-rose-600 hover:bg-rose-700")} disabled={isUpdatingStatus}>
              {isUpdatingStatus ? "Đang xử lý..." : getStatusButtonText()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-[4px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px] font-bold uppercase">Xác nhận xóa vĩnh viễn</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px]">
              {deleteTarget
                ? `Bạn có chắc chắn muốn xóa vĩnh viễn nhân viên "${deleteTarget.fullName}" không? Chỉ nên dùng khi tạo nhầm tài khoản và tài khoản này chưa phát sinh dữ liệu.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 text-[11px] font-bold uppercase">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handlePermanentDelete(); }}
              className="h-9 bg-rose-600 text-[11px] font-bold uppercase text-white hover:bg-rose-700"
              disabled={isDeletingPermanently}
            >
              {isDeletingPermanently ? "Đang xử lý..." : "Xác nhận xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

