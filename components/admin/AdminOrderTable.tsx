"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Settings,
  ArrowUpDown,
  Printer,
  Box,
  RefreshCw
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// --- INTERFACES ---
export interface OrderItem {
  id: number;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  image?: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  totalAmount: string;
  status: string;
  paymentStatus: string;
  branch: string;
  shippingMethod: string;
  createdAt: string;
  customerAddress?: string;
  note?: string;
  tags?: string[];
  items?: OrderItem[];
}

interface AdminOrderTableProps {
  orders: Order[];
  onRefresh?: () => void;
}

export function AdminOrderTable({ orders, onRefresh }: AdminOrderTableProps) {
  // --- STATES ---
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  // Toolbar states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  // --- HANDLERS ---
  const toggleRow = (id: string) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  // Hàm helper chuyển chuỗi ngày "DD/MM/YYYY HH:mm" sang timestamp để sort
  const parseDate = (dateStr: string) => {
    if (!dateStr) return 0;
    const parts = dateStr.match(/(\d+)\/(\d+)\/(\d+) (\d+):(\d+)/);
    if (!parts) return 0;
    return new Date(Number(parts[3]), Number(parts[2]) - 1, Number(parts[1]), Number(parts[4]), Number(parts[5])).getTime();
  };

  // --- FILTERING & SORTING LOGIC ---
  const filteredOrders = useMemo(() => {
    let data = [...orders];

    // 1. Lọc theo Tabs
    if (activeTab !== "all") {
      data = data.filter((order) => {
        if (activeTab === "order") return order.status === "Chờ xử lý";
        if (activeTab === "trading") return order.status === "Đang giao";
        if (activeTab === "completed") return order.status === "Hoàn thành";
        if (activeTab === "cancelled") return order.status === "Đã hủy";
        return true;
      });
    }

    // 2. Lọc theo Select Trạng thái
    if (statusFilter !== "all") {
      data = data.filter((order) => order.status === statusFilter);
    }

    // 3. Lọc theo Select Thanh toán
    if (paymentFilter !== "all") {
      data = data.filter((order) => order.paymentStatus === paymentFilter);
    }

    // 4. Lọc theo Search (Mã đơn, Tên, SĐT)
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      data = data.filter(
        (order) =>
          order.id.toLowerCase().includes(lowerTerm) ||
          order.customerName.toLowerCase().includes(lowerTerm) ||
          order.customerPhone.includes(lowerTerm)
      );
    }

    // 5. Sắp xếp (Mới nhất / Cũ nhất)
    data.sort((a, b) => {
      const timeA = parseDate(a.createdAt);
      const timeB = parseDate(b.createdAt);
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

    return data;
  }, [orders, activeTab, statusFilter, paymentFilter, searchTerm, sortOrder]);

  const tabs = [
    { id: "all", label: "Tất cả" },
    { id: "order", label: "Đặt hàng" },
    { id: "trading", label: "Đang giao dịch" },
    { id: "completed", label: "Đã hoàn thành" },
    { id: "cancelled", label: "Đã hủy" },
  ];

  return (
    <div className="w-full bg-white font-sans text-slate-800">

      {/* 1. THANH TABS */}
      <div className="flex items-center border-b border-slate-200 px-4 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "py-3 px-4 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-blue-600"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 2. THANH CÔNG CỤ (TOOLBAR Y HỆT ẢNH) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-100 bg-[#fbfcfd]">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Ô Tìm kiếm */}
          <div className="relative w-full sm:w-auto min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <Input
              placeholder="Tìm mã đơn, tên khách hàng..."
              className="pl-9 h-9 text-[13px] border-slate-200 shadow-sm focus-visible:ring-1 focus-visible:ring-blue-500 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Lọc Trạng thái */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-[13px] border-slate-200 shadow-sm w-[150px] bg-white rounded-md">
              <SelectValue placeholder="Trạng thái đơn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="Chờ xử lý">Chờ xử lý</SelectItem>
              <SelectItem value="Đã xác nhận">Đã xác nhận</SelectItem>
              <SelectItem value="Đang giao">Đang giao</SelectItem>
              <SelectItem value="Hoàn thành">Hoàn thành</SelectItem>
              <SelectItem value="Đã hủy">Đã hủy</SelectItem>
            </SelectContent>
          </Select>

          {/* Lọc Thanh toán */}
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="h-9 text-[13px] border-slate-200 shadow-sm w-[150px] bg-white rounded-md">
              <SelectValue placeholder="Thanh toán" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả thanh toán</SelectItem>
              <SelectItem value="Đã thanh toán">Đã thanh toán</SelectItem>
              <SelectItem value="Chưa thanh toán">Chưa thanh toán</SelectItem>
            </SelectContent>
          </Select>

          {/* Sắp xếp */}
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="h-9 text-[13px] border-slate-200 shadow-sm w-[120px] bg-white rounded-md">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="oldest">Cũ nhất</SelectItem>
            </SelectContent>
          </Select>

          {/* Nút Refresh & Cài đặt */}
          <div className="flex items-center gap-2 ml-auto sm:ml-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 border-slate-200 text-slate-600 shadow-sm rounded-md bg-white hover:text-blue-600"
              onClick={onRefresh}
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={15} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 border-slate-200 text-slate-600 shadow-sm rounded-md bg-white hover:text-blue-600"
              title="Cài đặt bảng hiển thị"
            >
              <Settings size={15} />
            </Button>
          </div>
        </div>
      </div>

      {/* 3. BẢNG DỮ LIỆU */}
      <div className="w-full overflow-x-auto">
        <Table className="table-custom border-collapse min-w-[1100px]">
          <TableHeader>
            <TableRow className="bg-[#f4f6f8] hover:bg-[#f4f6f8] border-b border-slate-200 h-10">
              <TableHead className="w-[40px] text-center p-0">
                  <div className="flex items-center justify-center h-full w-full cursor-pointer hover:text-blue-600">
                    <Settings size={14} className="text-slate-400"/>
                  </div>
              </TableHead>
              <TableHead className="w-[40px] text-center p-0">
                  <div className="flex items-center justify-center">
                    <Checkbox className="border-slate-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-4 w-4"/>
                  </div>
              </TableHead>

              <TableHead className="font-bold text-slate-800 text-[12px] p-3 whitespace-nowrap">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                      Mã đơn hàng <ArrowUpDown size={12} className="text-slate-400"/>
                  </div>
              </TableHead>
              <TableHead className="font-bold text-slate-800 text-[12px] p-3 whitespace-nowrap">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                      Ngày đặt <ArrowUpDown size={12} className="text-slate-400"/>
                  </div>
              </TableHead>
              <TableHead className="font-bold text-slate-800 text-[12px] p-3">
                  Khách hàng
              </TableHead>
              <TableHead className="font-bold text-slate-800 text-[12px] p-3 whitespace-nowrap">
                  Chi nhánh
              </TableHead>
              <TableHead className="font-bold text-slate-800 text-[12px] p-3 text-right">
                   Thành tiền
              </TableHead>
              <TableHead className="font-bold text-slate-800 text-[12px] p-3 text-center">
                   Thanh toán
              </TableHead>
              <TableHead className="font-bold text-slate-800 text-[12px] p-3 text-center">
                   Trạng thái
              </TableHead>
              <TableHead className="font-bold text-slate-800 text-[12px] p-3">
                   Vận chuyển
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const isExpanded = expandedRows.includes(order.id);

                return (
                  <React.Fragment key={order.id}>
                    <TableRow
                      className={cn(
                        "cursor-pointer border-b border-[#eee] hover:bg-[#f0f8ff] transition-colors group text-[13px]",
                        isExpanded && "bg-[#f8f9fa] border-b-0",
                      )}
                      onClick={() => toggleRow(order.id)}
                    >
                      <TableCell className="text-center p-0">
                        <div className="flex items-center justify-center h-full">
                             {isExpanded ? <ChevronUp size={14} className="text-blue-600"/> : <ChevronDown size={14} className="text-blue-600"/>}
                        </div>
                      </TableCell>

                      <TableCell className="text-center p-0" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center">
                             <Checkbox className="border-slate-300 h-4 w-4"/>
                          </div>
                      </TableCell>

                      <TableCell className="p-3 font-medium">
                           <Link
                             href={`/admin/orders/${encodeURIComponent(order.id)}`}
                             className="text-blue-600 hover:underline hover:text-blue-800 font-bold"
                             onClick={(e) => e.stopPropagation()}
                           >
                               {order.id}
                           </Link>
                      </TableCell>

                      <TableCell className="p-3 text-slate-600">{order.createdAt}</TableCell>
                      <TableCell className="p-3">
                          <div className="flex flex-col">
                            <span className="text-blue-600 cursor-pointer hover:underline font-medium">{order.customerName}</span>
                            <span className="text-slate-400 text-[11px]">{order.customerPhone}</span>
                          </div>
                      </TableCell>
                      <TableCell className="p-3 text-slate-600">{order.branch}</TableCell>
                      <TableCell className="p-3 text-right font-bold text-slate-800">{order.totalAmount}</TableCell>

                      <TableCell className="p-3 text-center">
                          <div className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border",
                              order.paymentStatus === 'Đã thanh toán'
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : "bg-[#fff7e6] text-[#d97706] border-[#ffe58f]"
                          )}>
                              {order.paymentStatus === 'Chờ thanh toán' || order.paymentStatus === 'Chưa thanh toán' ? (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#d97706] mr-1.5"></span>
                                    {order.paymentStatus}
                                  </>
                              ) : order.paymentStatus}
                          </div>
                      </TableCell>

                      <TableCell className="p-3 text-center">
                         <div className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border",
                             order.status === 'Hoàn thành' ? "bg-blue-50 text-blue-600 border-blue-200"
                             : order.status === 'Đã hủy' ? "bg-red-50 text-red-600 border-red-200"
                             : "bg-orange-50 text-orange-600 border-orange-200"
                         )}>
                             {order.status}
                         </div>
                      </TableCell>

                      <TableCell className="p-3 text-slate-600">
                          {order.shippingMethod || "Chưa xác định"}
                      </TableCell>
                    </TableRow>

                    {/* Dòng mở rộng chi tiết */}
                    {isExpanded && (
                      <TableRow className="bg-[#fcfcfc] hover:bg-[#fcfcfc]">
                         <TableCell colSpan={10} className="p-0 border-b border-[#eee]">
                             <div className="p-4 pl-12 flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-top-1 duration-200">
                                 <div className="w-full md:w-1/3 min-w-[250px] space-y-4 md:border-r border-slate-100 md:pr-4">
                                     <div>
                                         <h4 className="text-[13px] font-bold text-slate-800 mb-1 flex items-center gap-2">
                                            Khách hàng <Link href="#" className="text-blue-600 hover:underline font-normal text-[11px]">(Xem chi tiết)</Link>
                                         </h4>
                                         <p className="text-[13px] text-slate-700 font-medium mb-1">{order.customerName} - {order.customerPhone}</p>
                                         <p className="text-[13px] text-slate-500 leading-snug">{order.customerAddress || "Chưa có địa chỉ"}</p>
                                     </div>
                                 </div>

                                 <div className="flex-1">
                                     <div className="border border-slate-200 rounded-sm bg-white overflow-hidden shadow-sm">
                                         <Table>
                                             <TableHeader>
                                                 <TableRow className="bg-[#f4f6f8] border-b border-slate-200 hover:bg-[#f4f6f8] h-8">
                                                     <TableHead className="h-8 text-[11px] font-bold text-slate-700 pl-4">Sản phẩm</TableHead>
                                                     <TableHead className="h-8 text-[11px] font-bold text-slate-700 text-center w-[80px]">SL</TableHead>
                                                     <TableHead className="h-8 text-[11px] font-bold text-slate-700 text-right w-[120px]">Đơn giá</TableHead>
                                                     <TableHead className="h-8 text-[11px] font-bold text-slate-700 text-right w-[120px] pr-4">Thành tiền</TableHead>
                                                 </TableRow>
                                             </TableHeader>
                                             <TableBody>
                                                 {order.items && order.items.length > 0 ? (
                                                    order.items.map((item, idx) => (
                                                        <TableRow key={idx} className="border-b border-slate-100 hover:bg-transparent last:border-0">
                                                            <TableCell className="py-2.5 pl-4">
                                                                <div className="flex items-start gap-3">
                                                                    <div className="w-10 h-10 bg-slate-50 rounded border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                                                                        {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover"/> : <Box size={16} className="text-slate-300"/>}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[13px] font-medium text-blue-600 hover:underline cursor-pointer line-clamp-1">{item.productName}</p>
                                                                        <div className="text-[11px] text-slate-500 mt-0.5">{item.sku}</div>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-2.5 text-center text-[13px] font-medium">{item.quantity}</TableCell>
                                                            <TableCell className="py-2.5 text-right text-[13px] text-slate-600">{item.unitPrice}</TableCell>
                                                            <TableCell className="py-2.5 text-right text-[13px] font-bold text-slate-800 pr-4">{item.totalPrice}</TableCell>
                                                        </TableRow>
                                                    ))
                                                 ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="py-4 text-center text-[12px] text-slate-500 italic">
                                                            Chưa có chi tiết sản phẩm
                                                        </TableCell>
                                                    </TableRow>
                                                 )}
                                             </TableBody>
                                         </Table>
                                     </div>
                                     <div className="flex justify-end gap-2 mt-3">
                                          <Button variant="outline" className="h-8 text-[12px] border-slate-300 text-slate-700"><Printer size={14} className="mr-1"/> In vận đơn</Button>
                                          <Button className="bg-blue-600 hover:bg-blue-700 h-8 text-[12px] font-medium px-4">Xác nhận đơn</Button>
                                     </div>
                                 </div>
                             </div>
                             <div className="border-t border-slate-200 py-2 flex justify-start pl-12 bg-white">
                                 <button
                                     className="flex items-center gap-1 text-[12px] text-blue-600 font-medium hover:underline transition-all"
                                     onClick={() => toggleRow(order.id)}
                                 >
                                     <ChevronUp size={14}/> Thu gọn chi tiết
                                 </button>
                             </div>
                         </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="h-48 text-center text-slate-400">
                   <div className="flex flex-col items-center gap-3 justify-center">
                       <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                           <Search size={24} className="text-slate-300"/>
                       </div>
                       <div className="text-center">
                           <p className="text-[14px] font-medium text-slate-600">Không tìm thấy đơn hàng nào</p>
                           <p className="text-[12px]">Vui lòng thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                       </div>
                   </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 4. PHÂN TRANG */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[#eee] bg-[#f8f9fa] rounded-b-sm">
        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">
          Hiển thị {filteredOrders.length > 0 ? 1 : 0} - {filteredOrders.length} của {orders.length} đơn hàng
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] bg-white border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50" disabled>Trước</Button>
          <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-[11px] bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm">1</Button>
          <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] bg-white border-slate-300 text-slate-600 hover:bg-slate-50">Sau</Button>
        </div>
      </div>
    </div>
  );
}