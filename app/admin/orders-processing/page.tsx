"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Search,
  Settings,
  ChevronDown,
  ChevronsRight,
  ChevronUp,
  PackageCheck,
  Package,
  Printer,
  RefreshCw,
  CheckCircle2,
  Truck,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { orderService } from "@/app/services/order.service";
import { BranchOrder } from "@/app/types/order.types";
import { cn } from "@/lib/utils";
import { canUseBranchOrderRoutes } from "@/lib/order-routing";
import { useAuthStore } from "@/stores/useAuthStore";

const DEFAULT_TAB = "PROCESSING";

const TABS = [
  { id: "AWAITING_REPLENISHMENT", label: "Chờ điều chuyển", icon: PackageCheck },
  { id: "PENDING", label: "Chờ xác nhận", icon: CheckCircle2 },
  { id: "CONFIRMED", label: "Đã xác nhận", icon: CheckCircle2 },
  { id: "PROCESSING", label: "Đang chuẩn bị", icon: Printer },
  { id: "READY_FOR_PICKUP", label: "Chờ bàn giao", icon: Truck },
] as const;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount || 0);

const getEmptyStateLabel = (status: string) => {
  switch (status) {
    case "AWAITING_REPLENISHMENT":
      return "chờ điều chuyển";
    case "PENDING":
      return "chờ xác nhận";
    case "CONFIRMED":
      return "đã xác nhận nhưng chưa bắt đầu chuẩn bị";
    case "PROCESSING":
      return "đang chuẩn bị";
    case "READY_FOR_PICKUP":
      return "chờ bàn giao";
    default:
      return "phù hợp bộ lọc";
  }
};

const getSuccessMessage = (orderCode: string, status: string) => {
  switch (status) {
    case "CONFIRMED":
      return `Đơn hàng ${orderCode} đã được xác nhận.`;
    case "PROCESSING":
      return `Đơn hàng ${orderCode} đã chuyển sang chuẩn bị hàng.`;
    case "READY_FOR_PICKUP":
      return `Đơn hàng ${orderCode} đã sẵn sàng để bàn giao.`;
    default:
      return `Đơn hàng ${orderCode} đã được cập nhật.`;
  }
};

export default function OrderManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoadingAuth, warehouseId } = useAuthStore();
  const canUseBranchOrders = canUseBranchOrderRoutes(user, warehouseId);

  const [activeTab, setActiveTab] = useState<string>(DEFAULT_TAB);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [orders, setOrders] = useState<BranchOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailCache, setDetailCache] = useState<Record<number, BranchOrder>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);

  const fetchOrders = useCallback(
    async (status: string, keyword?: string) => {
      if (!canUseBranchOrders) {
        return;
      }

      setIsLoading(true);
      try {
        const data = await orderService.getBranchOrders(status, keyword || undefined);
        setOrders(data);
      } catch {
        toast.error("Không thể tải danh sách đơn hàng chi nhánh.");
      } finally {
        setIsLoading(false);
      }
    },
    [canUseBranchOrders],
  );

  useEffect(() => {
    if (isLoadingAuth) {
      return;
    }

    if (!canUseBranchOrders) {
      router.replace("/admin/forbidden");
    }
  }, [canUseBranchOrders, isLoadingAuth, router]);

  useEffect(() => {
    const requestedStatus = searchParams.get("status")?.toUpperCase();
    const matchedTab = TABS.find((tab) => tab.id === requestedStatus);
    setActiveTab(matchedTab?.id ?? DEFAULT_TAB);
  }, [searchParams]);

  useEffect(() => {
    if (isLoadingAuth || !canUseBranchOrders) {
      return;
    }

    fetchOrders(activeTab, search);
  }, [activeTab, canUseBranchOrders, fetchOrders, isLoadingAuth]);

  const changeTab = (tabId: string) => {
    setActiveTab(tabId);
    setExpandedId(null);
    setSearch("");
    router.replace(`/admin/orders-processing?status=${tabId}`);
  };

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

  const clearOrderFromCurrentView = (orderId: number) => {
    setOrders((prev) => prev.filter((order) => order.orderId !== orderId));
    setExpandedId((prev) => (prev === orderId ? null : prev));
    setDetailCache((prev) => {
      const next = { ...prev };
      delete next[orderId];
      return next;
    });
  };

  const handleUpdateStatus = async (
    event: React.MouseEvent,
    order: BranchOrder,
    nextStatus: string,
  ) => {
    event.stopPropagation();

    try {
      await orderService.updateBranchOrderStatus(order.orderId, nextStatus);
      toast.success(getSuccessMessage(order.orderCode, nextStatus));
      clearOrderFromCurrentView(order.orderId);
    } catch {
      toast.error("Lỗi khi cập nhật trạng thái đơn hàng.");
    }
  };

  const handleRequestReplenishment = async (
    event: React.MouseEvent,
    order: BranchOrder,
  ) => {
    event.stopPropagation();

    try {
      const response = await orderService.requestBranchOrderReplenishment(order.orderId);
      const transferSummary = response.transferCodes?.length
        ? ` (${response.transferCodes.join(", ")})`
        : "";
      toast.success(`Đã tạo lệnh điều chuyển cho ${order.orderCode}${transferSummary}`);
      fetchOrders(activeTab, search);
    } catch {
      toast.error("Không thể tạo lệnh điều chuyển bổ sung.");
    }
  };

  const openHandoverCreate = (event: React.MouseEvent, subOrderId: number) => {
    event.stopPropagation();
    router.push(`/admin/orders-handover/create?subOrderIds=${subOrderId}`);
  };

  return (
    <div className="min-h-screen space-y-4 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[18px] font-bold uppercase tracking-wide text-slate-800">
          Điều hành đơn hàng chi nhánh{" "}
          <span className="text-[15px] font-normal text-slate-500">({orders.length} đơn)</span>
        </h1>
        <Button
          variant="outline"
          size="sm"
          className="h-[32px] border-slate-300 bg-white text-[12px] text-slate-600 hover:bg-slate-50"
          onClick={() => fetchOrders(activeTab, search)}
        >
          <RefreshCw size={13} className="mr-1.5" /> Làm mới
        </Button>
      </div>

      <div className="flex w-fit rounded-lg border border-[#dcdcdc] bg-white p-1 shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => changeTab(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-md px-5 py-2 text-[13px] font-bold transition-all",
                activeTab === tab.id
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100",
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-[4px] border border-[#dcdcdc] bg-white p-3 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            placeholder="Tìm theo mã đơn hoặc tên khách hàng, nhấn Enter để tìm"
            className="h-[36px] border-slate-300 bg-white pl-9 text-[13px] focus:border-emerald-500 focus:ring-emerald-500"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                fetchOrders(activeTab, search);
              }
            }}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#f8fafc]">
              <TableRow className="h-11 border-b border-slate-200">
                <TableHead className="w-[45px] pl-4">
                  <Settings size={14} className="text-slate-400" />
                </TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">Mã đơn hàng</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">Ngày đặt</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">Khách hàng</TableHead>
                <TableHead className="text-right text-[12px] font-bold text-slate-800">Tiền hàng</TableHead>
                <TableHead className="text-right text-[12px] font-bold text-slate-800">Phí ship</TableHead>
                <TableHead className="text-center text-[12px] font-bold text-slate-800">
                  Thanh toán
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-slate-400">
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Package size={40} className="mb-2 opacity-20" />
                      <p className="text-[14px]">
                        Không có đơn hàng nào {getEmptyStateLabel(activeTab)}.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const isExpanded = expandedId === order.orderId;
                  const detail = detailCache[order.orderId];
                  const isLoadingDetail = loadingDetailId === order.orderId;
                  const hasMissingItems =
                    (detail?.items ?? order.items).some((item) => (item.missingQuantity ?? 0) > 0);

                  return (
                    <React.Fragment key={order.orderId}>
                      <TableRow
                        className={cn(
                          "cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50",
                          isExpanded && "bg-emerald-50/30",
                        )}
                        onClick={() => handleToggleRow(order.orderId)}
                      >
                        <TableCell className="pl-4 text-center text-slate-400">
                          {isExpanded ? (
                            <ChevronDown size={14} className="text-emerald-600" />
                          ) : (
                            <ChevronsRight size={14} />
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-[13px] font-bold text-blue-600">{order.orderCode}</span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-[13px] text-slate-700">
                          {new Date(order.createdAt).toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-medium text-slate-800">
                              {order.customerName}
                            </span>
                            <span className="text-[11px] text-slate-400">{order.customerPhone}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-[13px] font-bold text-slate-800">
                          {formatCurrency(order.subtotal)}
                        </TableCell>
                        <TableCell className="text-right text-[13px] text-slate-600">
                          {formatCurrency(order.shippingFee)}
                        </TableCell>
                        <TableCell className="text-center">
                          <PaymentBadge status={order.paymentStatus} />
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow className="bg-[#fcfdfd] hover:bg-[#fcfdfd]">
                          <TableCell colSpan={7} className="border-b border-emerald-100 p-0">
                            <div className="flex flex-col gap-8 p-5 md:flex-row">
                              <div className="w-full space-y-4 border-r border-slate-100 pr-6 md:w-[25%]">
                                <div>
                                  <h3 className="mb-1 text-[11px] font-bold uppercase text-slate-400">
                                    Địa chỉ giao hàng
                                  </h3>
                                  <p className="text-[13px] font-medium leading-relaxed text-slate-700">
                                    {order.shippingAddress}
                                  </p>
                                </div>

                                {order.carrier && (
                                  <div>
                                    <h3 className="mb-1 text-[11px] font-bold uppercase text-slate-400">
                                      Đơn vị vận chuyển
                                    </h3>
                                    <p className="text-[13px] font-medium text-slate-700">
                                      {order.carrier}
                                    </p>
                                  </div>
                                )}

                                {order.estimatedDays && (
                                  <div>
                                    <h3 className="mb-1 text-[11px] font-bold uppercase text-slate-400">
                                      Dự kiến giao
                                    </h3>
                                    <p className="text-[13px] font-medium text-slate-700">
                                      {new Date(order.estimatedDays).toLocaleDateString("vi-VN")}
                                    </p>
                                  </div>
                                )}

                                <div>
                                  <h3 className="mb-1 text-[11px] font-bold uppercase text-slate-400">
                                    Phương thức thanh toán
                                  </h3>
                                  <p className="text-[13px] font-medium text-slate-700">
                                    {order.paymentMethod}
                                  </p>
                                </div>
                              </div>

                              <div className="flex-1">
                                <div className="mb-4 flex items-center justify-between">
                                  <h3 className="text-[12px] font-bold uppercase tracking-tight text-slate-800">
                                    Chi tiết sản phẩm ({detail?.items?.length || order.items.length || 0})
                                  </h3>

                                  {activeTab === "AWAITING_REPLENISHMENT" ? (
                                    <Button
                                      size="sm"
                                      className="h-[32px] bg-rose-600 text-[12px] font-bold text-white shadow-sm hover:bg-rose-700"
                                      onClick={(event) => handleRequestReplenishment(event, order)}
                                    >
                                      <PackageCheck size={15} className="mr-1.5" />
                                      Tạo lệnh điều chuyển
                                    </Button>
                                  ) : activeTab === "PENDING" ? (
                                    <Button
                                      size="sm"
                                      className="h-[32px] bg-emerald-600 text-[12px] font-bold text-white shadow-sm hover:bg-emerald-700"
                                      onClick={(event) => handleUpdateStatus(event, order, "CONFIRMED")}
                                    >
                                      <CheckCircle2 size={15} className="mr-1.5" />
                                      Xác nhận đơn
                                    </Button>
                                  ) : activeTab === "CONFIRMED" ? (
                                    <Button
                                      size="sm"
                                      className="h-[32px] bg-blue-600 text-[12px] font-bold text-white shadow-sm hover:bg-blue-700"
                                      onClick={(event) => handleUpdateStatus(event, order, "PROCESSING")}
                                    >
                                      <Printer size={15} className="mr-1.5" />
                                      Bắt đầu chuẩn bị
                                    </Button>
                                  ) : activeTab === "PROCESSING" ? (
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-[32px] border-slate-300 bg-white text-[12px] font-bold"
                                        onClick={() => window.print()}
                                      >
                                        <Printer size={15} className="mr-1.5" />
                                        In vận đơn
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="h-[32px] bg-emerald-600 text-[12px] font-bold text-white shadow-sm hover:bg-emerald-700"
                                        onClick={(event) => handleUpdateStatus(event, order, "READY_FOR_PICKUP")}
                                      >
                                        <PackageCheck size={15} className="mr-1.5" />
                                        Chuyển chờ bàn giao
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      className="h-[32px] bg-blue-600 text-[12px] font-bold text-white shadow-sm hover:bg-blue-700"
                                      onClick={(event) => openHandoverCreate(event, order.subOrderId)}
                                    >
                                      <Truck size={15} className="mr-1.5" />
                                      Tạo phiếu bàn giao
                                    </Button>
                                  )}
                                </div>

                                {hasMissingItems && (
                                  <div className="mb-4 rounded-[4px] border border-amber-200 bg-amber-50 px-3.5 py-3 text-[12px] text-amber-800">
                                    Đơn này đang có phần hàng thiếu. Hệ thống sẽ điều chuyển hoặc gom nội bộ trước khi
                                    chuyển sang bước bàn giao vận chuyển.
                                  </div>
                                )}

                                <div className="overflow-hidden rounded-[4px] border border-slate-200 bg-white shadow-sm">
                                  <table className="w-full text-left">
                                    <thead className="bg-[#f8fafc] text-[11px] font-bold uppercase text-slate-500">
                                      <tr>
                                        <th className="p-3 pl-4">Sản phẩm</th>
                                        <th className="p-3 text-center">Số lượng</th>
                                        <th className="p-3 text-right">Đơn giá</th>
                                        <th className="p-3 pr-4 text-right">Thành tiền</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {isLoadingDetail ? (
                                        <tr>
                                          <td colSpan={4} className="p-6 text-center text-[12px] text-slate-400">
                                            Đang tải chi tiết sản phẩm...
                                          </td>
                                        </tr>
                                      ) : detail?.items?.length || order.items.length ? (
                                        (detail?.items ?? order.items).map((item, index) => (
                                          <tr
                                            key={index}
                                            className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                                          >
                                            <td className="p-3 pl-4">
                                              <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-100 bg-slate-50">
                                                  {item.image ? (
                                                    <img
                                                      src={item.image}
                                                      alt={item.productName}
                                                      className="h-full w-full object-cover"
                                                    />
                                                  ) : (
                                                    <Package size={18} className="text-slate-200" />
                                                  )}
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-[13px] font-bold text-slate-700">
                                                    {item.productName}
                                                  </span>
                                                  <span className="text-[11px] text-slate-400">
                                                    SKU: {item.sku}
                                                  </span>
                                                </div>
                                              </div>
                                            </td>
                                            <td className="p-3 text-center text-[13px] font-black text-slate-700">
                                              <div>{item.quantity}</div>
                                              {(item.missingQuantity ?? 0) > 0 && (
                                                <div className="text-[10px] font-semibold text-rose-600">
                                                  Thiếu {item.missingQuantity}
                                                </div>
                                              )}
                                            </td>
                                            <td className="p-3 text-right text-[13px] text-slate-600">
                                              {formatCurrency(item.price)}
                                            </td>
                                            <td className="p-3 pr-4 text-right text-[13px] font-bold text-emerald-700">
                                              {formatCurrency(item.totalPrice)}
                                            </td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td colSpan={4} className="p-6 text-center text-[12px] italic text-slate-500">
                                            Không có dữ liệu sản phẩm.
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end border-t border-slate-50 px-5 pb-3 pt-3">
                              <button
                                onClick={() => setExpandedId(null)}
                                className="flex items-center text-[12px] font-bold uppercase tracking-wider text-slate-400 transition-colors hover:text-emerald-600"
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

function PaymentBadge({ status }: { status: "PAID" | "UNPAID" }) {
  const styles =
    status === "PAID"
      ? "border-emerald-100 bg-emerald-50 text-emerald-600 font-bold"
      : "border-amber-100 bg-amber-50 text-amber-600 font-bold";
  return (
    <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] uppercase", styles)}>
      ● {status === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
    </span>
  );
}
