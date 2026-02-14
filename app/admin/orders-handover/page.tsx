"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Download,
  PlusCircle,
  Filter,
  Settings,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  FileText,
  Truck,
  Package,
  Calendar,
  User
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

const MOCK_HANDOVERS = [
  {
    id: "BG260214-001",
    createdDate: "14/02/2026 13:45",
    carrier: "Giao Hàng Tiết Kiệm",
    totalOrders: 12,
    totalWeight: "25.5kg",
    status: "Đã bàn giao",
    creator: "Admin Agri",
    orders: [
      { id: "#1005", weight: "1.2kg", cod: "6.000.000đ", products: "Men vi sinh BZT, Khoáng tạt" },
      { id: "#1007", weight: "0.5kg", cod: "450.000đ", products: "Thuốc tím (500g)" },
      { id: "#1008", weight: "5.0kg", cod: "2.100.000đ", products: "Vôi Dolomite" }
    ]
  },
  {
    id: "BG260214-002",
    createdDate: "14/02/2026 14:30",
    carrier: "J&T Express",
    totalOrders: 5,
    totalWeight: "12.5kg",
    status: "Chờ bàn giao",
    creator: "Kho Cà Mau",
    orders: [
      { id: "#1006", weight: "2.5kg", cod: "2.500.000đ", products: "Bộ Test Kit Sera 9 chỉ tiêu" },
      { id: "#1009", weight: "10kg", cod: "0đ", products: "Vó tôm 2m (Đã thanh toán)" }
    ]
  }
];

const HANDOVER_TABS = [
  { id: "all", label: "Tất cả" },
  { id: "waiting", label: "Chờ bàn giao" },
  { id: "completed", label: "Đã bàn giao" },
];

export default function HandoverPage() {
  const router = useRouter(); // 2. Khởi tạo router
  const [activeTab, setActiveTab] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  return (
    <div className="p-4 space-y-4 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-[18px] font-bold text-slate-800">
          Bàn giao vận chuyển: <span className="font-normal text-slate-600">Cửa hàng chính</span>
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-[32px] bg-white border-slate-300 text-slate-600 text-[12px] font-bold">
            <Download size={14} className="mr-2" /> Xuất file
          </Button>

          <Button
            onClick={() => router.push('/admin/orders-handover/create')}
            className="h-[32px] bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold"
          >
            <PlusCircle size={14} className="mr-2" /> Tạo biên bản
          </Button>
        </div>
      </div>

      <div className="bg-white p-3 rounded-[4px] border border-[#dcdcdc] shadow-sm space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              placeholder="Tìm kiếm theo mã phiếu bàn giao, mã vận đơn..."
              className="pl-9 h-[34px] text-[13px] border-slate-300 bg-white focus:border-blue-500"
            />
          </div>
          <Button variant="outline" className="h-[34px] text-[12px] text-slate-600 border-slate-300 bg-slate-50">
            Lưu bộ lọc
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterButton label="Xem tất cả" icon />
          <FilterButton label="Đối tác vận chuyển" />
          <FilterButton label="Trạng thái bàn giao" />
          <FilterButton label="Người tạo" />
          <FilterButton label="Thời gian tạo" />
        </div>
      </div>

      <div className="bg-white rounded-[4px] border border-[#dcdcdc] shadow-sm overflow-hidden">
        <div className="flex items-center border-b border-[#eee] px-4 overflow-x-auto">
          {HANDOVER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "py-3 px-4 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 font-bold"
                  : "border-transparent text-slate-600 hover:text-blue-500"
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
                <TableHead className="text-[12px] font-bold text-slate-800">Mã phiếu <SortIcon /></TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">Thời gian tạo <SortIcon /></TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">Đối tác vận chuyển</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800 text-center">Số lượng kiện</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800 text-center">Trạng thái</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">Người tạo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_HANDOVERS.map((item) => {
                const isExpanded = expandedId === item.id;

                return (
                  <React.Fragment key={item.id}>
                    <TableRow
                      className={cn(
                        "border-b border-slate-100 transition-colors cursor-pointer hover:bg-slate-50",
                        isExpanded && "bg-blue-50/30"
                      )}
                      onClick={() => toggleRow(item.id)}
                    >
                      <TableCell className="pl-4 text-center text-slate-400">
                        {isExpanded ? (
                           <ChevronDown size={14} className="text-blue-600" />
                        ) : (
                           <ChevronRight size={14} className="hover:text-blue-600" />
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox className="border-slate-300 data-[state=checked]:bg-blue-600" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                            <FileText size={14} className="text-slate-400" />
                            <span className="text-[13px] font-medium text-blue-600 hover:underline">
                            {item.id}
                            </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-700">
                        <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-slate-400" />
                            {item.createdDate}
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-700 font-bold">
                        <div className="flex items-center gap-1.5">
                            <Truck size={13} className="text-slate-400" />
                            {item.carrier}
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-800 text-center font-bold">
                        {item.totalOrders} <span className="text-[11px] font-normal text-slate-500">kiện</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-700">
                        <div className="flex items-center gap-1.5">
                            <User size={13} className="text-slate-400" />
                            {item.creator}
                        </div>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow className="bg-[#f8fbff] hover:bg-[#f8fbff]">
                        <TableCell colSpan={8} className="p-0 border-b border-blue-100">
                          <div className="p-4 pl-[60px]">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-[12px] font-bold text-slate-800 uppercase flex items-center gap-2">
                                    <Package size={14} /> Danh sách đơn hàng trong phiếu
                                </h3>
                                {/* Nút này chỉ để IN, không chuyển trang */}
                                <Button size="sm" variant="outline" className="h-[28px] text-[12px] font-bold border-slate-300 bg-white">
                                    <FileText size={14} className="mr-1.5" /> In biên bản bàn giao
                                </Button>
                            </div>

                            <div className="border border-slate-200 rounded-[3px] overflow-hidden bg-white max-w-5xl">
                                <table className="w-full text-left">
                                    <thead className="bg-[#f4f6f8] text-[11px] font-bold text-slate-600 uppercase">
                                        <tr>
                                            <th className="p-2 pl-3">Mã đơn hàng</th>
                                            <th className="p-2">Chi tiết hàng hóa</th>
                                            <th className="p-2 text-center">Trọng lượng</th>
                                            <th className="p-2 text-right">Tiền thu hộ (COD)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {item.orders.map((order, idx) => (
                                            <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                                <td className="p-2 pl-3">
                                                    <span className="text-[12px] font-medium text-blue-600">{order.id}</span>
                                                </td>
                                                <td className="p-2 text-[12px] text-slate-600">{order.products}</td>
                                                <td className="p-2 text-[12px] text-slate-700 text-center">{order.weight}</td>
                                                <td className="p-2 text-right text-[12px] font-bold text-slate-800">{order.cod}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-3">
                                <button
                                onClick={() => setExpandedId(null)}
                                className="flex items-center text-[12px] font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                <ChevronUp size={14} className="mr-1" /> Thu gọn
                                </button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-[#eee] bg-white">
          <span className="text-[12px] text-slate-500 font-medium">
            Từ 1 đến {MOCK_HANDOVERS.length} trên tổng {MOCK_HANDOVERS.length}
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

const SortIcon = () => (
    <span className="ml-1 inline-flex flex-col gap-[1px] align-middle opacity-40">
        <ChevronUp size={8} />
        <ChevronDown size={8} />
    </span>
)

const StatusBadge = ({ status }: { status: string }) => {
    let styles = "bg-slate-100 text-slate-600 border-slate-200";

    if (status === "Chờ bàn giao") styles = "bg-[#fff7e6] text-[#fa8c16] border-[#ffe7ba]";
    if (status === "Đã bàn giao") styles = "bg-[#f6ffed] text-[#52c41a] border-[#b7eb8f]";

    return (
        <span className={cn("px-2.5 py-0.5 rounded-[10px] text-[11px] border", styles)}>
             ○ {status}
        </span>
    )
}