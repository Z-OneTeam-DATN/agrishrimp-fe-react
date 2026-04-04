"use client";

import React from "react";
import { Pencil, Trash2, Phone, ShieldCheck, MapPin, Calendar, User as UserIcon, Mail } from "lucide-react";
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
import { UserResponse } from "@/app/types/employee.schema";
import { toast } from "sonner";
import { EmployeeService } from "@/app/services/employee.service";
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
  onPageChange?: (page: number) => void;
}

export function AdminEmployeeTable({ 
  employees, 
  onRefresh, 
  totalElements = 0,
  currentPage = 0,
  onPageChange
}: AdminEmployeeTableProps) {
  const { hasPermission } = usePermissions();
  const [deleteId, setDeleteId] = React.useState<number | null>(null);
  const [selectedEmployee, setSelectedEmployee] = React.useState<UserResponse | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [resendingId, setResendingId] = React.useState<number | null>(null);

  const handleResendCredentials = async (empId: number) => {
    try {
      setResendingId(empId);
      await EmployeeService.resendCredentials(empId);
      toast.success("Đã gửi lại email thông tin tài khoản.");
    } catch {
      toast.error("Không thể gửi lại email. Vui lòng thử lại.");
    } finally {
      setResendingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await EmployeeService.delete(deleteId);
      const action = selectedEmployee?.status === "INACTIVE" ? "Mở lại" : "Tạm khóa";
      toast.success(`${action} nhân viên thành công`);
      onRefresh?.();
    } catch (error) {
      toast.error("Không thể thay đổi trạng thái nhân viên này.");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
      setSelectedEmployee(null);
    }
  };

  const openDeleteDialog = (emp: UserResponse) => {
    setDeleteId(emp.id);
    setSelectedEmployee(emp);
  };

  const getDialogTitle = () => {
    if (!selectedEmployee) return "Xác nhận thay đổi trạng thái";
    return selectedEmployee.status === "INACTIVE" 
      ? "Xác nhận mở lại tài khoản"
      : "Xác nhận tạm khóa tài khoản";
  };

  const getDialogMessage = () => {
    if (!selectedEmployee) return "";
    if (selectedEmployee.status === "INACTIVE") {
      return `Bạn có chắc chắn muốn mở lại tài khoản cho nhân viên "${selectedEmployee.fullName}" không?`;
    }
    return `Bạn có chắc chắn muốn tạm khóa tài khoản nhân viên "${selectedEmployee.fullName}" không?`;
  };

  const getButtonText = () => {
    if (!selectedEmployee) return "Xác nhận";
    return selectedEmployee.status === "INACTIVE" 
      ? "Xác nhận mở lại"
      : "Xác nhận tạm khóa";
  };

  const canAction = hasPermission(P.STAFF_UPDATE) || hasPermission(P.STAFF_DELETE);

  return (
    <div className="w-full">
      <Table className="table-custom border-collapse min-w-[1100px]">
        <TableHeader>
          <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
            <TableHead className="w-[40px] text-center p-2"><Checkbox className="h-3.5 w-3.5" /></TableHead>
            <TableHead className="w-[80px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pl-4">ID</TableHead>
            <TableHead className="font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Họ tên & Email</TableHead>
            <TableHead className="w-[180px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Liên hệ & CCCD</TableHead>
            <TableHead className="w-[180px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Nơi công tác</TableHead>
            <TableHead className="w-[140px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Vai trò</TableHead>
            <TableHead className="w-[110px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 text-center">Trạng thái</TableHead>
            {canAction && <TableHead className="w-[100px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pr-4">Thao tác</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {(employees || []).map((emp) => (
            <TableRow key={emp.id} className="hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors">
              <TableCell className="text-center p-2"><Checkbox className="h-3.5 w-3.5" /></TableCell>
              <TableCell className="text-[12px] font-bold text-slate-500 pl-4">#{emp.id}</TableCell>
              <TableCell className="p-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-[10px] font-bold border border-slate-200 overflow-hidden">
                    {emp.avatarUrl ? <img src={emp.avatarUrl} className="w-full h-full object-cover" /> : <UserIcon size={16} />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-slate-800 uppercase tracking-tighter">{emp.fullName}</span>
                    <span className="text-[10px] text-slate-400 font-medium italic">{emp.email}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="p-2">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-bold">
                    <Phone size={10} className="text-slate-400" /> {emp.phoneNumber}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium italic">CCCD: {emp.citizenId || "Chưa cập nhật"}</div>
                </div>
              </TableCell>
              <TableCell className="p-2">
                <div className="flex flex-col">
                  <span className="text-[12px] font-bold text-emerald-600 uppercase tracking-tighter">{emp.branch?.name || "N/A"}</span>
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1"><Calendar size={10} /> {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString('vi-VN') : "N/A"}</span>
                </div>
              </TableCell>
              <TableCell className="p-2">
                <span className="bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 w-fit uppercase tracking-tight whitespace-nowrap shadow-none">
                  <ShieldCheck size={10} className="text-emerald-500" /> {emp.role?.displayName || "N/A"}
                </span>
              </TableCell>
              <TableCell className="p-2 text-center">
                <span className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded border tracking-tight uppercase whitespace-nowrap",
                  emp.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : emp.status === "BANNED" ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-rose-50 text-rose-600 border-rose-100"
                )}>
                  {emp.status === "ACTIVE" ? "Hoạt động" : emp.status === "BANNED" ? "Bị chặn" : "Tạm khóa"}
                </span>
              </TableCell>
              {canAction && (
                <TableCell className="p-2 text-right pr-4">
                  <div className="flex justify-end gap-1">
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
                    {hasPermission(P.STAFF_DELETE) && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-rose-50" onClick={() => openDeleteDialog(emp)}>
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
        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
          Tổng số {totalElements} nhân sự
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] font-bold bg-white border-[#ddd]" disabled={currentPage === 0} onClick={() => onPageChange?.(currentPage - 1)}>Trước</Button>
          <Button variant="outline" size="sm" className="h-6 min-w-[24px] px-1 text-[10px] bg-emerald-600 text-white border-emerald-600 font-bold">{currentPage + 1}</Button>
          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] font-bold bg-white border-[#ddd]" onClick={() => onPageChange?.(currentPage + 1)}>Sau</Button>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && (setDeleteId(null), setSelectedEmployee(null))}>
        <AlertDialogContent className="rounded-[4px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px] font-bold uppercase">{getDialogTitle()}</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px]">
              {getDialogMessage()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 text-[11px] font-bold uppercase">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete(); }} className={cn("h-9 text-[11px] font-bold uppercase text-white", selectedEmployee?.status === "INACTIVE" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700")} disabled={isDeleting}>
              {isDeleting ? "Đang xử lý..." : getButtonText()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
