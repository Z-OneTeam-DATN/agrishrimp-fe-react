"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronDown,
  HelpCircle,
  Download,
  Search,
  X,
  UserMinus,
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
import { cn } from "@/lib/utils";

export default function CustomerDebtReportPage() {
  const router = useRouter();

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
          <h1 className="text-[18px] font-medium text-slate-800 tracking-tight whitespace-nowrap uppercase">
            Công nợ khách hàng
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[12px] font-bold text-slate-500 uppercase">
            Thời gian
          </span>
          <div className="flex items-center gap-0 border border-slate-300 bg-white px-3 h-8 cursor-pointer hover:bg-slate-50 transition-colors min-w-[200px]">
            <span className="text-[12px] text-slate-600 font-medium">
              13/01/2026 - 11/02/2026
            </span>
            <ChevronDown size={14} className="ml-auto text-slate-400" />
          </div>
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

      <div className="p-4">
        <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm min-h-[450px]">
          <div className="px-6 py-4 flex flex-wrap items-start gap-3 bg-[#fcfcfc] border-b border-slate-100">
            <div className="relative flex-1 min-w-[400px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                size={16}
              />
              <Input
                placeholder="Tìm kiếm theo tên, SĐT, mã khách hàng"
                className="h-[36px] pl-10 text-[13px] border-slate-200 rounded-none shadow-none focus:border-blue-500 w-full"
              />
            </div>

            <div className="flex items-center gap-0 border border-slate-200 h-[36px] px-3 bg-white cursor-pointer hover:bg-slate-50 group min-w-[160px]">
              <span className="text-[12px] text-slate-500 group-hover:text-slate-700">
                Nhân viên phụ trách
              </span>
              <ChevronDown size={14} className="ml-auto text-slate-300" />
            </div>

            <div className="flex items-center gap-0 border border-slate-200 h-[36px] px-3 bg-white cursor-pointer hover:bg-slate-50 group min-w-[120px]">
              <span className="text-[12px] text-slate-500 group-hover:text-slate-700">
                Nợ cuối kỳ
              </span>
              <ChevronDown size={14} className="ml-auto text-slate-300" />
            </div>
          </div>

          {/* Active Filter Tags */}
          <div className="px-6 py-2 flex items-center gap-2 bg-white border-b border-slate-50">
            <div className="bg-blue-50 text-blue-600 px-2 py-1 flex items-center gap-2 text-[10px] font-black uppercase border border-blue-100 tracking-tighter">
              Nợ cuối kỳ: Khác 0
              <button className="hover:text-blue-800">
                <X size={12} />
              </button>
            </div>
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6 border border-slate-100">
              <Search size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-[16px] font-bold text-slate-700 mb-2">
              Không tìm thấy khách hàng hoặc khách hàng không có công nợ
            </h3>
            <p className="text-[13px] text-slate-400 font-medium">
              Thử thay đổi điều kiện lọc hoặc từ khóa tìm kiếm để xem kết quả
              khác
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
