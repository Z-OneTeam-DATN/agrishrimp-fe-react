'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, Ticket, ChevronRight, Truck, Gift, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CartItem {
  id: number;
  name: string;
  variant: string;
  price: number;
  quantity: number;
  image: string;
  stock: number;
  checked: boolean;
}

interface Voucher {
  code: string;
  discount: number;
  description: string;
  minOrder?: number;
}


const INITIAL_CART: CartItem[] = [
  {
    id: 1,
    name: 'Florfenicol kết hợp Oxytetracycline',
    variant: '500g/túi',
    price: 250000,
    quantity: 1,
    stock: 54,
    image: 'https://aquashield.com.vn/storage/uploads/noidung/aqua-pure-0.jpg',
    checked: true,
  },
  {
    id: 2,
    name: 'Men vi sinh xử lý đáy cao cấp - Super Clean',
    variant: '1kg/gói',
    price: 320000,
    quantity: 2,
    stock: 12,
    image: 'https://aquashield.com.vn/storage/uploads/noidung/aqua-pure-0.jpg',
    checked: true,
  },
];

const VOUCHERS: Voucher[] = [
  { code: 'AGRI15K', discount: 15000, description: 'Giảm 15k phí vận chuyển', minOrder: 100000 },
  { code: 'GIAM50K', discount: 50000, description: 'Giảm 50k cho đơn từ 500k', minOrder: 500000 },
  { code: 'CHAO20K', discount: 20000, description: 'Giảm 20k cho bạn mới', minOrder: 0 },
];

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(INITIAL_CART);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  // --- ACTIONS ---

  // Thay đổi số lượng
  const updateQuantity = (id: number, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty < 1) return item;
        if (newQty > item.stock) {
          alert('Đã đạt giới hạn tồn kho!');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  // Chọn/Bỏ chọn sản phẩm
  const toggleCheck = (id: number) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  // Chọn tất cả
  const toggleCheckAll = (checked: boolean) => {
    setItems(prev => prev.map(item => ({ ...item, checked })));
  };

  // Xóa sản phẩm
  const removeItem = (id: number) => {
    if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // --- CALCULATIONS ---
  const subTotal = items.reduce((sum, item) => item.checked ? sum + (item.price * item.quantity) : sum, 0);
  const totalCount = items.reduce((sum, item) => item.checked ? sum + item.quantity : sum, 0);

  // Logic giảm giá (kiểm tra điều kiện đơn tối thiểu)
  let discountValue = 0;
  if (selectedVoucher) {
    if (subTotal >= (selectedVoucher.minOrder || 0)) {
      discountValue = selectedVoucher.discount;
    } else {
       // Nếu tổng tiền không đủ điều kiện voucher thì tự bỏ voucher
       if(discountValue > 0) setSelectedVoucher(null);
    }
  }

  const finalTotal = Math.max(0, subTotal - discountValue);
  const isAllChecked = items.length > 0 && items.every(i => i.checked);

  // Định dạng tiền tệ
  const formatMoney = (amount: number) => amount.toLocaleString('vi-VN') + ' ₫';

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <Image src="https://cdn-icons-png.flaticon.com/512/11329/11329060.png" width={150} height={150} alt="Empty Cart" className="mb-6 opacity-80" />
        <h5 className="text-xl font-bold text-gray-500 mb-4">Giỏ hàng của bạn đang trống</h5>
        <Link href="/" className="px-6 py-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-colors font-medium">
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">

        {/* Breadcrumb */}
        <nav className="text-sm mb-6 text-gray-500">
            <Link href="/" className="hover:text-teal-600">Trang chủ</Link>
            <span className="mx-2">/</span>
            <span className="font-bold text-gray-800">Giỏ hàng của bạn</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN: CART ITEMS */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

              {/* Header của bảng (Desktop) */}
              <div className="hidden md:flex items-center p-4 border-b border-gray-100 bg-gray-50/50 font-semibold text-gray-700 text-sm">
                <div className="w-10 text-center">
                  <input type="checkbox" className="w-4 h-4 accent-teal-600 cursor-pointer" checked={isAllChecked} onChange={(e) => toggleCheckAll(e.target.checked)} />
                </div>
                <div className="flex-grow px-2">Sản phẩm</div>
                <div className="w-32 text-center">Đơn giá</div>
                <div className="w-32 text-center">Số lượng</div>
                <div className="w-10"></div>
              </div>

              {/* Danh sách items */}
              <div className="divide-y divide-gray-100">
                {items.map((item) => (
                  <div key={item.id} className="flex flex-wrap md:flex-nowrap items-center p-4 hover:bg-gray-50 transition-colors gap-4">

                    {/* Checkbox */}
                    <div className="w-full md:w-10 flex md:justify-center items-center gap-3 md:gap-0">
                       <input
                         type="checkbox"
                         className="w-4 h-4 accent-teal-600 cursor-pointer"
                         checked={item.checked}
                         onChange={() => toggleCheck(item.id)}
                        />
                        <span className="md:hidden text-sm font-medium text-gray-700">Chọn sản phẩm</span>
                    </div>

                    {/* Image & Info */}
                    <div className="flex-grow flex items-center gap-4 w-full md:w-auto">
                      <div className="w-20 h-20 relative border rounded-md overflow-hidden shrink-0">
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      </div>
                      <div>
                        <Link href="#" className="text-sm font-medium text-gray-800 hover:text-teal-600 line-clamp-2 mb-1">
                          {item.name}
                        </Link>
                        <div className="text-xs text-gray-500 bg-gray-100 inline-block px-2 py-0.5 rounded-full mb-1">
                          {item.variant}
                        </div>
                        <div className="text-xs text-orange-500">Còn lại: {item.stock}</div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="w-full md:w-32 md:text-center flex justify-between md:block items-center pl-10 md:pl-0">
                       <span className="md:hidden text-sm text-gray-500">Đơn giá:</span>
                       <span className="font-bold text-gray-900">{formatMoney(item.price)}</span>
                    </div>

                    {/* Quantity Control */}
                    <div className="w-full md:w-32 flex justify-center pl-10 md:pl-0 justify-end md:justify-center">
                       <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden h-9">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-full flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors">
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            className="w-12 h-full text-center text-sm border-x border-gray-300 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={item.quantity}
                            readOnly
                          />
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-full flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors">
                            <Plus size={14} />
                          </button>
                       </div>
                    </div>

                    {/* Delete Button */}
                    <div className="w-10 flex justify-end md:justify-center">
                     <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2">
                       <Trash2 size={18} />
                     </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SUMMARY */}
          <div className="lg:col-span-1">
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <h5 className="font-bold text-lg text-gray-800 mb-6">Thanh toán</h5>

                {/* Voucher Selector */}
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

                {/* Summary Rows */}
                <div className="space-y-3 mb-6 text-sm">
                   <div className="flex justify-between text-gray-600">
                      <span>Tạm tính ({totalCount} sản phẩm):</span>
                      <span className="font-medium text-gray-900">{formatMoney(subTotal)}</span>
                   </div>
                   <div className="flex justify-between text-gray-600">
                      <span>Giảm giá:</span>
                      <span className="font-medium text-green-600">-{formatMoney(discountValue)}</span>
                   </div>
                   <div className="flex justify-between text-gray-600">
                      <span>Thuế VAT:</span>
                      <span className="text-gray-900">Đã bao gồm</span>
                   </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mb-6">
                   <div className="flex justify-between items-end">
                      <span className="font-bold text-gray-800">Tổng cộng:</span>
                      <div className="text-right">
                         <div className="text-xl font-extrabold text-teal-600">{formatMoney(finalTotal)}</div>
                         <div className="text-xs text-gray-400 mt-1">(Đã bao gồm VAT)</div>
                      </div>
                   </div>
                </div>

                <Link
                  href="/user/checkout" // Thay đổi đường dẫn này thành trang thanh toán của bạn
                  className={`block w-full py-3.5 rounded-xl text-center font-bold text-white transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 ${totalCount > 0 ? 'bg-gradient-to-r from-teal-500 to-green-600' : 'bg-gray-300 cursor-not-allowed pointer-events-none'}`}
                >
                  MUA HÀNG ({totalCount})
                </Link>
             </div>
          </div>

        </div>
      </div>

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
                          {/* Trang trí lỗ voucher */}
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