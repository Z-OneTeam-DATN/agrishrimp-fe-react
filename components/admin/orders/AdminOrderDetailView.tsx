"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import {
  getReplenishmentDocumentLinks,
  getReplenishmentResultMessage,
  orderService,
} from "@/app/services/order.service";
import { MyOrder } from "@/app/types/order.types";
import { getFriendlyError } from "@/app/utils/apiError";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { formatDate } from "@/lib/dateUtils";
import { canUseBranchOrderRoutes, resolveOrderRouteAccess } from "@/lib/order-routing";
import { readAdminOrdersRefreshSignal } from "@/lib/order-refresh";
import { P } from "@/lib/permissions";
import { resolveImageUrl } from "@/lib/resolveImageUrl";
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
  canRequestReplenishmentAction,
  OrderWorkflowBadge,
  PaymentStatusBadge,
} from "./OrderStateBadges";
import { ReplenishmentDocumentLinks } from "./ReplenishmentDocumentLinks";

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
  const [isSubmitting, setIsSubmitting] = useState<"replenishment" | "advance" | null>(
    null,
  );
  const lastRefreshSignalRef = useRef(0);

  const canViewSystemOrders = hasPermission(P.ORDER_VIEW);
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

  const fetchOrder = useCallback(async () => {
    if (!canViewSystemOrders) {
      return;
    }

    setIsLoading(true);
    try {
      const data = await orderService.getAdminOrderById(orderId);
      setOrder(data);
      lastRefreshSignalRef.current = Math.max(
        lastRefreshSignalRef.current,
        readAdminOrdersRefreshSignal(),
      );
    } catch {
      toast.error("KhĂ´ng thá»ƒ táº£i chi tiáº¿t Ä‘Æ¡n hĂ ng.");
      router.push(orderRouteAccess.defaultOrderListPath);
    } finally {
      setIsLoading(false);
    }
  }, [canViewSystemOrders, orderId, orderRouteAccess.defaultOrderListPath, router]);

  useEffect(() => {
    if (isLoadingAuth || !canViewSystemOrders) {
      return;
    }

    void fetchOrder();
  }, [canViewSystemOrders, fetchOrder, isLoadingAuth]);

  const refreshOrderIfNeeded = useCallback(() => {
    const nextSignal = readAdminOrdersRefreshSignal();
    if (nextSignal <= lastRefreshSignalRef.current) {
      return;
    }

    lastRefreshSignalRef.current = nextSignal;
    void fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    if (isLoadingAuth || !canViewSystemOrders) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshOrderIfNeeded();
      }
    };

    window.addEventListener("focus", refreshOrderIfNeeded);
    window.addEventListener("pageshow", refreshOrderIfNeeded);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshOrderIfNeeded);
      window.removeEventListener("pageshow", refreshOrderIfNeeded);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [canViewSystemOrders, isLoadingAuth, refreshOrderIfNeeded]);

  const shortageItems = useMemo(
    () =>
      (order?.items ?? []).filter((item) => Number(item.missingQuantity ?? 0) > 0),
    [order],
  );

  const shortageSummary = useMemo(() => {
    if (!order) {
      return "Äang táº£i...";
    }

    const missingSkuCount = getOrderMissingSkuCount(order);
    const missingUnitCount = getOrderMissingUnitCount(order);

    if (!missingSkuCount) {
      return "Äá»§ hĂ ng";
    }

    return `${missingSkuCount} SKU thiáº¿u / ${missingUnitCount} Ä‘Æ¡n vá»‹`;
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
      toast.success(`ÄÆ¡n hĂ ng ${getOrderCode(order)} Ä‘Ă£ Ä‘Æ°á»£c cáº­p nháº­t tráº¡ng thĂ¡i.`);
      await fetchOrder();
    } catch {
      toast.error("KhĂ´ng thá»ƒ cáº­p nháº­t tráº¡ng thĂ¡i Ä‘Æ¡n hĂ ng.");
    } finally {
      setIsSubmitting(null);
    }
  };

  if (isLoading || !order) {
    return (
      <div className="rounded-[4px] border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="mt-4 text-[13px] text-slate-500">
          Äang táº£i chi tiáº¿t Ä‘Æ¡n hĂ ng...
        </p>
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
    <div className="space-y-5">
      <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Button
              type="button"
              variant="ghost"
              className="h-auto px-0 text-blue-600 hover:bg-transparent hover:text-blue-700"
              onClick={() => router.push(orderRouteAccess.defaultOrderListPath)}
            >
              <ArrowLeft className="mr-1" />
              Quay láº¡i danh sĂ¡ch
            </Button>

            <div>
              <h1 className="text-[22px] font-bold text-slate-900">
                Chi tiáº¿t Ä‘Æ¡n hĂ ng
              </h1>
              <p className="mt-1 text-[13px] text-slate-500">
                MĂ£ Ä‘Æ¡n:{" "}
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
              LĂ m má»›i
            </Button>

            {canCreateReplenishment ? (
              <Button
                type="button"
                className={
                  isReplenishmentRequested
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }
                onClick={() =>
                  isReplenishmentRequested && hasReplenishmentDocuments
                    ? handleShowReplenishmentDocuments()
                    : void handleRequestReplenishment()
                }
                disabled={isSubmitting !== null}
              >
                <Package className="mr-1" />
                {isSubmitting === "replenishment"
                  ? "Äang xá»­ lĂ½ thiáº¿u hĂ ng..."
                  : isReplenishmentRequested
                    ? "ÄĂ£ xá»­ lĂ½ thiáº¿u hĂ ng"
                    : "Xá»­ lĂ½ thiáº¿u hĂ ng"}
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
                  ? "Äang chuyá»ƒn tráº¡ng thĂ¡i..."
                  : nextAction.label}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DetailMetricCard
          label="GiĂ¡ trá»‹ Ä‘Æ¡n"
          value={formatCurrency(order.finalAmount ?? order.totalAmount)}
          hint={`Tiá»n hĂ ng: ${formatCurrency(order.totalAmount)}`}
          icon={<Wallet size={18} className="text-emerald-700" />}
          accent="bg-emerald-50"
        />
        <DetailMetricCard
          label="Thá»i gian Ä‘áº·t"
          value={formatDate(order.createdAt, "dd/MM/yyyy HH:mm")}
          hint="Theo thá»i Ä‘iá»ƒm khĂ¡ch xĂ¡c nháº­n Ä‘áº·t Ä‘Æ¡n."
          icon={<Box size={18} className="text-blue-700" />}
          accent="bg-blue-50"
        />
        <DetailMetricCard
          label="Chi nhĂ¡nh phá»¥ trĂ¡ch"
          value={getOrderBranchNames(order)[0] ?? getOrderBranchSummary(order)}
          hint={order.branchAddress || "ChÆ°a cĂ³ Ä‘á»‹a chá»‰ chi nhĂ¡nh chĂ­nh."}
          icon={<MapPin size={18} className="text-violet-700" />}
          accent="bg-violet-50"
        />
        <DetailMetricCard
          label="TĂ¬nh tráº¡ng hĂ ng"
          value={shortageSummary}
          hint="DĂ¹ng Ä‘á»ƒ xĂ¡c Ä‘á»‹nh Ä‘Æ¡n cĂ³ cáº§n Ä‘iá»u chuyá»ƒn hay khĂ´ng."
          icon={<AlertTriangle size={18} className="text-rose-700" />}
          accent="bg-rose-50"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <DetailPanel title="KhĂ¡ch hĂ ng vĂ  giao hĂ ng">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <InfoLine
                icon={<UserRound size={15} className="text-slate-400" />}
                label="KhĂ¡ch hĂ ng"
                value={order.customerName}
              />
              <InfoLine
                icon={<Phone size={15} className="text-slate-400" />}
                label="Sá»‘ Ä‘iá»‡n thoáº¡i"
                value={order.customerPhone}
              />
              <InfoLine
                icon={<UserRound size={15} className="text-slate-400" />}
                label="NgÆ°á»i nháº­n"
                value={order.receiverName || order.customerName}
              />
              <InfoLine
                icon={<Phone size={15} className="text-slate-400" />}
                label="Äiá»‡n thoáº¡i nháº­n"
                value={order.receiverPhone || order.customerPhone}
              />
            </div>

            <div className="space-y-3">
              <InfoLine
                icon={<MapPin size={15} className="text-slate-400" />}
                label="Äá»‹a chá»‰ giao hĂ ng"
                value={order.shippingAddress}
                multiline
              />
              <InfoLine
                icon={<Wallet size={15} className="text-slate-400" />}
                label="PhÆ°Æ¡ng thá»©c thanh toĂ¡n"
                value={order.paymentMethod}
              />
              <InfoLine
                icon={<Truck size={15} className="text-slate-400" />}
                label="PhĂ­ giao hĂ ng"
                value={formatCurrency(order.totalShippingFee ?? order.shippingFee ?? 0)}
              />
            </div>
          </div>
        </DetailPanel>

        <DetailPanel title="Tráº¡ng thĂ¡i xá»­ lĂ½">
          <div className="grid gap-4 md:grid-cols-2">
            <StatusItem
              label="TĂ¬nh tráº¡ng hĂ ng"
              value={<InventoryStatusBadge order={order} />}
            />
            <StatusItem
              label="Thanh toĂ¡n"
              value={<PaymentStatusBadge status={order.paymentStatus} />}
            />
            <StatusItem
              label="Tráº¡ng thĂ¡i Ä‘Æ¡n"
              value={<OrderWorkflowBadge status={order.status} />}
            />
            <StatusItem
              label="Giao hĂ ng"
              value={<DeliveryStatusBadge status={order.status} />}
            />
          </div>

          {order.note ? (
            <div className="mt-4 rounded-[4px] border border-slate-200 bg-slate-50 p-3">
              <p className="text-[12px] font-semibold text-slate-700">Ghi chĂº</p>
              <p className="mt-1 text-[13px] leading-6 text-slate-600">
                {order.note}
              </p>
            </div>
          ) : null}

          {order.cancelReasonDisplay ? (
            <div className="mt-4 rounded-[4px] border border-rose-200 bg-rose-50 p-3">
              <p className="text-[12px] font-semibold text-rose-700">LÄ‚Â½ do hĂ¡Â»Â§y</p>
              <p className="mt-1 text-[13px] leading-6 text-rose-700">
                {order.cancelReasonDisplay}
              </p>
            </div>
          ) : null}
        </DetailPanel>
      </div>

      <DetailPanel title="Danh sĂ¡ch sáº£n pháº©m">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Sáº£n pháº©m</th>
                <th className="px-3 py-2 font-semibold">SKU</th>
                <th className="px-3 py-2 font-semibold text-center">Sá»‘ lÆ°á»£ng</th>
                <th className="px-3 py-2 font-semibold text-center">Thiáº¿u</th>
                <th className="px-3 py-2 font-semibold text-right">ÄÆ¡n giĂ¡</th>
                <th className="px-3 py-2 font-semibold text-right">ThĂ nh tiá»n</th>
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
        <DetailPanel title="Chi nhĂ¡nh xá»­ lĂ½ vĂ  bĂ n giao">
          {(order.subOrders ?? []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Chi nhĂ¡nh</th>
                    <th className="px-3 py-2 font-semibold text-center">
                      Tráº¡ng thĂ¡i Ä‘Æ¡n
                    </th>
                    <th className="px-3 py-2 font-semibold text-center">
                      Giao hĂ ng
                    </th>
                    <th className="px-3 py-2 font-semibold text-right">
                      PhĂ­ ship
                    </th>
                    <th className="px-3 py-2 font-semibold">ÄÆ¡n vá»‹ VC</th>
                    <th className="px-3 py-2 font-semibold">Dá»± kiáº¿n</th>
                  </tr>
                </thead>
                <tbody>
                  {order.subOrders?.map((subOrder) => (
                    <tr
                      key={subOrder.subOrderId}
                      className="border-t border-slate-100 text-[13px]"
                    >
                      <td className="px-3 py-3 font-medium text-slate-800">
                        {subOrder.branchName || "ChÆ°a gĂ¡n chi nhĂ¡nh"}
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
                        {subOrder.carrier || "ChÆ°a cáº­p nháº­t"}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {subOrder.estimatedDays || "ChÆ°a cĂ³ dá»¯ liá»‡u"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-[4px] border border-dashed border-slate-300 bg-slate-50 p-4 text-[13px] text-slate-500">
              ÄÆ¡n nĂ y hiá»‡n chÆ°a cĂ³ sub-order theo chi nhĂ¡nh. Há»‡ thá»‘ng Ä‘ang xá»­ lĂ½
              theo Ä‘Æ¡n tá»•ng.
            </div>
          )}
        </DetailPanel>

        <DetailPanel title="Thiáº¿u hĂ ng vĂ  ghi chĂº Ä‘iá»u phá»‘i">
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
                    SKU: {item.sku} â€¢ Thiáº¿u {item.missingQuantity} / cáº§n{" "}
                    {item.quantity}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[4px] border border-emerald-100 bg-emerald-50 p-4 text-[13px] text-emerald-800">
              ÄÆ¡n nĂ y hiá»‡n khĂ´ng cĂ³ sáº£n pháº©m thiáº¿u.
            </div>
          )}

          <div id="order-replenishment-documents" className="mt-4">
            {hasReplenishmentDocuments ? (
              <ReplenishmentDocumentLinks documents={replenishmentDocuments} />
            ) : (
              <div className="rounded-[4px] border border-dashed border-slate-300 bg-slate-50 p-4 text-[13px] leading-6 text-slate-500">
                Sau khi báº¥m Xá»­ lĂ½ thiáº¿u hĂ ng, cĂ¡c phiáº¿u Ä‘iá»u chuyá»ƒn hoáº·c yĂªu
                cáº§u NCC Ä‘Æ°á»£c táº¡o cho Ä‘Æ¡n nĂ y sáº½ hiá»ƒn thá»‹ táº¡i Ä‘Ă¢y.
              </div>
            )}
          </div>

          <div className="hidden">
            <p className="text-[12px] font-semibold text-slate-700">
              Dá»¯ liá»‡u nĂ¢ng cao sáº½ bá»• sung khi backend sáºµn sĂ ng
            </p>
            <p className="mt-2 text-[13px] leading-6 text-slate-500">
              Tá»“n kho tá»«ng chi nhĂ¡nh, gá»£i Ă½ chi nhĂ¡nh tá»‘i Æ°u, khoáº£ng cĂ¡ch giao
              hĂ ng, lá»‹ch sá»­ xá»­ lĂ½ vĂ  nhĂ¢n viĂªn phá»¥ trĂ¡ch váº«n chÆ°a Ä‘Æ°á»£c API hiá»‡n
              táº¡i tráº£ vá» Ä‘áº§y Ä‘á»§.
            </p>
            <div className="mt-3">
              <Button asChild variant="outline" size="sm" className="border-slate-200">
                <Link href="/admin/transfers">Má»Ÿ trang Ä‘iá»u chuyá»ƒn kho</Link>
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
