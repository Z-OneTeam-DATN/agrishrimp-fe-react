"use client";

import React from "react";
import { Pencil, Trash2, Phone, ShieldCheck, MapPin, Calendar, User as UserIcon } from "lucide-react";
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
  const [deleteId, setDeleteId] = React.useState<number | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await EmployeeService.delete(deleteId);
      toast.success("Xóa nhân viên thành công");
      onRefresh?.();
    } catch (error) {
      toast.error("Không thể xóa nhân viên này.");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

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
            <TableHead className="w-[100px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pr-4">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((emp) => (
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
                  <div className="text-[10px] text-slate-400 font-medium italic">CCCD: {emp.citizenId}</div>
                </div>
              </TableCell>
              <TableCell className="p-2">
                <div className="flex flex-col">
                  <span className="text-[12px] font-bold text-emerald-600 uppercase tracking-tighter">{emp.branchName}</span>
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1"><Calendar size={10} /> {new Date(emp.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </TableCell>
              <TableCell className="p-2">
                <span className="bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 w-fit uppercase tracking-tight whitespace-nowrap shadow-none">
                  <ShieldCheck size={10} className="text-emerald-500" /> {emp.roleName}
                </span>
              </TableCell>
              <TableCell className="p-2 text-center">
                <span className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded border tracking-tight uppercase whitespace-nowrap",
                  emp.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                )}>
                  {emp.status === "ACTIVE" ? "Hoạt động" : "Tạm khóa"}
                </span>
              </TableCell>
              <TableCell className="p-2 text-right pr-4">
                <div className="flex justify-end gap-1">
                  <Link href={`/admin/employees/edit/${emp.id}`}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100">
                      <Pencil size={14} className="text-blue-600" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-rose-50" onClick={() => setDeleteId(emp.id)}>
                    <Trash2 size={14} className="text-rose-600" />
                  </Button>
                </div>
              </TableCell>
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

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-[4px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px] font-bold uppercase">Xác nhận xóa tài khoản</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px]">
              Bạn có chắc chắn muốn xóa vĩnh viễn nhân viên này khỏi hệ thống không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 text-[11px] font-bold uppercase">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete(); }} className="h-9 text-[11px] font-bold uppercase bg-rose-600 text-white" disabled={isDeleting}>
              {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
