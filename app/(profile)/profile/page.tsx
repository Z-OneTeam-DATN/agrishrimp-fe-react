'use client';

import Link from 'next/link';
import { 
  ChevronRight, 
  Pencil, 
  Box, 
  Truck, 
  CheckCircle2, 
  RotateCcw, 
  XCircle, 
  Star, 
  Bot, 
  Ticket, 
  Bell,
  MapPin
} from 'lucide-react';

export default function ProfilePage() {
  return (
    <>
      {/* 1. KHỐI ĐƠN HÀNG */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
          <h5 className="font-bold text-gray-800 text-lg">Đơn hàng của tôi</h5>
          <Link href="/orders/list" className="text-sm text-gray-500 hover:text-[#329965] flex items-center transition-colors group">
            Xem lịch sử đơn hàng <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-5 gap-2 text-center">
          {/* Item 1: Đang xử lý */}
          <Link href="/orders/list?status=processing" className="group flex flex-col items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="w-10 h-10 mb-2 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Box size={20} />
            </div>
            <span className="text-xs md:text-sm text-gray-600 group-hover:text-blue-600 font-medium">Đang xử lý</span>
          </Link>

          {/* Item 2: Đang giao */}
          <Link href="/orders/list?status=shipping" className="group flex flex-col items-center p-2 hover:bg-gray-50 rounded-lg transition-colors relative">
            <div className="w-10 h-10 mb-2 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Truck size={20} />
            </div>
            {/* Badge số lượng */}
            <span className="absolute top-1 right-[15%] md:right-[25%] bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">
              1
            </span>
            <span className="text-xs md:text-sm text-gray-600 group-hover:text-yellow-600 font-medium">Đang giao</span>
          </Link>

          {/* Item 3: Đã giao */}
          <Link href="/orders/list?status=completed" className="group flex flex-col items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="w-10 h-10 mb-2 rounded-full bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-xs md:text-sm text-gray-600 group-hover:text-green-600 font-medium">Đã giao</span>
          </Link>

          {/* Item 4: Hoàn trả */}
          <Link href="/orders/return/list" className="group flex flex-col items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="w-10 h-10 mb-2 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <RotateCcw size={20} />
            </div>
            <span className="text-xs md:text-sm text-gray-600 group-hover:text-orange-600 font-medium">Hoàn trả</span>
          </Link>

          {/* Item 5: Đã hủy */}
          <Link href="/orders/list?status=cancelled" className="group flex flex-col items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="w-10 h-10 mb-2 rounded-full bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <XCircle size={20} />
            </div>
            <span className="text-xs md:text-sm text-gray-600 group-hover:text-red-600 font-medium">Đã hủy</span>
          </Link>
        </div>
      </div>

      {/* 2. KHỐI THÔNG TIN & ĐỊA CHỈ */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
        
        {/* Cột Thông tin cá nhân (7 phần) */}
        <div className="md:col-span-7">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 h-full">
            <div className="flex justify-between items-center mb-4">
              <h6 className="font-bold text-gray-500 uppercase text-xs tracking-wider">Thông tin tài khoản</h6>
              <Link href="/edit-profile" className="text-[#329965] text-sm flex items-center hover:underline">
                <Pencil size={12} className="mr-1" /> Chỉnh sửa
              </Link>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500 text-sm">Họ và tên</span>
                <span className="font-medium text-gray-900 text-sm">Võ Thị Mỹ Thanh</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500 text-sm">Email</span>
                <span className="font-medium text-gray-900 text-sm">thanhthenhwifi@gmail.com</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500 text-sm">Số điện thoại</span>
                <span className="font-medium text-gray-900 text-sm">0909 *** 888</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-gray-500 text-sm">Tổng tiền 30 ngày:</span>
                <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-2 py-1 rounded text-xs font-bold flex items-center">
                  <Star size={12} className="mr-1 fill-yellow-500 text-yellow-500" /> 35.000.000 ₫
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cột Địa chỉ mặc định (5 phần) */}
        <div className="md:col-span-5">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h6 className="font-bold text-gray-500 uppercase text-xs tracking-wider">Địa chỉ mặc định</h6>
              <Link href="/address" className="text-[#329965] text-sm hover:underline">Quản lý</Link>
            </div>

            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-md p-4 flex-1 relative group hover:border-[#329965] transition-colors">
              <div className="font-bold text-gray-900 text-sm mb-1 flex items-center">
                  <MapPin size={14} className="text-[#329965] mr-1" /> Thanh Võ 
                  <span className="font-normal text-gray-500 ml-1">| (+84) 909 123 456</span>
              </div>
              <hr className="my-2 border-gray-200" />
              <p className="text-xs text-gray-600 leading-relaxed mb-3">
                123 Đường 3/2, Phường Xuân Khánh, Quận Ninh Kiều, Thành phố Cần Thơ
              </p>
              <div className="text-right mt-auto">
                <span className="text-[10px] text-gray-400 italic">2 địa chỉ đã thêm</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. KHỐI TIỆN ÍCH NHANH */}
      <h6 className="font-bold text-gray-500 uppercase text-xs tracking-wider mb-3 ml-1">Tiện ích nhanh</h6>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Tiện ích 1: AI */}
        <Link href="/ai-doctor" className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center hover:shadow-md transition-shadow group cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mr-3 group-hover:bg-teal-100 transition-colors">
            <Bot size={20} />
          </div>
          <div>
            <div className="font-bold text-sm text-gray-800">Chẩn đoán AI</div>
            <div className="text-xs text-gray-500">Kiểm tra bệnh tôm</div>
          </div>
        </Link>

        {/* Tiện ích 2: Voucher */}
        <Link href="/voucher" className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center hover:shadow-md transition-shadow group cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mr-3 group-hover:bg-orange-100 transition-colors">
            <Ticket size={20} />
          </div>
          <div>
            <div className="font-bold text-sm text-gray-800">Kho Voucher</div>
            <div className="text-xs text-gray-500">3 mã chưa dùng</div>
          </div>
        </Link>

        {/* Tiện ích 3: Thông báo */}
        <Link href="/notifications" className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center hover:shadow-md transition-shadow group cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center mr-3 group-hover:bg-red-100 transition-colors">
            <Bell size={20} />
          </div>
          <div>
            <div className="font-bold text-sm text-gray-800">Thông báo</div>
            <div className="text-xs text-gray-500">Xem tin mới nhất</div>
          </div>
        </Link>

      </div>
    </>
  );
}