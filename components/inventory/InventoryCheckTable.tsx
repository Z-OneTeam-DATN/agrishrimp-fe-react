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
import { useRouter } from "next/navigation";

interface InventoryCheck {
  date: string;
  code: string;
  warehouse: string;
  branch: string;
  cutOffDate: string;
  deadline: string;
  status: string;
}

interface InventoryCheckTableProps {
  checks: InventoryCheck[];
}

export function InventoryCheckTable({ checks }: InventoryCheckTableProps) {
  const router = useRouter();

  return (
    <>
      <div className="overflow-x-auto">
        <Table className="table-custom">
          <TableHeader>
            <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
              <TableHead className="w-[40px] text-center p-[10px]">
                <Checkbox className="h-3.5 w-3.5" />
              </TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Ngày yêu cầu</TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Số yêu cầu</TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Kiểm kê kho</TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Chi nhánh</TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Kiểm kê đến ngày</TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Hạn kiểm kê</TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checks.map((item) => (
              <TableRow 
                key={item.code} 
                className="hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors cursor-pointer"
                onClick={() => router.push(`/inventory/inventory-checks/${item.code}`)}
              >
                <TableCell className="text-center p-[10px]" onClick={(e) => e.stopPropagation()}>
                  <Checkbox className="h-3.5 w-3.5" />
                </TableCell>
                <TableCell className="p-[10px] text-[#555]">{item.date}</TableCell>
                <TableCell className="p-[10px] text-[#007bff] font-bold">{item.code}</TableCell>
                <TableCell className="p-[10px] text-[#555]">{item.warehouse}</TableCell>
                <TableCell className="p-[10px] text-[#555]">{item.branch}</TableCell>
                <TableCell className="p-[10px] text-[#555]">{item.cutOffDate}</TableCell>
                <TableCell className="p-[10px] text-[#555]">{item.deadline}</TableCell>
                <TableCell className="p-[10px]">
                  <span className={`text-[12px] font-semibold ${
                    item.status === 'Đã hoàn thành' ? 'text-green-600' : 'text-orange-500'
                  }`}>
                    {item.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-[#eee] bg-[#f8f9fa]">
        <p className="text-[12px] text-gray-500">
          Hiển thị 1 - {checks.length} trên tổng số {checks.length} bản ghi
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
