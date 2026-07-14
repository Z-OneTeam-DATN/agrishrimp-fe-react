"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronsRight,
  Package,
  Settings,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { orderService } from "@/app/services/order.service";
import { MyOrder, OrderStatus } from "@/app/types/order.types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePermissions } from "@/hooks/usePermissions";
import {
  ADMIN_ORDER_STATUS_PAGES,
  AdminOrderPageStatus,
} from "@/lib/admin-order-status-pages";
import { formatDate } from "@/lib/dateUtils";
import { P } from "@/lib/permissions";
import { isAdminRole } from "@/lib/roles";
import { getOrderListPath } from "@/lib/order-routing";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  canApprovePackedAndShip,
  DeliveryStatusBadge,
  getOrderBranchSummary,
  getOrderCode,
  hasOrderShortage,
  InventoryStatusBadge,
  OrderWorkflowBadge,
  PaymentStatusBadge,
} from "./OrderStateBadges";

type AdminOrderListPageProps = {
  title: string;
  fixedStatus?: AdminOrderPageStatus;
};

type PaymentFilter = "ALL" | "PAID" | "UNPAID";
type StatusFilter = "ALL" | OrderStatus;

const TABLE_COL_SPAN = 12;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount || 0);

const ORDER_STATUS_FILTER_OPTIONS: Array<{ label: string; value: StatusFilter }> = [
  { label: "Tất cả trạng thái", value: "ALL" },
  ...ADMIN_ORDER_STATUS_PAGES.map((page) => ({
    label: page.label,
    value: page.status,
  })),
  { label: "Trả hàng", value: "RETURNED" },
];

const normalizeText = (value: string | null | undefined) =>
  (value || "").trim().toLowerCase();

const getDateValueTimestamp = (value: string, endOfDay = false) => {
  if (!value) {
    return null;
  }

  const normalizedValue = endOfDay
    ? `${value}T23:59:59.999`
    : `${value}T00:00:00.000`;
  const timestamp = new Date(normalizedValue).getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
};

export default function AdminOrderListPage({
  title,
  fixedStatus,
}: AdminOrderListPageProps) {
  const router = useRouter();
  const { hasPermission, isLoadingAuth } = usePermissions();
  const { user } = useAuthStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("ALL");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailCache, setDetailCache] = useState<Record<number, MyOrder>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [shippingOrderId, setShippingOrderId] = useState<number | null>(null);

  const isAdmin = isAdminRole(user?.role);
  const isAllOrdersPage = !fixedStatus;

  useEffect(() => {
    if (isLoadingAuth) {
      return;
    }

    if (!isAdmin) {
      router.replace(getOrderListPath(user, fixedStatus));
      return;
    }

    if (!hasPermission(P.ORDER_VIEW)) {
      router.push("/admin/forbidden");
    }
  }, [fixedStatus, hasPermission, isAdmin, isLoadingAuth, router, user]);

  const fetchOrders = useCallback(async () => {
    if (!isAdmin) {
      return;
    }

    setIsLoading(true);
    setExpandedId(null);
    try {
      const data = await orderService.getAdminOrders(fixedStatus);
      setOrders(data);
      setSelectedItems([]);
    } catch {
      toast.error("Không thể tải danh sách đơn hàng toàn hệ thống.");
    } finally {
      setIsLoading(false);
    }
  }, [fixedStatus, isAdmin]);

  useEffect(() => {
    if (isLoadingAuth || !isAdmin) {
      return;
    }

    void fetchOrders();
  }, [fetchOrders, isAdmin, isLoadingAuth]);

  const filteredOrders = useMemo(() => {
    const normalizedKeyword = normalizeText(search);
    const startTimestamp = getDateValueTimestamp(startDateFilter);
    const endTimestamp = getDateValueTimestamp(endDateFilter, true);

    return orders.filter((order) => {
      const matchesKeyword =
        !normalizedKeyword ||
        normalizeText(getOrderCode(order)).includes(normalizedKeyword) ||
        normalizeText(order.customerName).includes(normalizedKeyword) ||
        normalizeText(order.customerPhone).includes(normalizedKeyword);

      const matchesStatus =
        !isAllOrdersPage ||
        statusFilter === "ALL" ||
        order.status === statusFilter;

      const matchesPayment =
        paymentFilter === "ALL" || order.paymentStatus === paymentFilter;

      const createdAtTimestamp = new Date(order.createdAt).getTime();
      const hasValidCreatedAt = !Number.isNaN(createdAtTimestamp);
      const matchesStartDate =
        !startTimestamp ||
        (hasValidCreatedAt && createdAtTimestamp >= startTimestamp);
      const matchesEndDate =
        !endTimestamp || (hasValidCreatedAt && createdAtTimestamp <= endTimestamp);

      return (
        matchesKeyword &&
        matchesStatus &&
        matchesPayment &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [
    endDateFilter,
    isAllOrdersPage,
    orders,
    paymentFilter,
    search,
    startDateFilter,
    statusFilter,
  ]);

  const shortageCount = useMemo(
    () => filteredOrders.filter(hasOrderShortage).length,
    [filteredOrders],
  );

  const unpaidCount = useMemo(
    () => filteredOrders.filter((order) => order.paymentStatus !== "PAID").length,
    [filteredOrders],
  );

  const totalFilteredValue = useMemo(
    () =>
      filteredOrders.reduce(
        (sum, order) => sum + Number(order.finalAmount ?? order.totalAmount ?? 0),
        0,
      ),
    [filteredOrders],
  );

  useEffect(() => {
    setSelectedItems((prev) =>
      prev.filter((id) => filteredOrders.some((order) => order.id === id)),
    );
  }, [filteredOrders]);

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
        toast.error("Không thể tải nhanh chi tiết đơn hàng.");
      } finally {
        setLoadingDetailId(null);
      }
    }
  };

  const handleRequestReplenishment = async (
    event: React.MouseEvent,
    orderId: number,
    orderCode: string,
  ) => {
    event.stopPropagation();

    try {
      const response = await orderService.requestAdminOrderReplenishment(orderId);
      const transferSummary = response.transferCodes?.length
        ? ` (${response.transferCodes.join(", ")})`
        : "";
      toast.success(
        `Đã tạo lệnh điều chuyển cho ${orderCode}${transferSummary}`,
      );
      await fetchOrders();
    } catch {
      toast.error("Không thể tạo lệnh điều chuyển bổ sung.");
    }
  };

  const handleApprovePackedAndShip = async (
    event: React.MouseEvent,
    orderId: number,
    orderCode: string,
  ) => {
    event.stopPropagation();

    try {
      setShippingOrderId(orderId);
      await orderService.approvePackedAndShipOrder(orderId);
      toast.success(`Đơn hàng ${orderCode} đã chuyển sang đang giao.`);
      await fetchOrders();
    } catch {
      toast.error("Không thể chuyển đơn hàng sang trạng thái đang giao.");
    } finally {
      setShippingOrderId(null);
    }
  };

  const toggleSelectAll = () => {
    setSelectedItems((prev) =>
      prev.length === filteredOrders.length
        ? []
        : filteredOrders.map((order) => order.id),
    );
  };

  const toggleSelectItem = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id],
    );
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setPaymentFilter("ALL");
    setStartDateFilter("");
    setEndDateFilter("");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-slate-900">{title}</h1>
            <p className="mt-1 text-[13px] text-slate-500">
              Quản lý theo đơn hàng, giao hàng, thanh toán và tình trạng thiếu
              hàng trên cùng một màn hình.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[12px]">
            <div className="rounded-full bg-blue-50 px-3 py-1.5 font-semibold text-blue-700">
              Hiển thị {filteredOrders.length} đơn
            </div>
            <div className="rounded-full bg-rose-50 px-3 py-1.5 font-semibold text-rose-700">
              Thiếu hàng {shortageCount}
            </div>
            <div className="rounded-full bg-amber-50 px-3 py-1.5 font-semibold text-amber-700">
              Chưa thanh toán {unpaidCount}
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700">
              Tổng giá trị {formatCurrency(totalFilteredValue)}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-12">
          <div className="space-y-1 xl:col-span-4">
            <p className="text-[12px] font-semibold text-slate-600">
              Tìm kiếm đơn hàng
            </p>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm mã đơn, tên khách hàng, số điện thoại..."
              className="h-10 border-slate-200 bg-white text-[13px] focus-visible:ring-blue-500"
            />
          </div>

          {isAllOrdersPage ? (
            <div className="space-y-1 xl:col-span-2">
              <p className="text-[12px] font-semibold text-slate-600">
                Trạng thái đơn
              </p>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] outline-none focus:border-blue-500"
              >
                {ORDER_STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="space-y-1 xl:col-span-2">
            <p className="text-[12px] font-semibold text-slate-600">
              Thanh toán
            </p>
            <select
              value={paymentFilter}
              onChange={(event) =>
                setPaymentFilter(event.target.value as PaymentFilter)
              }
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] outline-none focus:border-blue-500"
            >
              <option value="ALL">Tất cả thanh toán</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="UNPAID">Chưa thanh toán</option>
            </select>
          </div>

          <div className="space-y-1 xl:col-span-2">
            <p className="text-[12px] font-semibold text-slate-600">Từ ngày</p>
            <Input
              type="date"
              value={startDateFilter}
              onChange={(event) => setStartDateFilter(event.target.value)}
              className="h-10 border-slate-200 bg-white text-[13px] focus-visible:ring-blue-500"
            />
          </div>

          <div className="space-y-1 xl:col-span-2">
            <p className="text-[12px] font-semibold text-slate-600">Đến ngày</p>
            <Input
              type="date"
              value={endDateFilter}
              onChange={(event) => setEndDateFilter(event.target.value)}
              className="h-10 border-slate-200 bg-white text-[13px] focus-visible:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-slate-200"
            onClick={resetFilters}
          >
            Xóa bộ lọc
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-slate-200"
            onClick={() => void fetchOrders()}
          >
            Làm mới danh sách
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[4px] border border-slate-200 bg-white shadow-sm">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b border-slate-200">
                <TableHead className="w-[42px] pl-4">
                  <Settings size={14} className="text-slate-400" />
                </TableHead>
                <TableHead className="w-[42px]">
                  <Checkbox
                    className="border-slate-300 data-[state=checked]:bg-blue-600"
                    checked={
                      filteredOrders.length > 0 &&
                      selectedItems.length === filteredOrders.length
                    }
                    onCheckedChange={() => toggleSelectAll()}
                  />
                </TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">
                  Mã đơn hàng
                </TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">
                  Khách hàng
                </TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">
                  Thời gian đặt
                </TableHead>
                <TableHead className="text-right text-[12px] font-bold text-slate-800">
                  Tổng tiền
                </TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">
                  Chi nhánh phụ trách
                </TableHead>
                <TableHead className="text-center text-[12px] font-bold text-slate-800">
                  Tình trạng hàng
                </TableHead>
                <TableHead className="text-center text-[12px] font-bold text-slate-800">
                  Thanh toán
                </TableHead>
                <TableHead className="text-center text-[12px] font-bold text-slate-800">
                  Trạng thái đơn
                </TableHead>
                <TableHead className="text-center text-[12px] font-bold text-slate-800">
                  Giao hàng
                </TableHead>
                <TableHead className="text-center text-[12px] font-bold text-slate-800">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={TABLE_COL_SPAN}
                    className="h-32 text-center text-slate-400"
                  >
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={TABLE_COL_SPAN}
                    className="h-32 text-center text-slate-500"
                  >
                    Không có đơn hàng phù hợp với bộ lọc hiện tại.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const orderId = order.id;
                  const orderCode = getOrderCode(order);
                  const isExpanded = expandedId === orderId;
                  const detail = detailCache[orderId];
                  const isLoadingDetail = loadingDetailId === orderId;
                  const orderDetail = detail ?? order;
                  const allowDirectShip =
                    hasPermission(P.ORDER_UPDATE) &&
                    canApprovePackedAndShip(order, detail);
                  const allowReplenishment =
                    hasPermission(P.ORDER_UPDATE) &&
                    order.status === "AWAITING_REPLENISHMENT";

                  return (
                    <React.Fragment key={orderId}>
                      <TableRow
                        className={cn(
                          "cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50",
                          selectedItems.includes(orderId) && "bg-blue-50/20",
                          isExpanded && "bg-blue-50/30",
                        )}
                        onClick={() => void handleToggleRow(orderId)}
                      >
                        <TableCell className="pl-4 text-center text-slate-400">
                          {isExpanded ? (
                            <ChevronDown size={14} className="text-blue-600" />
                          ) : (
                            <ChevronsRight size={14} />
                          )}
                        </TableCell>
                        <TableCell onClick={(event) => event.stopPropagation()}>
                          <Checkbox
                            className="border-slate-300 data-[state=checked]:bg-blue-600"
                            checked={selectedItems.includes(orderId)}
                            onCheckedChange={() => toggleSelectItem(orderId)}
                          />
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/admin/orders/${order.id}`}
                            onClick={(event) => event.stopPropagation()}
                            className="text-[13px] font-semibold text-blue-700 hover:underline"
                          >
                            {orderCode}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-medium text-slate-800">
                              {order.customerName}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {order.customerPhone}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-[13px] text-slate-700">
                          {formatDate(order.createdAt, "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="text-right text-[13px] font-semibold text-slate-800">
                          {formatCurrency(order.finalAmount ?? order.totalAmount)}
                        </TableCell>
                        <TableCell className="text-[13px] text-slate-700">
                          {getOrderBranchSummary(order)}
                        </TableCell>
                        <TableCell className="text-center">
                          <InventoryStatusBadge order={order} />
                        </TableCell>
                        <TableCell className="text-center">
                          <PaymentStatusBadge status={order.paymentStatus} />
                        </TableCell>
                        <TableCell className="text-center">
                          <OrderWorkflowBadge status={order.status} />
                        </TableCell>
                        <TableCell className="text-center">
                          <DeliveryStatusBadge status={order.status} />
                        </TableCell>
                        <TableCell
                          className="text-center"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="h-8 border-slate-200 text-[12px]"
                            >
                              <Link href={`/admin/orders/${order.id}`}>Chi tiết</Link>
                            </Button>
                            {allowDirectShip ? (
                              <Button
                                size="sm"
                                className="h-8 bg-blue-600 text-[12px] hover:bg-blue-700"
                                disabled={shippingOrderId === orderId}
                                onClick={(event) =>
                                  void handleApprovePackedAndShip(
                                    event,
                                    orderId,
                                    orderCode,
                                  )
                                }
                              >
                                <Truck className="mr-1 h-3.5 w-3.5" />
                                Giao hàng
                              </Button>
                            ) : allowReplenishment ? (
                              <Button
                                size="sm"
                                className="h-8 bg-rose-600 text-[12px] hover:bg-rose-700"
                                onClick={(event) =>
                                  void handleRequestReplenishment(
                                    event,
                                    orderId,
                                    orderCode,
                                  )
                                }
                              >
                                <Package className="mr-1 h-3.5 w-3.5" />
                                Điều chuyển
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>

                      {isExpanded ? (
                        <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                          <TableCell
                            colSpan={TABLE_COL_SPAN}
                            className="border-b border-slate-100 p-0"
                          >
                            <div className="grid gap-4 p-4 xl:grid-cols-[0.9fr_1.1fr]">
                              <div className="space-y-4">
                                <div className="rounded-[4px] border border-slate-200 bg-white p-4">
                                  <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                                    Giao hàng và khách nhận
                                  </p>
                                  <div className="mt-3 space-y-3 text-[13px] text-slate-700">
                                    <div>
                                      <span className="font-semibold text-slate-800">
                                        Người nhận:
                                      </span>{" "}
                                      {order.receiverName || order.customerName}
                                    </div>
                                    <div>
                                      <span className="font-semibold text-slate-800">
                                        Điện thoại:
                                      </span>{" "}
                                      {order.receiverPhone || order.customerPhone}
                                    </div>
                                    <div>
                                      <span className="font-semibold text-slate-800">
                                        Địa chỉ:
                                      </span>{" "}
                                      {order.shippingAddress}
                                    </div>
                                    <div>
                                      <span className="font-semibold text-slate-800">
                                        Phương thức thanh toán:
                                      </span>{" "}
                                      {order.paymentMethod}
                                    </div>
                                    <div>
                                      <span className="font-semibold text-slate-800">
                                        Phí giao hàng:
                                      </span>{" "}
                                      {formatCurrency(
                                        order.totalShippingFee ??
                                          order.shippingFee ??
                                          0,
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="rounded-[4px] border border-slate-200 bg-white p-4">
                                  <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                                    Tình trạng xử lý
                                  </p>
                                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                                      <p className="text-[11px] font-semibold text-slate-500">
                                        Chi nhánh phụ trách
                                      </p>
                                      <p className="mt-2 text-[13px] text-slate-800">
                                        {getOrderBranchSummary(orderDetail)}
                                      </p>
                                    </div>
                                    <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                                      <p className="text-[11px] font-semibold text-slate-500">
                                        Tình trạng hàng
                                      </p>
                                      <div className="mt-2">
                                        <InventoryStatusBadge order={orderDetail} />
                                      </div>
                                    </div>
                                    <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                                      <p className="text-[11px] font-semibold text-slate-500">
                                        Trạng thái đơn
                                      </p>
                                      <div className="mt-2">
                                        <OrderWorkflowBadge status={order.status} />
                                      </div>
                                    </div>
                                    <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                                      <p className="text-[11px] font-semibold text-slate-500">
                                        Giao hàng
                                      </p>
                                      <div className="mt-2">
                                        <DeliveryStatusBadge status={order.status} />
                                      </div>
                                    </div>
                                  </div>
                                  {order.note ? (
                                    <div className="mt-3 rounded-[4px] border border-slate-200 bg-slate-50 p-3 text-[13px] text-slate-600">
                                      <span className="font-semibold text-slate-800">
                                        Ghi chú:
                                      </span>{" "}
                                      {order.note}
                                    </div>
                                  ) : null}
                                </div>
                              </div>

                              <div className="rounded-[4px] border border-slate-200 bg-white p-4">
                                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                                      Sản phẩm trong đơn
                                    </p>
                                    <p className="mt-1 text-[12px] text-slate-500">
                                      Xem nhanh trước khi mở màn chi tiết đầy đủ.
                                    </p>
                                  </div>
                                  <Button
                                    asChild
                                    size="sm"
                                    variant="outline"
                                    className="border-slate-200"
                                  >
                                    <Link href={`/admin/orders/${order.id}`}>
                                      Mở chi tiết đầy đủ
                                    </Link>
                                  </Button>
                                </div>

                                <div className="overflow-hidden rounded-[4px] border border-slate-200">
                                  <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                                      <tr>
                                        <th className="px-3 py-2 font-semibold">
                                          Sản phẩm
                                        </th>
                                        <th className="px-3 py-2 font-semibold text-center">
                                          SL
                                        </th>
                                        <th className="px-3 py-2 font-semibold text-center">
                                          Thiếu
                                        </th>
                                        <th className="px-3 py-2 font-semibold text-right">
                                          Thành tiền
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {isLoadingDetail ? (
                                        <tr>
                                          <td
                                            colSpan={4}
                                            className="px-3 py-5 text-center text-[12px] text-slate-400"
                                          >
                                            Đang tải chi tiết...
                                          </td>
                                        </tr>
                                      ) : (orderDetail.items ?? []).length > 0 ? (
                                        orderDetail.items.map((item) => (
                                          <tr
                                            key={item.id}
                                            className="border-t border-slate-100 text-[13px]"
                                          >
                                            <td className="px-3 py-3">
                                              <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-slate-200 bg-slate-50">
                                                  {item.image ? (
                                                    <img
                                                      src={item.image}
                                                      alt={item.productName}
                                                      className="h-full w-full object-cover"
                                                    />
                                                  ) : (
                                                    <Package
                                                      size={14}
                                                      className="text-slate-300"
                                                    />
                                                  )}
                                                </div>
                                                <div>
                                                  <p className="font-medium text-slate-800">
                                                    {item.productName}
                                                  </p>
                                                  <p className="text-[11px] text-slate-500">
                                                    SKU: {item.sku}
                                                  </p>
                                                </div>
                                              </div>
                                            </td>
                                            <td className="px-3 py-3 text-center text-slate-700">
                                              {item.quantity}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                              {(item.missingQuantity ?? 0) > 0 ? (
                                                <span className="rounded-full bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700">
                                                  {item.missingQuantity}
                                                </span>
                                              ) : (
                                                <span className="text-slate-400">
                                                  0
                                                </span>
                                              )}
                                            </td>
                                            <td className="px-3 py-3 text-right font-semibold text-slate-800">
                                              {formatCurrency(item.totalPrice ?? 0)}
                                            </td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td
                                            colSpan={4}
                                            className="px-3 py-5 text-center text-[12px] text-slate-500"
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

                            <div className="border-t border-slate-100 px-4 py-2">
                              <button
                                type="button"
                                onClick={() => setExpandedId(null)}
                                className="flex items-center text-[12px] font-medium text-blue-600 hover:text-blue-800"
                              >
                                <ChevronUp size={14} className="mr-1" />
                                Thu gọn
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null}
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
