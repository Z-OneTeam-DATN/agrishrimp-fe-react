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
  Tag,
  Scale,
  Check,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "@/components/admin/shared/RichTextEditor";
import { ProductService } from "@/app/services/product.service";
import { useAuthStore } from "@/stores/useAuthStore";
import { AttributeSuggestion } from "@/app/types/product.schema";

const DEFAULT_UNIT_CONVERSION = { fromUnit: "", toUnit: "", rate: 1 };
const DEFAULT_ATTRIBUTE = { name: "", value: "" };

const DEFAULT_VARIANT = {
  sku: "",
  barcode: "",
  formulation: "",
  packaging: "",
  unit: "",
  costPrice: 0,
  price: 0,
  wholesalePrice: 0,
  initialStock: 0,
  netWeight: 0,
  netWeightUnit: "g",
  shippingWeight: 0,
  attributes: [] as any[],
  unitConversions: [] as any[],
};

// ─── COMPONENT CON: CREATABLE COMBOBOX ───
interface CreatableComboboxProps {
  options: string[];
  value: string;
  onSelect: (val: string) => void;
  placeholder?: string;
  emptyLabel?: string;
}

function CreatableCombobox({ options, value, onSelect, placeholder = "Chọn...", emptyLabel = "Nhấn Enter để thêm mới" }: CreatableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full h-[34px] justify-between text-[13px] border-[#ccc] rounded-none px-3 font-normal bg-white"
        >
          {value || placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width] rounded-none" align="start">
        <Command className="rounded-none">
          <CommandInput 
            placeholder="Tìm kiếm hoặc gõ mới..." 
            className="h-9 text-[13px]" 
            value={inputValue}
            onValueChange={setInputValue}
            onKeyDown={(e) => {
              if (e.key === "Enter" && inputValue) {
                onSelect(inputValue);
                setOpen(false);
                setInputValue("");
              }
            }}
          />
          <CommandList>
            <CommandEmpty className="p-2 text-[12px]">
               <Button 
                variant="ghost" 
                className="w-full justify-start h-8 text-emerald-600 text-[12px] font-bold px-2"
                onClick={() => {
                  onSelect(inputValue);
                  setOpen(false);
                  setInputValue("");
                }}
              >
                + Thêm "{inputValue}"
              </Button>
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={(currentValue) => {
                    onSelect(currentValue);
                    setOpen(false);
                    setInputValue("");
                  }}
                  className="text-[13px]"
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option ? "opacity-100" : "opacity-0")} />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function AddProductPage() {
  const router = useRouter();
  const mainImagesRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [productImageFiles, setProductImageFiles] = useState<File[]>([]);
  const [productImagePreviews, setProductImagePreviews] = useState<string[]>([]);
  const [variantImageFiles, setVariantImageFiles] = useState<(File | null)[]>([null]);
  const [variantImagePreviews, setVariantImagePreviews] = useState<string[]>([""]);

  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [attributeSuggestions, setAttributeSuggestions] = useState<AttributeSuggestion[]>([]);

  const { isLoadingAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, brandRes, attrRes] = await Promise.all([
          ProductService.getCategories(),
          ProductService.getBrands(),
          ProductService.getAttributes(),
        ]);
        setCategories(catRes || []);
        setBrands(brandRes?.map((b: any) => b.name) || []);
        setAttributeSuggestions(attrRes || []);
      } catch (error) {
        console.error("Lỗi fetch metadata:", error);
      }
    };

    if (!isLoadingAuth && isAuthenticated) {
      fetchMetadata();
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
  // XỬ LÝ ẢNH
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
  // THÊM / XÓA FIELDS
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

  const addAttribute = (variantIndex: number) => {
    const current = getValues(`variants.${variantIndex}.attributes`) || [];
    setValue(`variants.${variantIndex}.attributes`, [...current, { ...DEFAULT_ATTRIBUTE }]);
  };

  const removeAttribute = (variantIndex: number, attrIdx: number) => {
    const current = [...(getValues(`variants.${variantIndex}.attributes`) || [])];
    current.splice(attrIdx, 1);
    setValue(`variants.${variantIndex}.attributes`, current);
  };

  const addUnitConversion = (variantIndex: number) => {
    const current = getValues(`variants.${variantIndex}.unitConversions`) || [];
    setValue(`variants.${variantIndex}.unitConversions`, [...current, { ...DEFAULT_UNIT_CONVERSION }]);
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
          barcode: v.barcode,
          formulation: v.formulation,
          packaging: v.packaging,
          unit: v.unit,
          costPrice: Number(v.costPrice || 0),
          price: Number(v.price || 0),
          wholesalePrice: Number(v.wholesalePrice || 0),
          initialStock: Number(v.initialStock || 0),
          netWeight: Number(v.netWeight || 0),
          netWeightUnit: v.netWeightUnit,
          shippingWeight: Number(v.shippingWeight || 0),
          attributes: (v.attributes || []).filter((a: any) => a.name && a.value),
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

      const res = await ProductService.create(formData);
      if (res.success) {
        toast.success(res.message || "Tạo sản phẩm thành công!");
        router.push("/admin/products");
      } else {
        toast.error(res.message);
      }
    } catch (error: any) {
      const res = error.response?.data;
      toast.error(res?.message || "Có lỗi khi lưu sản phẩm.");
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
           <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400">
            <X size={20} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-9 space-y-5">

          {/* 1. Thông tin sản phẩm chính */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <AlertCircle size={16} /> 1. Thông tin sản phẩm chính
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Tên sản phẩm *</Label>
                <Input {...register("name")} className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none" />
                {errors.name && <p className="text-[11px] text-rose-500">{errors.name.message as string}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Danh mục *</Label>
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
                          <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Thương hiệu - Creatable Combobox */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Thương hiệu</Label>
                <Controller
                  name="brand"
                  control={control}
                  render={({ field }) => (
                    <CreatableCombobox 
                      options={brands} 
                      value={field.value} 
                      onSelect={field.onChange} 
                      placeholder="Chọn hoặc nhập thương hiệu..."
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Xuất xứ</Label>
                <Input {...register("origin")} className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Mã SKU gốc</Label>
                <Input {...register("baseSku")} className="h-[34px] text-[13px] border-[#ccc] rounded-none font-mono shadow-none" />
              </div>
            </div>
          </div>

          {/* 2. Mô tả */}
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
              <Button type="button" variant="outline" onClick={handleAppendVariant} className="h-[28px] text-[10px] font-black text-emerald-600 border-emerald-200 bg-white px-4 rounded-none shadow-sm uppercase">
                + THÊM BIẾN THỂ
              </Button>
            </div>

            <div className="divide-y divide-slate-100">
              {fields.map((field, idx) => {
                const attributes = watch(`variants.${idx}.attributes`) || [];
                const conversions = watch(`variants.${idx}.unitConversions`) || [];

                return (
                  <div key={field.id} className="p-5 bg-white border-b-4 border-slate-50 last:border-0">
                    <div className="flex flex-col xl:flex-row gap-8">
                      {/* Ảnh SKU */}
                      <div className="flex flex-col items-center shrink-0">
                        <div
                          onClick={() => document.getElementById(`v-img-${idx}`)?.click()}
                          className="w-[120px] h-[120px] border border-[#ddd] bg-white flex items-center justify-center cursor-pointer group hover:border-emerald-500 transition-all overflow-hidden relative shadow-sm"
                        >
                          {variantImagePreviews[idx] ? (
                            <img src={variantImagePreviews[idx]} className="w-full h-full object-cover" alt="SKU" />
                          ) : (
                            <Camera size={32} className="text-slate-200" />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Upload size={18} className="text-white" />
                          </div>
                        </div>
                        <input type="file" id={`v-img-${idx}`} hidden onChange={(e) => handleVariantImageChange(idx, e)} accept="image/*" />
                        <p className="text-[9px] font-black text-slate-400 mt-2 uppercase tracking-tighter">Ảnh SKU #{idx + 1}</p>
                      </div>

                      {/* Fields */}
                      <div className="flex-1 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase">Mã SKU *</Label>
                            <Input {...register(`variants.${idx}.sku`)} className="h-[34px] border-[#ccc] rounded-none font-mono text-[13px]" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase">Mã vạch</Label>
                            <Input {...register(`variants.${idx}.barcode`)} className="h-[34px] border-[#ccc] rounded-none font-mono text-[13px]" />
                          </div>
                          <div className="flex items-end">
                            <Button type="button" variant="outline" onClick={() => handleRemoveVariant(idx)} className="h-[34px] w-full text-rose-500 border-rose-100 rounded-none text-[11px] font-bold uppercase hover:bg-rose-50">
                                <Trash2 size={14} className="mr-2" /> Xóa SKU này
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase">Dạng bào chế *</Label>
                            <Input {...register(`variants.${idx}.formulation`)} placeholder="VD: Bột, Viên..." className="h-[34px] border-[#ccc] rounded-none text-[13px]" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase">Quy cách *</Label>
                            <Input {...register(`variants.${idx}.packaging`)} placeholder="VD: Gói 1kg" className="h-[34px] border-[#ccc] rounded-none text-[13px]" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase">Đơn vị *</Label>
                            <Input {...register(`variants.${idx}.unit`)} placeholder="VD: Gói, Hộp" className="h-[34px] border-[#ccc] rounded-none text-[13px]" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                           <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-blue-600 uppercase">Giá vốn *</Label>
                            <Input type="number" {...register(`variants.${idx}.costPrice`)} className="h-[34px] border-[#ccc] rounded-none text-right font-bold text-blue-600 bg-blue-50/20" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-emerald-600 uppercase">Giá bán lẻ *</Label>
                            <Input type="number" {...register(`variants.${idx}.price`)} className="h-[34px] border-[#ccc] rounded-none text-right font-bold text-emerald-700" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-orange-600 uppercase">Giá sỉ</Label>
                            <Input type="number" {...register(`variants.${idx}.wholesalePrice`)} className="h-[34px] border-[#ccc] rounded-none text-right font-bold text-orange-600" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase">Tồn kho đầu</Label>
                            <Input type="number" {...register(`variants.${idx}.initialStock`)} className="h-[34px] border-[#ccc] rounded-none text-right font-bold" />
                          </div>
                        </div>

                        {/* Khối lượng vận chuyển */}
                        <div className="bg-slate-50 p-4 border border-slate-100 flex items-center gap-4">
                           <Scale size={20} className="text-slate-400" />
                           <div className="grid grid-cols-3 gap-4 flex-1">
                                <div className="space-y-1">
                                    <Label className="text-[9px] font-bold text-slate-500 uppercase">Khối lượng tịnh</Label>
                                    <Input type="number" {...register(`variants.${idx}.netWeight`)} className="h-[30px] border-[#ccc] rounded-none text-right" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[9px] font-bold text-slate-500 uppercase">Đơn vị KL</Label>
                                    <Select 
                                        defaultValue="g" 
                                        onValueChange={(val) => setValue(`variants.${idx}.netWeightUnit`, val)}
                                    >
                                        <SelectTrigger className="h-[30px] border-[#ccc] rounded-none text-[12px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-none">
                                            <SelectItem value="g">Gram (g)</SelectItem>
                                            <SelectItem value="kg">Kilogram (kg)</SelectItem>
                                            <SelectItem value="ml">Mililit (ml)</SelectItem>
                                            <SelectItem value="l">Lít (l)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[9px] font-bold text-slate-500 uppercase">Cân nặng (+bao bì)</Label>
                                    <Input type="number" {...register(`variants.${idx}.shippingWeight`)} className="h-[30px] border-[#ccc] rounded-none text-right" />
                                </div>
                           </div>
                        </div>

                        {/* Thuộc tính động - Tích hợp API Từ điển */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between border-b pb-1">
                                <Label className="text-[10px] font-black text-emerald-700 uppercase flex items-center gap-2">
                                    <Tag size={14} /> Thuộc tính bổ sung
                                </Label>
                                <Button type="button" variant="ghost" onClick={() => addAttribute(idx)} className="h-6 text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 px-2 rounded-none">
                                    + Thêm thuộc tính
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {attributes.map((attr: any, attrIdx: number) => {
                                    const selectedSuggestion = attributeSuggestions.find(s => s.name === attr.name);
                                    const availableValues = selectedSuggestion?.values || [];

                                    return (
                                        <div key={attrIdx} className="flex gap-2">
                                            {/* Tên thuộc tính - Creatable Combobox */}
                                            <div className="flex-1">
                                                <Controller
                                                    name={`variants.${idx}.attributes.${attrIdx}.name`}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <CreatableCombobox 
                                                            options={attributeSuggestions.map(s => s.name)} 
                                                            value={field.value} 
                                                            onSelect={(val) => {
                                                                field.onChange(val);
                                                                // Xóa giá trị cũ khi đổi tên thuộc tính
                                                                setValue(`variants.${idx}.attributes.${attrIdx}.value`, "");
                                                            }} 
                                                            placeholder="Tên thuộc tính (VD: Màu sắc)"
                                                        />
                                                    )}
                                                />
                                            </div>
                                            {/* Giá trị thuộc tính - Creatable Combobox (Lọc theo tên) */}
                                            <div className="flex-1">
                                                <Controller
                                                    name={`variants.${idx}.attributes.${attrIdx}.value`}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <CreatableCombobox 
                                                            options={availableValues} 
                                                            value={field.value} 
                                                            onSelect={field.onChange} 
                                                            placeholder="Giá trị (VD: Xanh, Đỏ...)"
                                                            emptyLabel="Gõ để thêm giá trị mới"
                                                        />
                                                    )}
                                                />
                                            </div>
                                            <Button type="button" variant="ghost" onClick={() => removeAttribute(idx, attrIdx)} className="h-[34px] w-8 p-0 text-slate-300 hover:text-rose-500">
                                                <X size={16} />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quy đổi đơn vị */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between border-b pb-1">
                                <Label className="text-[10px] font-black text-purple-700 uppercase flex items-center gap-2">
                                    <ArrowRightLeft size={14} /> Quy đổi đơn vị
                                </Label>
                                <Button type="button" variant="ghost" onClick={() => addUnitConversion(idx)} className="h-6 text-[10px] font-bold text-purple-600 hover:bg-purple-50 px-2 rounded-none">
                                    + Thêm quy đổi
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {conversions.map((uc: any, convIdx: number) => (
                                    <div key={convIdx} className="flex items-center gap-2">
                                        <Input {...register(`variants.${idx}.unitConversions.${convIdx}.fromUnit`)} placeholder="Từ (Thùng)" className="h-[30px] border-[#ccc] rounded-none text-[12px] flex-1" />
                                        <span className="text-[11px] font-bold text-slate-400">=</span>
                                        <Input type="number" {...register(`variants.${idx}.unitConversions.${convIdx}.rate`)} placeholder="Số lượng" className="h-[30px] border-[#ccc] rounded-none text-[12px] w-[80px] text-right" />
                                        <Input {...register(`variants.${idx}.unitConversions.${convIdx}.toUnit`)} placeholder="Đến (Gói)" className="h-[30px] border-[#ccc] rounded-none text-[12px] flex-1" />
                                        <Button type="button" variant="ghost" onClick={() => removeUnitConversion(idx, convIdx)} className="h-8 w-8 p-0 text-slate-300 hover:text-rose-500">
                                            <X size={16} />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (3/12) */}
        <div className="lg:col-span-3 space-y-5">
           <div className="bg-white border border-[#dcdcdc] p-5 rounded-none shadow-sm">
            <Label className="text-[11px] font-black text-slate-700 uppercase block mb-5 text-center tracking-widest border-b pb-3">Album hình ảnh *</Label>
            <div className="grid grid-cols-2 gap-3">
              {productImagePreviews.map((src, i) => (
                <div key={i} className="relative aspect-square border border-[#eee] group overflow-hidden shadow-sm">
                  <img src={src} className="w-full h-full object-cover" alt="Product" />
                  <button type="button" onClick={() => removeMainImage(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={12} />
                  </button>
                </div>
              ))}
              <div onClick={() => mainImagesRef.current?.click()} className="aspect-square border-2 border-dashed border-[#ddd] flex flex-col items-center justify-center bg-[#fcfcfc] hover:bg-emerald-50 cursor-pointer transition-colors group">
                <Upload size={20} className="text-slate-300 group-hover:text-emerald-500 mb-1" />
                <span className="text-[9px] font-black text-slate-400 group-hover:text-emerald-600 uppercase">Tải ảnh</span>
              </div>
            </div>
            <input type="file" ref={mainImagesRef} multiple hidden onChange={handleMainImagesChange} accept="image/*" />
          </div>

          <div className="bg-white border border-[#dcdcdc] p-5 rounded-none shadow-sm">
            <Label className="text-[11px] font-black text-slate-700 uppercase block mb-5 tracking-widest border-b pb-3">Trạng thái phát hành</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-[38px] text-[13px] border-[#ccc] rounded-none font-black shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="ACTIVE" className="text-emerald-600 font-bold">ĐANG KINH DOANH</SelectItem>
                    <SelectItem value="INACTIVE" className="text-rose-600 font-bold">TẠM NGỪNG BÁN</SelectItem>
                    <SelectItem value="DRAFT" className="text-slate-500 font-bold">LƯU NHÁP</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-white border-t border-[#ddd] p-[12px_30px] flex items-center justify-end gap-[15px] z-[999] shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        <Button type="button" variant="outline" onClick={() => router.back()} className="min-w-[100px] h-[38px] text-[12px] font-bold border-[#ccc] rounded-none uppercase">HỦY BỎ</Button>
        <Button type="submit" disabled={isLoading} className="min-w-[160px] h-[38px] text-[12px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-none shadow-md uppercase">
          {isLoading ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Save size={18} className="mr-2" />}
          TẠO SẢN PHẨM
        </Button>
      </div>
    </form>
  );
}
