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
  minThreshold: toNumber(item.minThreshold ?? item.minStock ?? item.reorderPoint ?? 10, 10),
  reason: item.reason || item.note || "",
  batchNumber: item.batchNumber || "N/A",
  importPrice: toNumber(item.importPrice ?? 0),
});

const getItemMetrics = (item: CheckItem) => {
  const realQty = Math.max(0, toNumber(item.quantityReal));
  const rejectedQty = Math.max(0, Math.min(realQty, toNumber(item.quantityRejected)));
  const usableQty = Math.max(0, realQty - rejectedQty);
  const systemQty = Math.max(0, toNumber(item.systemQuantity));
  const minThreshold = Math.max(0, toNumber(item.minThreshold, 10));
  const diffQty = usableQty - systemQty;
  const suggestedImport = Math.max(0, minThreshold - usableQty);
  return { realQty, rejectedQty, usableQty, systemQty, minThreshold, diffQty, suggestedImport };
};

const getItemBadge = (item: CheckItem) => {
  const metrics = getItemMetrics(item);
  if (metrics.rejectedQty > 0) return { label: "Hu hai", className: "bg-rose-50 text-rose-700 border-rose-200" };
  if (metrics.suggestedImport > 0) return { label: "Can nhap them", className: "bg-amber-50 text-amber-700 border-amber-200" };
  if (metrics.diffQty !== 0) return { label: "Chenh lech", className: "bg-blue-50 text-blue-700 border-blue-200" };
  return { label: "Khop kho", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
};

export default function InventoryUpsert({ mode, initialData, code }: InventoryUpsertProps) {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const { hasPermission } = usePermissions();

  const [loading, setLoading] = useState(mode !== "create");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [currentCheckId, setCurrentCheckId] = useState<number | string | null>(initialData?.id ?? null);
  const [status, setStatus] = useState(initialData?.status || "PENDING");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [formData, setFormData] = useState({
    type: initialData?.type || "PERIODIC",
    branchId: initialData?.branchId?.toString() || "",
    code: initialData?.code || code || (mode === "create" ? generatePKKCode() : "---"),
    checkDate: initialData?.checkDate || new Date().toISOString().split("T")[0],
    checkedBy: initialData?.checkedBy || "",
    createdByName: initialData?.createdByName || user?.fullName || "Admin",
    note: initialData?.note || "",
  });

  const [items, setItems] = useState<CheckItem[]>((initialData?.details || []).map(mapItem));

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
      setEmployees(list);
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
    const exists = items.find((item) => String(item.productVariantId) === String(variant.id));
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
        minThreshold: toNumber(variant.minThreshold ?? variant.minStock ?? variant.reorderPoint ?? 10, 10),
        reason: "",
        batchNumber: variant.batchNumber || "N/A",
        importPrice: toNumber(variant.importPrice ?? 0),
      },
      ...prev,
    ]);
    setSearchTerm("");
    setSearchResults([]);
  };

  const updateItem = (index: number, field: keyof CheckItem, value: string) => {
    setItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        if (field === "systemQuantity" || field === "quantityReal" || field === "quantityRejected" || field === "minThreshold") {
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
      branches.find((branch) => String(branch.id) === String(formData.branchId))?.name ||
      "ARGISHRIMP CHI NHANH CAN THO",
    [branches, formData.branchId],
  );

  const checkedByNames = useMemo<string[]>(
    () => formData.checkedBy.split(", ").filter((name: string) => Boolean(name)),
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
    ws["!cols"] = [{ wch: 8 }, { wch: 18 }, { wch: 42 }, { wch: 15 }, { wch: 15 }];

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
      toast.success(payload.id ? "Cap nhat phieu kiem ke thanh cong" : "Tao phieu kiem ke thanh cong");
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
    <div className="min-h-screen bg-[#f6f8fb] pb-20">
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-6 py-3 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => router.push("/admin/inventory-checks")}>
              <ChevronLeft size={18} />
            </Button>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600">Inventory Check</p>
              <h1 className="text-lg font-black text-slate-900">
                {mode === "create"
                  ? "Tao phieu kiem ke kho"
                  : mode === "edit"
                    ? `Chinh sua phieu ${formData.code}`
                    : `Chi tiet phieu ${formData.code}`}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="h-9 rounded-full border-slate-200 px-4 text-[11px] font-black uppercase" onClick={handleExportExcel}>
              <FileSpreadsheet size={14} className="mr-2" />
              Xuat Excel
            </Button>

            {mode === "view" && status === "PENDING" && hasPermission(P.CHECK_UPDATE) && (
              <Button
                variant="outline"
                className="h-9 rounded-full border-amber-200 px-4 text-[11px] font-black uppercase text-amber-700"
                onClick={() => router.push(`/admin/inventory-checks/${formData.code}?edit=true`)}
              >
                <Pencil size={14} className="mr-2" />
                Sua phieu
              </Button>
            )}

            {mode === "view" && status === "PENDING" && hasPermission(P.CHECK_APPROVE) && (
              <Button className="h-9 rounded-full bg-emerald-600 px-4 text-[11px] font-black uppercase text-white hover:bg-emerald-700" disabled={isSubmitting} onClick={handleComplete}>
                {isSubmitting ? <Loader2 size={14} className="mr-2 animate-spin" /> : <CheckCircle2 size={14} className="mr-2" />}
                Chot phieu
              </Button>
            )}

            {mode !== "view" && (
              <Button className="h-9 rounded-full bg-slate-900 px-4 text-[11px] font-black uppercase text-white hover:bg-slate-800" disabled={isSubmitting} onClick={handleSubmit}>
                {isSubmitting ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Save size={14} className="mr-2" />}
                Luu phieu
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] space-y-6 px-6 py-6">
        <div className="grid gap-4 xl:grid-cols-[1.25fr,0.75fr]">
          <Card className="overflow-hidden border-none shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-900 px-5 py-4 text-white">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={18} />
                <h2 className="text-sm font-black uppercase tracking-[0.2em]">Thong tin kiem ke</h2>
              </div>
              <p className="mt-2 text-sm text-white/75">
                Kiem tra hang hoa hu hai, doi chieu ton kha dung va xac dinh san pham can nhap bo sung.
              </p>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wide text-slate-500">Loai kiem ke</Label>
                <Select disabled={mode === "view"} value={formData.type} onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}>
                  <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERIODIC">Dinh ky</SelectItem>
                    <SelectItem value="UNEXPECTED">Dot xuat</SelectItem>
                    <SelectItem value="YEAR_END">Cuoi nam</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wide text-slate-500">Kho kiem ke</Label>
                <Select disabled={mode !== "create"} value={formData.branchId} onValueChange={(value) => setFormData((prev) => ({ ...prev, branchId: value }))}>
                  <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2 truncate">
                      <Building2 size={14} className="text-slate-400" />
                      <SelectValue placeholder="Chon kho kiem ke" />
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
                <Label className="text-[11px] font-black uppercase tracking-wide text-slate-500">So chung tu</Label>
                <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm font-black text-slate-700">
                  <Hash size={14} className="mr-2 text-slate-400" />
                  {formData.code}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wide text-slate-500">Ngay kiem ke</Label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <Input type="date" disabled={mode === "view"} className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-10" value={formData.checkDate} onChange={(e) => setFormData((prev) => ({ ...prev, checkDate: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wide text-slate-500">Nguoi kiem ke</Label>
                <Select
                  disabled={mode === "view"}
                  value=""
                  onValueChange={(value) => {
                    const employee = employees.find((item) => item.fullName === value || item.username === value);
                    const name = employee?.fullName || value;
                    if (checkedByNames.includes(name)) return;
                    setFormData((prev) => ({
                      ...prev,
                      checkedBy: prev.checkedBy ? `${prev.checkedBy}, ${name}` : name,
                    }));
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50">
                    <SelectValue placeholder="Them nguoi kiem ke" />
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
                <Label className="text-[11px] font-black uppercase tracking-wide text-slate-500">Nguoi tao</Label>
                <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-700">
                  <User size={14} className="mr-2 text-slate-400" />
                  {formData.createdByName}
                </div>
              </div>
            </div>

            <div className="px-5 pb-5">
              {checkedByNames.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {checkedByNames.map((name) => (
                    <Badge key={name} className="gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-700">
                      {name}
                      {mode !== "view" && (
                        <X
                          size={12}
                          className="cursor-pointer text-slate-400 hover:text-rose-500"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              checkedBy: checkedByNames.filter((item) => item !== name).join(", "),
                            }))
                          }
                        />
                      )}
                    </Badge>
                  ))}
                </div>
              )}

              <Label className="text-[11px] font-black uppercase tracking-wide text-slate-500">Ghi chu phieu</Label>
              <Input
                disabled={mode === "view"}
                className="mt-1 h-11 rounded-xl border-slate-200 bg-slate-50"
                placeholder="Mo ta dot kiem ke, hang hu hai hoac luu y xu ly ton kho..."
                value={formData.note}
                onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
              />
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <Card className="border-none bg-white p-5 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Tong quan kiem ke</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                  <p className="text-[11px] font-black uppercase text-blue-700">Ton he thong</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{formatNumber(summary.systemQty)}</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                  <p className="text-[11px] font-black uppercase text-emerald-700">Ton kha dung sau kiem</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{formatNumber(summary.usableQty)}</p>
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
                  <p className="text-[11px] font-black uppercase text-rose-700">Don vi hu hai</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{formatNumber(summary.rejectedQty)}</p>
                  <p className="mt-1 text-xs text-slate-500">{summary.damagedLines} dong co hu hai</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
                  <p className="text-[11px] font-black uppercase text-amber-700">Can nhap them</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{formatNumber(summary.suggestedImport)}</p>
                  <p className="mt-1 text-xs text-slate-500">{summary.replenishmentLines} dong duoi dinh muc</p>
                </div>
              </div>
            </Card>

            <Card className="border-none bg-white p-5 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Ket luan nhanh</p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <ShieldAlert size={18} className="mt-0.5 text-rose-500" />
                  <div>
                    <p className="font-black text-slate-800">Uu tien xu ly hang hu hai</p>
                    <p>{summary.damagedLines > 0 ? `Co ${summary.damagedLines} mat hang can cap nhat hao hut/hu hai.` : "Hien chua co dong nao ghi nhan hu hai."}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <AlertTriangle size={18} className="mt-0.5 text-amber-500" />
                  <div>
                    <p className="font-black text-slate-800">De xuat nhap bo sung</p>
                    <p>{summary.replenishmentLines > 0 ? `Co ${summary.replenishmentLines} mat hang dang duoi dinh muc va co the xuat Excel ngay.` : "Ton kha dung dang dap ung dinh muc toi thieu."}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Card className="overflow-hidden border-none bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600">Kiem ke chi tiet</p>
                <h2 className="mt-1 text-lg font-black text-slate-900">Theo doi hang hoa, hu hai va nhu cau nhap them</h2>
              </div>

              {mode !== "view" && (
                <div className="relative w-full max-w-2xl">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-11 pr-10 text-sm"
                    placeholder="Tim SKU hoac ten san pham de them vao phieu kiem ke..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-slate-400" size={16} />}

                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                      <div className="max-h-[360px] overflow-y-auto">
                        {searchResults.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            className="flex w-full items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-emerald-50"
                            onClick={() => addItem(product)}
                          >
                            <div>
                              <p className="text-sm font-black text-slate-900">{product.productName || product.name}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                SKU: {product.sku} | Ton hien tai: {formatNumber(toNumber(product.quantity))}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {toNumber(product.quantity) <= toNumber(product.minThreshold ?? product.minStock ?? 10, 10) && (
                                <Badge className="rounded-full bg-amber-50 text-[10px] text-amber-700">Sap het hang</Badge>
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
              <TableHeader className="bg-slate-50">
                <TableRow className="border-slate-100">
                  <TableHead className="w-14 text-center text-[11px] font-black uppercase text-slate-500">STT</TableHead>
                  <TableHead className="w-[150px] text-[11px] font-black uppercase text-slate-500">SKU</TableHead>
                  <TableHead className="min-w-[260px] text-[11px] font-black uppercase text-slate-500">Ten san pham</TableHead>
                  <TableHead className="text-center text-[11px] font-black uppercase text-slate-500">DVT</TableHead>
                  <TableHead className="text-right text-[11px] font-black uppercase text-slate-500">Ton he thong</TableHead>
                  <TableHead className="text-right text-[11px] font-black uppercase text-slate-500">Dem thuc te</TableHead>
                  <TableHead className="text-right text-[11px] font-black uppercase text-slate-500">Hu hai</TableHead>
                  <TableHead className="text-right text-[11px] font-black uppercase text-slate-500">Kha dung</TableHead>
                  <TableHead className="text-right text-[11px] font-black uppercase text-slate-500">Dinh muc</TableHead>
                  <TableHead className="text-right text-[11px] font-black uppercase text-slate-500">Can nhap them</TableHead>
                  <TableHead className="text-center text-[11px] font-black uppercase text-slate-500">Ket luan</TableHead>
                  <TableHead className="min-w-[220px] text-[11px] font-black uppercase text-slate-500">Ghi chu</TableHead>
                  {mode !== "view" && <TableHead className="w-16" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={mode === "view" ? 12 : 13} className="h-44 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <Boxes size={40} className="opacity-40" />
                        <div>
                          <p className="text-sm font-black uppercase tracking-[0.2em]">Chua co san pham kiem ke</p>
                          <p className="mt-1 text-sm">Them san pham de theo doi hang hu hai va de xuat nhap kho.</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => {
                    const metrics = getItemMetrics(item);
                    const badge = getItemBadge(item);
                    return (
                      <TableRow key={`${item.productVariantId}-${index}`} className="border-slate-100">
                        <TableCell className="text-center text-sm font-bold text-slate-500">{index + 1}</TableCell>
                        <TableCell className="font-mono text-sm font-bold uppercase text-slate-700">{item.sku}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-black text-slate-900">{item.name}</p>
                            {metrics.diffQty !== 0 && (
                              <p className={cn("mt-1 text-xs font-semibold", metrics.diffQty < 0 ? "text-rose-600" : "text-blue-600")}>
                                Chenh lech {metrics.diffQty > 0 ? `+${metrics.diffQty}` : metrics.diffQty}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm font-semibold text-slate-600">{item.unit}</TableCell>
                        <TableCell className="text-right text-sm font-black text-slate-800">{formatNumber(metrics.systemQty)}</TableCell>
                        <TableCell className="text-right">
                          <Input type="number" disabled={mode === "view"} className="ml-auto h-9 w-24 rounded-xl border-emerald-200 bg-emerald-50 text-right font-black text-emerald-700" value={item.quantityReal} onChange={(e) => updateItem(index, "quantityReal", e.target.value)} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input type="number" disabled={mode === "view"} className="ml-auto h-9 w-24 rounded-xl border-rose-200 bg-rose-50 text-right font-black text-rose-700" value={item.quantityRejected} onChange={(e) => updateItem(index, "quantityRejected", e.target.value)} />
                        </TableCell>
                        <TableCell className="text-right text-sm font-black text-emerald-700">{formatNumber(metrics.usableQty)}</TableCell>
                        <TableCell className="text-right">
                          <Input type="number" disabled={mode === "view"} className="ml-auto h-9 w-24 rounded-xl border-amber-200 bg-amber-50 text-right font-black text-amber-700" value={item.minThreshold} onChange={(e) => updateItem(index, "minThreshold", e.target.value)} />
                        </TableCell>
                        <TableCell className="text-right text-sm font-black text-amber-700">{formatNumber(metrics.suggestedImport)}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn("rounded-full border px-2 py-1 text-[10px] font-black uppercase", badge.className)}>
                            {badge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Input disabled={mode === "view"} className="h-9 rounded-xl border-slate-200 bg-slate-50 text-sm" placeholder="Ghi ro nguyen nhan hu hai hoac chenh lech..." value={item.reason} onChange={(e) => updateItem(index, "reason", e.target.value)} />
                        </TableCell>
                        {mode !== "view" && (
                          <TableCell className="text-right">
                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => removeItem(index)}>
                              <Trash2 size={16} />
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
