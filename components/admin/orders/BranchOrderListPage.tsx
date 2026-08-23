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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { orderService } from "@/app/services/order.service";
import {
  type BranchOrder,
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
import { useOrderRealtimeSync } from "@/hooks/useOrderRealtimeSync";
import { ADMIN_ORDER_STATUS_PAGES } from "@/lib/admin-order-status-pages";
import { formatDate, getCurrentDayDateTimeRange } from "@/lib/dateUtils";
import { getOrderListPath } from "@/lib/order-routing";
import {
  readAdminOrdersRefreshSignal,
} from "@/lib/order-refresh";
import { P } from "@/lib/permissions";
import { resolveImageUrl } from "@/lib/resolveImageUrl";
import { cn } from "@/lib/utils";
import { OrderWorkflowBadge, PaymentStatusBadge } from "./OrderStateBadges";
import { OrderRealtimeStatusIndicator } from "./OrderRealtimeStatusIndicator";
import {
  ORDER_LIST_BADGE_CLASS,
  ORDER_LIST_EXPANDED_ROW_CLASS,
  ORDER_LIST_HEADER_CLASS,
  ORDER_LIST_NOTE_CLASS,
  ORDER_LIST_PRIMARY_ACTION_CLASS,
  ORDER_LIST_PRODUCT_CARD_CLASS,
  ORDER_LIST_ROW_ACTIVE_CLASS,
  ORDER_LIST_ROW_CLASS,
  ORDER_LIST_SECONDARY_ACTION_CLASS,
  ORDER_LIST_SHELL_CLASS,
} from "./orderListStyles";
import type { OrderQuickFilterGroup, OrderQuickFilterId } from "./orderQuickFilters";

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
  quickFilterGroups?: OrderQuickFilterGroup[];
  defaultQuickFilterId?: OrderQuickFilterId;
};

type FetchBranchOrdersOptions = {
  background?: boolean;
};

type BranchStatusFilter = "ALL" | "INCOMPLETE" | OrderStatus;

const TABLE_COL_SPAN = 8;
const BRANCH_PROCESSING_BASE_PATH = "/admin/orders-processing";
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
  if (order.orderStatus === "COMPLETED" || order.orderStatus === "RETURNED") {
    return false;
  }

  if (order.orderStatus === "CANCELLED" && order.paymentStatus === "REFUNDED") {
    return false;
  }

  return true;
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

function matchesIncompleteQuickFilter(
  order: BranchOrder,
  quickFilterId: OrderQuickFilterId | string | null | undefined,
) {
  if (!isIncompleteOrder(order)) {
    return false;
  }

  if (!quickFilterId || quickFilterId === "all") {
    return true;
  }

  if (quickFilterId === "shortage") {
    return hasShortage(order);
  }

  if (quickFilterId === "unpaid") {
    return order.paymentStatus !== "PAID";
  }

  if (quickFilterId === "cancelled") {
    return order.orderStatus === "CANCELLED" && order.paymentStatus !== "REFUNDED";
  }

  return true;
}

function InventoryBadge({ shortage }: { shortage: boolean }) {
  return (
    <span className={ORDER_LIST_BADGE_CLASS}>
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
  quickFilterGroups,
  defaultQuickFilterId,
}: BranchOrderListPageProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();
  const defaultDateRange = useMemo(() => getCurrentDayDateTimeRange(), []);
  const statusGroupItems = useMemo(() => statusGroups ?? [], [statusGroups]);
  const hasStatusGroups = statusGroupItems.length > 0;
  const quickFilterItems = useMemo(() => quickFilterGroups ?? [], [quickFilterGroups]);
  const hasQuickFilters = quickFilterItems.length > 0;
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
  const requestedQuickFilterId = useMemo(
    () => searchParams.get("quickFilter")?.trim().toLowerCase() ?? null,
    [searchParams],
  );
  const fallbackQuickFilterId = defaultQuickFilterId ?? quickFilterItems[0]?.id ?? "all";
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
  const activeQuickFilter = useMemo(
    () =>
      !hasQuickFilters
        ? null
        : quickFilterItems.find((group) => group.id === requestedQuickFilterId) ??
          quickFilterItems.find((group) => group.id === fallbackQuickFilterId) ??
          quickFilterItems[0] ??
          null,
    [fallbackQuickFilterId, hasQuickFilters, quickFilterItems, requestedQuickFilterId],
  );

  const selectedStatusSelection = hasStatusGroups
    ? activeGroup?.status ?? statusGroupItems[0]?.status ?? "ALL"
    : hasQuickFilters
      ? "ALL"
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
    if (!hasQuickFilters || !activeQuickFilter) {
      return;
    }

    if (requestedQuickFilterId === activeQuickFilter.id) {
      return;
    }

    router.replace(`${pathname}?quickFilter=${activeQuickFilter.id}`);
  }, [activeQuickFilter, hasQuickFilters, pathname, requestedQuickFilterId, router]);

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
        const shouldFetchAllOrders =
          hasStatusGroups || hasQuickFilters || selectedStatusSelection === "INCOMPLETE";
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
    [endDateFilter, hasQuickFilters, hasStatusGroups, search, selectedStatusSelection, startDateFilter],
  );

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  useOrderRealtimeSync({
    enabled: true,
    lastRefreshSignalRef,
    onBackgroundRefresh: () => fetchOrders({ background: true }),
  });

  const orders = useMemo(() => {
    if (hasStatusGroups) {
      return sourceOrders.filter((order) =>
        matchesSubOrderStatus(order, selectedStatusSelection),
      );
    }

    if (hasQuickFilters) {
      return sourceOrders.filter((order) =>
        matchesIncompleteQuickFilter(order, activeQuickFilter?.id),
      );
    }

    if (selectedStatusSelection === "INCOMPLETE") {
      return sourceOrders.filter(isIncompleteOrder);
    }

    return sourceOrders;
  }, [activeQuickFilter?.id, hasQuickFilters, hasStatusGroups, selectedStatusSelection, sourceOrders]);

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
  const quickFilterCounts = useMemo(() => {
    if (!hasQuickFilters) {
      return {};
    }

    return quickFilterItems.reduce<Record<string, number>>((counts, group) => {
      counts[group.id] = sourceOrders.filter((order) =>
        matchesIncompleteQuickFilter(order, group.id),
      ).length;
      return counts;
    }, {});
  }, [hasQuickFilters, quickFilterItems, sourceOrders]);

  const activeProcessingStatus = hasStatusGroups
    ? getPrimaryStatusSelection(selectedStatusSelection)
    : null;
  const tableColSpan = hasQuickFilters ? TABLE_COL_SPAN + 1 : TABLE_COL_SPAN;

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
    if (hasQuickFilters) {
      router.replace(`${pathname}?quickFilter=${fallbackQuickFilterId}`);
    }
  };

  const handleQuickFilterChange = (filterId: string) => {
    if (!hasQuickFilters) {
      return;
    }

    router.replace(`${pathname}?quickFilter=${filterId}`);
  };

  const hasActiveFilters = Boolean(
    searchInput.trim() ||
      startDateFilter !== defaultDateRange.start ||
      endDateFilter !== defaultDateRange.end ||
      (hasQuickFilters && activeQuickFilter?.id !== fallbackQuickFilterId),
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
  const quickFilterCards = useMemo(
    () =>
      quickFilterItems.map((group) => ({
        ...group,
        value: (quickFilterCounts[group.id] ?? 0).toLocaleString("vi-VN"),
        isActive: activeQuickFilter?.id === group.id,
      })),
    [activeQuickFilter?.id, quickFilterCounts, quickFilterItems],
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
            className={cn(ORDER_LIST_SECONDARY_ACTION_CLASS, "px-3")}
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
          className={cn(ORDER_LIST_PRIMARY_ACTION_CLASS, "px-3")}
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
          className={cn(ORDER_LIST_SECONDARY_ACTION_CLASS, "px-3")}
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
          className={cn(ORDER_LIST_PRIMARY_ACTION_CLASS, "px-3")}
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
            className={cn(ORDER_LIST_SECONDARY_ACTION_CLASS, "px-3")}
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
            className={cn(ORDER_LIST_PRIMARY_ACTION_CLASS, "px-3")}
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
          className={cn(ORDER_LIST_PRIMARY_ACTION_CLASS, "px-3")}
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
  const renderIncompleteActions = (
    order: BranchOrder,
    hasMissingItems: boolean,
    isMutatingOrder: boolean,
  ) => {
    if (!hasQuickFilters || !canUpdateBranchOrders) {
      return null;
    }

    const status = String(order.subOrderStatus).toUpperCase();

    if (status === "PENDING") {
      if (hasMissingItems) {
        return (
          <Button
            size="sm"
            disabled={isMutatingOrder}
            className={cn(ORDER_LIST_SECONDARY_ACTION_CLASS, "px-3")}
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
          className={cn(ORDER_LIST_PRIMARY_ACTION_CLASS, "px-3")}
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

    if (status === "AWAITING_REPLENISHMENT") {
      return (
        <Button
          size="sm"
          disabled={isMutatingOrder}
          className={cn(ORDER_LIST_SECONDARY_ACTION_CLASS, "px-3")}
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

    if (status === "CONFIRMED") {
      return (
        <Button
          size="sm"
          disabled={isMutatingOrder}
          className={cn(ORDER_LIST_PRIMARY_ACTION_CLASS, "px-3")}
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

    if (status === "PROCESSING") {
      return (
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className={cn(ORDER_LIST_SECONDARY_ACTION_CLASS, "px-3")}
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
            className={cn(ORDER_LIST_PRIMARY_ACTION_CLASS, "px-3")}
            onClick={(event) => {
              event.stopPropagation();
              void handleUpdateStatus(order, "READY_FOR_PICKUP");
            }}
          >
            <PackageCheck size={15} className="mr-1.5" />
            Chờ bàn giao
          </Button>
        </div>
      );
    }

    if (status === "READY_FOR_PICKUP") {
      return (
        <Button
          size="sm"
          className={cn(ORDER_LIST_PRIMARY_ACTION_CLASS, "px-3")}
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
      ) : hasQuickFilters ? (
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          {quickFilterCards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => handleQuickFilterChange(card.id)}
              className={cn(
                "rounded-[4px] border bg-white p-3 text-left shadow-sm transition-colors",
                card.isActive
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-[#dcdcdc] text-slate-700 hover:border-blue-300 hover:bg-slate-50",
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.02em] text-slate-400">
                {card.label}
              </p>
              <p className="mt-1 truncate text-[18px] font-semibold leading-6 text-slate-900">
                {card.value}
              </p>
              <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500">
                {card.description}
              </p>
            </button>
          ))}
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

          {!fixedStatusQuery && !hasStatusGroups && !hasQuickFilters ? (
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <OrderRealtimeStatusIndicator />
      </div>

      <div className={ORDER_LIST_SHELL_CLASS}>
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader className={ORDER_LIST_HEADER_CLASS}>
              <TableRow className="border-b border-blue-100">
                <TableHead className="w-[52px] pl-4" />
                <TableHead>Mã đơn hàng</TableHead>
                <TableHead>Ngày đặt</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thanh toán</TableHead>
                <TableHead className="text-right">Tiền hàng</TableHead>
                <TableHead className="text-right">Phí ship</TableHead>
                {hasQuickFilters ? (
                  <TableHead className="text-center">Thao tác</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={tableColSpan}
                    className="h-32 text-center text-slate-400"
                  >
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={tableColSpan}
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
                          ORDER_LIST_ROW_CLASS,
                          isExpanded && ORDER_LIST_ROW_ACTIVE_CLASS,
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
                          <OrderWorkflowBadge
                            status={order.subOrderStatus}
                            variant="order-list-monochrome"
                          />
                        </TableCell>
                        <TableCell>
                          <PaymentStatusBadge
                            status={order.paymentStatus}
                            variant="order-list-monochrome"
                          />
                        </TableCell>
                        <TableCell className="text-right text-[13px] font-semibold text-slate-800">
                          {formatCurrency(order.subtotal)}
                        </TableCell>
                        <TableCell className="text-right text-[13px] text-slate-600">
                          {formatCurrency(order.shippingFee)}
                        </TableCell>
                        {hasQuickFilters ? (
                          <TableCell className="text-center">
                            {renderIncompleteActions(detail, hasMissingItems, isMutatingOrder)}
                          </TableCell>
                        ) : null}
                      </TableRow>

                      {isExpanded ? (
                        <TableRow className={ORDER_LIST_EXPANDED_ROW_CLASS}>
                          <TableCell colSpan={tableColSpan} className="p-0">
                            <div className="grid gap-6 border-b border-blue-100 p-5 lg:grid-cols-[260px_minmax(0,1fr)]">
                              <div className="space-y-4 border-r border-blue-100 pr-0 lg:pr-6">
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
                                    <OrderWorkflowBadge
                                      status={detail.subOrderStatus}
                                      variant="order-list-monochrome"
                                    />
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-[12px] text-slate-500">
                                      Trạng thái đơn tổng
                                    </span>
                                    <OrderWorkflowBadge
                                      status={detail.orderStatus}
                                      variant="order-list-monochrome"
                                    />
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-[12px] text-slate-500">
                                      Thanh toán
                                    </span>
                                    <PaymentStatusBadge
                                      status={detail.paymentStatus}
                                      variant="order-list-monochrome"
                                    />
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
                                  <div className={ORDER_LIST_NOTE_CLASS}>
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
                                          className={ORDER_LIST_PRODUCT_CARD_CLASS}
                                        >
                                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-none border border-blue-100 bg-white">
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
