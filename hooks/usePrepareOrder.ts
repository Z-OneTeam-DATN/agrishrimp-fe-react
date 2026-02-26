"use client"

import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { prepareOrder } from "@/app/services/orderService"
import { useCartStore } from "@/stores/useCartStore"
import { getFriendlyError } from "@/app/utils/apiError"
import type { PrepareOrderPayload } from "@/app/types/order.types"

export function usePrepareOrder() {
  const { setPrepareResponse, clearPrepareResponse } = useCartStore()

  return useMutation({
    mutationFn: (payload: PrepareOrderPayload) => prepareOrder(payload),

    onSuccess: (data) => {
      // prepareToken nằm trực tiếp trong response body
      setPrepareResponse(data, data.prepareToken)

      if (!data.canFulfill && data.outOfStockItems?.length) {
        const names = data.outOfStockItems
          .map((i) => `${i.variantName} (yêu cầu ${i.requestedQty}, còn ${i.availableQty})`)
          .join("; ")
        toast.warning(`Một số sản phẩm không đủ hàng: ${names}`)
      }
    },

    onError: (error) => {
      clearPrepareResponse()
      toast.error(getFriendlyError(error))
    },
  })
}
