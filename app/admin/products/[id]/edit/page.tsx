"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import {
    X, Trash2, Save, ChevronLeft, Camera, Upload, AlertCircle, FileText, Layers, Loader2, ChevronDown, Check, Package, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ProductService } from "@/app/services/product.service";
import { FileService } from "@/app/services/file.service";
import { SettingService } from "@/app/services/setting.service";
import { useAuthStore } from "@/stores/useAuthStore";
import { Attribute } from "@/app/types/product.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ─── VALIDATION SCHEMA ───
const variantSchema = z.object({
    sku: z.string().min(3, "SKU phải có ít nhất 3 ký tự"),
    barcode: z.string().optional(),
    attributeValueIds: z.array(z.number()).optional(),
    imageUrl: z.any().optional(),
});

const AdminProductSchema = z.object({
    name: z.string().min(5, "Tên sản phẩm phải có ít nhất 5 ký tự"),
    categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
    brand: z.string().optional(),
    origin: z.string().optional(),
    baseSku: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]),
    variants: z.array(variantSchema).min(1, "Phải có ít nhất 1 biến thể"),
});

type ProductFormData = z.infer<typeof AdminProductSchema>;

const DEFAULT_VARIANT = { sku: "", barcode: "", attributeValueIds: [], imageUrl: null };

const ErrorMessage = ({ message }: { message?: string }) => {
    if (!message) return null;
    return <p className="text-[11px] text-rose-500 font-bold mt-1 flex items-center gap-1"><AlertCircle size={12} className="shrink-0" />{message}</p>;
};

function CreatableCombobox({ options, value, onSelect, placeholder = "Chọn..." }: any) {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full h-[34px] justify-between text-[13px] border-[#ccc] shadow-none font-normal bg-white">
                    {value ? <span>{value}</span> : <span className="text-slate-400">{placeholder}</span>}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                <Command>
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
                            {options.map((option: string, index: number) => (
                                <CommandItem
                                    key={`brand-opt-${index}-${option}`}
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

function SectionHeader({ num, icon: Icon, title, color = "text-emerald-700" }: any) {
    return <div className={cn("flex items-center gap-2 mb-5 font-black text-[11px] uppercase tracking-widest border-b pb-3", color)}><Icon size={15} />{num}. {title}</div>;
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
    const [attributes, setAttributes] = useState<any[]>([]); // Dùng any để nhận mảng valueDetails

    const [systemProfitMargin, setSystemProfitMargin] = useState<number>(30);

    const { isLoadingAuth, isAuthenticated, user } = useAuthStore();
    const isAdmin = user?.role?.slug === "ADMIN";

    const { register, handleSubmit, control, setValue, watch, getValues, reset, formState: { errors } } = useForm<ProductFormData>({
        resolver: zodResolver(AdminProductSchema),
        defaultValues: { name: "", categoryId: "", brand: "", origin: "", baseSku: "", description: "", status: "ACTIVE", variants: [DEFAULT_VARIANT] },
    });

    const { fields, append, remove } = useFieldArray({ control, name: "variants" });
    const [variantDataMap, setVariantDataMap] = useState<Record<number, any>>({});

    useEffect(() => {
        if (!isLoadingAuth && isAuthenticated && id) {
            const fetchData = async () => {
                try {
                    setIsFetching(true);
                    const [catRes, brandRes, attrRes, productDetail] = await Promise.all([
                        ProductService.getCategories(),
                        ProductService.getBrands(),
                        ProductService.getAttributes(),
                        ProductService.getById(id),
                    ]);

                    setCategories(catRes || []);
                    setBrands(Array.from(new Set(brandRes?.map((b: any) => b.name) || [])) as string[]);
                    setAttributes(attrRes || []);

                    try {
                        const marginRes = await SettingService.getProfitMargin();
                        setSystemProfitMargin(Number(marginRes?.margin || 30));
                    } catch (e) {
                        setSystemProfitMargin(30);
                    }

                    // Đổ dữ liệu
                    const mappedData: any = {
                        name: productDetail.name || "",
                        categoryId: productDetail.category?.id ? String(productDetail.category.id) : "",
                        brand: productDetail.brand?.name || "",
                        origin: productDetail.origin || "",
                        baseSku: productDetail.baseSku || "",
                        description: productDetail.description || "",
                        status: productDetail.status || "ACTIVE",
                        variants: (productDetail.variants || []).map((v: any) => ({
                            sku: v.sku || "",
                            barcode: v.barcode || "",
                            attributeValueIds: (v.attributeValues || []).map((av: any) => Number(av.valueId || av.id)),
                            imageUrl: v.imageUrl || null,
                        })),
                    };

                    const extraData: Record<number, any> = {};
                    (productDetail.variants || []).forEach((v: any, index: number) => {
                        extraData[index] = {
                            quantity: v.quantity || 0,
                            batches: v.batches || []
                        };
                    });
                    setVariantDataMap(extraData);
                    reset(mappedData);

                    if (productDetail.imageUrls?.length > 0) {
                        setProductImageFiles(productDetail.imageUrls);
                        setProductImagePreviews(productDetail.imageUrls);
                    }
                    const vImages = (productDetail.variants || []).map((v: any) => v.imageUrl || null);
                    setVariantImageFiles(vImages);
                    setVariantImagePreviews(vImages.map((img: string | null) => img || ""));

                } catch (error) {
                    toast.error("Không thể tải thông tin sản phẩm.");
                } finally {
                    setIsFetching(false);
                }
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
        setProductImageFiles((prev) => prev.filter((_, i) => i !== idx));
        setProductImagePreviews((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleVariantImageChange = (variantIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setVariantImageFiles((prev) => { const n = [...prev]; n[variantIndex] = file; return n; });
        setVariantImagePreviews((prev) => { const n = [...prev]; n[variantIndex] = URL.createObjectURL(file); return n; });
    };

    const handleAppendVariant = () => {
        const currentBaseSku = getValues("baseSku") || "SP";
        const currentVariants = getValues("variants") || [];

        let maxSuffix = 0;
        currentVariants.forEach(v => {
            if (v.sku) {
                const parts = v.sku.split('-');
                const num = parseInt(parts[parts.length - 1]);
                if (!isNaN(num) && num > maxSuffix) maxSuffix = num;
            }
        });

        const newSku = `${currentBaseSku}-${maxSuffix + 1}`;
        const newBarcode = `893${Math.floor(100000000 + Math.random() * 900000000)}`;

        append({ ...DEFAULT_VARIANT, sku: newSku, barcode: newBarcode });
        setVariantImageFiles((prev) => [...prev, null]);
        setVariantImagePreviews((prev) => [...prev, ""]);
        setVariantDataMap(prev => ({ ...prev, [fields.length]: { quantity: 0, batches: [] } }));
    };

    const handleRemoveVariant = (idx: number) => {
        if (fields.length === 1) {
            toast.error("Phải có ít nhất 1 biến thể.");
            return;
        }

        const currentStock = variantDataMap[idx]?.quantity || 0;
        if (currentStock > 0) {
            toast.error(`Chặn xóa: Biến thể này đang còn ${currentStock} sản phẩm trong kho.`, { duration: 4000 });
            return;
        }
        remove(idx);
        setVariantImageFiles((prev) => prev.filter((_, i) => i !== idx));
        setVariantImagePreviews((prev) => prev.filter((_, i) => i !== idx));

        setVariantDataMap(prev => {
            const newMap: Record<number, any> = {};
            let newIdx = 0;
            for (let i = 0; i < Object.keys(prev).length; i++) {
                if (i !== idx) {
                    newMap[newIdx] = prev[i];
                    newIdx++;
                }
            }
            return newMap;
        });
    };

    const onSubmit = async (data: ProductFormData) => {
        if (productImageFiles.length === 0) return toast.error("Vui lòng tải lên ít nhất 1 ảnh sản phẩm.");
        const skus = data.variants.map(v => v.sku.toLowerCase().trim());
        if (skus.length !== new Set(skus).size) return toast.error("Mã SKU giữa các biến thể không được trùng lặp.");

        const rawVariants = getValues("variants") || [];

        const attrCombos = rawVariants.map((v: any, index: number) => {
            const attrs = v.attributeValueIds || [];
            if (attrs.length === 0) return `empty-${index}`;
            return [...attrs].sort((a: number, b: number) => a - b).join('_');
        });

        const uniqueCombos = new Set();
        for (let i = 0; i < attrCombos.length; i++) {
            const combo = attrCombos[i];
            if (!combo.startsWith('empty-')) {
                if (uniqueCombos.has(combo)) {
                    toast.error(`Biến thể số ${i + 1} bị trùng lặp tổ hợp phân loại với biến thể khác!`);
                    return;
                }
                uniqueCombos.add(combo);
            }
        }

        try {
            setIsLoading(true);

            // 1. Tách ảnh cũ (URL) và ảnh mới (File)
            const existingMainImages = productImageFiles.filter(img => typeof img === 'string');
            const newMainImageFiles = productImageFiles.filter(img => typeof img !== 'string');

            const productData: any = {
                name: data.name.trim(), categoryId: Number(data.categoryId), brand: data.brand?.trim() || "",
                origin: data.origin?.trim() || "", description: data.description || "", status: data.status,
                images: existingMainImages, // Báo cho Backend giữ lại các ảnh cũ này
                variants: rawVariants.map((v: any, vIdx: number) => {
                    const img = variantImageFiles[vIdx];
                    return {
                        sku: v.sku.trim(), barcode: v.barcode?.trim() || "",
                        image: typeof img === 'string' ? img : null, // Nếu là ảnh cũ thì gửi link, ảnh mới gửi null
                        attributeValueIds: v.attributeValueIds || [],
                    };
                }),
            };

            const formData = new FormData();
            formData.append("data", new Blob([JSON.stringify(productData)], { type: "application/json" }));

            // 2. Gửi ảnh sản phẩm chính MỚI lên
            newMainImageFiles.forEach((file) => {
                formData.append("productImages", file as File);
            });

            // 3. Gửi ảnh biến thể (giữ đúng vị trí Index để BE map chuẩn)
            variantImageFiles.forEach((file) => {
                if (file && typeof file !== 'string') {
                    formData.append("variantImages", file as File);
                } else {
                    formData.append("variantImages", new Blob([], { type: "image/png" }));
                }
            });

            await ProductService.update(id, formData);
            toast.success("Cập nhật sản phẩm thành công!");
            router.push("/admin/products");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Có lỗi khi cập nhật sản phẩm.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) return (<div className="flex flex-col items-center justify-center min-h-[400px] gap-3"><Loader2 className="h-10 w-10 animate-spin text-emerald-600" /><p className="text-sm text-slate-500 font-medium">Đang tải thông tin sản phẩm...</p></div>);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-[100px] bg-slate-50/30 p-4">
            <div className="flex items-center gap-3 mb-2 px-1">
                <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400"><ChevronLeft size={20} /></Button>
                <h1 className="text-[17px] font-black text-[#1f1f1f] tracking-tight uppercase flex-1">Chỉnh sửa: {watch("name")}</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-9 space-y-5">
                    <div className="bg-white border border-[#dcdcdc] p-5 shadow-sm">
                        <SectionHeader num="1" icon={AlertCircle} title="Định danh sản phẩm" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase">Tên sản phẩm *</Label>
                                <Input {...register("name")} className={cn("h-[34px] text-[13px] border-[#ccc] shadow-none focus:border-emerald-500", errors.name && "border-rose-500")} />
                                <ErrorMessage message={errors.name?.message} />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
                                    Mã SKU Gốc
                                    <span title="Được sinh tự động, không thể sửa đổi">
                                        <Info size={11} className="text-slate-400" />
                                    </span>
                                </Label>
                                <Input
                                    {...register("baseSku")}
                                    readOnly
                                    className="h-[34px] border-[#ccc] font-mono text-[13px] text-slate-500 bg-slate-50 shadow-none font-bold cursor-not-allowed focus-visible:ring-0"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase">Danh mục *</Label>
                                <Controller name="categoryId" control={control} render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="h-[34px] border-[#ccc] shadow-none"><SelectValue placeholder="Chọn..." /></SelectTrigger>
                                        <SelectContent>
                                            {categories.map((cat, catIdx) => {
                                                const uniqueVal = cat.id != null ? String(cat.id) : `cat-idx-${catIdx}`;
                                                return (
                                                    <SelectItem key={`cat-${uniqueVal}`} value={uniqueVal}>
                                                        {cat.name}
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                )} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase">Thương hiệu</Label>
                                <Controller name="brand" control={control} render={({ field }) => <CreatableCombobox options={brands} value={field.value || ""} onSelect={field.onChange} placeholder="Chọn..." />} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase">Xuất xứ</Label>
                                <Input {...register("origin")} className="h-[34px] border-[#ccc] shadow-none" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-[#dcdcdc] p-5 shadow-sm">
                        <SectionHeader num="2" icon={FileText} title="Mô tả hàng hóa" />
                        <Textarea {...register("description")} placeholder="Nhập mô tả sản phẩm..." className="min-h-[120px] border-[#ccc] text-[13px] shadow-none resize-y" />
                    </div>

                    <div className="bg-white border border-[#dcdcdc] shadow-sm">
                        <div className="px-5 py-3 border-b bg-[#f8f9fa] flex justify-between items-center">
                            <h3 className="text-[11px] font-black text-slate-700 flex items-center gap-2 uppercase"><Layers size={15} className="text-emerald-600" />3. Biến thể và Lô hàng</h3>
                            <Button type="button" variant="outline" onClick={handleAppendVariant} className="h-[28px] text-[10px] font-black text-emerald-600 border-emerald-200 bg-white uppercase">+ Thêm biến thể</Button>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {fields.map((field, idx) => {
                                const extraData = variantDataMap[idx] || { quantity: 0, batches: [] };
                                const currentStock = extraData.quantity;
                                const batches = extraData.batches;
                                const variantAttributeIds = watch(`variants.${idx}.attributeValueIds`) || [];

                                return (
                                    <div key={field.id} className="p-5 bg-white">
                                        <div className="flex flex-col xl:flex-row gap-5">
                                            <div className="flex flex-col items-center shrink-0">
                                                <div onClick={() => document.getElementById(`v-img-${idx}`)?.click()} className="w-[100px] h-[100px] border border-[#ddd] bg-slate-50 flex items-center justify-center cursor-pointer group hover:border-emerald-50 overflow-hidden relative">
                                                    {variantImagePreviews[idx] ? <img src={variantImagePreviews[idx]} className="w-full h-full object-cover" alt="Variant" /> : <Camera size={26} className="text-slate-300" />}
                                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Upload size={15} className="text-white" /></div>
                                                </div>
                                                <input type="file" id={`v-img-${idx}`} hidden onChange={(e) => handleVariantImageChange(idx, e)} accept="image/*" />
                                            </div>

                                            <div className="flex-1 space-y-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[12px] font-bold text-slate-600">Phân loại & Định danh SKU</span>
                                                    <Button type="button" variant="outline" onClick={() => handleRemoveVariant(idx)} className={cn("h-[28px] text-[10px] uppercase font-black px-3", currentStock > 0 ? "text-slate-400 border-slate-200 cursor-not-allowed bg-slate-50" : "text-rose-500 border-rose-100 hover:bg-rose-50")}>
                                                        <Trash2 size={12} className="mr-1" /> {currentStock > 0 ? "Kẹt tồn kho" : "Xóa SKU này"}
                                                    </Button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-bold uppercase">Mã SKU Phân loại *</Label>
                                                        <Input
                                                            {...register(`variants.${idx}.sku`)}
                                                            readOnly
                                                            className="h-[34px] border-[#ccc] font-mono text-[13px] bg-slate-50 text-slate-500 font-bold cursor-not-allowed focus-visible:ring-0 shadow-inner inset-0"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-bold uppercase">Mã vạch (Barcode)</Label>
                                                        <Input
                                                            {...register(`variants.${idx}.barcode`)}
                                                            readOnly
                                                            className="h-[34px] border-[#ccc] font-mono text-[13px] bg-slate-50 text-slate-500 cursor-not-allowed focus-visible:ring-0 shadow-inner inset-0"
                                                        />
                                                    </div>
                                                </div>

                                                {/* 👉 FIX LỖI "TÀNG HÌNH" THUỘC TÍNH BẰNG MẢNG valueDetails TỪ BACKEND */}
                                                {attributes.length > 0 && (
                                                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 border border-dashed border-slate-200 mt-2">
                                                        {attributes.map((attr, attrIdx) => {
                                                            const attributeOptions = attr.valueDetails || [];
                                                            const matchedValue = attributeOptions.find((v: any) => variantAttributeIds.includes(Number(v.valueId)));
                                                            const currentValStr = matchedValue ? String(matchedValue.valueId) : "none";

                                                            return (
                                                                <div key={`v-${field.id}-attr-${attr.id || attrIdx}`} className="space-y-1">
                                                                    <Label className="text-[10px] font-bold uppercase">{attr.name}</Label>
                                                                    <Controller
                                                                        name={`variants.${idx}.attributeValueIds`}
                                                                        control={control}
                                                                        render={({ field: selectField }) => (
                                                                            <Select
                                                                                onValueChange={(val) => {
                                                                                    const current = selectField.value || [];
                                                                                    const others = current.filter((id: number) => !attributeOptions.some((v: any) => Number(v.valueId) === id));
                                                                                    const newValue = val !== "none" ? [...others, Number(val)] : others;
                                                                                    selectField.onChange(newValue);
                                                                                }}
                                                                                value={currentValStr}
                                                                            >
                                                                                <SelectTrigger className="h-[30px] border-[#ccc] bg-white">
                                                                                    <SelectValue placeholder={`-- Chọn --`} />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    <SelectItem value="none">-- Bỏ chọn --</SelectItem>
                                                                                    {attributeOptions.map((v: any, vIdx: number) => {
                                                                                        const uniqueValId = v.valueId != null ? String(v.valueId) : `val-idx-${vIdx}`;
                                                                                        return (
                                                                                            <SelectItem key={`attr-val-${uniqueValId}`} value={uniqueValId}>
                                                                                                {v.value}
                                                                                            </SelectItem>
                                                                                        );
                                                                                    })}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        )}
                                                                    />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                <div className="border border-[#e0e0e0] rounded-[4px] overflow-hidden mt-4">
                                                    <div className="bg-[#f4f6f8] px-3 py-2 border-b flex justify-between items-center">
                                                        <span className="text-[11px] font-black text-slate-700 uppercase flex items-center gap-1.5"><Package size={14} className="text-blue-600"/> Lô hàng hiện tại</span>
                                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Tổng tồn: {currentStock}</span>
                                                    </div>

                                                    {batches.length > 0 ? (
                                                        <div className="max-h-[150px] overflow-y-auto">
                                                            <table className="w-full text-left">
                                                                <thead className="bg-white border-b sticky top-0">
                                                                <tr>
                                                                    <th className="p-2 text-[9px] font-bold text-slate-400 uppercase">Mã Lô</th>
                                                                    <th className="p-2 text-[9px] font-bold text-slate-400 uppercase">Vị trí</th>
                                                                    <th className="p-2 text-[9px] font-bold text-slate-400 uppercase text-center">Tồn</th>
                                                                    {isAdmin && <th className="p-2 text-[9px] font-bold text-blue-500 uppercase text-right">Giá vốn</th>}
                                                                    <th className="p-2 text-[9px] font-bold text-emerald-600 uppercase text-right">Giá bán niêm yết</th>
                                                                </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-50">
                                                                {batches.map((b: any, bIdx: number) => {
                                                                    const importPrice = b.importPrice || 0;
                                                                    const dynamicSellingPrice = importPrice * (1 + systemProfitMargin / 100);

                                                                    return (
                                                                        <tr key={`batch-${field.id}-${b.inventoryId || bIdx}`} className="hover:bg-slate-50">
                                                                            <td className="p-2 text-[11px] font-mono font-bold text-slate-700">{b.batchNumber}</td>
                                                                            <td className="p-2 text-[10px] font-medium text-slate-500">{b.branchName}</td>
                                                                            <td className="p-2 text-[11px] font-black text-slate-700 text-center">{b.quantity}</td>
                                                                            {isAdmin && <td className="p-2 text-[11px] font-bold text-blue-600 text-right">{importPrice.toLocaleString('vi-VN')} ₫</td>}
                                                                            <td className="p-2 text-[11px] font-black text-emerald-600 text-right">{dynamicSellingPrice.toLocaleString('vi-VN')} ₫</td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <div className="p-5 text-center flex flex-col items-center justify-center bg-white">
                                                            <Info size={16} className="text-slate-300 mb-1" />
                                                            <p className="text-[11px] font-medium text-slate-400">Biến thể này hiện đã hết hàng trong kho.</p>
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

                <div className="lg:col-span-3 space-y-5">
                    <div className="bg-white border border-[#dcdcdc] p-5 shadow-sm">
                        <Label className="text-[11px] font-black text-slate-700 uppercase block mb-4 text-center border-b pb-3 tracking-widest">Album hình ảnh *</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {productImagePreviews.map((src, i) => (
                                <div key={`main-img-preview-${i}`} className="relative aspect-square border group">
                                    <img src={src} className="w-full h-full object-cover" alt="" />
                                    <button type="button" onClick={() => removeMainImage(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
                                </div>
                            ))}
                            <div onClick={() => mainImagesRef.current?.click()} className="aspect-square border-2 border-dashed flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                                <Upload size={20} className="text-slate-300" />
                            </div>
                        </div>
                        <input type="file" ref={mainImagesRef} multiple hidden onChange={handleMainImagesChange} accept="image/*" />
                    </div>

                    <div className="bg-white border border-[#dcdcdc] p-5 shadow-sm">
                        <Label className="text-[11px] font-black text-slate-700 uppercase block mb-4 border-b pb-3 tracking-widest">Trạng thái phát hành</Label>
                        <Controller name="status" control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="h-[38px] border-[#ccc] shadow-none font-bold"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVE" className="text-emerald-600 font-bold">Đang kinh doanh</SelectItem>
                                    <SelectItem value="INACTIVE" className="text-rose-500 font-bold">Tạm ngừng bán</SelectItem>
                                    <SelectItem value="DRAFT" className="text-slate-500 font-bold">Lưu nháp</SelectItem>
                                </SelectContent>
                            </Select>
                        )} />
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 right-0 left-[260px] bg-white border-t p-3 flex justify-end gap-3 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-none font-bold px-8">HỦY</Button>
                <Button type="submit" disabled={isLoading} className="bg-emerald-600 text-white rounded-none font-bold px-10">
                    {isLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />} CẬP NHẬT
                </Button>
            </div>
        </form>
    );
}