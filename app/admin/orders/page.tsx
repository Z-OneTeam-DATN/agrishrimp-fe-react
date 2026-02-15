"use client";

import React, { useState } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminOrderTable } from "@/components/admin/AdminOrderTable"; // Huy sẽ tạo file này tiếp theo

// Mock dữ liệu đơn hàng theo style AgriShrimp
const orders = [
  {
    id: "DH-2026-001",
    customerName: "Nguyễn Hoàng Gia Huy",
    customerPhone: "0901234567",
    totalAmount: "12.500.000 ₫",
    status: "Hoàn thành",
    paymentStatus: "Đã thanh toán",
    branch: "Chi nhánh Cần Thơ",
    createdAt: "14/02/2026 08:30",
  },
  {
    id: "DH-2026-002",
    customerName: "Lê Văn Tám",
    customerPhone: "0912333444",
    totalAmount: "3.200.000 ₫",
    status: "Đang giao",
    paymentStatus: "Chờ thanh toán",
    branch: "Tổng kho Bạc Liêu",
    createdAt: "14/02/2026 10:15",
  },
];

const statusFilters = [
  { label: "Tất cả trạng thái", value: "all" },
  { label: "Hoàn thành", value: "completed" },
  { label: "Đang giao", value: "shipping" },
  { label: "Đã hủy", value: "cancelled" },
];

const paymentFilters = [
  { label: "Tất cả thanh toán", value: "all" },
  { label: "Đã thanh toán", value: "paid" },
  { label: "Chờ thanh toán", value: "pending" },
];

export default function OrderListPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
    console.log("Refreshing orders...");
  };

  return (
    <div className="space-y-3">
      {/* 1. Header đồng bộ style */}
      <AdminPageHeader
        title="Quản lý đơn hàng bán"
        addBtnLabel="Tạo đơn hàng mới"
        addBtnHref="/admin/orders/add"
      />

      {/* 2. Khung tìm kiếm và lọc */}
      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
        <AdminSearchFilter
          placeholder="Tìm mã đơn, tên khách hàng, số điện thoại..."
          filter1Placeholder="Trạng thái đơn"
          filter1Options={statusFilters}
          filter2Placeholder="Thanh toán"
          filter2Options={paymentFilters}
          onRefresh={handleRefresh}
        />

        {/* 3. Bảng hiển thị dữ liệu (Huy sẽ dùng component table tương tự AdminProductTable) */}
        {isLoading ? (
          <div className="p-20 text-center text-[12px] font-bold text-slate-400 uppercase animate-pulse">
            Đang tải dữ liệu đơn hàng...
          </div>
        ) : (
          <AdminOrderTable orders={orders} />
        )}
      </div>
    </div>
  );
}
