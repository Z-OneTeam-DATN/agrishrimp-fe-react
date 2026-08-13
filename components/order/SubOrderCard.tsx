"use client"

import Image from "next/image"
import { ShoppingBag, Truck, Package } from "lucide-react"
import type { SubOrderDraft } from "@/app/types/order.types"

interface SubOrderCardProps {
  subOrder: SubOrderDraft
  index: number
  imageByVariantId?: Record<number, string | undefined>
}

const formatMoney = (amount: number) => amount.toLocaleString("vi-VN") + "đ"

export function SubOrderCard({
  subOrder,
  index,
  imageByVariantId = {},
}: SubOrderCardProps) {
  return (
    <div className="bg-white border border-gray-200 overflow-hidden">
      {/* Shop header — Shopee style */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <ShoppingBag size={15} className="text-blue-600 shrink-0" />
          <span className="text-sm font-semibold text-gray-800">
            Cửa hàng AgriShrimp
          </span>
        </div>
        <span className="text-[11px] text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
          Xử lý bởi cửa hàng
        </span>
      </div>

      {/* Column headers — desktop only */}
      <div className="hidden md:flex items-center px-4 py-2 bg-gray-50/70 border-b border-gray-100 text-[11px] font-medium text-gray-400 uppercase tracking-wide">
        <div className="flex-1">Sản phẩm</div>
        <div className="w-28 text-center">Đơn giá</div>
        <div className="w-20 text-center">Số lượng</div>
        <div className="w-28 text-right">Thành tiền</div>
      </div>

      {/* Items */}
      <div className="divide-y divide-gray-50">
        {subOrder.items.map((item) => {
          const imageUrl = imageByVariantId[item.productVariantId]

          return (
          <div key={item.productVariantId} className="flex items-center gap-3 px-4 py-3.5">
            {/* Product image placeholder */}
            <div className="w-16 h-16 border border-gray-100 bg-gray-50 shrink-0 rounded overflow-hidden flex items-center justify-center">
              {imageUrl ? (
                <div className="relative h-full w-full">
                  <Image
                    src={imageUrl}
                    alt={item.variantName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <Package size={20} className="text-gray-300" />
              )}
            </div>

            {/* Name + SKU — takes remaining space */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">
                {item.variantName}
              </p>
              {item.variantSku && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Phân loại: {item.variantSku}
                </p>
              )}
              {(item.missingQuantity ?? 0) > 0 && (
                <p className="mt-1 text-[11px] font-semibold text-amber-700">
                  Thiếu {item.missingQuantity}. Hệ thống sẽ điều chuyển hoặc gom thêm trước khi giao.
                </p>
              )}
              {/* Mobile: show price inline */}
              <p className="md:hidden text-xs text-gray-400 mt-1">
                {formatMoney(item.unitPrice)} × {item.quantity}
              </p>
            </div>

            {/* Unit price — desktop */}
            <div className="hidden md:block w-28 text-center shrink-0">
              <span className="text-sm text-gray-500">{formatMoney(item.unitPrice)}</span>
            </div>

            {/* Quantity — desktop */}
            <div className="hidden md:block w-20 text-center shrink-0">
              <span className="text-sm text-gray-600">x{item.quantity}</span>
            </div>

            {/* Subtotal */}
            <div className="w-28 text-right shrink-0">
              <span className="text-sm font-semibold text-blue-600">
                {formatMoney(item.subtotal)}
              </span>
            </div>
          </div>
        )})}
      </div>

      {/* Shipping row */}
      <div className="px-4 py-3 bg-gray-50/40 border-t border-dashed border-gray-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Truck size={13} className="text-gray-400 shrink-0" />
          <span className="text-gray-400">Đơn vị vận chuyển:</span>
          <span className="font-medium text-gray-700">{subOrder.carrier}</span>
          <span className="text-gray-300">·</span>
          <span>Dự kiến {subOrder.estimatedDays}</span>
        </div>
        <div className="text-right shrink-0">
          <span className="text-sm font-medium text-gray-700">
            {formatMoney(subOrder.shippingFee)}
          </span>
        </div>
      </div>

      {/* Footer total */}
      <div className="px-4 py-2.5 border-t border-gray-100 flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-xs text-gray-500">
        <span>{subOrder.items.length} sản phẩm</span>
        <span className="text-gray-300">|</span>
        <span>
          Tổng tiền hàng:{" "}
          <span className="font-medium text-gray-700">{formatMoney(subOrder.subtotal)}</span>
        </span>
        <span className="text-gray-300">|</span>
        <span>
          Phí vận chuyển:{" "}
          <span className="font-medium text-gray-700">{formatMoney(subOrder.shippingFee)}</span>
        </span>
        <span className="text-gray-300">|</span>
        <span className="text-sm font-bold text-gray-900">
          Tổng: {formatMoney(subOrder.subtotal + subOrder.shippingFee)}
        </span>
      </div>
    </div>
  )
}
