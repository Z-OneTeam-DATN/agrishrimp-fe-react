"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, Loader2, X, Plus, MapPin, CheckCircle2, Banknote, Smartphone } from "lucide-react"
import { toast } from "sonner"
import { cartService } from "@/app/services/cart.service"
import { addressService } from "@/app/services/address.service"
import { voucherService, type UserVoucher } from "@/app/services/voucher.service"
import { useCartStore } from "@/stores/useCartStore"
import { useAuthStore } from "@/stores/useAuthStore"
import { useLocationStore } from "@/stores/locationStore"
import { useUserLocation } from "@/hooks/useUserLocation"
import { usePrepareOrder } from "@/hooks/usePrepareOrder"
import { useConfirmOrder } from "@/hooks/useConfirmOrder"
import AddressForm from "@/components/profile/AddressForm"
import CheckoutVoucherSelector from "@/components/order/CheckoutVoucherSelector"
import { getFriendlyError } from "@/app/utils/apiError"
import type { DeliveryInfo, CartItem, PaymentMethod } from "@/app/types/order.types"
import { resolveImageUrl } from "@/lib/resolveImageUrl"

const formatMoney = (amount: number) => amount.toLocaleString("vi-VN") + "đ"

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
    isDefault: boolean
    addressType: string
}

type Voucher = UserVoucher

const normalizeNumber = (value: unknown) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

const normalizeWardCode = (value: unknown) => {
    const normalized = String(value ?? "").trim()
    return normalized && normalized !== "undefined" && normalized !== "null" ? normalized : ""
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
        receiverName: String(raw.receiverName ?? "").trim(),
        receiverPhone: String(raw.receiverPhone ?? "").trim(),
        isDefault: Boolean(raw.isDefault),
    }
}

const getSavedAddressLocationError = (addr: SavedAddress) => {
    if (!addr.districtId || !addr.wardCode) {
        return "Địa chỉ này đang thiếu dữ liệu vị trí, hệ thống sẽ dùng phí vận chuyển ước tính nếu cần."
    }

    return null
}

export default function CheckoutPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const queryVoucherCode = searchParams.get("voucher")?.trim().toUpperCase() || ""
    const selectedItemsParam = searchParams.get("items") || ""
    const selectedItemIds = useMemo(
        () => selectedItemsParam
            .split(",")
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value) && value > 0),
        [selectedItemsParam]
    )

    const [cartItems, setCartItems] = useState<CartItem[]>([])
    const [isLoadingCart, setIsLoadingCart] = useState(true)
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD")
    const [note, setNote] = useState("")
    const [addressConfirmed, setAddressConfirmed] = useState(false)

    const [addresses, setAddresses] = useState<SavedAddress[]>([])
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
    const [isAddingNewAddress, setIsAddingNewAddress] = useState(false)
    const [isSubmittingAddress, setIsSubmittingAddress] = useState(false)
    const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([])
    const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false)
    const [voucherInput, setVoucherInput] = useState(queryVoucherCode)
    const [isLoadingVouchers, setIsLoadingVouchers] = useState(false)
    const [hasLoadedVouchers, setHasLoadedVouchers] = useState(false)

    const [showTokenExpiredModal, setShowTokenExpiredModal] = useState(false)
    const [rateLimitCooldown, setRateLimitCooldown] = useState(0)
    const [addressLocationWarning, setAddressLocationWarning] = useState<string | null>(null)
    const [quoteNowMs, setQuoteNowMs] = useState(() => Date.now())
    const confirmAttemptKeyRef = useRef<string | null>(null)

    const {
        deliveryInfo,
        setDeliveryInfo,
        prepareOrderResponse,
        prepareToken,
        setPrepareResponse,
        clearPrepareResponse,
    } = useCartStore()
    const { userLocation } = useLocationStore()
    const { isAuthenticated, isLoadingAuth } = useAuthStore()

    useUserLocation({ showIpFallbackToast: false })

    const prepareMutation = usePrepareOrder({
        onRateLimited: (seconds) => setRateLimitCooldown((prev) => Math.max(prev, seconds)),
    })
    const confirmMutation = useConfirmOrder({
        onTokenExpired: () => setShowTokenExpiredModal(true),
        onRateLimited: (seconds) => setRateLimitCooldown((prev) => Math.max(prev, seconds)),
    })

    useEffect(() => {
        if (rateLimitCooldown <= 0) return
        const timer = setInterval(() => {
            setRateLimitCooldown((prev) => (prev <= 1 ? 0 : prev - 1))
        }, 1000)
        return () => clearInterval(timer)
    }, [rateLimitCooldown])

    useEffect(() => {
        if (!prepareOrderResponse?.expiresAt) return
        setQuoteNowMs(Date.now())
        const timer = setInterval(() => {
            setQuoteNowMs(Date.now())
        }, 1000)
        return () => clearInterval(timer)
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

    const activeVoucherCode = selectedVoucher?.code?.trim().toUpperCase() || undefined

    const syncVoucherInUrl = useCallback((nextVoucherCode?: string | null) => {
        const params = new URLSearchParams(searchParams.toString())

        if (nextVoucherCode) {
            params.set("voucher", nextVoucherCode)
        } else {
            params.delete("voucher")
        }

        const query = params.toString()
        router.replace(query ? `/checkout?${query}` : "/checkout", { scroll: false })
    }, [router, searchParams])

    const triggerPrepare = useCallback((
        userAddressId: number,
        currentCart: CartItem[] = cartItems,
        nextVoucherCode?: string
    ) => {
        prepareMutation.mutate({
            userAddressId,
            cart: currentCart.map((item) => ({
                productVariantId: item.productVariantId,
                quantity: item.quantity,
            })),
            ...(nextVoucherCode ? { voucherCode: nextVoucherCode } : {}),
            ...(userLocation && { userLat: userLocation.lat, userLng: userLocation.lng }),
        })
    }, [cartItems, prepareMutation, userLocation])

    const fetchAvailableVouchers = useCallback(async (orderSubtotal: number) => {
        setIsLoadingVouchers(true)
        try {
            const vouchers = await voucherService.getAvailableForMe(orderSubtotal)
            setAvailableVouchers(Array.isArray(vouchers) ? vouchers : [])
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
        const nextVoucherCode = voucher?.code?.trim().toUpperCase() || undefined

        setSelectedVoucher(voucher)
        setVoucherInput(nextVoucherCode || "")
        syncVoucherInUrl(nextVoucherCode)

        if (deliveryInfo?.userAddressId) {
            prepareMutation.reset()
            triggerPrepare(deliveryInfo.userAddressId, cartItems, nextVoucherCode)
        }

        if (options?.closeModal) {
            setIsVoucherModalOpen(false)
        }

        if (options?.showToast) {
            toast.success(nextVoucherCode ? "Đã áp dụng voucher." : "Đã bỏ chọn voucher.")
        }
    }, [cartItems, deliveryInfo?.userAddressId, prepareMutation, syncVoucherInUrl, triggerPrepare])

    const applyVoucherByCode = useCallback(() => {
        const normalizedCode = voucherInput.trim().toUpperCase()

        if (!normalizedCode) {
            applyVoucher(null, { closeModal: true, showToast: true })
            return
        }

        const foundVoucher = availableVouchers.find(
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
    }, [applyVoucher, availableVouchers, voucherInput])

    useEffect(() => {
        if (cartSubtotal <= 0) {
            setAvailableVouchers([])
            setHasLoadedVouchers(true)
            return
        }

        void fetchAvailableVouchers(cartSubtotal)
    }, [cartSubtotal, fetchAvailableVouchers])

    useEffect(() => {
        if (!selectedVoucher) return

        const refreshedVoucher = availableVouchers.find(
            (voucher) => voucher.code.trim().toUpperCase() === selectedVoucher.code.trim().toUpperCase()
        )

        if (!refreshedVoucher || !refreshedVoucher.canApply) {
            applyVoucher(null)
            return
        }

        if (refreshedVoucher !== selectedVoucher) {
            setSelectedVoucher(refreshedVoucher)
        }
    }, [applyVoucher, availableVouchers, selectedVoucher])

    useEffect(() => {
        if (!hasLoadedVouchers || !queryVoucherCode) return

        const foundVoucher = availableVouchers.find(
            (voucher) => voucher.code.trim().toUpperCase() === queryVoucherCode
        )

        if (!foundVoucher || !foundVoucher.canApply) {
            if (!selectedVoucher) {
                syncVoucherInUrl(null)
            }
            return
        }

        if (selectedVoucher?.code.trim().toUpperCase() === foundVoucher.code.trim().toUpperCase()) {
            return
        }

        applyVoucher(foundVoucher)
    }, [applyVoucher, availableVouchers, hasLoadedVouchers, queryVoucherCode, selectedVoucher, syncVoucherInUrl])

    // 🐛 FIX LỖI 400: Thêm tham số currentCart = cartItems
    const handleAddressSelect = (addr: SavedAddress, currentCart = cartItems) => {
        prepareMutation.reset()
        setAddressLocationWarning(null)

        const info: DeliveryInfo = {
            address: addr.addressDetail,
            districtId: addr.districtId ?? 0,
            wardCode: addr.wardCode,
            districtName: "",
            wardName: "",
            receiverName: addr.receiverName,
            receiverPhone: addr.receiverPhone,
            userAddressId: addr.id,
        }
        setDeliveryInfo(info)
        setAddressConfirmed(true)
        setIsAddressModalOpen(false)

        const locationError = getSavedAddressLocationError(addr)
        if (locationError) {
            clearPrepareResponse()
            setAddressLocationWarning(locationError)
        }

        if (addr.id) {
            prepareMutation.mutate({
                userAddressId: addr.id,
                // 🐛 FIX LỖI 400: Bổ sung mảng cart vào payload gửi lên backend
                cart: currentCart.map(item => ({
                    productVariantId: item.productVariantId,
                    quantity: item.quantity
                })),
                ...(activeVoucherCode && { voucherCode: activeVoucherCode }),
                ...(userLocation && { userLat: userLocation.lat, userLng: userLocation.lng }),
            })
        }
    }

    useEffect(() => {
        if (isLoadingAuth) return
        if (!isAuthenticated) {
            toast.error("Vui lòng đăng nhập để thanh toán!")
            router.push("/login?redirect=/checkout")
            return
        }
        const loadData = async () => {
            try {
                setIsLoadingCart(true)
                const [cartData, addressData] = await Promise.all([
                    cartService.getMyCart(),
                    addressService.getAll().catch(() => []),
                ])
                if (!cartData || cartData.length === 0) {
                    toast.warning("Giỏ hàng trống, vui lòng thêm sản phẩm!")
                    router.push("/user/cart")
                    return
                }
                const mappedItems: CartItem[] = (cartData as CheckoutCartApiItem[]).map((item) => ({
                    productVariantId: item.variantId,
                    quantity: item.quantity,
                    productName: item.name,
                    variantName: item.variant,
                    unitPrice: item.price,
                    imageUrl: item.image,
                    cartItemId: item.id, // Thêm để reference
                }))
                // Fix: Match theo item.id (cartItemId) từ URL, KHÔNG phải variantId
                const filteredItems = selectedItemIds.length > 0
                    ? mappedItems.filter((item) => item.cartItemId && selectedItemIds.includes(item.cartItemId))
                    : mappedItems

                if (selectedItemIds.length > 0 && filteredItems.length === 0) {
                    toast.error("Không tìm thấy sản phẩm đã chọn trong giỏ hàng!")
                    router.push("/user/cart")
                    return
                }

                setCartItems(filteredItems)
                const normalizedAddresses = Array.isArray(addressData)
                    ? addressData
                        .map((item) => normalizeSavedAddress(item as SavedAddressApi))
                        .filter((item): item is SavedAddress => item !== null)
                    : []
                setAddresses(normalizedAddresses)
                if (normalizedAddresses.length > 0) {
                    const defaultAddr = normalizedAddresses.find((a) => a.isDefault) || normalizedAddresses[0]
                    // 🐛 FIX LỖI 400: Truyền thẳng items vào để tránh state cartItems chưa kịp cập nhật
                    handleAddressSelect(defaultAddr, filteredItems)
                }
            } catch {
                toast.error("Không thể tải thông tin thanh toán!")
            } finally {
                setIsLoadingCart(false)
            }
        }
        loadData()
    }, [router, isAuthenticated, isLoadingAuth, selectedItemsParam])

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
            estimatedDays: firstSubOrder?.estimatedDays?.trim() || "2-3 ngày",
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

    const appliedVoucherDetails = useMemo(() => {
        const appliedVoucherCode = prepareOrderDisplayResponse?.voucherCode?.trim().toUpperCase()
        if (!appliedVoucherCode) return null

        if (selectedVoucher?.code.trim().toUpperCase() === appliedVoucherCode) {
            return selectedVoucher
        }

        return availableVouchers.find(
            (voucher) => voucher.code.trim().toUpperCase() === appliedVoucherCode
        ) ?? null
    }, [availableVouchers, prepareOrderDisplayResponse?.voucherCode, selectedVoucher])

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
        prepareMutation.mutate({
            userAddressId: deliveryInfo.userAddressId,
            // 🐛 FIX LỖI 400: Bổ sung mảng cart vào payload gửi lên backend
            cart: cartItems.map(item => ({
                productVariantId: item.productVariantId,
                quantity: item.quantity
            })),
            ...(activeVoucherCode && { voucherCode: activeVoucherCode }),
            ...(userLocation && { userLat: userLocation.lat, userLng: userLocation.lng }),
        })
    }

    const hasPreparedOrder = !!prepareOrderDisplayResponse
    const canPlaceOrder = hasPreparedOrder && !!prepareOrderDisplayResponse.canPlaceOrder && !quoteExpired
    const canRefreshPreparedOrder = hasPreparedOrder && quoteExpired && !!deliveryInfo?.userAddressId
    const isOrderActionPending = confirmMutation.isPending || prepareMutation.isPending
    const isOrderActionDisabled =
        isOrderActionPending ||
        rateLimitCooldown > 0 ||
        (!canPlaceOrder && !canRefreshPreparedOrder)
    const shouldShowMobileBottomBar = hasPreparedOrder && !!prepareOrderDisplayResponse.canPlaceOrder

    if (isLoadingCart) {
        return (
            <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center gap-3 text-gray-400">
                <Loader2 size={28} className="animate-spin text-blue-500" />
                <span className="text-sm">Đang tải...</span>
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

                    {/* ════ LEFT COLUMN ════ */}
                    <div className="lg:col-span-2 space-y-3">

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
                                        {addresses.length === 0 ? (
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
                                                        className="flex items-start justify-between p-3.5 border border-gray-200 rounded cursor-pointer hover:border-blue-400 hover:bg-blue-50/20 transition-colors"
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
                                                <p className="mt-2 text-xs font-medium text-amber-600">{addressLocationWarning}</p>
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

                                {addressConfirmed && prepareMutation.isPending && (
                                    <div className="space-y-3 p-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <Loader2 size={14} className="animate-spin text-blue-500 shrink-0" />
                                            Đang tính phí vận chuyển...
                                        </div>
                                        {/* Skeleton */}
                                        <div className="border border-gray-100 rounded animate-pulse space-y-3 p-4">
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

                                {addressConfirmed && prepareMutation.isError && !prepareMutation.isPending && (
                                    <div className="border border-red-100 bg-red-50 rounded-lg p-5 text-center">
                                        <p className="text-sm font-semibold text-red-700 mb-1">{getFriendlyError(prepareMutation.error)}</p>
                                        <p className="text-xs text-red-400">Vui lòng kiểm tra lại thông tin giao hàng hoặc thử lại sau.</p>
                                    </div>
                                )}

                                {false && addressConfirmed && prepareMutation.isError && !prepareMutation.isPending && (
                                    <div className="border border-red-100 bg-red-50 rounded-lg p-5 text-center">
                                        <p className="text-sm font-semibold text-red-700 mb-1">Khu vực hiện chưa có cửa hàng phục vụ</p>
                                        <p className="text-xs text-red-400">Vui lòng chọn địa chỉ khác.</p>
                                    </div>
                                )}

                                {addressConfirmed && addressLocationWarning && (
                                    <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 text-sm text-amber-700">
                                        {addressLocationWarning}
                                    </div>
                                )}

                                {addressConfirmed && !prepareMutation.isPending && prepareOrderDisplayResponse && (
                                    <div className="space-y-3">
                                        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
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
                                                        Đơn vị vận chuyển:{" "}
                                                        <span className="font-semibold text-blue-600">
                                                            {shippingPreview.carrier}
                                                        </span>
                                                        {" · "}
                                                        Dự kiến {shippingPreview.estimatedDays}
                                                    </div>
                                                    <div className="text-right font-semibold text-gray-700">
                                                        {formatMoney(prepareOrderDisplayResponse.totalShippingFee)}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 bg-gray-50/70 px-4 py-3 text-sm text-gray-600">
                                                <span>{totalDisplayQuantity} sản phẩm</span>
                                                <span>Tổng tiền hàng: {formatMoney(prepareOrderDisplayResponse.totalSubtotal)}</span>
                                                <span>Phí vận chuyển: {formatMoney(prepareOrderDisplayResponse.totalShippingFee)}</span>
                                                <span className="font-bold text-gray-900">
                                                    Tổng: {formatMoney(prepareOrderDisplayResponse.totalAmount)}
                                                </span>
                                            </div>
                                        </div>

                                        <CheckoutVoucherSelector
                                            availableVouchers={availableVouchers}
                                            selectedVoucher={selectedVoucher}
                                            voucherInput={voucherInput}
                                            isLoading={isLoadingVouchers}
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
                                        className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
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
                    <div className="lg:col-span-1 space-y-3 lg:sticky lg:top-4">
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
                                        {prepareOrderDisplayResponse.discountAmount > 0 && (
                                            <div className="flex justify-between items-center">
                                                <div className="pr-3">
                                                    <p className="text-gray-500">Giảm giá voucher</p>
                                                    {appliedVoucherDetails ? (
                                                        <p className="mt-0.5 text-xs text-gray-400">
                                                            {getVoucherLabel(appliedVoucherDetails)} ({appliedVoucherDetails.code})
                                                        </p>
                                                    ) : prepareOrderDisplayResponse.voucherCode ? (
                                                        <p className="mt-0.5 text-xs text-gray-400">
                                                            {prepareOrderDisplayResponse.voucherCode}
                                                        </p>
                                                    ) : null}
                                                </div>
                                                <span className="font-medium text-blue-600">-{formatMoney(prepareOrderDisplayResponse.discountAmount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500">Phí vận chuyển</span>
                                            <span className="text-gray-800 font-medium">{formatMoney(prepareOrderDisplayResponse.totalShippingFee)}</span>
                                        </div>
                                        <div className="border-t border-dashed border-gray-200 pt-3">
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-gray-800">Tổng thanh toán</span>
                                                <span className="text-xl font-extrabold text-blue-600">
                          {formatMoney(prepareOrderDisplayResponse.totalAmount)}
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
                                    ) : prepareMutation.isPending ? (
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
                                {formatMoney(prepareOrderDisplayResponse.totalAmount)}
                            </p>
                        </div>
                        <button
                            onClick={quoteExpired ? retryPrepare : handleConfirm}
                            disabled={isOrderActionDisabled}
                            className="px-7 py-3 bg-blue-600 text-white text-sm font-bold rounded uppercase tracking-wide transition-colors disabled:opacity-50"
                        >
                            {confirmMutation.isPending
                                ? <Loader2 size={14} className="animate-spin" />
                                : prepareMutation.isPending
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
                        isAddingNewAddress ? "max-w-2xl h-[90vh]" : "max-w-lg max-h-[80vh]"
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

                        <div className="flex-1 overflow-y-auto">
                            {!isAddingNewAddress ? (
                                <div className="p-4 space-y-2">
                                    {addresses.length === 0 && (
                                        <p className="text-sm text-gray-400 text-center py-8">Chưa có địa chỉ nào được lưu</p>
                                    )}
                                    {addresses.map((addr) => (
                                        <div
                                            key={addr.id}
                                            onClick={() => handleAddressSelect(addr)}
                                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
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
                                <div className="p-4">
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


