"use client";

import React, { useState } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { InventoryExportTable } from "@/components/inventory/InventoryExportTable";
import { InventoryExportReceiptTable } from "@/components/inventory/InventoryExportReceiptTable";
import { cn } from "@/lib/utils";

const warehouseFilters = [
  { label: "Tất cả kho", value: "all" },
  { label: "Kho Tổng (Trụ sở)", value: "tong" },
  { label: "Kho Sóc Trăng", value: "soc-trang" },
  { label: "Kho Bạc Liêu", value: "bac-lieu" },
];

const statusFilters = [
  { label: "Tất cả trạng thái", value: "all" },
  { label: "Đã hoàn thành", value: "completed" },
  { label: "Đang thực hiện", value: "in_progress" },
  { label: "Chờ thực hiện", value: "pending" },
];

const TABS = [
  { id: "commands", label: "Lệnh xuất kho" },
  { id: "exports", label: "Xuất kho" },
];

export default function AdminExportListPage() {
  const [activeTab, setActiveTab] = useState("commands");

  // Mock data for commands
  const exportCommands = [
    {
      code: "LXK00001",
      date: "12/02/2026",
      customerCode: "KH0012",
      customerName: "LÊ VĂN CHÂU",
      dueDate: "13/02/2026",
      warehouse: "Kho Tổng (Trụ sở)",
      assigner: "Nguyễn Văn Admin",
      executor: "Lê Thị Nhiên",
      status: "IN_PROGRESS",
      statusLabel: "Đang thực hiện",
      shippingStatusLabel: "Chờ lấy hàng",
    },
    {
      code: "LXK00002",
      date: "11/02/2026",
      customerCode: "KH0045",
      customerName: "NGUYỄN THỊ MAI",
      dueDate: "12/02/2026",
      warehouse: "Kho Sóc Trăng",
      assigner: "Nguyễn Văn Admin",
      executor: "Võ Thị Mỹ Thanh",
      status: "COMPLETED",
      statusLabel: "Hoàn thành",
      shippingStatusLabel: "Đã giao hàng",
    },
  ];

  // Mock data for receipts (Actual exports)
  const exportReceipts = [
    {
      code: "PXK00001",
      date: "12/02/2026 15:30",
      customerName: "LÊ VĂN CHÂU",
      warehouse: "Kho Tổng (Trụ sở)",
      branch: "Chi nhánh Hà Nội",
      description: "Xuất kho bán hàng theo đơn DH001",
      type: "Xuất bán",
      reference: "LXK00001",
    },
  ];

  return (
    <div className="space-y-0 flex flex-col h-full -m-4 md:-m-5 bg-[#f2f3f5]">
      {/* Title section - Background is now transparent (gray from parent) */}
      <div className="px-4 pt-4 flex items-center justify-between">
        <h1 className="text-[18px] font-bold text-[#1f1f1f]">
          {activeTab === "commands"
            ? "Quản lý lệnh xuất kho"
            : "Quản lý phiếu xuất kho"}
        </h1>
        <AdminPageHeader
          title=""
          addBtnLabel={
            activeTab === "commands" ? "Tạo lệnh xuất" : "Tạo phiếu xuất"
          }
          addBtnHref={
            activeTab === "commands"
              ? "/admin/exports/new-command"
              : "/admin/exports/new"
          }
        />
      </div>

      {/* Tab Navigation below title */}
      <div className="bg-[#eef0f2] border-b border-[#dcdcdc] px-4 flex items-center h-[40px] gap-1 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 h-full text-[12px] font-medium transition-all relative flex items-center justify-center",
              activeTab === tab.id
                ? "bg-white text-[#007bff] border-x border-t border-[#ccc] -mb-[1px] font-bold shadow-[0_-2px_5px_rgba(0,0,0,0.05)] rounded-t-[4px]"
                : "text-[#555] hover:bg-gray-200/50",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 md:p-5 space-y-3 flex-1 bg-white">
        <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
          <AdminSearchFilter
            placeholder={
              activeTab === "commands"
                ? "Tìm mã lệnh, tên đối tượng..."
                : "Tìm mã phiếu, khách hàng..."
            }
            filter1Placeholder="Lọc theo kho"
            filter1Options={warehouseFilters}
            filter2Placeholder="Trạng thái"
            filter2Options={statusFilters}
            onRefresh={() => console.log(`Refreshing ${activeTab}...`)}
          />

          {activeTab === "commands" ? (
            <InventoryExportTable exports={exportCommands} />
          ) : (
            <InventoryExportReceiptTable receipts={exportReceipts} />
          )}
        </div>
      </div>
    </div>
  );
}
