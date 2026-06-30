"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  HelpCircle,
  BarChart3,
  Landmark,
  Users,
  Loader2,
  RefreshCw,
} from "lucide-react";
import AdminDataSyncLoader from "@/components/admin/shared/AdminDataSyncLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FinancialOverviewService,
} from "@/app/services/financial-overview.service";
import type {
  ProfitLossData,
  SupplierDebtData,
} from "@/app/services/financial-report.types";
import { branchService } from "@/app/services/branchService";
import { formatNumber } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { isAdminRole } from "@/lib/roles";

type BranchOption = { id: number; name: string };

const reportCards = [
  {
    id: "profit-loss",
    title: "Báo cáo lãi lỗ",
    description: "Theo dõi doanh thu thuần, giá vốn và lợi nhuận theo kỳ",
    icon: BarChart3,
    href: "/admin/financial/profit-loss",
  },
  {
    id: "cashbook",
    title: "Sổ quỹ",
    description: "Đối soát dòng tiền thực tế đã ghi nhận trong hệ thống",
    icon: Landmark,
    href: "/admin/financial/cashbook",
  },
  {
    id: "supplier-debt",
    title: "Công nợ nhà cung cấp",
    description: "Theo dõi dư nợ chốt kỳ của từng nhà cung cấp",
    icon: Users,
    href: "/admin/financial/supplier-debt",
  },
];

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const formatMoney = (value?: number | null) => formatNumber(value ?? 0);

export default function FinancialReportListPage() {
  const router = useRouter();
  const { user, warehouseId } = useAuthStore();
  const isAdmin = isAdminRole(user?.role);
  const ownBranchId = (user?.branch?.id ?? warehouseId)?.toString() || "";
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    isAdmin ? "all" : ownBranchId || "all"
  );
  const [startDate, setStartDate] = useState(() =>
    toIsoDate(new Date(new Date().setDate(new Date().getDate() - 30)))
  );
  const [endDate, setEndDate] = useState(() => toIsoDate(new Date()));
  const [loading, setLoading] = useState(false);
  const [profitLoss, setProfitLoss] = useState<ProfitLossData | null>(null);
  const [supplierDebts, setSupplierDebts] = useState<SupplierDebtData[]>([]);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const response = await branchService.getAll();
        const list = Array.isArray(response)
          ? response
          : response?.data || response?.content || [];
        if (!isAdmin && ownBranchId) {
          setBranches(
            list.filter(
              (branch: BranchOption) => branch.id.toString() === ownBranchId
            )
          );
        } else {
          setBranches(list);
        }
      } catch (error) {
        console.error("Không tải được chi nhánh", error);
      }
    };

    loadBranches();
  }, [isAdmin, ownBranchId]);

  useEffect(() => {
    if (!isAdmin && ownBranchId) {
      setSelectedBranchId(ownBranchId);
    }
  }, [isAdmin, ownBranchId]);

  const loadFinancialData = useCallback(async () => {
    try {
      setLoading(true);
      const branchId = selectedBranchId === "all" ? "all" : selectedBranchId;
      const { profitLoss: profitLossRes, supplierDebts: supplierDebtRes } =
        await FinancialOverviewService.getReport({
          startDate,
          endDate,
          branchId,
        });

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
    const netRevenue = Number(profitLoss?.netRevenue ?? 0);
    const cogs = Number(profitLoss?.cogs ?? 0);
    const pointPayment = Number(profitLoss?.pointPayment ?? 0);
    const shippingFeePaid = Number(profitLoss?.shippingFeePaid ?? 0);
    const otherExpenses = Number(profitLoss?.otherExpenses ?? 0);
    const netProfit = Number(profitLoss?.netProfit ?? 0);

    return {
      netRevenue,
      totalExpense: cogs + pointPayment + shippingFeePaid + otherExpenses,
      estimatedProfit: netProfit,
      debtCount: supplierDebts.length,
      debtTotal: supplierDebts.reduce(
        (sum, item) => sum + (item.totalDebt ?? 0),
        0
      ),
      branchLabel:
        selectedBranchId === "all"
          ? "Tất cả chi nhánh"
          : branches.find((b) => b.id.toString() === selectedBranchId)?.name ||
            "Chi nhánh đang chọn",
    };
  }, [profitLoss, supplierDebts, selectedBranchId, branches]);

  const summaryCards = [
    {
      id: "net-revenue",
      label: "Doanh thu thuần",
      value: formatMoney(metrics.netRevenue),
      badge: metrics.branchLabel,
      hint: "Theo phạm vi chi nhánh đang chọn",
      valueClassName: "text-slate-900",
    },
    {
      id: "expense",
      label: "Tổng chi phí",
      value: formatMoney(metrics.totalExpense),
      badge: "Chi phí",
      hint: "Gồm giá vốn, điểm, ship và chi phí khác",
      valueClassName: "text-slate-900",
    },
    {
      id: "profit",
      label: "Lợi nhuận ròng",
      value: formatMoney(Math.round(metrics.estimatedProfit)),
      badge: metrics.estimatedProfit < 0 ? "Âm" : "Dương",
      hint: "Tính theo dữ liệu chốt trong kỳ",
      valueClassName:
        metrics.estimatedProfit < 0 ? "text-amber-600" : "text-blue-600",
    },
    {
      id: "debt",
      label: "NCC còn nợ",
      value: `${metrics.debtCount} NCC`,
      badge: "Công nợ",
      hint: `Tổng dư nợ ${formatMoney(metrics.debtTotal)}`,
      valueClassName: "text-slate-900",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="mt-2 mb-8 space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
              Tổng quan tài chính
            </h1>
          </div>
          <Button
            variant="outline"
            className="h-[38px] border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-600 shadow-none hover:bg-blue-50 hover:text-blue-600"
            onClick={() => setIsHelpOpen(true)}
          >
            <HelpCircle size={16} className="mr-2" /> Trợ giúp
          </Button>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-end">
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Chi nhánh
              </p>
              <Select
                value={selectedBranchId}
                onValueChange={setSelectedBranchId}
              >
                <SelectTrigger
                  className="h-[38px] w-full min-w-[220px] rounded-md border-slate-200 bg-white text-[13px] shadow-none focus:ring-0 lg:w-[260px]"
                  disabled={!isAdmin}
                >
                  <SelectValue placeholder="Tất cả chi nhánh" />
                </SelectTrigger>
                <SelectContent>
                  {isAdmin && <SelectItem value="all">Tất cả chi nhánh</SelectItem>}
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Từ ngày
              </p>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-[38px] min-w-[180px] rounded-md border-slate-200 bg-white text-[13px] shadow-none focus-visible:ring-blue-500/20 lg:w-[190px]"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Đến ngày
              </p>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-[38px] min-w-[180px] rounded-md border-slate-200 bg-white text-[13px] shadow-none focus-visible:ring-blue-500/20 lg:w-[190px]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              className="h-[38px] bg-blue-600 px-4 text-[13px] font-medium text-white shadow-sm hover:bg-blue-700"
              onClick={loadFinancialData}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Tải báo cáo
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
            <AdminDataSyncLoader />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <div
                  key={card.id}
                  className="rounded-[4px] border border-[#dcdcdc] bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {card.label}
                    </p>
                    <Badge
                      variant="secondary"
                      className="border-none bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"
                    >
                      {card.badge}
                    </Badge>
                  </div>
                  <div className="mt-6 space-y-2">
                    <p className={`text-[32px] font-semibold leading-none tracking-tight ${card.valueClassName}`}>
                      {card.value}
                    </p>
                    <p className="text-[12px] text-slate-500">{card.hint}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.9fr]">
              <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Điểm vào nghiệp vụ
                  </p>
                </div>

                <div className="space-y-4 px-5 pb-5 pt-5">
                  {reportCards.map((report) => (
                    <Link
                      key={report.id}
                      href={report.href}
                      className="block"
                    >
                      <div className="group flex items-center justify-between gap-4 rounded-[4px] border border-slate-200 bg-slate-50/60 px-5 py-5 transition-colors hover:border-blue-200 hover:bg-blue-50/50">
                        <div className="flex min-w-0 items-center gap-3.5">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px] border border-slate-200 bg-white text-slate-600 transition-colors group-hover:border-blue-200 group-hover:text-blue-600">
                            <report.icon size={18} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-[14px] font-semibold text-slate-900 transition-colors group-hover:text-blue-600">
                              {report.title}
                            </h3>
                            <p className="mt-1.5 text-[12px] leading-5 text-slate-500">
                              {report.description}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-blue-500" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
                <div className="border-b border-slate-100 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Top công nợ
                    </p>
                    <Button
                      variant="outline"
                      className="h-[32px] border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-none hover:bg-blue-50 hover:text-blue-600"
                      onClick={() => router.push("/admin/financial/supplier-debt")}
                    >
                      Xem chi tiết
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  <div className="rounded-[4px] border border-slate-200 bg-slate-50/50 px-4 py-3">
                    <p className="text-[14px] font-semibold text-slate-900">
                      5 nhà cung cấp nợ cao nhất
                    </p>
                    <p className="mt-1 text-[12px] leading-5 text-slate-500">
                      Chốt theo phạm vi chi nhánh và ngày kết thúc đang chọn.
                    </p>
                  </div>

                  {supplierDebts.length > 0 ? (
                    supplierDebts.slice(0, 5).map((supplier, index) => (
                      <div
                        key={supplier.id}
                        className="flex items-center justify-between gap-3 rounded-[4px] border border-slate-200 bg-white px-4 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-slate-900">
                              {supplier.supplierName}
                            </p>
                            <p className="truncate text-[11px] text-slate-500">
                              {supplier.supplierCode} • {supplier.phone || "Chưa có SĐT"}
                            </p>
                          </div>
                        </div>
                        <p className="whitespace-nowrap text-[13px] font-semibold text-rose-600">
                          {formatMoney(supplier.totalDebt)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[4px] border border-dashed border-slate-200 bg-slate-50/40 py-12 text-center text-[12px] text-slate-500">
                      Chưa có dữ liệu công nợ để hiển thị
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="max-w-2xl border border-slate-200 bg-white shadow-xl">
          <DialogHeader>
            <DialogTitle className="uppercase">
              Trợ giúp danh sách báo cáo tài chính
            </DialogTitle>
            <DialogDescription>
              Trang này là điểm vào các báo cáo nghiệp vụ tài chính, dùng cùng
              scope chi nhánh và khoảng ngày đang chọn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm text-slate-600">
            <p>
              <span className="font-bold text-slate-800">Báo cáo lãi lỗ:</span>{" "}
              dùng công thức backend duy nhất cho gross revenue, ship,
              discount, trả hàng và lợi nhuận.
            </p>
            <p>
              <span className="font-bold text-slate-800">Sổ quỹ:</span> chỉ lấy
              giao dịch tiền thực tế đã ghi nhận trong hệ thống, không trộn
              chứng từ kho chưa tạo dòng tiền.
            </p>
            <p>
              <span className="font-bold text-slate-800">
                Công nợ nhà cung cấp:
              </span>{" "}
              hiển thị dư nợ chốt tại ngày kết thúc, không còn chỉ là công nợ
              phát sinh trong kỳ.
            </p>
            <p>
              <span className="font-bold text-slate-800">Top công nợ:</span>{" "}
              dùng đúng bộ lọc chi nhánh và kỳ đang chọn ở đầu trang.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

