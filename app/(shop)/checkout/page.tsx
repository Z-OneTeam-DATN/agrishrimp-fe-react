"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, Loader2, X, Plus, MapPin, CheckCircle2, Banknote, Smartphone } from "lucide-react"
import { toast } from "sonner"
import { cartService } from "@/app/services/cart.service"
import { addressService } from "@/app/services/address.service"
import { useCartStore } from "@/stores/useCartStore"
import { useAuthStore } from "@/stores/useAuthStore"
import { useLocationStore } from "@/stores/locationStore"
import { useUserLocation } from "@/hooks/useUserLocation"
import { usePrepareOrder } from "@/hooks/usePrepareOrder"
import { useConfirmOrder } from "@/hooks/useConfirmOrder"
import AddressForm from "@/components/profile/AddressForm"
import { PrepareOrderSummary } from "@/components/order/PrepareOrderSummary"
import { OutOfStockWarning } from "@/components/order/OutOfStockWarning"
import type { DeliveryInfo, CartItem, PaymentMethod } from "@/app/types/order.types"

const formatMoney = (amount: number) => amount.toLocaleString("vi-VN") + "đ"

const PAYMENT_OPTIONS: { val: PaymentMethod; label: string; sub: string; icon: React.ReactNode }[] = [
    {
        val: "COD",
        label: "Thanh toán khi nhận hàng (COD)",
        sub: "Trả tiền mặt trực tiếp cho shipper",
        icon: <Banknote size={20} className="text-emerald-500" />,
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
    districtId: number
    wardId: string | number
    receiverName: string
    receiverPhone: string
    isDefault?: boolean
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

export default function CheckoutPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const voucherCode = searchParams.get("voucher")?.trim().toUpperCase() || undefined
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

    const [showConflictModal, setShowConflictModal] = useState(false)
    const [showTokenExpiredModal, setShowTokenExpiredModal] = useState(false)
    const [rateLimitCooldown, setRateLimitCooldown] = useState(0)

    const { deliveryInfo, setDeliveryInfo, prepareOrderResponse, prepareToken } = useCartStore()
    const { userLocation } = useLocationStore()
    const { isAuthenticated, isLoadingAuth } = useAuthStore()

    useUserLocation()

    const prepareMutation = usePrepareOrder({
        onRateLimited: (seconds) => setRateLimitCooldown((prev) => Math.max(prev, seconds)),
    })
    const confirmMutation = useConfirmOrder({
        onConflict: () => setShowConflictModal(true),
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

    // 🐛 FIX LỖI 400: Thêm tham số currentCart = cartItems
    const handleAddressSelect = (addr: SavedAddress, currentCart = cartItems) => {
        const info: DeliveryInfo = {
            address: addr.addressDetail,
            districtId: addr.districtId,
            wardCode: String(addr.wardId),
            districtName: "",
            wardName: "",
            receiverName: addr.receiverName,
            receiverPhone: addr.receiverPhone,
            userAddressId: addr.id,
        }
        setDeliveryInfo(info)
        setAddressConfirmed(true)
        setIsAddressModalOpen(false)

        if (addr.id) {
            prepareMutation.mutate({
                userAddressId: addr.id,
                // 🐛 FIX LỖI 400: Bổ sung mảng cart vào payload gửi lên backend
                cart: currentCart.map(item => ({
                    productVariantId: item.productVariantId,
                    quantity: item.quantity
                })),
                ...(voucherCode && { voucherCode }),
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
                const normalizedAddresses = addressData as SavedAddress[]
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
            const updatedAddresses = await addressService.getAll() as SavedAddress[]
            setAddresses(updatedAddresses)
            const createdAddress = newAddr as Partial<SavedAddress>
            const selectedAddress = createdAddress.id
                ? createdAddress as SavedAddress
                : updatedAddresses.find((a) => a.addressDetail === payload.addressDetail)
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

    const imageByVariantId = Object.fromEntries(
        cartItems.map((item) => [item.productVariantId, item.imageUrl as string | undefined])
    ) as Record<number, string | undefined>

    const handleConfirm = () => {
        if (rateLimitCooldown > 0) {
            return // Chỉ disable button, không show toast
        }
        if (!prepareToken) { setShowTokenExpiredModal(true); return }
        confirmMutation.mutate({ prepareToken, paymentMethod, note: note.trim() || undefined })
    }

    const retryPrepare = () => {
        if (rateLimitCooldown > 0) {
            return // Chỉ disable button, không show toast
        }
        setShowConflictModal(false)
        setShowTokenExpiredModal(false)
        if (!deliveryInfo?.userAddressId) return
        prepareMutation.mutate({
            userAddressId: deliveryInfo.userAddressId,
            // 🐛 FIX LỖI 400: Bổ sung mảng cart vào payload gửi lên backend
            cart: cartItems.map(item => ({
                productVariantId: item.productVariantId,
                quantity: item.quantity
            })),
            ...(voucherCode && { voucherCode }),
            ...(userLocation && { userLat: userLocation.lat, userLng: userLocation.lng }),
        })
    }

    const canPlaceOrder =
        !!prepareOrderResponse &&
        (prepareOrderResponse.canFulfill || prepareOrderResponse.subOrders.length > 0)

    if (isLoadingCart) {
        return (
            <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center gap-3 text-gray-400">
                <Loader2 size={28} className="animate-spin text-teal-500" />
                <span className="text-sm">Đang tải...</span>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f5f5f5] pb-24 md:pb-10">

            {/* ── HEADER (Shopee-style) ── */}
            <div className="bg-white border-b-2 border-teal-500 shadow-sm">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="flex items-center gap-4 py-3.5">
                        {/* Logo + title */}
                        <Link href="/" className="text-teal-600 font-extrabold text-xl tracking-tight">
                            AgriShrimp
                        </Link>
                        <span className="w-px h-6 bg-teal-300" />
                        <span className="text-base font-semibold text-gray-700">Thanh Toán</span>
                        {/* Breadcrumb (right) */}
                        <nav className="ml-auto hidden sm:flex items-center gap-1 text-xs text-gray-400">
                            <Link href="/user/cart" className="hover:text-teal-600 transition-colors">Giỏ hàng</Link>
                            <span className="mx-1">›</span>
                            <span className="text-teal-600 font-medium">Thanh toán</span>
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
                            <div className="flex items-center justify-between px-5 py-3 bg-teal-50/60 border-b border-teal-100">
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} className="text-teal-600 shrink-0" />
                                    <h2 className="text-xs font-bold text-teal-700 uppercase tracking-widest">
                                        Địa chỉ nhận hàng
                                    </h2>
                                </div>
                                {addressConfirmed && (
                                    <button
                                        onClick={() => setIsAddressModalOpen(true)}
                                        className="text-xs text-teal-600 font-semibold hover:underline"
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
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded"
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
                                                        className="flex items-start justify-between p-3.5 border border-gray-200 rounded cursor-pointer hover:border-teal-400 hover:bg-teal-50/20 transition-colors"
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-semibold text-sm text-gray-900">{addr.receiverName}</span>
                                                                <span className="text-gray-300">|</span>
                                                                <span className="text-sm text-gray-500">{addr.receiverPhone}</span>
                                                                {addr.isDefault && (
                                                                    <span className="text-[10px] text-teal-600 border border-teal-400 px-1.5 py-0.5 rounded-sm">
                                    Mặc định
                                  </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-400">{addr.addressDetail}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {addresses.length > 3 && (
                                                    <button
                                                        onClick={() => setIsAddressModalOpen(true)}
                                                        className="w-full py-1.5 text-xs text-teal-600 hover:underline"
                                                    >
                                                        Xem thêm {addresses.length - 3} địa chỉ khác
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => { setIsAddressModalOpen(true); setIsAddingNewAddress(true) }}
                                                    className="w-full py-2.5 border border-dashed border-gray-300 text-gray-500 text-sm hover:border-teal-500 hover:text-teal-600 transition-colors flex items-center justify-center gap-1.5 rounded"
                                                >
                                                    <Plus size={13} /> Thêm địa chỉ mới
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    /* Confirmed address row — Shopee style */
                                    <div className="flex items-start gap-3 pl-3 border-l-2 border-teal-500">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mb-0.5">
                                                <span className="font-bold text-sm text-gray-900">{deliveryInfo?.receiverName}</span>
                                                <span className="text-gray-300 text-xs">|</span>
                                                <span className="text-sm text-gray-500">{deliveryInfo?.receiverPhone}</span>
                                            </div>
                                            <p className="text-sm text-gray-500 leading-relaxed">{deliveryInfo?.address}</p>
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
                                            <Loader2 size={14} className="animate-spin text-teal-500 shrink-0" />
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
                                        <p className="text-sm font-semibold text-red-700 mb-1">Khu vực hiện chưa có cửa hàng phục vụ</p>
                                        <p className="text-xs text-red-400">Vui lòng chọn địa chỉ khác.</p>
                                    </div>
                                )}

                                {addressConfirmed && !prepareMutation.isPending && prepareOrderResponse && (
                                    <div className="space-y-3">
                                        {!prepareOrderResponse.canFulfill && prepareOrderResponse.subOrders.length === 0 && (
                                            <OutOfStockWarning
                                                items={prepareOrderResponse.outOfStockItems}
                                                onOrderPartial={prepareOrderResponse.subOrders.length > 0 ? () => {} : undefined}
                                            />
                                        )}
                                        <PrepareOrderSummary
                                            prepareResponse={prepareOrderResponse}
                                            imageByVariantId={imageByVariantId}
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
                                                ? "border-teal-500 bg-teal-50/40 ring-1 ring-teal-400"
                                                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                                        }`}
                                    >
                                        {/* Radio dot */}
                                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                                            paymentMethod === pm.val ? "border-teal-500" : "border-gray-300"
                                        }`}>
                                            {paymentMethod === pm.val && <div className="w-2 h-2 rounded-full bg-teal-500" />}
                                        </div>
                                        {/* Icon */}
                                        <div className="shrink-0">{pm.icon}</div>
                                        {/* Text */}
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-gray-800">{pm.label}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{pm.sub}</p>
                                        </div>
                                        {paymentMethod === pm.val && (
                                            <CheckCircle2 size={16} className="text-teal-500 shrink-0" />
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
                    className="w-full px-3 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-teal-400 resize-none bg-gray-50/30 placeholder:text-gray-300"
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
                                {prepareOrderResponse ? (
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500">Tiền hàng</span>
                                            <span className="text-gray-800 font-medium">{formatMoney(prepareOrderResponse.totalSubtotal)}</span>
                                        </div>
                                        {prepareOrderResponse.discountAmount > 0 && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500">
                                                    Giáº£m giĂ¡
                                                    {prepareOrderResponse.voucherCode ? ` (${prepareOrderResponse.voucherCode})` : ""}
                                                </span>
                                                <span className="font-medium text-emerald-600">-{formatMoney(prepareOrderResponse.discountAmount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500">Phí vận chuyển</span>
                                            <span className="text-gray-800 font-medium">{formatMoney(prepareOrderResponse.totalShippingFee)}</span>
                                        </div>
                                        <div className="border-t border-dashed border-gray-200 pt-3">
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-gray-800">Tổng thanh toán</span>
                                                <span className="text-xl font-extrabold text-teal-600">
                          {formatMoney(prepareOrderResponse.totalAmount)}
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
                                    onClick={handleConfirm}
                                    disabled={!canPlaceOrder || confirmMutation.isPending || rateLimitCooldown > 0}
                                    className="mt-5 w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold uppercase tracking-widest transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded"
                                >
                                    {confirmMutation.isPending ? (
                                        <><Loader2 size={15} className="animate-spin" /> Đang xử lý...</>
                                    ) : rateLimitCooldown > 0 ? (
                                        `Vui lòng chờ ${rateLimitCooldown}s`
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
            {canPlaceOrder && prepareOrderResponse && (
                <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-30 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1">
                            <p className="text-[10px] text-gray-400">Tổng thanh toán</p>
                            <p className="text-base font-bold text-teal-600">
                                {formatMoney(prepareOrderResponse.totalAmount)}
                            </p>
                        </div>
                        <button
                            onClick={handleConfirm}
                            disabled={confirmMutation.isPending || rateLimitCooldown > 0}
                            className="px-7 py-3 bg-teal-600 text-white text-sm font-bold rounded uppercase tracking-wide transition-colors disabled:opacity-50"
                        >
                            {confirmMutation.isPending
                                ? <Loader2 size={14} className="animate-spin" />
                                : rateLimitCooldown > 0
                                    ? `Chờ ${rateLimitCooldown}s`
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
                                                    ? "border-teal-500 bg-teal-50/30 ring-1 ring-teal-400"
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
                                                    {addr.isDefault && (
                                                        <span className="mt-1.5 inline-block text-[10px] text-teal-600 border border-teal-400 px-1.5 py-0.5 rounded-sm">
                              Mặc định
                            </span>
                                                    )}
                                                </div>
                                                {deliveryInfo?.address === addr.addressDetail && (
                                                    <CheckCircle2 size={16} className="text-teal-500 shrink-0 mt-0.5" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setIsAddingNewAddress(true)}
                                        className="w-full py-3 border border-dashed border-gray-300 text-gray-500 text-sm hover:border-teal-500 hover:text-teal-600 transition-colors flex items-center justify-center gap-1.5 rounded-lg mt-1"
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
                                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded transition-colors"
                                >
                                    Đóng
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── MODAL: CONFLICT ── */}
            {showConflictModal && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowConflictModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full z-10">
                        <button onClick={() => setShowConflictModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X size={16} />
                        </button>
                        <div className="text-center">
                            <p className="text-3xl mb-3">⚠️</p>
                            <h3 className="font-bold text-gray-900 mb-2">Hàng vừa thay đổi!</h3>
                            <p className="text-sm text-gray-500 mb-5">
                                Một số sản phẩm vừa hết hàng hoặc không đủ số lượng.
                            </p>
                            <button onClick={retryPrepare} className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-lg transition-colors">
                                Kiểm tra lại đơn
                            </button>
                        </div>
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
                            <button onClick={retryPrepare} className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-lg transition-colors">
                                Thực hiện lại
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
