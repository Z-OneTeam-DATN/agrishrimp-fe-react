"use client"

import type { ReactNode } from "react"
import { AlertCircle, Info, MapPin, Truck } from "lucide-react"
import { SubOrderCard } from "./SubOrderCard"
import type { PrepareOrderResponse } from "@/app/types/order.types"

interface PrepareOrderSummaryProps {
  prepareResponse: PrepareOrderResponse
  imageByVariantId?: Record<number, string | undefined>
}

const STOCK_STATUS_COPY: Record<
  NonNullable<PrepareOrderResponse["stockStatus"]>,
  { tone: string; icon: ReactNode; title: string; description: string }
> = {
  FULLY_AVAILABLE: {
    tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: <MapPin size={14} className="mt-0.5 shrink-0 text-emerald-500" />,
    title: "Đủ hàng để xử lý",
    description: "Đơn hàng đang có đủ tồn và có thể được tiếp nhận theo chi nhánh dự kiến.",
  },
  AVAILABLE_AFTER_TRANSFER: {
    tone: "border-amber-200 bg-amber-50 text-amber-800",
    icon: <Truck size={14} className="mt-0.5 shrink-0 text-amber-500" />,
    title: "Cần điều chuyển nội bộ",
    description: "Một số sản phẩm cần được gom về chi nhánh giao hàng trước khi bắt đầu chuẩn bị.",
  },
  PARTIALLY_AVAILABLE: {
    tone: "border-orange-200 bg-orange-50 text-orange-800",
    icon: <AlertCircle size={14} className="mt-0.5 shrink-0 text-orange-500" />,
    title: "Cần xác nhận cung ứng",
    description: "Đơn hàng vẫn có thể tạo, nhưng chi nhánh sẽ cần kiểm tra thêm phương án cung ứng.",
  },
  OUT_OF_STOCK: {
    tone: "border-red-200 bg-red-50 text-red-800",
    icon: <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />,
    title: "Hệ thống đang thiếu hàng",
    description: "Một phần sản phẩm hiện chưa đủ tồn kho trên hệ thống.",
  },
}

export function PrepareOrderSummary({
  prepareResponse,
  imageByVariantId = {},
}: PrepareOrderSummaryProps) {
  const { subOrders, primaryBranch, stockStatus = "FULLY_AVAILABLE", requiresManualApproval } = prepareResponse
  const hasMultipleBranches = subOrders.length > 1
  const hasEstimatingFee = subOrders.some((o) => o.shippingEstimate)
  const statusCopy = STOCK_STATUS_COPY[stockStatus]

  return (
    <div className="space-y-3">
      {primaryBranch && (
        <div className="flex items-start gap-2.5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
          <MapPin size={14} className="mt-0.5 shrink-0 text-blue-500" />
          <p>
            Đơn hàng dự kiến được xử lý tại <strong>{primaryBranch.name}</strong>
            {typeof primaryBranch.distanceKm === "number" ? (
              <span> cách bạn {primaryBranch.distanceKm.toFixed(1)} km.</span>
            ) : (
              <span>.</span>
            )}
          </p>
        </div>
      )}

      <div className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-xs ${statusCopy.tone}`}>
        {statusCopy.icon}
        <div>
          <p className="font-semibold">{statusCopy.title}</p>
          <p className="mt-1">{statusCopy.description}</p>
        </div>
      </div>

      {requiresManualApproval && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <Info size={14} className="mt-0.5 shrink-0 text-amber-500" />
          <p>Chi nhánh có thể cần xác nhận thủ công trước khi chuẩn bị và bàn giao đơn hàng này.</p>
        </div>
      )}

      {hasMultipleBranches && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-500" />
          <p>
            Đơn hàng hiện đang được chia thành <strong>{subOrders.length} phần xử lý</strong> trong hệ thống.
          </p>
        </div>
      )}

      {hasEstimatingFee && (
        <div className="flex items-center gap-2.5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs text-blue-700">
          <Info size={13} className="shrink-0 text-blue-400" />
          Phí vận chuyển hiện là mức ước tính.
        </div>
      )}

      <div className="space-y-3">
        {subOrders.map((subOrder, index) => (
          <SubOrderCard
            key={subOrder.branchId}
            subOrder={subOrder}
            index={index}
            imageByVariantId={imageByVariantId}
          />
        ))}
      </div>
    </div>
  )
}
