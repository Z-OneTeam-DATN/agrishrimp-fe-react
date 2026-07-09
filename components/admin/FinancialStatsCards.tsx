"use client";

import React from "react";
import {
  DollarSign,
  Wallet,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Landmark,
} from "lucide-react";

export function FinancialStatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      {/* Doanh thu */}
      <div className="bg-white p-5 border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Tổng doanh thu hệ thống
          </p>
          <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-[4px] flex items-center justify-center border border-blue-100">
            <DollarSign size={18} />
          </div>
        </div>
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">
          2.854.200.000 ₫
        </h3>
        <div className="flex items-center gap-1.5 text-blue-600 text-[11px] font-bold mt-3 bg-blue-50 w-fit px-2 py-0.5 rounded">
          <TrendingUp size={12} /> +12.5%{" "}
          <span className="font-medium text-slate-400">so với tháng trước</span>
        </div>
      </div>

      {/* Chi phí */}
      <div className="bg-white p-5 border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Tổng chi phí vận hành
          </p>
          <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-[4px] flex items-center justify-center border border-rose-100">
            <Wallet size={18} />
          </div>
        </div>
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">
          1.120.500.000 ₫
        </h3>
        <div className="flex items-center gap-1.5 text-rose-600 text-[11px] font-bold mt-3 bg-rose-50 w-fit px-2 py-0.5 rounded">
          <TrendingDown size={12} /> +5.2%{" "}
          <span className="font-medium text-slate-400">tăng chi phí</span>
        </div>
      </div>

      {/* Lợi nhuận */}
      <div className="bg-white p-5 border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Lợi nhuận ròng dự kiến
          </p>
          <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-[4px] flex items-center justify-center border border-blue-100">
            <Landmark size={18} />
          </div>
        </div>
        <h3 className="text-2xl font-black text-blue-600 tracking-tight">
          1.733.700.000 ₫
        </h3>
        <div className="flex items-center gap-1.5 text-blue-600 text-[11px] font-bold mt-3 bg-blue-50 w-fit px-2 py-0.5 rounded">
          <ArrowUpRight size={12} /> +8.4%{" "}
          <span className="font-medium text-slate-400">tăng trưởng ròng</span>
        </div>
      </div>
    </div>
  );
}

