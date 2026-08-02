"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function LegacyCheckoutSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchParamsKey = searchParams.toString()

  useEffect(() => {
    router.replace(searchParamsKey ? `/order-success?${searchParamsKey}` : "/order-success")
  }, [router, searchParamsKey])

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">
      Đang chuyển sang trang kết quả đơn hàng...
    </div>
  )
}
