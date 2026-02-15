"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCategory,
  getCategoryById,
  updateCategory,
  getCategories,
} from "@/app/services/CategoryService";
import {
  X,
  Settings,
  HelpCircle,
  Save,
  ChevronLeft,
  Tag,
  AlertCircle,
  Camera,
  Loader2,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AdminCategorySchema,
  AdminCategoryForm,
} from "@/app/types/admin.schema";

export default function AddCategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [parentList, setParentList] = useState<any[]>([]);

  const idFromUrl = searchParams.get("id");
  const isEditMode = Boolean(idFromUrl);
  const categoryId = Number(idFromUrl);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AdminCategoryForm>({
    resolver: zodResolver(AdminCategorySchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      parentId: "none",
      description: "",
      status: "show",
      image: "",
    },
  });

  const thumbnailPreview = watch("image");

  useEffect(() => {
    const fetchParentCategories = async () => {
      try {
        const allCategories = await getCategories();
        const validParents = allCategories.filter((cat: any) => {
          const isNotSelf = isEditMode ? cat.id !== categoryId : true;
          const isRoot = !cat.parentId;

          return isNotSelf && isRoot;
        });

        setParentList(validParents);
      } catch (error) {
        console.error("Lỗi lấy danh mục cha:", error);
      }
    };
    fetchParentCategories();
  }, [isEditMode, categoryId]);

  useEffect(() => {
    if (isEditMode && categoryId) {
      const fetchCategory = async () => {
        try {
          setIsLoading(true);
          const data = await getCategoryById(categoryId);

          reset({
            name: data.name,
            description: data.description || "",
            image: data.imageUrl || "",
            status: data.status === "ACTIVE" ? "show" : "hide",
            parentId:
              data.parentId && data.parentId !== 0
                ? String(data.parentId)
                : "none",
          });
        } catch (error) {
          console.error(error);
          toast.error("Không tìm thấy dữ liệu danh mục!");
          router.push("/admin/categories");
        } finally {
          setIsLoading(false);
        }
      };
      fetchCategory();
    }
  }, [isEditMode, categoryId, reset, router]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setValue("image", event.target?.result as string, {
          shouldValidate: true,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: AdminCategoryForm) => {
    try {
      setIsLoading(true);
      const payload = {
        name: data.name,
        description: data.description,
        imageUrl: data.image,
        status: data.status === "show" ? "ACTIVE" : "INACTIVE",
        parentId: data.parentId === "none" ? null : Number(data.parentId),
      };

      if (isEditMode) {
        await updateCategory(categoryId, payload);
        toast.success("Cập nhật danh mục thành công!");
      } else {
        await createCategory(payload);
        toast.success("Thêm mới danh mục thành công!");
      }

      router.push("/admin/categories");
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditMode && isLoading && !thumbnailPreview) {
    return (
      <div className="flex flex-col items-center justify-center pt-20 gap-3 text-slate-500">
        <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
        <span className="text-sm font-medium">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pb-[100px]">
      <div className="flex items-center gap-4 mb-4 px-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-8 w-8 text-slate-400"
        >
          <ChevronLeft size={20} />
        </Button>
        <h1 className="text-[18px] font-black text-[#1f1f1f] tracking-tight uppercase">
          {isEditMode ? "Cập nhật danh mục" : "Thêm danh mục hàng hóa"}
        </h1>

        <div className="ms-auto flex items-center gap-3 text-gray-400">
          <Settings
            size={18}
            className="cursor-pointer hover:text-emerald-600 transition-colors"
          />
          <HelpCircle
            size={18}
            className="cursor-pointer hover:text-emerald-600 transition-colors"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8"
          >
            <X size={20} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-3">
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
              <Tag size={16} /> 1. Thông tin định danh danh mục
            </div>
            <div className="grid grid-cols-1 gap-y-6">
              <div className="space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                  Tên danh mục *
                </Label>
                <Input
                  {...register("name")}
                  placeholder="Ví dụ: Thuốc & Chế phẩm, Dụng cụ nuôi..."
                  className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] focus-visible:ring-emerald-500/20 shadow-none"
                />
                {errors.name && (
                  <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                  Danh mục cha
                </Label>
                <Controller
                  name="parentId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none">
                        <SelectValue placeholder="-- Chọn danh mục cấp trên --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value="none"
                          className="font-bold text-slate-500"
                        >
                          — Không có (Danh mục gốc) —
                        </SelectItem>

                        {parentList.map((parent) => (
                          <SelectItem key={parent.id} value={String(parent.id)}>
                            {parent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                  Mô tả danh mục *
                </Label>
                <Textarea
                  {...register("description")}
                  placeholder="Nhập mô tả ngắn gọn về nhóm sản phẩm này..."
                  className="min-h-[100px] text-[13px] border-[#ccc] rounded-[3px] shadow-none focus-visible:ring-emerald-500/20"
                />
                {errors.description && (
                  <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-2 text-slate-700 font-black text-[11px] uppercase tracking-wider">
              <AlertCircle size={16} className="text-amber-500" /> Lưu ý quản
              trị
            </div>
            <p className="text-[12px] text-slate-500 leading-relaxed">
              Việc phân loại danh mục chính xác giúp khách hàng dễ dàng tìm kiếm
              sản phẩm trên trang chủ và giúp hệ thống báo cáo doanh thu theo
              nhóm mặt hàng hiệu quả hơn.
            </p>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <Label className="text-[11px] font-bold text-slate-500 uppercase block mb-3 text-center tracking-widest">
              Ảnh đại diện nhóm *
            </Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative border-2 border-dashed rounded-[4px] h-48 flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden group shadow-inner",
                errors.image
                  ? "border-red-300 bg-red-50"
                  : "border-[#ddd] bg-[#fcfcfc] hover:bg-emerald-50 hover:border-emerald-300",
              )}
            >
              {thumbnailPreview ? (
                <img
                  src={thumbnailPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <Camera
                    size={32}
                    className={cn(
                      "mx-auto mb-2",
                      errors.image ? "text-red-300" : "text-slate-200",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[9px] font-bold uppercase tracking-tighter",
                      errors.image ? "text-red-400" : "text-slate-400",
                    )}
                  >
                    Nhấp để tải ảnh
                  </span>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleThumbnailChange}
                hidden
                accept="image/*"
              />
            </div>
            {errors.image && (
              <p className="text-[10px] text-red-500 font-bold text-center mt-2 uppercase">
                {errors.image.message}
              </p>
            )}
            <p className="text-[10px] text-slate-400 text-center italic mt-3 leading-tight">
              Kích thước gợi ý: 500x500px
            </p>
          </div>

          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <Label className="text-[11px] font-bold text-slate-500 uppercase block mb-3 tracking-widest">
              Thiết lập hiển thị
            </Label>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase">
                  Trạng thái hoạt động
                </Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] font-black text-emerald-600 shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="show">CHO PHÉP HIỂN THỊ</SelectItem>
                        <SelectItem value="hide">ĐANG ẨN</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[8px_20px] flex items-center justify-end gap-[10px] z-[999]">
        <Button
          type="button"
          variant="outline"
          className="min-w-[100px] h-[34px] text-[12px] font-bold border-[#ccc] bg-white rounded-[3px] shadow-sm"
          onClick={() => router.back()}
        >
          HỦY BỎ
        </Button>

        <Button
          type="submit"
          disabled={isLoading}
          className="min-w-[120px] h-[34px] text-[12px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-[3px] shadow-md shadow-emerald-100"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save size={16} className="mr-2" />
          )}
          {isEditMode ? "CẬP NHẬT" : "LƯU DỮ LIỆU"}
        </Button>
      </div>
    </form>
  );
}
