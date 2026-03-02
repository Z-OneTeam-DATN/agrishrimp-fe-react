"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight, ChevronLeft, Loader2, X, Plus, MapPin } from "lucide-react"
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

const PAYMENT_OPTIONS: { val: PaymentMethod; label: string; sub: string }[] = [
  { val: "COD", label: "Thanh toán khi nhận hàng (COD)", sub: "Trả tiền mặt trực tiếp cho shipper" },
  { val: "PAYOS", label: "Thanh toán online (payOS)", sub: "QR Code · Thẻ ATM · Thẻ tín dụng" },
]

export default function CheckoutPage() {
  const router = useRouter()

  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoadingCart, setIsLoadingCart] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD")
  const [note, setNote] = useState("")
  const [addressConfirmed, setAddressConfirmed] = useState(false)

  const [addresses, setAddresses] = useState<any[]>([])
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false)
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false)

  const [showConflictModal, setShowConflictModal] = useState(false)
  const [showTokenExpiredModal, setShowTokenExpiredModal] = useState(false)

  const { deliveryInfo, setDeliveryInfo, prepareOrderResponse, prepareToken } = useCartStore()
  const { userLocation } = useLocationStore()
  const { isAuthenticated, isLoadingAuth } = useAuthStore()

  useUserLocation()

  const prepareMutation = usePrepareOrder()
  const confirmMutation = useConfirmOrder({
    onConflict: () => setShowConflictModal(true),
    onTokenExpired: () => setShowTokenExpiredModal(true),
  })

  const handleAddressSelect = (addr: any) => {
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
        const items: CartItem[] = cartData.map((item: any) => ({
          productVariantId: item.variantId,
          quantity: item.quantity,
          productName: item.name,
          variantName: item.variant,
          unitPrice: item.price,
          imageUrl: item.image,
        }))
        setCartItems(items)
        setAddresses(addressData)
        if (addressData.length > 0) {
          const defaultAddr = addressData.find((a: any) => a.isDefault) || addressData[0]
          handleAddressSelect(defaultAddr)
        }
      } catch {
        toast.error("Không thể tải thông tin thanh toán!")
      } finally {
        setIsLoadingCart(false)
      }
    }
    loadData()
  }, [router, isAuthenticated, isLoadingAuth])

  const handleAddNewAddress = async (data: any) => {
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
      const updatedAddresses = await addressService.getAll()
      setAddresses(updatedAddresses)
      handleAddressSelect(newAddr.id ? newAddr : updatedAddresses.find((a: any) => a.addressDetail === payload.addressDetail))
      setIsAddingNewAddress(false)
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi thêm địa chỉ!")
    } finally {
      setIsSubmittingAddress(false)
    }
  }

  const handleConfirm = () => {
    if (!prepareToken) { setShowTokenExpiredModal(true); return }
    confirmMutation.mutate({ prepareToken, paymentMethod, note: note.trim() || undefined })
  }

  const retryPrepare = () => {
    setShowConflictModal(false)
    setShowTokenExpiredModal(false)
    if (!deliveryInfo?.userAddressId) return
    prepareMutation.mutate({
      userAddressId: deliveryInfo.userAddressId,
      ...(userLocation && { userLat: userLocation.lat, userLng: userLocation.lng }),
    })
  }

  const canPlaceOrder =
    !!prepareOrderResponse &&
    (prepareOrderResponse.canFulfill || prepareOrderResponse.subOrders.length > 0)

  if (isLoadingCart) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-gray-400">
        <Loader2 size={24} className="animate-spin text-teal-500" />
        <span className="text-sm">Đang tải...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-24 md:pb-10">

      {/* HEADER */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 max-w-6xl">
          <nav className="flex items-center gap-1.5 py-3.5 text-sm text-gray-500">
            <Link href="/" className="hover:text-teal-600">Trang chủ</Link>
            <ChevronRight size={13} className="text-gray-300" />
            <Link href="/user/cart" className="hover:text-teal-600">Giỏ hàng</Link>
            <ChevronRight size={13} className="text-gray-300" />
            <span className="text-gray-800 font-medium">Thanh toán</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-3">

            {/* SECTION 1: ĐỊA CHỈ */}
            <div className="bg-white border border-gray-200">
              <div className="px-4 md:px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <span className="block w-[3px] h-4 bg-teal-500 rounded-full" />
                  Địa chỉ nhận hàng
                </h2>
                {addressConfirmed && (
                  <button
                    onClick={() => setIsAddressModalOpen(true)}
                    className="text-xs text-teal-600 font-medium hover:underline"
                  >
                    Thay đổi
                  </button>
                )}
              </div>

              <div className="px-4 md:px-6 py-4">
                {!addressConfirmed ? (
                  <div className="space-y-2">
                    {addresses.length === 0 ? (
                      <div className="py-6 text-center text-gray-400 space-y-3">
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
                            className="flex items-start justify-between p-3 border border-gray-200 cursor-pointer hover:border-teal-400 hover:bg-teal-50/20 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-semibold text-sm text-gray-900">{addr.receiverName}</span>
                                <span className="text-gray-300 text-xs">|</span>
                                <span className="text-sm text-gray-500">{addr.receiverPhone}</span>
                                {addr.isDefault && (
                                  <span className="text-[10px] text-teal-600 border border-teal-500 px-1 rounded-sm">Mặc định</span>
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
                          className="w-full py-2.5 border border-dashed border-gray-300 text-gray-500 text-sm hover:border-teal-500 hover:text-teal-600 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Plus size={13} /> Thêm địa chỉ mới
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <MapPin size={15} className="text-teal-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm text-gray-900">{deliveryInfo?.receiverName}</span>
                        <span className="text-gray-300 text-xs">|</span>
                        <span className="text-sm text-gray-500">{deliveryInfo?.receiverPhone}</span>
                      </div>
                      <p className="text-sm text-gray-500">{deliveryInfo?.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 2: SẢN PHẨM */}
            <div className="bg-white border border-gray-200">
              <div className="px-4 md:px-6 py-3 border-b border-gray-100 flex items-center gap-2">
                <span className="block w-[3px] h-4 bg-teal-500 rounded-full" />
                <h2 className="text-sm font-semibold text-gray-800">Sản phẩm</h2>
              </div>

              <div className="px-4 md:px-6 py-4">
                {!addressConfirmed && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    Chọn địa chỉ để xem chi tiết vận chuyển
                  </p>
                )}

                {addressConfirmed && prepareMutation.isPending && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Loader2 size={14} className="animate-spin text-teal-500 shrink-0" />
                      Đang tính phí vận chuyển...
                    </div>
                    <div className="border border-gray-100 rounded p-4 animate-pulse space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                      <div className="h-3 bg-gray-100 rounded w-full" />
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                    </div>
                  </div>
                )}

                {addressConfirmed && prepareMutation.isError && !prepareMutation.isPending && (
                  <div className="border border-red-100 bg-red-50 rounded p-4 text-center">
                    <p className="text-sm font-medium text-red-700 mb-1">Khu vực chưa có chi nhánh phục vụ</p>
                    <p className="text-xs text-red-400">Vui lòng chọn địa chỉ khác.</p>
                  </div>
                )}

                {addressConfirmed && !prepareMutation.isPending && prepareOrderResponse && (
                  <div className="space-y-4">
                    {!prepareOrderResponse.canFulfill && (
                      <OutOfStockWarning
                        items={prepareOrderResponse.outOfStockItems}
                        onOrderPartial={prepareOrderResponse.subOrders.length > 0 ? () => {} : undefined}
                      />
                    )}
                    <PrepareOrderSummary prepareResponse={prepareOrderResponse} />
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 3: PHƯƠNG THỨC THANH TOÁN */}
            <div className="bg-white border border-gray-200">
              <div className="px-4 md:px-6 py-3 border-b border-gray-100 flex items-center gap-2">
                <span className="block w-[3px] h-4 bg-teal-500 rounded-full" />
                <h2 className="text-sm font-semibold text-gray-800">Phương thức thanh toán</h2>
              </div>

              <div className="divide-y divide-gray-50">
                {PAYMENT_OPTIONS.map((pm) => (
                  <label
                    key={pm.val}
                    onClick={() => setPaymentMethod(pm.val)}
                    className={`flex items-center gap-3 px-4 md:px-6 py-3.5 cursor-pointer transition-colors ${
                      paymentMethod === pm.val ? "bg-teal-50/40" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      paymentMethod === pm.val ? "border-teal-500" : "border-gray-300"
                    }`}>
                      {paymentMethod === pm.val && <div className="w-2 h-2 rounded-full bg-teal-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{pm.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{pm.sub}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Ghi chú */}
              <div className="px-4 md:px-6 py-4 border-t border-gray-100">
                <label className="block text-xs font-semibold text-gray-600 mb-2">Ghi chú đơn hàng</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Giao giờ hành chính, gọi trước khi đến..."
                  className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-teal-400 resize-none bg-gray-50/30"
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-1 space-y-3 lg:sticky lg:top-4">
            <div className="bg-white border border-gray-200 p-4 md:p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-100">
                Tổng đơn hàng
              </h3>

              {prepareOrderResponse ? (
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tiền hàng</span>
                    <span className="text-gray-800">{formatMoney(prepareOrderResponse.totalSubtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phí vận chuyển</span>
                    <span className="text-gray-800">{formatMoney(prepareOrderResponse.totalShippingFee)}</span>
                  </div>
                  <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-center">
                    <span className="font-semibold text-gray-800">Tổng thanh toán</span>
                    <span className="text-xl font-bold text-teal-600">
                      {formatMoney(prepareOrderResponse.totalAmount)}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 text-right">Đã bao gồm VAT (nếu có)</p>
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-3">
                  Chọn địa chỉ để xem tổng tiền
                </p>
              )}

              <button
                onClick={handleConfirm}
                disabled={!canPlaceOrder || confirmMutation.isPending}
                className="mt-5 w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold transition-colors active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {confirmMutation.isPending ? (
                  <><Loader2 size={15} className="animate-spin" /> Đang xử lý...</>
                ) : !canPlaceOrder ? (
                  "Chọn địa chỉ giao hàng"
                ) : (
                  "Đặt hàng"
                )}
              </button>

              <p className="mt-3 text-[10px] text-gray-400 text-center leading-relaxed">
                Nhấn Đặt hàng đồng nghĩa bạn đồng ý với{" "}
                <span className="underline cursor-pointer">Điều khoản & Chính sách</span> của AgriShrimp
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM BAR */}
      {canPlaceOrder && prepareOrderResponse && (
        <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-30">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1">
              <p className="text-[10px] text-gray-400">Tổng thanh toán</p>
              <p className="text-base font-bold text-gray-900">
                {formatMoney(prepareOrderResponse.totalAmount)}
              </p>
            </div>
            <button
              onClick={handleConfirm}
              disabled={confirmMutation.isPending}
              className="px-6 py-2.5 bg-teal-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {confirmMutation.isPending
                ? <Loader2 size={14} className="animate-spin" />
                : "Đặt hàng"
              }
            </button>
          </div>
        </div>
      )}

      {/* ADDRESS MODAL */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsAddressModalOpen(false)} />
          <div className={`relative bg-white w-full shadow-2xl rounded-t-xl sm:rounded-lg flex flex-col ${
            isAddingNewAddress ? "max-w-2xl h-[90vh]" : "max-w-lg max-h-[80vh]"
          }`}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
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
              <button onClick={() => setIsAddressModalOpen(false)} className="text-gray-400 hover:text-gray-600">
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
                      className={`p-3.5 border cursor-pointer transition-colors ${
                        deliveryInfo?.address === addr.addressDetail
                          ? "border-teal-500 bg-teal-50/30"
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
                          <p className="text-xs text-gray-400 leading-relaxed">{addr.addressDetail}</p>
                          {addr.isDefault && (
                            <span className="mt-1.5 inline-block text-[10px] text-teal-600 border border-teal-500 px-1.5 py-0.5 rounded-sm">
                              Mặc định
                            </span>
                          )}
                        </div>
                        {deliveryInfo?.address === addr.addressDetail && (
                          <div className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center shrink-0 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setIsAddingNewAddress(true)}
                    className="w-full py-3 border border-dashed border-gray-300 text-gray-500 text-sm hover:border-teal-500 hover:text-teal-600 transition-colors flex items-center justify-center gap-1.5 mt-2"
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
                  className="w-full py-2.5 bg-teal-600 text-white font-semibold text-sm"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CONFLICT */}
      {showConflictModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowConflictModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-sm w-full z-10">
            <button onClick={() => setShowConflictModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
            <div className="text-center">
              <p className="text-2xl mb-3">⚠️</p>
              <h3 className="font-semibold text-gray-900 mb-2">Hàng vừa thay đổi!</h3>
              <p className="text-sm text-gray-500 mb-5">
                Một số sản phẩm vừa hết hàng hoặc không đủ số lượng.
              </p>
              <button onClick={retryPrepare} className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-lg transition-colors">
                Kiểm tra lại đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TOKEN EXPIRED */}
      {showTokenExpiredModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowTokenExpiredModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-sm w-full z-10">
            <button onClick={() => setShowTokenExpiredModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
            <div className="text-center">
              <p className="text-2xl mb-3">⏰</p>
              <h3 className="font-semibold text-gray-900 mb-2">Phiên đặt hàng hết hạn</h3>
              <p className="text-sm text-gray-500 mb-5">
                Thông tin đơn hàng đã hết hạn sau 30 phút. Vui lòng thực hiện lại.
              </p>
              <button onClick={retryPrepare} className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-lg transition-colors">
                Thực hiện lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
