import { P } from "@/lib/permissions";
import { isAdminRole } from "@/lib/roles";

export const ADVISOR_WORKSPACE_PERMISSIONS = [P.CUSTOMER_ADVISOR_USE] as const;
export const AGRONOMIST_WORKSPACE_PERMISSIONS = [P.AGRONOMIST_WORKSPACE_USE] as const;
export const LAST_WORKSPACE_STORAGE_KEY = "lastWorkspace";
export type WorkspaceRoute = "/admin";

export const ADMIN_WORKSPACE_PERMISSIONS = [
  P.DASHBOARD_VIEW,
  P.ACTIVITY_LOG_VIEW,
  P.REPORT_REVENUE_VIEW,
  P.REPORT_INVENTORY_VIEW,
  P.REPORT_FINANCE_VIEW,
  P.STAFF_VIEW,
  P.BRANCH_VIEW,
  P.ROLE_VIEW,
  P.ORDER_VIEW,
  P.VOUCHER_VIEW,
  P.CUSTOMER_VIEW,
  P.PRODUCT_VIEW,
  P.CATEGORY_VIEW,
  P.ATTRIBUTE_VIEW,
  P.SUPPLIER_VIEW,
  P.IMPORT_VIEW,
  P.EXPORT_VIEW,
  P.TRANSFER_VIEW,
  P.CHECK_VIEW,
  P.PURCHASE_REQUEST_VIEW,
  P.BANNER_VIEW,
  P.SETTING_VIEW,
  P.BLOG_VIEW,
  P.BLOG_CREATE,
  P.BLOG_EDIT,
  P.BLOG_DELETE,
  P.BLOG_APPROVE,
  P.CHAT_VIEW,
  P.CUSTOMER_ADVISOR_USE,
  P.AGRONOMIST_WORKSPACE_USE,
  P.AI_KNOWLEDGE_VIEW,
  P.AI_KNOWLEDGE_CREATE,
  P.AI_KNOWLEDGE_UPDATE,
  P.AI_KNOWLEDGE_APPROVE,
  P.AI_IMPORT_KNOWLEDGE,
  P.AI_CASE_REVIEW,
] as const;

export const ACTIVITY_LOG_PERMISSIONS = [P.ACTIVITY_LOG_VIEW] as const;

export function hasAnyPermissionCode(
  permissions: string[] = [],
  requiredPermissions: readonly string[],
) {
  return requiredPermissions.some((permission) => permissions.includes(permission));
}

export function hasAdminWorkspacePermission(permissions: string[] = []) {
  return hasAnyPermissionCode(permissions, ADMIN_WORKSPACE_PERMISSIONS);
}

export function hasAdvisorWorkspacePermission(permissions: string[] = []) {
  return hasAnyPermissionCode(permissions, ADVISOR_WORKSPACE_PERMISSIONS);
}

export function hasAgronomistWorkspacePermission(permissions: string[] = []) {
  return hasAnyPermissionCode(permissions, AGRONOMIST_WORKSPACE_PERMISSIONS);
}

export function getAvailableWorkspaces(
  permissions: string[] = [],
): WorkspaceRoute[] {
  const workspaces: WorkspaceRoute[] = [];

  if (hasAdminWorkspacePermission(permissions)) {
    workspaces.push("/admin");
  }

  return workspaces;
}

export function getLastWorkspace(): WorkspaceRoute | null {
  if (typeof window === "undefined") {
    return null;
  }

  const workspace = window.localStorage.getItem(LAST_WORKSPACE_STORAGE_KEY);
  return workspace === "/admin" ? workspace : null;
}

export function setLastWorkspace(workspace: WorkspaceRoute) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LAST_WORKSPACE_STORAGE_KEY, workspace);
}

const ADMIN_PERMISSION_DESTINATIONS: Array<{
  permissions: readonly string[];
  href: string;
}> = [
  { permissions: [P.DASHBOARD_VIEW], href: "/admin" },
  { permissions: [P.ACTIVITY_LOG_VIEW], href: "/admin/activity-logs" },
  { permissions: [P.REPORT_FINANCE_VIEW], href: "/admin/financial" },
  { permissions: [P.REPORT_REVENUE_VIEW], href: "/admin/reports/sales" },
  { permissions: [P.REPORT_INVENTORY_VIEW], href: "/admin/reports/inventory" },
  { permissions: [P.ORDER_VIEW], href: "/admin/orders" },
  { permissions: [P.CUSTOMER_VIEW], href: "/admin/customers" },
  { permissions: [P.VOUCHER_VIEW], href: "/admin/vouchers" },
  { permissions: [P.CUSTOMER_ADVISOR_USE, P.CHAT_VIEW], href: "/admin/chat" },
  {
    permissions: [
      P.AGRONOMIST_WORKSPACE_USE,
      P.AI_KNOWLEDGE_VIEW,
      P.AI_KNOWLEDGE_CREATE,
      P.AI_KNOWLEDGE_UPDATE,
      P.AI_IMPORT_KNOWLEDGE,
    ],
    href: "/admin/ai-knowledge/diseases",
  },
  { permissions: [P.AI_CASE_REVIEW], href: "/admin/ai-knowledge/review" },
  { permissions: [P.AI_KNOWLEDGE_APPROVE], href: "/admin/ai-knowledge/approvals" },
  { permissions: [P.PRODUCT_VIEW], href: "/admin/products" },
  { permissions: [P.CATEGORY_VIEW], href: "/admin/categories" },
  { permissions: [P.ATTRIBUTE_VIEW], href: "/admin/variants" },
  { permissions: [P.BANNER_VIEW], href: "/admin/banners" },
  {
    permissions: [
      P.BLOG_VIEW,
      P.BLOG_CREATE,
      P.BLOG_EDIT,
      P.BLOG_DELETE,
      P.BLOG_APPROVE,
    ],
    href: "/admin/blog/posts",
  },
  { permissions: [P.PURCHASE_REQUEST_VIEW], href: "/admin/purchase-requests" },
  { permissions: [P.IMPORT_VIEW], href: "/admin/receipts" },
  { permissions: [P.EXPORT_VIEW], href: "/admin/exports" },
  { permissions: [P.TRANSFER_VIEW], href: "/admin/transfers" },
  { permissions: [P.CHECK_VIEW], href: "/admin/inventory-checks" },
  { permissions: [P.SUPPLIER_VIEW], href: "/admin/suppliers" },
  { permissions: [P.STAFF_VIEW], href: "/admin/employees" },
  { permissions: [P.BRANCH_VIEW], href: "/admin/branches" },
  { permissions: [P.ROLE_VIEW], href: "/admin/employees/roles" },
  { permissions: [P.SETTING_VIEW], href: "/admin/settings" },
];

export function getDefaultAdminRoute(permissions: string[] = []) {
  const destination = ADMIN_PERMISSION_DESTINATIONS.find((item) =>
    hasAnyPermissionCode(permissions, item.permissions),
  );

  return destination?.href ?? "/admin/forbidden";
}

export function getDefaultAdminRouteByPermissionChecker(
  hasPermission: (permission: string) => boolean,
) {
  const destination = ADMIN_PERMISSION_DESTINATIONS.find((item) =>
    item.permissions.some(hasPermission),
  );

  return destination?.href ?? "/admin/forbidden";
}

export function getPostLoginDestination(permissions: string[] = [], roleSlug?: string) {
  if (roleSlug === "CUSTOMER") {
    return "/";
  }

  // Admin/super-admin luôn vào thẳng /admin, bỏ qua lựa chọn workspace đã nhớ trước đó.
  if (isAdminRole(roleSlug)) {
    return "/admin";
  }

  const availableWorkspaces = getAvailableWorkspaces(permissions);
  const lastWorkspace = getLastWorkspace();

  if (lastWorkspace && availableWorkspaces.includes(lastWorkspace)) {
    return lastWorkspace;
  }

  if (availableWorkspaces.includes("/admin")) {
    return getDefaultAdminRoute(permissions);
  }

  return "/";
}
