"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsRight,
  Package,
  Search,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import {
  getReplenishmentResultMessage,
  orderService,
  type AdminOrderSummaryResponse,
  type PageResponse,
} from "@/app/services/order.service";
import { MyOrder, OrderStatus } from "@/app/types/order.types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { formatDate, getCurrentMonthDateTimeRange } from "@/lib/dateUtils";
import { P } from "@/lib/permissions";
import { isAdminRole } from "@/lib/roles";
import { getOrderListPath } from "@/lib/order-routing";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  DeliveryStatusBadge,
  getNextOrderWorkflowAction,
  getOrderBranchNames,
  getOrderBranchSummary,
  getOrderCode,
  hasOrderShortage,
  InventoryStatusBadge,
  canRequestReplenishmentAction,
  OrderWorkflowBadge,
} from "./OrderStateBadges";

type AdminOrderListPageProps = {
  title: string;
  fixedStatus?: AdminOrderPageStatus;
};

type PaymentFilter = "ALL" | "PAID" | "UNPAID";
type StatusFilter = "ALL" | OrderStatus;

const TABLE_COL_SPAN = 10;
const PAGE_SIZE = 20;

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

export default function AdminOrderListPage({
  title,
  fixedStatus,
}: AdminOrderListPageProps) {
  const router = useRouter();
  const { hasPermission, isLoadingAuth } = usePermissions();
  const { user } = useAuthStore();
  const defaultMonthRange = useMemo(() => getCurrentMonthDateTimeRange(), []);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("ALL");
  const [startDateFilter, setStartDateFilter] = useState(defaultMonthRange.start);
  const [endDateFilter, setEndDateFilter] = useState(defaultMonthRange.end);
  const [currentPage, setCurrentPage] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [ordersPage, setOrdersPage] = useState<PageResponse<MyOrder> | null>(null);
  const [orderSummary, setOrderSummary] =
    useState<AdminOrderSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detailCache, setDetailCache] = useState<Record<number, MyOrder>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [advancingOrderId, setAdvancingOrderId] = useState<number | null>(null);

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(0);
  }, [fixedStatus, search, statusFilter, paymentFilter, startDateFilter, endDateFilter]);

  const adminOrderFilters = useMemo(
    () => ({
      status: fixedStatus ?? (statusFilter === "ALL" ? undefined : statusFilter),
      search: search || undefined,
      paymentStatus: paymentFilter === "ALL" ? undefined : paymentFilter,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined,
    }),
    [
      endDateFilter,
      fixedStatus,
      paymentFilter,
      search,
      startDateFilter,
      statusFilter,
    ],
  );

  const fetchOrders = useCallback(async () => {
    if (!isAdmin) {
      return;
    }

    setIsLoading(true);
    setExpandedId(null);
    try {
      const [data, summary] = await Promise.all([
        orderService.getAdminOrders({
          ...adminOrderFilters,
          page: currentPage,
          size: PAGE_SIZE,
        }),
        isAllOrdersPage
          ? orderService.getAdminOrderSummary(adminOrderFilters)
          : Promise.resolve(null),
      ]);
      setOrdersPage(data);
      setOrders(data.content ?? []);
      setOrderSummary(summary);
      setSelectedItems([]);
    } catch {
      setOrderSummary(null);
      toast.error("Không thể tải danh sách đơn hàng toàn hệ thống.");
    } finally {
      setIsLoading(false);
    }
  }, [adminOrderFilters, currentPage, isAdmin, isAllOrdersPage]);

  useEffect(() => {
    if (isLoadingAuth || !isAdmin) {
      return;
    }

    void fetchOrders();
  }, [fetchOrders, isAdmin, isLoadingAuth]);

  const pageShortageCount = useMemo(
    () => orders.filter(hasOrderShortage).length,
    [orders],
  );

  const pageUnpaidCount = useMemo(
    () => orders.filter((order) => order.paymentStatus !== "PAID").length,
    [orders],
  );

  const pageTotalValue = useMemo(
    () =>
      orders.reduce(
        (sum, order) => sum + Number(order.finalAmount ?? order.totalAmount ?? 0),
        0,
      ),
    [orders],
  );

  useEffect(() => {
    setSelectedItems((prev) =>
      prev.filter((id) => orders.some((order) => order.id === id)),
    );
  }, [orders]);

  useEffect(() => {
    if (!ordersPage) {
      return;
    }

    if (ordersPage.totalPages > 0 && currentPage >= ordersPage.totalPages) {
      setCurrentPage(ordersPage.totalPages - 1);
    }
  }, [currentPage, ordersPage]);

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
      toast.success(getReplenishmentResultMessage(orderCode, response));
      await fetchOrders();
    } catch {
      toast.error("Không thể xử lý yêu cầu bổ sung.");
    }
  };

  const handleAdvanceStatus = async (
    event: React.MouseEvent,
    order: MyOrder,
  ) => {
    event.stopPropagation();

    const action = getNextOrderWorkflowAction(order);
    if (!action) {
      return;
    }

    try {
      setAdvancingOrderId(order.id);
      await orderService.updateOrderStatus(order.id, action.nextStatus);
      toast.success(`Đơn hàng ${getOrderCode(order)} đã được cập nhật trạng thái.`);
      await fetchOrders();
    } catch {
      toast.error("Không thể cập nhật trạng thái đơn hàng.");
    } finally {
      setAdvancingOrderId(null);
    }
  };

  const toggleSelectAll = () => {
    setSelectedItems((prev) =>
      prev.length === orders.length
        ? []
        : orders.map((order) => order.id),
    );
  };

  const toggleSelectItem = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id],
    );
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatusFilter("ALL");
    setPaymentFilter("ALL");
    setStartDateFilter(defaultMonthRange.start);
    setEndDateFilter(defaultMonthRange.end);
  };

  const totalOrders =
    orderSummary?.totalOrders ?? ordersPage?.totalElements ?? 0;
  const shortageCount =
    orderSummary?.shortageOrders ?? pageShortageCount;
  const unpaidCount =
    orderSummary?.unpaidOrders ?? pageUnpaidCount;
  const totalFilteredValue =
    orderSummary?.totalValue ?? pageTotalValue;
  const totalPages = Math.max(ordersPage?.totalPages ?? 0, 1);
  const hasActiveFilters = Boolean(
    searchInput.trim() ||
      paymentFilter !== "ALL" ||
      startDateFilter !== defaultMonthRange.start ||
      endDateFilter !== defaultMonthRange.end ||
      (isAllOrdersPage && statusFilter !== "ALL"),
  );
  const summaryCards = useMemo(
    () => [
      {
        label: "Tổng đơn",
        value: totalOrders.toLocaleString("vi-VN"),
        note: "Số đơn khớp với bộ lọc hiện tại",
      },
      {
        label: "Thiếu hàng",
        value: shortageCount.toLocaleString("vi-VN"),
        note: "Đơn thiếu hàng khớp với bộ lọc hiện tại",
      },
      {
        label: "Chưa thanh toán",
        value: unpaidCount.toLocaleString("vi-VN"),
        note: "Đơn chưa thanh toán khớp với bộ lọc hiện tại",
      },
      {
        label: "Giá trị lọc",
        value: formatCurrency(totalFilteredValue),
        note: "Tổng giá trị đơn khớp với bộ lọc hiện tại",
      },
    ],
    [shortageCount, totalFilteredValue, totalOrders, unpaidCount],
  );
  const visibleFrom = totalOrders === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const visibleTo =
    totalOrders === 0 ? 0 : currentPage * PAGE_SIZE + orders.length;
  const hasPreviousPage = currentPage > 0;
  const hasNextPage = currentPage + 1 < totalPages;

  return (
    <div className="space-y-3 pb-[100px] text-slate-800">
      <div className="mt-2 space-y-1 px-1">
        <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
          {title}
        </h1>
        <p className="text-[13px] text-slate-500">
          Quản lý theo đơn hàng, giao hàng, thanh toán và tình trạng thiếu hàng
          trên cùng một màn hình.
        </p>
      </div>

      <div className="flex flex-col gap-2 xl:flex-row xl:flex-nowrap xl:items-center xl:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:min-w-0 xl:flex-nowrap">
          <div className="relative w-full sm:w-[300px] xl:w-[280px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
            />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm mã đơn, tên khách hàng, số điện thoại..."
              className="h-[38px] rounded-md border-slate-200 bg-white pl-10 text-[13px] shadow-none focus-visible:ring-blue-500/20"
            />
          </div>

          {isAllOrdersPage ? (
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger className="h-[38px] w-full rounded-md border-slate-200 bg-white text-[13px] font-medium text-slate-600 shadow-none focus:ring-0 sm:w-[170px] xl:w-[165px]">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUS_FILTER_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-[13px]"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <Select
            value={paymentFilter}
            onValueChange={(value) => setPaymentFilter(value as PaymentFilter)}
          >
            <SelectTrigger className="h-[38px] w-full rounded-md border-slate-200 bg-white text-[13px] font-medium text-slate-600 shadow-none focus:ring-0 sm:w-[170px] xl:w-[165px]">
              <SelectValue placeholder="Tất cả thanh toán" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-[13px]">
                Tất cả thanh toán
              </SelectItem>
              <SelectItem value="PAID" className="text-[13px]">
                Đã thanh toán
              </SelectItem>
              <SelectItem value="UNPAID" className="text-[13px]">
                Chưa thanh toán
              </SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="datetime-local"
            step={60}
            value={startDateFilter}
            onChange={(event) => setStartDateFilter(event.target.value)}
            className="h-[38px] w-full rounded-md border-slate-200 bg-white text-[13px] shadow-none focus-visible:ring-blue-500/20 sm:w-[200px] xl:w-[190px]"
          />

          <Input
            type="datetime-local"
            step={60}
            value={endDateFilter}
            onChange={(event) => setEndDateFilter(event.target.value)}
            className="h-[38px] w-full rounded-md border-slate-200 bg-white text-[13px] shadow-none focus-visible:ring-blue-500/20 sm:w-[200px] xl:w-[190px]"
          />
        </div>

        {hasActiveFilters ? (
          <div className="flex flex-wrap justify-end gap-2 xl:shrink-0">
            <Button
              type="button"
              variant="outline"
              className="h-[38px] rounded-[4px] border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-600 shadow-none hover:bg-slate-50"
              onClick={resetFilters}
            >
              Xóa bộ lọc
            </Button>
          </div>
        ) : null}
      </div>

      {isAllOrdersPage ? (
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-[4px] border border-[#dcdcdc] bg-white p-3 shadow-sm"
            >
              <p className="text-[11px] font-semibold text-slate-400">
                {card.label}
              </p>
              <p className="mt-1 truncate text-[18px] font-semibold leading-6 text-slate-900">
                {card.value}
              </p>
              <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500">
                {card.note}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[4px] border border-slate-200 bg-white shadow-sm">
        <div className="w-full overflow-x-auto">
          <Table className="min-w-max [&_th]:whitespace-nowrap">
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b border-slate-200">
                <TableHead className="w-[42px] pl-4">
                  <Settings size={14} className="text-slate-400" />
                </TableHead>
                <TableHead className="w-[42px]">
                  <Checkbox
                    className="border-slate-300 data-[state=checked]:bg-blue-600"
                    checked={
                      orders.length > 0 &&
                      selectedItems.length === orders.length
                    }
                    onCheckedChange={() => toggleSelectAll()}
                  />
                </TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">
                  Mã đơn
                </TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">
                  Khách hàng
                </TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">
                  Thời gian
                </TableHead>
                <TableHead className="text-right text-[12px] font-bold text-slate-800">
                  Tổng tiền
                </TableHead>
                <TableHead className="text-[12px] font-bold text-slate-800">
                  Chi nhánh
                </TableHead>
                <TableHead className="text-center text-[12px] font-bold text-slate-800">
                  Tình trạng
                </TableHead>
                <TableHead className="text-center text-[12px] font-bold text-slate-800">
                  Trạng thái
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
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={TABLE_COL_SPAN}
                    className="h-32 text-center text-slate-500"
                  >
                    Không có đơn hàng phù hợp với bộ lọc hiện tại.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const orderId = order.id;
                  const orderCode = getOrderCode(order);
                  const isExpanded = expandedId === orderId;
                  const detail = detailCache[orderId];
                  const isLoadingDetail = loadingDetailId === orderId;
                  const orderDetail = detail ?? order;
                  const nextAction =
                    hasPermission(P.ORDER_UPDATE)
                      ? getNextOrderWorkflowAction(orderDetail)
                      : null;
                  const allowReplenishment =
                    hasPermission(P.ORDER_UPDATE) &&
                    canRequestReplenishmentAction(orderDetail);

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
                          {getOrderBranchNames(order)[0] ?? getOrderBranchSummary(order)}
                        </TableCell>
                        <TableCell className="text-center">
                          <InventoryStatusBadge order={order} variant="monochrome" />
                        </TableCell>
                        <TableCell className="text-center">
                          <OrderWorkflowBadge
                            status={order.status}
                            variant="monochrome"
                          />
                        </TableCell>
                        <TableCell
                          className="text-center"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="flex flex-col items-center gap-2">
                            {nextAction ? (
                              <Button
                                size="sm"
                                className="h-8 w-[124px] justify-center bg-blue-600 text-[12px] hover:bg-blue-700"
                                disabled={advancingOrderId === orderId}
                                onClick={(event) => void handleAdvanceStatus(event, orderDetail)}
                              >
                                {nextAction.label}
                              </Button>
                            ) : allowReplenishment ? (
                              <Button
                                size="sm"
                                className="h-8 w-[124px] justify-center bg-rose-600 text-[12px] hover:bg-rose-700"
                                onClick={(event) =>
                                  void handleRequestReplenishment(
                                    event,
                                    orderId,
                                    orderCode,
                                  )
                                }
                              >
                                Xin điều chuyển
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
                                        {getOrderBranchNames(orderDetail)[0] ??
                                          getOrderBranchSummary(orderDetail)}
                                      </p>
                                    </div>
                                    <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                                      <p className="text-[11px] font-semibold text-slate-500">
                                        Tình trạng hàng
                                      </p>
                                      <div className="mt-2">
                                        <InventoryStatusBadge
                                          order={orderDetail}
                                          variant="monochrome"
                                        />
                                      </div>
                                    </div>
                                    <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                                      <p className="text-[11px] font-semibold text-slate-500">
                                        Trạng thái đơn
                                      </p>
                                      <div className="mt-2">
                                        <OrderWorkflowBadge
                                          status={order.status}
                                          variant="monochrome"
                                        />
                                      </div>
                                    </div>
                                    <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                                      <p className="text-[11px] font-semibold text-slate-500">
                                        Giao hàng
                                      </p>
                                      <div className="mt-2">
                                        <DeliveryStatusBadge
                                          status={order.status}
                                          variant="monochrome"
                                        />
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
                                              <div className="flex items-start gap-3.5">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[6px] border border-slate-200 bg-slate-50">
                                                  {item.image ? (
                                                    <img
                                                      src={item.image}
                                                      alt={item.productName}
                                                      className="h-full w-full object-cover"
                                                    />
                                                  ) : (
                                                    <Package
                                                      size={18}
                                                      className="text-slate-300"
                                                    />
                                                  )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                  <p
                                                    className="line-clamp-2 max-w-[320px] text-[13px] font-medium leading-5 text-slate-800 sm:max-w-[380px] xl:max-w-[440px]"
                                                    title={item.productName}
                                                  >
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
                                                <span className="rounded-full border border-blue-200 bg-white px-2 py-1 text-[11px] font-semibold text-blue-700">
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

        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-[13px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Hiển thị {visibleFrom}-{visibleTo} / {totalOrders} đơn hàng
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              type="button"
              variant="outline"
              className="border-slate-200"
              disabled={!hasPreviousPage || isLoading}
              onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Trước
            </Button>
            <div className="min-w-[92px] text-center font-medium text-slate-700">
              Trang {totalOrders === 0 ? 0 : currentPage + 1}/{totalPages}
            </div>
            <Button
              type="button"
              variant="outline"
              className="border-slate-200"
              disabled={!hasNextPage || isLoading}
              onClick={() => setCurrentPage((page) => page + 1)}
            >
              Sau
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
