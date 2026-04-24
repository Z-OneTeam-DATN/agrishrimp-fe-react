"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, ImageIcon, GripVertical, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import {
  BannerDTO,
  adminGetBanners,
  adminCreateBanner,
  adminUpdateBanner,
  adminToggleBanner,
  adminDeleteBanner,
} from "@/app/services/banner.service";

interface FormState {
  title: string;
  linkUrl: string;
  displayOrder: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  linkUrl: "",
  displayOrder: "0",
  isActive: true,
  startDate: "",
  endDate: "",
};

export default function BannersPage() {
  const [banners, setBanners] = useState<BannerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setBanners(await adminGetBanners());
    } catch {
      toast.error("Không thể tải danh sách banner");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setPreviewUrl(null);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const openEdit = (b: BannerDTO) => {
    setEditingId(b.id);
    setForm({
      title: b.title ?? "",
      linkUrl: b.linkUrl ?? "",
      displayOrder: String(b.displayOrder ?? 0),
      isActive: b.isActive ?? true,
      startDate: b.startDate ? b.startDate.slice(0, 16) : "",
      endDate: b.endDate ? b.endDate.slice(0, 16) : "",
    });
    setPreviewUrl(b.imageUrl ?? null);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!previewUrl && !imageFile) {
      toast.error("Vui lòng chọn ảnh banner");
      return;
    }
    setSaving(true);
    try {
      const data = new FormData();
      const payload = {
        title: form.title || null,
        linkUrl: form.linkUrl || null,
        displayOrder: parseInt(form.displayOrder) || 0,
        isActive: form.isActive,
        startDate: form.startDate ? form.startDate + ":00" : null,
        endDate: form.endDate ? form.endDate + ":00" : null,
        imageUrl: imageFile ? null : previewUrl,
      };
      data.append("data", JSON.stringify(payload));
      if (imageFile) data.append("file", imageFile);

      if (editingId) {
        await adminUpdateBanner(editingId, data);
        toast.success("Cập nhật banner thành công");
      } else {
        await adminCreateBanner(data);
        toast.success("Tạo banner thành công");
      }
      setIsModalOpen(false);
      await load();
    } catch {
      toast.error("Lưu banner thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: number) => {
    setTogglingId(id);
    try {
      await adminToggleBanner(id);
      setBanners((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b))
      );
    } catch {
      toast.error("Cập nhật trạng thái thất bại");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminDeleteBanner(deleteId);
      toast.success("Đã xóa banner");
      setBanners((prev) => prev.filter((b) => b.id !== deleteId));
    } catch {
      toast.error("Xóa banner thất bại");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quản lý Banner</h1>
          <p className="text-sm text-gray-500 mt-0.5">Banner hiển thị trên trang chủ, sắp xếp theo thứ tự ưu tiên</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} />
          Thêm banner
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <ImageIcon size={40} strokeWidth={1} />
          <p className="text-sm">Chưa có banner nào. Hãy thêm banner đầu tiên!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map((b) => (
            <div
              key={b.id}
              className={`relative bg-white rounded-xl border overflow-hidden shadow-sm transition-all ${
                b.isActive ? "border-gray-200" : "border-gray-100 opacity-60"
              }`}
            >
              {/* Image */}
              <div className="relative w-full aspect-[16/7] bg-gray-100">
                {b.imageUrl ? (
                  <img src={b.imageUrl} alt={b.title ?? ""} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={32} className="text-gray-300" />
                  </div>
                )}
                {/* Order badge */}
                <span className="absolute top-2 left-2 bg-black/60 text-white text-[11px] font-bold px-2 py-0.5 rounded">
                  #{b.displayOrder}
                </span>
                {/* Status badge */}
                <span className={`absolute top-2 right-2 text-[11px] font-semibold px-2 py-0.5 rounded ${
                  b.isActive ? "bg-green-500 text-white" : "bg-gray-400 text-white"
                }`}>
                  {b.isActive ? "Đang hiển thị" : "Ẩn"}
                </span>
              </div>

              {/* Info */}
              <div className="p-3 space-y-1">
                <p className="text-[13px] font-semibold text-gray-800 truncate">
                  {b.title || <span className="text-gray-400 italic">Chưa đặt tiêu đề</span>}
                </p>
                {b.linkUrl && (
                  <a
                    href={b.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-primary hover:underline truncate"
                  >
                    <ExternalLink size={10} />
                    {b.linkUrl}
                  </a>
                )}
                {(b.startDate || b.endDate) && (
                  <p className="text-[11px] text-gray-400">
                    {b.startDate ? b.startDate.slice(0, 10) : "∞"} → {b.endDate ? b.endDate.slice(0, 10) : "∞"}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 px-3 pb-3">
                <button
                  type="button"
                  onClick={() => handleToggle(b.id)}
                  disabled={togglingId === b.id}
                  title={b.isActive ? "Ẩn banner" : "Hiện banner"}
                  className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-500"
                >
                  {togglingId === b.id ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : b.isActive ? (
                    <EyeOff size={15} />
                  ) : (
                    <Eye size={15} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(b)}
                  className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-500"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteId(b.id)}
                  className="p-1.5 rounded hover:bg-red-50 transition-colors text-red-400"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Chỉnh sửa banner" : "Thêm banner mới"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image picker */}
            <div>
              <Label>Ảnh banner <span className="text-red-500">*</span></Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mt-1.5 relative w-full aspect-[16/7] rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group"
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-medium">Đổi ảnh</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                    <ImageIcon size={32} strokeWidth={1} />
                    <span className="text-sm">Click để chọn ảnh</span>
                    <span className="text-xs">PNG, JPG, WebP — tỷ lệ 16:7 khuyến nghị</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tiêu đề</Label>
                <Input
                  className="mt-1"
                  placeholder="VD: Khuyến mãi tháng 4"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <Label>Thứ tự</Label>
                <Input
                  className="mt-1"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.displayOrder}
                  onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>URL liên kết (khi click banner)</Label>
              <Input
                className="mt-1"
                placeholder="https://..."
                value={form.linkUrl}
                onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ngày bắt đầu</Label>
                <Input
                  className="mt-1"
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>Ngày kết thúc</Label>
                <Input
                  className="mt-1"
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
              <Label className="cursor-pointer">{form.isActive ? "Đang hiển thị" : "Đang ẩn"}</Label>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 size={15} className="animate-spin" />}
              {editingId ? "Lưu thay đổi" : "Tạo banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa banner?</AlertDialogTitle>
            <AlertDialogDescription>
              Ảnh sẽ bị xóa khỏi Cloudinary và không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
