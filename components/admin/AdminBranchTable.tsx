"use client";

import React from "react";
import { Building2, Pencil, Trash2, Phone, Mail, MapPin, UserCheck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Branch {
  id: number;
  branchCode: string;
  name: string;
  branchType: string;
  phone: string;
  email: string;
  addressDetail: string;
  status: string;
  managerNames: string[];
  managerIds: number[];
}

interface AdminBranchTableProps {
  branches: Branch[];
  onDeleteClick: (id: number, name: string) => void;
}

export function AdminBranchTable({ branches, onDeleteClick }: AdminBranchTableProps) {
  const router = useRouter();

  return (
    <div className="w-full">
      <Table className="table-custom border-collapse min-w-[1100px]">
        <TableHeader>
          <TableRow className="bg-[#f0f0f0] border-b border-[#ccc] hover:bg-[#f0f0f0]">
            {/* Loại bỏ cột Checkbox ở đây */}
            <TableHead className="w-[100px] font-bold text-[11px] uppercase p-2 pl-6 text-[#1f1f1f]">Mã CN</TableHead>
            <TableHead className="font-bold text-[11px] uppercase p-2 text-[#1f1f1f]">Thông tin & Vị trí</TableHead>
            <TableHead className="w-[140px] font-bold text-[11px] uppercase p-2 text-center text-slate-500">Phân loại</TableHead>
            <TableHead className="w-[220px] font-bold text-[11px] uppercase p-2 text-[#1f1f1f]">Quản lý</TableHead>
            <TableHead className="w-[200px] font-bold text-[11px] uppercase p-2 text-[#1f1f1f]">Liên hệ</TableHead>
            <TableHead className="w-[130px] font-bold text-[11px] uppercase p-2 text-center text-[#1f1f1f]">Trạng thái</TableHead>
            <TableHead className="w-[100px] text-right font-bold text-[11px] uppercase p-2 pr-6 text-[#1f1f1f]">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {branches.map((branch) => {
            const isHQ = branch.branchType === "hub";
            const isActive = branch.status === "ACTIVE";

            return (
              <TableRow
                key={branch.id}
                className={cn(
                  "hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors cursor-pointer",
                  isHQ && "bg-amber-50/40"
                )}
              >
                {/* Loại bỏ TableCell chứa Checkbox */}
                <TableCell className="p-2 pl-6 text-[12px] font-black text-slate-500 uppercase">
                  #{branch.branchCode}
                </TableCell>

                <TableCell className="p-2">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded flex items-center justify-center border",
                      isHQ ? "bg-amber-100 text-amber-700 border-amber-200 shadow-sm" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                    )}>
                      <Building2 size={16}/>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-black text-slate-800 uppercase tracking-tighter">
                        {branch.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold mt-0.5">
                        <MapPin size={10} className="text-slate-300" /> {branch.addressDetail}
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="p-2 text-center">
                   <span className={cn(
                     "text-[10px] font-black px-2 py-0.5 rounded-none border uppercase tracking-tighter",
                     isHQ ? "bg-amber-600 text-white border-amber-700" : "bg-slate-50 text-slate-500 border-slate-200"
                   )}>
                     {isHQ ? "KHO TỔNG" : "CHI NHÁNH"}
                   </span>
                </TableCell>

                <TableCell className="p-2">
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-[10px] border border-slate-200 uppercase">
                      {branch.managerNames?.[0]?.substring(0, 2) || "??"}
                     </div>
                     <div className="flex flex-col">
                       <span className="text-[12px] font-bold text-slate-700 leading-none">
                         {branch.managerNames?.[0] || "Chưa có"}
                       </span>
                       <span className="text-[10px] text-slate-400 mt-1 font-bold flex items-center gap-1">
                         <UserCheck size={10} /> ID: {branch.managerIds?.[0] || "N/A"}
                       </span>
                     </div>
                  </div>
                </TableCell>

                <TableCell className="p-2">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-bold">
                      <Phone size={10} className="text-slate-400" /> {branch.phone}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium lowercase">
                      <Mail size={10} className="text-slate-400" /> {branch.email}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="p-2 text-center">
                  <span className={cn(
                    "text-[10px] font-black px-2 py-0.5 rounded border tracking-tight uppercase",
                    isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                  )}>
                    {isActive ? "ĐANG HOẠT ĐỘNG" : "NGỪNG HOẠT ĐỘNG"}
                  </span>
                </TableCell>

                <TableCell className="p-2 text-right pr-6">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-slate-100"
                      onClick={() => router.push(`/admin/branches/add?id=${branch.id}`)}
                    >
                      <Pencil size={14} className="text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-rose-50"
                      onClick={() => onDeleteClick(branch.id, branch.name)}
                    >
                      <Trash2 size={14} className="text-rose-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}