"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AlertCircle, CheckCircle2, Clock3, Loader2, ShoppingBag } from "lucide-react"
import { getOrderById } from "@/app/services/orderService"
import type { MyOrder } from "@/app/types/order.types"
import { useCartStore } from "@/stores/useCartStore"

type PaymentState = "SUCCESS" | "PENDING" | "FAILED"

const formatMoney = (amount?: number | null) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(Number(amount ?? 0))

const resolvePaymentState = (
    isOfflinePayment: boolean,
    order: MyOrder | null,
    statusParam: string | null
): PaymentState => {
    if (isOfflinePayment) return "SUCCESS"

    const rawStatus = String(order?.paymentStatus ?? statusParam ?? "").toUpperCase()
    if (rawStatus === "PAID" || rawStatus === "SUCCESS") return "SUCCESS"
    if (rawStatus === "FAILED" || rawStatus === "CANCELLED") return "FAILED"

    return "PENDING"
}

function SuccessStateCard() {
    const searchParams = useSearchParams()
    const { clearCart } = useCartStore()

    const orderId = searchParams.get("orderId")
    const orderCodeParam = searchParams.get("orderCode")
    const method = searchParams.get("method")
    const statusParam = searchParams.get("status")

    const idForApi =
        orderId && orderId !== "undefined" && orderId !== "null"
            ? orderId
            : orderCodeParam && orderCodeParam !== "undefined" && orderCodeParam !== "null"
                ? orderCodeParam
                : null

    const isOfflinePayment = method === "offline"

    const [order, setOrder] = useState<MyOrder | null>(null)
    const [isLoading, setIsLoading] = useState(Boolean(idForApi))

    useEffect(() => {
        clearCart()
    }, [clearCart])

    useEffect(() => {
        if (!idForApi) {
            setIsLoading(false)
            return
        }

        let isMounted = true

        const fetchOrder = async () => {
            try {
                const data = await getOrderById(idForApi)
                if (isMounted) {
                    setOrder(data)
                }
            } catch {
                if (isMounted) {
                    setOrder(null)
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        void fetchOrder()

        return () => {
            isMounted = false
        }
    }, [idForApi])

    const paymentState = useMemo(
        () => resolvePaymentState(isOfflinePayment, order, statusParam),
        [isOfflinePayment, order, statusParam]
    )

    const displayOrderCode =
        order?.code?.trim() ||
        order?.orderCode?.trim() ||
        (orderCodeParam && orderCodeParam !== "undefined" && orderCodeParam !== "null"
            ? orderCodeParam
            : orderId && orderId !== "undefined" && orderId !== "null"
                ? orderId
                : "")

    const detailHref = idForApi ? `/orders/${idForApi}` : "/orders/list"
    const totalAmount = order?.finalAmount ?? order?.totalAmount ?? null

    const hero = useMemo(() => {
        if (paymentState === "FAILED") {
            return {
                icon: <AlertCircle size={44} className="text-red-500" />,
                title: "Thanh toán chưa hoàn tất",
                description: "Hệ thống chưa ghi nhận giao dịch thành công. Bạn có thể mở lại đơn hàng để kiểm tra hoặc thanh toán lại.",
                tone: "border-red-100 bg-red-50/70",
            }
        }

        if (paymentState === "PENDING") {
            return {
                icon: <Clock3 size={44} className="text-amber-500" />,
                title: "Đơn hàng đang chờ xác nhận thanh toán",
                description: "AgriShrimp đã nhận yêu cầu của bạn. Trạng thái thanh toán sẽ được cập nhật trong trang đơn hàng.",
                tone: "border-amber-100 bg-amber-50/70",
            }
        }

        return {
            icon: <CheckCircle2 size={44} className="text-blue-600" />,
            title: isOfflinePayment ? "Đặt hàng thành công" : "Thanh toán thành công",
            description: "Đơn hàng của bạn đã được ghi nhận. Chi tiết đơn hàng sẽ được theo dõi ở trang đơn hàng.",
            tone: "border-blue-100 bg-[linear-gradient(180deg,#eff6ff_0%,#f8fbff_100%)]",
        }
    }, [isOfflinePayment, paymentState])

    if (isLoading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center px-4">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
                    <Loader2 size={18} className="animate-spin text-blue-600" />
                    Đang tải thông tin đơn hàng...
                </div>
            </div>
        )
    }

    return (
        <div className="bg-slate-50 px-4 py-10 sm:py-14">
            <div className="mx-auto max-w-2xl">
                <div className={`overflow-hidden rounded-[28px] border shadow-[0_24px_80px_rgba(37,99,235,0.12)] ${hero.tone}`}>
                    <div className="px-6 py-10 text-center sm:px-10">
                        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
                            {hero.icon}
                        </div>

                        <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">
                            Thông báo đơn hàng
                        </p>
                        <h1 className="mt-3 text-3xl font-bold text-slate-900">
                            {hero.title}
                        </h1>
                        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
                            {hero.description}
                        </p>

                        {displayOrderCode && (
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
                            <Link
                                href={detailHref}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                <ShoppingBag size={16} />
                                Xem đơn hàng
                            </Link>
                            <Link
                                href="/san-pham"
                                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Tiếp tục mua sắm
                            </Link>
                        </div>
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
