"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AdminTransactionTable({ transactions }: any) {
  return (
    <div className="w-full">
      <div className="px-[15px] py-[10px] border-b border-[#eee] bg-[#f8f9fa] flex items-center justify-between">
        <h5 className="text-[12px] font-black text-slate-700 flex items-center gap-2 uppercase tracking-tight">
          <History size={16} className="text-emerald-600" /> Danh sách giao dịch phát sinh
        </h5>
        <button className="text-emerald-600 text-[11px] font-bold uppercase hover:underline">Xem toàn bộ nhật ký</button>
      </div>
      
      <div className="overflow-x-auto">
        <Table className="table-custom border-collapse">
          <TableHeader>
            <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
              <TableHead className="w-[100px] font-bold text-[#1f1f1f] text-[10px] uppercase p-2 pl-4">Mã GD</TableHead>
              <TableHead className="w-[150px] font-bold text-[#1f1f1f] text-[10px] uppercase p-2">Thời gian</TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[10px] uppercase p-2">Nội dung giao dịch</TableHead>
              <TableHead className="w-[150px] font-bold text-[#1f1f1f] text-[10px] uppercase p-2">Đối tượng</TableHead>
              <TableHead className="w-[150px] text-right font-bold text-[#1f1f1f] text-[10px] uppercase p-2">Số tiền (₫)</TableHead>
              <TableHead className="w-[120px] text-center font-bold text-[#1f1f1f] text-[10px] uppercase p-2 pr-4">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((item: any, idx: any) => (
              <TableRow key={idx} className="hover:bg-[#f0f8ff] border-b border-[#eee] last:border-0 transition-colors">
                <TableCell className="p-2 pl-4 text-slate-400 font-mono text-[11px]">#{item.id}</TableCell>
                <TableCell className="p-2 text-[11px] text-slate-500 font-medium">{item.date}</TableCell>
                <TableCell className="p-2 text-[12px] font-bold text-slate-800">{item.note}</TableCell>
                <TableCell className="p-2 text-[11px] text-slate-400 font-black uppercase">{item.target}</TableCell>
                <TableCell className={cn(
                  "p-2 text-right font-black text-[12px]",
                  item.type === 'in' ? 'text-emerald-600' : 'text-rose-600'
                )}>
                  {item.amount}
                </TableCell>
                <TableCell className="p-2 text-center pr-4">
                  <span className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded border tracking-tight uppercase whitespace-nowrap",
                    item.status === 'Hoàn thành' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                    item.status === 'Chờ duyệt' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                    'bg-slate-100 text-slate-400 border-slate-200'
                  )}>
                    {item.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-3 py-2 border-t border-[#eee] bg-[#f8f9fa]">
        <p className="text-[10px] text-gray-400 font-bold uppercase">Phát sinh trong kỳ: {transactions.length} giao dịch</p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] font-bold bg-white">Trước</Button>
          <Button variant="outline" size="sm" className="h-6 w-6 p-0 text-[10px] bg-emerald-600 text-white border-emerald-600">1</Button>
          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] font-bold bg-white">Sau</Button>
        </div>
      </div>
    </div>
  );
}