"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, Clock, Loader2, ChevronRight, AlertCircle } from "lucide-react"
import { getOrderById } from "@/app/services/orderService"
import { useCartStore } from "@/stores/useCartStore"
import type { MyOrder } from "@/app/types/order.types"

const formatMoney = (amount: number) => amount.toLocaleString("vi-VN") + "đ"

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const { clearCart } = useCartStore()

  // COD/CASH/TRANSFER: ?orderId=42&orderCode=ORD...&method=offline
  // PAYOS:             ?orderCode=42&status=PAID  (payOS truyền thẳng)
  const orderId = searchParams.get("orderId")
  const orderCodeParam = searchParams.get("orderCode")
  const method = searchParams.get("method")   // "offline" = COD/CASH/TRANSFER
  const statusParam = searchParams.get("status") // payOS trả về: PAID | CANCELLED

  // Dùng orderId (nếu có) ưu tiên hơn orderCode để gọi API
  const idForApi = (orderId && orderId !== "undefined" && orderId !== "null") 
    ? orderId 
    : (orderCodeParam && orderCodeParam !== "undefined" && orderCodeParam !== "null") 
      ? orderCodeParam 
      : null;

  const isOfflinePayment = method === "offline"

  const [order, setOrder] = useState<MyOrder | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "PENDING" | "FAILED" | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pollCount, setPollCount] = useState(0)

  // Clear cart khi PAYOS redirect về đây (COD đã clear trong hook)
  useEffect(() => {
    if (!isOfflinePayment) {
      clearCart()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!idForApi) {
      setIsLoading(false)
      return
    }

    const fetchOrder = async () => {
      try {
        const data = await getOrderById(idForApi)
        setOrder(data)

        if (isOfflinePayment) {
          // COD / CASH / TRANSFER: đơn đã xác nhận, không cần check paymentStatus
          setPaymentStatus("PAID")
        } else {
          // PAYOS: kiểm tra paymentStatus từ response hoặc query param
          const rawPaymentStatus = String(data?.paymentStatus ?? statusParam ?? "").toUpperCase()
          const resolved =
            rawPaymentStatus === "PAID"
              ? "PAID"
              : rawPaymentStatus === "CANCELLED"
                ? "FAILED"
                : "PENDING"
          setPaymentStatus(resolved)

          // Nếu chưa PAID và chưa poll quá 3 lần, thử lại sau 2 giây
          if (resolved === "PENDING" && pollCount < 3) {
            setTimeout(() => setPollCount((c) => c + 1), 2000)
          }
        }
      } catch {
        // Không load được order nhưng vẫn hiển thị success cho offline
        setPaymentStatus(isOfflinePayment ? "PAID" : statusParam === "PAID" ? "PAID" : "PENDING")
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [idForApi, pollCount]) // eslint-disable-line react-hooks/exhaustive-deps

  const isPaid = paymentStatus === "PAID"
  const isFailed = paymentStatus === "FAILED"
  const isPending = paymentStatus === "PENDING"

  const displayOrderCode = (order?.code && order.code !== "undefined")
    ? order.code
    : (orderCodeParam && orderCodeParam !== "undefined" && orderCodeParam !== "null")
    ? orderCodeParam
    : (orderId && orderId !== "undefined" && orderId !== "null")
    ? `#${orderId}`
    : null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-gray-400 py-16">
        <Loader2 size={28} className="animate-spin text-blue-500" />
        <p className="text-sm">
          {isOfflinePayment ? "Đang xác nhận đơn hàng..." : "Đang xác nhận thanh toán..."}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

        {/* ── Header ── */}
        <div
          className={`border-b px-6 py-8 text-center ${
            isPaid
              ? "bg-blue-50 border-blue-100"
              : isFailed
              ? "bg-red-50 border-red-100"
              : "bg-amber-50 border-amber-100"
          }`}
        >
          <div className="flex justify-center mb-3">
            {isPaid ? (
              <CheckCircle2 size={52} className="text-blue-600" />
            ) : isFailed ? (
              <AlertCircle size={52} className="text-red-500" />
            ) : (
              <Clock size={52} className="text-amber-500" />
            )}
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-1">
            {isPaid
              ? isOfflinePayment
                ? "Đặt hàng thành công!"
                : "Thanh toán thành công!"
              : isFailed
              ? "Thanh toán thất bại"
              : "Đang chờ xác nhận thanh toán"}
          </h1>

          {displayOrderCode && (
            <p className="text-sm text-gray-500">
              Mã đơn:{" "}
              <span className="font-mono font-semibold text-gray-800">{displayOrderCode}</span>
            </p>
          )}

          {/* Trạng thái phương thức thanh toán */}
          {isPaid && isOfflinePayment && (
            <p className="text-xs text-blue-600 mt-1">
              {order?.paymentMethod === "COD"
                ? "Thanh toán khi nhận hàng"
                : order?.paymentMethod === "TRANSFER"
                ? "Chờ xác nhận chuyển khoản"
                : "Tiền mặt tại cửa hàng"}
            </p>
          )}
        </div>

        {/* ── Đang chờ PAYOS ── */}
        {!isOfflinePayment && isPending && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-100">
            <p className="text-xs text-amber-700 text-center flex items-center justify-center gap-1">
              Thanh toán đang được xử lý
              {pollCount < 3 && <Loader2 size={11} className="animate-spin" />}
            </p>
          </div>
        )}

        {/* ── Thông báo chuyển khoản ── */}
        {isPaid && isOfflinePayment && order?.paymentMethod === "TRANSFER" && (
          <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100">
            <p className="text-xs text-indigo-700 text-center">
              Đơn hàng sẽ được xác nhận trong vòng <strong>2 giờ</strong> sau khi nhận được tiền chuyển khoản.
            </p>
          </div>
        )}

        {/* ── Chi tiết đơn ── */}
        {order && (
          <div className="px-6 py-4">
            {/* Sub-orders - ĐÃ SỬA LỖI TẠI ĐÂY */}
            {(order.subOrders?.length ?? 0) > 0 && (
              <div className="space-y-2 mb-4">
               {order.subOrders?.map((sub: any) => (
                <div
                    key={sub.subOrderId}
                    className="border border-gray-100 rounded-xl px-3 py-2.5 text-xs space-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800 truncate">
                        {sub.branchName || "Cửa hàng AgriShrimp"}
                      </span>
                      <span className="text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded uppercase shrink-0 ml-2">
                        {sub.carrier || "N/A"}
                      </span>
                    </div>
                    <p className="text-gray-400">Dự kiến: {sub.estimatedDays || "Đang cập nhật"}</p>
                    <p className="text-gray-400">
                      Hàng: {formatMoney(sub.subtotal)} · Ship: {formatMoney(sub.shippingFee)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
              {(order.totalShippingFee ?? order.shippingFee) != null && (
                <div className="flex justify-between text-gray-500">
                  <span>Phí vận chuyển</span>
                  <span>{formatMoney(order.totalShippingFee ?? order.shippingFee)}</span>
                </div>
              )}
              {order.finalAmount != null && (
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Tổng thanh toán</span>
                  <span>{formatMoney(order.finalAmount)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CTAs ── */}
        <div className="px-6 pb-6 pt-2 space-y-2">
          {idForApi && (
            <Link
              href={`/orders/${idForApi}`}
              className="flex items-center justify-between w-full px-4 py-3 border border-blue-200 bg-blue-50 rounded-xl text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            >
              Xem chi tiết đơn hàng <ChevronRight size={15} />
            </Link>
          )}
          <Link
            href="/san-pham"
            className="flex items-center justify-center w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PayOSSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Loader2 size={28} className="animate-spin text-blue-500" />
            <span className="text-sm">Đang tải...</span>
          </div>
        }
      >
        <OrderSuccessContent />
      </Suspense>
    </div>
  )
}

