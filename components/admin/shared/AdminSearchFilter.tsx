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
import { cn } from "@/lib/utils";

interface FilterOption {
    label: string;
    value: string;
}

interface AdminSearchFilterProps {
    placeholder?: string;
    onSearch?: (val: string) => void;
    onRefresh?: () => void;

    // Tùy chọn ẩn hiện bộ lọc
    hideFilter1?: boolean;
    hideFilter2?: boolean; // ✅ THÊM BIẾN NÀY
    hideSort?: boolean;

    // Bộ lọc 1
    filter1Placeholder?: string;
    filter1Options?: FilterOption[];
    onFilter1Change?: (val: string) => void;

    // Bộ lọc 2
    filter2Placeholder?: string;
    filter2Options?: FilterOption[];
    onFilter2Change?: (val: string) => void;

    // Default values
    defaultFilter1Value?: string;
    defaultFilter2Value?: string;
    defaultSortValue?: string;

    // Sắp xếp
    onSortChange?: (val: string) => void;
    sortOptions?: FilterOption[];
}

export function AdminSearchFilter({
                                      placeholder = "Tìm kiếm...",
                                      onSearch,
                                      onRefresh,
                                      hideFilter1 = false,
                                      hideFilter2 = false, // ✅ KHAI BÁO MẶC ĐỊNH
                                      hideSort = false,
                                      filter1Placeholder = "Tất cả chi nhánh",
                                      filter1Options = [],
                                      filter2Placeholder = "Tất cả trạng thái",
                                      filter2Options = [
                                          { label: "Tất cả trạng thái", value: "all" },
                                          { label: "Đang hoạt động", value: "ACTIVE" },
                                          { label: "Tạm khóa", value: "INACTIVE" },
                                          { label: "Bị chặn", value: "BANNED" }
                                      ],
                                      onFilter1Change,
                                      onFilter2Change,
                                      defaultFilter1Value = "all",
                                      defaultFilter2Value = "all",
                                      defaultSortValue,
                                      onSortChange,
                                      sortOptions = [
                                          { label: "Mới nhất", value: "id,desc" },
                                          { label: "Cũ nhất", value: "id,asc" },
                                          { label: "Tên A-Z", value: "fullName,asc" },
                                          { label: "Tên Z-A", value: "fullName,desc" }
                                      ]
                                  }: AdminSearchFilterProps) {
    return (
        <div className="p-3 border-b border-slate-100 bg-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
                {/* Ô nhập tìm kiếm */}
                <div className="relative w-full max-w-[280px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input
                        placeholder={placeholder}
                        className="pl-10 h-[38px] text-[13px] bg-[#f9fafb] border-slate-200 rounded-md focus-visible:ring-blue-500/20 shadow-none focus:bg-white transition-all"
                        onChange={(e) => onSearch?.(e.target.value)}
                    />
                </div>

                {/* Bộ lọc 1 - (Chỉ render nếu hideFilter1 = false) */}
                {!hideFilter1 && (
                    <Select onValueChange={onFilter1Change} defaultValue={defaultFilter1Value}>
                        <SelectTrigger className="w-[200px] h-[38px] text-[13px] font-medium bg-white border-slate-200 rounded-md text-slate-600 shadow-none focus:ring-0">
                            <SelectValue placeholder={filter1Placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                            {filter1Options.map(opt => (
                                <SelectItem key={opt.value} value={opt.value} className="text-[13px]">
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {/* Bộ lọc 2 - Trạng thái (Chỉ render nếu hideFilter2 = false) */}
                {!hideFilter2 && (
                    <Select onValueChange={onFilter2Change} defaultValue={defaultFilter2Value}>
                        <SelectTrigger className="w-[180px] h-[38px] text-[13px] font-medium bg-white border-slate-200 rounded-md text-slate-600 shadow-none focus:ring-0">
                            <SelectValue placeholder={filter2Placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                            {filter2Options.map(opt => {
                                const val = opt.value.toUpperCase();
                                return (
                                    <SelectItem key={opt.value} value={opt.value} className={cn(
                                        "text-[13px] font-medium",
                                        val === "ACTIVE" ? "text-emerald-600" : val === "INACTIVE" ? "text-rose-600" : val === "BANNED" ? "text-red-600" : ""
                                    )}>
                                        {opt.label}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                )}

                {/* Sắp xếp - Only show if options are provided AND hideSort is false */}
                {!hideSort && sortOptions && sortOptions.length > 0 && (
                    <Select onValueChange={onSortChange} defaultValue={defaultSortValue || sortOptions[0]?.value}>
                        <SelectTrigger className="w-[140px] h-[38px] text-[13px] font-medium bg-white border-slate-200 rounded-md text-slate-600 shadow-none focus:ring-0">
                            <SelectValue placeholder="Sắp xếp" />
                        </SelectTrigger>
                        <SelectContent>
                            {sortOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value} className="text-[13px]">
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* Các nút chức năng bên phải */}
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-[38px] w-[38px] border-slate-200 bg-white rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 shadow-none transition-colors"
                    onClick={onRefresh}
                >
                    <RotateCw size={18} />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-[38px] w-[38px] border-slate-200 bg-white rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 shadow-none transition-colors"
                >
                    <Settings size={18} />
                </Button>
            </div>
        </div>
    );
}