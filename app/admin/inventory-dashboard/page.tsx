"use client";

import React from "react";
import { 
  RotateCw, 
  Clock, 
  ChevronRight, 
  Layers,
  ArrowDownToLine,
  ArrowUpFromLine,
  ShoppingCart,
  FileSearch,
  Truck,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatItem {
  val: number;
  label: string;
  colorClass: string;
  bgClass: string;
  width: string;
}

interface DashCardProps {
  title: string;
  totalAction: string;
  icon: React.ElementType;
  iconColor: string;
  stats: StatItem[];
  time: string;
}

const BusinessCard = ({ title, totalAction, icon: Icon, iconColor, stats, time }: DashCardProps) => {
  return (
    <div className="bg-white border border-slate-200 rounded-none shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full overflow-hidden group">
      <div className="p-3 flex justify-between items-start gap-2">
        <div className="flex gap-2.5 min-w-0 flex-1">
          <div className={cn("p-2 rounded-none flex-shrink-0 transition-colors", iconColor)}>
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <h5 className="text-[14px] font-bold text-slate-800 leading-tight truncate uppercase" title={title}>{title}</h5>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 whitespace-nowrap font-bold">
              <Clock size={10} className="flex-shrink-0" /> CẬP NHẬT: {time}
            </p>
          </div>
        </div>
        <button className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-none border border-blue-100 flex items-center gap-0.5 flex-shrink-0 whitespace-nowrap hover:bg-blue-600 hover:text-white transition-all uppercase">
          {totalAction} <ChevronRight size={10} className="flex-shrink-0" />
        </button>
      </div>

      <div className="px-4 py-2 flex items-center justify-between gap-1 overflow-hidden">
        {stats.map((item, idx) => (
          <React.Fragment key={idx}>
            <div className="flex flex-col items-start min-w-0 group/item flex-1">
              <span className={cn("text-[16px] font-black tracking-tight whitespace-nowrap", item.colorClass)}>
                {item.val}
              </span>
              <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap uppercase tracking-tighter truncate w-full" title={item.label}>
                {item.label}
              </span>
            </div>
            {idx < stats.length - 1 && (
              <div className="h-6 w-[1px] bg-slate-100 flex-shrink-0 mx-1" />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="px-4 mt-3 mb-4">
        <div className="flex h-1.5 w-full rounded-none overflow-hidden bg-slate-100 ring-1 ring-slate-50 flex-shrink-0">
          {stats.map((item, idx) => (
            <div 
              key={idx} 
              className={cn("h-full transition-all duration-500 flex-shrink-0", item.bgClass)} 
              style={{ width: item.width }} 
            />
          ))}
        </div>
      </div>

      <div className="mt-auto bg-slate-50/30 p-2 border-t border-slate-100 flex justify-center flex-shrink-0">
        <button className="text-[10px] font-black text-slate-400 uppercase hover:text-blue-600 flex items-center gap-1.5 transition-colors whitespace-nowrap">
          <RotateCw size={10} className="flex-shrink-0" /> Làm mới dữ liệu
        </button>
      </div>
    </div>
  );
};

export default function WarehouseDashboard() {
  const businessWorkflows = [
    {
      title: "Lệnh nhập kho",
      totalAction: "35 Cần làm",
      icon: ArrowDownToLine,
      iconColor: "bg-emerald-50 text-emerald-600",
      time: "08:00",
      stats: [
        { val: 5, label: "Quá hạn", colorClass: "text-rose-500", bgClass: "bg-rose-500", width: "15%" },
        { val: 4, label: "Chờ nhận", colorClass: "text-emerald-600", bgClass: "bg-emerald-500", width: "15%" },
        { val: 14, label: "Chờ kiểm", colorClass: "text-amber-500", bgClass: "bg-amber-500", width: "40%" },
        { val: 17, label: "Khác", colorClass: "text-slate-400", bgClass: "bg-slate-300", width: "30%" },
      ]
    },
    {
      title: "Lệnh xuất kho",
      totalAction: "33 Cần làm",
      icon: ArrowUpFromLine,
      iconColor: "bg-blue-50 text-blue-600",
      time: "08:00",
      stats: [
        { val: 10, label: "Quá hạn", colorClass: "text-rose-500", bgClass: "bg-rose-500", width: "25%" },
        { val: 4, label: "Chờ lấy", colorClass: "text-blue-600", bgClass: "bg-blue-500", width: "10%" },
        { val: 8, label: "Đóng gói", colorClass: "text-indigo-500", bgClass: "bg-indigo-500", width: "20%" },
        { val: 21, label: "Đã xong", colorClass: "text-emerald-500", bgClass: "bg-emerald-400", width: "45%" },
      ]
    },
    {
      title: "Đơn mua hàng",
      totalAction: "17 Cần làm",
      icon: ShoppingCart,
      iconColor: "bg-indigo-50 text-indigo-600",
      time: "08:00",
      stats: [
        { val: 4, label: "Quá hạn", colorClass: "text-rose-500", bgClass: "bg-rose-500", width: "20%" },
        { val: 3, label: "Chưa duyệt", colorClass: "text-amber-600", bgClass: "bg-amber-500", width: "20%" },
        { val: 14, label: "Đang giao", colorClass: "text-indigo-600", bgClass: "bg-indigo-500", width: "60%" },
      ]
    },
    {
      title: "Kiểm kê định kỳ",
      totalAction: "08 Đang chạy",
      icon: FileSearch,
      iconColor: "bg-purple-50 text-purple-600",
      time: "08:00",
      stats: [
        { val: 5, label: "Chưa khớp", colorClass: "text-amber-600", bgClass: "bg-amber-500", width: "60%" },
        { val: 3, label: "Đang kiểm", colorClass: "text-purple-600", bgClass: "bg-purple-500", width: "40%" },
      ]
    },
    {
      title: "Điều chuyển kho",
      totalAction: "20 Yêu cầu",
      icon: Truck,
      iconColor: "bg-cyan-50 text-cyan-600",
      time: "08:00",
      stats: [
        { val: 5, label: "Chờ xe", colorClass: "text-rose-500", bgClass: "bg-rose-500", width: "20%" },
        { val: 12, label: "Đang đi", colorClass: "text-cyan-600", bgClass: "bg-cyan-500", width: "50%" },
        { val: 8, label: "Đã đến", colorClass: "text-emerald-600", bgClass: "bg-emerald-500", width: "30%" },
      ]
    },
    {
      title: "Đơn hàng chi nhánh",
      totalAction: "15 Đơn",
      icon: ShoppingCart,
      iconColor: "bg-pink-50 text-pink-600",
      time: "08:00",
      stats: [
        { val: 3, label: "Mới", colorClass: "text-blue-600", bgClass: "bg-blue-500", width: "20%" },
        { val: 7, label: "Chờ lấy", colorClass: "text-amber-600", bgClass: "bg-amber-500", width: "50%" },
        { val: 5, label: "Đang giao", colorClass: "text-indigo-600", bgClass: "bg-indigo-500", width: "30%" },
      ]
    },
    {
      title: "Hạn dùng & Cảnh báo",
      totalAction: "Rà soát",
      icon: AlertCircle,
      iconColor: "bg-orange-50 text-orange-600",
      time: "08:00",
      stats: [
        { val: 2, label: "Hết hạn", colorClass: "text-rose-600", bgClass: "bg-rose-600", width: "20%" },
        { val: 12, label: "Sắp hết", colorClass: "text-amber-600", bgClass: "bg-amber-500", width: "80%" },
      ]
    },
    {
      title: "Vận chuyển & Logistics",
      totalAction: "Chi tiết",
      icon: Layers,
      iconColor: "bg-slate-100 text-slate-700",
      time: "08:00",
      stats: [
        { val: 4, label: "Tài xế", colorClass: "text-slate-700", bgClass: "bg-slate-500", width: "40%" },
        { val: 1, label: "Sự cố", colorClass: "text-rose-500", bgClass: "bg-rose-500", width: "10%" },
        { val: 8, label: "Hoàn tất", colorClass: "text-emerald-600", bgClass: "bg-emerald-500", width: "50%" },
      ]
    }
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <h1 className="text-[22px] font-black text-slate-900 tracking-tight uppercase">Bàn làm việc kho</h1>
          <p className="text-slate-500 text-[12px] mt-1 flex items-center gap-2 font-medium">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Hệ thống vận hành ổn định. Bạn có <b className="text-slate-800">12 nhiệm vụ</b> kho cần xử lý.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {businessWorkflows.map((card, index) => (
          <BusinessCard key={index} {...card} />
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-100 p-5 rounded-none flex items-start gap-4">
        <AlertCircle className="text-amber-600 mt-0.5" size={24} />
        <div>
          <h6 className="text-[14px] font-black text-amber-900 uppercase tracking-tight">Thông báo vận hành quan trọng</h6>
          <p className="text-[13px] text-amber-800/80 font-medium mt-1">Kho lạnh chi nhánh Cần Thơ đang đạt ngưỡng 95% công suất. Vui lòng xem xét điều chuyển hàng hóa sang các kho lân cận để đảm bảo chất lượng bảo quản.</p>
        </div>
      </div>
    </div>
  );
}
