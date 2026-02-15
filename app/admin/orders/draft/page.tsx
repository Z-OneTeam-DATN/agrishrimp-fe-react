"use client";

import React, { useState } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminDraftOrderTable } from "@/components/admin/AdminDraftOrderTable"; 
import { Button } from "@/components/ui/button";

// Dữ liệu mẫu
const draftOrders = [
  {
    id: "DRAFT-1005",
    customerName: "Nguyễn Hoàng Gia Huy",
    customerPhone: "0901234567",
    totalAmount: "1.250.000 ₫",
    source: "Tại quầy",
    createdAt: "15/02/2026 14:30",
    note: "Đợi khách chuyển khoản cọc",
    items: [
        { productName: "Thức ăn cho tôm bao", sku: "TACT010", quantity: 2, totalPrice: "220.000 ₫" },
        { productName: "Vi sinh xử lý đáy", sku: "VS-PRO", quantity: 1, totalPrice: "1.030.000 ₫" }
    ]
  },
  {
    id: "DRAFT-1006",
    customerName: "Trần Thị B",
    customerPhone: "0988777666",
    totalAmount: "330.000 ₫",
    source: "Website",
    createdAt: "15/02/2026 15:45",
    note: "Khách hỏi thêm về cách sử dụng",
    items: [
        { productName: "Thức ăn cho tôm bao", sku: "TACT010", quantity: 3, totalPrice: "330.000 ₫" }
    ]
  }
];

export default function DraftOrderListPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <div className="space-y-3">
      {/* 1. Header đồng bộ style */}
      <AdminPageHeader
        title="Đơn hàng nháp"
        addBtnLabel="Tạo đơn nháp mới"
        addBtnHref="/admin/orders/add"
      />

      {/* 2. Khung nội dung chính */}
      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm overflow-hidden mb-8">

        {/* 3. Khung tìm kiếm và lọc */}
        <AdminSearchFilter
          placeholder="Tìm đơn nháp..."
          filter1Placeholder="Người tạo"
          filter1Options={[{label: "Tất cả", value: "all"}]}
          filter2Placeholder="Nguồn đơn"
          filter2Options={[{label: "Website", value: "web"}, {label: "Tại quầy", value: "pos"}]}
          onRefresh={handleRefresh}
        />

        {/* 4. Bảng hiển thị dữ liệu */}
        {isLoading ? (
          <div className="p-20 text-center text-[12px] font-bold text-slate-400 uppercase animate-pulse">
              ĐANG TẢI...
          </div>
        ) : (
          <AdminDraftOrderTable orders={draftOrders} />
        )}

        {/* 5. PHÂN TRANG (Mới thêm vào cho giống ảnh c7abed.png) */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#eee] bg-[#f8f9fa]">
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">
                Hiển thị 1 - {draftOrders.length} của {draftOrders.length} đơn nháp
            </p>
            <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] bg-white border-slate-300 text-slate-600 hover:bg-slate-50" disabled>
                    Trước
                </Button>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-[11px] bg-blue-600 text-white border-blue-600 hover:bg-blue-700">
                    1
                </Button>
                <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] bg-white border-slate-300 text-slate-600 hover:bg-slate-50" disabled>
                    Sau
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}