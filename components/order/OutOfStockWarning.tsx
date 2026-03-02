"use client"

import { AlertTriangle, ShoppingCart, ArrowRight } from "lucide-react"
import Link from "next/link"
import type { OutOfStockItem } from "@/app/types/order.types"

interface OutOfStockWarningProps {
  items: OutOfStockItem[]
  onOrderPartial?: () => void
}

export function OutOfStockWarning({ items, onOrderPartial }: OutOfStockWarningProps) {
  return (
    <div className="border border-amber-200 bg-amber-50 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-amber-100 border-b border-amber-200">
        <AlertTriangle size={16} className="text-amber-600 shrink-0" />
        <p className="text-sm font-semibold text-amber-800">
          Một số sản phẩm không đủ hàng
        </p>
      </div>

      {/* Items list */}
      <div className="px-4 py-3 space-y-2">
        {items.map((item) => (
          <div
            key={item.productVariantId}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="text-gray-700 min-w-0 truncate">{item.variantSku ?? item.variantName}</span>
            <span className="text-amber-700 shrink-0 text-xs">
              Yêu cầu <strong>{item.requestedQty}</strong> · Còn{" "}
              <strong>{item.availableQty}</strong>
            </span>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="px-4 pb-4 flex flex-col sm:flex-row gap-2">
        <Link
          href="/user/cart"
          className="flex items-center justify-center gap-2 flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
        >
          <ShoppingCart size={14} />
          Quay lại giỏ hàng
        </Link>
        {onOrderPartial && (
          <button
            type="button"
            onClick={onOrderPartial}
            className="flex items-center justify-center gap-2 flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Đặt phần còn hàng
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
