"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, CheckCircle2, Clock3, Loader2, ShoppingBag } from "lucide-react"
import { finalizePayosSession, getOrderById } from "@/app/services/orderService"
import { getFriendlyError, parseApiError } from "@/app/utils/apiError"
import type { ConfirmOrderResponse, MyOrder } from "@/app/types/order.types"
import { useCartStore } from "@/stores/useCartStore"

type PaymentState = "SUCCESS" | "PENDING" | "FAILED"

const PAYOS_FINALIZE_RETRY_DELAY_MS = 3000
const PAYOS_FINALIZE_MAX_RETRIES = 20

const formatMoney = (amount?: number | null) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(amount ?? 0))

function SuccessStateCard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchParamsKey = searchParams.toString()
  const { clearCart } = useCartStore()

  const orderIdParam = searchParams.get("orderId")
  const orderCodeParam = searchParams.get("orderCode")
  const resumeOrderIdParam = searchParams.get("resumeOrderId")
  const paymentMethodParam = (searchParams.get("paymentMethod") || "").trim().toUpperCase()
  const method = searchParams.get("method")
  const statusParam = (searchParams.get("status") || "").trim().toUpperCase()
  const paymentSession = searchParams.get("paymentSession")
  const prepareToken = searchParams.get("prepareToken")

  const idForApi =
    orderIdParam && orderIdParam !== "undefined" && orderIdParam !== "null"
      ? orderIdParam
      : null

  const isCancelledPayosReturn =
    statusParam === "CANCELLED" &&
    Boolean(paymentSession || prepareToken || resumeOrderIdParam || idForApi || paymentMethodParam === "PAYOS")

  const isOfflinePayment = method === "offline"

  const [order, setOrder] = useState<MyOrder | null>(null)
  const [confirmResult, setConfirmResult] = useState<ConfirmOrderResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean((idForApi || paymentSession) && !isCancelledPayosReturn))
  const payosRetryCountRef = useRef(0)

  const loadResult = useCallback(
    async (isActive: () => boolean, options?: { silent?: boolean }) => {
      try {
        if (!options?.silent && isActive()) {
          setIsLoading(true)
        }
        if (isActive()) {
          setErrorMessage(null)
        }

        if (paymentSession) {
          const finalized = await finalizePayosSession(paymentSession)
          if (!isActive()) return

          setConfirmResult(finalized)

          if (finalized.orderId) {
            try {
              const data = await getOrderById(finalized.orderId)
              if (isActive()) {
                setOrder(data)
              }
            } catch {
              if (isActive()) {
                setOrder(null)
              }
            }
          } else if (isActive()) {
            setOrder(null)
          }

          return
        }

        if (!idForApi) {
          return
        }

        const data = await getOrderById(idForApi)
        if (isActive()) {
          setOrder(data)
        }
      } catch (error) {
        if (!isActive()) {
          return
        }

        const parsedError = parseApiError(error)
        const shouldKeepPolling =
          Boolean(paymentSession) &&
          (parsedError.code === "NETWORK_ERROR" || parsedError.code === "UNKNOWN") &&
          payosRetryCountRef.current < PAYOS_FINALIZE_MAX_RETRIES

        setErrorMessage(shouldKeepPolling ? null : getFriendlyError(error))
        setOrder(null)
      } finally {
        if (!options?.silent && isActive()) {
          setIsLoading(false)
        }
      }
    },
    [idForApi, paymentSession],
  )

  useEffect(() => {
    if (isCancelledPayosReturn) {
      setIsLoading(false)
      return
    }

    let isActive = true
    void loadResult(() => isActive)

    return () => {
      isActive = false
    }
  }, [isCancelledPayosReturn, loadResult])

  const resolvedOrderId = order?.id ?? confirmResult?.orderId ?? null
  const rawPaymentStatus = String(
    order?.paymentStatus ?? confirmResult?.paymentStatus ?? statusParam ?? "",
  ).toUpperCase()
  const hasCreatedOrder = Boolean(resolvedOrderId)

  const paymentState = useMemo<PaymentState>(() => {
    if (isOfflinePayment) return "SUCCESS"
    if ((rawPaymentStatus === "PAID" || rawPaymentStatus === "SUCCESS") && hasCreatedOrder) {
      return "SUCCESS"
    }
    if (errorMessage || rawPaymentStatus === "FAILED" || rawPaymentStatus === "CANCELLED") {
      return "FAILED"
    }
    return "PENDING"
  }, [errorMessage, hasCreatedOrder, isOfflinePayment, rawPaymentStatus])

  useEffect(() => {
    payosRetryCountRef.current = 0
  }, [paymentSession])

  useEffect(() => {
    if (paymentState === "SUCCESS") {
      clearCart()
    }
  }, [clearCart, paymentState])

  useEffect(() => {
    if (!paymentSession || paymentState !== "PENDING" || isLoading) {
      return
    }

    if (payosRetryCountRef.current >= PAYOS_FINALIZE_MAX_RETRIES) {
      return
    }

    let isActive = true
    const timer = window.setTimeout(() => {
      payosRetryCountRef.current += 1
      void loadResult(() => isActive, { silent: true })
    }, PAYOS_FINALIZE_RETRY_DELAY_MS)

    return () => {
      isActive = false
      window.clearTimeout(timer)
    }
  }, [isLoading, loadResult, paymentSession, paymentState])

  const displayOrderCode =
    order?.code?.trim() ||
    order?.orderCode?.trim() ||
    confirmResult?.orderCode?.trim() ||
    (orderCodeParam && orderCodeParam !== "undefined" && orderCodeParam !== "null"
      ? orderCodeParam
      : "")

  const totalAmount =
    order?.finalAmount ??
    order?.totalAmount ??
    confirmResult?.totalAmount ??
    null

  const checkoutHref = useMemo(() => {
    if (!prepareToken) return "/checkout"

    const nextParams = new URLSearchParams()
    nextParams.set("prepareToken", prepareToken)
    if (paymentSession) {
      nextParams.set("paymentSession", paymentSession)
    }

    return `/checkout?${nextParams.toString()}`
  }, [paymentSession, prepareToken])

  const cancelledCheckoutHref = useMemo(() => {
    const nextParams = new URLSearchParams(searchParamsKey)
    nextParams.set("status", "CANCELLED")
    return `/checkout?${nextParams.toString()}`
  }, [searchParamsKey])

  useEffect(() => {
    if (!isCancelledPayosReturn) {
      return
    }

    router.replace(cancelledCheckoutHref)
  }, [cancelledCheckoutHref, isCancelledPayosReturn, router])

  const hero = useMemo(() => {
    if (paymentState === "FAILED") {
      return {
        icon: <AlertCircle size={42} className="text-red-500" />,
        title: "Thanh toán chưa hoàn tất",
        description:
          errorMessage ||
          "Hệ thống chưa ghi nhận giao dịch PayOS thành công. Bạn có thể quay lại checkout để chọn lại phương thức thanh toán.",
        tone: "border-red-100 bg-red-50/70",
      }
    }

    if (paymentState === "PENDING") {
      return {
        icon: <Clock3 size={42} className="text-amber-500" />,
        title: "Đang chờ xác nhận thanh toán",
        description: paymentSession
          ? "AgriShrimp đang đối chiếu giao dịch PayOS. Đơn hàng chỉ được tạo sau khi thanh toán được xác nhận thành công."
          : "Đơn hàng của bạn đang chờ cập nhật trạng thái thanh toán.",
        tone: "border-amber-100 bg-amber-50/70",
      }
    }

    return {
      icon: <CheckCircle2 size={42} className="text-blue-600" />,
      title: paymentSession ? "Thanh toán thành công" : "Đặt hàng thành công",
      description: paymentSession
        ? "Giao dịch PayOS đã được xác nhận và đơn hàng của bạn đã được tạo thành công."
        : "Đơn hàng của bạn đã được ghi nhận. Bạn có thể theo dõi chi tiết trong trang đơn hàng.",
      tone: "border-blue-100 bg-[linear-gradient(180deg,#eff6ff_0%,#f8fbff_100%)]",
    }
  }, [errorMessage, paymentSession, paymentState])

  if (isCancelledPayosReturn) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
          <Loader2 size={18} className="animate-spin text-blue-600" />
          Đang quay lại trang thanh toán...
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
          <Loader2 size={18} className="animate-spin text-blue-600" />
          {paymentSession ? "Đang xác nhận giao dịch PayOS..." : "Đang tải thông tin đơn hàng..."}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-50 px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-xl">
        <div className={`overflow-hidden rounded-[28px] border shadow-[0_24px_80px_rgba(37,99,235,0.12)] ${hero.tone}`}>
          <div className="px-6 py-10 text-center sm:px-10">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
              {hero.icon}
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">
              Thông báo đơn hàng
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">{hero.title}</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">{hero.description}</p>

            {displayOrderCode && paymentState === "SUCCESS" && (
              <div className="mt-6 inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                Mã đơn: {displayOrderCode}
              </div>
            )}

            {typeof totalAmount === "number" && totalAmount > 0 && (
              <p className="mt-4 text-sm text-slate-500">
                Tổng thanh toán:{" "}
                <span className="font-semibold text-slate-900">{formatMoney(totalAmount)}</span>
              </p>
            )}
          </div>

          <div className="border-t border-white/70 bg-white px-6 py-5 sm:px-10">
            <div className="flex flex-col gap-3 sm:flex-row">
              {paymentState === "SUCCESS" ? (
                <Link
                  href={resolvedOrderId ? `/orders/${resolvedOrderId}` : "/orders/list"}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <ShoppingBag size={16} />
                  Xem đơn hàng
                </Link>
              ) : (
                <Link
                  href={checkoutHref}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <ShoppingBag size={16} />
                  Quay lại checkout
                </Link>
              )}

              <Link
                href="/san-pham"
                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Tiếp tục mua sắm
              </Link>
            </div>

            {paymentState === "PENDING" && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Kiểm tra lại trạng thái thanh toán
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
            <Loader2 size={18} className="animate-spin text-blue-600" />
            Đang chuẩn bị thông báo đơn hàng...
          </div>
        </div>
      }
    >
      <SuccessStateCard />
    </Suspense>
  )
}
