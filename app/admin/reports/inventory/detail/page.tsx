"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, Download, HelpCircle, 
  ChevronDown, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";

export default function InventoryDetailReportPage() {
  const router = useRouter();

  return (
    <div className="space-y-4 pb-10 bg-[#f0f2f5] min-h-screen">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/reports/inventory")} className="h-8 w-8 text-slate-500 border border-slate-200 rounded-none">
            <ChevronLeft size={20} />
          </Button>
          <h1 className="text-[20px] font-medium text-slate-800">Báo cáo tồn kho chi tiết</h1>
        </div>
        <div className="flex items-center gap-6 text-[13px] font-medium text-slate-600">
          <button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
            <Download size={16} /> Xuất báo cáo
          </button>
          <button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
            <HelpCircle size={16} /> Giải thích thuật ngữ
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-2 flex items-center gap-4">
        <Select defaultValue="all">
          <SelectTrigger className="h-8 w-[100px] text-[13px] border-slate-300 rounded-none shadow-none bg-white">
            <SelectValue placeholder="Bộ lọc" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all">Bộ lọc</SelectItem>
          </SelectContent>
        </Select>

        <div className="ms-auto">
          <Select defaultValue="options">
            <SelectTrigger className="h-8 w-[160px] text-[13px] border-slate-300 rounded-none shadow-none bg-white font-medium">
              <SelectValue placeholder="Tuỳ chọn hiển thị" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="options">Tuỳ chọn hiển thị</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Info Line */}
      <div className="px-6 flex items-center gap-2 py-1">
        <span className="text-[13px] text-slate-500 font-medium">Báo cáo đang lọc theo</span>
        <div className="bg-[#e2e8f0] px-2 py-0.5 text-[12px] text-slate-600 font-bold border border-slate-300">
          Chi nhánh: Chi nhánh mặc định
        </div>
      </div>

      {/* Report Table */}
      <div className="px-6">
        <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden">
          <Table className="border-collapse">
            <TableHeader>
              {/* Row 1 Header */}
              <TableRow className="bg-[#5c7293] hover:bg-[#5c7293] border-b border-white/20">
                <TableHead rowSpan={2} className="text-white font-bold text-[11px] uppercase border-r border-white/10 text-center w-[60px]">STT</TableHead>
                <TableHead rowSpan={2} className="text-white font-bold text-[11px] uppercase border-r border-white/10 text-center w-[250px]">Phiên bản sản phẩm</TableHead>
                <TableHead rowSpan={2} className="text-white font-bold text-[11px] uppercase border-r border-white/10 text-center w-[100px]">Đơn vị tính</TableHead>
                <TableHead rowSpan={2} className="text-white font-bold text-[11px] uppercase border-r border-white/10 text-center w-[120px]">Loại sản phẩm</TableHead>
                <TableHead rowSpan={2} className="text-white font-bold text-[11px] uppercase border-r border-white/10 text-center w-[120px]">Mã SKU</TableHead>
                <TableHead colSpan={5} className="text-white font-bold text-[11px] uppercase text-center bg-[#4a5d7a]">Chi nhánh mặc định</TableHead>
              </TableRow>
              {/* Row 2 Header */}
              <TableRow className="bg-[#5c7293] hover:bg-[#5c7293]">
                <TableHead className="text-white font-bold text-[11px] uppercase border-r border-white/10 text-center w-[100px]">Tồn kho</TableHead>
                <TableHead className="text-white font-bold text-[11px] uppercase border-r border-white/10 text-center w-[100px]">Có thể bán</TableHead>
                <TableHead className="text-white font-bold text-[11px] uppercase border-r border-white/10 text-center w-[120px]">Đang giao dịch</TableHead>
                <TableHead className="text-white font-bold text-[11px] uppercase border-r border-white/10 text-center w-[120px]">Hàng đang về</TableHead>
                <TableHead className="text-white font-bold text-[11px] uppercase text-center w-[120px]">Hàng đang giao</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Summary Row */}
              <TableRow className="bg-white border-b border-[#eee] font-black">
                <TableCell colSpan={5} className="p-3 pl-6 text-[13px] text-slate-800 uppercase tracking-tight">Tổng 0 sản phẩm</TableCell>
                <TableCell className="p-3 text-center text-[13px] text-slate-800">0</TableCell>
                <TableCell className="p-3 text-center text-[13px] text-slate-800">0</TableCell>
                <TableCell className="p-3 text-center text-[13px] text-slate-800">0</TableCell>
                <TableCell className="p-3 text-center text-[13px] text-slate-800">0</TableCell>
                <TableCell className="p-3 text-center text-[13px] text-slate-800">0</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Empty State */}
          <div className="py-32 flex flex-col items-center justify-center bg-white min-h-[400px]">
            <div className="relative w-24 h-24 mb-6 text-slate-200">
              <Search size={96} strokeWidth={1} />
            </div>
            <p className="text-[18px] text-slate-500 font-medium tracking-tight">Báo cáo không có dữ liệu</p>
          </div>
        </div>
      </div>
    </div>
  );
}
