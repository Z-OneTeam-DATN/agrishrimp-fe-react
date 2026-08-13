"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  Tags,
  Users,
  UserCircle,
  Building2,
  FileBarChart,
  FileSpreadsheet,
  FlaskConical,
  Settings,
  Truck,
  TrendingUp,
  Warehouse,
  ArrowRightLeft,
  ArrowUpFromLine,
  ShieldCheck,
  ChevronRight,
  ShoppingCart,
  List,
  RotateCcw,
  Ticket,
  Image as ImageIcon,
  BookOpen,
  MessageCircle,
  NotebookPen,
  Stethoscope,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { supplierService } from "@/app/services/supplier.service";
import { customerService } from "@/app/services/customer.service";
import { ProductService } from "@/app/services/product.service";
import { getCategories } from "@/app/services/CategoryService";
import { getAdminBrands } from "@/app/services/brand.service";
import { branchService } from "@/app/services/branchService";
import { EmployeeService } from "@/app/services/employee.service";
import { voucherService } from "@/app/services/voucher.service";
import {
  InventoryApiService,
  InventoryCheckApiService,
  InventoryExportApiService,
} from "@/app/services/inventory.service";
import { transferService } from "@/app/services/transfer.service";
import { PurchaseRequestApiService } from "@/app/services/purchase.service";
import { driverService } from "@/app/services/driver.service";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { ACTIVITY_LOG_PERMISSIONS } from "@/lib/workspace-permissions";
import { isAdminRole } from "@/lib/roles";
import {
  canUseBranchOrderRoutes,
  resolveOrderRouteAccess,
} from "@/lib/order-routing";

const SIDEBAR_COUNTS_CACHE_KEY = "admin_sidebar_counts_v1";
const SIDEBAR_COUNTS_CACHE_TTL_MS = 5 * 60 * 1000;

type SidebarCountsCache = {
  fetchedAt: number;
  supplierCount: number;
  customerCount: number;
  productCount: number;
  categoryCount: number;
  brandCount: number;
  attributeCount: number;
  employeeCount: number;
  branchCount: number;
  voucherCount: number;
  purchaseRequestPendingCount: number;
  receiptPendingCount: number;
  exportPendingCount: number;
  transferPendingCount: number;
  checkPendingCount: number;
  driverCount: number;
};

const PURCHASE_REQUEST_PERMISSIONS = [
  P.PURCHASE_REQUEST_VIEW,
  P.PURCHASE_REQUEST_CREATE,
  P.PURCHASE_REQUEST_UPDATE,
  P.PURCHASE_REQUEST_APPROVE,
  P.PURCHASE_REQUEST_DELETE,
];

const IMPORT_PERMISSIONS = [
  P.IMPORT_VIEW,
  P.IMPORT_CREATE,
  P.IMPORT_UPDATE,
  P.IMPORT_APPROVE,
  P.IMPORT_CANCEL,
  P.IMPORT_DELETE,
];

const EXPORT_PERMISSIONS = [
  P.EXPORT_VIEW,
  P.EXPORT_CREATE,
  P.EXPORT_UPDATE,
  P.EXPORT_APPROVE,
  P.EXPORT_CANCEL,
  P.EXPORT_DELETE,
];

const TRANSFER_PERMISSIONS = [
  P.TRANSFER_VIEW,
  P.TRANSFER_CREATE,
  P.TRANSFER_UPDATE,
  P.TRANSFER_APPROVE,
  P.TRANSFER_CANCEL,
  P.TRANSFER_DELETE,
];

const INVENTORY_CHECK_PERMISSIONS = [
  P.CHECK_CREATE,
  P.CHECK_UPDATE,
  P.CHECK_APPROVE,
  P.CHECK_DELETE,
];

const CUSTOMER_CHAT_PERMISSIONS = [
  P.CUSTOMER_ADVISOR_USE,
  P.CHAT_VIEW,
];

const AI_KNOWLEDGE_SECTION_PERMISSIONS = [
  P.AGRONOMIST_WORKSPACE_USE,
  P.AI_KNOWLEDGE_VIEW,
  P.AI_KNOWLEDGE_CREATE,
  P.AI_KNOWLEDGE_UPDATE,
  P.AI_KNOWLEDGE_APPROVE,
  P.AI_IMPORT_KNOWLEDGE,
  P.AI_CASE_REVIEW,
];

const AI_KNOWLEDGE_DISEASE_PERMISSIONS = [
  P.AGRONOMIST_WORKSPACE_USE,
  P.AI_KNOWLEDGE_VIEW,
  P.AI_KNOWLEDGE_CREATE,
  P.AI_KNOWLEDGE_UPDATE,
  P.AI_IMPORT_KNOWLEDGE,
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, accessToken, isLoadingAuth } = useAuthStore();
  const warehouseId = useAuthStore((state) => state.warehouseId);
  const { hasPermission, hasAnyPermission } = usePermissions();
  const isAdmin = isAdminRole(user?.role);
  const canViewSystemOrders = hasPermission(P.ORDER_VIEW);
  const isBranchScopedOrderUser = canUseBranchOrderRoutes(user, warehouseId);
  const orderRouteAccess = resolveOrderRouteAccess({
    canViewSystemOrders,
    canUseBranchOrders: isBranchScopedOrderUser,
  });
  const isBranchAccount =
    !canViewSystemOrders && Boolean(user?.branch?.id || warehouseId);
  const canAccessPurchaseRequests = hasAnyPermission(PURCHASE_REQUEST_PERMISSIONS);
  const canAccessImports = hasAnyPermission(IMPORT_PERMISSIONS);
  const canAccessExports = hasAnyPermission(EXPORT_PERMISSIONS);
  const canAccessTransfers = hasAnyPermission(TRANSFER_PERMISSIONS);
  const canAccessInventoryChecks = hasAnyPermission(INVENTORY_CHECK_PERMISSIONS);
  const canAccessCustomerChat = hasAnyPermission(CUSTOMER_CHAT_PERMISSIONS);
  const canAccessOrderManagement = orderRouteAccess.canAccessOrderModule;
  const canAccessRoleModule = hasAnyPermission([
    P.ROLE_VIEW,
    P.ROLE_CREATE,
    P.ROLE_UPDATE,
    P.ROLE_DELETE,
  ]);
  const orderListHref = orderRouteAccess.orderListPath;
  const orderListBasePath = orderListHref.split("?")[0];
  const isAdminOrderDetailActive = /^\/admin\/orders\/\d+$/.test(pathname);
  const isOrderListActive =
    pathname === "/admin/orders" ||
    pathname === orderListBasePath ||
    (canViewSystemOrders && isAdminOrderDetailActive) ||
    (pathname.startsWith("/admin/orders-processing") &&
      orderListBasePath === "/admin/orders-processing") ||
    (pathname.startsWith("/admin/orders-all") &&
      orderListBasePath === "/admin/orders-all");
  const canViewAdminSection = hasAnyPermission([
    P.STAFF_VIEW,
    P.BRANCH_VIEW,
    P.ROLE_VIEW,
    P.ROLE_CREATE,
    P.ROLE_UPDATE,
    P.ROLE_DELETE,
    P.SUPPLIER_VIEW,
  ]);
  const canViewBusinessSection =
    canAccessOrderManagement ||
    hasAnyPermission([P.ORDER_VIEW, P.VOUCHER_VIEW, P.CUSTOMER_VIEW]) ||
    canAccessCustomerChat;
  const canViewCatalogSection = hasAnyPermission([
    P.PRODUCT_VIEW,
    P.CATEGORY_VIEW,
    P.ATTRIBUTE_VIEW,
  ]);
  const canViewInventorySection = hasAnyPermission([
    ...IMPORT_PERMISSIONS,
    ...EXPORT_PERMISSIONS,
    ...TRANSFER_PERMISSIONS,
    ...INVENTORY_CHECK_PERMISSIONS,
  ]);
  const canViewProcurementSection = hasAnyPermission([
    ...PURCHASE_REQUEST_PERMISSIONS,
    ...IMPORT_PERMISSIONS,
    P.SUPPLIER_VIEW,
  ]);
  const canViewFinanceSection = hasPermission(P.REPORT_FINANCE_VIEW);
  const canViewActivityLogs = hasAnyPermission(ACTIVITY_LOG_PERMISSIONS as unknown as string[]);
  const canViewSystemSection = canViewActivityLogs || hasAnyPermission([
    P.DASHBOARD_VIEW,
    P.REPORT_FINANCE_VIEW,
  ]);
  const canViewSettings =
    hasPermission(P.SETTING_VIEW) || hasPermission(P.DRIVER_VIEW) || isAdmin;
  const canViewBannerSection = hasPermission(P.BANNER_VIEW);
  const canViewBlogSection = hasAnyPermission([
    P.BLOG_VIEW,
    P.BLOG_CREATE,
    P.BLOG_EDIT,
    P.BLOG_DELETE,
    P.BLOG_APPROVE,
  ]);
  const canManageAiKnowledgeDiseases = hasAnyPermission(
    AI_KNOWLEDGE_DISEASE_PERMISSIONS,
  );
  const canViewAiKnowledgeCategories = hasAnyPermission([
    P.AGRONOMIST_WORKSPACE_USE,
    P.AI_KNOWLEDGE_VIEW,
    P.AI_KNOWLEDGE_CREATE,
    P.AI_KNOWLEDGE_UPDATE,
  ]);
  const canReviewAiCases = hasPermission(P.AI_CASE_REVIEW);
  const canImportAiKnowledge = hasPermission(P.AI_IMPORT_KNOWLEDGE);
  const canApproveAiKnowledge = hasPermission(P.AI_KNOWLEDGE_APPROVE);
  const canViewAiKnowledgeSection = hasAnyPermission(
    AI_KNOWLEDGE_SECTION_PERMISSIONS,
  );
  const workspaceLabel = hasAnyPermission([P.ROLE_VIEW, P.STAFF_VIEW, P.BRANCH_VIEW])
    ? "Quản trị"
    : hasAnyPermission([
          P.PURCHASE_REQUEST_VIEW,
          P.IMPORT_VIEW,
          P.EXPORT_VIEW,
          P.TRANSFER_VIEW,
          P.CHECK_VIEW,
        ])
      ? "Vận hành"
      : "Workspace";

  const [supplierCount, setSupplierCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [brandCount, setBrandCount] = useState(0);
  const [attributeCount, setAttributeCount] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [branchCount, setBranchCount] = useState(0);
  const [voucherCount, setVoucherCount] = useState(0);
  const [purchaseRequestPendingCount, setPurchaseRequestPendingCount] =
    useState(0);
  const [receiptPendingCount, setReceiptPendingCount] = useState(0);
  const [exportPendingCount, setExportPendingCount] = useState(0);
  const [transferPendingCount, setTransferPendingCount] = useState(0);
  const [checkPendingCount, setCheckPendingCount] = useState(0);
  const [driverCount, setDriverCount] = useState(0);
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  const applyCounts = useCallback((snapshot: SidebarCountsCache) => {
    setSupplierCount(snapshot.supplierCount);
    setCustomerCount(snapshot.customerCount);
    setProductCount(snapshot.productCount);
    setCategoryCount(snapshot.categoryCount);
    setBrandCount(snapshot.brandCount);
    setAttributeCount(snapshot.attributeCount);
    setEmployeeCount(snapshot.employeeCount);
    setBranchCount(snapshot.branchCount);
    setVoucherCount(snapshot.voucherCount);
    setPurchaseRequestPendingCount(snapshot.purchaseRequestPendingCount);
    setReceiptPendingCount(snapshot.receiptPendingCount);
    setExportPendingCount(snapshot.exportPendingCount);
    setTransferPendingCount(snapshot.transferPendingCount);
    setCheckPendingCount(snapshot.checkPendingCount);
    setDriverCount(snapshot.driverCount ?? 0);
  }, []);

  useEffect(() => {
    if (
      pathname.startsWith("/admin/orders") ||
      pathname.startsWith("/admin/orders-processing") ||
      pathname.startsWith("/admin/orders-handover")
    ) {
      setOpenGroups((prev) =>
        prev.includes("orders") ? prev : [...prev, "orders"],
      );
    }
  }, [pathname]);

  const fetchCounts = useCallback(async () => {
    if (!accessToken || !user || isLoadingAuth) {
      return;
    }

    try {
      const results = await Promise.allSettled([
        hasPermission(P.SUPPLIER_VIEW) && !isBranchAccount
          ? supplierService.getAll(undefined, undefined, 0, 1)
          : Promise.resolve(null),
        hasPermission(P.CUSTOMER_VIEW)
          ? customerService.getAll("", "all", 0, 1)
          : Promise.resolve(null),
        hasPermission(P.PRODUCT_VIEW)
          ? ProductService.getAll({ status: "ACTIVE" })
          : Promise.resolve(null),
        hasPermission(P.CATEGORY_VIEW) && !isBranchAccount
          ? getCategories().catch(() => [])
          : Promise.resolve(null),
        hasPermission(P.PRODUCT_VIEW) && !isBranchAccount
          ? getAdminBrands().catch(() => [])
          : Promise.resolve(null),
        hasPermission(P.ATTRIBUTE_VIEW) && !isBranchAccount
          ? ProductService.getAttributes()
          : Promise.resolve(null),
        hasPermission(P.STAFF_VIEW)
          ? EmployeeService.getAll({ page: 0, size: 1 })
          : Promise.resolve(null),
        hasPermission(P.BRANCH_VIEW)
          ? branchService.getAll()
          : Promise.resolve(null),
        hasPermission(P.VOUCHER_VIEW)
          ? voucherService.getAllAdmin({ page: 0, size: 1 })
          : Promise.resolve(null),
        canAccessPurchaseRequests
          ? PurchaseRequestApiService.getAll()
          : Promise.resolve(null),
        canAccessImports
          ? InventoryApiService.getAllReceipts()
          : Promise.resolve(null),
        canAccessExports
          ? InventoryExportApiService.getAllExportCommands()
          : Promise.resolve(null),
        canAccessTransfers
          ? transferService.getAll("", "all", 0, 1)
          : Promise.resolve(null),
        canAccessInventoryChecks
          ? InventoryCheckApiService.getAll()
          : Promise.resolve(null),
        hasPermission(P.DRIVER_VIEW)
          ? driverService.getAll(undefined, undefined, 0, 1)
          : Promise.resolve(null),
      ]);

      const [
        supplierResult,
        customerResult,
        productResult,
        categoryResult,
        brandResult,
        attributeResult,
        employeeResult,
        branchResult,
        voucherResult,
        purchaseRequestResult,
        receiptResult,
        exportResult,
        transferResult,
        checkResult,
        driverResult,
      ] = results;

      const supplierValue =
        supplierResult.status === "fulfilled"
          ? (supplierResult.value as any)
          : null;
      const customerValue =
        customerResult.status === "fulfilled"
          ? (customerResult.value as any)
          : null;
      const productValue =
        productResult.status === "fulfilled"
          ? (productResult.value as any)
          : null;
      const categoryValue =
        categoryResult.status === "fulfilled"
          ? (categoryResult.value as any)
          : null;
      const brandValue =
        brandResult.status === "fulfilled"
          ? (brandResult.value as any)
          : null;
      const attributeValue =
        attributeResult.status === "fulfilled"
          ? (attributeResult.value as any)
          : null;
      const employeeValue =
        employeeResult.status === "fulfilled"
          ? (employeeResult.value as any)
          : null;
      const branchValue =
        branchResult.status === "fulfilled"
          ? (branchResult.value as any)
          : null;
      const voucherValue =
        voucherResult.status === "fulfilled"
          ? (voucherResult.value as any)
          : null;

      const nextSupplierCount = supplierValue?.totalElements || 0;
      const nextCustomerCount = customerValue?.totalElements || 0;
      const nextProductCount =
        Array.isArray(productValue)
          ? productValue.length
            : productValue?.totalProducts || 0;
      const nextCategoryCount = Array.isArray(categoryValue) ? categoryValue.length : 0;
      const nextBrandCount = Array.isArray(brandValue) ? brandValue.length : 0;
      const nextAttributeCount =
        Array.isArray(attributeValue) ? attributeValue.length : 0;
      const nextEmployeeCount = employeeValue?.totalElements || 0;
      const nextBranchCount =
        Array.isArray(branchValue)
          ? branchValue.length
          : branchValue?.totalElements || 0;
      const nextVoucherCount =
        voucherValue?.totalElements ||
        (Array.isArray(voucherValue) ? voucherValue.length : 0);

      const purchaseRequests =
        purchaseRequestResult.status === "fulfilled"
          ? Array.isArray(purchaseRequestResult.value)
            ? purchaseRequestResult.value
            : []
          : [];
      const nextPurchaseRequestPendingCount =
        purchaseRequests.filter(
          (item: any) => item.status === "PENDING_APPROVAL",
        ).length;

      const receipts =
        receiptResult.status === "fulfilled"
          ? Array.isArray(receiptResult.value)
            ? receiptResult.value
            : receiptResult.value?.data || receiptResult.value?.content || []
          : [];
      const nextReceiptPendingCount =
        receipts.filter(
          (item: any) => item.status === "PENDING" || item.status === "PO",
        ).length;

      const exportsList =
        exportResult.status === "fulfilled"
          ? Array.isArray(exportResult.value)
            ? exportResult.value
            : exportResult.value?.data || exportResult.value?.content || []
          : [];
      const nextExportPendingCount =
        exportsList.filter(
          (item: any) => item.status === "PENDING" || item.status === "DRAFT",
        ).length;

      const nextTransferPendingCount =
        transferResult.status === "fulfilled"
          ? transferResult.value?.totalElements || 0
          : 0;

      const checks =
        checkResult.status === "fulfilled"
          ? Array.isArray(checkResult.value)
            ? checkResult.value
            : checkResult.value?.data || checkResult.value?.content || []
          : [];
      const nextCheckPendingCount = checks.filter(
        (item: any) => item.status === "PENDING",
      ).length;

      const driverValue =
        driverResult.status === "fulfilled"
          ? (driverResult.value as any)
          : null;
      const nextDriverCount = driverValue?.totalElements || 0;

      const snapshot: SidebarCountsCache = {
        fetchedAt: Date.now(),
        supplierCount: nextSupplierCount,
        customerCount: nextCustomerCount,
        productCount: nextProductCount,
        categoryCount: nextCategoryCount,
        brandCount: nextBrandCount,
        attributeCount: nextAttributeCount,
        employeeCount: nextEmployeeCount,
        branchCount: nextBranchCount,
        voucherCount: nextVoucherCount,
        purchaseRequestPendingCount: nextPurchaseRequestPendingCount,
        receiptPendingCount: nextReceiptPendingCount,
        exportPendingCount: nextExportPendingCount,
        transferPendingCount: nextTransferPendingCount,
        checkPendingCount: nextCheckPendingCount,
        driverCount: nextDriverCount,
      };

      applyCounts(snapshot);

      try {
        sessionStorage.setItem(SIDEBAR_COUNTS_CACHE_KEY, JSON.stringify(snapshot));
      } catch {}
    } catch (error) {
      console.warn("Sidebar counts sync failed");
    }
  }, [
    accessToken,
    applyCounts,
    canAccessExports,
    canAccessImports,
    canAccessInventoryChecks,
    canAccessPurchaseRequests,
    canAccessTransfers,
    hasPermission,
    isLoadingAuth,
    user,
  ]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;
    const browserWindow = window;
    let hasFreshCache = false;

    try {
      const rawCache = sessionStorage.getItem(SIDEBAR_COUNTS_CACHE_KEY);
      if (rawCache) {
        const parsed = JSON.parse(rawCache) as SidebarCountsCache;
        if (parsed && typeof parsed.fetchedAt === "number") {
          applyCounts(parsed);

          if (Date.now() - parsed.fetchedAt < SIDEBAR_COUNTS_CACHE_TTL_MS) {
            hasFreshCache = true;
          }
        }
      }
    } catch {}

    const scheduleFetch = () => {
      timeoutId = globalThis.setTimeout(() => {
        if ("requestIdleCallback" in browserWindow) {
          idleId = browserWindow.requestIdleCallback(
            () => {
              void fetchCounts();
            },
            { timeout: 3000 },
          );
          return;
        }

        void fetchCounts();
      }, 2500);
    };

    if (!hasFreshCache) {
      scheduleFetch();
    }
    const handleUpdate = () => {
      try {
        sessionStorage.removeItem(SIDEBAR_COUNTS_CACHE_KEY);
      } catch {}
      void fetchCounts();
    };
    window.addEventListener("supplierUpdated", handleUpdate);
    window.addEventListener("customerUpdated", handleUpdate);
    window.addEventListener("orderUpdated", handleUpdate);
    window.addEventListener("brandUpdated", handleUpdate);
    window.addEventListener("driverUpdated", handleUpdate);

    return () => {
      if (idleId !== null && "cancelIdleCallback" in browserWindow) {
        browserWindow.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        globalThis.clearTimeout(timeoutId);
      }
      window.removeEventListener("supplierUpdated", handleUpdate);
      window.removeEventListener("customerUpdated", handleUpdate);
      window.removeEventListener("orderUpdated", handleUpdate);
      window.removeEventListener("brandUpdated", handleUpdate);
      window.removeEventListener("driverUpdated", handleUpdate);
    };
  }, [accessToken, fetchCounts]);

  const isActive = (path: string) => {
    if (path === "/admin") return pathname === "/admin";
    if (path === "/admin/employees") {
      return (
        pathname === "/admin/employees" ||
        pathname.startsWith("/admin/employees/add") ||
        pathname.startsWith("/admin/employees/edit")
      );
    }
    if (path === "/admin/employees/roles") {
      return pathname.startsWith("/admin/employees/roles");
    }
    return pathname.startsWith(path);
  };

  const toggleGroup = (groupKey: string) => {
    setOpenGroups((prev) =>
      prev.includes(groupKey)
        ? prev.filter((k) => k !== groupKey)
        : [...prev, groupKey],
    );
  };

  return (
    <div className="w-[260px] bg-[#020617] text-slate-400 h-screen flex flex-col border-r border-slate-800/40 sticky top-0 z-30">
      <div className="h-[64px] px-7 flex items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-700/60 bg-white shadow-lg ring-1 ring-slate-700/50">
            <img
              src="/images/logo_arishrimp.jpg"
              alt="AgriShrimp Logo"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="font-black text-white text-[18px] tracking-[0.15em] leading-none uppercase">
              AGRI<span className="text-blue-500">SHRIMP</span>
            </h1>
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em] mt-1">
              {workspaceLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-6 no-scrollbar pb-10">
        {canViewSystemSection && (
          <section>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
              Hệ thống
            </p>
            <div className="space-y-0.5">
              {hasPermission(P.DASHBOARD_VIEW) && (
                <SidebarLink
                  href="/admin"
                  icon={LayoutDashboard}
                  label="Tổng quan"
                  active={pathname === "/admin"}
                  color="text-blue-500"
                />
              )}
              {canViewFinanceSection && (
                <SidebarLink
                  href="/admin/financial"
                  icon={FileBarChart}
                  label="Tổng quan tài chính"
                  active={pathname.startsWith("/admin/financial")}
                  color="text-emerald-400"
                />
              )}
              {canViewActivityLogs && (
                <SidebarLink
                  href="/admin/activity-logs"
                  icon={History}
                  label="Nhật ký hoạt động"
                  active={isActive("/admin/activity-logs")}
                  color="text-amber-400"
                />
              )}
            </div>
          </section>
        )}

        {canViewBusinessSection && (
          <section>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
              Kinh doanh
            </p>
            <div className="space-y-0.5">
              {canAccessOrderManagement && (
                <SidebarGroup
                  label="Quản lý Đơn hàng"
                  icon={ShoppingCart}
                  isOpen={openGroups.includes("orders")}
                  onToggle={() => toggleGroup("orders")}
                  active={
                    pathname.startsWith("/admin/orders") ||
                    pathname.startsWith("/admin/orders-processing")
                  }
                >
                  <SidebarLink
                    href={orderListHref}
                    icon={List}
                    label={
                      canViewSystemOrders
                        ? "Danh sách đơn hàng"
                        : "Đơn hàng chi nhánh"
                    }
                    active={isOrderListActive}
                    isChild
                  />
                  {canAccessOrderManagement ? (
                    <SidebarLink
                      href="/admin/orders-processing"
                      icon={List}
                      label="Xử lý đơn hàng"
                      active={pathname.startsWith("/admin/orders-processing")}
                      isChild
                    />
                  ) : null}
                  {canAccessOrderManagement ? (
                    <SidebarLink
                      href="/admin/orders/return"
                      icon={RotateCcw}
                      label="Trả hàng"
                      active={pathname.startsWith("/admin/orders/return")}
                      isChild
                    />
                  ) : null}
                  {canViewSystemOrders ? (
                    <SidebarLink
                      href="/admin/orders/incomplete"
                      icon={List}
                      label="Đơn hàng chưa hoàn tất"
                      active={pathname.startsWith("/admin/orders/incomplete")}
                      isChild
                    />
                  ) : null}
                </SidebarGroup>
              )}

              {hasPermission(P.VOUCHER_VIEW) && (
                <SidebarLink
                  href="/admin/vouchers"
                  icon={Ticket}
                  label="Khuyến mãi"
                  active={isActive("/admin/vouchers")}
                  color="text-pink-400"
                />
              )}
              {hasPermission(P.CUSTOMER_VIEW) && (
                <SidebarLink
                  href="/admin/customers"
                  icon={Users}
                  label="Khách hàng"
                  active={isActive("/admin/customers")}
                  badge={customerCount}
                  color="text-blue-400"
                />
              )}
              {canAccessCustomerChat && (
                <SidebarLink
                  href="/admin/chat"
                  icon={MessageCircle}
                  label="Chat khách hàng"
                  active={isActive("/admin/chat")}
                  color="text-blue-400"
                />
              )}
            </div>
          </section>
        )}

        {canViewProcurementSection && (
          <section>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
              Yêu cầu nhập hàng
            </p>
            <div className="space-y-0.5">
              {canAccessPurchaseRequests && (
                <SidebarLink
                  href="/admin/purchase-requests"
                  icon={ShoppingCart}
                  label="Yêu cầu nhập NCC"
                  active={isActive("/admin/purchase-requests")}
                  badge={purchaseRequestPendingCount}
                  color="text-indigo-400"
                />
              )}
              {canAccessImports && (
                <SidebarLink
                  href="/admin/receipts"
                  icon={Warehouse}
                  label="Phiếu nhập hàng"
                  active={isActive("/admin/receipts")}
                  badge={receiptPendingCount}
                  color="text-blue-400"
                />
              )}
              {hasPermission(P.SUPPLIER_VIEW) && (
                <SidebarLink
                  href="/admin/suppliers"
                  icon={Truck}
                  label="Nhà cung cấp"
                  active={isActive("/admin/suppliers")}
                  badge={supplierCount}
                  color="text-orange-400"
                />
              )}

            </div>
          </section>
        )}

        {canViewCatalogSection && (
          <section>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
              Hàng hóa
            </p>

            <div className="space-y-0.5">
              {hasPermission(P.PRODUCT_VIEW) && (
                <SidebarLink
                  href="/admin/products"
                  icon={Package}
                  label="Sản phẩm"
                  active={isActive("/admin/products")}
                  badge={productCount}
                />
              )}
              {hasPermission(P.CATEGORY_VIEW) && (
                <SidebarLink
                  href="/admin/categories"
                  icon={Tags}
                  label="Danh mục"
                  active={isActive("/admin/categories")}
                  badge={categoryCount}
                />
              )}
              {hasPermission(P.PRODUCT_VIEW) && (
                <SidebarLink
                  href="/admin/brands"
                  icon={Building2}
                  label="Thương hiệu"
                  active={isActive("/admin/brands")}
                  badge={brandCount}
                />
              )}
              {hasPermission(P.ATTRIBUTE_VIEW) && (
                <SidebarLink
                  href="/admin/variants"
                  icon={Layers}
                  label="Thuộc tính"
                  active={isActive("/admin/variants")}
                  badge={attributeCount}
                />
              )}
              {canViewBannerSection && (
                <SidebarLink
                  href="/admin/banners"
                  icon={ImageIcon}
                  label="Banner"
                  active={isActive("/admin/banners")}
                />
              )}
            </div>
          </section>
        )}

        {canViewBlogSection && (
          <section>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
              Blog
            </p>
            <div className="space-y-0.5">
              <SidebarLink
                href="/admin/blog/posts"
                icon={BookOpen}
                label="Bài viết"
                active={isActive("/admin/blog/posts")}
                color="text-violet-400"
              />
              <SidebarLink
                href="/admin/blog/categories"
                icon={Tags}
                label="Danh mục blog"
                active={isActive("/admin/blog/categories")}
                color="text-violet-400"
              />
            </div>
          </section>
        )}

        {canViewAiKnowledgeSection && (
          <section>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
              AI Doctor
            </p>
            <div className="space-y-0.5">
              {canManageAiKnowledgeDiseases && (
                <SidebarLink
                  href="/admin/ai-knowledge/diseases"
                  icon={NotebookPen}
                  label="Quản lý phác đồ"
                  active={isActive("/admin/ai-knowledge/diseases")}
                  color="text-emerald-400"
                />
              )}
              {canViewAiKnowledgeCategories && (
                <SidebarLink
                  href="/admin/ai-knowledge/categories"
                  icon={Tags}
                  label="Danh mục bệnh"
                  active={isActive("/admin/ai-knowledge/categories")}
                  color="text-emerald-400"
                />
              )}
              {canReviewAiCases && (
                <SidebarLink
                  href="/admin/ai-knowledge/review"
                  icon={Stethoscope}
                  label="Câu hỏi chưa đáp"
                  active={isActive("/admin/ai-knowledge/review")}
                  color="text-emerald-400"
                />
              )}
              {canImportAiKnowledge && (
                <SidebarLink
                  href="/admin/ai-knowledge/import"
                  icon={FileSpreadsheet}
                  label="Import Excel"
                  active={isActive("/admin/ai-knowledge/import")}
                  color="text-emerald-400"
                />
              )}
              {canApproveAiKnowledge && (
                <>
                  <SidebarLink
                    href="/admin/ai-knowledge/approvals"
                    icon={ShieldCheck}
                    label="Duyệt phác đồ"
                    active={isActive("/admin/ai-knowledge/approvals")}
                    color="text-emerald-400"
                  />
                  <SidebarLink
                    href="/admin/ai-knowledge/tester"
                    icon={FlaskConical}
                    label="Chat thử nghiệm"
                    active={isActive("/admin/ai-knowledge/tester")}
                    color="text-emerald-400"
                  />
                </>
              )}
            </div>
          </section>
        )}

        {canViewInventorySection && (
          <section>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
              Kho vận
            </p>
            <div className="space-y-0.5">
              {canAccessExports && (
                <SidebarLink
                  href="/admin/exports"
                  icon={ArrowUpFromLine}
                  label="Xuất kho & Trả NCC"
                  active={isActive("/admin/exports")}
                  badge={exportPendingCount}
                />
              )}
              {canAccessTransfers && (
                <SidebarLink
                  href="/admin/transfers"
                  icon={ArrowRightLeft}
                  label="Điều chuyển kho"
                  active={isActive("/admin/transfers")}
                  badge={transferPendingCount}
                />
              )}
              {canAccessInventoryChecks && (
                <SidebarLink
                  href="/admin/inventory-checks"
                  icon={ShieldCheck}
                  label="Kiểm kê kho"
                  active={isActive("/admin/inventory-checks")}
                  badge={checkPendingCount}
                />
              )}
            </div>
          </section>
        )}



        {hasAnyPermission([
          P.REPORT_REVENUE_VIEW,
          P.REPORT_INVENTORY_VIEW,
        ]) && (
          <section>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
              Báo cáo
            </p>
            <div className="space-y-0.5">
              {hasPermission(P.REPORT_REVENUE_VIEW) && (
                <SidebarLink
                  href="/admin/reports/sales"
                  icon={TrendingUp}
                  label="Doanh thu"
                  active={isActive("/admin/reports/sales")}
                  color="text-blue-500"
                />
              )}
              {hasPermission(P.REPORT_INVENTORY_VIEW) && (
                <SidebarLink
                  href="/admin/reports/inventory"
                  icon={Warehouse}
                  label="Nhập xuất tồn"
                  active={isActive("/admin/reports/inventory")}
                  color="text-amber-500"
                />
              )}
            </div>
          </section>
        )}

        {canViewAdminSection && (
          <section>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
              Quản trị
            </p>
            <div className="space-y-0.5">
              {hasPermission(P.STAFF_VIEW) && (
                <SidebarLink
                  href="/admin/employees"
                  icon={UserCircle}
                  label="Nhân viên"
                  active={isActive("/admin/employees")}
                />
              )}
              {hasPermission(P.BRANCH_VIEW) && (
                <SidebarLink
                  href="/admin/branches"
                  icon={Building2}
                  label="Chi nhánh & Kho"
                  active={isActive("/admin/branches")}
                />
              )}
              {canAccessRoleModule && (
                <SidebarLink
                  href="/admin/employees/roles"
                  icon={ShieldCheck}
                  label="Vai trò & Quyền"
                  active={isActive("/admin/employees/roles")}
                  color="text-violet-400"
                />
              )}
            </div>
          </section>
        )}
      </div>

      <div className="p-4 mt-auto border-t border-slate-800/40 bg-[#020617]/50">
        {canViewSettings && (
          <SidebarLink
            href="/admin/settings"
            icon={Settings}
            label="Cài đặt"
            active={isActive("/admin/settings")}
          />
        )}
      </div>
    </div>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  active,
  badge,
  color,
  badgeColor,
  isChild,
}: any) {
  const router = useRouter();
  const canPrefetch = typeof href === "string" && href.startsWith("/");

  return (
    <Link
      href={href}
      prefetch={false}
      onMouseEnter={() => {
        if (canPrefetch) {
          router.prefetch(href);
        }
      }}
      onFocus={() => {
        if (canPrefetch) {
          router.prefetch(href);
        }
      }}
      className={cn(
        "flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-200 group relative",
        active
          ? "bg-slate-800/60 text-white shadow-sm"
          : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200",
        isChild && "pl-3 py-1.5 text-[12px]",
      )}
    >
      {active && !isChild && (
        <div className="absolute left-0 w-1 h-4 bg-blue-500 rounded-r-full" />
      )}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "rounded-md transition-colors",
            isChild ? "p-0 bg-transparent" : "p-1",
            active && !isChild
              ? "bg-slate-700"
              : "bg-transparent group-hover:bg-slate-800",
          )}
        >
          <Icon
            size={isChild ? 14 : 16}
            className={cn(
              active
                ? color || "text-blue-400"
                : "text-slate-500 group-hover:text-slate-400",
            )}
          />
        </div>
        <span className="truncate">{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <Badge
          className={cn(
            "border-none text-[10px] h-4.5 px-1.5 font-black",
            active
              ? "bg-white text-blue-600"
              : "bg-blue-500/10 text-blue-400",
          )}
        >
          {badge}
        </Badge>
      )}
    </Link>
  );
}

function SidebarGroup({
  icon: Icon,
  label,
  children,
  isOpen,
  onToggle,
  active,
}: any) {
  return (
    <div className="space-y-0.5">
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-200 group relative select-none",
          active
            ? "text-blue-400 bg-slate-800/20"
            : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200",
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-1 rounded-md transition-colors",
              active
                ? "bg-slate-800/50"
                : "bg-transparent group-hover:bg-slate-800",
            )}
          >
            <Icon
              size={16}
              className={cn(
                active
                  ? "text-blue-400"
                  : "text-slate-500 group-hover:text-slate-400",
              )}
            />
          </div>
          <span className="truncate">{label}</span>
        </div>
        <ChevronRight
          size={14}
          className={cn(
            "transition-transform duration-200 text-slate-600",
            isOpen && "rotate-90",
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="pl-2 space-y-0.5 border-l border-slate-800/60 ml-5 mt-1 mb-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

