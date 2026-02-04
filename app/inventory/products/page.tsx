"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Search, 
  Plus, 
  RotateCw, 
  Settings, 
  Filter, 
  MoreHorizontal,
  FileDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const mockProducts = [
  { code: "TA001", name: "Thức ăn tôm Grobest 40% đạm", type: "Hàng hóa", unit: "Bao", group: "Thức ăn tôm", stock: 150.00, status: "Đang sử dụng" },
  { code: "VS005", name: "Vi sinh xử lý đáy (BZT)", type: "Hàng hóa", unit: "Gói", group: "Thuốc & Vi sinh", stock: 520.00, status: "Đang sử dụng" },
  { code: "HC003", name: "Khoáng tạt Azomite", type: "Hàng hóa", unit: "Kg", group: "Hóa chất xử lý", stock: 1200.00, status: "Đang sử dụng" },
  { code: "MM002", name: "Máy sục khí 2HP (Guồng quạt)", type: "Hàng hóa", unit: "Cái", group: "Máy móc & Thiết bị", stock: 0.00, status: "Đang sử dụng" },
];

export default function ProductListPage() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="space-y-3">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <h1 className="text-[18px] font-bold text-[#1f1f1f]">Vật tư hàng hóa</h1>
          <div className="hidden md:flex gap-[5px]">
            {[
              { id: "all", label: "Tất cả", count: null },
              { id: "low", label: "Sắp hết hàng", count: 2, color: "text-[#007bff]" },
              { id: "out", label: "Hết hàng", count: 5, color: "text-red-600" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-3 py-[6px] text-[13px] font-semibold rounded-[4px] transition-all",
                  activeTab === tab.id 
                    ? "bg-[#eef6fc] text-[#007bff]" 
                    : "text-[#555] hover:bg-[#f8f9fa] hover:text-[#007bff]"
                )}
              >
                {tab.label} {tab.count !== null && <span className={cn("ml-1", tab.color)}>({tab.count})</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-[32px] text-[12px] bg-white border-[#dcdcdc] rounded-[4px]">
            <Plus className="mr-1 h-3 w-3" />
            Thêm hàng hóa
          </Button>
        </div>
      </div>

      {/* Table Section (bg-white-box) */}
      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        
        {/* Sub-filter Bar */}
        <div className="p-2 border-b border-[#eee] bg-[#f8f9fa] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative w-full max-w-[250px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <Input placeholder="Tìm kiếm tên, mã..." className="pl-8 h-[30px] text-[13px] bg-white border-[#ddd] rounded-[4px]" />
            </div>
            
            <Select defaultValue="all">
              <SelectTrigger className="w-[150px] h-[30px] text-[13px] bg-white border-[#ddd] rounded-[4px]">
                <SelectValue placeholder="Nhóm: Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Nhóm: Tất cả</SelectItem>
                <SelectItem value="thuc-an">Thức ăn tôm</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="active">
              <SelectTrigger className="w-[150px] h-[30px] text-[13px] bg-white border-[#ddd] rounded-[4px]">
                <SelectValue placeholder="Trạng thái: Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Đang sử dụng</SelectItem>
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

        <Table className="table-custom">
          <TableHeader>
            <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
              <TableHead className="w-[40px] text-center p-[10px]">
                <Checkbox className="h-3.5 w-3.5" />
              </TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Mã hàng</TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Tên hàng</TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Tính chất</TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">ĐVT chính</TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Nhóm VTHH</TableHead>
              <TableHead className="text-right font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Số lượng tồn</TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockProducts.map((product) => (
              <TableRow 
                key={product.code} 
                className="hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors cursor-pointer"
              >
                <TableCell className="text-center p-[10px]" onClick={(e) => e.stopPropagation()}>
                  <Checkbox className="h-3.5 w-3.5" />
                </TableCell>
                <TableCell className="p-[10px] text-gray-600">{product.code}</TableCell>
                <TableCell className="p-[10px]">
                  <Link 
                    href={`/inventory/products/${product.code}`}
                    className="text-[#1f1f1f] hover:underline"
                  >
                    {product.name}
                  </Link>
                </TableCell>
                <TableCell className="p-[10px] text-gray-500">{product.type}</TableCell>
                <TableCell className="p-[10px] text-gray-500">{product.unit}</TableCell>
                <TableCell className="p-[10px] text-gray-500">{product.group}</TableCell>
                <TableCell className={cn(
                  "p-[10px] text-right font-bold",
                  product.stock === 0 ? "text-red-500" : "text-[#1f1f1f]"
                )}>
                  {product.stock.toLocaleString("vi-VN", { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="p-[10px]">
                  <span className="text-[#16a34a] font-semibold text-[12px]">
                    {product.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-[#eee] bg-[#f8f9fa]">
          <p className="text-[12px] text-gray-500">
            Hiển thị 1 - 4 trên tổng số 50 bản ghi
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-[28px] px-2 text-[12px] bg-white border-[#ddd]">Trước</Button>
            <Button variant="outline" size="sm" className="h-[28px] w-[28px] p-0 text-[12px] bg-[#007bff] text-white border-[#007bff]">1</Button>
            <Button variant="outline" size="sm" className="h-[28px] w-[28px] p-0 text-[12px] bg-white border-[#ddd]">2</Button>
            <Button variant="outline" size="sm" className="h-[28px] px-2 text-[12px] bg-white border-[#ddd]">Sau</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
