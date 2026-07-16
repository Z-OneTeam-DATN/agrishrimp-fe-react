import { P } from "@/lib/permissions";

export const ADVISOR_WORKSPACE_PERMISSIONS = [P.CUSTOMER_ADVISOR_USE] as const;

export const ADMIN_WORKSPACE_PERMISSIONS = [
  P.DASHBOARD_VIEW,
  P.WORKSPACE_VIEW,
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
  P.BLOG_VIEW,
  P.SETTING_VIEW,
  P.CHAT_VIEW,
] as const;

export function hasAnyPermissionCode(
  permissions: string[] = [],
  requiredPermissions: readonly string[],
) {
  return requiredPermissions.some((permission) => permissions.includes(permission));
}

export function getPostLoginDestination(permissions: string[] = []) {
  if (hasAnyPermissionCode(permissions, ADVISOR_WORKSPACE_PERMISSIONS)) {
    return "/advisor/inbox";
  }

  if (hasAnyPermissionCode(permissions, ADMIN_WORKSPACE_PERMISSIONS)) {
    return "/admin";
  }

  return "/";
}
