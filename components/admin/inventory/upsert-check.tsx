"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Boxes,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  FileSpreadsheet,
  Hash,
  Loader2,
  Pencil,
  Plus,
  Save,
  Search,
  ShieldAlert,
  Trash2,
  User,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ProductService } from "@/app/services/product.service";
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
  unit: item.unit || "Cai",
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
  if (metrics.rejectedQty > 0) return { label: "HÆ° háº¡i", className: "bg-rose-50 text-rose-700 border-rose-100" };
  if (metrics.suggestedImport > 0) return { label: "Cáº§n nháº­p thĂªm", className: "bg-amber-50 text-amber-700 border-amber-100" };
  if (metrics.diffQty !== 0) return { label: "ChĂªnh lá»‡ch", className: "bg-sky-50 text-sky-700 border-sky-100" };
  return { label: "Khá»›p kho", className: "bg-emerald-50 text-emerald-700 border-emerald-100" };
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
  const [status, setStatus] = useState(initialData?.status || "PENDING");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<
    (number | string)[]
  >([]);

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
      toast.error("Khong the tai danh sach chi nhanh");
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
      setStatus(res.status || "PENDING");
    } catch (error) {
      console.error("Error fetching detail:", error);
      toast.error("Khong the tai chi tiet phieu");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchProduct = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    if (!formData.branchId) {
      toast.warning("Vui long chon kho truoc khi tim san pham");
      return;
    }
    setIsSearching(true);
    try {
      const data = await ProductService.searchVariants(term, formData.branchId);
      const productList = Array.isArray(data) ? data : data?.content || [];
      setSearchResults(productList);
    } catch (error) {
      console.error(error);
      toast.error("Khong the tim kiem san pham");
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
      toast.warning("San pham da co trong phieu kiem ke");
      return;
    }

    setItems((prev) => [
      {
        productVariantId: variant.id,
        name: variant.productName || variant.name || "N/A",
        sku: variant.sku || "N/A",
        unit: variant.unit || "Cai",
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
      toast.info("Hien chua co san pham nao duoi dinh muc ton kho");
      return;
    }

    const now = new Date();
    const time = now.toLocaleTimeString("vi-VN");
    const date = now.toLocaleDateString("vi-VN");
    const rows = [
      ["BAO CAO CHI TIET SAN PHAM DUOI DINH MUC TON KHO"],
      [`Chi nhanh: ${String(branchName).toUpperCase()}`],
      [`Thoi gian xuat: ${time} ${date}`],
      [],
      ["STT", "SKU", "Ten san pham", "Ton hien tai", "Dinh muc"],
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
    XLSX.utils.book_append_sheet(wb, ws, "Bao cao ton");
    XLSX.writeFile(wb, `bao-cao-ton-duoi-dinh-muc-${Date.now()}.xlsx`);
    toast.success("Da xuat file Excel de xuat nhap them");
  };

  const handleSubmit = async () => {
    if (!formData.branchId) {
      toast.error("Vui long chon kho kiem ke");
      return;
    }
    if (items.length === 0) {
      toast.error("Vui long them it nhat mot san pham");
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
      toast.success(
        payload.id
          ? "Cap nhat phieu kiem ke thanh cong"
          : "Tao phieu kiem ke thanh cong",
      );
      router.push("/admin/inventory-checks");
    } catch (error) {
      console.error(error);
      toast.error("Loi khi luu phieu kiem ke");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    try {
      setIsSubmitting(true);
      let checkId = currentCheckId;
      if (!checkId) {
        const detail = await InventoryCheckApiService.getDetail(formData.code);
        checkId = detail?.id;
      }
      if (!checkId) {
        toast.error("Khong tim thay phieu de chot");
        return;
      }
      await InventoryCheckApiService.completeCheck(checkId);
      toast.success("Da chot phieu va cap nhat ton kho thanh cong");
      router.push("/admin/inventory-checks");
    } catch (error) {
      console.error(error);
      toast.error("Loi khi chot phieu kiem ke");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-5 py-2.5 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => router.push("/admin/inventory-checks")}
            >
              <ChevronLeft size={16} />
            </Button>
            <div>
              <p className="text-[11px] font-medium text-slate-500">Kiá»ƒm kĂª kho</p>
              <h1 className="text-base font-semibold text-slate-900">
                {mode === "create"
                  ? "Tạo phiếu kiểm kê kho"
                  : mode === "edit"
                    ? `Chỉnh sửa phiếu ${formData.code}`
                    : `Chi tiết phiếu ${formData.code}`}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="h-8 rounded-md border-slate-200 px-3 text-[12px] font-medium"
              onClick={handleExportExcel}
            >
              <FileSpreadsheet size={14} className="mr-2" />
              Xuất Excel
            </Button>

            {mode === "view" && status === "PENDING" && hasPermission(P.CHECK_UPDATE) && (
              <Button
                variant="outline"
                className="h-8 rounded-md border-amber-200 px-3 text-[12px] font-medium text-amber-700"
                onClick={() => router.push(`/admin/inventory-checks/${formData.code}?edit=true`)}
              >
                <Pencil size={14} className="mr-2" />
                Sá»­a phiáº¿u
              </Button>
            )}

            {mode === "view" && status === "PENDING" && hasPermission(P.CHECK_APPROVE) && (
              <Button className="h-8 rounded-md bg-emerald-600 px-3 text-[12px] font-medium text-white hover:bg-emerald-700" disabled={isSubmitting} onClick={handleComplete}>
                {isSubmitting ? <Loader2 size={14} className="mr-2 animate-spin" /> : <CheckCircle2 size={14} className="mr-2" />}
                Chá»‘t phiáº¿u
              </Button>
            )}

            {mode !== "view" && (
              <Button className="h-8 rounded-md bg-slate-900 px-3 text-[12px] font-medium text-white hover:bg-slate-800" disabled={isSubmitting} onClick={handleSubmit}>
                {isSubmitting ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Save size={14} className="mr-2" />}
                LÆ°u phiáº¿u
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1360px] space-y-4 px-5 py-4">
        <div className="grid gap-4 xl:grid-cols-[1.35fr,0.65fr]">
          <Card className="overflow-hidden border border-slate-200 shadow-none">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={16} className="text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">ThĂ´ng tin kiá»ƒm kĂª</h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Kiá»ƒm tra hĂ ng hĂ³a hÆ° háº¡i, Ä‘á»‘i chiáº¿u tá»“n kháº£ dá»¥ng vĂ  xĂ¡c Ä‘á»‹nh máº·t hĂ ng cáº§n nháº­p bá»• sung.
              </p>
            </div>

            <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-slate-600">Loáº¡i kiá»ƒm kĂª</Label>
                <Select disabled={mode === "view"} value={formData.type} onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}>
                  <SelectTrigger className="h-9 rounded-md border-slate-200 bg-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERIODIC">Định kỳ</SelectItem>
                    <SelectItem value="UNEXPECTED">Đột xuất</SelectItem>
                    <SelectItem value="YEAR_END">Cuối năm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-slate-600">Kho kiá»ƒm kĂª</Label>
                <Select disabled={mode !== "create"} value={formData.branchId} onValueChange={(value) => setFormData((prev) => ({ ...prev, branchId: value }))}>
                  <SelectTrigger className="h-9 rounded-md border-slate-200 bg-white text-sm">
                    <div className="flex items-center gap-2 truncate">
                      <Building2 size={14} className="text-slate-400" />
                      <SelectValue placeholder="Chọn kho kiểm kê" />
                    </div>
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

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-slate-600">Sá»‘ chá»©ng tá»«</Label>
                <div className="flex h-9 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700">
                  <Hash size={14} className="mr-2 text-slate-400" />
                  {formData.code}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-slate-600">NgĂ y kiá»ƒm kĂª</Label>
                <div className="relative">
                  <Calendar
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={14}
                  />
                  <Input
                    type="date"
                    disabled={mode === "view"}
                    className="h-9 rounded-md border-slate-200 bg-white pl-10 text-sm"
                    value={formData.checkDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        checkDate: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-slate-600">NgÆ°á»i kiá»ƒm kĂª</Label>
                <Select
                  disabled={mode === "view"}
                  value=""
                  onValueChange={(value) => {
                    const employee = employees.find(
                      (item) =>
                        item.fullName === value || item.username === value,
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
                  <SelectTrigger className="h-9 rounded-md border-slate-200 bg-white text-sm">
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
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-slate-600">NgÆ°á»i táº¡o</Label>
                <div className="flex h-9 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700">
                  <User size={14} className="mr-2 text-slate-400" />
                  {formData.createdByName}
                </div>
              </div>
            </div>

            <div className="px-4 pb-4">
              {checkedByNames.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
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

              <Label className="text-[12px] font-medium text-slate-600">Ghi chĂº phiáº¿u</Label>
              <Input
                disabled={mode === "view"}
                className="mt-1 h-9 rounded-md border-slate-200 bg-white text-sm"
                placeholder="Mô tả đợt kiểm kê hoặc lưu ý xử lý tồn kho..."
                value={formData.note}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, note: e.target.value }))
                }
              />
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <Card className="border border-slate-200 bg-white p-4 shadow-none">
              <p className="text-sm font-semibold text-slate-900">Tá»•ng quan kiá»ƒm kĂª</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[12px] font-medium text-slate-500">Tá»“n há»‡ thá»‘ng</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(summary.systemQty)}</p>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[12px] font-medium text-slate-500">Tá»“n kháº£ dá»¥ng sau kiá»ƒm</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(summary.usableQty)}</p>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[12px] font-medium text-slate-500">ÄÆ¡n vá»‹ hÆ° háº¡i</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(summary.rejectedQty)}</p>
                  <p className="mt-1 text-xs text-slate-500">{summary.damagedLines} dĂ²ng cĂ³ hÆ° háº¡i</p>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[12px] font-medium text-slate-500">Cáº§n nháº­p thĂªm</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(summary.suggestedImport)}</p>
                  <p className="mt-1 text-xs text-slate-500">{summary.replenishmentLines} dĂ²ng dÆ°á»›i Ä‘á»‹nh má»©c</p>
                </div>
              </div>
            </Card>

            <Card className="border border-slate-200 bg-white p-4 shadow-none">
              <p className="text-sm font-semibold text-slate-900">Káº¿t luáº­n nhanh</p>
              <div className="mt-3 space-y-2.5 text-sm text-slate-600">
                <div className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <ShieldAlert size={18} className="mt-0.5 text-rose-500" />
                  <div>
                    <p className="font-medium text-slate-800">Æ¯u tiĂªn xá»­ lĂ½ hĂ ng hÆ° háº¡i</p>
                    <p>{summary.damagedLines > 0 ? `CĂ³ ${summary.damagedLines} máº·t hĂ ng cáº§n cáº­p nháº­t hao há»¥t hoáº·c hÆ° háº¡i.` : "Hiá»‡n chÆ°a cĂ³ dĂ²ng nĂ o ghi nháº­n hÆ° háº¡i."}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <AlertTriangle size={18} className="mt-0.5 text-amber-500" />
                  <div>
                    <p className="font-medium text-slate-800">Äá» xuáº¥t nháº­p bá»• sung</p>
                    <p>{summary.replenishmentLines > 0 ? `CĂ³ ${summary.replenishmentLines} máº·t hĂ ng Ä‘ang dÆ°á»›i Ä‘á»‹nh má»©c vĂ  cĂ³ thá»ƒ xuáº¥t Excel ngay.` : "Tá»“n kháº£ dá»¥ng Ä‘ang Ä‘Ă¡p á»©ng Ä‘á»‹nh má»©c tá»‘i thiá»ƒu."}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Card className="overflow-hidden border border-slate-200 bg-white shadow-none">
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-[12px] font-medium text-slate-500">Danh sĂ¡ch sáº£n pháº©m</p>
                <h2 className="mt-1 text-base font-semibold text-slate-900">Theo dĂµi hĂ ng hĂ³a, hÆ° háº¡i vĂ  nhu cáº§u nháº­p thĂªm</h2>
              </div>

              {mode !== "view" && (
                <div className="relative w-full max-w-xl">
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
                                  SKU: {product.sku} | tá»“n hiá»‡n táº¡i: {formatNumber(toNumber(product.quantity))}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {toNumber(product.quantity) <= toNumber(product.minThreshold ?? product.minStock ?? 10, 10) && (
                                <Badge className="rounded-md border border-amber-100 bg-amber-50 text-[10px] font-medium text-amber-700">Sáº¯p háº¿t hĂ ng</Badge>
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
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-slate-100">
                  <TableHead className="w-12 text-center text-[12px] font-medium text-slate-500 whitespace-nowrap">STT</TableHead>
                  <TableHead className="w-[130px] text-[12px] font-medium text-slate-500 whitespace-nowrap">SKU</TableHead>
                  <TableHead className="min-w-[220px] text-[12px] font-medium text-slate-500 whitespace-nowrap">TĂªn sáº£n pháº©m</TableHead>
                  <TableHead className="text-center text-[12px] font-medium text-slate-500 whitespace-nowrap">ÄVT</TableHead>
                  <TableHead className="text-right text-[12px] font-medium text-slate-500 whitespace-nowrap">Tá»“n há»‡ thá»‘ng</TableHead>
                  <TableHead className="text-right text-[12px] font-medium text-slate-500 whitespace-nowrap">Äáº¿m thá»±c táº¿</TableHead>
                  <TableHead className="text-right text-[12px] font-medium text-slate-500 whitespace-nowrap">HÆ° háº¡i</TableHead>
                  <TableHead className="text-right text-[12px] font-medium text-slate-500 whitespace-nowrap">Kháº£ dá»¥ng</TableHead>
                  <TableHead className="text-right text-[12px] font-medium text-slate-500 whitespace-nowrap">Äá»‹nh má»©c</TableHead>
                  <TableHead className="text-right text-[12px] font-medium text-slate-500 whitespace-nowrap">Cáº§n nháº­p thĂªm</TableHead>
                  <TableHead className="text-center text-[12px] font-medium text-slate-500 whitespace-nowrap">Káº¿t luáº­n</TableHead>
                  <TableHead className="min-w-[200px] text-[12px] font-medium text-slate-500 whitespace-nowrap">Ghi chĂº</TableHead>
                  {mode !== "view" && <TableHead className="w-16" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={mode === "view" ? 12 : 13}
                      className="h-32 text-center"
                    >
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <Boxes size={32} className="opacity-40" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">ChÆ°a cĂ³ sáº£n pháº©m kiá»ƒm kĂª</p>
                          <p className="mt-1 text-sm">ThĂªm sáº£n pháº©m Ä‘á»ƒ theo dĂµi hÆ° háº¡i vĂ  Ä‘á» xuáº¥t nháº­p kho.</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => {
                    const metrics = getItemMetrics(item);
                    const badge = getItemBadge(item);
                    return (
                      <TableRow
                        key={`${item.productVariantId}-${index}`}
                        className="border-slate-100"
                      >
                        <TableCell className="text-center text-sm text-slate-500">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-mono text-sm font-medium text-slate-700">
                          {item.sku}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {item.name}
                            </p>
                            {metrics.diffQty !== 0 && (
                              <p className={cn("mt-1 text-xs font-semibold", metrics.diffQty < 0 ? "text-rose-600" : "text-blue-600")}>
                                ChĂªnh lá»‡ch {metrics.diffQty > 0 ? `+${metrics.diffQty}` : metrics.diffQty}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm text-slate-600">
                          {item.unit}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-slate-800">
                          {formatNumber(metrics.systemQty)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            disabled={mode === "view"}
                            className="ml-auto h-8 w-20 rounded-md border-slate-200 bg-white px-2 text-right text-sm font-medium text-slate-800"
                            value={item.quantityReal}
                            onChange={(e) =>
                              updateItem(index, "quantityReal", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            disabled={mode === "view"}
                            className="ml-auto h-8 w-20 rounded-md border-slate-200 bg-white px-2 text-right text-sm font-medium text-slate-800"
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
                        <TableCell className="text-right text-sm font-medium text-slate-800">
                          {formatNumber(metrics.usableQty)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            disabled={mode === "view"}
                            className="ml-auto h-8 w-20 rounded-md border-slate-200 bg-white px-2 text-right text-sm font-medium text-slate-800"
                            value={item.minThreshold}
                            onChange={(e) =>
                              updateItem(index, "minThreshold", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-slate-800">
                          {formatNumber(metrics.suggestedImport)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={cn(
                              "rounded-md border px-2 py-0.5 text-[11px] font-normal",
                              badge.className,
                            )}
                          >
                            {badge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Input disabled={mode === "view"} className="h-8 rounded-md border-slate-200 bg-white text-sm" placeholder="Ghi rĂµ nguyĂªn nhĂ¢n..." value={item.reason} onChange={(e) => updateItem(index, "reason", e.target.value)} />
                        </TableCell>
                        {mode !== "view" && (
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-md text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 size={15} />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
