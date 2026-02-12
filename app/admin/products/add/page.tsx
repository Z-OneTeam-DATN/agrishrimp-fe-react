"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X, Settings, HelpCircle, Plus, Trash2, Save,
  ChevronLeft, Camera, Upload, AlertCircle,
  Settings2, ChevronDown, ChevronUp, FileText, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AdminProductSchema, AdminProductForm } from "@/app/types/admin.schema";
import { RichTextEditor } from "@/components/admin/shared/RichTextEditor";

const FORMULATION_SUGGESTIONS = ["Viên nén", "Viên nang", "Dung dịch uống", "Bột pha tiêm", "Hỗn dịch", "Dung dịch tiêm"];
const PACKAGING_SUGGESTIONS = ["Hộp 10 vỉ x 10 viên", "Chai 100ml", "Chai 500ml", "Gói 1kg", "Lọ 10ml", "Vỉ 10 viên"];

export default function AddProductPage() {
  const router = useRouter();
  const mainImagesRef = useRef<HTMLInputElement>(null);
  const [expandedVariants, setExpandedVariants] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AdminProductForm>({
    resolver: zodResolver(AdminProductSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      categoryId: "",
      brand: "",
      origin: "",
      baseSku: "",
      description: "",
      status: "active",
      images: [],
      isVariantEnabled: true,
      variants: [{ 
        formulation: "", 
        packaging: "", 
        unit: "", 
        sku: "", 
        barcode: "", 
        costPrice: undefined as any, 
        price: undefined as any, 
        wholesalePrice: undefined as any, 
        initialStock: undefined as any, 
        netWeight: undefined as any, 
        netWeightUnit: "ml", 
        shippingWeight: undefined as any, 
        image: "", 
        customSpecs: [] 
      }],
      unitConversions: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const { 
    fields: unitFields, 
    append: appendUnit, 
    remove: removeUnit 
  } = useFieldArray({
    control,
    name: "unitConversions",
  });

  const mainImages = watch("images");

  const toggleVariantExpand = (index: number) => {
    setExpandedVariants(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleMainImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setValue("images", [...mainImages, ...newPreviews], { shouldValidate: true });
    }
  };

  const handleVariantImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setValue(`variants.${index}.image`, preview, { shouldValidate: true });
    }
  };

  const onSubmit = (data: AdminProductForm) => {
    console.log("Dữ liệu hợp lệ:", data);
    toast.success("Đã lưu dữ liệu sản phẩm thành công!");
    router.push("/admin/products");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-[100px] bg-slate-50/30 p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2 px-1">
        <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400">
          <ChevronLeft size={20} />
        </Button>
        <h1 className="text-[18px] font-black text-[#1f1f1f] tracking-tight uppercase">
          Thiết lập sản phẩm mới
        </h1>
        <div className="ms-auto flex items-center gap-3 text-gray-400">
          <Settings size={18} className="cursor-pointer hover:text-emerald-600 transition-colors" />
          <HelpCircle size={18} className="cursor-pointer hover:text-emerald-600 transition-colors" />
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8"><X size={20} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-9 space-y-5">
          {/* Section 1: Thông tin sản phẩm chính */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <AlertCircle size={16} /> 1. Thông tin sản phẩm chính
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Tên sản phẩm *</Label>
                <Input {...register("name")} placeholder="" className="h-[34px] text-[13px] border-[#ccc] rounded-none focus-visible:ring-emerald-500/20 shadow-none" />
                {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.name.message}</p>}
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
                        <SelectItem value="thuoc">Thuốc & Chế phẩm</SelectItem>
                        <SelectItem value="thuc-an">Thức ăn</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.categoryId && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.categoryId.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Thương hiệu</Label>
                <Input {...register("brand")} placeholder="" className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Xuất xứ</Label>
                <Input {...register("origin")} placeholder="" className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Mã SKU gốc</Label>
                <Input {...register("baseSku")} placeholder="" className="h-[34px] text-[13px] border-[#ccc] rounded-none font-mono shadow-none" />
                {errors.baseSku && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.baseSku.message}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Đặc tính & Bài viết mô tả */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <FileText size={16} /> 2. Đặc tính & Bài viết mô tả
            </div>
            <RichTextEditor minHeight="250px" placeholder="Nhập nội dung mô tả chi tiết cho sản phẩm tại đây..." />
          </div>

          {/* Section 3: Danh sách biến thể sản phẩm (SKUs) */}
          <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden">
            <div className="px-[20px] py-[12px] border-b border-[#eee] bg-[#f8f9fa] flex justify-between items-center">
              <h3 className="text-[11px] font-black text-slate-700 flex items-center gap-2 uppercase tracking-wider whitespace-nowrap">
                <Layers size={16} className="text-emerald-600" /> 3. Danh sách biến thể sản phẩm (SKUs)
              </h3>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => append({ 
                  formulation: "", packaging: "", unit: "", sku: "", barcode: "", 
                  costPrice: undefined as any, price: undefined as any, wholesalePrice: undefined as any, 
                  initialStock: undefined as any, netWeight: undefined as any, netWeightUnit: "ml", 
                  shippingWeight: undefined as any, image: "", customSpecs: [] 
                })} 
                className="h-[28px] text-[10px] font-black text-emerald-600 border-emerald-200 bg-white px-4 rounded-none hover:bg-emerald-50 shadow-sm"
              >
                <Plus size={14} className="mr-1" /> THÊM BIẾN THỂ
              </Button>
            </div>

            <div className="p-0 divide-y divide-slate-100 bg-white">
              {fields.map((field, idx) => {
                const isExpanded = expandedVariants.includes(idx);
                const rowError = errors.variants?.[idx];
                const variantImage = watch(`variants.${idx}.image`);

                return (
                  <div key={field.id} className={cn("overflow-hidden transition-colors border-b last:border-b-0", isExpanded ? "bg-slate-50/30" : "bg-white", rowError && "bg-red-50/30")}>
                    <div className="p-5">
                      <div className="flex flex-col xl:flex-row gap-8">
                         {/* Variant Image */}
                         <div className="flex flex-col items-center shrink-0">
                            <div onClick={() => document.getElementById(`v-img-${idx}`)?.click()} className="w-[110px] h-[110px] border border-[#ddd] rounded-none bg-white flex items-center justify-center cursor-pointer group hover:border-emerald-500 transition-all overflow-hidden relative shadow-inner">
                              {variantImage ? <img src={variantImage} className="w-full h-full object-cover" /> : <Camera size={32} className="text-slate-200" />}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Upload size={20} className="text-white" />
                              </div>
                            </div>
                            <input type="file" id={`v-img-${idx}`} hidden onChange={(e) => handleVariantImageChange(idx, e)} accept="image/*" />
                            <p className="text-[9px] font-black text-slate-400 mt-2 uppercase tracking-tighter whitespace-nowrap text-center">Ảnh SKU #{idx + 1}</p>
                            {rowError?.image && <p className="text-[8px] text-red-500 font-bold uppercase mt-1">Thiếu ảnh</p>}
                         </div>

                         {/* Input Fields in 4 Rows */}
                         <div className="flex-1 space-y-6">
                            {/* Hàng 1: Đặc tính vật lý */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                               <div className="space-y-1.5">
                                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight whitespace-nowrap">Dạng bào chế *</Label>
                                  <div className="flex gap-0">
                                    <Input {...register(`variants.${idx}.formulation`)} placeholder="" className="h-[34px] border-[#ccc] rounded-none focus:border-emerald-500 focus:ring-0 text-[13px] shadow-none w-full" />
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="h-[34px] w-[34px] p-0 border-[#ccc] border-l-0 rounded-none bg-[#f8f9fa] hover:bg-emerald-50">
                                          <ChevronDown size={14} className="text-slate-400" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="rounded-none">
                                        {FORMULATION_SUGGESTIONS.map(i => <DropdownMenuItem key={i} onSelect={() => setValue(`variants.${idx}.formulation`, i, { shouldValidate: true })}>{i}</DropdownMenuItem>)}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                               </div>

                               <div className="space-y-1.5">
                                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight whitespace-nowrap">Quy cách đóng gói *</Label>
                                  <div className="flex gap-0">
                                    <Input {...register(`variants.${idx}.packaging`)} placeholder="" className="h-[34px] border-[#ccc] rounded-none focus:border-emerald-500 focus:ring-0 text-[13px] shadow-none w-full" />
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="h-[34px] w-[34px] p-0 border-[#ccc] border-l-0 rounded-none bg-[#f8f9fa] hover:bg-emerald-50">
                                          <ChevronDown size={14} className="text-slate-400" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="rounded-none">
                                        {PACKAGING_SUGGESTIONS.map(i => <DropdownMenuItem key={i} onSelect={() => setValue(`variants.${idx}.packaging`, i, { shouldValidate: true })}>{i}</DropdownMenuItem>)}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                               </div>

                               <div className="space-y-1.5">
                                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight whitespace-nowrap">Đơn vị tính (Nhỏ nhất) *</Label>
                                  <Input {...register(`variants.${idx}.unit`)} placeholder="" className="h-[34px] border-[#ccc] rounded-none text-[13px] shadow-none" />
                                  {rowError?.unit && <p className="text-[9px] text-red-500 font-bold">{rowError.unit.message}</p>}
                               </div>
                            </div>

                            {/* Hàng 2: Mã định danh & Thao tác */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                               <div className="space-y-1.5">
                                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight whitespace-nowrap">Mã SKU biến thể *</Label>
                                  <Input {...register(`variants.${idx}.sku`)} placeholder="" className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none font-mono focus:border-emerald-500" />
                                  {rowError?.sku && <p className="text-[9px] text-red-500 font-bold mt-1">{rowError.sku.message}</p>}
                               </div>

                               <div className="space-y-1.5">
                                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight whitespace-nowrap">Mã vạch / Barcode</Label>
                                  <Input {...register(`variants.${idx}.barcode`)} placeholder="" className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none font-mono focus:border-emerald-500" />
                               </div>

                               <div className="space-y-1.5">
                                  <Label className="text-[10px] font-black text-transparent select-none uppercase tracking-tight whitespace-nowrap">Thao tác</Label>
                                  <div className="flex items-center justify-between bg-slate-100/50 p-1 px-4 border border-dashed border-slate-300 h-[34px]">
                                     <button type="button" onClick={() => toggleVariantExpand(idx)} className="flex items-center gap-2 text-[10px] font-black text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-tight whitespace-nowrap">
                                       <Settings2 size={14} /> {isExpanded ? "Đóng Spec" : "Cấu hình Spec"}
                                     </button>
                                     <button type="button" onClick={() => remove(idx)} className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-tight whitespace-nowrap">
                                       <Trash2 size={14} /> Xóa biến thể
                                     </button>
                                  </div>
                               </div>
                            </div>

                            {/* Hàng 3: Tài chính */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                               <div className="space-y-1.5">
                                  <Label className="text-[10px] font-black text-blue-600 uppercase tracking-tight whitespace-nowrap">Giá vốn (Giá nhập hàng) *</Label>
                                  <div className="relative">
                                    <Input type="number" {...register(`variants.${idx}.costPrice`)} className="h-[34px] border-[#ccc] rounded-none text-right text-[13px] shadow-none font-bold text-blue-600 bg-blue-50/20" />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-300">₫</span>
                                  </div>
                                  {rowError?.costPrice && <p className="text-[9px] text-red-500 font-bold">{rowError.costPrice.message}</p>}
                                </div>

                               <div className="space-y-1.5">
                                  <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-tight whitespace-nowrap">Giá bán lẻ niêm yết *</Label>
                                  <div className="relative">
                                    <Input type="number" {...register(`variants.${idx}.price`)} className="h-[34px] border-[#ccc] rounded-none text-right text-[13px] shadow-none font-black text-emerald-700" />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">₫</span>
                                  </div>
                                  {rowError?.price && <p className="text-[9px] text-red-500 font-bold">{rowError.price.message}</p>}
                               </div>

                               <div className="space-y-1.5">
                                  <Label className="text-[10px] font-black text-orange-600 uppercase tracking-tight whitespace-nowrap">Giá bán sỉ / Giá bán buôn</Label>
                                  <div className="relative">
                                    <Input type="number" {...register(`variants.${idx}.wholesalePrice`)} className="h-[34px] border-[#ccc] rounded-none text-right text-[13px] shadow-none font-bold text-orange-600" />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-orange-300">₫</span>
                                  </div>
                               </div>
                            </div>

                            {/* Hàng 4: Kho vận */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
                               <div className="space-y-1.5">
                                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight whitespace-nowrap">Tồn kho khởi tạo</Label>
                                  <Input type="number" {...register(`variants.${idx}.initialStock`)} className="h-[34px] border-[#ccc] rounded-none text-right text-[13px] shadow-none font-bold" />
                                  {rowError?.initialStock && <p className="text-[9px] text-red-500 font-bold">{rowError.initialStock.message}</p>}
                               </div>

                               <div className="space-y-1.5">
                                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight whitespace-nowrap">Khối lượng tịnh (Net weight)</Label>
                                  <div className="flex items-center gap-0">
                                    <Input type="number" {...register(`variants.${idx}.netWeight`)} placeholder="" className="h-[34px] border-[#ccc] rounded-none rounded-r-none text-right text-[13px] shadow-none font-medium flex-1" />
                                    <Controller
                                      name={`variants.${idx}.netWeightUnit`}
                                      control={control}
                                      render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <SelectTrigger className="h-[34px] w-[70px] border-[#ccc] border-l-0 rounded-none shadow-none text-[12px] font-bold bg-[#f8f9fa] focus:ring-0"><SelectValue /></SelectTrigger>
                                          <SelectContent className="rounded-none"><SelectItem value="ml">ml</SelectItem><SelectItem value="l">lít</SelectItem><SelectItem value="g">g</SelectItem><SelectItem value="kg">kg</SelectItem></SelectContent>
                                        </Select>
                                      )}
                                    />
                                  </div>
                                  {rowError?.netWeight && <p className="text-[9px] text-red-500 font-bold">{rowError.netWeight.message}</p>}
                               </div>

                               <div className="space-y-1.5">
                                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight whitespace-nowrap">Trọng lượng vận chuyển (gram)</Label>
                                  <Input type="number" {...register(`variants.${idx}.shippingWeight`)} placeholder="" className="h-[34px] border-[#ccc] rounded-none text-right text-[13px] shadow-none font-medium" />
                                  {rowError?.shippingWeight && <p className="text-[9px] text-red-500 font-bold">{rowError.shippingWeight.message}</p>}
                               </div>
                            </div>
                         </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-8 py-6 bg-[#fdfdfd] border-t border-[#eee] space-y-4 shadow-inner">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-1.5 h-5 bg-blue-500"></div>
                              <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                 <FileText size={14} className="text-blue-500" /> Thông số kỹ thuật đặc thù cho SKU #{idx + 1}
                              </span>
                           </div>
                           <button 
                             type="button" 
                             onClick={() => toggleVariantExpand(idx)} 
                             className="text-[11px] font-bold text-blue-500 hover:text-blue-700 hover:underline flex items-center gap-1 uppercase tracking-widest bg-blue-50 px-3 py-1 border border-blue-100"
                           >
                             [ Ẩn thông số này ]
                           </button>
                        </div>
                        <RichTextEditor minHeight="150px" />
                      </div>
                    )}
                  </div>
                );
              })}
              {fields.length === 0 && (
                 <div className="py-16 flex flex-col items-center justify-center text-slate-300">
                    <Layers size={56} className="mb-3 opacity-10" />
                    <p className="text-[11px] font-black uppercase tracking-[0.2em]">Chưa có biến thể nào được tạo</p>
                 </div>
              )}
              {(errors.variants as any)?.message && (
                <p className="p-4 text-center text-red-500 text-[11px] font-black bg-red-50 uppercase tracking-widest border-t border-red-100">
                  {errors.variants?.message}
                </p>
              )}
            </div>
          </div>

          {/* Bước 8: Quy đổi đơn vị sản phẩm */}
          <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden">
            <div className="px-[20px] py-[12px] border-b border-[#eee] bg-[#f8f9fa] flex justify-between items-center">
              <h3 className="text-[11px] font-black text-slate-700 flex items-center gap-2 uppercase tracking-wider">
                <Settings2 size={16} className="text-blue-600" /> Bước 8: Quy đổi đơn vị sản phẩm
              </h3>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => appendUnit({ fromUnit: "", toUnit: "", ratio: undefined as any, price: undefined as any, wholesalePrice: undefined as any, sku: "", barcode: "" })}
                className="h-[28px] text-[10px] font-black text-blue-600 border-blue-200 bg-white px-4 rounded-none hover:bg-blue-50 shadow-sm"
              >
                <Plus size={14} className="mr-1" /> THÊM ĐƠN VỊ QUY ĐỔI
              </Button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-none">
                <p className="text-[11px] text-blue-800 leading-relaxed font-bold">
                  <span className="underline">Lưu ý nghiệp vụ:</span> Đơn vị quy đổi không có tồn kho riêng mà phụ thuộc hoàn toàn vào đơn vị gốc (đơn vị nhỏ nhất). Hệ thống sẽ tự động tính toán tồn kho dựa trên tỷ lệ quy đổi.
                </p>
                <p className="text-[10px] text-blue-600 mt-2 italic font-medium">
                  Ví dụ: 1 Thùng = 12 Chai. Khi nhập hoặc bán 1 Thùng, kho Chai sẽ tự động tăng/giảm tương ứng 12 đơn vị.
                </p>
              </div>

              {unitFields.length > 0 ? (
                <div className="space-y-5">
                  {unitFields.map((field, index) => (
                    <div key={field.id} className="bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden group hover:border-blue-400 transition-all">
                      <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quy tắc quy đổi #{index + 1}</span>
                         <button type="button" onClick={() => removeUnit(index)} className="text-slate-300 hover:text-rose-500 transition-colors">
                            <Trash2 size={16} />
                         </button>
                      </div>
                      <div className="p-5 space-y-5">
                        {/* Row 1: Conversion formula and Prices */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                          <div className="md:col-span-2 space-y-1.5">
                            <Label className="text-[10px] font-black text-slate-500 uppercase">Đơn vị quy đổi</Label>
                            <Input {...register(`unitConversions.${index}.fromUnit`)} placeholder="" className="h-[34px] text-[13px] border-[#ccc] rounded-none font-bold focus:border-blue-500" />
                          </div>
                          <div className="md:col-span-1 flex items-center justify-center pb-2 text-slate-300 font-black text-[11px]">
                            BẰNG
                          </div>
                          <div className="md:col-span-2 space-y-1.5">
                            <Label className="text-[10px] font-black text-slate-500 uppercase">Số lượng</Label>
                            <Input type="number" {...register(`unitConversions.${index}.ratio`)} className="h-[34px] text-[13px] border-[#ccc] rounded-none text-right font-black text-blue-600 focus:border-blue-500" />
                          </div>
                          <div className="md:col-span-2 space-y-1.5">
                            <Label className="text-[10px] font-black text-slate-500 uppercase">Đơn vị gốc</Label>
                            <Input {...register(`unitConversions.${index}.toUnit`)} placeholder="" className="h-[34px] text-[13px] border-[#ccc] rounded-none focus:border-blue-500" />
                          </div>
                          <div className="md:col-span-2 space-y-1.5">
                             <Label className="text-[10px] font-black text-slate-500 uppercase">Giá bán lẻ (₫)</Label>
                             <div className="relative">
                                <Input type="number" {...register(`unitConversions.${index}.price`)} className="h-[34px] text-[13px] border-[#ccc] rounded-none text-right pr-6 font-black text-emerald-600 shadow-inner focus:border-emerald-500" />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-300 font-bold">₫</span>
                             </div>
                          </div>
                          <div className="md:col-span-3 space-y-1.5">
                             <Label className="text-[10px] font-black text-slate-500 uppercase">Giá bán buôn (₫)</Label>
                             <div className="relative">
                                <Input type="number" {...register(`unitConversions.${index}.wholesalePrice`)} className="h-[34px] text-[13px] border-[#ccc] rounded-none text-right pr-6 font-black text-orange-600 shadow-inner focus:border-orange-500" />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-300 font-bold">₫</span>
                             </div>
                          </div>
                        </div>

                        {/* Row 2: SKU and Barcode for the converted unit */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-50">
                           <div className="space-y-1.5">
                              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Mã SKU (riêng cho đơn vị này)</Label>
                              <Input {...register(`unitConversions.${index}.sku`)} placeholder="" className="h-[34px] text-[12px] font-mono border-[#ccc] rounded-none focus:border-blue-500" />
                           </div>
                           <div className="space-y-1.5">
                              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Mã vạch / Barcode (riêng cho đơn vị này)</Label>
                              <Input {...register(`unitConversions.${index}.barcode`)} placeholder="" className="h-[34px] text-[12px] font-mono border-[#ccc] rounded-none focus:border-blue-500" />
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 border-2 border-dashed border-slate-100 rounded-none flex flex-col items-center justify-center text-slate-200">
                   <Settings2 size={40} className="mb-3 opacity-20" />
                   <p className="text-[11px] font-black uppercase tracking-[0.2em]">Chưa thiết lập quy đổi đơn vị</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <Label className="text-[11px] font-black text-slate-700 uppercase block mb-5 text-center tracking-widest border-b pb-3">Album hình ảnh *</Label>
            <div className="grid grid-cols-2 gap-3 mb-2">
              {mainImages.map((src, i) => (
                <div key={i} className="relative aspect-square border border-[#eee] rounded-none overflow-hidden group shadow-sm">
                  <img src={src} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setValue("images", mainImages.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                </div>
              ))}
              <div onClick={() => mainImagesRef.current?.click()} className="aspect-square border-2 border-dashed border-[#ddd] rounded-none flex flex-col items-center justify-center bg-[#fcfcfc] hover:bg-emerald-50 cursor-pointer shadow-inner transition-colors group">
                <Upload size={24} className="text-slate-300 group-hover:text-emerald-500 mb-1" />
                <span className="text-[9px] font-black text-slate-400 group-hover:text-emerald-600 uppercase tracking-tighter">Tải ảnh lên</span>
              </div>
            </div>
            {errors.images && <p className="text-[10px] text-red-500 font-bold text-center mt-3 tracking-tight">{errors.images.message}</p>}
            <input type="file" ref={mainImagesRef} multiple hidden onChange={handleMainImagesChange} accept="image/*" />
          </div>

          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <Label className="text-[11px] font-black text-slate-700 uppercase block mb-5 tracking-widest border-b pb-3">Trạng thái phát hành</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-3">
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-[38px] text-[13px] border-[#ccc] rounded-none font-black text-emerald-600 shadow-none focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="active" className="text-emerald-600 font-bold">ĐANG KINH DOANH</SelectItem>
                      <SelectItem value="inactive" className="text-rose-600 font-bold">TẠM NGỪNG BÁN</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-[10px] text-red-500 font-bold px-1">{errors.status.message}</p>}
                </div>
              )}
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[12px_30px] flex items-center justify-end gap-[15px] z-[999] shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        <Button type="button" variant="outline" className="min-w-[110px] h-[38px] text-[12px] font-bold border-[#ccc] bg-white rounded-none shadow-sm hover:bg-slate-50 transition-all uppercase" onClick={() => router.back()}>HỦY BỎ</Button>
        <Button type="submit" className="min-w-[150px] h-[38px] text-[12px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-none shadow-md shadow-emerald-100 transition-all active:scale-[0.98] uppercase">
          <Save size={18} className="mr-2" /> LƯU DỮ LIỆU
        </Button>
      </div>
    </form>
  );
}