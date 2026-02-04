"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function InventoryReceiptTable({ receipts }: any) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "COMPLETED": return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "CANCELLED": return "text-rose-600 bg-rose-50 border-rose-100";
      default: return "text-slate-500 bg-slate-50 border-slate-100";
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
              <TableHead className="w-[40px] text-center p-[10px]"><Checkbox className="h-3.5 w-3.5" /></TableHead>
              <TableHead className="font-bold text-slate-500 text-[11px] uppercase p-[10px]">Số phiếu</TableHead>
              <TableHead className="font-bold text-slate-500 text-[11px] uppercase p-[10px]">Ngày nhập</TableHead>
              <TableHead className="font-bold text-slate-500 text-[11px] uppercase p-[10px]">Nhà cung cấp</TableHead>
              <TableHead className="font-bold text-slate-500 text-[11px] uppercase p-[10px]">Trạng thái</TableHead>
              <TableHead className="text-right pr-8 font-bold text-slate-500 text-[11px] uppercase p-[10px]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipts.map((item: any) => (
              <TableRow key={item.code} className="hover:bg-slate-50/80 border-b border-slate-50 last:border-0 transition-colors cursor-pointer">
                <TableCell className="text-center p-[10px]"><Checkbox className="h-3.5 w-3.5" /></TableCell>
                <TableCell className="p-[10px] text-slate-900 font-bold">{item.code}</TableCell>
                <TableCell className="p-[10px] text-slate-500 font-medium">{item.date}</TableCell>
                <TableCell className="p-[10px] text-slate-800 font-bold">{item.supplier}</TableCell>
                <TableCell className="p-[10px]">
                  <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-tighter", getStatusStyle(item.status))}>
                    {item.status === "COMPLETED" ? "Đã vào kho" : item.status}
                  </span>
                </TableCell>
                <TableCell className="p-[10px] text-right pr-8">
                  {item.status === "PENDING" ? (
                    <Button variant="outline" className="h-7 text-[10px] border-orange-200 text-orange-600 bg-orange-50 font-black px-2 rounded-lg">Kiểm đếm</Button>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Đã đối soát</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/30">
        <p className="text-[11px] font-bold text-slate-400 uppercase">Tổng số <span className="text-slate-900">{receipts.length}</span> phiếu nhập</p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200 bg-white"><ChevronLeft size={14} /></Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-blue-600 text-white border-blue-600 font-black text-[11px]">1</Button>
          <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200 bg-white"><ChevronRight size={14} /></Button>
        </div>
      </div>
    </>
  );
}