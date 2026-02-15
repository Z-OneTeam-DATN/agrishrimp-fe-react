"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { BarChart3, ChevronDown } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export default function RevenueChart() {
  const data = {
    labels: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
    datasets: [
      {
        fill: true,
        label: "Doanh thu tuần này",
        data: [65, 59, 80, 81, 56, 55, 40],
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.05)",
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#fff",
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1f2937",
        padding: 10,
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        cornerRadius: 4,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10, weight: "bold" } },
      },
      y: { grid: { color: "#f3f4f6" }, ticks: { font: { size: 10 } } },
    },
  };

  return (
    <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="px-[15px] py-[10px] border-b border-[#eee] bg-[#f8f9fa] flex justify-between items-center">
        <h5 className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <BarChart3 size={14} className="text-emerald-600" /> Xu hướng tăng
          trưởng doanh thu
        </h5>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            7 ngày qua
          </span>
          <ChevronDown size={12} className="text-slate-300" />
        </div>
      </div>
      <div className="p-6 h-[300px]">
        <Line data={data} options={options as any} />
      </div>
    </div>
  );
}
