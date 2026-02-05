"use client";

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  FileDown, 
  Printer, 
  Calendar,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import dynamic from "next/dynamic";

// Khắc phục lỗi Recharts bị trắng/lỗi SSR bằng Dynamic Import
const ResponsiveContainer = dynamic(() => import("recharts").then((re) => re.ResponsiveContainer), { ssr: false }) as any;
const AreaChart = dynamic(() => import("recharts").then((re) => re.AreaChart), { ssr: false }) as any;
const Area = dynamic(() => import("recharts").then((re) => re.Area), { ssr: false }) as any;
const XAxis = dynamic(() => import("recharts").then((re) => re.XAxis), { ssr: false }) as any;
const YAxis = dynamic(() => import("recharts").then((re) => re.YAxis), { ssr: false }) as any;
const CartesianGrid = dynamic(() => import("recharts").then((re) => re.CartesianGrid), { ssr: false }) as any;
const Tooltip = dynamic(() => import("recharts").then((re) => re.Tooltip), { ssr: false }) as any;
const PieChart = dynamic(() => import("recharts").then((re) => re.PieChart), { ssr: false }) as any;
const Pie = dynamic(() => import("recharts").then((re) => re.Pie), { ssr: false }) as any;
const Cell = dynamic(() => import("recharts").then((re) => re.Cell), { ssr: false }) as any;
const Legend = dynamic(() => import("recharts").then((re) => re.Legend), { ssr: false }) as any;
const BarChart = dynamic(() => import("recharts").then((re) => re.BarChart), { ssr: false }) as any;
const Bar = dynamic(() => import("recharts").then((re) => re.Bar), { ssr: false }) as any;

// Mock data cho báo cáo
const monthlyData = [
  { name: "T8", nhap: 450, xuat: 320, ton: 2100 },
  { name: "T9", nhap: 520, xuat: 410, ton: 2210 },
  { name: "T10", nhap: 380, xuat: 450, ton: 2140 },
  { name: "T11", nhap: 610, xuat: 390, ton: 2360 },
  { name: "T12", nhap: 550, xuat: 580, ton: 2330 },
  { name: "T1", nhap: 670, xuat: 420, ton: 2580 },
];

const categoryData = [
  { name: "Thức ăn tôm", value: 1200, color: "#3b82f6" },
  { name: "Thuốc & Vi sinh", value: 850, color: "#10b981" },
  { name: "Hóa chất", value: 450, color: "#f59e0b" },
  { name: "Dụng cụ nuôi", value: 300, color: "#8b5cf6" },
];

const topProducts = [
  { name: "Grobest 40% đạm", value: 450, trend: "up" },
  { name: "Vi sinh BZT", value: 380, trend: "up" },
  { name: "Azomite khoáng", value: 320, trend: "down" },
  { name: "Clorin cá heo", value: 280, trend: "up" },
  { name: "Máy sục khí 2HP", value: 210, trend: "neutral" },
];

export default function ReportsPage() {
  const [mounted, setMounted] = useState(false);

  // Đảm bảo Recharts chỉ render trên client để tránh lỗi Hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="p-8 text-slate-400">Đang tải dữ liệu phân tích...</div>;

  return (
    <div className="space-y-6 pb-10">
      {/* Header tinh tế */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="text-blue-600" size={24} /> BÁO CÁO PHÂN TÍCH
          </h1>
          <p className="text-slate-500 text-[13px] mt-1">Dữ liệu thông minh hỗ trợ quyết định vận hành</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select defaultValue="this-month">
            <SelectTrigger className="w-[160px] h-[36px] text-[13px] bg-white border-slate-200 rounded-lg font-semibold">
              <Calendar className="mr-2 h-4 w-4 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">Tháng hiện tại</SelectItem>
              <SelectItem value="last-month">Tháng trước</SelectItem>
              <SelectItem value="this-year">Năm nay</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="h-[36px] border-slate-200 bg-white font-bold text-slate-700 rounded-lg hover:bg-slate-50">
            <FileDown className="mr-2 h-4 w-4 text-green-600" /> Xuất PDF
          </Button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tổng giá trị nhập", value: "1.28 tỷ", trend: "+12%", up: true },
          { label: "Giá trị xuất kho", value: "945 triệu", trend: "-5%", up: false },
          { label: "Tồn kho thực tế", value: "2.58 tỷ", trend: "+8%", up: true },
          { label: "Tỷ lệ quay vòng", value: "4.2 lần", trend: "Ổn định", up: true },
        ].map((kpi, i) => (
          <div key={i} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</p>
            <div className="flex items-end justify-between mt-1">
              <h3 className="text-2xl font-black text-slate-900">{kpi.value}</h3>
              <span className={cn(
                "text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5",
                kpi.up ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>
                {kpi.trend} {kpi.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sơ đồ xu hướng chính */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                <TrendingUp size={16} />
              </div>
              <div>
                <CardTitle className="text-[15px] font-bold">Biến động Nhập - Xuất hàng tháng</CardTitle>
                <CardDescription className="text-[11px]">Đơn vị tính: Triệu VNĐ</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorNhap" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="nhap" name="Nhập hàng" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorNhap)" />
                  <Area type="monotone" dataKey="xuat" name="Xuất hàng" stroke="#f59e0b" strokeWidth={3} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sơ đồ cơ cấu tài sản */}
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                <PieChartIcon size={16} />
              </div>
              <CardTitle className="text-[15px] font-bold">Cơ cấu giá trị kho</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    verticalAlign="bottom" 
                    align="center" 
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Biểu đồ thanh dọc: Top hàng hóa */}
        <Card className="lg:col-span-3 border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                <BarChart3 size={16} />
              </div>
              <CardTitle className="text-[15px] font-bold">Xếp hạng hàng hóa luân chuyển mạnh nhất</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    width={150}
                    tick={{fontSize: 12, fontWeight: 600, fill: '#475569'}}
                  />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="value" name="Chỉ số luân chuyển" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}