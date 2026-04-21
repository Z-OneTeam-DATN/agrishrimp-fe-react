"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Settings,
  ChevronDown,
  ChevronsRight,
  ChevronUp,
  CheckCircle,
  Package,
  Truck,
  RefreshCw,
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
import { BranchOrder, OrderStatus } from "@/app/types/order.types";
import { formatDate } from "@/lib/dateUtils";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { useAuthStore } from "@/stores/useAuthStore";
import { canUseBranchOrderRoutes, getOrderListPath } from "@/lib/order-routing";
import { isAdminRole } from "@/lib/roles";

// ── Tab config ──────────────────────────────────────────────────
const TABS = [
  { id: "all", label: "Tất cả" },
  { id: "AWAITING_REPLENISHMENT", label: "Chờ điều chuyển" },
  { id: "PENDING", label: "Chờ xác nhận" },
  { id: "CONFIRMED", label: "Đã xác nhận" },
  { id: "PROCESSING", label: "Đang đóng gói" },
  { id: "READY_FOR_PICKUP", label: "Chờ lấy hàng" },
  { id: "SHIPPING", label: "Đang giao" },
  { id: "RECEIVED", label: "Đã nhận hàng" },
  { id: "COMPLETED", label: "Hoàn thành" },
  { id: "CANCELLED", label: "Đã hủy" },
  { id: "RETURNED", label: "Trả hàng" },
];

const STATUS_MAP: Record<string, { label: string; styles: string }> = {
  AWAITING_REPLENISHMENT: {
    label: "Chờ điều chuyển",
    styles: "bg-rose-50 text-rose-700 border-rose-200",
  },
  PENDING: {
    label: "Chờ xác nhận",
    styles: "bg-amber-50 text-amber-700 border-amber-200",
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    styles: "bg-sky-50 text-sky-700 border-sky-200",
  },
  PROCESSING: {
    label: "Đang đóng gói",
    styles: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  READY_FOR_PICKUP: {
    label: "Chờ lấy hàng",
    styles: "bg-teal-50 text-teal-700 border-teal-200",
  },
  SHIPPING: {
    label: "Đang giao",
    styles: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  RECEIVED: {
    label: "Đã nhận hàng",
    styles: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  COMPLETED: {
    label: "Hoàn thành",
    styles: "bg-green-50 text-green-700 border-green-200",
  },
  CANCELLED: {
    label: "Đã hủy",
    styles: "bg-red-50 text-red-700 border-red-200",
  },
  RETURNED: {
    label: "Trả hàng",
    styles: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount || 0,
  );

const StatusBadge = ({ status }: { status: OrderStatus | string }) => {
  const mapped = STATUS_MAP[status] ?? {
    label: status,
    styles: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={cn(
        "px-2.5 py-0.5 rounded-[10px] text-[11px] border whitespace-nowrap",
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

// Nút hành động theo trạng thái hiện tại
const ActionButton = ({
  status,
  orderId,
  orderCode,
  canMarkReceived,
  onAction,
  onRequestReplenishment,
}: {
  status: string;
  orderId: number;
  orderCode: string;
  canMarkReceived?: boolean;
  onAction: (
    e: React.MouseEvent,
    orderId: number,
    orderCode: string,
    newStatus: string,
  ) => void;
  onRequestReplenishment: (
    e: React.MouseEvent,
    orderId: number,
    orderCode: string,
  ) => void;
}) => {
  const { hasPermission } = usePermissions();
  const canConfirm = hasPermission(P.ORDER_CONFIRM);

  switch (status) {
    case "AWAITING_REPLENISHMENT":
      return (
        <Button
          size="sm"
          className="h-[28px] bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-bold"
          onClick={(e) => onRequestReplenishment(e, orderId, orderCode)}
        >
          <Package size={13} className="mr-1.5" /> Tạo lệnh điều chuyển
        </Button>
      );
    case "PENDING":
      if (!canConfirm) return null;
      return (
        <Button
          size="sm"
          className="h-[28px] bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold"
          onClick={(e) => onAction(e, orderId, orderCode, "CONFIRMED")}
        >
          <CheckCircle size={13} className="mr-1.5" /> Xác nhận đơn
        </Button>
      );
    case "CONFIRMED":
      return (
        <Button
          size="sm"
          className="h-[28px] bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-bold"
          onClick={(e) => onAction(e, orderId, orderCode, "PROCESSING")}
        >
          <Package size={13} className="mr-1.5" /> Bắt đầu đóng gói
        </Button>
      );
    case "READY_FOR_PICKUP":
      return (
        <Button
          size="sm"
          className="h-[28px] bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold"
          onClick={(e) => onAction(e, orderId, orderCode, "SHIPPING")}
        >
          <Truck size={13} className="mr-1.5" /> Bàn giao vận chuyển
        </Button>
      );
    case "PROCESSING":
      return (
        <Button
          size="sm"
          className="h-[28px] bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold"
          onClick={(e) => onAction(e, orderId, orderCode, "READY_FOR_PICKUP")}
        >
          <Package size={13} className="mr-1.5" /> Hoàn tất đóng gói
        </Button>
      );
    case "SHIPPING":
      if (!canMarkReceived) return null;
      return (
        <Button
          size="sm"
          className="h-[28px] bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold"
          onClick={(e) => onAction(e, orderId, orderCode, "RECEIVED")}
        >
          <CheckCircle size={13} className="mr-1.5" /> Xác nhận đã nhận
        </Button>
      );
    case "RECEIVED":
      return (
        <Button
          size="sm"
          className="h-[28px] bg-emerald-700 hover:bg-emerald-800 text-white text-[12px] font-bold"
          onClick={(e) => onAction(e, orderId, orderCode, "COMPLETED")}
        >
          <CheckCircle size={13} className="mr-1.5" /> Hoàn tất đơn
        </Button>
      );
    default:
      return null;
  }
};

// ── Main Component ───────────────────────────────────────────────
export default function OrderListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoadingAuth, warehouseId } = useAuthStore();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<BranchOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailCache, setDetailCache] = useState<Record<number, BranchOrder>>(
    {},
  );
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const isAdmin = isAdminRole(user?.role);
  const canUseBranchOrders = canUseBranchOrderRoutes(user, warehouseId);

  const fetchOrders = useCallback(
    async (tab: string, q?: string) => {
      if (!canUseBranchOrders) return;

      setIsLoading(true);
      setExpandedId(null);
      try {
        const status = tab === "all" ? undefined : tab;
        const data = await orderService.getBranchOrders(status, q || undefined);
        setOrders(data);
        setSelectedItems([]);
      } catch {
        toast.error("Không thể tải danh sách đơn hàng của chi nhánh.");
      } finally {
        setIsLoading(false);
      }
    },
    [canUseBranchOrders],
  );

  useEffect(() => {
    if (isLoadingAuth) return;

    if (isAdmin) {
      router.replace(getOrderListPath(user, searchParams.get("status")));
      return;
    }

    if (!canUseBranchOrders) {
      router.replace("/admin/forbidden");
    }
  }, [canUseBranchOrders, isAdmin, isLoadingAuth, router, searchParams, user]);

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

  useEffect(() => {
    if (isLoadingAuth || !canUseBranchOrders) return;
    fetchOrders(activeTab);
  }, [activeTab, canUseBranchOrders, fetchOrders, isLoadingAuth]);

  // Expand row → lazy-load detail (items)
  const handleToggleRow = async (orderId: number) => {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(orderId);
    if (!detailCache[orderId]) {
      setLoadingDetailId(orderId);
      try {
        const detail = await orderService.getBranchOrderById(orderId);
        setDetailCache((prev) => ({ ...prev, [orderId]: detail }));
      } catch {
        toast.error("Không thể tải chi tiết đơn hàng.");
      } finally {
        setLoadingDetailId(null);
      }
    }
  };

  // Cập nhật trạng thái và refresh danh sách
  const handleStatusChange = async (
    e: React.MouseEvent,
    orderId: number,
    orderCode: string,
    newStatus: string,
  ) => {
    e.stopPropagation();
    try {
      await orderService.updateBranchOrderStatus(orderId, newStatus);
      const label = STATUS_MAP[newStatus]?.label ?? newStatus;
      toast.success(`Đơn hàng ${orderCode} → ${label}!`);
      // Nếu đang lọc theo tab cụ thể → xoá khỏi danh sách (đã không còn ở trạng thái đó)
      if (activeTab !== "all") {
        setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
        if (expandedId === orderId) setExpandedId(null);
      } else {
        // Trong tab "Tất cả" → cập nhật status inline
        setOrders((prev) =>
          prev.map((o) =>
            o.orderId === orderId
              ? {
                  ...o,
                  subOrderStatus: newStatus as OrderStatus,
                  shippingOverdue: false,
                  canMarkReceived: false,
                }
              : o,
          ),
        );
        // Invalidate detail cache để reload nếu mở lại
        setDetailCache((prev) => {
          const c = { ...prev };
          delete c[orderId];
          return c;
        });
      }
    } catch {
      toast.error("Lỗi khi cập nhật trạng thái đơn hàng.");
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
        await orderService.requestBranchOrderReplenishment(orderId);
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
  const toggleSelectAll = () => {
    setSelectedItems((prev) =>
      prev.length === orders.length ? [] : orders.map((order) => order.orderId),
    );
  };

  const toggleSelectItem = (orderId: number) => {
    setSelectedItems((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId],
    );
  };

  return (
    <div className="p-4 space-y-4 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[18px] font-bold text-slate-800">
          Đơn hàng chi nhánh{" "}
          <span className="font-normal text-slate-500 text-[15px]">
            ({orders.length} đơn)
          </span>
        </h1>
        <Button
          variant="outline"
          size="sm"
          className="h-[32px] text-[12px] border-slate-300 text-slate-600"
          onClick={() => fetchOrders(activeTab, search)}
        >
          <RefreshCw size={13} className="mr-1.5" /> Làm mới
        </Button>
      </div>

      {/* Search bar */}
      <div className="bg-white p-3 rounded-[4px] border border-[#dcdcdc] shadow-sm">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <Input
            placeholder="Tìm theo mã đơn hàng hoặc tên khách hàng, nhấn Enter để tìm"
            className="pl-9 h-[34px] text-[13px] border-slate-300 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && fetchOrders(activeTab, search)
            }
          />
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-[4px] border border-[#dcdcdc] shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center border-b border-[#eee] px-4 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearch("");
                const params = new URLSearchParams(searchParams.toString());
                if (tab.id === "all") {
                  params.delete("status");
                } else {
                  params.set("status", tab.id);
                }
                const query = params.toString();
                router.replace(
                  query ? `/admin/orders?${query}` : "/admin/orders",
                );
              }}
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

        {/* Table */}
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
                <TableHead className="text-[12px] font-bold text-slate-800 min-w-[130px]">
                  Mã đơn hàng
                </TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">
                  Ngày đặt
                </TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">
                  Khách hàng
                </TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800 text-right">
                  Tiền hàng
                </TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800 text-right">
                  Phí ship
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
                    colSpan={9}
                    className="h-32 text-center text-slate-400 animate-pulse"
                  >
                    Đang tải dữ liệu đơn hàng...
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-32 text-center text-slate-500"
                  >
                    Không có đơn hàng nào.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const isExpanded = expandedId === order.orderId;
                  const detail = detailCache[order.orderId];
                  const isLoadingDetail = loadingDetailId === order.orderId;

                  return (
                    <React.Fragment key={order.subOrderId}>
                      {/* Row chính */}
                      <TableRow
                        className={cn(
                          "border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors",
                          selectedItems.includes(order.orderId) &&
                            "bg-blue-50/20",
                          isExpanded && "bg-blue-50/30",
                        )}
                        onClick={() => handleToggleRow(order.orderId)}
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
                            checked={selectedItems.includes(order.orderId)}
                            onCheckedChange={() =>
                              toggleSelectItem(order.orderId)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <span className="text-[13px] font-medium text-blue-600">
                            {order.orderCode}
                          </span>
                        </TableCell>
                        <TableCell className="text-[13px] text-slate-700 whitespace-nowrap">
                          {formatDate(order.createdAt, "dd/MM/yyyy HH:mm:ss")}
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
                        <TableCell className="text-[13px] font-medium text-slate-800 text-right whitespace-nowrap">
                          {formatCurrency(order.subtotal)}
                        </TableCell>
                        <TableCell className="text-[13px] text-slate-600 text-right whitespace-nowrap">
                          {formatCurrency(order.shippingFee)}
                        </TableCell>
                        <TableCell className="text-center">
                          <PaymentBadge status={order.paymentStatus} />
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={order.subOrderStatus} />
                        </TableCell>
                      </TableRow>

                      {/* Row mở rộng — chi tiết đơn */}
                      {isExpanded && (
                        <TableRow className="bg-[#f8fbff] hover:bg-[#f8fbff]">
                          <TableCell
                            colSpan={9}
                            className="p-0 border-b border-blue-100"
                          >
                            <div className="flex flex-col md:flex-row p-4 gap-6">
                              {/* Sidebar: địa chỉ, vận chuyển */}
                              <div className="w-full md:w-[22%] space-y-3 border-r border-slate-200 pr-4">
                                <div>
                                  <h3 className="text-[12px] font-bold text-slate-800 mb-1">
                                    Địa chỉ giao hàng
                                  </h3>
                                  <p className="text-[12px] text-slate-600 leading-relaxed">
                                    {order.shippingAddress}
                                  </p>
                                </div>
                                {order.carrier && (
                                  <div>
                                    <h3 className="text-[12px] font-bold text-slate-800 mb-1">
                                      Đơn vị vận chuyển
                                    </h3>
                                    <p className="text-[12px] text-slate-600">
                                      {order.carrier}
                                    </p>
                                  </div>
                                )}
                                {order.estimatedDays && (
                                  <div>
                                    <h3 className="text-[12px] font-bold text-slate-800 mb-1">
                                      Dự kiến giao
                                    </h3>
                                    <p className="text-[12px] text-slate-600">
                                      {(() => {
                                        try {
                                          return new Date(
                                            order.estimatedDays!,
                                          ).toLocaleDateString("vi-VN");
                                        } catch {
                                          return order.estimatedDays;
                                        }
                                      })()}
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
                                  <p className="text-[12px] font-medium text-slate-800">
                                    {formatCurrency(order.shippingFee)}
                                  </p>
                                </div>
                              </div>

                              {/* Bảng sản phẩm + nút hành động */}
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-3">
                                  <h3 className="text-[12px] font-bold text-slate-800">
                                    Sản phẩm cần chuẩn bị
                                  </h3>
                                  <ActionButton
                                    status={order.subOrderStatus}
                                    orderId={order.orderId}
                                    orderCode={order.orderCode}
                                    canMarkReceived={order.canMarkReceived}
                                    onAction={handleStatusChange}
                                    onRequestReplenishment={
                                      handleRequestReplenishment
                                    }
                                  />
                                </div>
                                {order.shippingOverdue && (
                                  <div className="mb-3 rounded-[4px] border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                                    Đơn đang giao quá 7 ngày.
                                    {typeof order.overdueShippingDays ===
                                      "number" && order.overdueShippingDays > 0
                                      ? ` Hiện đã ${order.overdueShippingDays} ngày kể từ lần cập nhật gần nhất.`
                                      : ""}{" "}
                                    Bạn có thể xác nhận "Đã nhận hàng" thủ công.
                                  </div>
                                )}

                                <div className="border border-slate-200 rounded-[3px] overflow-hidden bg-white">
                                  <table className="w-full text-left">
                                    <thead className="bg-[#f4f6f8] text-[11px] font-bold text-slate-600 uppercase">
                                      <tr>
                                        <th className="p-2 pl-3">Sản phẩm</th>
                                        <th className="p-2 text-center">SL</th>
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
                                            Đang tải sản phẩm...
                                          </td>
                                        </tr>
                                      ) : detail?.items?.length ? (
                                        detail.items.map((item, idx) => (
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
                                            <td className="p-2 text-center text-[12px] text-slate-700 font-bold">
                                              <div>{item.quantity}</div>
                                              {(item.missingQuantity ?? 0) >
                                                0 && (
                                                <div className="text-[10px] font-semibold text-rose-600">
                                                  Thiếu {item.missingQuantity}
                                                </div>
                                              )}
                                            </td>
                                            <td className="p-2 text-right text-[12px] text-slate-700">
                                              {formatCurrency(item.price)}
                                            </td>
                                            <td className="p-2 text-right pr-3 text-[12px] font-bold text-slate-800">
                                              {formatCurrency(item.totalPrice)}
                                            </td>
                                          </tr>
                                        ))
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
