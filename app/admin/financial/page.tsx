"use client";

import React from "react";
import { Download, Calendar, ChevronDown, Activity, BarChart3, PieChart as PieIcon } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { FinancialStatsCards } from "@/components/admin/FinancialStatsCards";
import { AdminTransactionTable } from "@/components/admin/AdminTransactionTable";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { Button } from "@/components/ui/button";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const recentTransactions = [
  { id: "GD-9021", date: "25/01/2026 14:30", note: "Thu tiền đơn hàng #DH-12345", target: "Trần Văn Tý", amount: "+ 15.500.000 ₫", status: "Hoàn thành", type: "in" as const },
  { id: "GD-9022", date: "25/01/2026 10:15", note: "Chi phí nhập kho (Thức ăn tôm)", target: "CP Group", amount: "- 42.000.000 ₫", status: "Chờ duyệt", type: "out" as const },
  { id: "GD-9023", date: "24/01/2026 16:45", note: "Thanh toán lương nhân viên", target: "Nhân sự", amount: "- 125.000.000 ₫", status: "Hoàn thành", type: "out" as const },
  { id: "GD-9024", date: "24/01/2026 09:20", note: "Hoàn tiền đơn hàng lỗi", target: "Nguyễn Thị Hạnh", amount: "- 1.200.000 ₫", status: "Đã hoàn tiền", type: "out" as const },
];

export default function FinancialReportPage() {
  const barData = {
    labels: ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"],
    datasets: [
      { label: "Doanh thu", data: [120, 150, 180, 170, 210, 240, 230, 280, 300, 320, 350, 400], backgroundColor: "#10b981", borderRadius: 2 },
      { label: "Chi phí", data: [80, 90, 100, 95, 110, 120, 115, 130, 140, 150, 160, 180], backgroundColor: "#ef4444", borderRadius: 2 },
    ],
  };

  const doughnutData = {
    labels: ["CN Cần Thơ", "CN Sóc Trăng", "CN Bạc Liêu", "CN Cà Mau", "CN Bến Tre"],
    datasets: [{ data: [35, 25, 20, 15, 5], backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"], borderWidth: 0 }],
  };

  return (
    <div className="space-y-3 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="text-emerald-600" size={20} />
          <h1 className="text-[18px] font-black text-[#1f1f1f] uppercase tracking-tight">Báo cáo phân tích tài chính</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white border border-[#dcdcdc] h-[32px] px-3 flex items-center gap-2 text-[12px] font-bold text-slate-600 rounded-[4px] cursor-pointer hover:bg-slate-50">
            <Calendar size={14} className="text-slate-400" /> Tháng 1/2026 <ChevronDown size={12} />
          </div>
          <Button className="h-[32px] text-[12px] font-bold bg-white border border-[#dcdcdc] text-[#1f1f1f] hover:bg-slate-50 rounded-[4px] shadow-none">
            <Download size={14} className="mr-1.5 text-emerald-600" /> Xuất PDF
          </Button>
        </div>
      </div>

      <FinancialStatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Biểu đồ dòng tiền */}
        <div className="lg:col-span-2 bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-[15px] py-[10px] border-b border-[#eee] bg-[#f8f9fa] flex justify-between items-center">
            <h5 className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 size={14} className="text-emerald-600" /> Biến động dòng tiền (12 tháng)
            </h5>
            <select className="bg-white border border-[#ddd] rounded px-2 py-0.5 text-[10px] font-bold outline-none cursor-pointer">
              <option>Năm 2026</option>
              <option>Năm 2025</option>
            </select>
          </div>
          <div className="p-6 h-[320px]">
            <Bar
              data={barData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' as const, align: 'end' as const, labels: { boxWidth: 10, font: { size: 10, weight: 'bold' } } } },
                scales: { x: { grid: { display: false }, ticks: { font: { size: 10 } } }, y: { ticks: { font: { size: 10 } } } }
              }}
            />
          </div>
        </div>

        {/* Biểu đồ tỷ trọng */}
        <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden relative">
          <div className="px-[15px] py-[10px] border-b border-[#eee] bg-[#f8f9fa]">
            <h5 className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <PieIcon size={14} className="text-emerald-600" /> Cơ cấu doanh thu chi nhánh
            </h5>
          </div>
          <div className="p-6 h-[320px] relative">
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' as const, labels: { boxWidth: 10, font: { size: 10, weight: 'bold' } } } },
                cutout: '75%'
              }}
            />
            <div className="absolute top-[45%] left-1/2 -translate-x-1/2 text-center pointer-events-none">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Tổng cộng</p>
              <p className="text-sm font-black text-slate-800 tracking-tight">100%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
        <AdminTransactionTable transactions={recentTransactions} />
      </div>
    </div>
  );
}