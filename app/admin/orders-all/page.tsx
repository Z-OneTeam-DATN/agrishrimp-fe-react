"use client";

import React, { useState } from "react";
import {
  Search,
  Download,
  Filter,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ArrowUpDown,
  Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const MOCK_ALL_PARCELS = [
  {
    orderId: "#1002",
    parcelCode: "FUN0000002",
    parcelStatus: "Đã xử lý",
    deliveryStatus: "Chờ lấy hàng",
    packingStatus: "Chờ đóng gói",
    processedDate: "14/02/2026 11:03"
  },
  {
    orderId: "#1001",
    parcelCode: "FUN0000001",
    parcelStatus: "Đã xử lý",
    deliveryStatus: "Chờ lấy hàng",
    packingStatus: "Chờ đóng gói",
    processedDate: "14/02/2026 11:01"
  }
];

const STATS = [
  { label: "Đang vận chuyển", value: 0 },
  { label: "Đang hoàn hàng", value: 0 },
  { label: "Chờ xác nhận hoàn", value: 0 },
  { label: "Đã giao hàng", value: 0 },
  { label: "Đã hủy giao hàng", value: 0 },
];

export default function AllParcelsPage() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const toggleSelectAll = () => {
    if (selectedItems.length === MOCK_ALL_PARCELS.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(MOCK_ALL_PARCELS.map(item => item.orderId));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-4 space-y-4 bg-slate-50 min-h-screen">

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-[18px] font-bold text-slate-800">
          Tất cả kiện hàng: <span className="font-normal text-slate-600">Cửa hàng chính</span>
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-[32px] bg-white border-slate-300 text-slate-600 text-[12px] font-bold">
            <Download size={14} className="mr-2" /> Xuất file
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 bg-white rounded-[4px] border border-[#dcdcdc] shadow-sm divide-y md:divide-y-0 md:divide-x divide-slate-100">
        <div className="p-4 flex items-center justify-center md:justify-start">
            <Button variant="outline" className="h-[32px] text-[12px] text-slate-600 border-slate-200 bg-slate-50">
                <Calendar size={14} className="mr-2 text-slate-500" /> 7 ngày qua
            </Button>
        </div>

        {STATS.map((stat, index) => (
            <div key={index} className="p-4 flex flex-col justify-center">
                <span className="text-[12px] text-slate-500 mb-1">{stat.label}</span>
                <span className="text-[20px] font-bold text-slate-800 leading-none">{stat.value}</span>
            </div>
        ))}
      </div>

      <div className="bg-white p-3 rounded-[4px] border border-[#dcdcdc] shadow-sm space-y-3">
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="h-[34px] w-[34px] border border-slate-300 text-slate-400 shrink-0">
             <span className="text-xs">✕</span>
          </Button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              placeholder="Tìm kiếm theo mã đơn hàng, vận đơn, kiện hàng"
              className="pl-9 h-[34px] text-[13px] border-slate-300 bg-white focus:border-blue-500"
            />
          </div>
          <Button variant="outline" className="h-[34px] text-[12px] text-slate-600 border-slate-300 bg-slate-50">
            Lưu bộ lọc
          </Button>
          <Button variant="outline" className="h-[34px] text-[12px] text-slate-600 border-slate-300 bg-white">
            Sắp xếp <ChevronDown size={14} className="ml-1" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterButton label="Xem tất cả" icon />
          <FilterButton label="Trạng thái kiện hàng" />
          <FilterButton label="Đơn hàng hủy" />
          <FilterButton label="Trạng thái in" />
          <FilterButton label="Trạng thái đóng gói" />
          <FilterButton label="Trạng thái giao hàng" />
          <FilterButton label="Trạng thái bàn giao" />
        </div>
      </div>

      <div className="bg-white rounded-[4px] border border-[#dcdcdc] shadow-sm overflow-hidden">
        <div className="flex items-center border-b border-[#eee] px-4">
            <button className="py-3 px-4 text-[13px] font-bold border-b-2 border-blue-600 text-blue-600">
                Tất cả
            </button>
        </div>

        {selectedItems.length > 0 && (
          <div className="flex items-center gap-4 bg-blue-50 px-4 py-2 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 rounded-[2px] p-[1px]">
                <Minus size={12} className="text-white" />
              </div>
              <span className="text-[13px] text-slate-700">Đã chọn {selectedItems.length} kiện hàng</span>
            </div>

            <div className="h-4 w-[1px] bg-blue-200"></div>

            <button className="text-[13px] text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
              In hàng loạt <ChevronDown size={12} />
            </button>
            <button className="text-[13px] text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
              Đánh dấu in <ChevronDown size={12} />
            </button>
            <button className="text-[13px] text-blue-600 font-medium hover:text-blue-700">
              Chuyển trạng thái đóng gói
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-[28px] bg-white border-slate-300 text-slate-700 text-[12px] font-medium ml-auto">
                  Thao tác khác <ChevronDown size={12} className="ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem className="text-[13px] py-2 cursor-pointer">Thêm nhân viên đóng gói</DropdownMenuItem>
                <DropdownMenuItem className="text-[13px] py-2 cursor-pointer">Xóa nhân viên đóng gói</DropdownMenuItem>
                <DropdownMenuItem className="text-[13px] py-2 cursor-pointer">Giao hàng hàng loạt</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#f4f6f8]">
              <TableRow className="border-b border-slate-200 hover:bg-[#f4f6f8]">
                <TableHead className="w-[40px] pl-4"><Settings size={14} className="text-slate-400" /></TableHead>
                <TableHead className="w-[40px]">
                  <Checkbox
                    className="border-slate-300 data-[state=checked]:bg-blue-600"
                    checked={selectedItems.length === MOCK_ALL_PARCELS.length && MOCK_ALL_PARCELS.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">Mã đơn hàng</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">Mã kiện hàng</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">Trạng thái kiện hàng</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">Trạng thái giao hàng</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">Trạng thái đóng gói</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-slate-600">
                        Ngày xử lý <ArrowUpDown size={12} />
                    </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_ALL_PARCELS.map((item, index) => (
                <TableRow
                  key={index}
                  className={cn(
                    "border-b border-slate-100 hover:bg-slate-50 transition-colors",
                    selectedItems.includes(item.orderId) && "bg-blue-50/30"
                  )}
                >
                  <TableCell className="pl-4 text-center text-slate-400">
                     <Settings size={14} className="opacity-0" />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      className="border-slate-300 data-[state=checked]:bg-blue-600"
                      checked={selectedItems.includes(item.orderId)}
                      onCheckedChange={() => toggleSelectItem(item.orderId)}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="text-[13px] font-medium text-blue-600 hover:underline cursor-pointer">
                      {item.orderId}
                    </span>
                  </TableCell>
                  <TableCell className="text-[13px] text-slate-700">{item.parcelCode}</TableCell>
                  <TableCell>
                    <span className="px-2.5 py-0.5 rounded-[12px] text-[11px] bg-slate-100 text-slate-500 border border-slate-200">
                        {item.parcelStatus}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.deliveryStatus} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.packingStatus} />
                  </TableCell>
                  <TableCell className="text-[13px] text-slate-700">{item.processedDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-[#eee] bg-white">
          <span className="text-[12px] text-slate-500 font-medium">
            Từ 1 đến {MOCK_ALL_PARCELS.length} trên tổng {MOCK_ALL_PARCELS.length}
          </span>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <span className="text-[12px] text-slate-600">Hiển thị</span>
                <select className="h-[28px] text-[12px] border border-slate-300 rounded bg-white px-2 focus:outline-none focus:border-blue-500">
                    <option>20</option>
                    <option>50</option>
                    <option>100</option>
                </select>
                <span className="text-[12px] text-slate-600">Kết quả</span>
            </div>

            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-600" disabled>
                    <ChevronLeft size={16} />
                </Button>
                <Button variant="default" size="icon" className="h-7 w-7 bg-blue-600 text-[12px] font-bold hover:bg-blue-700">
                    1
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-600" disabled>
                    <ChevronRight size={16} />
                </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const FilterButton = ({ label, icon }: { label: string, icon?: boolean }) => (
  <Button variant="outline" className="h-[30px] px-3 text-[12px] font-medium text-slate-600 bg-white border-slate-300 hover:bg-slate-50 hover:text-blue-600 transition-all">
    {icon && <Filter size={12} className="mr-1.5" />}
    {label}
    <ChevronDown size={12} className="ml-1.5 opacity-70" />
  </Button>
);

const StatusBadge = ({ status }: { status: string }) => {
    const styles = "bg-[#fff7e6] text-[#fa8c16] border-[#ffe7ba]";

    return (
        <span className={cn("px-2.5 py-0.5 rounded-[12px] text-[11px] border", styles)}>
             {status}
        </span>
    )
}