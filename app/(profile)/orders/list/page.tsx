"use client";

import { useSearchParams } from "next/navigation";
import { OrderTabs } from "@/components/orders/OrderTabs";
import { OrderCard } from "@/components/orders/OrderCard";
import { orderService } from "@/app/services/order.service";
import { PackageX, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { MyOrder } from "@/app/types/order.types";
import { toast } from "sonner";
import { matchesUserOrderFilter, normalizeUserOrderFilter, UserOrderFilter } from "@/components/orders/order-status-utils";

export default function OrderingPage() {
  const searchParams = useSearchParams();
  const statusFilter = normalizeUserOrderFilter(searchParams.get("status")) as UserOrderFilter;

  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const payosRetryRef = useRef(0);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const data = await orderService.getMyOrders("ALL");
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setIsError(true);
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const visibleOrders = orders.filter((order) => matchesUserOrderFilter(order.status, statusFilter));

  // Fetch lại khi đổi tab
  useEffect(() => {
    payosRetryRef.current = 0;
    fetchOrders();
  }, [fetchOrders]);

  // Tự động re-fetch nếu có đơn PayOS chưa thanh toán (webhook chưa kịp xử lý)
  useEffect(() => {
    const hasPendingPayos = orders.some(
      (o) => o.paymentMethod === "PAYOS" && o.paymentStatus === "UNPAID" && o.status === "AWAITING_PAYMENT"
    );
    if (!hasPendingPayos || payosRetryRef.current >= 3) return;
    const t = setTimeout(() => {
      payosRetryRef.current++;
      fetchOrders();
    }, 3000);
    return () => clearTimeout(t);
  }, [orders, fetchOrders]);

  return (
    <>
      <OrderTabs />

      <div className="mt-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-white rounded-lg shadow-sm border border-gray-100">
            <Loader2 className="h-8 w-8 animate-spin text-[#2d9f8d] mb-2" />
            <p>Đang tải danh sách đơn hàng...</p>
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-red-500 bg-white rounded-lg shadow-sm border border-gray-100">
            <p className="mb-4">Có lỗi xảy ra khi tải đơn hàng.</p>
            <button 
              onClick={fetchOrders}
              className="px-4 py-2 bg-[#2d9f8d] text-white rounded-md hover:bg-[#248273]"
            >
              Thử lại
            </button>
          </div>
        ) : visibleOrders.length > 0 ? (
          visibleOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onOrderCancelled={fetchOrders}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center bg-white rounded-lg p-10 border border-gray-100 shadow-sm min-h-[350px]">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <PackageX size={40} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">Chưa có đơn hàng nào.</p>
            <Link
              href="/san-pham"
              className="mt-4 px-6 py-2 bg-[#2d9f8d] text-white rounded-full font-bold text-sm hover:bg-[#248273] transition-colors"
            >
              Mua sắm ngay
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
