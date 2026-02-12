"use client";

import React from "react";
import { 
  HelpCircle, Warehouse, ClipboardList, 
  TrendingDown, TrendingUp, PackageSearch, 
  ArrowLeftRight, FileBarChart2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const inventoryReports = [
  {
    id: "stock-summary",
    title: "Báo cáo tồn kho",
    description: "Quản lý số lượng và giá trị tồn kho của chi nhánh và toàn hệ thống",
    icon: Warehouse,
    href: "/admin/reports/inventory/summary"
  },
  {
    id: "stock-detail",
    title: "Báo cáo tồn kho chi tiết",
    description: "Quản lý hàng hóa ở các trạng thái khác nhau",
    icon: FileBarChart2,
    href: "/admin/reports/inventory/detail"
  },
  {
    id: "stock-ledger",
    title: "Sổ kho",
    description: "Quản lý lịch sử giao dịch xuất nhập kho",
    icon: ClipboardList,
    href: "/admin/reports/inventory/ledger"
  },
  {
    id: "stock-below-min",
    title: "Báo cáo tồn kho dưới định mức",
    description: "Quản lý các sản phẩm có tồn kho dưới định mức",
    icon: TrendingDown,
    href: "/admin/reports/inventory/below-min"
  },
  {
    id: "stock-above-max",
    title: "Báo cáo tồn kho vượt định mức",
    description: "Quản lý các sản phẩm có tồn kho vượt định mức",
    icon: TrendingUp,
    href: "/admin/reports/inventory/above-max"
  },
  {
    id: "io-summary",
    title: "Báo cáo xuất nhập tồn sản phẩm",
    description: "Quản lý tồn đầu kỳ, nhập trong kỳ và tồn cuối kỳ của sản phẩm",
    icon: ArrowLeftRight,
    href: "/admin/reports/inventory/io-summary"
  },
  {
    id: "inventory-check",
    title: "Báo cáo kiểm kê hàng hóa",
    description: "Quản lý các thông tin khi kiểm hàng, số lượng hàng hỏng và lý do",
    icon: PackageSearch,
    href: "/admin/reports/inventory/check"
  }
];

export default function InventoryReportListPage() {
  return (
    <div className="space-y-6 pb-10 bg-[#f0f2f5] min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-medium text-[#1f1f1f]">Danh sách báo cáo kho</h1>
        <Button variant="outline" className="bg-white border-[#dcdcdc] rounded-[4px] h-[36px] text-[13px] font-medium flex items-center gap-2">
          <HelpCircle size={18} className="text-slate-500" /> Trợ giúp
        </Button>
      </div>

      {/* Report Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {inventoryReports.map((report) => (
          <Link key={report.id} href={report.href}>
            <div className="bg-white border border-[#dcdcdc] p-6 flex items-start gap-4 hover:shadow-md transition-shadow cursor-pointer group min-h-[100px] items-center">
              <div className="text-slate-700 group-hover:text-blue-600 transition-colors shrink-0">
                <report.icon size={32} strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                <h3 className="text-[15px] font-bold text-[#1f1f1f] group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                  {report.title}
                </h3>
                <p className="text-[13px] text-slate-500 mt-0.5 leading-snug">
                  {report.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
