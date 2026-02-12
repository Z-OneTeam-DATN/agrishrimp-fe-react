"use client";

import React, { useState } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminTransferTable } from "@/components/admin/AdminTransferTable";
import { Download, Upload } from "lucide-react";

const outboundData: any[] = [
  { id: "1", code: "PDC00005", date: "12/02/2026 10:30", toWarehouse: "Kho Sóc Trăng", totalQty: 150, totalValue: 45000000, status: "TRANSIT", creator: "Admin" },
  { id: "2", code: "PDC00004", date: "11/02/2026 15:45", toWarehouse: "Kho Bạc Liêu", totalQty: 85, totalValue: 22000000, status: "COMPLETED", creator: "Admin" },
];

const inboundData: any[] = [
  { id: "3", code: "PDC00003", date: "12/02/2026 08:20", fromWarehouse: "Kho Tổng (Trụ sở)", totalQty: 200, totalValue: 60000000, status: "TRANSIT", creator: "Nhiên Lê" },
  { id: "4", code: "PDC00002", date: "10/02/2026 14:10", fromWarehouse: "Kho Tổng (Trụ sở)", totalQty: 50, totalValue: 15000000, status: "COMPLETED", creator: "Nhiên Lê" },
];

const statusFilters = [
  { label: "Tất cả trạng thái", value: "all" },
  { label: "Bản nháp", value: "DRAFT" },
  { label: "Chờ duyệt", value: "PENDING" },
  { label: "Đang chuyển", value: "TRANSIT" },
  { label: "Đã hoàn tất", value: "COMPLETED" },
  { label: "Đã hủy", value: "CANCELLED" },
];

const warehouseFilters = [
  { label: "Tất cả kho", value: "all" },
  { label: "Kho Tổng", value: "tong" },
  { label: "Kho Sóc Trăng", value: "st" },
  { label: "Kho Bạc Liêu", value: "bl" },
];

export default function AdminTransferListPage() {
  const [activeTab, setActiveTab] = useState("outbound");

  return (
    <div className="space-y-3">
      <AdminPageHeader 
        title="Quản lý điều chuyển kho" 
        addBtnLabel="Lập lệnh điều chuyển"
        addBtnHref="/inventory/transfers/new"
        secondaryBtnLabel="Xuất Excel"
        secondaryBtnIcon={Download}
        tabs={[
          { id: "outbound", label: "Hàng Xuất (Gửi đi)", count: outboundData.length, color: "text-blue-600" },
          { id: "inbound", label: "Hàng Nhập (Sắp về)", count: inboundData.length, color: "text-orange-600" }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
        <AdminSearchFilter 
          placeholder="Tìm mã phiếu, mã hàng, người tạo..." 
          filter1Placeholder="Lọc theo kho"
          filter1Options={warehouseFilters}
          filter2Placeholder="Trạng thái"
          filter2Options={statusFilters}
          onRefresh={() => console.log("Refreshing transfers...")}
        />
        
        {activeTab === "outbound" ? (
          <AdminTransferTable data={outboundData} mode="outbound" />
        ) : (
          <AdminTransferTable data={inboundData} mode="inbound" />
        )}
      </div>
    </div>
  );
}
