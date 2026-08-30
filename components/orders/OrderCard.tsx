import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Package,
  RotateCcw,
  Store,
  Truck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { orderService } from "@/app/services/order.service";
import {
  MyOrder,
  OrderPaymentStatus,
  OrderStatus,
} from "@/app/types/order.types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { resolveImageUrl } from "@/lib/resolveImageUrl";
import { cn } from "@/lib/utils";
import {
  canCustomerConfirmReceivedAction,
  getUserOrderStage,
  UserOrderStage,
} from "./order-status-utils";
import { CancelOrderModal } from "./CancelOrderModal";

interface OrderCardProps {
  order: MyOrder;
  hasReturnRequest?: boolean;
  onOrderCancelled?: () => void;
  onOrderUpdated?: (order: MyOrder) => void | Promise<void>;
}

const cancellableStatuses = new Set<OrderStatus>([
  "PENDING_PAYMENT",
  "PENDING_SHORTAGE_REVIEW",
  "AWAITING_PAYMENT",
  "PENDING",
]);

const isPaidPaymentStatus = (status: OrderPaymentStatus | string) =>
  status === "PAID" || status === "REFUNDED";

const getPaymentLabel = (status: OrderPaymentStatus | string) => {
  switch (status) {
    case "PAID":
      return "Đã thanh toán";
    case "PENDING":
      return "Chờ thanh toán";
    case "PENDING_VERIFICATION":
      return "Chờ xác nhận chuyển khoản";
    case "PARTIALLY_PAID":
      return "Đã thanh toán một phần";
    case "EXPIRED":
      return "Hết hạn thanh toán";
    case "FAILED":
      return "Thanh toán lỗi";
    case "REFUND_PENDING":
      return "Chờ hoàn tiền";
    case "REFUNDED":
      return "Đã hoàn tiền";
    default:
      return "Chưa thanh toán";
  }
};

const getStatusConfig = (stage: UserOrderStage) => {
  switch (stage) {
    case "PENDING":
      return {
        label: "Chờ xác nhận",
        className: "text-[#1965a2]",
        icon: <Clock size={14} className="mr-1" />,
      };
    case "READY_FOR_PICKUP":
      return {
        label: "Chờ lấy hàng",
        className: "text-[#1965a2]",
        icon: <Package size={14} className="mr-1" />,
      };
    case "SHIPPING":
      return {
        label: "Chờ giao hàng",
        className: "text-[#1965a2]",
        icon: <Truck size={14} className="mr-1" />,
      };
    case "COMPLETED":
      return {
        label: "Đã giao",
        className: "text-[#1965a2]",
        icon: <CheckCircle2 size={14} className="mr-1" />,
      };
    case "RETURNED":
      return {
        label: "Trả hàng",
        className: "text-[#1965a2]",
        icon: <RotateCcw size={14} className="mr-1" />,
      };
    case "CANCELLED":
      return {
        label: "Đã hủy",
        className: "text-red-500",
        icon: <XCircle size={14} className="mr-1" />,
      };
    default:
      return {
        label: stage,
        className: "text-gray-500",
        icon: null,
      };
  }
};

export function OrderCard({
  order,
  hasReturnRequest = false,
  onOrderCancelled,
  onOrderUpdated,
}: OrderCardProps) {
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isConfirmingReceived, setIsConfirmingReceived] = useState(false);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  const resolveItemDisplayPrice = (item: MyOrder["items"][number]) => {
    const unitPrice = Number(item.price ?? 0);
    if (unitPrice > 0) {
      return unitPrice;
    }

    const totalPrice = Number(item.totalPrice ?? 0);
    const quantity = Number(item.quantity ?? 0);
    return totalPrice > 0 && quantity > 0 ? totalPrice / quantity : 0;
  };

  const customerStage = getUserOrderStage(order);
  const statusConfig = getStatusConfig(customerStage);
  const canConfirmReceived = canCustomerConfirmReceivedAction(order);
  const isDeliveredForCustomer = customerStage === "COMPLETED";
  const hasVisibleReturnRequest =
    hasReturnRequest || Boolean(order.hasReturnRequest);

  const btnMainClass =
    "h-8 rounded-none border border-[#1965a2] bg-[#1965a2] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#145486]";
  const btnOutlineClass =
    "h-8 rounded-none border border-gray-300 bg-white px-4 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-800";
  const btnPayClass =
    "h-8 rounded-none border border-red-500 bg-red-500 px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-600";

  const handleConfirmReceived = async () => {
    try {
      setIsConfirmingReceived(true);
      await orderService.confirmReceivedByCustomer(order.id);
      const refreshedOrder = await orderService.getOrderById(order.id);
      await Promise.resolve(onOrderUpdated?.(refreshedOrder));
      toast.success("Đã xác nhận nhận hàng thành công.");
    } catch (error) {
      console.error("Failed to confirm received order:", error);
      toast.error("Không thể xác nhận đã nhận hàng lúc này.");
    } finally {
      setIsConfirmingReceived(false);
    }
  };

  return (
    <div className="mb-3 overflow-hidden border border-gray-100 bg-white transition-all duration-200 hover:shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/30 px-4 py-3">
        <div className="flex flex-col">
          <div className="flex items-center text-sm font-bold text-gray-800">
            <Store size={16} className="mr-2 text-gray-500" />
            Cửa hàng AgriShrimp
          </div>
          <div className="ml-6 text-[11px] font-mono text-gray-400">
            Mã đơn: {order.code}
          </div>
        </div>

        <div
          className={cn(
            "flex items-center text-xs font-bold uppercase",
            statusConfig.className,
          )}
        >
          {statusConfig.icon}
          {statusConfig.label}
        </div>
      </div>

      <div className="bg-white px-4 py-1">
        {order.items.map((item, index) => (
          <div
            key={index}
            className={cn("flex items-center gap-3 py-3", {
              "border-b border-dashed border-gray-100":
                index < order.items.length - 1,
            })}
          >
            <Link
              href={`/orders/${order.id}`}
              className="group flex min-w-0 flex-1 cursor-pointer gap-3"
            >
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-100 transition-colors group-hover:border-[#1965a2]/30">
                <Image
                  src={resolveImageUrl(item.image, "/placeholder.png")}
                  alt={item.productName}
                  fill
                  className={cn(
                    "object-cover transition-transform duration-300 group-hover:scale-105",
                    order.status === "CANCELLED" && "grayscale opacity-70",
                  )}
                />
              </div>

              <div className="min-w-0 flex-1 py-0.5">
                <div className="truncate text-sm font-semibold text-gray-800 transition-colors group-hover:text-[#1965a2]">
                  {item.productName}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px]">
                    x{item.quantity}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span>SKU: {item.sku}</span>
                </div>
                <div
                  className={cn(
                    "mt-1.5 text-sm font-bold sm:hidden",
                    order.status === "CANCELLED"
                      ? "text-gray-400"
                      : "text-red-500",
                  )}
                >
                  {formatCurrency(resolveItemDisplayPrice(item))}
                </div>
              </div>
            </Link>

            <div className="flex flex-col items-end gap-2">
              <div
                className={cn(
                  "hidden text-right text-sm font-bold sm:block",
                  order.status === "CANCELLED"
                    ? "text-gray-400"
                    : "text-gray-900",
                )}
              >
                {formatCurrency(resolveItemDisplayPrice(item))}
              </div>

              {isDeliveredForCustomer && item.productId ? (
                item.canReview === false ? (
                  <Button
                    disabled
                    variant="outline"
                    className={cn(
                      btnOutlineClass,
                      "h-7 cursor-not-allowed border-gray-200 bg-gray-50 px-3 text-[10px] text-gray-400 opacity-70",
                    )}
                  >
                    Đã đánh giá
                  </Button>
                ) : (
                  <Link href={`/reviews/write/${item.productId}?orderId=${order.id}`}>
                    <Button
                      variant="outline"
                      className={cn(
                        btnOutlineClass,
                        "h-7 border-[#1965a2] px-3 text-[10px] text-[#1965a2] hover:bg-[#1965a2]/10 hover:text-[#1965a2]",
                      )}
                    >
                      Viết đánh giá
                    </Button>
                  </Link>
                )
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-start justify-between gap-3 border-t border-gray-100 bg-gray-50/20 px-4 py-3 sm:flex-row sm:items-center">
        <div className="flex flex-col">
          <div className="text-sm text-gray-600">
            Tổng tiền:
            <span className="ml-1 text-lg font-black text-red-600">
              {formatCurrency(order.finalAmount)}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-400">
            <CreditCard size={10} />
            Thanh toán:
            <span className="font-medium text-gray-600">
              {order.paymentMethod}
            </span>
            <span
              className={cn(
                "ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase",
                isPaidPaymentStatus(order.paymentStatus)
                  ? "bg-[#1965a2]/10 text-[#1965a2]"
                  : "bg-orange-100 text-orange-600",
              )}
            >
              {getPaymentLabel(order.paymentStatus)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {canConfirmReceived ? (
            <Button
              type="button"
              className={btnMainClass}
              onClick={() => void handleConfirmReceived()}
              disabled={isConfirmingReceived}
            >
              {isConfirmingReceived ? "Đang xác nhận..." : "Đã nhận hàng"}
            </Button>
          ) : null}

          {order.paymentMethod === "PAYOS" &&
          ["UNPAID", "PENDING"].includes(order.paymentStatus) &&
          order.checkoutUrl &&
          ["PENDING_PAYMENT", "PENDING", "AWAITING_PAYMENT"].includes(
            order.status,
          ) ? (
            <a
              href={order.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className={btnPayClass}>
                <CreditCard size={14} className="mr-1.5" />
                Thanh toán ngay
              </Button>
            </a>
          ) : null}

          {cancellableStatuses.has(order.status) ? (
            <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className={btnOutlineClass}>
                  Hủy đơn
                </Button>
              </DialogTrigger>
              <CancelOrderModal
                orderId={order.id.toString()}
                onClose={() => setIsCancelModalOpen(false)}
                onOrderCancelled={onOrderCancelled}
              />
            </Dialog>
          ) : null}

          <Link href={`/orders/${order.id}`}>
            <Button className={btnMainClass}>Chi tiết</Button>
          </Link>

          {isDeliveredForCustomer ? (
            <>
              {!hasVisibleReturnRequest ? (
                <Link href={`/orders/return/request/${order.id}`}>
                  <Button
                    variant="outline"
                    className={cn(
                      btnOutlineClass,
                      "border-[#1965a2] text-[#1965a2] hover:bg-[#1965a2]/10 hover:text-[#1965a2]",
                    )}
                  >
                    Trả hàng
                  </Button>
                </Link>
              ) : null}

              <Button variant="outline" className={btnOutlineClass}>
                Mua lại
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
