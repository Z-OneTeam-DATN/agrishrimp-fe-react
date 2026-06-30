"use client";

import React from "react";
import Link from "next/link";
import {
  Eye,
  Building2,
  Phone,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  CreditCard,
  Percent,
} from "lucide-react";
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

interface Dealer {
  id: string;
  name: string;
  taxCode: string;
  tier: string;
  representative: string;
  phone: string;
  debt: string;
  discount: string;
  status: string;
}

interface AdminDealerTableProps {
  dealers: Dealer[];
}

export function AdminDealerTable({ dealers }: AdminDealerTableProps) {
  return (
    <div className="w-full">
      <Table className="table-custom border-collapse min-w-[1100px]">
        <TableHeader>
          <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
            <TableHead className="w-[80px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pl-4">
              Mã ĐL
            </TableHead>
            <TableHead className="font-bold text-[#1f1f1f] text-[11px] uppercase p-2">
              Đại lý & Mã số thuế
            </TableHead>
            <TableHead className="w-[120px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">
              Phân cấp
            </TableHead>
            <TableHead className="w-[150px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">
              Người đại diện
            </TableHead>
            <TableHead className="w-[150px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2">
              Công nợ (₫)
            </TableHead>
            <TableHead className="w-[100px] text-center font-bold text-[#1f1f1f] text-[11px] uppercase p-2">
              Chiết khấu
            </TableHead>
            <TableHead className="w-[120px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">
              Trạng thái
            </TableHead>
            <TableHead className="w-[80px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pr-4">
              Chi tiết
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dealers.map((dl) => (
            <TableRow
              key={dl.id}
              className="hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors cursor-pointer"
            >
              <TableCell className="p-2 pl-4 text-[12px] font-bold text-slate-500">
                #{dl.id}
              </TableCell>
              <TableCell className="p-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-50 rounded flex items-center justify-center text-amber-600 border border-amber-100">
                    <Building2 size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-slate-800 uppercase tracking-tighter">
                      {dl.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      MST: {dl.taxCode}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="p-2">
                <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-black uppercase flex items-center gap-1 w-fit">
                  <BadgeCheck size={10} className="text-blue-500" /> {dl.tier}
                </span>
              </TableCell>
              <TableCell className="p-2">
                <div className="flex flex-col">
                  <span className="text-[12px] font-bold text-slate-700">
                    {dl.representative}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {dl.phone}
                  </span>
                </div>
              </TableCell>
              <TableCell className="p-2 text-right">
                <div className="flex flex-col items-end">
                  <span className="text-[12px] font-bold text-rose-600">
                    {dl.debt}
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">
                    Hạn mức vượt: 0₫
                  </span>
                </div>
              </TableCell>
              <TableCell className="p-2 text-center">
                <span className="text-[12px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {dl.discount}
                </span>
              </TableCell>
              <TableCell className="p-2">
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded border tracking-tight uppercase whitespace-nowrap",
                    dl.status === "Hoạt động"
                      ? "bg-blue-50 text-blue-600 border-blue-100"
                      : "bg-slate-100 text-slate-400 border-slate-200",
                  )}
                >
                  {dl.status}
                </span>
              </TableCell>
              <TableCell className="p-2 text-right pr-4">
                <Link href={`/admin/dealers/${dl.id}`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white transition-all rounded-md"
                  >
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
          Tổng số {dealers.length} đại lý phân phối toàn quốc
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[10px] font-bold bg-white border-[#ddd]"
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0 text-[10px] bg-amber-500 text-white border-amber-500"
          >
            1
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[10px] font-bold bg-white border-[#ddd]"
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}

