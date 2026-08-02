"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

function CancelRedirectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchParamsKey = searchParams.toString()
  const prepareToken = searchParams.get("prepareToken")
  const paymentSession = searchParams.get("paymentSession")
  const orderId = searchParams.get("resumeOrderId") || searchParams.get("orderId")

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParamsKey)
    nextParams.set("status", "CANCELLED")

    const hasCheckoutState = Boolean(prepareToken || paymentSession || orderId)
    const nextUrl = hasCheckoutState
      ? `/checkout?${nextParams.toString()}`
      : "/checkout?status=CANCELLED"

    router.replace(nextUrl)
  }, [orderId, paymentSession, prepareToken, router, searchParamsKey])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
        <Loader2 size={18} className="animate-spin text-blue-600" />
        Đang quay lại trang thanh toán...
      </div>
    </div>
  )
}

export default function OrderCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
            <Loader2 size={18} className="animate-spin text-blue-600" />
            Đang chuẩn bị trang thanh toán...
          </div>
        </div>
      }
    >
      <CancelRedirectContent />
    </Suspense>
  )
}
