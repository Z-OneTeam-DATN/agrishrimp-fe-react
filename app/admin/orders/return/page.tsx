"use client";

import React, { useState } from "react";
// Đảm bảo đường dẫn import đúng với cấu trúc dự án của bạn
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminReturnOrderTable } from "@/components/admin/AdminReturnOrderTable"; 

// Mock dữ liệu đơn trả hàng (Đảm bảo cấu trúc khớp với Table bên dưới)
const returnOrders = [
  {
    id: "#1006-R1",
    createdAt: "15/02/2026 17:50",
    orderId: "#1006",
    customerName: "Bình Nguyễn",
    productsCount: "1 sản phẩm",
    refundStatus: "Chưa hoàn trả",
    receiveStatus: "Chưa nhận hàng",
    returnStatus: "Đang trả hàng",
    items: [
        { productName: "Thức ăn cho tôm", sku: "TACT010", quantity: 1, unitPrice: "110.000 ₫", totalPrice: "110.000 ₫" }
    ]
  },
  {
    id: "#1001",
    createdAt: "15/02/2026 01:01",
    orderId: "#1001",
    customerName: "---",
    productsCount: "1 sản phẩm",
    refundStatus: "Đã hoàn trả",
    receiveStatus: "Đã nhận hàng",
    returnStatus: "Đã hủy",
    items: [
        { productName: "Sản phẩm mẫu", sku: "SAMPLE-01", quantity: 1, unitPrice: "0 ₫", totalPrice: "0 ₫" }
    ]
  },
];

export default function ReturnOrdersPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    // Giả lập load lại dữ liệu
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <div className="space-y-3">
      {/* 1. Header */}
      <AdminPageHeader
        title="Danh sách đơn trả hàng"
        addBtnLabel="Tạo đơn trả hàng"
        addBtnHref="/admin/orders/returns/add"
      />

      {/* 2. Khung tìm kiếm và lọc */}
      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
        <AdminSearchFilter
          placeholder="Tìm kiếm theo khách hàng, số điện thoại khách hàng..."
          filter1Placeholder="Ngày tạo" 
          filter1Options={[{label: "Tất cả thời gian", value: "all"}]} 
          filter2Placeholder="Chi nhánh nhận hàng"
          filter2Options={[{label: "Cửa hàng chính", value: "main"}]}
          hideRefreshButton
          hideSettingsButton
          onRefresh={handleRefresh}
        />

        {/* 3. Bảng hiển thị dữ liệu trả hàng */}
        {isLoading ? (
          <div className="p-20 text-center text-[12px] font-bold text-slate-400 uppercase animate-pulse">
            Đang tải dữ liệu đơn trả hàng...
          </div>
        ) : (
          /* Truyền dữ liệu vào bảng */
          <AdminReturnOrderTable orders={returnOrders} />
        )}
      </div>
    </div>
  );
}
