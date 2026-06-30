"use client";

import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Upload, X } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/axios";
import {
  BannerDTO,
  adminCreateBanner,
  adminUpdateBanner,
} from "@/app/services/banner.service";

interface BannerFormProps {
  initialData?: BannerDTO;
  bannerCount?: number;
}

type FormState = {
  title: string;
  linkUrl: string;
  displayOrder: string;
  isActive: string;
  startDate: string;
  endDate: string;
};

export default function BannerForm({
  initialData,
  bannerCount = 0,
}: BannerFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!initialData;

  const [form, setForm] = useState<FormState>({
    title: initialData?.title ?? "",
    linkUrl: initialData?.linkUrl ?? "",
    displayOrder: String(initialData?.displayOrder ?? bannerCount),
    isActive: initialData?.isActive === false ? "INACTIVE" : "ACTIVE",
    startDate: initialData?.startDate ? initialData.startDate.slice(0, 16) : "",
    endDate: initialData?.endDate ? initialData.endDate.slice(0, 16) : "",
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.imageUrl ?? null,
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [mobilePreviewUrl, setMobilePreviewUrl] = useState<string | null>(
    initialData?.mobileImageUrl ?? null,
  );
  const [mobileImageFile, setMobileImageFile] = useState<File | null>(null);
  const [mobileImageRemoved, setMobileImageRemoved] = useState(false);
  const [saving, setSaving] = useState(false);

  const fieldLabelClass = "text-[10.5px] font-semibold text-slate-500";
  const fieldControlClass =
    "h-[38px] text-[13px] font-normal text-slate-800 shadow-none placeholder:text-slate-400";
  const sectionCardClass = "border border-slate-200 bg-white p-6 shadow-sm";
  const sectionTitleClass = "text-[11px] font-bold text-slate-800";

  const positionOptions = useMemo(() => {
    const totalSlots = isEdit ? Math.max(bannerCount, 1) : bannerCount + 1;
    return Array.from({ length: totalSlots }, (_, index) => ({
      value: String(index),
      label:
        index === 0
          ? "Vị trí 1 - Hiển thị đầu tiên"
          : index === totalSlots - 1
            ? `Vị trí ${index + 1} - Hiển thị cuối`
            : `Vị trí ${index + 1}`,
    }));
  }, [bannerCount, isEdit]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleMobileFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMobileImageFile(file);
    setMobilePreviewUrl(URL.createObjectURL(file));
    setMobileImageRemoved(false);
  };

  const removeImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeMobileImage = () => {
    setMobileImageFile(null);
    setMobilePreviewUrl(null);
    setMobileImageRemoved(true);
    if (mobileFileInputRef.current) mobileFileInputRef.current.value = "";
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
        startDate: form.startDate ? `${form.startDate}:00` : null,
        endDate: form.endDate ? `${form.endDate}:00` : null,
        imageUrl: imageFile ? null : previewUrl,
        publicId: imageFile ? null : initialData?.publicId ?? null,
        mobileImageUrl: mobileImageFile
          ? null
          : mobilePreviewUrl
            ? mobilePreviewUrl
            : mobileImageRemoved
              ? ""
              : null,
        mobilePublicId: mobileImageFile
          ? null
          : mobilePreviewUrl
            ? initialData?.mobilePublicId ?? null
            : mobileImageRemoved
              ? ""
              : null,
      };

      const fd = new FormData();
      fd.append("data", JSON.stringify(payload));
      if (imageFile) fd.append("file", imageFile);
      if (mobileImageFile) fd.append("mobileFile", mobileImageFile);

      if (isEdit) {
        await adminUpdateBanner(initialData.id, fd);
        toast.success("Cập nhật banner thành công");
      } else {
        await adminCreateBanner(fd);
        toast.success("Thêm banner thành công");
      }

      router.push("/admin/banners");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error as any) || "Lưu banner thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 px-1 pb-[100px]">
      <div className={sectionCardClass}>
        <div className="border-b border-slate-200 pb-3">
          <span className={sectionTitleClass}>1. Thông tin banner</span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className={fieldLabelClass}>Tên banner</Label>
            <Input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Ví dụ: Khuyến mãi tháng 5"
              className={cn(fieldControlClass, "border-slate-200 bg-white")}
            />
          </div>

          <div className="space-y-1.5">
            <Label className={fieldLabelClass}>Trạng thái</Label>
            <Select
              value={form.isActive}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, isActive: value }))
              }
            >
              <SelectTrigger
                className={cn(fieldControlClass, "border-slate-200 bg-white")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE" className="text-[13px]">
                  Đang hiển thị
                </SelectItem>
                <SelectItem value="INACTIVE" className="text-[13px]">
                  Tạm ẩn
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className={fieldLabelClass}>
              Liên kết khi bấm vào banner
            </Label>
            <Input
              value={form.linkUrl}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  linkUrl: event.target.value,
                }))
              }
              placeholder="https://..."
              className={cn(fieldControlClass, "border-slate-200 bg-white")}
            />
          </div>

          <div className="space-y-1.5">
            <Label className={fieldLabelClass}>Vị trí hiển thị</Label>
            <Select
              value={form.displayOrder}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, displayOrder: value }))
              }
            >
              <SelectTrigger
                className={cn(fieldControlClass, "border-slate-200 bg-white")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {positionOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-[13px]"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className={fieldLabelClass}>Ngày bắt đầu</Label>
            <Input
              type="datetime-local"
              value={form.startDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  startDate: event.target.value,
                }))
              }
              className={cn(fieldControlClass, "border-slate-200 bg-white")}
            />
          </div>

          <div className="space-y-1.5">
            <Label className={fieldLabelClass}>Ngày kết thúc</Label>
            <Input
              type="datetime-local"
              value={form.endDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  endDate: event.target.value,
                }))
              }
              className={cn(fieldControlClass, "border-slate-200 bg-white")}
            />
          </div>

          <div className="space-y-1.5">
            <Label className={fieldLabelClass}>
              Ảnh banner desktop <span className="text-rose-500">*</span>
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  fieldControlClass,
                  "flex min-w-0 flex-1 items-center justify-start rounded-[4px] border border-slate-200 bg-white px-3 text-left text-slate-500 transition-colors hover:border-blue-300 hover:text-blue-600",
                )}
              >
                <Upload size={14} className="mr-2 shrink-0" />
                <span className="truncate">
                  {imageFile?.name ??
                    (previewUrl ? "Đã có ảnh banner" : "Chọn ảnh banner...")}
                </span>
              </button>
              {previewUrl && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={removeImage}
                  className="h-[38px] shrink-0 rounded-[4px] border-slate-200 px-3 text-[12px] text-slate-500"
                >
                  <X size={12} />
                </Button>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              Khuyến nghị 1920x560, ảnh ngang, rõ nét và ít chữ.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className={fieldLabelClass}>Ảnh banner mobile</Label>
            <input
              ref={mobileFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleMobileFileChange}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => mobileFileInputRef.current?.click()}
                className={cn(
                  fieldControlClass,
                  "flex min-w-0 flex-1 items-center justify-start rounded-[4px] border border-slate-200 bg-white px-3 text-left text-slate-500 transition-colors hover:border-blue-300 hover:text-blue-600",
                )}
              >
                <Upload size={14} className="mr-2 shrink-0" />
                <span className="truncate">
                  {mobileImageFile?.name ??
                    (mobilePreviewUrl ? "Đã có ảnh mobile" : "Chọn ảnh mobile riêng...")}
                </span>
              </button>
              {mobilePreviewUrl && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={removeMobileImage}
                  className="h-[38px] shrink-0 rounded-[4px] border-slate-200 px-3 text-[12px] text-slate-500"
                >
                  <X size={12} />
                </Button>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              Tùy chọn. Khuyến nghị 1080x1350 hoặc 1080x1200 cho màn hình nhỏ.
            </p>
          </div>

          {(previewUrl || mobilePreviewUrl) && (
            <div className="space-y-1.5 md:col-span-2">
              <div className="grid gap-4 md:grid-cols-2">
                {previewUrl && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="space-y-2 text-left"
                  >
                    <span className="block text-[10px] font-semibold text-slate-400">
                      Desktop
                    </span>
                    <div className="relative flex h-[220px] w-full items-center justify-center overflow-hidden rounded-[4px] border border-slate-200 bg-slate-50 p-3 transition-colors md:h-[260px] md:p-4">
                      <img
                        src={previewUrl}
                        alt="Xem trước banner desktop"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </button>
                )}
                {mobilePreviewUrl && (
                  <button
                    type="button"
                    onClick={() => mobileFileInputRef.current?.click()}
                    className="space-y-2 text-left"
                  >
                    <span className="block text-[10px] font-semibold text-slate-400">
                      Mobile
                    </span>
                    <div className="relative flex h-[220px] w-full items-center justify-center overflow-hidden rounded-[4px] border border-slate-200 bg-slate-50 p-3 transition-colors md:h-[260px] md:p-4">
                      <img
                        src={mobilePreviewUrl}
                        alt="Xem trước banner mobile"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-[999] border-t border-slate-200 bg-white px-4 py-3 lg:left-[260px]">
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="h-10 min-w-[110px] rounded-md border-slate-300 bg-white px-6 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="h-10 min-w-[160px] rounded-md bg-blue-600 px-6 text-[13px] font-semibold text-white hover:bg-blue-700"
          >
            {saving ? (
              <Loader2 className="mr-2 animate-spin" size={16} />
            ) : (
              <Save className="mr-2" size={16} />
            )}
            {isEdit ? "Lưu thay đổi" : "Tạo banner"}
          </Button>
        </div>
      </div>
    </form>
  );
}

