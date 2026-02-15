"use client";

import React from "react";
import Link from "next/link";
import { Eye, Truck, Tags, Wallet } from "lucide-react";
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

interface Supplier {
  id: number; // Backend trả về Long (number)
  code: string;
  name: string;
  taxCode: string;
  category: { id: number; name: string } | null;
  contactName: string;
  phone: string;
  currentDebt: number; // Backend trả về 'currentDebt', không phải 'debt'
  status: string;
}

interface AdminSupplierTableProps {
  suppliers: Supplier[];
}

export function AdminSupplierTable({ suppliers }: AdminSupplierTableProps) {
  // 1. Hàm format tiền tệ VNĐ
  const formatCurrency = (value: string | number) => {
    const amount = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(amount) || amount === null || amount === undefined) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // 2. Mapping hiển thị Trạng thái (Giữ nguyên)
  const getStatusInfo = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "active" || s === "đang giao dịch") {
      return {
        label: "ĐANG GIAO DỊCH",
        class: "bg-emerald-50 text-emerald-600 border-emerald-100",
      };
    }
    return {
      label: "TẠM DỪNG",
      class: "bg-slate-100 text-slate-400 border-slate-200",
    };
  };

  return (
    <div className="w-full">
      <Table className="table-custom border-collapse min-w-[1100px]">
        <TableHeader>
          <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
            <TableHead className="w-[100px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pl-4">
              Mã NCC
            </TableHead>
            <TableHead className="font-bold text-[#1f1f1f] text-[11px] uppercase p-2">
              Nhà cung cấp & MST
            </TableHead>
            <TableHead className="w-[180px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">
              Hàng hóa cung cấp
            </TableHead>
            <TableHead className="w-[150px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">
              Người liên hệ
            </TableHead>
            <TableHead className="w-[180px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2">
              Công nợ phải trả
            </TableHead>
            <TableHead className="w-[140px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 text-center">
              Trạng thái
            </TableHead>
            <TableHead className="w-[80px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pr-4">
              Chi tiết
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((s) => {
            const statusInfo = getStatusInfo(s.status);
            return (
              <TableRow
                key={s.id}
                className="hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors cursor-pointer group"
              >
                <TableCell className="p-2 pl-4 text-[12px] font-bold text-slate-500 italic">
                  {s.code || `#${s.id}`}
                </TableCell>
                <TableCell className="p-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-50 rounded flex items-center justify-center text-orange-600 border border-orange-100 group-hover:bg-orange-100 transition-colors">
                      <Truck size={14} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-slate-800 uppercase tracking-tighter line-clamp-1">
                        {s.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono font-bold">
                        MST: {s.taxCode || "---"}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="p-2">
                  {/* 👇 HIỂN THỊ DANH MỤC TỪ DATABASE */}
                  <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[9px] font-black uppercase flex items-center gap-1 w-fit">
                    <Tags size={10} className="text-slate-400" />
                    {s.category?.name?.toUpperCase() || "CHƯA PHÂN LOẠI"}
                  </span>
                </TableCell>
                <TableCell className="p-2">
                  <div className="flex flex-col">
                    <span className="text-[12px] font-bold text-slate-700">
                      {s.contactName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {s.phone}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="p-2 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-[13px] font-black text-rose-600 tracking-tight">
                      {/* 👇 Dùng currentDebt đúng với DTO Backend */}
                      {formatCurrency(s.currentDebt)}
                    </span>
                    <Wallet size={12} className="text-slate-300" />
                  </div>
                </TableCell>
                <TableCell className="p-2 text-center">
                  <span
                    className={cn(
                      "text-[10px] font-black px-2 py-1 rounded border tracking-tight uppercase whitespace-nowrap inline-block min-w-[110px]",
                      statusInfo.class,
                    )}
                  >
                    {statusInfo.label}
                  </span>
                </TableCell>
                <TableCell className="p-2 text-right pr-4">
                  <Link href={`/admin/suppliers/${s.id}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white transition-all rounded-md"
                    >
                      <Eye size={16} />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
