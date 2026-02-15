"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Truck,
  CreditCard,
  ChevronRight,
  Plus,
  X,
  StickyNote,
  Ticket,
  Gift,
  UserCheck,
  ChevronLeft,
  ShoppingBag,
} from "lucide-react";

// --- MOCK DATA ---
const CART_ITEMS = [
  {
    id: 1,
    name: "Florfenicol kết hợp Oxytetracycline",
    variant: "500g/túi",
    price: 250000,
    quantity: 1,
    image: "https://aquashield.com.vn/storage/uploads/noidung/aqua-pure-0.jpg",
  },
  {
    id: 2,
    name: "Men vi sinh xử lý đáy cao cấp - Super Clean",
    variant: "1kg/gói",
    price: 320000,
    quantity: 2,
    image: "https://aquashield.com.vn/storage/uploads/noidung/aqua-pure-0.jpg",
  },
];

const ADDRESSES = [
  {
    id: 1,
    name: "Võ Thị Mỹ Thanh",
    phone: "0909 123 456",
    address:
      "123 Đường 3/2, Phường Xuân Khánh, Quận Ninh Kiều, Thành phố Cần Thơ",
    type: "Nhà riêng",
    isDefault: true,
  },
  {
    id: 2,
    name: "Thanh Võ (Công ty)",
    phone: "0939 999 777",
    address:
      "Tòa nhà FPT Polytechnic, Đường số 22, Quận Cái Răng, Thành phố Cần Thơ",
    type: "Văn phòng",
    isDefault: false,
  },
];

const SHIPPING_METHODS = [
  {
    id: "fast",
    name: "Giao hàng nhanh",
    date: "Nhận hàng vào 26/01",
    price: 15000,
  },
  {
    id: "express",
    name: "Hỏa tốc 2H",
    date: "Nhận hàng trong ngày",
    price: 35000,
  },
];

interface Voucher {
  code: string;
  discount: number;
  description: string;
  minOrder?: number;
}

const VOUCHERS: Voucher[] = [
  {
    code: "AGRI15K",
    discount: 15000,
    description: "Giảm 15k phí vận chuyển",
    minOrder: 100000,
  },
  {
    code: "GIAM50K",
    discount: 50000,
    description: "Giảm 50k cho đơn từ 500k",
    minOrder: 500000,
  },
  {
    code: "CHAO20K",
    discount: 20000,
    description: "Giảm 20k cho bạn mới",
    minOrder: 0,
  },
];

export default function CheckoutPage() {
  const [selectedAddressId, setSelectedAddressId] = useState<number>(1);
  const [shippingMethodId, setShippingMethodId] = useState<string>("fast");
  const [paymentMethod, setPaymentMethod] = useState<string>("COD");
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  // Modals
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  // Calculations
  const selectedAddress =
    ADDRESSES.find((a) => a.id === selectedAddressId) || ADDRESSES[0];
  const selectedShipping =
    SHIPPING_METHODS.find((s) => s.id === shippingMethodId) ||
    SHIPPING_METHODS[0];
  const subTotal = CART_ITEMS.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  let voucherDiscount = 0;
  if (selectedVoucher) {
    if (subTotal >= (selectedVoucher.minOrder || 0)) {
      voucherDiscount = selectedVoucher.discount;
    } else {
      if (selectedVoucher) setSelectedVoucher(null);
    }
  }

  const shippingFee = selectedShipping.price;
  const finalTotal = Math.max(0, subTotal + shippingFee - voucherDiscount);
  const formatMoney = (amount: number) => amount.toLocaleString("vi-VN") + " ₫";

  return (
    <div className="min-h-screen bg-gray-50 pb-32 md:pb-10">
      {" "}
      {/* Padding bottom lớn cho mobile để tránh bị che bởi thanh Sticky */}
      {/* 1. Header Mobile & Breadcrumb Desktop */}
      <div className="bg-white shadow-sm sticky top-0 z-40 md:static md:shadow-none">
        <div className="container mx-auto px-4 h-14 flex items-center md:block md:h-auto md:py-4">
          {/* Mobile Header */}
          <div className="flex items-center gap-3 w-full md:hidden">
            <Link href="/user/cart" className="p-1">
              <ChevronLeft size={24} className="text-gray-600" />
            </Link>
            <h1 className="font-bold text-lg text-gray-800 flex-1 text-center pr-8">
              Thanh toán
            </h1>
          </div>

          {/* Desktop Breadcrumb */}
          <nav className="hidden md:flex text-sm text-gray-500 mb-6 items-center">
            <Link href="/" className="hover:text-teal-600">
              Trang chủ
            </Link>
            <span className="mx-2">/</span>
            <Link href="/user/cart" className="hover:text-teal-600">
              Giỏ hàng
            </Link>
            <span className="mx-2">/</span>
            <span className="font-bold text-gray-800">Thanh toán</span>
          </nav>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-4 md:mt-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert("Đặt hàng thành công!");
          }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8"
        >
          {/* === LEFT COLUMN === */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* A. ĐỊA CHỈ NHẬN HÀNG */}
            <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
              <h5 className="font-bold text-gray-800 flex items-center gap-2 mb-3 md:mb-4 text-base md:text-lg">
                <MapPin className="text-red-500" size={20} /> Địa chỉ nhận hàng
              </h5>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 p-3 md:p-4 rounded-lg border border-gray-200">
                <div className="w-full">
                  <div className="font-bold text-gray-800 mb-1 flex flex-wrap gap-2 items-center">
                    {selectedAddress.name}
                    <span className="hidden sm:inline font-normal text-gray-300">
                      |
                    </span>
                    <span className="text-teal-700 block sm:inline">
                      {selectedAddress.phone}
                    </span>
                  </div>
                  <div className="text-xs md:text-sm text-gray-600 leading-relaxed mb-2">
                    {selectedAddress.address}
                  </div>
                  <div className="flex justify-between items-center w-full">
                    <div className="inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-500">
                      {selectedAddress.type}
                    </div>
                    {/* Mobile Change Button moved here for easier access */}
                    <button
                      type="button"
                      onClick={() => setIsAddressModalOpen(true)}
                      className="text-teal-600 font-bold text-xs md:text-sm hover:underline shrink-0 sm:hidden"
                    >
                      Thay đổi
                    </button>
                  </div>
                </div>
                {/* Desktop Change Button */}
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(true)}
                  className="hidden sm:block mt-3 sm:mt-0 text-teal-600 font-bold text-sm hover:underline shrink-0"
                >
                  Thay đổi
                </button>
              </div>

              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Ghi chú cho Shipper (Tùy chọn)..."
                  className="w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm"
                />
              </div>
            </div>

            {/* B. PHƯƠNG THỨC VẬN CHUYỂN */}
            <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
              <h5 className="font-bold text-gray-800 flex items-center gap-2 mb-3 md:mb-4 text-base md:text-lg">
                <Truck className="text-blue-600" size={20} /> Vận chuyển
              </h5>
              <div className="space-y-3">
                {SHIPPING_METHODS.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center justify-between p-3 md:p-4 border rounded-lg md:rounded-xl cursor-pointer transition-all ${shippingMethodId === method.id ? "border-teal-600 bg-teal-50 ring-1 ring-teal-600" : "border-gray-200"}`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping"
                        checked={shippingMethodId === method.id}
                        onChange={() => setShippingMethodId(method.id)}
                        className="w-4 h-4 md:w-5 md:h-5 accent-teal-600"
                      />
                      <div>
                        <div className="font-bold text-gray-800 text-sm">
                          {method.name}
                        </div>
                        <div className="text-[11px] md:text-xs text-gray-500">
                          {method.date}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-gray-900 text-sm md:text-base">
                      {formatMoney(method.price)}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* C. PHƯƠNG THỨC THANH TOÁN */}
            <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
              <h5 className="font-bold text-gray-800 flex items-center gap-2 mb-3 md:mb-4 text-base md:text-lg">
                <CreditCard className="text-orange-500" size={20} /> Thanh toán
              </h5>
              <div className="space-y-3">
                {[
                  {
                    val: "COD",
                    label: "Thanh toán khi nhận hàng (COD)",
                    sub: "Tiền mặt khi nhận hàng",
                    icon: "https://cdn-icons-png.flaticon.com/512/2331/2331941.png",
                  },
                  {
                    val: "VNPAY",
                    label: "Ví VNPAY / QR Code",
                    sub: "Quét mã QR tiện lợi",
                    icon: "https://cdn.haitrieu.com/wp-content/uploads/2022/10/Icon-VNPAY-QR.png",
                  },
                  {
                    val: "BANK",
                    label: "Chuyển khoản ngân hàng",
                    sub: "Chuyển khoản 24/7",
                    icon: "https://cdn-icons-png.flaticon.com/512/2534/2534204.png",
                  },
                ].map((pm) => (
                  <label
                    key={pm.val}
                    className={`flex items-center p-3 md:p-4 border rounded-lg md:rounded-xl cursor-pointer transition-all ${paymentMethod === pm.val ? "border-teal-600 bg-teal-50 ring-1 ring-teal-600" : "border-gray-200"}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={pm.val}
                      checked={paymentMethod === pm.val}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 md:w-5 md:h-5 accent-teal-600 shrink-0"
                    />
                    <div className="ml-3 mr-3 w-8 h-8 md:w-10 md:h-10 relative shrink-0">
                      <Image
                        src={pm.icon}
                        alt={pm.val}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 text-sm">
                        {pm.label}
                      </div>
                      <div className="text-[11px] md:text-xs text-gray-500">
                        {pm.sub}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* === RIGHT COLUMN: SUMMARY === */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 md:sticky md:top-24">
              <h5 className="font-bold text-base md:text-lg text-gray-800 mb-3 md:mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <ShoppingBag size={18} className="md:hidden" /> Đơn hàng (
                {CART_ITEMS.length})
              </h5>

              {/* List Items */}
              <div className="space-y-4 mb-4 md:mb-6 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {CART_ITEMS.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-12 md:w-14 md:h-14 relative border rounded bg-gray-50 shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <div className="text-xs md:text-sm font-medium text-gray-800 line-clamp-2">
                        {item.name}
                      </div>
                      <div className="text-[10px] md:text-xs text-gray-500 mt-0.5">
                        {item.variant}
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">
                          x{item.quantity}
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatMoney(item.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Voucher Selector */}
              <div
                onClick={() => setIsVoucherModalOpen(true)}
                className="flex items-center justify-between p-3 border border-dashed border-teal-300 bg-teal-50 rounded-lg cursor-pointer hover:bg-teal-100 transition-colors mb-4 md:mb-6 group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <Ticket className="text-teal-600 shrink-0" size={18} />
                  <span
                    className={`text-sm font-medium truncate ${selectedVoucher ? "text-teal-700" : "text-gray-600"}`}
                  >
                    {selectedVoucher ? selectedVoucher.code : "Agri Voucher"}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-teal-600 font-bold whitespace-nowrap">
                  {selectedVoucher ? "Đổi" : "Chọn mã"}{" "}
                  <ChevronRight size={14} />
                </div>
              </div>

              {/* Calculation */}
              <div className="border-t border-gray-100 pt-3 space-y-2 mb-4 md:mb-6">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tạm tính:</span>
                  <span className="font-bold text-gray-900">
                    {formatMoney(subTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Phí vận chuyển:</span>
                  <span className="font-bold text-gray-900">
                    {formatMoney(shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Giảm giá:</span>
                  <span className="font-bold text-green-600">
                    -{formatMoney(voucherDiscount)}
                  </span>
                </div>
              </div>

              {/* Mobile: Chỉ hiện các thông tin chi tiết, Nút đặt hàng sẽ nằm ở Sticky Bar */}
              {/* Desktop: Hiện nút đặt hàng ở đây */}
              <div className="hidden md:block">
                <div className="border-t border-gray-100 pt-4 mb-6">
                  <div className="flex justify-between items-end">
                    <span className="font-bold text-gray-800">
                      Tổng thanh toán:
                    </span>
                    <span className="text-xl font-extrabold text-teal-600">
                      {formatMoney(finalTotal)}
                    </span>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-green-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  ĐẶT HÀNG
                </button>
                <p className="text-center mt-4 text-[11px] text-gray-400">
                  Nhấn "Đặt hàng" đồng nghĩa với việc bạn đồng ý tuân theo{" "}
                  <Link href="#" className="underline hover:text-teal-600">
                    Điều khoản
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* === MOBILE STICKY BOTTOM BAR (QUAN TRỌNG) === */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <div className="flex gap-3 items-center">
              <div className="flex flex-col flex-1">
                <span className="text-xs text-gray-500 text-right">
                  Tổng thanh toán
                </span>
                <span className="text-lg font-extrabold text-red-600 text-right">
                  {formatMoney(finalTotal)}
                </span>
              </div>
              <button
                type="submit"
                className="w-1/2 bg-gradient-to-r from-teal-600 to-green-600 text-white font-bold py-3 rounded-lg shadow-sm active:scale-95 transition-transform"
              >
                ĐẶT HÀNG
              </button>
            </div>
          </div>
        </form>
      </div>
      {/* === MODAL ĐỊA CHỈ (Responsive Bottom Sheet) === */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsAddressModalOpen(false)}
          ></div>

          {/* Modal Content - Mobile: Bottom Sheet, Desktop: Center Modal */}
          <div className="bg-white w-full sm:w-auto sm:max-w-lg relative z-10 overflow-hidden shadow-2xl rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300 sm:zoom-in-95">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
              <h5 className="font-bold text-base sm:text-lg text-gray-800 uppercase">
                {isAddingNewAddress ? "Thêm địa chỉ" : "Địa chỉ nhận hàng"}
              </h5>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="p-1"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-grow bg-white overscroll-contain">
              {!isAddingNewAddress ? (
                <>
                  <div className="space-y-3">
                    {ADDRESSES.map((addr) => (
                      <label
                        key={addr.id}
                        className={`block p-3 sm:p-4 border rounded-xl cursor-pointer relative transition-colors ${selectedAddressId === addr.id ? "border-teal-600 bg-teal-50/50" : "border-gray-200"}`}
                        onClick={() => setSelectedAddressId(addr.id)}
                      >
                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                          <input
                            type="radio"
                            name="modalAddr"
                            checked={selectedAddressId === addr.id}
                            readOnly
                            className="w-4 h-4 accent-teal-600"
                          />
                        </div>
                        <div className="flex items-center gap-2 mb-1 pr-6">
                          <span className="font-bold text-gray-900 text-sm truncate">
                            {addr.name}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[9px] sm:text-[10px] bg-gray-100 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded whitespace-nowrap">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 mb-1">
                          {addr.phone}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                          {addr.address}
                        </div>
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={() => setIsAddingNewAddress(true)}
                    className="w-full mt-4 py-3 border-2 border-dashed border-teal-200 text-teal-700 font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-teal-50 transition-colors"
                  >
                    <Plus size={18} /> Thêm địa chỉ mới
                  </button>
                </>
              ) : (
                /* FORM THÊM MỚI */
                <div className="space-y-3 sm:space-y-4 pb-10 sm:pb-0">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-700 mb-1 block">
                        Họ tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-teal-500"
                        placeholder="Tên của bạn"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 mb-1 block">
                        SĐT <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-teal-500"
                        placeholder="09xxx"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">
                      Địa chỉ cụ thể <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-teal-500"
                      placeholder="Số nhà, đường..."
                    ></textarea>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-2 block">
                      Loại địa chỉ:
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="type"
                          className="accent-teal-600"
                          defaultChecked
                        />{" "}
                        <span className="text-sm">Nhà riêng</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="type"
                          className="accent-teal-600"
                        />{" "}
                        <span className="text-sm">Công ty</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* FOOTER ACTIONS */}
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 shrink-0 pb-8 sm:pb-4">
              {!isAddingNewAddress ? (
                <button
                  onClick={() => setIsAddressModalOpen(false)}
                  className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-white bg-teal-600 rounded-lg shadow-sm active:bg-teal-700"
                >
                  Xác nhận
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsAddingNewAddress(false)}
                    className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-lg"
                  >
                    Trở lại
                  </button>
                  <button
                    onClick={() => setIsAddingNewAddress(false)}
                    className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-bold text-white bg-teal-600 rounded-lg shadow-sm"
                  >
                    Hoàn thành
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* --- VOUCHER MODAL (Responsive Bottom Sheet) --- */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsVoucherModalOpen(false)}
          ></div>
          <div className="bg-white w-full sm:w-full sm:max-w-md relative z-10 overflow-hidden shadow-2xl rounded-t-2xl sm:rounded-2xl animate-in slide-in-from-bottom duration-300 sm:zoom-in-95 flex flex-col max-h-[80vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
              <h5 className="font-bold text-base sm:text-lg text-gray-800">
                AgriShrimp Voucher
              </h5>
              <button
                onClick={() => setIsVoucherModalOpen(false)}
                className="p-1"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto bg-gray-50/50 flex-grow">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Nhập mã..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-teal-500 text-sm"
                />
                <button className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-lg uppercase">
                  Áp dụng
                </button>
              </div>

              <div className="space-y-3 pb-8 sm:pb-0">
                {VOUCHERS.map((voucher) => (
                  <div
                    key={voucher.code}
                    onClick={() => {
                      if (subTotal >= (voucher.minOrder || 0)) {
                        setSelectedVoucher(voucher);
                        setIsVoucherModalOpen(false);
                      } else {
                        alert(
                          `Đơn chưa đạt ${formatMoney(voucher.minOrder || 0)}`,
                        );
                      }
                    }}
                    className={`relative flex bg-white border rounded-lg overflow-hidden cursor-pointer transition-all active:scale-[0.98] ${selectedVoucher?.code === voucher.code ? "border-teal-500 ring-1 ring-teal-500 bg-teal-50" : "border-gray-200"} ${subTotal < (voucher.minOrder || 0) ? "opacity-60 grayscale" : ""}`}
                  >
                    <div className="w-20 sm:w-24 bg-teal-600 text-white flex flex-col items-center justify-center p-2 text-center shrink-0 relative">
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-gray-100 rounded-full"></div>
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full z-10"></div>
                      <div className="border-r border-dashed border-white/30 h-full absolute right-0 top-0"></div>
                      <span className="text-[9px] font-bold">AGRISHRIMP</span>
                      <span className="text-xs font-bold mt-1">
                        {voucher.code}
                      </span>
                    </div>
                    <div className="p-2 sm:p-3 flex-grow flex flex-col justify-center">
                      <div className="font-bold text-gray-800 text-xs sm:text-sm">
                        {voucher.description}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500 mt-1">
                        Đơn tối thiểu: {formatMoney(voucher.minOrder || 0)}
                      </div>
                      <div className="flex justify-between items-end mt-2">
                        <span className="text-[9px] text-gray-400">
                          HSD: 30/12
                        </span>
                        {subTotal < (voucher.minOrder || 0) && (
                          <span className="text-[9px] text-red-500 font-medium">
                            Chưa đủ điều kiện
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
