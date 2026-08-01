"use client";

import React, { useState } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminIncompleteOrderTable } from "@/components/admin/AdminIncompleteOrderTable"; // Tuu viết ở bước 2

// Mock dữ liệu đơn chưa hoàn tất (Style giỏ hàng bị bỏ rơi)
const incompleteOrders = [
  {
    id: "#1008",
    createdAt: "15/02/2026 18:30",
    customerName: "Nguyễn Hoàng Gia Huy",
    customerPhone: "0901234567",
    totalAmount: "2.500.000 ₫",
    itemsCount: 3,
    recoveryStatus: "Chưa gửi nhắc nhở",
    source: "Website",
    items: [
        { productName: "Thức ăn cho tôm bao", sku: "TACT010", quantity: 2, totalPrice: "220.000 ₫" },
        { productName: "Máy sục khí mini", sku: "MSK-01", quantity: 1, totalPrice: "2.280.000 ₫" }
    ]
  },
  {
    id: "#1007",
    createdAt: "15/02/2026 15:20",
    customerName: "Lê Văn Tám",
    customerPhone: "0912333444",
    totalAmount: "450.000 ₫",
    itemsCount: 1,
    recoveryStatus: "Đã gửi email",
    source: "Website",
    items: [
        { productName: "Vôi nông nghiệp", sku: "VOI02", quantity: 8, totalPrice: "450.000 ₫" }
    ]
  },
];

export default function IncompleteOrdersPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
    console.log("Refreshing incomplete orders...");
  };

  return (
    <div className="space-y-3">
      {/* 1. Header đồng bộ style - Không có nút thêm mới vì đây là đơn tự động từ hệ thống */}
      <AdminPageHeader
        title="Đơn hàng chưa hoàn tất"
      />

      {/* 2. Khung tìm kiếm và lọc */}
      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm overflow-hidden mb-8">
        <AdminSearchFilter
          placeholder="Tìm theo khách hàng, SĐT hoặc mã giỏ hàng..."
          filter1Placeholder="Trạng thái nhắc nhở"
          filter1Options={[
            { label: "Tất cả", value: "all" },
            { label: "Đã gửi nhắc nhở", value: "sent" },
            { label: "Chưa gửi nhắc nhở", value: "not_sent" }
          ]}
          filter2Placeholder="Kênh bán hàng"
          filter2Options={[{ label: "Website", value: "web" }]}
          hideRefreshButton
          hideSettingsButton
          onRefresh={handleRefresh}
        />

        {/* 3. Bảng hiển thị dữ liệu đơn chưa hoàn tất */}
        {isLoading ? (
          <div className="p-20 text-center text-[12px] font-bold text-slate-400 uppercase animate-pulse">
            Đang tải dữ liệu...
          </div>
        ) : (
          <AdminIncompleteOrderTable orders={incompleteOrders} />
        )}
      </div>
    </div>
  );
}
