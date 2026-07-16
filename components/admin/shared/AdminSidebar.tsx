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
import { useAuthStore } from "@/stores/useAuthStore";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { isAdminRole, isManagerRole, normalizeRoleSlug } from "@/lib/roles";
import { canUseBranchOrderRoutes, getOrderListPath } from "@/lib/order-routing";
import {
  ADMIN_ORDER_STATUS_PAGES,
  getAdminOrderStatusHref,
} from "@/lib/admin-order-status-pages";

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
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, accessToken, isLoadingAuth } = useAuthStore();
  const warehouseId = useAuthStore((state) => state.warehouseId);
  const { hasPermission, hasAnyPermission } = usePermissions();
  const role = normalizeRoleSlug(user?.role) || "USER";
  const isAdmin = isAdminRole(user?.role);
  const isManager = role === "MANAGER";
  const isBranchScopedOrderUser = canUseBranchOrderRoutes(user, warehouseId);
  const isBranchAccount = !isAdmin && Boolean(user?.branch?.id || warehouseId);
  const isWarehouseUser =
    (user?.branch?.name?.toLowerCase().includes("kho tổng") ?? false) ||
    warehouseId === 1;
  const canAccessPurchaseRequests =
    isAdmin ||
    (isWarehouseUser &&
      (hasPermission(P.PURCHASE_REQUEST_VIEW) ||
        isManager ||
        isManagerRole(user?.role)));
  const orderListHref = getOrderListPath(user);
  const orderListBasePath = orderListHref.split("?")[0];
  const isAdminOrderDetailActive = /^\/admin\/orders\/\d+$/.test(pathname);
  const isOrderListActive =
    pathname === "/admin/orders" ||
    pathname === orderListBasePath ||
    (isAdmin && isAdminOrderDetailActive) ||
    (pathname.startsWith("/admin/orders-processing") &&
      orderListBasePath === "/admin/orders-processing") ||
    (pathname.startsWith("/admin/orders-all") &&
      orderListBasePath === "/admin/orders-all");
  const canViewSystemSection = hasAnyPermission([
    P.DASHBOARD_VIEW,
    P.REPORT_FINANCE_VIEW,
  ]);
  const canViewAdminSection = hasAnyPermission([
    P.STAFF_VIEW,
    P.BRANCH_VIEW,
    P.ROLE_VIEW,
    P.SUPPLIER_VIEW,
  ]);
  const canViewBusinessSection = hasAnyPermission([
    P.ORDER_VIEW,
    P.VOUCHER_VIEW,
    P.CUSTOMER_VIEW,
  ]);
  const canViewCatalogSection = hasAnyPermission([
    P.PRODUCT_VIEW,
    P.CATEGORY_VIEW,
    P.ATTRIBUTE_VIEW,
  ]);
  const canViewInventorySection = hasAnyPermission([
    P.IMPORT_VIEW,
    P.EXPORT_VIEW,
    P.TRANSFER_VIEW,
    P.CHECK_VIEW,
  ]);
  const canViewProcurementSection =
    !isBranchAccount &&
    hasAnyPermission([P.PURCHASE_REQUEST_VIEW, P.IMPORT_VIEW, P.SUPPLIER_VIEW]);
  const canViewFinanceSection = hasPermission(P.REPORT_FINANCE_VIEW);
  const canViewSettings = hasPermission(P.SETTING_VIEW);
  const canAccessOrderManagement =
    hasPermission(P.ORDER_VIEW) || isBranchScopedOrderUser;

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
        !isBranchAccount && canAccessPurchaseRequests
          ? PurchaseRequestApiService.getAll()
          : Promise.resolve(null),
        !isBranchAccount && hasPermission(P.IMPORT_VIEW)
          ? InventoryApiService.getAllReceipts()
          : Promise.resolve(null),
        hasPermission(P.EXPORT_VIEW)
          ? InventoryExportApiService.getAllExportCommands()
          : Promise.resolve(null),
        hasPermission(P.TRANSFER_VIEW)
          ? transferService.getAll("", "all", 0, 1)
          : Promise.resolve(null),
        hasPermission(P.CHECK_VIEW)
          ? InventoryCheckApiService.getAll()
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
      };

      applyCounts(snapshot);

      try {
        sessionStorage.setItem(SIDEBAR_COUNTS_CACHE_KEY, JSON.stringify(snapshot));
      } catch {}
    } catch (error) {
      console.warn("Sidebar counts sync failed");
    }
  }, [accessToken, applyCounts, canAccessPurchaseRequests, hasPermission, isBranchAccount, isLoadingAuth, user]);

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
              {isAdmin ? "Quản trị viên" : isManager ? "Quản lý" : "Người dùng"}
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
                  active={pathname.startsWith("/admin/orders")}
                >
                  <SidebarLink
                    href={orderListHref}
                    icon={List}
                    label={isAdmin ? "Danh sách đơn hàng" : "Đơn hàng chi nhánh"}
                    active={isOrderListActive}
                    isChild
                  />
                  {isAdmin &&
                    ADMIN_ORDER_STATUS_PAGES.map((page) => {
                      const href = getAdminOrderStatusHref(page.slug);
                      return (
                        <SidebarLink
                          key={page.slug}
                          href={href}
                          icon={List}
                          label={page.label}
                          active={pathname === href}
                          isChild
                        />
                      );
                    })}
                  <SidebarLink
                    href="/admin/orders/return"
                    icon={RotateCcw}
                    label="Trả hàng"
                    active={pathname.startsWith("/admin/orders/return")}
                    isChild
                  />
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
              {hasPermission(P.CHAT_VIEW) && (
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
              {hasPermission(P.IMPORT_VIEW) && (
                <SidebarLink
                  href="/admin/receipts"
                  icon={Warehouse}
                  label="Phiếu nhập hàng"
                  active={isActive("/admin/receipts")}
                  badge={receiptPendingCount}
                  color="text-blue-400"
                />
              )}
              {hasPermission(P.SUPPLIER_VIEW) && !isBranchAccount && (
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
              {hasPermission(P.CATEGORY_VIEW) && !isBranchAccount && (
                <SidebarLink
                  href="/admin/categories"
                  icon={Tags}
                  label="Danh mục"
                  active={isActive("/admin/categories")}
                  badge={categoryCount}
                />
              )}
              {hasPermission(P.PRODUCT_VIEW) && !isBranchAccount && (
                <SidebarLink
                  href="/admin/brands"
                  icon={Building2}
                  label="Thương hiệu"
                  active={isActive("/admin/brands")}
                  badge={brandCount}
                />
              )}
              {hasPermission(P.ATTRIBUTE_VIEW) && !isBranchAccount && (
                <SidebarLink
                  href="/admin/variants"
                  icon={Layers}
                  label="Thuộc tính"
                  active={isActive("/admin/variants")}
                  badge={attributeCount}
                />
              )}
              {!isBranchAccount && (
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

        {isAdmin && (
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

        {canViewInventorySection && (
          <section>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
              Kho vận
            </p>
            <div className="space-y-0.5">
              {hasPermission(P.EXPORT_VIEW) && !isBranchAccount && (
                <SidebarLink
                  href="/admin/exports"
                  icon={ArrowUpFromLine}
                  label="Xuất kho & Trả NCC"
                  active={isActive("/admin/exports")}
                  badge={exportPendingCount}
                />
              )}
              {hasPermission(P.TRANSFER_VIEW) && (
                <SidebarLink
                  href="/admin/transfers"
                  icon={ArrowRightLeft}
                  label="Điều chuyển kho"
                  active={isActive("/admin/transfers")}
                  badge={transferPendingCount}
                />
              )}
              {hasPermission(P.CHECK_VIEW) && (
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
              {hasPermission(P.ROLE_VIEW) && (
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

