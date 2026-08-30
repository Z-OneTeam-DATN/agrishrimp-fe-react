"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsRight,
  Loader2,
  Package,
  Search,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import {
  getReplenishmentDocumentLinks,
  getReplenishmentResultMessage,
  orderService,
  type AdminOrderSummaryResponse,
  type PageResponse,
} from "@/app/services/order.service";
import { MyOrder, OrderStatus } from "@/app/types/order.types";
import { getFriendlyError } from "@/app/utils/apiError";
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
import { useOrderRealtimeSync } from "@/hooks/useOrderRealtimeSync";
import { ADMIN_ORDER_STATUS_PAGES } from "@/lib/admin-order-status-pages";
import { formatDate, getCurrentDayDateTimeRange } from "@/lib/dateUtils";
import { canUseBranchOrderRoutes, resolveOrderRouteAccess } from "@/lib/order-routing";
import {
  readAdminOrdersRefreshSignal,
} from "@/lib/order-refresh";
import { P } from "@/lib/permissions";
import { resolveImageUrl } from "@/lib/resolveImageUrl";
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
  PaymentStatusBadge,
  canRequestReplenishmentAction,
  OrderWorkflowBadge,
} from "./OrderStateBadges";
import { mapBranchOrderToMyOrder } from "./branchOrderViewModel";
import {
  ORDER_LIST_EXPANDED_ROW_CLASS,
  ORDER_LIST_HEADER_CLASS,
  ORDER_LIST_IMAGE_FRAME_CLASS,
  ORDER_LIST_NOTE_CLASS,
  ORDER_LIST_PANEL_CLASS,
  ORDER_LIST_PANEL_MUTED_CLASS,
  ORDER_LIST_PRIMARY_ACTION_CLASS,
  ORDER_LIST_ROW_CLASS,
  ORDER_LIST_ROW_ACTIVE_CLASS,
  ORDER_LIST_ROW_BATCH_MATCH_CLASS,
  ORDER_LIST_ROW_SELECTED_CLASS,
  ORDER_LIST_SECONDARY_ACTION_CLASS,
  ORDER_LIST_SHELL_CLASS,
  ORDER_LIST_SUBTABLE_CLASS,
} from "./orderListStyles";
import type { OrderQuickFilterGroup, OrderQuickFilterId } from "./orderQuickFilters";
import { ReplenishmentDocumentLinks } from "./ReplenishmentDocumentLinks";

export type AdminOrderStatusGroup = {
  id: string;
  label: string;
  status: string;
  description?: string;
};

type AdminOrderListPageProps = {
  title: string;
  fixedStatus?: OrderStatus;
  fixedStatusQuery?: string;
  statusGroups?: AdminOrderStatusGroup[];
  defaultStatusGroupId?: string;
  subtitle?: string;
  layoutVariant?: "default" | "incomplete";
  quickFilterGroups?: OrderQuickFilterGroup[];
  defaultQuickFilterId?: OrderQuickFilterId;
};

type PaymentFilter = "ALL" | "PAID" | "UNPAID";
type StatusFilter = "ALL" | OrderStatus;
type FetchOrdersOptions = {
  background?: boolean;
};

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

const ORDER_SELECTION_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Chờ thanh toán",
  PENDING_AUTO_APPROVAL: "Chờ tự xác nhận",
  PENDING_SHORTAGE_REVIEW: "Chờ xử lý thiếu hàng",
  PENDING_TRANSFER: "Chờ điều chuyển",
  AWAITING_REPLENISHMENT: "Đơn thiếu hàng",
  RETURNED: "Trả hàng",
};

const getOrderSelectionStatusKey = (
  order: Pick<MyOrder, "status" | "legacyStatus">,
) =>
  String(order.status ?? order.legacyStatus ?? "")
    .trim()
    .toUpperCase();

const getOrderSelectionStatusLabel = (statusKey: string) =>
  ORDER_SELECTION_STATUS_LABELS[statusKey] ??
  ORDER_STATUS_FILTER_OPTIONS.find((option) => option.value === statusKey)?.label ??
  statusKey;

const parseStatusSelection = (status?: string | null) =>
  (status ?? "")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);

const matchesStatusSelection = (
  order: Pick<MyOrder, "status" | "legacyStatus">,
  statusSelection?: string | null,
) => {
  const statuses = parseStatusSelection(statusSelection);

  if (statuses.length === 0 || statuses.includes("ALL")) {
    return true;
  }

  const orderStatuses = [
    String(order.status ?? "").toUpperCase(),
    String(order.legacyStatus ?? "").toUpperCase(),
  ].filter(Boolean);

  return statuses.some((status) => orderStatuses.includes(status));
};

const isIncompleteOrder = (
  order: Pick<MyOrder, "status" | "paymentStatus">,
) => {
  if (order.status === "COMPLETED" || order.status === "RETURNED") {
    return false;
  }

  if (order.status === "CANCELLED" && order.paymentStatus === "REFUNDED") {
    return false;
  }

  return true;
};

const matchesIncompleteQuickFilter = (
  order: Pick<MyOrder, "status" | "paymentStatus" | "items" | "subOrders">,
  quickFilterId: OrderQuickFilterId | string | null | undefined,
) => {
  if (!isIncompleteOrder(order)) {
    return false;
  }

  if (!quickFilterId || quickFilterId === "all") {
    return true;
  }

  if (quickFilterId === "shortage") {
    return hasOrderShortage(order);
  }

  if (quickFilterId === "unpaid") {
    return order.paymentStatus !== "PAID";
  }

  if (quickFilterId === "cancelled") {
    return order.status === "CANCELLED" && order.paymentStatus !== "REFUNDED";
  }

  return true;
};

const matchesBranchScopedSearch = (
  order: Pick<
    MyOrder,
    "code" | "orderCode" | "customerName" | "customerPhone" | "receiverName" | "receiverPhone"
  >,
  search: string,
) => {
  const keyword = search.trim().toLowerCase();

  if (!keyword) {
    return true;
  }

  return [
    order.orderCode,
    order.code,
    order.customerName,
    order.customerPhone,
    order.receiverName,
    order.receiverPhone,
  ]
    .map((value) => value?.toString().trim().toLowerCase())
    .some((value) => Boolean(value?.includes(keyword)));
};

const buildLocalOrderSummary = (
  orders: MyOrder[],
): AdminOrderSummaryResponse => ({
  totalOrders: orders.length,
  shortageOrders: orders.filter(hasOrderShortage).length,
  unpaidOrders: orders.filter((order) => order.paymentStatus !== "PAID").length,
  totalValue: orders.reduce(
    (sum, order) => sum + Number(order.finalAmount ?? order.totalAmount ?? 0),
    0,
  ),
});

export default function AdminOrderListPage({
  title,
  fixedStatus,
  fixedStatusQuery,
  statusGroups,
  defaultStatusGroupId,
  subtitle,
  layoutVariant = "default",
  quickFilterGroups,
  defaultQuickFilterId,
}: AdminOrderListPageProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission, isLoadingAuth } = usePermissions();
  const { user, warehouseId } = useAuthStore();
  const defaultDateRange = useMemo(() => getCurrentDayDateTimeRange(), []);
  const statusGroupItems = useMemo(() => statusGroups ?? [], [statusGroups]);
  const quickFilterItems = useMemo(() => quickFilterGroups ?? [], [quickFilterGroups]);
  const hasQuickFilters = quickFilterItems.length > 0;
  const [activeGroupId, setActiveGroupId] = useState(
    () => defaultStatusGroupId ?? statusGroups?.[0]?.id ?? "",
  );

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("ALL");
  const [startDateFilter, setStartDateFilter] = useState(defaultDateRange.start);
  const [endDateFilter, setEndDateFilter] = useState(defaultDateRange.end);
  const [currentPage, setCurrentPage] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [ordersPage, setOrdersPage] = useState<PageResponse<MyOrder> | null>(null);
  const [orderSummary, setOrderSummary] =
    useState<AdminOrderSummaryResponse | null>(null);
  const [groupCounts, setGroupCounts] = useState<Record<string, number>>({});
  const [quickFilterCounts, setQuickFilterCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [detailCache, setDetailCache] = useState<Record<number, MyOrder>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [advancingOrderIds, setAdvancingOrderIds] = useState<number[]>([]);
  const [replenishingOrderIds, setReplenishingOrderIds] = useState<number[]>([]);
  const setAdvancingOrderId = useCallback((orderId: number | null) => {
    setAdvancingOrderIds(orderId === null ? [] : [orderId]);
  }, []);
  const lastRefreshSignalRef = useRef(0);

  const canViewSystemOrders = hasPermission(P.ORDER_VIEW_ALL_BRANCHES);
  const canUseBranchOrders = canUseBranchOrderRoutes(user, warehouseId);
  const isBranchScopedView = !canViewSystemOrders && canUseBranchOrders;
  const orderRouteAccess = useMemo(
    () =>
      resolveOrderRouteAccess({
        canViewSystemOrders,
        canUseBranchOrders,
        status: fixedStatus,
      }),
    [canUseBranchOrders, canViewSystemOrders, fixedStatus],
  );
  const activeStatusGroup = useMemo(
    () =>
      statusGroupItems.find((group) => group.id === activeGroupId) ??
      statusGroupItems[0] ??
      null,
    [activeGroupId, statusGroupItems],
  );
  const requestedQuickFilterId = useMemo(
    () => searchParams.get("quickFilter")?.trim().toLowerCase() ?? null,
    [searchParams],
  );
  const fallbackQuickFilterId = defaultQuickFilterId ?? quickFilterItems[0]?.id ?? "all";
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
  const selectedFixedStatus =
    activeStatusGroup?.status ??
    activeQuickFilter?.statusQuery ??
    fixedStatusQuery ??
    fixedStatus;
  const isIncompleteLayout = layoutVariant === "incomplete";
  const useCompactIncompleteTable = isIncompleteLayout && !hasQuickFilters;
  const isAllOrdersPage = !selectedFixedStatus && !hasQuickFilters;
  const shouldShowSummaryCards = isAllOrdersPage || useCompactIncompleteTable;
  const searchPlaceholder = hasQuickFilters || useCompactIncompleteTable
    ? "Tìm mã đơn hoặc tên khách hàng..."
    : "Tìm mã đơn, tên khách hàng, số điện thoại...";
  const tableColSpan = useCompactIncompleteTable ? 8 : TABLE_COL_SPAN;

  useEffect(() => {
    if (statusGroupItems.length === 0) {
      return;
    }

    if (!statusGroupItems.some((group) => group.id === activeGroupId)) {
      setActiveGroupId(defaultStatusGroupId ?? statusGroupItems[0].id);
    }
  }, [activeGroupId, defaultStatusGroupId, statusGroupItems]);

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
    if (isLoadingAuth) {
      return;
    }

    if (isBranchScopedView) {
      return;
    }

    if (!canViewSystemOrders) {
      router.replace(orderRouteAccess.orderListPath);
      return;
    }

    if (!orderRouteAccess.canAccessOrderModule) {
      router.push("/admin/forbidden");
    }
  }, [
    isBranchScopedView,
    canViewSystemOrders,
    isLoadingAuth,
    orderRouteAccess.canAccessOrderModule,
    orderRouteAccess.orderListPath,
    router,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(0);
  }, [
    selectedFixedStatus,
    search,
    statusFilter,
    paymentFilter,
    startDateFilter,
    endDateFilter,
  ]);

  const baseAdminOrderFilters = useMemo(
    () => ({
      search: search || undefined,
      paymentStatus: paymentFilter === "ALL" ? undefined : paymentFilter,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined,
    }),
    [
      endDateFilter,
      paymentFilter,
      search,
      startDateFilter,
    ],
  );

  const adminOrderFilters = useMemo(
    () => ({
      ...baseAdminOrderFilters,
      status:
        selectedFixedStatus ??
        (statusFilter === "ALL" ? undefined : statusFilter),
    }),
    [
      baseAdminOrderFilters,
      selectedFixedStatus,
      statusFilter,
    ],
  );
  const activeStatusFilter = hasQuickFilters
    ? null
    : selectedFixedStatus ?? (statusFilter === "ALL" ? null : statusFilter);
  const shouldKeepOrderInCurrentView = useCallback(
    (nextStatus: OrderStatus) =>
      !activeStatusFilter || activeStatusFilter === nextStatus,
    [activeStatusFilter],
  );

  const fetchOrders = useCallback(async ({ background = false }: FetchOrdersOptions = {}) => {
    if (!canViewSystemOrders && !isBranchScopedView) {
      return;
    }

    if (background) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
      setExpandedId(null);
      setDetailCache({});
    }
    try {
      if (isBranchScopedView) {
        const branchOrders = await orderService.getBranchOrders(
          undefined,
          undefined,
          startDateFilter || undefined,
          endDateFilter || undefined,
        );
        const mappedOrders = branchOrders.map(mapBranchOrderToMyOrder);
        const branchBaseOrders = mappedOrders
          .filter((order) =>
            paymentFilter === "ALL" ? true : order.paymentStatus === paymentFilter,
          )
          .filter((order) => matchesBranchScopedSearch(order, search));
        const branchFilteredOrders = hasQuickFilters
          ? branchBaseOrders.filter((order) =>
              matchesIncompleteQuickFilter(order, activeQuickFilter?.id),
            )
          : branchBaseOrders.filter((order) =>
              matchesStatusSelection(
                order,
                selectedFixedStatus ?? (statusFilter === "ALL" ? null : statusFilter),
              ),
            );
        const totalElements = branchFilteredOrders.length;
        const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
        const safePage = Math.min(currentPage, Math.max(totalPages - 1, 0));
        const startIndex = safePage * PAGE_SIZE;
        const pageContent = branchFilteredOrders.slice(startIndex, startIndex + PAGE_SIZE);

        setOrdersPage({
          content: pageContent,
          totalElements,
          totalPages,
          number: safePage,
          size: PAGE_SIZE,
          first: safePage === 0,
          last: safePage >= totalPages - 1,
        });
        setOrders(pageContent);
        setOrderSummary(
          shouldShowSummaryCards ? buildLocalOrderSummary(branchFilteredOrders) : null,
        );
        setGroupCounts(
          statusGroupItems.reduce<Record<string, number>>((nextCounts, group) => {
            nextCounts[group.id] = branchBaseOrders.filter((order) =>
              matchesStatusSelection(order, group.status),
            ).length;
            return nextCounts;
          }, {}),
        );
        setQuickFilterCounts(
          quickFilterItems.reduce<Record<string, number>>((nextCounts, group) => {
            nextCounts[group.id] = branchBaseOrders.filter((order) =>
              matchesIncompleteQuickFilter(order, group.id),
            ).length;
            return nextCounts;
          }, {}),
        );
        lastRefreshSignalRef.current = Math.max(
          lastRefreshSignalRef.current,
          readAdminOrdersRefreshSignal(),
        );
        setSelectedItems([]);
        return;
      }

      const [data, summary, groupCountEntries, quickFilterCountEntries] = await Promise.all([
        orderService.getAdminOrders({
          ...adminOrderFilters,
          page: currentPage,
          size: PAGE_SIZE,
        }),
        shouldShowSummaryCards
          ? orderService.getAdminOrderSummary(adminOrderFilters)
          : Promise.resolve(null),
        statusGroupItems.length > 0
          ? Promise.all(
              statusGroupItems.map(async (group) => {
                const groupSummary = await orderService.getAdminOrderSummary({
                  ...baseAdminOrderFilters,
                  status: group.status,
                });

                return [group.id, groupSummary.totalOrders] as const;
              }),
            )
          : Promise.resolve(null),
        hasQuickFilters
          ? Promise.all(
              quickFilterItems.map(async (group) => {
                const groupSummary = await orderService.getAdminOrderSummary({
                  ...baseAdminOrderFilters,
                  status: group.statusQuery,
                });

                return [group.id, groupSummary.totalOrders] as const;
              }),
            )
          : Promise.resolve(null),
      ]);
      setOrdersPage(data);
      setOrders(data.content ?? []);
      setOrderSummary(summary);
      if (groupCountEntries) {
        setGroupCounts(
          groupCountEntries.reduce<Record<string, number>>(
            (nextCounts, [groupId, count]) => ({
              ...nextCounts,
              [groupId]: count,
            }),
            {},
          ),
        );
      }
      if (quickFilterCountEntries) {
        setQuickFilterCounts(
          quickFilterCountEntries.reduce<Record<string, number>>(
            (nextCounts, [groupId, count]) => ({
              ...nextCounts,
              [groupId]: count,
            }),
            {},
          ),
        );
      }
      lastRefreshSignalRef.current = Math.max(
        lastRefreshSignalRef.current,
        readAdminOrdersRefreshSignal(),
      );
      setSelectedItems([]);
    } catch {
      if (!background) {
        setOrderSummary(null);
        setGroupCounts({});
        setQuickFilterCounts({});
      }
      toast.error(
        isBranchScopedView
          ? "Không thể tải danh sách đơn hàng của chi nhánh đang quản lý."
          : "Không thể tải danh sách đơn hàng toàn hệ thống.",
      );
    } finally {
      if (background) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [
    activeQuickFilter?.id,
    adminOrderFilters,
    baseAdminOrderFilters,
    canViewSystemOrders,
    currentPage,
    endDateFilter,
    hasQuickFilters,
    isBranchScopedView,
    paymentFilter,
    quickFilterItems,
    search,
    selectedFixedStatus,
    shouldShowSummaryCards,
    startDateFilter,
    statusFilter,
    statusGroupItems,
  ]);

  useEffect(() => {
    if (isLoadingAuth || (!canViewSystemOrders && !isBranchScopedView)) {
      return;
    }

    void fetchOrders();
  }, [canViewSystemOrders, fetchOrders, isBranchScopedView, isLoadingAuth]);

  useOrderRealtimeSync({
    enabled: !isLoadingAuth && (canViewSystemOrders || isBranchScopedView),
    lastRefreshSignalRef,
    onBackgroundRefresh: () => fetchOrders({ background: true }),
  });

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

  const orderMap = useMemo(
    () => new Map(orders.map((order) => [order.id, order])),
    [orders],
  );
  const selectedOrderIdSet = useMemo(
    () => new Set(selectedItems),
    [selectedItems],
  );
  const selectedOrders = useMemo(
    () =>
      selectedItems
        .map((id) => detailCache[id] ?? orderMap.get(id))
        .filter((order): order is MyOrder => Boolean(order)),
    [detailCache, orderMap, selectedItems],
  );
  const selectedStatusKey = useMemo(
    () =>
      selectedOrders[0]
        ? getOrderSelectionStatusKey(selectedOrders[0])
        : null,
    [selectedOrders],
  );
  const selectedStatusLabel = useMemo(
    () =>
      selectedStatusKey
        ? getOrderSelectionStatusLabel(selectedStatusKey)
        : null,
    [selectedStatusKey],
  );
  const selectableSameStatusOrderIds = useMemo(
    () =>
      selectedStatusKey
        ? orders
            .filter(
              (order) => getOrderSelectionStatusKey(order) === selectedStatusKey,
            )
            .map((order) => order.id)
        : [],
    [orders, selectedStatusKey],
  );
  const selectableSameStatusOrderIdSet = useMemo(
    () => new Set(selectableSameStatusOrderIds),
    [selectableSameStatusOrderIds],
  );
  const areAllSelectableOrdersSelected = useMemo(
    () =>
      selectableSameStatusOrderIds.length > 0 &&
      selectableSameStatusOrderIds.every((id) => selectedOrderIdSet.has(id)),
    [selectableSameStatusOrderIds, selectedOrderIdSet],
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

  const openOrderDetailRow = async (orderId: number) => {
    setExpandedId(orderId);

    if (!detailCache[orderId]) {
      setLoadingDetailId(orderId);
      try {
        const detail = isBranchScopedView
          ? mapBranchOrderToMyOrder(await orderService.getBranchOrderById(orderId))
          : await orderService.getAdminOrderById(orderId);
        setDetailCache((prev) => ({ ...prev, [orderId]: detail }));
      } catch {
        toast.error("Không thể tải nhanh chi tiết đơn hàng.");
      } finally {
        setLoadingDetailId(null);
      }
    }
  };

  const getOrderActionState = useCallback(
    (order: MyOrder) => {
      const replenishmentDocuments =
        order.replenishmentDocuments ?? [];
      const hasExistingReplenishmentDocuments =
        Boolean(order.replenishmentRequested) ||
        getReplenishmentDocumentLinks(replenishmentDocuments).length > 0;

      return {
        nextAction: hasPermission(P.ORDER_UPDATE)
          ? getNextOrderWorkflowAction(order)
          : null,
        allowReplenishment:
          hasPermission(P.ORDER_UPDATE) &&
          canRequestReplenishmentAction(order),
        hasExistingReplenishmentDocuments,
      };
    },
    [hasPermission],
  );

  const resolveBatchTargetOrders = useCallback(
    (
      clickedOrder: MyOrder,
      actionLabel: string,
      matchesAction: (order: MyOrder) => boolean,
    ) => {
      if (!selectedStatusKey || selectedOrders.length === 0) {
        return [clickedOrder];
      }

      const clickedStatusKey = getOrderSelectionStatusKey(clickedOrder);
      if (clickedStatusKey !== selectedStatusKey) {
        toast.error(
          `Bạn đang chọn nhóm đơn ${selectedStatusLabel ?? selectedStatusKey}. Hãy bấm thao tác trên một đơn cùng trạng thái hoặc bỏ chọn nhóm hiện tại.`,
        );
        return null;
      }

      const invalidOrders = selectedOrders.filter(
        (order) => !matchesAction(order),
      );
      if (invalidOrders.length > 0) {
        toast.error(
          `Nhóm đơn đã chọn có đơn không thể thực hiện thao tác "${actionLabel}". Vui lòng chỉ giữ các đơn cùng trạng thái và cùng thao tác.`,
        );
        return null;
      }

      return selectedOrders;
    },
    [selectedOrders, selectedStatusKey, selectedStatusLabel],
  );

  const applyStatusUpdateToLocalOrders = useCallback(
    (orderIds: number[], nextStatus: OrderStatus) => {
      const updatedIds = new Set(orderIds);

      if (shouldKeepOrderInCurrentView(nextStatus)) {
        setOrders((prev) =>
          prev.map((item) =>
            updatedIds.has(item.id)
              ? { ...item, status: nextStatus }
              : item,
          ),
        );
        setDetailCache((prev) => {
          const next = { ...prev };

          for (const orderId of orderIds) {
            const detail = next[orderId];
            if (detail) {
              next[orderId] = {
                ...detail,
                status: nextStatus,
              };
            }
          }

          return next;
        });
      } else {
        setOrders((prev) => prev.filter((item) => !updatedIds.has(item.id)));
        setExpandedId((prev) =>
          prev !== null && updatedIds.has(prev) ? null : prev,
        );
        setDetailCache((prev) => {
          const next = { ...prev };

          for (const orderId of orderIds) {
            delete next[orderId];
          }

          return next;
        });
      }

      setSelectedItems((prev) => prev.filter((id) => !updatedIds.has(id)));
    },
    [shouldKeepOrderInCurrentView],
  );

  const handleBatchAdvanceStatus = useCallback(
    async (
      event: React.MouseEvent,
      clickedOrder: MyOrder,
    ) => {
      event.stopPropagation();

      const action = getNextOrderWorkflowAction(clickedOrder);
      if (!action) {
        return;
      }

      const targetOrders = resolveBatchTargetOrders(
        clickedOrder,
        action.label,
        (order) =>
          getNextOrderWorkflowAction(order)?.nextStatus === action.nextStatus,
      );
      if (!targetOrders?.length) {
        return;
      }

      const targetIds = targetOrders.map((order) => order.id);

      try {
        setAdvancingOrderIds(targetIds);
        const settledResults = await Promise.allSettled(
          targetOrders.map(async (order) => {
            if (isBranchScopedView) {
              await orderService.updateBranchOrderStatus(order.id, action.nextStatus);
            } else {
              await orderService.updateOrderStatus(order.id, action.nextStatus);
            }

            return order;
          }),
        );

        const successfulOrders = settledResults.flatMap((result) =>
          result.status === "fulfilled" ? [result.value] : [],
        );
        const failedCount = settledResults.length - successfulOrders.length;

        if (successfulOrders.length > 0) {
          applyStatusUpdateToLocalOrders(
            successfulOrders.map((order) => order.id),
            action.nextStatus,
          );

          if (successfulOrders.length === 1 && targetOrders.length === 1) {
            toast.success(
              `Đơn hàng ${getOrderCode(successfulOrders[0])} đã được cập nhật trạng thái.`,
            );
          } else {
            toast.success(
              `Đã cập nhật trạng thái cho ${successfulOrders.length}/${targetOrders.length} đơn đã chọn.`,
            );
          }

          await fetchOrders({ background: true });
        }

        if (failedCount > 0) {
          toast.error(
            `Còn ${failedCount} đơn chưa cập nhật trạng thái được. Vui lòng thử lại.`,
          );
        }
      } catch {
        toast.error("Không thể cập nhật trạng thái đơn hàng.");
      } finally {
        setAdvancingOrderIds([]);
      }
    },
    [
      applyStatusUpdateToLocalOrders,
      fetchOrders,
      isBranchScopedView,
      resolveBatchTargetOrders,
    ],
  );

  const toggleBatchSelectAll = useCallback(() => {
    if (orders.length === 0) {
      return;
    }

    if (!selectedStatusKey) {
      const firstStatusKey = getOrderSelectionStatusKey(orders[0]);
      const sameStatusOrderIds = orders
        .filter((order) => getOrderSelectionStatusKey(order) === firstStatusKey)
        .map((order) => order.id);

      if (sameStatusOrderIds.length !== orders.length) {
        toast.error(
          "Danh sách đang có nhiều trạng thái. Vui lòng chọn một đơn trước, rồi chỉ chọn thêm các đơn cùng trạng thái.",
        );
        return;
      }

      setSelectedItems(sameStatusOrderIds);
      return;
    }

    setSelectedItems((prev) =>
      areAllSelectableOrdersSelected
        ? prev.filter((id) => !selectableSameStatusOrderIdSet.has(id))
        : selectableSameStatusOrderIds,
    );
  }, [
    areAllSelectableOrdersSelected,
    orders,
    selectableSameStatusOrderIdSet,
    selectableSameStatusOrderIds,
    selectedStatusKey,
  ]);

  const toggleBatchSelectItem = useCallback(
    (order: MyOrder) => {
      const orderStatusKey = getOrderSelectionStatusKey(order);

      if (
        selectedStatusKey &&
        orderStatusKey !== selectedStatusKey &&
        !selectedOrderIdSet.has(order.id)
      ) {
        toast.error(
          `Bạn đã chọn một đơn trạng thái ${selectedStatusLabel ?? selectedStatusKey} trước đó. Hãy chỉ chọn thêm các đơn cùng trạng thái này.`,
        );
        return;
      }

      setSelectedItems((prev) =>
        prev.includes(order.id)
          ? prev.filter((itemId) => itemId !== order.id)
          : [...prev, order.id],
      );
    },
    [selectedOrderIdSet, selectedStatusKey, selectedStatusLabel],
  );

  const handleToggleRow = async (orderId: number) => {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }

    await openOrderDetailRow(orderId);
  };

  const handleOpenReplenishmentDocuments = async (
    event: React.MouseEvent,
    orderId: number,
  ) => {
    event.stopPropagation();
    await openOrderDetailRow(orderId);
  };

  const handleRequestReplenishment = async (
    event: React.MouseEvent,
    clickedOrder: MyOrder,
  ) => {
    event.stopPropagation();

    const clickedOrderActionState = getOrderActionState(clickedOrder);
    if (
      !clickedOrderActionState.allowReplenishment ||
      clickedOrderActionState.hasExistingReplenishmentDocuments
    ) {
      return;
    }

    const targetOrders = resolveBatchTargetOrders(
      clickedOrder,
      "Xử lý thiếu hàng",
      (order) => {
        const actionState = getOrderActionState(order);

        return (
          actionState.allowReplenishment &&
          !actionState.hasExistingReplenishmentDocuments
        );
      },
    );
    if (!targetOrders?.length) {
      return;
    }

    const targetIds = targetOrders.map((order) => order.id);

    try {
      setReplenishingOrderIds(targetIds);
      const settledResults = await Promise.allSettled(
        targetOrders.map(async (order) => {
          const response = isBranchScopedView
            ? await orderService.requestBranchOrderReplenishment(order.id)
            : await orderService.requestAdminOrderReplenishment(order.id);

          return { order, response };
        }),
      );

      const successfulResults = settledResults.flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : [],
      );
      const failedCount = settledResults.length - successfulResults.length;

      if (successfulResults.length > 0) {
        const resultMap = new Map(
          successfulResults.map(({ order, response }) => [
            order.id,
            response.planItems ?? [],
          ]),
        );

        setOrders((prev) =>
          prev.map((order) =>
            resultMap.has(order.id)
              ? {
                  ...order,
                  replenishmentRequested: true,
                  replenishmentDocuments: resultMap.get(order.id) ?? [],
                }
              : order,
          ),
        );
        setDetailCache((prev) => {
          const next = { ...prev };

          for (const { order, response } of successfulResults) {
            const detail = next[order.id];
            if (detail) {
              next[order.id] = {
                ...detail,
                replenishmentRequested: true,
                replenishmentDocuments: response.planItems ?? [],
              };
            }
          }

          return next;
        });
        setSelectedItems((prev) =>
          prev.filter(
            (id) => !successfulResults.some(({ order }) => order.id === id),
          ),
        );

        if (successfulResults.length === 1 && targetOrders.length === 1) {
          const [{ order, response }] = successfulResults;
          toast.success(getReplenishmentResultMessage(getOrderCode(order), response));
        } else {
          toast.success(
            `Đã xử lý thiếu hàng cho ${successfulResults.length}/${targetOrders.length} đơn đã chọn.`,
          );
        }

        await fetchOrders({ background: true });
      }

      if (failedCount > 0) {
        toast.error(
          `Còn ${failedCount} đơn chưa xử lý thiếu hàng được. Vui lòng thử lại cho các đơn này.`,
        );
      }
    } catch (error) {
      toast.error(getFriendlyError(error));
    } finally {
      setReplenishingOrderIds([]);
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
      if (isBranchScopedView) {
        await orderService.updateBranchOrderStatus(order.id, action.nextStatus);
      } else {
        await orderService.updateOrderStatus(order.id, action.nextStatus);
      }
      if (shouldKeepOrderInCurrentView(action.nextStatus)) {
        setOrders((prev) =>
          prev.map((item) =>
            item.id === order.id ? { ...item, status: action.nextStatus } : item,
          ),
        );
        setDetailCache((prev) => {
          const detail = prev[order.id];
          return detail
            ? {
                ...prev,
                [order.id]: {
                  ...detail,
                  status: action.nextStatus,
                },
              }
            : prev;
        });
      } else {
        setOrders((prev) => prev.filter((item) => item.id !== order.id));
        setExpandedId((prev) => (prev === order.id ? null : prev));
        setDetailCache((prev) => {
          const next = { ...prev };
          delete next[order.id];
          return next;
        });
      }
      toast.success(`Đơn hàng ${getOrderCode(order)} đã được cập nhật trạng thái.`);
      await fetchOrders({ background: true });
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

  const handleQuickFilterChange = (filterId: string) => {
    if (!hasQuickFilters) {
      return;
    }

    router.replace(`${pathname}?quickFilter=${filterId}`);
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatusFilter("ALL");
    setPaymentFilter("ALL");
    setStartDateFilter(defaultDateRange.start);
    setEndDateFilter(defaultDateRange.end);
    if (hasQuickFilters) {
      router.replace(`${pathname}?quickFilter=${fallbackQuickFilterId}`);
    }
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
      (!hasQuickFilters && !useCompactIncompleteTable && paymentFilter !== "ALL") ||
      startDateFilter !== defaultDateRange.start ||
      endDateFilter !== defaultDateRange.end ||
      (isAllOrdersPage && statusFilter !== "ALL") ||
      (hasQuickFilters && activeQuickFilter?.id !== fallbackQuickFilterId),
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
  const quickFilterCards = useMemo(
    () =>
      quickFilterItems.map((group) => ({
        ...group,
        value: (quickFilterCounts[group.id] ?? 0).toLocaleString("vi-VN"),
        isActive: activeQuickFilter?.id === group.id,
      })),
    [activeQuickFilter?.id, quickFilterCounts, quickFilterItems],
  );
  const displayedSummaryCards = useMemo(
    () =>
      useCompactIncompleteTable
        ? [
            {
              label: "Tổng đơn",
              value: totalOrders.toLocaleString("vi-VN"),
              note: "Số đơn toàn hệ thống khớp với bộ lọc hiện tại",
            },
            {
              label: "Thiếu hàng",
              value: shortageCount.toLocaleString("vi-VN"),
              note: "Đơn thiếu hàng toàn hệ thống khớp với bộ lọc hiện tại",
            },
            {
              label: "Chưa thanh toán",
              value: unpaidCount.toLocaleString("vi-VN"),
              note: "Đơn toàn hệ thống chưa hoàn tất thanh toán",
            },
            {
              label: "Giá trị lọc",
              value: formatCurrency(totalFilteredValue),
              note: "Tổng giá trị đơn toàn hệ thống khớp với bộ lọc hiện tại",
            },
          ]
        : summaryCards,
    [shortageCount, summaryCards, totalFilteredValue, totalOrders, unpaidCount, useCompactIncompleteTable],
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
          {subtitle ?? (
            <>
          Quản lý theo đơn hàng, giao hàng, thanh toán và tình trạng thiếu hàng
          trên cùng một màn hình.
            </>
          )}
        </p>
      </div>

      {statusGroupItems.length > 0 ? (
        <div className="grid grid-cols-1 overflow-hidden rounded-[4px] border border-slate-200 bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-7">
          {statusGroupItems.map((group) => {
            const isActiveGroup = activeStatusGroup?.id === group.id;

            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setActiveGroupId(group.id)}
                className={cn(
                  "flex min-h-[74px] flex-col items-start justify-center border-b border-r border-slate-200 px-4 py-3 text-left transition-colors last:border-r-0 sm:last:border-r-0 xl:border-b-0 xl:last:border-r-0",
                  isActiveGroup
                    ? "bg-blue-50 text-blue-700"
                    : "bg-white text-slate-600 hover:bg-slate-50",
                )}
              >
                <span className="text-[12px] font-semibold">
                  {group.label}
                </span>
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
      ) : null}

      {hasQuickFilters ? (
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
      ) : null}

      {useCompactIncompleteTable && shouldShowSummaryCards ? (
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          {displayedSummaryCards.map((card) => (
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
              placeholder={searchPlaceholder}
              className="h-[38px] rounded-md border-slate-200 bg-white pl-10 text-[13px] shadow-none focus-visible:ring-blue-500/20"
            />
          </div>

          {isAllOrdersPage && !hasQuickFilters ? (
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

          {!hasQuickFilters && !useCompactIncompleteTable ? (
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

      {isAllOrdersPage && !useCompactIncompleteTable ? (
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          {displayedSummaryCards.map((card) => (
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

      {isRefreshing ? (
        <div className="flex items-center justify-end gap-2 px-1 text-[12px] font-medium text-blue-600">
          <Loader2 size={14} className="animate-spin" />
          Đang đồng bộ danh sách đơn hàng...
        </div>
      ) : null}

      {!useCompactIncompleteTable && selectedStatusKey ? (
        <div className={ORDER_LIST_NOTE_CLASS}>
          Đang chọn {selectedItems.length} đơn trạng thái {selectedStatusLabel}. Các
          dòng cùng trạng thái đang được tô xanh nhẹ để bạn chọn nhanh hơn. Nhấp
          một nút thao tác ở bất kỳ dòng cùng trạng thái để áp dụng cho nhóm đã
          chọn.
        </div>
      ) : null}

      <div className={ORDER_LIST_SHELL_CLASS}>
        <div className="w-full overflow-x-auto">
          <Table className="min-w-max [&_th]:whitespace-nowrap">
            {useCompactIncompleteTable ? (
              <TableHeader className={ORDER_LIST_HEADER_CLASS}>
                <TableRow className="border-b border-blue-100">
                  <TableHead className="w-[52px] pl-4" />
                  <TableHead className="text-[12px] font-bold text-slate-800">
                    Mã đơn hàng
                  </TableHead>
                  <TableHead className="text-[12px] font-bold text-slate-800">
                    Ngày đặt
                  </TableHead>
                  <TableHead className="text-[12px] font-bold text-slate-800">
                    Khách hàng
                  </TableHead>
                  <TableHead className="text-center text-[12px] font-bold text-slate-800">
                    Trạng thái
                  </TableHead>
                  <TableHead className="text-center text-[12px] font-bold text-slate-800">
                    Thanh toán
                  </TableHead>
                  <TableHead className="text-right text-[12px] font-bold text-slate-800">
                    Tiền hàng
                  </TableHead>
                  <TableHead className="text-right text-[12px] font-bold text-slate-800">
                    Phí ship
                  </TableHead>
                </TableRow>
              </TableHeader>
            ) : null}
            {!useCompactIncompleteTable ? (
            <TableHeader className={ORDER_LIST_HEADER_CLASS}>
              <TableRow className="border-b border-blue-100">
                <TableHead className="w-[42px] pl-4">
                  <Settings size={14} className="text-slate-400" />
                </TableHead>
                <TableHead className="w-[42px]">
                  <Checkbox
                    className="border-slate-300 data-[state=checked]:bg-blue-600"
                    checked={
                      selectedStatusKey
                        ? areAllSelectableOrdersSelected
                          ? true
                          : selectedItems.length > 0
                            ? "indeterminate"
                            : false
                        : false
                    }
                    onCheckedChange={() => toggleBatchSelectAll()}
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
            ) : null}
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
                    className={cn(
                      "text-center text-slate-500",
                      useCompactIncompleteTable ? "h-36" : "h-32",
                    )}
                  >
                    {useCompactIncompleteTable
                      ? "Không có đơn hàng chưa hoàn tất."
                      : "Không có đơn hàng phù hợp với bộ lọc hiện tại."}
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
                  const replenishmentDocuments =
                    orderDetail.replenishmentDocuments ??
                    order.replenishmentDocuments ??
                    [];
                  const hasReplenishmentDocuments =
                    Boolean(
                      orderDetail.replenishmentRequested ??
                        order.replenishmentRequested,
                    ) ||
                    getReplenishmentDocumentLinks(replenishmentDocuments)
                      .length > 0;
                  const nextAction =
                    hasPermission(P.ORDER_UPDATE)
                      ? getNextOrderWorkflowAction(orderDetail)
                      : null;
                  const allowReplenishment =
                    hasPermission(P.ORDER_UPDATE) &&
                    canRequestReplenishmentAction(orderDetail);
                  const isSelected = selectedOrderIdSet.has(orderId);
                  const isBatchSelectionMatch =
                    Boolean(selectedStatusKey) &&
                    getOrderSelectionStatusKey(orderDetail) === selectedStatusKey &&
                    !isSelected;
                  const isAdvancing = advancingOrderIds.includes(orderId);
                  const isReplenishing = replenishingOrderIds.includes(orderId);

                  return (
                    <React.Fragment key={orderId}>
                      <TableRow
                        className={cn(
                          ORDER_LIST_ROW_CLASS,
                          isSelected && ORDER_LIST_ROW_SELECTED_CLASS,
                          isBatchSelectionMatch && ORDER_LIST_ROW_BATCH_MATCH_CLASS,
                          isExpanded && ORDER_LIST_ROW_ACTIVE_CLASS,
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
                        {useCompactIncompleteTable ? (
                          <>
                            <TableCell>
                              <Link
                                href={`/admin/orders/${order.id}`}
                                onClick={(event) => event.stopPropagation()}
                                className="text-[13px] font-semibold text-blue-700 hover:underline"
                              >
                                {orderCode}
                              </Link>
                            </TableCell>
                            <TableCell className="text-[13px] text-slate-700">
                              {formatDate(order.createdAt, "dd/MM/yyyy HH:mm")}
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
                            <TableCell className="text-center">
                              <OrderWorkflowBadge
                                status={order.status}
                                variant="order-list-monochrome"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <PaymentStatusBadge
                                status={order.paymentStatus}
                                variant="order-list-monochrome"
                              />
                            </TableCell>
                            <TableCell className="text-right text-[13px] font-semibold text-slate-800">
                              {formatCurrency(order.finalAmount ?? order.totalAmount)}
                            </TableCell>
                            <TableCell className="text-right text-[13px] font-semibold text-slate-800">
                              {formatCurrency(order.totalShippingFee ?? order.shippingFee ?? 0)}
                            </TableCell>
                          </>
                        ) : (
                          <>
                        <TableCell onClick={(event) => event.stopPropagation()}>
                          <Checkbox
                            className="border-slate-300 data-[state=checked]:bg-blue-600"
                            checked={isSelected}
                            onCheckedChange={() => toggleBatchSelectItem(orderDetail)}
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
                          <InventoryStatusBadge
                            order={order}
                            variant="order-list-monochrome"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <OrderWorkflowBadge
                            status={order.status}
                            variant="order-list-monochrome"
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
                                className={cn(
                                  ORDER_LIST_PRIMARY_ACTION_CLASS,
                                  "w-[132px] justify-center",
                                )}
                                disabled={isAdvancing}
                                onClick={(event) =>
                                  void handleBatchAdvanceStatus(event, orderDetail)
                                }
                              >
                                {isAdvancing ? (
                                  <>
                                    <Loader2 size={14} className="mr-1.5 animate-spin" />
                                    Đang cập nhật
                                  </>
                                ) : (
                                  nextAction.label
                                )}
                              </Button>
                            ) : allowReplenishment ? (
                              <Button
                                size="sm"
                                className={cn(
                                  ORDER_LIST_SECONDARY_ACTION_CLASS,
                                  "w-[168px] justify-center",
                                )}
                                disabled={isReplenishing}
                                onClick={(event) =>
                                  hasReplenishmentDocuments
                                    ? void handleOpenReplenishmentDocuments(
                                        event,
                                        orderId,
                                      )
                                    : void handleRequestReplenishment(
                                        event,
                                        orderDetail,
                                      )
                                }
                              >
                                {hasReplenishmentDocuments
                                  ? "Đã xử lý thiếu hàng"
                                  : "Xử lý thiếu hàng"}
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                          </>
                        )}
                      </TableRow>

                      {isExpanded ? (
                        <TableRow className={ORDER_LIST_EXPANDED_ROW_CLASS}>
                          <TableCell
                            colSpan={tableColSpan}
                            className="border-b border-blue-100 p-0"
                          >
                            <div className="grid gap-4 p-4 xl:grid-cols-[0.9fr_1.1fr]">
                              <div className="space-y-4">
                                <div className={ORDER_LIST_PANEL_CLASS}>
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

                                <div className={ORDER_LIST_PANEL_CLASS}>
                                  <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                                    Tình trạng xử lý
                                  </p>
                                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                    <div className={ORDER_LIST_PANEL_MUTED_CLASS}>
                                      <p className="text-[11px] font-semibold text-slate-500">
                                        Chi nhánh phụ trách
                                      </p>
                                      <p className="mt-2 text-[13px] text-slate-800">
                                        {getOrderBranchNames(orderDetail)[0] ??
                                          getOrderBranchSummary(orderDetail)}
                                      </p>
                                    </div>
                                    <div className={ORDER_LIST_PANEL_MUTED_CLASS}>
                                      <p className="text-[11px] font-semibold text-slate-500">
                                        Tình trạng hàng
                                      </p>
                                      <div className="mt-2">
                                        <InventoryStatusBadge
                                          order={orderDetail}
                                          variant="order-list-monochrome"
                                        />
                                      </div>
                                    </div>
                                    <div className={ORDER_LIST_PANEL_MUTED_CLASS}>
                                      <p className="text-[11px] font-semibold text-slate-500">
                                        Trạng thái đơn
                                      </p>
                                      <div className="mt-2">
                                        <OrderWorkflowBadge
                                          status={order.status}
                                          variant="order-list-monochrome"
                                        />
                                      </div>
                                    </div>
                                    <div className={ORDER_LIST_PANEL_MUTED_CLASS}>
                                      <p className="text-[11px] font-semibold text-slate-500">
                                        Giao hàng
                                      </p>
                                      <div className="mt-2">
                                        <DeliveryStatusBadge
                                          status={order.status}
                                          variant="order-list-monochrome"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  {order.note ? (
                                    <div className={cn("mt-3", ORDER_LIST_NOTE_CLASS)}>
                                      <span className="font-semibold text-slate-800">
                                        Ghi chú:
                                      </span>{" "}
                                      {order.note}
                                    </div>
                                  ) : null}
                                  <ReplenishmentDocumentLinks
                                    documents={replenishmentDocuments}
                                    className="mt-3"
                                    compact
                                  />
                                </div>
                              </div>

                              <div className={ORDER_LIST_PANEL_CLASS}>
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
                                    className={ORDER_LIST_SECONDARY_ACTION_CLASS}
                                  >
                                    <Link href={`/admin/orders/${order.id}`}>
                                      Mở chi tiết đầy đủ
                                    </Link>
                                  </Button>
                                </div>

                                <div className={ORDER_LIST_SUBTABLE_CLASS}>
                                  <table className="w-full text-left">
                                    <thead className="bg-blue-50/50 text-[11px] uppercase tracking-wide text-slate-500">
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
                                            className="border-t border-blue-100 text-[13px]"
                                          >
                                            <td className="px-3 py-3">
                                              <div className="flex items-start gap-3.5">
                                                <div className={ORDER_LIST_IMAGE_FRAME_CLASS}>
                                                  {item.image ? (
                                                    <img
                                                      src={resolveImageUrl(item.image)}
                                                      alt={item.productName}
                                                      className="h-full w-full object-cover"
                                                      onError={(event) => {
                                                        event.currentTarget.onerror = null;
                                                        event.currentTarget.src = "/placeholder.png";
                                                      }}
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
                                                <span className="rounded-none border border-blue-200 bg-white px-2 py-1 text-[11px] font-semibold text-blue-700">
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

        {!useCompactIncompleteTable || totalOrders > 0 ? (
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
        ) : null}
      </div>
    </div>
  );
}
