"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Box,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Truck,
  UserRound,
  Wallet,
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
  DeliveryStatusBadge,
  getNextOrderWorkflowAction,
  getOrderBranchSummary,
  getOrderCode,
  getOrderMissingSkuCount,
  getOrderMissingUnitCount,
  InventoryStatusBadge,
  canRequestReplenishmentAction,
  OrderWorkflowBadge,
  PaymentStatusBadge,
} from "./OrderStateBadges";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount || 0);

export default function AdminOrderDetailView({
  orderId,
}: {
  orderId: string;
}) {
  const router = useRouter();
  const { hasPermission, isLoadingAuth } = usePermissions();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<MyOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<"replenishment" | "advance" | null>(
    null,
  );

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

  const fetchOrder = useCallback(async () => {
    if (!isAdmin) {
      return;
    }

    setIsLoading(true);
    try {
      const data = await orderService.getAdminOrderById(orderId);
      setOrder(data);
    } catch {
      toast.error("Không thể tải chi tiết đơn hàng.");
      router.push("/admin/orders-all");
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, orderId, router]);

  useEffect(() => {
    if (isLoadingAuth || !isAdmin) {
      return;
    }

    void fetchOrder();
  }, [fetchOrder, isAdmin, isLoadingAuth]);

  const shortageItems = useMemo(
    () =>
      (order?.items ?? []).filter((item) => Number(item.missingQuantity ?? 0) > 0),
    [order],
  );

  const shortageSummary = useMemo(() => {
    if (!order) {
      return "Đang tải...";
    }

    const missingSkuCount = getOrderMissingSkuCount(order);
    const missingUnitCount = getOrderMissingUnitCount(order);

    if (!missingSkuCount) {
      return "Đủ hàng";
    }

    return `${missingSkuCount} SKU thiếu / ${missingUnitCount} đơn vị`;
  }, [order]);

  const handleRequestReplenishment = async () => {
    if (!order) {
      return;
    }

    try {
      setIsSubmitting("replenishment");
      const response = await orderService.requestAdminOrderReplenishment(order.id);
      const transferSummary = response.transferCodes?.length
        ? ` (${response.transferCodes.join(", ")})`
        : "";
      toast.success(
        `Đã tạo lệnh điều chuyển cho ${getOrderCode(order)}${transferSummary}`,
      );
      await fetchOrder();
    } catch {
      toast.error("Không thể tạo lệnh điều chuyển bổ sung cho đơn hàng.");
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleAdvanceStatus = async () => {
    if (!order) {
      return;
    }

    const nextAction = getNextOrderWorkflowAction(order);
    if (!nextAction) {
      return;
    }

    try {
      setIsSubmitting("advance");
      await orderService.updateOrderStatus(order.id, nextAction.nextStatus);
      toast.success(`Đơn hàng ${getOrderCode(order)} đã được cập nhật trạng thái.`);
      await fetchOrder();
    } catch {
      toast.error("Không thể cập nhật trạng thái đơn hàng.");
    } finally {
      setIsSubmitting(null);
    }
  };

  if (isLoading || !order) {
    return (
      <div className="rounded-[4px] border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="mt-4 text-[13px] text-slate-500">
          Đang tải chi tiết đơn hàng...
        </p>
      </div>
    );
  }

  const canCreateReplenishment =
    hasPermission(P.ORDER_UPDATE) && canRequestReplenishmentAction(order);
  const nextAction = hasPermission(P.ORDER_UPDATE)
    ? getNextOrderWorkflowAction(order)
    : null;

  return (
    <div className="space-y-5">
      <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Button
              type="button"
              variant="ghost"
              className="h-auto px-0 text-blue-600 hover:bg-transparent hover:text-blue-700"
              onClick={() => router.push("/admin/orders-all")}
            >
              <ArrowLeft className="mr-1" />
              Quay lại danh sách
            </Button>

            <div>
              <h1 className="text-[22px] font-bold text-slate-900">
                Chi tiết đơn hàng
              </h1>
              <p className="mt-1 text-[13px] text-slate-500">
                Mã đơn:{" "}
                <span className="font-semibold text-blue-700">
                  {getOrderCode(order)}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 bg-white"
              onClick={() => void fetchOrder()}
              disabled={isLoading}
            >
              <RefreshCw className={isLoading ? "animate-spin" : ""} />
              Làm mới
            </Button>

            {canCreateReplenishment ? (
              <Button
                type="button"
                className="bg-rose-600 hover:bg-rose-700"
                onClick={() => void handleRequestReplenishment()}
                disabled={isSubmitting !== null}
              >
                <Package className="mr-1" />
                {isSubmitting === "replenishment"
                  ? "Đang xin lệnh điều chuyển..."
                  : "Xin lệnh điều chuyển"}
              </Button>
            ) : null}

            {nextAction ? (
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => void handleAdvanceStatus()}
                disabled={isSubmitting !== null}
              >
                {isSubmitting === "advance"
                  ? "Đang chuyển trạng thái..."
                  : nextAction.label}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DetailMetricCard
          label="Giá trị đơn"
          value={formatCurrency(order.finalAmount ?? order.totalAmount)}
          hint={`Tiền hàng: ${formatCurrency(order.totalAmount)}`}
          icon={<Wallet size={18} className="text-emerald-700" />}
          accent="bg-emerald-50"
        />
        <DetailMetricCard
          label="Thời gian đặt"
          value={formatDate(order.createdAt, "dd/MM/yyyy HH:mm")}
          hint="Theo thời điểm khách xác nhận đặt đơn."
          icon={<Box size={18} className="text-blue-700" />}
          accent="bg-blue-50"
        />
        <DetailMetricCard
          label="Chi nhánh phụ trách"
          value={getOrderBranchSummary(order)}
          hint={order.branchAddress || "Chưa có địa chỉ chi nhánh chính."}
          icon={<MapPin size={18} className="text-violet-700" />}
          accent="bg-violet-50"
        />
        <DetailMetricCard
          label="Tình trạng hàng"
          value={shortageSummary}
          hint="Dùng để xác định đơn có cần điều chuyển hay không."
          icon={<AlertTriangle size={18} className="text-rose-700" />}
          accent="bg-rose-50"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <DetailPanel title="Khách hàng và giao hàng">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <InfoLine
                icon={<UserRound size={15} className="text-slate-400" />}
                label="Khách hàng"
                value={order.customerName}
              />
              <InfoLine
                icon={<Phone size={15} className="text-slate-400" />}
                label="Số điện thoại"
                value={order.customerPhone}
              />
              <InfoLine
                icon={<UserRound size={15} className="text-slate-400" />}
                label="Người nhận"
                value={order.receiverName || order.customerName}
              />
              <InfoLine
                icon={<Phone size={15} className="text-slate-400" />}
                label="Điện thoại nhận"
                value={order.receiverPhone || order.customerPhone}
              />
            </div>

            <div className="space-y-3">
              <InfoLine
                icon={<MapPin size={15} className="text-slate-400" />}
                label="Địa chỉ giao hàng"
                value={order.shippingAddress}
                multiline
              />
              <InfoLine
                icon={<Wallet size={15} className="text-slate-400" />}
                label="Phương thức thanh toán"
                value={order.paymentMethod}
              />
              <InfoLine
                icon={<Truck size={15} className="text-slate-400" />}
                label="Phí giao hàng"
                value={formatCurrency(order.totalShippingFee ?? order.shippingFee ?? 0)}
              />
            </div>
          </div>
        </DetailPanel>

        <DetailPanel title="Trạng thái xử lý">
          <div className="grid gap-4 md:grid-cols-2">
            <StatusItem
              label="Tình trạng hàng"
              value={<InventoryStatusBadge order={order} />}
            />
            <StatusItem
              label="Thanh toán"
              value={<PaymentStatusBadge status={order.paymentStatus} />}
            />
            <StatusItem
              label="Trạng thái đơn"
              value={<OrderWorkflowBadge status={order.status} />}
            />
            <StatusItem
              label="Giao hàng"
              value={<DeliveryStatusBadge status={order.status} />}
            />
          </div>

          {order.note ? (
            <div className="mt-4 rounded-[4px] border border-slate-200 bg-slate-50 p-3">
              <p className="text-[12px] font-semibold text-slate-700">Ghi chú</p>
              <p className="mt-1 text-[13px] leading-6 text-slate-600">
                {order.note}
              </p>
            </div>
          ) : null}
        </DetailPanel>
      </div>

      <DetailPanel title="Danh sách sản phẩm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Sản phẩm</th>
                <th className="px-3 py-2 font-semibold">SKU</th>
                <th className="px-3 py-2 font-semibold text-center">Số lượng</th>
                <th className="px-3 py-2 font-semibold text-center">Thiếu</th>
                <th className="px-3 py-2 font-semibold text-right">Đơn giá</th>
                <th className="px-3 py-2 font-semibold text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 text-[13px]">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-slate-200 bg-slate-50">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package size={16} className="text-slate-300" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">
                          {item.productName}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-600">{item.sku}</td>
                  <td className="px-3 py-3 text-center text-slate-700">
                    {item.quantity}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {(item.missingQuantity ?? 0) > 0 ? (
                      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                        {item.missingQuantity}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-700">
                    {formatCurrency(item.price ?? 0)}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-slate-900">
                    {formatCurrency(item.totalPrice ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DetailPanel>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <DetailPanel title="Chi nhánh xử lý và bàn giao">
          {(order.subOrders ?? []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Chi nhánh</th>
                    <th className="px-3 py-2 font-semibold text-center">
                      Trạng thái đơn
                    </th>
                    <th className="px-3 py-2 font-semibold text-center">
                      Giao hàng
                    </th>
                    <th className="px-3 py-2 font-semibold text-right">
                      Phí ship
                    </th>
                    <th className="px-3 py-2 font-semibold">Đơn vị VC</th>
                    <th className="px-3 py-2 font-semibold">Dự kiến</th>
                  </tr>
                </thead>
                <tbody>
                  {order.subOrders?.map((subOrder) => (
                    <tr
                      key={subOrder.subOrderId}
                      className="border-t border-slate-100 text-[13px]"
                    >
                      <td className="px-3 py-3 font-medium text-slate-800">
                        {subOrder.branchName || "Chưa gán chi nhánh"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <OrderWorkflowBadge status={subOrder.status} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <DeliveryStatusBadge status={subOrder.status} />
                      </td>
                      <td className="px-3 py-3 text-right text-slate-700">
                        {formatCurrency(subOrder.shippingFee ?? 0)}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {subOrder.carrier || "Chưa cập nhật"}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {subOrder.estimatedDays || "Chưa có dữ liệu"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-[4px] border border-dashed border-slate-300 bg-slate-50 p-4 text-[13px] text-slate-500">
              Đơn này hiện chưa có sub-order theo chi nhánh. Hệ thống đang xử lý
              theo đơn tổng.
            </div>
          )}
        </DetailPanel>

        <DetailPanel title="Thiếu hàng và ghi chú điều phối">
          {shortageItems.length > 0 ? (
            <div className="space-y-3">
              {shortageItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[4px] border border-rose-100 bg-rose-50 p-3"
                >
                  <p className="text-[13px] font-semibold text-rose-800">
                    {item.productName}
                  </p>
                  <p className="mt-1 text-[12px] text-rose-700">
                    SKU: {item.sku} • Thiếu {item.missingQuantity} / cần{" "}
                    {item.quantity}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[4px] border border-emerald-100 bg-emerald-50 p-4 text-[13px] text-emerald-800">
              Đơn này hiện không có sản phẩm thiếu.
            </div>
          )}

          <div className="mt-4 rounded-[4px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-[12px] font-semibold text-slate-700">
              Dữ liệu nâng cao sẽ bổ sung khi backend sẵn sàng
            </p>
            <p className="mt-2 text-[13px] leading-6 text-slate-500">
              Tồn kho từng chi nhánh, gợi ý chi nhánh tối ưu, khoảng cách giao
              hàng, lịch sử xử lý và nhân viên phụ trách vẫn chưa được API hiện
              tại trả về đầy đủ.
            </p>
            <div className="mt-3">
              <Button asChild variant="outline" size="sm" className="border-slate-200">
                <Link href="/admin/transfers">Mở trang điều chuyển kho</Link>
              </Button>
            </div>
          </div>
        </DetailPanel>
      </div>
    </div>
  );
}

function DetailPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-[16px] font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function DetailMetricCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`inline-flex rounded-[4px] p-2 ${accent}`}>{icon}</div>
      <p className="mt-3 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-[20px] font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-[12px] leading-5 text-slate-500">{hint}</p>
    </div>
  );
}

function InfoLine({
  icon,
  label,
  value,
  multiline,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[12px] font-semibold text-slate-500">{label}</p>
        <p
          className={`mt-1 text-[13px] text-slate-800 ${
            multiline ? "leading-6" : ""
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function StatusItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
      <p className="text-[12px] font-semibold text-slate-500">{label}</p>
      <div className="mt-2">{value}</div>
    </div>
  );
}
