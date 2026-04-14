import { isAdminRole } from "@/lib/roles";

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
  return !isAdminRole(user?.role) && !!user?.branch?.id;
}

export function getOrderListPath(
  user: OrderRouteUser,
  status?: string | null,
): string {
  const basePath = isAdminRole(user?.role) ? "/admin/orders-all" : "/admin/orders";

  if (!status) return basePath;

  const params = new URLSearchParams({ status });
  return `${basePath}?${params.toString()}`;
}
