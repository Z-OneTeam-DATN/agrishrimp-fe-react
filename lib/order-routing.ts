type RoleLike =
  | string
  | {
      slug?: string | null;
    }
  | null
  | undefined;

type OrderRouteUser = {
  role?: RoleLike;
  branch?: {
    id?: number | null;
  } | null;
} | null | undefined;

export function isBranchOrderUser(user: OrderRouteUser): boolean {
  return Boolean(user?.branch?.id);
}

export function canUseBranchOrderRoutes(
  user: OrderRouteUser,
  warehouseId?: number | null,
): boolean {
  return Boolean(user?.branch?.id || warehouseId);
}

export function getOrderListPath(
  user: OrderRouteUser,
  status?: string | null,
): string {
  const basePath = isBranchOrderUser(user) ? "/admin/orders" : "/admin/orders-all";

  if (!status) return basePath;

  const params = new URLSearchParams({ status });
  return `${basePath}?${params.toString()}`;
}
