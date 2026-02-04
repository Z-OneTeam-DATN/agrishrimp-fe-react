"use client";

import React from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  RotateCw, 
  Settings, 
  ChevronLeft, 
  ChevronRight 
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
import { useRouter } from "next/navigation";

export default function InventoryListPage() {
  const router = useRouter();
  
  // Mock data cho danh sách kiểm kê
  const inventories = [
    { date: "25/01/2026", code: "PKK00009", warehouse: "Kho Thuốc", branch: "CN Cà Mau", cutOffDate: "25/01/2026", deadline: "07/08/2026", status: "Chưa thực hiện" },
    { date: "20/01/2026", code: "PKK00008", warehouse: "Kho Thức ăn", branch: "CN Bạc Liêu", cutOffDate: "20/01/2026", deadline: "30/01/2026", status: "Đã hoàn thành" },
  ];

  return (
    <div className="space-y-3">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <h1 className="text-[18px] font-bold text-[#1f1f1f]">Danh sách yêu cầu kiểm kê</h1>
        <div className="flex items-center gap-2">
          <Link href="/inventory/inventory-checks/new">
            <Button className="h-[32px] text-[12px] bg-[#007bff] hover:bg-[#0069d9] text-white border-none rounded-[4px] font-semibold flex items-center">
              <Plus className="mr-1 h-3 w-3" />
              Thêm
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-2 border-b border-[#eee] bg-[#f8f9fa] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative w-full max-w-[250px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <Input
                placeholder="Tìm kiếm..."
                className="pl-8 h-[30px] text-[13px] bg-white border-[#ddd] rounded-[4px] focus-visible:ring-1 focus-visible:ring-[#007bff]"
              />
            </div>
            <Select defaultValue="this-month">
              <SelectTrigger className="w-[180px] h-[30px] text-[13px] bg-white border-[#ddd] rounded-[4px]">
                <SelectValue placeholder="Thời gian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">Thời gian: Tháng này</SelectItem>
                <SelectItem value="this-quarter">Quý này</SelectItem>
                <SelectItem value="this-year">Năm nay</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[150px] h-[30px] text-[13px] bg-white border-[#ddd] rounded-[4px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Trạng thái: Tất cả</SelectItem>
                <SelectItem value="new">Chưa thực hiện</SelectItem>
                <SelectItem value="done">Đã hoàn thành</SelectItem>
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
              {inventories.map((item) => (
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
            Hiển thị 1 - {inventories.length} trên tổng số {inventories.length} bản ghi
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
