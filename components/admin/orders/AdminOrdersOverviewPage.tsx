"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock3,
  PackageCheck,
  PackageSearch,
  RefreshCw,
  ShoppingCart,
  Truck,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { orderService } from "@/app/services/order.service";
import { MyOrder } from "@/app/types/order.types";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { formatDate } from "@/lib/dateUtils";
import { P } from "@/lib/permissions";
import { isAdminRole } from "@/lib/roles";
import { getOrderListPath } from "@/lib/order-routing";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  getOrderBranchSummary,
  getOrderCode,
  getOrderRevenueValue,
  hasOrderShortage,
  InventoryStatusBadge,
  isOrderCreatedToday,
  isOrderProcessingOverdue,
  OrderWorkflowBadge,
  PaymentStatusBadge,
} from "./OrderStateBadges";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount || 0);

const TERMINAL_STATUSES = new Set(["COMPLETED", "CANCELLED", "RETURNED"]);

export default function AdminOrdersOverviewPage() {
  const router = useRouter();
  const { hasPermission, isLoadingAuth } = usePermissions();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = isAdminRole(user?.role);

  useEffect(() => {
    if (isLoadingAuth) {
      return;
    }

    if (!isAdmin) {
      router.replace(getOrderListPath(user));
      return;
    }

    if (!hasPermission(P.ORDER_VIEW)) {
      router.push("/admin/forbidden");
    }
  }, [hasPermission, isAdmin, isLoadingAuth, router, user]);

  const fetchOrders = useCallback(async () => {
    if (!isAdmin) {
      return;
    }

    setIsLoading(true);
    try {
      const data = await orderService.getAdminOrders();
      setOrders(data);
    } catch {
      toast.error("Không thể tải dữ liệu tổng quan đơn hàng.");
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isLoadingAuth || !isAdmin) {
      return;
    }

    void fetchOrders();
  }, [fetchOrders, isAdmin, isLoadingAuth]);

  const metrics = useMemo(() => {
    const todayOrders = orders.filter(isOrderCreatedToday);
    const todayRevenue = todayOrders
      .filter((order) => ["RECEIVED", "COMPLETED"].includes(order.status))
      .reduce((sum, order) => sum + getOrderRevenueValue(order), 0);

    return {
      totalToday: todayOrders.length,
      newToday: todayOrders.filter(
        (order) => !TERMINAL_STATUSES.has(order.status),
      ).length,
      pending: orders.filter((order) => order.status === "PENDING").length,
      shortage: orders.filter(hasOrderShortage).length,
      processing: orders.filter((order) => order.status === "PROCESSING").length,
      shipping: orders.filter((order) => order.status === "SHIPPING").length,
      completed: orders.filter((order) => order.status === "COMPLETED").length,
      cancelled: orders.filter((order) => order.status === "CANCELLED").length,
      overdue: orders.filter((order) => isOrderProcessingOverdue(order, 24))
        .length,
      todayRevenue,
    };
  }, [orders]);

  const shortageOrders = useMemo(
    () =>
      [...orders]
        .filter(hasOrderShortage)
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime(),
        )
        .slice(0, 6),
    [orders],
  );

  const overdueOrders = useMemo(
    () =>
      [...orders]
        .filter((order) => isOrderProcessingOverdue(order, 24))
        .sort(
          (left, right) =>
            new Date(left.createdAt).getTime() -
            new Date(right.createdAt).getTime(),
        )
        .slice(0, 6),
    [orders],
  );

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime(),
        )
        .slice(0, 8),
    [orders],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-[22px] font-bold text-slate-900">
            Tổng quan đơn hàng
          </h1>
          <p className="text-[13px] text-slate-500">
            Theo dõi nhanh tiến độ xử lý, đơn thiếu hàng và các đơn đang chậm
            hơn 24 giờ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-slate-200 bg-white"
            onClick={() => void fetchOrders()}
            disabled={isLoading}
          >
            <RefreshCw
              className={isLoading ? "animate-spin text-blue-600" : "text-slate-500"}
            />
            Làm mới
          </Button>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/admin/orders-all">Mở danh sách đơn hàng</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <OverviewMetricCard
          title="Tổng số đơn hôm nay"
          value={metrics.totalToday.toLocaleString("vi-VN")}
          description="Toàn bộ đơn phát sinh trong ngày."
          href="/admin/orders-all"
          icon={ShoppingCart}
          accent="bg-blue-50 text-blue-700"
        />
        <OverviewMetricCard
          title="Đơn mới"
          value={metrics.newToday.toLocaleString("vi-VN")}
          description="Đơn mới phát sinh hôm nay và chưa kết thúc."
          href="/admin/orders-all"
          icon={Boxes}
          accent="bg-sky-50 text-sky-700"
        />
        <OverviewMetricCard
          title="Chờ xác nhận"
          value={metrics.pending.toLocaleString("vi-VN")}
          description="Các đơn cần admin hoặc chi nhánh xác nhận."
          href="/admin/orders/pending"
          icon={Clock3}
          accent="bg-amber-50 text-amber-700"
        />
        <OverviewMetricCard
          title="Đơn thiếu hàng"
          value={metrics.shortage.toLocaleString("vi-VN")}
          description="Đơn có SKU thiếu hoặc đang chờ điều chuyển."
          href="/admin/orders/awaiting-replenishment"
          icon={PackageSearch}
          accent="bg-rose-50 text-rose-700"
        />
        <OverviewMetricCard
          title="Đang chuẩn bị"
          value={metrics.processing.toLocaleString("vi-VN")}
          description="Đơn đang lấy hàng hoặc đóng gói."
          href="/admin/orders/processing"
          icon={PackageCheck}
          accent="bg-yellow-50 text-yellow-700"
        />
        <OverviewMetricCard
          title="Đang giao hàng"
          value={metrics.shipping.toLocaleString("vi-VN")}
          description="Đơn đã xuất giao và đang trên đường."
          href="/admin/orders/shipping"
          icon={Truck}
          accent="bg-violet-50 text-violet-700"
        />
        <OverviewMetricCard
          title="Hoàn thành"
          value={metrics.completed.toLocaleString("vi-VN")}
          description="Đơn đã giao xong và chốt quy trình."
          href="/admin/orders/completed"
          icon={CheckCircle2}
          accent="bg-emerald-50 text-emerald-700"
        />
        <OverviewMetricCard
          title="Đã hủy"
          value={metrics.cancelled.toLocaleString("vi-VN")}
          description="Đơn không tiếp tục xử lý được."
          href="/admin/orders/cancelled"
          icon={XCircle}
          accent="bg-rose-50 text-rose-700"
        />
        <OverviewMetricCard
          title="Doanh thu hôm nay"
          value={formatCurrency(metrics.todayRevenue)}
          description="Doanh thu từ đơn đã giao hoặc hoàn tất trong ngày."
          href="/admin/orders/completed"
          icon={Wallet}
          accent="bg-emerald-50 text-emerald-700"
        />
        <OverviewMetricCard
          title="Quá 24 giờ"
          value={metrics.overdue.toLocaleString("vi-VN")}
          description="Đơn còn mở nhưng đã vượt thời gian xử lý tiêu chuẩn."
          href="/admin/orders-all"
          icon={AlertTriangle}
          accent="bg-red-50 text-red-700"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <OverviewPanel
          title="Đơn mới cập nhật"
          description="Danh sách đơn gần nhất để chuyển nhanh sang xem chi tiết."
          actionHref="/admin/orders-all"
          actionLabel="Xem toàn bộ"
        >
          <OverviewOrderList orders={recentOrders} isLoading={isLoading} />
        </OverviewPanel>

        <div className="space-y-5">
          <OverviewPanel
            title="Lối tắt xử lý"
            description="Đi nhanh tới các khu vực thường thao tác nhiều nhất."
          >
            <div className="grid gap-3">
              <QuickLinkCard
                href="/admin/orders-all"
                title="Danh sách đơn hàng"
                description="Tra cứu toàn bộ đơn và thao tác nhanh."
              />
              <QuickLinkCard
                href="/admin/orders/awaiting-replenishment"
                title="Đơn thiếu hàng"
                description="Theo dõi các đơn cần điều chuyển hoặc bổ sung."
              />
              <QuickLinkCard
                href="/admin/orders/processing"
                title="Đơn đang chuẩn bị"
                description="Kiểm soát tiến độ lấy hàng và đóng gói."
              />
              <QuickLinkCard
                href="/admin/orders/ready-for-pickup"
                title="Chờ bàn giao"
                description="Kiểm tra các đơn đã chuẩn bị xong."
              />
              <QuickLinkCard
                href="/admin/orders-handover"
                title="Bàn giao đơn hàng"
                description="Theo dõi danh sách phiếu bàn giao hiện có."
              />
            </div>
          </OverviewPanel>

          <OverviewPanel
            title="Doanh thu đơn hoàn tất hôm nay"
            description="Số tiền ghi nhận từ các đơn đã giao xong trong ngày."
          >
            <div className="rounded-[4px] border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-[12px] font-medium text-emerald-700">
                Tổng doanh thu
              </p>
              <p className="mt-2 text-[28px] font-bold text-emerald-900">
                {formatCurrency(metrics.todayRevenue)}
              </p>
            </div>
          </OverviewPanel>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <OverviewPanel
          title="Đơn thiếu hàng cần xử lý"
          description="Ưu tiên các đơn đang thiếu SKU hoặc thiếu số lượng thực tế."
          actionHref="/admin/orders/awaiting-replenishment"
          actionLabel="Mở trang thiếu hàng"
        >
          <div className="space-y-3">
            {isLoading ? (
              <p className="py-6 text-center text-[13px] text-slate-400">
                Đang tải dữ liệu...
              </p>
            ) : shortageOrders.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-slate-500">
                Chưa có đơn thiếu hàng.
              </p>
            ) : (
              shortageOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-start justify-between gap-4 rounded-[4px] border border-slate-200 bg-slate-50 px-4 py-3 transition-colors hover:border-blue-200 hover:bg-blue-50/50"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-[13px] font-semibold text-blue-700">
                      {getOrderCode(order)}
                    </p>
                    <p className="text-[12px] text-slate-700">
                      {order.customerName} • {getOrderBranchSummary(order)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Tạo lúc {formatDate(order.createdAt, "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                  <InventoryStatusBadge order={order} />
                </Link>
              ))
            )}
          </div>
        </OverviewPanel>

        <OverviewPanel
          title="Đơn quá 24 giờ"
          description="Các đơn cần kiểm tra vì đã vượt ngưỡng xử lý nội bộ."
          actionHref="/admin/orders-all"
          actionLabel="Xem danh sách"
        >
          <div className="space-y-3">
            {isLoading ? (
              <p className="py-6 text-center text-[13px] text-slate-400">
                Đang tải dữ liệu...
              </p>
            ) : overdueOrders.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-slate-500">
                Chưa có đơn nào bị quá 24 giờ.
              </p>
            ) : (
              overdueOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-start justify-between gap-4 rounded-[4px] border border-slate-200 bg-slate-50 px-4 py-3 transition-colors hover:border-blue-200 hover:bg-blue-50/50"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-[13px] font-semibold text-blue-700">
                      {getOrderCode(order)}
                    </p>
                    <p className="text-[12px] text-slate-700">
                      {order.customerName} • {getOrderBranchSummary(order)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Tạo lúc {formatDate(order.createdAt, "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                  <OrderWorkflowBadge status={order.status} />
                </Link>
              ))
            )}
          </div>
        </OverviewPanel>
      </div>
    </div>
  );
}

function OverviewMetricCard({
  title,
  value,
  description,
  href,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`rounded-[4px] p-2 ${accent}`}>
          <Icon size={18} />
        </div>
        <ArrowRight size={16} className="mt-1 text-slate-300" />
      </div>
      <p className="mt-4 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-[26px] font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-[12px] leading-5 text-slate-500">{description}</p>
    </Link>
  );
}

function OverviewPanel({
  title,
  description,
  actionHref,
  actionLabel,
  children,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-[16px] font-bold text-slate-900">{title}</h2>
          <p className="text-[12px] text-slate-500">{description}</p>
        </div>
        {actionHref && actionLabel ? (
          <Button asChild variant="outline" size="sm" className="border-slate-200">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function QuickLinkCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-[4px] border border-slate-200 bg-slate-50 px-4 py-3 transition-colors hover:border-blue-200 hover:bg-blue-50/60"
    >
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-slate-800">{title}</p>
        <p className="mt-1 text-[12px] text-slate-500">{description}</p>
      </div>
      <ArrowRight size={16} className="shrink-0 text-slate-300" />
    </Link>
  );
}

function OverviewOrderList({
  orders,
  isLoading,
}: {
  orders: MyOrder[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <p className="py-8 text-center text-[13px] text-slate-400">
        Đang tải dữ liệu...
      </p>
    );
  }

  if (orders.length === 0) {
    return (
      <p className="py-8 text-center text-[13px] text-slate-500">
        Chưa có đơn hàng nào để hiển thị.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2 font-semibold">Mã đơn</th>
            <th className="px-3 py-2 font-semibold">Khách hàng</th>
            <th className="px-3 py-2 font-semibold">Chi nhánh</th>
            <th className="px-3 py-2 font-semibold">Ngày tạo</th>
            <th className="px-3 py-2 font-semibold text-center">Thanh toán</th>
            <th className="px-3 py-2 font-semibold text-center">Trạng thái đơn</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className="border-t border-slate-100 text-[13px] text-slate-700"
            >
              <td className="px-3 py-3 font-semibold text-blue-700">
                <Link href={`/admin/orders/${order.id}`}>{getOrderCode(order)}</Link>
              </td>
              <td className="px-3 py-3">
                <div className="flex flex-col">
                  <span className="font-medium text-slate-800">
                    {order.customerName}
                  </span>
                  <span className="text-[12px] text-slate-500">
                    {order.customerPhone}
                  </span>
                </div>
              </td>
              <td className="px-3 py-3">{getOrderBranchSummary(order)}</td>
              <td className="px-3 py-3">
                {formatDate(order.createdAt, "dd/MM/yyyy HH:mm")}
              </td>
              <td className="px-3 py-3 text-center">
                <PaymentStatusBadge status={order.paymentStatus} />
              </td>
              <td className="px-3 py-3 text-center">
                <OrderWorkflowBadge status={order.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
