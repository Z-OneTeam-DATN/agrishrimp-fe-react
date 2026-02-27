import Link from "next/link";
import Image from "next/image";
import { MyOrder, OrderStatus } from "@/app/types/order.types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { CancelOrderModal } from "./CancelOrderModal";
import { useState } from "react";
import { Store, Truck, CheckCircle2, RotateCcw, XCircle, CreditCard, Clock } from "lucide-react";

interface OrderCardProps {
  order: MyOrder;
  onOrderCancelled?: () => void;
}

export function OrderCard({ order, onOrderCancelled }: OrderCardProps) {
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Định dạng tiền tệ VND
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Cấu hình giao diện theo trạng thái
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return {
          label: "Chờ xác nhận",
          className: "text-orange-500",
          icon: <Clock size={14} className="mr-1" />,
        };
      case "CONFIRMED":
        return {
          label: "Đã xác nhận",
          className: "text-blue-500",
          icon: <CheckCircle2 size={14} className="mr-1" />,
        };
      case "PROCESSING":
        return {
          label: "Đang xử lý",
          className: "text-purple-500",
          icon: <Clock size={14} className="mr-1" />,
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
      case "RETURNED":
        return {
          label: "Đã trả hàng",
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

  const btnOutlineClass =
    "bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-800 border border-gray-300 h-8 text-xs font-semibold px-4 shadow-sm transition-colors";

  const btnPayClass =
    "bg-red-500 hover:bg-red-600 text-white border border-red-500 h-8 text-xs font-semibold px-4 shadow-sm transition-colors";

  return (
    <div className="bg-white rounded-lg mb-3 shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200">
      {/* HEADER: Branch Name & Status */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-50 bg-gray-50/30">
        <div className="flex flex-col">
          <div className="font-bold text-gray-800 flex items-center text-sm">
            <Store size={16} className="mr-2 text-gray-500" /> {order.branchName}
          </div>
          <div className="text-[11px] text-gray-400 ml-6 font-mono">
            Mã đơn: {order.code}
          </div>
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
                src={item.image || "/placeholder.png"}
                alt={item.productName}
                fill
                className={`rounded border border-gray-200 object-cover ${order.status === "CANCELLED" ? "grayscale opacity-70" : ""}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-800 text-sm truncate">
                {item.productName}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                x{item.quantity} | SKU: {item.sku}
              </div>
            </div>
            <div
              className={`text-right text-sm font-medium ${order.status === "CANCELLED" ? "text-gray-400" : "text-gray-900"}`}
            >
              {formatCurrency(item.price)}
            </div>
          </div>
        ))}
      </Link>

      {/* FOOTER: Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 py-3 border-t border-gray-100 gap-3">
        <div className="flex flex-col">
          <div className="text-gray-600 text-sm">
            Tổng tiền:{" "}
            <span className="text-base font-bold text-red-600 ml-1">
              {formatCurrency(order.finalAmount)}
            </span>
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            Thanh toán: <span className="font-medium">{order.paymentMethod}</span> ({order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'})
          </div>
        </div>

        <div className="flex gap-2 items-center self-end sm:self-auto">
          {/* Nút thanh toán PayOS nếu chưa thanh toán */}
          {order.paymentMethod === 'PAYOS' && order.paymentStatus === 'UNPAID' && order.checkoutUrl && order.status === 'PENDING' && (
             <a href={order.checkoutUrl} target="_blank" rel="noopener noreferrer">
                <Button className={btnPayClass}>
                  <CreditCard size={14} className="mr-1.5" />
                  Thanh toán ngay
                </Button>
             </a>
          )}

          {/* PENDING/CONFIRMED: Hủy đơn & Chi tiết */}
          {(order.status === "PENDING" || order.status === "CONFIRMED") && (
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
                  orderId={order.id.toString()}
                  onClose={() => setIsCancelModalOpen(false)}
                  onOrderCancelled={onOrderCancelled}
                />
              </Dialog>
            </>
          )}

          <Link href={`/orders/${order.id}`}>
            <Button className={btnMainClass}>Chi tiết</Button>
          </Link>

          {/* COMPLETED: Mua lại */}
          {order.status === "COMPLETED" && (
            <Button variant="outline" className={btnOutlineClass}>
              Mua lại
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
