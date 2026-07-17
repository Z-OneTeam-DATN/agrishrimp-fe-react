"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Download,
  Printer,
  HelpCircle,
  Search,
} from "lucide-react";
import { SharedDatePicker } from "@/components/admin/shared/BirthDatePicker";
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

export default function InventoryLedgerReportPage() {
  const router = useRouter();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  return (
    <div className="space-y-4 pb-10 bg-[#f0f2f5] min-h-screen">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/reports/inventory")}
            className="h-8 w-8 text-slate-500 border border-slate-200 rounded-none"
          >
            <ChevronLeft size={20} />
          </Button>
          <h1 className="text-[20px] font-medium text-slate-800">Sổ kho</h1>
        </div>
        <div className="flex items-center gap-6 text-[13px] font-medium text-slate-600">
          <button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
            <Download size={16} /> Xuất báo cáo
          </button>
          <button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
            <Printer size={16} /> In báo cáo
          </button>
          <button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
            <HelpCircle size={16} /> Giải thích thuật ngữ
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-2 flex items-center gap-4 bg-white/50">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-slate-700">Từ ngày</span>
          <SharedDatePicker
            value={dateFrom}
            onChange={setDateFrom}
            placeholder="Từ ngày"
            variant="compact"
            buttonClassName="h-8 w-[140px] border-slate-300 rounded-none text-[13px] shadow-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-slate-700">Đến ngày</span>
          <SharedDatePicker
            value={dateTo}
            onChange={setDateTo}
            placeholder="Đến ngày"
            variant="compact"
            buttonClassName="h-8 w-[140px] border-slate-300 rounded-none text-[13px] shadow-none"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="h-8 w-[160px] text-[13px] border-slate-300 rounded-none shadow-none bg-white">
            <SelectValue placeholder="Loại giao dịch" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all">Tất cả giao dịch</SelectItem>
            <SelectItem value="import">Nhập kho</SelectItem>
            <SelectItem value="export">Xuất kho</SelectItem>
            <SelectItem value="transfer">Điều chuyển</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Info Line */}
      <div className="px-6 flex items-center gap-2 py-1">
        <span className="text-[13px] text-slate-500">Báo cáo đang lọc theo</span>
        <div className="bg-[#e2e8f0] px-2 py-0.5 text-[12px] text-slate-600 font-medium">
          Chi nhánh: Chi nhánh mặc định
        </div>
      </div>

      {/* Report Table */}
      <div className="px-6">
        <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden">
          <Table className="border-collapse">
            <TableHeader>
              <TableRow className="bg-[#5c7293] hover:bg-[#5c7293]">
                <TableHead className="text-white font-bold text-[11px] uppercase border-r border-white/10 text-center w-[50px]">STT</TableHead>
                <TableHead className="text-white font-bold text-[11px] uppercase border-r border-white/10 text-center w-[140px]">Thời gian</TableHead>
                <TableHead className="text-white font-bold text-[11px] uppercase border-r border-white/10 text-center w-[220px]">Phiên bản sản phẩm</TableHead>
                <TableHead className="text-white font-bold text-[11px] uppercase border-r border-white/10 text-center w-[100px]">Mã SKU</TableHead>
                <TableHead className="text-white font-bold text-[11px] uppercase border-r border-white/10 text-center w-[140px]">Loại giao dịch</TableHead>
                <TableHead className="text-white font-bold text-[11px] uppercase border-r border-white/10 text-center w-[100px]">Số lượng</TableHead>
                <TableHead className="text-white font-bold text-[11px] uppercase border-r border-white/10 text-center w-[100px]">Tồn trước</TableHead>
                <TableHead className="text-white font-bold text-[11px] uppercase border-r border-white/10 text-center w-[100px]">Tồn sau</TableHead>
                <TableHead className="text-white font-bold text-[11px] uppercase text-center w-[120px]">Người tạo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-white border-b border-[#eee] font-black">
                <TableCell colSpan={9} className="p-3 pl-6 text-[13px] text-slate-800">
                  Tổng 0 giao dịch
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Empty State */}
          <div className="py-32 flex flex-col items-center justify-center bg-white min-h-[400px]">
            <div className="relative w-24 h-24 mb-6 text-slate-200">
              <Search size={96} strokeWidth={1} />
            </div>
            <p className="text-[18px] text-slate-500 font-medium tracking-tight">
              Báo cáo không có dữ liệu
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
