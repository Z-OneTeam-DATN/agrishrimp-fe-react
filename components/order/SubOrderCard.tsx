"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Store, Clock, MapPin, Package } from "lucide-react"
import type { SubOrderDraft } from "@/app/types/order.types"

interface SubOrderCardProps {
  subOrder: SubOrderDraft
  index: number
}

const formatMoney = (amount: number) => amount.toLocaleString("vi-VN") + "đ"

export function SubOrderCard({ subOrder, index }: SubOrderCardProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          <Store size={14} className="text-teal-600 shrink-0" />
          <span className="text-sm font-semibold text-gray-800 truncate">
            {subOrder.branchName}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-xs text-gray-500 shrink-0">
            <Clock size={11} />~{subOrder.durationMinutes} phút
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Carrier badge */}
          <span className="text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded uppercase">
            {subOrder.carrier}
          </span>
          {expanded ? (
            <ChevronUp size={14} className="text-gray-400" />
          ) : (
            <ChevronDown size={14} className="text-gray-400" />
          )}
        </div>
      </button>

      {/* Body */}
      {expanded && (
        <div className="divide-y divide-gray-100">
          {/* Branch address */}
          {subOrder.branchAddress && (
            <div className="flex items-start gap-1.5 px-4 py-2 text-xs text-gray-400">
              <MapPin size={11} className="mt-0.5 shrink-0" />
              <span>{subOrder.branchAddress}</span>
            </div>
          )}

          {/* Items list */}
          {subOrder.items.map((item) => (
            <div
              key={item.productVariantId}
              className="flex items-center gap-3 px-4 py-3"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <Package size={13} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug">
                  {item.variantName}
                </p>
                {item.variantSku && (
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">{item.variantSku}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] text-gray-400">×{item.quantity}</p>
                <p className="text-xs font-semibold text-gray-800">
                  {formatMoney(item.subtotal)}
                </p>
              </div>
            </div>
          ))}

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-gray-500">
                Tiền hàng:{" "}
                <span className="font-medium text-gray-800">{formatMoney(subOrder.subtotal)}</span>
              </span>
              <span className="text-gray-500">
                Phí ship:{" "}
                <span className={`font-medium ${subOrder.shippingEstimate ? "text-amber-600" : "text-gray-800"}`}>
                  {formatMoney(subOrder.shippingFee)}
                  {subOrder.shippingEstimate && (
                    <span className="text-[10px] ml-1">(ước tính)</span>
                  )}
                </span>
              </span>
            </div>
            <span className="text-xs text-gray-400">
              Dự kiến: {subOrder.estimatedDays} ngày
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
