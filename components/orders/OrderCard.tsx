import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Store, Truck, CheckCircle2, RotateCcw, XCircle, CreditCard, Clock, Package } from "lucide-react";
import { MyOrder, OrderStatus } from "@/app/types/order.types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { CancelOrderModal } from "./CancelOrderModal";

interface OrderCardProps {
  order: MyOrder;
  onOrderCancelled?: () => void;
}

const cancellableStatuses: OrderStatus[] = [
  "AWAITING_PAYMENT",
  "PENDING",
  "AWAITING_REPLENISHMENT",
  "CONFIRMED",
  "PROCESSING",
  "READY_FOR_PICKUP",
];

export function OrderCard({ order, onOrderCancelled }: OrderCardProps) {
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case "AWAITING_PAYMENT":
        return {
          label: "Chờ thanh toán",
          className: "text-amber-600",
          icon: <CreditCard size={14} className="mr-1" />,
        };
      case "AWAITING_REPLENISHMENT":
        return {
          label: "Đã xác nhận, chờ nhập thêm",
          className: "text-rose-600",
          icon: <Package size={14} className="mr-1" />,
        };
      case "PENDING":
        return {
          label: "Chờ xác nhận",
          className: "text-orange-500",
          icon: <Clock size={14} className="mr-1" />,
        };
      case "CONFIRMED":
      case "PROCESSING":
      case "READY_FOR_PICKUP":
        return {
          label: "Đã xác nhận",
          className: "text-teal-600",
          icon: <Package size={14} className="mr-1" />,
        };
      case "SHIPPING":
        return {
          label: "Chờ giao hàng",
          className: "text-cyan-600",
          icon: <Truck size={14} className="mr-1" />,
        };
      case "COMPLETED":
        return {
          label: "Đã giao",
          className: "text-[#2d9f8d]",
          icon: <CheckCircle2 size={14} className="mr-1" />,
        };
      case "CANCELLED":
        return {
          label: "Đã hủy",
          className: "text-red-500",
          icon: <XCircle size={14} className="mr-1" />,
        };
      case "RETURNED":
        return {
          label: "Trả hàng",
          className: "text-orange-600",
          icon: <RotateCcw size={14} className="mr-1" />,
        };
      default:
        return { label: status, className: "text-gray-500", icon: null };
    }
  };

  const statusConfig = getStatusConfig(order.status);

  const btnMainClass =
    "h-8 border border-[#2d9f8d] bg-[#2d9f8d] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#248273]";
  const btnOutlineClass =
    "h-8 border border-gray-300 bg-white px-4 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-800";
  const btnPayClass =
    "h-8 border border-red-500 bg-red-500 px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-600";

  return (
    <div className="mb-3 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/30 px-4 py-3">
        <div className="flex flex-col">
          <div className="flex items-center text-sm font-bold text-gray-800">
            <Store size={16} className="mr-2 text-gray-500" /> Cửa hàng AgriShrimp
          </div>
          <div className="ml-6 text-[11px] font-mono text-gray-400">Mã đơn: {order.code}</div>
        </div>
        <div className={cn("flex items-center text-xs font-bold uppercase", statusConfig.className)}>
          {statusConfig.icon} {statusConfig.label}
        </div>
      </div>

      <div className="bg-white px-4 py-1">
        {order.items.map((item, index) => (
          <div
            key={index}
            className={cn("flex items-center gap-3 py-3", {
              "border-b border-dashed border-gray-100": index < order.items.length - 1,
            })}
          >
            <Link href={`/orders/${order.id}`} className="group flex min-w-0 flex-1 cursor-pointer gap-3">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-100 transition-colors group-hover:border-[#2d9f8d]/30">
                <Image
                  src={item.image || "/placeholder.png"}
                  alt={item.productName}
                  fill
                  className={`object-cover transition-transform duration-300 group-hover:scale-105 ${order.status === "CANCELLED" ? "grayscale opacity-70" : ""}`}
                />
              </div>
              <div className="min-w-0 flex-1 py-0.5">
                <div className="truncate text-sm font-semibold text-gray-800 transition-colors group-hover:text-[#2d9f8d]">
                  {item.productName}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px]">x{item.quantity}</span>
                  <span className="text-gray-300">|</span>
                  <span>SKU: {item.sku}</span>
                </div>
                {(item.missingQuantity ?? 0) > 0 && (
                  <div className="mt-1 text-[11px] font-semibold text-rose-600">Thiếu {item.missingQuantity} sản phẩm</div>
                )}
                <div className={`mt-1.5 text-sm font-bold sm:hidden ${order.status === "CANCELLED" ? "text-gray-400" : "text-red-500"}`}>
                  {formatCurrency(item.price)}
                </div>
              </div>
            </Link>

            <div className="flex flex-col items-end gap-2">
              <div className={`hidden text-right text-sm font-bold sm:block ${order.status === "CANCELLED" ? "text-gray-400" : "text-gray-900"}`}>
                {formatCurrency(item.price)}
              </div>

              {order.status === "COMPLETED" && item.productId && (
                item.canReview === false ? (
                  <Button
                    disabled
                    variant="outline"
                    className={cn(btnOutlineClass, "h-7 cursor-not-allowed border-gray-200 bg-gray-50 px-3 text-[10px] text-gray-400 opacity-70")}
                  >
                    Đã đánh giá
                  </Button>
                ) : (
                  <Link href={`/reviews/write/${item.productId}?orderId=${order.id}`}>
                    <Button
                      variant="outline"
                      className={cn(btnOutlineClass, "h-7 border-[#2d9f8d] px-3 text-[10px] text-[#2d9f8d] hover:bg-teal-50 hover:text-[#2d9f8d]")}
                    >
                      Viết đánh giá
                    </Button>
                  </Link>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-start justify-between gap-3 border-t border-gray-100 bg-gray-50/20 px-4 py-3 sm:flex-row sm:items-center">
        <div className="flex flex-col">
          <div className="text-sm text-gray-600">
            Tổng tiền:
            <span className="ml-1 text-lg font-black text-red-600">{formatCurrency(order.finalAmount)}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-400">
            <CreditCard size={10} />
            Thanh toán: <span className="font-medium text-gray-600">{order.paymentMethod}</span>
            <span
              className={cn(
                "ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase",
                order.paymentStatus === "PAID" ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600",
              )}
            >
              {order.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {order.paymentMethod === "PAYOS" && order.paymentStatus === "UNPAID" && order.checkoutUrl && ["PENDING", "AWAITING_PAYMENT"].includes(order.status) && (
            <a href={order.checkoutUrl} target="_blank" rel="noopener noreferrer">
              <Button className={btnPayClass}>
                <CreditCard size={14} className="mr-1.5" />
                Thanh toán ngay
              </Button>
            </a>
          )}

          {cancellableStatuses.includes(order.status) && (
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
          )}

          <Link href={`/orders/${order.id}`}>
            <Button className={btnMainClass}>Chi tiết</Button>
          </Link>

          {order.status === "COMPLETED" && (
            <Button variant="outline" className={btnOutlineClass}>
              Mua lại
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
