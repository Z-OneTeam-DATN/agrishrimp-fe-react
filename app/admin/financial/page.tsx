"use client";

import React from "react";
import {
  Download,
  Calendar,
  ChevronDown,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  PieChart as PieIcon,
  MoreHorizontal
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function FinancialReportPage() {
  // Dữ liệu biểu đồ cột (Doanh thu & Chi phí)
  const barData = {
    labels: ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"],
    datasets: [
      {
        label: "Doanh thu",
        data: [120, 150, 180, 170, 210, 240, 230, 280, 300, 320, 350, 400],
        backgroundColor: "#10b981",
        borderRadius: 6,
      },
      {
        label: "Chi phí",
        data: [80, 90, 100, 95, 110, 120, 115, 130, 140, 150, 160, 180],
        backgroundColor: "#ef4444",
        borderRadius: 6,
      },
    ],
  };

  // Dữ liệu biểu đồ tròn (Cơ cấu chi nhánh)
  const doughnutData = {
    labels: ["CN Cần Thơ", "CN Sóc Trăng", "CN Bạc Liêu", "CN Cà Mau", "CN Bến Tre"],
    datasets: [
      {
        data: [35, 25, 20, 15, 5],
        backgroundColor: ["#139a7e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Báo cáo tài chính</h2>
          <p className="text-sm text-gray-500 font-medium">Tổng hợp doanh thu, chi phí và lợi nhuận toàn hệ thống.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-gray-100 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold text-gray-600 shadow-sm cursor-pointer hover:bg-gray-50 transition">
            <Calendar size={16} />
            Tháng này: 01/01 - 31/01/2026
            <ChevronDown size={14} />
          </div>
          <button className="flex items-center gap-2 bg-[#139a7e] text-white px-5 py-2 rounded-xl font-bold transition shadow-md active:scale-95">
            <Download size={18} /> Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-4">
            <DollarSign size={24} />
          </div>
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Tổng doanh thu</p>
          <h3 className="text-2xl font-black text-gray-800 mt-1">2.85 Tỷ ₫</h3>
          <div className="flex items-center gap-1 text-green-500 text-xs font-bold mt-2">
            <TrendingUp size={14} /> +12.5% so với tháng trước
          </div>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4">
            <Wallet size={24} />
          </div>
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Tổng chi phí</p>
          <h3 className="text-2xl font-black text-gray-800 mt-1">1.12 Tỷ ₫</h3>
          <div className="flex items-center gap-1 text-red-500 text-xs font-bold mt-2">
            <TrendingDown size={14} /> +5.2% (Cần chú ý)
          </div>
        </div>

        <div className="bg-[#139a7e] p-6 rounded-[28px] text-white shadow-lg shadow-[#139a7e]/20">
          <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-4">
            <ArrowUpRight size={24} />
          </div>
          <p className="text-white/60 text-xs font-black uppercase tracking-widest">Lợi nhuận ròng</p>
          <h3 className="text-2xl font-black mt-1">1.73 Tỷ ₫</h3>
          <div className="flex items-center gap-1 text-white/80 text-xs font-bold mt-2">
            <TrendingUp size={14} /> +8.4% tăng trưởng
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6 px-2">
            <h5 className="font-bold text-gray-800">Biểu đồ dòng tiền (12 tháng)</h5>
            <select className="bg-gray-50 border-none rounded-lg px-3 py-1.5 text-xs font-bold outline-none">
              <option>Năm 2026</option>
              <option>Năm 2025</option>
            </select>
          </div>
          <div className="h-80">
            <Bar
              data={barData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' as const, align: 'end' as const } },
                scales: { x: { grid: { display: false } } }
              }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative">
          <div className="flex justify-between items-center mb-6 px-2">
            <h5 className="font-bold text-gray-800">Tỷ trọng doanh thu</h5>
            <MoreHorizontal size={20} className="text-gray-300 cursor-pointer" />
          </div>
          <div className="h-64 relative">
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' as const } },
                cutout: '70%'
              }}
            />
            <div className="absolute top-[42%] left-1/2 -translate-x-1/2 text-center pointer-events-none">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Tổng cộng</p>
              <p className="text-lg font-black text-gray-800">100%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden font-bold">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <h5 className="font-bold text-gray-800">Giao dịch gần đây</h5>
          <button className="text-[#139a7e] text-xs font-black uppercase tracking-widest hover:underline transition">Xem tất cả</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-8 py-4">Mã GD</th>
                <th className="px-4 py-4">Ngày giao dịch</th>
                <th className="px-4 py-4">Nội dung</th>
                <th className="px-4 py-4">Đối tượng</th>
                <th className="px-4 py-4 text-right">Số tiền</th>
                <th className="px-8 py-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium">
              {[
                { id: "#GD-9021", date: "25/01/2026 14:30", note: "Thu tiền đơn hàng #DH-12345", target: "Trần Văn Tý", amount: "+ 15.500.000 ₫", status: "Hoàn thành", type: "in" },
                { id: "#GD-9022", date: "25/01/2026 10:15", note: "Chi phí nhập kho (Thức ăn tôm)", target: "CP Group", amount: "- 42.000.000 ₫", status: "Chờ duyệt", type: "out" },
                { id: "#GD-9023", date: "24/01/2026 16:45", note: "Thanh toán lương nhân viên", target: "Nhân sự", amount: "- 125.000.000 ₫", status: "Hoàn thành", type: "out" },
                { id: "#GD-9024", date: "24/01/2026 09:20", note: "Hoàn tiền đơn hàng lỗi", target: "Nguyễn Thị Hạnh", amount: "- 1.200.000 ₫", status: "Đã hoàn tiền", type: "out" },
              ].map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-all">
                  <td className="px-8 py-5 text-gray-400 font-mono text-xs">{item.id}</td>
                  <td className="px-4 py-5 text-xs text-gray-500">{item.date}</td>
                  <td className="px-4 py-5 text-sm font-bold text-gray-800">{item.note}</td>
                  <td className="px-4 py-5 text-xs text-gray-400 font-bold">{item.target}</td>
                  <td className={`px-4 py-5 text-right font-black text-sm ${item.type === 'in' ? 'text-green-500' : 'text-red-500'}`}>
                    {item.amount}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-tighter uppercase
                      ${item.status === 'Hoàn thành' ? 'bg-green-50 text-green-600' :
                        item.status === 'Chờ duyệt' ? 'bg-orange-50 text-orange-600' : 'bg-gray-100 text-gray-400'}
                    `}>
                      {item.status}
                    </span>
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