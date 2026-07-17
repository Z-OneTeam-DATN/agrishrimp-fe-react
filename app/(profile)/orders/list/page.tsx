"use client";

import { useSearchParams } from "next/navigation";
import { PackageX, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { orderService } from "@/app/services/order.service";
import { MyOrder } from "@/app/types/order.types";
import { OrderCard } from "@/components/orders/OrderCard";
import { OrderTabs } from "@/components/orders/OrderTabs";
import {
  matchesUserOrderFilter,
  normalizeUserOrderFilter,
  UserOrderFilter,
} from "@/components/orders/order-status-utils";

const shouldRetryPendingPayos = (order: MyOrder) =>
  order.paymentMethod === "PAYOS" &&
  ["UNPAID", "PENDING"].includes(order.paymentStatus) &&
  ["PENDING_PAYMENT", "AWAITING_PAYMENT", "PENDING"].includes(order.status);

export default function OrderingPage() {
  const searchParams = useSearchParams();
  const statusFilter = normalizeUserOrderFilter(
    searchParams.get("status"),
  ) as UserOrderFilter;

  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
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

  useEffect(() => {
    payosRetryRef.current = 0;
    void fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const hasPendingPayos = orders.some(shouldRetryPendingPayos);
    if (!hasPendingPayos || payosRetryRef.current >= 3) {
      return;
    }

    const timer = setTimeout(() => {
      payosRetryRef.current += 1;
      void fetchOrders();
    }, 3000);

    return () => clearTimeout(timer);
  }, [orders, fetchOrders]);

  const normalizedKeyword = searchKeyword.trim().toLowerCase();

  const visibleOrders = useMemo(
    () =>
      orders.filter((order) => {
        if (!matchesUserOrderFilter(order.status, statusFilter)) {
          return false;
        }

        if (!normalizedKeyword) {
          return true;
        }

        const searchableValues = [
          order.code,
          order.orderCode,
          order.customerName,
          order.receiverName,
          order.receiverPhone,
          order.shippingAddress,
          ...order.items.flatMap((item) => [item.productName, item.sku]),
        ];

        return searchableValues.some((value) =>
          value?.toLowerCase().includes(normalizedKeyword),
        );
      }),
    [normalizedKeyword, orders, statusFilter],
  );

  return (
    <>
      <OrderTabs />
      <div className="border-t border-gray-100 bg-white px-4 pb-2 pt-2 sm:px-4">
        <label className="flex min-h-[46px] w-full items-center gap-3 bg-[#f5f5f5] px-4 text-gray-600">
          <Search size={22} className="shrink-0 text-gray-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            placeholder="Bạn có thể tìm kiếm theo tên shop, mã đơn hoặc tên sản phẩm"
            className="w-full bg-transparent text-[15px] text-gray-700 outline-none placeholder:text-gray-400 sm:text-base"
          />
        </label>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center border border-gray-100 bg-white py-20 text-gray-500">
            <Loader2 className="mb-2 h-8 w-8 animate-spin text-[#1965a2]" />
            <p>Đang tải danh sách đơn hàng...</p>
          </div>
        ) : isError ? (
          <div className="border border-gray-100 bg-white py-20 text-center text-red-500">
            <p className="mb-4">Có lỗi xảy ra khi tải đơn hàng.</p>
            <button
              onClick={() => void fetchOrders()}
              className="rounded-md bg-[#1965a2] px-4 py-2 text-white hover:bg-[#145486]"
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
          <div className="flex min-h-[350px] flex-col items-center justify-center border border-gray-100 bg-white p-10">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50">
              <PackageX size={40} className="text-gray-300" />
            </div>
            <p className="text-center font-medium text-gray-500">
              {searchKeyword
                ? "Không tìm thấy đơn hàng phù hợp."
                : "Chưa có đơn hàng nào."}
            </p>
            <Link
              href="/san-pham"
              className="mt-4 rounded-full bg-[#1965a2] px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-[#145486]"
            >
              Mua sắm ngay
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
