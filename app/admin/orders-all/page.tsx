"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Settings,
  ChevronDown,
  ChevronsRight,
  ChevronUp,
  Package,
  Truck,
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
import { toast } from "sonner";
import { orderService } from "@/app/services/order.service";
import { MyOrder, OrderStatus } from "@/app/types/order.types";

import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { getOrderListPath } from "@/lib/order-routing";
import { isAdminRole } from "@/lib/roles";
import { formatDate } from "@/lib/dateUtils";

const TABS = [
  { id: "AWAITING_REPLENISHMENT", label: "Chờ điều chuyển" },
  { id: "all", label: "Tất cả" },
  { id: "SHIPPING", label: "Đang giao hàng" },
  { id: "COMPLETED", label: "Hoàn thành" },
  { id: "CANCELLED", label: "Đã hủy" },
  { id: "RETURNED", label: "Trả hàng" },
  { id: "AWAITING_PAYMENT", label: "Chờ thanh toán" },
  { id: "CONFIRMED", label: "Đã xác nhận" },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount || 0,
  );

export default function AllOrdersPage() {
  const { hasPermission, isLoadingAuth } = usePermissions();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailCache, setDetailCache] = useState<Record<number, MyOrder>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [shippingOrderId, setShippingOrderId] = useState<number | null>(null);
  const isAdmin = isAdminRole(user?.role);

  useEffect(() => {
    if (!isLoadingAuth && !isAdmin) {
      router.replace(getOrderListPath(user, searchParams.get("status")));
      return;
    }

    if (!isLoadingAuth && !hasPermission(P.ORDER_VIEW)) {
      router.push("/admin/forbidden");
    }
  }, [hasPermission, isAdmin, isLoadingAuth, router, searchParams, user]);

  useEffect(() => {
    if (isLoadingAuth) return;

    if (!isAdmin) {
      router.replace(getOrderListPath(user, searchParams.get("status")));
    }
  }, [isAdmin, isLoadingAuth, router, searchParams, user]);

  useEffect(() => {
    const requestedStatus = searchParams.get("status");
    if (!requestedStatus) {
      setActiveTab("all");
      return;
    }

    const normalizedStatus = requestedStatus.toUpperCase();
    const tabExists = TABS.some((tab) => tab.id === normalizedStatus);
    setActiveTab(tabExists ? normalizedStatus : "all");
  }, [searchParams]);

  const fetchOrders = useCallback(async (tab: string, q?: string) => {
    if (!isAdmin) return;

    setIsLoading(true);
    setExpandedId(null);
    try {
      const status = tab === "all" ? undefined : tab;
      const data = await orderService.getAdminOrders(status, q || undefined);
      setOrders(data);
      setSelectedItems([]);
    } catch {
      toast.error("Không thể tải danh sách đơn hàng toàn hệ thống.");
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isLoadingAuth || !isAdmin) return;
    fetchOrders(activeTab);
  }, [activeTab, fetchOrders, isAdmin, isLoadingAuth]);

  const handleToggleRow = async (orderId: number) => {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(orderId);
    if (!detailCache[orderId]) {
      setLoadingDetailId(orderId);
      try {
        const detail = await orderService.getAdminOrderById(orderId);
        setDetailCache((prev) => ({ ...prev, [orderId]: detail }));
      } catch {
        toast.error("Không thể tải chi tiết đơn hàng.");
      } finally {
        setLoadingDetailId(null);
      }
    }
  };

  const handleRequestReplenishment = async (
    e: React.MouseEvent,
    orderId: number,
    orderCode: string,
  ) => {
    e.stopPropagation();
    try {
      const response =
        await orderService.requestAdminOrderReplenishment(orderId);
      const transferSummary = response.transferCodes?.length
        ? ` (${response.transferCodes.join(", ")})`
        : "";
      toast.success(
        `Đã tạo lệnh điều chuyển cho ${orderCode}${transferSummary}`,
      );
      fetchOrders(activeTab, search);
    } catch {
      toast.error("Không thể tạo lệnh điều chuyển bổ sung.");
    }
  };

  const handleApprovePackedAndShip = async (
    e: React.MouseEvent,
    orderId: number,
    orderCode: string,
  ) => {
    e.stopPropagation();
    try {
      setShippingOrderId(orderId);
      await orderService.approvePackedAndShipOrder(orderId);
      toast.success(
        `Đơn hàng ${orderCode} đã chuyển sang trạng thái đang giao.`,
      );
      await fetchOrders(activeTab, search);
    } catch {
      toast.error("Không thể chuyển đơn hàng sang trạng thái đang giao.");
    } finally {
      setShippingOrderId(null);
    }
  };

  const toggleSelectAll = () => {
    setSelectedItems((prev) =>
      prev.length === orders.length ? [] : orders.map((o) => o.id),
    );
  };

  const toggleSelectItem = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  return (
    <div className="p-4 space-y-4 bg-slate-50 min-h-screen">
      <h1 className="text-[18px] font-bold text-slate-800">
        Tất cả đơn hàng:{" "}
        <span className="font-normal text-slate-600">
          ({orders.length} đơn)
        </span>
      </h1>

      <div className="bg-white p-3 rounded-[4px] border border-[#dcdcdc] shadow-sm">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <Input
            placeholder="Tìm theo mã đơn hoặc tên khách hàng, nhấn Enter để tìm"
            className="pl-9 h-[34px] text-[13px] border-slate-300 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && fetchOrders(activeTab, search)
            }
          />
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
                  ? "border-blue-600 text-blue-600 font-bold"
                  : "border-transparent text-slate-600 hover:text-blue-500",
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
                <TableHead className="w-[40px] pl-4">
                  <Settings size={14} className="text-slate-400" />
                </TableHead>
                <TableHead className="w-[40px]">
                  <Checkbox
                    className="border-slate-300 data-[state=checked]:bg-blue-600"
                    checked={
                      selectedItems.length === orders.length &&
                      orders.length > 0
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">
                  Mã đơn hàng
                </TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">
                  Khách hàng
                </TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">
                  Ngày đặt
                </TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800 text-right">
                  Tiền hàng
                </TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800 text-center">
                  Thanh toán
                </TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800 text-center">
                  Trạng thái
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-slate-400"
                  >
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-slate-500"
                  >
                    Không có đơn hàng nào.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const orderId = order.id;
                  const orderCode = order.orderCode ?? order.code;
                  const isExpanded = expandedId === orderId;
                  const detail = detailCache[orderId];
                  const isLoadingDetail = loadingDetailId === orderId;

                  return (
                    <React.Fragment key={orderId}>
                      <TableRow
                        className={cn(
                          "border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors",
                          selectedItems.includes(orderId) && "bg-blue-50/20",
                          isExpanded && "bg-blue-50/30",
                        )}
                        onClick={() => handleToggleRow(orderId)}
                      >
                        <TableCell className="pl-4 text-center text-slate-400">
                          {isExpanded ? (
                            <ChevronDown size={14} className="text-blue-600" />
                          ) : (
                            <ChevronsRight size={14} />
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            className="border-slate-300 data-[state=checked]:bg-blue-600"
                            checked={selectedItems.includes(orderId)}
                            onCheckedChange={() => toggleSelectItem(orderId)}
                          />
                        </TableCell>
                        <TableCell>
                          <span className="text-[13px] font-medium text-blue-600">
                            {orderCode}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-[13px] text-blue-600">
                              {order.customerName}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {order.customerPhone}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-[13px] text-slate-700">
                          {formatDate(order.createdAt, "dd/MM/yyyy HH:mm:ss")}
                        </TableCell>
                        <TableCell className="text-[13px] font-medium text-slate-800 text-right">
                          {formatCurrency(
                            order.finalAmount ?? order.totalAmount,
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <PaymentBadge status={order.paymentStatus} />
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={order.status} />
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow className="bg-[#f8fbff] hover:bg-[#f8fbff]">
                          <TableCell
                            colSpan={8}
                            className="p-0 border-b border-blue-100"
                          >
                            <div className="flex flex-col md:flex-row p-4 gap-6">
                              <div className="w-full md:w-[25%] space-y-3 border-r border-slate-200 pr-4">
                                <div>
                                  <h3 className="text-[12px] font-bold text-slate-800 mb-1">
                                    Địa chỉ giao hàng
                                  </h3>
                                  <p className="text-[12px] text-slate-600 leading-relaxed">
                                    {order.shippingAddress}
                                  </p>
                                </div>
                                {order.branchName && (
                                  <div>
                                    <h3 className="text-[12px] font-bold text-slate-800 mb-1">
                                      Chi nhánh xử lý
                                    </h3>
                                    <p className="text-[12px] text-slate-600">
                                      {order.branchName}
                                    </p>
                                  </div>
                                )}
                                <div>
                                  <h3 className="text-[12px] font-bold text-slate-800 mb-1">
                                    Phương thức TT
                                  </h3>
                                  <p className="text-[12px] text-slate-600">
                                    {order.paymentMethod}
                                  </p>
                                </div>
                                <div>
                                  <h3 className="text-[12px] font-bold text-slate-800 mb-1">
                                    Phí vận chuyển
                                  </h3>
                                  <p className="text-[12px] text-slate-600">
                                    {formatCurrency(
                                      order.totalShippingFee ??
                                        order.shippingFee ??
                                        0,
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-3">
                                  <h3 className="text-[12px] font-bold text-slate-800">
                                    Chi tiết sản phẩm
                                  </h3>
                                  {canApprovePackedAndShip(order.status) &&
                                    hasPermission(P.ORDER_UPDATE) && (
                                      <Button
                                        size="sm"
                                        className="h-[28px] bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold"
                                        disabled={shippingOrderId === orderId}
                                        onClick={(e) =>
                                          handleApprovePackedAndShip(
                                            e,
                                            orderId,
                                            orderCode,
                                          )
                                        }
                                      >
                                        <Truck size={14} className="mr-1.5" />
                                        {shippingOrderId === orderId
                                          ? "Dang chuyen..."
                                          : "Duyet dong goi & chuyen giao"}
                                      </Button>
                                    )}
                                  {order.status === "AWAITING_REPLENISHMENT" &&
                                    hasPermission(P.ORDER_UPDATE) && (
                                      <Button
                                        size="sm"
                                        className="h-[28px] bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-bold"
                                        onClick={(e) =>
                                          handleRequestReplenishment(
                                            e,
                                            orderId,
                                            orderCode,
                                          )
                                        }
                                      >
                                        <Package size={14} className="mr-1.5" />{" "}
                                        Tạo lệnh điều chuyển
                                      </Button>
                                    )}
                                </div>

                                <div className="border border-slate-200 rounded-[3px] overflow-hidden bg-white">
                                  <table className="w-full text-left">
                                    <thead className="bg-[#f4f6f8] text-[11px] font-bold text-slate-600 uppercase">
                                      <tr>
                                        <th className="p-2 pl-3">Sản phẩm</th>
                                        <th className="p-2 text-center">
                                          Số lượng
                                        </th>
                                        <th className="p-2 text-right">
                                          Đơn giá
                                        </th>
                                        <th className="p-2 text-right pr-3">
                                          Thành tiền
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {isLoadingDetail ? (
                                        <tr>
                                          <td
                                            colSpan={4}
                                            className="p-4 text-center text-[12px] text-slate-400"
                                          >
                                            Đang tải...
                                          </td>
                                        </tr>
                                      ) : (detail?.items ?? order.items)
                                          ?.length ? (
                                        (detail?.items ?? order.items).map(
                                          (item, idx) => (
                                            <tr
                                              key={idx}
                                              className="border-b border-slate-100 last:border-0"
                                            >
                                              <td className="p-2 pl-3">
                                                <div className="flex items-center gap-3">
                                                  <div className="w-8 h-8 rounded border border-slate-200 overflow-hidden shrink-0 bg-slate-50 flex items-center justify-center">
                                                    {item.image ? (
                                                      <img
                                                        src={item.image}
                                                        alt={item.productName}
                                                        className="w-full h-full object-cover"
                                                      />
                                                    ) : (
                                                      <Package
                                                        size={14}
                                                        className="text-slate-300"
                                                      />
                                                    )}
                                                  </div>
                                                  <div className="flex flex-col">
                                                    <span className="text-[12px] font-medium text-blue-600">
                                                      {item.productName}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400">
                                                      SKU: {item.sku}
                                                    </span>
                                                  </div>
                                                </div>
                                              </td>
                                              <td className="p-2 text-center text-[12px] text-slate-700">
                                                <div>{item.quantity}</div>
                                                {(item.missingQuantity ?? 0) >
                                                  0 && (
                                                  <div className="text-[10px] font-semibold text-rose-600">
                                                    Thiếu {item.missingQuantity}
                                                  </div>
                                                )}
                                              </td>
                                              <td className="p-2 text-right text-[12px] text-slate-700">
                                                {formatCurrency(
                                                  item.price ?? 0,
                                                )}
                                              </td>
                                              <td className="p-2 text-right pr-3 text-[12px] font-bold text-slate-800">
                                                {formatCurrency(
                                                  item.totalPrice ?? 0,
                                                )}
                                              </td>
                                            </tr>
                                          ),
                                        )
                                      ) : (
                                        <tr>
                                          <td
                                            colSpan={4}
                                            className="p-4 text-center text-[12px] text-slate-500 italic"
                                          >
                                            Không có dữ liệu sản phẩm.
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                            <div className="px-4 pb-2 pt-2 border-t border-slate-100">
                              <button
                                onClick={() => setExpandedId(null)}
                                className="flex items-center text-[12px] font-medium text-blue-600 hover:text-blue-800"
                              >
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

const canApprovePackedAndShip = (status: string) =>
  ["CONFIRMED", "PROCESSING", "READY_FOR_PICKUP"].includes(status);

const STATUS_MAP: Record<string, { label: string; styles: string }> = {
  AWAITING_REPLENISHMENT: {
    label: "Chờ điều chuyển",
    styles: "bg-rose-50 text-rose-600 border-rose-200",
  },
  PENDING: {
    label: "Chờ xác nhận",
    styles: "bg-[#fff7e6] text-[#fa8c16] border-[#ffe7ba]",
  },
  AWAITING_PAYMENT: {
    label: "Chờ thanh toán",
    styles: "bg-[#fff7e6] text-[#fa8c16] border-[#ffe7ba]",
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    styles: "bg-[#e6f7ff] text-[#1890ff] border-[#91d5ff]",
  },
  PROCESSING: {
    label: "Đang đóng gói",
    styles: "bg-[#fffbe6] text-[#d4b106] border-[#ffe58f]",
  },
  READY_FOR_PICKUP: {
    label: "Cho lay hang",
    styles: "bg-teal-50 text-teal-700 border-teal-200",
  },
  SHIPPING: {
    label: "Đang giao",
    styles: "bg-[#f9f0ff] text-[#722ed1] border-[#d3adf7]",
  },
  COMPLETED: {
    label: "Hoàn thành",
    styles: "bg-[#f6ffed] text-[#52c41a] border-[#b7eb8f]",
  },
  CANCELLED: {
    label: "Đã hủy",
    styles: "bg-[#fff1f0] text-[#f5222d] border-[#ffa39e]",
  },
  RETURNED: {
    label: "Trả hàng",
    styles: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

const StatusBadge = ({ status }: { status: OrderStatus | string }) => {
  const mapped = STATUS_MAP[status] ?? {
    label: status,
    styles: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span
      className={cn(
        "px-2.5 py-0.5 rounded-[10px] text-[11px] border",
        mapped.styles,
      )}
    >
      ○ {mapped.label}
    </span>
  );
};

const PaymentBadge = ({ status }: { status: "PAID" | "UNPAID" }) => {
  const styles =
    status === "PAID"
      ? "bg-[#f6ffed] text-[#52c41a] border-[#b7eb8f]"
      : "bg-[#fff7e6] text-[#fa8c16] border-[#ffe7ba]";
  return (
    <span
      className={cn("px-2.5 py-0.5 rounded-[10px] text-[11px] border", styles)}
    >
      ○ {status === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
    </span>
  );
};
