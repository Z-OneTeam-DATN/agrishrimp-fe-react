"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Loader2, Search } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BlogCategoryDTO,
  adminGetBlogCategories,
  adminCreateBlogCategory,
  adminUpdateBlogCategory,
  adminDeleteBlogCategory,
} from "@/app/services/blog.service";

interface FormState { name: string; description: string; }
const EMPTY_FORM: FormState = { name: "", description: "" };

export default function BlogCategoriesPage() {
  const [categories, setCategories] = useState<BlogCategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      setCategories(await adminGetBlogCategories());
    } catch {
      toast.error("Không thể tải danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsOpen(true);
  };

  const openEdit = (c: BlogCategoryDTO) => {
    setEditingId(c.id);
    setForm({ name: c.name, description: c.description ?? "" });
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Vui lòng nhập tên danh mục"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      };
      if (editingId) {
        await adminUpdateBlogCategory(editingId, payload);
        toast.success("Đã cập nhật danh mục");
      } else {
        await adminCreateBlogCategory(payload);
        toast.success("Đã tạo danh mục");
      }
      setIsOpen(false);
      await loadData();
    } catch {
      toast.error("Lưu danh mục thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminDeleteBlogCategory(deleteId);
      toast.success("Đã xóa danh mục");
      await loadData();
    } catch {
      toast.error("Xóa danh mục thất bại");
    } finally {
      setDeleteId(null);
    }
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredCategories = normalizedSearch
    ? categories.filter((category) =>
        [category.name, category.slug, category.description]
          .some((value) => String(value ?? "").toLowerCase().includes(normalizedSearch)),
      )
    : categories;

  return (
    <div className="space-y-3">
      <div className="mt-2 mb-8 space-y-4 px-1">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
            Danh mục blog
          </h1>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-[360px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
            />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm tên, mô tả..."
              className="h-[38px] rounded-md border-slate-200 bg-white pl-10 text-[13px] shadow-none focus-visible:ring-blue-500/20"
            />
          </div>
          <Button
            onClick={openCreate}
            className="h-[38px] rounded-[4px] bg-blue-600 px-4 text-[13px] font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={15} className="mr-1.5" />
            Thêm danh mục
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="table-custom min-w-[760px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#ccc] bg-[#f0f0f0]">
                <th className="w-[56px] px-4 py-3 text-[10px] font-semibold text-[#1f1f1f]">STT</th>
                <th className="px-2 py-3 text-[10px] font-semibold text-[#1f1f1f]">Tên danh mục</th>
                <th className="px-2 py-3 text-[10px] font-semibold text-[#1f1f1f]">Mô tả</th>
                <th className="w-[92px] px-2 py-3 text-center text-[10px] font-semibold text-[#1f1f1f]">Bài viết</th>
                <th className="w-[104px] px-4 py-3 text-right text-[10px] font-semibold text-[#1f1f1f]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#eee]">
                    <td className="px-4 py-3"><div className="h-3.5 w-6 animate-pulse rounded bg-slate-100" /></td>
                    <td className="px-2 py-3"><div className="h-3.5 w-36 animate-pulse rounded bg-slate-100" /></td>
                    <td className="px-2 py-3"><div className="h-3.5 w-48 animate-pulse rounded bg-slate-100" /></td>
                    <td className="px-2 py-3"><div className="mx-auto h-3.5 w-8 animate-pulse rounded bg-slate-100" /></td>
                    <td className="px-4 py-3" />
                  </tr>
                ))
              ) : filteredCategories.length > 0 ? (
                filteredCategories.map((c, index) => (
                  <tr key={c.id} className="border-b border-[#eee] transition-colors hover:bg-[#f0f8ff]">
                    <td className="px-4 py-3 text-[11px] font-medium text-slate-500">{index + 1}</td>
                    <td className="px-2 py-3">
                      <span className="text-[11px] font-semibold text-slate-800">{c.name}</span>
                    </td>
                    <td className="max-w-[320px] truncate px-2 py-3 text-[11px] text-slate-500">{c.description || "-"}</td>
                    <td className="px-2 py-3 text-center">
                      <span className="inline-flex h-6 min-w-8 items-center justify-center rounded-[4px] border border-slate-200 bg-slate-50 px-2 text-[11px] font-semibold text-slate-600">
                        {c.postCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Chỉnh sửa"
                          className="h-7 w-7 rounded-[4px] text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => openEdit(c)}>
                          <Edit size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" title="Xóa"
                          className="h-7 w-7 rounded-[4px] text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => setDeleteId(c.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="h-[180px] text-center text-[12px] font-medium text-slate-400">
                    {normalizedSearch ? "Không tìm thấy danh mục phù hợp." : "Chưa có danh mục nào."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex min-w-full shrink-0 items-center justify-between border-t border-slate-100 bg-[#f8f9fa] px-5 py-3">
          <p className="text-[12px] font-semibold text-slate-500">
            Tổng số: {filteredCategories.length} danh mục
          </p>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="flex max-h-[92vh] w-[95vw] max-w-[560px] flex-col overflow-hidden rounded-[4px] border border-slate-200 bg-white p-0 shadow-xl">
          <DialogHeader className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <DialogTitle className="text-[16px] font-bold text-slate-800">
              {editingId ? "Cập nhật danh mục blog" : "Thêm danh mục mới"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="space-y-2">
              <Label className="text-[10.5px] font-semibold text-slate-500">
                Tên danh mục <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ví dụ: Kỹ thuật nuôi tôm"
                className="h-[38px] rounded-[4px] bg-white text-[13px] shadow-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10.5px] font-semibold text-slate-500">Mô tả</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả ngắn về danh mục..."
                rows={3}
                className="min-h-[88px] resize-none rounded-[4px] bg-white text-[13px] shadow-none"
              />
            </div>
            <DialogFooter className="sticky bottom-0 mt-2 flex flex-col-reverse items-stretch gap-2.5 border-t border-slate-200 bg-white pt-4 pb-1 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}
                className="h-10 w-full rounded-md border-slate-300 px-6 text-[13px] font-medium text-slate-600 hover:bg-slate-50 sm:w-auto">
                Hủy
              </Button>
              <Button type="submit" disabled={saving}
                className="h-10 w-full rounded-md bg-blue-600 px-8 text-[13px] font-semibold text-white hover:bg-blue-700 sm:w-auto">
                {saving ? <Loader2 className="animate-spin mr-1.5" size={14} /> : null}
                {editingId ? "Cập nhật danh mục" : "Tạo danh mục"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-[6px] border border-slate-200 bg-white shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px] font-bold text-rose-600">Xác nhận xóa danh mục</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] font-medium text-slate-500">
              Danh mục sẽ bị xóa. Các bài viết thuộc danh mục này sẽ không còn danh mục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 rounded-[4px] text-[13px] font-medium">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="h-9 rounded-[4px] bg-rose-600 text-[13px] font-medium text-white hover:bg-rose-700">
              Đồng ý xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

