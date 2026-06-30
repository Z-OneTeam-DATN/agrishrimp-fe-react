"use client";

import { useSearchParams } from "next/navigation";
import { OrderTabs } from "@/components/orders/OrderTabs";
import { OrderCard } from "@/components/orders/OrderCard";
import { orderService } from "@/app/services/order.service";
import { PackageX, Loader2, Search } from "lucide-react";
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

  const normalizedKeyword = searchKeyword.trim().toLowerCase();

  const visibleOrders = orders.filter((order) => {
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

    return searchableValues.some((value) => value?.toLowerCase().includes(normalizedKeyword));
  });

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
      <div className="border-t border-gray-100 bg-white px-4 pb-2 pt-2 sm:px-4">
        <label className="flex min-h-[46px] w-full items-center gap-3 bg-[#f5f5f5] px-4 text-gray-600">
          <Search size={22} className="shrink-0 text-gray-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            placeholder="Bạn có thể tìm kiếm theo tên Shop, ID đơn hàng hoặc Tên Sản phẩm"
            className="w-full bg-transparent text-[15px] text-gray-700 outline-none placeholder:text-gray-400 sm:text-base"
          />
        </label>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center border border-gray-100 bg-white py-20 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin text-[#1965a2] mb-2" />
            <p>Đang tải danh sách đơn hàng...</p>
          </div>
        ) : isError ? (
          <div className="border border-gray-100 bg-white py-20 text-center text-red-500">
            <p className="mb-4">Có lỗi xảy ra khi tải đơn hàng.</p>
            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-[#1965a2] text-white rounded-md hover:bg-[#145486]"
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
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <PackageX size={40} className="text-gray-300" />
            </div>
            <p className="text-center text-gray-500 font-medium">
              {searchKeyword ? "Không tìm thấy đơn hàng phù hợp." : "Chưa có đơn hàng nào."}
            </p>
            <Link
              href="/san-pham"
              className="mt-4 px-6 py-2 bg-[#1965a2] text-white rounded-full font-bold text-sm hover:bg-[#145486] transition-colors"
            >
              Mua sắm ngay
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

