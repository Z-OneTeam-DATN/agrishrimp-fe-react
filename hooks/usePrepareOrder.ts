"use client"

import { useMutation } from "@tanstack/react-query"
import { prepareOrder } from "@/app/services/orderService"
import type { PrepareOrderPayload } from "@/app/types/order.types"

export function usePrepareOrder() {
  return useMutation({
    mutationFn: (payload: PrepareOrderPayload) => prepareOrder(payload),
    retry: false,
  })
}
