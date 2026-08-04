"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, HelpCircle, Download, FileText, Search } from "lucide-react";
import { SharedDatePicker } from "@/components/admin/shared/BirthDatePicker";
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
  CustomerDebtService,
  type CustomerDebtData,
} from "@/app/services/customer-debt.service";
import { branchService } from "@/app/services/branchService";
import AdminDataSyncLoader from "@/components/admin/shared/AdminDataSyncLoader";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { P } from "@/lib/permissions";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { registerVietnameseFont, VIETNAMESE_PDF_FONT } from "@/lib/pdf-vietnamese-font";
import { useAuthStore } from "@/stores/useAuthStore";

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

export default function CustomerDebtReportPage() {
  return (
    <PermissionGuard permission={P.REPORT_FINANCE_VIEW}>
      <CustomerDebtReportContent />
    </PermissionGuard>
  );
}

function CustomerDebtReportContent() {
  const { user, warehouseId } = useAuthStore();
  const { hasPermission } = usePermissions();
  const canSelectAllBranches = hasPermission(P.REPORT_FINANCE_VIEW_ALL_BRANCHES);
  const ownBranchId = (user?.branch?.id ?? warehouseId)?.toString() || "";

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CustomerDebtData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [endDate, setEndDate] = useState(() => toIsoDate(new Date()));
  const [branchId, setBranchId] = useState<string>(
    canSelectAllBranches ? "all" : ownBranchId || "all",
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
        if (!canSelectAllBranches && ownBranchId) {
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
        console.error("Lỗi tải bộ lọc công nợ khách hàng", error);
      }
    };

    void loadOptions();
  }, [canSelectAllBranches, ownBranchId]);

  useEffect(() => {
    if (!canSelectAllBranches && ownBranchId) {
      setBranchId(ownBranchId);
    }
  }, [canSelectAllBranches, ownBranchId]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await CustomerDebtService.getReport({
          search: searchTerm,
          endDate,
          branchId,
          staffId,
          debtFilter: debtFilter as "all" | "not_zero" | "zero",
        });
        setData(Array.isArray(res) ? res : []);
      } catch (error) {
        console.error("Lỗi lấy công nợ khách hàng:", error);
        toast.error("Không thể tải dữ liệu công nợ khách hàng");
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, endDate, branchId, staffId, debtFilter]);

  const handleExportExcel = () => {
    if (!data || data.length === 0) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }

    const excelData = data.map((row) => ({
      "Tên khách hàng": row.customerName,
      "Số điện thoại": row.phone || "---",
      "Nhân viên phụ trách": row.staffAssignedName || "---",
      "Nợ cuối kỳ (VNĐ)": row.totalDebt,
      "Ngày chốt nợ": endDate,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cong No Khach Hang");

    const fileName = `Cong_No_Khach_Hang_${endDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast.success("Đã tải xuống file Excel");
  };

  const handleExportPdf = () => {
    if (!data || data.length === 0) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }

    const activeBranch = branches.find((b) => String(b.id) === branchId);
    const branchName = activeBranch ? activeBranch.name : "Toàn bộ hệ thống";

    const doc = new jsPDF({ orientation: "landscape" });
    registerVietnameseFont(doc);
    doc.setFontSize(14);
    doc.text("CÔNG NỢ KHÁCH HÀNG AGRI SHRIMP", 14, 14);
    doc.setFontSize(10);
    doc.text(`Chi nhánh: ${branchName}`, 14, 20);
    doc.text(`Ngày chốt nợ: ${endDate}`, 14, 25);

    autoTable(doc, {
      startY: 30,
      head: [["Tên khách hàng", "Số điện thoại", "Nhân viên phụ trách", "Nợ cuối kỳ (VNĐ)"]],
      body: data.map((row) => [
        row.customerName,
        row.phone || "---",
        row.staffAssignedName || "---",
        row.totalDebt.toLocaleString("vi-VN"),
      ]),
      styles: { fontSize: 8, font: VIETNAMESE_PDF_FONT },
      headStyles: { fillColor: [59, 130, 246], font: VIETNAMESE_PDF_FONT, fontStyle: "bold" },
    });

    doc.save(`Cong_No_Khach_Hang_${endDate}.pdf`);
    toast.success("Đã tải xuống file PDF");
  };

  return (
    <div className="space-y-3">
      <div className="mt-2 mb-8 space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
              Công nợ khách hàng
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
              variant="outline"
              className="h-[38px] border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-600 shadow-none hover:bg-blue-50 hover:text-blue-600"
              onClick={handleExportExcel}
            >
              <Download size={16} className="mr-2" />
              Excel
            </Button>
            <Button
              variant="outline"
              className="h-[38px] border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-600 shadow-none hover:bg-blue-50 hover:text-blue-600"
              onClick={handleExportPdf}
            >
              <FileText size={16} className="mr-2" />
              PDF
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
              placeholder="Tìm tên, SĐT khách hàng"
              className="h-[38px] w-full rounded-md border-slate-200 pl-10 text-[13px] shadow-none focus-visible:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="shrink-0 text-[11px] font-semibold text-slate-600">Đến ngày:</label>
            <SharedDatePicker
              value={endDate}
              onChange={setEndDate}
              placeholder="d/MM/yyyy"
              variant="compact"
              buttonClassName="h-[38px] w-[158px] rounded-[4px] border-slate-200 text-[13px] shadow-none"
            />
          </div>

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
              disabled={!canSelectAllBranches}
            >
              <SelectValue placeholder="Chi nhánh" />
            </SelectTrigger>
            <SelectContent>
              {canSelectAllBranches && (
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
            <AdminDataSyncLoader className="min-h-[360px]" />
          ) : data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[#ccc] bg-[#f0f0f0] hover:bg-[#f0f0f0]">
                    <TableHead className="py-3 pl-6 text-[12px] font-semibold">
                      Tên khách hàng
                    </TableHead>
                    <TableHead className="py-3 text-[12px] font-semibold">
                      SĐT
                    </TableHead>
                    <TableHead className="py-3 text-[12px] font-semibold">
                      Nhân viên phụ trách
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
                      <TableCell className="py-3 pl-6 text-[13px] font-medium text-slate-800">
                        {row.customerName}
                      </TableCell>
                      <TableCell className="py-3 text-[13px] text-slate-500">
                        {row.phone || "---"}
                      </TableCell>
                      <TableCell className="py-3 text-[13px] text-slate-500">
                        {row.staffAssignedName || "---"}
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
                Không tìm thấy khách hàng hoặc khách hàng không có công nợ
              </p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isExplainOpen} onOpenChange={setIsExplainOpen}>
        <DialogContent className="max-w-2xl border border-slate-200 bg-white shadow-xl">
          <DialogHeader>
            <DialogTitle className="uppercase">
              Trợ giúp công nợ khách hàng
            </DialogTitle>
            <DialogDescription>
              Màn này hiển thị số dư công nợ còn lại tại ngày kết thúc, không phải
              chỉ là công nợ phát sinh mới trong khoảng ngày.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm text-slate-600">
            <p>
              <span className="font-bold text-slate-800">Công nợ khách hàng là gì:</span>{" "}
              tổng giá trị các đơn hàng của khách hàng đó chưa được thanh toán đầy
              đủ (trạng thái thanh toán khác "Đã thanh toán") và chưa bị huỷ/trả
              lại, tính đến ngày chốt.
            </p>
            <p>
              <span className="font-bold text-slate-800">Lưu ý quan trọng:</span>{" "}
              hệ thống hiện chưa lưu vết thanh toán từng phần cho khách hàng, nên
              công nợ được tính theo kiểu nhị phân — 1 đơn hoặc đang nợ đủ giá trị
              đơn, hoặc không nợ (đã thanh toán xong), không có mức "đã trả một
              phần".
            </p>
            <p>
              <span className="font-bold text-slate-800">Đến ngày:</span> là mốc
              chốt công nợ. Chỉ tính các đơn phát sinh đến hết ngày này.
            </p>
            <p>
              <span className="font-bold text-slate-800">
                Chi nhánh:
              </span>{" "}
              lọc theo chi nhánh xử lý đơn hàng (không phải chi nhánh gán cho tài
              khoản khách hàng), để khớp đúng với dữ liệu doanh thu/đơn hàng theo
              chi nhánh ở các báo cáo khác.
            </p>
            <p>
              <span className="font-bold text-slate-800">Nợ cuối kỳ:</span> chỉ
              hiển thị số còn phải trả đến hết ngày chốt. Bộ lọc "Khác 0" giúp tập
              trung vào khách hàng còn nợ thực sự.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
