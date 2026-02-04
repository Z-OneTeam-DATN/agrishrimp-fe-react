"use client";

import React from "react";
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

interface Receipt {
  code: string;
  date: string;
  supplier: string;
  warehouse: string;
  total: string;
  status: string;
}

interface ReceiptTableProps {
  receipts: Receipt[];
}

export function ReceiptTable({ receipts }: ReceiptTableProps) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "COMPLETED": return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "CANCELLED": return "text-red-600 bg-red-50 border-red-100";
      default: return "text-slate-500 bg-slate-50 border-slate-100";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "COMPLETED": return "Đã vào kho";
      case "CANCELLED": return "Đã hủy";
      default: return status;
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table className="table-custom">
        <TableHeader>
          <TableRow className="bg-[#f0f0f0] border-b border-[#ccc]">
            <TableHead className="w-[40px] text-center p-[10px]"><Checkbox className="h-3.5 w-3.5" /></TableHead>
            <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px]">Số phiếu</TableHead>
            <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px]">Ngày nhập</TableHead>
            <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px]">Nhà cung cấp</TableHead>
            <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px]">Trạng thái</TableHead>
            <TableHead className="text-right font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px]">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receipts.map((item) => (
            <TableRow key={item.code} className="hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors cursor-pointer">
              <TableCell className="text-center p-[10px]"><Checkbox className="h-3.5 w-3.5" /></TableCell>
              <TableCell className="p-[10px] text-[#1f1f1f]">{item.code}</TableCell>
              <TableCell className="p-[10px] text-[#555]">{item.date}</TableCell>
              <TableCell className="p-[10px] text-[#1f1f1f]">{item.supplier}</TableCell>
              <TableCell className="p-[10px]">
                <span className={cn(
                  "text-[11px] font-bold px-2 py-0.5 rounded-full border",
                  getStatusStyle(item.status)
                )}>
                  {getStatusLabel(item.status)}
                </span>
              </TableCell>
              <TableCell className="p-[10px] text-right">
                {item.status === "PENDING" ? (
                  <Button variant="outline" className="h-7 text-[11px] border-orange-500 text-orange-600 hover:bg-orange-50 font-bold px-2">
                    Kiểm đếm & Xác nhận
                  </Button>
                ) : (
                  <Button variant="ghost" className="h-7 text-[11px] text-gray-400 font-medium px-2" disabled>
                    Đã đối soát
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
