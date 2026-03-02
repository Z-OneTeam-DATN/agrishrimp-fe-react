"use client"

import { AlertCircle, Info } from "lucide-react"
import { SubOrderCard } from "./SubOrderCard"
import type { PrepareOrderResponse } from "@/app/types/order.types"

interface PrepareOrderSummaryProps {
  prepareResponse: PrepareOrderResponse
}

export function PrepareOrderSummary({ prepareResponse }: PrepareOrderSummaryProps) {
  const { subOrders } = prepareResponse
  const hasMultipleBranches = subOrders.length > 1
  const hasEstimatingFee = subOrders.some((o) => o.shippingEstimate)

  return (
    <div className="space-y-3">
      {/* Banner: tách đơn nhiều chi nhánh */}
      {hasMultipleBranches && (
        <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-500" />
          <p>
            Đơn hàng được tách thành{" "}
            <strong>{subOrders.length} kiện hàng</strong> từ các chi nhánh khác nhau.
          </p>
        </div>
      )}

      {/* Banner: phí ship ước tính */}
      {hasEstimatingFee && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
          <Info size={13} className="shrink-0 text-blue-400" />
          Phí vận chuyển là ước tính (GHN đang bảo trì).
        </div>
      )}

      {/* Sub-order cards */}
      <div className="space-y-3">
        {subOrders.map((subOrder, index) => (
          <SubOrderCard key={subOrder.branchId} subOrder={subOrder} index={index} />
        ))}
      </div>
    </div>
  )
}
