"use client";

import React from "react";
import Link from "next/link";
import {
  Search,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  Phone,
  MapPin,
  Filter
} from "lucide-react";

const customerData = [
  { id: "KH-001", name: "Nguyễn Văn Đại", type: "Chủ ao", location: "Bạc Liêu", phone: "0901 222 333", totalOrders: 12, status: "Hoạt động" },
  { id: "KH-002", name: "Lê Thị Hồng", type: "Đại lý", location: "Cà Mau", phone: "0988 444 555", totalOrders: 45, status: "Hoạt động" },
  { id: "KH-003", name: "Trần Hữu Lộc", type: "Chủ ao", location: "Sóc Trăng", phone: "0912 999 888", totalOrders: 5, status: "Tạm khóa" },
];

export default function CustomerManagementPage() {
  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Quản lý khách hàng</h2>
          <p className="text-sm text-gray-500 font-medium">Theo dõi thông tin và lịch sử mua hàng của đối tác.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-[#139a7e] text-white px-5 py-2.5 rounded-xl font-bold transition shadow-sm active:scale-95">
          <UserPlus size={18} /> Thêm khách hàng
        </button>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden font-bold">
        <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input className="w-full bg-white border border-gray-100 pl-12 pr-4 py-2.5 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#139a7e]/10" placeholder="Tìm tên, SĐT khách hàng..." />
          </div>
          <select className="bg-white border border-gray-100 px-4 py-2.5 rounded-2xl text-sm font-semibold text-gray-600 outline-none focus:ring-2 focus:ring-[#139a7e]/10 cursor-pointer">
            <option>Tất cả phân loại</option>
            <option>Chủ ao</option>
            <option>Đại lý</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-8 py-4">Mã KH</th>
                <th className="px-4 py-4">Khách hàng</th>
                <th className="px-4 py-4">Liên hệ</th>
                <th className="px-4 py-4 text-center">Đơn hàng</th>
                <th className="px-4 py-4">Trạng thái</th>
                <th className="px-8 py-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium">
              {customerData.map((cus) => (
                <tr key={cus.id} className="hover:bg-gray-50/80 transition-all">
                  <td className="px-8 py-5 text-sm font-black text-gray-800">{cus.id}</td>
                  <td className="px-4 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-800">{cus.name}</span>
                      <span className="text-[10px] text-gray-400 uppercase tracking-tighter">{cus.type} • {cus.location}</span>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-2 text-xs text-gray-400"><Phone size={12}/> {cus.phone}</div>
                  </td>
                  <td className="px-4 py-5 text-center font-black text-gray-700">{cus.totalOrders}</td>
                  <td className="px-4 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${cus.status === "Hoạt động" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                      {cus.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <Link href={`/admin/customers/${cus.id}`}>
                      <button className="p-2 text-[#139a7e] bg-teal-50 rounded-xl hover:bg-[#139a7e] hover:text-white transition active:scale-90">
                        <Eye size={18} />
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}