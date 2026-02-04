"use client";

import React from "react";
import { Users, Package, ShoppingBag, TrendingUp, ArrowUpRight, Handshake } from "lucide-react";

export default function DashboardStats() {
  const stats = [
    { label: "Tổng khách hàng", value: "1,250", change: "+12%", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Sản phẩm kinh doanh", value: "458", change: "+5", icon: Package, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Đại lý đối tác", value: "42", change: "Ổn định", icon: Handshake, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Đơn hàng tháng này", value: "856", change: "+18%", icon: ShoppingBag, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      {stats.map((stat, i) => (
        <div key={i} className="bg-white p-4 border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-3">
            <div className={cn("w-10 h-10 rounded-[4px] flex items-center justify-center border", stat.bg.replace('bg-', 'border-'))}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
              <ArrowUpRight size={10} /> {stat.change}
            </span>
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-1">{stat.value}</h3>
        </div>
      ))}
    </div>
  );
}

import { cn } from "@/lib/utils";
