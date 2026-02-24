"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { cartService } from "@/app/services/cart.service";
import { useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  Trash2,
  Ticket,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

// --- INTERFACES ---
interface CartItem {
  id: number;
  variantId: number; // MỚI: Thêm variantId để gửi xuống API
  name: string;
  variant: string;
  price: number;
  quantity: number;
  stock: number;
  image: string;
  checked: boolean; // Trạng thái này lưu ở Front-end để tính tiền
}

interface Voucher {
  code: string;
  discount: number;
  description: string;
  minOrder?: number;
}

const VOUCHERS: Voucher[] = [
  { code: "AGRI15K", discount: 15000, description: "Giảm 15k phí vận chuyển", minOrder: 100000 },
  { code: "GIAM50K", discount: 50000, description: "Giảm 50k cho đơn từ 500k", minOrder: 500000 },
  { code: "CHAO20K", discount: 20000, description: "Giảm 20k cho bạn mới", minOrder: 0 },
];

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const router = useRouter();


  // 3. Cập nhật lại hàm fetchCart
  const fetchCart = async () => {
    try {
      const data = await cartService.getMyCart();
      const formattedItems = data.map((item: any) => ({
        ...item,
        checked: true 
      }));
      setItems(formattedItems);
    } catch (error: any) {
      // KIỂM TRA LỖI 401 TỪ BACKEND
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Vui lòng đăng nhập để xem giỏ hàng!");
        router.push("/login"); // ĐÁ VĂNG VỀ TRANG LOGIN
        return;
      }
      toast.error("Không thể tải giỏ hàng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // --- ACTIONS ---
  const updateQuantity = async (variantId: number, currentQty: number, delta: number, stock: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    if (newQty > stock) {
      toast.warning("Đã đạt giới hạn tồn kho!");
      return;
    }

    try {
      // 1. Gọi API cập nhật (+1 hoặc -1)
      await cartService.updateQuantity(variantId, delta);
      
      // 2. Cập nhật UI ngay lập tức cho mượt
      setItems((prev) =>
        prev.map((item) =>
          item.variantId === variantId ? { ...item, quantity: newQty } : item
        )
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi cập nhật số lượng");
    }
  };

  const removeItem = async (cartItemId: number) => {
    if (confirm("Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?")) {
      try {
        await cartService.removeItem(cartItemId);
        toast.success("Đã xóa khỏi giỏ hàng");
        setItems((prev) => prev.filter((item) => item.id !== cartItemId));
      } catch (error) {
        toast.error("Lỗi khi xóa sản phẩm");
      }
    }
  };

  const toggleCheck = (id: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const toggleCheckAll = (checked: boolean) => {
    setItems((prev) => prev.map((item) => ({ ...item, checked })));
  };

  // --- CALCULATIONS ---
  const subTotal = items.reduce(
    (sum, item) => (item.checked ? sum + item.price * item.quantity : sum),
    0,
  );
  const totalCount = items.reduce(
    (sum, item) => (item.checked ? sum + item.quantity : sum),
    0,
  );

  let discountValue = 0;
  if (selectedVoucher) {
    if (subTotal >= (selectedVoucher.minOrder || 0)) {
      discountValue = selectedVoucher.discount;
    } else {
      if (discountValue > 0) setSelectedVoucher(null);
    }
  }

  const finalTotal = Math.max(0, subTotal - discountValue);
  const isAllChecked = items.length > 0 && items.every((i) => i.checked);
  const formatMoney = (amount: number) => amount.toLocaleString("vi-VN") + " ₫";

  if (loading) {
     return <div className="container mx-auto py-16 text-center text-gray-500 animate-pulse">Đang tải giỏ hàng...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <Image
          src="https://cdn-icons-png.flaticon.com/512/11329/11329060.png"
          width={150}
          height={150}
          alt="Empty Cart"
          className="mb-6 opacity-80"
        />
        <h5 className="text-xl font-bold text-gray-500 mb-4">Giỏ hàng của bạn đang trống</h5>
        <Link href="/" className="px-6 py-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-colors font-medium">
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32 md:pb-10">
      {/* 1. Header Mobile */}
      <div className="bg-white shadow-sm sticky top-0 z-40 md:static md:shadow-none">
        <div className="container mx-auto px-4 h-14 flex items-center md:block md:h-auto md:py-4">
          <div className="flex items-center gap-3 w-full md:hidden">
            <Link href="/" className="p-1">
              <ChevronLeft size={24} className="text-gray-600" />
            </Link>
            <h1 className="font-bold text-lg text-gray-800 flex-1 text-center pr-8">
              Giỏ hàng ({totalCount})
            </h1>
          </div>
          <nav className="hidden md:flex text-sm text-gray-500 mb-6 items-center">
            <Link href="/" className="hover:text-teal-600">Trang chủ</Link>
            <span className="mx-2">/</span>
            <span className="font-bold text-gray-800">Giỏ hàng của bạn</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-4 md:mt-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: CART ITEMS */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Desktop Header */}
              <div className="hidden md:flex items-center p-4 border-b border-gray-100 bg-gray-50/50 font-semibold text-gray-700 text-sm">
                <div className="w-10 text-center">
                  <input type="checkbox" className="w-4 h-4 accent-teal-600 cursor-pointer" checked={isAllChecked} onChange={(e) => toggleCheckAll(e.target.checked)} />
                </div>
                <div className="flex-grow px-2">Sản phẩm</div>
                <div className="w-32 text-center">Đơn giá</div>
                <div className="w-32 text-center">Số lượng</div>
                <div className="w-10"></div>
              </div>

              {/* Mobile Header (Chọn tất cả) */}
              <div className="md:hidden p-3 border-b border-gray-100 flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4 accent-teal-600 cursor-pointer" checked={isAllChecked} onChange={(e) => toggleCheckAll(e.target.checked)} />
                <span className="text-sm font-medium text-gray-700">Chọn tất cả ({items.length} sản phẩm)</span>
              </div>

              {/* CART LIST */}
              <div className="divide-y divide-gray-100">
                {items.map((item) => (
                  <div key={item.id} className="relative flex p-3 md:p-4 hover:bg-gray-50 transition-colors gap-3 bg-white group">
                    {/* BUTTON XÓA */}
                    <button onClick={() => removeItem(item.id)} className="absolute top-2 right-2 p-2 text-gray-300 hover:text-red-500 transition-colors z-10 md:static md:w-10 md:flex md:justify-center">
                      <Trash2 size={18} />
                    </button>

                    {/* CHECKBOX */}
                    <div className="flex items-center justify-center shrink-0 pt-2 md:pt-0">
                      <input type="checkbox" className="w-4 h-4 accent-teal-600 cursor-pointer" checked={item.checked} onChange={() => toggleCheck(item.id)} />
                    </div>

                    {/* IMAGE */}
                    <div className="w-20 h-20 relative border rounded bg-gray-50 shrink-0">
                      <Image src={item.image || "https://aquashield.com.vn/storage/uploads/noidung/aqua-pure-0.jpg"} alt={item.name} fill className="object-cover" />
                    </div>

                    {/* CONTENT AREA */}
                    <div className="flex-grow flex flex-col justify-between w-[calc(100%-120px)] md:w-auto md:flex-row md:items-center">
                      <div className="pr-6 md:pr-0 md:flex-grow md:w-auto">
                        <Link href="#" className="text-sm font-medium text-gray-800 hover:text-teal-600 line-clamp-2 mb-1">
                          {item.name}
                        </Link>
                        <div className="text-[10px] md:text-xs text-gray-500 bg-gray-100 inline-block px-2 py-0.5 rounded-full mb-1">
                          {item.variant}
                        </div>
                        <div className="text-[10px] md:text-xs text-orange-500 md:hidden">Còn lại: {item.stock}</div>
                      </div>

                      <div className="mt-2 md:mt-0 flex items-center justify-between md:justify-start md:w-64">
                        <div className="text-sm font-bold text-teal-700 md:w-32 md:text-center">
                          {formatMoney(item.price)}
                        </div>

                        <div className="flex items-center md:w-32 md:justify-center">
                          <div className="flex items-center border border-gray-300 rounded overflow-hidden h-8 bg-white shadow-sm">
                            <button onClick={() => updateQuantity(item.variantId, item.quantity, -1, item.stock)} className="w-8 h-full flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors text-gray-600">
                              <Minus size={14} />
                            </button>
                            <input type="number" className="w-10 h-full text-center text-sm font-semibold border-x border-gray-200 focus:outline-none" value={item.quantity} readOnly />
                            <button onClick={() => updateQuantity(item.variantId, item.quantity, 1, item.stock)} className="w-8 h-full flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors text-gray-600">
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SUMMARY */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 md:sticky md:top-24">
              <h5 className="font-bold text-base md:text-lg text-gray-800 mb-4 md:mb-6">Chi tiết thanh toán</h5>

              {/* Voucher Selector */}
              <div onClick={() => setIsVoucherModalOpen(true)} className="flex items-center justify-between p-3 border border-dashed border-teal-300 bg-teal-50 rounded-lg cursor-pointer hover:bg-teal-100 transition-colors mb-4 md:mb-6 group">
                <div className="flex items-center gap-3 overflow-hidden">
                  <Ticket className="text-teal-600 shrink-0" size={18} />
                  <span className={`text-sm font-medium truncate ${selectedVoucher ? "text-teal-700" : "text-gray-600"}`}>
                    {selectedVoucher ? selectedVoucher.code : "Chọn Voucher"}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-teal-600 font-bold whitespace-nowrap">
                  {selectedVoucher ? "Đổi" : "Chọn mã"} <ChevronRight size={14} />
                </div>
              </div>

              {/* Summary Rows */}
              <div className="space-y-2 mb-4 md:mb-6 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính ({totalCount} món):</span>
                  <span className="font-medium text-gray-900">{formatMoney(subTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Giảm giá:</span>
                  <span className="font-medium text-green-600">-{formatMoney(discountValue)}</span>
                </div>
              </div>

              {/* Desktop Buttons */}
              <div className="hidden md:block">
                <div className="border-t border-gray-100 pt-4 mb-6">
                  <div className="flex justify-between items-end">
                    <span className="font-bold text-gray-800">Tổng cộng:</span>
                    <div className="text-right">
                      <div className="text-xl font-extrabold text-teal-600">{formatMoney(finalTotal)}</div>
                      <div className="text-xs text-gray-400 mt-1">(Đã bao gồm VAT)</div>
                    </div>
                  </div>
                </div>
                <Link href="/user/checkout" className={`block w-full py-3.5 rounded-xl text-center font-bold text-white transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 ${totalCount > 0 ? "bg-gradient-to-r from-teal-500 to-green-600" : "bg-gray-300 cursor-not-allowed pointer-events-none"}`}>
                  TIẾN HÀNH THANH TOÁN
                </Link>
              </div>
            </div>
          </div>

          {/* MOBILE STICKY BOTTOM BAR */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <div className="flex gap-3 items-center">
              <div className="flex flex-col flex-1">
                <span className="text-xs text-gray-500 text-right">Tổng thanh toán</span>
                <span className="text-lg font-extrabold text-teal-600 text-right">{formatMoney(finalTotal)}</span>
              </div>
              <Link href="/user/checkout" className={`w-1/2 flex items-center justify-center font-bold py-3 rounded-lg shadow-sm active:scale-95 transition-transform text-white ${totalCount > 0 ? "bg-gradient-to-r from-teal-600 to-green-600" : "bg-gray-300 pointer-events-none"}`}>
                MUA HÀNG ({totalCount})
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* --- VOUCHER MODAL --- */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsVoucherModalOpen(false)}></div>
          <div className="bg-white w-full sm:w-full sm:max-w-md relative z-10 overflow-hidden shadow-2xl rounded-t-2xl sm:rounded-2xl animate-in slide-in-from-bottom duration-300 sm:zoom-in-95 flex flex-col max-h-[80vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
              <h5 className="font-bold text-base sm:text-lg text-gray-800">AgriShrimp Voucher</h5>
              <button onClick={() => setIsVoucherModalOpen(false)} className="p-1"><ChevronRight size={20} className="text-gray-500 rotate-90 sm:rotate-0" /></button>
            </div>
            <div className="p-4 overflow-y-auto bg-gray-50/50 flex-grow">
              <div className="flex gap-2 mb-4">
                <input type="text" placeholder="Nhập mã..." className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-teal-500 text-sm" />
                <button className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-lg uppercase">Áp dụng</button>
              </div>
              <div className="space-y-3 pb-8 sm:pb-0">
                {VOUCHERS.map((voucher) => (
                  <div key={voucher.code} onClick={() => {
                      if (subTotal >= (voucher.minOrder || 0)) {
                        setSelectedVoucher(voucher);
                        setIsVoucherModalOpen(false);
                      } else {
                        toast.error(`Đơn chưa đạt ${formatMoney(voucher.minOrder || 0)}`);
                      }
                    }}
                    className={`relative flex bg-white border rounded-lg overflow-hidden cursor-pointer transition-all active:scale-[0.98] ${selectedVoucher?.code === voucher.code ? "border-teal-500 ring-1 ring-teal-500 bg-teal-50" : "border-gray-200"} ${subTotal < (voucher.minOrder || 0) ? "opacity-60 grayscale" : ""}`}
                  >
                    <div className="w-20 sm:w-24 bg-teal-600 text-white flex flex-col items-center justify-center p-2 text-center shrink-0 relative">
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-gray-100 rounded-full"></div>
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full z-10"></div>
                      <div className="border-r border-dashed border-white/30 h-full absolute right-0 top-0"></div>
                      <span className="text-[9px] font-bold">AGRISHRIMP</span>
                      <span className="text-xs font-bold mt-1">{voucher.code}</span>
                    </div>
                    <div className="p-2 sm:p-3 flex-grow flex flex-col justify-center">
                      <div className="font-bold text-gray-800 text-xs sm:text-sm">{voucher.description}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 mt-1">Đơn tối thiểu: {formatMoney(voucher.minOrder || 0)}</div>
                      <div className="flex justify-between items-end mt-2">
                        <span className="text-[9px] text-gray-400">HSD: 30/12</span>
                        {subTotal < (voucher.minOrder || 0) && (<span className="text-[9px] text-red-500 font-medium">Chưa đủ điều kiện</span>)}
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