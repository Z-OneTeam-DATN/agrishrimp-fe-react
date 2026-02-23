"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  Plus,
  Trash2,
  Save,
  ChevronLeft,
  Camera,
  Upload,
  AlertCircle,
  FileText,
  Layers,
  Loader2,
  ChevronDown,
  ArrowRightLeft,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AdminProductSchema, AdminProductForm } from "@/app/types/admin.schema";
import { RichTextEditor } from "@/components/admin/shared/RichTextEditor";
import { ProductService } from "@/app/services/product.service";
import { useAuthStore } from "@/stores/useAuthStore";

const DEFAULT_UNIT_CONVERSION = { fromUnit: "", toUnit: "", rate: "" };

const DEFAULT_VARIANT = {
  sku: "",
  barcode: "",
  formulation: "",
  packaging: "",
  unit: "",
  costPrice: undefined as any,
  price: undefined as any,
  wholesalePrice: undefined as any,
  initialStock: undefined as any,
  unitConversions: [] as any[],
};

export default function AddProductPage() {
  const router = useRouter();
  const mainImagesRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Tách quản lý ảnh ra ngoài form vì cần File objects thực sự để upload
  const [productImageFiles, setProductImageFiles] = useState<File[]>([]);
  const [productImagePreviews, setProductImagePreviews] = useState<string[]>([]);
  const [variantImageFiles, setVariantImageFiles] = useState<(File | null)[]>([null]);
  const [variantImagePreviews, setVariantImagePreviews] = useState<string[]>([""]);

  // Dữ liệu dropdown
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  const { isLoadingAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          ProductService.getCategories(),
          ProductService.getBrands(),
        ]);
        setCategories(catRes || []);
        setBrands(brandRes?.map((b: any) => b.name) || []);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu form:", error);
        toast.error("Lỗi kết nối tới máy chủ khi tải dữ liệu.");
      }
    };

    if (!isLoadingAuth && isAuthenticated) {
      fetchDropdownData();
    }
  }, [isLoadingAuth, isAuthenticated]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(AdminProductSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      categoryId: "",
      brand: "",
      origin: "",
      baseSku: "",
      description: "",
      status: "ACTIVE",
      variants: [{ ...DEFAULT_VARIANT }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "variants" });

  // ──────────────────────────────────────────
  // XỬ LÝ ẢNH SẢN PHẨM CHÍNH
  // ──────────────────────────────────────────
  const handleMainImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const previews = files.map((f) => URL.createObjectURL(f));
      setProductImageFiles((prev) => [...prev, ...files]);
      setProductImagePreviews((prev) => [...prev, ...previews]);
    }
  };

  const removeMainImage = (idx: number) => {
    setProductImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setProductImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // ──────────────────────────────────────────
  // XỬ LÝ ẢNH BIẾN THỂ
  // ──────────────────────────────────────────
  const handleVariantImageChange = (variantIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setVariantImageFiles((prev) => {
        const next = [...prev];
        next[variantIndex] = file;
        return next;
      });
      setVariantImagePreviews((prev) => {
        const next = [...prev];
        next[variantIndex] = preview;
        return next;
      });
    }
  };

  // ──────────────────────────────────────────
  // THÊM / XÓA BIẾN THỂ
  // ──────────────────────────────────────────
  const handleAppendVariant = () => {
    append({ ...DEFAULT_VARIANT });
    setVariantImageFiles((prev) => [...prev, null]);
    setVariantImagePreviews((prev) => [...prev, ""]);
  };

  const handleRemoveVariant = (idx: number) => {
    remove(idx);
    setVariantImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setVariantImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // ──────────────────────────────────────────
  // QUẢN LÝ QUY ĐỔI ĐƠN VỊ PER VARIANT
  // ──────────────────────────────────────────
  const addUnitConversion = (variantIndex: number) => {
    const current = getValues(`variants.${variantIndex}.unitConversions`) || [];
    setValue(`variants.${variantIndex}.unitConversions`, [
      ...current,
      { ...DEFAULT_UNIT_CONVERSION },
    ]);
  };

  const removeUnitConversion = (variantIndex: number, convIdx: number) => {
    const current = [...(getValues(`variants.${variantIndex}.unitConversions`) || [])];
    current.splice(convIdx, 1);
    setValue(`variants.${variantIndex}.unitConversions`, current);
  };

  // ──────────────────────────────────────────
  // SUBMIT
  // ──────────────────────────────────────────
  const onSubmit = async (data: any) => {
    if (productImageFiles.length === 0) {
      toast.error("Vui lòng tải lên ít nhất 1 hình ảnh sản phẩm.");
      return;
    }

    try {
      setIsLoading(true);

      const jsonPayload = {
        name: data.name,
        categoryId: Number(data.categoryId),
        brand: data.brand,
        origin: data.origin,
        baseSku: data.baseSku || "",
        description: data.description || "",
        status: data.status,
        variants: data.variants.map((v: any) => ({
          sku: v.sku,
          formulation: v.formulation,
          packaging: v.packaging,
          unit: v.unit,
          costPrice: Number(v.costPrice || 0),
          price: Number(v.price || 0),
          wholesalePrice: Number(v.wholesalePrice || 0),
          initialStock: Number(v.initialStock || 0),
          unitConversions: (v.unitConversions || [])
            .filter((uc: any) => uc.fromUnit && uc.toUnit)
            .map((uc: any) => ({
              fromUnit: uc.fromUnit,
              toUnit: uc.toUnit,
              rate: Number(uc.rate || 1),
            })),
        })),
      };

      const formData = new FormData();
      formData.append(
        "data",
        new Blob([JSON.stringify(jsonPayload)], { type: "application/json" }),
      );

      productImageFiles.forEach((file) => {
        formData.append("productImages", file);
      });

      data.variants.forEach((_: any, idx: number) => {
        if (variantImageFiles[idx]) {
          formData.append("variantImages", variantImageFiles[idx] as File);
        }
      });

      await ProductService.create(formData);
      toast.success("Đã tạo sản phẩm thành công!");
      router.push("/admin/products");
    } catch (error: any) {
      const res = error.response?.data;
      if (res?.fieldErrors) {
        const details = Object.entries(res.fieldErrors)
          .map(([field, msg]) => `- ${field}: ${msg}`)
          .join("\n");
        toast.error(
          <div className="text-left">
            <p className="font-bold mb-1">{res.title || "Dữ liệu không hợp lệ:"}</p>
            <pre className="text-xs whitespace-pre-wrap">{details}</pre>
          </div>,
          { duration: 10000 },
        );
      } else {
        toast.error(res?.message || res?.detail || "Có lỗi không xác định từ máy chủ.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-[100px] bg-slate-50/30 p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2 px-1">
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
          Thiết lập sản phẩm mới
        </h1>
        <div className="ms-auto">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8 text-slate-400"
          >
            <X size={20} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ─── CỘT TRÁI (9/12) ─── */}
        <div className="lg:col-span-9 space-y-5">

          {/* 1. Thông tin sản phẩm chính */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <AlertCircle size={16} /> 1. Thông tin sản phẩm chính
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              {/* Tên sản phẩm */}
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  Tên sản phẩm *
                </Label>
                <Input
                  {...register("name")}
                  className="h-[34px] text-[13px] border-[#ccc] rounded-none focus-visible:ring-emerald-500/20 shadow-none"
                />
                {errors.name && (
                  <p className="text-[11px] text-rose-500">{errors.name.message as string}</p>
                )}
              </div>

              {/* Danh mục */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  Danh mục *
                </Label>
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none">
                        <SelectValue placeholder="-- Chọn danh mục --" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.categoryId && (
                  <p className="text-[11px] text-rose-500">{errors.categoryId.message as string}</p>
                )}
              </div>

              {/* Thương hiệu */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  Thương hiệu
                </Label>
                <div className="flex gap-0">
                  <Input
                    {...register("brand")}
                    placeholder="Nhập hoặc chọn..."
                    className="h-[34px] border-[#ccc] rounded-none text-[13px] shadow-none w-full"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-[34px] w-[34px] p-0 border-[#ccc] border-l-0 rounded-none bg-[#f8f9fa]"
                      >
                        <ChevronDown size={14} className="text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-none min-w-[200px]">
                      {brands.map((b) => (
                        <DropdownMenuItem
                          key={b}
                          className="cursor-pointer text-[13px]"
                          onSelect={() => setValue("brand", b)}
                        >
                          {b}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Xuất xứ */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  Xuất xứ
                </Label>
                <Input
                  {...register("origin")}
                  className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none"
                />
              </div>

              {/* Mã SKU gốc */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  Mã SKU gốc
                </Label>
                <Input
                  {...register("baseSku")}
                  className="h-[34px] text-[13px] border-[#ccc] rounded-none font-mono shadow-none"
                />
              </div>
            </div>
          </div>

          {/* 2. Mô tả sản phẩm */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <FileText size={16} /> 2. Mô tả sản phẩm
            </div>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  minHeight="250px"
                  placeholder="Nhập nội dung mô tả chi tiết..."
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>

          {/* 3. Danh sách biến thể */}
          <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-[#eee] bg-[#f8f9fa] flex justify-between items-center">
              <h3 className="text-[11px] font-black text-slate-700 flex items-center gap-2 uppercase tracking-wider">
                <Layers size={16} className="text-emerald-600" /> 3. Danh sách biến thể (SKUs)
              </h3>
              <Button
                type="button"
                variant="outline"
                onClick={handleAppendVariant}
                className="h-[28px] text-[10px] font-black text-emerald-600 border-emerald-200 bg-white px-4 rounded-none hover:bg-emerald-50 shadow-sm"
              >
                <Plus size={14} className="mr-1" /> THÊM BIẾN THỂ
              </Button>
            </div>

            <div className="divide-y divide-slate-100">
              {fields.map((field, idx) => {
                const unitConversions = watch(`variants.${idx}.unitConversions`) || [];
                const variantImagePreview = variantImagePreviews[idx];

                return (
                  <div key={field.id} className="p-5 bg-white">
                    <div className="flex flex-col xl:flex-row gap-6">
                      {/* Ảnh biến thể */}
                      <div className="flex flex-col items-center shrink-0">
                        <div
                          onClick={() => document.getElementById(`v-img-${idx}`)?.click()}
                          className="w-[100px] h-[100px] border border-[#ddd] bg-white flex items-center justify-center cursor-pointer group hover:border-emerald-500 transition-all overflow-hidden relative"
                        >
                          {variantImagePreview ? (
                            <img
                              src={variantImagePreview}
                              className="w-full h-full object-cover"
                              alt={`Ảnh biến thể ${idx + 1}`}
                            />
                          ) : (
                            <Camera size={28} className="text-slate-200" />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Upload size={18} className="text-white" />
                          </div>
                        </div>
                        <input
                          type="file"
                          id={`v-img-${idx}`}
                          hidden
                          onChange={(e) => handleVariantImageChange(idx, e)}
                          accept="image/*"
                        />
                        <p className="text-[9px] font-black text-slate-400 mt-2 uppercase tracking-tighter text-center">
                          Ảnh SKU #{idx + 1}
                        </p>
                      </div>

                      {/* Các trường nhập */}
                      <div className="flex-1 space-y-5">

                        {/* Hàng 1: SKU + Barcode + Hành động */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                              Mã SKU *
                            </Label>
                            <Input
                              {...register(`variants.${idx}.sku`)}
                              className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none font-mono"
                            />
                            {(errors.variants as any)?.[idx]?.sku && (
                              <p className="text-[11px] text-rose-500">
                                {(errors.variants as any)[idx].sku.message as string}
                              </p>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                              Mã vạch / Barcode
                            </Label>
                            <Input
                              {...register(`variants.${idx}.barcode`)}
                              className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none font-mono"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-transparent select-none uppercase tracking-tight">
                              Thao tác
                            </Label>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleRemoveVariant(idx)}
                              className="h-[34px] w-full text-[11px] font-bold text-rose-500 border-rose-200 rounded-none hover:bg-rose-50"
                            >
                              <Trash2 size={13} className="mr-1" /> Xóa biến thể
                            </Button>
                          </div>
                        </div>

                        {/* Hàng 2: Dạng bào chế + Quy cách + Đơn vị */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                              Dạng bào chế *
                            </Label>
                            <Input
                              {...register(`variants.${idx}.formulation`)}
                              placeholder="VD: Viên nén, Bột, Dung dịch..."
                              className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none"
                            />
                            {(errors.variants as any)?.[idx]?.formulation && (
                              <p className="text-[11px] text-rose-500">
                                {(errors.variants as any)[idx].formulation.message as string}
                              </p>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                              Quy cách đóng gói *
                            </Label>
                            <Input
                              {...register(`variants.${idx}.packaging`)}
                              placeholder="VD: Hộp 100 viên, Chai 1L..."
                              className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none"
                            />
                            {(errors.variants as any)?.[idx]?.packaging && (
                              <p className="text-[11px] text-rose-500">
                                {(errors.variants as any)[idx].packaging.message as string}
                              </p>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                              Đơn vị tính *
                            </Label>
                            <Input
                              {...register(`variants.${idx}.unit`)}
                              placeholder="VD: Viên, Chai, Hộp, Kg..."
                              className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none"
                            />
                            {(errors.variants as any)?.[idx]?.unit && (
                              <p className="text-[11px] text-rose-500">
                                {(errors.variants as any)[idx].unit.message as string}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Hàng 3: Giá */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-blue-600 uppercase tracking-tight">
                              Giá vốn (nhập) *
                            </Label>
                            <div className="relative">
                              <Input
                                type="number"
                                min={0}
                                {...register(`variants.${idx}.costPrice`)}
                                className="h-[34px] border-[#ccc] rounded-none text-right text-[13px] shadow-none font-bold text-blue-600 bg-blue-50/20"
                              />
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-300">
                                ₫
                              </span>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">
                              Giá bán lẻ *
                            </Label>
                            <div className="relative">
                              <Input
                                type="number"
                                min={0}
                                {...register(`variants.${idx}.price`)}
                                className="h-[34px] border-[#ccc] rounded-none text-right text-[13px] shadow-none font-black text-emerald-700"
                              />
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">
                                ₫
                              </span>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-orange-600 uppercase tracking-tight">
                              Giá bán sỉ
                            </Label>
                            <div className="relative">
                              <Input
                                type="number"
                                min={0}
                                {...register(`variants.${idx}.wholesalePrice`)}
                                className="h-[34px] border-[#ccc] rounded-none text-right text-[13px] shadow-none font-bold text-orange-600"
                              />
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-orange-300">
                                ₫
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Hàng 4: Tồn kho */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                              Tồn kho khởi tạo
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              {...register(`variants.${idx}.initialStock`)}
                              className="h-[34px] border-[#ccc] rounded-none text-right text-[13px] shadow-none font-bold"
                            />
                          </div>
                        </div>

                        {/* Hàng 5: Quy đổi đơn vị */}
                        <div className="border border-slate-200 bg-slate-50/50 p-4">
                          <div className="flex justify-between items-center mb-3">
                            <Label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                              <ArrowRightLeft size={13} className="text-purple-500" />
                              Quy đổi đơn vị
                            </Label>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => addUnitConversion(idx)}
                              className="h-[24px] text-[10px] font-bold text-purple-600 hover:bg-purple-50 px-2 rounded-none"
                            >
                              + Thêm quy đổi
                            </Button>
                          </div>

                          {unitConversions.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic py-1">
                              Chưa có quy đổi. VD: 1 Hộp = 100 Viên
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {unitConversions.map((uc: any, convIdx: number) => (
                                <div key={convIdx} className="flex items-center gap-2">
                                  <Input
                                    {...register(`variants.${idx}.unitConversions.${convIdx}.fromUnit`)}
                                    placeholder="Từ đơn vị (VD: Hộp)"
                                    className="h-[30px] border-[#ccc] rounded-none text-[12px] shadow-none bg-white flex-1"
                                  />
                                  <span className="text-[11px] text-slate-400 font-bold shrink-0">=</span>
                                  <Input
                                    {...register(`variants.${idx}.unitConversions.${convIdx}.rate`)}
                                    type="number"
                                    min={1}
                                    placeholder="Số lượng"
                                    className="h-[30px] border-[#ccc] rounded-none text-[12px] shadow-none bg-white w-[90px] text-right"
                                  />
                                  <Input
                                    {...register(`variants.${idx}.unitConversions.${convIdx}.toUnit`)}
                                    placeholder="Đến đơn vị (VD: Viên)"
                                    className="h-[30px] border-[#ccc] rounded-none text-[12px] shadow-none bg-white flex-1"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeUnitConversion(idx, convIdx)}
                                    className="text-slate-300 hover:text-rose-500 p-1 shrink-0"
                                  >
                                    <X size={15} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── CỘT PHẢI (3/12) ─── */}
        <div className="lg:col-span-3 space-y-5">
          {/* Album ảnh sản phẩm */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <Label className="text-[11px] font-black text-slate-700 uppercase block mb-5 text-center tracking-widest border-b pb-3">
              Album hình ảnh *
            </Label>
            <div className="grid grid-cols-2 gap-3 mb-2">
              {productImagePreviews.map((src, i) => (
                <div
                  key={i}
                  className="relative aspect-square border border-[#eee] overflow-hidden group shadow-sm"
                >
                  <img src={src} className="w-full h-full object-cover" alt={`Ảnh ${i + 1}`} />
                  <button
                    type="button"
                    onClick={() => removeMainImage(i)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <div
                onClick={() => mainImagesRef.current?.click()}
                className="aspect-square border-2 border-dashed border-[#ddd] flex flex-col items-center justify-center bg-[#fcfcfc] hover:bg-emerald-50 cursor-pointer transition-colors group"
              >
                <Upload size={22} className="text-slate-300 group-hover:text-emerald-500 mb-1" />
                <span className="text-[9px] font-black text-slate-400 group-hover:text-emerald-600 uppercase tracking-tighter">
                  Tải ảnh lên
                </span>
              </div>
            </div>
            <input
              type="file"
              ref={mainImagesRef}
              multiple
              hidden
              onChange={handleMainImagesChange}
              accept="image/*"
            />
          </div>

          {/* Trạng thái */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <Label className="text-[11px] font-black text-slate-700 uppercase block mb-5 tracking-widest border-b pb-3">
              Trạng thái phát hành
            </Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-[38px] text-[13px] border-[#ccc] rounded-none font-black shadow-none focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="ACTIVE" className="text-emerald-600 font-bold">
                      ĐANG KINH DOANH
                    </SelectItem>
                    <SelectItem value="INACTIVE" className="text-rose-600 font-bold">
                      TẠM NGỪNG BÁN
                    </SelectItem>
                    <SelectItem value="DRAFT" className="text-slate-500 font-bold">
                      NHÁP
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[12px_30px] flex items-center justify-end gap-[15px] z-[999] shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="min-w-[110px] h-[38px] text-[12px] font-bold border-[#ccc] bg-white rounded-none shadow-sm hover:bg-slate-50 uppercase"
        >
          HỦY BỎ
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="min-w-[150px] h-[38px] text-[12px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-none shadow-md shadow-emerald-100 active:scale-[0.98] uppercase"
        >
          {isLoading ? (
            <Loader2 size={18} className="mr-2 animate-spin" />
          ) : (
            <Save size={18} className="mr-2" />
          )}
          LƯU DỮ LIỆU
        </Button>
      </div>
    </form>
  );
}
