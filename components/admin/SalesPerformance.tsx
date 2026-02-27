"use client";

import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const data = [
  { name: "20/02", revenue: 4000000, orders: 24 },
  { name: "21/02", revenue: 3000000, orders: 18 },
  { name: "22/02", revenue: 5000000, orders: 32 },
  { name: "23/02", revenue: 4500000, orders: 28 },
  { name: "24/02", revenue: 6000000, orders: 38 },
  { name: "25/02", revenue: 7500000, orders: 45 },
  { name: "26/02", revenue: 8200000, orders: 52 },
];

const proportionData = [
  { name: "Thức ăn", value: 45 },
  { name: "Thuốc thú y", value: 25 },
  { name: "Khoáng chất", value: 20 },
  { name: "Thiết bị", value: 10 },
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function SalesPerformance() {
  const [activeTab, setActiveTab] = useState("revenue");

  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-sm mt-4">
      <div className="px-4 border-b border-gray-100 flex justify-between items-center">
        <div className="flex">
          <button
            onClick={() => setActiveTab("revenue")}
            className={`px-4 py-3 text-xs font-bold uppercase border-b-2 transition-colors ${
              activeTab === "revenue"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Doanh thu bán hàng
          </button>
          <button
            onClick={() => setActiveTab("proportion")}
            className={`px-4 py-3 text-xs font-bold uppercase border-b-2 transition-colors ${
              activeTab === "proportion"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Tỷ trọng bán hàng
          </button>
        </div>
        <div className="flex gap-2 py-2">
          <div className="w-40">
            <Select defaultValue="all">
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tất cả chi nhánh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                <SelectItem value="cn1">Chi nhánh Quận 1</SelectItem>
                <SelectItem value="cn2">Chi nhánh Quận 7</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-32">
            <Select defaultValue="7days">
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="7 ngày qua" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">7 ngày qua</SelectItem>
                <SelectItem value="30days">30 ngày qua</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="p-6 h-[350px]">
        {activeTab === "revenue" ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickFormatter={(value) => `${value / 1000000}M`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #f1f5f9",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={proportionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {proportionData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
