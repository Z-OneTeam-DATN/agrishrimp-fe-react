"use client";

import { useSearchParams } from "next/navigation";
import { Loader2, PackageX, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { orderService } from "@/app/services/order.service";
import { returnService } from "@/app/services/return.service";
import { MyOrder } from "@/app/types/order.types";
import { ReturnRequest } from "@/app/types/return.types";
import { OrderCard } from "@/components/orders/OrderCard";
import { OrderTabs } from "@/components/orders/OrderTabs";
import {
  filterUserReturnRequests,
  UserReturnRequestAccordionList,
} from "@/components/orders/UserReturnRequestAccordionList";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  UserOrderFilter,
  matchesUserOrderFilter,
  normalizeUserOrderFilter,
} from "@/components/orders/order-status-utils";

const PAGE_SIZE = 10;

function buildPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 1) return [1];

  const pages = new Set<number>([
    1,
    totalPages,
    currentPage,
    currentPage - 1,
    currentPage + 1,
  ]);

  const normalizedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const items: Array<number | "ellipsis"> = [];
  normalizedPages.forEach((page, index) => {
    if (index > 0 && page - normalizedPages[index - 1] > 1) {
      items.push("ellipsis");
    }
    items.push(page);
  });

  return items;
}

export default function OrderingPage() {
  const searchParams = useSearchParams();
  const statusFilter = normalizeUserOrderFilter(
    searchParams.get("status"),
  ) as UserOrderFilter;
  const isReturnTab = statusFilter === "RETURNED";

  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchOrders = useCallback(async () => {
    const orderData = await orderService.getMyOrders("ALL");
    setOrders(orderData);
  }, []);

  const fetchReturnRequests = useCallback(async () => {
    const returnData = await returnService.getMyReturnRequests();
    setReturnRequests(returnData);
  }, []);

  const fetchActiveData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);

    try {
      if (isReturnTab) {
        await fetchReturnRequests();
      } else {
        await fetchOrders();
      }
    } catch (error) {
      console.error("Error fetching user order data:", error);
      setIsError(true);
      toast.error(
        isReturnTab
          ? "Không thể tải danh sách phiếu trả hàng lúc này."
          : "Không thể tải dữ liệu đơn hàng lúc này.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [fetchOrders, fetchReturnRequests, isReturnTab]);

  useEffect(() => {
    void fetchActiveData();
  }, [fetchActiveData]);

  const handleOrderUpdated = useCallback((updatedOrder: MyOrder) => {
    setOrders((current) =>
      current.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)),
    );
  }, []);

  const normalizedKeyword = searchKeyword.trim().toLowerCase();

  const visibleOrders = useMemo(
    () =>
      orders.filter((order) => {
        if (isReturnTab || !matchesUserOrderFilter(order, statusFilter)) {
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
    [isReturnTab, normalizedKeyword, orders, statusFilter],
  );

  const visibleReturnRequests = useMemo(
    () => filterUserReturnRequests(returnRequests, normalizedKeyword),
    [normalizedKeyword, returnRequests],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedKeyword, statusFilter]);

  const activeResultCount = isReturnTab
    ? visibleReturnRequests.length
    : visibleOrders.length;
  const totalPages = Math.ceil(activeResultCount / PAGE_SIZE);

  useEffect(() => {
    if (totalPages === 0) {
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
      return;
    }

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return visibleOrders.slice(start, start + PAGE_SIZE);
  }, [currentPage, visibleOrders]);

  const paginatedReturnRequests = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return visibleReturnRequests.slice(start, start + PAGE_SIZE);
  }, [currentPage, visibleReturnRequests]);

  const paginationItems = useMemo(
    () => buildPaginationItems(currentPage, totalPages),
    [currentPage, totalPages],
  );

  const visibleFrom = activeResultCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const visibleTo =
    activeResultCount === 0
      ? 0
      : Math.min(currentPage * PAGE_SIZE, activeResultCount);

  const emptyReturnTitle = normalizedKeyword
    ? "Không tìm thấy phiếu trả hàng phù hợp"
    : "Chưa có yêu cầu trả hàng";
  const emptyReturnDescription = normalizedKeyword
    ? "Thử tìm theo mã phiếu, mã đơn hoặc tên sản phẩm trả."
    : "Khi bạn gửi yêu cầu từ đơn đã giao, phiếu xử lý sẽ hiển thị trong tab này.";

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
            placeholder={
              isReturnTab
                ? "Tìm mã phiếu, mã đơn hoặc tên sản phẩm trả"
                : "Bạn có thể tìm kiếm theo tên shop, mã đơn hoặc tên sản phẩm"
            }
            className="w-full bg-transparent text-[15px] text-gray-700 outline-none placeholder:text-gray-400 sm:text-base"
          />
        </label>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center border border-gray-100 bg-white py-20 text-gray-500">
            <Loader2 className="mb-2 h-8 w-8 animate-spin text-[#1965a2]" />
            <p>
              {isReturnTab
                ? "Đang tải phiếu trả hàng..."
                : "Đang tải danh sách đơn hàng..."}
            </p>
          </div>
        ) : isError ? (
          <div className="border border-gray-100 bg-white py-20 text-center text-red-500">
            <p className="mb-4">Có lỗi xảy ra khi tải dữ liệu.</p>
            <button
              onClick={() => void fetchActiveData()}
              className="rounded-md bg-[#1965a2] px-4 py-2 text-white hover:bg-[#145486]"
            >
              Thử lại
            </button>
          </div>
        ) : isReturnTab ? (
          <>
            <UserReturnRequestAccordionList
              requests={paginatedReturnRequests}
              emptyTitle={emptyReturnTitle}
              emptyDescription={emptyReturnDescription}
              emptyActionHref="/orders/list?status=COMPLETED"
              emptyActionLabel="Xem đơn đã giao"
            />

            {totalPages > 1 ? (
              <div className="border border-gray-100 bg-white px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-500">
                    Hiển thị {visibleFrom}-{visibleTo} trong {activeResultCount} phiếu
                    trả hàng
                  </p>

                  <Pagination className="mx-0 w-auto justify-start sm:justify-end">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            if (currentPage > 1) {
                              setCurrentPage(currentPage - 1);
                            }
                          }}
                          className={
                            currentPage <= 1
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>

                      {paginationItems.map((item, index) => (
                        <PaginationItem key={`${item}-${index}`}>
                          {item === "ellipsis" ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              href="#"
                              isActive={currentPage === item}
                              onClick={(event) => {
                                event.preventDefault();
                                setCurrentPage(item);
                              }}
                            >
                              {item}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            if (currentPage < totalPages) {
                              setCurrentPage(currentPage + 1);
                            }
                          }}
                          className={
                            currentPage >= totalPages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            ) : null}
          </>
        ) : visibleOrders.length > 0 ? (
          <>
            {paginatedOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                hasReturnRequest={Boolean(order.hasReturnRequest)}
                onOrderCancelled={() => void fetchActiveData()}
                onOrderUpdated={handleOrderUpdated}
              />
            ))}

            {totalPages > 1 ? (
              <div className="border border-gray-100 bg-white px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-500">
                    Hiển thị {visibleFrom}-{visibleTo} trong {activeResultCount} đơn
                    hàng
                  </p>

                  <Pagination className="mx-0 w-auto justify-start sm:justify-end">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            if (currentPage > 1) {
                              setCurrentPage(currentPage - 1);
                            }
                          }}
                          className={
                            currentPage <= 1
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>

                      {paginationItems.map((item, index) => (
                        <PaginationItem key={`${item}-${index}`}>
                          {item === "ellipsis" ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              href="#"
                              isActive={currentPage === item}
                              onClick={(event) => {
                                event.preventDefault();
                                setCurrentPage(item);
                              }}
                            >
                              {item}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            if (currentPage < totalPages) {
                              setCurrentPage(currentPage + 1);
                            }
                          }}
                          className={
                            currentPage >= totalPages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            ) : null}
          </>
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
