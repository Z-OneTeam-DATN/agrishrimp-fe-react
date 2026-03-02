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
  RefreshCw,
  Store,
  Phone,
  CreditCard,
} from "lucide-react";
import { orderService } from "@/app/services/order.service";
import { MyOrder, OrderStatus } from "@/app/types/order.types";
import { formatCurrency } from "@/lib/utils";
import { formatDate } from "@/lib/dateUtils";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig: Record<
  OrderStatus,
  { label: string; color: string; dotColor: string }
> = {
  PENDING:    { label: "Chờ xác nhận",   color: "text-orange-500", dotColor: "bg-orange-400" },
  CONFIRMED:  { label: "Đã xác nhận",    color: "text-blue-500",   dotColor: "bg-blue-400" },
  PROCESSING: { label: "Đang xử lý",     color: "text-blue-600",   dotColor: "bg-blue-500" },
  SHIPPING:   { label: "Đang giao hàng", color: "text-indigo-500", dotColor: "bg-indigo-400" },
  COMPLETED:  { label: "Hoàn thành",     color: "text-green-600",  dotColor: "bg-green-500" },
  CANCELLED:  { label: "Đã hủy",         color: "text-red-500",    dotColor: "bg-red-400" },
  RETURNED:   { label: "Trả hàng",       color: "text-gray-500",   dotColor: "bg-gray-400" },
};

const paymentLabel: Record<string, string> = {
  COD:      "Thanh toán khi nhận hàng (COD)",
  CASH:     "Tiền mặt tại cửa hàng",
  TRANSFER: "Chuyển khoản ngân hàng",
  PAYOS:    "Thanh toán qua PayOS",
};

const steps = [
  { icon: FileText,      label: "Đã đặt hàng", status: "PENDING" },
  { icon: CheckCircle2,  label: "Đã xác nhận", status: "CONFIRMED" },
  { icon: Package,       label: "Đang xử lý",  status: "PROCESSING" },
  { icon: Truck,         label: "Đang giao",   status: "SHIPPING" },
  { icon: CheckCircle2,  label: "Hoàn thành",  status: "COMPLETED" },
];

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 space-y-3">
        <Skeleton className="h-14 w-full rounded-none" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-4 p-6">
        <XCircle className="text-red-400" size={48} />
        <p className="text-gray-600 text-sm">{error ?? "Không tìm thấy đơn hàng."}</p>
        <Link href="/orders/list" className="text-[#2d9f8d] text-sm hover:underline flex items-center gap-1">
          <ChevronLeft size={14} /> Quay lại danh sách
        </Link>
      </div>
    );
  }

  const activeStep = (() => {
    if (order.status === "CANCELLED" || order.status === "RETURNED") return -1;
    const idx = steps.findIndex((s) => s.status === order.status);
    return idx !== -1 ? idx : 0;
  })();

  const currentStatus = statusConfig[order.status];
  const showStepper = order.status !== "CANCELLED" && order.status !== "RETURNED";
  const isMultiBranch = order.branchName === "Nhiều chi nhánh";

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ── TOP HEADER ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link
            href="/orders/list"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors shrink-0"
          >
            <ChevronLeft size={16} />
            Trở lại
          </Link>
          <span className="text-sm text-gray-400 tracking-wide hidden sm:block">
            #{order.code}
          </span>
          <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${currentStatus.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dotColor}`} />
            {currentStatus.label}
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-3 space-y-3">

        {/* ── ORDER CODE (mobile) ── */}
        <p className="text-xs text-gray-400 sm:hidden">Mã đơn: #{order.code}</p>

        {/* ── STEPPER ── */}
        {showStepper && (
          <div className="bg-white rounded-md p-5">
            <div className="relative flex justify-between">
              {/* track */}
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200" />
              <div
                className="absolute top-4 left-4 h-0.5 bg-[#2d9f8d] transition-all duration-500"
                style={{ width: activeStep > 0 ? `${(activeStep / (steps.length - 1)) * (100 - (100 / steps.length))}%` : "0%" }}
              />
              {steps.map((step, idx) => {
                const done = idx < activeStep;
                const active = idx === activeStep;
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 relative z-10 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all
                        ${done || active ? "bg-[#2d9f8d] text-white" : "bg-gray-200 text-gray-400"}
                        ${active ? "ring-4 ring-[#2d9f8d]/20" : ""}`}
                    >
                      <step.icon size={14} />
                    </div>
                    <span className={`text-[10px] text-center leading-tight font-medium
                      ${done || active ? "text-[#2d9f8d]" : "text-gray-400"}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {order.status === "PENDING" && (
              <p className="mt-4 text-xs text-orange-600 bg-orange-50 border border-orange-100 rounded px-3 py-2 flex items-center gap-2">
                <Clock size={13} className="shrink-0" />
                Đơn hàng đang chờ người bán xác nhận, vui lòng chờ trong giây lát.
              </p>
            )}
          </div>
        )}

        {/* ── ADDRESS + BRANCH CARD ── */}
        <div className="bg-white rounded-md overflow-hidden">
          {/* Địa chỉ nhận hàng */}
          <div className="px-4 py-3 border-b border-dashed border-gray-200">
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin size={13} className="text-[#2d9f8d] shrink-0" />
              <span className="text-xs font-semibold text-[#2d9f8d] uppercase tracking-wide">
                Địa chỉ nhận hàng
              </span>
            </div>
            <div className="pl-5 space-y-1">
              <p className="text-sm font-semibold text-gray-900">{order.customerName}</p>
              <p className="text-sm text-gray-500">{order.receiverPhone}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{order.shippingAddress}</p>
            </div>
          </div>

          {/* Chi nhánh */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Store size={13} className="text-[#2d9f8d] shrink-0" />
              <span className="text-xs font-semibold text-[#2d9f8d] uppercase tracking-wide">
                Chi nhánh xử lý
              </span>
            </div>
            <div className="pl-5 space-y-1">
              <p className="text-sm font-semibold text-gray-900">{order.branchName}</p>
              {!isMultiBranch && order.branchPhone && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Phone size={11} className="text-gray-400" />
                  {order.branchPhone}
                </p>
              )}
              {!isMultiBranch && order.branchAddress && (
                <p className="text-sm text-gray-500">{order.branchAddress}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── PRODUCT LIST ── */}
        <div className="bg-white rounded-md overflow-hidden">
          {/* header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Sản phẩm đã đặt</span>
            <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
          </div>

          {/* items */}
          <div className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-3 px-4 py-3">
                <div className="relative w-[68px] h-[68px] rounded border border-gray-200 shrink-0 overflow-hidden">
                  <Image
                    src={item.image || "/placeholder.png"}
                    alt={item.productName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <p className="text-sm text-gray-900 font-medium leading-snug line-clamp-2">
                    {item.productName}
                  </p>
                  <p className="text-xs text-gray-400">SKU: {item.sku}</p>
                  <p className="text-xs text-gray-500">x{item.quantity}</p>
                </div>
                <div className="text-right flex flex-col justify-between py-0.5 shrink-0">
                  <span className="text-xs text-gray-400">{formatCurrency(item.price)}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(item.totalPrice)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* price summary */}
          <div className="border-t border-dashed border-gray-200 px-4 py-3 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Tổng tiền hàng</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Phí vận chuyển</span>
              <span>{formatCurrency(order.shippingFee)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Tổng thanh toán</span>
              <span className="text-lg font-bold text-red-500">
                {formatCurrency(order.finalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* ── PAYMENT CARD ── */}
        <div className="bg-white rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-1.5">
            <CreditCard size={13} className="text-[#2d9f8d]" />
            <span className="text-xs font-semibold text-[#2d9f8d] uppercase tracking-wide">
              Thông tin thanh toán
            </span>
          </div>
          <div className="px-4 py-3 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Phương thức</span>
              <span className="text-gray-900 font-medium text-right max-w-[60%]">
                {paymentLabel[order.paymentMethod] ?? order.paymentMethod}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Trạng thái</span>
              <span className={`font-semibold ${order.paymentStatus === "PAID" ? "text-green-600" : "text-orange-500"}`}>
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
                className="block w-full text-center py-2.5 bg-[#2d9f8d] hover:bg-[#248273] text-white text-sm font-bold rounded transition-colors"
              >
                Thanh toán ngay
              </a>
            </div>
          )}
        </div>

        {/* bottom spacing */}
        <div className="h-4" />
      </div>
    </div>
  );
}
