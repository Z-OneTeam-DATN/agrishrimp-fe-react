"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Upload, X } from "lucide-react";
import {
  createCategory,
  getCategoryById,
  getCategories,
  updateCategory,
  type CategoryPayload,
} from "@/app/services/CategoryService";
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
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";

interface Category {
  id: number;
  name: string;
  status: string;
  imageUrl?: string;
  parentId: number | null;
}

type CategoryApiError = {
  response?: {
    data?: {
      detail?: string;
      message?: string;
      statusCode?: string;
    } | string;
    status?: number;
  };
};

const CATEGORY_NAME_MIN = 2;
const CATEGORY_NAME_MAX = 100;

export default function AddCategoryPage() {
  const router = useRouter();
  const { hasPermission, isLoadingAuth } = usePermissions();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [modeResolved, setModeResolved] = useState(false);
  const [parentList, setParentList] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("none");
  const [status, setStatus] = useState("ACTIVE");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFileName, setImageFileName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [nameError, setNameError] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = editingId !== null;
  const requiredPermission = isEdit ? P.CATEGORY_UPDATE : P.CATEGORY_CREATE;

  const fieldLabelClass = "text-[10.5px] font-semibold text-slate-500";
  const fieldControlClass =
    "h-[38px] text-[13px] font-normal text-slate-800 shadow-none placeholder:text-slate-400";
  const sectionCardClass = "border border-slate-200 bg-white p-6 shadow-sm";
  const sectionTitleClass = "text-[11px] font-bold text-slate-800";

  const validateCategoryName = useCallback((value: string) => {
    const trimmed = value.trim();

    if (!trimmed) return "Tên danh mục không được để trống!";
    if (trimmed.length < CATEGORY_NAME_MIN) {
      return `Tên danh mục phải có ít nhất ${CATEGORY_NAME_MIN} ký tự`;
    }
    if (trimmed.length > CATEGORY_NAME_MAX) {
      return `Tên danh mục quá dài (tối đa ${CATEGORY_NAME_MAX} ký tự)`;
    }

    return "";
  }, []);

  useEffect(() => {
    const rawId = new URLSearchParams(window.location.search).get("id");
    setEditingId(rawId && /^\d+$/.test(rawId) ? Number(rawId) : null);
    setModeResolved(true);
  }, []);

  useEffect(() => {
    if (modeResolved && !isLoadingAuth && !hasPermission(requiredPermission)) {
      router.push("/admin/forbidden");
    }
  }, [hasPermission, isLoadingAuth, modeResolved, requiredPermission, router]);

  useEffect(() => {
    if (
      !modeResolved ||
      isLoadingAuth ||
      !hasPermission(requiredPermission)
    ) {
      return;
    }

    const loadData = async () => {
      setLoadingData(true);
      try {
        const categories = await getCategories();
        setParentList(Array.isArray(categories) ? categories : []);

        if (editingId !== null) {
          const category = await getCategoryById(editingId);
          if (!category) {
            toast.error("Không tìm thấy danh mục cần cập nhật");
            router.push("/admin/categories");
            return;
          }

          setName(category.name ?? "");
          setParentId(
            category.parentId === null ? "none" : String(category.parentId),
          );
          setStatus(category.status === "INACTIVE" ? "INACTIVE" : "ACTIVE");
          setImageUrl(category.imageUrl ?? "");
          setImageFileName(
            category.imageUrl
              ? decodeURIComponent(
                  category.imageUrl.split("?")[0].split("/").pop() ||
                    "Ảnh hiện tại",
                )
              : "",
          );
        }
      } catch {
        toast.error(
          isEdit
            ? "Không thể tải thông tin danh mục"
            : "Không thể tải danh sách danh mục",
        );
        if (isEdit) router.push("/admin/categories");
      } finally {
        setLoadingData(false);
      }
    };

    void loadData();
  }, [
    editingId,
    hasPermission,
    isEdit,
    isLoadingAuth,
    modeResolved,
    requiredPermission,
    router,
  ]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    setImageFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setNameTouched(true);
    const inlineNameError = validateCategoryName(name);
    if (inlineNameError) {
      setNameError(inlineNameError);
      return;
    }
    setNameError("");

    setSaving(true);
    try {
      const payload: CategoryPayload = {
        name: name.trim(),
        parentId: parentId === "none" ? null : Number(parentId),
        status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        imageUrl,
      };

      if (editingId !== null) {
        await updateCategory(editingId, payload);
        toast.success("Cập nhật danh mục thành công");
      } else {
        await createCategory(payload);
        toast.success("Thêm danh mục mới thành công");
      }
      router.push("/admin/categories");
      router.refresh();
    } catch (error: unknown) {
      const apiError = error as CategoryApiError;
      const responseData = apiError.response?.data;
      let serverMsg = "Có lỗi xảy ra khi lưu danh mục";

      if (typeof responseData === "string") {
        serverMsg = responseData;
      } else if (responseData?.detail) {
        serverMsg = responseData.detail;
      } else if (responseData?.message) {
        serverMsg = responseData.message;
      }

      const httpStatus = apiError.response?.status;
      const bodyStatus =
        typeof responseData === "string" ? undefined : responseData?.statusCode;
      const isDuplicate =
        httpStatus === 409 ||
        (typeof bodyStatus === "string" && bodyStatus.includes("409")) ||
        serverMsg.toLowerCase().includes("tồn tại") ||
        serverMsg.toLowerCase().includes("already exists");

      if (isDuplicate) {
        setNameError(serverMsg);
      } else {
        toast.error(serverMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  const realtimeNameError = nameTouched ? validateCategoryName(name) : "";

  return (
    <div className="space-y-3">
      <div className="mt-2 mb-8 space-y-4 px-1">
        <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
          {isEdit ? "Cập nhật danh mục" : "Thêm danh mục mới"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 px-1 pb-[100px] text-slate-800">
        <div className={sectionCardClass}>
          <div className="border-b border-slate-200 pb-3">
            <span className={sectionTitleClass}>1. Thông tin danh mục</span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="space-y-1.5 md:col-span-6">
              <Label className={fieldLabelClass}>
                Tên danh mục <span className="text-rose-500 normal-case">*</span>
              </Label>
              <Input
                value={name}
                onChange={(event) => {
                  setNameTouched(true);
                  setName(event.target.value);
                  setNameError("");
                }}
                onBlur={() => setNameTouched(true)}
                placeholder="VD: Thuốc thú y, Thức ăn..."
                className={cn(
                  fieldControlClass,
                  "border-slate-200 bg-white",
                  (realtimeNameError || nameError) &&
                    "border-red-500 focus-visible:ring-red-200",
                )}
              />
              {(realtimeNameError || nameError) && (
                <p className="text-[11px] font-semibold text-red-500">
                  {realtimeNameError || nameError}
                </p>
              )}
            </div>

            <div className="space-y-1.5 md:col-span-6">
              <Label className={fieldLabelClass}>Danh mục cha</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger className={cn(fieldControlClass, "border-slate-200 bg-white")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-[13px]">
                    Danh mục gốc
                  </SelectItem>
                  {parentList
                    .filter((category) => category.id !== editingId)
                    .map((category) => (
                    <SelectItem
                      key={category.id}
                      value={String(category.id)}
                      className="text-[13px]"
                    >
                      {category.name}
                    </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:col-span-6">
              <Label className={fieldLabelClass}>Ảnh đại diện</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                aria-label="Tải ảnh danh mục lên"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    fieldControlClass,
                    "flex min-w-0 flex-1 items-center justify-start rounded-[4px] border border-slate-200 bg-white px-3 text-left text-slate-500 transition-colors hover:border-emerald-300 hover:text-emerald-600",
                  )}
                >
                  <Upload size={14} className="mr-2 shrink-0" />
                  <span className="truncate">
                    {imageFileName || (imageUrl ? "Đã có ảnh đại diện" : "Chọn ảnh đại diện...")}
                  </span>
                </button>
                {imageUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoveImage}
                    className="h-[38px] shrink-0 rounded-[4px] border-slate-200 px-3 text-[12px] text-slate-500"
                  >
                    <X size={12} />
                  </Button>
                )}
              </div>

              {imageUrl && (
                <div className="mt-3 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                  <Image
                    src={imageUrl}
                    alt="Ảnh danh mục"
                    width={112}
                    height={112}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5 md:col-span-6">
              <Label className={fieldLabelClass}>Trạng thái</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger
                  className={cn(
                    fieldControlClass,
                    "border-slate-200 bg-white font-semibold",
                    status === "ACTIVE" ? "text-emerald-600" : "text-amber-600",
                  )}
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
              disabled={saving || loadingData || !modeResolved}
              className="h-10 min-w-[160px] rounded-md bg-emerald-600 px-6 text-[13px] font-semibold text-white hover:bg-emerald-700"
            >
              {saving || loadingData ? (
                <Loader2 className="mr-2 animate-spin" size={16} />
              ) : (
                <Save size={16} className="mr-2" />
              )}
              {isEdit ? "Cập nhật danh mục" : "Lưu danh mục"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
