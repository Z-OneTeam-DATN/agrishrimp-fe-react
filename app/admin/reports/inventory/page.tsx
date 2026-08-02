"use client";

import React from "react";
import {
  HelpCircle,
  Warehouse,
  ClipboardList,
  TrendingDown,
  PackageSearch,
  ArrowLeftRight,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { P } from "@/lib/permissions";

const inventoryReports = [
  {
    id: "stock-summary",
    title: "Báo cáo tồn kho",
    description:
      "Quản lý số lượng và giá trị tồn kho của chi nhánh và toàn hệ thống",
    icon: Warehouse,
    href: "/admin/reports/inventory/summary",
  },
  {
    id: "stock-ledger",
    title: "Sổ kho",
    description: "Quản lý lịch sử giao dịch xuất nhập kho",
    icon: ClipboardList,
    href: "/admin/reports/inventory/ledger",
  },
  {
    id: "stock-below-min",
    title: "Báo cáo tồn kho dưới định mức",
    description: "Quản lý các sản phẩm có tồn kho dưới định mức",
    icon: TrendingDown,
    href: "/admin/reports/inventory/below-min",
  },
  {
    id: "io-summary",
    title: "Báo cáo xuất nhập tồn sản phẩm",
    description:
      "Quản lý tồn đầu kỳ, nhập trong kỳ và tồn cuối kỳ của sản phẩm",
    icon: ArrowLeftRight,
    href: "/admin/reports/inventory/io-summary",
  },
  {
    id: "inventory-check",
    title: "Báo cáo kiểm kê hàng hóa",
    description:
      "Quản lý các thông tin khi kiểm hàng, số lượng hàng hỏng và lý do",
    icon: PackageSearch,
    href: "/admin/reports/inventory/check",
  },
];

export default function InventoryReportListPage() {
  return (
    <PermissionGuard permission={P.REPORT_INVENTORY_VIEW}>
      <InventoryReportListContent />
    </PermissionGuard>
  );
}

function InventoryReportListContent() {
  return (
    <div className="space-y-3">
      <div className="mt-2 mb-8">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
            Báo cáo nhập xuất tồn
          </h1>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              className="h-[38px] border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-600 shadow-none hover:bg-blue-50 hover:text-blue-600"
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              Trợ giúp
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Danh mục báo cáo kho
            </p>
          </div>

          <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
            {inventoryReports.map((report, index) => (
              <Link key={report.id} href={report.href}>
                <div
                  className={[
                    "group flex min-h-[128px] items-start gap-4 border-b border-slate-100 p-5 transition-colors hover:bg-[#f0f8ff]",
                    index % 2 === 0 ? "md:border-r md:border-slate-100" : "",
                    index >= inventoryReports.length - (inventoryReports.length % 2 === 0 ? 2 : 1)
                      ? "border-b-0"
                      : "",
                  ].join(" ")}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition-colors group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-600">
                    <report.icon size={22} strokeWidth={1.75} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-[15px] font-semibold tracking-tight text-slate-900 transition-colors group-hover:text-blue-600">
                      {report.title}
                    </h3>
                    <p className="mt-1 text-[13px] leading-6 text-slate-500">
                      {report.description}
                    </p>
                  </div>

                  <div className="pt-1 text-slate-300 transition-colors group-hover:text-blue-500">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-100 bg-[#f8f9fa] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Tổng số {inventoryReports.length} báo cáo kho
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
