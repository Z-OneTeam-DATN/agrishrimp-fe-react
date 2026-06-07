"use client";

import React, { useEffect, useState } from "react";
import {
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
  SupplierDebtService,
  type SupplierDebtData,
} from "@/app/services/supplier-debt.service";
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
              className="h-[38px] bg-emerald-600 px-4 text-[13px] font-medium text-white shadow-sm hover:bg-emerald-700"
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

        <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <Loader2 className="mb-3 animate-spin text-emerald-600" size={32} />
              <p className="text-[11px] uppercase tracking-widest text-slate-400">
                Đang đồng bộ dữ liệu...
              </p>
            </div>
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
