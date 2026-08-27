"use client"

import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { prepareOrder } from "@/app/services/orderService"
import { useCartStore } from "@/stores/useCartStore"
import {
  getFriendlyError,
  getRetryAfterSeconds,
  isRateLimitedError,
} from "@/app/utils/apiError"
import type { PrepareOrderPayload } from "@/app/types/order.types"

interface UsePrepareOrderOptions {
  onRateLimited?: (seconds: number) => void
}

export function usePrepareOrder(options: UsePrepareOrderOptions = {}) {
  const { onRateLimited } = options
  const { setPrepareResponse, clearPrepareResponse } = useCartStore()

  return useMutation({
    mutationFn: (payload: PrepareOrderPayload) => prepareOrder(payload),
    retry: false,

    onSuccess: (data) => {
      setPrepareResponse(data, data.prepareToken)

      if (!data.canFulfill && !data.subOrders?.length && data.outOfStockItems?.length) {
        const names = data.outOfStockItems
          .map(
            (item) =>
              `${item.variantSku ?? item.variantName} (y\u00eau c\u1ea7u ${item.requestedQty}, c\u00f2n ${item.availableQty})`,
          )
          .join("; ")
        toast.warning(`M\u1ed9t s\u1ed1 s\u1ea3n ph\u1ea9m kh\u00f4ng \u0111\u1ee7 h\u00e0ng: ${names}`)
      }
    },

    onError: (error) => {
      clearPrepareResponse()
      if (isRateLimitedError(error)) {
        onRateLimited?.(getRetryAfterSeconds(error))
      } else {
        toast.error(getFriendlyError(error))
      }
    },
  })
}
