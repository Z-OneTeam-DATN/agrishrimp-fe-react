"use client"

import { Package, Truck } from "lucide-react"
import type { SubOrderDraft } from "@/app/types/order.types"

interface SubOrderCardProps {
  subOrder: SubOrderDraft
  index: number
}

const formatMoney = (amount: number) => amount.toLocaleString("vi-VN") + "đ"

export function SubOrderCard({ subOrder, index }: SubOrderCardProps) {
  return (
    <div className="border border-gray-200 overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-800">
          Chi nhánh {subOrder.branchName}
        </span>
        <span className="text-[11px] text-teal-600 font-medium">Giao từ Cần Thơ</span>
      </div>

      {/* Items */}
      <div className="divide-y divide-gray-50">
        {subOrder.items.map((item) => (
          <div key={item.productVariantId} className="flex items-center gap-3 px-4 py-3">
            <div className="w-14 h-14 border border-gray-100 bg-gray-50 shrink-0 overflow-hidden flex items-center justify-center">
              <Package size={18} className="text-gray-300" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 line-clamp-2 leading-snug">{item.variantName}</p>
              {item.variantSku && (
                <p className="text-xs text-gray-400 mt-0.5">SKU: {item.variantSku}</p>
              )}
            </div>

            <div className="text-right shrink-0 space-y-0.5">
              <p className="text-xs text-gray-400">x{item.quantity}</p>
              <p className="text-sm font-semibold text-teal-600">{formatMoney(item.subtotal)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Shipping */}
      <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Truck size={13} className="text-gray-400 shrink-0" />
          <span>
            {subOrder.carrier} · Dự kiến {subOrder.estimatedDays}
          </span>
        </div>
        <div className="text-right shrink-0">
          <span className="text-sm font-medium text-gray-700">
            {formatMoney(subOrder.shippingFee)}
            {subOrder.shippingEstimate && (
              <span className="text-[10px] text-amber-500 ml-1">(Ước tính)</span>
            )}
          </span>
        </div>
      </div>

      {/* Footer total */}
      <div className="px-4 py-2.5 border-t border-gray-100 flex justify-end items-center gap-2">
        <span className="text-xs text-gray-400">{subOrder.items.length} sản phẩm · Tổng:</span>
        <span className="text-sm font-bold text-gray-900">{formatMoney(subOrder.subtotal + subOrder.shippingFee)}</span>
      </div>
    </div>
  )
}
