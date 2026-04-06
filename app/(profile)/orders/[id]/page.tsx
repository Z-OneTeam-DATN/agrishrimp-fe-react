"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ChevronLeft,
  MapPin,
  XCircle,
  Store,
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

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    subLabel: string;
    bannerBg: string;
    icon: React.ReactNode;
  }
> = {
  PENDING: {
    label: "Chờ xác nhận",
    subLabel: "Đơn hàng đã được ghi nhận và đang chờ cửa hàng xác nhận.",
    bannerBg: "from-[#329965] to-[#2d9f8d]",
    icon: <Clock size={28} />,
  },
  AWAITING_PAYMENT: {
    label: "Chờ thanh toán",
    subLabel: "Đơn hàng đang chờ bạn hoàn tất thanh toán online.",
    bannerBg: "from-[#329965] to-[#2d9f8d]",
    icon: <CreditCard size={28} />,
  },
  AWAITING_REPLENISHMENT: {
    label: "Chờ lấy hàng",
    subLabel: "Đơn hàng đã được xác nhận. Cửa hàng đang bổ sung thêm sản phẩm để sớm bàn giao cho vận chuyển.",
    bannerBg: "from-[#329965] to-[#2d9f8d]",
    icon: <Package size={28} />,
  },
  CONFIRMED: {
    label: "Chờ lấy hàng",
    subLabel: "Đơn hàng đã được duyệt và đang chờ chuẩn bị để bàn giao.",
    bannerBg: "from-[#329965] to-[#2d9f8d]",
    icon: <Package size={28} />,
  },
  PROCESSING: {
    label: "Chờ lấy hàng",
    subLabel: "Đơn hàng đang được chuẩn bị trước khi bàn giao cho vận chuyển.",
    bannerBg: "from-[#329965] to-[#2d9f8d]",
    icon: <Package size={28} />,
  },
  READY_FOR_PICKUP: {
    label: "Chờ lấy hàng",
    subLabel: "Đơn hàng đã được xác nhận và đang chờ chuẩn bị để bàn giao vận chuyển.",
    bannerBg: "from-[#329965] to-[#2d9f8d]",
    icon: <Package size={28} />,
  },
  SHIPPING: {
    label: "Chờ giao hàng",
    subLabel: "Đơn hàng đã bàn giao vận chuyển và đang trên đường đến bạn.",
    bannerBg: "from-[#329965] to-[#2d9f8d]",
    icon: <Truck size={28} />,
  },
  COMPLETED: {
    label: "Đã giao",
    subLabel: "Đơn hàng đã được giao thành công.",
    bannerBg: "from-[#329965] to-[#2d9f8d]",
    icon: <CheckCircle2 size={28} />,
  },
  CANCELLED: {
    label: "Đã hủy",
    subLabel: "Đơn hàng này đã bị hủy.",
    bannerBg: "from-slate-500 to-slate-400",
    icon: <XCircle size={28} />,
  },
  RETURNED: {
    label: "Trả hàng",
    subLabel: "Yêu cầu trả hàng đang được xử lý.",
    bannerBg: "from-rose-500 to-pink-400",
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
  { icon: Clock, label: "Chờ xác nhận", status: "PENDING" },
  { icon: Package, label: "Chờ lấy hàng", status: "READY_FOR_PICKUP" },
  { icon: Truck, label: "Chờ giao hàng", status: "SHIPPING" },
  { icon: CheckCircle2, label: "Đã giao", status: "COMPLETED" },
] as const;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-1.5 text-gray-400 transition-colors hover:text-gray-600"
      title="Sao chép"
      type="button"
    >
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#f6f8f7]">
      <Skeleton className="h-14 w-full rounded-none" />
      <Skeleton className="h-32 w-full rounded-none" />
      <div className="space-y-3 px-3 py-3">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-56 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<MyOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f6f8f7] p-6">
        <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl bg-white p-8 shadow-sm">
          <XCircle className="text-red-400" size={52} />
          <p className="text-center text-sm text-gray-600">{error ?? "Không tìm thấy đơn hàng."}</p>
          <Link
            href="/orders/list"
            className="w-full rounded-lg bg-teal-600 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-teal-700"
          >
            Quay lại danh sách đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  const activeStep = (() => {
    if (order.status === "CANCELLED" || order.status === "RETURNED") return -1;
    if (order.status === "AWAITING_PAYMENT") return 0;
    if (order.status === "AWAITING_REPLENISHMENT") return 1;
    if (order.status === "CONFIRMED" || order.status === "PROCESSING") return 1;
    const idx = steps.findIndex((step) => step.status === order.status);
    return idx === -1 ? 0 : idx;
  })();

  const cfg = statusConfig[order.status];
  const showStepper = order.status !== "CANCELLED" && order.status !== "RETURNED";
  const progressPct = activeStep <= 0 ? 0 : (activeStep / (steps.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-[#f6f8f7]">
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link href="/orders/list" className="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-800">
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">Trở lại</span>
          </Link>
          <div className="h-5 flex-1 border-l border-gray-200 pl-3">
            <span className="text-sm font-semibold text-gray-700">Chi tiết đơn hàng</span>
          </div>
          <span className="hidden text-xs text-gray-400 sm:block">#{order.code}</span>
        </div>
      </div>

      <div className={`bg-gradient-to-r ${cfg.bannerBg} text-white`}>
        <div className="flex items-center gap-4 px-5 py-5">
          <div className="opacity-90">{cfg.icon}</div>
          <div>
            <p className="text-base font-bold leading-tight">{cfg.label}</p>
            <p className="mt-0.5 text-xs opacity-85">{cfg.subLabel}</p>
          </div>
        </div>

        {showStepper && (
          <div className="px-5 pb-5">
            <div className="rounded-xl bg-white/15 px-4 py-4">
              <div className="relative flex justify-between">
                <div className="absolute left-[16px] right-[16px] top-[15px] h-0.5 rounded-full bg-white/30" />
                <div
                  className="absolute left-[16px] top-[15px] h-0.5 rounded-full bg-white transition-all duration-700"
                  style={{ width: `calc(${progressPct}% * (100% - 32px) / 100)` }}
                />
                {steps.map((step, idx) => {
                  const done = idx < activeStep;
                  const active = idx === activeStep;
                  return (
                    <div key={step.status} className="relative z-10 flex flex-1 flex-col items-center gap-1.5">
                      <div
                        className={`flex h-[30px] w-[30px] items-center justify-center rounded-full transition-all duration-300 ${done || active ? "bg-white text-teal-600 shadow-md" : "bg-white/30 text-white/60"} ${active ? "scale-110 ring-4 ring-white/40" : ""}`}
                      >
                        {done ? <Check size={13} className="stroke-[2.5]" /> : <step.icon size={13} />}
                      </div>
                      <span className={`text-center text-[9px] font-medium leading-tight ${done || active ? "text-white" : "text-white/50"}`}>
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

      <div className="space-y-3 px-3 py-3">
        <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3.5">
          <div>
            <p className="mb-0.5 text-[11px] uppercase tracking-wide text-gray-400">Mã đơn hàng</p>
            <div className="flex items-center">
              <span className="text-sm font-bold text-gray-800">#{order.code}</span>
              <CopyButton text={order.code} />
            </div>
          </div>
          <div className="text-right">
            <p className="mb-0.5 text-[11px] uppercase tracking-wide text-gray-400">Ngày đặt</p>
            <span className="text-sm text-gray-600">{formatDate(order.createdAt)}</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-white">
          <div className="grid grid-cols-1 divide-y divide-gray-100 md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="flex gap-3 px-4 py-3.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50">
                <MapPin size={15} className="text-teal-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-teal-600">Địa chỉ nhận hàng</p>
                <p className="text-sm font-semibold text-gray-900">{order.receiverName || order.customerName}</p>
                <p className="text-sm text-gray-500">{order.receiverPhone}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-gray-500">{order.shippingAddress}</p>
              </div>
            </div>

            <div className="flex gap-3 px-4 py-3.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50">
                <Store size={15} className="text-teal-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-teal-600">Cửa hàng xử lý</p>
                <p className="text-sm font-semibold text-gray-900">{order.branchName || "AgriShrimp"}</p>
                <p className="text-sm text-gray-500">{order.branchPhone || ""}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-gray-500">
                  {order.branchAddress || "Đơn hàng được phân bổ cho chi nhánh phù hợp để xử lý."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-white">
          <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
            <ShoppingBag size={14} className="text-teal-600" />
            <span className="text-sm font-semibold text-gray-700">Sản phẩm ({order.items.length})</span>
          </div>

          <div className="divide-y divide-gray-50">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-3 px-4 py-3.5">
                <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                  <Image src={item.image || "/placeholder.png"} alt={item.productName} fill className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-900">{item.productName}</p>
                    {order.status === "COMPLETED" && (
                      item.canReview === false ? (
                        <span className="cursor-not-allowed rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Đã đánh giá
                        </span>
                      ) : (
                        <Link
                          href={`/reviews/write/${item.productId}?orderId=${order.id}`}
                          className="rounded-md border border-teal-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-600 transition-all hover:bg-teal-50"
                        >
                          Đánh giá
                        </Link>
                      )
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">Phân loại: {item.sku}</p>
                  {(item.missingQuantity ?? 0) > 0 && (
                    <p className="mt-1 text-[11px] font-semibold text-[#2d9f8d]">
                      Cửa hàng đang bổ sung thêm {item.missingQuantity} sản phẩm
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-400">x{item.quantity}</span>
                    <div className="text-right">
                      <p className="text-sm font-bold text-orange-500">{formatCurrency(item.totalPrice)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-dashed border-gray-200 bg-gray-50/60 px-4 py-3">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Tạm tính</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Phí vận chuyển</span>
              <span>{formatCurrency(order.shippingFee)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 pt-2.5">
              <span className="text-sm font-semibold text-gray-700">Tổng thanh toán</span>
              <span className="text-xl font-bold text-orange-500">{formatCurrency(order.finalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-white">
          <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
            <CreditCard size={14} className="text-teal-600" />
            <span className="text-sm font-semibold text-gray-700">Thông tin thanh toán</span>
          </div>
          <div className="space-y-3 px-4 py-3.5">
            <div className="flex items-start justify-between gap-3 text-sm">
              <span className="shrink-0 text-gray-400">Phương thức</span>
              <span className="text-right font-medium text-gray-800">{paymentLabel[order.paymentMethod] ?? order.paymentMethod}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Trạng thái</span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${order.paymentStatus === "PAID" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-500"}`}
              >
                {order.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
              </span>
            </div>
          </div>

          {order.paymentStatus === "UNPAID" && order.checkoutUrl && order.status !== "CANCELLED" && (
            <div className="px-4 pb-4">
              <a
                href={order.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 py-3 text-center text-sm font-bold text-white shadow-sm shadow-teal-200 transition-all hover:from-teal-600 hover:to-teal-700 active:scale-[0.98]"
              >
                Thanh toán ngay
              </a>
            </div>
          )}
        </div>

        {(order.status === "CANCELLED" || order.status === "RETURNED") && (
          <div className="flex items-start gap-3 rounded-xl bg-white px-4 py-4">
            <XCircle size={18} className="mt-0.5 shrink-0 text-red-400" />
            <div>
              <p className="text-sm font-semibold text-gray-700">
                {order.status === "CANCELLED" ? "Đơn hàng đã bị hủy" : "Yêu cầu trả hàng"}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                {order.status === "CANCELLED"
                  ? "Khoản thanh toán, nếu có, sẽ được đối soát theo chính sách hiện hành của cửa hàng."
                  : "Cửa hàng đang tiếp nhận và xử lý yêu cầu trả hàng của bạn."}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2.5 rounded-xl bg-white px-4 py-4">
          <Link
            href="/orders/list"
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-center text-sm font-semibold text-gray-600 transition-colors hover:border-teal-400 hover:text-teal-600"
          >
            Đơn hàng của tôi
          </Link>
          <Link
            href="/san-pham"
            className="flex-1 rounded-xl bg-teal-600 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-teal-700"
          >
            Tiếp tục mua sắm
          </Link>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
