"use client";

import React, { useState } from "react";
import {
  Search,
  Download,
  ScanBarcode,
  Filter,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight
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
import { cn } from "@/lib/utils";

const MOCK_PACKING_ORDERS = [
  {
    id: "#1002",
    packageCode: "FUN0000002",
    waybillCode: "#1002",
    packingStatus: "Chờ đóng gói",
    deliveryStatus: "Chờ lấy hàng",
    deliveryPartner: "võ thanh",
  },
  {
    id: "#1001",
    packageCode: "FUN0000001",
    waybillCode: "#1001",
    packingStatus: "Chờ đóng gói",
    deliveryStatus: "Chờ lấy hàng",
    deliveryPartner: "câme",
  },
];

const TABS = [
  { id: "all", label: "Tất cả" },
  { id: "no_push", label: "Chưa đẩy vận chuyển" },
  { id: "no_print", label: "Chưa in" },
  { id: "printed", label: "Đã in" },
  { id: "no_pack", label: "Chưa đóng gói" },
  { id: "packed", label: "Đã đóng gói" },
];

export default function PackingPage() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="p-4 space-y-4 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-[18px] font-bold text-slate-800">
          In & đóng gói: <span className="font-normal text-slate-600">Cửa hàng chính</span>
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-[32px] bg-white border-slate-300 text-slate-600 text-[12px] font-bold">
            <Download size={14} className="mr-2" /> Xuất file
          </Button>
          <Button className="h-[32px] bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold">
            <ScanBarcode size={14} className="mr-2" /> Quét đóng gói
          </Button>
        </div>
      </div>

      <div className="bg-white p-3 rounded-[4px] border border-[#dcdcdc] shadow-sm space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              placeholder="Tìm kiếm theo mã đơn hàng, vận đơn, kiện hàng"
              className="pl-9 h-[34px] text-[13px] border-slate-300 bg-slate-50 focus:bg-white"
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
          <FilterButton label="Kênh bán hàng" />
          <FilterButton label="Trạng thái in" />
          <FilterButton label="Trạng thái đóng gói" />
          <FilterButton label="Loại kiện hàng" />
          <FilterButton label="Dịch vụ vận chuyển" />
        </div>
      </div>

      <div className="bg-white rounded-[4px] border border-[#dcdcdc] shadow-sm overflow-hidden">
        <div className="flex items-center border-b border-[#eee] px-4 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "py-3 px-4 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-blue-500 hover:border-blue-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#f4f6f8]">
              <TableRow className="border-b border-slate-200 hover:bg-[#f4f6f8]">
                <TableHead className="w-[40px] pl-4"><Settings size={14} className="text-slate-400" /></TableHead>
                <TableHead className="w-[40px]"><Checkbox className="border-slate-300" /></TableHead>
                <TableHead className="text-[12px] font-bold text-slate-700 uppercase">Mã đơn hàng</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-700 uppercase">Mã kiện hàng</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-700 uppercase">Mã vận đơn</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-700 uppercase">Trạng thái đóng gói</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-700 uppercase">Trạng thái giao hàng</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-700 uppercase">Đối tác giao hàng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_PACKING_ORDERS.length > 0 ? (
                MOCK_PACKING_ORDERS.map((order, index) => (
                  <TableRow key={index} className="hover:bg-blue-50/50 border-b border-slate-100 transition-colors">
                    <TableCell className="pl-4 text-center text-slate-400">
                    </TableCell>
                    <TableCell><Checkbox className="border-slate-300 data-[state=checked]:bg-blue-600" /></TableCell>
                    <TableCell>
                      <a href="#" className="text-[13px] font-medium text-blue-600 hover:underline hover:text-blue-700">
                        {order.id}
                      </a>
                    </TableCell>
                    <TableCell className="text-[13px] text-slate-700">{order.packageCode}</TableCell>
                    <TableCell className="text-[13px] text-slate-700">{order.waybillCode}</TableCell>
                    <TableCell>
                        <StatusBadge status={order.packingStatus} type="packing" />
                    </TableCell>
                    <TableCell>
                        <StatusBadge status={order.deliveryStatus} type="delivery" />
                    </TableCell>
                    <TableCell className="text-[13px] font-medium text-slate-700">{order.deliveryPartner}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-slate-400 text-[13px]">
                    Không tìm thấy kiện hàng nào phù hợp.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-[#eee] bg-white">
          <span className="text-[12px] text-slate-500 font-medium">
            Từ 1 đến {MOCK_PACKING_ORDERS.length} trên tổng {MOCK_PACKING_ORDERS.length}
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

const StatusBadge = ({ status, type }: { status: string, type: 'packing' | 'delivery' }) => {
    let styles = "bg-slate-100 text-slate-600 border-slate-200";

    if (status === "Chờ đóng gói") styles = "bg-[#fff7e6] text-[#fa8c16] border-[#ffe7ba]";
    if (status === "Chờ lấy hàng") styles = "bg-[#fff1f0] text-[#ff4d4f] border-[#ffccc7]";

    return (
        <span className={cn("px-2.5 py-0.5 rounded-[4px] text-[11px] font-bold border", styles)}>
            {status}
        </span>
    )
}