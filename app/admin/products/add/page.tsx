"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  Settings,
  HelpCircle,
  Plus,
  Trash2,
  Save,
  ChevronLeft,
  Camera,
  Upload,
  AlertCircle,
  Settings2,
  ChevronDown,
  FileText,
  Layers,
  Loader2,
  ListPlus
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

// Template mặc định khi tạo mới 1 biến thể (Mồi sẵn 3 thuộc tính cho UX tốt)
const DEFAULT_VARIANT = {
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
  customSpecs: [],
  attributes: [{ name: "", value: "" }],
};

export default function AddProductPage() {
  const router = useRouter();
  const mainImagesRef = useRef<HTMLInputElement>(null);
  const [expandedVariants, setExpandedVariants] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // States lấy từ Database
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [attributeDictionary, setAttributeDictionary] = useState<string[]>([]);
  
  const { isLoadingAuth, isAuthenticated } = useAuthStore();


  // 1. CALL API GET DỮ LIỆU
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [catRes, brandRes, attrRes] = await Promise.all([
          ProductService.getCategories(),
          ProductService.getBrands(),
          ProductService.getAttributes(),
        ]);

        setCategories(catRes || []);
        setBrands(brandRes?.map((b: any) => b.name) || []);
        setAttributeDictionary(attrRes?.map((a: any) => a.name) || []);
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
  } = useForm<AdminProductForm | any>({ // Tạm dùng any để tránh lỗi schema type do đổi cấu trúc attributes
    // resolver: zodResolver(AdminProductSchema), // Nếu Schema cũ chưa update kịp, bạn có thể tạm rào dòng này lại
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
      variants: [{ ...DEFAULT_VARIANT }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const mainImages = watch("images");

  // HÀM QUẢN LÝ THUỘC TÍNH ĐỘNG BÊN TRONG BIẾN THỂ
  const addAttributeToVariant = (variantIndex: number) => {
    const currentVariants = getValues("variants");
    const currentAttributes = currentVariants[variantIndex].attributes || [];
    setValue(`variants.${variantIndex}.attributes`, [...currentAttributes, { name: "", value: "" }]);
  };

  const removeAttributeFromVariant = (variantIndex: number, attrIndex: number) => {
    const currentVariants = getValues("variants");
    const currentAttributes = [...currentVariants[variantIndex].attributes];
    currentAttributes.splice(attrIndex, 1);
    setValue(`variants.${variantIndex}.attributes`, currentAttributes);
  };


  const toggleVariantExpand = (index: number) => {
    setExpandedVariants((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const handleMainImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setValue("images", [...mainImages, ...newPreviews], {
        shouldValidate: true,
      });
    }
  };

  const handleVariantImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setValue(`variants.${index}.image`, preview, { shouldValidate: true });
    }
  };

  // 2. SUBMIT FORM
  const onSubmit = async (data: AdminProductForm) => {
    try {
      setIsLoading(true);

      const payload = {
        ...data,
        categoryId: Number(data.categoryId),
        description: data.description || "Chưa có mô tả chi tiết.", // Backend có thể yêu cầu
        variants: data.variants.map((v: any) => {
          const attributes = v.attributes || [];
          
          // Helper to find a value and remove it from the list
          const findAndExtract = (name: string) => {
            const index = attributes.findIndex((a: any) => a.name === name);
            if (index > -1) {
              const value = attributes[index].value;
              attributes.splice(index, 1); // Remove from list
              return value;
            }
            return "";
          };

          const formulation = findAndExtract("Dạng bào chế");
          const packaging = findAndExtract("Quy cách đóng gói");
          const unit = findAndExtract("Đơn vị tính");

          // Map the rest to customSpecs
          const customSpecs = attributes
            .filter((attr: any) => attr.name && attr.name.trim() !== "" && attr.value && attr.value.trim() !== "")
            .map((attr: any) => ({
              key: attr.name,
              value: attr.value,
            }));

          // Remove the now-processed attributes field
          const { attributes: _, ...variantWithoutAttrs } = v;

          return {
            ...variantWithoutAttrs,
            formulation,
            packaging,
            unit,
            costPrice: Number(v.costPrice || 0),
            price: Number(v.price || 0),
            wholesalePrice: Number(v.wholesalePrice || 0),
            initialStock: Number(v.initialStock || 0),
            netWeight: Number(v.netWeight || 0),
            shippingWeight: Number(v.shippingWeight || 0),
            image: v.image || "/placeholder.jpg", // Gửi ảnh placeholder nếu trống
            customSpecs,
          };
        }),
      };
      
      // Xóa các trường không cần thiết ở cấp cao nhất
      delete (payload as any).isVariantEnabled;


      await ProductService.create(payload);
      toast.success("Đã lưu dữ liệu sản phẩm thành công!");
      router.push("/admin/products");
    } catch (error: any) {

      // Cải thiện thông báo lỗi: ưu tiên fieldErrors nếu có
      const res = error.response?.data;
      if (res && res.fieldErrors) {
        const errorDetails = Object.entries(res.fieldErrors)
          .map(([field, message]) => `- ${field}: ${message}`)
          .join("\n");
        toast.error(
          <div className="text-left">
            <p className="font-bold mb-2">{res.title || "Dữ liệu không hợp lệ:"}</p>
            <pre className="text-xs whitespace-pre-wrap">{errorDetails}</pre>
          </div>,
          { duration: 10000 }
        );
      } else {
        const errorMsg = res?.detail || "Có lỗi không xác định từ máy chủ.";
        toast.error(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
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
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
            <X size={20} />
          </Button>
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
                <Input {...register("name")} className="h-[34px] text-[13px] border-[#ccc] rounded-none focus-visible:ring-emerald-500/20 shadow-none" />
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
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* THƯƠNG HIỆU */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Thương hiệu</Label>
                <div className="flex gap-0">
                  <Input {...register("brand")} placeholder="Nhập hoặc chọn..." className="h-[34px] border-[#ccc] rounded-none focus:border-emerald-500 focus:ring-0 text-[13px] shadow-none w-full" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="h-[34px] w-[34px] p-0 border-[#ccc] border-l-0 rounded-none bg-[#f8f9fa] hover:bg-emerald-50">
                        <ChevronDown size={14} className="text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-none min-w-[200px]">
                      {brands.map((b) => (
                        <DropdownMenuItem key={b} className="cursor-pointer text-[13px]" onSelect={() => setValue("brand", b)}>
                          {b}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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

          {/* Section 2: Đặc tính & Bài viết mô tả */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <FileText size={16} /> 2. Đặc tính & Bài viết mô tả
            </div>
            <RichTextEditor minHeight="250px" placeholder="Nhập nội dung mô tả chi tiết..." />
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
                onClick={() => append({ ...DEFAULT_VARIANT })}
                className="h-[28px] text-[10px] font-black text-emerald-600 border-emerald-200 bg-white px-4 rounded-none hover:bg-emerald-50 shadow-sm"
              >
                <Plus size={14} className="mr-1" /> THÊM BIẾN THỂ
              </Button>
            </div>

            <div className="p-0 divide-y divide-slate-100 bg-white">
              {fields.map((field, idx) => {
                const isExpanded = expandedVariants.includes(idx);
                const variantImage = watch(`variants.${idx}.image`);
                const variantAttributes = watch(`variants.${idx}.attributes`) || [];

                return (
                  <div key={field.id} className={cn("overflow-hidden transition-colors border-b last:border-b-0", isExpanded ? "bg-slate-50/30" : "bg-white")}>
                    <div className="p-5">
                      <div className="flex flex-col xl:flex-row gap-8">
                        {/* Variant Image */}
                        <div className="flex flex-col items-center shrink-0">
                          <div
                            onClick={() => document.getElementById(`v-img-${idx}`)?.click()}
                            className="w-[110px] h-[110px] border border-[#ddd] rounded-none bg-white flex items-center justify-center cursor-pointer group hover:border-emerald-500 transition-all overflow-hidden relative shadow-inner"
                          >
                            {variantImage ? (
                              <img src={variantImage} className="w-full h-full object-cover" />
                            ) : (
                              <Camera size={32} className="text-slate-200" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Upload size={20} className="text-white" />
                            </div>
                          </div>
                          <input type="file" id={`v-img-${idx}`} hidden onChange={(e) => handleVariantImageChange(idx, e)} accept="image/*" />
                          <p className="text-[9px] font-black text-slate-400 mt-2 uppercase tracking-tighter whitespace-nowrap text-center">Ảnh SKU #{idx + 1}</p>
                        </div>

                        {/* Input Fields */}
                        <div className="flex-1 space-y-6">

                          {/* MỚI: KHU VỰC THUỘC TÍNH ĐỘNG */}
                          <div className="bg-slate-50 border border-slate-200 p-4 rounded-none">
                            <div className="flex justify-between items-center mb-4">
                              <Label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                <ListPlus size={14} className="text-blue-500"/> Các thuộc tính của cấu hình này
                              </Label>
                              <Button type="button" variant="ghost" onClick={() => addAttributeToVariant(idx)} className="h-[24px] text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-2 rounded-none">
                                + Thêm thuộc tính
                              </Button>
                            </div>

                            <div className="space-y-3">
                              {variantAttributes.map((attr: any, attrIdx: number) => (
                                <div key={attrIdx} className="flex items-center gap-3">
                                  {/* Tên thuộc tính */}
                                  <div className="w-1/3 flex gap-0">
                                    <Input
                                      {...register(`variants.${idx}.attributes.${attrIdx}.name`)}
                                      placeholder="Tên (VD: Màu sắc)"
                                      className="h-[30px] border-[#ccc] rounded-none focus:border-blue-500 text-[12px] shadow-none w-full bg-white"
                                    />
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="h-[30px] w-[30px] p-0 border-[#ccc] border-l-0 rounded-none bg-white hover:bg-blue-50">
                                          <ChevronDown size={14} className="text-slate-400" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="rounded-none h-[200px] overflow-y-auto">
                                        {attributeDictionary.map((dictAttr) => (
                                          <DropdownMenuItem key={dictAttr} className="cursor-pointer text-[12px]" onSelect={() => setValue(`variants.${idx}.attributes.${attrIdx}.name`, dictAttr)}>
                                            {dictAttr}
                                          </DropdownMenuItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>

                                  {/* Giá trị thuộc tính */}
                                  <div className="flex-1">
                                    <Input
                                      {...register(`variants.${idx}.attributes.${attrIdx}.value`)}
                                      placeholder="Giá trị (VD: Đỏ)"
                                      className="h-[30px] border-[#ccc] rounded-none focus:border-emerald-500 text-[12px] shadow-none bg-white"
                                    />
                                  </div>

                                  {/* Nút xóa */}
                                  <button type="button" onClick={() => removeAttributeFromVariant(idx, attrIdx)} className="text-slate-300 hover:text-red-500 p-1">
                                    <X size={16} />
                                  </button>
                                </div>
                              ))}

                              {variantAttributes.length === 0 && (
                                <p className="text-[11px] text-slate-400 italic py-2">Chưa có thuộc tính nào được cấu hình.</p>
                              )}
                            </div>
                          </div>

                          {/* Hàng 2: Mã định danh & Thao tác */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight whitespace-nowrap">Mã SKU biến thể *</Label>
                              <Input {...register(`variants.${idx}.sku`)} className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none font-mono focus:border-emerald-500" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight whitespace-nowrap">Mã vạch / Barcode</Label>
                              <Input {...register(`variants.${idx}.barcode`)} className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none font-mono focus:border-emerald-500" />
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
                              <Label className="text-[10px] font-black text-blue-600 uppercase tracking-tight whitespace-nowrap">Giá vốn (Giá nhập) *</Label>
                              <div className="relative">
                                <Input type="number" {...register(`variants.${idx}.costPrice`)} className="h-[34px] border-[#ccc] rounded-none text-right text-[13px] shadow-none font-bold text-blue-600 bg-blue-50/20" />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-300">₫</span>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-tight whitespace-nowrap">Giá bán lẻ niêm yết *</Label>
                              <div className="relative">
                                <Input type="number" {...register(`variants.${idx}.price`)} className="h-[34px] border-[#ccc] rounded-none text-right text-[13px] shadow-none font-black text-emerald-700" />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">₫</span>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-black text-orange-600 uppercase tracking-tight whitespace-nowrap">Giá bán sỉ</Label>
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
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight whitespace-nowrap">Khối lượng tịnh</Label>
                              <div className="flex items-center gap-0">
                                <Input type="number" {...register(`variants.${idx}.netWeight`)} className="h-[34px] border-[#ccc] rounded-none rounded-r-none text-right text-[13px] shadow-none font-medium flex-1" />
                                <Controller
                                  name={`variants.${idx}.netWeightUnit`}
                                  control={control}
                                  render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <SelectTrigger className="h-[34px] w-[70px] border-[#ccc] border-l-0 rounded-none shadow-none text-[12px] font-bold bg-[#f8f9fa] focus:ring-0">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="rounded-none">
                                        <SelectItem value="ml">ml</SelectItem>
                                        <SelectItem value="l">lít</SelectItem>
                                        <SelectItem value="g">g</SelectItem>
                                        <SelectItem value="kg">kg</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight whitespace-nowrap">Trọng lượng vận chuyển (g)</Label>
                              <Input type="number" {...register(`variants.${idx}.shippingWeight`)} className="h-[34px] border-[#ccc] rounded-none text-right text-[13px] shadow-none font-medium" />
                            </div>
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

        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <Label className="text-[11px] font-black text-slate-700 uppercase block mb-5 text-center tracking-widest border-b pb-3">Album hình ảnh *</Label>
            <div className="grid grid-cols-2 gap-3 mb-2">
              {mainImages.map((src, i) => (
                <div key={i} className="relative aspect-square border border-[#eee] rounded-none overflow-hidden group shadow-sm">
                  <img src={src} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setValue("images", mainImages.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={12} />
                  </button>
                </div>
              ))}
              <div onClick={() => mainImagesRef.current?.click()} className="aspect-square border-2 border-dashed border-[#ddd] rounded-none flex flex-col items-center justify-center bg-[#fcfcfc] hover:bg-emerald-50 cursor-pointer shadow-inner transition-colors group">
                <Upload size={24} className="text-slate-300 group-hover:text-emerald-500 mb-1" />
                <span className="text-[9px] font-black text-slate-400 group-hover:text-emerald-600 uppercase tracking-tighter">Tải ảnh lên</span>
              </div>
            </div>
            <input type="file" ref={mainImagesRef} multiple hidden onChange={handleMainImagesChange} accept="image/*" />
          </div>

          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <Label className="text-[11px] font-black text-slate-700 uppercase block mb-5 tracking-widest border-b pb-3">Trạng thái phát hành</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-[38px] text-[13px] border-[#ccc] rounded-none font-black text-emerald-600 shadow-none focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="active" className="text-emerald-600 font-bold">ĐANG KINH DOANH</SelectItem>
                    <SelectItem value="inactive" className="text-rose-600 font-bold">TẠM NGỪNG BÁN</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[12px_30px] flex items-center justify-end gap-[15px] z-[999] shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        <Button type="button" variant="outline" onClick={() => router.back()} className="min-w-[110px] h-[38px] text-[12px] font-bold border-[#ccc] bg-white rounded-none shadow-sm hover:bg-slate-50 transition-all uppercase">
          HỦY BỎ
        </Button>
        <Button type="submit" disabled={isLoading} className="min-w-[150px] h-[38px] text-[12px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-none shadow-md shadow-emerald-100 transition-all active:scale-[0.98] uppercase">
          {isLoading ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Save size={18} className="mr-2" />}
          LƯU DỮ LIỆU
        </Button>
      </div>
    </form>
  );
}