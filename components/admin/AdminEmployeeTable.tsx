"use client";

import React from "react";
import { Pencil, Trash2, Mail, Phone, ChevronLeft, ChevronRight, ShieldCheck, MapPin, Calendar } from "lucide-react";
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

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  branchName: string;
  address: string;
  role: string;
  joinDate: string;
  status: string;
  avatarLabel: string;
}

interface AdminEmployeeTableProps {
  employees: Employee[];
}

export function AdminEmployeeTable({ employees }: AdminEmployeeTableProps) {
  return (
    <div className="w-full">
      <Table className="table-custom border-collapse min-w-[1100px]">
        <TableHeader>
          <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
            <TableHead className="w-[40px] text-center p-2"><Checkbox className="h-3.5 w-3.5" /></TableHead>
            <TableHead className="w-[80px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pl-4">Mã NV</TableHead>
            <TableHead className="font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Họ tên & Ngày vào làm</TableHead>
            <TableHead className="w-[220px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Liên hệ & Địa chỉ</TableHead>
            <TableHead className="w-[180px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Nơi công tác</TableHead>
            <TableHead className="w-[140px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Phân quyền</TableHead>
            <TableHead className="w-[110px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Tài khoản</TableHead>
            <TableHead className="w-[80px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pr-4">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((emp) => (
            <TableRow key={emp.id} className="hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors">
              <TableCell className="text-center p-2"><Checkbox className="h-3.5 w-3.5" /></TableCell>
              <TableCell className="text-[12px] font-bold text-slate-500 pl-4">#{emp.id}</TableCell>
              <TableCell className="p-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-[10px] font-bold border border-slate-200">
                    {emp.avatarLabel}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-slate-800 uppercase tracking-tighter">{emp.name}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                      <Calendar size={10} /> {emp.joinDate}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="p-2">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-bold">
                    <Phone size={10} className="text-slate-400" /> {emp.phone}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                    <MapPin size={10} className="text-slate-300" /> {emp.address}
                  </div>
                </div>
              </TableCell>
              <TableCell className="p-2">
                <div className="flex flex-col">
                  <span className="text-[12px] font-bold text-emerald-600">{emp.branchName}</span>
                  <span className="text-[10px] text-slate-400 font-medium italic">Hệ thống AgriShrimp</span>
                </div>
              </TableCell>
              <TableCell className="p-2">
                <span className="bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 w-fit uppercase tracking-tight whitespace-nowrap shadow-none">
                  <ShieldCheck size={10} className="text-emerald-500" /> {emp.role}
                </span>
              </TableCell>
              <TableCell className="p-2">
                <span className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded border tracking-tight uppercase whitespace-nowrap",
                  emp.status === "Đang hoạt động" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                )}>
                  {emp.status}
                </span>
              </TableCell>
              <TableCell className="p-2 text-right pr-4">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100">
                    <Pencil size={14} className="text-blue-600" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-rose-50">
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
          Tổng số {employees.length} nhân sự
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