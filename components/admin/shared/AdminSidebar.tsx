"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  ArrowRightLeft,
  ArrowUpFromLine,
  BookOpen,
  Building2,
  ChevronRight,
  ClipboardList,
  FileBarChart,
  HelpCircle,
  Image as ImageIcon,
  LayoutDashboard,
  Layers,
  List,
  Package,
  RotateCcw,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tags,
  Ticket,
  TrendingUp,
  Truck,
  UserCircle,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { supplierService } from "@/app/services/supplier.service";
import { customerService } from "@/app/services/customer.service";
import { ProductService } from "@/app/services/product.service";
import { getCategories } from "@/app/services/CategoryService";
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

type AdminSidebarProps = {
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
};

type SidebarCounts = {
  attributeCount: number;
  branchCount: number;
  categoryCount: number;
  checkPendingCount: number;
  customerCount: number;
  employeeCount: number;
  exportPendingCount: number;
  productCount: number;
  purchaseRequestPendingCount: number;
  receiptPendingCount: number;
  supplierCount: number;
  transferPendingCount: number;
  voucherCount: number;
};

type CountResult = {
  totalElements?: number;
  totalProducts?: number;
};

type StatusItem = {
  status?: string;
};

function getTotalElements(value: CountResult | unknown[] | null) {
  if (!value || Array.isArray(value)) {
    return 0;
  }
  return value.totalElements || 0;
}

function getCollectionLength(value: unknown[] | null) {
  return Array.isArray(value) ? value.length : 0;
}

function getProductCount(value: CountResult | unknown[] | null) {
  if (Array.isArray(value)) {
    return value.length;
  }
  return value?.totalProducts || 0;
}

const EMPTY_COUNTS: SidebarCounts = {
  attributeCount: 0,
  branchCount: 0,
  categoryCount: 0,
  checkPendingCount: 0,
  customerCount: 0,
  employeeCount: 0,
  exportPendingCount: 0,
  productCount: 0,
  purchaseRequestPendingCount: 0,
  receiptPendingCount: 0,
  supplierCount: 0,
  transferPendingCount: 0,
  voucherCount: 0,
};

export default function AdminSidebar({
  mobileOpen = false,
  onMobileOpenChange,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
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
  const isOrderListActive =
    pathname === "/admin/orders" ||
    pathname === "/admin/orders-all" ||
    (pathname.startsWith("/admin/orders/") && !pathname.includes("return"));

  const canViewSystemSection = hasAnyPermission([
    P.DASHBOARD_VIEW,
    P.WORKSPACE_VIEW,
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

  const [counts, setCounts] = useState<SidebarCounts>(EMPTY_COUNTS);
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  useEffect(() => {
    if (pathname.startsWith("/admin/orders")) {
      setOpenGroups((prev) =>
        prev.includes("orders") ? prev : [...prev, "orders"],
      );
    }
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    const fetchCounts = async () => {
      try {
        const results = await Promise.allSettled([
          hasPermission(P.SUPPLIER_VIEW)
            ? supplierService.getAll(undefined, undefined, 0, 1)
            : Promise.resolve(null),
          hasPermission(P.CUSTOMER_VIEW)
            ? customerService.getAll("", "all", 0, 1)
            : Promise.resolve(null),
          hasPermission(P.PRODUCT_VIEW)
            ? ProductService.getAll({ status: "ACTIVE" })
            : Promise.resolve(null),
          hasPermission(P.CATEGORY_VIEW)
            ? getCategories()
            : Promise.resolve(null),
          hasPermission(P.ATTRIBUTE_VIEW)
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

        if (cancelled) {
          return;
        }

        const [
          supplierResult,
          customerResult,
          productResult,
          categoryResult,
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
            ? (supplierResult.value as CountResult | null)
            : null;
        const customerValue =
          customerResult.status === "fulfilled"
            ? (customerResult.value as CountResult | null)
            : null;
        const productValue =
          productResult.status === "fulfilled"
            ? (productResult.value as CountResult | unknown[] | null)
            : null;
        const categoryValue =
          categoryResult.status === "fulfilled"
            ? (categoryResult.value as unknown[] | null)
            : null;
        const attributeValue =
          attributeResult.status === "fulfilled"
            ? (attributeResult.value as unknown[] | null)
            : null;
        const employeeValue =
          employeeResult.status === "fulfilled"
            ? (employeeResult.value as CountResult | null)
            : null;
        const branchValue =
          branchResult.status === "fulfilled"
            ? (branchResult.value as CountResult | unknown[] | null)
            : null;
        const voucherValue =
          voucherResult.status === "fulfilled"
            ? (voucherResult.value as CountResult | unknown[] | null)
            : null;

        const purchaseRequests =
          purchaseRequestResult.status === "fulfilled" &&
          Array.isArray(purchaseRequestResult.value)
            ? (purchaseRequestResult.value as StatusItem[])
            : [];
        const receipts =
          receiptResult.status === "fulfilled"
            ? Array.isArray(receiptResult.value)
              ? (receiptResult.value as StatusItem[])
              : ((receiptResult.value?.data ||
                  receiptResult.value?.content ||
                  []) as StatusItem[])
            : [];
        const exportsList =
          exportResult.status === "fulfilled"
            ? Array.isArray(exportResult.value)
              ? (exportResult.value as StatusItem[])
              : ((exportResult.value?.data ||
                  exportResult.value?.content ||
                  []) as StatusItem[])
            : [];
        const checks =
          checkResult.status === "fulfilled"
            ? Array.isArray(checkResult.value)
              ? (checkResult.value as StatusItem[])
              : ((checkResult.value?.data ||
                  checkResult.value?.content ||
                  []) as StatusItem[])
            : [];

        setCounts({
          attributeCount: getCollectionLength(attributeValue),
          branchCount: Array.isArray(branchValue)
            ? branchValue.length
            : getTotalElements(branchValue),
          categoryCount: getCollectionLength(categoryValue),
          checkPendingCount: checks.filter((item) => item.status === "PENDING").length,
          customerCount: getTotalElements(customerValue),
          employeeCount: getTotalElements(employeeValue),
          exportPendingCount: exportsList.filter(
            (item) => item.status === "PENDING" || item.status === "DRAFT",
          ).length,
          productCount: getProductCount(productValue),
          purchaseRequestPendingCount: purchaseRequests.filter(
            (item) => item.status === "PENDING_APPROVAL",
          ).length,
          receiptPendingCount: receipts.filter(
            (item) => item.status === "PENDING" || item.status === "PO",
          ).length,
          supplierCount: getTotalElements(supplierValue),
          transferPendingCount:
            transferResult.status === "fulfilled"
              ? transferResult.value?.totalElements || 0
              : 0,
          voucherCount: Array.isArray(voucherValue)
            ? voucherValue.length
            : getTotalElements(voucherValue),
        });
      } catch {
        console.warn("Sidebar counts sync failed");
      }
    };

    fetchCounts();

    const handleUpdate = () => fetchCounts();
    window.addEventListener("supplierUpdated", handleUpdate);
    window.addEventListener("customerUpdated", handleUpdate);
    window.addEventListener("orderUpdated", handleUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener("supplierUpdated", handleUpdate);
      window.removeEventListener("customerUpdated", handleUpdate);
      window.removeEventListener("orderUpdated", handleUpdate);
    };
  }, [
    canAccessPurchaseRequests,
    hasPermission,
    isBranchAccount,
    isWarehouseUser,
  ]);

  const sidebarRoleLabel = isAdmin
    ? "Administrator"
    : isManager
      ? "Manager"
      : "Nhân sự vận hành";

  const activeTasks = useMemo(
    () =>
      [
        {
          label: "Yêu cầu nhập hàng chờ duyệt",
          value: counts.purchaseRequestPendingCount,
          href: "/admin/purchase-requests",
        },
        {
          label: "Phiếu nhập cần xử lý",
          value: counts.receiptPendingCount,
          href: "/admin/receipts",
        },
        {
          label: "Phiếu xuất chờ hoàn tất",
          value: counts.exportPendingCount,
          href: "/admin/exports",
        },
        {
          label: "Điều chuyển cần theo dõi",
          value: counts.transferPendingCount,
          href: "/admin/transfers",
        },
        {
          label: "Kiểm kê đang mở",
          value: counts.checkPendingCount,
          href: "/admin/inventory-checks",
        },
      ].filter((item) => item.value > 0),
    [counts],
  );

  const isActive = (path: string) => {
    if (path === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(path);
  };

  const toggleGroup = (groupKey: string) => {
    setOpenGroups((prev) =>
      prev.includes(groupKey)
        ? prev.filter((key) => key !== groupKey)
        : [...prev, groupKey],
    );
  };

  const closeMobileSidebar = () => onMobileOpenChange?.(false);

  return (
    <>
      <aside className="hidden lg:flex lg:w-[300px] lg:flex-col lg:border-r lg:border-slate-200/80 lg:bg-slate-950 lg:text-slate-300">
        <SidebarShell
          activeTasks={activeTasks}
          canAccessOrderManagement={canAccessOrderManagement}
          canAccessPurchaseRequests={canAccessPurchaseRequests}
          canViewAdminSection={canViewAdminSection}
          canViewBusinessSection={canViewBusinessSection}
          canViewCatalogSection={canViewCatalogSection}
          canViewFinanceSection={canViewFinanceSection}
          canViewInventorySection={canViewInventorySection}
          canViewProcurementSection={canViewProcurementSection}
          canViewSettings={canViewSettings}
          canViewSystemSection={canViewSystemSection}
          counts={counts}
          hasAnyPermission={hasAnyPermission}
          hasPermission={hasPermission}
          isActive={isActive}
          isAdmin={isAdmin}
          isBranchAccount={isBranchAccount}
          isOrderListActive={isOrderListActive}
          onLinkClick={undefined}
          onToggleGroup={toggleGroup}
          openGroups={openGroups}
          orderListHref={orderListHref}
          roleLabel={sidebarRoleLabel}
        />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent
          side="left"
          className="w-[92vw] max-w-[360px] border-r border-slate-800 bg-slate-950 p-0 text-slate-300"
        >
          <div className="sr-only">
            <SheetTitle>Điều hướng quản trị</SheetTitle>
            <SheetDescription>
              Truy cập nhanh các nhóm chức năng quản trị.
            </SheetDescription>
          </div>
          <SidebarShell
            activeTasks={activeTasks}
            canAccessOrderManagement={canAccessOrderManagement}
            canAccessPurchaseRequests={canAccessPurchaseRequests}
            canViewAdminSection={canViewAdminSection}
            canViewBusinessSection={canViewBusinessSection}
            canViewCatalogSection={canViewCatalogSection}
            canViewFinanceSection={canViewFinanceSection}
            canViewInventorySection={canViewInventorySection}
            canViewProcurementSection={canViewProcurementSection}
            canViewSettings={canViewSettings}
            canViewSystemSection={canViewSystemSection}
            counts={counts}
            hasAnyPermission={hasAnyPermission}
            hasPermission={hasPermission}
            isActive={isActive}
            isAdmin={isAdmin}
            isBranchAccount={isBranchAccount}
            isOrderListActive={isOrderListActive}
            onLinkClick={closeMobileSidebar}
            onToggleGroup={toggleGroup}
            openGroups={openGroups}
            orderListHref={orderListHref}
            roleLabel={sidebarRoleLabel}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

type SidebarShellProps = {
  activeTasks: Array<{ href: string; label: string; value: number }>;
  canAccessOrderManagement: boolean;
  canAccessPurchaseRequests: boolean;
  canViewAdminSection: boolean;
  canViewBusinessSection: boolean;
  canViewCatalogSection: boolean;
  canViewFinanceSection: boolean;
  canViewInventorySection: boolean;
  canViewProcurementSection: boolean;
  canViewSettings: boolean;
  canViewSystemSection: boolean;
  counts: SidebarCounts;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  isActive: (path: string) => boolean;
  isAdmin: boolean;
  isBranchAccount: boolean;
  isOrderListActive: boolean;
  onLinkClick?: () => void;
  onToggleGroup: (groupKey: string) => void;
  openGroups: string[];
  orderListHref: string;
  roleLabel: string;
};

function SidebarShell({
  activeTasks,
  canAccessOrderManagement,
  canAccessPurchaseRequests,
  canViewAdminSection,
  canViewBusinessSection,
  canViewCatalogSection,
  canViewFinanceSection,
  canViewInventorySection,
  canViewProcurementSection,
  canViewSettings,
  canViewSystemSection,
  counts,
  hasAnyPermission,
  hasPermission,
  isActive,
  isAdmin,
  isBranchAccount,
  isOrderListActive,
  onLinkClick,
  onToggleGroup,
  openGroups,
  orderListHref,
  roleLabel,
}: SidebarShellProps) {
  return (
    <div className="flex h-screen flex-col">
      <div className="border-b border-slate-800/80 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_42%),linear-gradient(180deg,#020617_0%,#020617_100%)] px-5 pb-5 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-9 w-9 rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-400/30" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-300/80">
                  AgriShrimp
                </p>
                <h1 className="text-lg font-black tracking-tight text-white">
                  Admin Workspace
                </h1>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-300">
              Điều hướng theo đúng luồng vận hành, kho và quản trị.
            </p>
          </div>
          <Badge className="border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-200">
            {roleLabel}
          </Badge>
        </div>

        <div className="mt-4 rounded-2xl border border-white/8 bg-white/5 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Việc cần chú ý
              </p>
              <p className="mt-1 text-2xl font-black text-white">
                {activeTasks.length}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
              Theo dõi đầu ca
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {activeTasks.length > 0 ? (
              activeTasks.slice(0, 3).map((task) => (
                <Link
                  key={task.href}
                  href={task.href}
                  onClick={onLinkClick}
                  className="flex items-center justify-between rounded-xl border border-white/6 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 transition hover:border-emerald-400/30 hover:bg-slate-900"
                >
                  <span className="line-clamp-1">{task.label}</span>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-200">
                    {task.value}
                  </span>
                </Link>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-700 px-3 py-3 text-sm text-slate-400">
                Hiện chưa có đầu việc tồn đọng nổi bật.
              </div>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-5">
        <div className="space-y-6 pb-8">
          {canViewSystemSection && (
            <SidebarSection title="Hệ thống">
              {hasPermission(P.DASHBOARD_VIEW) && (
                <SidebarLink
                  href="/admin"
                  icon={LayoutDashboard}
                  label="Tổng quan"
                  description="Theo dõi nhanh toàn bộ hệ thống"
                  active={isActive("/admin")}
                  color="text-emerald-300"
                  onClick={onLinkClick}
                />
              )}
              {hasPermission(P.WORKSPACE_VIEW) && (
                <SidebarLink
                  href="/admin/inventory-dashboard"
                  icon={ClipboardList}
                  label="Bàn làm việc kho"
                  description="Theo dõi điều phối vận hành kho"
                  active={isActive("/admin/inventory-dashboard")}
                  color="text-amber-300"
                  onClick={onLinkClick}
                />
              )}
            </SidebarSection>
          )}

          {canViewBusinessSection && (
            <SidebarSection title="Kinh doanh">
              {canAccessOrderManagement && (
                <SidebarGroup
                  label="Quản lý đơn hàng"
                  description="Từ duyệt đơn đến hoàn tất giao"
                  icon={ShoppingCart}
                  isOpen={openGroups.includes("orders")}
                  onToggle={() => onToggleGroup("orders")}
                  active={isActive("/admin/orders")}
                >
                  <SidebarLink
                    href={orderListHref}
                    icon={List}
                    label={isAdmin ? "Tất cả đơn hàng" : "Đơn hàng chi nhánh"}
                    active={isOrderListActive}
                    isChild
                    onClick={onLinkClick}
                  />
                  <SidebarLink
                    href="/admin/orders/return"
                    icon={RotateCcw}
                    label="Trả hàng"
                    active={isActive("/admin/orders/return")}
                    isChild
                    onClick={onLinkClick}
                  />
                </SidebarGroup>
              )}
              {hasPermission(P.VOUCHER_VIEW) && (
                <SidebarLink
                  href="/admin/vouchers"
                  icon={Ticket}
                  label="Khuyến mãi & Voucher"
                  description="Kiểm soát chương trình bán hàng"
                  active={isActive("/admin/vouchers")}
                  badge={counts.voucherCount}
                  color="text-pink-300"
                  onClick={onLinkClick}
                />
              )}
              {hasPermission(P.CUSTOMER_VIEW) && (
                <SidebarLink
                  href="/admin/customers"
                  icon={Users}
                  label="Khách hàng"
                  description="Chăm sóc và tra cứu hồ sơ mua hàng"
                  active={isActive("/admin/customers")}
                  badge={counts.customerCount}
                  color="text-sky-300"
                  onClick={onLinkClick}
                />
              )}
            </SidebarSection>
          )}

          {canViewProcurementSection && (
            <SidebarSection title="Mua hàng">
              {canAccessPurchaseRequests && (
                <SidebarLink
                  href="/admin/purchase-requests"
                  icon={ShoppingCart}
                  label="Yêu cầu nhập NCC"
                  description="Khởi tạo và duyệt nhu cầu nhập hàng"
                  active={isActive("/admin/purchase-requests")}
                  badge={counts.purchaseRequestPendingCount}
                  color="text-indigo-300"
                  onClick={onLinkClick}
                />
              )}
              {hasPermission(P.IMPORT_VIEW) && (
                <SidebarLink
                  href="/admin/receipts"
                  icon={Warehouse}
                  label="Phiếu nhập hàng"
                  description="Tiếp nhận và đối soát phiếu nhập"
                  active={isActive("/admin/receipts")}
                  badge={counts.receiptPendingCount}
                  color="text-emerald-300"
                  onClick={onLinkClick}
                />
              )}
              {hasPermission(P.SUPPLIER_VIEW) && !isBranchAccount && (
                <SidebarLink
                  href="/admin/suppliers"
                  icon={Truck}
                  label="Nhà cung cấp"
                  description="Quản lý đối tác cung ứng"
                  active={isActive("/admin/suppliers")}
                  badge={counts.supplierCount}
                  color="text-orange-300"
                  onClick={onLinkClick}
                />
              )}
            </SidebarSection>
          )}

          {canViewCatalogSection && (
            <SidebarSection title="Hàng hóa">
              {hasPermission(P.PRODUCT_VIEW) && (
                <SidebarLink
                  href="/admin/products"
                  icon={Package}
                  label="Sản phẩm"
                  description="Danh mục hàng đang kinh doanh"
                  active={isActive("/admin/products")}
                  badge={counts.productCount}
                  color="text-emerald-300"
                  onClick={onLinkClick}
                />
              )}
              {hasPermission(P.CATEGORY_VIEW) && !isBranchAccount && (
                <SidebarLink
                  href="/admin/categories"
                  icon={Tags}
                  label="Danh mục"
                  description="Quản lý nhóm hàng và phân loại"
                  active={isActive("/admin/categories")}
                  badge={counts.categoryCount}
                  color="text-amber-200"
                  onClick={onLinkClick}
                />
              )}
              {hasPermission(P.ATTRIBUTE_VIEW) && !isBranchAccount && (
                <SidebarLink
                  href="/admin/variants"
                  icon={Layers}
                  label="Thuộc tính"
                  description="Kích thước, loại, biến thể sản phẩm"
                  active={isActive("/admin/variants")}
                  badge={counts.attributeCount}
                  color="text-cyan-200"
                  onClick={onLinkClick}
                />
              )}
              {!isBranchAccount && (
                <SidebarLink
                  href="/admin/banners"
                  icon={ImageIcon}
                  label="Banner"
                  description="Nội dung truyền thông ở trang public"
                  active={isActive("/admin/banners")}
                  color="text-fuchsia-200"
                  onClick={onLinkClick}
                />
              )}
            </SidebarSection>
          )}

          {isAdmin && (
            <SidebarSection title="Blog">
              <SidebarLink
                href="/admin/blog/posts"
                icon={BookOpen}
                label="Bài viết"
                description="Quản lý nội dung và bài đăng"
                active={isActive("/admin/blog/posts")}
                color="text-violet-300"
                onClick={onLinkClick}
              />
              <SidebarLink
                href="/admin/blog/categories"
                icon={Tags}
                label="Danh mục blog"
                description="Nhóm chủ đề cho bài viết"
                active={isActive("/admin/blog/categories")}
                color="text-violet-200"
                onClick={onLinkClick}
              />
            </SidebarSection>
          )}

          {canViewInventorySection && (
            <SidebarSection title="Kho vận">
              {hasPermission(P.EXPORT_VIEW) && !isBranchAccount && (
                <SidebarLink
                  href="/admin/exports"
                  icon={ArrowUpFromLine}
                  label="Xuất kho & Trả NCC"
                  description="Xử lý đơn xuất và trả hàng nhà cung cấp"
                  active={isActive("/admin/exports")}
                  badge={counts.exportPendingCount}
                  color="text-sky-300"
                  onClick={onLinkClick}
                />
              )}
              {hasPermission(P.TRANSFER_VIEW) && (
                <SidebarLink
                  href="/admin/transfers"
                  icon={ArrowRightLeft}
                  label="Điều chuyển kho"
                  description="Cân bằng tồn kho giữa các điểm"
                  active={isActive("/admin/transfers")}
                  badge={counts.transferPendingCount}
                  color="text-amber-200"
                  onClick={onLinkClick}
                />
              )}
              {hasPermission(P.CHECK_VIEW) && (
                <SidebarLink
                  href="/admin/inventory-checks"
                  icon={ShieldCheck}
                  label="Kiểm kê kho"
                  description="Đối chiếu tồn thực tế và xử lý chênh lệch"
                  active={isActive("/admin/inventory-checks")}
                  badge={counts.checkPendingCount}
                  color="text-emerald-200"
                  onClick={onLinkClick}
                />
              )}
            </SidebarSection>
          )}

          {canViewFinanceSection && (
            <SidebarSection title="Tài chính">
              <SidebarLink
                href="/admin/financial"
                icon={FileBarChart}
                label="Tổng quan tài chính"
                description="Theo dõi doanh thu, chi phí, công nợ"
                active={isActive("/admin/financial")}
                color="text-emerald-300"
                onClick={onLinkClick}
              />
              {!isBranchAccount && (
                <SidebarLink
                  href="/admin/financial/supplier-debt"
                  icon={Truck}
                  label="Công nợ NCC"
                  description="Kiểm soát thanh toán nhà cung cấp"
                  active={isActive("/admin/financial/supplier-debt")}
                  color="text-orange-300"
                  onClick={onLinkClick}
                />
              )}
              <SidebarLink
                href="/admin/financial/cashbook"
                icon={Archive}
                label="Sổ quỹ / Tiền chi"
                description="Theo dõi thu chi hằng ngày"
                active={isActive("/admin/financial/cashbook")}
                color="text-sky-300"
                onClick={onLinkClick}
              />
              <SidebarLink
                href="/admin/financial/profit-loss"
                icon={TrendingUp}
                label="Lãi lỗ"
                description="Đánh giá hiệu quả kinh doanh"
                active={isActive("/admin/financial/profit-loss")}
                color="text-emerald-300"
                onClick={onLinkClick}
              />
            </SidebarSection>
          )}

          {hasAnyPermission([
            P.REPORT_REVENUE_VIEW,
            P.REPORT_INVENTORY_VIEW,
            P.REPORT_FINANCE_VIEW,
          ]) && (
            <SidebarSection title="Báo cáo">
              {hasPermission(P.REPORT_REVENUE_VIEW) && (
                <SidebarLink
                  href="/admin/reports/sales"
                  icon={TrendingUp}
                  label="Doanh thu"
                  description="Báo cáo doanh số và tăng trưởng"
                  active={isActive("/admin/reports/sales")}
                  color="text-sky-300"
                  onClick={onLinkClick}
                />
              )}
              {hasPermission(P.REPORT_INVENTORY_VIEW) && (
                <SidebarLink
                  href="/admin/reports/inventory"
                  icon={Warehouse}
                  label="Nhập xuất tồn"
                  description="Phân tích tồn kho và biến động hàng"
                  active={isActive("/admin/reports/inventory")}
                  color="text-amber-200"
                  onClick={onLinkClick}
                />
              )}
              {hasPermission(P.REPORT_FINANCE_VIEW) && !isBranchAccount && (
                <SidebarLink
                  href="/admin/financial/profit-loss"
                  icon={FileBarChart}
                  label="Báo cáo tài chính"
                  description="Tổng hợp lợi nhuận và dòng tiền"
                  active={isActive("/admin/financial/profit-loss")}
                  color="text-emerald-200"
                  onClick={onLinkClick}
                />
              )}
            </SidebarSection>
          )}

          {canViewAdminSection && (
            <SidebarSection title="Quản trị">
              {hasPermission(P.STAFF_VIEW) && (
                <SidebarLink
                  href="/admin/employees"
                  icon={UserCircle}
                  label="Nhân viên"
                  description="Hồ sơ nhân sự và trạng thái làm việc"
                  active={isActive("/admin/employees")}
                  badge={counts.employeeCount}
                  color="text-sky-300"
                  onClick={onLinkClick}
                />
              )}
              {hasPermission(P.BRANCH_VIEW) && (
                <SidebarLink
                  href="/admin/branches"
                  icon={Building2}
                  label="Chi nhánh & Kho"
                  description="Cấu hình địa điểm vận hành"
                  active={isActive("/admin/branches")}
                  badge={counts.branchCount}
                  color="text-amber-200"
                  onClick={onLinkClick}
                />
              )}
              {hasPermission(P.ROLE_VIEW) && (
                <SidebarLink
                  href="/admin/employees/roles"
                  icon={ShieldCheck}
                  label="Vai trò & Quyền"
                  description="Phân quyền theo đúng nghiệp vụ"
                  active={isActive("/admin/employees/roles")}
                  color="text-violet-300"
                  onClick={onLinkClick}
                />
              )}
            </SidebarSection>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-slate-800/80 bg-slate-950/90 p-4">
        <div className="space-y-2">
          {canViewSettings && (
            <SidebarLink
              href="/admin/settings"
              icon={Settings}
              label="Cài đặt"
              description="Cấu hình hệ thống và tham số vận hành"
              active={isActive("/admin/settings")}
              onClick={onLinkClick}
            />
          )}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-3">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-slate-800 p-2 text-slate-300">
                <HelpCircle size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  Mẹo sử dụng
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Ưu tiên xử lý các mục có badge và luôn kiểm tra đúng chi nhánh
                  trước khi tạo phiếu.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarSection({
  title,
  children,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section>
      <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.26em] text-slate-500">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  active,
  badge,
  color,
  description,
  isChild,
  onClick,
}: {
  active: boolean;
  badge?: number;
  color?: string;
  description?: string;
  href: string;
  icon: LucideIcon;
  isChild?: boolean;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group relative flex items-center justify-between gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-left transition-all duration-200",
        active
          ? "border-emerald-400/20 bg-white/10 text-white shadow-[0_12px_30px_rgba(2,6,23,0.28)]"
          : "text-slate-300 hover:border-slate-700 hover:bg-white/5 hover:text-white",
        isChild && "rounded-xl py-2",
      )}
    >
      {active && !isChild && (
        <div className="absolute left-0 top-3 h-8 w-1 rounded-r-full bg-emerald-400" />
      )}
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
            active
              ? "border-white/10 bg-slate-900/70"
              : "border-slate-800 bg-slate-900/70 group-hover:border-slate-700",
            isChild && "h-8 w-8 rounded-lg",
          )}
        >
          <Icon
            size={isChild ? 14 : 16}
              className={active ? color || "text-emerald-300" : "text-slate-500 group-hover:text-slate-300"}
            />
        </div>
        <div className="min-w-0">
          <p
            className={cn(
              "truncate text-sm font-semibold",
              isChild && "text-[13px] font-medium",
            )}
          >
            {label}
          </p>
          {!isChild && description ? (
            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {badge !== undefined && badge > 0 && (
        <Badge
          className={cn(
            "border-none px-2 py-1 text-[10px] font-black",
            active
              ? "bg-white text-slate-900"
              : "bg-emerald-500/15 text-emerald-200",
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
  description,
  children,
  isOpen,
  onToggle,
  active,
}: {
  active: boolean;
  children: React.ReactNode;
  description?: string;
  icon: LucideIcon;
  isOpen: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-1">
      <button
        onClick={onToggle}
        className={cn(
          "flex w-full items-center justify-between rounded-2xl border border-transparent px-3 py-2.5 text-left transition-all duration-200",
          active
            ? "bg-white/8 text-white"
            : "text-slate-300 hover:border-slate-700 hover:bg-white/5 hover:text-white",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
              active
                ? "border-white/10 bg-slate-900/70"
                : "border-slate-800 bg-slate-900/70",
            )}
          >
            <Icon
              size={16}
              className={active ? "text-emerald-300" : "text-slate-500"}
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{label}</p>
            {description ? (
              <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        <ChevronRight
          size={16}
          className={cn(
            "shrink-0 text-slate-500 transition-transform duration-200",
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
          <div className="ml-5 space-y-1 border-l border-slate-800 pl-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
