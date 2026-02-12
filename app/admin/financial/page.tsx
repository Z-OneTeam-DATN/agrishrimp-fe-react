"use client";

import React from "react";
import { 
  HelpCircle, BarChart3, BookOpen, 
  UserMinus, Users, FileText, Landmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const financialReports = [
  {
    id: "profit-loss",
    title: "Báo cáo lãi lỗ",
    description: "Theo dõi doanh thu, chi phí và lợi nhuận của cửa hàng",
    icon: BarChart3,
    href: "/admin/financial/profit-loss"
  },
  {
    id: "cashbook",
    title: "Sổ quỹ",
    description: "Theo dõi các khoản thu chi của cửa hàng",
    icon: Landmark,
    href: "/admin/financial/cashbook"
  },
  {
    id: "supplier-debt",
    title: "Báo cáo công nợ nhà cung cấp",
    description: "Theo dõi các khoản công nợ phải thu hoặc phải trả nhà cung cấp",
    icon: Users,
    href: "/admin/financial/supplier-debt"
  }
];

export default function FinancialReportListPage() {
  return (
    <div className="space-y-6 pb-10 bg-[#f0f2f5] min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-medium text-[#1f1f1f]">Danh sách báo cáo tài chính</h1>
        <Button variant="outline" className="bg-white border-[#dcdcdc] rounded-[4px] h-[36px] text-[13px] font-medium flex items-center gap-2">
          <HelpCircle size={18} className="text-slate-500" /> Trợ giúp
        </Button>
      </div>

      {/* Report Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {financialReports.map((report) => (
          <Link key={report.id} href={report.href}>
            <div className="bg-white border border-[#dcdcdc] p-6 flex items-start gap-4 hover:shadow-md transition-shadow cursor-pointer group h-[100px] items-center">
              <div className="text-slate-700 group-hover:text-blue-600 transition-colors">
                <report.icon size={32} strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                <h3 className="text-[15px] font-bold text-[#1f1f1f] group-hover:text-blue-600 transition-colors">
                  {report.title}
                </h3>
                <p className="text-[13px] text-slate-500 mt-0.5">
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
