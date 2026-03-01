"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronRight,
  Loader2,
  X,
  Banknote,
  Building2,
  Truck,
  QrCode,
  MapPin,
  PackageSearch,
  ArrowRight,
} from "lucide-react"
import { toast } from "sonner"
import { cartService } from "@/app/services/cart.service"
import { useCartStore } from "@/stores/useCartStore"
import { useLocationStore } from "@/stores/locationStore"
import { useUserLocation } from "@/hooks/useUserLocation"
import { usePrepareOrder } from "@/hooks/usePrepareOrder"
import { useConfirmOrder } from "@/hooks/useConfirmOrder"
import { DeliveryAddressForm } from "@/components/checkout/DeliveryAddressForm"
import { PrepareOrderSummary } from "@/components/order/PrepareOrderSummary"
import { OutOfStockWarning } from "@/components/order/OutOfStockWarning"
import type { DeliveryInfo, CartItem, PaymentMethod } from "@/app/types/order.types"

const formatMoney = (amount: number) => amount.toLocaleString("vi-VN") + "đ"

const PAYMENT_OPTIONS: {
  val: PaymentMethod
  label: string
  sub: string
  icon: React.ReactNode
}[] = [
  {
    val: "COD",
    label: "Thanh toán khi nhận hàng (COD)",
    sub: "Trả tiền mặt trực tiếp cho shipper",
    icon: <Truck size={18} className="text-teal-600" />,
  },
  {
    val: "PAYOS",
    label: "Thanh toán online (payOS)",
    sub: "QR Code / thẻ ATM / thẻ tín dụng — thanh toán ngay",
    icon: <QrCode size={18} className="text-blue-600" />,
  },
  {
    val: "TRANSFER",
    label: "Chuyển khoản thủ công",
    sub: "Chuyển khoản và gửi xác nhận cho chúng tôi",
    icon: <Building2 size={18} className="text-indigo-500" />,
  },
  {
    val: "CASH",
    label: "Tiền mặt tại cửa hàng",
    sub: "Đến trực tiếp chi nhánh để thanh toán và nhận hàng",
    icon: <Banknote size={18} className="text-green-600" />,
  },
]

export default function CheckoutPage() {
  const router = useRouter()

  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoadingCart, setIsLoadingCart] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD")
  const [note, setNote] = useState("")
  const [addressConfirmed, setAddressConfirmed] = useState(false)

  // Modals
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [showTokenExpiredModal, setShowTokenExpiredModal] = useState(false)

  const {
    deliveryInfo,
    setDeliveryInfo,
    prepareOrderResponse,
    prepareToken,
  } = useCartStore()
  const { userLocation } = useLocationStore()

  useUserLocation()

  const prepareMutation = usePrepareOrder()
  const confirmMutation = useConfirmOrder({
    onConflict: () => setShowConflictModal(true),
    onTokenExpired: () => setShowTokenExpiredModal(true),
  })

  // Load cart từ API
  useEffect(() => {
    const loadCart = async () => {
      try {
        setIsLoadingCart(true)
        const data = await cartService.getMyCart()
        if (!data || data.length === 0) {
          toast.warning("Giỏ hàng trống, vui lòng thêm sản phẩm!")
          router.push("/user/cart")
          return
        }
        const items: CartItem[] = data.map((item: any) => ({
          productVariantId: item.variantId,
          quantity: item.quantity,
          productName: item.name,
          variantName: item.variant,
          unitPrice: item.price,
          imageUrl: item.image,
        }))
        setCartItems(items)
      } catch (err: any) {
        if (err?.response?.status === 401) {
          toast.error("Vui lòng đăng nhập để thanh toán!")
          router.push("/login")
        } else {
          toast.error("Không thể tải giỏ hàng!")
        }
      } finally {
        setIsLoadingCart(false)
      }
    }
    loadCart()
  }, [router])

  // Xác nhận địa chỉ → gọi prepare order
  const handleDeliverySubmit = (info: DeliveryInfo) => {
    setDeliveryInfo(info)
    setAddressConfirmed(true)

    if (!userLocation) {
      toast.error("Chưa xác định được vị trí của bạn. Vui lòng thử lại.")
      return
    }

    prepareMutation.mutate({
      userLat: userLocation.lat,
      userLng: userLocation.lng,
      deliveryAddress: info.address,
      deliveryDistrictId: info.districtId,
      deliveryWardCode: info.wardCode,
      cart: cartItems,
    })
  }

  // Đặt hàng
  const handleConfirm = () => {
    if (!prepareToken) {
      setShowTokenExpiredModal(true)
      return
    }
    confirmMutation.mutate({
      prepareToken,
      paymentMethod,
      note: note.trim() || undefined,
    })
  }

  // Retry prepare sau conflict / token expired
  const retryPrepare = () => {
    setShowConflictModal(false)
    setShowTokenExpiredModal(false)
    if (!deliveryInfo || !userLocation) return
    prepareMutation.mutate({
      userLat: userLocation.lat,
      userLng: userLocation.lng,
      deliveryAddress: deliveryInfo.address,
      deliveryDistrictId: deliveryInfo.districtId,
      deliveryWardCode: deliveryInfo.wardCode,
      cart: cartItems,
    })
  }

  const canPlaceOrder =
    !!prepareOrderResponse &&
    (prepareOrderResponse.canFulfill || prepareOrderResponse.subOrders.length > 0)

  if (isLoadingCart) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-gray-400">
        <Loader2 size={28} className="animate-spin text-teal-500" />
        <span className="text-sm">Đang thiết lập thanh toán...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28 md:pb-10">

      {/* ── HEADER ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 max-w-3xl">
          <nav className="flex items-center gap-1.5 py-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-teal-600">Trang chủ</Link>
            <ChevronRight size={13} className="text-gray-300" />
            <Link href="/user/cart" className="hover:text-teal-600">Giỏ hàng</Link>
            <ChevronRight size={13} className="text-gray-300" />
            <span className="text-gray-800 font-medium">Đặt hàng</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl py-5 space-y-4">

        {/* ═══ SECTION 1: ĐỊA CHỈ GIAO HÀNG ═══ */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin size={16} className="text-teal-600" />
            Địa chỉ giao hàng
          </h2>
          <DeliveryAddressForm
            onSubmit={handleDeliverySubmit}
            defaultValues={deliveryInfo ?? undefined}
            submitLabel={prepareMutation.isPending ? "Đang kiểm tra..." : addressConfirmed ? "Cập nhật địa chỉ" : "Xác nhận địa chỉ"}
            submitDisabled={prepareMutation.isPending}
          />
        </div>

        {/* ═══ SECTION 2: XEM LẠI ĐƠN HÀNG ═══ */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PackageSearch size={16} className="text-teal-600" />
            Xem lại đơn hàng
          </h2>

          {/* Chưa xác nhận địa chỉ */}
          {!addressConfirmed && (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2">
              <MapPin size={32} className="text-gray-200" />
              <p className="text-sm">Điền địa chỉ giao hàng để kiểm tra tồn kho và phí ship</p>
            </div>
          )}

          {/* Loading */}
          {addressConfirmed && prepareMutation.isPending && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-500 text-sm mb-4">
                <Loader2 size={15} className="animate-spin text-teal-500 shrink-0" />
                Đang kiểm tra tồn kho và tính phí ship...
              </div>
              {[1, 2].map((i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
                  <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {addressConfirmed && prepareMutation.isError && !prepareMutation.isPending && (
            <div className="border border-red-200 bg-red-50 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-red-700">
                Không tìm được chi nhánh phù hợp
              </p>
              <p className="text-xs text-red-500">
                Hiện tại chưa có chi nhánh phục vụ khu vực của bạn.
              </p>
            </div>
          )}

          {/* Out of stock */}
          {addressConfirmed && !prepareMutation.isPending &&
            prepareOrderResponse &&
            !prepareOrderResponse.canFulfill && (
              <OutOfStockWarning
                items={prepareOrderResponse.outOfStockItems}
                onOrderPartial={() => {}}
              />
            )}

          {/* Success */}
          {addressConfirmed && !prepareMutation.isPending && prepareOrderResponse?.canFulfill && (
            <PrepareOrderSummary prepareResponse={prepareOrderResponse} />
          )}
        </div>

        {/* ═══ SECTION 3: PHƯƠNG THỨC THANH TOÁN ═══ */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <QrCode size={16} className="text-teal-600" />
            Phương thức thanh toán
          </h2>

          <div className="space-y-2">
            {PAYMENT_OPTIONS.map((pm) => (
              <label
                key={pm.val}
                onClick={() => setPaymentMethod(pm.val)}
                className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all ${
                  paymentMethod === pm.val
                    ? "border-teal-500 bg-teal-50/40 ring-1 ring-teal-400"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    paymentMethod === pm.val ? "border-teal-600" : "border-gray-300"
                  }`}
                >
                  {paymentMethod === pm.val && (
                    <div className="w-2 h-2 rounded-full bg-teal-600" />
                  )}
                </div>
                <div className="w-7 h-7 flex items-center justify-center shrink-0">
                  {pm.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{pm.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{pm.sub}</p>
                </div>
              </label>
            ))}
          </div>

          {/* PAYOS info */}
          {paymentMethod === "PAYOS" && (
            <div className="mt-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2">
              <QrCode size={14} className="shrink-0 mt-0.5 text-blue-600" />
              <span>
                Sau khi đặt hàng, bạn sẽ được chuyển đến trang thanh toán của <strong>payOS</strong> (QR / thẻ ATM / thẻ tín dụng).
                Đơn hàng sẽ được xác nhận tự động sau khi thanh toán thành công.
              </span>
            </div>
          )}

          {/* TRANSFER — thông tin tài khoản */}
          {paymentMethod === "TRANSFER" && (
            <div className="mt-3 border border-indigo-200 bg-indigo-50 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-indigo-100 border-b border-indigo-200">
                <p className="text-xs font-semibold text-indigo-800">
                  Thông tin chuyển khoản
                </p>
              </div>
              <div className="px-4 py-3 space-y-2 text-xs">
                {[
                  { label: "Ngân hàng", value: "Vietcombank (VCB)" },
                  { label: "Số tài khoản", value: "1234 5678 9012 345", mono: true },
                  { label: "Chủ tài khoản", value: "CÔNG TY AGRISHRIMP" },
                  { label: "Chi nhánh", value: "Cần Thơ" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-2">
                    <span className="text-gray-500 shrink-0">{row.label}</span>
                    <span
                      className={`font-semibold text-gray-900 text-right ${
                        row.mono ? "font-mono tracking-wider" : ""
                      }`}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-200">
                <p className="text-[11px] text-amber-700">
                  Nội dung CK: <strong className="font-mono">AGRI + số điện thoại</strong> (ví dụ: <em>AGRI0909123456</em>).
                  Đơn hàng sẽ được xác nhận trong vòng <strong>2 giờ</strong> sau khi nhận được tiền.
                </p>
              </div>
            </div>
          )}

          {/* CASH */}
          {paymentMethod === "CASH" && (
            <div className="mt-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 flex items-start gap-2">
              <Banknote size={14} className="shrink-0 mt-0.5 text-green-600" />
              <span>
                Đến trực tiếp chi nhánh gần nhất để nhận hàng và thanh toán bằng tiền mặt.
                Mang theo <strong>mã đơn hàng</strong> để nhân viên tra cứu nhanh hơn.
              </span>
            </div>
          )}

          {/* COD */}
          {paymentMethod === "COD" && (
            <div className="mt-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 flex items-start gap-2">
              <Truck size={14} className="shrink-0 mt-0.5" />
              <span>
                Shipper sẽ liên hệ trước khi giao. Vui lòng chuẩn bị đúng số tiền{" "}
                {prepareOrderResponse ? (
                  <strong>{formatMoney(prepareOrderResponse.totalAmount)}</strong>
                ) : (
                  <span className="italic text-gray-400">(xác nhận địa chỉ để xem tổng tiền)</span>
                )}{" "}
                khi nhận hàng.
              </span>
            </div>
          )}

          {/* Note */}
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Ghi chú đơn hàng (tùy chọn)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Ví dụ: Giao buổi sáng trước 10h..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-teal-400 text-sm resize-none"
            />
          </div>
        </div>

        {/* ═══ SECTION 4: TÓM TẮT & ĐẶT HÀNG ═══ */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Tóm tắt đơn hàng</h3>

          {prepareOrderResponse ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tổng tiền hàng</span>
                <span className="font-medium">{formatMoney(prepareOrderResponse.totalSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tổng phí ship</span>
                <span className="font-medium">{formatMoney(prepareOrderResponse.totalShippingFee)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-gray-100 pt-2 mt-2">
                <span className="text-gray-800">Tổng thanh toán</span>
                <span className="text-gray-900 text-base">{formatMoney(prepareOrderResponse.totalAmount)}</span>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-gray-400">
              Xác nhận địa chỉ giao hàng để xem tổng tiền
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={!canPlaceOrder || confirmMutation.isPending}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {confirmMutation.isPending ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Đang xử lý...
              </>
            ) : !canPlaceOrder ? (
              <>Xác nhận địa chỉ trước khi đặt hàng</>
            ) : paymentMethod === "PAYOS" ? (
              <>Tiến hành thanh toán <QrCode size={15} /></>
            ) : paymentMethod === "TRANSFER" ? (
              <>Đặt hàng & chuyển khoản <Building2 size={15} /></>
            ) : paymentMethod === "CASH" ? (
              <>Đặt hàng & đến lấy tại cửa hàng <Banknote size={15} /></>
            ) : (
              <>Đặt hàng (COD) <Truck size={15} /></>
            )}
          </button>

          <p className="mt-3 text-center text-xs text-gray-400">
            Nhấn đặt hàng là bạn đồng ý với{" "}
            <span className="text-teal-600 cursor-pointer">điều khoản sử dụng</span>{" "}
            của AgriShrimp
          </p>
        </div>
      </div>

      {/* ── MOBILE BOTTOM BAR (khi đã có đơn hàng) ── */}
      {canPlaceOrder && prepareOrderResponse && (
        <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-30">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1">
              <p className="text-xs text-gray-400">Tổng thanh toán</p>
              <p className="text-base font-bold text-gray-900">
                {formatMoney(prepareOrderResponse.totalAmount)}
              </p>
            </div>
            <button
              onClick={handleConfirm}
              disabled={confirmMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {confirmMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>Đặt hàng <ArrowRight size={14} /></>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFLICT (409) ── */}
      {showConflictModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowConflictModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full z-10">
            <button
              onClick={() => setShowConflictModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                ⚠️
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Hàng vừa thay đổi!</h3>
              <p className="text-sm text-gray-500 mb-5">
                Một số sản phẩm vừa hết hàng hoặc không đủ số lượng. Vui lòng kiểm tra lại đơn hàng của bạn.
              </p>
              <button
                onClick={retryPrepare}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl transition-colors"
              >
                Kiểm tra lại đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: TOKEN EXPIRED (400) ── */}
      {showTokenExpiredModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowTokenExpiredModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full z-10">
            <button
              onClick={() => setShowTokenExpiredModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                ⏰
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Phiên đặt hàng hết hạn</h3>
              <p className="text-sm text-gray-500 mb-5">
                Thông tin đơn hàng đã hết hạn sau 30 phút. Vui lòng thực hiện lại để đảm bảo tồn kho chính xác.
              </p>
              <button
                onClick={retryPrepare}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl transition-colors"
              >
                Thực hiện lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
