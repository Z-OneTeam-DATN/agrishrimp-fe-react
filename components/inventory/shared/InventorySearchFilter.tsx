"use client";

import React from "react";
import { Search, RotateCw, Settings, Calendar, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface InventoryFiltersProps {
  type?: "RECEIPT" | "EXPORT" | "TRANSFER" | "PRODUCT" | "CHECK";
  onSearchChange?: (value: string) => void;
  onRefresh?: () => void;
  onSettings?: () => void;
}

export function InventorySearchFilter({
  type = "PRODUCT",
  onSearchChange,
  onRefresh,
  onSettings,
}: InventoryFiltersProps) {
  return (
    <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2 flex-1">
        {/* Main Search */}
        <div className="relative w-full max-w-[300px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <Input
            placeholder={
              type === "RECEIPT"
                ? "Mã phiếu, NCC, Mã sản phẩm..."
                : "Tìm kiếm tên, mã..."
            }
            className="pl-10 h-9 text-[13px] bg-white border-slate-200 rounded-lg focus-visible:ring-1 focus-visible:ring-blue-500 shadow-sm"
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>

        {/* Date Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-9 text-[13px] border-slate-200 bg-white font-medium text-slate-600 gap-2"
            >
              <Calendar size={14} />
              Toàn thời gian
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            {/* Date picker content would go here */}
            <div className="p-2 text-[12px] text-slate-500">Bộ chọn ngày</div>
          </PopoverContent>
        </Popover>

        {/* Branch/Warehouse Filter */}
        <Select defaultValue="all">
          <SelectTrigger className="w-[160px] h-9 text-[13px] bg-white border-slate-200 rounded-lg shadow-sm">
            <SelectValue placeholder="Kho: Tất cả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Kho: Tất cả</SelectItem>
            <SelectItem value="tong">Kho Tổng (Trụ sở)</SelectItem>
            <SelectItem value="st">Kho Sóc Trăng</SelectItem>
            <SelectItem value="bl">Kho Bạc Liêu</SelectItem>
          </SelectContent>
        </Select>

        {/* Specific Filters based on type */}
        {type === "RECEIPT" && (
          <>
            <Select defaultValue="all">
              <SelectTrigger className="w-[160px] h-9 text-[13px] bg-white border-slate-200 rounded-lg shadow-sm">
                <SelectValue placeholder="Nhà cung cấp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả NCC</SelectItem>
                <SelectItem value="cp">C.P. Việt Nam</SelectItem>
                <SelectItem value="grobest">Grobest Việt Nam</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="all">
              <SelectTrigger className="w-[160px] h-9 text-[13px] bg-white border-slate-200 rounded-lg shadow-sm font-bold text-rose-600">
                <SelectValue placeholder="Công nợ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả công nợ</SelectItem>
                <SelectItem value="debt">Còn nợ</SelectItem>
                <SelectItem value="paid">Đã trả hết</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}

        {type === "PRODUCT" && (
          <Select defaultValue="all">
            <SelectTrigger className="w-[150px] h-9 text-[13px] bg-white border-slate-200 rounded-lg shadow-sm">
              <SelectValue placeholder="Nhóm sản phẩm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả nhóm</SelectItem>
              <SelectItem value="thuc-an">Thức ăn tôm</SelectItem>
              <SelectItem value="thuoc">Thuốc thủy sản</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Button
          variant="ghost"
          className="h-9 text-[13px] text-blue-600 font-bold gap-1 hover:bg-blue-50"
        >
          <Filter size={14} />
          Bộ lọc nâng cao
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition-colors"
          onClick={onRefresh}
        >
          <RotateCw size={16} className="text-slate-500" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition-colors"
          onClick={onSettings}
        >
          <Settings size={16} className="text-slate-500" />
        </Button>
      </div>
    </div>
  );
}
