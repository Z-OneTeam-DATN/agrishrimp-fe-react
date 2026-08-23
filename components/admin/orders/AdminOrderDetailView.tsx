"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Box,
  MapPin,
  Package,
  Phone,
  Truck,
  UserRound,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import {
  getReplenishmentDocumentLinks,
  getReplenishmentResultMessage,
  orderService,
} from "@/app/services/order.service";
import { MyOrder } from "@/app/types/order.types";
import { getFriendlyError } from "@/app/utils/apiError";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { useOrderRealtimeSync } from "@/hooks/useOrderRealtimeSync";
import { formatDate } from "@/lib/dateUtils";
import { canUseBranchOrderRoutes, resolveOrderRouteAccess } from "@/lib/order-routing";
import {
  readAdminOrdersRefreshSignal,
} from "@/lib/order-refresh";
import { P } from "@/lib/permissions";
import { resolveImageUrl } from "@/lib/resolveImageUrl";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  DeliveryStatusBadge,
  getNextOrderWorkflowAction,
  getOrderBranchNames,
  getOrderBranchSummary,
  getOrderCode,
  getOrderMissingSkuCount,
  getOrderMissingUnitCount,
  InventoryStatusBadge,
  OrderWorkflowBadge,
  PaymentStatusBadge,
  canRequestReplenishmentAction,
} from "./OrderStateBadges";
import { OrderRealtimeStatusIndicator } from "./OrderRealtimeStatusIndicator";
import { ReplenishmentDocumentLinks } from "./ReplenishmentDocumentLinks";
import {
  ORDER_LIST_HEADER_CLASS,
  ORDER_LIST_IMAGE_FRAME_CLASS,
  ORDER_LIST_NOTE_CLASS,
  ORDER_LIST_PANEL_CLASS,
  ORDER_LIST_PANEL_MUTED_CLASS,
  ORDER_LIST_PRIMARY_ACTION_CLASS,
  ORDER_LIST_PRODUCT_CARD_CLASS,
  ORDER_LIST_SECONDARY_ACTION_CLASS,
  ORDER_LIST_SUBTABLE_CLASS,
} from "./orderListStyles";

const BADGE_VARIANT = "order-list-monochrome";
const DETAIL_TABLE_HEAD_CLASS =
  "px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500";
const DETAIL_EMPTY_STATE_CLASS = cn(
  ORDER_LIST_PANEL_MUTED_CLASS,
  "text-[13px] leading-6 text-slate-600",
);
const DETAIL_QUANTITY_BADGE_CLASS =
  "inline-flex min-w-8 items-center justify-center rounded-none border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-700";

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
  const { user, warehouseId } = useAuthStore();
  const [order, setOrder] = useState<MyOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<"replenishment" | "advance" | null>(
    null,
  );
  const lastRefreshSignalRef = useRef(0);

  const canViewSystemOrders = hasPermission(P.ORDER_VIEW_ALL_BRANCHES);
  const canUseBranchOrders = canUseBranchOrderRoutes(user, warehouseId);
  const orderRouteAccess = useMemo(
    () =>
      resolveOrderRouteAccess({
        canViewSystemOrders,
        canUseBranchOrders,
      }),
    [canUseBranchOrders, canViewSystemOrders],
  );

  useEffect(() => {
    if (isLoadingAuth) {
      return;
    }

    if (!canViewSystemOrders) {
      router.replace(orderRouteAccess.orderListPath);
      return;
    }

    if (!orderRouteAccess.canAccessOrderModule) {
      router.push("/admin/forbidden");
    }
  }, [
    canViewSystemOrders,
    isLoadingAuth,
    orderRouteAccess.canAccessOrderModule,
    orderRouteAccess.orderListPath,
    router,
  ]);

  const fetchOrder = useCallback(async (options?: { background?: boolean }) => {
    if (!canViewSystemOrders) {
      return;
    }

    const background = options?.background ?? false;
    if (background) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    try {
      const data = await orderService.getAdminOrderById(orderId);
      setOrder(data);
      lastRefreshSignalRef.current = Math.max(
        lastRefreshSignalRef.current,
        readAdminOrdersRefreshSignal(),
      );
    } catch {
      if (!background) {
      toast.error("Không thể tải chi tiết đơn hàng.");
      router.push(orderRouteAccess.defaultOrderListPath);
      }
    } finally {
      if (background) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [canViewSystemOrders, orderId, orderRouteAccess.defaultOrderListPath, router]);

  useEffect(() => {
    if (isLoadingAuth || !canViewSystemOrders) {
      return;
    }

    void fetchOrder();
  }, [canViewSystemOrders, fetchOrder, isLoadingAuth]);

  useOrderRealtimeSync({
    enabled: !isLoadingAuth && canViewSystemOrders,
    lastRefreshSignalRef,
    onBackgroundRefresh: () => fetchOrder({ background: true }),
  });

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
      const responseDocuments = response.planItems ?? [];
      if (getReplenishmentDocumentLinks(responseDocuments).length > 0) {
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                replenishmentRequested: true,
                replenishmentDocuments: responseDocuments,
              }
            : prev,
        );
      }
      toast.success(getReplenishmentResultMessage(getOrderCode(order), response));
      await fetchOrder();
    } catch (error) {
      toast.error(getFriendlyError(error));
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleShowReplenishmentDocuments = () => {
    document
      .getElementById("order-replenishment-documents")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
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
      <div className={cn(ORDER_LIST_PANEL_CLASS, "py-10 text-center")}>
        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="mt-4 text-[13px] text-slate-500">Đang tải chi tiết đơn hàng...</p>
      </div>
    );
  }

  const canCreateReplenishment =
    hasPermission(P.ORDER_UPDATE) && canRequestReplenishmentAction(order);
  const nextAction = hasPermission(P.ORDER_UPDATE)
    ? getNextOrderWorkflowAction(order)
    : null;
  const replenishmentDocuments = order.replenishmentDocuments ?? [];
  const replenishmentDocumentLinks =
    getReplenishmentDocumentLinks(replenishmentDocuments);
  const hasReplenishmentDocuments = replenishmentDocumentLinks.length > 0;
  const isReplenishmentRequested =
    hasReplenishmentDocuments || Boolean(order.replenishmentRequested);

  return (
    <div className="space-y-5 pb-[100px] text-slate-800">
      <section className={ORDER_LIST_PANEL_CLASS}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className={cn(ORDER_LIST_SECONDARY_ACTION_CLASS, "px-3")}
              onClick={() => router.push(orderRouteAccess.defaultOrderListPath)}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Quay lại danh sách
            </Button>

            <div className="space-y-1">
              <h1 className="text-[22px] font-bold text-slate-900">Chi tiết đơn hàng</h1>
              <p className="text-[13px] text-slate-500">
                Mã đơn:{" "}
                <span className="font-semibold text-blue-700">{getOrderCode(order)}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <OrderRealtimeStatusIndicator />
            {isRefreshing ? (
              <div className="flex items-center gap-2 text-[12px] font-medium text-blue-600">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                Äang Ä‘á»“ng bá»™ chi tiáº¿t Ä‘Æ¡n hĂ ng...
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canCreateReplenishment ? (
              <Button
                type="button"
                className={cn(
                  isReplenishmentRequested
                    ? ORDER_LIST_SECONDARY_ACTION_CLASS
                    : ORDER_LIST_PRIMARY_ACTION_CLASS,
                  "px-3",
                )}
                onClick={() =>
                  isReplenishmentRequested && hasReplenishmentDocuments
                    ? handleShowReplenishmentDocuments()
                    : void handleRequestReplenishment()
                }
                disabled={isSubmitting !== null}
              >
                <Package className="mr-1.5 h-4 w-4" />
                {isSubmitting === "replenishment"
                  ? "Đang xử lý thiếu hàng..."
                  : isReplenishmentRequested
                    ? "Đã xử lý thiếu hàng"
                    : "Xử lý thiếu hàng"}
              </Button>
            ) : null}

            {nextAction ? (
              <Button
                type="button"
                className={cn(ORDER_LIST_PRIMARY_ACTION_CLASS, "px-3")}
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
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DetailMetricCard
          label="Giá trị đơn"
          value={formatCurrency(order.finalAmount ?? order.totalAmount)}
          hint={`Tiền hàng: ${formatCurrency(order.totalAmount)}`}
          icon={<Wallet size={18} />}
        />
        <DetailMetricCard
          label="Thời gian đặt"
          value={formatDate(order.createdAt, "dd/MM/yyyy HH:mm")}
          hint="Theo thời điểm khách xác nhận đặt đơn."
          icon={<Box size={18} />}
        />
        <DetailMetricCard
          label="Chi nhánh phụ trách"
          value={getOrderBranchNames(order)[0] ?? getOrderBranchSummary(order)}
          hint={order.branchAddress || "Chưa có địa chỉ chi nhánh chính."}
          icon={<MapPin size={18} />}
        />
        <DetailMetricCard
          label="Tình trạng hàng"
          value={shortageSummary}
          hint="Dùng để xác định đơn có cần điều chuyển hay không."
          icon={<AlertTriangle size={18} />}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <DetailPanel title="Khách hàng và giao hàng">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <InfoLine
                icon={<UserRound size={15} className="text-blue-500" />}
                label="Khách hàng"
                value={order.customerName}
              />
              <InfoLine
                icon={<Phone size={15} className="text-blue-500" />}
                label="Số điện thoại"
                value={order.customerPhone}
              />
              <InfoLine
                icon={<UserRound size={15} className="text-blue-500" />}
                label="Người nhận"
                value={order.receiverName || order.customerName}
              />
              <InfoLine
                icon={<Phone size={15} className="text-blue-500" />}
                label="Điện thoại nhận"
                value={order.receiverPhone || order.customerPhone}
              />
            </div>

            <div className="space-y-3">
              <InfoLine
                icon={<MapPin size={15} className="text-blue-500" />}
                label="Địa chỉ giao hàng"
                value={order.shippingAddress}
                multiline
              />
              <InfoLine
                icon={<Wallet size={15} className="text-blue-500" />}
                label="Phương thức thanh toán"
                value={order.paymentMethod}
              />
              <InfoLine
                icon={<Truck size={15} className="text-blue-500" />}
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
              value={<InventoryStatusBadge order={order} variant={BADGE_VARIANT} />}
            />
            <StatusItem
              label="Thanh toán"
              value={
                <PaymentStatusBadge status={order.paymentStatus} variant={BADGE_VARIANT} />
              }
            />
            <StatusItem
              label="Trạng thái đơn"
              value={<OrderWorkflowBadge status={order.status} variant={BADGE_VARIANT} />}
            />
            <StatusItem
              label="Giao hàng"
              value={<DeliveryStatusBadge status={order.status} variant={BADGE_VARIANT} />}
            />
          </div>

          {order.note ? (
            <div className={cn("mt-4", ORDER_LIST_NOTE_CLASS)}>
              <p className="text-[12px] font-semibold">Ghi chú</p>
              <p className="mt-1 text-[13px] leading-6 text-blue-900">{order.note}</p>
            </div>
          ) : null}

          {order.cancelReasonDisplay ? (
            <div className={cn("mt-4", ORDER_LIST_PANEL_MUTED_CLASS)}>
              <p className="text-[12px] font-semibold text-blue-800">Lý do hủy</p>
              <p className="mt-1 text-[13px] leading-6 text-blue-900">
                {order.cancelReasonDisplay}
              </p>
            </div>
          ) : null}
        </DetailPanel>
      </div>

      <DetailPanel title="Danh sách sản phẩm">
        <div className={ORDER_LIST_SUBTABLE_CLASS}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead className={ORDER_LIST_HEADER_CLASS}>
                <tr>
                  <th className={DETAIL_TABLE_HEAD_CLASS}>Sản phẩm</th>
                  <th className={DETAIL_TABLE_HEAD_CLASS}>SKU</th>
                  <th className={cn(DETAIL_TABLE_HEAD_CLASS, "text-center")}>Số lượng</th>
                  <th className={cn(DETAIL_TABLE_HEAD_CLASS, "text-center")}>Thiếu</th>
                  <th className={cn(DETAIL_TABLE_HEAD_CLASS, "text-right")}>Đơn giá</th>
                  <th className={cn(DETAIL_TABLE_HEAD_CLASS, "text-right")}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {(order.items ?? []).map((item) => (
                  <tr key={item.id} className="border-b border-blue-100 text-[13px] last:border-b-0">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className={ORDER_LIST_IMAGE_FRAME_CLASS}>
                          {item.image ? (
                            <img
                              src={resolveImageUrl(item.image)}
                              alt={item.productName}
                              className="h-full w-full object-cover"
                              onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src = "/placeholder.png";
                              }}
                            />
                          ) : (
                            <Package size={16} className="text-slate-300" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{item.productName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{item.sku}</td>
                    <td className="px-3 py-3 text-center text-slate-700">{item.quantity}</td>
                    <td className="px-3 py-3 text-center">
                      {(item.missingQuantity ?? 0) > 0 ? (
                        <span className={DETAIL_QUANTITY_BADGE_CLASS}>
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
        </div>
      </DetailPanel>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <DetailPanel title="Chi nhánh xử lý và bàn giao">
          {(order.subOrders ?? []).length > 0 ? (
            <div className={ORDER_LIST_SUBTABLE_CLASS}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead className={ORDER_LIST_HEADER_CLASS}>
                    <tr>
                      <th className={DETAIL_TABLE_HEAD_CLASS}>Chi nhánh</th>
                      <th className={cn(DETAIL_TABLE_HEAD_CLASS, "text-center")}>
                        Trạng thái đơn
                      </th>
                      <th className={cn(DETAIL_TABLE_HEAD_CLASS, "text-center")}>
                        Giao hàng
                      </th>
                      <th className={cn(DETAIL_TABLE_HEAD_CLASS, "text-right")}>Phí ship</th>
                      <th className={DETAIL_TABLE_HEAD_CLASS}>Đơn vị vận chuyển</th>
                      <th className={DETAIL_TABLE_HEAD_CLASS}>Dự kiến</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.subOrders?.map((subOrder) => (
                      <tr
                        key={subOrder.subOrderId}
                        className="border-b border-blue-100 text-[13px] last:border-b-0"
                      >
                        <td className="px-3 py-3 font-medium text-slate-800">
                          {subOrder.branchName || "Chưa gán chi nhánh"}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <OrderWorkflowBadge
                            status={subOrder.status}
                            variant={BADGE_VARIANT}
                          />
                        </td>
                        <td className="px-3 py-3 text-center">
                          <DeliveryStatusBadge
                            status={subOrder.status}
                            variant={BADGE_VARIANT}
                          />
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
            </div>
          ) : (
            <div className={DETAIL_EMPTY_STATE_CLASS}>
              Đơn này hiện chưa có sub-order theo chi nhánh. Hệ thống đang xử lý theo
              đơn tổng.
            </div>
          )}
        </DetailPanel>

        <DetailPanel title="Thiếu hàng và ghi chú điều phối">
          {shortageItems.length > 0 ? (
            <div className="space-y-3">
              {shortageItems.map((item) => (
                <div key={item.id} className={ORDER_LIST_PRODUCT_CARD_CLASS}>
                  <div className="space-y-1">
                    <p className="text-[13px] font-semibold text-slate-900">{item.productName}</p>
                    <p className="text-[12px] text-slate-600">
                      SKU: {item.sku} • Thiếu {item.missingQuantity} / cần {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={DETAIL_EMPTY_STATE_CLASS}>Đơn này hiện không có sản phẩm thiếu.</div>
          )}

          <div id="order-replenishment-documents" className="mt-4">
            {hasReplenishmentDocuments ? (
              <ReplenishmentDocumentLinks
                documents={replenishmentDocuments}
                variant="order-detail-monochrome"
              />
            ) : (
              <div className={DETAIL_EMPTY_STATE_CLASS}>
                Sau khi bấm Xử lý thiếu hàng, các phiếu điều chuyển hoặc yêu cầu NCC
                được tạo cho đơn này sẽ hiển thị tại đây.
              </div>
            )}
          </div>

          <div className="hidden">
            <p className="text-[12px] font-semibold text-slate-700">
              Dữ liệu nâng cao sẽ bổ sung khi backend sẵn sàng
            </p>
            <p className="mt-2 text-[13px] leading-6 text-slate-500">
              Tồn kho từng chi nhánh, gợi ý chi nhánh tối ưu, khoảng cách giao hàng,
              lịch sử xử lý và nhân viên phụ trách vẫn chưa được API hiện tại trả về đầy
              đủ.
            </p>
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
    <section className={ORDER_LIST_PANEL_CLASS}>
      <div className="mb-4 border-b border-blue-100 pb-3">
        <h2 className="text-[16px] font-bold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function DetailMetricCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <div className={ORDER_LIST_PANEL_CLASS}>
      <div className="inline-flex border border-blue-100 bg-blue-50/40 p-2 text-blue-700">
        {icon}
      </div>
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
          className={cn(
            "mt-1 text-[13px] text-slate-800",
            multiline && "leading-6",
          )}
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
    <div className={ORDER_LIST_PANEL_MUTED_CLASS}>
      <p className="text-[12px] font-semibold text-slate-500">{label}</p>
      <div className="mt-2">{value}</div>
    </div>
  );
}
