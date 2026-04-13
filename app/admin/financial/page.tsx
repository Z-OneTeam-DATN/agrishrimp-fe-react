"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HelpCircle,
  BarChart3,
  Landmark,
  Users,
  RefreshCw,
  Wallet,
  CircleDollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FinancialService, ProfitLossData, SupplierDebtData } from "@/app/services/financial.service";
import { branchService } from "@/app/services/branchService";
import { cn, formatNumber } from "@/lib/utils";

type BranchOption = { id: number; name: string; branchCode?: string };

const reportCards = [
  {
    id: "profit-loss",
    title: "Báo cáo lãi lỗ",
    description: "Theo dõi doanh thu, chi phí, lợi nhuận theo kỳ và chi nhánh",
    icon: BarChart3,
    href: "/admin/financial/profit-loss",
  },
  {
    id: "cashbook",
    title: "Sổ quỹ",
    description: "Tổng hợp thu chi vận hành và đối soát tiền mặt theo ngày",
    icon: Landmark,
    href: "/admin/financial/cashbook",
  },
  {
    id: "supplier-debt",
    title: "Công nợ nhà cung cấp",
    description: "Kiểm tra các khoản phải trả và các NCC đang còn dư nợ",
    icon: Users,
    href: "/admin/financial/supplier-debt",
  },
];

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const formatMoney = (value?: number | null) => formatNumber(value ?? 0);

export default function FinancialReportListPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [startDate, setStartDate] = useState(() => toIsoDate(new Date(new Date().setDate(new Date().getDate() - 30))));
  const [endDate, setEndDate] = useState(() => toIsoDate(new Date()));
  const [loading, setLoading] = useState(false);
  const [profitLoss, setProfitLoss] = useState<ProfitLossData | null>(null);
  const [supplierDebts, setSupplierDebts] = useState<SupplierDebtData[]>([]);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const response = await branchService.getAll();
        setBranches(Array.isArray(response) ? response : (response?.data || response?.content || []));
      } catch (error) {
        console.error("Không tải được chi nhánh", error);
      }
    };

    loadBranches();
  }, []);

  const loadFinancialData = useCallback(async () => {
    try {
      setLoading(true);
      const branchId = selectedBranchId === "all" ? "all" : selectedBranchId;
      const [profitLossRes, supplierDebtRes] = await Promise.all([
        FinancialService.getProfitLoss(startDate, endDate, branchId),
        FinancialService.getSupplierDebts(),
      ]);

      setProfitLoss(profitLossRes);
      setSupplierDebts(Array.isArray(supplierDebtRes) ? supplierDebtRes : []);
    } catch (error) {
      console.error("Không tải được dữ liệu tài chính", error);
      setProfitLoss(null);
      setSupplierDebts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId, startDate, endDate]);

  useEffect(() => {
    loadFinancialData();
  }, [loadFinancialData]);

  const metrics = useMemo(() => {
    const revenue = Number(profitLoss?.revenue ?? 0);
    const returnedGoods = Number(profitLoss?.returnedGoods ?? 0);
    const shippingFeeCollected = Number(profitLoss?.shippingFeeCollected ?? 0);
    const discount = Number(profitLoss?.discount ?? 0);
    const cogs = Number(profitLoss?.cogs ?? 0);
    const pointPayment = Number(profitLoss?.pointPayment ?? 0);
    const shippingFeePaid = Number(profitLoss?.shippingFeePaid ?? 0);
    const otherIncome = Number(profitLoss?.otherIncome ?? 0);
    const customerReturnFee = Number(profitLoss?.customerReturnFee ?? 0);
    const otherExpenses = Number(profitLoss?.otherExpenses ?? 0);

    const totalIncome = revenue - returnedGoods + shippingFeeCollected + otherIncome;
    const totalExpense = discount + cogs + pointPayment + shippingFeePaid + customerReturnFee + otherExpenses;
    const estimatedProfit = totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      estimatedProfit,
      debtCount: supplierDebts.length,
      debtTotal: supplierDebts.reduce((sum, item) => sum + (item.totalDebt ?? 0), 0),
      branchLabel:
        selectedBranchId === "all"
          ? "Tất cả chi nhánh"
          : branches.find((b) => b.id.toString() === selectedBranchId)?.name || "Chi nhánh đang chọn",
    };
  }, [profitLoss, supplierDebts, selectedBranchId, branches]);

  return (
    <div className="space-y-6 pb-10 bg-[#f0f2f5] min-h-screen p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.25em] mb-1">Kinh doanh / tài chính</p>
          <h1 className="text-[28px] font-black text-[#1f1f1f] uppercase">Danh sách báo cáo tài chính</h1>
        </div>
        <Button
          variant="ghost"
          className="border-[#dcdcdc] rounded-[4px] h-[36px] text-[13px] font-medium flex items-center gap-2"
          onClick={() => setIsHelpOpen(true)}
        >
          <HelpCircle size={18} className="text-slate-500" /> Trợ giúp
        </Button>
      </div>

      <Card className="border-[#dcdcdc] rounded-[4px] bg-white p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-end">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Chi nhánh</p>
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
              <SelectTrigger className="h-[38px] rounded-none border-[#dcdcdc] shadow-none text-[13px] bg-white">
                <SelectValue placeholder="Tất cả chi nhánh" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id.toString()}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Từ ngày</p>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-[38px] w-full rounded-none border border-[#dcdcdc] px-3 text-[13px] bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Đến ngày</p>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-[38px] w-full rounded-none border border-[#dcdcdc] px-3 text-[13px] bg-white"
            />
          </div>

          <div className="flex gap-2">
            <Button
              className="h-[38px] rounded-none bg-blue-600 hover:bg-blue-700 text-white flex-1"
              onClick={loadFinancialData}
              disabled={loading}
            >
              {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Tải báo cáo
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-[#dcdcdc] rounded-[4px] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-[4px] bg-blue-50 flex items-center justify-center text-blue-600">
              <CircleDollarSign size={20} />
            </div>
            <Badge variant="secondary" className="rounded-none bg-blue-50 text-blue-600 border-none">{metrics.branchLabel}</Badge>
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Doanh thu thuần</p>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-1">{formatMoney(metrics.totalIncome)}</h3>
        </div>

        <div className="bg-white border border-[#dcdcdc] rounded-[4px] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-[4px] bg-rose-50 flex items-center justify-center text-rose-600">
              <TrendingDown size={20} />
            </div>
            <Badge variant="secondary" className="rounded-none bg-rose-50 text-rose-600 border-none">Chi phí</Badge>
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng chi phí</p>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-1">{formatMoney(metrics.totalExpense)}</h3>
        </div>

        <div className="bg-white border border-[#dcdcdc] rounded-[4px] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className={cn("w-10 h-10 rounded-[4px] flex items-center justify-center", (metrics.estimatedProfit < 0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"))}>
              <TrendingUp size={20} />
            </div>
            <Badge variant="secondary" className={cn("rounded-none border-none", metrics.estimatedProfit < 0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600")}>Ước tính</Badge>
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lợi nhuận ước tính</p>
          <h3 className={cn("text-2xl font-black tracking-tight mt-1", metrics.estimatedProfit < 0 ? "text-amber-600" : "text-emerald-600")}>{formatMoney(Math.round(metrics.estimatedProfit))}</h3>
        </div>

        <div className="bg-white border border-[#dcdcdc] rounded-[4px] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-[4px] bg-violet-50 flex items-center justify-center text-violet-600">
              <Wallet size={20} />
            </div>
            <Badge variant="secondary" className="rounded-none bg-violet-50 text-violet-600 border-none">Công nợ</Badge>
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">NCC còn nợ</p>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-1">{metrics.debtCount} NCC</h3>
          <p className="text-[11px] text-slate-500 mt-1">Tổng dư nợ: <span className="font-black text-violet-600">{formatMoney(metrics.debtTotal)}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-4">
        <div className="bg-white border border-[#dcdcdc] p-6 rounded-[4px] shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Điểm vào nghiệp vụ</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reportCards.map((report) => (
              <Link key={report.id} href={report.href}>
                <div className="bg-[#fcfcfc] border border-[#e5e7eb] p-5 flex items-start gap-4 hover:shadow-md transition-shadow cursor-pointer group h-full min-h-[120px]">
                  <div className="text-slate-700 group-hover:text-blue-600 transition-colors">
                    <report.icon size={30} strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-[15px] font-bold text-[#1f1f1f] group-hover:text-blue-600 transition-colors">
                      {report.title}
                    </h3>
                    <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed">{report.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#dcdcdc] p-6 rounded-[4px] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-1">Top công nợ</p>
              <h2 className="text-[18px] font-bold text-[#1f1f1f]">5 nhà cung cấp nợ cao nhất</h2>
            </div>
            <Button variant="ghost" className="rounded-none text-blue-600 hover:text-blue-700" onClick={() => router.push("/admin/financial/supplier-debt")}>Xem chi tiết</Button>
          </div>

          <div className="space-y-3">
            {supplierDebts.slice(0, 5).map((supplier, index) => (
              <div key={supplier.id} className="flex items-center justify-between gap-3 p-3 border border-slate-100 rounded-[4px] bg-slate-50/40">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[11px] font-black shrink-0">{index + 1}</div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-slate-800 truncate">{supplier.supplierName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{supplier.supplierCode} • {supplier.phone || "Chưa có SĐT"}</p>
                  </div>
                </div>
                <p className="text-[13px] font-black text-rose-600 whitespace-nowrap">{formatMoney(supplier.totalDebt)}</p>
              </div>
            ))}

            {supplierDebts.length === 0 && (
              <div className="py-10 text-center border border-dashed border-slate-200 rounded-[4px] text-slate-500">
                Chưa có dữ liệu công nợ để hiển thị
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="max-w-2xl rounded-none">
          <DialogHeader>
            <DialogTitle className="uppercase">Trợ giúp danh sách báo cáo tài chính</DialogTitle>
            <DialogDescription>
              Trang này là điểm vào các báo cáo nghiệp vụ tài chính thật, dùng dữ liệu từ backend theo chi nhánh và khoảng ngày đã chọn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm text-slate-600">
            <p><span className="font-bold text-slate-800">Báo cáo lãi lỗ:</span> xem doanh thu, chi phí và lợi nhuận theo kỳ.</p>
            <p><span className="font-bold text-slate-800">Sổ quỹ:</span> tổng hợp thu chi tiền mặt, xem biểu đồ và giao dịch chi tiết.</p>
            <p><span className="font-bold text-slate-800">Công nợ nhà cung cấp:</span> kiểm tra số dư nợ theo kỳ, chi nhánh và người phụ trách.</p>
            <p><span className="font-bold text-slate-800">Tải báo cáo:</span> vào từng card để xem chi tiết và xuất file theo nghiệp vụ tương ứng.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
