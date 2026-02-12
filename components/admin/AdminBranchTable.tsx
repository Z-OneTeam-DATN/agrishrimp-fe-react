"use client";

import React from "react";
import { Building2, Pencil, Trash2, Phone, Mail, ChevronLeft, ChevronRight, MapPin, UserCheck } from "lucide-react";
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

interface Branch {
  id: string;
  name: string;
  type: string;
  manager: string;
  managerId: string;
  phone: string;
  email: string;
  province: string;
  district: string;
  ward: string;
  addressDetail: string;
  status: string;
  avatar: string;
}

interface AdminBranchTableProps {
  branches: Branch[];
}

export function AdminBranchTable({ branches }: AdminBranchTableProps) {
  return (
    <div className="w-full">
      <Table className="table-custom border-collapse min-w-[1100px]">
        <TableHeader>
          <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
            <TableHead className="w-[40px] text-center p-2"><Checkbox className="h-3.5 w-3.5" /></TableHead>
            <TableHead className="w-[80px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pl-4">Mã CN</TableHead>
            <TableHead className="font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Thông tin chi nhánh & Vị trí</TableHead>
            <TableHead className="w-[150px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 text-center text-slate-500">Loại hình kho</TableHead>
            <TableHead className="w-[220px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Người phụ trách</TableHead>
            <TableHead className="w-[200px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Liên hệ hệ thống</TableHead>
            <TableHead className="w-[120px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Vận hành</TableHead>
            <TableHead className="w-[80px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pr-4">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {branches.map((branch) => {
            const isHQ = branch.type === "Kho trung tâm";
            
            return (
              <TableRow 
                key={branch.id} 
                className={cn(
                  "hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors cursor-pointer",
                  isHQ && "bg-amber-50/40 hover:bg-amber-50/60"
                )}
              >
                <TableCell className="text-center p-2"><Checkbox className="h-3.5 w-3.5" /></TableCell>
                <TableCell className="p-2 pl-4 text-[12px] font-bold text-slate-500">#{branch.id}</TableCell>
                <TableCell className="p-2">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded flex items-center justify-center border",
                      isHQ ? "bg-amber-100 text-amber-700 border-amber-200 shadow-sm" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                    )}>
                      <Building2 size={16}/>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[13px] font-black tracking-tight",
                          isHQ ? "text-amber-900" : "text-slate-800 uppercase"
                        )}>{branch.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium mt-0.5">
                        <MapPin size={10} className="text-slate-300" /> {branch.addressDetail}, {branch.ward}, {branch.district}, {branch.province}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="p-2 text-center">
                   <span className={cn(
                     "text-[10px] font-black px-2 py-0.5 rounded-none border uppercase tracking-tighter",
                     isHQ ? "bg-amber-600 text-white border-amber-700" : "bg-slate-50 text-slate-500 border-slate-200"
                   )}>
                     {branch.type}
                   </span>
                </TableCell>
                <TableCell className="p-2">
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-[10px] border border-slate-200 uppercase">
                      {branch.avatar}
                     </div>
                     <div className="flex flex-col">
                       <span className="text-[12px] font-bold text-slate-700 leading-none">{branch.manager}</span>
                       <span className="text-[10px] text-slate-400 mt-1 font-medium flex items-center gap-1">
                         <UserCheck size={10} /> {branch.managerId}
                       </span>
                     </div>
                  </div>
                </TableCell>
                <TableCell className="p-2">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-bold">
                      <Phone size={10} className="text-slate-400" /> {branch.phone}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                      <Mail size={10} className="text-slate-400" /> {branch.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="p-2">
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded border tracking-tight uppercase whitespace-nowrap",
                    branch.status === "Đang hoạt động" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                    branch.status === "Đang bảo trì" ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-rose-50 text-rose-600 border-rose-100"
                  )}>
                    {branch.status}
                  </span>
                </TableCell>
                <TableCell className="p-2 text-right pr-4">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100">
                      <Pencil size={14} className="text-blue-600" />
                    </Button>
                    {!isHQ && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-rose-50">
                        <Trash2 size={14} className="text-rose-600" />
                      </Button>
                    )}
                    {isHQ && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-20 cursor-not-allowed" disabled title="Không thể xóa kho tổng">
                        <Trash2 size={14} className="text-slate-400" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between px-3 py-2 border-t border-[#eee] bg-[#f8f9fa]">
        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
          Tổng số {branches.length} chi nhánh & kho hàng
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] font-bold bg-white border-[#ddd]">Trước</Button>
          <Button variant="outline" size="sm" className="h-6 w-6 p-0 text-[10px] bg-emerald-600 text-white border-emerald-600 font-bold">1</Button>
          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] font-bold bg-white border-[#ddd]">Sau</Button>
        </div>
      </div>
    </div>
  );
}
