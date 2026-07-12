"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  ChevronDown,
  HelpCircle,
  Download,
  Search,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SupplierDebtInsightService } from "@/app/services/supplier-debt-insight";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SupplierDebtService,
  type SupplierDebtData,
} from "@/app/services/supplier-debt.service";
import { branchService } from "@/app/services/branchService";
import AdminDataSyncLoader from "@/components/admin/shared/AdminDataSyncLoader";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useAuthStore } from "@/stores/useAuthStore";
import { isAdminRole } from "@/lib/roles";

type BranchOption = { id: number; name: string };
type StaffOption = { id: number; displayName: string };
type BranchApiItem = { id?: number | string; name?: string };
type StaffApiItem = {
  id?: number | string;
  displayName?: string;
  name?: string;
  username?: string;
};

const toIsoDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function SupplierDebtReportPage() {
  const { user, warehouseId } = useAuthStore();
  const isAdmin = isAdminRole(user?.role);
  const ownBranchId = (user?.branch?.id ?? warehouseId)?.toString() || "";

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SupplierDebtData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const today = new Date();
  const [startDate, setStartDate] = useState(() =>
    toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1)),
  );
  const [endDate, setEndDate] = useState(() => toIsoDate(today));
  const [branchId, setBranchId] = useState<string>(
    isAdmin ? "all" : ownBranchId || "all",
  );
  const [staffId, setStaffId] = useState<string>("all");
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [staffs, setStaffs] = useState<StaffOption[]>([]);
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const [debtFilter, setDebtFilter] = useState<string>("not_zero");

  const [insightData, setInsightData] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzingInsight, setAnalyzingInsight] = useState(false);

  const fetchInsightAnalysis = useCallback(async () => {
    try {
      setAnalyzingInsight(true);
      const branchIdParam = branchId === "all" ? "ALL" : branchId;
      const resData = await SupplierDebtInsightService.getInsightAnalysis({
        branchId: branchIdParam,
        startDate,
        endDate,
        compareWithPreviousPeriod: true,
      });
      setInsightData(resData);

      if (resData && !resData.insufficientData) {
        const activeBranch = branches.find(b => String(b.id) === branchId);
        const branchName = activeBranch ? activeBranch.name : "Toàn bộ hệ thống";
        const explanation = await SupplierDebtInsightService.getAiExplanation(resData, branchName);
        setAiAnalysis(explanation);
      } else {
        setAiAnalysis({
          success: true,
          summary: "Không có đủ dữ liệu dòng công nợ trong hệ thống để thực hiện phân tích.",
          recommendation: "Vui lòng thêm dữ liệu phiếu nhập kho phát sinh công nợ nhà cung cấp."
        });
      }
    } catch (error) {
      console.error("Lỗi phân tích công nợ NCC:", error);
      toast.error("Không thể hoàn thành phân tích công nợ AI");
    } finally {
      setAnalyzingInsight(false);
    }
  }, [branchId, startDate, endDate, branches]);

  useEffect(() => {
    void fetchInsightAnalysis();
  }, [fetchInsightAnalysis]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [branchRes, staffRes] = await Promise.all([
          branchService.getAll(),
          branchService.getAllStaff(),
        ]);

        const branchItems = Array.isArray(branchRes)
          ? branchRes
          : branchRes?.data || branchRes?.content || [];
        const normalizedBranches = (branchItems as BranchApiItem[]).map(
          (item) => ({
            id: Number(item.id),
            name: item.name || "Chi nhánh",
          }),
        );
        if (!isAdmin && ownBranchId) {
          setBranches(
            normalizedBranches.filter(
              (item) => String(item.id) === ownBranchId,
            ),
          );
        } else {
          setBranches(normalizedBranches);
        }

        const staffItems = Array.isArray(staffRes)
          ? staffRes
          : staffRes?.data || staffRes?.content || [];
        setStaffs(
          (staffItems as StaffApiItem[])
            .filter((item) => item?.id)
            .map((item) => ({
              id: Number(item.id),
              displayName:
                item.displayName ||
                item.name ||
                item.username ||
                `User ${item.id}`,
            })),
        );
      } catch (error) {
        console.error("Lỗi tải bộ lọc công nợ", error);
      }
    };

    void loadOptions();
  }, [isAdmin, ownBranchId]);

  useEffect(() => {
    if (!isAdmin && ownBranchId) {
      setBranchId(ownBranchId);
    }
  }, [isAdmin, ownBranchId]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await SupplierDebtService.getReport({
          search: searchTerm,
          startDate,
          endDate,
          branchId,
          staffId,
          debtFilter: debtFilter as "all" | "not_zero" | "zero",
        });
        setData(Array.isArray(res) ? res : []);
      } catch (error) {
        console.error("Lỗi lấy công nợ:", error);
        toast.error("Không thể tải dữ liệu công nợ nhà cung cấp");
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, startDate, endDate, branchId, staffId, debtFilter]);

  const handleExportExcel = () => {
    if (!data || data.length === 0) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }

    const excelData = data.map((row) => ({
      "Mã nhà cung cấp": row.supplierCode,
      "Tên nhà cung cấp": row.supplierName,
      "Số điện thoại": row.phone || "---",
      "Nợ cuối kỳ (VNĐ)": row.totalDebt,
      "Ngày chốt nợ": endDate,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cong No NCC");

    const fileName = `Cong_No_Nha_Cung_Cap_${endDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast.success("Đã tải xuống file Excel");
  };

  return (
    <div className="space-y-3">
      <div className="mt-2 mb-8 space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
              Công nợ NCC
            </h1>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              className="h-[38px] border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-600 shadow-none hover:bg-blue-50 hover:text-blue-600"
              onClick={() => setIsExplainOpen(true)}
            >
              <HelpCircle size={16} className="mr-2" />
              Trợ giúp
            </Button>
            <Button
              className="h-[38px] bg-blue-600 px-4 text-[13px] font-medium text-white shadow-sm hover:bg-blue-700"
              onClick={handleExportExcel}
            >
              <Download size={16} className="mr-2" />
              Xuất file
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-3 lg:flex-nowrap">
          <div className="relative w-full min-w-0 lg:w-[280px] lg:flex-none xl:w-[300px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
              size={16}
            />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tên, SĐT, mã NCC"
              className="h-[38px] w-full rounded-md border-slate-200 pl-10 text-[13px] shadow-none focus-visible:ring-blue-500/20"
            />
          </div>

          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-[38px] w-[180px] rounded-md border-slate-200 text-[13px] shadow-none focus-visible:ring-blue-500/20"
          />

          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-[38px] w-[180px] rounded-md border-slate-200 text-[13px] shadow-none focus-visible:ring-blue-500/20"
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="group flex h-[38px] min-w-[150px] cursor-pointer items-center gap-0 rounded-md border border-slate-200 bg-white px-3 hover:bg-slate-50 lg:w-[150px]">
                <span className="text-[12px] text-slate-500 group-hover:text-slate-700">
                  Nợ cuối kỳ
                </span>
                <ChevronDown size={14} className="ml-auto text-slate-300" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[180px]">
              <DropdownMenuItem
                onClick={() => setDebtFilter("all")}
                className="cursor-pointer text-[13px]"
              >
                Tất cả
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDebtFilter("not_zero")}
                className="cursor-pointer text-[13px] font-medium text-blue-600"
              >
                Khác 0
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDebtFilter("zero")}
                className="cursor-pointer text-[13px] font-medium"
              >
                Bằng 0
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Select value={branchId} onValueChange={setBranchId}>
            <SelectTrigger
              className="h-[38px] w-[220px] rounded-md border-slate-200 text-[13px] shadow-none"
              disabled={!isAdmin}
            >
              <SelectValue placeholder="Chi nhánh" />
            </SelectTrigger>
            <SelectContent>
              {isAdmin && (
                <SelectItem value="all">Tất cả chi nhánh</SelectItem>
              )}
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={String(branch.id)}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={staffId} onValueChange={setStaffId}>
            <SelectTrigger className="h-[38px] w-[220px] rounded-md border-slate-200 text-[13px] shadow-none">
              <SelectValue placeholder="Nhân viên phụ trách" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả nhân viên</SelectItem>
              {staffs.map((staff) => (
                <SelectItem key={staff.id} value={String(staff.id)}>
                  {staff.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* AI Supplier Debt Insight Panel */}
        <div className="rounded-[4px] border border-[#dcdcdc] bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-700">
                Trợ lý Cảnh báo & Phân tích Công nợ AI
              </h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-slate-200 text-[12px] font-medium text-slate-600 shadow-none hover:bg-blue-50 hover:text-blue-600"
              onClick={() => void fetchInsightAnalysis()}
              disabled={analyzingInsight}
            >
              <RefreshCw size={12} className={cn("mr-1.5", analyzingInsight && "animate-spin")} />
              {analyzingInsight ? "Đang phân tích..." : "Phân tích AI"}
            </Button>
          </div>

          {analyzingInsight ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <p className="text-xs text-slate-500 font-medium">AI đang chạy mô hình tính toán tuổi nợ và phân tích rủi ro...</p>
            </div>
          ) : insightData?.insufficientData ? (
            <div className="rounded-[6px] bg-amber-50/55 border border-amber-100 p-4 text-center">
              <p className="text-xs text-amber-700 font-medium">
                {aiAnalysis?.summary || "Không có đủ dữ liệu để chạy phân tích công nợ."}
              </p>
            </div>
          ) : insightData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left side: metrics */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="rounded-[6px] p-4 text-center border bg-slate-50 border-slate-200">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Tổng công nợ</p>
                    <p className="text-2xl font-black text-slate-800 mt-1">
                      {insightData.totalOutstandingDebt.toLocaleString("vi-VN")} ₫
                    </p>
                    {insightData.totalDebtChangeVsPreviousPeriod !== null && (
                      <div className="flex items-center justify-center gap-1 mt-2">
                        <Badge className={cn(
                          "border-none text-[10px] font-semibold px-2 py-0.5",
                          insightData.totalDebtChangeVsPreviousPeriod > 0
                            ? "bg-rose-50 text-rose-600 hover:bg-rose-50"
                            : insightData.totalDebtChangeVsPreviousPeriod < 0
                            ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-50"
                            : "bg-slate-50 text-slate-500 hover:bg-slate-50"
                        )}>
                          {insightData.totalDebtChangeVsPreviousPeriod > 0 ? "▲ Tăng" : insightData.totalDebtChangeVsPreviousPeriod < 0 ? "▼ Giảm" : "• Không đổi"} {Math.abs(insightData.totalDebtChangeVsPreviousPeriod)}%
                        </Badge>
                        <span className="text-[10px] text-slate-400">so với kỳ trước</span>
                      </div>
                    )}
                  </div>

                  {/* Factor Breakdown table */}
                  <div className="border border-slate-100 rounded-[6px] overflow-hidden text-xs">
                    <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 font-semibold text-slate-600">
                      Chỉ số đánh giá
                    </div>
                    <div className="divide-y divide-slate-100 bg-white">
                      {insightData.breakdown?.map((item: any, idx: number) => (
                        <div key={idx} className="px-3 py-2.5 flex flex-col gap-1">
                          <div className="flex justify-between font-medium">
                            <span className="text-slate-500">
                              {item.factor === "TOTAL_DEBT" && "Quy mô nợ"}
                              {item.factor === "AGE_DISTRIBUTION" && "Tuổi nợ nghiêm trọng (CRITICAL)"}
                              {item.factor === "TREND" && "Xu hướng nợ"}
                            </span>
                            <span className={cn(
                              "font-semibold",
                              item.factor === "AGE_DISTRIBUTION" && item.value > 0 ? "text-rose-600 font-bold" : "text-slate-800"
                            )}>
                              {item.factor === "TOTAL_DEBT" && `${item.value.toLocaleString("vi-VN")} ₫`}
                              {item.factor === "AGE_DISTRIBUTION" && `${item.value} đối tác`}
                              {item.factor === "TREND" && `${item.value > 0 ? "+" : ""}${item.value}%`}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 leading-normal">{item.note}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right side: AI text explaining summary & recommendations */}
                <div className="lg:col-span-8 space-y-4">
                  {aiAnalysis ? (
                    <div className="space-y-4">
                      {/* Summary */}
                      <div className="bg-slate-50/60 rounded-[6px] border border-slate-100 p-4">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Nhận xét phân tích của AI</p>
                        <p className="text-[13px] leading-relaxed text-slate-700">{aiAnalysis.summary}</p>
                      </div>

                      {/* Recommendation */}
                      <div className="bg-blue-50/30 rounded-[6px] border border-blue-100/50 p-4 space-y-2">
                        <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Hành động khuyến nghị</p>
                        <p className="text-xs leading-relaxed text-slate-600 whitespace-pre-line">{aiAnalysis.recommendation}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center border border-dashed border-slate-200 rounded-[6px] bg-slate-50/50 py-10">
                      <p className="text-xs text-slate-400 font-medium">Đang tải phân tích AI...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Priority Ranking & Staff summary lists inside the AI panel */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 pt-2 border-t border-slate-100">
                {/* 1. Priority Ranking list (8 columns) */}
                <div className="xl:col-span-8 space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Xếp hạng ưu tiên xử lý công nợ nhà cung cấp
                  </h4>
                  <div className="overflow-hidden rounded-[4px] border border-slate-200 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-[#ccc] bg-[#f0f0f0] hover:bg-[#f0f0f0]">
                          <TableHead className="py-2.5 pl-4 text-[11px] font-semibold w-[60px] text-slate-700">Hạng</TableHead>
                          <TableHead className="py-2.5 text-[11px] font-semibold text-slate-700">Nhà cung cấp</TableHead>
                          <TableHead className="py-2.5 text-[11px] font-semibold text-right text-slate-700">Tổng nợ</TableHead>
                          <TableHead className="py-2.5 text-[11px] font-semibold text-right text-slate-700">Tuổi nợ TB</TableHead>
                          <TableHead className="py-2.5 text-[11px] font-semibold text-center text-slate-700">Trạng thái tuổi nợ</TableHead>
                          <TableHead className="py-2.5 pr-4 text-[11px] font-semibold text-right text-slate-700">Điểm ưu tiên</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {insightData.supplierRanking?.slice(0, 10).map((sup: any) => (
                          <TableRow key={sup.supplierId} className="border-b border-[#eee] hover:bg-[#f8f9fa] text-xs">
                            <TableCell className="py-2 pl-4 font-bold text-slate-600">#{sup.priorityRank}</TableCell>
                            <TableCell className="py-2">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-slate-800">{sup.supplierName}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{sup.supplierCode}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-2 text-right font-bold text-slate-850">
                              {sup.totalDebt.toLocaleString("vi-VN")} ₫
                            </TableCell>
                            <TableCell className="py-2 text-right font-medium text-slate-600">
                              {sup.weightedAvgDebtAge.toFixed(1)} ngày
                            </TableCell>
                            <TableCell className="py-2 text-center">
                              <Badge className={cn(
                                "border-none text-[9px] font-bold px-2 py-0.5 rounded hover:opacity-90",
                                sup.ageStatus === "NORMAL" && "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
                                sup.ageStatus === "WARNING" && "bg-amber-50 text-amber-700 hover:bg-amber-50",
                                sup.ageStatus === "CRITICAL" && "bg-rose-50 text-rose-700 hover:bg-rose-50"
                              )}>
                                {sup.ageStatus === "NORMAL" && "NORMAL"}
                                {sup.ageStatus === "WARNING" && "WARNING"}
                                {sup.ageStatus === "CRITICAL" && "CRITICAL"}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2 pr-4 text-right font-bold text-blue-600">
                              {sup.priorityScore.toFixed(1)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* 2. Staff Debt Summary list (4 columns) */}
                <div className="xl:col-span-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Công nợ theo nhân viên phụ trách
                  </h4>
                  <div className="overflow-hidden rounded-[4px] border border-slate-200 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-[#ccc] bg-[#f0f0f0] hover:bg-[#f0f0f0]">
                          <TableHead className="py-2.5 pl-4 text-[11px] font-semibold text-slate-700">Nhân viên</TableHead>
                          <TableHead className="py-2.5 pr-4 text-[11px] font-semibold text-right text-slate-700">Tổng nợ phụ trách</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {insightData.staffDebtSummary?.map((staff: any) => (
                          <TableRow key={staff.staffId} className="border-b border-[#eee] hover:bg-[#f8f9fa] text-xs">
                            <TableCell className="py-2.5 pl-4 font-semibold text-slate-700">
                              {staff.staffName}
                            </TableCell>
                            <TableCell className="py-2.5 pr-4 text-right font-bold text-rose-600">
                              {staff.totalDebtFromOrders.toLocaleString("vi-VN")} ₫
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!insightData.staffDebtSummary || insightData.staffDebtSummary.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={2} className="py-6 text-center text-[11px] text-slate-400">
                              Chưa có thông tin nhân viên phụ trách mua hàng
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              {aiAnalysis && (
                <p className="text-[10px] text-slate-400 italic">
                  * Ghi chú miễn trừ trách nhiệm: Phân tích và hành động khuyến nghị được tự động tổng hợp từ dữ liệu công nợ thời gian thực bằng mô hình ngôn ngữ AI. Quyết định thanh toán sau cùng cần dựa trên thỏa thuận hợp đồng thực tế với các nhà cung cấp.
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-[6px] text-slate-400 space-y-2">
              <HelpCircle className="opacity-30" size={30} strokeWidth={1.5} />
              <p className="text-xs font-semibold">Chưa có dữ liệu phân tích công nợ</p>
              <Button
                variant="outline"
                size="sm"
                className="h-7 border-slate-200 bg-white text-[11px] shadow-none hover:bg-blue-50 hover:text-blue-600"
                onClick={() => void fetchInsightAnalysis()}
              >
                Chạy phân tích AI ngay
              </Button>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">

          {loading ? (
            <AdminDataSyncLoader className="min-h-[360px]" />
          ) : data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[#ccc] bg-[#f0f0f0] hover:bg-[#f0f0f0]">
                    <TableHead className="py-3 pl-6 text-[12px] font-semibold">
                      Mã NCC
                    </TableHead>
                    <TableHead className="py-3 text-[12px] font-semibold">
                      Tên nhà cung cấp
                    </TableHead>
                    <TableHead className="py-3 text-[12px] font-semibold">
                      SĐT
                    </TableHead>
                    <TableHead className="py-3 pr-6 text-right text-[12px] font-semibold">
                      Nợ cuối kỳ
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-b border-[#eee] transition-colors hover:bg-[#f0f8ff]"
                    >
                      <TableCell className="py-3 pl-6 font-mono text-[13px] font-semibold text-blue-600">
                        {row.supplierCode}
                      </TableCell>
                      <TableCell className="py-3 text-[13px] font-medium text-slate-800">
                        {row.supplierName}
                      </TableCell>
                      <TableCell className="py-3 text-[13px] text-slate-500">
                        {row.phone || "---"}
                      </TableCell>
                      <TableCell className="py-3 pr-6 text-right text-[14px] font-semibold text-rose-600">
                        {row.totalDebt.toLocaleString("vi-VN")} ₫
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white text-slate-400">
              <Search className="mb-2 opacity-20" size={40} strokeWidth={1.5} />
              <p className="text-xs font-medium uppercase">
                Không tìm thấy dữ liệu công nợ phù hợp
              </p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isExplainOpen} onOpenChange={setIsExplainOpen}>
        <DialogContent className="max-w-2xl border border-slate-200 bg-white shadow-xl">
          <DialogHeader>
            <DialogTitle className="uppercase">
              Trợ giúp công nợ nhà cung cấp
            </DialogTitle>
            <DialogDescription>
              Màn này hiển thị số dư công nợ còn lại tại ngày kết thúc, không phải
              chỉ là công nợ phát sinh mới trong khoảng ngày.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm text-slate-600">
            <p>
              <span className="font-bold text-slate-800">Đến ngày:</span> là mốc
              chốt công nợ. Mọi thanh toán đến hết ngày này đều được trừ vào số
              dư còn lại.
            </p>
            <p>
              <span className="font-bold text-slate-800">Từ ngày:</span> dùng để
              đồng bộ kỳ xem báo cáo, nhưng số nợ cuối kỳ vẫn bao gồm cả chứng từ
              cũ trước ngày bắt đầu nếu đến ngày chốt vẫn còn nợ.
            </p>
            <p>
              <span className="font-bold text-slate-800">
                Chi nhánh / nhân viên phụ trách:
              </span>{" "}
              lọc theo đơn vị và người tạo chứng từ gốc để giữ cùng scope giữa màn
              hình và dữ liệu backend.
            </p>
            <p>
              <span className="font-bold text-slate-800">Nợ cuối kỳ:</span> chỉ
              hiển thị số còn phải trả sau mọi khoản thanh toán hợp lệ đến hết ngày
              chốt. Bộ lọc "Khác 0" giúp tập trung vào NCC còn dư nợ thực sự.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

