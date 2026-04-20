"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useCartStore } from "@/stores/useCartStore";
import { cartService } from "@/app/services/cart.service";
import { orderService } from "@/app/services/order.service";
import { addressService } from "@/app/services/address.service";
import { branchService } from "@/app/services/branchService";
import { findNearestBranches } from "@/app/services/branchService";
import { voucherService } from "@/app/services/voucher.service";
import { getRetryAfterSeconds, isRateLimitedError } from "@/app/utils/apiError";
import AddressForm from "@/components/profile/AddressForm";
import {
  MapPin,
  Truck,
  ChevronRight,
  Plus,
  X,
  Ticket,
  ChevronLeft,
  ShoppingBag,
  Store,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useUserLocation } from "@/hooks/useUserLocation";

const SHIPPING_METHODS = [
  { id: "fast", name: "Giao hàng nhanh", price: 15000 },
  { id: "express", name: "Hỏa tốc 2H", price: 35000 },
];

interface Voucher {
  id?: number;
  code: string;
  title: string;
  description: string;
  discountType: "FIXED" | "PERCENT";
  discountValue?: number;
  value?: number;
  minOrderValue: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  status: string;
}

interface Branch {
  id: number;
  name: string;
  provinceId: string;
  addressDetail: string;
  estimatedDays?: number;
}

const STORE_LABEL = "Cửa hàng AgriShrimp";

const formatMoney = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return "0₫";
  return Number(amount).toLocaleString("vi-VN") + " ₫";
};

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { location: userLocation } = useUserLocation();
  const selectedItemsParam = searchParams.get("items") || "";

  const selectedCartItemIds = useMemo(() => {
    return selectedItemsParam
      .split(",")
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0);
  }, [selectedItemsParam]);

  const selectedVoucherCode = searchParams.get("voucher");

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0);
  const [note, setNote] = useState("");

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [shippingMethodId, setShippingMethodId] = useState<string>("fast");
  const [paymentMethod, setPaymentMethod] = useState<string>("COD");

  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [isFindingBranch, setIsFindingBranch] = useState(false);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);

  const fetchCheckoutData = async () => {
    try {
      setLoading(true);
      const [cartData, addressData] = await Promise.all([
        cartService.getMyCart(),
        addressService.getAll(),
      ]);
      if (cartData.length === 0) {
        toast.warning("Giỏ hàng rỗng, vui lòng chọn sản phẩm!");
        router.push("/user/cart");
        return;
      }

      const selectedItems = selectedCartItemIds.length > 0
        ? cartData.filter((item: any) => selectedCartItemIds.includes(Number(item.id)))
        : cartData;

      if (selectedCartItemIds.length > 0 && selectedItems.length === 0) {
        toast.error("Không tìm thấy sản phẩm đã chọn trong giỏ hàng.");
        router.push("/user/cart");
        return;
      }

      setCartItems(selectedItems);
      setAddresses(addressData);
      if (addressData.length > 0) {
        const defaultAddr = addressData.find((a: any) => a.isDefault);
        setSelectedAddressId(defaultAddr ? defaultAddr.id : addressData[0].id);
      }
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Vui lòng đăng nhập để thanh toán!");
        router.push("/login");
      } else {
        toast.error("Không thể tải thông tin thanh toán!");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicVouchers = async () => {
    try {
      const res = await voucherService.getPublicVouchers();
      const voucherArray = res.data ? res.data : res;
      setAvailableVouchers(Array.isArray(voucherArray) ? voucherArray : []);
    } catch (error) {
      console.error("Lỗi tải voucher", error);
    }
  };

  useEffect(() => {
    if (!selectedVoucherCode || availableVouchers.length === 0) return;

    const matchedVoucher = availableVouchers.find(
      (voucher) => voucher.code === selectedVoucherCode.toUpperCase()
    );

    if (matchedVoucher) {
      setSelectedVoucher(matchedVoucher);
    }
  }, [availableVouchers, selectedVoucherCode]);

  useEffect(() => {
    fetchCheckoutData();
    fetchPublicVouchers();
  }, [router, selectedItemsParam]);

  useEffect(() => {
    if (rateLimitCooldown <= 0) return;
    const timer = setInterval(() => {
      setRateLimitCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitCooldown]);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  useEffect(() => {
    if (!selectedAddress || cartItems.length === 0) return;
    const findEligibleBranches = async () => {
      setIsFindingBranch(true);
      try {
        const payload = cartItems.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        }));
        const branchesFromAPI = await branchService.checkStock(payload);

        const processedBranches = branchesFromAPI.map((branch: any) => {
          const branchProvince = String(branch.provinceId);
          const userProvince = String(selectedAddress.provinceId);
          const estimated = branchProvince === userProvince ? 1 : 3;
          return { ...branch, estimatedDays: estimated };
        });

        if (userLocation && processedBranches.length > 0) {
          const nearest = await findNearestBranches({
            lat: userLocation.lat,
            lng: userLocation.lng,
            limit: 10,
          });
          const nearestRank = new Map<number, number>();
          nearest.forEach((branch: any, index: number) => nearestRank.set(Number(branch.id), index));

          processedBranches.sort((left: Branch, right: Branch) => {
            const leftRank = nearestRank.has(left.id) ? nearestRank.get(left.id)! : Number.MAX_SAFE_INTEGER;
            const rightRank = nearestRank.has(right.id) ? nearestRank.get(right.id)! : Number.MAX_SAFE_INTEGER;
            if (leftRank !== rightRank) return leftRank - rightRank;
            return (left.estimatedDays || 0) - (right.estimatedDays || 0);
          });
        } else {
          processedBranches.sort((a: Branch, b: Branch) => (a.estimatedDays || 0) - (b.estimatedDays || 0));
        }

        setAvailableBranches(processedBranches);
        setSelectedBranchId(processedBranches.length > 0 ? processedBranches[0].id : null);
      } catch (error) {
        console.error("Lỗi khi tìm kho:", error);
        toast.error("Không thể lấy thông tin tồn kho lúc này.");
        setAvailableBranches([]);
        setSelectedBranchId(null);
      } finally {
        setIsFindingBranch(false);
      }
    };
    findEligibleBranches();
  }, [selectedAddressId, addresses, cartItems, userLocation]);

  const selectedBranch = availableBranches.find((b) => b.id === selectedBranchId);

  const handleAddNewAddress = async (data: any) => {
    setIsSubmittingAddress(true);
    try {
      const payload = {
        receiverName: data.fullName,
        receiverPhone: data.phone,
        addressDetail: data.specificAddress,
        provinceId: Number(data.provinceId),
        districtId: Number(data.districtId),
        wardCode: data.wardCode,
        isDefault: data.isDefault,
      };
      const newAddress = await addressService.create(payload);
      toast.success("Đã thêm địa chỉ mới!");
      const updatedAddresses = await addressService.getAll();
      setAddresses(updatedAddresses);
      setSelectedAddressId(newAddress.id || updatedAddresses[0].id);
      setIsAddingNewAddress(false);
      setIsAddressModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi thêm địa chỉ!");
    } finally {
      setIsSubmittingAddress(false);
    }
  };

  const selectedShipping = SHIPPING_METHODS.find((s) => s.id === shippingMethodId) || SHIPPING_METHODS[0];
  const subTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    if (selectedVoucher && subTotal < (selectedVoucher.minOrderValue || 0)) {
      setSelectedVoucher(null);
    }
  }, [subTotal, selectedVoucher]);

  let voucherDiscount = 0;
  if (selectedVoucher) {
    if (subTotal >= (selectedVoucher.minOrderValue || 0)) {
      const actualValue = Number(selectedVoucher.value || selectedVoucher.discountValue || 0);
      if (selectedVoucher.discountType === "PERCENT") {
        const calculatedDiscount = (subTotal * actualValue) / 100;
        voucherDiscount = selectedVoucher.maxDiscount
          ? Math.min(calculatedDiscount, Number(selectedVoucher.maxDiscount))
          : calculatedDiscount;
      } else {
        voucherDiscount = actualValue;
      }
    }
  }

  let actualShippingFee = selectedShipping.price;
  if (selectedAddress && selectedBranch) {
    actualShippingFee = selectedBranch.estimatedDays === 1 ? 15000 : 35000;
  }
  const shippingFee = selectedAddress && selectedBranch ? actualShippingFee : 0;
  const finalTotal = Math.max(0, subTotal + shippingFee - voucherDiscount);

  const getDeliveryDateText = (days?: number) => {
    if (!days) return "Đang cập nhật";
    if (days === 1) return "Dự kiến nhận hàng trong ngày";
    return `Dự kiến nhận hàng sau ${days} ngày`;
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rateLimitCooldown > 0) {
      return; // Chỉ disable button, không show toast
    }
    if (cartItems.length === 0) return;
    if (!selectedAddress) {
      toast.error("Vui lòng chọn địa chỉ nhận hàng!");
      return;
    }
    if (!selectedBranchId) {
      toast.error("Không có cửa hàng nào đủ hàng. Vui lòng thử lại sau!");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        shippingAddress: selectedAddress.addressDetail,
        phone: selectedAddress.receiverPhone,
        fullName: selectedAddress.receiverName,
        note: note,
        voucherCode: selectedVoucher ? selectedVoucher.code : selectedVoucherCode,
        branchId: selectedBranchId,
        items: cartItems.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        paymentMethod: paymentMethod,
      };

      const response = await orderService.checkout(payload);

      if (paymentMethod === "PAYOS") {
        let checkoutUrl = response?.checkoutUrl || response?.paymentUrl || response?.payUrl || response?.url;
        const orderId = response?.orderId || response?.id;

        if (!checkoutUrl && orderId) {
          try {
            const { getPaymentLink } = await import("@/app/services/orderService");
            checkoutUrl = await getPaymentLink(orderId);
          } catch (linkError) {
            console.error("Lỗi khi lấy lại link thanh toán:", linkError);
          }
        }

        if (checkoutUrl) {
          window.location.href = checkoutUrl;
          return;
        } else {
          toast.error("Máy chủ không trả về liên kết thanh toán. Vui lòng thử lại hoặc chọn phương thức khác!");
          setIsSubmitting(false);
          return;
        }
      }

      const finalOrderId = response?.orderId || response?.id;
      const finalOrderCode = response?.orderCode || response?.code;

      if (!finalOrderId) {
        toast.error("Đã có lỗi xảy ra khi xử lý đơn hàng!");
        setIsSubmitting(false);
        return;
      }

      toast.success("🎉 Đặt hàng thành công! Cảm ơn bạn.");
      useCartStore.getState().clearCart();
      useCartStore.getState().fetchCartCount();
      router.push(`/order-success?orderId=${finalOrderId}&orderCode=${encodeURIComponent(finalOrderCode || "")}&method=offline`);
      router.refresh();
    } catch (error: any) {
      if (isRateLimitedError(error)) {
        const retryAfterSeconds = getRetryAfterSeconds(error);
        setRateLimitCooldown((prev) => Math.max(prev, retryAfterSeconds));
        // Không show toast khi rate limit - chỉ disable button
      } else {
        const errData = error.response?.data;
        const errMsg = typeof errData === "object" ? errData.detail || errData.message || errData.error : errData || error.message || "Lỗi xử lý đặt hàng!";
        toast.error(errMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-gray-400">
        <Loader2 size={28} className="animate-spin text-teal-500" />
        <span className="text-sm">Đang thiết lập thanh toán...</span>
      </div>
    );
  }

  const canCheckout = selectedAddress && selectedBranchId && !isFindingBranch;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-10">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center h-14 md:hidden">
            <Link href="/user/cart" className="p-1 -ml-1">
              <ChevronLeft size={22} className="text-gray-600" />
            </Link>
            <h1 className="font-semibold text-base text-gray-800 flex-1 text-center pr-6">Thanh toán</h1>
          </div>
          <nav className="hidden md:flex items-center gap-1.5 py-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-teal-600 transition-colors">Trang chủ</Link>
            <ChevronRight size={13} className="text-gray-300" />
            <Link href="/user/cart" className="hover:text-teal-600 transition-colors">Giỏ hàng</Link>
            <ChevronRight size={13} className="text-gray-300" />
            <span className="text-gray-800 font-medium">Thanh toán</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl py-5">
        <form id="checkout-form" onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                <h2 className="text-sm font-semibold text-gray-700">Địa chỉ nhận hàng</h2>
              </div>
              <div className="p-5 space-y-4">
                {selectedAddress ? (
                  <div className="flex items-start gap-3">
                    <MapPin size={15} className="text-teal-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-1">
                        <span className="text-sm font-semibold text-gray-900">{selectedAddress.receiverName}</span>
                        <span className="text-gray-300 text-xs">·</span>
                        <span className="text-sm text-gray-600">{selectedAddress.receiverPhone}</span>
                        {selectedAddress.isDefault && (
                          <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded font-medium">Mặc định</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">{selectedAddress.addressDetail}</p>
                    </div>
                    <button type="button" onClick={() => setIsAddressModalOpen(true)} className="text-sm text-teal-600 hover:text-teal-700 font-medium shrink-0 transition-colors">Đổi</button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center text-center">
                    <MapPin size={28} className="text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500 mb-4">Chưa có địa chỉ nhận hàng</p>
                    <button type="button" onClick={() => { setIsAddingNewAddress(true); setIsAddressModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors">
                      <Plus size={15} /> Thêm địa chỉ
                    </button>
                  </div>
                )}
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú cho shipper (tùy chọn)..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400 text-sm text-gray-700 placeholder:text-gray-400 bg-gray-50"
                />
              </div>
            </div>

            {selectedAddress && (
              <div onClick={() => { if (availableBranches.length > 1) setIsBranchModalOpen(true); }} className={`bg-white border rounded-xl overflow-hidden transition-all ${availableBranches.length > 1 && !isFindingBranch ? "cursor-pointer hover:border-teal-300" : ""} ${availableBranches.length === 0 && !isFindingBranch ? "border-red-200" : "border-gray-200"}`}>
                <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50">
                  <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                  <h2 className="text-sm font-semibold text-gray-700">Kho xuất hàng</h2>
                </div>
                <div className="px-5 py-4">
                  {isFindingBranch ? (
                    <div className="flex items-center gap-3 text-gray-400"><Loader2 size={15} className="animate-spin text-teal-500 shrink-0" /><span className="text-sm">Đang kiểm tra tồn kho tại cửa hàng...</span></div>
                  ) : availableBranches.length === 0 ? (
                    <div className="flex items-center gap-3"><AlertTriangle size={15} className="text-red-500 shrink-0" /><div><p className="text-sm font-medium text-red-700">Không có cửa hàng đủ hàng</p><p className="text-xs text-red-400 mt-0.5">Vui lòng thử lại sau hoặc liên hệ hỗ trợ</p></div></div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Store size={15} className="text-teal-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{selectedBranch?.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{getDeliveryDateText(selectedBranch?.estimatedDays)}</p>
                        </div>
                      </div>
                      {availableBranches.length > 1 && <span className="text-xs text-teal-600 font-medium flex items-center gap-0.5 shrink-0">Đổi <ChevronRight size={13} /></span>}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden transition-opacity ${!canCheckout ? "opacity-40 pointer-events-none" : ""}`}>
              <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                <h2 className="text-sm font-semibold text-gray-700">Phương thức vận chuyển</h2>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between p-3.5 border border-teal-400 bg-teal-50/40 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 border-teal-600 flex items-center justify-center shrink-0"><div className="w-2 h-2 rounded-full bg-teal-600" /></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Giao hàng tiêu chuẩn</p>
                      <p className="text-xs text-gray-400 mt-0.5">{selectedBranch ? getDeliveryDateText(selectedBranch.estimatedDays) : "Đang cập nhật..."}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{formatMoney(actualShippingFee)}</span>
                </div>
              </div>
            </div>

            <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden transition-opacity ${!canCheckout ? "opacity-40 pointer-events-none" : ""}`}>
              <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">4</span>
                <h2 className="text-sm font-semibold text-gray-700">Phương thức thanh toán</h2>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { val: "COD", label: "Thanh toán khi nhận hàng", sub: "Trả tiền mặt trực tiếp cho shipper", icon: "https://cdn-icons-png.flaticon.com/512/2331/2331941.png" },
                  { val: "PAYOS", label: "Thanh toán online (payOS)", sub: "QR Code / thẻ ATM / thẻ tín dụng", icon: "https://incanhsat.com/wp-content/uploads/2020/12/logo-payos.png" },
                ].map((pm) => (
                  <label key={pm.val} onClick={() => setPaymentMethod(pm.val)} className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all ${paymentMethod === pm.val ? "border-teal-500 bg-teal-50/40 ring-1 ring-teal-400" : "border-gray-200 hover:border-gray-300"}`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${paymentMethod === pm.val ? "border-teal-600" : "border-gray-300"}`}>
                      {paymentMethod === pm.val && <div className="w-2 h-2 rounded-full bg-teal-600" />}
                    </div>
                    <div className="w-8 h-8 relative shrink-0">
                      <Image src={pm.icon} alt={pm.val} fill className="object-contain" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{pm.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{pm.sub}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden lg:sticky lg:top-5">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50">
                <ShoppingBag size={14} className="text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-700">Đơn hàng ({cartItems.length} sản phẩm)</h2>
              </div>
              {rateLimitCooldown > 0 && (
                <div className="px-5 pt-3">
                  <div className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                    Anti-spam đang bật · thử lại sau {rateLimitCooldown}s
                  </div>
                </div>
              )}

              <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 px-4 py-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                      <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug">{item.name}</p>
                      {item.variant && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{item.variant}</p>}
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[11px] text-gray-400">×{item.quantity}</span>
                        <span className="text-xs font-semibold text-gray-800">{formatMoney(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-4 py-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(true)}
                  disabled={!canCheckout}
                  className="w-full flex items-center gap-2 px-3 py-2.5 border border-dashed border-gray-200 rounded-lg hover:border-teal-400 hover:bg-teal-50 transition-all group disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Ticket size={14} className="text-teal-600 shrink-0" />
                  <span className={`text-sm flex-1 text-left ${selectedVoucher ? "text-teal-700 font-medium" : "text-gray-400"}`}>
                    {selectedVoucher ? `${selectedVoucher.code} · -${formatMoney(voucherDiscount)}` : "Chọn mã giảm giá"}
                  </span>
                  <ChevronRight size={13} className="text-gray-300 group-hover:text-teal-500 transition-colors" />
                </button>
              </div>

              <div className="px-4 py-3 border-t border-gray-100 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tạm tính</span>
                  <span className="text-gray-800 font-medium">{formatMoney(subTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Phí vận chuyển</span>
                  <span className="text-gray-800 font-medium">{formatMoney(shippingFee)}</span>
                </div>
                {voucherDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Giảm giá</span>
                    <span className="text-teal-600 font-medium">-{formatMoney(voucherDiscount)}</span>
                  </div>
                )}
              </div>

              <div className="hidden md:block px-4 pb-5 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-gray-700">Tổng thanh toán</span>
                  <span className="text-xl font-bold text-gray-900">{formatMoney(finalTotal)}</span>
                </div>
                <button type="submit" disabled={isSubmitting || !canCheckout || rateLimitCooldown > 0} className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : rateLimitCooldown > 0 ? `Vui lòng chờ ${rateLimitCooldown}s` : <>{paymentMethod === "PAYOS" ? "Thanh toán ngay" : "Đặt hàng"} <ArrowRight size={15} /></>}
                </button>
                {rateLimitCooldown > 0 && (
                  <p className="text-center text-[11px] text-amber-600 mt-2 leading-relaxed">
                    Hệ thống đang giới hạn tần suất để chống spam. Thử lại sau {rateLimitCooldown}s.
                  </p>
                )}
                <p className="text-center text-[11px] text-gray-400 mt-3 leading-relaxed">Nhấn đặt hàng là bạn đồng ý với <span className="text-teal-600 cursor-pointer">điều khoản sử dụng</span> của AgriShrimp</p>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-30">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1">
            <p className="text-xs text-gray-400">Tổng thanh toán</p>
            <p className="text-base font-bold text-gray-900">{formatMoney(finalTotal)}</p>
          </div>
          <button type="submit" form="checkout-form" disabled={isSubmitting || !canCheckout || rateLimitCooldown > 0} className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : rateLimitCooldown > 0 ? `Chờ ${rateLimitCooldown}s` : <>{paymentMethod === "PAYOS" ? "Thanh toán ngay" : "Đặt hàng"} <ArrowRight size={14} /></>}
          </button>
        </div>
      </div>

      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsVoucherModalOpen(false)} />
          <div className="bg-white w-full sm:max-w-md relative z-10 shadow-xl rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Mã giảm giá</h3>
              <button onClick={() => setIsVoucherModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
            </div>

            <div className="px-5 py-3 border-b border-gray-100">
              <div className="flex gap-2">
                <input type="text" placeholder="Nhập mã voucher..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400 text-sm" />
                <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors">Áp dụng</button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {availableVouchers.map((voucher) => {
                const eligible = subTotal >= (voucher.minOrderValue || 0);
                const isSelected = selectedVoucher?.code === voucher.code;

                const actualValue = Number(voucher.value || voucher.discountValue || 0);

                const discountString = voucher.discountType === "PERCENT"
                  ? `${actualValue}%`
                  : `-${formatMoney(actualValue)}`;

                return (
                  <button
                    key={voucher.code}
                    onClick={() => {
                      if (!eligible) {
                        toast.error(`Đơn chưa đạt ${formatMoney(voucher.minOrderValue)}`);
                        return;
                      }
                      setSelectedVoucher(voucher);
                      setIsVoucherModalOpen(false);
                      toast.success("Áp dụng voucher thành công!");
                    }}
                    className={`w-full flex items-center gap-4 p-4 border rounded-xl text-left transition-all ${
                      isSelected ? "border-teal-500 bg-teal-50 ring-1 ring-teal-400" : eligible ? "border-gray-200 hover:border-gray-300" : "border-gray-200 opacity-50"
                    }`}
                  >
                    <div className="shrink-0 text-center min-w-[60px]">
                      <p className="text-base font-bold text-teal-600">{discountString}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{voucher.code}</p>
                    </div>
                    <div className="w-px h-10 bg-dashed bg-gray-200 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{voucher.discountType === "PERCENT" ? `Giảm ${actualValue}%` : `Giảm ${actualValue.toLocaleString("vi-VN")}đ`}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Đơn tối thiểu {formatMoney(voucher.minOrderValue)}</p>
                      {!eligible && <p className="text-xs text-red-400 mt-1">Cần thêm {formatMoney((voucher.minOrderValue || 0) - subTotal)}</p>}
                    </div>
                    {isSelected && <span className="text-teal-600 shrink-0"><CheckCircle2 size={16} /></span>}
                  </button>
                );
              })}
              {availableVouchers.length === 0 && (
                <p className="text-center py-4 text-sm text-gray-400">Không có mã giảm giá nào vào lúc này.</p>
              )}
            </div>

            {selectedVoucher && (
              <div className="px-5 py-3 border-t border-gray-100">
                <button onClick={() => { setSelectedVoucher(null); setIsVoucherModalOpen(false); }} className="w-full text-sm text-gray-400 hover:text-red-500 py-1 transition-colors">
                  Bỏ chọn voucher
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isBranchModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsBranchModalOpen(false)}
          />
          <div className="bg-white w-full sm:max-w-md relative z-10 shadow-xl rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Chọn cửa hàng xử lý đơn</h3>
              <button
                onClick={() => setIsBranchModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-400 px-5 pt-3 pb-1">
              Chỉ hiển thị cửa hàng có đủ tồn kho cho toàn bộ đơn hàng.
            </p>
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {availableBranches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => setSelectedBranchId(branch.id)}
                  className={`w-full text-left p-4 border rounded-xl transition-all ${
                    selectedBranchId === branch.id
                      ? "border-teal-500 bg-teal-50 ring-1 ring-teal-400"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 mb-0.5">{STORE_LABEL}</p>
                      <p className="text-xs text-gray-400 mb-2">Hệ thống sẽ tự sắp xếp cửa hàng phù hợp để xử lý đơn</p>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                        <Truck size={10} /> {getDeliveryDateText(branch.estimatedDays)}
                      </span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        selectedBranchId === branch.id ? "border-teal-600" : "border-gray-300"
                      }`}
                    >
                      {selectedBranchId === branch.id && (
                        <div className="w-2 h-2 rounded-full bg-teal-600" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-gray-100">
              <button
                onClick={() => setIsBranchModalOpen(false)}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddressModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsAddressModalOpen(false)}
          />
          <div
            className={`bg-white w-full relative z-10 shadow-xl rounded-t-2xl sm:rounded-2xl flex flex-col transition-all ${
              isAddingNewAddress ? "sm:max-w-2xl max-h-[95vh]" : "sm:max-w-lg max-h-[85vh]"
            }`}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                {isAddingNewAddress && (
                  <button
                    onClick={() => setIsAddingNewAddress(false)}
                    className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                <h3 className="font-semibold text-gray-800">
                  {isAddingNewAddress ? "Thêm địa chỉ mới" : "Chọn địa chỉ nhận hàng"}
                </h3>
              </div>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {!isAddingNewAddress ? (
                <div className="p-4 space-y-2">
                  {addresses.length === 0 && (
                    <p className="text-center py-8 text-sm text-gray-400">
                      Chưa có địa chỉ nào được lưu.
                    </p>
                  )}
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`w-full text-left p-4 border rounded-xl transition-all ${
                        selectedAddressId === addr.id
                          ? "border-teal-500 bg-teal-50 ring-1 ring-teal-400"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-semibold text-gray-900">
                              {addr.receiverName}
                            </span>
                            <span className="text-gray-300 text-xs">·</span>
                            <span className="text-sm text-gray-600">{addr.receiverPhone}</span>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed pr-2">
                            {addr.addressDetail}
                          </p>
                          {addr.isDefault && (
                            <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-medium text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
                              <CheckCircle2 size={9} /> Mặc định
                            </span>
                          )}
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                            selectedAddressId === addr.id ? "border-teal-600" : "border-gray-300"
                          }`}
                        >
                          {selectedAddressId === addr.id && (
                            <div className="w-2 h-2 rounded-full bg-teal-600" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => setIsAddingNewAddress(true)}
                    className="w-full mt-1 py-3.5 border-2 border-dashed border-gray-200 hover:border-teal-300 text-gray-500 hover:text-teal-600 font-medium text-sm rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <Plus size={16} /> Thêm địa chỉ mới
                  </button>
                </div>
              ) : (
                <AddressForm title="" onSubmit={handleAddNewAddress} isSubmitting={isSubmittingAddress} />
              )}
            </div>

            {!isAddingNewAddress && (
              <div className="px-5 py-4 border-t border-gray-100">
                <button
                  onClick={() => setIsAddressModalOpen(false)}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Xác nhận
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
