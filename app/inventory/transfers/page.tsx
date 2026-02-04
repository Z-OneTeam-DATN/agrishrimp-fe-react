"use client";

import React from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  RotateCw, 
  Settings, 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

export default function TransferListPage() {
  // Mock data cho danh sách điều chuyển
  const transfers = [
    { code: "PDC00003", date: "23/02/2026", description: "Điều chuyển hàng chi nhánh HN -> HCM", sourceBranch: "Chi nhánh Hà Nội", sourceWarehouse: "Kho Hàng Hóa (HH)", status: "Đang vận chuyển" },
    { code: "PDC00002", date: "21/02/2026", description: "Luân chuyển thức ăn tôm", sourceBranch: "Chi nhánh Hồ Chí Minh", sourceWarehouse: "Kho Lạnh (KL)", status: "Hoàn thành" },
    { code: "PDC00001", date: "18/02/2026", description: "Cân đối tồn kho", sourceBranch: "Cửa hàng Cầu Giấy", sourceWarehouse: "Kho Nguyên Liệu (NL)", status: "Chờ xử lý" },
  ];

  return (
    <div className="space-y-3">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <h1 className="text-[18px] font-bold text-[#1f1f1f]">Điều chuyển</h1>
        <div className="flex items-center gap-2">
          <Link href="/inventory/transfers/new">
            <Button className="h-[32px] text-[12px] bg-[#007bff] hover:bg-[#0069d9] text-white border-none rounded-[4px] font-semibold">
              <Plus className="mr-1 h-3 w-3" />
              Thêm phiếu điều chuyển
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-2 border-b border-[#eee] bg-[#f8f9fa] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative w-full max-w-[280px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <Input
                placeholder="Tìm kiếm phiếu điều chuyển..."
                className="pl-8 h-[30px] text-[13px] bg-white border-[#ddd] rounded-[4px] focus-visible:ring-1 focus-visible:ring-[#007bff]"
              />
            </div>
            <Select defaultValue="this-month">
              <SelectTrigger className="w-[180px] h-[30px] text-[13px] bg-white border-[#ddd] rounded-[4px]">
                <SelectValue placeholder="Thời gian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">Thời gian: Tháng này</SelectItem>
                <SelectItem value="last-month">Tháng trước</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-[30px] w-[30px] border-[#ddd] bg-white">
              <RotateCw size={14} className="text-gray-500" />
            </Button>
            <Button variant="outline" size="icon" className="h-[30px] w-[30px] border-[#ddd] bg-white">
              <Settings size={14} className="text-gray-500" />
            </Button>
          </div>
        </div>

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
                  <TableCell colspan={7} className="h-[300px] text-center">
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
      </div>
    </div>
  );
}
