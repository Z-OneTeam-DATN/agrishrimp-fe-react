"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Pencil,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Bot,
  Ticket,
  Bell,
  MapPin,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { AuthService } from "@/app/services/auth.service";
import { addressService } from "@/app/services/address.service";
import { orderService } from "@/app/services/order.service";
import { getUserOrderStage, UserOrderStage } from "@/components/orders/order-status-utils";

interface ProfileUser {
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
}

interface ProfileAddress {
  isDefault?: boolean;
  receiverName?: string | null;
  receiverPhone?: string | null;
  addressDetail?: string | null;
}

const orderQuickLinks: Array<{
  key: UserOrderStage;
  label: string;
  href: string;
  icon: typeof Clock;
  iconWrapClassName: string;
  iconClassName: string;
  hoverClassName: string;
}> = [
  {
    key: "PENDING",
    label: "Chờ xác nhận",
    href: "/orders/list?status=PENDING",
    icon: Clock,
    iconWrapClassName: "bg-emerald-50",
    iconClassName: "text-[#2d9f8d]",
    hoverClassName: "group-hover:text-[#2d9f8d]",
  },
  {
    key: "AWAITING_REPLENISHMENT",
    label: "Chờ điều chuyển",
    href: "/orders/list?status=AWAITING_REPLENISHMENT",
    icon: Package,
    iconWrapClassName: "bg-amber-50",
    iconClassName: "text-amber-600",
    hoverClassName: "group-hover:text-amber-600",
  },
  {
    key: "READY_FOR_PICKUP",
    label: "Chờ lấy hàng",
    href: "/orders/list?status=READY_FOR_PICKUP",
    icon: Package,
    iconWrapClassName: "bg-teal-50",
    iconClassName: "text-[#2d9f8d]",
    hoverClassName: "group-hover:text-[#2d9f8d]",
  },
  {
    key: "SHIPPING",
    label: "Chờ giao hàng",
    href: "/orders/list?status=SHIPPING",
    icon: Truck,
    iconWrapClassName: "bg-lime-50",
    iconClassName: "text-[#329965]",
    hoverClassName: "group-hover:text-[#329965]",
  },
  {
    key: "COMPLETED",
    label: "Đã giao",
    href: "/orders/list?status=COMPLETED",
    icon: CheckCircle2,
    iconWrapClassName: "bg-green-50",
    iconClassName: "text-green-600",
    hoverClassName: "group-hover:text-green-600",
  },
  {
    key: "RETURNED",
    label: "Trả hàng",
    href: "/orders/list?status=RETURNED",
    icon: RotateCcw,
    iconWrapClassName: "bg-orange-50",
    iconClassName: "text-orange-500",
    hoverClassName: "group-hover:text-orange-500",
  },
  {
    key: "CANCELLED",
    label: "Đã hủy",
    href: "/orders/list?status=CANCELLED",
    icon: XCircle,
    iconWrapClassName: "bg-red-50",
    iconClassName: "text-red-500",
    hoverClassName: "group-hover:text-red-500",
  },
];

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [defaultAddress, setDefaultAddress] = useState<ProfileAddress | null>(null);
  const [addressCount, setAddressCount] = useState(0);
  const [orderCounts, setOrderCounts] = useState<Record<UserOrderStage, number>>({
    PENDING: 0,
    AWAITING_REPLENISHMENT: 0,
    READY_FOR_PICKUP: 0,
    SHIPPING: 0,
    COMPLETED: 0,
    RETURNED: 0,
    CANCELLED: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await AuthService.me();
      setUser(currentUser);

      try {
        const addresses = await addressService.getAll();
        if (Array.isArray(addresses)) {
          setAddressCount(addresses.length);
          if (addresses.length > 0) {
            const typedAddresses = addresses as ProfileAddress[];
            const defAddr = typedAddresses.find((address) => address.isDefault) || typedAddresses[0];
            setDefaultAddress(defAddr);
          }
        }
      } catch (addrError) {
        console.warn("Lỗi tải địa chỉ:", addrError);
      }

      try {
        const orders = await orderService.getMyOrders("ALL");
        const counts: Record<UserOrderStage, number> = {
          PENDING: 0,
          AWAITING_REPLENISHMENT: 0,
          READY_FOR_PICKUP: 0,
          SHIPPING: 0,
          COMPLETED: 0,
          RETURNED: 0,
          CANCELLED: 0,
        };

        orders.forEach((order) => {
          const stage = getUserOrderStage(order.status);
          counts[stage] += 1;
        });

        setOrderCounts(counts);
      } catch (orderError) {
        console.warn("Lỗi tải đơn hàng:", orderError);
      }
    } catch (error: unknown) {
      const status =
        typeof error === "object" && error !== null && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;

      if (status === 401) {
        toast.error("Vui lòng đăng nhập lại!");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
          <h5 className="text-lg font-bold text-gray-800">Đơn hàng của tôi</h5>
          <Link
            href="/orders/list"
            className="group flex items-center text-sm text-gray-500 transition-colors hover:text-[#329965]"
          >
            Xem lịch sử đơn hàng
            <ChevronRight size={14} className="ml-1 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-7">
          {orderQuickLinks.map((item) => {
            const Icon = item.icon;
            const count = orderCounts[item.key];

            return (
              <Link
                key={item.key}
                href={item.href}
                className="group relative flex flex-col items-center rounded-lg p-3 text-center transition-colors hover:bg-gray-50"
              >
                <div
                  className={`mb-2 flex h-11 w-11 items-center justify-center rounded-full transition-transform group-hover:scale-110 ${item.iconWrapClassName}`}
                >
                  <Icon size={20} className={item.iconClassName} />
                </div>
                {count > 0 && (
                  <span className="absolute right-[18%] top-1 rounded-full border-2 border-white bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm md:right-[28%] xl:right-[22%]">
                    {count}
                  </span>
                )}
                <span className={`text-xs font-medium text-gray-600 md:text-sm ${item.hoverClassName}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="md:col-span-7">
          <div className="h-full rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h6 className="text-xs font-bold uppercase tracking-wider text-gray-500">Thông tin tài khoản</h6>
              <Link href="/edit-profile" className="flex items-center text-sm text-[#329965] hover:underline">
                <Pencil size={16} className="mr-1" /> Chỉnh sửa
              </Link>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-sm text-gray-500">Họ và tên</span>
                <span className="text-sm font-medium text-gray-900">{user?.fullName || "Chưa cập nhật"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-sm text-gray-500">Email</span>
                <span className="text-sm font-medium text-gray-900">{user?.email || "Chưa có email"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-sm text-gray-500">Số điện thoại</span>
                <span className="text-sm font-medium text-gray-900">{user?.phoneNumber || "Chưa cập nhật"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-5">
          <div className="flex h-full flex-col rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h6 className="text-xs font-bold uppercase tracking-wider text-gray-500">Địa chỉ mặc định</h6>
              <Link href="/address" className="text-sm text-[#329965] hover:underline">
                Quản lý
              </Link>
            </div>

            {defaultAddress ? (
              <div className="group flex flex-1 flex-col rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 transition-colors hover:border-[#329965]">
                <div className="mb-1 flex items-center text-sm font-bold text-gray-900">
                  <MapPin size={14} className="mr-1 text-[#329965]" />
                  {defaultAddress.receiverName}
                  <span className="ml-1 border-l border-gray-300 pl-1 font-normal text-gray-500">
                    {defaultAddress.receiverPhone}
                  </span>
                </div>
                <hr className="my-2 border-gray-200" />
                <p className="mb-3 text-xs leading-relaxed text-gray-600">{defaultAddress.addressDetail}</p>
                <div className="mt-auto text-right">
                  <span className="text-[10px] italic text-gray-400">{addressCount} địa chỉ đã thêm</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-gray-400">
                <p className="mb-2 text-sm">Chưa có địa chỉ nào</p>
                <Link href="/address" className="text-xs font-bold text-[#329965] hover:underline">
                  Thêm địa chỉ ngay
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <h6 className="mb-3 ml-1 text-xs font-bold uppercase tracking-wider text-gray-500">Tiện ích nhanh</h6>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          href="/ai-doctor"
          className="group flex items-center rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-100">
            <Bot size={20} />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-800">Chẩn đoán AI</div>
            <div className="text-xs text-gray-500">Kiểm tra bệnh tôm</div>
          </div>
        </Link>

        <Link
          href="/voucher"
          className="group flex items-center rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-500 transition-colors group-hover:bg-orange-100">
            <Ticket size={20} />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-800">Kho voucher</div>
            <div className="text-xs text-gray-500">Xem mã ưu đãi hiện có</div>
          </div>
        </Link>

        <Link
          href="/notifications"
          className="group flex items-center rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500 transition-colors group-hover:bg-red-100">
            <Bell size={20} />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-800">Thông báo</div>
            <div className="text-xs text-gray-500">Xem tin mới nhất</div>
          </div>
        </Link>
      </div>
    </>
  );
}
