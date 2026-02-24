"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cartService } from "@/app/services/cart.service";
import { orderService } from "@/app/services/order.service";
import { addressService } from "@/app/services/address.service";
import { branchService } from "@/app/services/branchService";
import AddressForm from "@/components/profile/AddressForm";
import {
  MapPin,
  Truck,
  CreditCard,
  ChevronRight,
  Plus,
  X,
  Ticket,
  ChevronLeft,
  ShoppingBag,
  Store,
  Loader2,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

// --- MOCK DATA ---
const SHIPPING_METHODS = [
  { id: "fast", name: "Giao hàng nhanh", price: 15000 },
  { id: "express", name: "Hỏa tốc 2H", price: 35000 },
];

interface Voucher {
  code: string;
  discount: number;
  description: string;
  minOrder?: number;
}

const VOUCHERS: Voucher[] = [
  { code: "AGRI15K", discount: 15000, description: "Giảm 15k phí vận chuyển", minOrder: 100000 },
  { code: "GIAM50K", discount: 50000, description: "Giảm 50k cho đơn từ 500k", minOrder: 500000 },
];

// --- INTERFACE CHI NHÁNH ---
interface Branch {
  id: number;
  name: string;
  provinceId: string;
  addressDetail: string;
  estimatedDays?: number; // Sẽ được tính toán động
}

export default function CheckoutPage() {
  const router = useRouter();

  // States UI & Logic
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);
  const [note, setNote] = useState("");

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [shippingMethodId, setShippingMethodId] = useState<string>("fast");
  const [paymentMethod, setPaymentMethod] = useState<string>("COD");
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  // ✅ STATES QUẢN LÝ CHI NHÁNH (KHO XUẤT HÀNG)
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [isFindingBranch, setIsFindingBranch] = useState(false);

  // Modals
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);

  // --- FETCH DỮ LIỆU GIỎ HÀNG VÀ ĐỊA CHỈ ---
  const fetchCheckoutData = async () => {
    try {
      setLoading(true);
      const [cartData, addressData] = await Promise.all([
        cartService.getMyCart(),
        addressService.getAll()
      ]);

      if (cartData.length === 0) {
        toast.warning("Giỏ hàng rỗng, vui lòng chọn sản phẩm!");
        router.push("/user/cart");
        return;
      }

      setCartItems(cartData);
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

  useEffect(() => {
    fetchCheckoutData();
  }, [router]);

  // Lấy địa chỉ đang được chọn
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  // --- ✅ LOGIC GỌI API TÌM KHO GẦN NHẤT & CÓ ĐỦ HÀNG ---
  useEffect(() => {
    if (!selectedAddress || cartItems.length === 0) return;

    const findEligibleBranches = async () => {
      setIsFindingBranch(true);
      try {
        // Chuẩn bị payload gửi lên check-stock
        const payload = cartItems.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity
        }));

        // GỌI API THẬT
        const branchesFromAPI = await branchService.checkStock(payload);

        // Tính toán thời gian giao hàng dựa vào Tỉnh của User và Tỉnh của Chi Nhánh
        const processedBranches = branchesFromAPI.map((branch: any) => {
          // Ép kiểu provinceId về string để so sánh cho an toàn
          const branchProvince = String(branch.provinceId);
          const userProvince = String(selectedAddress.provinceId);
          
          // Nếu cùng ID tỉnh -> Giao trong ngày (1 ngày)
          // Khác tỉnh -> Giao từ 3 ngày
          const estimated = branchProvince === userProvince ? 1 : 3;
          return { ...branch, estimatedDays: estimated };
        });

        // Sắp xếp: Ưu tiên chi nhánh giao nhanh nhất (gần nhất) lên đầu
        processedBranches.sort((a: Branch, b: Branch) => (a.estimatedDays || 0) - (b.estimatedDays || 0));

        setAvailableBranches(processedBranches);
        
        // Tự động chọn chi nhánh tối ưu nhất (nằm ở đầu mảng)
        if (processedBranches.length > 0) {
          setSelectedBranchId(processedBranches[0].id);
        } else {
          setSelectedBranchId(null);
        }

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
  }, [selectedAddressId, addresses, cartItems]); // Chạy lại khi đổi địa chỉ HOẶC đổi giỏ hàng

  // Lấy chi nhánh đang được chọn
  const selectedBranch = availableBranches.find(b => b.id === selectedBranchId);

  // --- ACTIONS XỬ LÝ ĐỊA CHỈ ---
  const handleAddNewAddress = async (data: any) => {
    setIsSubmittingAddress(true);
    try {
      const payload = {
        receiverName: data.fullName,
        receiverPhone: data.phone,
        addressDetail: data.specificAddress,
        provinceId: Number(data.provinceId),
        districtId: Number(data.districtId),
        wardId: Number(data.wardId),
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

  // --- CALCULATIONS ---
  const selectedShipping = SHIPPING_METHODS.find((s) => s.id === shippingMethodId) || SHIPPING_METHODS[0];
  const subTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let voucherDiscount = 0;
  if (selectedVoucher) {
    if (subTotal >= (selectedVoucher.minOrder || 0)) {
      voucherDiscount = selectedVoucher.discount;
    } else {
      if (selectedVoucher) setSelectedVoucher(null);
    }
  }

  // Phí ship: Nếu cùng tỉnh = 15k, khác tỉnh = 35k (Tự động thay đổi giá ship)
  let actualShippingFee = selectedShipping.price;
  if (selectedAddress && selectedBranch) {
    actualShippingFee = selectedBranch.estimatedDays === 1 ? 15000 : 35000;
  }
  
  const shippingFee = selectedAddress && selectedBranch ? actualShippingFee : 0; 
  const finalTotal = Math.max(0, subTotal + shippingFee - voucherDiscount);
  const formatMoney = (amount: number) => amount.toLocaleString("vi-VN") + " ₫";

  // Tạo text hiển thị ngày nhận hàng dự kiến
  const getDeliveryDateText = (days?: number) => {
    if (!days) return "Đang cập nhật";
    if (days === 1) return "Dự kiến nhận hàng trong ngày";
    return `Dự kiến nhận hàng sau ${days} ngày`;
  };

  // --- HÀM SUBMIT ĐẶT HÀNG LÊN BACKEND ---
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!selectedAddress) {
      toast.error("Vui lòng chọn địa chỉ nhận hàng!");
      return;
    }

    if (!selectedBranchId) {
      toast.error("Không có chi nhánh nào đủ hàng. Vui lòng thử lại sau!");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        shippingAddress: selectedAddress.addressDetail, 
        phone: selectedAddress.receiverPhone, // Map từ DTO address sang DTO order
        fullName: selectedAddress.receiverName, // Map từ DTO address sang DTO order
        note: note,
        voucherCode: selectedVoucher ? selectedVoucher.code : null,
        branchId: selectedBranchId, // Đã gửi ID kho xuống
        items: cartItems.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      };

      console.log("Dữ liệu gửi xuống Backend:", payload); // In ra để Huy dễ debug

      await orderService.checkout(payload);
      
      toast.success("🎉 Đặt hàng thành công! Cảm ơn bạn.");
      router.push("/"); 
      router.refresh();
      
    } catch (error: any) {
      console.error("Toàn bộ lỗi API:", error);
      console.error("URL đã gọi:", error.config?.url);
      
      const errData = error.response?.data;
      const errMsg = typeof errData === 'object' ? (errData.detail || errData.message) : (errData || "Lỗi xử lý đặt hàng!");
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-[60vh] flex flex-col items-center justify-center text-teal-600 gap-3"><Loader2 className="animate-spin" size={32} /><span className="font-bold text-gray-500 text-sm">Đang thiết lập thanh toán...</span></div>;
  }

  // Cờ kiểm tra có thể đặt hàng không
  const canCheckout = selectedAddress && selectedBranchId && !isFindingBranch;

  return (
    <div className="min-h-screen bg-gray-50 pb-32 md:pb-10">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40 md:static md:shadow-none">
        <div className="container mx-auto px-4 h-14 flex items-center md:block md:h-auto md:py-4">
          <div className="flex items-center gap-3 w-full md:hidden">
            <Link href="/user/cart" className="p-1"><ChevronLeft size={24} className="text-gray-600" /></Link>
            <h1 className="font-bold text-lg text-gray-800 flex-1 text-center pr-8">Thanh toán</h1>
          </div>
          <nav className="hidden md:flex text-sm text-gray-500 mb-6 items-center">
            <Link href="/" className="hover:text-teal-600">Trang chủ</Link><span className="mx-2">/</span>
            <Link href="/user/cart" className="hover:text-teal-600">Giỏ hàng</Link><span className="mx-2">/</span>
            <span className="font-bold text-gray-800">Thanh toán</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-4 md:mt-0">
        <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          
          {/* === CỘT TRÁI === */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            
            {/* 1. ĐỊA CHỈ NHẬN HÀNG */}
            <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
              <h5 className="font-bold text-gray-800 flex items-center gap-2 mb-3 md:mb-4 text-base md:text-lg">
                <MapPin className="text-red-500" size={20} /> Địa chỉ nhận hàng
              </h5>
              
              {selectedAddress ? (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 p-3 md:p-4 rounded-lg border border-gray-200">
                  <div className="w-full pr-4">
                    <div className="font-bold text-gray-800 mb-1 flex flex-wrap gap-2 items-center">
                      {selectedAddress.receiverName}
                      <span className="hidden sm:inline font-normal text-gray-300">|</span>
                      <span className="text-teal-700 block sm:inline">{selectedAddress.receiverPhone}</span>
                      {selectedAddress.isDefault && (
                        <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200">Mặc định</span>
                      )}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600 leading-relaxed">
                      {selectedAddress.addressDetail}
                    </div>
                    <button type="button" onClick={() => setIsAddressModalOpen(true)} className="mt-2 text-teal-600 font-bold text-xs hover:underline shrink-0 sm:hidden">
                      Đổi địa chỉ
                    </button>
                  </div>
                  <button type="button" onClick={() => setIsAddressModalOpen(true)} className="hidden sm:block text-teal-600 font-bold text-sm hover:underline shrink-0">
                    Đổi địa chỉ
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 text-center">
                  <MapPin className="text-gray-400 mb-2" size={32} />
                  <p className="text-sm text-gray-600 mb-4">Bạn chưa có địa chỉ nhận hàng nào</p>
                  <button type="button" onClick={() => { setIsAddingNewAddress(true); setIsAddressModalOpen(true); }} className="px-5 py-2 bg-teal-600 text-white font-bold text-sm rounded-lg hover:bg-teal-700 transition-colors shadow-sm flex items-center gap-2">
                    <Plus size={16} /> Thêm địa chỉ mới
                  </button>
                </div>
              )}

              <div className="mt-4">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú cho Shipper (Tùy chọn)..."
                  className="w-full px-3 py-2 md:px-4 md:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm"
                />
              </div>
            </div>

            {/* ✅ 2. KHU VỰC THÔNG BÁO VÀ CHỌN KHO XUẤT HÀNG */}
            {selectedAddress && (
              <div 
                onClick={() => { if (availableBranches.length > 0) setIsBranchModalOpen(true); }}
                className={`border rounded-lg md:rounded-xl p-4 flex items-center justify-between relative overflow-hidden transition-all group ${
                  isFindingBranch ? "bg-gray-50 border-gray-200" 
                  : availableBranches.length === 0 ? "bg-red-50/80 border-red-200 cursor-not-allowed" 
                  : "bg-indigo-50/80 border-indigo-200 cursor-pointer hover:bg-indigo-100/60"
                }`}
              >
                {!isFindingBranch && availableBranches.length > 0 && <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>}
                
                <div className="flex gap-3 flex-1 pr-4">
                  {isFindingBranch ? (
                     <Loader2 className="text-gray-400 mt-0.5 shrink-0 animate-spin" size={20} />
                  ) : availableBranches.length === 0 ? (
                     <AlertTriangle className="text-red-500 mt-0.5 shrink-0" size={20} />
                  ) : (
                     <Store className="text-indigo-600 mt-0.5 shrink-0" size={20} />
                  )}

                  <div>
                    <h6 className={`text-sm font-bold mb-1 flex items-center gap-2 ${availableBranches.length === 0 ? 'text-red-800' : 'text-indigo-900'}`}>
                      {isFindingBranch ? "Đang điều phối kho..." : 
                       availableBranches.length === 0 ? "Chưa có chi nhánh đủ hàng" : 
                       "Kho xuất hàng dự kiến"}
                    </h6>
                    <p className={`text-xs leading-relaxed ${availableBranches.length === 0 ? 'text-red-600' : 'text-indigo-700'}`}>
                      {isFindingBranch ? "Vui lòng đợi hệ thống kiểm tra tồn kho tại các chi nhánh." : 
                       availableBranches.length === 0 ? "Rất tiếc, các chi nhánh hiện không đủ tồn kho cho toàn bộ đơn hàng này." : 
                       <>Sẽ xuất từ <strong className="text-indigo-900">{selectedBranch?.name}</strong>. {getDeliveryDateText(selectedBranch?.estimatedDays)}</>}
                    </p>
                  </div>
                </div>
                
                {!isFindingBranch && availableBranches.length > 1 && (
                  <div className="flex items-center gap-1 text-xs text-indigo-600 font-bold whitespace-nowrap shrink-0 group-hover:text-indigo-800 transition-colors">
                    Thay đổi <ChevronRight size={14} />
                  </div>
                )}
              </div>
            )}

            {/* 3. VẬN CHUYỂN */}
            <div className={`bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 transition-all ${!canCheckout ? 'opacity-50 pointer-events-none' : ''}`}>
              <h5 className="font-bold text-gray-800 flex items-center gap-2 mb-3 md:mb-4 text-base md:text-lg">
                <Truck className="text-blue-600" size={20} /> Vận chuyển
              </h5>
              <div className="space-y-3">
                {/* Ẩn bớt phương thức khác, chỉ giữ lại 1 cái vì giá ship đã tính động */}
                <label className="flex items-center justify-between p-3 md:p-4 border rounded-lg md:rounded-xl cursor-pointer transition-all border-teal-600 bg-teal-50 ring-1 ring-teal-600">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="shipping" checked={true} readOnly className="w-4 h-4 md:w-5 md:h-5 accent-teal-600" />
                    <div>
                      <div className="font-bold text-gray-800 text-sm">Giao hàng tiêu chuẩn</div>
                      <div className="text-[11px] md:text-xs text-gray-500">
                         {selectedBranch ? getDeliveryDateText(selectedBranch.estimatedDays) : "Đang cập nhật..."}
                      </div>
                    </div>
                  </div>
                  <div className="font-bold text-gray-900 text-sm md:text-base">{formatMoney(actualShippingFee)}</div>
                </label>
              </div>
            </div>

            {/* 4. THANH TOÁN */}
            <div className={`bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 transition-all ${!canCheckout ? 'opacity-50 pointer-events-none' : ''}`}>
              <h5 className="font-bold text-gray-800 flex items-center gap-2 mb-3 md:mb-4 text-base md:text-lg">
                <CreditCard className="text-orange-500" size={20} /> Thanh toán
              </h5>
              <div className="space-y-3">
                {[
                  { val: "COD", label: "Thanh toán khi nhận hàng (COD)", sub: "Tiền mặt khi nhận hàng", icon: "https://cdn-icons-png.flaticon.com/512/2331/2331941.png" },
                  { val: "VNPAY", label: "Ví VNPAY / QR Code", sub: "Quét mã QR tiện lợi", icon: "https://cdn.haitrieu.com/wp-content/uploads/2022/10/Icon-VNPAY-QR.png" },
                ].map((pm) => (
                  <label key={pm.val} className={`flex items-center p-3 md:p-4 border rounded-lg md:rounded-xl cursor-pointer transition-all ${paymentMethod === pm.val ? "border-teal-600 bg-teal-50 ring-1 ring-teal-600" : "border-gray-200"}`}>
                    <input type="radio" name="payment" value={pm.val} checked={paymentMethod === pm.val} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 md:w-5 md:h-5 accent-teal-600 shrink-0" />
                    <div className="ml-3 mr-3 w-8 h-8 md:w-10 md:h-10 relative shrink-0">
                      <Image src={pm.icon} alt={pm.val} fill className="object-contain" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 text-sm">{pm.label}</div>
                      <div className="text-[11px] md:text-xs text-gray-500">{pm.sub}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* === CỘT PHẢI: SUMMARY === */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 md:sticky md:top-24">
              <h5 className="font-bold text-base md:text-lg text-gray-800 mb-3 md:mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <ShoppingBag size={18} className="md:hidden" /> Đơn hàng ({cartItems.length})
              </h5>

              <div className="space-y-4 mb-4 md:mb-6 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-12 md:w-14 md:h-14 relative border rounded bg-gray-50 shrink-0">
                      <Image src={item.image || "https://aquashield.com.vn/storage/uploads/noidung/aqua-pure-0.jpg"} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-grow">
                      <div className="text-xs md:text-sm font-medium text-gray-800 line-clamp-2">{item.name}</div>
                      <div className="text-[10px] md:text-xs text-gray-500 mt-0.5">{item.variant}</div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">x{item.quantity}</span>
                        <span className="text-sm font-bold text-gray-900">{formatMoney(item.price)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Voucher */}
              <div onClick={() => setIsVoucherModalOpen(true)} className={`flex items-center justify-between p-3 border border-dashed border-teal-300 bg-teal-50 rounded-lg cursor-pointer hover:bg-teal-100 transition-colors mb-4 md:mb-6 group ${!canCheckout ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center gap-3 overflow-hidden">
                  <Ticket className="text-teal-600 shrink-0" size={18} />
                  <span className={`text-sm font-medium truncate ${selectedVoucher ? "text-teal-700" : "text-gray-600"}`}>
                    {selectedVoucher ? selectedVoucher.code : "Agri Voucher"}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-teal-600 font-bold whitespace-nowrap">
                  {selectedVoucher ? "Đổi" : "Chọn mã"} <ChevronRight size={14} />
                </div>
              </div>

              {/* Tính tiền */}
              <div className="border-t border-gray-100 pt-3 space-y-2 mb-4 md:mb-6">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tạm tính:</span>
                  <span className="font-bold text-gray-900">{formatMoney(subTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Phí vận chuyển:</span>
                  <span className="font-bold text-gray-900">{formatMoney(shippingFee)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Giảm giá:</span>
                  <span className="font-bold text-green-600">-{formatMoney(voucherDiscount)}</span>
                </div>
              </div>

              {/* Desktop Button */}
              <div className="hidden md:block">
                <div className="border-t border-gray-100 pt-4 mb-6">
                  <div className="flex justify-between items-end">
                    <span className="font-bold text-gray-800">Tổng thanh toán:</span>
                    <div className="text-right">
                      <div className="text-xl font-extrabold text-teal-600">{formatMoney(finalTotal)}</div>
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting || !canCheckout} className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-green-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "ĐẶT HÀNG"}
                </button>
              </div>
            </div>
          </div>

          {/* MOBILE STICKY BOTTOM BAR */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <div className="flex gap-3 items-center">
              <div className="flex flex-col flex-1">
                <span className="text-xs text-gray-500 text-right">Tổng thanh toán</span>
                <span className="text-lg font-extrabold text-red-600 text-right">{formatMoney(finalTotal)}</span>
              </div>
              <button type="submit" disabled={isSubmitting || !canCheckout} className="w-1/2 flex items-center justify-center bg-gradient-to-r from-teal-600 to-green-600 text-white font-bold py-3 rounded-lg shadow-sm active:scale-95 transition-transform disabled:opacity-50">
                 {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "ĐẶT HÀNG"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* --- CÁC MODALS --- */}

      {/* ✅ MODAL CHỌN CHI NHÁNH XUẤT HÀNG */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsBranchModalOpen(false)}></div>
          <div className="bg-white w-full sm:max-w-md relative z-10 overflow-hidden shadow-2xl rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300 sm:zoom-in-95">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
              <h5 className="font-bold text-base sm:text-lg text-gray-800">Chọn chi nhánh xuất hàng</h5>
              <button onClick={() => setIsBranchModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full"><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="p-4 overflow-y-auto flex-grow bg-white custom-scrollbar space-y-3">
              <div className="text-xs text-gray-500 mb-2">Hệ thống chỉ hiển thị các chi nhánh có đủ số lượng tồn kho cho toàn bộ sản phẩm trong giỏ hàng của bạn.</div>
              {availableBranches.map((branch) => (
                <label key={branch.id} className={`block p-3 sm:p-4 border rounded-xl cursor-pointer relative transition-all ${selectedBranchId === branch.id ? "border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500" : "border-gray-200 hover:border-indigo-300"}`} onClick={() => setSelectedBranchId(branch.id)}>
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                    <input type="radio" checked={selectedBranchId === branch.id} readOnly className="w-4 h-4 accent-indigo-600" />
                  </div>
                  <div className="font-bold text-gray-900 text-sm mb-1 pr-6">{branch.name}</div>
                  <div className="text-xs text-gray-600 mb-2">{branch.addressDetail}</div>
                  <div className="inline-flex items-center text-[10px] font-bold text-indigo-700 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded">
                    <Truck size={10} className="mr-1" /> {getDeliveryDateText(branch.estimatedDays)}
                  </div>
                </label>
              ))}
            </div>
            <div className="p-4 border-t bg-white flex justify-end shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
              <button onClick={() => setIsBranchModalOpen(false)} className="w-full sm:w-auto px-8 py-3 text-sm font-bold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition-colors">
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ĐỊA CHỈ */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsAddressModalOpen(false)}></div>
          <div className={`bg-white w-full relative z-10 overflow-hidden shadow-2xl rounded-t-2xl sm:rounded-2xl flex flex-col transition-all duration-300 ${isAddingNewAddress ? 'sm:max-w-2xl max-h-[95vh]' : 'sm:max-w-lg max-h-[85vh]'}`}>
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
              <div className="flex items-center gap-2">
                {isAddingNewAddress && (
                  <button onClick={() => setIsAddingNewAddress(false)} className="p-1 hover:bg-gray-200 rounded-md transition-colors mr-1">
                    <ChevronLeft size={20} className="text-gray-600" />
                  </button>
                )}
                <h5 className="font-bold text-base sm:text-lg text-gray-800">
                  {isAddingNewAddress ? "Thêm địa chỉ mới" : "Chọn địa chỉ nhận hàng"}
                </h5>
              </div>
              <button onClick={() => setIsAddressModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full"><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="p-0 overflow-y-auto flex-grow bg-white custom-scrollbar">
              {!isAddingNewAddress ? (
                <div className="p-4 space-y-3">
                  {addresses.length === 0 && <div className="text-center py-8 text-gray-500 text-sm">Chưa có địa chỉ nào được lưu.</div>}
                  {addresses.map((addr) => (
                    <label key={addr.id} className={`block p-3 sm:p-4 border rounded-xl cursor-pointer relative transition-all ${selectedAddressId === addr.id ? "border-teal-600 bg-teal-50/30 ring-1 ring-teal-500" : "border-gray-200 hover:border-teal-300"}`} onClick={() => setSelectedAddressId(addr.id)}>
                      <div className="absolute top-3 right-3 sm:top-4 sm:right-4"><input type="radio" checked={selectedAddressId === addr.id} readOnly className="w-4 h-4 accent-teal-600" /></div>
                      <div className="flex items-center gap-2 mb-1.5 pr-8">
                        <span className="font-bold text-gray-900 text-sm">{addr.receiverName}</span>
                        <span className="text-gray-400 text-xs">|</span>
                        <span className="text-gray-600 text-sm">{addr.receiverPhone}</span>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 leading-relaxed pr-6">{addr.addressDetail}</div>
                      {addr.isDefault && <div className="mt-2 inline-flex items-center text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded"><CheckCircle2 size={10} className="mr-1" /> Mặc định</div>}
                    </label>
                  ))}
                  <button onClick={() => setIsAddingNewAddress(true)} className="w-full mt-2 py-3.5 border-2 border-dashed border-teal-300 text-teal-700 font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-teal-50 transition-colors">
                    <Plus size={18} /> Thêm địa chỉ mới
                  </button>
                </div>
              ) : (
                <div className="p-0 border-none shadow-none">
                   <AddressForm title="" onSubmit={handleAddNewAddress} isSubmitting={isSubmittingAddress} />
                </div>
              )}
            </div>
            {!isAddingNewAddress && (
              <div className="p-4 border-t bg-white flex justify-end shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                <button onClick={() => setIsAddressModalOpen(false)} className="w-full sm:w-auto px-8 py-3 text-sm font-bold text-white bg-teal-600 rounded-lg shadow-md hover:bg-teal-700 transition-colors">Xác nhận</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VOUCHER MODAL */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsVoucherModalOpen(false)}></div>
          <div className="bg-white w-full sm:w-full sm:max-w-md relative z-10 overflow-hidden shadow-2xl rounded-t-2xl sm:rounded-2xl animate-in slide-in-from-bottom duration-300 sm:zoom-in-95 flex flex-col max-h-[80vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
              <h5 className="font-bold text-base sm:text-lg text-gray-800">AgriShrimp Voucher</h5>
              <button onClick={() => setIsVoucherModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="p-4 overflow-y-auto bg-gray-50/50 flex-grow custom-scrollbar">
              <div className="flex gap-2 mb-4">
                <input type="text" placeholder="Nhập mã..." className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-teal-500 text-sm" />
                <button className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-lg uppercase shadow-sm hover:bg-teal-700 transition-colors">Áp dụng</button>
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
                    className={`relative flex bg-white border rounded-lg overflow-hidden cursor-pointer transition-all active:scale-[0.98] hover:shadow-sm ${selectedVoucher?.code === voucher.code ? "border-teal-500 ring-1 ring-teal-500 bg-teal-50" : "border-gray-200"} ${subTotal < (voucher.minOrder || 0) ? "opacity-60 grayscale" : ""}`}
                  >
                    <div className="w-20 sm:w-24 bg-teal-600 text-white flex flex-col items-center justify-center p-2 text-center shrink-0 relative">
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-gray-100 rounded-full"></div>
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full z-10"></div>
                      <div className="border-r border-dashed border-white/30 h-full absolute right-0 top-0"></div>
                      <span className="text-[9px] font-bold tracking-wider">AGRISHRIMP</span>
                      <span className="text-xs font-bold mt-1.5">{voucher.code}</span>
                    </div>
                    <div className="p-2 sm:p-3 flex-grow flex flex-col justify-center">
                      <div className="font-bold text-gray-800 text-xs sm:text-sm">{voucher.description}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 mt-1">Đơn tối thiểu: {formatMoney(voucher.minOrder || 0)}</div>
                      <div className="flex justify-between items-end mt-2">
                        <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">HSD: 30/12</span>
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