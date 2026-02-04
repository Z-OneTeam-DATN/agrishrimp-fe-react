"use client";

import React from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  RotateCw, 
  Settings, 
  ArrowUpRight
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
import { cn } from "@/lib/utils";

export default function ExportListPage() {
  const exports = [
    { code: "PXK00003", date: "22/02/2026", receiver: "Nguyễn Văn A", warehouse: "Kho thành phẩm", branch: "Chi nhánh chính", status: "Đã hoàn thành" },
    { code: "PXK00002", date: "20/02/2026", receiver: "Công ty TNHH ABC", warehouse: "Kho thức ăn", branch: "Chi nhánh chính", status: "Đang giao" },
    { code: "PXK00001", date: "15/02/2026", receiver: "Đại lý Miền Tây", warehouse: "Kho thuốc", branch: "Cửa hàng phụ", status: "Đã hoàn thành" },
  ];

  return (
    <div className="space-y-3">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <h1 className="text-[18px] font-bold text-[#1f1f1f]">Phiếu xuất kho</h1>
        <div className="flex items-center gap-2">
          <Link href="/inventory/exports/new">
            <Button className="h-[32px] text-[12px] bg-[#007bff] hover:bg-[#0069d9] text-white border-none rounded-[4px] font-semibold">
              <Plus className="mr-1 h-3 w-3" /> Tạo phiếu xuất
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        
        {/* Filter Bar */}
        <div className="p-2 border-b border-[#eee] bg-[#f8f9fa] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative w-full max-w-[250px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <Input placeholder="Tìm kiếm phiếu xuất..." className="pl-8 h-[30px] text-[13px] bg-white border-[#ddd] rounded-[4px]" />
            </div>
            <Select defaultValue="this-month">
              <SelectTrigger className="w-[150px] h-[30px] text-[13px] bg-white border-[#ddd] rounded-[4px]">
                <SelectValue placeholder="Thời gian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">Tháng này</SelectItem>
                <SelectItem value="last-month">Tháng trước</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-[30px] w-[30px] border-[#ddd] bg-white"><RotateCw size={14} className="text-gray-500" /></Button>
            <Button variant="outline" size="icon" className="h-[30px] w-[30px] border-[#ddd] bg-white"><Settings size={14} className="text-gray-500" /></Button>
          </div>
        </div>

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
      </div>
    </div>
  );
}
