"use client";

import React from "react";
import { Search, RotateCw, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils"; // Ưu tiên dùng hàm cn có sẵn trong lib của bạn

interface FilterOption {
  label: string;
  value: string;
}

interface AdminSearchFilterProps {
  placeholder?: string;
  onSearch?: (val: string) => void;
  onRefresh?: () => void;
  
  // Bộ lọc 1 (Danh mục - Dữ liệu gọi từ API trang danh mục)
  filter1Placeholder?: string;
  filter1Options?: FilterOption[]; // Nhận danh sách category động từ ngoài vào
  onFilter1Change?: (val: string) => void;

  // Bộ lọc 2 (Trạng thái - Giữ nguyên vì status thường cố định theo Enum)
  filter2Placeholder?: string;
  filter2Options?: FilterOption[];
  onFilter2Change?: (val: string) => void;
}

export function AdminSearchFilter({ 
  placeholder = "Tìm kiếm...", 
  onSearch, 
  onRefresh,
  filter1Placeholder = "Tất cả danh mục",
  filter1Options = [], // Mặc định rỗng để chờ dữ liệu từ API
  filter2Placeholder = "Trạng thái",
  filter2Options = [
    { label: "Tất cả trạng thái", value: "all" },
    { label: "ĐANG KINH DOANH", value: "ACTIVE" },
    { label: "NGỪNG KINH DOANH", value: "INACTIVE" }
  ],
  onFilter1Change,
  onFilter2Change
}: AdminSearchFilterProps) {
  return (
    <div className="p-2 border-b border-[#eee] bg-[#f8f9fa] flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 flex-1">
        {/* Ô nhập tìm kiếm */}
        <div className="relative w-full max-w-[250px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <Input 
            placeholder={placeholder} 
            className="pl-8 h-[30px] text-[12px] bg-white border-[#ddd] rounded-[4px] focus-visible:ring-emerald-500/20 shadow-none"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
        
        {/* Bộ lọc 1 - Danh mục (Dữ liệu động) */}
        <Select onValueChange={onFilter1Change} defaultValue="all">
          <SelectTrigger className="w-[160px] h-[30px] text-[11px] font-medium bg-white border-[#ddd] rounded-[4px] text-slate-600 shadow-none focus:ring-0">
            <SelectValue placeholder={filter1Placeholder} />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            {filter1Options.map(opt => (
              <SelectItem key={opt.value} value={opt.value} className="text-[11px]">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Bộ lọc 2 - Trạng thái */}
        <Select onValueChange={onFilter2Change} defaultValue="all">
          <SelectTrigger className="w-[160px] h-[30px] text-[11px] font-bold bg-white border-[#ddd] rounded-[4px] text-slate-600 shadow-none focus:ring-0">
            <SelectValue placeholder={filter2Placeholder} />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            {filter2Options.map(opt => {
              const val = opt.value.toUpperCase();
              return (
                <SelectItem key={opt.value} value={opt.value} className={cn(
                  "text-[11px] font-bold",
                  val === "ACTIVE" ? "text-emerald-600" : val === "INACTIVE" ? "text-rose-600" : ""
                )}>
                  {opt.label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Các nút chức năng bên phải */}
      <div className="flex items-center gap-1">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-[30px] w-[30px] border-[#ddd] bg-white rounded-[4px] text-slate-400 hover:text-emerald-600 shadow-none"
          onClick={onRefresh}
        >
          <RotateCw size={14} className="text-gray-500" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-[30px] w-[30px] border-[#ddd] bg-white rounded-[4px] text-slate-400 hover:text-emerald-600 shadow-none"
        >
          <Settings size={14} className="text-gray-500" />
        </Button>
      </div>
    </div>
  );
}