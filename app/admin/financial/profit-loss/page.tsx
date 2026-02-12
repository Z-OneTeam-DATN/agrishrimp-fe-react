"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, Download, HelpCircle, 
  Calendar, ChevronDown, ChevronRight, 
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default function ProfitLossReportPage() {
  const router = useRouter();

  const reportRows = [
    { id: "I", label: "I. Doanh thu bán hàng", prev: 0, current: 0, change: "0%", isBold: true },
    { id: "1", label: "1. Tiền hàng thực bán (1a - 1b)", prev: 0, current: 0, change: "0%", padding: "pl-8" },
    { id: "1a", label: "a. Tiền hàng bán ra", prev: 0, current: 0, change: "0%", padding: "pl-12", isItalic: true },
    { id: "1b", label: "b. Tiền hàng trả lại", prev: 0, current: 0, change: "0%", padding: "pl-12", isItalic: true },
    { id: "2", label: "2. Thuế VAT", prev: 0, current: 0, change: "0%", padding: "pl-8" },
    { id: "3", label: "3. Phí giao hàng thu của khách", prev: 0, current: 0, change: "0%", padding: "pl-8" },
    { id: "4", label: "4. Chiết khấu", prev: 0, current: 0, change: "0%", padding: "pl-8" },
    
    { id: "II", label: "II. Chi phí bán hàng (1 + 2 + 3)", prev: 0, current: 0, change: "0%", isBold: true, spaceTop: true },
    { id: "II-1", label: "1. Chi phí giá vốn hàng hóa", prev: 0, current: 0, change: "0%", padding: "pl-8" },
    { id: "II-2", label: "2. Thanh toán bằng điểm", prev: 0, current: 0, change: "0%", padding: "pl-8" },
    { id: "II-3", label: "3. Phí giao hàng trả đối tác", prev: 0, current: 0, change: "0%", padding: "pl-8" },

    { id: "III", label: "III. Thu nhập khác (1 + 2)", prev: 0, current: 0, change: "0%", isBold: true, spaceTop: true },
    { id: "III-1", label: "1. Phiếu thu khác hạch toán kết quả kinh doanh", prev: 0, current: 0, change: "0%", padding: "pl-8", hasLink: true },
    { id: "III-2", label: "2. Phí khách trả hàng", prev: 0, current: 0, change: "0%", padding: "pl-8" },

    { id: "IV", label: "IV. Chi phí khác", prev: 0, current: 0, change: "0%", isBold: true, spaceTop: true },
    { id: "IV-1", label: "1. Phiếu chi khác hạch toán kết quả kinh doanh", prev: 0, current: 0, change: "0%", padding: "pl-8", hasLink: true },

    { id: "RESULT", label: "Lợi nhuận (I + III - II - IV)", prev: 0, current: 0, change: "0%", isBold: true, isResult: true, spaceTop: true },
  ];

  return (
    <div className="space-y-0 pb-10 bg-[#f0f2f5] min-h-screen">
      {/* Primary Unified Header/Filter Bar */}
      <div className="px-6 py-3 flex items-center gap-6 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 border-r pr-6 border-slate-200">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push("/admin/financial")} 
            className="h-8 w-8 text-slate-500 hover:text-blue-600 transition-colors border border-slate-200 rounded-none"
          >
            <ChevronLeft size={20} />
          </Button>
          <h1 className="text-[18px] font-medium text-slate-800 tracking-tight whitespace-nowrap uppercase">Báo cáo lãi lỗ</h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[12px] font-bold text-slate-500 uppercase">Kỳ hiện tại</span>
          <div className="relative">
            <Input 
              value="11/01/2026 - 11/02/2026" 
              readOnly 
              className="h-8 w-[220px] pr-8 text-[12px] border-slate-300 rounded-none shadow-none bg-white font-medium"
            />
            <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[12px] font-bold text-slate-500 uppercase">Chi nhánh</span>
          <Select defaultValue="all">
            <SelectTrigger className="h-8 w-[180px] text-[12px] border-slate-300 rounded-none shadow-none bg-white font-medium focus:ring-0">
              <SelectValue placeholder="Tất cả chi nhánh" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="all">Tất cả chi nhánh</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="ms-auto flex items-center gap-6">
          <button className="flex items-center gap-1.5 text-[11px] text-slate-600 font-black hover:text-blue-600 transition-colors uppercase">
            <Download size={16} /> Xuất file
          </button>
          <button className="flex items-center gap-1.5 text-[11px] text-slate-600 font-black hover:text-blue-600 transition-colors uppercase">
            <HelpCircle size={16} /> Giải thích
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div className="p-4">
        <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden">
          <Table className="border-collapse">
            <TableHeader>
              <TableRow className="bg-[#5c7293] hover:bg-[#5c7293] h-12">
                <TableHead className="text-white font-bold text-[11px] uppercase border-r border-white/10 pl-6 w-[40%]">Chỉ tiêu báo cáo</TableHead>
                <TableHead className="text-white font-bold text-[11px] uppercase border-r border-white/10 text-center w-[20%]">
                  <p>Kỳ trước</p>
                  <p className="text-[9px] font-medium opacity-80">(10/12/2025 - 10/01/2026)</p>
                </TableHead>
                <TableHead className="text-white font-bold text-[11px] uppercase border-r border-white/10 text-center w-[20%]">
                  <p>Kỳ hiện tại</p>
                  <p className="text-[9px] font-medium opacity-80">(11/01/2026 - 11/02/2026)</p>
                </TableHead>
                <TableHead className="text-white font-bold text-[11px] uppercase text-center w-[20%]">% thay đổi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportRows.map((row) => (
                <TableRow 
                  key={row.id} 
                  className={cn(
                    "border-b border-slate-100 hover:bg-slate-50 transition-colors h-10",
                    row.isBold ? "bg-slate-50/30" : "bg-white",
                    row.isResult && "bg-blue-50/50 hover:bg-blue-50 border-t-2 border-t-blue-100"
                  )}
                >
                  <TableCell className={cn(
                    "py-2 text-[13px] border-r border-slate-50 flex items-center gap-2",
                    row.padding || "pl-6",
                    row.isBold ? "font-black text-slate-800" : "text-slate-600",
                    row.isItalic && "italic",
                    row.isResult && "text-blue-700"
                  )}>
                    {row.label}
                    {row.hasLink && <ChevronRight size={14} className="text-blue-400 cursor-pointer" />}
                  </TableCell>
                  <TableCell className={cn(
                    "py-2 text-center text-[13px] border-r border-slate-50",
                    row.isBold ? "font-black text-slate-800" : "text-slate-600"
                  )}>
                    {row.prev.toLocaleString()}
                  </TableCell>
                  <TableCell className={cn(
                    "py-2 text-center text-[13px] border-r border-slate-50",
                    row.isBold ? "font-black text-slate-800" : "text-slate-600"
                  )}>
                    {row.current.toLocaleString()}
                  </TableCell>
                  <TableCell className={cn(
                    "py-2 text-center text-[13px] font-bold",
                    row.change === "0%" ? "text-slate-400" : "text-emerald-600"
                  )}>
                    {row.change}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}