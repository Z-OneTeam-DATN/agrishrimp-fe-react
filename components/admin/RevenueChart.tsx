"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

export default function RevenueChart() {
  const data = {
    labels: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"],
    datasets: [
      {
        label: "Doanh thu",
        data: [15, 25, 20, 32, 38, 28, 42, 48, 55, 45, 60, 52],
        borderColor: "#139a7e",
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 0, // Ẩn các chấm tròn để đường kẻ mượt hơn
        pointHoverRadius: 5,
        fill: false, // Loại bỏ mảng màu phía dưới
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        grid: { color: "#f3f4f6", drawBorder: false },
        ticks: { color: "#9ca3af", font: { size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: "#9ca3af", font: { size: 11 } }
      }
    }
  };

  return (
    <div className="rounded-xl bg-white p-6 border border-gray-200">
      <div className="mb-6">
        <h4 className="text-lg font-bold text-gray-800">Hiệu suất doanh thu</h4>
        <p className="text-sm text-gray-400">Dữ liệu thực tế năm tài chính 2026</p>
      </div>
      <div className="h-[300px]">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}