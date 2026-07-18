"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ClipboardCheck,
  Download,
  Edit,
  FileSpreadsheet,
  Loader2,
  Plus,
  Search,
  Trash2,
  UploadCloud,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import { P } from "@/lib/permissions";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";
import { ProductService } from "@/app/services/product.service";
import type { AiDiseaseKnowledge, AiKnowledgeCategory, AiKnowledgeImportPreview, AiKeywordAnswerSet } from "@/app/types/ai-knowledge.types";
import type { ProductListItem } from "@/app/types/product.schema";

const PAGE_SIZE = 20;

const STATUS_META: Record<string, { label: string; className: string }> = {
  APPROVED: { label: "Đã duyệt", className: "border-emerald-100 bg-emerald-50 text-emerald-600" },
  IN_REVIEW: { label: "Chờ duyệt", className: "border-amber-100 bg-amber-50 text-amber-600" },
  DRAFT: { label: "Nháp / bị từ chối", className: "border-slate-200 bg-slate-100 text-slate-500" },
  DISABLED: { label: "Đã tắt", className: "border-rose-100 bg-rose-50 text-rose-600" },
};

export default function AgronomistDiseasesPage() {
  return (
    <PermissionGuard anyOf={[P.AI_KNOWLEDGE_VIEW, P.AI_KNOWLEDGE_CREATE, P.AI_KNOWLEDGE_UPDATE, P.AI_IMPORT_KNOWLEDGE]}>
      <AgronomistDiseasesContent />
    </PermissionGuard>
  );
}

function AgronomistDiseasesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();
  const canImportKnowledge = hasPermission(P.AI_IMPORT_KNOWLEDGE);

  const [diseases, setDiseases] = useState<AiDiseaseKnowledge[]>([]);
  const [categories, setCategories] = useState<AiKnowledgeCategory[]>([]);
  const [keywordSets, setKeywordSets] = useState<AiKeywordAnswerSet[]>([]);
  const [activeProducts, setActiveProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [page, setPage] = useState(0);

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"OVERWRITE" | "UPSERT_NEW">("OVERWRITE");
  const [preview, setPreview] = useState<AiKnowledgeImportPreview | null>(null);

  const resetImportState = () => {
    setFile(null);
    setMode("OVERWRITE");
    setPreview(null);
  };

  const handleImportDialogChange = (open: boolean) => {
    setIsImportOpen(open);
    if (!open) {
      resetImportState();
      if (searchParams.get("panel") === "import") {
        router.replace("/agronomist/diseases", { scroll: false });
      }
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [diseasesResult, categoriesResult, keywordSetsResult, productsResult] = await Promise.allSettled([
        aiKnowledgeService.getDiseases(),
        aiKnowledgeService.getCategories(),
        aiKnowledgeService.getKeywordSets(),
        ProductService.getAll({ status: "ACTIVE" }),
      ]);

      let hasOverviewError = false;

      if (diseasesResult.status === "fulfilled") {
        setDiseases(diseasesResult.value);
      } else {
        toast.error("Không thể tải danh sách phác đồ");
      }

      if (categoriesResult.status === "fulfilled") {
        setCategories(categoriesResult.value);
      } else {
        hasOverviewError = true;
      }

      if (keywordSetsResult.status === "fulfilled") {
        setKeywordSets(keywordSetsResult.value);
      } else {
        hasOverviewError = true;
      }

      if (productsResult.status === "fulfilled") {
        setActiveProducts(productsResult.value);
      } else {
        hasOverviewError = true;
      }

      if (hasOverviewError) {
        toast.error("Không thể tải một phần dữ liệu tổng quan.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [keyword, statusFilter]);

  useEffect(() => {
    if (searchParams.get("panel") === "import" && canImportKnowledge) {
      setIsImportOpen(true);
    }
  }, [canImportKnowledge, searchParams]);

  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!file) {
        throw new Error("Vui lòng chọn file Excel trước.");
      }
      return aiKnowledgeService.previewImport(file, mode);
    },
    onSuccess: (data) => {
      setPreview(data);
      toast.success("Đã đọc file và tạo preview.");
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error, "Không thể preview file.")),
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!preview) {
        throw new Error("Chưa có preview để áp dụng.");
      }
      return aiKnowledgeService.applyImport(preview);
    },
    onSuccess: async (data) => {
      setPreview(data);
      toast.success("Đã nạp tri thức vào hàng chờ duyệt.");
      await loadData();
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error, "Không thể áp dụng import.")),
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await aiKnowledgeService.deleteDisease(deleteId);
      toast.success("Đã xóa phác đồ");
      await loadData();
    } catch {
      toast.error("Xóa phác đồ thất bại");
    } finally {
      setDeleteId(null);
    }
  };

  const normalizedKeyword = keyword.trim().toLowerCase();
  const filtered = diseases
    .filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!normalizedKeyword) return true;
      return [item.nameVi, item.nameEn, item.code].some((value) =>
        String(value ?? "").toLowerCase().includes(normalizedKeyword),
      );
    })
    .sort((left, right) => right.priority - left.priority || left.nameVi.localeCompare(right.nameVi));

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const pendingCount = diseases.filter((item) => item.status === "IN_REVIEW").length;
  const approvedCount = diseases.filter((item) => item.status === "APPROVED").length;
  const overviewCards = [
    { label: "Danh mục", value: categories.length },
    { label: "Tri thức bệnh", value: diseases.length },
    { label: "Bộ từ khóa (tự động)", value: keywordSets.length },
    { label: "Sản phẩm hoạt động", value: activeProducts.length },
    { label: "Đang chờ Admin duyệt", value: pendingCount, accent: "text-amber-600" },
    { label: "Đã được duyệt (AI đang dùng)", value: approvedCount, accent: "text-emerald-600" },
  ];

  return (
    <div className="space-y-5">
      <div className="mt-2 space-y-5 px-1">
        <div className="space-y-2">
          <h1 className="text-[20px] font-semibold uppercase tracking-tight text-slate-900">
            Phác đồ điều trị
          </h1>
          <p className="text-[13px] leading-6 text-slate-500">
            Quản lý toàn bộ tri thức bệnh, theo dõi số lượng phác đồ đang dùng và nạp dữ liệu Excel ngay tại một nơi.
          </p>
        </div>

        <section className="grid gap-4 xl:grid-cols-4">
          {overviewCards.slice(0, 4).map((card) => (
            <StatCard key={card.label} label={card.label} value={card.value} accent={card.accent} />
          ))}
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {overviewCards.slice(4).map((card) => (
            <StatCard key={card.label} label={card.label} value={card.value} accent={card.accent} />
          ))}
        </section>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
            <div className="relative w-full lg:max-w-[360px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm mã bệnh, tên bệnh..."
                className="h-[38px] rounded-md border-slate-200 bg-white pl-10 text-[13px] shadow-none focus-visible:ring-blue-500/20"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-[38px] w-full rounded-md border-slate-200 bg-white text-[13px] font-medium text-slate-600 shadow-none focus:ring-0 lg:w-[200px]">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[13px]">Tất cả trạng thái</SelectItem>
                <SelectItem value="IN_REVIEW" className="text-[13px]">Chờ duyệt</SelectItem>
                <SelectItem value="APPROVED" className="text-[13px]">Đã duyệt</SelectItem>
                <SelectItem value="DRAFT" className="text-[13px]">Nháp / bị từ chối</SelectItem>
                <SelectItem value="DISABLED" className="text-[13px]">Đã tắt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {canImportKnowledge ? (
              <>
                <a
                  href={aiKnowledgeService.getTemplateDownloadUrl()}
                  className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-[4px] border border-blue-100 bg-blue-50 px-4 text-[13px] font-medium text-blue-700 shadow-sm transition-colors hover:bg-blue-100"
                >
                  <Download size={15} />
                  Tải file mẫu
                </a>
                <Button
                  type="button"
                  onClick={() => setIsImportOpen(true)}
                  className="h-[38px] rounded-[4px] border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <FileSpreadsheet size={15} className="mr-1.5" />
                  Import Excel
                </Button>
              </>
            ) : null}
            <Link href="/agronomist/diseases/new">
              <Button className="h-[38px] rounded-[4px] bg-blue-600 px-4 text-[13px] font-medium text-white shadow-sm hover:bg-blue-700">
                <Plus size={15} className="mr-1.5" />
                Thêm phác đồ
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="table-custom min-w-[900px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#ccc] bg-[#f0f0f0]">
                <th className="w-[56px] px-4 py-3 text-[10px] font-semibold text-[#1f1f1f]">STT</th>
                <th className="px-2 py-3 text-[10px] font-semibold text-[#1f1f1f]">Bệnh / Danh mục</th>
                <th className="px-2 py-3 text-[10px] font-semibold text-[#1f1f1f]">Dấu hiệu</th>
                <th className="w-[130px] px-2 py-3 text-center text-[10px] font-semibold text-[#1f1f1f]">Trạng thái</th>
                <th className="w-[104px] px-4 py-3 text-right text-[10px] font-semibold text-[#1f1f1f]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#eee]">
                    <td className="px-4 py-3"><div className="h-3.5 w-6 animate-pulse rounded bg-slate-100" /></td>
                    <td className="px-2 py-3"><div className="h-3.5 w-40 animate-pulse rounded bg-slate-100" /></td>
                    <td className="px-2 py-3"><div className="h-3.5 w-56 animate-pulse rounded bg-slate-100" /></td>
                    <td className="px-2 py-3"><div className="mx-auto h-6 w-20 animate-pulse rounded bg-slate-100" /></td>
                    <td className="px-4 py-3" />
                  </tr>
                ))
              ) : paginated.length > 0 ? (
                paginated.map((item, index) => (
                  <tr key={item.id} className="border-b border-[#eee] transition-colors hover:bg-[#f0f8ff]">
                    <td className="px-4 py-3 text-[11px] font-medium text-slate-500">
                      {page * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-2 py-3">
                      <p className="text-[11px] font-semibold text-slate-800">
                        {item.nameVi} <span className="font-normal text-slate-400">({item.code})</span>
                      </p>
                      {item.category && (
                        <span className="mt-1 block text-[10px] font-medium text-slate-500">
                          {item.category.name}
                        </span>
                      )}
                    </td>
                    <td className="max-w-[360px] truncate px-2 py-3 text-[11px] text-slate-500">
                      {item.signsSummary}
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span className={cn(
                        "inline-flex min-w-[90px] items-center justify-center rounded-[4px] border px-2 py-1 text-[10px] font-semibold",
                        STATUS_META[item.status]?.className ?? STATUS_META.DRAFT.className,
                      )}>
                        {STATUS_META[item.status]?.label ?? item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/agronomist/diseases/${item.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Chỉnh sửa"
                            className="h-7 w-7 rounded-[4px] text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit size={14} />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Xóa"
                          className="h-7 w-7 rounded-[4px] text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="h-[180px] text-center text-[12px] font-medium text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <ClipboardCheck size={20} className="text-slate-300" />
                      {normalizedKeyword ? "Không tìm thấy phác đồ phù hợp." : "Chưa có phác đồ nào."}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex min-w-full shrink-0 items-center justify-between border-t border-slate-100 bg-[#f8f9fa] px-5 py-3">
          <p className="text-[12px] font-semibold text-slate-500">Tổng số: {total} phác đồ</p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              disabled={page === 0 || loading}
              onClick={() => setPage((current) => current - 1)}
              className="h-7 px-3 text-[11px] font-bold uppercase text-slate-400 hover:bg-slate-100"
            >
              Trước
            </Button>
            <span className="rounded-full bg-slate-100 px-4 py-1.5 text-[12px] font-bold text-slate-700">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="ghost"
              disabled={page + 1 >= totalPages || loading}
              onClick={() => setPage((current) => current + 1)}
              className="h-7 px-3 text-[11px] font-bold uppercase text-slate-400 hover:bg-slate-100"
            >
              Sau
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isImportOpen} onOpenChange={handleImportDialogChange}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto rounded-[6px] border border-slate-200 bg-white p-0 shadow-xl">
          <DialogHeader className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-blue-50">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Excel Knowledge Import
                </p>
                <DialogTitle className="mt-2 text-left text-2xl font-bold text-slate-900">
                  Nạp tri thức hàng loạt bằng Excel
                </DialogTitle>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                  File mới sẽ vào trạng thái <strong>IN_REVIEW</strong>, không tự publish. Bạn có thể import theo chế độ
                  ghi đè hoặc chỉ bổ sung bản ghi chưa tồn tại.
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 px-6 py-6">
            <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
              <div className="rounded-[4px] border border-dashed border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold text-slate-900">Chọn file Excel</p>
                <p className="mt-1 text-sm text-slate-500">Một sheet `knowledge` với các cột theo file mẫu.</p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  className="mt-4 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                />
                {file ? (
                  <div className="mt-4 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    {file.name}
                  </div>
                ) : null}
              </div>

              <div className="rounded-[4px] border border-slate-200 bg-white p-5">
                <p className="text-sm font-bold text-slate-900">Chế độ import</p>
                <select
                  value={mode}
                  onChange={(event) => setMode(event.target.value as "OVERWRITE" | "UPSERT_NEW")}
                  className="mt-4 h-[38px] w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none"
                >
                  <option value="OVERWRITE">Ghi đè theo mã duy nhất</option>
                  <option value="UPSERT_NEW">Chỉ bổ sung nếu chưa tồn tại</option>
                </select>

                <div className="mt-5 grid gap-3">
                  <button onClick={() => previewMutation.mutate()} className={primaryButtonClassName}>
                    {previewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                    Preview file
                  </button>
                  <button
                    onClick={() => applyMutation.mutate()}
                    disabled={!preview}
                    className={secondaryButtonClassName}
                  >
                    {applyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                    Áp dụng import
                  </button>
                  <a
                    href={aiKnowledgeService.getTemplateDownloadUrl()}
                    className={downloadButtonClassName}
                  >
                    <Download className="h-4 w-4" />
                    Tải file mẫu
                  </a>
                </div>
              </div>
            </div>

            {preview ? (
              <section className="rounded-[4px] border border-slate-200 bg-white shadow-sm">
                <div className="grid gap-4 border-b border-slate-200 p-6 md:grid-cols-4">
                  <Stat label="Tổng dòng" value={preview.totalRows} />
                  <Stat label="Hợp lệ" value={preview.validRows} />
                  <Stat label="Lỗi" value={preview.invalidRows} />
                  <Stat label="Mode" value={preview.mode} />
                </div>

                <div className="overflow-x-auto">
                  <div className="grid min-w-[900px] grid-cols-[100px,120px,180px,1fr,1fr] bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    <div>Dòng</div>
                    <div>Loại</div>
                    <div>Mã</div>
                    <div>Tên</div>
                    <div>Trạng thái</div>
                  </div>
                  {preview.rows.map((row) => (
                    <div
                      key={`${row.rowNumber}-${row.code}`}
                      className="grid min-w-[900px] grid-cols-[100px,120px,180px,1fr,1fr] items-start gap-3 border-t border-slate-200 px-4 py-4 text-sm"
                    >
                      <div className="font-semibold text-slate-700">#{row.rowNumber}</div>
                      <div>{row.type}</div>
                      <div>{row.code}</div>
                      <div>
                        <p className="font-semibold text-slate-900">{row.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{row.categoryName}</p>
                      </div>
                      <div>
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em]",
                            row.valid ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
                          )}
                        >
                          {row.valid ? "VALID" : "ERROR"}
                        </span>
                        {row.errors.length > 0 ? (
                          <ul className="mt-2 space-y-1 text-xs text-rose-600">
                            {row.errors.map((error) => (
                              <li key={error}>{error}</li>
                            ))}
                          </ul>
                        ) : null}
                        {row.warnings.length > 0 ? (
                          <ul className="mt-2 space-y-1 text-xs text-amber-600">
                            {row.warnings.map((warning) => (
                              <li key={warning}>{warning}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-[6px] border border-slate-200 bg-white shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px] font-bold text-rose-600">Xác nhận xóa phác đồ</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] font-medium text-slate-500">
              Phác đồ sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 rounded-[4px] text-[13px] font-medium">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="h-9 rounded-[4px] bg-rose-600 text-[13px] font-medium text-white hover:bg-rose-700"
            >
              Đồng ý xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className={`mt-3 text-[22px] font-bold ${accent ?? "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-3 text-[22px] font-bold text-slate-900">{value}</p>
    </div>
  );
}

const primaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700";
const secondaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";
const downloadButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100";

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
}
