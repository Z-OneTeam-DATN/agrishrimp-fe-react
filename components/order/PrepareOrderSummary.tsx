"use client"

import { Package } from "lucide-react"
import { SubOrderCard } from "./SubOrderCard"
import type { PrepareOrderResponse } from "@/app/types/order.types"

interface PrepareOrderSummaryProps {
  prepareResponse: PrepareOrderResponse
}

const formatMoney = (amount: number) => amount.toLocaleString("vi-VN") + "đ"

export function PrepareOrderSummary({ prepareResponse }: PrepareOrderSummaryProps) {
  const { subOrders } = prepareResponse
  const hasMultipleBranches = subOrders.length > 1
  // shippingEstimate = true nghĩa là GHN lỗi, phí ship là fallback
  const hasEstimatingFee = subOrders.some((o) => o.shippingEstimate)

  return (
    <div className="space-y-4">
      {/* Banner tách đơn */}
      {hasMultipleBranches && (
        <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-100 rounded-sm text-xs text-amber-800">
          <Package size={14} className="shrink-0 mt-0.5 text-amber-600" />
          <p>
            Đơn hàng được tách thành <strong>{subOrders.length} kiện hàng</strong> do sản phẩm nằm ở các chi nhánh khác nhau.
          </p>
        </div>
      )}

      {/* Phí ship ước tính */}
      {hasEstimatingFee && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-sm text-xs text-blue-700">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Phí vận chuyển là ước tính (GHN đang bảo trì).
        </div>
      )}

      {/* Sub-order cards */}
      <div className="space-y-4">
        {subOrders.map((subOrder, index) => (
          <SubOrderCard key={subOrder.branchId} subOrder={subOrder} index={index} />
        ))}
      </div>
    </div>
  )
}
