"use client";

import Link from "next/link";
import Image from "next/image";
import { Order, OrderStatus } from "@/app/types/order.schema";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { CancelOrderModal } from "./CancelOrderModal";
import { useState } from "react";
import { Store, Truck, CheckCircle2, RotateCcw, XCircle } from "lucide-react";

interface OrderCardProps {
  order: Order;
  onOrderCancelled?: () => void;
}

export function OrderCard({ order, onOrderCancelled }: OrderCardProps) {
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Cấu hình giao diện theo trạng thái
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return {
          label: "Chờ xác nhận",
          className: "text-orange-500",
          icon: null,
        };
      case "SHIPPING":
        return {
          label: "Đang giao hàng",
          className: "text-[#0dcaf0]",
          icon: <Truck size={14} className="mr-1" />,
        };
      case "COMPLETED":
        return {
          label: "Hoàn thành",
          className: "text-[#2d9f8d]",
          icon: <CheckCircle2 size={14} className="mr-1" />,
        };
      case "CANCELLED":
        return {
          label: "Đã hủy",
          className: "text-red-500",
          icon: <XCircle size={14} className="mr-1" />,
        };
      case "RETURN_REQUESTED":
        return {
          label: "Trả hàng/Hoàn tiền",
          className: "text-orange-600",
          icon: <RotateCcw size={14} className="mr-1" />,
        };
      default:
        return { label: status, className: "text-gray-500", icon: null };
    }
  };

  const statusConfig = getStatusConfig(order.status);

  // Style nút chính (Màu xanh, chữ trắng)
  const btnMainClass =
    "bg-[#2d9f8d] hover:bg-[#248273] text-white border border-[#2d9f8d] h-8 text-xs font-semibold px-4 shadow-sm";

  // 👇 SỬA Ở ĐÂY: Thêm hover:text-gray-800 để chữ không bị trắng khi rê chuột
  const btnOutlineClass =
    "bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-800 border border-gray-300 h-8 text-xs font-semibold px-4 shadow-sm transition-colors";

  return (
    <div className="bg-white rounded-lg mb-3 shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200">
      {/* HEADER: Shop Name & Status */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-50 bg-gray-50/30">
        <div className="font-bold text-gray-800 flex items-center text-sm">
          <Store size={16} className="mr-2 text-gray-500" /> {order.shopName}
        </div>
        <div
          className={cn(
            "uppercase text-xs font-bold flex items-center",
            statusConfig.className,
          )}
        >
          {statusConfig.icon} {statusConfig.label}
        </div>
      </div>

      {/* BODY: Product List */}
      <Link
        href={`/orders/${order.id}`}
        className="block px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        {/* Box lý do hủy (Chỉ hiện khi Đã hủy) */}
        {order.status === "CANCELLED" && (
          <div className="bg-[#fff5f5] border-l-[3px] border-red-500 rounded p-2.5 mb-3">
            <div className="text-xs font-bold text-red-600">
              Đơn hàng bị hủy
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Lý do: Muốn thay đổi địa chỉ nhận hàng
            </div>
          </div>
        )}

        {order.items.map((item, index) => (
          <div
            key={index}
            className={cn("flex gap-3 py-2", {
              "border-b border-dashed border-gray-100":
                index < order.items.length - 1,
            })}
          >
            <div className="relative w-14 h-14 flex-shrink-0">
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                className={`rounded border border-gray-200 object-cover ${order.status === "CANCELLED" ? "grayscale opacity-70" : ""}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-800 text-sm truncate">
                {item.name}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                x{item.quantity} | {item.variant}
              </div>
            </div>
            <div
              className={`text-right text-sm font-medium ${order.status === "CANCELLED" ? "text-gray-400" : "text-gray-900"}`}
            >
              {item.displayUnitPrice}
            </div>
          </div>
        ))}

        {/* Thông tin vận chuyển (Chỉ hiện khi Đang giao) */}
        {order.status === "SHIPPING" && (
          <div className="mt-2 pt-2 border-top border-gray-100 flex items-start gap-2">
            <Truck size={14} className="text-[#2d9f8d] mt-0.5" />
            <div>
              <div className="text-xs text-[#2d9f8d] font-medium">
                Đơn hàng đã đến kho Cần Thơ SOC
              </div>
              <div className="text-[10px] text-gray-400">15:30 24/01/2026</div>
            </div>
          </div>
        )}
      </Link>

      {/* FOOTER: Actions */}
      <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100">
        <div className="text-gray-600 text-sm">
          Tổng tiền:{" "}
          <span className="text-base font-bold text-red-600 ml-1">
            {order.displayTotalAmount}
          </span>
        </div>

        <div className="flex gap-2 items-center">
          {/* PENDING: Hủy đơn & Chi tiết */}
          {order.status === "PENDING" && (
            <>
              <Dialog
                open={isCancelModalOpen}
                onOpenChange={setIsCancelModalOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className={btnOutlineClass}>
                    Hủy đơn
                  </Button>
                </DialogTrigger>
                <CancelOrderModal
                  orderId={order.id}
                  onClose={() => setIsCancelModalOpen(false)}
                  onOrderCancelled={onOrderCancelled}
                />
              </Dialog>

              <Link href={`/orders/${order.id}`}>
                <Button className={btnMainClass}>Chi tiết</Button>
              </Link>
            </>
          )}

          {/* SHIPPING: Theo dõi & Đã nhận hàng */}
          {order.status === "SHIPPING" && (
            <>
              <Button variant="outline" className={btnOutlineClass}>
                Theo dõi
              </Button>
              <Button
                className={btnMainClass}
                onClick={() =>
                  confirm("Bạn xác nhận đã nhận được hàng?") &&
                  alert("Đã hoàn tất đơn hàng!")
                }
              >
                Đã nhận hàng
              </Button>
            </>
          )}

          {/* COMPLETED: Trả hàng, Đánh giá, Mua lại */}
          {order.status === "COMPLETED" && (
            <>
              <Link href={`/orders/return/request/${order.id}`}>
                <Button
                  variant="ghost"
                  className="h-8 text-xs bg-gray-50 text-gray-500 border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 px-3 font-medium transition-colors"
                >
                  Trả hàng
                </Button>
              </Link>
              <Button className={btnMainClass}>Đánh giá</Button>
              <Button variant="outline" className={btnOutlineClass}>
                Mua lại
              </Button>
            </>
          )}

          {/* CANCELLED: Chi tiết hủy & Mua lại */}
          {order.status === "CANCELLED" && (
            <>
              <Button variant="outline" className={btnOutlineClass}>
                Chi tiết hủy
              </Button>
              <Button className={btnMainClass}>Mua lại</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
