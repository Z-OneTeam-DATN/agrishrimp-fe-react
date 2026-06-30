"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { XCircle, ShoppingCart, RotateCcw } from "lucide-react"

function CancelContent() {
  const searchParams = useSearchParams()
  const orderCode = searchParams.get("orderCode")

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

        {/* Header */}
        <div className="bg-red-50 border-b border-red-100 px-6 py-8 text-center">
          <div className="flex justify-center mb-3">
            <XCircle size={52} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Thanh toán bị huỷ</h1>
          <p className="text-sm text-gray-500">
            {orderCode
              ? `Đơn hàng #${orderCode} chưa được thanh toán`
              : "Giao dịch đã bị huỷ bỏ"}
          </p>
        </div>

        {/* Info */}
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600 text-center leading-relaxed">
            Đơn hàng của bạn vẫn đang chờ. Bạn có thể quay lại thanh toán hoặc chọn phương thức khác (COD, chuyển khoản).
          </p>
        </div>

        {/* CTAs */}
        <div className="px-6 pb-6 space-y-2">
          <Link
            href="/checkout"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            <RotateCcw size={15} />
            Thử lại đặt hàng
          </Link>
          <Link
            href="/user/cart"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ShoppingCart size={15} />
            Quay lại giỏ hàng
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function OrderCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-gray-400 text-sm">Đang tải...</div>}>
        <CancelContent />
      </Suspense>
    </div>
  )
}

