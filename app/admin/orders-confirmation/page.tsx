"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Search,
  Download,
  PlusCircle,
  Filter,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronUp,
  Printer
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

const MOCK_ORDERS = [
  {
    id: "#1003",
    createdDate: "14/02/2026 11:06",
    customer: {
      name: "Trại tôm Năm Căn",
      phone: "0988888888",
      address: "Ấp Rạch Chèo, Xã Rạch Chèo, Huyện Phú Tân, Cà Mau, Vietnam"
    },
    source: "Admin",
    totalAmount: "2.500.000đ",
    paymentStatus: "Chưa thanh toán",
    processingStatus: "Chưa xử lý",
    shippingService: "",
    note: "Giao gấp trong ngày",
    tags: "Khách VIP",
    products: [
      {
        id: 1,
        name: "Thức ăn tôm thẻ chân trắng Grow 1 (Đạm 42%)",
        image: "https://images.unsplash.com/photo-1559563362-c667ba5f5480?auto=format&fit=crop&q=80&w=100&h=100",
        quantity: 5,
        price: "400.000đ",
        total: "2.000.000đ"
      },
      {
        id: 2,
        name: "Khoáng tạt Vôi Dolomite (Bao 25kg)",
        image: "https://images.unsplash.com/photo-1627483262268-9c96d8aa10d8?auto=format&fit=crop&q=80&w=100&h=100",
        quantity: 2,
        price: "250.000đ",
        total: "500.000đ"
      }
    ]
  },
];

const PAYMENT_TABS = [
  { id: "all", label: "Tất cả" },
  { id: "unpaid", label: "Chưa thanh toán" },
  { id: "paid", label: "Đã thanh toán" },
];

export default function ConfirmationPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    if (expandedOrderId === id) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(id);
    }
  };

  return (
    <div className="p-4 space-y-4 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-[18px] font-bold text-slate-800">
          Chờ xác nhận: <span className="font-normal text-slate-600">Cửa hàng chính</span>
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-[32px] bg-white border-slate-300 text-slate-600 text-[12px] font-bold">
            <Download size={14} className="mr-2" /> Xuất file
          </Button>
          <Button className="h-[32px] bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold">
            <PlusCircle size={14} className="mr-2" /> Tạo đơn hàng
          </Button>
        </div>
      </div>

      <div className="bg-white p-3 rounded-[4px] border border-[#dcdcdc] shadow-sm space-y-3">
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="h-[34px] w-[34px] border border-slate-300 text-slate-400">
             <span className="text-xs">✕</span>
          </Button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              placeholder="Tìm kiếm theo mã đơn hàng, vận đơn, SĐT khách hàng"
              className="pl-9 h-[34px] text-[13px] border-slate-300 bg-white focus:border-blue-500"
            />
          </div>
          <Button variant="outline" className="h-[34px] text-[12px] text-slate-600 border-slate-300 bg-slate-50">
            Lưu bộ lọc
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterButton label="Xem tất cả" icon />
          <FilterButton label="Kênh bán hàng" />
          <FilterButton label="Trạng thái thanh toán" />
          <FilterButton label="Dịch vụ vận chuyển" />
          <FilterButton label="Ngày đặt hàng" />
          <FilterButton label="Nhân viên phụ trách" />
        </div>
      </div>

      <div className="bg-white rounded-[4px] border border-[#dcdcdc] shadow-sm overflow-hidden">
        <div className="flex items-center border-b border-[#eee] px-4">
          {PAYMENT_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "py-3 px-4 text-[13px] font-medium border-b-2 transition-colors",
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
                <TableHead className="text-[12px] font-bold text-slate-800">Mã đơn hàng <SortIcon /></TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">Ngày đặt hàng <SortIcon /></TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">Khách hàng</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">Nguồn đơn <SortIcon /></TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800 text-right">Thành tiền</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800 text-center">Trạng thái thanh toán</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800 text-center">Trạng thái xử lý</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">Dịch vụ vận chuyển</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_ORDERS.map((order) => {
                const isExpanded = expandedOrderId === order.id;

                return (
                  <React.Fragment key={order.id}>
                    <TableRow
                      className={cn(
                        "border-b border-slate-100 transition-colors cursor-pointer hover:bg-slate-50",
                        isExpanded && "bg-blue-50/30"
                      )}
                      onClick={() => toggleRow(order.id)}
                    >
                      <TableCell className="pl-4 text-center text-slate-400">
                        {isExpanded ? (
                           <ChevronDown size={14} className="text-blue-600" />
                        ) : (
                           <ChevronsRight size={14} className="hover:text-blue-600" />
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox className="border-slate-300 data-[state=checked]:bg-blue-600" />
                      </TableCell>
                      <TableCell>
                        <span className="text-[13px] font-medium text-blue-600 hover:underline">
                          {order.id}
                        </span>
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-700">{order.createdDate}</TableCell>
                      <TableCell>
                        <span className="text-[13px] text-blue-600 hover:underline">{order.customer.name}</span>
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-700">{order.source}</TableCell>
                      <TableCell className="text-[13px] font-medium text-slate-800 text-right">{order.totalAmount}</TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={order.paymentStatus} type="payment" />
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={order.processingStatus} type="processing" />
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-700">{order.shippingService}</TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow className="bg-[#f8fbff] hover:bg-[#f8fbff]">
                        <TableCell colSpan={10} className="p-0 border-b border-blue-100">
                          <div className="flex flex-col md:flex-row p-4 gap-6">

                            <div className="w-full md:w-[30%] space-y-4 border-r border-slate-200 pr-6">
                              <div>
                                <h3 className="text-[12px] font-bold text-slate-800 mb-2">Khách hàng</h3>
                                <div className="text-[13px] text-blue-600 font-medium mb-1">
                                  {order.customer.name} - {order.customer.phone}
                                </div>
                                <div className="text-[12px] text-slate-600 leading-relaxed">
                                  {order.customer.address}
                                </div>
                              </div>

                              <div className="border-t border-slate-100 pt-3">
                                <h3 className="text-[12px] font-bold text-slate-800 mb-1">Ghi chú</h3>
                                <p className="text-[12px] text-slate-500 italic">{order.note || "---"}</p>
                              </div>

                              <div className="border-t border-slate-100 pt-3">
                                <h3 className="text-[12px] font-bold text-slate-800 mb-1">Tag</h3>
                                <p className="text-[12px] text-slate-500">{order.tags || "---"}</p>
                              </div>
                            </div>

                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-[12px] font-bold text-slate-800">Sản phẩm</h3>
                                    <Button size="sm" className="h-[28px] bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold">
                                        <Printer size={14} className="mr-1.5" /> In đơn
                                    </Button>
                                </div>

                                <div className="border border-slate-200 rounded-[3px] overflow-hidden bg-white">
                                    <table className="w-full text-left">
                                        <thead className="bg-[#f4f6f8] text-[11px] font-bold text-slate-600 uppercase">
                                            <tr>
                                                <th className="p-2 pl-3">Sản phẩm</th>
                                                <th className="p-2 text-center">Số lượng</th>
                                                <th className="p-2 text-right">Đơn giá</th>
                                                <th className="p-2 text-right pr-3">Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {order.products.map((prod) => (
                                                <tr key={prod.id} className="border-b border-slate-100 last:border-0">
                                                    <td className="p-2 pl-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded border border-slate-200 overflow-hidden shrink-0">
                                                                <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[12px] font-medium text-blue-600">{prod.name}</span>
                                                                <span className="text-[11px] text-slate-400">#{prod.id}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-2 text-center text-[12px] text-slate-700">{prod.quantity}</td>
                                                    <td className="p-2 text-right text-[12px] text-slate-700">{prod.price}</td>
                                                    <td className="p-2 text-right pr-3 text-[12px] font-bold text-slate-800">{prod.total}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                          </div>

                          <div className="px-4 pb-2">
                             <button
                                onClick={() => setExpandedOrderId(null)}
                                className="flex items-center text-[12px] font-medium text-blue-600 hover:text-blue-800 transition-colors"
                             >
                                <ChevronUp size={14} className="mr-1" /> Thu gọn
                             </button>
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
            Từ 1 đến {MOCK_ORDERS.length} trên tổng {MOCK_ORDERS.length}
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

const StatusBadge = ({ status, type }: { status: string, type: 'payment' | 'processing' }) => {
    let styles = "bg-slate-100 text-slate-600 border-slate-200";

    if (status === "Chưa thanh toán") styles = "bg-[#fff7e6] text-[#fa8c16] border-[#ffe7ba]";
    if (status === "Chưa xử lý") styles = "bg-[#fff7e6] text-[#fa8c16] border-[#ffe7ba]";

    if (status === "Đã thanh toán") styles = "bg-[#f6ffed] text-[#52c41a] border-[#b7eb8f]";

    return (
        <span className={cn("px-2.5 py-0.5 rounded-[10px] text-[11px] border", styles)}>
             ○ {status}
        </span>
    )
}