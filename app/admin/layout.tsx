"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import AdminSidebar from "@/components/admin/shared/AdminSidebar";
import AdminTopHeader from "@/components/admin/shared/AdminTopHeader";
import AdminAccessDenied from "@/components/admin/shared/AdminAccessDenied";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/stores/useAuthStore";
import { P } from "@/lib/permissions";
import { normalizeRoleSlug } from "@/lib/roles";
import { canUseBranchOrderRoutes } from "@/lib/order-routing";

type RouteRule = {
  exact?: boolean;
  path: string;
  permission?: string;
  anyOf?: string[];
};

const ADMIN_ROUTE_RULES: RouteRule[] = [
  { path: "/admin/forbidden", exact: true },
  { path: "/admin", exact: true, permission: P.DASHBOARD_VIEW },
  { path: "/admin/inventory-dashboard", permission: P.WORKSPACE_VIEW },
  { path: "/admin/reports/sales", permission: P.REPORT_REVENUE_VIEW },
  { path: "/admin/reports/inventory", permission: P.REPORT_INVENTORY_VIEW },
  { path: "/admin/financial", permission: P.REPORT_FINANCE_VIEW },
  { path: "/admin/employees/roles/add", permission: P.ROLE_CREATE },
  { path: "/admin/employees/roles/edit", permission: P.ROLE_UPDATE },
  { path: "/admin/employees/roles", permission: P.ROLE_VIEW },
  { path: "/admin/employees/add", permission: P.STAFF_CREATE },
  { path: "/admin/employees/edit", anyOf: [P.STAFF_VIEW, P.STAFF_UPDATE] },
  { path: "/admin/employees", permission: P.STAFF_VIEW },
  { path: "/admin/branches/add", permission: P.BRANCH_CREATE },
  { path: "/admin/branches", permission: P.BRANCH_VIEW },
  { path: "/admin/suppliers", permission: P.SUPPLIER_VIEW },
  { path: "/admin/orders-processing", permission: P.ORDER_VIEW },
  { path: "/admin/orders-handover", permission: P.ORDER_VIEW },
  { path: "/admin/orders-all", permission: P.ORDER_VIEW },
  { path: "/admin/orders", permission: P.ORDER_VIEW },
  { path: "/admin/vouchers", permission: P.VOUCHER_VIEW },
  { path: "/admin/customers", permission: P.CUSTOMER_VIEW },
  { path: "/admin/products/add", permission: P.PRODUCT_CREATE },
  { path: "/admin/products", permission: P.PRODUCT_VIEW },
  { path: "/admin/categories", permission: P.CATEGORY_VIEW },
  { path: "/admin/variants", permission: P.ATTRIBUTE_VIEW },
  { path: "/admin/receipts", permission: P.IMPORT_VIEW },
  { path: "/admin/exports", permission: P.EXPORT_VIEW },
  { path: "/admin/transfers", permission: P.TRANSFER_VIEW },
  { path: "/admin/inventory-checks", permission: P.CHECK_VIEW },
  { path: "/admin/settings", permission: P.SETTING_VIEW },
  { path: "/admin/banners" },
  { path: "/admin/blog" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { hasPermission, hasAnyPermission } = usePermissions();
  const { isLoadingAuth, user, warehouseId } = useAuthStore();
  const normalizedRole = normalizeRoleSlug(user?.role);
  const isBlockedAdminRole =
    normalizedRole === "USER" || normalizedRole === "CUSTOMER";
  const isBranchScopedOrderUser = canUseBranchOrderRoutes(user, warehouseId);

  const matchedRule = useMemo(
    () =>
      ADMIN_ROUTE_RULES.find((rule) =>
        rule.exact ? pathname === rule.path : pathname.startsWith(rule.path),
      ),
    [pathname],
  );

  const isAllowed = useMemo(() => {
    const isBranchOrderRoute =
      pathname.startsWith("/admin/orders") &&
      !pathname.startsWith("/admin/orders-all") &&
      !pathname.startsWith("/admin/orders/add");

    if (isBranchScopedOrderUser && isBranchOrderRoute) {
      return true;
    }

    if (!matchedRule) {
      return true;
    }
    if (matchedRule.permission) {
      return hasPermission(matchedRule.permission);
    }
    if (matchedRule.anyOf?.length) {
      return hasAnyPermission(matchedRule.anyOf);
    }
    return true;
  }, [
    hasAnyPermission,
    hasPermission,
    isBranchScopedOrderUser,
    matchedRule,
    pathname,
  ]);

  if (isLoadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (isBlockedAdminRole) {
    return (
      <AdminAccessDenied
        title="Bạn không có quyền truy cập"
        description="Tài khoản khách hàng không được phép truy cập khu vực quản trị."
      />
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]">
      <div className="flex min-h-screen">
        <AdminSidebar
          mobileOpen={mobileSidebarOpen}
          onMobileOpenChange={setMobileSidebarOpen}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopHeader onOpenSidebar={() => setMobileSidebarOpen(true)} />
          <main className="flex-1 px-4 py-5 lg:px-6 lg:py-6">
            <div className="mx-auto max-w-[1680px]">
              {isAllowed ? (
                children
              ) : (
                <div className="rounded-[28px] border border-white/80 bg-white/75 p-4 shadow-[0_22px_50px_rgba(15,23,42,0.08)] backdrop-blur">
                  <AdminAccessDenied compact />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
