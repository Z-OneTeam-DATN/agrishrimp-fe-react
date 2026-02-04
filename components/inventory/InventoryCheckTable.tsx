"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export function InventoryCheckTable({ checks }: any) {
  const router = useRouter();

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
              <TableHead className="w-[40px] text-center p-[10px]"><Checkbox className="h-3.5 w-3.5" /></TableHead>
              <TableHead className="font-bold text-slate-500 text-[11px] uppercase p-[10px]">Ngày yêu cầu</TableHead>
              <TableHead className="font-bold text-slate-500 text-[11px] uppercase p-[10px]">Số yêu cầu</TableHead>
              <TableHead className="font-bold text-slate-500 text-[11px] uppercase p-[10px]">Kho kiểm kê</TableHead>
              <TableHead className="font-bold text-slate-500 text-[11px] uppercase p-[10px]">Hạn kiểm kê</TableHead>
              <TableHead className="font-bold text-slate-500 text-[11px] uppercase p-[10px]">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checks.map((item: any) => (
              <TableRow 
                key={item.code} 
                className="hover:bg-slate-50/80 border-b border-slate-50 last:border-0 transition-colors cursor-pointer"
                onClick={() => router.push(`/inventory/inventory-checks/${item.code}`)}
              >
                <TableCell className="text-center p-[10px]" onClick={(e) => e.stopPropagation()}><Checkbox className="h-3.5 w-3.5" /></TableCell>
                <TableCell className="p-[10px] text-slate-500 font-medium">{item.date}</TableCell>
                <TableCell className="p-[10px] text-blue-600 font-black">{item.code}</TableCell>
                <TableCell className="p-[10px] text-slate-800 font-bold">{item.warehouse}</TableCell>
                <TableCell className="p-[10px] text-slate-500 font-medium">{item.deadline}</TableCell>
                <TableCell className="p-[10px]">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-tighter ${
                    item.status === 'Đã hoàn thành' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                  }`}>
                    {item.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/30">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Hiển thị <span className="text-slate-900">{checks.length}</span> bản ghi</p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200 bg-white"><ChevronLeft size={14} /></Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-blue-600 text-white border-blue-600 font-black text-[11px]">1</Button>
          <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200 bg-white"><ChevronRight size={14} /></Button>
        </div>
      </div>
    </>
  );
}