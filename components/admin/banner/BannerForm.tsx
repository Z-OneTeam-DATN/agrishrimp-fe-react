"use client";

import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Upload, X } from "lucide-react";
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
  existingBanners?: BannerDTO[];
}

type FormState = {
  title: string;
  linkUrl: string;
  displayOrder: string;
  isActive: "" | "ACTIVE" | "INACTIVE";
  startDate: string;
  endDate: string;
};

type FormErrors = {
  isActive?: string;
  displayOrder?: string;
  endDate?: string;
  image?: string;
  submit?: string;
};

export default function BannerForm({
  initialData,
  bannerCount = 0,
  existingBanners = [],
}: BannerFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!initialData;

  const [form, setForm] = useState<FormState>({
    title: initialData?.title ?? "",
    linkUrl: initialData?.linkUrl ?? "",
    displayOrder: initialData ? String(initialData.displayOrder) : "",
    isActive: initialData ? (initialData.isActive === false ? "INACTIVE" : "ACTIVE") : "",
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
  const [errors, setErrors] = useState<FormErrors>({});
  const [positionConfirmOpen, setPositionConfirmOpen] = useState(false);
  const [pendingDisplayOrder, setPendingDisplayOrder] = useState<number | null>(null);
  const [previousDisplayOrder, setPreviousDisplayOrder] = useState<string>("");
  const [restoreDisplayOrderOnClose, setRestoreDisplayOrderOnClose] = useState(true);

  const fieldLabelClass = "text-[10.5px] font-semibold text-slate-500";
  const fieldControlClass =
    "h-[38px] text-[13px] font-normal text-slate-800 shadow-none placeholder:text-slate-400";
  const sectionCardClass = "border border-slate-200 bg-white p-6 shadow-sm";
  const sectionTitleClass = "text-[11px] font-bold text-slate-800";

  const otherBanners = useMemo(
    () => existingBanners.filter((banner) => banner.id !== initialData?.id),
    [existingBanners, initialData?.id],
  );

  const conflictingBanner = useMemo(() => {
    if (!form.displayOrder) return null;
    const selectedOrder = Number(form.displayOrder);
    if (!Number.isInteger(selectedOrder) || selectedOrder < 0) return null;
    return otherBanners.find((banner) => banner.displayOrder === selectedOrder) ?? null;
  }, [form.displayOrder, otherBanners]);

  const positionOptions = useMemo(() => {
    const totalSlots = isEdit ? Math.max(bannerCount, 1) : bannerCount + 1;
    return Array.from({ length: totalSlots }, (_, index) => ({
      value: String(index),
      label: (() => {
        const occupyingBanner = otherBanners.find((banner) => banner.displayOrder === index);
        if (occupyingBanner) {
          return `Vị trí ${index + 1} - đang có: ${occupyingBanner.title || "Banner chưa đặt tên"}`;
        }
        if (isEdit && initialData?.displayOrder === index) {
          return `Vị trí ${index + 1} - vị trí hiện tại`;
        }
        if (!isEdit && index === totalSlots - 1) {
          return `Vị trí ${index + 1} - thêm ở cuối`;
        }
        return index === 0
          ? "Vị trí 1 - Hiển thị đầu tiên"
          : `Vị trí ${index + 1}`;
      })(),
    }));
  }, [bannerCount, initialData?.displayOrder, isEdit, otherBanners]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setErrors((current) => ({ ...current, image: undefined, submit: undefined }));
  };

  const handleMobileFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMobileImageFile(file);
    setMobilePreviewUrl(URL.createObjectURL(file));
    setMobileImageRemoved(false);
    setErrors((current) => ({ ...current, submit: undefined }));
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

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!previewUrl && !imageFile) {
      nextErrors.image = "Vui lòng chọn ảnh banner.";
    }

    if (!form.isActive) {
      nextErrors.isActive = "Vui lòng chọn trạng thái.";
    }

    if (!form.displayOrder) {
      nextErrors.displayOrder = "Vui lòng chọn vị trí.";
    }

    const parsedDisplayOrder = Number(form.displayOrder);
    if (
      form.displayOrder &&
      (!Number.isInteger(parsedDisplayOrder) || parsedDisplayOrder < 0)
    ) {
      nextErrors.displayOrder = "Vị trí hiển thị phải là số nguyên không âm.";
    }

    if (
      form.startDate &&
      form.endDate &&
      new Date(form.startDate) > new Date(form.endDate)
    ) {
      nextErrors.endDate = "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.";
    }

    setErrors(nextErrors);

    return {
      isValid: Object.keys(nextErrors).length === 0,
      parsedDisplayOrder,
    };
  };

  const submitForm = async (parsedDisplayOrder: number) => {
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
      setErrors((current) => ({
        ...current,
        submit: getErrorMessage(error as any) || "Lưu banner thất bại",
      }));
    } finally {
      setSaving(false);
      setPendingDisplayOrder(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const { isValid, parsedDisplayOrder } = validateForm();
    if (!isValid) {
      return;
    }

    await submitForm(parsedDisplayOrder);
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
            <Label className={fieldLabelClass}>
              Trạng thái <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={form.isActive || undefined}
              onValueChange={(value) => {
                setForm((current) => ({ ...current, isActive: value as FormState["isActive"] }));
                if (errors.isActive || errors.submit) {
                  setErrors((currentErrors) => ({
                    ...currentErrors,
                    isActive: undefined,
                    submit: undefined,
                  }));
                }
              }}
            >
              <SelectTrigger
                className={cn(
                  fieldControlClass,
                  "border-slate-200 bg-white",
                  errors.isActive && "border-rose-500 focus-visible:ring-rose-200",
                )}
              >
                <SelectValue placeholder="Chọn trạng thái" />
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
            {errors.isActive && (
              <p className="text-[11px] font-medium text-rose-500">
                {errors.isActive}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className={fieldLabelClass}>
              Liên kết khi bấm vào banner
            </Label>
            <Input
              value={form.linkUrl}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  linkUrl: event.target.value,
                }));
                if (errors.submit) {
                  setErrors((currentErrors) => ({
                    ...currentErrors,
                    submit: undefined,
                  }));
                }
              }}
              placeholder="https://..."
              className={cn(fieldControlClass, "border-slate-200 bg-white")}
            />
          </div>

          <div className="space-y-1.5">
            <Label className={fieldLabelClass}>Vị trí hiển thị</Label>
            <Select
              value={form.displayOrder || undefined}
              onValueChange={(value) => {
                const nextConflictingBanner =
                  otherBanners.find((banner) => banner.displayOrder === Number(value)) ?? null;

                setForm((current) => ({ ...current, displayOrder: value }));
                if (errors.displayOrder || errors.submit) {
                  setErrors((currentErrors) => ({
                    ...currentErrors,
                    displayOrder: undefined,
                    submit: undefined,
                  }));
                }
                if (nextConflictingBanner) {
                  setPreviousDisplayOrder(form.displayOrder);
                  setPendingDisplayOrder(Number(value));
                  setRestoreDisplayOrderOnClose(true);
                  setPositionConfirmOpen(true);
                } else {
                  setPreviousDisplayOrder("");
                  setPendingDisplayOrder(null);
                  setRestoreDisplayOrderOnClose(true);
                }
              }}
            >
              <SelectTrigger
                className={cn(
                  fieldControlClass,
                  "border-slate-200 bg-white",
                  errors.displayOrder &&
                    "border-rose-500 focus-visible:ring-rose-200",
                )}
              >
                <SelectValue placeholder="Chọn vị trí" />
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
            {errors.displayOrder && (
              <p className="text-[11px] font-medium text-rose-500">
                {errors.displayOrder}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className={fieldLabelClass}>Ngày bắt đầu</Label>
            <Input
              type="datetime-local"
              value={form.startDate}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  startDate: event.target.value,
                }));
                if (errors.endDate || errors.submit) {
                  setErrors((currentErrors) => ({
                    ...currentErrors,
                    endDate: undefined,
                    submit: undefined,
                  }));
                }
              }}
              className={cn(fieldControlClass, "border-slate-200 bg-white")}
            />
          </div>

          <div className="space-y-1.5">
            <Label className={fieldLabelClass}>Ngày kết thúc</Label>
            <Input
              type="datetime-local"
              value={form.endDate}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  endDate: event.target.value,
                }));
                if (errors.endDate || errors.submit) {
                  setErrors((currentErrors) => ({
                    ...currentErrors,
                    endDate: undefined,
                    submit: undefined,
                  }));
                }
              }}
              className={cn(
                fieldControlClass,
                "border-slate-200 bg-white",
                errors.endDate && "border-rose-500 focus-visible:ring-rose-200",
              )}
            />
            {errors.endDate && (
              <p className="text-[11px] font-medium text-rose-500">
                {errors.endDate}
              </p>
            )}
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
                  errors.image && "border-rose-500 text-rose-500 hover:border-rose-500 hover:text-rose-500",
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
            {errors.image && (
              <p className="text-[11px] font-medium text-rose-500">
                {errors.image}
              </p>
            )}
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {errors.submit && (
              <p className="text-[11px] font-medium text-rose-500">
                {errors.submit}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
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
      </div>

      <AlertDialog
        open={positionConfirmOpen}
        onOpenChange={(open) => {
          setPositionConfirmOpen(open);
          if (!open) {
            if (restoreDisplayOrderOnClose) {
              setForm((current) => ({ ...current, displayOrder: previousDisplayOrder }));
            }
            setPendingDisplayOrder(null);
            setPreviousDisplayOrder("");
            setRestoreDisplayOrderOnClose(true);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-amber-600">
              Xác nhận đổi vị trí banner
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] font-medium text-slate-500">
              Vị trí {pendingDisplayOrder !== null ? pendingDisplayOrder + 1 : ""} hiện đang có{" "}
              <strong>{conflictingBanner?.title || "một banner khác"}</strong>.
              Khi xác nhận, hệ thống sẽ tự sắp xếp lại vị trí các banner để không bị trùng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 text-[13px] font-medium">
              Chọn lại vị trí
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                if (pendingDisplayOrder === null) {
                  setPositionConfirmOpen(false);
                  return;
                }
                setRestoreDisplayOrderOnClose(false);
                setPreviousDisplayOrder("");
                setPendingDisplayOrder(null);
                setPositionConfirmOpen(false);
              }}
              className="h-9 bg-amber-500 text-[13px] font-medium text-white hover:bg-amber-600"
            >
              Xác nhận sắp xếp lại
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}

