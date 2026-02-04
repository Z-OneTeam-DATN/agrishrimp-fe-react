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

interface Export {
  code: string;
  date: string;
  receiver: string;
  warehouse: string;
  branch: string;
  status: string;
}

interface ExportTableProps {
  exports: Export[];
}

export function ExportTable({ exports }: ExportTableProps) {
  return (
    <>
      <div className="overflow-x-auto">
        <Table className="table-custom">
          <TableHeader>
            <TableRow className="bg-[#f0f0f0] border-b border-[#ccc]">
              <TableHead className="w-[40px] text-center p-[10px]"><Checkbox className="h-3.5 w-3.5" /></TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px]">Số phiếu</TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px]">Ngày xuất</TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px]">Đối tượng nhận</TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px]">Kho xuất</TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px]">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exports.map((item) => (
              <TableRow key={item.code} className="hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors cursor-pointer">
                <TableCell className="text-center p-[10px]"><Checkbox className="h-3.5 w-3.5" /></TableCell>
                <TableCell className="p-[10px] text-[#1f1f1f] font-medium">{item.code}</TableCell>
                <TableCell className="p-[10px] text-[#555]">{item.date}</TableCell>
                <TableCell className="p-[10px] font-bold text-[#1f1f1f]">{item.receiver}</TableCell>
                <TableCell className="p-[10px] text-[#555]">{item.warehouse}</TableCell>
                <TableCell className="p-[10px]">
                  <span className={cn(
                    "text-[11px] font-bold px-2 py-0.5 rounded-full",
                    item.status === "Đã hoàn thành" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                  )}>{item.status}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-[#eee] bg-[#f8f9fa]">
        <p className="text-[12px] text-gray-500">Hiển thị 1 - {exports.length} trên tổng số {exports.length} bản ghi</p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-[28px] px-2 text-[12px] bg-white border-[#ddd]">Trước</Button>
          <Button variant="outline" size="sm" className="h-[28px] w-[28px] p-0 text-[12px] bg-[#007bff] text-white border-[#007bff]">1</Button>
          <Button variant="outline" size="sm" className="h-[28px] px-2 text-[12px] bg-white border-[#ddd]">Sau</Button>
        </div>
      </div>
    </>
  );
}
