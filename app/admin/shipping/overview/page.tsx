"use client";

import React from "react";
import {
  Calendar,
  ChevronDown,
  MapPin,
  Building2,
  PlusCircle,
  FileBarChart2,
  Package,
  Truck,
  RotateCcw,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Clock,
  CircleDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function ShippingOverviewPage() {
  return (
    <div className="space-y-6 p-6 bg-[#f8fafc] min-h-screen pb-20 overflow-x-hidden">
      {/* Header Section */}
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-xl font-bold text-slate-900 whitespace-nowrap">
          Tổng quan vận chuyển
        </h1>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-9 shrink-0">
          <PlusCircle size={18} />{" "}
          <span className="whitespace-nowrap">Kết nối vận chuyển</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select defaultValue="7days">
          <SelectTrigger className="w-fit min-w-[260px] bg-white h-9 border-slate-200 gap-3 px-3">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-slate-400 shrink-0" />
              <div className="truncate max-w-[200px]">
                <SelectValue placeholder="Chọn thời gian" />
              </div>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">
              7 ngày qua (07/02 - 13/02/2026)
            </SelectItem>
            <SelectItem value="30days">30 ngày qua</SelectItem>
            <SelectItem value="thismonth">Tháng này</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="all">
          <SelectTrigger className="w-fit min-w-[180px] bg-white h-9 border-slate-200">
            <SelectValue placeholder="Tất cả chi nhánh" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả chi nhánh</SelectItem>
            <SelectItem value="hn">Chi nhánh Hà Nội</SelectItem>
            <SelectItem value="st">Chi nhánh Sóc Trăng</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="all">
          <SelectTrigger className="w-fit min-w-[150px] bg-white h-9 border-slate-200">
            <SelectValue placeholder="Khu vực" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả khu vực</SelectItem>
            <SelectItem value="north">Miền Bắc</SelectItem>
            <SelectItem value="south">Miền Nam</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Section - Scrollable */}
      <div className="bg-white border border-slate-200 rounded-lg p-1 overflow-x-auto no-scrollbar shadow-sm">
        <div className="flex divide-x divide-slate-100 min-w-max">
          <StatCard
            title="Chờ lấy hàng"
            value="0"
            cod="0₫"
            icon={Clock}
            color="text-amber-500"
          />
          <StatCard
            title="Đã lấy hàng"
            value="0"
            cod="0₫"
            icon={Package}
            color="text-blue-500"
          />
          <StatCard
            title="Đang giao hàng"
            value="0"
            cod="0₫"
            icon={Truck}
            color="text-indigo-500"
          />
          <StatCard
            title="Chờ giao lại"
            value="0"
            cod="0₫"
            icon={RotateCcw}
            color="text-orange-500"
          />
          <StatCard
            title="Đang hoàn hàng"
            value="0"
            cod="0₫"
            icon={RefreshCcw}
            color="text-rose-500"
          />
          <StatCard
            title="Đã hoàn hàng"
            value="0"
            cod="0₫"
            icon={CheckCircle2}
            color="text-slate-500"
          />
          <StatCard
            title="Đã giao hàng"
            value="0"
            cod="0₫"
            icon={CheckCircle2}
            color="text-emerald-500"
          />
          <StatCard
            title="Huỷ giao hàng"
            value="0"
            cod="0₫"
            icon={XCircle}
            color="text-red-500"
          />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartPlaceholder title="Thời gian lấy hàng thành công trung bình" />
        <ChartPlaceholder title="Thời gian giao hàng thành công trung bình" />
        <ChartPlaceholder title="Tỉ lệ giao hàng thành công" />
        <ChartPlaceholder title="Tỉ trọng vận đơn" />
      </div>
    </div>
  );
}

function StatCard({ title, value, cod, icon: Icon, color }: any) {
  return (
    <div className="flex-1 p-4 px-6 min-w-max shrink-0">
      <p className="text-[12px] font-medium text-slate-500 mb-1 whitespace-nowrap">
        {title}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-slate-900">{value}</span>
      </div>
      <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400 whitespace-nowrap">
        <CircleDollarSign size={12} className="shrink-0" />
        <span>COD:</span>
        <span className="font-bold">{cod}</span>
      </div>
    </div>
  );
}

function ChartPlaceholder({ title }: { title: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 min-h-[300px] flex flex-col shadow-sm">
      <h3 className="text-sm font-bold text-slate-700 mb-8 uppercase tracking-tight leading-relaxed">
        {title}
      </h3>
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
        <div className="relative w-32 h-32 opacity-20 group">
          <div className="absolute inset-0 flex items-center justify-center">
            <FileBarChart2 size={64} className="text-slate-400" />
          </div>
          <div className="absolute top-0 right-0">
            <XCircle size={20} className="text-slate-400" />
          </div>
        </div>
        <p className="text-sm font-medium text-slate-400">
          Chưa có dữ liệu báo cáo
        </p>
      </div>
    </div>
  );
}
