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
import { Search } from "lucide-react";

interface Transfer {
  code: string;
  date: string;
  description: string;
  sourceBranch: string;
  sourceWarehouse: string;
  status: string;
}

interface TransferTableProps {
  transfers: Transfer[];
}

export function TransferTable({ transfers }: TransferTableProps) {
  return (
    <>
      <div className="overflow-x-auto">
        <Table className="table-custom">
          <TableHeader>
            <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
              <TableHead className="w-[40px] text-center p-[10px]">
                <Checkbox className="h-3.5 w-3.5" />
              </TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Số phiếu điều chuyển</TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Ngày điều chuyển</TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Lý do điều chuyển</TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Chi nhánh xuất</TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Kho xuất</TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.length > 0 ? (
              transfers.map((item) => (
                <TableRow key={item.code} className="hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors cursor-pointer">
                  <TableCell className="text-center p-[10px]">
                    <Checkbox className="h-3.5 w-3.5" />
                  </TableCell>
                  <TableCell className="p-[10px] text-[#1f1f1f]">{item.code}</TableCell>
                  <TableCell className="p-[10px] text-[#555]">{item.date}</TableCell>
                  <TableCell className="p-[10px] text-[#1f1f1f] font-medium">{item.description}</TableCell>
                  <TableCell className="p-[10px] text-[#555]">{item.sourceBranch}</TableCell>
                  <TableCell className="p-[10px] text-[#555]">{item.sourceWarehouse}</TableCell>
                  <TableCell className="p-[10px]">
                    <span className={`text-[12px] font-semibold ${
                      item.status === 'Hoàn thành' ? 'text-green-600' : 
                      item.status === 'Đang vận chuyển' ? 'text-blue-600' : 'text-orange-500'
                    }`}>
                      {item.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-[300px] text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                     <Search size={48} className="mb-2 opacity-20" />
                     <p className="font-bold text-[#1f1f1f]">Không có dữ liệu</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-[#eee] bg-[#f8f9fa]">
        <p className="text-[12px] text-gray-500">
          Hiển thị 1 - {transfers.length} trên tổng số {transfers.length} bản ghi
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-[28px] px-2 text-[12px] bg-white border-[#ddd]">Trước</Button>
          <Button variant="outline" size="sm" className="h-[28px] w-[28px] p-0 text-[12px] bg-[#007bff] text-white border-[#007bff]">1</Button>
          <Button variant="outline" size="sm" className="h-[28px] px-2 text-[12px] bg-white border-[#ddd]">Sau</Button>
        </div>
      </div>
    </>
  );
}
