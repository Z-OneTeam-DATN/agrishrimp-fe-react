"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronsRight,
  Loader2,
  Package,
  PackageCheck,
  Printer,
  RefreshCw,
  Search,
  Truck,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { orderService } from "@/app/services/order.service";
import {
  type BranchOrder,
  type OrderPaymentStatus,
  type OrderStatus,
} from "@/app/types/order.types";
import { Button } from "@/components/ui/button";
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
import { ADMIN_ORDER_STATUS_PAGES } from "@/lib/admin-order-status-pages";
import { formatDate, getCurrentDayDateTimeRange } from "@/lib/dateUtils";
import { getOrderListPath } from "@/lib/order-routing";
import {
  readAdminOrdersRefreshSignal,
  subscribeToOrderRefresh,
} from "@/lib/order-refresh";
import { P } from "@/lib/permissions";
import { resolveImageUrl } from "@/lib/resolveImageUrl";
import { cn } from "@/lib/utils";
import { OrderWorkflowBadge, PaymentStatusBadge } from "./OrderStateBadges";

export type BranchOrderStatusGroup = {
  id: string;
  label: string;
  status: string;
  description?: string;
};

type BranchOrderListPageProps = {
  title: string;
  subtitle?: string;
  fixedStatusQuery?: string;
  statusGroups?: BranchOrderStatusGroup[];
  defaultStatusGroupId?: string;
  enableProcessingActions?: boolean;
};

type FetchBranchOrdersOptions = {
  background?: boolean;
};

type BranchStatusFilter = "ALL" | "INCOMPLETE" | OrderStatus;

const TABLE_COL_SPAN = 8;
const BRANCH_PROCESSING_BASE_PATH = "/admin/orders-processing";
const INCOMPLETE_PAYMENT_STATUSES = new Set<OrderPaymentStatus>([
  "UNPAID",
  "PENDING",
  "PENDING_VERIFICATION",
  "PARTIALLY_PAID",
  "FAILED",
  "EXPIRED",
]);

const ORDER_STATUS_FILTER_OPTIONS: Array<{
  label: string;
  value: BranchStatusFilter;
}> = [
  { label: "Tất cả trạng thái", value: "ALL" },
  ...ADMIN_ORDER_STATUS_PAGES.map((page) => ({
    label: page.label,
    value: page.status,
  })),
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount || 0);

function normalizeStatus(status?: string | null): BranchStatusFilter {
  const normalized = status?.trim().toUpperCase();

  if (!normalized) {
    return "ALL";
  }

  if (normalized === "INCOMPLETE") {
    return normalized;
  }

  return ORDER_STATUS_FILTER_OPTIONS.some((option) => option.value === normalized)
    ? (normalized as BranchStatusFilter)
    : "ALL";
}

function parseStatusSelection(status?: string | null) {
  return (status ?? "")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);
}

function getPrimaryStatusSelection(status?: string | null) {
  return parseStatusSelection(status)[0] ?? "PENDING";
}

function isIncompleteOrder(order: BranchOrder) {
  return (
    order.orderStatus === "AWAITING_PAYMENT" ||
    order.orderStatus === "CANCELLED" ||
    INCOMPLETE_PAYMENT_STATUSES.has(order.paymentStatus)
  );
}

function matchesSubOrderStatus(order: BranchOrder, statusSelection?: string | null) {
  const statuses = parseStatusSelection(statusSelection);

  if (statuses.length === 0 || statuses.includes("ALL")) {
    return true;
  }

  return statuses.includes(String(order.subOrderStatus).toUpperCase());
}

function hasShortage(order: Pick<BranchOrder, "items" | "subOrderStatus">) {
  return (
    order.subOrderStatus === "AWAITING_REPLENISHMENT" ||
    (order.items ?? []).some((item) => Number(item.missingQuantity ?? 0) > 0)
  );
}

function InventoryBadge({ shortage }: { shortage: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit whitespace-nowrap items-center rounded-[10px] border px-2.5 py-0.5 text-[11px] font-medium",
        shortage
          ? "border-rose-200 bg-rose-50 text-rose-600"
          : "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      {shortage ? "Thiếu hàng" : "Đủ hàng"}
    </span>
  );
}

function getEmptyStateLabel(status: BranchStatusFilter | string) {
  const normalized = status.trim().toUpperCase();

  if (normalized === "ALL") {
    return "phù hợp với bộ lọc hiện tại";
  }

  if (normalized === "INCOMPLETE") {
    return "chưa hoàn tất";
  }

  return (
    ORDER_STATUS_FILTER_OPTIONS.find((option) => option.value === normalized)?.label.toLowerCase() ??
    "phù hợp với bộ lọc hiện tại"
  );
}

export default function BranchOrderListPage({
  title,
  subtitle,
  fixedStatusQuery,
  statusGroups,
  defaultStatusGroupId,
  enableProcessingActions = false,
}: BranchOrderListPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();
  const defaultDateRange = useMemo(() => getCurrentDayDateTimeRange(), []);
  const statusGroupItems = useMemo(() => statusGroups ?? [], [statusGroups]);
  const hasStatusGroups = statusGroupItems.length > 0;
  const fixedStatus = useMemo(
    () => normalizeStatus(fixedStatusQuery),
    [fixedStatusQuery],
  );
  const requestedStatus = useMemo(
    () => normalizeStatus(searchParams.get("status")),
    [searchParams],
  );
  const requestedGroupStatus = useMemo(
    () => searchParams.get("status")?.trim().toUpperCase() ?? null,
    [searchParams],
  );
  const [activeGroupId, setActiveGroupId] = useState(
    () => defaultStatusGroupId ?? statusGroupItems[0]?.id ?? "",
  );
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [startDateFilter, setStartDateFilter] = useState(defaultDateRange.start);
  const [endDateFilter, setEndDateFilter] = useState(defaultDateRange.end);
  const [sourceOrders, setSourceOrders] = useState<BranchOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailCache, setDetailCache] = useState<Record<number, BranchOrder>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
  const [mutatingOrderId, setMutatingOrderId] = useState<number | null>(null);
  const lastRefreshSignalRef = useRef(0);

  const canUpdateBranchOrders = hasPermission(P.ORDER_UPDATE);

  const activeGroup = useMemo(
    () =>
      statusGroupItems.find((group) => group.id === activeGroupId) ??
      statusGroupItems[0] ??
      null,
    [activeGroupId, statusGroupItems],
  );

  const selectedStatusSelection = hasStatusGroups
    ? activeGroup?.status ?? statusGroupItems[0]?.status ?? "ALL"
    : fixedStatusQuery
      ? fixedStatus
      : requestedStatus;

  useEffect(() => {
    if (!hasStatusGroups) {
      return;
    }

    const matchedGroup =
      requestedGroupStatus
        ? statusGroupItems.find((group) =>
            parseStatusSelection(group.status).includes(requestedGroupStatus),
          )
        : null;

    setActiveGroupId(
      matchedGroup?.id ?? defaultStatusGroupId ?? statusGroupItems[0]?.id ?? "",
    );
  }, [defaultStatusGroupId, hasStatusGroups, requestedGroupStatus, statusGroupItems]);

  useEffect(() => {
    if (fixedStatusQuery || requestedStatus === "ALL" || hasStatusGroups) {
      return;
    }

    const targetPath = getOrderListPath({
      canViewSystemOrders: false,
      canUseBranchOrders: true,
      status: requestedStatus,
    });

    if (
      targetPath !== "/admin/orders" &&
      targetPath !== `/admin/orders?status=${requestedStatus}`
    ) {
      router.replace(targetPath);
    }
  }, [fixedStatusQuery, hasStatusGroups, requestedStatus, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const fetchOrders = useCallback(
    async ({ background = false }: FetchBranchOrdersOptions = {}) => {
      if (background) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
        setExpandedId(null);
        setDetailCache({});
      }

      try {
        const shouldFetchAllOrders = hasStatusGroups || selectedStatusSelection === "INCOMPLETE";
        const serverStatus =
          shouldFetchAllOrders || selectedStatusSelection === "ALL"
            ? undefined
            : selectedStatusSelection;

        const response = await orderService.getBranchOrders(
          serverStatus,
          search || undefined,
          startDateFilter || undefined,
          endDateFilter || undefined,
        );

        setSourceOrders(response);
        lastRefreshSignalRef.current = Math.max(
          lastRefreshSignalRef.current,
          readAdminOrdersRefreshSignal(),
        );
      } catch {
        toast.error("Không thể tải danh sách đơn hàng chi nhánh.");
      } finally {
        if (background) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [endDateFilter, hasStatusGroups, search, selectedStatusSelection, startDateFilter],
  );

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const refreshOrdersIfNeeded = useCallback(() => {
    const nextSignal = readAdminOrdersRefreshSignal();
    if (nextSignal <= lastRefreshSignalRef.current) {
      return;
    }

    lastRefreshSignalRef.current = nextSignal;
    void fetchOrders({ background: true });
  }, [fetchOrders]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshOrdersIfNeeded();
      }
    };

    const unsubscribe = subscribeToOrderRefresh(() => {
      refreshOrdersIfNeeded();
    });

    window.addEventListener("focus", refreshOrdersIfNeeded);
    window.addEventListener("pageshow", refreshOrdersIfNeeded);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      unsubscribe();
      window.removeEventListener("focus", refreshOrdersIfNeeded);
      window.removeEventListener("pageshow", refreshOrdersIfNeeded);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshOrdersIfNeeded]);

  const orders = useMemo(() => {
    if (hasStatusGroups) {
      return sourceOrders.filter((order) =>
        matchesSubOrderStatus(order, selectedStatusSelection),
      );
    }

    if (selectedStatusSelection === "INCOMPLETE") {
      return sourceOrders.filter(isIncompleteOrder);
    }

    return sourceOrders;
  }, [hasStatusGroups, selectedStatusSelection, sourceOrders]);

  const groupCounts = useMemo(() => {
    if (!hasStatusGroups) {
      return {};
    }

    return statusGroupItems.reduce<Record<string, number>>((counts, group) => {
      counts[group.id] = sourceOrders.filter((order) =>
        matchesSubOrderStatus(order, group.status),
      ).length;
      return counts;
    }, {});
  }, [hasStatusGroups, sourceOrders, statusGroupItems]);

  const activeProcessingStatus = hasStatusGroups
    ? getPrimaryStatusSelection(selectedStatusSelection)
    : null;

  const handleStatusChange = (value: string) => {
    const nextStatus = value as BranchStatusFilter;
    const targetPath =
      nextStatus === "ALL"
        ? "/admin/orders"
        : getOrderListPath({
            canViewSystemOrders: false,
            canUseBranchOrders: true,
            status: nextStatus,
          });
    router.replace(targetPath);
  };

  const handleGroupChange = (group: BranchOrderStatusGroup) => {
    setActiveGroupId(group.id);
    router.replace(
      `${BRANCH_PROCESSING_BASE_PATH}?${new URLSearchParams({
        status: getPrimaryStatusSelection(group.status),
      }).toString()}`,
    );
  };

  const handleToggleRow = async (order: BranchOrder) => {
    if (expandedId === order.orderId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(order.orderId);

    if (detailCache[order.orderId]) {
      return;
    }

    setLoadingDetailId(order.orderId);
    try {
      const detail = await orderService.getBranchOrderById(order.orderId);
      setDetailCache((prev) => ({ ...prev, [order.orderId]: detail }));
    } catch {
      toast.error("Không thể tải chi tiết đơn hàng.");
    } finally {
      setLoadingDetailId(null);
    }
  };

  const handleUpdateStatus = async (order: BranchOrder, nextStatus: string) => {
    try {
      setMutatingOrderId(order.orderId);
      await orderService.updateBranchOrderStatus(order.orderId, nextStatus);
      toast.success(`Đơn hàng ${order.orderCode} đã được cập nhật.`);
      setExpandedId((prev) => (prev === order.orderId ? null : prev));
      void fetchOrders({ background: true });
    } catch {
      toast.error("Không thể cập nhật trạng thái đơn hàng.");
    } finally {
      setMutatingOrderId(null);
    }
  };

  const handleRequestReplenishment = async (order: BranchOrder) => {
    try {
      setMutatingOrderId(order.orderId);
      const response = await orderService.requestBranchOrderReplenishment(order.orderId);
      const transferSummary = response.transferCodes?.length
        ? ` (${response.transferCodes.join(", ")})`
        : "";
      toast.success(`Đã tạo lệnh điều chuyển cho ${order.orderCode}${transferSummary}`);
      void fetchOrders({ background: true });
    } catch {
      toast.error("Không thể xử lý thiếu hàng.");
    } finally {
      setMutatingOrderId(null);
    }
  };

  const openHandoverCreate = (subOrderId: number) => {
    router.push(`/admin/orders-handover/create?subOrderIds=${subOrderId}`);
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setStartDateFilter(defaultDateRange.start);
    setEndDateFilter(defaultDateRange.end);
  };

  const hasActiveFilters = Boolean(
    searchInput.trim() ||
      startDateFilter !== defaultDateRange.start ||
      endDateFilter !== defaultDateRange.end,
  );
  const shortageCount = useMemo(
    () => orders.filter(hasShortage).length,
    [orders],
  );
  const unpaidCount = useMemo(
    () => orders.filter((order) => order.paymentStatus !== "PAID").length,
    [orders],
  );
  const totalFilteredValue = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.subtotal || 0), 0),
    [orders],
  );
  const summaryCards = useMemo(
    () => [
      {
        label: "Tổng đơn",
        value: orders.length.toLocaleString("vi-VN"),
        note: "Số đơn thuộc chi nhánh khớp bộ lọc hiện tại",
      },
      {
        label: "Thiếu hàng",
        value: shortageCount.toLocaleString("vi-VN"),
        note: "Đơn đang thiếu hàng hoặc chờ bổ sung",
      },
      {
        label: "Chưa thanh toán",
        value: unpaidCount.toLocaleString("vi-VN"),
        note: "Đơn chưa hoàn tất thanh toán",
      },
      {
        label: "Giá trị lọc",
        value: formatCurrency(totalFilteredValue),
        note: "Tổng tiền hàng của tập đơn đang hiển thị",
      },
    ],
    [orders.length, shortageCount, totalFilteredValue, unpaidCount],
  );

  const renderProcessingActions = (
    order: BranchOrder,
    hasMissingItems: boolean,
    isMutatingOrder: boolean,
  ) => {
    if (!enableProcessingActions || !canUpdateBranchOrders || !activeProcessingStatus) {
      return null;
    }

    if (activeProcessingStatus === "PENDING") {
      if (hasMissingItems) {
        return (
          <Button
            size="sm"
            disabled={isMutatingOrder}
            className="h-[32px] bg-rose-600 text-[12px] font-bold text-white shadow-sm hover:bg-rose-700"
            onClick={(event) => {
              event.stopPropagation();
              void handleRequestReplenishment(order);
            }}
          >
            <PackageCheck size={15} className="mr-1.5" />
            Xử lý thiếu hàng
          </Button>
        );
      }

      return (
        <Button
          size="sm"
          disabled={isMutatingOrder}
          className="h-[32px] bg-emerald-600 text-[12px] font-bold text-white shadow-sm hover:bg-emerald-700"
          onClick={(event) => {
            event.stopPropagation();
            void handleUpdateStatus(order, "CONFIRMED");
          }}
        >
          <CheckCircle2 size={15} className="mr-1.5" />
          Xác nhận đơn
        </Button>
      );
    }

    if (activeProcessingStatus === "AWAITING_REPLENISHMENT") {
      return (
        <Button
          size="sm"
          disabled={isMutatingOrder}
          className="h-[32px] bg-rose-600 text-[12px] font-bold text-white shadow-sm hover:bg-rose-700"
          onClick={(event) => {
            event.stopPropagation();
            void handleRequestReplenishment(order);
          }}
        >
          <PackageCheck size={15} className="mr-1.5" />
          Xử lý thiếu hàng
        </Button>
      );
    }

    if (activeProcessingStatus === "CONFIRMED") {
      return (
        <Button
          size="sm"
          disabled={isMutatingOrder}
          className="h-[32px] bg-blue-600 text-[12px] font-bold text-white shadow-sm hover:bg-blue-700"
          onClick={(event) => {
            event.stopPropagation();
            void handleUpdateStatus(order, "PROCESSING");
          }}
        >
          <Printer size={15} className="mr-1.5" />
          Bắt đầu chuẩn bị
        </Button>
      );
    }

    if (activeProcessingStatus === "PROCESSING") {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-[32px] border-slate-300 bg-white text-[12px] font-bold"
            onClick={(event) => {
              event.stopPropagation();
              window.print();
            }}
          >
            <Printer size={15} className="mr-1.5" />
            In vận đơn
          </Button>
          <Button
            size="sm"
            disabled={isMutatingOrder}
            className="h-[32px] bg-emerald-600 text-[12px] font-bold text-white shadow-sm hover:bg-emerald-700"
            onClick={(event) => {
              event.stopPropagation();
              void handleUpdateStatus(order, "READY_FOR_PICKUP");
            }}
          >
            <PackageCheck size={15} className="mr-1.5" />
            Chuyển chờ bàn giao
          </Button>
        </div>
      );
    }

    if (activeProcessingStatus === "READY_FOR_PICKUP") {
      return (
        <Button
          size="sm"
          className="h-[32px] bg-blue-600 text-[12px] font-bold text-white shadow-sm hover:bg-blue-700"
          onClick={(event) => {
            event.stopPropagation();
            openHandoverCreate(order.subOrderId);
          }}
        >
          <Truck size={15} className="mr-1.5" />
          Tạo phiếu bàn giao
        </Button>
      );
    }

    return null;
  };

  return (
    <div className="space-y-3 pb-[100px] text-slate-800">
      <div className="mt-2 space-y-1 px-1">
        <h1 className="text-[20px] font-semibold uppercase tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="text-[13px] text-slate-500">
          {subtitle ?? "Theo dõi đơn hàng của chi nhánh được gán trên cùng một màn hình quản lý."}
        </p>
      </div>

      {hasStatusGroups ? (
        <div className="grid grid-cols-1 overflow-hidden rounded-[4px] border border-slate-200 bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-7">
          {statusGroupItems.map((group) => {
            const isActiveGroup = activeGroup?.id === group.id;

            return (
              <button
                key={group.id}
                type="button"
                onClick={() => handleGroupChange(group)}
                className={cn(
                  "flex min-h-[74px] flex-col items-start justify-center border-b border-r border-slate-200 px-4 py-3 text-left transition-colors last:border-r-0 sm:last:border-r-0 xl:border-b-0 xl:last:border-r-0",
                  isActiveGroup
                    ? "bg-blue-50 text-blue-700"
                    : "bg-white text-slate-600 hover:bg-slate-50",
                )}
              >
                <span className="text-[12px] font-semibold">{group.label}</span>
                <span className="mt-1 text-[20px] font-semibold leading-none text-slate-900">
                  {(groupCounts[group.id] ?? 0).toLocaleString("vi-VN")}
                </span>
                {group.description ? (
                  <span className="mt-1 line-clamp-1 text-[10px] text-slate-400">
                    {group.description}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-[4px] border border-[#dcdcdc] bg-white p-3 shadow-sm"
            >
              <p className="text-[11px] font-semibold text-slate-400">{card.label}</p>
              <p className="mt-1 truncate text-[18px] font-semibold leading-6 text-slate-900">
                {card.value}
              </p>
              <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500">
                {card.note}
              </p>
            </div>
          ))}
        </div>
      )}

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
              placeholder="Tìm mã đơn hoặc tên khách hàng..."
              className="h-[38px] rounded-md border-slate-200 bg-white pl-10 text-[13px] shadow-none focus-visible:ring-blue-500/20"
            />
          </div>

          {!fixedStatusQuery && !hasStatusGroups ? (
            <Select value={selectedStatusSelection} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-[38px] w-full rounded-md border-slate-200 bg-white text-[13px] font-medium text-slate-600 shadow-none focus:ring-0 sm:w-[190px] xl:w-[190px]">
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

          <Input
            type="datetime-local"
            step={60}
            value={startDateFilter}
            onChange={(event) => setStartDateFilter(event.target.value)}
            className="h-[38px] w-full min-w-[218px] rounded-md border-slate-200 bg-white pr-2 text-[13px] shadow-none focus-visible:ring-blue-500/20 sm:w-[218px] xl:w-[218px] [&::-webkit-calendar-picker-indicator]:ml-2 [&::-webkit-calendar-picker-indicator]:mr-1 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          />

          <Input
            type="datetime-local"
            step={60}
            value={endDateFilter}
            onChange={(event) => setEndDateFilter(event.target.value)}
            className="h-[38px] w-full min-w-[218px] rounded-md border-slate-200 bg-white pr-2 text-[13px] shadow-none focus-visible:ring-blue-500/20 sm:w-[218px] xl:w-[218px] [&::-webkit-calendar-picker-indicator]:ml-2 [&::-webkit-calendar-picker-indicator]:mr-1 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2 xl:shrink-0">
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              className="h-[38px] rounded-[4px] border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-600 shadow-none hover:bg-slate-50"
              onClick={resetFilters}
            >
              Xóa bộ lọc
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            disabled={isRefreshing}
            hidden
            className="hidden h-[38px] rounded-[4px] border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-600 shadow-none hover:bg-slate-50"
            onClick={() => void fetchOrders({ background: true })}
          >
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Làm mới
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[4px] border border-slate-200 bg-white shadow-sm">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b border-slate-100">
                <TableHead className="w-[52px] pl-4" />
                <TableHead>Mã đơn hàng</TableHead>
                <TableHead>Ngày đặt</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thanh toán</TableHead>
                <TableHead className="text-right">Tiền hàng</TableHead>
                <TableHead className="text-right">Phí ship</TableHead>
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
                    className="h-36 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Package size={40} className="mb-2 opacity-20" />
                      <p className="text-[14px]">
                        Không có đơn hàng {getEmptyStateLabel(selectedStatusSelection)}.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const isExpanded = expandedId === order.orderId;
                  const detail = detailCache[order.orderId] ?? order;
                  const detailItems = detail.items ?? order.items;
                  const shortage = hasShortage(detail);
                  const hasMissingItems = detailItems.some(
                    (item) => Number(item.missingQuantity ?? 0) > 0,
                  );
                  const isLoadingDetail = loadingDetailId === order.orderId;
                  const isMutatingOrder = mutatingOrderId === order.orderId;

                  return (
                    <React.Fragment key={order.orderId}>
                      <TableRow
                        className={cn(
                          "cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50",
                          isExpanded && "bg-blue-50/30",
                        )}
                        onClick={() => void handleToggleRow(order)}
                      >
                        <TableCell className="pl-4 text-center text-slate-400">
                          {isExpanded ? (
                            <ChevronDown size={14} className="text-blue-600" />
                          ) : (
                            <ChevronsRight size={14} />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-semibold text-blue-700">
                              {order.orderCode}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Sub-order #{order.subOrderId}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-[13px] text-slate-700">
                          {formatDate(order.createdAt, "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-medium text-slate-800">
                              {order.customerName}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {order.customerPhone}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <OrderWorkflowBadge status={order.subOrderStatus} />
                        </TableCell>
                        <TableCell>
                          <PaymentStatusBadge status={order.paymentStatus} />
                        </TableCell>
                        <TableCell className="text-right text-[13px] font-semibold text-slate-800">
                          {formatCurrency(order.subtotal)}
                        </TableCell>
                        <TableCell className="text-right text-[13px] text-slate-600">
                          {formatCurrency(order.shippingFee)}
                        </TableCell>
                      </TableRow>

                      {isExpanded ? (
                        <TableRow className="bg-white hover:bg-white">
                          <TableCell colSpan={TABLE_COL_SPAN} className="p-0">
                            <div className="grid gap-6 border-b border-slate-100 p-5 lg:grid-cols-[260px_minmax(0,1fr)]">
                              <div className="space-y-4 border-r border-slate-100 pr-0 lg:pr-6">
                                <div>
                                  <h3 className="mb-1 text-[11px] font-bold uppercase text-slate-400">
                                    Địa chỉ giao hàng
                                  </h3>
                                  <p className="text-[13px] font-medium leading-relaxed text-slate-700">
                                    {detail.shippingAddress}
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-[12px] text-slate-500">
                                      Trạng thái chi nhánh
                                    </span>
                                    <OrderWorkflowBadge status={detail.subOrderStatus} />
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-[12px] text-slate-500">
                                      Trạng thái đơn tổng
                                    </span>
                                    <OrderWorkflowBadge status={detail.orderStatus} />
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-[12px] text-slate-500">
                                      Thanh toán
                                    </span>
                                    <PaymentStatusBadge status={detail.paymentStatus} />
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-[12px] text-slate-500">
                                      Tồn kho
                                    </span>
                                    <InventoryBadge shortage={shortage} />
                                  </div>
                                </div>

                                <div className="space-y-2 text-[12px] text-slate-600">
                                  <div className="flex items-center justify-between gap-3">
                                    <span>Phương thức thanh toán</span>
                                    <span className="font-medium text-slate-800">
                                      {detail.paymentMethod}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <span>Đơn vị vận chuyển</span>
                                    <span className="text-right font-medium text-slate-800">
                                      {detail.carrier || "Chưa cập nhật"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <span>Dự kiến giao</span>
                                    <span className="text-right font-medium text-slate-800">
                                      {detail.estimatedDays
                                        ? formatDate(detail.estimatedDays, "dd/MM/yyyy")
                                        : "Chưa có"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                  <h3 className="text-[12px] font-bold uppercase tracking-tight text-slate-800">
                                    Sản phẩm ({detailItems.length})
                                  </h3>
                                  {renderProcessingActions(order, hasMissingItems, isMutatingOrder)}
                                </div>

                                {enableProcessingActions && hasMissingItems ? (
                                  <div className="rounded-[4px] border border-amber-200 bg-amber-50 px-3.5 py-3 text-[12px] text-amber-800">
                                    Đơn này đang có phần hàng thiếu. Hệ thống sẽ điều chuyển hoặc gom nội bộ
                                    trước khi chuyển sang bước bàn giao vận chuyển.
                                  </div>
                                ) : null}

                                {isLoadingDetail ? (
                                  <div className="flex min-h-[120px] items-center justify-center text-[12px] text-slate-500">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang tải chi tiết...
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {detailItems.map((item) => {
                                      const itemImage = resolveImageUrl(item.image);
                                      const missingQuantity = Number(item.missingQuantity ?? 0);

                                      return (
                                        <div
                                          key={item.id}
                                          className="flex items-start gap-3 rounded-[4px] border border-slate-100 bg-slate-50 p-3"
                                        >
                                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded border border-slate-200 bg-white">
                                            {itemImage ? (
                                              <img
                                                src={itemImage}
                                                alt={item.productName}
                                                className="h-full w-full object-cover"
                                              />
                                            ) : (
                                              <div className="flex h-full w-full items-center justify-center text-slate-300">
                                                <Package size={18} />
                                              </div>
                                            )}
                                          </div>
                                          <div className="min-w-0 flex-1 space-y-1">
                                            <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
                                              <div className="min-w-0">
                                                <p className="truncate text-[13px] font-semibold text-slate-800">
                                                  {item.productName}
                                                </p>
                                                <p className="text-[11px] text-slate-500">
                                                  SKU: {item.sku}
                                                </p>
                                              </div>
                                              <p className="text-[12px] font-semibold text-slate-800">
                                                {formatCurrency(item.totalPrice)}
                                              </p>
                                            </div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-600">
                                              <span>Số lượng: {item.quantity}</span>
                                              <span>Đơn giá: {formatCurrency(item.price)}</span>
                                              {missingQuantity > 0 ? (
                                                <span className="font-medium text-rose-600">
                                                  Thiếu {missingQuantity}
                                                </span>
                                              ) : (
                                                <span className="font-medium text-emerald-700">
                                                  Đủ hàng
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
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
