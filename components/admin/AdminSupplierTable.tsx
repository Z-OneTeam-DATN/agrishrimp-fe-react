"use client";

import React from "react";
import Link from "next/link";
import { Eye, Truck, Phone, ChevronLeft, ChevronRight, Tags, Wallet } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Supplier {
  id: string;
  name: string;
  taxCode: string;
  category: string; // Nhóm hàng cung cấp (VD: Thức ăn, Thuốc)
  contactName: string;
  phone: string;
  debt: string; // Công nợ mình phải trả họ
  status: string;
}

interface AdminSupplierTableProps {
  suppliers: Supplier[];
}

export function AdminSupplierTable({ suppliers }: AdminSupplierTableProps) {
  return (
    <div className="w-full">
      <Table className="table-custom border-collapse min-w-[1100px]">
        <TableHeader>
          <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
            <TableHead className="w-[100px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pl-4">Mã NCC</TableHead>
            <TableHead className="font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Nhà cung cấp & MST</TableHead>
            <TableHead className="w-[180px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Hàng hóa cung cấp</TableHead>
            <TableHead className="w-[150px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Người liên hệ</TableHead>
            <TableHead className="w-[150px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Công nợ phải trả (₫)</TableHead>
            <TableHead className="w-[120px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 text-center">Trạng thái</TableHead>
            <TableHead className="w-[80px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pr-4">Chi tiết</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((s) => (
            <TableRow key={s.id} className="hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors cursor-pointer">
              <TableCell className="p-2 pl-4 text-[12px] font-bold text-slate-500">#{s.id}</TableCell>
              <TableCell className="p-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-50 rounded flex items-center justify-center text-orange-600 border border-orange-100">
                    <Truck size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-slate-800 uppercase tracking-tighter">{s.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">MST: {s.taxCode}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="p-2">
                <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-fit">
                  <Tags size={10} className="text-slate-400" /> {s.category}
                </span>
              </TableCell>
              <TableCell className="p-2">
                <div className="flex flex-col">
                  <span className="text-[12px] font-bold text-slate-700">{s.contactName}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{s.phone}</span>
                </div>
              </TableCell>
              <TableCell className="p-2 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-[12px] font-black text-rose-600">{s.debt}</span>
                  <Wallet size={12} className="text-slate-300" />
                </div>
              </TableCell>
              <TableCell className="p-2 text-center">
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded border tracking-tight uppercase whitespace-nowrap",
                  s.status === "Đang giao dịch" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-400 border-slate-200"
                )}>
                  {s.status}
                </span>
              </TableCell>
              <TableCell className="p-2 text-right pr-4">
                <Link href={`/admin/suppliers/${s.id}`}>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white transition-all rounded-md">
                    <Eye size={16} />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between px-3 py-2 border-t border-[#eee] bg-[#f8f9fa]">
        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tighter">
          Tổng số {suppliers.length} nhà cung cấp chiến lược
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] font-bold bg-white border-[#ddd]">Trước</Button>
          <Button variant="outline" size="sm" className="h-6 w-6 p-0 text-[10px] bg-orange-500 text-white border-orange-500 font-bold">1</Button>
          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] font-bold bg-white border-[#ddd]">Sau</Button>
        </div>
      </div>
    </div>
  );
}
