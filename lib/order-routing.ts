import {
  ADMIN_ORDER_STATUS_PAGES,
  getAdminOrderStatusHref,
} from "./admin-order-status-pages";

const BRANCH_ORDER_BASE_PATH = "/admin/orders";
const BRANCH_ORDER_INCOMPLETE_PATH = "/admin/orders/incomplete";
const BRANCH_ORDER_PROCESSING_BASE_PATH = "/admin/orders-processing";
const BRANCH_PROCESSING_STATUSES = new Set([
  "AWAITING_REPLENISHMENT",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "READY_FOR_PICKUP",
]);

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
    return BRANCH_ORDER_BASE_PATH;
  }

  const normalizedStatus = status.trim().toUpperCase();

  if (normalizedStatus === "INCOMPLETE") {
    return BRANCH_ORDER_INCOMPLETE_PATH;
  }

  if (BRANCH_PROCESSING_STATUSES.has(normalizedStatus)) {
    return `${BRANCH_ORDER_PROCESSING_BASE_PATH}?${new URLSearchParams({
      status: normalizedStatus,
    }).toString()}`;
  }

  return `${BRANCH_ORDER_BASE_PATH}?${new URLSearchParams({
    status: normalizedStatus,
  }).toString()}`;
}

export function resolveOrderRouteAccess({
  canViewSystemOrders,
  canUseBranchOrders,
  status,
}: ResolveOrderRouteOptions) {
  const basePath = canViewSystemOrders
    ? "/admin/orders-all"
    : BRANCH_ORDER_BASE_PATH;

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
