"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
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
  Search,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  const [statusModal, setStatusModal] = useState<{
    id: number;
    title: string;
    isActive: boolean;
  } | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const summary = useMemo(() => {
    const activeCount = allBanners.filter((banner) => banner.isActive).length;
    const inactiveCount = allBanners.length - activeCount;
    const linkedCount = allBanners.filter((banner) => banner.linkUrl).length;
    return {
      total: allBanners.length,
      active: activeCount,
      inactive: inactiveCount,
      linked: linkedCount,
    };
  }, [allBanners]);

  const summaryCards = useMemo(
    () => [
      {
        label: "Tổng banner",
        value: summary.total.toLocaleString("vi-VN"),
        note: "Tất cả banner đã tạo",
      },
      {
        label: "Có liên kết",
        value: summary.linked.toLocaleString("vi-VN"),
        note: "Banner điều hướng sang trang khác",
      },
      {
        label: "Đang hiển thị",
        value: summary.active.toLocaleString("vi-VN"),
        note: "Banner đang công khai ngoài trang chủ",
      },
      {
        label: "Tạm ẩn",
        value: summary.inactive.toLocaleString("vi-VN"),
        note: "Banner chưa hiển thị với khách hàng",
      },
    ],
    [summary],
  );

  const positionOptions = useMemo(() => {
    const totalSlots = editingId
      ? Math.max(allBanners.length, 1)
      : allBanners.length + 1;
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
          return (a.title ?? "").localeCompare(b.title ?? "", "vi", {
            sensitivity: "base",
          });
        case "title,desc":
          return (b.title ?? "").localeCompare(a.title ?? "", "vi", {
            sensitivity: "base",
          });
        case "createdAt,asc":
          return (
            new Date(a.createdAt ?? 0).getTime() -
            new Date(b.createdAt ?? 0).getTime()
          );
        case "createdAt,desc":
          return (
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime()
          );
        case "displayOrder,asc":
        default:
          return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
      }
    });

    return result;
  }, []);

  const applyFilters = useCallback(
    (
      data: BannerDTO[],
      kw = keyword,
      st = statusFilter,
      sortValue = sortBy,
    ) => {
      let result = [...data];
      if (kw.trim()) {
        const lower = kw.trim().toLowerCase();
        result = result.filter(
          (b) =>
            b.title?.toLowerCase().includes(lower) ||
            b.linkUrl?.toLowerCase().includes(lower),
        );
      }
      if (st !== "all") {
        result = result.filter((b) =>
          st === "ACTIVE" ? b.isActive : !b.isActive,
        );
      }
      setBanners(sortBanners(result, sortValue));
    },
    [keyword, sortBy, sortBanners, statusFilter],
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

  useEffect(() => {
    loadData();
  }, []);
  useEffect(() => {
    applyFilters(allBanners, keyword, statusFilter, sortBy);
  }, [allBanners, applyFilters, keyword, statusFilter, sortBy]);

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
    if (
      form.startDate &&
      form.endDate &&
      new Date(form.startDate) > new Date(form.endDate)
    ) {
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
      toast.success(
        `Đã ${statusModal.isActive ? "ẩn" : "hiện"} banner: ${statusModal.title || "Banner"}`,
      );
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

  const fieldLabelClass = "text-[10.5px] font-semibold text-slate-500";
  const fieldControlClass =
    "h-[38px] text-[13px] font-normal text-slate-800 shadow-none placeholder:text-slate-400";
  const selectTriggerClass =
    "h-[38px] text-[13px] font-normal text-slate-800 data-[placeholder]:text-slate-400";

  return (
    <div className="space-y-3 pb-[100px] text-slate-800">
      <div className="mt-2 mb-8 space-y-4 px-1">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
            Quản lý banner
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[4px] border border-[#dcdcdc] bg-white p-3 shadow-sm"
          >
            <p className="text-[11px] font-semibold text-slate-400">
              {card.label}
            </p>
            <p className="mt-1 truncate text-[18px] font-semibold leading-6 text-slate-900">
              {card.value}
            </p>
            <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500">
              {card.note}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[360px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
            />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm tiêu đề, đường dẫn..."
              className="h-[38px] rounded-md border-slate-200 bg-white pl-10 text-[13px] shadow-none focus-visible:ring-blue-500/20"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-[38px] w-full rounded-md border-slate-200 bg-white text-[13px] font-medium text-slate-600 shadow-none focus:ring-0 sm:w-[180px]">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[13px]">
                Tất cả trạng thái
              </SelectItem>
              <SelectItem value="ACTIVE" className="text-[13px]">
                Đang hiển thị
              </SelectItem>
              <SelectItem value="INACTIVE" className="text-[13px]">
                Tạm ẩn
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-[38px] w-full rounded-md border-slate-200 bg-white text-[13px] font-medium text-slate-600 shadow-none focus:ring-0 sm:w-[180px]">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="displayOrder,asc" className="text-[13px]">
                Vị trí tăng dần
              </SelectItem>
              <SelectItem value="displayOrder,desc" className="text-[13px]">
                Vị trí giảm dần
              </SelectItem>
              <SelectItem value="createdAt,desc" className="text-[13px]">
                Mới nhất
              </SelectItem>
              <SelectItem value="createdAt,asc" className="text-[13px]">
                Cũ nhất
              </SelectItem>
              <SelectItem value="title,asc" className="text-[13px]">
                Tiêu đề A-Z
              </SelectItem>
              <SelectItem value="title,desc" className="text-[13px]">
                Tiêu đề Z-A
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Link href="/admin/banners/new">
            <Button className="h-[38px] rounded-[4px] bg-emerald-600 px-4 text-[13px] font-medium text-white shadow-sm hover:bg-emerald-700">
              <Plus className="mr-1.5" size={15} /> Thêm banner mới
            </Button>
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="table-custom min-w-[980px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#ccc] bg-[#f0f0f0]">
                <th className="w-[70px] px-4 py-3 text-[10px] font-semibold text-[#1f1f1f]">
                  STT
                </th>
                <th className="w-[100px] px-2 py-3 text-[10px] font-semibold text-[#1f1f1f]">
                  Ảnh
                </th>
                <th className="px-2 py-3 text-[10px] font-semibold text-[#1f1f1f]">
                  Tên banner / liên kết
                </th>
                <th className="w-[120px] px-2 py-3 text-center text-[10px] font-semibold text-[#1f1f1f]">
                  Vị trí
                </th>
                <th className="w-[180px] px-2 py-3 text-center text-[10px] font-semibold text-[#1f1f1f]">
                  Hiệu lực
                </th>
                <th className="w-[120px] px-2 py-3 text-center text-[10px] font-semibold text-[#1f1f1f]">
                  Trạng thái
                </th>
                <th className="w-[130px] px-4 py-3 text-right text-[10px] font-semibold text-[#1f1f1f]">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#eee]">
                    <td className="px-4 py-3">
                      <div className="h-3.5 w-8 animate-pulse rounded bg-slate-100" />
                    </td>
                    <td className="px-2 py-3">
                      <div className="h-10 w-16 animate-pulse rounded bg-slate-100" />
                    </td>
                    <td className="px-2 py-3">
                      <div className="h-3.5 w-48 animate-pulse rounded bg-slate-100" />
                    </td>
                    <td className="px-2 py-3">
                      <div className="mx-auto h-3.5 w-8 animate-pulse rounded bg-slate-100" />
                    </td>
                    <td className="px-2 py-3">
                      <div className="mx-auto h-3.5 w-28 animate-pulse rounded bg-slate-100" />
                    </td>
                    <td className="px-2 py-3">
                      <div className="mx-auto h-5 w-20 animate-pulse rounded bg-slate-100" />
                    </td>
                    <td className="px-4 py-3" />
                  </tr>
                ))
              ) : banners.length > 0 ? (
                banners.map((b, index) => (
                  <tr
                    key={b.id}
                    className="border-b border-[#eee] transition-colors hover:bg-[#f0f8ff]"
                  >
                    <td className="px-4 py-3 text-[11px] font-medium text-slate-500">
                      {index + 1}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-slate-200 bg-slate-100">
                        {b.imageUrl ? (
                          <img
                            src={b.imageUrl}
                            alt={b.title ?? ""}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon size={16} className="text-slate-300" />
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <p
                        className={cn(
                          "line-clamp-2 text-[11px] font-semibold leading-snug",
                          b.title ? "text-slate-800" : "text-slate-400 italic",
                        )}
                      >
                        {b.title || "Banner không tên"}
                      </p>
                      {b.linkUrl && (
                        <a
                          href={b.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 flex max-w-[340px] items-center gap-1 truncate text-[10px] font-medium text-slate-500 hover:text-blue-600 hover:underline"
                        >
                          <ExternalLink size={10} />
                          {b.linkUrl}
                        </a>
                      )}
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span className="text-[11px] font-medium text-slate-600">
                        Vị trí {b.displayOrder + 1}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <div className="text-[11px] text-slate-500">
                        <div>
                          {formatDate(b.startDate)} → {formatDate(b.endDate)}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span className="text-[11px] font-medium text-slate-600">
                        {b.isActive ? "Hiển thị" : "Tạm ẩn"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title={b.isActive ? "Ẩn banner" : "Hiện banner"}
                          disabled={togglingId === b.id}
                          className={cn(
                            "h-7 w-7 rounded-[4px] text-slate-400",
                            b.isActive
                              ? "hover:bg-amber-50 hover:text-amber-600"
                              : "hover:bg-emerald-50 hover:text-emerald-600",
                          )}
                          onClick={() =>
                            setStatusModal({
                              id: b.id,
                              title: b.title ?? "",
                              isActive: b.isActive,
                            })
                          }
                        >
                          {togglingId === b.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : b.isActive ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Chỉnh sửa"
                          className="h-7 w-7 rounded-[4px] text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => handleEdit(b)}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Xóa"
                          className="h-7 w-7 rounded-[4px] text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => setDeleteId(b.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="h-[180px] text-center text-[12px] font-medium text-slate-400"
                  >
                    Chưa có banner nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="flex max-h-[92vh] w-[95vw] max-w-[640px] flex-col overflow-hidden border border-slate-200 bg-white p-0 shadow-xl duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-3 data-[state=open]:slide-in-from-bottom-3">
          <DialogHeader className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <DialogTitle className="flex items-center gap-2 text-[15px] font-bold text-slate-800">
              <ImageIcon className="text-emerald-600" size={16} />
              Cập nhật banner
            </DialogTitle>
            <p className="mt-1 text-[11px] font-medium text-slate-500">
              Chỉ giữ lại các thông tin cần thiết để người dùng thao tác nhanh
              hơn.
            </p>
          </DialogHeader>

          <form
            onSubmit={handleSave}
            className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6"
          >
            <div className="space-y-3">
              <Label className={cn(fieldLabelClass, "block")}>
                Ảnh banner <span className="text-rose-500">*</span>
              </Label>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-[38px] flex-1 justify-start rounded-[4px] border-slate-200 bg-white px-3 text-left text-[13px] font-normal text-slate-500"
                  >
                    <ImageIcon size={14} className="mr-2" />
                    {imageFileName || (previewUrl ? "Đã có ảnh banner" : "Chọn ảnh banner...")}
                  </Button>
                  {previewUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRemoveImage}
                      className="h-[38px] shrink-0 rounded-[4px] border-slate-200 px-3 text-[12px] text-slate-500"
                    >
                      <XCircle size={14} />
                    </Button>
                  )}
                </div>

                {previewUrl && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative flex aspect-[16/7] w-full max-w-sm cursor-pointer items-center justify-center overflow-hidden border border-slate-200 bg-white transition-all duration-200"
                  >
                      <img
                        src={previewUrl}
                        alt="preview"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <ImageIcon className="h-6 w-6 text-white" />
                      </div>
                  </div>
                )}
              </div>
              <p className="text-[10px] font-medium text-slate-400">
                Ảnh rõ, ngang, ít chữ sẽ hiển thị đẹp hơn ngoài trang chủ.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className={fieldLabelClass}>Tên banner</Label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Ví dụ: Khuyến mãi tháng 5"
                  className={cn(fieldControlClass, "border-slate-200 bg-white")}
                />
                <p className="text-[10px] font-medium text-slate-400">
                  Tên này chỉ để quản lý nội bộ.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className={fieldLabelClass}>Trạng thái</Label>
                <Select
                  value={form.isActive}
                  onValueChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                >
                  <SelectTrigger
                    className={cn(
                      selectTriggerClass,
                      "border-slate-200 bg-white",
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Đang hiển thị</SelectItem>
                    <SelectItem value="INACTIVE">Tạm ẩn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className={fieldLabelClass}>
                Liên kết khi bấm vào banner
              </Label>
              <Input
                value={form.linkUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, linkUrl: e.target.value }))
                }
                placeholder="https://..."
                className={cn(fieldControlClass, "border-slate-200 bg-white")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className={fieldLabelClass}>Vị trí hiển thị</Label>
                <Select
                  value={form.displayOrder}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, displayOrder: value }))
                  }
                >
                  <SelectTrigger
                    className={cn(
                      selectTriggerClass,
                      "border-slate-200 bg-white",
                    )}
                  >
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
                <p className="text-[10px] font-medium text-slate-400">
                  Vị trí 1 sẽ được hiển thị đầu tiên.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className={fieldLabelClass}>Hiệu lực</Label>
                <div className="flex h-[38px] items-center border border-slate-200 bg-slate-50 px-3 text-[13px] font-medium text-slate-500">
                  {form.startDate || form.endDate
                    ? `${formatDate(form.startDate || null)} → ${formatDate(form.endDate || null)}`
                    : "Không giới hạn thời gian"}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className={cn(fieldLabelClass, "block")}>
                Thời gian hiệu lực
              </Label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold text-slate-500">
                    Ngày bắt đầu
                  </Label>
                  <Input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, startDate: e.target.value }))
                    }
                    className={cn(
                      fieldControlClass,
                      "border-slate-200 bg-white",
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold text-slate-500">
                    Ngày kết thúc
                  </Label>
                  <Input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, endDate: e.target.value }))
                    }
                    className={cn(
                      fieldControlClass,
                      "border-slate-200 bg-white",
                    )}
                  />
                </div>
              </div>
              <p className="text-[10px] font-medium text-slate-400">
                Bạn có thể để trống nếu banner luôn được phép hiển thị.
              </p>
            </div>

            <DialogFooter className="sticky bottom-0 mt-2 flex flex-col-reverse items-stretch gap-2.5 border-t border-slate-200 bg-white pt-4 pb-1 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="h-10 w-full rounded-md border-slate-300 px-6 text-[13px] font-medium text-slate-600 hover:bg-slate-50 sm:w-auto"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="h-10 w-full rounded-md bg-emerald-600 px-8 text-[13px] font-semibold text-white hover:bg-emerald-700 sm:w-auto"
              >
                {saving ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : (
                  <Save className="mr-2" size={16} />
                )}
                {editingId ? "Lưu thay đổi" : "Tạo banner"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-rose-600">
              Xác nhận xóa banner
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] font-medium text-slate-500">
              Ảnh sẽ bị xóa khỏi Cloudinary và không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 text-[13px] font-medium">
              Hủy bỏ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="h-9 bg-rose-600 text-[13px] font-medium text-white hover:bg-rose-700"
            >
              Đồng ý xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!statusModal}
        onOpenChange={() => setStatusModal(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-amber-600">
              Thay đổi trạng thái hiển thị
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] font-medium text-slate-500">
              Bạn muốn{" "}
              <strong>{statusModal?.isActive ? "ẨN" : "HIỂN THỊ"}</strong>{" "}
              banner <strong>{statusModal?.title || "này"}</strong> trên trang
              chủ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 text-[13px] font-medium">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              className="h-9 bg-amber-500 text-[13px] font-medium text-white hover:bg-amber-600"
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
