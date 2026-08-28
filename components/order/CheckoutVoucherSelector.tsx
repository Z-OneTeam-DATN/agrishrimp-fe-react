"use client"

import { ChevronRight, Loader2, Tag, TicketPercent, X } from "lucide-react"
import type { UserVoucher } from "@/app/services/voucher.service"

type CheckoutVoucherSelectorProps = {
    availableVouchers: UserVoucher[]
    selectedVoucher: UserVoucher | null
    voucherInput: string
    isLoading: boolean
    isUpdating?: boolean
    pendingAction?: "apply" | "clear" | null
    isOpen: boolean
    onOpen: () => void
    onClose: () => void
    onVoucherInputChange: (value: string) => void
    onApplyByCode: () => void
    onApplyVoucher: (voucher: UserVoucher) => void
    onClearVoucher: () => void
}

const formatMoney = (amount: number) => amount.toLocaleString("vi-VN") + "đ"

const getVoucherLabel = (voucher: UserVoucher) => {
    if (voucher.title?.trim()) return voucher.title.trim()

    const value = Number(voucher.value ?? voucher.discountValue ?? 0)
    if (voucher.discountType === "PERCENT") {
        const maxDiscount = voucher.maxDiscount
            ? ` tối đa ${formatMoney(Number(voucher.maxDiscount))}`
            : ""

        return `Giảm ${value}%${maxDiscount}`
    }

    return `Giảm ${formatMoney(value)}`
}

export default function CheckoutVoucherSelector({
    availableVouchers,
    selectedVoucher,
    voucherInput,
    isLoading,
    isUpdating = false,
    pendingAction = null,
    isOpen,
    onOpen,
    onClose,
    onVoucherInputChange,
    onApplyByCode,
    onApplyVoucher,
    onClearVoucher,
}: CheckoutVoucherSelectorProps) {
    const applicableCount = availableVouchers.filter((voucher) => voucher.canApply).length

    return (
        <>
            <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <TicketPercent size={15} className="text-blue-600" />
                            <p className="text-sm font-semibold text-gray-900">
                                {selectedVoucher ? getVoucherLabel(selectedVoucher) : "Chưa chọn voucher"}
                            </p>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            {selectedVoucher
                                ? `${selectedVoucher.code}${Number(selectedVoucher.previewDiscountAmount ?? 0) > 0 ? ` · Giảm dự kiến ${formatMoney(Number(selectedVoucher.previewDiscountAmount))}` : ""}`
                                : isLoading
                                    ? "Đang tải danh sách voucher..."
                                    : `Hiện có ${applicableCount} voucher có thể áp dụng cho đơn này.`}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onOpen}
                        disabled={isUpdating}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Tag size={14} />}
                        {selectedVoucher ? "Đổi voucher" : "Chọn voucher"}
                        <ChevronRight size={14} />
                    </button>
                </div>

                {isUpdating && (
                    <p className="mt-3 text-xs font-medium text-blue-500">
                        {pendingAction === "clear" ? "Đang bỏ voucher..." : "Đang cập nhật voucher..."}
                    </p>
                )}

                {selectedVoucher && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-600">
                            Đang áp dụng: {selectedVoucher.code}
                        </span>
                        <button
                            type="button"
                            onClick={onClearVoucher}
                            disabled={isUpdating}
                            className="font-semibold text-gray-500 transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            Bỏ chọn voucher
                        </button>
                    </div>
                )}
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={onClose} />

                    <div className="relative z-10 flex max-h-[80vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-w-md sm:rounded-2xl">
                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                            <span className="font-semibold text-gray-800">Chọn voucher</span>
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-gray-400 transition-colors hover:text-gray-600"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="border-b border-gray-100 px-5 py-3">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={voucherInput}
                                    disabled={isUpdating}
                                    onChange={(event) => onVoucherInputChange(event.target.value.toUpperCase())}
                                    onKeyDown={(event) => event.key === "Enter" && onApplyByCode()}
                                    placeholder="Nhập mã voucher..."
                                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50"
                                />
                                <button
                                    type="button"
                                    onClick={onApplyByCode}
                                    disabled={isUpdating}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                                >
                                    Áp dụng
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 space-y-2 overflow-y-auto p-4">
                            {!isLoading && availableVouchers.length === 0 && (
                                <div className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
                                    Chưa có voucher phù hợp cho đơn hàng này.
                                </div>
                            )}

                            {availableVouchers.map((voucher) => {
                                const actualValue = Number(voucher.value ?? voucher.discountValue ?? 0)
                                const minOrderValue = Number(voucher.minOrderValue ?? 0)
                                const isSelected = selectedVoucher?.code === voucher.code
                                const isDisabled = !voucher.canApply

                                return (
                                    <button
                                        key={voucher.code}
                                        type="button"
                                        disabled={isDisabled || isUpdating}
                                        onClick={() => {
                                            onApplyVoucher(voucher)
                                            onClose()
                                        }}
                                        className={`w-full rounded-xl border p-4 text-left transition-all ${
                                            isSelected
                                                ? "border-blue-500 bg-blue-50 ring-1 ring-blue-400"
                                                : isDisabled
                                                    ? "border-gray-200 bg-gray-50 opacity-60"
                                                    : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
                                        }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="min-w-[78px] text-center">
                                                <p className="text-base font-bold text-blue-600">
                                                    {voucher.discountType === "PERCENT"
                                                        ? `${actualValue}%`
                                                        : `-${formatMoney(actualValue)}`}
                                                </p>
                                                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                                    {voucher.code}
                                                </p>
                                            </div>

                                            <div className="h-12 w-px shrink-0 bg-gray-200" />

                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {getVoucherLabel(voucher)}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Đơn tối thiểu {formatMoney(minOrderValue)}
                                                </p>
                                                {voucher.availabilityReason && (
                                                    <p className={`mt-1 text-xs ${isDisabled ? "text-red-500" : "text-blue-600"}`}>
                                                        {voucher.availabilityReason}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
