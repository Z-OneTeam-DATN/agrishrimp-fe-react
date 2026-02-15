"use client";

import React from "react";
import {
  ChevronDown,
  HelpCircle,
  FileText,
  ShoppingCart,
  RotateCcw,
  CreditCard,
  Users,
  History,
  TrendingUp,
  Search,
  Package,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";

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

export default function SalesReportPage() {
  const chartData = {
    labels: ["05/02", "06/02", "07/02", "08/02", "09/02", "10/02", "11/02"],
    datasets: [
      {
        label: "Doanh thu",
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: "#3b82f6",
        backgroundColor: "#3b82f6",
        tension: 0,
        pointRadius: 4,
        pointBackgroundColor: "#3b82f6",
      },
      {
        label: "Lợi nhuận",
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: "#10b981",
        backgroundColor: "#10b981",
        tension: 0,
        pointRadius: 4,
        pointBackgroundColor: "#10b981",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          pointStyle: "rectRounded",
          boxWidth: 15,
          font: { size: 12 },
        },
      },
      tooltip: { enabled: true },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "#f3f4f6" },
        ticks: { font: { size: 11 } },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
    },
  };

  const ReportLink = ({
    label,
    icon: Icon,
    isNew,
  }: {
    label: string;
    icon: any;
    isNew?: boolean;
  }) => (
    <div className="flex items-center justify-between py-2 group cursor-pointer hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3">
        <Icon size={16} className="text-slate-400 group-hover:text-blue-600" />
        <span className="text-[13px] text-slate-600 group-hover:text-blue-600">
          {label}
        </span>
        {isNew && (
          <span className="text-[9px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded-sm italic leading-none">
            New
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-10 bg-[#f0f2f5] min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-black text-slate-800 uppercase tracking-tight">
          Báo cáo bán hàng
        </h1>
        <Button
          variant="outline"
          className="bg-white border-[#dcdcdc] rounded-none h-[34px] text-[12px] font-bold flex items-center gap-2 uppercase"
        >
          <HelpCircle size={16} className="text-slate-500" /> Trợ giúp
        </Button>
      </div>

      {/* Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DOANH THU CỬA HÀNG */}
        <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm flex flex-col h-[420px]">
          <div className="p-5 flex justify-between items-start">
            <div>
              <h2 className="text-[14px] font-black text-slate-700 uppercase tracking-wider">
                Doanh thu cửa hàng
              </h2>
              <p className="text-[12px] text-slate-400 font-medium">
                7 ngày qua
              </p>
            </div>
            <div className="text-[28px] font-black text-blue-600 tracking-tighter">
              0
            </div>
          </div>

          <div className="px-5 mb-4">
            <button className="flex items-center gap-1 text-[12px] text-blue-600 font-medium hover:underline">
              Theo ngày giao hàng <ChevronDown size={14} />
            </button>
          </div>

          <div className="flex-1 px-5 min-h-[200px]">
            <Line data={chartData} options={chartOptions} />
          </div>

          <div className="p-5 border-t border-slate-50 space-y-3 bg-[#fcfcfc]">
            <Select>
              <SelectTrigger className="h-9 rounded-none border-slate-200 text-[13px] bg-white">
                <SelectValue placeholder="Chọn loại báo cáo" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="1">
                  Báo cáo doanh thu theo thời gian
                </SelectItem>
                <SelectItem value="2">
                  Báo cáo doanh thu theo nhân viên
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400"></div>
              <span className="text-[12px] text-slate-500 font-medium">
                Gợi ý
              </span>
            </div>
          </div>
        </div>

        {/* THÔNG TIN GIAO HÀNG */}
        <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm flex flex-col h-[420px]">
          <div className="p-5 flex justify-between items-start">
            <div>
              <h2 className="text-[14px] font-black text-slate-700 uppercase tracking-wider">
                Thông tin giao hàng
              </h2>
              <p className="text-[12px] text-slate-400 font-medium">
                7 ngày qua
              </p>
            </div>
            <div className="text-[28px] font-black text-blue-600 tracking-tighter">
              0
            </div>
          </div>

          <div className="px-5 mb-4">
            <button className="flex items-center gap-1 text-[12px] text-blue-600 font-medium hover:underline">
              Theo tình trạng <ChevronDown size={14} />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-40 h-40 opacity-30 grayscale mb-4">
              <img
                src="https://cdn-icons-png.flaticon.com/512/7486/7486744.png"
                alt="No data"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-[13px] text-slate-400 font-medium italic">
              Chưa có dữ liệu báo cáo
            </p>
          </div>

          <div className="p-5 border-t border-slate-50 space-y-3 bg-[#fcfcfc]">
            <Select>
              <SelectTrigger className="h-9 rounded-none border-slate-200 text-[13px] bg-white">
                <SelectValue placeholder="Chọn loại báo cáo" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="1">Báo cáo giao hàng chi tiết</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400"></div>
              <span className="text-[12px] text-slate-500 font-medium">
                Gợi ý
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* TRẢ HÀNG */}
        <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm flex flex-col min-h-[250px]">
          <div className="p-5 flex justify-between items-start border-b border-slate-50">
            <div>
              <h2 className="text-[14px] font-black text-slate-700 uppercase tracking-wider">
                Trả hàng
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                7 ngày qua
              </p>
            </div>
            <div className="text-[24px] font-black text-blue-600 tracking-tighter">
              0
            </div>
          </div>
          <div className="p-5 space-y-1">
            <ReportLink label="Trả hàng theo đơn hàng" icon={FileText} />
            <ReportLink label="Trả hàng theo sản phẩm" icon={Package} />
          </div>
        </div>

        {/* THANH TOÁN */}
        <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm flex flex-col min-h-[250px]">
          <div className="p-5 flex justify-between items-start border-b border-slate-50">
            <div>
              <h2 className="text-[14px] font-black text-slate-700 uppercase tracking-wider">
                Thanh toán
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                7 ngày qua
              </p>
            </div>
            <div className="text-[24px] font-black text-blue-600 tracking-tighter">
              0
            </div>
          </div>
          <div className="p-5 space-y-1">
            <ReportLink
              label="Báo cáo thanh toán theo thời gian"
              icon={Calendar}
            />
            <ReportLink
              label="Báo cáo thanh toán theo nhân viên"
              icon={Users}
            />
            <ReportLink
              label="Báo cáo theo phương thức thanh toán"
              icon={CreditCard}
            />
            <ReportLink
              label="Báo cáo thanh toán theo chi nhánh"
              icon={TrendingUp}
            />
          </div>
        </div>

        {/* ĐƠN HÀNG */}
        <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm flex flex-col min-h-[250px]">
          <div className="p-5 flex justify-between items-start border-b border-slate-50">
            <div>
              <h2 className="text-[14px] font-black text-slate-700 uppercase tracking-wider">
                Đơn hàng
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                7 ngày qua
              </p>
            </div>
            <div className="text-[24px] font-black text-blue-600 tracking-tighter">
              0
            </div>
          </div>
          <div className="p-5 space-y-1">
            <ReportLink
              label="Báo cáo thống kê theo đơn hàng"
              icon={FileText}
              isNew={true}
            />
            <ReportLink label="Báo cáo thống kê theo sản phẩm" icon={Package} />
            <ReportLink label="Báo cáo bán hàng chi tiết" icon={FileText} />
          </div>
        </div>
      </div>
    </div>
  );
}
