"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search, Settings, ChevronDown, ChevronsRight, ChevronUp,
  PackageCheck, Package, Truck, Printer, RefreshCw, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { orderService } from "@/app/services/order.service";
import { BranchOrder } from "@/app/types/order.types";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

const TABS = [
  { id: "PENDING", label: "Chờ xác nhận", icon: CheckCircle },
  { id: "CONFIRMED", label: "Chờ xử lý", icon: PackageCheck },
  { id: "PROCESSING", label: "Gom đơn & Đóng gói", icon: Printer },
];

export default function OrderManagementPage() {
  const [activeTab, setActiveTab] = useState("PENDING");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [orders, setOrders] = useState<BranchOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailCache, setDetailCache] = useState<Record<number, BranchOrder>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);

  const fetchOrders = useCallback(async (status: string, q?: string) => {
    setIsLoading(true);
    try {
      const data = await orderService.getBranchOrders(status, q || undefined);
      setOrders(data);
    } catch {
      toast.error(`Không thể tải danh sách đơn hàng.`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(activeTab, search);
  }, [activeTab, fetchOrders]);

  const handleToggleRow = async (orderId: number) => {
    if (expandedId === orderId) { setExpandedId(null); return; }
    setExpandedId(orderId);
    if (!detailCache[orderId]) {
      setLoadingDetailId(orderId);
      try {
        const detail = await orderService.getBranchOrderById(orderId);
        setDetailCache(prev => ({ ...prev, [orderId]: detail }));
      } catch {
        toast.error("Không thể tải chi tiết đơn hàng.");
      } finally {
        setLoadingDetailId(null);
      }
    }
  };

  const handleUpdateStatus = async (e: React.MouseEvent, orderId: number, orderCode: string, newStatus: string) => {
    e.stopPropagation();
    try {
      await orderService.updateBranchOrderStatus(orderId, newStatus);
      let successMsg = "";
      if (newStatus === "CONFIRMED") successMsg = `Đã xác nhận đơn hàng ${orderCode}!`;
      else if (newStatus === "PROCESSING") successMsg = `Đơn hàng ${orderCode} đã chuyển sang đóng gói!`;
      else if (newStatus === "SHIPPING") successMsg = `Đơn hàng ${orderCode} đã bàn giao vận chuyển!`;
      
      toast.success(successMsg);
      setOrders(prev => prev.filter(o => o.orderId !== orderId));
      if (expandedId === orderId) setExpandedId(null);
      
      setDetailCache(prev => {
        const newCache = { ...prev };
        delete newCache[orderId];
        return newCache;
      });
    } catch {
      toast.error("Lỗi khi cập nhật trạng thái đơn hàng.");
    }
  };

  return (
    <div className="p-4 space-y-4 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-[18px] font-bold text-slate-800 uppercase tracking-wide">
          Điều hành đơn hàng: <span className="font-normal text-slate-500 text-[15px]">({orders.length} đơn)</span>
        </h1>
        <Button
          variant="outline"
          size="sm"
          className="h-[32px] text-[12px] border-slate-300 text-slate-600 bg-white hover:bg-slate-50"
          onClick={() => fetchOrders(activeTab, search)}
        >
          <RefreshCw size={13} className="mr-1.5" /> Làm mới
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-lg border border-[#dcdcdc] shadow-sm w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearch("");
                setExpandedId(null);
              }}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-md text-[13px] font-bold transition-all",
                activeTab === tab.id
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Icon size={16} />
              {tab.label}
              {/* Optional: badge count could go here */}
            </button>
          );
        })}
      </div>

      {/* Search bar */}
      <div className="bg-white p-3 rounded-[4px] border border-[#dcdcdc] shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            placeholder="Tìm theo mã đơn hoặc tên khách hàng, nhấn Enter để tìm"
            className="pl-9 h-[36px] text-[13px] border-slate-300 bg-white focus:ring-emerald-500 focus:border-emerald-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchOrders(activeTab, search)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[4px] border border-[#dcdcdc] shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#f8fafc]">
              <TableRow className="border-b border-slate-200 h-11">
                <TableHead className="w-[45px] pl-4"><Settings size={14} className="text-slate-400" /></TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">Mã đơn hàng</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">Ngày đặt</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">Khách hàng</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800 text-right">Tiền hàng</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800 text-right">Phí ship</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800 text-center">Thanh toán</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="h-40 text-center text-slate-400 animate-pulse">Đang tải dữ liệu...</TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Package size={40} className="mb-2 opacity-20" />
                      <p className="text-[14px]">Không có đơn hàng nào {activeTab === "PENDING" ? "chờ xác nhận" : activeTab === "CONFIRMED" ? "chờ xử lý" : "đang đóng gói"}.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const isExpanded = expandedId === order.orderId;
                  const detail = detailCache[order.orderId];
                  const isLoadingDetail = loadingDetailId === order.orderId;

                  return (
                    <React.Fragment key={order.orderId}>
                      <TableRow
                        className={cn("border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors", isExpanded && "bg-emerald-50/30")}
                        onClick={() => handleToggleRow(order.orderId)}
                      >
                        <TableCell className="pl-4 text-center text-slate-400">
                          {isExpanded ? <ChevronDown size={14} className="text-emerald-600" /> : <ChevronsRight size={14} />}
                        </TableCell>
                        <TableCell><span className="text-[13px] font-bold text-blue-600">{order.orderCode}</span></TableCell>
                        <TableCell className="text-[13px] text-slate-700 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-medium text-slate-800">{order.customerName}</span>
                            <span className="text-[11px] text-slate-400">{order.customerPhone}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-[13px] font-bold text-slate-800 text-right">
                          {formatCurrency(order.subtotal)}
                        </TableCell>
                        <TableCell className="text-[13px] text-slate-600 text-right">
                          {formatCurrency(order.shippingFee)}
                        </TableCell>
                        <TableCell className="text-center">
                          <PaymentBadge status={order.paymentStatus} />
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow className="bg-[#fcfdfd] hover:bg-[#fcfdfd]">
                          <TableCell colSpan={7} className="p-0 border-b border-emerald-100">
                            <div className="flex flex-col md:flex-row p-5 gap-8">
                              <div className="w-full md:w-[25%] space-y-4 border-r border-slate-100 pr-6">
                                <div>
                                  <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-1">Địa chỉ giao hàng</h3>
                                  <p className="text-[13px] text-slate-700 leading-relaxed font-medium">{order.shippingAddress}</p>
                                </div>
                                {order.carrier && (
                                  <div>
                                    <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-1">Đơn vị vận chuyển</h3>
                                    <p className="text-[13px] text-slate-700 font-medium">{order.carrier}</p>
                                  </div>
                                )}
                                {order.estimatedDays && (
                                  <div>
                                    <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-1">Dự kiến giao</h3>
                                    <p className="text-[13px] text-slate-700 font-medium">
                                      {new Date(order.estimatedDays).toLocaleDateString("vi-VN")}
                                    </p>
                                  </div>
                                )}
                                <div>
                                  <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-1">Phương thức TT</h3>
                                  <p className="text-[13px] text-slate-700 font-medium">{order.paymentMethod}</p>
                                </div>
                              </div>

                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-4">
                                  <h3 className="text-[12px] font-bold text-slate-800 uppercase tracking-tight">
                                    Chi tiết sản phẩm ({detail?.items?.length || 0})
                                  </h3>
                                  {activeTab === "PENDING" ? (
                                    <Button
                                      size="sm"
                                      className="h-[32px] bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold shadow-sm"
                                      onClick={(e) => handleUpdateStatus(e, order.orderId, order.orderCode, "CONFIRMED")}
                                    >
                                      <CheckCircle size={15} className="mr-1.5" /> Xác nhận đơn
                                    </Button>
                                  ) : activeTab === "CONFIRMED" ? (
                                    <Button
                                      size="sm"
                                      className="h-[32px] bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold shadow-sm"
                                      onClick={(e) => handleUpdateStatus(e, order.orderId, order.orderCode, "PROCESSING")}
                                    >
                                      <PackageCheck size={15} className="mr-1.5" /> Bắt đầu đóng gói
                                    </Button>
                                  ) : (
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-[32px] border-slate-300 text-[12px] font-bold bg-white"
                                        onClick={() => window.print()}
                                      >
                                        <Printer size={15} className="mr-1.5" /> In vận đơn
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="h-[32px] bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold shadow-sm"
                                        onClick={(e) => handleUpdateStatus(e, order.orderId, order.orderCode, "SHIPPING")}
                                      >
                                        <Truck size={15} className="mr-1.5" /> Bàn giao vận chuyển
                                      </Button>
                                    </div>
                                  )}
                                </div>

                                <div className="border border-slate-200 rounded-[4px] overflow-hidden bg-white shadow-sm">
                                  <table className="w-full text-left">
                                    <thead className="bg-[#f8fafc] text-[11px] font-bold text-slate-500 uppercase">
                                      <tr>
                                        <th className="p-3 pl-4">Sản phẩm</th>
                                        <th className="p-3 text-center">Số lượng</th>
                                        <th className="p-3 text-right">Đơn giá</th>
                                        <th className="p-3 text-right pr-4">Thành tiền</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {isLoadingDetail ? (
                                        <tr><td colSpan={4} className="p-6 text-center text-[12px] text-slate-400">Đang tải chi tiết sản phẩm...</td></tr>
                                      ) : detail?.items?.length ? (
                                        detail.items.map((item, idx) => (
                                          <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                            <td className="p-3 pl-4">
                                              <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-md border border-slate-100 overflow-hidden shrink-0 bg-slate-50 flex items-center justify-center">
                                                  {item.image ? (
                                                    <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                                                  ) : (
                                                    <Package size={18} className="text-slate-200" />
                                                  )}
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-[13px] font-bold text-slate-700">{item.productName}</span>
                                                  <span className="text-[11px] text-slate-400 font-medium">SKU: {item.sku}</span>
                                                </div>
                                              </div>
                                            </td>
                                            <td className="p-3 text-center text-[13px] text-slate-700 font-black">{item.quantity}</td>
                                            <td className="p-3 text-right text-[13px] text-slate-600">{formatCurrency(item.price)}</td>
                                            <td className="p-3 text-right pr-4 text-[13px] font-bold text-emerald-700">{formatCurrency(item.totalPrice)}</td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr><td colSpan={4} className="p-6 text-center text-[12px] text-slate-500 italic">Không có dữ liệu sản phẩm.</td></tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                            <div className="px-5 pb-3 pt-3 border-t border-slate-50 flex justify-end">
                              <button
                                onClick={() => setExpandedId(null)}
                                className="flex items-center text-[12px] font-bold text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-wider"
                              >
                                <ChevronUp size={14} className="mr-1" /> Thu gọn thông tin
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

const PaymentBadge = ({ status }: { status: "PAID" | "UNPAID" }) => {
  const styles = status === "PAID"
    ? "bg-emerald-50 text-emerald-600 border-emerald-100 font-bold"
    : "bg-amber-50 text-amber-600 border-amber-100 font-bold";
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] border uppercase tracking-tighter", styles)}>
      ● {status === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
    </span>
  );
};
