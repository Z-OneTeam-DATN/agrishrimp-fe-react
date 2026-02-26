"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import {
    X, Trash2, Save, ChevronLeft, Camera, Upload, AlertCircle, FileText, Layers, Loader2, ChevronDown, ArrowRightLeft, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "@/components/admin/shared/RichTextEditor";
import { ProductService } from "@/app/services/product.service";
import { FileService } from "@/app/services/file.service";
import { useAuthStore } from "@/stores/useAuthStore";
import { Attribute, UpdateProductRequest } from "@/app/types/product.schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// ─── VALIDATION SCHEMA ───
const variantSchema = z.object({
    sku: z.string().min(3, "SKU phải có ít nhất 3 ký tự"),
    barcode: z.string().optional().nullable(),
    costPrice: z.coerce.number().min(0, "Giá vốn không được âm"),
    price: z.coerce.number().min(0, "Giá bán không được âm"),
    wholesalePrice: z.coerce.number().min(0, "Giá sỉ không được âm").optional().nullable(),
    initialStock: z.coerce.number().min(0, "Tồn kho không được âm").optional().nullable(),
    shippingWeight: z.coerce.number().min(0, "Trọng lượng không được âm").optional().nullable(),
    attributeValueIds: z.array(z.number()).optional(),
    imageUrl: z.string().optional().nullable(),
}).refine((data) => data.price >= data.costPrice, {
    message: "Giá bán không được thấp hơn giá vốn",
    path: ["price"],
});

const productSchema = z.object({
    name: z.string().min(5, "Tên sản phẩm phải có ít nhất 5 ký tự"),
    categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
    brand: z.string().optional().nullable(),
    origin: z.string().optional().nullable(),
    baseSku: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]),
    variants: z.array(variantSchema).min(1, "Phải có ít nhất 1 biến thể"),
});

type ProductFormData = z.infer<typeof productSchema>;

const DEFAULT_VARIANT = {
    sku: "", barcode: "", costPrice: 0, price: 0, wholesalePrice: 0, initialStock: 0, shippingWeight: 0, attributeValueIds: [], imageUrl: null,
};

const ErrorMessage = ({ message }: { message?: string }) => {
    if (!message) return null;
    return (
        <p className="text-[11px] text-rose-500 font-bold mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={12} className="shrink-0" />{message}
        </p>
    );
};

interface CreatableComboboxProps {
    options: string[]; value?: string; onSelect: (val: string) => void; placeholder?: string;
}

function CreatableCombobox({ options, value, onSelect, placeholder = "Chọn..." }: CreatableComboboxProps) {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full h-[34px] justify-between text-[13px] border-[#ccc] rounded-none px-3 font-normal bg-white shadow-none">
                    {value ? <span>{value}</span> : <span className="text-slate-400">{placeholder}</span>}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[--radix-popover-trigger-width] rounded-none" align="start">
                <Command className="rounded-none">
                    <CommandInput placeholder="Tìm hoặc gõ mới..." className="h-9 text-[13px]" value={inputValue} onValueChange={setInputValue} onKeyDown={(e) => {
                        if (e.key === "Enter" && inputValue) { onSelect(inputValue); setOpen(false); setInputValue(""); }
                    }} />
                    <CommandList>
                        <CommandEmpty>
                            <Button variant="ghost" className="w-full justify-start h-8 text-emerald-600 text-[12px] font-bold px-2" onClick={() => { onSelect(inputValue); setOpen(false); setInputValue(""); }}>
                                + Thêm &quot;{inputValue}&quot;
                            </Button>
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map((option, index) => (
                                <CommandItem
                                    key={`brand-opt-${option}-${index}`} // ✅ Đảm bảo Key luôn duy nhất
                                    value={option}
                                    onSelect={() => { onSelect(option); setOpen(false); setInputValue(""); }}
                                    className="text-[13px]"
                                >
                                    <Check className={cn("mr-2 h-4 w-4", value === option ? "opacity-100" : "opacity-0")} />{option}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function SectionHeader({ num, icon: Icon, title, color = "text-emerald-700" }: { num: string; icon: React.ElementType; title: string; color?: string; }) {
    return (
        <div className={cn("flex items-center gap-2 mb-5 font-black text-[11px] uppercase tracking-widest border-b pb-3", color)}>
            <Icon size={15} />{num}. {title}
        </div>
    );
}

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const mainImagesRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    const [productImageFiles, setProductImageFiles] = useState<(File | string)[]>([]);
    const [productImagePreviews, setProductImagePreviews] = useState<string[]>([]);
    const [variantImageFiles, setVariantImageFiles] = useState<(File | string | null)[]>([]);
    const [variantImagePreviews, setVariantImagePreviews] = useState<string[]>([]);

    const [categories, setCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<string[]>([]);
    const [attributes, setAttributes] = useState<Attribute[]>([]);

    const [unitConversions, setUnitConversions] = useState<{ fromUnit: string; toUnit: string; rate: number | string }[]>([]);
    const { isLoadingAuth, isAuthenticated } = useAuthStore();

    const { register, handleSubmit, control, setValue, watch, reset, formState: { errors } } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema), mode: "onTouched",
        defaultValues: { name: "", categoryId: "", brand: "", origin: "", baseSku: "", description: "", status: "ACTIVE", variants: [DEFAULT_VARIANT] },
    });

    const { fields, append, remove } = useFieldArray({ control, name: "variants" });

    useEffect(() => {
        if (!isLoadingAuth && isAuthenticated && id) {
            const fetchData = async () => {
                try {
                    setIsFetching(true);
                    const [catRes, brandRes, attrRes, productDetail] = await Promise.all([
                        ProductService.getCategories(), ProductService.getBrands(), ProductService.getAttributes(), ProductService.getById(id),
                    ]);

                    setCategories(catRes || []);
                    const uniqueBrands = Array.from(new Set(brandRes?.map((b: any) => b.name) || [])) as string[];
                    setBrands(uniqueBrands);
                    setAttributes(attrRes || []);

                    const mappedData: ProductFormData = {
                        name: productDetail.name || "",
                        categoryId: productDetail.category?.id ? String(productDetail.category.id) : ((productDetail as any).categoryId ? String((productDetail as any).categoryId) : ""),
                        brand: productDetail.brand?.name || productDetail.brandName || (typeof productDetail.brand === 'string' ? productDetail.brand : ""),
                        origin: productDetail.origin || "", baseSku: productDetail.baseSku || "", description: productDetail.description || "", status: (productDetail.status as any) || "ACTIVE",
                        variants: (productDetail.variants || []).map((v: any) => {
                            let attrIds: number[] = [];
                            if (Array.isArray(v.attributeValues) && v.attributeValues.length > 0) {
                                attrIds = v.attributeValues.map((av: any) => av.valueId || av.attributeValueId || av.id).filter((id: any) => id !== null && id !== undefined).map((id: any) => Number(id));
                            } else if (Array.isArray(v.attributeValueIds)) {
                                attrIds = v.attributeValueIds.map((id: any) => Number(id));
                            }

                            return {
                                sku: v.sku || "", barcode: v.barcode || "", costPrice: v.costPrice || 0, price: v.price || 0, wholesalePrice: v.wholesalePrice || 0,
                                initialStock: v.quantity || 0,
                                shippingWeight: v.shippingWeight || 0, attributeValueIds: attrIds, imageUrl: v.imageUrl || null,
                            };
                        }),
                    };

                    reset(mappedData);

                    if (productDetail.imageUrls?.length > 0) { setProductImageFiles(productDetail.imageUrls); setProductImagePreviews(productDetail.imageUrls); }
                    const vImages = (productDetail.variants || []).map((v: any) => v.imageUrl || null);
                    setVariantImageFiles(vImages); setVariantImagePreviews(vImages.map((img: string | null) => img || ""));
                    if (productDetail.variants?.[0]?.unitConversions) {
                        setUnitConversions(productDetail.variants[0].unitConversions.map(uc => ({ fromUnit: uc.fromUnit, toUnit: uc.toUnit, rate: uc.rate })));
                    }
                } catch (error) { toast.error("Không thể tải thông tin sản phẩm."); } finally { setIsFetching(false); }
            };
            fetchData();
        }
    }, [isLoadingAuth, isAuthenticated, id, reset]);

    const handleMainImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setProductImageFiles((prev) => [...prev, ...files]);
            setProductImagePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
        }
    };

    const removeMainImage = (idx: number) => {
        setProductImageFiles((prev) => prev.filter((_, i) => i !== idx)); setProductImagePreviews((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleVariantImageChange = (variantIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setVariantImageFiles((prev) => { const n = [...prev]; n[variantIndex] = file; return n; });
        setVariantImagePreviews((prev) => { const n = [...prev]; n[variantIndex] = URL.createObjectURL(file); return n; });
    };

    const handleAppendVariant = () => {
        append(DEFAULT_VARIANT); setVariantImageFiles((prev) => [...prev, null]); setVariantImagePreviews((prev) => [...prev, ""]);
    };

    const handleRemoveVariant = (idx: number) => {
        if (fields.length === 1) {
            toast.error("Phải có ít nhất 1 biến thể.");
            return;
        }
        const currentStock = watch(`variants.${idx}.initialStock`) || 0;
        if (currentStock > 0) {
            toast.error(`Chặn xóa: Biến thể này đang còn ${currentStock} sản phẩm trong kho.`, { duration: 4000 });
            return;
        }
        remove(idx);
        setVariantImageFiles((prev) => prev.filter((_, i) => i !== idx));
        setVariantImagePreviews((prev) => prev.filter((_, i) => i !== idx));
    };

    const setAttributeValue = (variantIndex: number, attrId: number | string, valueId: number | string) => {
        const currentValues = watch(`variants.${variantIndex}.attributeValueIds`) || [];
        const currentIds = Array.isArray(currentValues) ? currentValues.map(Number).filter(id => !isNaN(id)) : [];
        const attr = attributes.find((a) => String(a.id) === String(attrId));
        if (!attr) return;

        const attrValueIds = attr.values.map(v => Number(v.id));
        const others = currentIds.filter(id => !attrValueIds.includes(id));
        let newValueIds = [...others];
        if (valueId !== "none" && valueId !== "" && valueId !== null) {
            const numericId = Number(valueId); if (!isNaN(numericId)) newValueIds.push(numericId);
        }
        setValue(`variants.${variantIndex}.attributeValueIds`, newValueIds, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    };

    const uploadFile = async (file: File): Promise<string> => {
        const formData = new FormData(); formData.append("file", file);
        const res = await FileService.tmpUpload(formData); return res.tmpPath;
    };

    const onSubmit = async (data: ProductFormData) => {
        if (productImageFiles.length === 0) { toast.error("Vui lòng tải lên ít nhất 1 ảnh sản phẩm."); return; }
        const skus = data.variants.map(v => v.sku.toLowerCase().trim());
        if (skus.length !== new Set(skus).size) { toast.error("Mã SKU giữa các biến thể không được trùng lặp."); return; }

        try {
            setIsLoading(true);
            const mainImageUrls = await Promise.all(productImageFiles.map(async (img) => { if (typeof img === "string") return img; return await uploadFile(img); }));
            const variantImageUrls = await Promise.all(variantImageFiles.map(async (img) => { if (!img) return null; if (typeof img === "string") return img; return await uploadFile(img); }));
            const validConversions = unitConversions.filter((uc) => uc.fromUnit && uc.toUnit && Number(uc.rate) > 0).map((uc) => ({ fromUnit: uc.fromUnit, toUnit: uc.toUnit, rate: Number(uc.rate), }));

            const updateData: UpdateProductRequest = {
                name: data.name.trim(), categoryId: Number(data.categoryId), brand: data.brand?.trim() || "", origin: data.origin?.trim() || "", description: data.description || "", status: data.status, images: mainImageUrls,
                variants: data.variants.map((v, vIdx) => ({
                    sku: v.sku.trim(), barcode: v.barcode?.trim() || "", costPrice: v.costPrice, price: v.price, wholesalePrice: v.wholesalePrice || 0, initialStock: v.initialStock || 0, shippingWeight: v.shippingWeight || 0, image: variantImageUrls[vIdx] || "", attributeValueIds: v.attributeValueIds || [], unitConversions: validConversions,
                })),
            };

            await ProductService.update(id, updateData);
            toast.success("Cập nhật sản phẩm thành công!");
            router.push("/admin/products");
        } catch (error: any) { toast.error(error.response?.data?.message || "Có lỗi khi cập nhật sản phẩm."); } finally { setIsLoading(false); }
    };

    if (isFetching) return (<div className="flex flex-col items-center justify-center min-h-[400px] gap-3"><Loader2 className="h-10 w-10 animate-spin text-emerald-600" /><p className="text-sm text-slate-500 font-medium">Đang tải thông tin sản phẩm...</p></div>);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-[100px] bg-slate-50/30 p-4">
            <div className="flex items-center gap-3 mb-2 px-1">
                <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400"><ChevronLeft size={20} /></Button>
                <h1 className="text-[17px] font-black text-[#1f1f1f] tracking-tight uppercase flex-1">Chỉnh sửa sản phẩm: {watch("name")}</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-9 space-y-5">
                    <div className="bg-white border border-[#dcdcdc] p-5 rounded-none shadow-sm">
                        <SectionHeader num="1" icon={AlertCircle} title="Thông tin sản phẩm chính" />
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2 space-y-1.5">
                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Tên sản phẩm *</Label>
                                    <Input {...register("name")} className={cn("h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:border-emerald-500", errors.name && "border-rose-500")} />
                                    <ErrorMessage message={errors.name?.message} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Danh mục *</Label>
                                    <Controller name="categoryId" control={control} render={({ field }) => (
                                        <div className="space-y-1">
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger className={cn("h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:border-emerald-500", errors.categoryId && "border-rose-500")}><SelectValue placeholder="-- Chọn danh mục --" /></SelectTrigger>
                                                <SelectContent className="rounded-none">
                                                    {/* ✅ FIX KEY TẠI ĐÂY */}
                                                    {categories.map((cat, catIdx) => (
                                                        <SelectItem key={`cat-item-${cat.id ?? catIdx}`} value={String(cat.id ?? catIdx)}>
                                                            {cat.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <ErrorMessage message={errors.categoryId?.message} />
                                        </div>
                                    )} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Thương hiệu</Label>
                                    <Controller name="brand" control={control} render={({ field }) => <CreatableCombobox options={brands} value={field.value || ""} onSelect={field.onChange} placeholder="Chọn hoặc nhập..." />} />
                                </div>
                                <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Xuất xứ</Label><Input {...register("origin")} className="h-[34px] border-[#ccc] rounded-none shadow-none" /></div>
                                <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Mã SKU gốc</Label><Input {...register("baseSku")} className="h-[34px] border-[#ccc] rounded-none shadow-none font-mono" /></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-[#dcdcdc] p-5 rounded-none shadow-sm">
                        <SectionHeader num="2" icon={FileText} title="Đặc tính & Bài viết mô tả" />
                        <Controller name="description" control={control} render={({ field }) => <RichTextEditor minHeight="250px" value={field.value || ""} onChange={field.onChange} />} />
                    </div>

                    <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-[#eee] bg-[#f8f9fa] flex justify-between items-center">
                            <h3 className="text-[11px] font-black text-slate-700 flex items-center gap-2 uppercase tracking-wider"><Layers size={15} className="text-emerald-600" />3. Danh sách biến thể sản phẩm (SKUs)</h3>
                            <Button type="button" variant="outline" onClick={handleAppendVariant} className="h-[28px] text-[10px] font-black text-emerald-600 border-emerald-200 bg-white px-4 rounded-none shadow-sm uppercase">+ Thêm biến thể</Button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {fields.map((field, idx) => {
                                const variantAttributeIds = watch(`variants.${idx}.attributeValueIds`) || [];
                                const currentStock = watch(`variants.${idx}.initialStock`) || 0;

                                return (
                                    <div key={`variant-field-${field.id}`} className="p-5 bg-white">
                                        <div className="flex flex-col xl:flex-row gap-5">
                                            <div className="flex flex-col items-center shrink-0">
                                                <div onClick={() => document.getElementById(`v-img-${idx}`)?.click()} className="w-[100px] h-[100px] border border-[#ddd] bg-slate-50 flex items-center justify-center cursor-pointer group hover:border-emerald-500 transition-all overflow-hidden relative">
                                                    {variantImagePreviews[idx] ? <img src={variantImagePreviews[idx]} className="w-full h-full object-cover" alt="Variant" /> : <><Camera size={26} className="text-slate-300" /><span className="text-[7px] font-bold text-slate-300 mt-1 uppercase tracking-wider">ẢNH SKU</span></>}
                                                </div>
                                                <input type="file" id={`v-img-${idx}`} hidden onChange={(e) => handleVariantImageChange(idx, e)} accept="image/*" />
                                            </div>

                                            <div className="flex-1 space-y-4">
                                                {attributes.length > 0 && (
                                                    <div className={cn("grid gap-4", attributes.length === 1 ? "grid-cols-1 max-w-xs" : "grid-cols-2")}>
                                                        {attributes.map((attr, attrIdx) => {
                                                            // ✅ FIX KEY TẠI ĐÂY
                                                            const selectedValueId = variantAttributeIds.find((id: number | string) => attr.values.some((v: any) => Number(v.id) === Number(id))) ?? "none";
                                                            return (
                                                                <div key={`v-${idx}-attr-${attr.id ?? attrIdx}`} className="space-y-1">
                                                                    <Label className="text-[10px] font-bold text-slate-500 uppercase">{attr.name} *</Label>
                                                                    <Select value={String(selectedValueId)} onValueChange={(val) => setAttributeValue(idx, attr.id, val)}>
                                                                        <SelectTrigger className="h-[34px] border-[#ccc] rounded-none text-[13px] bg-white shadow-none"><SelectValue placeholder={`Chọn ${attr.name}...`} /></SelectTrigger>
                                                                        <SelectContent className="rounded-none">
                                                                            <SelectItem value="none">-- Bỏ chọn --</SelectItem>
                                                                            {/* ✅ FIX KEY TẠI ĐÂY */}
                                                                            {attr.values.map((v, vIdx) => (
                                                                                <SelectItem key={`v-${idx}-attr-${attr.id}-val-${v.id ?? vIdx}`} value={String(v.id ?? vIdx)}>
                                                                                    {v.value}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-12 gap-3 items-start">
                                                    <div className="col-span-4 space-y-1">
                                                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Mã SKU biến thể *</Label>
                                                        <Input {...register(`variants.${idx}.sku`)} className={cn("h-[34px] border-[#ccc] rounded-none font-mono text-[13px] shadow-none focus:border-emerald-500", errors.variants?.[idx]?.sku && "border-rose-500")} />
                                                        <ErrorMessage message={errors.variants?.[idx]?.sku?.message} />
                                                    </div>
                                                    <div className="col-span-4 space-y-1">
                                                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Mã vạch / Barcode</Label>
                                                        <Input {...register(`variants.${idx}.barcode`)} className="h-[34px] border-[#ccc] rounded-none font-mono text-[13px]" />
                                                    </div>
                                                    <div className="col-span-4 flex gap-2 pt-5">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => handleRemoveVariant(idx)}
                                                            className={cn(
                                                                "w-full h-[34px] text-[10px] font-black rounded-none shadow-none uppercase",
                                                                currentStock > 0
                                                                    ? "text-slate-400 border-slate-200 bg-slate-50 cursor-not-allowed"
                                                                    : "text-rose-500 border-rose-100 hover:bg-rose-50"
                                                            )}
                                                        >
                                                            <Trash2 size={12} className="mr-1" /> {currentStock > 0 ? "Kẹt tồn kho" : "Xóa"}
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-bold text-blue-600 uppercase">Giá vốn *</Label>
                                                        <Input type="number" {...register(`variants.${idx}.costPrice`)} className="h-[34px] border-[#ccc] rounded-none text-right font-bold text-blue-600 bg-blue-50/20" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-bold text-emerald-600 uppercase">Giá bán lẻ *</Label>
                                                        <Input type="number" {...register(`variants.${idx}.price`)} className="h-[34px] border-[#ccc] rounded-none text-right font-bold text-emerald-700" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-bold text-orange-500 uppercase">Giá bán sỉ</Label>
                                                        <Input type="number" {...register(`variants.${idx}.wholesalePrice`)} className="h-[34px] border-[#ccc] rounded-none text-right font-bold text-orange-500" />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Tồn kho hiện tại (Chi nhánh)</Label>
                                                        <Input type="number" readOnly {...register(`variants.${idx}.initialStock`)} className="h-[34px] border-[#ccc] rounded-none text-right shadow-none bg-slate-50 text-slate-500 cursor-not-allowed focus-visible:ring-0" />
                                                        <p className="text-[9px] text-slate-400 italic">Được quản lý tự động qua phần mềm kho.</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Trọng lượng (kg)</Label>
                                                        <Input type="number" step="0.01" {...register(`variants.${idx}.shippingWeight`)} className="h-[34px] border-[#ccc] rounded-none text-right" />
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
                    <div className="bg-white border border-[#dcdcdc] p-5 rounded-none shadow-sm">
                        <Label className="text-[11px] font-black text-slate-700 uppercase block mb-4 text-center tracking-widest border-b pb-3">Album hình ảnh *</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {productImagePreviews.map((src, i) => (
                                <div key={`main-img-preview-${i}`} className="relative aspect-square border border-[#eee] group overflow-hidden">
                                    <img src={src} className="w-full h-full object-cover" alt="Product" />
                                    <button type="button" onClick={() => removeMainImage(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"><X size={11} /></button>
                                </div>
                            ))}
                            <div onClick={() => mainImagesRef.current?.click()} className="aspect-square border-2 border-dashed border-[#ddd] flex flex-col items-center justify-center bg-[#fcfcfc] hover:bg-emerald-50 cursor-pointer group">
                                <Upload size={18} className="text-slate-300 group-hover:text-emerald-500 mb-1" />
                                <span className="text-[8px] font-black text-slate-400 uppercase">Tải ảnh</span>
                            </div>
                        </div>
                        <input type="file" ref={mainImagesRef} multiple hidden onChange={handleMainImagesChange} accept="image/*" />
                    </div>

                    <div className="bg-white border border-[#dcdcdc] p-5 rounded-none shadow-sm">
                        <Label className="text-[11px] font-black text-slate-700 uppercase block mb-4 tracking-widest border-b pb-3">Trạng thái phát hành</Label>
                        <Controller name="status" control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="h-[38px] text-[13px] border-[#ccc] rounded-none font-black shadow-none"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-none">
                                    <SelectItem value="ACTIVE" className="text-emerald-600 font-bold">Đang kinh doanh</SelectItem>
                                    <SelectItem value="INACTIVE" className="text-rose-500 font-bold">Tạm ngừng bán</SelectItem>
                                    <SelectItem value="DRAFT" className="text-slate-500 font-bold">Lưu nháp</SelectItem>
                                </SelectContent>
                            </Select>
                        )} />
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-white border-t border-[#ddd] p-[12px_30px] flex items-center justify-end gap-3 z-[999] shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
                <Button type="submit" disabled={isLoading} className="min-w-[150px] h-[38px] text-[12px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-none shadow-md uppercase">
                    {isLoading ? <Loader2 size={17} className="mr-2 animate-spin" /> : <Save size={17} className="mr-2" />} Lưu thay đổi
                </Button>
            </div>
        </form>
    );
}