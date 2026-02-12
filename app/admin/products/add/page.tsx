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
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AdminProductSchema, AdminProductForm } from "@/app/types/admin.schema";

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
      variants: [{ formulation: "", packaging: "", weight: 0, unit: "ml", price: 0, barcode: "", image: "", customSpecs: [] }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pb-[100px]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4 px-1">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-9 space-y-3">
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
              <AlertCircle size={16} /> 1. Thông tin sản phẩm chính
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
              <div className="md:col-span-2 space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">Tên sản phẩm *</Label>
                <Input {...register("name")} className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] focus-visible:ring-emerald-500/20 shadow-none" />
                {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.name.message}</p>}
              </div>
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">Danh mục *</Label>
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none">
                        <SelectValue placeholder="-- Chọn --" />
                      </SelectTrigger>
                      <SelectContent><SelectItem value="thuoc">Thuốc & Chế phẩm</SelectItem></SelectContent>
                    </Select>
                  )}
                />
                {errors.categoryId && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.categoryId.message}</p>}
              </div>
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">Thương hiệu</Label>
                <Input {...register("brand")} className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none" />
                {errors.brand && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.brand.message}</p>}
              </div>
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">Xuất xứ</Label>
                <Input {...register("origin")} className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none" />
                {errors.origin && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.origin.message}</p>}
              </div>
              <div className="space-y-[2px]">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">Mã SKU gốc</Label>
                <Input {...register("baseSku")} className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] font-mono shadow-none" />
                {errors.baseSku && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.baseSku.message}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
              <FileText size={16} /> 2. Đặc tính & Bài viết mô tả
            </div>
            <Textarea {...register("description")} placeholder="Nhập mô tả chi tiết sản phẩm..." className="min-h-[100px] text-[13px] border-[#ccc] rounded-[3px] focus-visible:ring-emerald-500/20 shadow-none" />
            {errors.description && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.description.message}</p>}
          </div>

          <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="px-[15px] py-[10px] border-b border-[#eee] bg-[#f8f9fa] flex justify-between items-center">
              <h3 className="text-[11px] font-black text-slate-700 flex items-center gap-2 uppercase tracking-wider">
                <Layers size={16} className="text-emerald-600" /> 3. Danh sách biến thể sản phẩm (SKUs)
              </h3>
              <Button type="button" variant="outline" onClick={() => append({ formulation: "", packaging: "", weight: 0, unit: "ml", price: 0, barcode: "", image: "", customSpecs: [] })} className="h-[26px] text-[10px] font-black text-emerald-600 border-emerald-200 bg-white px-3 rounded-[3px] hover:bg-emerald-50 shadow-sm">
                <Plus size={14} className="mr-1" /> THÊM BIẾN THỂ
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table className="table-custom border-collapse">
                <TableHeader>
                  <TableRow className="bg-[#f0f0f0] border-b border-[#ccc]">
                    <TableHead className="w-[40px] text-center p-[10px] font-bold text-[#555] text-[10px] uppercase">#</TableHead>
                    <TableHead className="w-[80px] text-center font-bold text-[#555] text-[10px] uppercase">Ảnh</TableHead>
                    <TableHead className="w-[180px] font-bold text-[#555] text-[10px] uppercase">Dạng bào chế</TableHead>
                    <TableHead className="w-[180px] font-bold text-[#555] text-[10px] uppercase">Quy cách</TableHead>
                    <TableHead className="w-[150px] font-bold text-[#555] text-[10px] uppercase text-right">Trọng lượng</TableHead>
                    <TableHead className="w-[180px] font-bold text-[#555] text-[10px] uppercase text-right">Giá bán (₫)</TableHead>
                    <TableHead className="w-[150px] font-bold text-[#555] text-[10px] uppercase">Mã vạch</TableHead>
                    <TableHead className="w-[80px] text-center font-bold text-[#555] text-[10px] uppercase">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, idx) => {
                    const isExpanded = expandedVariants.includes(idx);
                    const rowError = errors.variants?.[idx];
                    const variantImage = watch(`variants.${idx}.image`);

                    return (
                      <React.Fragment key={field.id}>
                        <TableRow className={cn("border-b border-[#eee] hover:bg-[#f0f8ff] relative", isExpanded && "bg-[#f0f9f6]")}>
                          <TableCell className="text-center text-slate-400 text-[11px] font-bold align-top pt-3">{idx + 1}</TableCell>

                          <TableCell className="p-2 align-top">
                            <div className="flex flex-col items-center relative pb-5">
                              <div onClick={() => document.getElementById(`v-img-${idx}`)?.click()} className="w-10 h-10 border border-[#ddd] rounded-[3px] bg-white flex items-center justify-center cursor-pointer shadow-sm group hover:border-emerald-500 transition-all overflow-hidden">
                                {variantImage ? <img src={variantImage} className="w-full h-full object-cover" /> : <Camera size={14} className="text-slate-300" />}
                              </div>
                              <input type="file" id={`v-img-${idx}`} hidden onChange={(e) => handleVariantImageChange(idx, e)} accept="image/*" />
                              {rowError?.image && <p className="absolute bottom-0 text-[8px] text-red-500 font-bold uppercase whitespace-nowrap">Thiếu ảnh</p>}
                            </div>
                          </TableCell>

                          <TableCell className="p-2 px-2 align-top">
                            <div className="flex flex-col relative pt-2">
                              <div className="flex gap-0 pb-5">
                                <Input {...register(`variants.${idx}.formulation`)} placeholder="Nhập/chọn..." className="h-[30px] border-[#ccc] rounded-r-none focus:border-emerald-500 focus:ring-0 text-[13px] bg-transparent shadow-none w-full" />
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-[30px] w-[30px] p-0 border-[#ccc] border-l-0 rounded-l-none bg-[#f8f9fa] hover:bg-emerald-50">
                                      <ChevronDown size={14} className="text-slate-400" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {FORMULATION_SUGGESTIONS.map(i => <DropdownMenuItem key={i} onSelect={() => setValue(`variants.${idx}.formulation`, i, { shouldValidate: true })}>{i}</DropdownMenuItem>)}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              {rowError?.formulation && <p className="absolute bottom-0 text-[9px] text-red-500 font-bold whitespace-nowrap">{rowError.formulation.message}</p>}
                            </div>
                          </TableCell>

                          <TableCell className="p-2 px-2 align-top">
                             <div className="flex flex-col relative pt-2">
                              <div className="flex gap-0 pb-5">
                                <Input {...register(`variants.${idx}.packaging`)} placeholder="Nhập/chọn..." className="h-[30px] border-[#ccc] rounded-r-none focus:border-emerald-500 focus:ring-0 text-[13px] bg-transparent shadow-none w-full" />
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-[30px] w-[30px] p-0 border-[#ccc] border-l-0 rounded-l-none bg-[#f8f9fa] hover:bg-emerald-50">
                                      <ChevronDown size={14} className="text-slate-400" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {PACKAGING_SUGGESTIONS.map(i => <DropdownMenuItem key={i} onSelect={() => setValue(`variants.${idx}.packaging`, i, { shouldValidate: true })}>{i}</DropdownMenuItem>)}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              {rowError?.packaging && <p className="absolute bottom-0 text-[9px] text-red-500 font-bold whitespace-nowrap">{rowError.packaging.message}</p>}
                            </div>
                          </TableCell>

                          <TableCell className="p-2 px-2 align-top">
                            <div className="flex flex-col relative pt-2">
                              <div className="flex items-center justify-end gap-1 pb-5">
                                <Input type="number" {...register(`variants.${idx}.weight`)} className="h-[30px] w-20 border-transparent text-right text-[13px] bg-transparent shadow-none font-medium" />
                                <Controller
                                  name={`variants.${idx}.unit`}
                                  control={control}
                                  render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <SelectTrigger className="h-[30px] w-[60px] border-none shadow-none text-[12px] font-bold bg-transparent"><SelectValue /></SelectTrigger>
                                      <SelectContent><SelectItem value="ml">ml</SelectItem><SelectItem value="l">lít</SelectItem><SelectItem value="g">g</SelectItem><SelectItem value="kg">kg</SelectItem></SelectContent>
                                    </Select>
                                  )}
                                />
                              </div>
                              {rowError?.weight && <p className="absolute bottom-0 right-0 text-[9px] text-red-500 font-bold whitespace-nowrap">{rowError.weight.message}</p>}
                            </div>
                          </TableCell>

                          <TableCell className="p-2 px-2 align-top">
                             <div className="flex flex-col relative pt-2">
                              <div className="relative pb-5">
                                <Input type="number" {...register(`variants.${idx}.price`)} className="h-[30px] border-transparent text-right text-[13px] bg-transparent shadow-none font-black text-emerald-700" />
                                <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-300">₫</span>
                              </div>
                              {rowError?.price && <p className="absolute bottom-0 right-0 text-[9px] text-red-500 font-bold whitespace-nowrap">{rowError.price.message}</p>}
                            </div>
                          </TableCell>

                         <TableCell className="p-2 px-2 align-top">
                           <div className="flex flex-col relative justify-center h-full pt-2">

                             <div className="flex items-center h-[32px]">
                               <Input
                                 {...register(`variants.${idx}.barcode`)}
                                 placeholder="Mã vạch..."
                                 className="h-full text-[12px] font-mono shadow-none focus:border-emerald-500 focus:ring-0 bg-white"
                               />
                             </div>

                           </div>
                         </TableCell>

                          <TableCell className="p-2 text-center align-top pt-2">
                            <div className="flex items-center justify-center gap-1">
                              <button type="button" onClick={() => toggleVariantExpand(idx)} className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors">
                                {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                              </button>
                              <button type="button" onClick={() => remove(idx)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {isExpanded && (
                          <TableRow className="bg-[#fdfdfd]">
                            <TableCell colSpan={8} className="p-0">
                              <div className="pl-[100px] pr-8 py-3 border-b border-[#eee]">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                    <Settings2 size={12} /> Thông số kỹ thuật đặc thù
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-300 italic">Dữ liệu thông số kỹ thuật riêng cho SKU này.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
              {(errors.variants as any)?.message && (
                <p className="p-2 text-center text-red-500 text-[11px] font-bold bg-red-50 uppercase tracking-tight border-t border-red-100">
                  {errors.variants?.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-3">
          <div className="bg-white border border-[#dcdcdc] p-[15px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <Label className="text-[11px] font-bold text-slate-500 uppercase block mb-3 text-center tracking-widest">Album hình ảnh *</Label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {mainImages.map((src, i) => (
                <div key={i} className="relative aspect-square border border-[#eee] rounded-[3px] overflow-hidden group shadow-sm">
                  <img src={src} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setValue("images", mainImages.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
                </div>
              ))}
              <div onClick={() => mainImagesRef.current?.click()} className="aspect-square border-2 border-dashed border-[#ddd] rounded-[4px] flex flex-col items-center justify-center bg-[#fcfcfc] hover:bg-emerald-50 cursor-pointer shadow-inner transition-colors">
                <Upload size={20} className="text-slate-300 mb-1" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Tải ảnh</span>
              </div>
            </div>
            {errors.images && <p className="text-[10px] text-red-500 font-bold text-center mt-2 tracking-tight">{errors.images.message}</p>}
            <input type="file" ref={mainImagesRef} multiple hidden onChange={handleMainImagesChange} accept="image/*" />
          </div>

          <div className="bg-white border border-[#dcdcdc] p-[15px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <Label className="text-[11px] font-bold text-slate-500 uppercase block mb-3 tracking-widest">Trạng thái phát hành</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-1">
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] font-black text-emerald-600 shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">ĐANG KINH DOANH</SelectItem>
                      <SelectItem value="inactive">TẠM NGỪNG BÁN</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-[10px] text-red-500 font-bold px-1">{errors.status.message}</p>}
                </div>
              )}
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[8px_20px] flex items-center justify-end gap-[10px] z-[999]">
        <Button type="button" variant="outline" className="min-w-[100px] h-[34px] text-[12px] font-bold border-[#ccc] bg-white rounded-[3px] shadow-sm" onClick={() => router.back()}>HỦY BỎ</Button>
        <Button type="submit" className="min-w-[120px] h-[34px] text-[12px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-[3px] shadow-md shadow-emerald-100">
          <Save size={16} className="mr-2" /> LƯU DỮ LIỆU
        </Button>
      </div>
    </form>
  );
}