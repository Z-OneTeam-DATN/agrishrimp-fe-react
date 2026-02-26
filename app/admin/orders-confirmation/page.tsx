"use client";

import React, { useState, useEffect } from "react";
import {
  Search, Download, PlusCircle, Filter, Settings,
  ChevronDown, ChevronsRight, ChevronLeft, ChevronRight, ChevronUp, Printer, CheckCircle, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { orderService } from "@/app/services/order.service";

const PAYMENT_TABS = [
  { id: "all", label: "Tất cả" },
  { id: "UNPAID", label: "Chưa thanh toán" },
  { id: "PAID", label: "Đã thanh toán" },
];

// Hàm format tiền tệ
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

export default function ConfirmationPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPendingOrders = async () => {
    setIsLoading(true);
    try {
      const data = await orderService.getAdminOrders();
      const pendingOrders = data.filter((o: any) => o.status === "PENDING");
      setOrders(pendingOrders);
    } catch (error) {
      console.error("Lỗi lấy đơn hàng:", error);
      toast.error("Không thể tải danh sách đơn hàng chờ xác nhận.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const handleConfirmOrder = async (orderId: string, idDbb: number) => {
    try {
      await orderService.updateOrderStatus(idDbb, "CONFIRMED");
      toast.success(`Đã xác nhận đơn hàng ${orderId} thành công!`);
      fetchPendingOrders();
      setExpandedOrderId(null);
    } catch (error) {
      toast.error("Lỗi khi xác nhận đơn hàng.");
    }
  };

  const filteredOrders = activeTab === "all"
    ? orders
    : orders.filter(o => o.paymentStatus === activeTab);

  const toggleRow = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  return (
    <div className="p-4 space-y-4 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-[18px] font-bold text-slate-800">
          Chờ xác nhận: <span className="font-normal text-slate-600">({orders.length} đơn)</span>
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
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input placeholder="Tìm kiếm theo mã đơn hàng, SĐT khách hàng" className="pl-9 h-[34px] text-[13px] border-slate-300 bg-white" />
          </div>
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
                activeTab === tab.id ? "border-blue-600 text-blue-600 font-bold" : "border-transparent text-slate-600"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#f4f6f8]">
              <TableRow className="border-b border-slate-200 h-10">
                <TableHead className="w-[40px] pl-4"><Settings size={14} className="text-slate-400" /></TableHead>
                <TableHead className="w-[40px]"><Checkbox className="border-slate-300" /></TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">Mã đơn hàng</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">Ngày đặt hàng</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">Khách hàng</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">Chi nhánh</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800 text-right">Thành tiền</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800 text-center">Thanh toán</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800 text-center">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="h-32 text-center text-slate-400">Đang tải dữ liệu...</TableCell></TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="h-32 text-center text-slate-500">Không có đơn hàng nào chờ xác nhận.</TableCell></TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.code;

                  return (
                    <React.Fragment key={order.id}>
                      <TableRow
                        className={cn("border-b border-slate-100 cursor-pointer hover:bg-slate-50", isExpanded && "bg-blue-50/30")}
                        onClick={() => toggleRow(order.code)}
                      >
                        <TableCell className="pl-4 text-center text-slate-400">
                          {isExpanded ? <ChevronDown size={14} className="text-blue-600" /> : <ChevronsRight size={14} />}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}><Checkbox className="border-slate-300" /></TableCell>
                        <TableCell><span className="text-[13px] font-medium text-blue-600">{order.code}</span></TableCell>

                        <TableCell className="text-[13px] text-slate-700">
                          {new Date(order.createdAt).toLocaleString('vi-VN')}
                        </TableCell>

                        <TableCell>
                           <div className="flex flex-col">
                             <span className="text-[13px] text-blue-600">{order.customerName}</span>
                             <span className="text-[11px] text-slate-400">{order.customerPhone}</span>
                           </div>
                        </TableCell>
                        <TableCell className="text-[13px] text-slate-700">{order.branchName}</TableCell>
                        <TableCell className="text-[13px] font-medium text-slate-800 text-right">
                           {formatCurrency(order.finalAmount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'} />
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status="Chờ xử lý" />
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow className="bg-[#f8fbff] hover:bg-[#f8fbff]">
                          <TableCell colSpan={9} className="p-0 border-b border-blue-100">
                            <div className="flex flex-col md:flex-row p-4 gap-6">

                              {/* Cột trái: Thông tin giao hàng */}
                              <div className="w-full md:w-[25%] space-y-4 border-r border-slate-200 pr-4">
                                <div>
                                  <h3 className="text-[12px] font-bold text-slate-800 mb-2">Thông tin giao hàng</h3>
                                  <div className="text-[12px] text-slate-600 leading-relaxed">
                                    {order.shippingAddress}
                                  </div>
                                </div>
                              </div>

                              {/* Cột phải: Bảng chi tiết sản phẩm và Nút hành động */}
                              <div className="flex-1">
                                  <div className="flex justify-between items-center mb-3">
                                      <h3 className="text-[12px] font-bold text-slate-800">Thao tác xử lý</h3>
                                      <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="h-[28px] text-[12px] font-bold bg-white">
                                            <Printer size={14} className="mr-1.5" /> In đơn
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="h-[28px] bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold shadow-sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleConfirmOrder(order.code, order.id);
                                            }}
                                        >
                                            <CheckCircle size={14} className="mr-1.5" /> Xác nhận đơn
                                        </Button>
                                      </div>
                                  </div>

                                  {/* BẢNG SẢN PHẨM MỚI ĐƯỢC THÊM VÀO ĐÂY */}
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
                                              {order.items && order.items.length > 0 ? (
                                                  order.items.map((prod: any, idx: number) => (
                                                      <tr key={idx} className="border-b border-slate-100 last:border-0">
                                                          <td className="p-2 pl-3">
                                                              <div className="flex items-center gap-3">
                                                                  <div className="w-8 h-8 rounded border border-slate-200 overflow-hidden shrink-0 bg-slate-50 flex items-center justify-center">
                                                                      {prod.image ? (
                                                                         <img src={prod.image} alt={prod.productName} className="w-full h-full object-cover" />
                                                                      ) : (
                                                                         <Package size={14} className="text-slate-300"/>
                                                                      )}
                                                                  </div>
                                                                  <div className="flex flex-col">
                                                                      <span className="text-[12px] font-medium text-blue-600">{prod.productName}</span>
                                                                      <span className="text-[11px] text-slate-400">SKU: {prod.sku}</span>
                                                                  </div>
                                                              </div>
                                                          </td>
                                                          <td className="p-2 text-center text-[12px] text-slate-700">{prod.quantity}</td>
                                                          <td className="p-2 text-right text-[12px] text-slate-700">{formatCurrency(prod.price)}</td>
                                                          <td className="p-2 text-right pr-3 text-[12px] font-bold text-slate-800">{formatCurrency(prod.totalPrice)}</td>
                                                      </tr>
                                                  ))
                                              ) : (
                                                  <tr>
                                                      <td colSpan={4} className="p-4 text-center text-[12px] text-slate-500 italic">
                                                          Đơn hàng này không có dữ liệu sản phẩm.
                                                      </td>
                                                  </tr>
                                              )}
                                          </tbody>
                                      </table>
                                  </div>
                              </div>
                            </div>

                            <div className="px-4 pb-2 border-t border-slate-100 mt-2 pt-2">
                               <button onClick={() => setExpandedOrderId(null)} className="flex items-center text-[12px] font-medium text-blue-600 hover:text-blue-800 transition-colors">
                                  <ChevronUp size={14} className="mr-1" /> Thu gọn
                               </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

const StatusBadge = ({ status }: { status: string }) => {
    let styles = "bg-slate-100 text-slate-600 border-slate-200";
    if (status === "Chưa thanh toán" || status === "Chờ xử lý") styles = "bg-[#fff7e6] text-[#fa8c16] border-[#ffe7ba]";
    if (status === "Đã thanh toán") styles = "bg-[#f6ffed] text-[#52c41a] border-[#b7eb8f]";
    return <span className={cn("px-2.5 py-0.5 rounded-[10px] text-[11px] border", styles)}>○ {status}</span>
}