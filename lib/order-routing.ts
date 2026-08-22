import {
  ADMIN_ORDER_STATUS_PAGES,
  getAdminOrderStatusHref,
} from "./admin-order-status-pages";

type OrderRouteUser = {
  branch?: {
    id?: number | null;
  } | null;
} | null | undefined;

type ResolveOrderRouteOptions = {
  canViewSystemOrders: boolean;
  canUseBranchOrders: boolean;
  status?: string | null;
};

export function isBranchOrderUser(user: OrderRouteUser): boolean {
  return Boolean(user?.branch?.id);
}

export function canUseBranchOrderRoutes(
  user: OrderRouteUser,
  warehouseId?: number | null,
): boolean {
  return Boolean(user?.branch?.id || warehouseId);
}

function getSystemOrderPath(status?: string | null) {
  if (!status) {
    return "/admin/orders-all";
  }

  const matchedPage = ADMIN_ORDER_STATUS_PAGES.find(
    (page) => page.status === status,
  );

  if (matchedPage) {
    return getAdminOrderStatusHref(matchedPage.slug);
  }

  return `/admin/orders-all?${new URLSearchParams({ status }).toString()}`;
}

function getBranchOrderPath(status?: string | null) {
  if (!status) {
    return "/admin/orders-processing";
  }

  const supportedBranchStatuses = new Set([
    "AWAITING_REPLENISHMENT",
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "READY_FOR_PICKUP",
  ]);

  if (!supportedBranchStatuses.has(status)) {
    return "/admin/orders-processing";
  }

  return `/admin/orders-processing?${new URLSearchParams({ status }).toString()}`;
}

export function resolveOrderRouteAccess({
  canViewSystemOrders,
  canUseBranchOrders,
  status,
}: ResolveOrderRouteOptions) {
  const basePath = canViewSystemOrders
    ? "/admin/orders-all"
    : "/admin/orders-processing";

  const listPath = status
    ? canViewSystemOrders
      ? getSystemOrderPath(status)
      : getBranchOrderPath(status)
    : basePath;

  return {
    canViewSystemOrders,
    canUseBranchOrders,
    canAccessOrderModule: canViewSystemOrders || canUseBranchOrders,
    defaultOrderListPath: basePath,
    orderListPath: listPath,
  };
}

export function getOrderListPath(
  options: ResolveOrderRouteOptions,
): string {
  return resolveOrderRouteAccess(options).orderListPath;
}
