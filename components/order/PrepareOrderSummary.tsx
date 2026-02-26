"use client"

import { Package } from "lucide-react"
import { SubOrderCard } from "./SubOrderCard"
import type { PrepareOrderResponse } from "@/app/types/order.types"

interface PrepareOrderSummaryProps {
  prepareResponse: PrepareOrderResponse
}

const formatMoney = (amount: number) => amount.toLocaleString("vi-VN") + "đ"

export function PrepareOrderSummary({ prepareResponse }: PrepareOrderSummaryProps) {
  const { subOrders, totalSubtotal, totalShippingFee, totalAmount } = prepareResponse
  const hasMultipleBranches = subOrders.length > 1
  // shippingEstimate = true nghĩa là GHN lỗi, phí ship là fallback
  const hasEstimatingFee = subOrders.some((o) => o.shippingEstimate)

  return (
    <div className="space-y-3">
      {/* Banner tách đơn */}
      {hasMultipleBranches && (
        <div className="flex items-start gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <Package size={15} className="shrink-0 mt-0.5" />
          <span>
            Đơn hàng sẽ được giao từ{" "}
            <strong>{subOrders.length} chi nhánh</strong>
            {" — "}Chi nhánh gần nhất không đủ hàng nên được tách đơn tự động.
          </span>
        </div>
      )}

      {/* Phí ship ước tính */}
      {hasEstimatingFee && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
          Phí vận chuyển là ước tính do GHN tạm thời không phản hồi (mặc định 30.000đ).
        </div>
      )}

      {/* Sub-order cards */}
      {subOrders.map((subOrder, index) => (
        <SubOrderCard key={subOrder.branchId} subOrder={subOrder} index={index} />
      ))}

      {/* Totals */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <div className="px-4 py-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tổng tiền hàng</span>
            <span className="font-medium text-gray-800">{formatMoney(totalSubtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">
              Tổng phí ship
              {hasMultipleBranches && (
                <span className="text-xs text-gray-400 ml-1">({subOrders.length} đơn)</span>
              )}
              {hasEstimatingFee && (
                <span className="text-xs text-amber-500 ml-1">(ước tính)</span>
              )}
            </span>
            <span className="font-medium text-gray-800">{formatMoney(totalShippingFee)}</span>
          </div>
          <div className="flex justify-between font-bold border-t border-gray-100 pt-2 mt-2">
            <span className="text-gray-800">Tổng thanh toán</span>
            <span className="text-gray-900 text-base">{formatMoney(totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
