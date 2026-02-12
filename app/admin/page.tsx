"use client";

import React from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import DashboardStats from "@/components/admin/DashboardStats";
import RevenueChart from "@/components/admin/RevenueChart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Bell, ArrowRight, UserPlus, PackagePlus, ShoppingCart } from "lucide-react";

export default function AdminDashboard() {
  const recentActivities = [
    { id: 1, action: "Đại lý Cần Thơ nhập 500 bao thức ăn", time: "10 phút trước", type: "in", icon: PackagePlus, color: "text-blue-500" },
    { id: 2, action: "Khách hàng mới: Nguyễn Văn Đại đăng ký", time: "25 phút trước", type: "user", icon: UserPlus, color: "text-emerald-500" },
    { id: 3, action: "Đơn hàng #DH-9921 đã hoàn thành", time: "1 giờ trước", type: "order", icon: ShoppingCart, color: "text-orange-500" },
    { id: 4, action: "Cập nhật giá thuốc thủy sản APA Miner", time: "3 giờ trước", type: "system", icon: Activity, color: "text-slate-400" },
  ];

  return (
    <div className="space-y-3 pb-10">
      <AdminPageHeader title="Bàn làm việc quản trị" />

      {/* 1. Chỉ số tổng hợp */}
      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 2. Biểu đồ xu hướng (Left - 2/3) */}
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>

        {/* 3. Hoạt động gần đây (Right - 1/3) */}
        <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-[15px] py-[10px] border-b border-[#eee] bg-[#f8f9fa] flex justify-between items-center">
            <h5 className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Bell size={14} className="text-orange-500" /> Thông báo & Hoạt động
            </h5>
            <button className="text-[10px] font-black text-emerald-600 uppercase hover:underline">Tất cả</button>
          </div>
          
          <div className="divide-y divide-[#eee]">
            {recentActivities.map((act) => (
              <div key={act.id} className="p-3 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                <div className={cn("mt-0.5 p-1.5 rounded-[4px] bg-slate-50 border border-slate-100", act.color.replace('text-', 'text-'))}>
                  <act.icon size={14} className={act.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-slate-700 leading-tight line-clamp-2">{act.action}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">{act.time}</p>
                </div>
                <button className="text-slate-300 hover:text-slate-600"><ArrowRight size={14}/></button>
              </div>
            ))}
          </div>
          
          <div className="p-3 bg-[#f8f9fa] border-t border-[#eee] text-center">
            <button className="text-[11px] font-bold text-slate-500 flex items-center justify-center gap-1 w-full hover:text-emerald-600">
              Xem nhật ký hệ thống <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Khối thông tin bổ sung (Nếu cần) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="bg-emerald-600 p-6 rounded-[4px] text-white shadow-lg shadow-emerald-100 flex items-center justify-between">
            <div>
              <p className="text-white/60 text-[11px] font-black uppercase tracking-widest">Hiệu suất vận hành</p>
              <h4 className="text-3xl font-black italic mt-1">98.5%</h4>
              <p className="text-[10px] font-bold mt-2 opacity-70 italic">* Dữ liệu ổn định toàn hệ thống</p>
            </div>
            <Activity size={48} className="opacity-20" />
         </div>
         <div className="bg-white border border-[#dcdcdc] p-6 rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest">Phản hồi khách hàng</p>
              <h4 className="text-3xl font-black text-slate-800 mt-1">4.9/5.0</h4>
              <p className="text-[10px] font-bold mt-2 text-emerald-600 italic">Rất tốt (120 lượt đánh giá)</p>
            </div>
            <BadgeCheck size={48} className="text-emerald-50 opacity-20" />
         </div>
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";
import { BadgeCheck } from "lucide-react";
