"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  AlertTriangle,
  Eye,
  Pencil,
  Trash2,
  Search,
  FileSpreadsheet,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import AdminDataSyncLoader from "@/components/admin/shared/AdminDataSyncLoader";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InventoryCheckApiService } from "@/app/services/inventory.service";
import { ProductService } from "@/app/services/product.service";
import { branchService } from "@/app/services/branchService";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { getCurrentWeekRange, isDateInRange } from "@/lib/admin-date-filter";

type InventoryCheckStatus =
  | "ALL"
  | "DRAFT"
  | "COUNTING"
  | "PENDING_APPROVAL"
  | "RECOUNT_REQUIRED"
  | "COMPLETED"
  | "CANCELLED";

const STATUS_TABS: Array<{ id: InventoryCheckStatus; label: string }> = [
  { id: "ALL", label: "Tất cả" },
  { id: "DRAFT", label: "Nháp" },
  { id: "COUNTING", label: "Đang kiểm kê" },
  { id: "PENDING_APPROVAL", label: "Chờ duyệt" },
  { id: "RECOUNT_REQUIRED", label: "Kiểm lại" },
  { id: "COMPLETED", label: "Đã cân bằng" },
  { id: "CANCELLED", label: "Đã hủy" },
];

const getWorkflowStatus = (item: any): Exclude<InventoryCheckStatus, "ALL"> => {
  const normalized = String(item?.checkWorkflowStatus || item?.status || "")
    .toUpperCase()
    .trim();

  switch (normalized) {
    case "COUNTING":
    case "COUNTING_IN_PROGRESS":
      return "COUNTING";
    case "PENDING_APPROVAL":
    case "WAITING_FOR_ADJUSTMENT_APPROVAL":
      return "PENDING_APPROVAL";
    case "RECOUNT_REQUIRED":
      return "RECOUNT_REQUIRED";
    case "COMPLETED":
    case "COUNTING_COMPLETED":
      return "COMPLETED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "DRAFT";
  }
};

const getScopeTypeLabel = (scopeType: string | null | undefined) =>
  String(scopeType || "").toUpperCase() === "SELECTED_VARIANTS"
    ? "Một số SKU"
    : "Toàn kho";

const normalizeText = (value: string | number | null | undefined) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const getShortageRows = (products: any[]) =>
  products.map((product: any, index: number) => {
    const currentQty = Number(product.quantity || 0);
    const minThreshold = Number(product.minThreshold || product.minStock || 10);
    return {
      stt: index + 1,
      sku: product.sku || "",
      name: product.productName || product.name || "",
      currentQty,
      minThreshold,
    };
  });

export default function InventoryCheckListPage() {
  const router = useRouter();
  const { hasPermission, hasAnyPermission, isLoadingAuth } = usePermissions();
  const defaultDateRange = useMemo(() => getCurrentWeekRange(), []);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [inventoryChecks, setInventoryChecks] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState(defaultDateRange.fromDate);
  const [toDate, setToDate] = useState(defaultDateRange.toDate);
  const [activeTab, setActiveTab] = useState<InventoryCheckStatus>("ALL");
  const [selectedBranchId, setSelectedBranchId] = useState("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | string | null>(
    null
  );

  useEffect(() => {
    void bootstrap();
  }, []);

  const bootstrap = async () => {
    try {
      setLoading(true);
      const [checksRes, branchesRes] = await Promise.all([
        InventoryCheckApiService.getAll(),
        branchService.getAll(),
      ]);

      const checksList = Array.isArray(checksRes)
        ? checksRes
        : checksRes?.data || checksRes?.content || [];
      const branchList = Array.isArray(branchesRes)
        ? branchesRes
        : branchesRes?.content || [];

      setInventoryChecks(checksList);
      setBranches(branchList);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách phiếu kiểm kê");
    } finally {
      setLoading(false);
    }
  };

  const canAccessInventoryChecks = hasAnyPermission([
    P.CHECK_VIEW,
    P.CHECK_CREATE,
    P.CHECK_UPDATE,
    P.CHECK_APPROVE,
    P.CHECK_CANCEL,
    P.CHECK_DELETE,
  ]);

  const filteredData = useMemo(() => {
    return inventoryChecks.filter((item: any) => {
      const status = getWorkflowStatus(item);
      const branchId = String(item.branchId || "");
      const branchName = normalizeText(item.branchName || "Kho tổng");
      const q = normalizeText(searchTerm);
      const scopeLabel = normalizeText(getScopeTypeLabel(item.scopeType));

      const matchTab = activeTab === "ALL" || status === activeTab;

      if (!matchTab) return false;
      if (selectedBranchId !== "all" && branchId !== selectedBranchId) return false;
      if (!isDateInRange(item.checkDate || item.createdAt, fromDate, toDate)) return false;

      if (!q) return true;

      return (
        normalizeText(item.code || `PKK-${item.id}`).includes(q) ||
        normalizeText(item.note).includes(q) ||
        branchName.includes(q) ||
        scopeLabel.includes(q) ||
        normalizeText(item.createdByName || item.checkedByName).includes(q)
      );
    });
  }, [inventoryChecks, activeTab, selectedBranchId, searchTerm, fromDate, toDate]);

  const stats = useMemo(() => {
    const pending = inventoryChecks.filter((item: any) => {
      const status = getWorkflowStatus(item);
      return (
        status === "DRAFT" ||
        status === "COUNTING" ||
        status === "RECOUNT_REQUIRED"
      );
    }).length;
    const waitingApproval = inventoryChecks.filter(
      (item: any) => getWorkflowStatus(item) === "PENDING_APPROVAL"
    ).length;
    const completed = inventoryChecks.filter(
      (item: any) => getWorkflowStatus(item) === "COMPLETED"
    ).length;

    const damagedUnits = inventoryChecks.reduce((sum: number, item: any) => {
      const details = Array.isArray(item.details) ? item.details : [];
      return (
        sum +
        details.reduce(
          (acc: number, detail: any) =>
            acc + Number(detail.quantityRejected || detail.quantityBad || 0),
          0
        )
      );
    }, 0);

    const needRestockCount = inventoryChecks.reduce((sum: number, item: any) => {
      const details = Array.isArray(item.details) ? item.details : [];
      return (
        sum +
        details.filter((detail: any) => {
          const usable =
            Number(detail.quantityReal ?? detail.actualQty ?? 0) -
            Number(detail.quantityRejected ?? detail.qualityBad ?? 0);
          const minThreshold = Number(
            detail.minThreshold || detail.minStock || detail.reorderPoint || 10
          );
          return usable < minThreshold;
        }).length
      );
    }, 0);

    return { pending, waitingApproval, completed, damagedUnits, needRestockCount };
  }, [inventoryChecks]);

  const getLegacyStatusLabel = (status: string) => {
    const normalized = String(status || "").toUpperCase();
    if (normalized === "COUNTING_COMPLETED") {
      return "Đã cân bằng";
    }
    if (normalized === "WAITING_FOR_ADJUSTMENT_APPROVAL") {
      return "Chờ duyệt cân bằng";
    }
    if (normalized === "COUNTING_IN_PROGRESS") {
      return "Đang đếm thực tế";
    }
    if (normalized === "COUNTING_INIT") {
      return "Mới khởi tạo";
    }

    switch (String(status || "").toUpperCase()) {
      case "COUNTING_COMPLETED":
        return "Đã chốt kho";
      case "WAITING_FOR_ADJUSTMENT_APPROVAL":
        return "Chờ xử lý";
      default:
        return status;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (String(status || "").toUpperCase()) {
      case "DRAFT":
        return "Nháp";
      case "COUNTING":
        return "Đang kiểm kê";
      case "PENDING_APPROVAL":
        return "Chờ duyệt cân bằng";
      case "RECOUNT_REQUIRED":
        return "Yêu cầu kiểm lại";
      case "COMPLETED":
        return "Đã cân bằng";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return getLegacyStatusLabel(status);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;

    try {
      await InventoryCheckApiService.deleteCheck(confirmDeleteId);
      toast.success("Đã xóa phiếu kiểm kê");
      setInventoryChecks((prev) =>
        prev.filter((item: any) => String(item.id) !== String(confirmDeleteId))
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Không thể xóa phiếu kiểm kê này"
      );
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleExportLowStockExcel = async () => {
    try {
      setExporting(true);

      const branchId =
        selectedBranchId !== "all"
          ? selectedBranchId
          : branches[0]?.id?.toString();

      if (!branchId) {
        toast.warning("Vui lòng chọn chi nhánh để xuất báo cáo");
        return;
      }

      const response = await ProductService.getLowStockReport(branchId);
      const rawRows = Array.isArray(response) ? response : [];
      const rows = getShortageRows(rawRows);

      if (rows.length === 0) {
        toast.warning("Không có sản phẩm nào dưới định mức để xuất");
        return;
      }

      const branchName =
        branches.find((branch: any) => String(branch.id) === String(branchId))
          ?.name || "AGRISHRIMP CHI NHÁNH CẦN THƠ";

      const now = new Date();
      const timeLabel = format(now, "HH:mm:ss dd/MM/yyyy");

      const worksheet = XLSX.utils.aoa_to_sheet([
        ["BÁO CÁO CHI TIẾT SẢN PHẨM DƯỚI ĐỊNH MỨC TỒN KHO"],
        [`Chi nhánh: ${branchName.toUpperCase()}`],
        [`Thời gian xuất: ${timeLabel}`],
        [],
        ["STT", "SKU", "Tên sản phẩm", "Tồn hiện tại", "Định mức"],
      ]);

      XLSX.utils.sheet_add_aoa(
        worksheet,
        rows.map((row) => [
          row.stt,
          row.sku,
          row.name,
          row.currentQty,
          row.minThreshold,
        ]),
        { origin: "A6" }
      );

      worksheet["!cols"] = [
        { wch: 8 },
        { wch: 24 },
        { wch: 52 },
        { wch: 18 },
        { wch: 16 },
      ];

      worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Bao_cao_ton_thap");
      XLSX.writeFile(
        workbook,
        `Bao_Cao_Ton_Kho_Duoi_Dinh_Muc_${format(now, "yyyyMMdd_HHmmss")}.xlsx`
      );

      toast.success("Đã xuất file Excel báo cáo dưới định mức tồn kho");
    } catch (error) {
      console.error(error);
      toast.error("Không thể xuất file Excel");
    } finally {
      setExporting(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={30} />
      </div>
    );
  }

  if (!canAccessInventoryChecks) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 opacity-40">
        <AlertTriangle size={64} />
        <p className="text-lg font-black uppercase">
          Bạn không có quyền xem trang này
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="mt-2 mb-8 space-y-4 px-1">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
              Kiểm kê kho
            </h1>
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="w-full xl:max-w-[260px]">
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
              <SelectTrigger className="h-[38px] w-full rounded-md border-slate-200 bg-white text-[13px] shadow-none focus:ring-0">
                <SelectValue placeholder="Lọc theo kho kiểm kê" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả kho</SelectItem>
                {branches.map((branch: any) => (
                  <SelectItem key={branch.id} value={String(branch.id)}>
                    {branch.name || branch.branchName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              className="h-[38px] border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-600 shadow-none hover:bg-blue-50 hover:text-blue-600"
              onClick={handleExportLowStockExcel}
              disabled={loading || exporting}
            >
              {exporting ? (
                <Loader2 size={15} className="mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet size={15} className="mr-2" />
              )}
              Xuất Excel
            </Button>
            {hasPermission(P.CHECK_CREATE) && (
              <Button
                className="h-[38px] bg-blue-600 px-4 text-[13px] font-medium text-white shadow-sm hover:bg-blue-700"
                onClick={() => router.push("/admin/inventory-checks/new")}
              >
                <Plus size={15} className="mr-2" />
                Tạo phiếu kiểm kê
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[4px] border border-[#dcdcdc] bg-white p-3 shadow-sm">
            <div>
              <p className="text-[11px] font-semibold text-slate-400">
                Phiếu chờ xử lý
              </p>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-[22px] font-semibold leading-none tracking-tight text-slate-900">
                {stats.pending}
              </p>
              <p className="text-[10px] leading-4.5 text-slate-500">Đang khởi tạo hoặc đang đếm thực tế</p>
            </div>
          </div>

          <div className="rounded-[4px] border border-[#dcdcdc] bg-white p-3 shadow-sm">
            <div>
              <p className="text-[11px] font-semibold text-slate-400">
                Chờ duyệt cân bằng
              </p>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-[22px] font-semibold leading-none tracking-tight text-slate-900">
                {stats.waitingApproval}
              </p>
              <p className="text-[10px] leading-4.5 text-slate-500">Chờ xác nhận điều chỉnh tồn kho sau kiểm kê</p>
            </div>
          </div>

          <div className="rounded-[4px] border border-[#dcdcdc] bg-white p-3 shadow-sm">
            <div>
              <p className="text-[11px] font-semibold text-slate-400">
                Tổng hàng hư hại
              </p>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-[22px] font-semibold leading-none tracking-tight text-slate-900">
                {stats.damagedUnits}
              </p>
              <p className="text-[10px] leading-4.5 text-slate-500">Tổng số lượng hư hại ghi nhận trong phiếu</p>
            </div>
          </div>

          <div className="rounded-[4px] border border-[#dcdcdc] bg-white p-3 shadow-sm">
            <div>
              <p className="text-[11px] font-semibold text-slate-400">
                Cần nhập thêm
              </p>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-[22px] font-semibold leading-none tracking-tight text-slate-900">
                {stats.needRestockCount}
              </p>
              <p className="text-[10px] leading-4.5 text-slate-500">Mặt hàng đang thấp hơn định mức tồn kho</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "h-[34px] rounded-[4px] border px-3 text-[12px] font-medium transition-colors",
                  activeTab === tab.id
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-600",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-1 flex-col gap-2 xl:max-w-[620px] xl:flex-row xl:items-center xl:justify-end">
            <div className="relative w-full xl:max-w-[300px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                size={16}
              />
              <Input
                placeholder="Tìm theo mã phiếu, ghi chú, người kiểm kê hoặc chi nhánh..."
                className="h-[38px] rounded-md border-slate-200 bg-white pl-10 text-[13px] shadow-none focus-visible:ring-blue-500/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-[38px] rounded-md border-slate-200 bg-white text-[13px] shadow-none focus-visible:ring-blue-500/20 xl:w-[150px]"
            />
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-[38px] rounded-md border-slate-200 bg-white text-[13px] shadow-none focus-visible:ring-blue-500/20 xl:w-[150px]"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
          {loading ? (
            <AdminDataSyncLoader />
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <AlertTriangle className="mb-2 opacity-20" size={40} />
              <p className="text-xs font-medium uppercase">Chưa có phiếu kiểm kê phù hợp</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[1060px]">
                <TableHeader>
                  <TableRow className="border-b border-[#ccc] bg-[#f0f0f0] hover:bg-[#f0f0f0]">
                    <TableHead className="w-[52px] px-1.5 py-2 text-[10px] font-semibold text-[#1f1f1f]">
                      STT
                    </TableHead>
                    <TableHead className="w-[126px] px-1.5 py-2 text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">
                      Mã phiếu
                    </TableHead>
                    <TableHead className="w-[124px] px-1.5 py-2 text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">
                      Ngày kiểm kê
                    </TableHead>
                    <TableHead className="w-[220px] px-1.5 py-2 text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">
                      Kho kiểm kê
                    </TableHead>
                    <TableHead className="w-[126px] px-1.5 py-2 text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">
                      Phạm vi
                    </TableHead>
                    <TableHead className="w-[150px] px-1.5 py-2 text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">
                      Người phụ trách
                    </TableHead>
                    <TableHead className="w-[106px] px-1.5 py-2 text-center text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">
                      Trạng thái
                    </TableHead>
                    <TableHead className="w-[74px] px-1.5 py-2 text-center text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">
                      Hư hại
                    </TableHead>
                    <TableHead className="w-[94px] px-1.5 py-2 text-center text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">
                      Cần nhập thêm
                    </TableHead>
                    <TableHead className="w-[86px] px-1.5 py-2 pr-3 text-right text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">
                      Hành động
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item: any, index: number) => {
                    const details = Array.isArray(item.details) ? item.details : [];
                    const damaged = details.reduce(
                      (sum: number, detail: any) =>
                        sum + Number(detail.quantityRejected || detail.quantityBad || 0),
                      0
                    );
                    const restock = details.filter((detail: any) => {
                      const usable =
                        Number(detail.quantityReal ?? detail.actualQty ?? 0) -
                        Number(detail.quantityRejected ?? detail.qualityBad ?? 0);
                      const minThreshold = Number(
                        detail.minThreshold || detail.minStock || detail.reorderPoint || 10
                      );
                      return usable < minThreshold;
                    }).length;

                    return (
                      <TableRow
                        key={item.id}
                        className="group cursor-pointer border-b border-[#eee] transition-colors hover:bg-[#f0f8ff]"
                        onClick={() => router.push(`/admin/inventory-checks/${item.code || item.id}`)}
                      >
                        <TableCell className="px-1.5 py-2 text-[11px] font-medium text-slate-700">
                          {index + 1}
                        </TableCell>
                        <TableCell className="px-1.5 py-2 text-[11px] font-semibold text-blue-600 whitespace-nowrap">
                          {item.code || `PKK-${item.id}`}
                        </TableCell>
                        <TableCell className="px-1.5 py-2 text-[11px] text-slate-600 whitespace-nowrap">
                          {item.checkDate || item.createdAt
                            ? format(new Date(item.checkDate || item.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })
                            : "N/A"}
                        </TableCell>
                        <TableCell className="px-1.5 py-2 text-[11px] text-slate-600">
                          {item.branchName || "Kho tổng"}
                        </TableCell>
                        <TableCell className="px-1.5 py-2 text-[11px] text-slate-600">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-slate-700">
                              {getScopeTypeLabel(item.scopeType)}
                            </span>
                            {String(item.scopeType || "").toUpperCase() === "SELECTED_VARIANTS" && (
                              <span className="text-[10px] text-slate-400">
                                {Array.isArray(item.details) ? item.details.length : 0} SKU
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-1.5 py-2 text-[11px]">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-slate-700">
                              {item.checkedByName || item.createdByName || "N/A"}
                            </span>
                            {item.note && (
                              <span className="line-clamp-1 text-[10px] text-slate-400">
                                {item.note}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-1.5 py-2 text-center">
                          <span className="text-[11px] font-medium text-slate-900">
                            {getStatusLabel(getWorkflowStatus(item))}
                          </span>
                        </TableCell>
                        <TableCell className="px-1.5 py-2 text-center text-[11px] font-medium text-slate-900">
                          {damaged}
                        </TableCell>
                        <TableCell className="px-1.5 py-2 text-center text-[11px] font-medium text-slate-900">
                          {restock}
                        </TableCell>
                        <TableCell className="px-1 py-2">
                          <div className="flex justify-end gap-0.5 pr-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-500 hover:text-blue-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/admin/inventory-checks/${item.code || item.id}`);
                              }}
                            >
                              <Eye size={14} />
                            </Button>
                            {["DRAFT", "COUNTING", "RECOUNT_REQUIRED"].includes(getWorkflowStatus(item)) && hasPermission(P.CHECK_UPDATE) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-500 hover:text-amber-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/admin/inventory-checks/${item.code || item.id}?edit=true`);
                                }}
                              >
                                <Pencil size={14} />
                              </Button>
                            )}
                            {["DRAFT", "COUNTING", "RECOUNT_REQUIRED", "PENDING_APPROVAL", "CANCELLED"].includes(
                              getWorkflowStatus(item),
                            ) &&
                              hasPermission(P.CHECK_DELETE) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-slate-500 hover:text-rose-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteId(item.id);
                                  }}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={confirmDeleteId !== null} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent className="rounded-md border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px] font-black uppercase text-slate-800">
              Xóa phiếu kiểm kê
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] text-slate-500">
              Bạn có chắc muốn xóa phiếu kiểm kê này không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold">Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

