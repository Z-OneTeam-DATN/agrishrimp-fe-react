'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin,
  Truck,
  CreditCard,
  ChevronRight,
  Plus,
  X,
  StickyNote,
  Ticket, // Icon Voucher
  Gift,   // Icon Voucher
  UserCheck // Icon Voucher
} from 'lucide-react';

// --- MOCK DATA ---
const CART_ITEMS = [
  {
    id: 1,
    name: 'Florfenicol kết hợp Oxytetracycline',
    variant: '500g/túi',
    price: 250000,
    quantity: 1,
    image: 'https://aquashield.com.vn/storage/uploads/noidung/aqua-pure-0.jpg',
  },
  {
    id: 2,
    name: 'Men vi sinh xử lý đáy cao cấp - Super Clean',
    variant: '1kg/gói',
    price: 320000,
    quantity: 2,
    image: 'https://aquashield.com.vn/storage/uploads/noidung/aqua-pure-0.jpg',
  },
];

const ADDRESSES = [
  {
    id: 1,
    name: 'Võ Thị Mỹ Thanh',
    phone: '0909 123 456',
    address: '123 Đường 3/2, Phường Xuân Khánh, Quận Ninh Kiều, Thành phố Cần Thơ',
    type: 'Nhà riêng',
    isDefault: true,
  },
  {
    id: 2,
    name: 'Thanh Võ (Công ty)',
    phone: '0939 999 777',
    address: 'Tòa nhà FPT Polytechnic, Đường số 22, Quận Cái Răng, Thành phố Cần Thơ',
    type: 'Văn phòng',
    isDefault: false,
  },
];

const SHIPPING_METHODS = [
  { id: 'fast', name: 'Giao hàng nhanh', date: 'Nhận hàng vào 26/01', price: 15000 },
  { id: 'express', name: 'Hỏa tốc 2H', date: 'Nhận hàng trong ngày', price: 35000 },
];

// Dữ liệu Voucher
interface Voucher {
  code: string;
  discount: number;
  description: string;
  minOrder?: number;
}

const VOUCHERS: Voucher[] = [
  { code: 'AGRI15K', discount: 15000, description: 'Giảm 15k phí vận chuyển', minOrder: 100000 },
  { code: 'GIAM50K', discount: 50000, description: 'Giảm 50k cho đơn từ 500k', minOrder: 500000 },
  { code: 'CHAO20K', discount: 20000, description: 'Giảm 20k cho bạn mới', minOrder: 0 },
];

export default function CheckoutPage() {
  // --- STATES ---
  const [selectedAddressId, setSelectedAddressId] = useState<number>(1);
  const [shippingMethodId, setShippingMethodId] = useState<string>('fast');
  const [paymentMethod, setPaymentMethod] = useState<string>('COD');

  // Voucher State
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  // Modals State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  // --- CALCULATIONS ---
  const selectedAddress = ADDRESSES.find(a => a.id === selectedAddressId) || ADDRESSES[0];
  const selectedShipping = SHIPPING_METHODS.find(s => s.id === shippingMethodId) || SHIPPING_METHODS[0];

  const subTotal = CART_ITEMS.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Tính toán giảm giá Voucher
  let voucherDiscount = 0;
  if (selectedVoucher) {
    if (subTotal >= (selectedVoucher.minOrder || 0)) {
      voucherDiscount = selectedVoucher.discount;
    } else {
       // Nếu không đủ điều kiện (ví dụ do xóa sp) thì reset voucher
       if(selectedVoucher) setSelectedVoucher(null);
    }
  }

  const shippingFee = selectedShipping.price;
  const finalTotal = Math.max(0, subTotal + shippingFee - voucherDiscount);

  // Helper formatting
  const formatMoney = (amount: number) => amount.toLocaleString('vi-VN') + ' ₫';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">

        {/* 1. Breadcrumb */}
        <nav className="text-sm mb-6 text-gray-500">
            <Link href="/" className="hover:text-teal-600">Trang chủ</Link>
            <span className="mx-2">/</span>
            <Link href="/user/cart" className="hover:text-teal-600">Giỏ hàng</Link>
            <span className="mx-2">/</span>
            <span className="font-bold text-gray-800">Thanh toán</span>
        </nav>

        <form onSubmit={(e) => { e.preventDefault(); alert('Đặt hàng thành công!'); }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* === LEFT COLUMN: INFO & OPTIONS === */}
          <div className="lg:col-span-2 space-y-6">

            {/* A. ĐỊA CHỈ NHẬN HÀNG */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
               <h5 className="font-bold text-gray-800 flex items-center gap-2 mb-4 text-lg">
                  <MapPin className="text-red-500" /> Địa chỉ nhận hàng
               </h5>

               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div>
                     <div className="font-bold text-gray-800 mb-1">
                        {selectedAddress.name}
                        <span className="mx-2 font-normal text-gray-300">|</span>
                        <span className="text-teal-700">{selectedAddress.phone}</span>
                     </div>
                     <div className="text-sm text-gray-600 leading-relaxed">
                        {selectedAddress.address}
                     </div>
                     <div className="mt-2 inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-500">
                        {selectedAddress.type}
                     </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(true)}
                    className="mt-3 sm:mt-0 text-teal-600 font-bold text-sm hover:underline shrink-0"
                  >
                    Thay đổi
                  </button>
               </div>

               <div className="mt-4">
                  <label className="text-sm font-bold text-gray-700 mb-2 block flex items-center gap-2">
                     <StickyNote size={16} /> Ghi chú (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
               </div>
            </div>

            {/* B. PHƯƠNG THỨC VẬN CHUYỂN */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
               <h5 className="font-bold text-gray-800 flex items-center gap-2 mb-4 text-lg">
                  <Truck className="text-blue-600" /> Phương thức vận chuyển
               </h5>

               <div className="space-y-3">
                  {SHIPPING_METHODS.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${shippingMethodId === method.id ? 'border-teal-600 bg-teal-50 ring-1 ring-teal-600' : 'border-gray-200 hover:border-teal-400'}`}
                    >
                       <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shipping"
                            checked={shippingMethodId === method.id}
                            onChange={() => setShippingMethodId(method.id)}
                            className="w-5 h-5 accent-teal-600"
                          />
                          <div>
                             <div className="font-bold text-gray-800 text-sm">{method.name}</div>
                             <div className="text-xs text-gray-500">{method.date}</div>
                          </div>
                       </div>
                       <div className="font-bold text-gray-900">{formatMoney(method.price)}</div>
                    </label>
                  ))}
               </div>
            </div>

            {/* C. PHƯƠNG THỨC THANH TOÁN */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
               <h5 className="font-bold text-gray-800 flex items-center gap-2 mb-4 text-lg">
                  <CreditCard className="text-orange-500" /> Phương thức thanh toán
               </h5>

               <div className="space-y-3">
                  {/* COD */}
                  <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-teal-600 bg-teal-50 ring-1 ring-teal-600' : 'border-gray-200 hover:border-teal-400'}`}>
                     <input
                       type="radio"
                       name="payment"
                       value="COD"
                       checked={paymentMethod === 'COD'}
                       onChange={(e) => setPaymentMethod(e.target.value)}
                       className="w-5 h-5 accent-teal-600 shrink-0"
                     />
                     <div className="ml-4 mr-4 w-10 h-10 relative shrink-0">
                        <Image src="https://cdn-icons-png.flaticon.com/512/2331/2331941.png" alt="COD" fill className="object-contain"/>
                     </div>
                     <div>
                        <div className="font-bold text-gray-800 text-sm">Thanh toán khi nhận hàng (COD)</div>
                        <div className="text-xs text-gray-500">Thanh toán tiền mặt cho shipper khi nhận hàng</div>
                     </div>
                  </label>

                  {/* VNPAY */}
                  <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'VNPAY' ? 'border-teal-600 bg-teal-50 ring-1 ring-teal-600' : 'border-gray-200 hover:border-teal-400'}`}>
                     <input
                       type="radio"
                       name="payment"
                       value="VNPAY"
                       checked={paymentMethod === 'VNPAY'}
                       onChange={(e) => setPaymentMethod(e.target.value)}
                       className="w-5 h-5 accent-teal-600 shrink-0"
                     />
                     <div className="ml-4 mr-4 w-10 h-10 relative shrink-0">
                        <Image src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Icon-VNPAY-QR.png" alt="VNPAY" fill className="object-contain"/>
                     </div>
                     <div>
                        <div className="font-bold text-gray-800 text-sm">Ví điện tử VNPAY / QR Code</div>
                        <div className="text-xs text-gray-500">Quét mã QR để thanh toán nhanh chóng</div>
                     </div>
                  </label>

                  {/* BANKING */}
                  <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'BANK' ? 'border-teal-600 bg-teal-50 ring-1 ring-teal-600' : 'border-gray-200 hover:border-teal-400'}`}>
                     <input
                       type="radio"
                       name="payment"
                       value="BANK"
                       checked={paymentMethod === 'BANK'}
                       onChange={(e) => setPaymentMethod(e.target.value)}
                       className="w-5 h-5 accent-teal-600 shrink-0"
                     />
                     <div className="ml-4 mr-4 w-10 h-10 relative shrink-0">
                        <Image src="https://cdn-icons-png.flaticon.com/512/2534/2534204.png" alt="Banking" fill className="object-contain"/>
                     </div>
                     <div>
                        <div className="font-bold text-gray-800 text-sm">Chuyển khoản ngân hàng</div>
                        <div className="text-xs text-gray-500">Chuyển khoản trực tiếp tới STK công ty</div>
                     </div>
                  </label>
               </div>
            </div>

          </div>

          {/* === RIGHT COLUMN: SUMMARY === */}
          <div className="lg:col-span-1">
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <h5 className="font-bold text-lg text-gray-800 mb-4 pb-3 border-b border-gray-100">
                   Đơn hàng ({CART_ITEMS.length} sản phẩm)
                </h5>

                {/* List Items (Mini) */}
                <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                   {CART_ITEMS.map((item) => (
                      <div key={item.id} className="flex gap-3">
                         <div className="w-12 h-12 relative border rounded bg-gray-50 shrink-0">
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                         </div>
                         <div className="flex-grow">
                            <div className="text-sm font-medium text-gray-800 line-clamp-2">{item.name}</div>
                            <div className="flex justify-between items-center mt-1">
                               <span className="text-xs text-gray-500">x{item.quantity}</span>
                               <span className="text-sm font-bold text-gray-900">{formatMoney(item.price)}</span>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>

                {/* --- PHẦN CHỌN VOUCHER --- */}
                <div
                  onClick={() => setIsVoucherModalOpen(true)}
                  className="flex items-center justify-between p-3 border border-dashed border-teal-300 bg-teal-50 rounded-lg cursor-pointer hover:bg-teal-100 transition-colors mb-6 group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Ticket className="text-teal-600 shrink-0" size={20} />
                    <span className={`text-sm font-medium truncate ${selectedVoucher ? 'text-teal-700' : 'text-gray-600'}`}>
                      {selectedVoucher ? selectedVoucher.code : 'Chọn Voucher'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-teal-600 font-bold whitespace-nowrap">
                    {selectedVoucher ? 'Đổi' : 'Chọn mã'} <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Calculation */}
                <div className="border-t border-gray-100 pt-4 space-y-3 mb-6">
                   <div className="flex justify-between text-sm text-gray-600">
                      <span>Tạm tính:</span>
                      <span className="font-bold text-gray-900">{formatMoney(subTotal)}</span>
                   </div>
                   <div className="flex justify-between text-sm text-gray-600">
                      <span>Phí vận chuyển:</span>
                      <span className="font-bold text-gray-900">{formatMoney(shippingFee)}</span>
                   </div>
                   <div className="flex justify-between text-sm text-gray-600">
                      <span>Voucher giảm giá:</span>
                      <span className="font-bold text-green-600">-{formatMoney(voucherDiscount)}</span>
                   </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mb-6">
                   <div className="flex justify-between items-end">
                      <span className="font-bold text-gray-800">Tổng thanh toán:</span>
                      <span className="text-xl font-extrabold text-teal-600">{formatMoney(finalTotal)}</span>
                   </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-green-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  ĐẶT HÀNG
                </button>

                <p className="text-center mt-4 text-[11px] text-gray-400">
                   Nhấn "Đặt hàng" đồng nghĩa với việc bạn đồng ý tuân theo <Link href="#" className="underline hover:text-teal-600">Điều khoản AgriShrimp</Link>
                </p>
             </div>
          </div>

        </form>
      </div>

      {/* === MODAL ĐỊA CHỈ === */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsAddressModalOpen(false)}></div>
           <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">

              <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
                 <h5 className="font-bold text-lg text-gray-800 uppercase">
                    {isAddingNewAddress ? 'Thêm địa chỉ mới' : 'Chọn địa chỉ nhận hàng'}
                 </h5>
                 <button onClick={() => setIsAddressModalOpen(false)}><X className="text-gray-400 hover:text-gray-900" /></button>
              </div>

              <div className="p-4 overflow-y-auto flex-grow bg-white">
                 {!isAddingNewAddress ? (
                    <>
                       <div className="space-y-3">
                          {ADDRESSES.map((addr) => (
                             <label
                               key={addr.id}
                               className={`block p-4 border rounded-xl cursor-pointer relative ${selectedAddressId === addr.id ? 'border-teal-600 bg-teal-50' : 'border-gray-200 hover:border-teal-300'}`}
                               onClick={() => setSelectedAddressId(addr.id)}
                             >
                                <div className="absolute top-4 right-4">
                                   <input type="radio" name="modalAddr" checked={selectedAddressId === addr.id} readOnly className="w-4 h-4 accent-teal-600" />
                                </div>
                                <div className="flex items-center gap-2 mb-1">
                                   <span className="font-bold text-gray-900 text-sm">{addr.name}</span>
                                   {addr.isDefault && <span className="text-[10px] bg-gray-100 text-teal-700 border border-teal-200 px-1.5 rounded">Mặc định</span>}
                                </div>
                                <div className="text-sm text-gray-500 mb-1">{addr.phone}</div>
                                <div className="text-sm text-gray-600 line-clamp-2">{addr.address}</div>
                             </label>
                          ))}
                       </div>

                       <button
                         onClick={() => setIsAddingNewAddress(true)}
                         className="w-full mt-4 py-3 border-2 border-dashed border-teal-200 text-teal-700 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-teal-50 transition-colors"
                       >
                          <Plus size={18} /> Thêm địa chỉ mới
                       </button>
                    </>
                 ) : (
                    /* VIEW 2: FORM THÊM MỚI */
                    <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="text-xs font-bold text-gray-700 mb-1 block">Họ và tên <span className="text-red-500">*</span></label>
                             <input type="text" placeholder="Nhập họ tên" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-teal-500 outline-none" />
                          </div>
                          <div>
                             <label className="text-xs font-bold text-gray-700 mb-1 block">Số điện thoại <span className="text-red-500">*</span></label>
                             <input type="text" placeholder="Nhập SĐT" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-teal-500 outline-none" />
                          </div>
                       </div>

                       <div className="grid grid-cols-3 gap-3">
                          <div>
                             <label className="text-xs font-bold text-gray-700 mb-1 block">Tỉnh/Thành</label>
                             <select className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white"><option>Cần Thơ</option></select>
                          </div>
                          <div>
                             <label className="text-xs font-bold text-gray-700 mb-1 block">Quận/Huyện</label>
                             <select className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white"><option>Ninh Kiều</option></select>
                          </div>
                          <div>
                             <label className="text-xs font-bold text-gray-700 mb-1 block">Phường/Xã</label>
                             <select className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white"><option>Xuân Khánh</option></select>
                          </div>
                       </div>

                       <div>
                          <label className="text-xs font-bold text-gray-700 mb-1 block">Địa chỉ cụ thể <span className="text-red-500">*</span></label>
                          <textarea rows={2} placeholder="Số nhà, tên đường..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-teal-500 outline-none"></textarea>
                       </div>

                       <div>
                          <label className="text-xs font-bold text-gray-700 mb-2 block">Loại địa chỉ:</label>
                          <div className="flex gap-4">
                             <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="type" className="accent-teal-600" defaultChecked /> <span className="text-sm">Nhà riêng</span>
                             </label>
                             <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="type" className="accent-teal-600" /> <span className="text-sm">Văn phòng</span>
                             </label>
                          </div>
                       </div>

                       <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500" />
                          <span className="text-sm text-gray-600">Đặt làm địa chỉ mặc định</span>
                       </label>
                    </div>
                 )}
              </div>

              {/* FOOTER ACTIONS */}
              <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
                 {!isAddingNewAddress ? (
                    <>
                       <button onClick={() => setIsAddressModalOpen(false)} className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Hủy</button>
                       <button onClick={() => setIsAddressModalOpen(false)} className="px-5 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm">Xác nhận</button>
                    </>
                 ) : (
                    <>
                       <button onClick={() => setIsAddingNewAddress(false)} className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Trở lại</button>
                       <button onClick={() => { setIsAddingNewAddress(false); }} className="px-5 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm">Hoàn thành</button>
                    </>
                 )}
              </div>

           </div>
        </div>
      )}

      {/* --- VOUCHER MODAL --- */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsVoucherModalOpen(false)}></div>
          <div className="bg-white rounded-2xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">

            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
               <h5 className="font-bold text-lg text-gray-800">Chọn AgriShrimp Voucher</h5>
               <button onClick={() => setIsVoucherModalOpen(false)} className="text-gray-400 hover:text-gray-900"><div className="w-6 h-6 flex items-center justify-center">✕</div></button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto bg-gray-50/50">
               <div className="mb-4">
                  <input type="text" placeholder="Nhập mã giảm giá" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
               </div>

               <p className="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wider">Mã của bạn</p>

               <div className="space-y-3">
                  {VOUCHERS.map((voucher) => (
                    <div
                      key={voucher.code}
                      onClick={() => {
                         if (subTotal >= (voucher.minOrder || 0)) {
                           setSelectedVoucher(voucher);
                           setIsVoucherModalOpen(false);
                         } else {
                           alert(`Đơn hàng chưa đạt tối thiểu ${formatMoney(voucher.minOrder || 0)}`);
                         }
                      }}
                      className={`relative flex bg-white border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md group ${selectedVoucher?.code === voucher.code ? 'border-teal-500 ring-1 ring-teal-500 bg-teal-50' : 'border-gray-200'} ${subTotal < (voucher.minOrder || 0) ? 'opacity-60 grayscale' : ''}`}
                    >
                       <div className="w-24 bg-teal-600 text-white flex flex-col items-center justify-center p-2 text-center shrink-0 relative">
                          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-50 rounded-full"></div>
                          <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-50 rounded-full z-10"></div>
                          <div className="border-r border-dashed border-white/30 h-full absolute right-0 top-0"></div>

                          {voucher.code === 'AGRI15K' && <Truck size={24} className="mb-1" />}
                          {voucher.code === 'GIAM50K' && <Gift size={24} className="mb-1" />}
                          {voucher.code === 'CHAO20K' && <UserCheck size={24} className="mb-1" />}
                          <span className="text-[10px] font-bold">AGRISHRIMP</span>
                       </div>
                       <div className="p-3 flex-grow flex flex-col justify-center">
                          <div className="font-bold text-gray-800 text-sm">{voucher.description}</div>
                          <div className="text-xs text-gray-500 mt-1">Đơn tối thiểu: {formatMoney(voucher.minOrder || 0)}</div>
                          <div className="text-[10px] text-gray-400 mt-auto pt-1">HSD: 30/12/2026</div>
                       </div>

                       {selectedVoucher?.code === voucher.code && (
                         <div className="absolute top-2 right-2 text-teal-600">
                           <div className="w-4 h-4 bg-teal-600 rounded-full flex items-center justify-center text-white text-[10px]">✓</div>
                         </div>
                       )}
                    </div>
                  ))}
               </div>
            </div>

            <div className="p-4 border-t bg-white flex justify-end gap-3">
               <button
                 onClick={() => { setSelectedVoucher(null); setIsVoucherModalOpen(false); }}
                 className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
               >
                 Bỏ chọn
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}