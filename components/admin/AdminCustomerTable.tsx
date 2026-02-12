"use client";

import React from "react";
import Link from "next/link";
import { Eye, Phone, ChevronLeft, ChevronRight, User, MapPin } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  type: string;
  location: string;
  phone: string;
  totalSpent: string;
  totalOrders: number;
  status: string;
}

interface AdminCustomerTableProps {
  customers: Customer[];
}

export function AdminCustomerTable({ customers }: AdminCustomerTableProps) {
  return (
    <div className="w-full">
      <Table className="table-custom border-collapse">
        <TableHeader>
          <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
            <TableHead className="w-[100px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pl-4">Mã KH</TableHead>
            <TableHead className="font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Thông tin đối tác</TableHead>
            <TableHead className="w-[150px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Liên hệ</TableHead>
            <TableHead className="w-[150px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Số tiền đã mua (₫)</TableHead>
            <TableHead className="w-[100px] text-center font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Đơn hàng</TableHead>
            <TableHead className="w-[120px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 text-center">Trạng thái</TableHead>
            <TableHead className="w-[80px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pr-4">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((cus) => (
            <TableRow key={cus.id} className="hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors cursor-pointer" onClick={() => window.location.href = `/admin/customers/${cus.id}`}>
              <TableCell className="p-2 pl-4 text-[12px] font-bold text-slate-500">#{cus.id}</TableCell>
              <TableCell className="p-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 border border-blue-100">
                    <User size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-slate-800 uppercase tracking-tighter">{cus.name}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold uppercase">
                      <MapPin size={10} /> {cus.location} • {cus.type}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="p-2">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-bold">
                  <Phone size={12} className="text-slate-400" /> {cus.phone}
                </div>
              </TableCell>
              <TableCell className="p-2 text-right">
                <span className="text-[13px] font-black text-emerald-600">{cus.totalSpent}</span>
              </TableCell>
              <TableCell className="p-2 text-center font-bold text-slate-700 text-[12px]">
                {cus.totalOrders}
              </TableCell>
              <TableCell className="p-2 text-center">
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded border tracking-tight uppercase whitespace-nowrap",
                  cus.status === "Hoạt động" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                )}>
                  {cus.status}
                </span>
              </TableCell>
              <TableCell className="p-2 text-right pr-4">
                <Link href={`/admin/customers/${cus.id}`} onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white transition-all rounded-md">
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
          Tổng số {customers.length} đối tác khách hàng
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