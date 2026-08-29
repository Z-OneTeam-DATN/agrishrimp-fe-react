"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, Loader2, X, Plus, MapPin, CheckCircle2, Banknote, Smartphone } from "lucide-react"
import { toast } from "sonner"
import { cartService } from "@/app/services/cart.service"
import { addressService } from "@/app/services/address.service"
import { orderService } from "@/app/services/order.service"
import { voucherService, type UserVoucher, type Voucher as PublicVoucher } from "@/app/services/voucher.service"
import { useCartStore } from "@/stores/useCartStore"
import { useAuthStore } from "@/stores/useAuthStore"
import { usePrepareOrder } from "@/hooks/usePrepareOrder"
import { useConfirmOrder } from "@/hooks/useConfirmOrder"
import AddressForm from "@/components/profile/AddressForm"
import CheckoutVoucherSelector from "@/components/order/CheckoutVoucherSelector"
import PendingPaymentResumeView from "@/components/checkout/PendingPaymentResumeView"
import {
    getBackendCodeMessage,
    getFriendlyError,
    getRetryAfterSeconds,
    isRateLimitedError,
    parseApiError,
} from "@/app/utils/apiError"
import type { DeliveryInfo, CartItem, PaymentMethod, MyOrder, PrepareOrderResponse } from "@/app/types/order.types"
import { resolveImageUrl } from "@/lib/resolveImageUrl"
import { repairVietnameseText } from "@/lib/utils"

const formatMoney = (amount: number) => amount.toLocaleString("vi-VN") + "đ"

const normalizeShippingEstimatedDays = (value?: string | null) => {
    if (!value) return "2-3 ngày"

    const repairedValue = repairVietnameseText(value)
    const withoutEstimateSuffix = repairedValue.replace(/\(\s*(?:uoc tinh|ước tính)\s*\)/gi, "")
    const normalizedDays = withoutEstimateSuffix.replace(/\bngay\b/gi, (match) =>
        match.charAt(0) === match.charAt(0).toUpperCase() ? "Ngày" : "ngày"
    )
    const normalizedWhitespace = normalizedDays.replace(/\s+/g, " ").trim()

    return normalizedWhitespace || "2-3 ngày"
}

const formatDateTime = (value?: string | null) => {
    if (!value) return "--"
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return parsed.toLocaleString("vi-VN")
}

const PAYMENT_OPTIONS: { val: PaymentMethod; label: string; sub: string; icon: React.ReactNode }[] = [
    {
        val: "COD",
        label: "Thanh toán khi nhận hàng (COD)",
        sub: "Trả tiền mặt trực tiếp cho shipper",
        icon: <Banknote size={20} className="text-blue-500" />,
    },
    {
        val: "PAYOS",
        label: "Thanh toán online (payOS)",
        sub: "QR Code · Thẻ ATM · Thẻ tín dụng",
        icon: <Smartphone size={20} className="text-blue-500" />,
    },
]

type SavedAddress = {
    id: number
    addressDetail: string
    districtId: number | null
    wardCode: string
    lat: number | null
    lng: number | null
    receiverName: string
    receiverPhone: string
    isDefault?: boolean
}

type SavedAddressApi = {
    id?: number | string | null
    addressDetail?: string | null
    districtId?: number | string | null
    wardId?: string | number | null
    wardCode?: string | number | null
    lat?: number | string | null
    lng?: number | string | null
    receiverName?: string | null
    receiverPhone?: string | null
    isDefault?: boolean | null
}

type CheckoutCartApiItem = {
    id?: number  // Thêm id từ backend
    variantId: number
    quantity: number
    name?: string
    variant?: string
    price?: number
    image?: string
}

type AddressFormValues = {
    fullName: string
    phone: string
    specificAddress: string
    provinceId: string | number
    districtId: string | number
    wardCode: string
    lat?: number | null
    lng?: number | null
    isDefault: boolean
    addressType: string
}

type Voucher = UserVoucher

type PrepareContext = "address" | "refresh" | "voucher"

type VoucherRequestStatus = "idle" | "applying" | "clearing"

type VoucherRequestState = {
    status: VoucherRequestStatus
    requestId: number | null
    previousVoucher: Voucher | null
    previousVoucherCode: string | null
}

const IDLE_VOUCHER_REQUEST_STATE: VoucherRequestState = {
    status: "idle",
    requestId: null,
    previousVoucher: null,
    previousVoucherCode: null,
}

const normalizeNumber = (value: unknown) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

const normalizeWardCode = (value: unknown) => {
    const normalized = String(value ?? "").trim()
    return normalized && normalized !== "undefined" && normalized !== "null" ? normalized : ""
}

const normalizeCoordinate = (value: unknown) => {
    if (value === null || value === undefined || value === "") {
        return null
    }
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
}

const normalizeVoucherCode = (value?: string | null) => {
    const normalized = value?.trim().toUpperCase() || ""
    return normalized || null
}

const isVoucherActive = (voucher: Pick<PublicVoucher, "status" | "startDate" | "endDate">) => {
    const now = Date.now()
    const startOk = !voucher.startDate || new Date(voucher.startDate).getTime() <= now
    const endOk = !voucher.endDate || new Date(voucher.endDate).getTime() >= now
    return voucher.status === "ACTIVE" && startOk && endOk
}

const getVoucherPreviewDiscount = (
    voucher: Pick<PublicVoucher, "discountType" | "value" | "discountValue" | "maxDiscount" | "minOrderValue">,
    orderSubtotal: number,
) => {
    const minOrderValue = Number(voucher.minOrderValue ?? 0)
    if (orderSubtotal < minOrderValue) {
        return 0
    }

    const value = Number(voucher.value ?? voucher.discountValue ?? 0)
    if (voucher.discountType === "PERCENT") {
        const calculatedDiscount = (orderSubtotal * value) / 100
        return voucher.maxDiscount
            ? Math.min(calculatedDiscount, Number(voucher.maxDiscount))
            : calculatedDiscount
    }

    return value
}

const buildCheckoutVoucher = (
    voucher: PublicVoucher,
    orderSubtotal: number,
): Voucher => ({
    ...voucher,
    canApply: isVoucherActive(voucher) && orderSubtotal >= Number(voucher.minOrderValue ?? 0),
    previewDiscountAmount: getVoucherPreviewDiscount(voucher, orderSubtotal),
})

const buildOutOfStockWarning = (response: PrepareOrderResponse) => {
    if (response.canFulfill || response.subOrders?.length || !response.outOfStockItems?.length) {
        return null
    }

    const names = response.outOfStockItems
        .map(
            (item) =>
                `${item.variantSku ?? item.variantName} (yêu cầu ${item.requestedQty}, còn ${item.availableQty})`,
        )
        .join("; ")

    return names ? `Một số sản phẩm không đủ hàng: ${names}` : null
}

const getVoucherLabel = (voucher: Voucher) => {
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

const normalizeSavedAddress = (raw: SavedAddressApi): SavedAddress | null => {
    const id = normalizeNumber(raw.id)
    if (!id) return null

    return {
        id,
        addressDetail: String(raw.addressDetail ?? "").trim(),
        districtId: normalizeNumber(raw.districtId),
        wardCode: normalizeWardCode(raw.wardCode ?? raw.wardId),
        lat: normalizeCoordinate(raw.lat),
        lng: normalizeCoordinate(raw.lng),
        receiverName: String(raw.receiverName ?? "").trim(),
        receiverPhone: String(raw.receiverPhone ?? "").trim(),
        isDefault: Boolean(raw.isDefault),
    }
}

const buildDeliveryInfoFromAddress = (addr: SavedAddress): DeliveryInfo => ({
    address: addr.addressDetail,
    districtId: addr.districtId ?? 0,
    wardCode: addr.wardCode,
    lat: addr.lat,
    lng: addr.lng,
    districtName: "",
    wardName: "",
    receiverName: addr.receiverName,
    receiverPhone: addr.receiverPhone,
    userAddressId: addr.id,
})

const getSavedAddressLocationError = (addr: SavedAddress) => {
    if (!addr.districtId || !addr.wardCode) {
        return "Địa chỉ này đang thiếu Quận/Huyện hoặc Phường/Xã. Vui lòng cập nhật địa chỉ trước khi tính phí giao hàng."
    }

    return null
}

const canPrepareWithDeliveryInfo = (
    info?: DeliveryInfo | null,
): info is DeliveryInfo & { userAddressId: number; districtId: number; wardCode: string } =>
    Boolean(info?.userAddressId && info.districtId && info.wardCode)

const buildCartItemsFromPreparedQuote = (
    preparedQuote: PrepareOrderResponse,
    fallbackCart: CartItem[],
): CartItem[] => {
    const fallbackByVariantId = new Map(
        fallbackCart.map((item) => [item.productVariantId, item])
    )
    const preparedItems = new Map<number, CartItem>()

    preparedQuote.subOrders?.forEach((subOrder) => {
        subOrder.items.forEach((item) => {
            const fallback = fallbackByVariantId.get(item.productVariantId)
            const existing = preparedItems.get(item.productVariantId)

            preparedItems.set(item.productVariantId, {
                productVariantId: item.productVariantId,
                quantity: (existing?.quantity ?? 0) + Number(item.quantity || 0),
                cartItemId: fallback?.cartItemId,
                productName:
                    fallback?.productName?.trim()
                    || item.variantName?.trim()
                    || `Sản phẩm #${item.productVariantId}`,
                variantName:
                    fallback?.variantName?.trim()
                    || item.variantName?.trim()
                    || undefined,
                unitPrice: fallback?.unitPrice ?? Number(item.unitPrice || 0),
                imageUrl: fallback?.imageUrl,
                weightGram: fallback?.weightGram,
            })
        })
    })

    return preparedItems.size > 0
        ? Array.from(preparedItems.values())
        : fallbackCart
}

const mapApiCartItemsToCheckoutItems = (items: CheckoutCartApiItem[]): CartItem[] =>
    items.map((item) => ({
        productVariantId: item.variantId,
        quantity: item.quantity,
        productName: item.name,
        variantName: item.variant,
        unitPrice: item.price,
        imageUrl: item.image,
        cartItemId: item.id,
    }))

const filterCheckoutItemsBySelection = (items: CartItem[], selectedIds: number[]) =>
    selectedIds.length > 0
        ? items.filter((item) => item.cartItemId && selectedIds.includes(item.cartItemId))
        : items

const areCheckoutItemsEquivalent = (left: CartItem[], right: CartItem[]) => {
    if (left.length !== right.length) {
        return false
    }

    return left.every((item, index) => {
        const other = right[index]
        return (
            item.productVariantId === other?.productVariantId
            && item.quantity === other?.quantity
            && (item.cartItemId ?? null) === (other?.cartItemId ?? null)
        )
    })
}

const buildCheckoutItemsSignature = (items: CartItem[]) =>
    items
        .map((item) => `${item.productVariantId}:${item.quantity}:${item.cartItemId ?? ""}`)
        .join("|")

export default function CheckoutPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const searchParamsKey = searchParams.toString()
    const queryVoucherCode = searchParams.get("voucher")?.trim().toUpperCase() || ""
    const normalizedQueryVoucherCode = normalizeVoucherCode(queryVoucherCode)
    const selectedItemsParam = searchParams.get("items") || ""
    const prepareTokenParam = searchParams.get("prepareToken")?.trim() || ""
    const paymentSessionParam = searchParams.get("paymentSession")?.trim() || ""
    const resumeOrderIdParam = searchParams.get("resumeOrderId") || ""
    const cancelledPaymentStatus = (searchParams.get("status") || "").trim().toUpperCase()
    const selectedItemIds = useMemo(
        () => selectedItemsParam
            .split(",")
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value) && value > 0),
        [selectedItemsParam]
    )
    const resumeOrderId = useMemo(() => {
        const parsed = Number(resumeOrderIdParam)
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null
    }, [resumeOrderIdParam])
    const isResumePaymentMode = resumeOrderId !== null
    const isCancelledPayosReturn = cancelledPaymentStatus === "CANCELLED"
        && prepareTokenParam.length > 0
        && paymentSessionParam.length > 0

    const [cartItems, setCartItems] = useState<CartItem[]>([])
    const [isLoadingCart, setIsLoadingCart] = useState(true)
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD")
    const [note, setNote] = useState("")
    const [addressConfirmed, setAddressConfirmed] = useState(false)
    const [resumeOrder, setResumeOrder] = useState<MyOrder | null>(null)
    const [isLoadingResumeOrder, setIsLoadingResumeOrder] = useState(false)
    const [isRetryingResumePayment, setIsRetryingResumePayment] = useState(false)

    const [addresses, setAddresses] = useState<SavedAddress[]>([])
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(false)
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
    const [isAddingNewAddress, setIsAddingNewAddress] = useState(false)
    const [isSubmittingAddress, setIsSubmittingAddress] = useState(false)
    const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([])
    const [carriedVoucher, setCarriedVoucher] = useState<Voucher | null>(null)
    const [isResolvingCarriedVoucher, setIsResolvingCarriedVoucher] = useState(Boolean(normalizedQueryVoucherCode))
    const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
    const [voucherIntentCode, setVoucherIntentCode] = useState<string | null>(null)
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false)
    const [voucherInput, setVoucherInput] = useState(queryVoucherCode)
    const [isLoadingVouchers, setIsLoadingVouchers] = useState(false)
    const [hasLoadedVouchers, setHasLoadedVouchers] = useState(false)
    const [isPreparing, setIsPreparing] = useState(false)
    const [prepareError, setPrepareError] = useState<unknown>(null)
    const [prepareContext, setPrepareContext] = useState<PrepareContext>("address")
    const [voucherRequestState, setVoucherRequestState] = useState<VoucherRequestState>(IDLE_VOUCHER_REQUEST_STATE)

    const [showTokenExpiredModal, setShowTokenExpiredModal] = useState(false)
    const [rateLimitCooldown, setRateLimitCooldown] = useState(0)
    const [addressLocationWarning, setAddressLocationWarning] = useState<string | null>(null)
    const [isRestoringCancelledPayos, setIsRestoringCancelledPayos] = useState(false)
    const [quoteNowMs, setQuoteNowMs] = useState(() => Date.now())
    const confirmAttemptKeyRef = useRef<string | null>(null)
    const handledCancelledSessionRef = useRef<string | null>(null)
    const prepareRequestIdRef = useRef(0)
    const initialVoucherQueryCodeRef = useRef(normalizedQueryVoucherCode)
    const hasHandledInitialVoucherQueryRef = useRef(false)

    const {
        items: persistedCartItems,
        deliveryInfo,
        setDeliveryInfo,
        prepareOrderResponse,
        prepareToken,
        setItems: setStoredCartItems,
        setPrepareResponse,
        clearPrepareResponse,
    } = useCartStore()
    const { isAuthenticated, isLoadingAuth } = useAuthStore()
    const persistedCartItemsSignature = useMemo(
        () => buildCheckoutItemsSignature(persistedCartItems),
        [persistedCartItems]
    )
    const persistedSelectedItems = useMemo(
        () => filterCheckoutItemsBySelection(persistedCartItems, selectedItemIds),
        [persistedCartItemsSignature, selectedItemIds]
    )
    const prepareMutation = usePrepareOrder()
    const confirmMutation = useConfirmOrder({
        onTokenExpired: () => setShowTokenExpiredModal(true),
        onRateLimited: (seconds) => setRateLimitCooldown((prev) => Math.max(prev, seconds)),
    })
    const prepareErrorInfo = useMemo(
        () => (prepareError ? parseApiError(prepareError) : null),
        [prepareError]
    )
    const prepareErrorDisplayMessage = useMemo(() => {
        if (!prepareError) {
            return null
        }

        return getBackendCodeMessage(prepareErrorInfo?.backendCode)
            ?? getFriendlyError(prepareError)
    }, [prepareError, prepareErrorInfo?.backendCode])
    const prepareErrorHelpText = useMemo(
        () => (prepareErrorInfo?.backendCode ? null : "Vui lòng kiểm tra lại thông tin giao hàng hoặc thử lại sau."),
        [prepareErrorInfo?.backendCode]
    )
    const committedVoucherCode = useMemo(
        () => normalizeVoucherCode(prepareOrderResponse?.voucherCode),
        [prepareOrderResponse?.voucherCode]
    )

    useEffect(() => {
        if (rateLimitCooldown <= 0) return
        const timer = setInterval(() => {
            setRateLimitCooldown((prev) => (prev <= 1 ? 0 : prev - 1))
        }, 1000)
        return () => clearInterval(timer)
    }, [rateLimitCooldown])

    useEffect(() => {
        if (!prepareOrderResponse?.expiresAt) {
            setQuoteNowMs(Date.now())
            return
        }

        const expiresAtMs = new Date(prepareOrderResponse.expiresAt).getTime()
        setQuoteNowMs(Date.now())

        if (Number.isNaN(expiresAtMs)) {
            return
        }

        const remainingMs = expiresAtMs - Date.now()
        if (remainingMs <= 0) {
            return
        }

        const timer = globalThis.setTimeout(() => {
            setQuoteNowMs(Date.now())
        }, remainingMs + 50)

        return () => globalThis.clearTimeout(timer)
    }, [prepareOrderResponse?.expiresAt])

    useEffect(() => {
        if (!confirmMutation.isPending) {
            confirmAttemptKeyRef.current = null
        }
    }, [confirmMutation.isPending])

    const cartSubtotal = useMemo(
        () =>
            cartItems.reduce(
                (sum, item) => sum + (Number(item.unitPrice) || 0) * item.quantity,
                0
            ),
        [cartItems]
    )
    const checkoutVoucherOptions = useMemo(() => {
        if (!carriedVoucher) {
            return availableVouchers
        }

        const carriedVoucherCode = normalizeVoucherCode(carriedVoucher.code)
        if (!carriedVoucherCode) {
            return availableVouchers
        }

        if (availableVouchers.some((voucher) => normalizeVoucherCode(voucher.code) === carriedVoucherCode)) {
            return availableVouchers
        }

        return [carriedVoucher, ...availableVouchers]
    }, [availableVouchers, carriedVoucher])

    const activeVoucherCode = voucherIntentCode || undefined
    const checkoutRedirectTarget = searchParamsKey
        ? `/checkout?${searchParamsKey}`
        : "/checkout"

    const findVoucherByCode = useCallback((voucherCode?: string | null) => {
        const normalizedCode = normalizeVoucherCode(voucherCode)
        if (!normalizedCode) {
            return null
        }

        return checkoutVoucherOptions.find(
            (voucher) => voucher.code.trim().toUpperCase() === normalizedCode
        ) ?? (
            selectedVoucher
            && normalizeVoucherCode(selectedVoucher.code) === normalizedCode
                ? selectedVoucher
                : null
        )
    }, [checkoutVoucherOptions, selectedVoucher])

    const syncVoucherInUrl = useCallback((nextVoucherCode?: string | null) => {
        const normalizedCode = normalizeVoucherCode(nextVoucherCode) || ""
        const params = new URLSearchParams(searchParamsKey)

        if (normalizedCode) {
            params.set("voucher", normalizedCode)
        } else {
            params.delete("voucher")
        }

        const query = params.toString()
        const nextUrl = query ? `/checkout?${query}` : "/checkout"

        if (typeof window !== "undefined") {
            window.history.replaceState(window.history.state, "", nextUrl)
        }
    }, [searchParamsKey])

    const handlePrepareSuccess = useCallback((
        response: PrepareOrderResponse,
        requestedVoucherCode?: string | null,
        options?: {
            context?: PrepareContext
            requestId?: number
            showVoucherToast?: boolean
        },
    ) => {
        const committedVoucherCode = normalizeVoucherCode(response.voucherCode)
        const syncedVoucher = findVoucherByCode(committedVoucherCode)
        const showVoucherToast = Boolean(options?.showVoucherToast)

        setPrepareResponse(response, response.prepareToken)
        setPrepareError(null)

        if (options?.context === "voucher" && options.requestId !== undefined) {
            setVoucherRequestState((current) =>
                current.requestId === options.requestId
                    ? IDLE_VOUCHER_REQUEST_STATE
                    : current
            )
        }

        const stockWarning = buildOutOfStockWarning(response)
        if (stockWarning) {
            toast.warning(stockWarning)
        }

        if (committedVoucherCode) {
            if (syncedVoucher) {
                setSelectedVoucher(syncedVoucher)
            }
            setVoucherIntentCode(committedVoucherCode)
            setVoucherInput(committedVoucherCode)
            syncVoucherInUrl(committedVoucherCode)

            if (showVoucherToast && requestedVoucherCode === committedVoucherCode) {
                toast.success("Đã áp dụng voucher.")
            }
            return
        }

        setSelectedVoucher(null)
        setVoucherIntentCode(null)
        setVoucherInput("")
        syncVoucherInUrl(null)

        if (showVoucherToast) {
            if (requestedVoucherCode) {
                toast.info("Voucher đã được gỡ vì báo giá đơn hàng mới không còn đủ điều kiện áp dụng.")
            } else {
                toast.success("Đã bỏ chọn voucher.")
            }
        }
    }, [findVoucherByCode, setPrepareResponse, syncVoucherInUrl])

    const requestPrepareQuote = useCallback((
        userAddressId: number,
        currentCart: CartItem[] = cartItems,
        nextVoucherCode?: string | null,
        options?: {
            context?: PrepareContext
            rollbackVoucher?: Voucher | null
            rollbackVoucherCode?: string | null
            showVoucherToast?: boolean
        },
    ) => {
        const requestId = ++prepareRequestIdRef.current
        const normalizedVoucherCode = normalizeVoucherCode(nextVoucherCode)
        const selectedAddress = addresses.find((addr) => addr.id === userAddressId)
        const selectedDeliveryInfo = deliveryInfo?.userAddressId === userAddressId ? deliveryInfo : null
        const context = options?.context ?? "address"

        setPrepareError(null)
        setPrepareContext(context)
        setIsPreparing(context !== "voucher")

        prepareMutation.mutate({
            userAddressId,
            ...(selectedAddress?.lat != null || selectedDeliveryInfo?.lat != null
                ? { userLat: Number(selectedAddress?.lat ?? selectedDeliveryInfo?.lat) }
                : {}),
            ...(selectedAddress?.lng != null || selectedDeliveryInfo?.lng != null
                ? { userLng: Number(selectedAddress?.lng ?? selectedDeliveryInfo?.lng) }
                : {}),
            cart: currentCart.map((item) => ({
                productVariantId: item.productVariantId,
                quantity: item.quantity,
            })),
            ...(normalizedVoucherCode ? { voucherCode: normalizedVoucherCode } : {}),
        }, {
            onSuccess: (response) => {
                if (requestId !== prepareRequestIdRef.current) {
                    return
                }

                setIsPreparing(false)
                handlePrepareSuccess(
                    response,
                    normalizedVoucherCode,
                    {
                        context,
                        requestId,
                        showVoucherToast: Boolean(options?.showVoucherToast),
                    },
                )
            },
            onError: (error) => {
                if (requestId !== prepareRequestIdRef.current) {
                    return
                }

                setIsPreparing(false)

                if (context === "voucher") {
                    const rollbackVoucherCode = normalizeVoucherCode(options?.rollbackVoucherCode)

                    setVoucherRequestState((current) =>
                        current.requestId === requestId
                            ? IDLE_VOUCHER_REQUEST_STATE
                            : current
                    )
                    setSelectedVoucher(options?.rollbackVoucher ?? null)
                    setVoucherIntentCode(rollbackVoucherCode)
                    setVoucherInput(rollbackVoucherCode || "")
                    syncVoucherInUrl(rollbackVoucherCode)

                    if (isRateLimitedError(error)) {
                        setRateLimitCooldown((prev) => Math.max(prev, getRetryAfterSeconds(error)))
                    }

                    toast.error(getFriendlyError(error))
                    return
                }

                setPrepareError(error)

                if (isRateLimitedError(error)) {
                    setRateLimitCooldown((prev) => Math.max(prev, getRetryAfterSeconds(error)))
                    return
                }

                toast.error(getFriendlyError(error))
            },
        })
        return requestId
    }, [addresses, cartItems, deliveryInfo, handlePrepareSuccess, prepareMutation, syncVoucherInUrl])

    const syncVisibleCartItems = useCallback((nextItems: CartItem[]) => {
        setCartItems((currentItems) =>
            areCheckoutItemsEquivalent(currentItems, nextItems) ? currentItems : nextItems
        )
    }, [])

    const syncStoredCartItems = useCallback((nextItems: CartItem[]) => {
        if (!areCheckoutItemsEquivalent(persistedCartItems, nextItems)) {
            setStoredCartItems(nextItems)
        }
    }, [persistedCartItems, setStoredCartItems])

    const fetchAvailableVouchers = useCallback(async (orderSubtotal: number) => {
        setIsLoadingVouchers(true)
        try {
            const vouchers = await voucherService.getAvailableForMe(orderSubtotal)
            setAvailableVouchers(
                Array.isArray(vouchers)
                    ? vouchers.map((voucher) => ({
                        ...voucher,
                        previewDiscountAmount:
                            voucher.previewDiscountAmount
                            ?? getVoucherPreviewDiscount(voucher, orderSubtotal),
                    }))
                    : []
            )
        } catch (error) {
            console.error("Không thể tải danh sách voucher", error)
            setAvailableVouchers([])
        } finally {
            setHasLoadedVouchers(true)
            setIsLoadingVouchers(false)
        }
    }, [])

    const applyVoucher = useCallback((
        voucher: Voucher | null,
        options?: { closeModal?: boolean; showToast?: boolean }
    ) => {
        const nextVoucherCode = normalizeVoucherCode(voucher?.code)
        const previousVoucher = committedVoucherCode ? findVoucherByCode(committedVoucherCode) : null
        const previousVoucherCode = committedVoucherCode

        setPrepareError(null)
        setSelectedVoucher(nextVoucherCode ? voucher : null)
        setVoucherIntentCode(nextVoucherCode)
        setVoucherInput(nextVoucherCode || "")
        syncVoucherInUrl(nextVoucherCode)

        if (options?.closeModal) {
            setIsVoucherModalOpen(false)
        }

        if (canPrepareWithDeliveryInfo(deliveryInfo)) {
            const requestId = requestPrepareQuote(deliveryInfo.userAddressId, cartItems, nextVoucherCode, {
                context: "voucher",
                rollbackVoucher: previousVoucher,
                rollbackVoucherCode: previousVoucherCode,
                showVoucherToast: options?.showToast,
            })
            setVoucherRequestState({
                status: nextVoucherCode ? "applying" : "clearing",
                requestId,
                previousVoucher,
                previousVoucherCode,
            })
            return
        }

        setVoucherRequestState(IDLE_VOUCHER_REQUEST_STATE)
        if (!nextVoucherCode) {
            setSelectedVoucher(null)
            if (options?.showToast) {
                toast.success("Đã bỏ chọn voucher.")
            }
        }
    }, [cartItems, committedVoucherCode, deliveryInfo, findVoucherByCode, requestPrepareQuote, syncVoucherInUrl])

    const applyVoucherByCode = useCallback(() => {
        const normalizedCode = voucherInput.trim().toUpperCase()

        if (!normalizedCode) {
            applyVoucher(null, { closeModal: true, showToast: true })
            return
        }

        const foundVoucher = checkoutVoucherOptions.find(
            (voucher) => voucher.code.trim().toUpperCase() === normalizedCode
        )

        if (!foundVoucher) {
            toast.error("Không tìm thấy voucher phù hợp cho đơn hàng này.")
            return
        }

        if (!foundVoucher.canApply) {
            toast.error(foundVoucher.availabilityReason || "Voucher chưa đủ điều kiện áp dụng.")
            return
        }

        applyVoucher(foundVoucher, { closeModal: true, showToast: true })
    }, [applyVoucher, checkoutVoucherOptions, voucherInput])

    useEffect(() => {
        if (cartSubtotal <= 0) {
            setAvailableVouchers([])
            setHasLoadedVouchers(true)
            return
        }

        void fetchAvailableVouchers(cartSubtotal)
    }, [cartSubtotal, fetchAvailableVouchers])

    useEffect(() => {
        const initialVoucherCode = initialVoucherQueryCodeRef.current
        if (!initialVoucherCode) {
            setCarriedVoucher(null)
            setIsResolvingCarriedVoucher(false)
            return
        }

        const existingVoucher = availableVouchers.find(
            (voucher) => normalizeVoucherCode(voucher.code) === initialVoucherCode
        )
        if (existingVoucher) {
            setCarriedVoucher(null)
            setIsResolvingCarriedVoucher(false)
            return
        }

        let cancelled = false
        setIsResolvingCarriedVoucher(true)

        void voucherService.getByCode(initialVoucherCode)
            .then((voucher) => {
                if (cancelled) {
                    return
                }

                if (!voucher || !isVoucherActive(voucher)) {
                    setCarriedVoucher(null)
                    return
                }

                setCarriedVoucher(buildCheckoutVoucher(voucher, cartSubtotal))
            })
            .catch(() => {
                if (!cancelled) {
                    setCarriedVoucher(null)
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsResolvingCarriedVoucher(false)
                }
            })

        return () => {
            cancelled = true
        }
    }, [availableVouchers, cartSubtotal])

    useEffect(() => {
        if (!hasLoadedVouchers) return

        if (hasHandledInitialVoucherQueryRef.current) {
            return
        }

        hasHandledInitialVoucherQueryRef.current = true
        const initialVoucherCode = initialVoucherQueryCodeRef.current

        if (!initialVoucherCode) {
            return
        }

        const foundVoucher = checkoutVoucherOptions.find(
            (voucher) => voucher.code.trim().toUpperCase() === initialVoucherCode
        )

        if (!foundVoucher && isResolvingCarriedVoucher) {
            return
        }

        if (!foundVoucher || foundVoucher.canApply === false) {
            syncVoucherInUrl(null)
            return
        }

        applyVoucher(foundVoucher)
    }, [applyVoucher, checkoutVoucherOptions, hasLoadedVouchers, isResolvingCarriedVoucher, syncVoucherInUrl])

    // 🐛 FIX LỖI 400: Thêm tham số currentCart = cartItems
    const handleAddressSelect = (addr: SavedAddress, currentCart = cartItems) => {
        setPrepareError(null)
        setAddressLocationWarning(null)

        const info = buildDeliveryInfoFromAddress(addr)
        setDeliveryInfo(info)
        setAddressConfirmed(true)
        setIsAddressModalOpen(false)

        const locationError = getSavedAddressLocationError(addr)
        if (locationError) {
            clearPrepareResponse()
            setAddressLocationWarning(locationError)
            return
        }

        if (addr.id) {
            requestPrepareQuote(addr.id, currentCart, activeVoucherCode)
        }
    }

    const restoreCancelledPayosQuote = useCallback(async (
        normalizedAddresses: SavedAddress[],
        currentCart: CartItem[],
    ) => {
        const handledKey = `${paymentSessionParam}:${prepareTokenParam}:${cancelledPaymentStatus}`
        if (handledCancelledSessionRef.current === handledKey) {
            return
        }

        handledCancelledSessionRef.current = handledKey
        setIsRestoringCancelledPayos(true)

        try {
            const restoredQuote = await orderService.getPreparedOrder(prepareTokenParam)
            const restoredCartItems = buildCartItemsFromPreparedQuote(restoredQuote, currentCart)

            try {
                await orderService.cancelPayosSession(paymentSessionParam)
            } catch {
                // Session may already be closed or expired; continue restoring the quote.
            }

            syncVisibleCartItems(restoredCartItems)
            syncStoredCartItems(restoredCartItems)
            prepareRequestIdRef.current += 1
            setIsPreparing(false)
            setPrepareError(null)
            setPrepareResponse(restoredQuote, restoredQuote.prepareToken)
            setVoucherIntentCode(normalizeVoucherCode(restoredQuote.voucherCode))
            setVoucherInput(normalizeVoucherCode(restoredQuote.voucherCode) || "")
            setPaymentMethod("PAYOS")
            setAddressConfirmed(true)
            confirmAttemptKeyRef.current = null

            const matchedAddress = normalizedAddresses.find(
                (addr) => addr.id === restoredQuote.addressId
            )

            if (matchedAddress) {
                setDeliveryInfo(buildDeliveryInfoFromAddress(matchedAddress))
                setAddressLocationWarning(getSavedAddressLocationError(matchedAddress))
            } else {
                setDeliveryInfo({
                    address: restoredQuote.deliveryAddress || "",
                    districtId: Number(restoredQuote.deliveryDistrictId || 0),
                    wardCode: restoredQuote.deliveryWardCode || "",
                    districtName: "",
                    wardName: "",
                    receiverName: restoredQuote.receiverName || "",
                    receiverPhone: restoredQuote.receiverPhone || "",
                    userAddressId: Number(restoredQuote.addressId || 0),
                })
                setAddressLocationWarning(null)
            }

            if (cancelledPaymentStatus === "CANCELLED") {
                toast.info("Bạn đã hủy thanh toán PayOS. Vui lòng chọn lại phương thức thanh toán.", {
                    id: "payos-cancelled",
                })
            }
        } catch (error) {
            handledCancelledSessionRef.current = null
            toast.error(getFriendlyError(error), {
                id: "checkout-restore-error",
            })

            if (normalizedAddresses.length > 0 && currentCart.length > 0) {
                const defaultAddr = normalizedAddresses.find((addr) => addr.isDefault) || normalizedAddresses[0]
                handleAddressSelect(defaultAddr, currentCart)
            }
        } finally {
            setIsRestoringCancelledPayos(false)
        }
    }, [
        cancelledPaymentStatus,
        paymentSessionParam,
        prepareTokenParam,
        setDeliveryInfo,
        setPrepareResponse,
        syncStoredCartItems,
        syncVisibleCartItems,
    ])

    useEffect(() => {
        if (isLoadingAuth) return
        if (!isAuthenticated) {
            toast.error("Vui lòng đăng nhập để thanh toán!")
            router.push(`/login?redirect=${encodeURIComponent(checkoutRedirectTarget)}`)
            return
        }
        if (isResumePaymentMode) {
            setIsLoadingCart(false)
            return
        }

        let isMounted = true

        const loadData = async () => {
            const hasPersistedSelection = persistedSelectedItems.length > 0
            try {
                if (hasPersistedSelection && !isCancelledPayosReturn) {
                    syncVisibleCartItems(persistedSelectedItems)
                    setIsLoadingCart(false)
                } else {
                    setIsLoadingCart(true)
                }

                setIsLoadingAddresses(true)
                const [addressData, rawCartData] = await Promise.all([
                    addressService.getAll().catch(() => []),
                    hasPersistedSelection
                        ? Promise.resolve<CheckoutCartApiItem[]>([])
                        : cartService.getMyCart().then((data) =>
                            Array.isArray(data) ? data as CheckoutCartApiItem[] : []
                        ).catch((error) => {
                            if (isCancelledPayosReturn) {
                                return []
                            }
                            throw error
                        }),
                ])

                if (!isMounted) {
                    return
                }

                const normalizedAddresses = Array.isArray(addressData)
                    ? addressData
                        .map((item) => normalizeSavedAddress(item as SavedAddressApi))
                        .filter((item): item is SavedAddress => item !== null)
                    : []
                setAddresses(normalizedAddresses)

                const mappedItems = mapApiCartItemsToCheckoutItems(rawCartData || [])
                if (mappedItems.length > 0) {
                    syncStoredCartItems(mappedItems)
                }

                if (isCancelledPayosReturn) {
                    const cancelledCartItems = hasPersistedSelection
                        ? persistedSelectedItems
                        : filterCheckoutItemsBySelection(mappedItems, selectedItemIds)
                    syncVisibleCartItems(cancelledCartItems)
                    await restoreCancelledPayosQuote(normalizedAddresses, cancelledCartItems)
                    return
                }

                if (hasPersistedSelection) {
                    if (normalizedAddresses.length > 0) {
                        const defaultAddr = normalizedAddresses.find((a) => a.isDefault) || normalizedAddresses[0]
                        handleAddressSelect(defaultAddr, persistedSelectedItems)
                    }
                    return
                }

                if (mappedItems.length === 0) {
                    toast.warning("Giỏ hàng trống, vui lòng thêm sản phẩm!", {
                        id: "checkout-empty-cart",
                    })
                    router.push("/user/cart")
                    return
                }

                const filteredItems = filterCheckoutItemsBySelection(mappedItems, selectedItemIds)

                if (selectedItemIds.length > 0 && filteredItems.length === 0) {
                    toast.error("Không tìm thấy sản phẩm đã chọn trong giỏ hàng!", {
                        id: "checkout-selected-items-missing",
                    })
                    router.push("/user/cart")
                    return
                }

                syncVisibleCartItems(filteredItems)
                setIsLoadingCart(false)
                if (normalizedAddresses.length > 0) {
                    const defaultAddr = normalizedAddresses.find((a) => a.isDefault) || normalizedAddresses[0]
                    handleAddressSelect(defaultAddr, filteredItems)
                }
            } catch (error) {
                if (!isMounted) {
                    return
                }
                toast.error(getFriendlyError(error), {
                    id: "checkout-load-error",
                })
            } finally {
                if (isMounted) {
                    setIsLoadingAddresses(false)
                    setIsLoadingCart(false)
                }
            }
        }

        void loadData()

        return () => {
            isMounted = false
        }
    }, [
        checkoutRedirectTarget,
        router,
        isAuthenticated,
        isLoadingAuth,
        selectedItemsParam,
        isResumePaymentMode,
        isCancelledPayosReturn,
        persistedCartItemsSignature,
        persistedSelectedItems,
        restoreCancelledPayosQuote,
        syncStoredCartItems,
        syncVisibleCartItems,
    ])

    useEffect(() => {
        if (!isResumePaymentMode || !resumeOrderId) return
        if (isLoadingAuth || !isAuthenticated) return

        let isMounted = true

        const loadResumeOrder = async () => {
            try {
                setIsLoadingResumeOrder(true)
                const data = await orderService.getOrderById(resumeOrderId)
                if (!isMounted) return
                setResumeOrder(data)
                setPaymentMethod(data.paymentMethod === "PAYOS" ? "PAYOS" : "COD")
            } catch (error) {
                if (!isMounted) return
                setResumeOrder(null)
                toast.error(getFriendlyError(error))
            } finally {
                if (isMounted) {
                    setIsLoadingResumeOrder(false)
                }
            }
        }

        void loadResumeOrder()

        return () => {
            isMounted = false
        }
    }, [resumeOrderId, isResumePaymentMode, isAuthenticated, isLoadingAuth])

    const handleAddNewAddress = async (data: AddressFormValues) => {
        setIsSubmittingAddress(true)
        try {
            const payload = {
                receiverName: data.fullName,
                receiverPhone: data.phone,
                addressDetail: data.specificAddress,
                provinceId: Number(data.provinceId),
                districtId: Number(data.districtId),
                wardCode: data.wardCode,
                lat: data.lat ?? null,
                lng: data.lng ?? null,
                isDefault: data.isDefault,
                addressType: data.addressType,
            }
            const newAddr = await addressService.create(payload)
            toast.success("Đã thêm địa chỉ mới!")
            const updatedAddressData = await addressService.getAll()
            const updatedAddresses = Array.isArray(updatedAddressData)
                ? updatedAddressData
                    .map((item) => normalizeSavedAddress(item as SavedAddressApi))
                    .filter((item): item is SavedAddress => item !== null)
                : []
            setAddresses(updatedAddresses)
            const createdAddress = normalizeSavedAddress(newAddr as SavedAddressApi)
            const selectedAddress = createdAddress
                ? createdAddress
                : updatedAddresses.find(
                    (a) =>
                        a.addressDetail === payload.addressDetail &&
                        a.receiverPhone === payload.receiverPhone
                )
            if (selectedAddress) {
                handleAddressSelect(selectedAddress)
            }
            setIsAddingNewAddress(false)
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.message || "Lỗi khi thêm địa chỉ!")
        } finally {
            setIsSubmittingAddress(false)
        }
    }

    const prepareOrderDisplayResponse = useMemo(() => {
        if (!prepareOrderResponse) return null

        const cartPriceByVariantId = Object.fromEntries(
            cartItems.map((item) => [item.productVariantId, Number(item.unitPrice) || 0])
        ) as Record<number, number>

        const subOrders = prepareOrderResponse.subOrders.map((subOrder) => {
            const items = subOrder.items.map((item) => {
                const unitPrice =
                    item.unitPrice > 0
                        ? item.unitPrice
                        : (cartPriceByVariantId[item.productVariantId] ?? 0)
                const subtotal =
                    item.subtotal > 0
                        ? item.subtotal
                        : unitPrice * item.quantity

                return {
                    ...item,
                    unitPrice,
                    subtotal,
                }
            })

            const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)

            return {
                ...subOrder,
                items,
                subtotal: subOrder.subtotal > 0 ? subOrder.subtotal : subtotal,
            }
        })

        const totalSubtotal = subOrders.reduce((sum, subOrder) => sum + subOrder.subtotal, 0)
        const finalSubtotal =
            prepareOrderResponse.totalSubtotal > 0 ? prepareOrderResponse.totalSubtotal : totalSubtotal
        const finalTotalAmount = Math.max(
            finalSubtotal + prepareOrderResponse.totalShippingFee - prepareOrderResponse.discountAmount,
            0
        )
        const shouldUseRecomputedTotals = finalSubtotal !== prepareOrderResponse.totalSubtotal

        return {
            ...prepareOrderResponse,
            subOrders,
            totalSubtotal: finalSubtotal,
            totalAmount:
                shouldUseRecomputedTotals ? finalTotalAmount : prepareOrderResponse.totalAmount,
        }
    }, [cartItems, prepareOrderResponse])

    const checkoutDisplayItems = useMemo(() => {
        const preparedTotalsByVariantId = new Map<number, { unitPrice: number; subtotal: number }>()

        prepareOrderDisplayResponse?.subOrders.forEach((subOrder) => {
            subOrder.items.forEach((item) => {
                const existing = preparedTotalsByVariantId.get(item.productVariantId)
                const unitPrice =
                    item.unitPrice > 0
                        ? item.unitPrice
                        : (existing?.unitPrice ?? 0)
                const subtotal =
                    (existing?.subtotal ?? 0) +
                    (item.subtotal > 0 ? item.subtotal : unitPrice * item.quantity)

                preparedTotalsByVariantId.set(item.productVariantId, {
                    unitPrice,
                    subtotal,
                })
            })
        })

        return cartItems.map((item) => {
            const prepared = preparedTotalsByVariantId.get(item.productVariantId)
            const unitPrice = prepared?.unitPrice ?? Number(item.unitPrice) ?? 0

            return {
                ...item,
                displayName: item.productName?.trim() || `Sản phẩm #${item.productVariantId}`,
                displayVariant: item.variantName?.trim() || "",
                unitPrice,
                subtotal: prepared?.subtotal && prepared.subtotal > 0
                    ? prepared.subtotal
                    : unitPrice * item.quantity,
            }
        })
    }, [cartItems, prepareOrderDisplayResponse])

    const shippingPreview = useMemo(() => {
        if (!prepareOrderDisplayResponse) return null

        const firstSubOrder = prepareOrderDisplayResponse.subOrders[0]

        return {
            carrier: firstSubOrder?.carrier?.trim() || "Đối tác vận chuyển",
            estimatedDays: normalizeShippingEstimatedDays(firstSubOrder?.estimatedDays),
            label: firstSubOrder?.shippingEstimate ? "Phí vận chuyển tạm tính" : "Phí vận chuyển GHN",
            isEstimate: Boolean(firstSubOrder?.shippingEstimate),
        }
    }, [prepareOrderDisplayResponse])

    const totalDisplayQuantity = useMemo(
        () => checkoutDisplayItems.reduce((sum, item) => sum + item.quantity, 0),
        [checkoutDisplayItems]
    )

    const quoteExpiresAtMs = useMemo(() => {
        if (!prepareOrderDisplayResponse?.expiresAt) return null
        const parsed = new Date(prepareOrderDisplayResponse.expiresAt).getTime()
        return Number.isNaN(parsed) ? null : parsed
    }, [prepareOrderDisplayResponse?.expiresAt])

    const quoteExpired = quoteExpiresAtMs !== null && quoteExpiresAtMs <= quoteNowMs
    const isVoucherUpdating = voucherRequestState.status !== "idle"
    const optimisticDiscountAmount = useMemo(() => {
        if (!isVoucherUpdating) return null
        if (!selectedVoucher) return 0

        const parsed = Number(selectedVoucher.previewDiscountAmount)
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
    }, [isVoucherUpdating, selectedVoucher])
    const displayDiscountAmount = useMemo(() => {
        if (!prepareOrderDisplayResponse) return 0
        if (!isVoucherUpdating) return prepareOrderDisplayResponse.discountAmount
        if (!selectedVoucher) return 0
        return optimisticDiscountAmount ?? prepareOrderDisplayResponse.discountAmount
    }, [isVoucherUpdating, optimisticDiscountAmount, prepareOrderDisplayResponse, selectedVoucher])
    const displayTotalAmount = useMemo(() => {
        if (!prepareOrderDisplayResponse) return 0
        if (!isVoucherUpdating) return prepareOrderDisplayResponse.totalAmount

        return Math.max(
            prepareOrderDisplayResponse.totalSubtotal
            + prepareOrderDisplayResponse.totalShippingFee
            - displayDiscountAmount,
            0,
        )
    }, [displayDiscountAmount, isVoucherUpdating, prepareOrderDisplayResponse])
    const displayVoucherCode = useMemo(
        () => (isVoucherUpdating
            ? normalizeVoucherCode(selectedVoucher?.code)
            : committedVoucherCode),
        [committedVoucherCode, isVoucherUpdating, selectedVoucher?.code],
    )

    const appliedVoucherDetails = useMemo(() => {
        if (!displayVoucherCode) return null

        if (selectedVoucher?.code.trim().toUpperCase() === displayVoucherCode) {
            return selectedVoucher
        }

        return checkoutVoucherOptions.find(
            (voucher) => voucher.code.trim().toUpperCase() === displayVoucherCode
        ) ?? null
    }, [checkoutVoucherOptions, displayVoucherCode, selectedVoucher])

    useEffect(() => {
        if (voucherRequestState.status !== "idle") {
            return
        }

        if (!committedVoucherCode) {
            setSelectedVoucher(null)
            setVoucherIntentCode(null)
            setVoucherInput("")
            return
        }

        const syncedVoucher = checkoutVoucherOptions.find(
            (voucher) => voucher.code.trim().toUpperCase() === committedVoucherCode
        ) ?? null

        if (syncedVoucher && syncedVoucher !== selectedVoucher) {
            setSelectedVoucher(syncedVoucher)
        }

        if (voucherIntentCode !== committedVoucherCode) {
            setVoucherIntentCode(committedVoucherCode)
            setVoucherInput(committedVoucherCode)
        }
    }, [checkoutVoucherOptions, committedVoucherCode, selectedVoucher, voucherIntentCode, voucherRequestState.status])

    const handleConfirm = () => {
        if (rateLimitCooldown > 0) {
            return // Chỉ disable button, không show toast
        }
        if (quoteExpired) {
            setShowTokenExpiredModal(true)
            return
        }
        if (!prepareToken) { setShowTokenExpiredModal(true); return }
        if (!confirmAttemptKeyRef.current) {
            confirmAttemptKeyRef.current =
                globalThis.crypto?.randomUUID?.() ??
                `${Date.now()}-${Math.random().toString(36).slice(2)}`
        }
        confirmMutation.mutate({
            prepareToken,
            idempotencyKey: confirmAttemptKeyRef.current,
            paymentMethod,
            note: note.trim() || undefined,
        })
    }

    const retryPrepare = () => {
        if (rateLimitCooldown > 0) {
            return // Chỉ disable button, không show toast
        }
        confirmAttemptKeyRef.current = null
        setShowTokenExpiredModal(false)
        if (!deliveryInfo?.userAddressId) return
        if (!canPrepareWithDeliveryInfo(deliveryInfo)) {
            clearPrepareResponse()
            setAddressLocationWarning("Địa chỉ này đang thiếu Quận/Huyện hoặc Phường/Xã. Vui lòng cập nhật địa chỉ trước khi tính phí giao hàng.")
            return
        }
        requestPrepareQuote(deliveryInfo.userAddressId, cartItems, activeVoucherCode)
    }

    const handleResumePaymentConfirm = async () => {
        if (!resumeOrder) return

        try {
            setIsRetryingResumePayment(true)
            const response = await orderService.retryPendingPayment(resumeOrder.id, paymentMethod)

            if (response.checkoutUrl) {
                window.location.href = response.checkoutUrl
                return
            }

            if ((response.paymentStatus || "").toUpperCase() === "PAID") {
                const orderCode = response.orderCode ?? ""
                router.push(
                    `/order-success?orderId=${response.orderId}&orderCode=${encodeURIComponent(orderCode)}&status=PAID`
                )
                return
            }

            const orderCode = response.orderCode ?? ""
            router.push(
                `/order-success?orderId=${response.orderId}&orderCode=${encodeURIComponent(orderCode)}&method=offline`
            )
        } catch (error) {
            toast.error(getFriendlyError(error))
            try {
                const refreshedOrder = await orderService.getOrderById(resumeOrder.id)
                setResumeOrder(refreshedOrder)
            } catch {
                // Keep the current UI state if the refresh also fails.
            }
        } finally {
            setIsRetryingResumePayment(false)
        }
    }

    const canResumePendingPayment = !!resumeOrder
        && resumeOrder.paymentMethod === "PAYOS"
        && ["PENDING", "UNPAID"].includes(String(resumeOrder.paymentStatus || "").toUpperCase())
        && ["PENDING_PAYMENT", "AWAITING_PAYMENT"].includes(String(resumeOrder.status || "").toUpperCase())

    const resumeBlockedMessage = useMemo(() => {
        if (!resumeOrder) {
            return "Không thể tải đơn hàng cần thanh toán lại."
        }

        if (String(resumeOrder.paymentStatus || "").toUpperCase() === "PAID") {
            return "Đơn hàng này đã được thanh toán thành công."
        }

        if (
            String(resumeOrder.paymentStatus || "").toUpperCase() === "EXPIRED"
            || String(resumeOrder.status || "").toUpperCase() === "CANCELLED"
        ) {
            return "Đơn hàng này đã hết hạn thanh toán hoặc đã bị hủy, bạn cần đặt lại từ giỏ hàng."
        }

        return "Đơn hàng này không còn ở trạng thái cho phép chọn lại phương thức thanh toán."
    }, [resumeOrder])

    const hasPreparedOrder = !!prepareOrderDisplayResponse
    const canPlaceOrder = hasPreparedOrder && !!prepareOrderDisplayResponse.canPlaceOrder && !quoteExpired
    const canRefreshPreparedOrder = hasPreparedOrder && quoteExpired && !!deliveryInfo?.userAddressId
    const isOrderActionPending = confirmMutation.isPending || isPreparing || isVoucherUpdating
    const isOrderActionDisabled =
        isOrderActionPending ||
        rateLimitCooldown > 0 ||
        (!canPlaceOrder && !canRefreshPreparedOrder)
    const shouldShowMobileBottomBar = hasPreparedOrder && !!prepareOrderDisplayResponse.canPlaceOrder
    const isBlockingPrepare = isPreparing && prepareContext !== "voucher"

    if (isResumePaymentMode) {
        if (isLoadingResumeOrder) {
            return (
                <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center gap-3 text-gray-400">
                    <Loader2 size={28} className="animate-spin text-blue-500" />
                    <span className="text-sm">Đang tải đơn chờ thanh toán...</span>
                </div>
            )
        }

        if (resumeOrder && canResumePendingPayment) {
            return (
                <PendingPaymentResumeView
                    order={resumeOrder}
                    paymentOptions={PAYMENT_OPTIONS}
                    paymentMethod={paymentMethod}
                    cancelledFromPayos={cancelledPaymentStatus === "CANCELLED"}
                    isSubmitting={isRetryingResumePayment}
                    onSelectPaymentMethod={setPaymentMethod}
                    onSubmit={handleResumePaymentConfirm}
                />
            )
        }

        return (
            <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Trang thanh toán
                    </p>
                    <h1 className="mt-3 text-2xl font-bold text-slate-900">
                        {resumeOrder?.code ? `#${resumeOrder.code}` : "Đơn hàng chờ thanh toán"}
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-slate-500">{resumeBlockedMessage}</p>

                    {resumeOrder && (
                        <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                            <div className="flex items-center justify-between gap-3">
                                <span>Ngày đặt</span>
                                <span className="font-medium text-slate-900">{formatDateTime(resumeOrder.createdAt)}</span>
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-3">
                                <span>Tổng thanh toán</span>
                                <span className="font-semibold text-slate-900">
                                    {formatMoney(Number(resumeOrder.finalAmount || 0))}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <Link
                            href={resumeOrder ? `/orders/${resumeOrder.id}` : "/orders/list"}
                            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            Xem đơn hàng
                        </Link>
                        <Link
                            href="/user/cart"
                            className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            Quay lại giỏ hàng
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    if ((isLoadingCart && cartItems.length === 0) || isRestoringCancelledPayos) {
        return (
            <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center gap-3 text-gray-400">
                <Loader2 size={28} className="animate-spin text-blue-500" />
                <span className="text-sm">
                    {isRestoringCancelledPayos ? "Đang khôi phục phiên thanh toán..." : "Đang tải..."}
                </span>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f5f5f5] pb-24 md:pb-10">

            {/* ── HEADER (Shopee-style) ── */}
            <div className="bg-white border-b-2 border-blue-500 shadow-sm">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="flex items-center gap-4 py-3.5">
                        {/* Logo + title */}
                        <Link href="/" className="text-blue-600 font-extrabold text-xl tracking-tight">
                            AgriShrimp
                        </Link>
                        <span className="w-px h-6 bg-blue-300" />
                        <span className="text-base font-semibold text-gray-700">Thanh Toán</span>
                        {/* Breadcrumb (right) */}
                        <nav className="ml-auto hidden sm:flex items-center gap-1 text-xs text-gray-400">
                            <Link href="/user/cart" className="hover:text-blue-600 transition-colors">Giỏ hàng</Link>
                            <span className="mx-1">›</span>
                            <span className="text-blue-600 font-medium">Thanh toán</span>
                        </nav>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-6xl py-5">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                    {/* ════ LEFT COLUMN ════ */}
                    <div className="lg:col-span-2 space-y-5">

                        {/* ── SECTION 1: ĐỊA CHỈ NHẬN HÀNG ── */}
                        <div className="bg-white border border-gray-200 overflow-hidden">
                            {/* Section title bar */}
                            <div className="flex items-center justify-between px-5 py-3 bg-blue-50/60 border-b border-blue-100">
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} className="text-blue-600 shrink-0" />
                                    <h2 className="text-xs font-bold text-blue-700 uppercase tracking-widest">
                                        Địa chỉ nhận hàng
                                    </h2>
                                </div>
                                {addressConfirmed && (
                                    <button
                                        onClick={() => setIsAddressModalOpen(true)}
                                        className="text-xs text-blue-600 font-semibold hover:underline"
                                    >
                                        Thay đổi
                                    </button>
                                )}
                            </div>

                            <div className="px-5 py-4">
                                {!addressConfirmed ? (
                                    <div className="space-y-2">
                                        {isLoadingAddresses ? (
                                            <div className="py-8 text-center text-gray-400 space-y-3">
                                                <Loader2 size={24} className="mx-auto animate-spin text-blue-400" />
                                                <p className="text-sm">Đang tải địa chỉ giao hàng...</p>
                                            </div>
                                        ) : addresses.length === 0 ? (
                                            <div className="py-8 text-center text-gray-400 space-y-3">
                                                <MapPin size={32} className="mx-auto text-gray-200" />
                                                <p className="text-sm">Bạn chưa có địa chỉ giao hàng nào.</p>
                                                <button
                                                    onClick={() => { setIsAddressModalOpen(true); setIsAddingNewAddress(true) }}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded"
                                                >
                                                    <Plus size={13} /> Thêm địa chỉ mới
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                {addresses.slice(0, 3).map((addr) => (
                                                    <div
                                                        key={addr.id}
                                                        onClick={() => handleAddressSelect(addr)}
                                                        className="flex items-start justify-between p-3.5 border border-gray-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50/20 transition-colors"
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-semibold text-sm text-gray-900">{addr.receiverName}</span>
                                                                <span className="text-gray-300">|</span>
                                                                <span className="text-sm text-gray-500">{addr.receiverPhone}</span>
                                                                {addr.isDefault && (
                                                                    <span className="text-[10px] text-blue-600 border border-blue-400 px-1.5 py-0.5 rounded-sm">
                                    Mặc định
                                  </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-400">{addr.addressDetail}</p>
                                                            {getSavedAddressLocationError(addr) && (
                                                                <p className="mt-1 text-[11px] font-medium text-red-500">
                                                                    {getSavedAddressLocationError(addr)}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                {addresses.length > 3 && (
                                                    <button
                                                        onClick={() => setIsAddressModalOpen(true)}
                                                        className="w-full py-1.5 text-xs text-blue-600 hover:underline"
                                                    >
                                                        Xem thêm {addresses.length - 3} địa chỉ khác
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => { setIsAddressModalOpen(true); setIsAddingNewAddress(true) }}
                                                    className="w-full py-2.5 border border-dashed border-gray-300 text-gray-500 text-sm hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-1.5 rounded"
                                                >
                                                    <Plus size={13} /> Thêm địa chỉ mới
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    /* Confirmed address row — Shopee style */
                                    <div className="flex items-start gap-3 pl-3 border-l-2 border-blue-500">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mb-0.5">
                                                <span className="font-bold text-sm text-gray-900">{deliveryInfo?.receiverName}</span>
                                                <span className="text-gray-300 text-xs">|</span>
                                                <span className="text-sm text-gray-500">{deliveryInfo?.receiverPhone}</span>
                                            </div>
                                            <p className="text-sm text-gray-500 leading-relaxed">{deliveryInfo?.address}</p>
                                            {addressLocationWarning && (
                                                <p className="mt-2 text-xs font-medium text-rose-600">{addressLocationWarning}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── SECTION 2: SẢN PHẨM & VẬN CHUYỂN ── */}
                        <div className="bg-white border border-gray-200 overflow-hidden">
                            <div className="flex items-center gap-2 px-5 py-3 bg-gray-50/70 border-b border-gray-100">
                                <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                                    Sản phẩm
                                </h2>
                            </div>

                            <div className="p-4">
                                {!addressConfirmed && (
                                    <div className="py-8 text-center space-y-2">
                                        <MapPin size={28} className="mx-auto text-gray-200" />
                                        <p className="text-sm text-gray-400">Chọn địa chỉ để xem chi tiết vận chuyển</p>
                                    </div>
                                )}

                                {addressConfirmed && isBlockingPrepare && (
                                    <div className="space-y-3 p-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <Loader2 size={14} className="animate-spin text-blue-500 shrink-0" />
                                            Đang tính phí vận chuyển...
                                        </div>
                                        {/* Skeleton */}
                                        <div className="border border-gray-100 animate-pulse space-y-3 p-4">
                                            <div className="h-3 bg-gray-100 rounded w-1/4" />
                                            <div className="flex gap-3">
                                                <div className="w-16 h-16 bg-gray-100 rounded shrink-0" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                                                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {addressConfirmed && !!prepareError && !isBlockingPrepare && (
                                    <div className="border border-red-100 bg-red-50 p-5 text-center">
                                        <p className="text-sm font-semibold text-red-700 mb-1">
                                            {prepareErrorDisplayMessage}
                                        </p>
                                        {prepareErrorHelpText && (
                                            <p className="text-xs text-red-400">
                                                {prepareErrorHelpText}
                                            </p>
                                        )}
                                        {prepareErrorInfo?.backendCode && (
                                            <p className="mt-2 text-[11px] font-medium text-red-500">
                                                Mã lỗi: {prepareErrorInfo.backendCode}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {false && addressConfirmed && !!prepareError && !isBlockingPrepare && (
                                    <div className="border border-red-100 bg-red-50 p-5 text-center">
                                        <p className="text-sm font-semibold text-red-700 mb-1">Khu vực hiện chưa có cửa hàng phục vụ</p>
                                        <p className="text-xs text-red-400">Vui lòng chọn địa chỉ khác.</p>
                                    </div>
                                )}

                                {addressConfirmed && addressLocationWarning && (
                                    <div className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                                        {addressLocationWarning}
                                    </div>
                                )}

                                {addressConfirmed && !isBlockingPrepare && prepareOrderDisplayResponse && (
                                    <div className="space-y-3">
                                        <div className="overflow-hidden border border-gray-200 bg-white">
                                            <div className="divide-y divide-gray-100">
                                                {checkoutDisplayItems.map((item) => (
                                                    <div key={item.productVariantId} className="flex gap-3 px-4 py-4">
                                                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                                                            <Image
                                                                src={resolveImageUrl(item.imageUrl, "/placeholder.png")}
                                                                alt={item.displayName}
                                                                fill
                                                                sizes="80px"
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="min-w-0">
                                                                    <p className="line-clamp-2 text-sm font-semibold text-gray-900">
                                                                        {item.displayName}
                                                                    </p>
                                                                    {item.displayVariant && (
                                                                        <p className="mt-1 text-xs text-gray-400">
                                                                            Phân loại: {item.displayVariant}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <p className="shrink-0 text-sm font-semibold text-blue-600">
                                                                    {formatMoney(item.subtotal)}
                                                                </p>
                                                            </div>
                                                            <div className="mt-3 flex items-center justify-between text-sm">
                                                                <span className="text-gray-500">{formatMoney(item.unitPrice)}</span>
                                                                <span className="text-gray-400">x{item.quantity}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {shippingPreview && (
                                                <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
                                                    <div className="text-gray-500">
                                                        {shippingPreview.label}:{" "}
                                                        <span className="font-semibold text-blue-600">
                                                            {shippingPreview.carrier}
                                                        </span>
                                                        {" · "}
                                                        {shippingPreview.isEstimate
                                                            ? `Tạm tính ${shippingPreview.estimatedDays}`
                                                            : `Dự kiến ${shippingPreview.estimatedDays}`}
                                                    </div>
                                                    <div className="text-right font-semibold text-gray-700">
                                                        {formatMoney(prepareOrderDisplayResponse.totalShippingFee)}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 bg-gray-50/70 px-4 py-3 text-sm text-gray-600">
                                                <span>{totalDisplayQuantity} sản phẩm</span>
                                                <span>Tổng tiền hàng: {formatMoney(prepareOrderDisplayResponse.totalSubtotal)}</span>
                                                <span>
                                                    {shippingPreview?.label ?? "Phí vận chuyển"}:{" "}
                                                    {formatMoney(prepareOrderDisplayResponse.totalShippingFee)}
                                                </span>
                                                <span className="font-bold text-gray-900">
                                                    Tổng: {formatMoney(displayTotalAmount)}
                                                </span>
                                            </div>
                                        </div>

                                        <CheckoutVoucherSelector
                                            availableVouchers={checkoutVoucherOptions}
                                            selectedVoucher={selectedVoucher}
                                            voucherInput={voucherInput}
                                            isLoading={isLoadingVouchers}
                                            isUpdating={isVoucherUpdating}
                                            pendingAction={
                                                voucherRequestState.status === "applying"
                                                    ? "apply"
                                                    : voucherRequestState.status === "clearing"
                                                        ? "clear"
                                                        : null
                                            }
                                            isOpen={isVoucherModalOpen}
                                            onOpen={() => setIsVoucherModalOpen(true)}
                                            onClose={() => setIsVoucherModalOpen(false)}
                                            onVoucherInputChange={setVoucherInput}
                                            onApplyByCode={applyVoucherByCode}
                                            onApplyVoucher={(voucher) => applyVoucher(voucher, { showToast: true })}
                                            onClearVoucher={() => applyVoucher(null, { showToast: true })}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── SECTION 3: PHƯƠNG THỨC THANH TOÁN ── */}
                        <div className="bg-white border border-gray-200 overflow-hidden">
                            <div className="flex items-center gap-2 px-5 py-3 bg-gray-50/70 border-b border-gray-100">
                                <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                                    Phương thức thanh toán
                                </h2>
                            </div>

                            <div className="p-4 space-y-2">
                                {PAYMENT_OPTIONS.map((pm) => (
                                    <label
                                        key={pm.val}
                                        onClick={() => setPaymentMethod(pm.val)}
                                        className={`flex items-center gap-4 p-4 border cursor-pointer transition-all ${
                                            paymentMethod === pm.val
                                                ? "border-blue-500 bg-blue-50/40 ring-1 ring-blue-400"
                                                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                                        }`}
                                    >
                                        {/* Radio dot */}
                                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                                            paymentMethod === pm.val ? "border-blue-500" : "border-gray-300"
                                        }`}>
                                            {paymentMethod === pm.val && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                        </div>
                                        {/* Icon */}
                                        <div className="shrink-0">{pm.icon}</div>
                                        {/* Text */}
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-gray-800">{pm.label}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{pm.sub}</p>
                                        </div>
                                        {paymentMethod === pm.val && (
                                            <CheckCircle2 size={16} className="text-blue-500 shrink-0" />
                                        )}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* ── SECTION 4: GHI CHÚ ── */}
                        <div className="bg-white border border-gray-200 overflow-hidden">
                            <div className="flex items-center gap-2 px-5 py-3 bg-gray-50/70 border-b border-gray-100">
                                <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                                    Ghi chú đơn hàng
                                </h2>
                            </div>
                            <div className="p-4">
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder="Giao giờ hành chính, gọi trước khi đến..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-400 resize-none bg-gray-50/30 placeholder:text-gray-300"
                />
                            </div>
                        </div>
                    </div>

                    {/* ════ RIGHT COLUMN ════ */}
                    <div className="lg:col-span-1 space-y-5 lg:sticky lg:top-4">
                        <div className="bg-white border border-gray-200 overflow-hidden">
                            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/70">
                                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                                    Tóm tắt đơn hàng
                                </h3>
                                {rateLimitCooldown > 0 && (
                                    <div className="mt-2 inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                                        Anti-spam đang bật · thử lại sau {rateLimitCooldown}s
                                    </div>
                                )}
                            </div>

                            <div className="p-5">
                                {prepareOrderDisplayResponse ? (
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500">Tiền hàng</span>
                                            <span className="text-gray-800 font-medium">{formatMoney(prepareOrderDisplayResponse.totalSubtotal)}</span>
                                        </div>
                                        {displayDiscountAmount > 0 && (
                                            <div className="flex justify-between items-center">
                                                <div className="pr-3">
                                                    <p className="text-gray-500">Giảm giá voucher</p>
                                                    {appliedVoucherDetails ? (
                                                        <p className="mt-0.5 text-xs text-gray-400">
                                                            {getVoucherLabel(appliedVoucherDetails)} ({appliedVoucherDetails.code})
                                                        </p>
                                                    ) : displayVoucherCode ? (
                                                        <p className="mt-0.5 text-xs text-gray-400">
                                                            {displayVoucherCode}
                                                        </p>
                                                    ) : null}
                                                    {isVoucherUpdating && selectedVoucher && optimisticDiscountAmount === null && (
                                                        <p className="mt-0.5 text-xs text-blue-500">
                                                            Đang cập nhật ưu đãi...
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="font-medium text-blue-600">-{formatMoney(displayDiscountAmount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-start gap-3">
                                            <div>
                                                <p className="text-gray-500">
                                                    {shippingPreview?.label ?? "Phí vận chuyển"}
                                                </p>
                                            </div>
                                            <span className="text-gray-800 font-medium">{formatMoney(prepareOrderDisplayResponse.totalShippingFee)}</span>
                                        </div>
                                        <div className="border-t border-dashed border-gray-200 pt-3">
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-gray-800">Tổng thanh toán</span>
                                                <span className="text-xl font-extrabold text-blue-600">
                          {formatMoney(displayTotalAmount)}
                        </span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 text-right mt-1">Đã bao gồm VAT (nếu có)</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 text-center py-4">
                                        Chọn địa chỉ để xem tổng tiền
                                    </p>
                                )}

                                <button
                                    onClick={quoteExpired ? retryPrepare : handleConfirm}
                                    disabled={isOrderActionDisabled}
                                    className="mt-5 w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold uppercase tracking-widest transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded"
                                >
                                    {confirmMutation.isPending ? (
                                        <><Loader2 size={15} className="animate-spin" /> Đang xử lý...</>
                                    ) : isPreparing || isVoucherUpdating ? (
                                        <><Loader2 size={15} className="animate-spin" /> Đang cập nhật...</>
                                    ) : rateLimitCooldown > 0 ? (
                                        `Vui lòng chờ ${rateLimitCooldown}s`
                                    ) : quoteExpired ? (
                                        "Cập nhật đơn hàng"
                                    ) : !canPlaceOrder ? (
                                        "Chọn địa chỉ giao hàng"
                                    ) : (
                                        "Đặt hàng"
                                    )}
                                </button>

                                {rateLimitCooldown > 0 && (
                                    <p className="mt-2 text-[11px] text-amber-600 text-center">
                                        Hệ thống đang giới hạn tần suất để chống spam. Thử lại sau {rateLimitCooldown}s.
                                    </p>
                                )}
                                {isVoucherUpdating && (
                                    <p className="mt-2 text-[11px] text-blue-500 text-center">
                                        Đang cập nhật voucher cho báo giá mới nhất.
                                    </p>
                                )}

                                <p className="mt-3 text-[10px] text-gray-400 text-center leading-relaxed">
                                    Nhấn Đặt hàng đồng nghĩa bạn đồng ý với{" "}
                                    <span className="underline cursor-pointer">Điều khoản & Chính sách</span> của AgriShrimp
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MOBILE BOTTOM BAR ── */}
            {shouldShowMobileBottomBar && prepareOrderDisplayResponse && (
                <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-30 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1">
                            <p className="text-[10px] text-gray-400">Tổng thanh toán</p>
                            <p className="text-base font-bold text-blue-600">
                                {formatMoney(displayTotalAmount)}
                            </p>
                        </div>
                        <button
                            onClick={quoteExpired ? retryPrepare : handleConfirm}
                            disabled={isOrderActionDisabled}
                            className="px-7 py-3 bg-blue-600 text-white text-sm font-bold rounded uppercase tracking-wide transition-colors disabled:opacity-50"
                        >
                            {confirmMutation.isPending
                                ? <Loader2 size={14} className="animate-spin" />
                                : isPreparing || isVoucherUpdating
                                    ? <Loader2 size={14} className="animate-spin" />
                                : rateLimitCooldown > 0
                                    ? `Chờ ${rateLimitCooldown}s`
                                : quoteExpired
                                    ? "Cập nhật"
                                : "Đặt hàng"
                            }
                        </button>
                    </div>
                </div>
            )}

            {/* ── MODAL: ĐỊA CHỈ ── */}
            {isAddressModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setIsAddressModalOpen(false)} />
                    <div className={`relative bg-white w-full shadow-2xl rounded-t-2xl sm:rounded-xl flex flex-col ${
                        isAddingNewAddress ? "max-w-3xl max-h-[88vh]" : "max-w-lg max-h-[80vh]"
                    }`}>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                            <div className="flex items-center gap-2">
                                {isAddingNewAddress && (
                                    <button onClick={() => setIsAddingNewAddress(false)} className="text-gray-400 hover:text-gray-600">
                                        <ChevronLeft size={20} />
                                    </button>
                                )}
                                <h3 className="font-semibold text-gray-800 text-sm">
                                    {isAddingNewAddress ? "Thêm địa chỉ mới" : "Địa chỉ của tôi"}
                                </h3>
                            </div>
                            <button onClick={() => setIsAddressModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <X size={18} />
                            </button>
                        </div>

                        <div className={isAddingNewAddress ? "overflow-y-auto" : "flex-1 overflow-y-auto"}>
                            {!isAddingNewAddress ? (
                                <div className="p-4 space-y-2">
                                    {isLoadingAddresses ? (
                                        <div className="py-8 text-center text-gray-400">
                                            <Loader2 size={22} className="mx-auto animate-spin text-blue-400" />
                                            <p className="mt-3 text-sm">Đang tải địa chỉ...</p>
                                        </div>
                                    ) : addresses.length === 0 && (
                                        <p className="text-sm text-gray-400 text-center py-8">Chưa có địa chỉ nào được lưu</p>
                                    )}
                                    {addresses.map((addr) => (
                                        <div
                                            key={addr.id}
                                            onClick={() => handleAddressSelect(addr)}
                                            className={`p-4 border cursor-pointer transition-all ${
                                                deliveryInfo?.address === addr.addressDetail
                                                    ? "border-blue-500 bg-blue-50/30 ring-1 ring-blue-400"
                                                    : "border-gray-200 hover:bg-gray-50"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-sm text-gray-900">{addr.receiverName}</span>
                                                        <span className="text-gray-300 text-xs">|</span>
                                                        <span className="text-sm text-gray-500">{addr.receiverPhone}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 leading-relaxed">{addr.addressDetail}</p>
                                                    {getSavedAddressLocationError(addr) && (
                                                        <p className="mt-1 text-[11px] font-medium text-red-500">
                                                            {getSavedAddressLocationError(addr)}
                                                        </p>
                                                    )}
                                                    {addr.isDefault && (
                                                        <span className="mt-1.5 inline-block text-[10px] text-blue-600 border border-blue-400 px-1.5 py-0.5 rounded-sm">
                              Mặc định
                            </span>
                                                    )}
                                                </div>
                                                {deliveryInfo?.address === addr.addressDetail && (
                                                    <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setIsAddingNewAddress(true)}
                                        className="w-full py-3 border border-dashed border-gray-300 text-gray-500 text-sm hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-1.5 rounded-lg mt-1"
                                    >
                                        <Plus size={14} /> Thêm địa chỉ mới
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <AddressForm
                                        title=""
                                        onSubmit={handleAddNewAddress}
                                        onCancel={() => setIsAddingNewAddress(false)}
                                        isSubmitting={isSubmittingAddress}
                                        compact
                                    />
                                </div>
                            )}
                        </div>

                        {!isAddingNewAddress && (
                            <div className="px-4 py-3 border-t border-gray-100 shrink-0">
                                <button
                                    onClick={() => setIsAddressModalOpen(false)}
                                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded transition-colors"
                                >
                                    Đóng
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── MODAL: TOKEN EXPIRED ── */}
            {showTokenExpiredModal && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowTokenExpiredModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full z-10">
                        <button onClick={() => setShowTokenExpiredModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X size={16} />
                        </button>
                        <div className="text-center">
                            <p className="text-3xl mb-3">⏰</p>
                            <h3 className="font-bold text-gray-900 mb-2">Phiên đặt hàng hết hạn</h3>
                            <p className="text-sm text-gray-500 mb-5">
                                Thông tin đơn hàng đã hết hạn sau 30 phút. Vui lòng thực hiện lại.
                            </p>
                            <button onClick={retryPrepare} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-colors">
                                Thực hiện lại
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}


