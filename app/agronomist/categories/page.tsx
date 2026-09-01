"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, Edit, Loader2, Plus, Search, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AgronomistPageHeader,
  AgronomistPagination,
  AgronomistPanel,
  AgronomistStatCard,
  AgronomistStatGrid,
  AgronomistStatusPill,
  AgronomistToolbar,
  agronomistInputClassName,
  agronomistPrimaryButtonClassName,
  agronomistTableHeadClassName,
  agronomistTextareaClassName,
} from "@/components/agronomist/agronomist-ui";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";
import type { AiKnowledgeCategory } from "@/app/types/ai-knowledge.types";
import { cn } from "@/lib/utils";

interface FormState {
  name: string;
  slug: string;
  description: string;
  enabled: boolean;
}

interface FormErrors {
  name?: string;
  general?: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  description: "",
  enabled: true,
};
const PAGE_SIZE = 10;

export default function AgronomistCategoriesPage() {
  const [categories, setCategories] = useState<AiKnowledgeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [slugTouched, setSlugTouched] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "enabled" | "disabled"
  >("all");
  const [currentPage, setCurrentPage] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      setCategories(await aiKnowledgeService.getCategories());
    } catch {
      toast.error("Không thể tải danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, statusFilter]);

  const resetFormState = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setEditingId(null);
    setSlugTouched(false);
  };

  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetFormState();
  };

  const openCreate = () => {
    resetFormState();
    setIsOpen(true);
  };

  const openEdit = (category: AiKnowledgeCategory) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      enabled: category.enabled,
    });
    setFormErrors({});
    setSlugTouched(true);
    setIsOpen(true);
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};
    if (!form.name.trim()) nextErrors.name = "Vui lòng nhập tên danh mục";
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || undefined,
        enabled: form.enabled,
      };
      if (editingId) {
        await aiKnowledgeService.updateCategory(editingId, payload);
        toast.success("Đã cập nhật danh mục");
      } else {
        await aiKnowledgeService.createCategory(payload);
        toast.success("Đã tạo danh mục");
      }
      handleDialogChange(false);
      await loadData();
    } catch (error: any) {
      setFormErrors({ general: error?.message || "Không thể lưu danh mục." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await aiKnowledgeService.deleteCategory(deleteId);
      toast.success("Đã xóa danh mục");
      await loadData();
    } catch {
      toast.error("Xóa danh mục thất bại");
    } finally {
      setDeleteId(null);
    }
  };

  const normalizedSearch = normalizeText(searchQuery);
  const filteredCategories = categories
    .filter((category) => {
      if (statusFilter === "enabled" && !category.enabled) return false;
      if (statusFilter === "disabled" && category.enabled) return false;
      if (!normalizedSearch) return true;
      return [category.name, category.slug, category.description].some(
        (value) =>
          normalizeText(String(value ?? "")).includes(normalizedSearch),
      );
    })
    .sort(
      (left, right) => left.sortOrder - right.sortOrder || left.id - right.id,
    );

  const totalItems = filteredCategories.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const paginatedCategories = filteredCategories.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );

  useEffect(() => {
    if (currentPage > totalPages - 1) {
      setCurrentPage(totalPages - 1);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-5">
      <AgronomistPageHeader
        title="Danh mục tri thức"
        actions={
          <button
            type="button"
            onClick={openCreate}
            className={agronomistPrimaryButtonClassName}
          >
            <Plus className="h-4 w-4" />
            Thêm danh mục
          </button>
        }
      />

      <AgronomistStatGrid>
        <AgronomistStatCard label="Tổng danh mục" value={categories.length} />
        <AgronomistStatCard
          label="Đang bật"
          value={categories.filter((item) => item.enabled).length}
          valueClassName="text-[#252896]"
        />
        <AgronomistStatCard
          label="Đã tắt"
          value={categories.filter((item) => !item.enabled).length}
        />
      </AgronomistStatGrid>

      <AgronomistPanel>
        <AgronomistToolbar>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as typeof statusFilter)
            }
          >
            <SelectTrigger
              className={cn(agronomistInputClassName, "w-full sm:w-[180px]")}
            >
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[12px]">
                Tất cả trạng thái
              </SelectItem>
              <SelectItem value="enabled" className="text-[12px]">
                Đang bật
              </SelectItem>
              <SelectItem value="disabled" className="text-[12px]">
                Đã tắt
              </SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-full sm:max-w-[360px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm tên, slug, mô tả..."
              className={cn(agronomistInputClassName, "pl-9")}
            />
          </div>
        </AgronomistToolbar>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className={agronomistTableHeadClassName}>
              <tr>
                <th className="w-[70px] px-4 py-4">STT</th>
                <th className="px-4 py-4">Tên danh mục</th>
                <th className="px-4 py-4">Mô tả</th>
                <th className="w-[150px] px-4 py-4 text-center">Trạng thái</th>
                <th className="w-[150px] px-4 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className="border-t border-[#e7eaf0]">
                    <td className="px-4 py-4">
                      <div className="h-4 w-6 animate-pulse rounded bg-slate-100" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-36 animate-pulse rounded bg-slate-100" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-56 animate-pulse rounded bg-slate-100" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="mx-auto h-5 w-20 animate-pulse rounded-full bg-slate-100" />
                    </td>
                    <td className="px-4 py-4" />
                  </tr>
                ))
              ) : paginatedCategories.length > 0 ? (
                paginatedCategories.map((category, index) => (
                  <tr
                    key={category.id}
                    className="border-t border-[#e7eaf0] transition-colors hover:bg-[#f9fafc]"
                  >
                    <td className="px-4 py-4 text-[12px] text-slate-500">
                      {currentPage * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-[12px] font-semibold text-[#232323]">
                        {category.name}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {category.slug}
                      </p>
                    </td>
                    <td className="max-w-[360px] px-4 py-4 text-[12px] text-slate-600">
                      <p className="line-clamp-2">
                        {category.description || "-"}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <AgronomistStatusPill
                        tone={category.enabled ? "blue" : "gray"}
                      >
                        {category.enabled ? "Đang bật" : "Đã tắt"}
                      </AgronomistStatusPill>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(category)}
                          className="h-8 rounded-[4px] border-[#f3a340] bg-white px-3 text-[12px] font-medium text-[#e58a00] shadow-none hover:bg-orange-50"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Sửa
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteId(category.id)}
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
                    Không có danh mục phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <AgronomistPagination
          page={currentPage}
          pageSize={PAGE_SIZE}
          total={totalItems}
          disabled={loading}
          onPageChange={setCurrentPage}
        />
      </AgronomistPanel>

      <Dialog open={isOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-h-[92vh] w-[95vw] max-w-[560px] gap-0 overflow-hidden rounded-[4px] border border-[#dcdfe8] bg-white p-0 shadow-xl">
          <DialogHeader className="border-b border-[#e8ebf1] px-6 py-5">
            <DialogTitle className="text-left text-[18px] font-semibold text-[#232323]">
              {editingId ? "Cập nhật danh mục" : "Thêm danh mục mới"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSave}
            className="max-h-[calc(92vh-145px)] overflow-y-auto px-6 py-5"
          >
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[12px] font-semibold text-[#232323]">
                  Tên danh mục <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={form.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    setForm((current) => ({
                      ...current,
                      name,
                      slug: slugTouched ? current.slug : toSlug(name),
                    }));
                    setFormErrors((current) => ({
                      ...current,
                      name: undefined,
                      general: undefined,
                    }));
                  }}
                  placeholder="Bệnh do vi khuẩn"
                  className={cn(
                    agronomistInputClassName,
                    formErrors.name && "border-rose-500",
                  )}
                />
                <ErrorMessage message={formErrors.name} />
              </div>

              <div className="space-y-2">
                <Label className="text-[12px] font-semibold text-[#232323]">
                  Slug
                </Label>
                <Input
                  value={form.slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setForm((current) => ({
                      ...current,
                      slug: event.target.value,
                    }));
                  }}
                  placeholder="benh-do-vi-khuan"
                  className={agronomistInputClassName}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[12px] font-semibold text-[#232323]">
                  Mô tả
                </Label>
                <Textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Mô tả ngắn về nhóm tri thức này."
                  className={cn(
                    agronomistTextareaClassName,
                    "min-h-[100px] resize-none",
                  )}
                />
              </div>

              <label className="flex items-center gap-2 text-[13px] text-slate-600">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      enabled: event.target.checked,
                    }))
                  }
                />
                Đang bật
              </label>

              <ErrorMessage message={formErrors.general} />
            </div>

            <DialogFooter className="mt-5 border-t border-[#e8ebf1] bg-[#f8f8f8] px-0 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogChange(false)}
                className="h-9 rounded-[4px] border-[#aeb5c4] px-5 text-[12px] font-medium shadow-none"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="h-9 rounded-[4px] bg-[#252896] px-5 text-[12px] font-semibold text-white shadow-none hover:bg-[#1d2078]"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                {editingId ? "Cập nhật" : "Tạo danh mục"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="max-w-[420px] rounded-[4px] border border-[#dcdfe8] bg-white p-0 shadow-xl">
          <AlertDialogHeader className="border-b border-[#e8ebf1] px-6 py-5">
            <AlertDialogTitle className="text-[18px] font-semibold text-[#232323]">
              Xóa danh mục này?
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-4 text-[13px] leading-6 text-slate-500">
              Các phác đồ hoặc bộ từ khóa thuộc danh mục này sẽ không còn danh
              mục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="border-t border-[#e8ebf1] px-6 py-4">
            <AlertDialogCancel className="h-9 rounded-[4px] border-[#aeb5c4] px-5 text-[12px] font-medium shadow-none">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="h-9 rounded-[4px] bg-[#d2453f] px-5 text-[12px] font-semibold text-white shadow-none hover:bg-[#b93632]"
            >
              Đồng ý xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-rose-500">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

function toSlug(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}
