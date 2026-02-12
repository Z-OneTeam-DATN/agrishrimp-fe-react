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

interface FilterOption {
  label: string;
  value: string;
}

interface AdminSearchFilterProps {
  placeholder?: string;
  onSearch?: (val: string) => void;
  onRefresh?: () => void;
  
  // Các bộ lọc động
  filter1Placeholder?: string;
  filter1Options?: FilterOption[];
  filter1Value?: string;
  onFilter1Change?: (val: string) => void;

  filter2Placeholder?: string;
  filter2Options?: FilterOption[];
  filter2Value?: string;
  onFilter2Change?: (val: string) => void;
}

export function AdminSearchFilter({ 
  placeholder = "Tìm kiếm...", 
  onSearch, 
  onRefresh,
  filter1Placeholder = "Tất cả danh mục",
  filter1Options = [{ label: "Tất cả danh mục", value: "all" }],
  filter2Placeholder = "Trạng thái",
  filter2Options = [
    { label: "Đang kinh doanh", value: "active" },
    { label: "Ngừng kinh doanh", value: "inactive" }
  ],
  onFilter1Change,
  onFilter2Change
}: AdminSearchFilterProps) {
  return (
    <div className="p-2 border-b border-[#eee] bg-[#f8f9fa] flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2 flex-1">
        <div className="relative w-full max-w-[250px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <Input 
            placeholder={placeholder} 
            className="pl-8 h-[30px] text-[13px] bg-white border-[#ddd] rounded-[4px] focus-visible:ring-emerald-500/20 shadow-none"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
        
        {/* Bộ lọc 1 */}
        <Select onValueChange={onFilter1Change}>
          <SelectTrigger className="w-[160px] h-[30px] text-[12px] font-bold bg-white border-[#ddd] rounded-[4px] text-slate-600 shadow-none">
            <SelectValue placeholder={filter1Placeholder} />
          </SelectTrigger>
          <SelectContent>
            {filter1Options.map(opt => (
              <SelectItem key={opt.value} value={opt.value} className="text-[12px]">{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Bộ lọc 2 */}
        <Select onValueChange={onFilter2Change}>
          <SelectTrigger className="w-[160px] h-[30px] text-[12px] font-bold bg-white border-[#ddd] rounded-[4px] text-slate-600 shadow-none">
            <SelectValue placeholder={filter2Placeholder} />
          </SelectTrigger>
          <SelectContent>
            {filter2Options.map(opt => (
              <SelectItem key={opt.value} value={opt.value} className="text-[12px]">{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
