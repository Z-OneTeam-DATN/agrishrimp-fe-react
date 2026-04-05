"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FileText,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ChevronLeft,
  MapPin,
  XCircle,
  Store,
  Phone,
  CreditCard,
  RotateCcw,
  ShoppingBag,
  Copy,
  Check,
} from "lucide-react";
import { orderService } from "@/app/services/order.service";
import { MyOrder, OrderStatus } from "@/app/types/order.types";
import { formatCurrency } from "@/lib/utils";
import { formatDate } from "@/lib/dateUtils";
import { Skeleton } from "@/components/ui/skeleton";

/* ─────────────────────────── config ─────────────────────────── */

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    subLabel: string;
    bannerBg: string;
    bannerText: string;
    icon: React.ReactNode;
  }
> = {
  PENDING: {
    label: "Chờ xác nhận",
    subLabel: "Đơn hàng đang chờ người bán xác nhận",
    bannerBg: "from-orange-500 to-amber-400",
    bannerText: "text-white",
    icon: <Clock size={28} />,
  },
  AWAITING_PAYMENT: {
    label: "Chờ thanh toán",
    subLabel: "Đơn hàng đã được tạo và đang chờ hoàn tất thanh toán",
    bannerBg: "from-amber-500 to-orange-400",
    bannerText: "text-white",
    icon: <CreditCard size={28} />,
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    subLabel: "Người bán đã xác nhận đơn hàng của bạn",
    bannerBg: "from-blue-500 to-cyan-400",
    bannerText: "text-white",
    icon: <CheckCircle2 size={28} />,
  },
  PROCESSING: {
    label: "Đang xử lý",
    subLabel: "Đơn hàng đang được chuẩn bị và đóng gói",
    bannerBg: "from-blue-600 to-indigo-500",
    bannerText: "text-white",
    icon: <Package size={28} />,
  },
  SHIPPING: {
    label: "Đang giao hàng",
    subLabel: "Đơn hàng đang trên đường giao đến bạn",
    bannerBg: "from-indigo-500 to-violet-500",
    bannerText: "text-white",
    icon: <Truck size={28} />,
  },
  READY_FOR_PICKUP: {
    label: "Chờ lấy hàng",
    subLabel: "Đơn hàng đã sẵn sàng và đang chờ đơn vị vận chuyển lấy",
    bannerBg: "from-sky-500 to-cyan-400",
    bannerText: "text-white",
    icon: <Truck size={28} />,
  },
  COMPLETED: {
    label: "Giao hàng thành công",
    subLabel: "Đơn hàng đã được giao thành công",
    bannerBg: "from-teal-500 to-emerald-400",
    bannerText: "text-white",
    icon: <CheckCircle2 size={28} />,
  },
  AWAITING_REPLENISHMENT: {
    label: "Chờ bổ sung hàng",
    subLabel: "Sản phẩm đang được điều chuyển giữa các kho để hoàn thiện đơn hàng của bạn",
    bannerBg: "from-orange-500 to-amber-500",
    bannerText: "text-white",
    icon: <Package size={28} />,
  },
  CANCELLED: {
    label: "Đã hủy đơn",
    subLabel: "Đơn hàng này đã bị hủy",
    bannerBg: "from-gray-500 to-gray-400",
    bannerText: "text-white",
    icon: <XCircle size={28} />,
  },
  RETURNED: {
    label: "Trả hàng / Hoàn tiền",
    subLabel: "Yêu cầu trả hàng đang được xử lý",
    bannerBg: "from-rose-500 to-pink-400",
    bannerText: "text-white",
    icon: <RotateCcw size={28} />,
  },
};

const paymentLabel: Record<string, string> = {
  COD: "Thanh toán khi nhận hàng (COD)",
  CASH: "Tiền mặt tại cửa hàng",
  TRANSFER: "Chuyển khoản ngân hàng",
  PAYOS: "Thanh toán qua PayOS",
};

const steps = [
  { icon: FileText, label: "Đặt hàng", status: "PENDING" },
  { icon: CreditCard, label: "Thanh toán", status: "AWAITING_PAYMENT" },
  { icon: CheckCircle2, label: "Xác nhận", status: "CONFIRMED" },
  { icon: Package, label: "Xử lý", status: "PROCESSING" },
  { icon: Truck, label: "Lấy hàng", status: "READY_FOR_PICKUP" },
  { icon: Truck, label: "Giao hàng", status: "SHIPPING" },
  { icon: CheckCircle2, label: "Hoàn thành", status: "COMPLETED" },
];

/* ─────────────────────────── helpers ─────────────────────────── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-1.5 text-gray-400 hover:text-gray-600 transition-colors"
      title="Sao chép"
    >
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
    </button>
  );
}

/* ─────────────────────────── skeletons ─────────────────────────── */

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Skeleton className="h-14 w-full rounded-none" />
      <Skeleton className="h-32 w-full rounded-none" />
      <div className="px-3 py-3 space-y-3">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-56 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  );
}

/* ─────────────────────────── page ─────────────────────────── */

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<MyOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await orderService.getOrderById(id);
        setOrder(data);
      } catch (err) {
        console.error("Failed to fetch order details:", err);
        setError("Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) return <LoadingSkeleton />;

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center gap-4 p-6">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-sm max-w-sm w-full">
          <XCircle className="text-red-400" size={52} />
          <p className="text-gray-600 text-sm text-center">
            {error ?? "Không tìm thấy đơn hàng."}
          </p>
          <Link
            href="/orders/list"
            className="w-full text-center py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Quay lại danh sách đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  const activeStep = (() => {
    if (order.status === "CANCELLED" || order.status === "RETURNED") return -1;
    if (order.status === "AWAITING_REPLENISHMENT") return steps.findIndex((s) => s.status === "PROCESSING");
    const idx = steps.findIndex((s) => s.status === order.status);
    return idx !== -1 ? idx : 0;
  })();

  const cfg = statusConfig[order.status];
  const showStepper = order.status !== "CANCELLED" && order.status !== "RETURNED";
  const progressPct =
    activeStep > 0
      ? (activeStep / (steps.length - 1)) * 100
      : 0;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">

      {/* ── NAVBAR ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 h-14 flex items-center gap-3">
          <Link
            href="/orders/list"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">Trở lại</span>
          </Link>
          <div className="flex-1 h-5 border-l border-gray-200 pl-3">
            <span className="text-sm font-semibold text-gray-700">Chi tiết đơn hàng</span>
          </div>
          <span className="text-xs text-gray-400 hidden sm:block">#{order.code}</span>
        </div>
      </div>

      {/* ── STATUS BANNER ── */}
      <div className={`bg-gradient-to-r ${cfg.bannerBg} ${cfg.bannerText}`}>
        <div className="px-5 py-5 flex items-center gap-4">
          <div className="opacity-90">{cfg.icon}</div>
          <div>
            <p className="text-base font-bold leading-tight">{cfg.label}</p>
            <p className="text-xs opacity-80 mt-0.5">{cfg.subLabel}</p>
          </div>
        </div>

        {/* Stepper inside banner */}
        {showStepper && (
          <div className="px-5 pb-5">
            <div className="bg-white/15 rounded-xl px-4 py-4">
              <div className="relative flex justify-between">
                {/* track background */}
                <div className="absolute top-[15px] left-[16px] right-[16px] h-0.5 bg-white/30 rounded-full" />
                {/* track fill */}
                <div
                  className="absolute top-[15px] left-[16px] h-0.5 bg-white rounded-full transition-all duration-700"
                  style={{ width: `calc(${progressPct}% * (100% - 32px) / 100)` }}
                />
                {steps.map((step, idx) => {
                  const done = idx < activeStep;
                  const active = idx === activeStep;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1.5 relative z-10 flex-1">
                      <div
                        className={`w-[30px] h-[30px] rounded-full flex items-center justify-center transition-all duration-300
                          ${done || active
                            ? "bg-white text-teal-600 shadow-md"
                            : "bg-white/30 text-white/60"
                          }
                          ${active ? "ring-4 ring-white/40 scale-110" : ""}
                        `}
                      >
                        {done ? (
                          <Check size={13} className="stroke-[2.5]" />
                        ) : (
                          <step.icon size={13} />
                        )}
                      </div>
                      <span
                        className={`text-[9px] text-center leading-tight font-medium
                          ${done || active ? "text-white" : "text-white/50"}`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BODY ── */}
      <div className="px-3 py-3 space-y-2.5">

        {/* ── ORDER CODE CARD ── */}
        <div className="bg-white rounded-xl px-4 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-0.5">Mã đơn hàng</p>
            <div className="flex items-center">
              <span className="text-sm font-bold text-gray-800">#{order.code}</span>
              <CopyButton text={order.code} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-0.5">Ngày đặt</p>
            <span className="text-sm text-gray-600">{formatDate(order.createdAt)}</span>
          </div>
        </div>

        {/* ── ADDRESS + BRANCH ── */}
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            {/* Địa chỉ */}
            <div className="px-4 py-3.5 flex gap-3">
              <div className="mt-0.5 w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                <MapPin size={15} className="text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-teal-600 font-semibold uppercase tracking-wide mb-1">
                  Địa chỉ nhận hàng
                </p>
                <p className="text-sm font-semibold text-gray-900">{order.receiverName || order.customerName}</p>
                <p className="text-sm text-gray-500">{order.receiverPhone}</p>
                <p className="text-sm text-gray-500 leading-relaxed mt-0.5">{order.shippingAddress}</p>
              </div>
            </div>

            {/* Cửa hàng */}
            <div className="px-4 py-3.5 flex gap-3">
              <div className="mt-0.5 w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                <Store size={15} className="text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-teal-600 font-semibold uppercase tracking-wide mb-1">
                  Cửa hàng xử lý
                </p>
                <p className="text-sm font-semibold text-gray-900">Cửa hàng AgriShrimp</p>
                <p className="text-sm text-gray-500 mt-0.5">Đơn hàng được xử lý bởi hệ thống cửa hàng phù hợp.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── PRODUCT LIST ── */}
        <div className="bg-white rounded-xl overflow-hidden">
          {/* header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <ShoppingBag size={14} className="text-teal-600" />
            <span className="text-sm font-semibold text-gray-700">
              Sản phẩm ({order.items.length})
            </span>
          </div>

          {/* items */}
          <div className="divide-y divide-gray-50">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-3 px-4 py-3.5">
                {/* image */}
                <div className="relative w-[72px] h-[72px] rounded-lg border border-gray-100 shrink-0 overflow-hidden bg-gray-50">
                  <Image
                    src={item.image || "/placeholder.png"}
                    alt={item.productName}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm text-gray-900 font-medium leading-snug line-clamp-2">
                      {item.productName}
                    </p>
                    {order.status === "COMPLETED" && (
                      item.canReview === false ? (
                        <span className="shrink-0 text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md uppercase tracking-wider cursor-not-allowed">
                          Đã đánh giá
                        </span>
                      ) : (
                        <Link
                          href={`/reviews/write/${item.productId}?orderId=${order.id}`}
                          className="shrink-0 text-[10px] font-bold text-teal-600 hover:bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md transition-all uppercase tracking-wider"
                        >
                          Đánh giá
                        </Link>
                      )
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Phân loại: {item.sku}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">x{item.quantity}</span>
                    <div className="text-right">
                      {item.price !== item.totalPrice / item.quantity && (
                        <p className="text-xs text-gray-400 line-through">
                          {formatCurrency(item.price)}
                        </p>
                      )}
                      <p className="text-sm font-bold text-orange-500">
                        {formatCurrency(item.totalPrice)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* price summary */}
          <div className="bg-gray-50/60 border-t border-dashed border-gray-200 px-4 py-3 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Tạm tính</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Phí vận chuyển</span>
              <span>{formatCurrency(order.shippingFee)}</span>
            </div>
            <div className="flex justify-between items-center pt-2.5 border-t border-gray-200">
              <span className="text-sm font-semibold text-gray-700">Tổng thanh toán</span>
              <span className="text-xl font-bold text-orange-500">
                {formatCurrency(order.finalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* ── PAYMENT CARD ── */}
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <CreditCard size={14} className="text-teal-600" />
            <span className="text-sm font-semibold text-gray-700">Thông tin thanh toán</span>
          </div>
          <div className="px-4 py-3.5 space-y-3">
            <div className="flex justify-between items-start gap-3 text-sm">
              <span className="text-gray-400 shrink-0">Phương thức</span>
              <span className="text-gray-800 font-medium text-right">
                {paymentLabel[order.paymentMethod] ?? order.paymentMethod}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Trạng thái</span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold
                  ${order.paymentStatus === "PAID"
                    ? "bg-green-50 text-green-600"
                    : "bg-orange-50 text-orange-500"
                  }`}
              >
                {order.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
              </span>
            </div>
          </div>

          {order.paymentStatus === "UNPAID" &&
            order.checkoutUrl &&
            order.status !== "CANCELLED" && (
              <div className="px-4 pb-4">
                <a
                  href={order.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm shadow-teal-200 active:scale-[0.98]"
                >
                  Thanh toán ngay
                </a>
              </div>
            )}
        </div>

        {/* ── CANCELLED/RETURNED NOTE ── */}
        {(order.status === "CANCELLED" || order.status === "RETURNED") && (
          <div className="bg-white rounded-xl px-4 py-4 flex gap-3 items-start">
            <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-700">
                {order.status === "CANCELLED" ? "Đơn hàng đã bị hủy" : "Yêu cầu trả hàng"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {order.status === "CANCELLED"
                  ? "Mọi khoản thanh toán (nếu có) sẽ được hoàn trả trong 3–5 ngày làm việc."
                  : "Yêu cầu trả hàng đang được xử lý. Chúng tôi sẽ liên hệ sớm."}
              </p>
            </div>
          </div>
        )}

        {/* ── BOTTOM ACTIONS ── */}
        <div className="bg-white rounded-xl px-4 py-4 flex gap-2.5">
          <Link
            href="/orders/list"
            className="flex-1 text-center py-2.5 border border-gray-200 hover:border-teal-400 text-gray-600 hover:text-teal-600 text-sm font-semibold rounded-xl transition-colors"
          >
            Đơn hàng của tôi
          </Link>
          <Link
            href="/san-pham"
            className="flex-1 text-center py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Tiếp tục mua sắm
          </Link>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
