"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { confirmOrder } from "@/app/services/orderService"
import { useCartStore } from "@/stores/useCartStore"
import { isConflictError, isTokenExpiredError, getFriendlyError, isRateLimitedError, getRetryAfterSeconds } from "@/app/utils/apiError"
import type { ConfirmOrderPayload } from "@/app/types/order.types"

interface UseConfirmOrderOptions {
  /** 409 Conflict — hàng vừa hết khi confirm */
  onConflict?: () => void
  /** 400 Token hết hạn — prepareToken > 30 phút */
  onTokenExpired?: () => void
  /** 409 Rate limited — thao tác quá nhanh */
  onRateLimited?: (seconds: number) => void
}

export function useConfirmOrder(options: UseConfirmOrderOptions = {}) {
  const { onConflict, onTokenExpired, onRateLimited } = options
  const router = useRouter()
  const { clearCart } = useCartStore()

  return useMutation({
    mutationFn: (payload: ConfirmOrderPayload) => confirmOrder(payload),
    retry: false, // Disable auto-retry để tránh spam submit

    onSuccess: (data) => {
      if (data.checkoutUrl) {
        // PAYOS: redirect đến trang thanh toán payOS
        // Chưa clearCart — thanh toán chưa hoàn tất, cart sẽ clear ở /order-success
        window.location.href = data.checkoutUrl
      } else {
        // COD / CASH / TRANSFER: đơn đã xong, clear cart và redirect
        clearCart()
        // Dùng cùng trang /order-success với payOS để tránh xung đột dynamic route
        // Backend payOS config should return to https://agrishrimp.io.vn/order-success
        router.push(
          `/order-success?orderId=${data.orderId}&orderCode=${encodeURIComponent(data.orderCode)}&method=offline`
        )
      }
    },

    onError: (error) => {
      if (isConflictError(error)) {
        // 409 — race condition, hàng vừa hết sau khi prepare
        onConflict?.()
      } else if (isRateLimitedError(error)) {
        onRateLimited?.(getRetryAfterSeconds(error))
        // Không show toast khi rate limit - chỉ disable button
      } else if (isTokenExpiredError(error)) {
        // 400 — prepareToken hết hạn (> 30 phút)
        onTokenExpired?.()
      } else {
        toast.error(getFriendlyError(error))
      }
    },
  })
}
