"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  HelpCircle,
  Truck,
  TrendingUp,
  Warehouse,
  ArrowRightLeft,
  ArrowUpFromLine,
  ShieldCheck,
  ClipboardList,
  ChevronRight,
  ShoppingCart,
  Box,
  List,
  Archive,
  RotateCcw,
  Ticket, // Đã bổ sung icon Ticket ở đây
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { supplierService } from "@/app/services/supplier.service";
import { customerService } from "@/app/services/customer.service";
import { ProductService } from "@/app/services/product.service";
import { getCategories } from "@/app/services/CategoryService";
import { branchService } from "@/app/services/branchService";
import { EmployeeService } from "@/app/services/employee.service";
import { voucherService } from "@/app/services/voucher.service";
import { InventoryApiService, InventoryCheckApiService, InventoryExportApiService } from "@/app/services/inventory.service";
import { transferService } from "@/app/services/transfer.service";
import { PurchaseRequestApiService } from "@/app/services/purchase.service";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { isAdminRole, normalizeRoleSlug } from "@/lib/roles";
import { getOrderListPath, isBranchOrderUser } from "@/lib/order-routing";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const warehouseId = useAuthStore((state) => state.warehouseId);
  const { hasPermission, hasAnyPermission } = usePermissions();
  // Normalize role (chỉ dùng để hiển thị label, logic bảo vệ dùng hasPermission)
  const role = normalizeRoleSlug(user?.role) || "USER";
  const isAdmin = isAdminRole(user?.role);
  const isManager = role === "MANAGER";
  const isBranchScopedOrderUser = isBranchOrderUser(user);
  const isWarehouseUser =
    (user?.branch?.name?.toLowerCase().includes("kho tổng") ?? false) ||
    warehouseId === 1;
  const orderListHref = getOrderListPath(user);
  const isOrderListActive =
    pathname === "/admin/orders" ||
    pathname === "/admin/orders-all" ||
    (pathname.startsWith("/admin/orders/") && !pathname.includes("return"));
  const canViewSystemSection = hasAnyPermission([P.DASHBOARD_VIEW, P.WORKSPACE_VIEW]);
  const canViewAdminSection = hasAnyPermission([P.STAFF_VIEW, P.BRANCH_VIEW, P.ROLE_VIEW, P.SUPPLIER_VIEW]);
  const canViewBusinessSection = hasAnyPermission([P.ORDER_VIEW, P.VOUCHER_VIEW, P.CUSTOMER_VIEW]);
  const canViewCatalogSection = hasAnyPermission([P.PRODUCT_VIEW, P.CATEGORY_VIEW, P.ATTRIBUTE_VIEW]);
  const canViewInventorySection = hasAnyPermission([P.IMPORT_VIEW, P.EXPORT_VIEW, P.TRANSFER_VIEW, P.CHECK_VIEW]);
  const canViewProcurementSection = hasAnyPermission([P.PURCHASE_REQUEST_VIEW, P.IMPORT_VIEW, P.SUPPLIER_VIEW]);
  const canViewFinanceSection = hasPermission(P.REPORT_FINANCE_VIEW);
  const canViewSettings = hasPermission(P.SETTING_VIEW);

  const [supplierCount, setSupplierCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [attributeCount, setAttributeCount] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [branchCount, setBranchCount] = useState(0);
  const [voucherCount, setVoucherCount] = useState(0);
  const [purchaseRequestPendingCount, setPurchaseRequestPendingCount] = useState(0);
  const [receiptPendingCount, setReceiptPendingCount] = useState(0);
  const [exportPendingCount, setExportPendingCount] = useState(0);
  const [transferPendingCount, setTransferPendingCount] = useState(0);
  const [checkPendingCount, setCheckPendingCount] = useState(0);

  // Quản lý các nhóm menu đang mở
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  // Tự động mở nhóm menu nếu đang truy cập trang con bên trong
  useEffect(() => {
    if (pathname.startsWith("/admin/orders")) {
      setOpenGroups(prev => prev.includes("orders") ? prev : [...prev, "orders"]);
    }
  }, [pathname]);

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
        hasPermission(P.PURCHASE_REQUEST_VIEW) && isWarehouseUser
          ? PurchaseRequestApiService.getAll()
          : Promise.resolve(null),
        hasPermission(P.IMPORT_VIEW)
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
        supplierResult.status === "fulfilled" ? (supplierResult.value as any) : null;
      const customerValue =
        customerResult.status === "fulfilled" ? (customerResult.value as any) : null;
      const productValue =
        productResult.status === "fulfilled" ? (productResult.value as any) : null;
      const categoryValue =
        categoryResult.status === "fulfilled" ? (categoryResult.value as any) : null;
      const attributeValue =
        attributeResult.status === "fulfilled" ? (attributeResult.value as any) : null;
      const employeeValue =
        employeeResult.status === "fulfilled" ? (employeeResult.value as any) : null;
      const branchValue =
        branchResult.status === "fulfilled" ? (branchResult.value as any) : null;
      const voucherValue =
        voucherResult.status === "fulfilled" ? (voucherResult.value as any) : null;

      setSupplierCount(
        supplierValue?.totalElements || 0,
      );
      setCustomerCount(
        customerValue?.totalElements || 0,
      );
      setProductCount(
        Array.isArray(productValue)
          ? productValue.length
          : productValue?.totalProducts || 0,
      );
      setCategoryCount(
        Array.isArray(categoryValue) ? categoryValue.length : 0,
      );
      setAttributeCount(
        Array.isArray(attributeValue) ? attributeValue.length : 0,
      );
      setEmployeeCount(
        employeeValue?.totalElements || 0,
      );
      setBranchCount(
        Array.isArray(branchValue)
          ? branchValue.length
          : branchValue?.totalElements || 0,
      );
      setVoucherCount(
        voucherValue?.totalElements ||
          (Array.isArray(voucherValue) ? voucherValue.length : 0),
      );

      const purchaseRequests =
        purchaseRequestResult.status === "fulfilled"
          ? Array.isArray(purchaseRequestResult.value)
            ? purchaseRequestResult.value
            : []
          : [];
      setPurchaseRequestPendingCount(
        purchaseRequests.filter((item: any) => item.status === "PENDING_APPROVAL")
          .length,
      );

      const receipts =
        receiptResult.status === "fulfilled"
          ? Array.isArray(receiptResult.value)
            ? receiptResult.value
            : receiptResult.value?.data || receiptResult.value?.content || []
          : [];
      setReceiptPendingCount(
        receipts.filter((item: any) => item.status === "PENDING" || item.status === "PO")
          .length,
      );

      const exportsList =
        exportResult.status === "fulfilled"
          ? Array.isArray(exportResult.value)
            ? exportResult.value
            : exportResult.value?.data || exportResult.value?.content || []
          : [];
      setExportPendingCount(
        exportsList.filter((item: any) => item.status === "PENDING" || item.status === "DRAFT")
          .length,
      );

      setTransferPendingCount(
        transferResult.status === "fulfilled"
          ? transferResult.value?.totalElements || 0
          : 0,
      );

      const checks =
        checkResult.status === "fulfilled"
          ? Array.isArray(checkResult.value)
            ? checkResult.value
            : checkResult.value?.data || checkResult.value?.content || []
          : [];
      setCheckPendingCount(
        checks.filter((item: any) => item.status === "PENDING").length,
      );
    } catch (error) {
      console.warn("Sidebar counts sync failed");
    }
  };

  useEffect(() => {
    fetchCounts();
    const handleUpdate = () => fetchCounts();
    window.addEventListener("supplierUpdated", handleUpdate);
    window.addEventListener("customerUpdated", handleUpdate);
    window.addEventListener("orderUpdated", handleUpdate);

    return () => {
      window.removeEventListener("supplierUpdated", handleUpdate);
      window.removeEventListener("customerUpdated", handleUpdate);
      window.removeEventListener("orderUpdated", handleUpdate);
    };
  }, [hasPermission, isWarehouseUser]);

  const isActive = (path: string) => {
    if (path === "/admin") return pathname === "/admin";
    return pathname.startsWith(path);
  };

  const toggleGroup = (groupKey: string) => {
    setOpenGroups(prev =>
      prev.includes(groupKey) ? prev.filter(k => k !== groupKey) : [...prev, groupKey]
    );
  };

  return (
    <div className="w-[260px] bg-[#020617] text-slate-400 h-screen flex flex-col border-r border-slate-800/40 sticky top-0 z-30">
      <div className="h-[64px] px-7 flex items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-6 bg-emerald-500 rounded-full" />
          <div className="flex flex-col">
            <h1 className="font-black text-white text-[18px] tracking-[0.15em] leading-none uppercase">
              AGRI<span className="text-emerald-500">SHRIMP</span>
            </h1>
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em] mt-1">
              {isAdmin ? "Administrator" : isManager ? "Manager" : "User"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-6 no-scrollbar pb-10">
        {/* SECTION: HỆ THỐNG */}

        {canViewSystemSection && (
          <section>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
              Hệ thống
            </p>
            <div className="space-y-0.5">
              {hasPermission(P.DASHBOARD_VIEW) && (
                <SidebarLink href="/admin" icon={LayoutDashboard} label="Tổng quan" active={pathname === "/admin"} color="text-emerald-500" />
              )}
              {hasPermission(P.WORKSPACE_VIEW) && (
                <SidebarLink href="/admin/inventory-dashboard" icon={ClipboardList} label="Bàn làm việc kho" active={isActive("/admin/inventory-dashboard")} color="text-amber-400" />
              )}
            </div>
          </section>
        )}

        {/* =======================
            SECTION MỚI: KINH DOANH
            ======================= */}
        {canViewBusinessSection && (
          <section>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
              Kinh doanh
            </p>
            <div className="space-y-0.5">
              {hasPermission(P.ORDER_VIEW) && (
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
                    label={isAdmin ? "Tất cả đơn hàng" : "Đơn hàng chi nhánh"}
                    active={isOrderListActive}
                    isChild
                  />
                  {isBranchScopedOrderUser && (
                    <SidebarLink href="/admin/orders-processing" icon={Box} label="Điều hành & Gom đơn" active={pathname === "/admin/orders-processing"} isChild />
                  )}
                  {isBranchScopedOrderUser && (
                    <SidebarLink href="/admin/orders-handover" icon={Archive} label="Bàn giao kiện" active={pathname === "/admin/orders-handover"} isChild />
                  )}
                  {isAdmin && (
                    <SidebarLink href="/admin/orders-all" icon={List} label="Tất cả kiện hàng" active={pathname === "/admin/orders-all"} isChild />
                  )}
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
                  label="Khuyến mãi & Voucher"
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
            </div>
          </section>
        )}

        {/* SECTION: MUA HÀNG */}
        {canViewProcurementSection && (
          <section>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
              Mua hàng
            </p>
            <div className="space-y-0.5">
              {hasPermission(P.PURCHASE_REQUEST_VIEW) && isWarehouseUser && (
                <SidebarLink
                  href="/admin/purchase-requests"
                  icon={ShoppingCart}
                  label="Yêu cầu mua NCC"
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
                  color="text-emerald-400"
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

        {/* SECTION: HÀNG HÓA - Only for ADMIN */}

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
              {hasPermission(P.ATTRIBUTE_VIEW) && (
                <SidebarLink
                  href="/admin/variants"
                  icon={Layers}
                  label="Thuộc tính"
                  active={isActive("/admin/variants")}
                  badge={attributeCount}
                />
              )}
            </div>
          </section>
        )}

        {/* SECTION: KHO VẬN */}
        {canViewInventorySection && (
          <section>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
              Kho vận
            </p>
            <div className="space-y-0.5">
              {hasPermission(P.EXPORT_VIEW) && (
                <SidebarLink href="/admin/exports" icon={ArrowUpFromLine} label="Xuất kho & Trả NCC" active={isActive("/admin/exports")} badge={exportPendingCount} />
              )}
              {hasPermission(P.TRANSFER_VIEW) && (
                <SidebarLink href="/admin/transfers" icon={ArrowRightLeft} label="Điều chuyển kho" active={isActive("/admin/transfers")} badge={transferPendingCount} />
              )}
              {hasPermission(P.CHECK_VIEW) && (
                <SidebarLink href="/admin/inventory-checks" icon={ShieldCheck} label="Kiểm kê kho" active={isActive("/admin/inventory-checks")} badge={checkPendingCount} />
              )}
            </div>
          </section>
        )}

        {/* SECTION: TÀI CHÍNH */}
        {canViewFinanceSection && (
          <section>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
              Tài chính
            </p>
            <div className="space-y-0.5">
              <SidebarLink
                href="/admin/financial"
                icon={FileBarChart}
                label="Tổng quan tài chính"
                active={pathname === "/admin/financial"}
                color="text-emerald-500"
              />
              <SidebarLink
                href="/admin/financial/supplier-debt"
                icon={Truck}
                label="Công nợ NCC"
                active={isActive("/admin/financial/supplier-debt")}
                color="text-orange-400"
              />
              <SidebarLink
                href="/admin/financial/cashbook"
                icon={Archive}
                label="Sổ quỹ / Tiền chi"
                active={isActive("/admin/financial/cashbook")}
                color="text-blue-400"
              />
              <SidebarLink
                href="/admin/financial/profit-loss"
                icon={TrendingUp}
                label="Lãi lỗ"
                active={isActive("/admin/financial/profit-loss")}
                color="text-emerald-400"
              />
            </div>
          </section>
        )}

        {/* SECTION: BÁO CÁO */}
        {hasAnyPermission([P.REPORT_REVENUE_VIEW, P.REPORT_INVENTORY_VIEW, P.REPORT_FINANCE_VIEW]) && (
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
              {hasPermission(P.REPORT_FINANCE_VIEW) && (
                <SidebarLink
                  href="/admin/financial/profit-loss"
                  icon={FileBarChart}
                  label="Báo cáo tài chính"
                  active={isActive("/admin/financial/profit-loss")}
                  color="text-emerald-500"
                />
              )}
            </div>
          </section>
        )}

        {/* SECTION: QUẢN TRỊ */}
        {canViewAdminSection && (
          <section>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
              Quản trị
            </p>
            <div className="space-y-0.5">
              {hasPermission(P.STAFF_VIEW) && (
                <SidebarLink href="/admin/employees" icon={UserCircle} label="Nhân viên" active={isActive("/admin/employees")} badge={employeeCount} />
              )}
              {hasPermission(P.BRANCH_VIEW) && (
                <SidebarLink href="/admin/branches" icon={Building2} label="Chi nhánh & Kho" active={isActive("/admin/branches")} badge={branchCount} />
              )}
              {hasPermission(P.ROLE_VIEW) && (
                <SidebarLink href="/admin/employees/roles" icon={ShieldCheck} label="Vai trò & Quyền" active={isActive("/admin/employees/roles")} color="text-violet-400" />
              )}
            </div>
          </section>
        )}
      </div>

      <div className="p-4 mt-auto border-t border-slate-800/40 bg-[#020617]/50">
        {canViewSettings && (
          <SidebarLink href="/admin/settings" icon={Settings} label="Cài đặt" active={isActive("/admin/settings")} />
        )}
        <SidebarLink href="#" icon={HelpCircle} label="Hỗ trợ" active={false} />
      </div>
    </div>
  );
}

function SidebarLink({ href, icon: Icon, label, active, badge, color, badgeColor, isChild }: any) {
  return (
    <Link href={href} className={cn(
      "flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-200 group relative",
      active ? "bg-slate-800/60 text-white shadow-sm" : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200",
      isChild && "pl-3 py-1.5 text-[12px]"
    )}>
      {active && !isChild && <div className="absolute left-0 w-1 h-4 bg-emerald-500 rounded-r-full" />}
      <div className="flex items-center gap-3">
        <div className={cn("rounded-md transition-colors",
          isChild ? "p-0 bg-transparent" : "p-1",
          active && !isChild ? "bg-slate-700" : "bg-transparent group-hover:bg-slate-800"
        )}>
          <Icon size={isChild ? 14 : 16} className={cn(active ? (color || "text-emerald-400") : "text-slate-500 group-hover:text-slate-400")} />
        </div>
        <span className="truncate">{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <Badge className={cn("border-none text-[10px] h-4.5 px-1.5 font-black", active ? "bg-white text-emerald-600" : "bg-emerald-500/10 text-emerald-400")}>
          {badge}
        </Badge>
      )}
    </Link>
  );
}

function SidebarGroup({ icon: Icon, label, children, isOpen, onToggle, active }: any) {
  return (
    <div className="space-y-0.5">
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-200 group relative select-none",
          active ? "text-emerald-400 bg-slate-800/20" : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn("p-1 rounded-md transition-colors", active ? "bg-slate-800/50" : "bg-transparent group-hover:bg-slate-800")}>
            <Icon size={16} className={cn(active ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-400")} />
          </div>
          <span className="truncate">{label}</span>
        </div>
        <ChevronRight size={14} className={cn("transition-transform duration-200 text-slate-600", isOpen && "rotate-90")} />
      </button>
      <div className={cn("grid transition-all duration-300 ease-in-out", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
        <div className="overflow-hidden">
          <div className="pl-2 space-y-0.5 border-l border-slate-800/60 ml-5 mt-1 mb-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
