"use client"

import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { prepareOrder } from "@/app/services/orderService"
import { useCartStore } from "@/stores/useCartStore"
import { getFriendlyError, getRetryAfterSeconds, isRateLimitedError } from "@/app/utils/apiError"
import type { PrepareOrderPayload } from "@/app/types/order.types"

interface UsePrepareOrderOptions {
  onRateLimited?: (seconds: number) => void
}

export function usePrepareOrder(options: UsePrepareOrderOptions = {}) {
  const { onRateLimited } = options
  const { setPrepareResponse, clearPrepareResponse } = useCartStore()

  return useMutation({
    mutationFn: (payload: PrepareOrderPayload) => prepareOrder(payload),
    retry: false, // Disable auto-retry để tránh spam submit

    onSuccess: (data) => {
      // prepareToken nằm trực tiếp trong response body
      setPrepareResponse(data, data.prepareToken)

      if (!data.canFulfill && !data.subOrders?.length && data.outOfStockItems?.length) {
        const names = data.outOfStockItems
          .map((i) => `${i.variantSku ?? i.variantName} (yêu cầu ${i.requestedQty}, còn ${i.availableQty})`)
          .join("; ")
        toast.warning(`Một số sản phẩm không đủ hàng: ${names}`)
      }
    },

    onError: (error) => {
      clearPrepareResponse()
      if (isRateLimitedError(error)) {
        onRateLimited?.(getRetryAfterSeconds(error))
        // Không show toast khi rate limit - chỉ disable button
      } else {
        toast.error(getFriendlyError(error))
      }
    },
  })
}
