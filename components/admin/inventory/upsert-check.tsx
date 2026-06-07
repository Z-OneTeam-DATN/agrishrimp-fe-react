"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Boxes,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  MessageSquareText,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { branchService } from "@/app/services/branchService";
import { InventoryCheckApiService } from "@/app/services/inventory.service";
import { EmployeeService } from "@/app/services/employee.service";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { cn, formatNumber } from "@/lib/utils";

interface InventoryUpsertProps {
  mode: "create" | "edit" | "view";
  initialData?: any;
  code?: string;
}

type CheckItem = {
  productVariantId: number | string;
  name: string;
  sku: string;
  unit: string;
  systemQuantity: number;
  quantityReal: number;
  quantityRejected: number;
  minThreshold: number;
  reason: string;
  batchNumber?: string;
  importPrice?: number;
};

type CheckWorkflowStatus =
  | "COUNTING_INIT"
  | "COUNTING_IN_PROGRESS"
  | "WAITING_FOR_ADJUSTMENT_APPROVAL"
  | "COUNTING_COMPLETED";

const getWorkflowStatus = (value: any): CheckWorkflowStatus => {
  const normalized = String(value || "").toUpperCase();
  if (
    normalized === "COUNTING_IN_PROGRESS" ||
    normalized === "WAITING_FOR_ADJUSTMENT_APPROVAL" ||
    normalized === "COUNTING_COMPLETED"
  ) {
    return normalized as CheckWorkflowStatus;
  }
  return "COUNTING_INIT";
};

const generatePKKCode = () => {
  const now = new Date();
  const dateStr =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return `PKK-${dateStr}${random}`;
};

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const mapItem = (item: any): CheckItem => ({
  productVariantId: item.productVariantId ?? item.id,
  name: item.name || item.productName || item.variantName || "N/A",
  sku: item.sku || "N/A",
  unit: item.unit || "Cái",
  systemQuantity: toNumber(item.systemQuantity ?? item.quantity ?? 0),
  quantityReal: toNumber(item.quantityReal ?? item.quantity ?? 0),
  quantityRejected: toNumber(item.quantityRejected ?? 0),
  minThreshold: toNumber(
    item.minThreshold ?? item.minStock ?? item.reorderPoint ?? 10,
    10,
  ),
  reason: item.reason || item.note || "",
  batchNumber: item.batchNumber || "N/A",
  importPrice: toNumber(item.importPrice ?? 0),
});

const getItemMetrics = (item: CheckItem) => {
  const realQty = Math.max(0, toNumber(item.quantityReal));
  const rejectedQty = Math.max(
    0,
    Math.min(realQty, toNumber(item.quantityRejected)),
  );
  const usableQty = Math.max(0, realQty - rejectedQty);
  const systemQty = Math.max(0, toNumber(item.systemQuantity));
  const minThreshold = Math.max(0, toNumber(item.minThreshold, 10));
  const diffQty = usableQty - systemQty;
  const suggestedImport = Math.max(0, minThreshold - usableQty);
  return {
    realQty,
    rejectedQty,
    usableQty,
    systemQty,
    minThreshold,
    diffQty,
    suggestedImport,
  };
};

const getItemBadge = (item: CheckItem) => {
  const metrics = getItemMetrics(item);
  if (metrics.rejectedQty > 0) return { label: "Hư hại", className: "bg-rose-50 text-rose-700 border-rose-100" };
  if (metrics.suggestedImport > 0) return { label: "Cần nhập", className: "bg-amber-50 text-amber-700 border-amber-100" };
  if (metrics.diffQty !== 0) return { label: "Chênh lệch", className: "bg-sky-50 text-sky-700 border-sky-100" };
  return { label: "Khớp kho", className: "bg-emerald-50 text-emerald-700 border-emerald-100" };
};

const getWorkflowStatusMeta = (status: CheckWorkflowStatus) => {
  switch (status) {
    case "COUNTING_IN_PROGRESS":
      return {
        label: "Đang đếm thực tế",
        className: "border-amber-100 bg-amber-50 text-amber-700",
      };
    case "WAITING_FOR_ADJUSTMENT_APPROVAL":
      return {
        label: "Chờ duyệt cân bằng",
        className: "border-blue-100 bg-blue-50 text-blue-700",
      };
    case "COUNTING_COMPLETED":
      return {
        label: "Đã cân bằng",
        className: "border-emerald-100 bg-emerald-50 text-emerald-700",
      };
    default:
      return {
        label: "Mới khởi tạo",
        className: "border-slate-200 bg-slate-50 text-slate-600",
      };
  }
};

const isInternalEmployee = (employee: any) => {
  const roleSlug = String(employee?.role?.slug || "").toLowerCase();
  return roleSlug !== "user" && roleSlug !== "customer";
};

export default function InventoryUpsert({
  mode,
  initialData,
  code,
}: InventoryUpsertProps) {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const { hasPermission } = usePermissions();

  const [loading, setLoading] = useState(mode !== "create");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [currentCheckId, setCurrentCheckId] = useState<number | string | null>(
    initialData?.id ?? null,
  );
  const [workflowStatus, setWorkflowStatus] = useState<CheckWorkflowStatus>(
    getWorkflowStatus(initialData?.checkWorkflowStatus || initialData?.status),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<
    (number | string)[]
  >([]);
  const [resultFilter, setResultFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [noteDialogIndex, setNoteDialogIndex] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const [formData, setFormData] = useState({
    type: initialData?.type || "PERIODIC",
    branchId: initialData?.branchId?.toString() || "",
    code:
      initialData?.code ||
      code ||
      (mode === "create" ? generatePKKCode() : "---"),
    checkDate: initialData?.checkDate || new Date().toISOString().split("T")[0],
    checkedBy: initialData?.checkedBy || "",
    createdByName: initialData?.createdByName || user?.fullName || "Admin",
    note: initialData?.note || "",
  });

  const [items, setItems] = useState<CheckItem[]>(
    (initialData?.details || []).map(mapItem),
  );

  useEffect(() => {
    fetchBranches();
    fetchEmployees();
    if (mode !== "create" && !initialData && code) {
      fetchDetail();
    } else if (mode === "create") {
      setLoading(false);
    }
  }, [code]);

  const fetchBranches = async () => {
    try {
      const res = await branchService.getAll();
      const list = Array.isArray(res) ? res : res?.content || [];
      setBranches(list);
      if (mode === "create" && list.length > 0 && !formData.branchId) {
        setFormData((prev) => ({ ...prev, branchId: String(list[0].id) }));
      }
    } catch {
      toast.error("Không thể tải danh sách chi nhánh");
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await EmployeeService.getAll({ status: "ACTIVE", size: 100 });
      const list = Array.isArray(res) ? res : res?.content || [];
      setEmployees(list.filter(isInternalEmployee));
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await InventoryCheckApiService.getDetail(code!);
      const formattedDate = res.checkDate
        ? res.checkDate.split("T")[0]
        : res.createdAt
          ? res.createdAt.split("T")[0]
          : new Date().toISOString().split("T")[0];

      setCurrentCheckId(res.id ?? null);
      setFormData({
        type: res.type || "PERIODIC",
        branchId: res.branchId?.toString() || "",
        code: res.code || code || "---",
        checkDate: formattedDate,
        checkedBy: res.checkedBy || "",
        createdByName: res.createdByName || "Admin",
        note: res.note || "",
      });
      setItems((res.details || []).map(mapItem));
      setWorkflowStatus(getWorkflowStatus(res.checkWorkflowStatus || res.status));
    } catch (error) {
      console.error("Error fetching detail:", error);
      toast.error("Không thể tải chi tiết phiếu");
    } finally {
      setLoading(false);
    }
  };

  const loadBranchSnapshot = async (branchId: string) => {
    if (!branchId || mode !== "create") return;
    try {
      setIsSearching(true);
      const data = await InventoryCheckApiService.searchProducts("", branchId);
      const productList = Array.isArray(data) ? data : data?.content || [];
      setItems(productList.map(mapItem));
      setSelectedProductIds([]);
      setSearchResults([]);
      setWorkflowStatus(
        productList.length > 0 ? "COUNTING_INIT" : "COUNTING_IN_PROGRESS",
      );
    } catch (error) {
      console.error(error);
      toast.error("Không thể tạo snapshot tồn kho cho chi nhánh này");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (mode !== "create" || !formData.branchId) return;
    void loadBranchSnapshot(formData.branchId);
  }, [formData.branchId, mode]);

  const handleSearchProduct = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    if (!formData.branchId) {
      toast.warning("Vui lòng chọn kho trước khi tìm sản phẩm");
      return;
    }
    setIsSearching(true);
    try {
      const data = await InventoryCheckApiService.searchProducts(
        term,
        formData.branchId,
      );
      const productList = Array.isArray(data) ? data : data?.content || [];
      setSearchResults(productList);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tìm kiếm sản phẩm");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearchProduct(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, formData.branchId]);

  const addItem = (variant: any) => {
    const exists = items.find(
      (item) => String(item.productVariantId) === String(variant.id),
    );
    if (exists) {
      toast.warning("Sản phẩm đã có trong phiếu kiểm kê");
      return;
    }

    setItems((prev) => [
      {
        productVariantId: variant.id,
        name: variant.productName || variant.name || "N/A",
        sku: variant.sku || "N/A",
        unit: variant.unit || "Cái",
        systemQuantity: toNumber(variant.quantity ?? 0),
        quantityReal: toNumber(variant.quantity ?? 0),
        quantityRejected: 0,
        minThreshold: toNumber(
          variant.minThreshold ??
            variant.minStock ??
            variant.reorderPoint ??
            10,
          10,
        ),
        reason: "",
        batchNumber: variant.batchNumber || "N/A",
        importPrice: toNumber(variant.importPrice ?? 0),
      },
      ...prev,
    ]);
  };

  const toggleSelectedProduct = (productId: number | string) => {
    setSelectedProductIds((prev) =>
      prev.some((id) => String(id) === String(productId))
        ? prev.filter((id) => String(id) !== String(productId))
        : [...prev, productId],
    );
  };

  const handleAddSelectedProducts = () => {
    const selectedProducts = searchResults.filter((product) =>
      selectedProductIds.some((id) => String(id) === String(product.id)),
    );
    if (selectedProducts.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }
    selectedProducts.forEach((product) => addItem(product));
    setSearchTerm("");
    setSearchResults([]);
    setSelectedProductIds([]);
  };

  const updateItem = (index: number, field: keyof CheckItem, value: string) => {
    setItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        if (
          field === "systemQuantity" ||
          field === "quantityReal" ||
          field === "quantityRejected" ||
          field === "minThreshold"
        ) {
          return { ...item, [field]: Math.max(0, toNumber(value)) };
        }
        return { ...item, [field]: value };
      }),
    );
  };

  const openNoteDialog = (index: number) => {
    setNoteDialogIndex(index);
    setNoteDraft(items[index]?.reason || "");
  };

  const closeNoteDialog = () => {
    setNoteDialogIndex(null);
    setNoteDraft("");
  };

  const saveNoteDialog = () => {
    if (noteDialogIndex === null) return;
    updateItem(noteDialogIndex, "reason", noteDraft);
    closeNoteDialog();
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const branchName = useMemo(
    () =>
      branches.find((branch) => String(branch.id) === String(formData.branchId))
        ?.name || "ARGISHRIMP CHI NHANH CAN THO",
    [branches, formData.branchId],
  );

  const checkedByNames = useMemo<string[]>(
    () =>
      formData.checkedBy.split(", ").filter((name: string) => Boolean(name)),
    [formData.checkedBy],
  );

  const summary = useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          const metrics = getItemMetrics(item);
          acc.systemQty += metrics.systemQty;
          acc.realQty += metrics.realQty;
          acc.rejectedQty += metrics.rejectedQty;
          acc.usableQty += metrics.usableQty;
          acc.suggestedImport += metrics.suggestedImport;
          if (metrics.rejectedQty > 0) acc.damagedLines += 1;
          if (metrics.suggestedImport > 0) acc.replenishmentLines += 1;
          if (metrics.diffQty !== 0) acc.diffLines += 1;
          return acc;
        },
        {
          systemQty: 0,
          realQty: 0,
          rejectedQty: 0,
          usableQty: 0,
          suggestedImport: 0,
          damagedLines: 0,
          replenishmentLines: 0,
          diffLines: 0,
        },
      ),
    [items],
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const metrics = getItemMetrics(item);
      const badge = getItemBadge(item);

      const matchesResult =
        resultFilter === "ALL" ||
        (resultFilter === "MATCHED" && badge.label === "Khớp kho") ||
        (resultFilter === "REPLENISH" && badge.label === "Cần nhập") ||
        (resultFilter === "DAMAGED" && badge.label === "Hư hại") ||
        (resultFilter === "DIFF" && badge.label === "Chênh lệch");

      const matchesStock =
        stockFilter === "ALL" ||
        (stockFilter === "HAS_DAMAGE" && metrics.rejectedQty > 0) ||
        (stockFilter === "LOW_STOCK" && metrics.suggestedImport > 0) ||
        (stockFilter === "HAS_DIFF" && metrics.diffQty !== 0) ||
        (stockFilter === "ENOUGH" &&
          metrics.rejectedQty === 0 &&
          metrics.suggestedImport === 0 &&
          metrics.diffQty === 0);

      return matchesResult && matchesStock;
    });
  }, [items, resultFilter, stockFilter]);

  const handleExportExcel = () => {
    const lowStockItems = items
      .map((item, index) => {
        const metrics = getItemMetrics(item);
        if (metrics.suggestedImport <= 0) return null;
        return {
          stt: index + 1,
          sku: item.sku,
          name: item.name,
          currentQty: metrics.usableQty,
          minThreshold: metrics.minThreshold,
        };
      })
      .filter(Boolean) as {
      stt: number;
      sku: string;
      name: string;
      currentQty: number;
      minThreshold: number;
    }[];

    if (lowStockItems.length === 0) {
      toast.info("Hiện chưa có sản phẩm nào dưới định mức tồn kho");
      return;
    }

    const now = new Date();
    const time = now.toLocaleTimeString("vi-VN");
    const date = now.toLocaleDateString("vi-VN");
    const rows = [
      ["BÁO CÁO CHI TIẾT SẢN PHẨM DƯỚI ĐỊNH MỨC TỒN KHO"],
      [`Chi nhánh: ${String(branchName).toUpperCase()}`],
      [`Thời gian xuất: ${time} ${date}`],
      [],
      ["STT", "SKU", "Tên sản phẩm", "Tồn hiện tại", "Định mức"],
      ...lowStockItems.map((item) => [
        item.stt,
        item.sku,
        item.name,
        item.currentQty,
        item.minThreshold,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
    ];
    ws["!cols"] = [
      { wch: 8 },
      { wch: 18 },
      { wch: 42 },
      { wch: 15 },
      { wch: 15 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Báo cáo tồn");
    XLSX.writeFile(wb, `bao-cao-ton-duoi-dinh-muc-${Date.now()}.xlsx`);
    toast.success("Đã xuất file Excel danh sách cần nhập thêm");
  };

  const handleSubmit = async () => {
    if (!formData.branchId) {
      toast.error("Vui lòng chọn kho kiểm kê");
      return;
    }
    if (items.length === 0) {
      toast.error("Vui lòng thêm ít nhất một sản phẩm");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        branchId: Number(formData.branchId),
        type: formData.type,
        checkDate: new Date(formData.checkDate).toISOString(),
        checkedBy: formData.checkedBy,
        note: formData.note,
        details: items.map((item) => ({
          productVariantId: item.productVariantId,
          batchNumber: item.batchNumber || "N/A",
          importPrice: item.importPrice || 0,
          systemQuantity: toNumber(item.systemQuantity),
          quantityReal: toNumber(item.quantityReal),
          quantityRejected: toNumber(item.quantityRejected),
          note: item.reason,
        })),
      };

      if (mode === "edit" && currentCheckId) {
        payload.id = currentCheckId;
      }

      await InventoryCheckApiService.saveCheck(payload);
      toast.success(payload.id ? "Cập nhật phiếu kiểm kê thành công" : "Tạo phiếu kiểm kê thành công");
      router.push("/admin/inventory-checks");
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi lưu phiếu kiểm kê");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      setIsSubmitting(true);
      let checkId = currentCheckId;
      if (!checkId) {
        if (!formData.branchId) {
          toast.error("Vui lòng chọn kho kiểm kê");
          return;
        }
        if (items.length === 0) {
          toast.error("Không có dữ liệu snapshot để gửi duyệt");
          return;
        }
        const payload: any = {
          branchId: Number(formData.branchId),
          type: formData.type,
          checkDate: new Date(formData.checkDate).toISOString(),
          checkedBy: formData.checkedBy,
          note: formData.note,
          details: items.map((item) => ({
            productVariantId: item.productVariantId,
            batchNumber: item.batchNumber || "N/A",
            importPrice: item.importPrice || 0,
            systemQuantity: toNumber(item.systemQuantity),
            quantityReal: toNumber(item.quantityReal),
            quantityRejected: toNumber(item.quantityRejected),
            note: item.reason,
          })),
        };
        const saved = await InventoryCheckApiService.saveCheck(payload);
        checkId = saved?.id;
        setCurrentCheckId(saved?.id ?? null);
      }
      if (checkId == null) {
        toast.error("Không thể xác định phiếu kiểm kê để gửi duyệt");
        return;
      }
      const response = await InventoryCheckApiService.submitForApproval(checkId);
      setWorkflowStatus(
        getWorkflowStatus(response?.checkWorkflowStatus || response?.status),
      );
      toast.success("Đã gửi phiếu kiểm kê sang bước chờ admin duyệt cân bằng");
      router.push("/admin/inventory-checks");
    } catch (error) {
      console.error(error);
      toast.error("Không thể gửi duyệt phiếu kiểm kê");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveAdjustment = async () => {
    try {
      setIsSubmitting(true);
      let checkId = currentCheckId;
      if (!checkId) {
        const detail = await InventoryCheckApiService.getDetail(formData.code);
        checkId = detail?.id;
      }
      if (!checkId) {
        toast.error("Không tìm thấy phiếu để duyệt cân bằng");
        return;
      }
      const response = await InventoryCheckApiService.approveAdjustment(checkId);
      setWorkflowStatus(
        getWorkflowStatus(response?.checkWorkflowStatus || response?.status),
      );
      toast.success("Đã duyệt cân bằng và ép tồn hệ thống về đúng số thực tế");
      router.push("/admin/inventory-checks");
    } catch (error) {
      console.error(error);
      toast.error("Không thể duyệt cân bằng phiếu kiểm kê");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    await handleApproveAdjustment();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-slate-400">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-[11px] uppercase tracking-widest text-slate-400">
          Đang đồng bộ dữ liệu...
        </p>
      </div>
    );
  }

  const pageTitle =
    mode === "create"
      ? "Thêm phiếu kiểm kê mới"
      : mode === "edit"
        ? `Cập nhật phiếu ${formData.code}`
        : `Chi tiết phiếu ${formData.code}`;
  const workflowStatusMeta = getWorkflowStatusMeta(workflowStatus);

  return (
    <div className="space-y-3 pb-[100px] text-slate-800">
      <div className="mt-2 mb-8 space-y-4 px-1">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
              {pageTitle}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {workflowStatus !== "COUNTING_INIT" && (
              <Badge
                className={cn(
                  "rounded-[4px] border px-3 py-1 text-[11px] font-medium shadow-none",
                  workflowStatusMeta.className,
                )}
              >
                {workflowStatusMeta.label}
              </Badge>
            )}
            <Button
              variant="outline"
              className="h-[38px] border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-600 shadow-none hover:bg-blue-50 hover:text-blue-600"
              onClick={handleExportExcel}
            >
              <FileSpreadsheet size={14} className="mr-2" />
              Xuất Excel
            </Button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 shadow-sm">
          <div className="border-b border-slate-200 pb-3">
            <span className="text-[11px] font-bold text-slate-800">
              1. Thông tin phiếu kiểm kê
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="space-y-1.5 xl:col-span-4">
              <Label className="text-[10px] font-medium text-slate-400">
                Loại kiểm kê
              </Label>
              <Select
                disabled={mode === "view"}
                value={formData.type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger className="h-9 rounded-md border-slate-200 bg-white text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERIODIC">Định kỳ</SelectItem>
                  <SelectItem value="UNEXPECTED">Đột xuất</SelectItem>
                  <SelectItem value="YEAR_END">Cuối năm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 xl:col-span-4">
              <Label className="text-[10px] font-medium text-slate-400">
                Kho kiểm kê
              </Label>
              <Select
                disabled={mode !== "create"}
                value={formData.branchId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, branchId: value }))
                }
              >
                <SelectTrigger className="h-9 rounded-md border-slate-200 bg-white text-[13px]">
                  <SelectValue placeholder="Chọn kho kiểm kê" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={String(branch.id)}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 xl:col-span-4">
              <Label className="text-[10px] font-medium text-slate-400">
                Số chứng từ
              </Label>
              <div className="flex h-9 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-[13px] font-medium text-slate-700">
                {formData.code}
              </div>
            </div>

            <div className="space-y-1.5 xl:col-span-4">
              <Label className="text-[10px] font-medium text-slate-400">
                Ngày kiểm kê
              </Label>
              <Input
                type="date"
                disabled={mode === "view"}
                className="h-9 rounded-md border-slate-200 bg-white text-[13px]"
                value={formData.checkDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    checkDate: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-1.5 xl:col-span-4">
              <Label className="text-[10px] font-medium text-slate-400">
                Người kiểm kê
              </Label>
              <Select
                disabled={mode === "view"}
                value=""
                onValueChange={(value) => {
                  const employee = employees.find(
                    (item) => item.fullName === value || item.username === value,
                  );
                  const name = employee?.fullName || value;
                  if (checkedByNames.includes(name)) return;
                  setFormData((prev) => ({
                    ...prev,
                    checkedBy: prev.checkedBy
                      ? `${prev.checkedBy}, ${name}`
                      : name,
                  }));
                }}
              >
                <SelectTrigger className="h-9 rounded-md border-slate-200 bg-white text-[13px]">
                  <SelectValue placeholder="Thêm người kiểm kê" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.fullName}>
                      {employee.fullName} ({employee.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {checkedByNames.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {checkedByNames.map((name) => (
                    <Badge
                      key={name}
                      className="gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-normal text-slate-700"
                    >
                      {name}
                      {mode !== "view" && (
                        <X
                          size={12}
                          className="cursor-pointer text-slate-400 hover:text-rose-500"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              checkedBy: checkedByNames
                                .filter((item) => item !== name)
                                .join(", "),
                            }))
                          }
                        />
                      )}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5 xl:col-span-4">
              <Label className="text-[10px] font-medium text-slate-400">
                Người tạo
              </Label>
              <div className="flex h-9 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-[13px] font-medium text-slate-700">
                {formData.createdByName}
              </div>
            </div>

            <div className="space-y-1.5 xl:col-span-12">
              <Label className="text-[10px] font-medium text-slate-400">
                Ghi chú phiếu
              </Label>
              <Input
                disabled={mode === "view"}
                className="h-9 rounded-md border-slate-200 bg-white text-[13px]"
                placeholder="Mô tả đợt kiểm kê hoặc lưu ý xử lý tồn kho..."
                value={formData.note}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, note: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 shadow-sm">
          <div className="border-b border-slate-200 pb-3">
            <span className="text-[11px] font-bold text-slate-800">
              2. Danh sách sản phẩm kiểm kê
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2.5 xl:grid-cols-4">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
              <p className="text-[10px] font-medium text-slate-400">Tồn hệ thống</p>
              <p className="mt-1 text-[21px] font-semibold tracking-tight text-slate-900">
                {formatNumber(summary.systemQty)}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
              <p className="text-[10px] font-medium text-slate-400">Tồn khả dụng sau kiểm</p>
              <p className="mt-1 text-[21px] font-semibold tracking-tight text-slate-900">
                {formatNumber(summary.usableQty)}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
              <p className="text-[10px] font-medium text-slate-400">Đơn vị hư hại</p>
              <p className="mt-1 text-[21px] font-semibold tracking-tight text-slate-900">
                {formatNumber(summary.rejectedQty)}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                {summary.damagedLines} dòng có hư hại
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
              <p className="text-[10px] font-medium text-slate-400">Cần nhập thêm</p>
              <p className="mt-1 text-[21px] font-semibold tracking-tight text-slate-900">
                {formatNumber(summary.suggestedImport)}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                {summary.replenishmentLines} dòng dưới định mức
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-6" />

          <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center">
            {mode !== "view" && (
              <div className="relative w-full xl:max-w-[420px] xl:flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <Input
                  className="h-9 rounded-md border-slate-200 bg-white pl-9 pr-9 text-sm"
                  placeholder="Tìm SKU hoặc tên sản phẩm để thêm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {isSearching && (
                  <Loader2
                    className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
                    size={15}
                  />
                )}

                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
                    <div className="flex items-center justify-between gap-3 border-b bg-slate-50 px-3 py-2 text-xs">
                      <span className="text-slate-500">
                        Đã chọn{" "}
                        <span className="font-bold text-slate-700">
                          {selectedProductIds.length}
                        </span>{" "}
                        sản phẩm
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={handleAddSelectedProducts}
                      >
                        Thêm đã chọn
                      </Button>
                    </div>
                    <div className="max-h-[320px] overflow-y-auto">
                      {searchResults.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 text-left transition hover:bg-slate-50"
                          onClick={() => addItem(product)}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center"
                            >
                              <Checkbox
                                checked={selectedProductIds.some(
                                  (id) => String(id) === String(product.id),
                                )}
                                onCheckedChange={() =>
                                  toggleSelectedProduct(product.id)
                                }
                              />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {product.productName || product.name}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                SKU: {product.sku} | tồn hiện tại:{" "}
                                {formatNumber(toNumber(product.quantity))}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {toNumber(product.quantity) <=
                              toNumber(
                                product.minThreshold ?? product.minStock ?? 10,
                                10,
                              ) && (
                              <Badge className="rounded-md border border-amber-100 bg-amber-50 text-[10px] font-medium text-amber-700">
                                Sắp hết hàng
                              </Badge>
                            )}
                            <Plus size={16} className="text-emerald-600" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Select value={resultFilter} onValueChange={setResultFilter}>
              <SelectTrigger className="h-9 w-full rounded-md border-slate-200 bg-white text-[12px] xl:w-[170px]">
                <SelectValue placeholder="Lọc kết luận" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả kết luận</SelectItem>
                <SelectItem value="MATCHED">Khớp kho</SelectItem>
                <SelectItem value="REPLENISH">Cần nhập</SelectItem>
                <SelectItem value="DAMAGED">Hư hại</SelectItem>
                <SelectItem value="DIFF">Chênh lệch</SelectItem>
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="h-9 w-full rounded-md border-slate-200 bg-white text-[12px] xl:w-[170px]">
                <SelectValue placeholder="Lọc tình trạng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả tình trạng</SelectItem>
                <SelectItem value="HAS_DAMAGE">Có hư hại</SelectItem>
                <SelectItem value="LOW_STOCK">Dưới định mức</SelectItem>
                <SelectItem value="HAS_DIFF">Có chênh lệch</SelectItem>
                <SelectItem value="ENOUGH">Ổn định</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-5 overflow-x-auto rounded-[4px] border border-slate-100">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow className="border-b border-[#ccc] bg-[#f0f0f0] hover:bg-[#f0f0f0]">
                  <TableHead className="w-10 px-1 py-2 text-center text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">STT</TableHead>
                  <TableHead className="w-[98px] px-1 py-2 text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">Mã SKU</TableHead>
                  <TableHead className="w-[150px] min-w-[150px] max-w-[150px] px-1 py-2 text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">Sản phẩm</TableHead>
                  <TableHead className="px-1 py-2 text-center text-[9px] font-semibold text-[#1f1f1f] whitespace-nowrap">Đơn vị</TableHead>
                  <TableHead className="px-1 py-2 text-right text-[9px] font-semibold text-[#1f1f1f] whitespace-nowrap">Tồn kho</TableHead>
                  <TableHead className="px-1 py-2 text-right text-[9px] font-semibold text-[#1f1f1f] whitespace-nowrap">Đếm thực</TableHead>
                  <TableHead className="px-1 py-2 text-right text-[9px] font-semibold text-[#1f1f1f] whitespace-nowrap">SL hư</TableHead>
                  <TableHead className="px-1 py-2 text-right text-[9px] font-semibold text-[#1f1f1f] whitespace-nowrap">Khả dụng</TableHead>
                  <TableHead className="px-1 py-2 text-right text-[9px] font-semibold text-[#1f1f1f] whitespace-nowrap">ĐM</TableHead>
                  <TableHead className="px-1 py-2 text-right text-[9px] font-semibold text-[#1f1f1f] whitespace-nowrap">Cần nhập</TableHead>
                  <TableHead className="px-1 py-2 text-center text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">Kết luận</TableHead>
                  <TableHead className="w-[72px] px-1 py-2 text-center text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={12}
                      className="h-32 text-center"
                    >
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <Boxes size={32} className="opacity-40" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">Chưa có sản phẩm kiểm kê</p>
                          <p className="mt-1 text-sm">Kho này chưa có dữ liệu hàng hóa để lập phiếu kiểm kê.</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={12}
                      className="h-28 text-center text-sm text-slate-500"
                    >
                      Không có sản phẩm phù hợp với điều kiện lọc hiện tại
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const index = items.findIndex(
                      (sourceItem) =>
                        String(sourceItem.productVariantId) ===
                          String(item.productVariantId) &&
                        sourceItem.sku === item.sku,
                    );
                    const metrics = getItemMetrics(item);
                    const badge = getItemBadge(item);
                    return (
                      <TableRow
                        key={`${item.productVariantId}-${index}`}
                        className="border-b border-[#eee] transition-colors hover:bg-[#f0f8ff]"
                      >
                        <TableCell className="px-1 py-2 text-center text-[12px] text-slate-500">
                          {index + 1}
                        </TableCell>
                        <TableCell className="px-1 py-2 font-mono text-[11px] font-medium whitespace-nowrap text-slate-700">
                          {item.sku}
                        </TableCell>
                        <TableCell className="w-[150px] min-w-[150px] max-w-[150px] px-1 py-2">
                          <div>
                            <p className="max-w-[150px] break-words text-[11px] font-medium leading-4.5 text-slate-900">
                              {item.name}
                            </p>
                            {metrics.diffQty !== 0 && (
                              <p className={cn("mt-0.5 text-[10px] font-semibold", metrics.diffQty < 0 ? "text-rose-600" : "text-blue-600")}>
                                Lệch {metrics.diffQty > 0 ? `+${metrics.diffQty}` : metrics.diffQty}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-1 py-2 text-center text-[11px] text-slate-600">
                          {item.unit}
                        </TableCell>
                        <TableCell className="px-1 py-2 text-right text-[11px] font-medium text-slate-800">
                          {formatNumber(metrics.systemQty)}
                        </TableCell>
                        <TableCell className="px-1 py-2 text-right">
                          <Input
                            type="number"
                            disabled={mode === "view"}
                            className="ml-auto h-6 w-[50px] rounded-md border-slate-200 bg-white px-1 text-right text-[11px] font-medium text-slate-800"
                            value={item.quantityReal}
                            onChange={(e) =>
                              updateItem(index, "quantityReal", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell className="px-1 py-2 text-right">
                          <Input
                            type="number"
                            disabled={mode === "view"}
                            className="ml-auto h-6 w-[50px] rounded-md border-slate-200 bg-white px-1 text-right text-[11px] font-medium text-slate-800"
                            value={item.quantityRejected}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "quantityRejected",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="px-1 py-2 text-right text-[11px] font-medium text-slate-800">
                          {formatNumber(metrics.usableQty)}
                        </TableCell>
                        <TableCell className="px-1 py-2 text-right">
                          <Input
                            type="number"
                            disabled={mode === "view"}
                            className="ml-auto h-6 w-[50px] rounded-md border-slate-200 bg-white px-1 text-right text-[11px] font-medium text-slate-800"
                            value={item.minThreshold}
                            onChange={(e) =>
                              updateItem(index, "minThreshold", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell className="px-1 py-2 text-right text-[11px] font-medium text-slate-800">
                          {formatNumber(metrics.suggestedImport)}
                        </TableCell>
                        <TableCell className="px-1 py-2 text-center">
                          <Badge
                            className={cn(
                              "rounded-md border px-1.5 py-0.5 text-[9px] font-normal",
                              badge.className,
                            )}
                          >
                            {badge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-1 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-7 w-7 rounded-md hover:bg-slate-100",
                                item.reason
                                  ? "text-emerald-600 hover:text-emerald-700"
                                  : "text-slate-400 hover:text-slate-600",
                              )}
                              onClick={() => openNoteDialog(index)}
                              title="Ghi chú"
                            >
                              <MessageSquareText size={15} />
                            </Button>
                            {mode !== "view" && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-md text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                                onClick={() => removeItem(index)}
                              >
                                <Trash2 size={15} />
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

        <Dialog
          open={noteDialogIndex !== null}
          onOpenChange={(open) => !open && closeNoteDialog()}
        >
          <DialogContent className="max-w-md rounded-[6px] border border-slate-200 bg-white p-0 shadow-xl">
            <DialogHeader className="border-b border-slate-200 px-5 py-4">
              <DialogTitle className="text-[16px] font-bold text-slate-900">
                Ghi chú sản phẩm
              </DialogTitle>
              <DialogDescription className="pt-1 text-[12px] leading-relaxed text-slate-500">
                {noteDialogIndex !== null
                  ? items[noteDialogIndex]?.name
                  : "Cập nhật lý do hư hại hoặc ghi chú kiểm kê"}
              </DialogDescription>
            </DialogHeader>

            <div className="px-5 py-4">
              <Textarea
                value={noteDraft}
                disabled={mode === "view"}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Ghi rõ nguyên nhân hoặc ghi chú liên quan..."
                className="min-h-[120px] resize-none rounded-md border-slate-200 text-[13px] shadow-none"
              />
            </div>

            <DialogFooter className="border-t border-slate-200 px-5 py-4">
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-md border-slate-200 px-4 text-[11px] font-medium text-slate-700 shadow-none hover:bg-slate-50"
                onClick={closeNoteDialog}
              >
                {mode === "view" ? "Đóng" : "Hủy"}
              </Button>
              {mode !== "view" && (
                <Button
                  type="button"
                  className="h-9 rounded-md bg-emerald-600 px-4 text-[11px] font-medium text-white hover:bg-emerald-700"
                  onClick={saveNoteDialog}
                >
                  Lưu ghi chú
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="fixed bottom-0 left-0 right-0 z-[999] flex justify-end gap-3 border-t bg-white p-3 lg:left-[260px]">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/admin/inventory-checks")}
            className="text-[11px] font-medium text-slate-400"
          >
            Quay lại
          </Button>

          {mode === "view" &&
            (workflowStatus === "COUNTING_INIT" ||
              workflowStatus === "COUNTING_IN_PROGRESS") &&
            hasPermission(P.CHECK_UPDATE) && (
              <Button
                variant="outline"
                className="h-9 border-slate-200 bg-white px-5 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                onClick={() => router.push(`/admin/inventory-checks/${formData.code}?edit=true`)}
              >
                <Pencil size={14} className="mr-2" />
                Sửa phiếu
              </Button>
            )}

          {mode === "view" &&
            workflowStatus === "WAITING_FOR_ADJUSTMENT_APPROVAL" &&
            hasPermission(P.CHECK_APPROVE) && (
              <Button
                className="h-9 bg-emerald-600 px-6 text-[11px] font-medium text-white shadow-xl hover:bg-emerald-700"
                disabled={isSubmitting}
                onClick={handleComplete}
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 size={14} className="mr-2" />
                )}
                Duyệt cân bằng
              </Button>
            )}

          {mode !== "view" && (
            <>
              <Button
                variant="outline"
                className="h-9 border-slate-200 bg-white px-5 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                disabled={isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="mr-2 animate-spin" />
                ) : (
                  <Save size={14} className="mr-2" />
                )}
                Lưu phiếu
              </Button>
              {hasPermission(P.CHECK_UPDATE) && (
                <Button
                  className="h-9 bg-emerald-600 px-6 text-[11px] font-medium text-white shadow-xl hover:bg-emerald-700"
                  disabled={isSubmitting}
                  onClick={handleSubmitForApproval}
                >
                  {isSubmitting ? (
                    <Loader2 size={14} className="mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} className="mr-2" />
                  )}
                  Gửi duyệt cân bằng
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
