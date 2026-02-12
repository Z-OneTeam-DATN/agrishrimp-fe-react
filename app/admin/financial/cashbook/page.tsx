"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronDown, ChevronLeft, HelpCircle, Download, FileText, 
  Search, Filter, Plus, Minus, Equal, 
  RotateCcw, Landmark, User, MessageSquare, 
  Wallet, Receipt, Calculator, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function CashbookPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="space-y-0 pb-10 bg-[#f0f2f5] min-h-screen">
      {/* Primary Filter Bar */}
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
          <h1 className="text-[18px] font-medium text-slate-800 tracking-tight whitespace-nowrap">Sổ quỹ</h1>
        </div>

        <div className="flex items-center gap-0 border border-slate-300 bg-white">
          <Select defaultValue="record-date">
            <SelectTrigger className="h-8 w-[130px] text-[12px] border-none rounded-none shadow-none focus:ring-0 font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="record-date">Ngày ghi nhận</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-0 border border-slate-300 bg-white px-3 h-8 cursor-pointer hover:bg-slate-50 transition-colors">
          <span className="text-[12px] text-slate-600 font-medium">12/01/2026 - 11/02/2026</span>
          <ChevronDown size={14} className="ml-4 text-slate-400" />
        </div>

        <div className="ms-auto flex items-center gap-6">
          <button className="flex items-center gap-1.5 text-[12px] text-slate-600 font-bold hover:text-blue-600 transition-colors uppercase">
            <Download size={16} /> Xuất file
          </button>
          <button className="flex items-center gap-1.5 text-[12px] text-slate-600 font-bold hover:text-blue-600 transition-colors uppercase">
            <HelpCircle size={16} /> Giải thích
          </button>
        </div>
      </div>

      {/* Summary Math Formula Bar */}
      <div className="px-6 py-6 bg-white border-b border-slate-200 flex items-center justify-center gap-12">
        <div className="text-center group cursor-pointer">
          <p className="text-[12px] text-slate-500 font-medium mb-1 group-hover:text-blue-600 transition-colors">Số dư đầu kì</p>
          <p className="text-[18px] font-bold text-slate-800">0</p>
        </div>
        
        <Plus size={20} className="text-slate-300 mt-4" />

        <div className="text-center group cursor-pointer">
          <p className="text-[12px] text-slate-500 font-medium mb-1 group-hover:text-emerald-600 transition-colors uppercase">Tổng thu</p>
          <p className="text-[18px] font-bold text-emerald-600">0</p>
        </div>

        <Minus size={20} className="text-slate-300 mt-4" />

        <div className="text-center group cursor-pointer">
          <p className="text-[12px] text-slate-500 font-medium mb-1 group-hover:text-rose-600 transition-colors uppercase">Tổng chi</p>
          <p className="text-[18px] font-bold text-rose-600">0</p>
        </div>

        <Equal size={20} className="text-slate-300 mt-4" />

        <div className="text-center group cursor-pointer">
          <p className="text-[12px] text-slate-500 font-medium mb-1 group-hover:text-blue-600 transition-colors uppercase">Tồn cuối kì</p>
          <p className="text-[18px] font-black text-blue-600">0</p>
        </div>
      </div>

      {/* Tabs & Main Content Area */}
      <div className="p-4">
        <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm min-h-[500px]">
          {/* Tabs */}
          <div className="px-6 border-b border-slate-100 flex items-center h-12 bg-[#fcfcfc]">
            <div className="flex items-center gap-1 h-full">
              <button 
                onClick={() => setActiveTab("all")}
                className={cn(
                  "h-full px-4 text-[13px] font-bold uppercase tracking-wider transition-all border-b-2",
                  activeTab === "all" ? "text-blue-600 border-blue-600" : "text-slate-400 border-transparent hover:text-slate-600"
                )}
              >
                Tất cả
              </button>
              <button 
                onClick={() => setActiveTab("payment")}
                className={cn(
                  "h-full px-4 text-[13px] font-bold uppercase tracking-wider transition-all border-b-2",
                  activeTab === "payment" ? "text-blue-600 border-blue-600" : "text-slate-400 border-transparent hover:text-slate-600"
                )}
              >
                Phiếu chi
              </button>
              <button 
                onClick={() => setActiveTab("receipt")}
                className={cn(
                  "h-full px-4 text-[13px] font-bold uppercase tracking-wider transition-all border-b-2",
                  activeTab === "receipt" ? "text-blue-600 border-blue-600" : "text-slate-400 border-transparent hover:text-slate-600"
                )}
              >
                Phiếu thu
              </button>
            </div>
          </div>

          {/* Search & Secondary Filter Bar */}
          <div className="px-6 py-4 flex flex-wrap items-center gap-3 bg-white border-b border-slate-100">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <Input 
                placeholder="Tìm kiếm theo Mã phiếu, Mã chứng từ gốc, Tag" 
                className="h-[36px] pl-10 text-[13px] border-slate-200 rounded-none shadow-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-0 border border-slate-200 h-[36px] px-3 bg-white cursor-pointer hover:bg-slate-50 group">
              <span className="text-[12px] text-slate-500 group-hover:text-slate-700">Người tạo</span>
              <ChevronDown size={14} className="ml-4 text-slate-300" />
            </div>

            <div className="flex items-center gap-0 border border-slate-200 h-[36px] px-3 bg-white cursor-pointer hover:bg-slate-50 group">
              <span className="text-[12px] text-slate-500 group-hover:text-slate-700">Chi nhánh</span>
              <ChevronDown size={14} className="ml-4 text-slate-300" />
            </div>

            <div className="flex items-center gap-0 border border-slate-200 h-[36px] px-3 bg-white cursor-pointer hover:bg-slate-50 group">
              <span className="text-[12px] text-slate-500 group-hover:text-slate-700">Hình thức thanh toán</span>
              <ChevronDown size={14} className="ml-4 text-slate-300" />
            </div>

            <Button variant="outline" className="h-[36px] rounded-none border-slate-200 text-slate-500 font-medium text-[12px] hover:bg-slate-50">
              Bộ lọc khác <Filter size={14} className="ml-2 text-slate-400" />
            </Button>
          </div>

          {/* Empty State - Table Placeholder */}
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
              <Search size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-[16px] font-bold text-slate-700 mb-2">
              Không tìm thấy dữ liệu phù hợp với kết quả tìm kiếm
            </h3>
            <p className="text-[13px] text-slate-400 font-medium">
              Thử thay đổi điều kiện lọc hoặc từ khóa tìm kiếm
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
