"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Edit,
  FileSpreadsheet,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { RichTextEditor } from "@/components/admin/shared/RichTextEditor";
import {
  AgronomistPageHeader,
  AgronomistPagination,
  AgronomistPanel,
  AgronomistStatCard,
  AgronomistStatGrid,
  AgronomistStatusPill,
  AgronomistToolbar,
  agronomistInputClassName,
  agronomistOutlineButtonClassName,
  agronomistPrimaryButtonClassName,
  agronomistTableCellClassName,
  agronomistTableHeadClassName,
} from "@/components/agronomist/agronomist-ui";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { P } from "@/lib/permissions";
import { usePermissions } from "@/hooks/usePermissions";
import type {
  AiKeywordAnswerSet,
  AiKnowledgeCategory,
  AiKnowledgeStatus,
} from "@/app/types/ai-knowledge.types";

const PAGE_SIZE = 10;
const CATEGORY_ALL = "all";
const CATEGORY_NONE = "none";

type KeywordFormState = {
  id: number | null;
  code: string;
  name: string;
  categoryId: string;
  keywords: string[];
  keywordDraft: string;
  answerHtml: string;
  enabled: boolean;
  status: AiKnowledgeStatus;
  matchThreshold: number;
  priority: number;
  canonical: boolean;
};

const emptyForm: KeywordFormState = {
  id: null,
  code: "",
  name: "",
  categoryId: CATEGORY_NONE,
  keywords: [],
  keywordDraft: "",
  answerHtml: "",
  enabled: true,
  status: "APPROVED",
  matchThreshold: 0.35,
  priority: 0,
  canonical: false,
};

export default function AgronomistKeywordPage() {
  return (
    <PermissionGuard
      anyOf={[
        P.AI_KNOWLEDGE_VIEW,
        P.AI_KNOWLEDGE_CREATE,
        P.AI_KNOWLEDGE_UPDATE,
        P.AI_IMPORT_KNOWLEDGE,
      ]}
    >
      <AgronomistKeywordContent />
    </PermissionGuard>
  );
}

function AgronomistKeywordContent() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(P.AI_KNOWLEDGE_CREATE);
  const canUpdate = hasPermission(P.AI_KNOWLEDGE_UPDATE);
  const canImport = hasPermission(P.AI_IMPORT_KNOWLEDGE);

  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(CATEGORY_ALL);
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<KeywordFormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<AiKeywordAnswerSet | null>(
    null,
  );

  const categoriesQuery = useQuery({
    queryKey: ["ai-knowledge", "categories"],
    queryFn: () => aiKnowledgeService.getCategories(),
  });

  const keywordSetsQuery = useQuery({
    queryKey: ["ai-knowledge", "keyword-sets"],
    queryFn: () => aiKnowledgeService.getKeywordSets(),
  });

  const reviewCasesQuery = useQuery({
    queryKey: ["ai-knowledge", "review-cases"],
    queryFn: () => aiKnowledgeService.getReviewCases(),
  });

  const categories = categoriesQuery.data ?? [];
  const keywordSets = keywordSetsQuery.data ?? [];
  const reviewCases = reviewCasesQuery.data ?? [];

  const stats = useMemo(() => {
    const unanswered7Days = reviewCases.filter((item) => {
      const statusOpen = item.status === "NEW" || item.status === "IN_PROGRESS";
      return statusOpen && isWithinDays(item.createdAt, 7);
    }).length;

    const duplicateMap = reviewCases.reduce<Record<string, number>>(
      (acc, item) => {
        const key = normalizeText(item.questionText || "");
        if (!key) return acc;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      },
      {},
    );
    const mostRepeated = Math.max(0, ...Object.values(duplicateMap));
    const answered = reviewCases.filter(
      (item) => item.status === "RESOLVED",
    ).length;
    const replyRate =
      reviewCases.length === 0
        ? 100
        : Math.round((answered / reviewCases.length) * 100);

    return { unanswered7Days, mostRepeated, replyRate };
  }, [reviewCases]);

  const filteredKeywordSets = useMemo(() => {
    const normalizedKeyword = normalizeText(keyword);
    return keywordSets
      .filter((item) => {
        if (categoryFilter !== CATEGORY_ALL) {
          const currentCategory = item.category?.id
            ? String(item.category.id)
            : CATEGORY_NONE;
          if (currentCategory !== categoryFilter) return false;
        }
        if (!normalizedKeyword) return true;
        return [
          item.name,
          item.code,
          item.keywordsRaw,
          stripHtml(item.answerHtml),
          item.category?.name,
        ].some((value) =>
          normalizeText(value || "").includes(normalizedKeyword),
        );
      })
      .sort(
        (left, right) =>
          (right.priority ?? 0) - (left.priority ?? 0) ||
          left.name.localeCompare(right.name),
      );
  }, [categoryFilter, keyword, keywordSets]);

  const total = filteredKeywordSets.length;
  const paginated = filteredKeywordSets.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(0);
  }, [categoryFilter, keyword]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (page > totalPages - 1) {
      setPage(totalPages - 1);
    }
  }, [page, total]);

  const invalidateKeywordSets = () =>
    queryClient.invalidateQueries({
      queryKey: ["ai-knowledge", "keyword-sets"],
    });

  const saveMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number | null;
      payload: ReturnType<typeof buildKeywordPayload>;
    }) => {
      if (id) {
        return aiKnowledgeService.updateKeywordSet(id, payload);
      }
      return aiKnowledgeService.createKeywordSet(payload);
    },
    onSuccess: async (_data, variables) => {
      toast.success(
        variables.id ? "Đã cập nhật bộ từ khóa." : "Đã thêm bộ từ khóa.",
      );
      setDialogOpen(false);
      setForm(emptyForm);
      await invalidateKeywordSets();
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error) || "Không thể lưu bộ từ khóa."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => aiKnowledgeService.deleteKeywordSet(id),
    onSuccess: async () => {
      toast.success("Đã xóa bộ từ khóa.");
      setDeleteTarget(null);
      await invalidateKeywordSets();
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error) || "Không thể xóa bộ từ khóa."),
  });

  const openCreate = () => {
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item: AiKeywordAnswerSet) => {
    setForm({
      id: item.id,
      code: item.code,
      name: item.name,
      categoryId: item.category?.id ? String(item.category.id) : CATEGORY_NONE,
      keywords: splitKeywords(item.keywordsRaw),
      keywordDraft: "",
      answerHtml: item.answerHtml,
      enabled: Boolean(item.enabled),
      status: item.status,
      matchThreshold: item.matchThreshold ?? 0.35,
      priority: item.priority ?? 0,
      canonical: Boolean(item.canonical),
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const finalizedForm = finalizeKeywordDraft(form);
    const payload = buildKeywordPayload(finalizedForm);
    if (!payload.keywordsRaw) {
      toast.error("Vui lòng nhập ít nhất một từ khóa.");
      return;
    }
    if (!payload.answerHtml || stripHtml(payload.answerHtml).length === 0) {
      toast.error("Vui lòng nhập câu trả lời.");
      return;
    }
    setForm(finalizedForm);
    saveMutation.mutate({ id: finalizedForm.id, payload });
  };

  const loading = keywordSetsQuery.isLoading || categoriesQuery.isLoading;

  return (
    <div className="space-y-5">
      <AgronomistPageHeader
        title="Quản lý tri thức chatbot"
        actions={
          <>
            {canImport ? (
              <>
                <a
                  href={aiKnowledgeService.getTemplateDownloadUrl()}
                  className={agronomistOutlineButtonClassName}
                >
                  <Download className="h-4 w-4" />
                  Tải file mẫu
                </a>
                <Link
                  href="/agronomist/import"
                  className={agronomistOutlineButtonClassName}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Import Excel
                </Link>
              </>
            ) : null}
            {canCreate ? (
              <button
                type="button"
                onClick={openCreate}
                className={agronomistPrimaryButtonClassName}
              >
                <Plus className="h-4 w-4" />
                Thêm bộ từ khóa
              </button>
            ) : null}
          </>
        }
      />

      <AgronomistStatGrid>
        <AgronomistStatCard
          label="Tổng câu hỏi chưa trả lời (7 ngày)"
          value={stats.unanswered7Days}
        />
        <AgronomistStatCard
          label="Trùng lặp nhiều nhất"
          value={stats.mostRepeated}
        />
        <AgronomistStatCard
          label="Tỷ lệ bot trả lời"
          value={`${stats.replyRate}%`}
          valueClassName="text-[#252896]"
        />
      </AgronomistStatGrid>

      <AgronomistPanel>
        <AgronomistToolbar>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger
              className={cn(agronomistInputClassName, "w-full sm:w-[180px]")}
            >
              <SelectValue placeholder="Tất cả danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CATEGORY_ALL} className="text-[12px]">
                Tất cả danh mục
              </SelectItem>
              <SelectItem value={CATEGORY_NONE} className="text-[12px]">
                Chưa phân loại
              </SelectItem>
              {categories.map((category) => (
                <SelectItem
                  key={category.id}
                  value={String(category.id)}
                  className="text-[12px]"
                >
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative w-full sm:max-w-[360px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm từ khóa..."
              className={cn(agronomistInputClassName, "pl-9")}
            />
          </div>
        </AgronomistToolbar>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead className={agronomistTableHeadClassName}>
              <tr>
                <th className="w-[180px] px-4 py-4">Từ khóa</th>
                <th className="px-4 py-4">Câu trả lời</th>
                <th className="w-[160px] px-4 py-4">Danh mục</th>
                <th className="w-[160px] px-4 py-4 text-center">Trạng thái</th>
                <th className="w-[150px] px-4 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className="border-t border-[#e7eaf0]">
                    <td className={agronomistTableCellClassName}>
                      <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
                    </td>
                    <td className={agronomistTableCellClassName}>
                      <div className="h-4 w-80 animate-pulse rounded bg-slate-100" />
                    </td>
                    <td className={agronomistTableCellClassName}>
                      <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                    </td>
                    <td className={agronomistTableCellClassName}>
                      <div className="mx-auto h-5 w-24 animate-pulse rounded-full bg-slate-100" />
                    </td>
                    <td className={agronomistTableCellClassName} />
                  </tr>
                ))
              ) : paginated.length > 0 ? (
                paginated.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-[#e7eaf0] transition-colors hover:bg-[#f9fafc]"
                  >
                    <td className="px-4 py-4 align-top">
                      <p className="text-[12px] font-semibold text-[#232323]">
                        {item.name}
                      </p>
                      <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">
                        {item.keywordsRaw}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="line-clamp-2 max-w-[460px] text-[12px] leading-5 text-slate-600">
                        {stripHtml(item.answerHtml) || "-"}
                      </p>
                    </td>
                    <td
                      className={cn(agronomistTableCellClassName, "align-top")}
                    >
                      {item.category?.name ?? "Chưa phân loại"}
                    </td>
                    <td className="px-4 py-4 text-center align-top">
                      <KeywordStatusPill item={item} />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex justify-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!canUpdate}
                          onClick={() => openEdit(item)}
                          className="h-8 rounded-[4px] border-[#f3a340] bg-white px-3 text-[12px] font-medium text-[#e58a00] shadow-none hover:bg-orange-50"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Sửa
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!canUpdate}
                          onClick={() => setDeleteTarget(item)}
                          className="h-8 rounded-[4px] border-[#f04438] bg-white px-3 text-[12px] font-medium text-[#f04438] shadow-none hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="h-[180px] px-4 text-center text-[12px] font-medium text-slate-400"
                  >
                    Không có bộ từ khóa phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <AgronomistPagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          disabled={loading}
          onPageChange={setPage}
        />
      </AgronomistPanel>

      <KeywordSetDialog
        open={dialogOpen}
        form={form}
        categories={categories}
        saving={saveMutation.isPending}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setForm(emptyForm);
        }}
        onChange={setForm}
        onSave={handleSave}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="max-w-[420px] rounded-[4px] border border-[#dcdfe8] bg-white p-0 shadow-xl">
          <AlertDialogHeader className="border-b border-[#e8ebf1] px-6 py-5">
            <AlertDialogTitle className="text-[18px] font-semibold text-[#232323]">
              Xóa bộ từ khóa này?
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-4 text-[13px] leading-6 text-slate-500">
              Bộ từ khóa sẽ bị xóa vĩnh viễn khỏi hệ thống tri thức chatbot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteTarget ? (
            <div className="mx-6 mt-5 overflow-hidden rounded-[4px] border border-[#e8ebf1]">
              <div className="bg-[#f2f3f5] px-4 py-3 text-[11px] font-semibold uppercase text-slate-500">
                Danh sách bộ từ khóa
              </div>
              <div className="px-4 py-3 text-[13px] font-medium text-slate-700">
                {deleteTarget.name}
              </div>
            </div>
          ) : null}
          <AlertDialogFooter className="border-t border-[#e8ebf1] px-6 py-4">
            <AlertDialogCancel className="h-9 rounded-[4px] border-[#aeb5c4] px-5 text-[12px] font-medium shadow-none">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
              disabled={deleteMutation.isPending}
              className="h-9 rounded-[4px] bg-[#d2453f] px-5 text-[12px] font-semibold text-white shadow-none hover:bg-[#b93632]"
            >
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function KeywordSetDialog({
  open,
  form,
  categories,
  saving,
  onOpenChange,
  onChange,
  onSave,
}: {
  open: boolean;
  form: KeywordFormState;
  categories: AiKnowledgeCategory[];
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (form: KeywordFormState) => void;
  onSave: () => void;
}) {
  const addKeyword = () => {
    const next = form.keywordDraft
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (next.length === 0) return;
    const keywords = Array.from(new Set([...form.keywords, ...next]));
    onChange({
      ...form,
      keywords,
      keywordDraft: "",
      name: form.name || keywords[0] || "",
    });
  };

  const removeKeyword = (keyword: string) => {
    const keywords = form.keywords.filter((item) => item !== keyword);
    onChange({
      ...form,
      keywords,
      name: form.name === keyword ? keywords[0] || "" : form.name,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[95vw] max-w-[560px] gap-0 overflow-hidden rounded-[4px] border border-[#dcdfe8] bg-white p-0 shadow-xl">
        <DialogHeader className="border-b border-[#e8ebf1] px-6 py-5">
          <DialogTitle className="text-left text-[18px] font-semibold text-[#232323]">
            {form.id ? "Sửa bộ từ khóa" : "Thêm bộ từ khóa mới"}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[calc(92vh-145px)] overflow-y-auto px-6 py-5">
          {form.id ? (
            <div className="mb-5 rounded-[3px] border border-[#bcc6ff] bg-[#e4e8ff] px-4 py-3 text-[12px] leading-5 text-[#252896]">
              Thông tin được tạo từ câu hỏi chưa giải đáp của phụ huynh. Kiểm
              tra và chỉnh sửa nếu cần.
            </div>
          ) : null}

          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[12px] font-semibold text-[#232323]">
                Từ khóa <span className="text-rose-500">*</span>
              </Label>
              <div className="flex min-h-[38px] flex-wrap items-center gap-1.5 rounded-[2px] border border-[#d5d8e5] bg-white px-2 py-1.5">
                {form.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex h-6 items-center gap-1 rounded-[2px] bg-[#eef0f4] px-2 text-[12px] text-slate-700"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="text-slate-500 hover:text-slate-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  value={form.keywordDraft}
                  onChange={(event) =>
                    onChange({ ...form, keywordDraft: event.target.value })
                  }
                  onBlur={addKeyword}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === ",") {
                      event.preventDefault();
                      addKeyword();
                    }
                  }}
                  placeholder="Nhập từ khóa và nhấn Enter..."
                  className="h-6 min-w-[180px] flex-1 bg-transparent text-[12px] outline-none placeholder:text-slate-400"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Nhập nhiều từ khóa để tăng khả năng bot nhận diện đúng câu hỏi.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr,130px]">
              <div className="space-y-2">
                <Label className="text-[12px] font-semibold text-[#232323]">
                  Danh mục
                </Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(value) =>
                    onChange({ ...form, categoryId: value })
                  }
                >
                  <SelectTrigger className={agronomistInputClassName}>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CATEGORY_NONE} className="text-[12px]">
                      Chưa phân loại
                    </SelectItem>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={String(category.id)}
                        className="text-[12px]"
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[12px] font-semibold text-[#232323]">
                  Ưu tiên
                </Label>
                <Input
                  type="number"
                  value={form.priority}
                  onChange={(event) =>
                    onChange({ ...form, priority: Number(event.target.value) })
                  }
                  className={agronomistInputClassName}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-[12px] font-semibold text-[#232323]">
                  Câu trả lời <span className="text-rose-500">*</span>
                </Label>
                <button
                  type="button"
                  className="text-[12px] font-semibold text-[#252896]"
                  onClick={() =>
                    onChange({
                      ...form,
                      answerHtml: buildSuggestedAnswer(form.keywords),
                    })
                  }
                >
                  Gợi ý
                </button>
              </div>
              <RichTextEditor
                key={`${form.id ?? "new"}-${open ? "open" : "closed"}`}
                placeholder="Nhập câu trả lời của bot..."
                value={form.answerHtml}
                onChange={(value) => onChange({ ...form, answerHtml: value })}
                minHeight="130px"
              />
              <p className="text-[11px] text-slate-500">
                AI sẽ sử dụng câu trả lời này để phản hồi phụ huynh.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr,130px]">
              <label className="flex items-center justify-between gap-4 rounded-[3px] border border-[#e2e5ee] bg-white px-3 py-3">
                <span>
                  <span className="block text-[12px] font-semibold text-[#232323]">
                    Bật bộ từ khóa này
                  </span>
                  <span className="mt-1 block text-[11px] text-slate-500">
                    Bot có thể dùng câu trả lời ngay khi khớp.
                  </span>
                </span>
                <Switch
                  checked={form.enabled}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...form,
                      enabled: checked,
                      status: checked ? "APPROVED" : "DISABLED",
                    })
                  }
                  className="data-[state=checked]:bg-[#252896]"
                />
              </label>
              <div className="space-y-2">
                <Label className="text-[12px] font-semibold text-[#232323]">
                  Ngưỡng khớp
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={form.matchThreshold}
                  onChange={(event) =>
                    onChange({
                      ...form,
                      matchThreshold: Number(event.target.value),
                    })
                  }
                  className={agronomistInputClassName}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-[#e8ebf1] bg-[#f8f8f8] px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-[4px] border-[#aeb5c4] px-5 text-[12px] font-medium shadow-none"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="h-9 rounded-[4px] bg-[#252896] px-5 text-[12px] font-semibold text-white shadow-none hover:bg-[#1d2078]"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {form.id ? "Cập nhật" : "Lưu bộ từ khóa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KeywordStatusPill({ item }: { item: AiKeywordAnswerSet }) {
  if (
    !item.enabled ||
    item.status === "DISABLED" ||
    item.status === "ARCHIVED"
  ) {
    return (
      <AgronomistStatusPill tone="gray">Đã ngừng sử dụng</AgronomistStatusPill>
    );
  }
  if (item.status === "APPROVED") {
    return (
      <AgronomistStatusPill tone="blue">Đang được sử dụng</AgronomistStatusPill>
    );
  }
  if (item.status === "IN_REVIEW") {
    return (
      <AgronomistStatusPill tone="amber">Đang chờ duyệt</AgronomistStatusPill>
    );
  }
  return <AgronomistStatusPill tone="gray">Bản nháp</AgronomistStatusPill>;
}

function splitKeywords(value: string) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function finalizeKeywordDraft(form: KeywordFormState) {
  const keywords = Array.from(
    new Set([...form.keywords, ...splitKeywords(form.keywordDraft)]),
  );
  return {
    ...form,
    keywords,
    keywordDraft: "",
    name: form.name || keywords[0] || "",
  };
}

function buildKeywordPayload(form: KeywordFormState) {
  const finalizedForm = finalizeKeywordDraft(form);
  const name = finalizedForm.name || finalizedForm.keywords[0] || "";
  return {
    code: finalizedForm.code || buildCode(name),
    name,
    categoryId:
      finalizedForm.categoryId === CATEGORY_NONE
        ? undefined
        : Number(finalizedForm.categoryId),
    keywordsRaw: finalizedForm.keywords.join(", "),
    answerHtml: finalizedForm.answerHtml,
    enabled: finalizedForm.enabled,
    matchThreshold: clampNumber(finalizedForm.matchThreshold, 0, 1, 0.35),
    priority: Number.isFinite(finalizedForm.priority)
      ? finalizedForm.priority
      : 0,
    canonical: finalizedForm.canonical,
    status: finalizedForm.enabled ? finalizedForm.status : "DISABLED",
  };
}

function buildCode(value: string) {
  const base = removeVietnameseMarks(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 38);
  return `${base || "FAQ"}_${Date.now().toString(36).toUpperCase()}`;
}

function removeVietnameseMarks(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function clampNumber(
  value: number,
  min: number,
  max: number,
  fallback: number,
) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function stripHtml(value?: string | null) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value: string) {
  return removeVietnameseMarks(value).toLowerCase().trim();
}

function isWithinDays(value: string | undefined, days: number) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const daysMs = days * 24 * 60 * 60 * 1000;
  return Date.now() - date.getTime() <= daysMs;
}

function buildSuggestedAnswer(keywords: string[]) {
  const label = keywords[0] || "nội dung này";
  return `<p>Thông tin về <strong>${label}</strong> đang được kỹ sư AgriShrimp kiểm tra và cập nhật. Vui lòng liên hệ đội ngũ tư vấn nếu cần hỗ trợ chi tiết.</p>`;
}
