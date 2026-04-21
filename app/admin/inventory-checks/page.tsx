"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  AlertTriangle,
  ClipboardCheck,
  Boxes,
  ShieldAlert,
  PackageSearch,
  RefreshCcw,
  Eye,
  Pencil,
  Trash2,
  CalendarDays,
  Building2,
  User,
  Search,
  FileSpreadsheet,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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

type InventoryCheckStatus =
  | "ALL"
  | "COUNTING"
  | "WAITING_FOR_ADJUSTMENT_APPROVAL"
  | "COUNTING_COMPLETED";

const getWorkflowStatus = (item: any) => {
  const normalized = String(item?.checkWorkflowStatus || item?.status || "")
    .toUpperCase()
    .trim();

  if (
    normalized === "COUNTING_INIT" ||
    normalized === "COUNTING_IN_PROGRESS" ||
    normalized === "WAITING_FOR_ADJUSTMENT_APPROVAL" ||
    normalized === "COUNTING_COMPLETED"
  ) {
    return normalized;
  }

  if (normalized === "COMPLETED") return "COUNTING_COMPLETED";
  return "COUNTING_INIT";
};

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
  const { hasPermission, isLoadingAuth } = usePermissions();

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [inventoryChecks, setInventoryChecks] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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

  const filteredData = useMemo(() => {
    return inventoryChecks.filter((item: any) => {
      const status = getWorkflowStatus(item);
      const branchId = String(item.branchId || "");
      const branchName = normalizeText(item.branchName || "Kho tổng");
      const q = normalizeText(searchTerm);

      const matchTab =
        activeTab === "ALL" ||
        ((activeTab === "COUNTING" || activeTab === ("PENDING" as InventoryCheckStatus)) &&
          (status === "COUNTING_INIT" || status === "COUNTING_IN_PROGRESS")) ||
        (activeTab === "WAITING_FOR_ADJUSTMENT_APPROVAL" &&
          status === "WAITING_FOR_ADJUSTMENT_APPROVAL") ||
        ((activeTab === "COUNTING_COMPLETED" || activeTab === ("COMPLETED" as InventoryCheckStatus)) &&
          status === "COUNTING_COMPLETED");

      if (!matchTab) return false;
      if (selectedBranchId !== "all" && branchId !== selectedBranchId) return false;

      if (!q) return true;

      return (
        normalizeText(item.code || `PKK-${item.id}`).includes(q) ||
        normalizeText(item.note).includes(q) ||
        branchName.includes(q) ||
        normalizeText(item.createdByName || item.checkedByName).includes(q)
      );
    });
  }, [inventoryChecks, activeTab, selectedBranchId, searchTerm]);

  const stats = useMemo(() => {
    const pending = inventoryChecks.filter((item: any) => {
      const status = getWorkflowStatus(item);
      return status === "COUNTING_INIT" || status === "COUNTING_IN_PROGRESS";
    }).length;
    const waitingApproval = inventoryChecks.filter(
      (item: any) =>
        getWorkflowStatus(item) === "WAITING_FOR_ADJUSTMENT_APPROVAL"
    ).length;
    const completed = inventoryChecks.filter(
      (item: any) => getWorkflowStatus(item) === "COUNTING_COMPLETED"
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

  const getStatusBadge = (status: string) => {
    const normalized = String(status || "").toUpperCase();
    if (normalized === "COUNTING_COMPLETED") {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase">
          Đã cân bằng
        </Badge>
      );
    }
    if (normalized === "WAITING_FOR_ADJUSTMENT_APPROVAL") {
      return (
        <Badge className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-black uppercase">
          Chờ duyệt cân bằng
        </Badge>
      );
    }
    if (normalized === "COUNTING_IN_PROGRESS") {
      return (
        <Badge className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-black uppercase">
          Đang đếm thực tế
        </Badge>
      );
    }
    if (normalized === "COUNTING_INIT") {
      return (
        <Badge className="bg-violet-50 text-violet-700 border border-violet-100 text-[10px] font-black uppercase">
          Mới khởi tạo
        </Badge>
      );
    }

    switch (String(status || "").toUpperCase()) {
      case "COUNTING_COMPLETED":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase">
            Đã chốt kho
          </Badge>
        );
      case "WAITING_FOR_ADJUSTMENT_APPROVAL":
        return (
          <Badge className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-black uppercase">
            Chờ xử lý
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-black uppercase">
            {status}
          </Badge>
        );
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
          ?.name || "ARGISHRIMP CHI NHÁNH CẦN THƠ";

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

  if (!hasPermission(P.CHECK_VIEW)) {
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
    <div className="flex flex-col h-[calc(100vh-80px)] -m-4 md:-m-5 bg-[#f8f9fa] overflow-hidden">
      <div className="bg-white border-b shrink-0">
        <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-[17px] font-black uppercase tracking-tight text-slate-800 flex items-center gap-2">
              <ClipboardCheck className="text-indigo-600" size={20} />
              Kiểm kê kho
            </h1>
            <p className="text-[12px] text-slate-500 font-medium">
              Theo dõi chênh lệch tồn kho, hư hại và đề xuất nhập bù sau kiểm kê.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-9 rounded-md border-slate-200 text-[12px] font-bold"
              onClick={handleExportLowStockExcel}
              disabled={loading || exporting}
            >
              {exporting ? (
                <Loader2 size={15} className="animate-spin mr-2" />
              ) : (
                <FileSpreadsheet size={15} className="mr-2" />
              )}
              Xuất Excel cần nhập thêm
            </Button>

            {hasPermission(P.CHECK_CREATE) && (
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 rounded-md text-[12px] font-bold"
                onClick={() => router.push("/admin/inventory-checks/new")}
              >
                <Plus size={15} className="mr-2" />
                Tạo phiếu kiểm kê
              </Button>
            )}
          </div>
        </div>

        <div className="px-6 pb-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="border border-slate-200 shadow-none bg-gradient-to-br from-indigo-50 to-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase text-slate-500">
                  Phiếu chờ xử lý
                </p>
                <p className="text-2xl font-black text-slate-800 mt-1">{stats.pending}</p>
              </div>
              <ClipboardCheck className="text-indigo-500" size={20} />
            </div>
          </Card>
          <Card className="border border-slate-200 shadow-none bg-gradient-to-br from-emerald-50 to-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase text-slate-500">
                  Phiếu đã chốt
                </p>
                <p className="text-2xl font-black text-slate-800 mt-1">{stats.waitingApproval}</p>
              </div>
              <Boxes className="text-emerald-500" size={20} />
            </div>
          </Card>
          <Card className="border border-slate-200 shadow-none bg-gradient-to-br from-rose-50 to-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase text-slate-500">
                  Tổng hàng hư hại
                </p>
                <p className="text-2xl font-black text-slate-800 mt-1">{stats.damagedUnits}</p>
              </div>
              <ShieldAlert className="text-rose-500" size={20} />
            </div>
          </Card>
          <Card className="border border-slate-200 shadow-none bg-gradient-to-br from-amber-50 to-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase text-slate-500">
                  Mặt hàng cần nhập thêm
                </p>
                <p className="text-2xl font-black text-slate-800 mt-1">{stats.needRestockCount}</p>
              </div>
              <PackageSearch className="text-amber-500" size={20} />
            </div>
          </Card>
        </div>

        <div className="px-6 flex items-center h-[48px] gap-8">
          {[
            { id: "ALL", label: "TẤT CẢ" },
            { id: "PENDING", label: "CHỜ XỬ LÝ" },
            { id: "COMPLETED", label: "ĐÃ CHỐT" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as InventoryCheckStatus)}
              className={cn(
                "h-full text-[12px] font-black border-b-2 px-1 tracking-wider transition-all relative",
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col min-h-0">
        <div className="bg-white border border-slate-200 rounded-md shadow-sm flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b bg-slate-50/40 flex flex-col xl:flex-row xl:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Tìm theo mã phiếu, ghi chú, người kiểm kê hoặc chi nhánh..."
                className="pl-10 h-10 bg-white border-slate-200 rounded-md text-[13px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger className="w-[240px] h-10 bg-white border-slate-200 text-[13px]">
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

              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 border-slate-200"
                onClick={bootstrap}
                disabled={loading}
              >
                <RefreshCcw size={16} className={cn(loading && "animate-spin")} />
              </Button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-auto">
            <Table>
              <TableHeader className="bg-slate-50/60 sticky top-0 z-10">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="text-[10px] font-black uppercase text-slate-400">Mã phiếu</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400">Ngày kiểm kê</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400">Kho kiểm kê</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400">Người phụ trách</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 text-center">Trạng thái</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 text-center">Hư hại</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 text-center">Cần nhập thêm</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 text-right pr-6">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-40 text-center">
                      <Loader2 className="animate-spin text-indigo-600 mx-auto" size={30} />
                      <p className="text-[11px] font-bold text-slate-400 uppercase mt-2">Đang tải dữ liệu kiểm kê...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-300">
                        <ClipboardCheck size={40} />
                        <p className="text-sm font-black uppercase">Chưa có phiếu kiểm kê phù hợp</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item: any) => {
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
                        className="group hover:bg-slate-50/50 cursor-pointer"
                        onClick={() => router.push(`/admin/inventory-checks/${item.code || item.id}`)}
                      >
                        <TableCell className="font-black text-indigo-600 text-[13px]">
                          {item.code || `PKK-${item.id}`}
                        </TableCell>
                        <TableCell className="text-[12px] font-bold text-slate-600">
                          <div className="flex items-center gap-2">
                            <CalendarDays size={13} className="text-slate-400" />
                            {item.checkDate || item.createdAt
                              ? format(new Date(item.checkDate || item.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })
                              : "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="text-[12px] font-bold text-slate-600">
                          <div className="flex items-center gap-2">
                            <Building2 size={13} className="text-slate-400" />
                            {item.branchName || "Kho tổng"}
                          </div>
                        </TableCell>
                        <TableCell className="text-[12px]">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-slate-700 flex items-center gap-2">
                              <User size={13} className="text-slate-400" />
                              {item.checkedByName || item.createdByName || "N/A"}
                            </span>
                            {item.note && (
                              <span className="text-[10px] text-slate-400 line-clamp-1">{item.note}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{getStatusBadge(getWorkflowStatus(item))}</TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-black">
                            {damaged}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-black">
                            {restock}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/admin/inventory-checks/${item.code || item.id}`);
                              }}
                            >
                              <Eye size={16} />
                            </Button>
                            {["COUNTING_INIT", "COUNTING_IN_PROGRESS"].includes(getWorkflowStatus(item)) && hasPermission(P.CHECK_UPDATE) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-amber-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/admin/inventory-checks/${item.code || item.id}?edit=true`);
                                }}
                              >
                                <Pencil size={16} />
                              </Button>
                            )}
                            {["COUNTING_INIT", "COUNTING_IN_PROGRESS"].includes(getWorkflowStatus(item)) && hasPermission(P.CHECK_DELETE) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-rose-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteId(item.id);
                                }}
                              >
                                <Trash2 size={16} />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
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
