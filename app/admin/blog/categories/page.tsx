"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Loader2, FolderOpen } from "lucide-react";
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

interface FormState { name: string; slug: string; description: string; }
const EMPTY_FORM: FormState = { name: "", slug: "", description: "" };

export default function BlogCategoriesPage() {
  const [categories, setCategories] = useState<BlogCategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<number | null>(null);

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
    setForm({ name: c.name, slug: c.slug, description: c.description ?? "" });
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Vui lòng nhập tên danh mục"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
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

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Danh mục blog</h1>
          <p className="mt-1 text-sm text-slate-500">{categories.length} danh mục</p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
          <Plus size={16} className="mr-1.5" /> Thêm danh mục
        </Button>
      </div>

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500 font-semibold">
                <th className="p-3 pl-5 w-[60px]">ID</th>
                <th className="p-3">Tên danh mục</th>
                <th className="p-3">Slug</th>
                <th className="p-3">Mô tả</th>
                <th className="p-3 text-center w-[100px]">Bài viết</th>
                <th className="p-3 text-right pr-5 w-[110px]">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="p-3 pl-5"><div className="h-4 w-8 bg-slate-100 rounded animate-pulse" /></td>
                    <td className="p-3"><div className="h-4 w-36 bg-slate-100 rounded animate-pulse" /></td>
                    <td className="p-3"><div className="h-4 w-28 bg-slate-100 rounded animate-pulse" /></td>
                    <td className="p-3"><div className="h-4 w-48 bg-slate-100 rounded animate-pulse" /></td>
                    <td className="p-3"><div className="h-4 w-8 bg-slate-100 rounded animate-pulse mx-auto" /></td>
                    <td className="p-3" />
                  </tr>
                ))
              ) : categories.length > 0 ? (
                categories.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-3 pl-5 text-sm text-slate-500 font-mono font-bold">#{c.id}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <FolderOpen size={15} className="text-emerald-600 shrink-0" />
                        <span className="text-[15px] font-semibold text-slate-800">{c.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-slate-500 font-mono">{c.slug}</td>
                    <td className="p-3 text-sm text-slate-500 max-w-[280px] truncate">{c.description || "—"}</td>
                    <td className="p-3 text-center">
                      <span className="text-sm font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                        {c.postCount}
                      </span>
                    </td>
                    <td className="p-3 text-right pr-4">
                      <div className="flex justify-end gap-1.5">
                        <Button variant="ghost" size="icon" title="Chỉnh sửa"
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                          onClick={() => openEdit(c)}>
                          <Edit size={15} />
                        </Button>
                        <Button variant="ghost" size="icon" title="Xóa"
                          className="h-8 w-8 text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteId(c.id)}>
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic font-medium">
                    Chưa có danh mục nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[480px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">
              {editingId ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Tên danh mục <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ví dụ: Kỹ thuật nuôi tôm"
                className="h-10 bg-white text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="ky-thuat-nuoi-tom (bỏ trống để tự tạo)"
                className="h-10 bg-white text-sm font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Mô tả</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả ngắn về danh mục..."
                rows={3}
                className="resize-none bg-white text-sm"
              />
            </div>
            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}
                className="h-9 px-5 font-medium text-sm">
                Hủy
              </Button>
              <Button type="submit" disabled={saving}
                className="h-9 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm">
                {saving ? <Loader2 className="animate-spin mr-1.5" size={14} /> : null}
                {editingId ? "Lưu thay đổi" : "Tạo danh mục"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-600 font-bold">Xác nhận xóa danh mục</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">
              Danh mục sẽ bị xóa. Các bài viết thuộc danh mục này sẽ không còn danh mục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-medium h-9 text-sm">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-medium h-9 text-sm">
              Đồng ý xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
