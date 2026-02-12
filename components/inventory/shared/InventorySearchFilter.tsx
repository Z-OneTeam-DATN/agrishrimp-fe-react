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

interface InventoryFiltersProps {
  onSearchChange?: (value: string) => void;
  onRefresh?: () => void;
  onSettings?: () => void;
}

export function InventorySearchFilter({ 
  onSearchChange, 
  onRefresh, 
  onSettings 
}: InventoryFiltersProps) {
  return (
    <div className="p-2 border-b border-[#eee] bg-[#f8f9fa] flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2 flex-1">
        <div className="relative w-full max-w-[250px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <Input 
            placeholder="Tìm kiếm tên, mã..." 
            className="pl-8 h-[30px] text-[13px] bg-white border-[#ddd] rounded-[4px]" 
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
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
        <Button 
          variant="outline" 
          size="icon" 
          className="h-[30px] w-[30px] border-[#ddd] bg-white"
          onClick={onRefresh}
        >
          <RotateCw size={14} className="text-gray-500" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-[30px] w-[30px] border-[#ddd] bg-white"
          onClick={onSettings}
        >
          <Settings size={14} className="text-gray-500" />
        </Button>
      </div>
    </div>
  );
}
