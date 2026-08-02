"use client"

import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import { ChevronLeft, CreditCard, ReceiptText } from "lucide-react"
import type { MyOrder, PaymentMethod } from "@/app/types/order.types"
import { resolveImageUrl } from "@/lib/resolveImageUrl"

const formatMoney = (amount: number) => amount.toLocaleString("vi-VN") + "đ"

const formatDateTime = (value?: string | null) => {
  if (!value) return "--"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString("vi-VN")
}

type PaymentOption = {
  val: PaymentMethod
  label: string
  sub: string
  icon: ReactNode
}

interface PendingPaymentResumeViewProps {
  order: MyOrder
  paymentOptions: PaymentOption[]
  paymentMethod: PaymentMethod
  cancelledFromPayos: boolean
  isSubmitting: boolean
  onSelectPaymentMethod: (paymentMethod: PaymentMethod) => void
  onSubmit: () => void
}

export default function PendingPaymentResumeView({
  order,
  paymentOptions,
  paymentMethod,
  cancelledFromPayos,
  isSubmitting,
  onSelectPaymentMethod,
  onSubmit,
}: PendingPaymentResumeViewProps) {
  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-10">
      <div className="bg-white border-b-2 border-blue-500 shadow-sm">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center gap-4 py-3.5">
            <Link href={`/orders/${order.id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
              <ChevronLeft size={18} />
              <span>Quay lại đơn hàng</span>
            </Link>
            <span className="w-px h-6 bg-blue-300" />
            <span className="text-base font-semibold text-gray-700">Chọn lại thanh toán</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl py-6 space-y-4">
        {cancelledFromPayos && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            Bạn vừa hủy thanh toán PayOS. Đơn hàng vẫn đang được giữ, hãy chọn lại phương thức thanh toán để tiếp tục.
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Đơn hàng chờ thanh toán</p>
                  <h1 className="mt-2 text-2xl font-bold text-slate-900">#{order.code}</h1>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <p>Ngày đặt</p>
                  <p className="mt-1 font-semibold text-slate-800">{formatDateTime(order.createdAt)}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Người nhận</p>
                  <p className="mt-1 font-semibold text-slate-900">{order.receiverName || order.customerName}</p>
                  <p className="mt-1">{order.receiverPhone || order.customerPhone}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Địa chỉ giao hàng</p>
                  <p className="mt-1 leading-6 text-slate-700">{order.shippingAddress}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
                <ReceiptText size={18} className="text-blue-600" />
                <h2 className="text-sm font-semibold text-slate-900">Sản phẩm trong đơn</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-3 px-5 py-4">
                    <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                      <Image
                        src={resolveImageUrl(item.image, "/placeholder.png")}
                        alt={item.productName}
                        fill
                        sizes="72px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-slate-900">{item.productName}</p>
                      <p className="mt-1 text-xs text-slate-400">SKU: {item.sku}</p>
                      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                        <span className="text-slate-500">x{item.quantity}</span>
                        <span className="font-semibold text-slate-900">{formatMoney(Number(item.totalPrice ?? 0))}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Chọn phương thức thanh toán</h2>
              <div className="mt-4 space-y-3">
                {paymentOptions.map((option) => (
                  <button
                    key={option.val}
                    type="button"
                    onClick={() => onSelectPaymentMethod(option.val)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      paymentMethod === option.val
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-blue-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{option.icon}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                          <span
                            className={`h-4 w-4 rounded-full border ${
                              paymentMethod === option.val ? "border-blue-500 bg-blue-500" : "border-gray-300"
                            }`}
                          />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{option.sub}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Tạm tính</span>
                  <span>{formatMoney(Number(order.totalAmount ?? 0))}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Phí vận chuyển</span>
                  <span>{formatMoney(Number(order.shippingFee ?? order.totalShippingFee ?? 0))}</span>
                </div>
                {(order.discountAmount ?? 0) > 0 && (
                  <div className="flex items-center justify-between text-blue-600">
                    <span>Voucher</span>
                    <span>-{formatMoney(Number(order.discountAmount ?? 0))}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-3 text-base font-semibold text-slate-900">
                  <span>Tổng thanh toán</span>
                  <span>{formatMoney(Number(order.finalAmount ?? 0))}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CreditCard size={16} />
                {paymentMethod === "PAYOS" ? "Tiếp tục đến PayOS" : "Xác nhận thanh toán COD"}
              </button>

              <Link
                href={`/orders/${order.id}`}
                className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Xem chi tiết đơn hàng
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
