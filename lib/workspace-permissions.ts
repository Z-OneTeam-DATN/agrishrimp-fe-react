import { P } from "@/lib/permissions";
import { isAdminRole } from "@/lib/roles";

export const ADVISOR_WORKSPACE_PERMISSIONS = [P.CUSTOMER_ADVISOR_USE] as const;
export const AGRONOMIST_WORKSPACE_PERMISSIONS = [P.AGRONOMIST_WORKSPACE_USE] as const;
export const LAST_WORKSPACE_STORAGE_KEY = "lastWorkspace";
export type WorkspaceRoute = "/admin" | "/agronomist" | "/chat";

// LƯU Ý: KHÔNG thêm P.BLOG_VIEW vào đây — quyền này giờ cũng được cấp cho vai trò kỹ sư (workspace
// /agronomist/blog) để họ gửi bài chờ duyệt, nên nếu tính vào đây thì kỹ sư sẽ "lọt" được vào cả
// khu vực /admin (sidebar hiện ra, "Quay lại quản trị" hiện ra) dù không có quyền admin thật nào.
export const ADMIN_WORKSPACE_PERMISSIONS = [
  P.DASHBOARD_VIEW,
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
  P.CHAT_VIEW,
] as const;

/**
 * Quyền được coi là "liên quan đến nhật ký hoạt động" — dùng chung cho cả sidebar (ẩn/hiện link)
 * và AdminLayout (chặn truy cập trực tiếp qua URL). Trước đây layout dùng nhầm
 * ADMIN_WORKSPACE_PERMISSIONS (rất rộng — chỉ cần có bất kỳ quyền admin nào, kể cả chỉ xem sản
 * phẩm) khiến 2 nơi lệch nhau: sidebar ẩn link nhưng gõ thẳng URL vẫn vào được trang rỗng.
 */
export const ACTIVITY_LOG_PERMISSIONS = [
  P.DASHBOARD_VIEW,
  P.STAFF_VIEW,
  P.BRANCH_VIEW,
  P.ROLE_VIEW,
  P.ORDER_VIEW,
  P.PURCHASE_REQUEST_VIEW,
  P.PURCHASE_REQUEST_CREATE,
  P.PURCHASE_REQUEST_UPDATE,
  P.PURCHASE_REQUEST_APPROVE,
  P.IMPORT_VIEW,
  P.IMPORT_CREATE,
  P.IMPORT_APPROVE,
  P.EXPORT_VIEW,
  P.EXPORT_CREATE,
  P.EXPORT_APPROVE,
  P.TRANSFER_VIEW,
  P.TRANSFER_CREATE,
  P.TRANSFER_APPROVE,
  P.CHECK_VIEW,
  P.CHECK_CREATE,
  P.CHECK_APPROVE,
  P.SUPPLIER_VIEW,
  P.SUPPLIER_CREATE,
  P.SUPPLIER_UPDATE,
  P.SUPPLIER_DELETE,
] as const;

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

  if (hasAgronomistWorkspacePermission(permissions)) {
    workspaces.push("/agronomist");
  }

  if (hasAdvisorWorkspacePermission(permissions)) {
    workspaces.push("/chat");
  }

  return workspaces;
}

export function getLastWorkspace(): WorkspaceRoute | null {
  if (typeof window === "undefined") {
    return null;
  }

  const workspace = window.localStorage.getItem(LAST_WORKSPACE_STORAGE_KEY);
  return workspace === "/admin" || workspace === "/chat" || workspace === "/agronomist"
    ? workspace
    : null;
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
  { permissions: [P.REPORT_FINANCE_VIEW], href: "/admin/financial" },
  { permissions: [P.REPORT_REVENUE_VIEW], href: "/admin/reports/sales" },
  { permissions: [P.REPORT_INVENTORY_VIEW], href: "/admin/reports/inventory" },
  { permissions: [P.ORDER_VIEW], href: "/admin/orders" },
  { permissions: [P.CUSTOMER_VIEW], href: "/admin/customers" },
  { permissions: [P.VOUCHER_VIEW], href: "/admin/vouchers" },
  { permissions: [P.PRODUCT_VIEW], href: "/admin/products" },
  { permissions: [P.CATEGORY_VIEW], href: "/admin/categories" },
  { permissions: [P.ATTRIBUTE_VIEW], href: "/admin/variants" },
  { permissions: [P.BANNER_VIEW], href: "/admin/banners" },
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

export function getPostLoginDestination(permissions: string[] = [], roleSlug?: string) {
  if (roleSlug === "USER" || roleSlug === "CUSTOMER") {
    return "/";
  }

  // Admin/super-admin luôn vào thẳng /admin, bỏ qua "lastWorkspace" đã nhớ trước đó — tránh bị
  // dẫn nhầm sang /agronomist hay /chat chỉ vì lần trước tài khoản này từng ghé workspace đó
  // (VD để test tính năng của kỹ sư/tư vấn).
  if (isAdminRole(roleSlug)) {
    return "/admin";
  }

  const availableWorkspaces = getAvailableWorkspaces(permissions);
  const lastWorkspace = getLastWorkspace();

  if (
    lastWorkspace &&
    lastWorkspace !== "/admin" &&
    availableWorkspaces.includes(lastWorkspace)
  ) {
    return lastWorkspace;
  }

  if (availableWorkspaces.includes("/admin")) {
    return getDefaultAdminRoute(permissions);
  }

  if (availableWorkspaces.includes("/agronomist")) {
    return "/agronomist";
  }

  if (availableWorkspaces.includes("/chat")) {
    return "/chat";
  }

  return "/";
}
