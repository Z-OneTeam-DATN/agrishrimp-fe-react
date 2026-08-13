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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    workflow: "Cộng dồn số lượng tồn theo từng biến thể sản phẩm, tại 1 chi nhánh hoặc toàn hệ thống.",
    formula: "Giá trị tồn kho = Σ (Số lượng tồn × Giá nhập) trên từng lô hàng.",
    meaning: "Biết đang tồn bao nhiêu, giá trị bao nhiêu, sản phẩm nào chiếm tỷ trọng lớn.",
  },
  {
    id: "stock-ledger",
    title: "Sổ kho",
    description: "Quản lý lịch sử giao dịch xuất nhập kho",
    icon: ClipboardList,
    href: "/admin/reports/inventory/ledger",
    workflow: "Ghi lại từng giao dịch làm thay đổi tồn kho thực tế: nhập, xuất bán, điều chuyển, điều chỉnh kiểm kho, hoàn trả, hàng hỏng.",
    formula: "Tồn sau = Tồn trước + Số lượng thay đổi (giao dịch).",
    meaning: "Truy vết lịch sử biến động tồn kho của từng sản phẩm để đối soát khi có sai lệch.",
  },
  {
    id: "stock-below-min",
    title: "Báo cáo tồn kho dưới định mức",
    description: "Quản lý các sản phẩm có tồn kho dưới định mức",
    icon: TrendingDown,
    href: "/admin/reports/inventory/below-min",
    workflow: "So sánh tồn kho hiện tại của từng sản phẩm với định mức tối thiểu đã cấu hình.",
    formula: "Thiếu hụt = max(0, Định mức tối thiểu − Tồn hiện tại).",
    meaning: "Biết ngay sản phẩm nào sắp hết/đã hết để chủ động nhập thêm, tránh đứt hàng.",
  },
  {
    id: "io-summary",
    title: "Báo cáo xuất nhập tồn sản phẩm",
    description:
      "Quản lý tồn đầu kỳ, nhập trong kỳ và tồn cuối kỳ của sản phẩm",
    icon: ArrowLeftRight,
    href: "/admin/reports/inventory/io-summary",
    workflow: "Tính tồn đầu kỳ, tổng nhập, tổng xuất và tồn cuối kỳ cho từng sản phẩm trong khoảng ngày đã chọn.",
    formula: "Tồn cuối kỳ = Tồn đầu kỳ + Nhập trong kỳ − Xuất trong kỳ (tính đúng tại ngày kết thúc đã chọn, không phải tồn kho lúc xem báo cáo).",
    meaning: "Theo dõi dòng chảy hàng hóa theo từng kỳ báo cáo (tháng, quý...).",
  },
  {
    id: "inventory-check",
    title: "Báo cáo kiểm kê hàng hóa",
    description:
      "Quản lý các thông tin khi kiểm hàng, số lượng hàng hỏng và lý do",
    icon: PackageSearch,
    href: "/admin/reports/inventory/check",
    workflow: "Đối chiếu số lượng đếm thực tế khi kiểm kho với số lượng sổ sách — chỉ tính các phiếu kiểm kê đã được duyệt cân bằng tồn kho.",
    formula: "Lệch = Số lượng thực tế − Số lượng sổ sách.",
    meaning: "Phát hiện chênh lệch tồn kho (thất thoát, sai sót nhập liệu) và số lượng hàng hỏng theo từng đợt kiểm kê.",
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
  const [isHelpOpen, setIsHelpOpen] = React.useState(false);
  const [selectedReportHelp, setSelectedReportHelp] = React.useState<
    (typeof inventoryReports)[number] | null
  >(null);

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
              onClick={() => {
                setSelectedReportHelp(null);
                setIsHelpOpen(true);
              }}
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

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedReportHelp(report);
                      setIsHelpOpen(true);
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] border border-slate-200 bg-white text-slate-400 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                    title={`Giải thích ${report.title}`}
                  >
                    <HelpCircle size={15} />
                  </button>

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

      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="max-w-2xl border border-slate-200 bg-white shadow-xl">
          <DialogHeader>
            <DialogTitle className="uppercase text-[15px]">
              {selectedReportHelp
                ? `Nghiệp vụ: ${selectedReportHelp.title}`
                : "Giải thích các báo cáo nhập xuất tồn"}
            </DialogTitle>
            <DialogDescription className="text-[12px]">
              {selectedReportHelp
                ? "Cách tính và ý nghĩa thực tế của báo cáo này."
                : "Chọn 1 báo cáo để xem chi tiết cách tính, hoặc bấm icon trợ giúp trên từng báo cáo."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-[13px] text-slate-600 max-h-[70vh] overflow-y-auto pr-1">
            {selectedReportHelp ? (
              <div className="space-y-4">
                <div className="rounded-[4px] border border-blue-100 bg-blue-50/60 px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600 mb-1">Cách tính</p>
                  <p className="text-slate-700 leading-6">{selectedReportHelp.workflow}</p>
                </div>

                <div className="rounded-[4px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Công thức</p>
                  <code className="block rounded bg-white border border-slate-200 px-3 py-2 text-[12px] font-mono text-slate-800 leading-6">
                    {selectedReportHelp.formula}
                  </code>
                </div>

                <div className="rounded-[4px] border border-emerald-100 bg-emerald-50/60 px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-1">Ý nghĩa</p>
                  <p className="text-slate-700 leading-6">{selectedReportHelp.meaning}</p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-[12px] text-slate-500"
                  onClick={() => setSelectedReportHelp(null)}
                >
                  ← Xem tất cả báo cáo
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {inventoryReports.map((report) => (
                  <div
                    key={report.id}
                    className="cursor-pointer rounded-[4px] border border-slate-200 px-4 py-4 hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
                    onClick={() => setSelectedReportHelp(report)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-slate-800">{report.title}</p>
                      <ChevronRight size={13} className="text-slate-300" />
                    </div>
                    <p className="text-[12px] text-slate-500 leading-5">{report.description}</p>
                    <p className="mt-2 text-[11px] font-mono text-slate-400 truncate">{report.formula}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

