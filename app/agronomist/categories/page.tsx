"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Database, FilePenLine, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { aiKnowledgeService } from "@/app/services/aiKnowledge.service";

const DEFAULT_CATEGORY_FORM = {
  id: null as number | null,
  name: "",
  slug: "",
  description: "",
  enabled: true,
  sortOrder: 0,
};

export default function AgronomistCategoriesPage() {
  const queryClient = useQueryClient();
  const [categoryForm, setCategoryForm] = useState(DEFAULT_CATEGORY_FORM);
  const [showForm, setShowForm] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ["ai-knowledge", "categories"],
    queryFn: () => aiKnowledgeService.getCategories(),
  });
  const categories = categoriesQuery.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["ai-knowledge", "categories"] });

  const categoryMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: categoryForm.name,
        slug: categoryForm.slug || undefined,
        description: categoryForm.description || undefined,
        enabled: categoryForm.enabled,
        sortOrder: Number(categoryForm.sortOrder || 0),
      };
      if (categoryForm.id) {
        return aiKnowledgeService.updateCategory(categoryForm.id, payload);
      }
      return aiKnowledgeService.createCategory(payload);
    },
    onSuccess: async () => {
      toast.success("Đã lưu danh mục tri thức.");
      setCategoryForm(DEFAULT_CATEGORY_FORM);
      setShowForm(false);
      await invalidate();
    },
    onError: (error: any) => toast.error(error?.message || "Không thể lưu danh mục."),
  });

  const deleteCategory = async (id: number) => {
    if (!confirm("Xóa danh mục này?")) return;
    await aiKnowledgeService.deleteCategory(id);
    toast.success("Đã xóa danh mục.");
    await invalidate();
  };

  const openCreateForm = () => {
    setCategoryForm(DEFAULT_CATEGORY_FORM);
    setShowForm(true);
  };

  const openEditForm = (category: (typeof categories)[number]) => {
    setCategoryForm({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      enabled: category.enabled,
      sortOrder: category.sortOrder,
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <SectionHeader
            icon={<Database className="h-5 w-5 text-blue-600" />}
            title="Danh mục tri thức"
            description="Nhóm các bệnh theo mảng chuyên môn để bot gợi ý đúng ngữ cảnh."
          />
          <button onClick={openCreateForm} className={primaryButtonClassName}>
            <Plus className="h-4 w-4" />
            Thêm danh mục
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {categoriesQuery.isLoading ? (
            <p className="text-sm text-slate-400">Đang tải...</p>
          ) : categories.length === 0 ? (
            <p className="text-sm text-slate-400">Chưa có danh mục nào. Bấm "Thêm danh mục" để tạo mới.</p>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="rounded-[4px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{category.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{category.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditForm(category)} className={iconButtonClassName}>
                      <FilePenLine className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteCategory(category.id)} className={iconButtonClassName}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {category.description ? (
                  <p className="mt-2 text-sm text-slate-600">{category.description}</p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>

      {showForm ? (
        <section className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">
            {categoryForm.id ? "Cập nhật danh mục" : "Tạo danh mục mới"}
          </h3>

          <div className="mt-4 space-y-3">
            <Field label="Tên danh mục">
              <input
                value={categoryForm.name}
                onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
                className={inputClassName}
                placeholder="Bệnh virus"
              />
            </Field>
            <Field label="Slug">
              <input
                value={categoryForm.slug}
                onChange={(event) => setCategoryForm((current) => ({ ...current, slug: event.target.value }))}
                className={inputClassName}
                placeholder="benh-virus"
              />
            </Field>
            <Field label="Mô tả">
              <textarea
                value={categoryForm.description}
                onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))}
                className={textareaClassName}
                rows={3}
                placeholder="Nhóm bệnh do virus hoặc tác nhân lây nhiễm nhanh."
              />
            </Field>
            <Field label="Thứ tự">
              <input
                type="number"
                value={categoryForm.sortOrder}
                onChange={(event) => setCategoryForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
                className={inputClassName}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={categoryForm.enabled}
                onChange={(event) => setCategoryForm((current) => ({ ...current, enabled: event.target.checked }))}
              />
              Đang bật
            </label>

            <div className="flex gap-3">
              <button onClick={() => categoryMutation.mutate()} className={primaryButtonClassName}>
                {categoryForm.id ? "Cập nhật danh mục" : "Tạo danh mục"}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setCategoryForm(DEFAULT_CATEGORY_FORM);
                }}
                className={secondaryButtonClassName}
              >
                Hủy
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-blue-50">{icon}</div>
      <div>
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      {children}
    </div>
  );
}

const inputClassName =
  "h-[38px] w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500";
const textareaClassName =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500";
const primaryButtonClassName =
  "inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700";
const secondaryButtonClassName =
  "inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50";
const iconButtonClassName =
  "inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50";
