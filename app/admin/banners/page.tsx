"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  Plus,
  Loader2,
  Save,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  XCircle,
  ExternalLink,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
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
  isActive: string;
  startDate: string;
  endDate: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  linkUrl: "",
  displayOrder: "0",
  isActive: "ACTIVE",
  startDate: "",
  endDate: "",
};

export default function BannersPage() {
  const [allBanners, setAllBanners] = useState<BannerDTO[]>([]);
  const [banners, setBanners] = useState<BannerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("displayOrder,asc");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFileName, setImageFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [statusModal, setStatusModal] = useState<{ id: number; title: string; isActive: boolean } | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const summary = useMemo(() => {
    const activeCount = allBanners.filter((banner) => banner.isActive).length;
    const inactiveCount = allBanners.length - activeCount;
    return {
      total: allBanners.length,
      active: activeCount,
      inactive: inactiveCount,
    };
  }, [allBanners]);

  const positionOptions = useMemo(() => {
    const totalSlots = editingId ? Math.max(allBanners.length, 1) : allBanners.length + 1;
    return Array.from({ length: totalSlots }, (_, index) => ({
      value: String(index),
      label:
        index === 0
          ? "Vị trí 1 - Hiển thị đầu tiên"
          : index === totalSlots - 1
            ? `Vị trí ${index + 1} - Hiển thị cuối`
            : `Vị trí ${index + 1}`,
    }));
  }, [allBanners.length, editingId]);

  const formatDate = useCallback((value: string | null) => {
    if (!value) return "∞";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value.slice(0, 10);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  }, []);

  const sortBanners = useCallback((data: BannerDTO[], sortValue: string) => {
    const result = [...data];

    result.sort((a, b) => {
      switch (sortValue) {
        case "displayOrder,desc":
          return (b.displayOrder ?? 0) - (a.displayOrder ?? 0);
        case "title,asc":
          return (a.title ?? "").localeCompare(b.title ?? "", "vi", { sensitivity: "base" });
        case "title,desc":
          return (b.title ?? "").localeCompare(a.title ?? "", "vi", { sensitivity: "base" });
        case "createdAt,asc":
          return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
        case "createdAt,desc":
          return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
        case "displayOrder,asc":
        default:
          return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
      }
    });

    return result;
  }, []);

  const applyFilters = useCallback(
    (data: BannerDTO[], kw = keyword, st = statusFilter, sortValue = sortBy) => {
      let result = [...data];
      if (kw.trim()) {
        const lower = kw.trim().toLowerCase();
        result = result.filter((b) => b.title?.toLowerCase().includes(lower) || b.linkUrl?.toLowerCase().includes(lower));
      }
      if (st !== "all") {
        result = result.filter((b) => (st === "ACTIVE" ? b.isActive : !b.isActive));
      }
      setBanners(sortBanners(result, sortValue));
    },
    [keyword, sortBy, sortBanners, statusFilter]
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await adminGetBanners();
      setAllBanners(data);
    } catch {
      toast.error("Không thể tải danh sách banner");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { applyFilters(allBanners, keyword, statusFilter, sortBy); }, [allBanners, applyFilters, keyword, statusFilter, sortBy]);

  const handleAddNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, displayOrder: String(allBanners.length) });
    setPreviewUrl(null);
    setImageFile(null);
    setImageFileName("");
    setIsModalOpen(true);
  };

  const handleEdit = (b: BannerDTO) => {
    setEditingId(b.id);
    setForm({
      title: b.title ?? "",
      linkUrl: b.linkUrl ?? "",
      displayOrder: String(b.displayOrder ?? 0),
      isActive: b.isActive ? "ACTIVE" : "INACTIVE",
      startDate: b.startDate ? b.startDate.slice(0, 16) : "",
      endDate: b.endDate ? b.endDate.slice(0, 16) : "",
    });
    setPreviewUrl(b.imageUrl ?? null);
    setImageFile(null);
    setImageFileName(b.imageUrl ? "Ảnh hiện tại" : "");
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImageFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setImageFile(null);
    setImageFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl && !imageFile) {
      toast.error("Vui lòng chọn ảnh banner");
      return;
    }
    const parsedDisplayOrder = Number(form.displayOrder);
    if (!Number.isFinite(parsedDisplayOrder) || parsedDisplayOrder < 0) {
      toast.error("Thứ tự ưu tiên phải là số không âm");
      return;
    }
    if (form.startDate && form.endDate && new Date(form.startDate) > new Date(form.endDate)) {
      toast.error("Ngày kết thúc phải sau ngày bắt đầu");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title || null,
        linkUrl: form.linkUrl || null,
        displayOrder: parsedDisplayOrder,
        isActive: form.isActive === "ACTIVE",
        startDate: form.startDate ? form.startDate + ":00" : null,
        endDate: form.endDate ? form.endDate + ":00" : null,
        imageUrl: imageFile ? null : previewUrl,
      };
      const fd = new FormData();
      fd.append("data", JSON.stringify(payload));
      if (imageFile) fd.append("file", imageFile);

      if (editingId) {
        await adminUpdateBanner(editingId, fd);
        toast.success("Cập nhật banner thành công");
      } else {
        await adminCreateBanner(fd);
        toast.success("Thêm banner thành công");
      }
      setIsModalOpen(false);
      await loadData();
    } catch {
      toast.error("Lưu banner thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!statusModal) return;
    setTogglingId(statusModal.id);
    try {
      await adminToggleBanner(statusModal.id);
      toast.success(`Đã ${statusModal.isActive ? "ẩn" : "hiện"} banner: ${statusModal.title || "Banner"}`);
      await loadData();
    } catch {
      toast.error("Cập nhật trạng thái thất bại");
    } finally {
      setTogglingId(null);
      setStatusModal(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminDeleteBanner(deleteId);
      toast.success("Đã xóa banner");
      setAllBanners((prev) => prev.filter((b) => b.id !== deleteId));
    } catch {
      toast.error("Xóa banner thất bại");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý banner</h1>
          <p className="mt-1 text-sm text-slate-500">
            Banner hiển thị trên trang chủ. Chọn vị trí hiển thị để sắp xếp dễ hơn.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {summary.total} banner, {summary.active} đang hiển thị, {summary.inactive} tạm ẩn.
          </p>
        </div>
        <Button onClick={handleAddNew} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
          <Plus className="mr-2" size={18} /> Thêm banner mới
        </Button>
      </div>

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
        <AdminSearchFilter
          placeholder="Tìm tiêu đề, đường dẫn..."
          hideFilter1
          hideSettingsButton
          filter2Placeholder="Tất cả trạng thái"
          filter2Options={[
            { label: "Tất cả trạng thái", value: "all" },
            { label: "Đang hiển thị", value: "ACTIVE" },
            { label: "Tạm ẩn", value: "INACTIVE" },
          ]}
          sortOptions={[
            { label: "Vị trí tăng dần", value: "displayOrder,asc" },
            { label: "Vị trí giảm dần", value: "displayOrder,desc" },
            { label: "Mới nhất", value: "createdAt,desc" },
            { label: "Cũ nhất", value: "createdAt,asc" },
            { label: "Tiêu đề A-Z", value: "title,asc" },
            { label: "Tiêu đề Z-A", value: "title,desc" },
          ]}
          onSearch={(v) => setKeyword(v)}
          onFilter2Change={(v) => setStatusFilter(v)}
          onSortChange={(v) => setSortBy(v)}
          onRefresh={loadData}
        />

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500 font-semibold">
                <th className="p-3 pl-5 w-[70px]">ID</th>
                <th className="p-3 w-[100px]">Ảnh</th>
                <th className="p-3">Tên banner / liên kết</th>
                <th className="p-3 text-center w-[120px]">Vị trí</th>
                <th className="p-3 text-center w-[180px]">Hiệu lực</th>
                <th className="p-3 text-center w-[120px]">Trạng thái</th>
                <th className="p-3 text-right pr-5 w-[130px]">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="p-3 pl-5"><div className="h-4 w-8 bg-slate-100 rounded animate-pulse" /></td>
                    <td className="p-3"><div className="h-14 w-20 bg-slate-100 rounded animate-pulse" /></td>
                    <td className="p-3"><div className="h-4 w-48 bg-slate-100 rounded animate-pulse" /></td>
                    <td className="p-3"><div className="h-4 w-8 bg-slate-100 rounded animate-pulse mx-auto" /></td>
                    <td className="p-3"><div className="h-4 w-28 bg-slate-100 rounded animate-pulse mx-auto" /></td>
                    <td className="p-3"><div className="h-5 w-20 bg-slate-100 rounded animate-pulse mx-auto" /></td>
                    <td className="p-3" />
                  </tr>
                ))
              ) : banners.length > 0 ? (
                banners.map((b) => (
                  <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-3 pl-5 text-sm text-slate-500 font-bold font-mono">#{b.id}</td>
                    <td className="p-3">
                      <div className="w-20 h-12 rounded border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                        {b.imageUrl ? (
                          <img src={b.imageUrl} alt={b.title ?? ""} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={16} className="text-slate-300" />
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <p className={cn("text-[15px] font-semibold", b.title ? "text-slate-800" : "text-slate-400 italic")}>
                        {b.title || "Banner không tên"}
                      </p>
                      {b.linkUrl && (
                        <a
                          href={b.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 flex items-center gap-1 text-sm text-primary hover:underline truncate max-w-[340px]"
                        >
                          <ExternalLink size={10} />
                          {b.linkUrl}
                        </a>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-sm font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                        Vị trí {b.displayOrder + 1}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="text-sm text-slate-500">
                        <div>{formatDate(b.startDate)} → {formatDate(b.endDate)}</div>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={cn(
                        "text-xs font-semibold px-3 py-1 rounded-full border",
                        b.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-50 text-slate-400 border-slate-200"
                      )}>
                        {b.isActive ? "Hiển thị" : "Tạm ẩn"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          title={b.isActive ? "Ẩn banner" : "Hiện banner"}
                          disabled={togglingId === b.id}
                          className={cn("h-8 w-8", b.isActive ? "text-emerald-600 hover:bg-emerald-50" : "text-amber-500 hover:bg-amber-50")}
                          onClick={() => setStatusModal({ id: b.id, title: b.title ?? "", isActive: b.isActive })}
                        >
                          {togglingId === b.id
                            ? <Loader2 size={15} className="animate-spin" />
                            : b.isActive ? <Eye size={16} /> : <EyeOff size={16} />
                          }
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Chỉnh sửa"
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                          onClick={() => handleEdit(b)}
                        >
                          <Edit size={15} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Xóa"
                          className="h-8 w-8 text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteId(b.id)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic font-medium">
                    Chưa có banner nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[95vw] max-w-[640px] max-h-[92vh] p-0 overflow-hidden bg-white flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-bottom-3 data-[state=closed]:slide-out-to-bottom-3 duration-200">
          <DialogHeader className="px-5 py-4 sm:px-6 sm:py-5 border-b bg-slate-50">
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ImageIcon className="text-emerald-600" size={20} />
              {editingId ? "Cập nhật banner" : "Thêm banner mới"}
            </DialogTitle>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Chỉ giữ lại các thông tin cần thiết để người dùng thao tác nhanh hơn.
            </p>
          </DialogHeader>

          <form onSubmit={handleSave} className="flex-1 min-h-0 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6 space-y-5">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700 block">
                Ảnh banner <span className="text-rose-500">*</span>
              </Label>
              <div className="flex flex-col items-center gap-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "w-full max-w-sm aspect-[16/7] rounded-xl border-2 border-dashed flex items-center justify-center relative overflow-hidden bg-white group transition-all duration-200 cursor-pointer",
                    previewUrl
                      ? "border-slate-200"
                      : "border-slate-300 hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-sm"
                  )}
                >
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <ImageIcon className="text-white h-6 w-6" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-slate-400 hover:text-emerald-600 transition-colors gap-1">
                      <ImageIcon size={28} />
                      <span className="text-xs font-medium">Tải ảnh lên</span>
                      <span className="text-[11px] text-slate-400">Khuyến nghị tỷ lệ 16:7</span>
                    </div>
                  )}
                </div>

                {previewUrl && (
                  <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white px-3 py-2 flex items-center justify-between gap-2">
                    <TooltipProvider delayDuration={150}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-xs font-semibold text-slate-600 truncate max-w-[220px] cursor-help">
                            {imageFileName || "Ảnh đã chọn"}
                          </p>
                        </TooltipTrigger>
                        {(imageFileName || "Ảnh đã chọn").length > 28 && (
                          <TooltipContent side="top" className="max-w-[320px] break-all text-xs">
                            {imageFileName || "Ảnh đã chọn"}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="h-7 w-7 sm:w-auto p-0 sm:px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <XCircle size={14} className="sm:mr-1" />
                      <span className="hidden sm:inline">Xóa</span>
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400">Ảnh rõ, ngang, ít chữ sẽ hiển thị đẹp hơn ngoài trang chủ.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Tên banner</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ví dụ: Khuyến mãi tháng 5"
                  className="h-11 text-sm bg-white"
                />
                <p className="text-xs text-slate-400">Tên này chỉ để quản lý nội bộ.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Trạng thái</Label>
                <Select value={form.isActive} onValueChange={(v) => setForm((f) => ({ ...f, isActive: v }))}>
                  <SelectTrigger className="h-11 bg-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Đang hiển thị</SelectItem>
                    <SelectItem value="INACTIVE">Tạm ẩn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Liên kết khi bấm vào banner</Label>
              <Input
                value={form.linkUrl}
                onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                placeholder="https://..."
                className="h-11 text-sm bg-white"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Vị trí hiển thị</Label>
                <Select value={form.displayOrder} onValueChange={(value) => setForm((f) => ({ ...f, displayOrder: value }))}>
                  <SelectTrigger className="h-11 bg-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {positionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400">Vị trí 1 sẽ được hiển thị đầu tiên.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Hiệu lực</Label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                  {form.startDate || form.endDate
                    ? `${formatDate(form.startDate || null)} → ${formatDate(form.endDate || null)}`
                    : "Không giới hạn thời gian"}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700 block">Thời gian hiệu lực</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500">Ngày bắt đầu</Label>
                  <Input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="h-11 text-sm bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500">Ngày kết thúc</Label>
                  <Input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="h-11 text-sm bg-white"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400">Bạn có thể để trống nếu banner luôn được phép hiển thị.</p>
            </div>

            <DialogFooter className="sticky bottom-0 bg-white pt-4 pb-1 mt-2 border-t flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="h-11 w-full sm:w-auto px-6 text-sm font-medium"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="h-11 w-full sm:w-auto px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-100"
              >
                {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                {editingId ? "Lưu thay đổi" : "Tạo banner"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-600 font-bold">Xác nhận xóa banner</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">
              Ảnh sẽ bị xóa khỏi Cloudinary và không thể khôi phục.
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

      <AlertDialog open={!!statusModal} onOpenChange={() => setStatusModal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-600 font-bold">
              Thay đổi trạng thái hiển thị
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">
              Bạn muốn{" "}
              <strong>{statusModal?.isActive ? "ẨN" : "HIỂN THỊ"}</strong> banner{" "}
              <strong>{statusModal?.title || "này"}</strong> trên trang chủ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-medium h-9 text-sm">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              className="bg-amber-500 hover:bg-amber-600 text-white font-medium h-9 text-sm"
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
