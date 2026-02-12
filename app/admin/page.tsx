"use client";

import React from "react";
import DailyBusinessResults from "@/components/admin/DailyBusinessResults";
import SalesPerformance from "@/components/admin/SalesPerformance";
import PendingOrders from "@/components/admin/PendingOrders";
import TopProducts from "@/components/admin/TopProducts";
import InventoryInfo from "@/components/admin/InventoryInfo";

export default function AdminDashboard() {
  return (
    <div className="space-y-4 pb-10 bg-gray-50/50 min-h-screen p-4">
      {/* 1. Kết quả kinh doanh trong ngày */}
      <DailyBusinessResults />

      {/* 2. Doanh thu bán hàng / Tỷ trọng bán hàng */}
      <SalesPerformance />

      {/* 3. Đơn hàng chờ xử lý */}
      <PendingOrders />

      {/* 4. Top sản phẩm & Thông tin kho */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopProducts />
        <InventoryInfo />
      </div>
    </div>
  );
}

