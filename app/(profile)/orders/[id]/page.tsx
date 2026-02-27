"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CreditCard,
  FileText,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ChevronLeft,
  MapPin,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { orderService } from "@/app/services/order.service";
import { MyOrder, OrderStatus } from "@/app/types/order.types";
import { formatCurrency } from "@/lib/utils";
import { formatDate } from "@/lib/dateUtils";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig: Record<
  OrderStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "Chờ xác nhận",
    color: "text-orange-500",
    icon: <Clock size={16} className="mr-1" />,
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    color: "text-blue-500",
    icon: <CheckCircle2 size={16} className="mr-1" />,
  },
  PROCESSING: {
    label: "Đang xử lý",
    color: "text-blue-600",
    icon: <Package size={16} className="mr-1" />,
  },
  SHIPPING: {
    label: "Đang giao hàng",
    color: "text-indigo-500",
    icon: <Truck size={16} className="mr-1" />,
  },
  COMPLETED: {
    label: "Hoàn thành",
    color: "text-green-500",
    icon: <CheckCircle2 size={16} className="mr-1" />,
  },
  CANCELLED: {
    label: "Đã hủy",
    color: "text-red-500",
    icon: <XCircle size={16} className="mr-1" />,
  },
  RETURNED: {
    label: "Trả hàng",
    color: "text-gray-500",
    icon: <RefreshCw size={16} className="mr-1" />,
  },
};

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
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-40 w-full mb-4" />
        <Skeleton className="h-60 w-full mb-4" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-5xl">
        <h2 className="text-xl font-bold text-red-500 mb-4">{error}</h2>
        <Link
          href="/orders/list"
          className="text-[#2d9f8d] hover:underline flex items-center justify-center"
        >
          <ChevronLeft size={16} /> Quay lại danh sách đơn hàng
        </Link>
      </div>
    );
  }

  // Cấu hình các bước Stepper
  const steps = [
    { icon: FileText, label: "Đơn hàng đã đặt", status: "PENDING" },
    { icon: CheckCircle2, label: "Đã xác nhận", status: "CONFIRMED" },
    { icon: Package, label: "Đang xử lý", status: "PROCESSING" },
    { icon: Truck, label: "Đang giao hàng", status: "SHIPPING" },
    { icon: CheckCircle2, label: "Hoàn thành", status: "COMPLETED" },
  ];

  const getActiveStep = () => {
    if (order.status === "CANCELLED" || order.status === "RETURNED") return -1;
    const index = steps.findIndex((s) => s.status === order.status);
    return index !== -1 ? index : 0;
  };

  const activeStep = getActiveStep();
  const currentStatus = statusConfig[order.status];

  return (
    <div className="font-sans text-gray-800">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <h1 className="text-xl font-bold uppercase">Mã đơn hàng: {order.code}</h1>
          <span className={`${currentStatus.color} font-bold uppercase text-sm flex items-center bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100`}>
            {currentStatus.icon} {currentStatus.label}
          </span>
        </div>

        {/* STEPPER - Ẩn nếu đã hủy hoặc trả hàng */}
        {order.status !== "CANCELLED" && order.status !== "RETURNED" && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-4">
            <div className="relative flex justify-between w-full px-4 mb-6">
              <div className="absolute top-[17px] left-10 right-10 h-1 bg-gray-200 -z-0"></div>
              <div
                className="absolute top-[17px] left-10 h-1 bg-[#2d9f8d] -z-0 transition-all duration-500"
                style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
              ></div>

              {steps.map((step, idx) => {
                const isActive = idx === activeStep;
                const isFinished = idx < activeStep;
                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center relative z-10 w-1/5"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold transition-all ${isActive || isFinished ? "bg-[#2d9f8d]" : "bg-gray-300"} ${isActive ? "shadow-[0_0_0_4px_rgba(45,159,141,0.2)]" : ""}`}
                    >
                      <step.icon size={16} />
                    </div>
                    <div
                      className={`mt-2 text-xs font-bold text-center ${isActive || isFinished ? "text-gray-900" : "text-gray-400"}`}
                    >
                      {step.label}
                    </div>
                  </div>
                );
              })}
            </div>

            {order.status === "PENDING" && (
              <div className="bg-orange-50 border border-orange-100 rounded p-3 flex items-start gap-3">
                <Clock className="text-orange-500 mt-0.5" size={18} />
                <div className="text-sm text-gray-700">
                  Đơn hàng đang chờ người bán xác nhận. Vui lòng chờ trong giây lát.
                </div>
              </div>
            )}
          </div>
        )}

        {/* INFO CARD */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="text-[#2d9f8d]" size={18} />
                <h3 className="font-bold text-gray-800 text-sm">
                  Địa chỉ nhận hàng
                </h3>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex">
                  <span className="w-32">Người nhận</span>{" "}
                  <span className="font-medium text-gray-900">
                    {order.customerName}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32">Số điện thoại</span>{" "}
                  <span className="font-medium text-gray-900">
                    {order.customerPhone}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32">Địa chỉ</span>{" "}
                  <span className="font-medium text-gray-900 flex-1">
                    {order.shippingAddress}
                  </span>
                </div>
              </div>
            </div>
            <div className="md:border-l md:pl-8 border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="text-[#2d9f8d]" size={18} />
                <h3 className="font-bold text-gray-800 text-sm">
                  Thông tin thanh toán
                </h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="w-32 text-gray-500">Phương thức</span>{" "}
                  <span className="font-medium text-gray-900">
                    {order.paymentMethod === "COD" ? "Thanh toán khi nhận hàng (COD)" : 
                     order.paymentMethod === "PAYOS" ? "Thanh toán qua PayOS" :
                     order.paymentMethod === "TRANSFER" ? "Chuyển khoản" : order.paymentMethod}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32 text-gray-500">Trạng thái</span>{" "}
                  <span className={`font-bold ${order.paymentStatus === "PAID" ? "text-green-600" : "text-orange-500"}`}>
                    {order.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32 text-gray-500">Chi nhánh</span>{" "}
                  <span className="font-medium text-gray-900">
                    {order.branchName}
                  </span>
                </div>
              </div>
              {order.paymentStatus === "UNPAID" && order.checkoutUrl && order.status !== "CANCELLED" && (
                <a 
                  href={order.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center justify-center px-4 h-10 bg-[#2d9f8d] text-white text-sm font-bold rounded hover:bg-[#248273] transition-colors"
                >
                  Thanh toán ngay
                </a>
              )}
            </div>
          </div>
        </div>

        {/* PRODUCT LIST */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-sm text-gray-700 flex justify-between items-center">
            <span>Danh sách sản phẩm</span>
            <span className="text-gray-500 font-normal">Ngày đặt: {formatDate(order.createdAt)}</span>
          </div>
          <div className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 items-center">
                <div className="relative w-16 h-16 border rounded border-gray-200 flex-shrink-0">
                  <Image
                    src={item.image || "/placeholder.png"}
                    alt={item.productName}
                    fill
                    className="object-cover rounded"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-gray-900 truncate">
                    {item.productName}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    SKU: {item.sku}
                  </div>
                </div>
                <div className="text-right flex flex-col justify-center gap-1">
                  <div className="text-sm text-gray-900 font-medium">
                    {formatCurrency(item.price)} x{item.quantity}
                  </div>
                  <div className="font-bold text-sm text-[#2d9f8d]">
                    {formatCurrency(item.totalPrice)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Summary */}
          <div className="bg-gray-50 p-4 space-y-2 border-t border-gray-100">
             <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tổng tiền hàng</span>
              <span className="text-gray-900">{formatCurrency(order.finalAmount)}</span>
            </div>
            {/* Nếu có phí ship, voucher có thể bổ sung sau */}
            <div className="flex justify-between text-base pt-2 border-t border-gray-200 mt-2">
              <span className="text-gray-800 font-bold">Tổng thanh toán</span>
              <span className="font-bold text-red-600 text-lg">
                {formatCurrency(order.finalAmount)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Link
            href="/orders/list"
            className="px-6 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Quay lại danh sách
          </Link>
        </div>
      </div>
    </div>
  );
}
