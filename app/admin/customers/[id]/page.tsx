"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  MapPin,
  Phone,
  Mail,
  Calendar,
  ShoppingBag,
  CreditCard,
  User,
  History
} from "lucide-react";

export default function CustomerDetailPage() {
  return (
    <div className="space-y-6 pb-10">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/admin/customers" className="flex items-center gap-2 text-gray-400 hover:text-gray-800 transition font-bold text-sm">
          <ChevronLeft size={20} /> Danh sách khách hàng
        </Link>
        <div className="flex gap-2">
           <button className="px-5 py-2 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition">Chỉnh sửa</button>
           <button className="px-5 py-2 rounded-xl bg-red-50 text-red-500 font-bold text-sm hover:bg-red-100 transition">Khóa tài khoản</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center text-[#139a7e] mb-4 border-4 border-white shadow-md">
              <User size={40} />
            </div>
            <h3 className="text-xl font-black text-gray-800">Nguyễn Văn Đại</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">KH-001 • Chủ ao tôm</p>

            <div className="w-full h-px bg-gray-50 my-6"></div>

            <div className="w-full space-y-4 text-left">
              <div className="flex items-center gap-3 text-gray-600">
                <div className="p-2 bg-gray-50 rounded-lg text-gray-400"><Phone size={16}/></div>
                <span className="text-sm font-bold">0901 222 333</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <div className="p-2 bg-gray-50 rounded-lg text-gray-400"><Mail size={16}/></div>
                <span className="text-sm font-bold">dai.nguyen@example.com</span>
              </div>
              <div className="flex items-start gap-3 text-gray-600">
                <div className="p-2 bg-gray-50 rounded-lg text-gray-400"><MapPin size={16}/></div>
                <span className="text-sm font-bold leading-tight">Huyện Hòa Bình, Tỉnh Bạc Liêu</span>
              </div>
            </div>
          </div>

          {/* Chỉ số tài chính */}
          <div className="bg-[#139a7e] p-8 rounded-[32px] text-white shadow-lg shadow-teal-100">
             <div className="flex items-center justify-between mb-4 opacity-80">
               <span className="text-xs font-black uppercase tracking-widest">Tổng chi tiêu</span>
               <CreditCard size={20}/>
             </div>
             <h4 className="text-3xl font-black italic">154.200.000 ₫</h4>
             <p className="text-[10px] font-bold mt-2 opacity-70 italic">* Tính từ khi bắt đầu giao dịch</p>
          </div>
        </div>

        {/* Cột phải: Lịch sử mua hàng */}
        <div className="lg:col-span-2 space-y-6 font-bold">
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 min-h-full">
            <h5 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
              <History size={20} className="text-[#139a7e]" /> Lịch sử đơn hàng gần nhất
            </h5>

            <div className="space-y-4">
              {[
                { id: "DH-992", date: "02/02/2026", amount: "12.500.000 ₫", status: "Hoàn thành" },
                { id: "DH-875", date: "15/01/2026", amount: "4.200.000 ₫", status: "Hoàn thành" },
                { id: "DH-642", date: "20/12/2025", amount: "8.900.000 ₫", status: "Đã hủy" },
              ].map((order, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#139a7e]/30 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400">
                      <ShoppingBag size={20}/>
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-800">{order.id}</p>
                      <p className="text-xs text-gray-400 font-medium flex items-center gap-1"><Calendar size={12}/> {order.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-[#139a7e]">{order.amount}</p>
                    <span className={`text-[10px] font-black tracking-tighter uppercase ${order.status === "Hoàn thành" ? "text-green-500" : "text-red-400"}`}>{order.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-6 py-4 text-xs font-black text-gray-400 uppercase tracking-[2px] border-2 border-dashed border-gray-100 rounded-2xl hover:bg-gray-50 transition">
              Xem tất cả giao dịch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}