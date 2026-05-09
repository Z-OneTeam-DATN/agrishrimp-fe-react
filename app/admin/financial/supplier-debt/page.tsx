"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronDown,
  HelpCircle,
  Download,
  Search,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  FinancialService,
  SupplierDebtData,
} from "@/app/services/financial.service";
import { branchService } from "@/app/services/branchService";
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

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

export default function SupplierDebtReportPage() {
  const router = useRouter();
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
        const res = await FinancialService.getSupplierDebts({
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
    <div className="min-h-screen space-y-0 bg-[#f0f2f5] pb-10">
      <div className="flex items-center gap-6 border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3 border-r border-slate-200 pr-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/financial")}
            className="h-8 w-8 rounded-none border border-slate-200 text-slate-500 transition-colors hover:text-blue-600"
          >
            <ChevronLeft size={20} />
          </Button>
          <div>
            <h1 className="whitespace-nowrap text-[18px] font-medium uppercase tracking-tight text-slate-800">
              Công nợ nhà cung cấp
            </h1>
            <p className="text-[11px] font-medium text-slate-500">
              Dư nợ còn lại được chốt tại ngày kết thúc báo cáo
            </p>
          </div>
        </div>

        <div className="ms-auto flex items-center gap-3">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-8 w-[140px] rounded-none border-slate-300 text-[12px] font-medium shadow-none"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-8 w-[140px] rounded-none border-slate-300 text-[12px] font-medium shadow-none"
          />
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 text-[11px] font-black uppercase text-slate-600 transition-colors hover:text-emerald-600"
          >
            <Download size={16} /> Xuất file
          </button>
          <button
            onClick={() => setIsExplainOpen(true)}
            className="flex items-center gap-1.5 text-[11px] font-black uppercase text-slate-600 transition-colors hover:text-blue-600"
          >
            <HelpCircle size={16} /> Trợ giúp
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="min-h-[400px] rounded-none border border-[#dcdcdc] bg-white shadow-sm">
          <div className="flex flex-wrap items-start gap-3 border-b border-slate-100 bg-white px-6 py-4">
            <div className="relative min-w-[400px] flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                size={16}
              />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm theo tên, SĐT, mã nhà cung cấp"
                className="h-[36px] w-full rounded-none border-slate-200 pl-10 text-[13px] shadow-none focus:border-blue-500"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="group flex h-[36px] min-w-[140px] cursor-pointer items-center gap-0 border border-slate-200 bg-white px-3 hover:bg-slate-50">
                  <span className="text-[12px] text-slate-500 group-hover:text-slate-700">
                    Nợ cuối kỳ
                  </span>
                  <ChevronDown size={14} className="ml-auto text-slate-300" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[180px] rounded-none">
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
                className="h-[36px] w-[180px] rounded-none border-slate-200 text-[12px] shadow-none"
                disabled={!isAdmin}
              >
                <SelectValue placeholder="Chi nhánh" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
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
              <SelectTrigger className="h-[36px] w-[180px] rounded-none border-slate-200 text-[12px] shadow-none">
                <SelectValue placeholder="Nhân viên phụ trách" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="all">Tất cả nhân viên</SelectItem>
                {staffs.map((staff) => (
                  <SelectItem key={staff.id} value={String(staff.id)}>
                    {staff.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-b border-slate-50 bg-amber-50/60 px-6 py-2 text-[12px] text-amber-800">
            Nợ cuối kỳ được chốt tại <span className="font-bold">{endDate}</span>.
            Các chứng từ cũ trước ngày bắt đầu vẫn được tính nếu đến ngày này còn
            dư nợ chưa thanh toán hết.
          </div>

          {debtFilter !== "all" && (
            <div className="flex items-center gap-2 border-b border-slate-50 bg-white px-6 py-2">
              <div className="border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-600">
                Nợ cuối kỳ: {debtFilter === "not_zero" ? "Khác 0" : "Bằng 0"}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="py-3 pl-6 text-[11px] font-bold uppercase">
                      Mã NCC
                    </TableHead>
                    <TableHead className="py-3 text-[11px] font-bold uppercase">
                      Tên nhà cung cấp
                    </TableHead>
                    <TableHead className="py-3 text-[11px] font-bold uppercase">
                      SĐT
                    </TableHead>
                    <TableHead className="py-3 pr-6 text-right text-[11px] font-bold uppercase">
                      Nợ cuối kỳ
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row) => (
                    <TableRow
                      key={row.id}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <TableCell className="py-3 pl-6 font-mono text-[13px] font-bold text-blue-600">
                        {row.supplierCode}
                      </TableCell>
                      <TableCell className="py-3 text-[13px] font-medium">
                        {row.supplierName}
                      </TableCell>
                      <TableCell className="py-3 text-[13px] text-slate-500">
                        {row.phone || "---"}
                      </TableCell>
                      <TableCell className="py-3 pr-6 text-right text-[14px] font-bold text-rose-600">
                        {row.totalDebt.toLocaleString("vi-VN")} ₫
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-200">
                <Search size={40} strokeWidth={1.5} />
              </div>
              <h3 className="mb-2 text-[15px] font-bold text-slate-700">
                Không tìm thấy nhà cung cấp phù hợp với điều kiện lọc
              </h3>
              <p className="text-[12px] font-medium text-slate-400">
                Thử thay đổi từ khóa, chi nhánh, nhân viên hoặc bộ lọc nợ cuối kỳ
              </p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isExplainOpen} onOpenChange={setIsExplainOpen}>
        <DialogContent className="max-w-2xl rounded-none">
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
