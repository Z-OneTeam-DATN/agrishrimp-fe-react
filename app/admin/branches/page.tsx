"use client";

import React from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Building2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Store
} from "lucide-react";

const branchData = [
  { id: "AGRI-CN01", name: "CN Cần Thơ", manager: "Nguyễn Văn An", managerId: "NV-001", phone: "0909 123 456", email: "cantho@agri.com", address: "123 Đường 3/2, P. Xuân Khánh, Q. Ninh Kiều, TP. Cần Thơ", status: "Hoạt động", avatar: "AN" },
  { id: "AGRI-CN02", name: "CN Sóc Trăng", manager: "Trần Thị Bích", managerId: "NV-002", phone: "0988 777 666", email: "soctrang@agri.com", address: "45 Lê Lợi, Phường 2, TP. Sóc Trăng, Tỉnh Sóc Trăng", status: "Hoạt động", avatar: "TB" },
  { id: "AGRI-CN03", name: "CN Bạc Liêu (Cũ)", manager: "Chưa chỉ định", managerId: "--", phone: "0912 345 678", email: "baclieu@agri.com", address: "88 Trần Phú, Phường 7, TP. Bạc Liêu (Đang bảo trì)", status: "Ngừng HĐ", avatar: "--" },
];

export default function BranchManagementPage() {
  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Quản lý chi nhánh</h2>
          <p className="text-sm text-gray-500 font-medium">Quản lý danh sách các điểm phân phối và kho hàng.</p>
        </div>
        <Link href="/admin/branches/add">
          <button className="flex items-center justify-center gap-2 bg-[#139a7e] text-white px-5 py-2.5 rounded-xl font-bold transition shadow-sm active:scale-95">
            <Store size={18} /> Thêm chi nhánh
          </button>
        </Link>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden font-bold">
        <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input className="w-full bg-white border border-gray-100 pl-12 pr-4 py-2.5 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#139a7e]/10" placeholder="Tìm tên, mã chi nhánh..." />
          </div>
          <div className="flex gap-3">
            <select className="bg-white border border-gray-100 px-4 py-2.5 rounded-2xl text-sm text-gray-600 outline-none">
              <option>Tất cả trạng thái</option>
              <option>Hoạt động</option>
              <option>Ngừng hoạt động</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4 w-12 text-center"><input type="checkbox" className="rounded border-gray-300 text-[#139a7e]" /></th>
                <th className="px-4 py-4">Thông tin chi nhánh</th>
                <th className="px-4 py-4">Người phụ trách</th>
                <th className="px-4 py-4">Liên hệ</th>
                <th className="px-4 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {branchData.map((branch) => (
                <tr key={branch.id} className="hover:bg-gray-50/80 transition-all">
                  <td className="px-6 py-4 text-center"><input type="checkbox" className="rounded border-gray-300 text-[#139a7e]" /></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-[#139a7e]"><Building2 size={20}/></div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 leading-tight">{branch.name}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-tighter mt-1">{branch.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-black text-[10px] border border-purple-100">{branch.avatar}</div>
                       <div>
                         <p className="font-bold text-gray-700">{branch.manager}</p>
                         <p className="text-gray-400">{branch.managerId}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-500 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold"><Phone size={12}/> {branch.phone}</div>
                    <div className="flex items-center gap-1.5"><Mail size={12}/> {branch.email}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${branch.status === "Hoạt động" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                      {branch.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-blue-500 bg-white border border-gray-100 rounded-xl hover:shadow-md transition active:scale-90"><Pencil size={16} /></button>
                      <button className="p-2 text-red-500 bg-white border border-gray-100 rounded-xl hover:shadow-md transition active:scale-90"><Trash2 size={16} /></button>
                    </div>
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