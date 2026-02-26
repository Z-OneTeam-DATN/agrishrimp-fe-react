"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import {
    X,
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
    Check,
    Settings2,
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
import { FileService } from "@/app/services/file.service"; // ADDED FILE SERVICE
import { useAuthStore } from "@/stores/useAuthStore";
import { Attribute } from "@/app/types/product.schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// ─── VALIDATION SCHEMA ───
// Đã bỏ min/max của initialStock vì mặc định bằng 0 và bị disabled
const variantSchema = z.object({
    sku: z.string().min(3, "SKU phải có ít nhất 3 ký tự"),
    barcode: z.string().optional(),
    costPrice: z.coerce.number().min(0, "Giá vốn không được âm"),
    price: z.coerce.number().min(0, "Giá bán không được âm"),
    wholesalePrice: z.coerce.number().min(0, "Giá sỉ không được âm").optional(),
    initialStock: z.coerce.number().optional(), // Bỏ validate chặt vì UI bị khóa
    shippingWeight: z.coerce.number().min(0, "Trọng lượng không được âm").optional(),
    attributeValueIds: z.array(z.number()).optional(),
}).refine((data) => data.price >= data.costPrice, {
    message: "Giá bán không được thấp hơn giá vốn",
    path: ["price"],
});

const productSchema = z.object({
    name: z.string().min(5, "Tên sản phẩm phải có ít nhất 5 ký tự"),
    categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
    brand: z.string().optional(),
    origin: z.string().optional(),
    baseSku: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]),
    variants: z.array(variantSchema).min(1, "Phải có ít nhất 1 biến thể"),
});

type ProductFormData = z.infer<typeof productSchema>;

const DEFAULT_VARIANT = {
    sku: "",
    barcode: "",
    costPrice: 0,
    price: 0,
    wholesalePrice: 0,
    initialStock: 0, // Mặc định là 0
    shippingWeight: 0,
    attributeValueIds: [],
};

// ─── ERROR MESSAGE COMPONENT ───
const ErrorMessage = ({ message }: { message?: string }) => {
    if (!message) return null;
    return (
        <p className="text-[11px] text-rose-500 font-bold mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={12} className="shrink-0" />
            {message}
        </p>
    );
};

// ─── CREATABLE COMBOBOX ───
interface CreatableComboboxProps {
    options: string[];
    value?: string;
    onSelect: (val: string) => void;
    placeholder?: string;
}

function CreatableCombobox({
                               options,
                               value,
                               onSelect,
                               placeholder = "Chọn...",
                           }: CreatableComboboxProps) {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className="w-full h-[34px] justify-between text-[13px] border-[#ccc] rounded-none px-3 font-normal bg-white shadow-none"
                >
                    {value ? (
                        <span>{value}</span>
                    ) : (
                        <span className="text-slate-400">{placeholder}</span>
                    )}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="p-0 w-[--radix-popover-trigger-width] rounded-none"
                align="start"
            >
                <Command className="rounded-none">
                    <CommandInput
                        placeholder="Tìm hoặc gõ mới..."
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
                        <CommandEmpty>
                            <Button
                                variant="ghost"
                                className="w-full justify-start h-8 text-emerald-600 text-[12px] font-bold px-2"
                                onClick={() => {
                                    onSelect(inputValue);
                                    setOpen(false);
                                    setInputValue("");
                                }}
                            >
                                + Thêm &quot;{inputValue}&quot;
                            </Button>
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map((option, index) => (
                                <CommandItem
                                    key={`${option}-${index}`}
                                    value={option}
                                    onSelect={() => {
                                        onSelect(option);
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

// ─── SECTION HEADER ───
function SectionHeader({
                           num,
                           icon: Icon,
                           title,
                           color = "text-emerald-700",
                       }: {
    num: string;
    icon: React.ElementType;
    title: string;
    color?: string;
}) {
    return (
        <div
            className={cn(
                "flex items-center gap-2 mb-5 font-black text-[11px] uppercase tracking-widest border-b pb-3",
                color
            )}
        >
            <Icon size={15} />
            {num}. {title}
        </div>
    );
}

// ─── MAIN PAGE ───
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
    const [attributes, setAttributes] = useState<Attribute[]>([]);

    // Product-level unit conversions (applied to all variants on submit)
    const [unitConversions, setUnitConversions] = useState<
        { fromUnit: string; toUnit: string; rate: number | string }[]
    >([]);

    const { isLoadingAuth, isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (!isLoadingAuth && isAuthenticated) {
            Promise.all([
                ProductService.getCategories(),
                ProductService.getBrands(),
                ProductService.getAttributes(),
            ])
                .then(([catRes, brandRes, attrRes]) => {
                    setCategories(catRes || []);
                    setBrands(brandRes?.map((b: any) => b.name) || []);
                    setAttributes(attrRes || []);
                })
                .catch(console.error);
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
    } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        mode: "onTouched",
        defaultValues: {
            name: "",
            categoryId: "",
            brand: "",
            origin: "",
            baseSku: "",
            description: "",
            status: "ACTIVE",
            variants: [DEFAULT_VARIANT],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "variants",
    });

    // ── ẢNH SẢN PHẨM ──
    const handleMainImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setProductImageFiles((prev) => [...prev, ...files]);
            setProductImagePreviews((prev) => [
                ...prev,
                ...files.map((f) => URL.createObjectURL(f)),
            ]);
        }
    };

    const removeMainImage = (idx: number) => {
        setProductImageFiles((prev) => prev.filter((_, i) => i !== idx));
        setProductImagePreviews((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleVariantImageChange = (
        variantIndex: number,
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setVariantImageFiles((prev) => {
            const n = [...prev];
            n[variantIndex] = file;
            return n;
        });
        setVariantImagePreviews((prev) => {
            const n = [...prev];
            n[variantIndex] = URL.createObjectURL(file);
            return n;
        });
    };

    // ── BIẾN THỂ ──
    const handleAppendVariant = () => {
        append(DEFAULT_VARIANT);
        setVariantImageFiles((prev) => [...prev, null]);
        setVariantImagePreviews((prev) => [...prev, ""]);
    };

    const handleRemoveVariant = (idx: number) => {
        if (fields.length === 1) {
            toast.error("Phải có ít nhất 1 biến thể.");
            return;
        }
        remove(idx);
        setVariantImageFiles((prev) => prev.filter((_, i) => i !== idx));
        setVariantImagePreviews((prev) => prev.filter((_, i) => i !== idx));
    };

    const setAttributeValue = (
        variantIndex: number,
        attrId: number | string,
        valueId: number | string
    ) => {

        // 1. Lấy giá trị hiện tại từ watch (đảm bảo real-time nhất)
        const currentValues = watch(`variants.${variantIndex}.attributeValueIds`) || [];
        const currentIds = Array.isArray(currentValues)
            ? currentValues.map(Number).filter(id => !isNaN(id))
            : [];

        // 2. Tìm thuộc tính đang thao tác
        const attr = attributes.find((a) => String(a.id) === String(attrId));
        if (!attr) {
            console.warn(`[WARN] Attribute with ID ${attrId} not found in state.`);
            return;
        }

        // 3. Lọc bỏ các ID thuộc về thuộc tính này đã chọn trước đó (Single Select per Attribute)
        const attrValueIds = attr.values.map(v => Number(v.id));
        const others = currentIds.filter(id => !attrValueIds.includes(id));

        // 4. Xác định mảng mới
        let newValueIds = [...others];
        if (valueId !== -1 && valueId !== "-1" && valueId !== "") {
            const numericId = Number(valueId);
            if (!isNaN(numericId)) {
                newValueIds.push(numericId);
            }
        }


        // 5. Cập nhật state
        setValue(`variants.${variantIndex}.attributeValueIds`, newValueIds, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true
        });
    };

    // ── QUY ĐỔI ĐƠN VỊ ──
    const addUnitConversion = () =>
        setUnitConversions((prev) => [
            ...prev,
            { fromUnit: "", toUnit: "", rate: 1 },
        ]);

    const removeUnitConversion = (idx: number) =>
        setUnitConversions((prev) => prev.filter((_, i) => i !== idx));

    const updateUnitConversion = (
        idx: number,
        key: string,
        value: string | number
    ) =>
        setUnitConversions((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], [key]: value };
            return next;
        });

    // ── SUBMIT ──
    const onSubmit = async (data: ProductFormData) => {
        // ── IMAGE CHECK ──
        if (productImageFiles.length === 0) {
            toast.error("Vui lòng tải lên ít nhất 1 ảnh sản phẩm.");
            return;
        }

        // ── SKU DUPLICATION CHECK ──
        const skus = data.variants.map(v => v.sku.toLowerCase().trim());
        const uniqueSkus = new Set(skus);
        if (skus.length !== uniqueSkus.size) {
            toast.error("Mã SKU giữa các biến thể không được trùng lặp.");
            return;
        }

        try {
            setIsLoading(true);

            const validConversions = unitConversions
                .filter((uc) => uc.fromUnit && uc.toUnit && Number(uc.rate) > 0)
                .map((uc) => ({
                    fromUnit: uc.fromUnit,
                    toUnit: uc.toUnit,
                    rate: Number(uc.rate),
                }));

            const productData: any = {
                name: data.name.trim(),
                categoryId: Number(data.categoryId),
                ...(data.brand?.trim() && { brand: data.brand.trim() }),
                ...(data.origin?.trim() && { origin: data.origin.trim() }),
                ...(data.baseSku?.trim() && { baseSku: data.baseSku.trim() }),
                ...(data.description?.trim() && { description: data.description }),
                ...(data.status && { status: data.status }),
                variants: data.variants.map((v: any, vIdx: number) => {
                    return {
                        sku: v.sku.trim(),
                        costPrice: v.costPrice,
                        price: v.price,
                        ...(v.barcode?.trim() && { barcode: v.barcode.trim() }),
                        ...(v.wholesalePrice !== undefined && {
                            wholesalePrice: v.wholesalePrice,
                        }),
                        // Luôn ép initialStock bằng 0 về Backend để đảm bảo dữ liệu kho chuẩn
                        initialStock: 0,
                        ...(v.shippingWeight !== undefined && {
                            shippingWeight: v.shippingWeight,
                        }),
                        attributeValueIds: v.attributeValueIds || [],
                        ...(validConversions.length > 0 && {
                            unitConversions: validConversions,
                        }),
                    };
                }),
            };

            // Construct FormData to support image uploads
            const formData = new FormData();
            formData.append(
                "data",
                new Blob([JSON.stringify(productData)], {
                    type: "application/json",
                })
            );

            // Append main product images
            productImageFiles.forEach((file) => {
                formData.append("images", file);
            });

            // Append variant images (with index mapping)
            variantImageFiles.forEach((file, index) => {
                if (file) {
                    formData.append(`variantImage_${index}`, file);
                }
            });

            console.log("[DEBUG] Submitting FormData with Product Data:", productData);

            await ProductService.create(formData);
            toast.success("Tạo sản phẩm thành công!");
            router.push("/admin/products");
        } catch (error: any) {
            const res = error.response?.data;
            toast.error(res?.message || "Có lỗi khi lưu sản phẩm.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 pb-[100px] bg-slate-50/30 p-4"
        >
            {/* ── HEADER ── */}
            <div className="flex items-center gap-3 mb-2 px-1">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="h-8 w-8 text-slate-400"
                >
                    <ChevronLeft size={20} />
                </Button>
                <h1 className="text-[17px] font-black text-[#1f1f1f] tracking-tight uppercase flex-1">
                    Thiết lập sản phẩm mới
                </h1>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="h-8 w-8 text-slate-400"
                >
                    <X size={18} />
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* ══ CỘT TRÁI (9/12) ══ */}
                <div className="lg:col-span-9 space-y-5">

                    {/* ─── 1. THÔNG TIN SẢN PHẨM CHÍNH ─── */}
                    <div className="bg-white border border-[#dcdcdc] p-5 rounded-none shadow-sm">
                        <SectionHeader num="1" icon={AlertCircle} title="Thông tin sản phẩm chính" />
                        <div className="space-y-4">
                            {/* Row 1: Tên + Danh mục */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2 space-y-1.5">
                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                                        Tên sản phẩm *
                                    </Label>
                                    <Input
                                        {...register("name")}
                                        placeholder="VD: Thuốc trị nấm tôm ShrimpCare"
                                        className={cn(
                                            "h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:border-emerald-500",
                                            errors.name && "border-rose-500 bg-rose-50/10 focus:border-rose-500"
                                        )}
                                    />
                                    <ErrorMessage message={errors.name?.message} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                                        Danh mục *
                                    </Label>
                                    <Controller
                                        name="categoryId"
                                        control={control}
                                        render={({ field }) => (
                                            <div className="space-y-1">
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger
                                                        className={cn(
                                                            "h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:border-emerald-500",
                                                            errors.categoryId && "border-rose-500 bg-rose-50/10"
                                                        )}
                                                    >
                                                        <SelectValue placeholder="-- Chọn danh mục --" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-none">
                                                        {categories.map((cat, catIdx) => (
                                                            <SelectItem key={`cat-${cat.id ?? catIdx}`} value={String(cat.id)}>
                                                                {cat.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <ErrorMessage message={errors.categoryId?.message} />
                                            </div>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Row 2: Thương hiệu + Xuất xứ + Mã SKU gốc */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                                        Thương hiệu
                                    </Label>
                                    <Controller
                                        name="brand"
                                        control={control}
                                        render={({ field }) => (
                                            <CreatableCombobox
                                                options={brands}
                                                value={field.value || ""}
                                                onSelect={field.onChange}
                                                placeholder="Chọn hoặc nhập..."
                                            />
                                        )}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                                        Xuất xứ
                                    </Label>
                                    <Input
                                        {...register("origin")}
                                        className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                                        Mã SKU gốc
                                    </Label>
                                    <Input
                                        {...register("baseSku")}
                                        placeholder="VD: VTC-001"
                                        className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── 2. ĐẶC TÍNH & BÀI VIẾT MÔ TẢ ─── */}
                    <div className="bg-white border border-[#dcdcdc] p-5 rounded-none shadow-sm">
                        <SectionHeader num="2" icon={FileText} title="Đặc tính & Bài viết mô tả" />
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

                    {/* ─── 3. DANH SÁCH BIẾN THỂ ─── */}
                    <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-[#eee] bg-[#f8f9fa] flex justify-between items-center">
                            <h3 className="text-[11px] font-black text-slate-700 flex items-center gap-2 uppercase tracking-wider">
                                <Layers size={15} className="text-emerald-600" />
                                3. Danh sách biến thể sản phẩm (SKUs)
                            </h3>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleAppendVariant}
                                className="h-[28px] text-[10px] font-black text-emerald-600 border-emerald-200 bg-white px-4 rounded-none shadow-sm uppercase"
                            >
                                + Thêm biến thể
                            </Button>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {fields.map((field, idx) => {
                                const variantAttributeIds =
                                    watch(`variants.${idx}.attributeValueIds`) || [];

                                return (
                                    <div key={field.id} className="p-5 bg-white">
                                        <div className="flex flex-col xl:flex-row gap-5">
                                            {/* Ảnh biến thể */}
                                            <div className="flex flex-col items-center shrink-0">
                                                <div
                                                    onClick={() =>
                                                        document.getElementById(`v-img-${idx}`)?.click()
                                                    }
                                                    className="w-[100px] h-[100px] border border-[#ddd] bg-slate-50 flex flex-col items-center justify-center cursor-pointer group hover:border-emerald-500 transition-all overflow-hidden relative"
                                                >
                                                    {variantImagePreviews[idx] ? (
                                                        <img
                                                            src={variantImagePreviews[idx]}
                                                            className="w-full h-full object-cover"
                                                            alt="SKU"
                                                        />
                                                    ) : (
                                                        <>
                                                            <Camera size={26} className="text-slate-300" />
                                                            <span className="text-[7px] font-bold text-slate-300 mt-1 uppercase tracking-wider">
                                ẢNH SKU
                              </span>
                                                        </>
                                                    )}
                                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <Upload size={15} className="text-white" />
                                                    </div>
                                                </div>
                                                <input
                                                    type="file"
                                                    id={`v-img-${idx}`}
                                                    hidden
                                                    onChange={(e) => handleVariantImageChange(idx, e)}
                                                    accept="image/*"
                                                />
                                                <p className="text-[8px] font-black text-slate-400 mt-1.5 uppercase tracking-tighter text-center">
                                                    ẢNH SKU/BARCODE
                                                </p>
                                            </div>

                                            {/* Tất cả fields */}
                                            <div className="flex-1 space-y-4">

                                                {/* Row 1: Thuộc tính động */}
                                                {attributes.length > 0 && (
                                                    <div
                                                        className={cn(
                                                            "grid gap-4",
                                                            attributes.length === 1
                                                                ? "grid-cols-1 max-w-xs"
                                                                : attributes.length === 2
                                                                    ? "grid-cols-2"
                                                                    : "grid-cols-3"
                                                        )}
                                                    >
                                                        {attributes.map((attr) => {
                                                            const selectedValueId =
                                                                variantAttributeIds.find((id: number | string) =>
                                                                    attr.values.some((v) => String(v.id) === String(id))
                                                                ) ?? -1;
                                                            return (
                                                                <div key={`v${idx}-a${attr.id ?? "x"}`} className="space-y-1">
                                                                    <Label className="text-[10px] font-bold text-slate-500 uppercase">
                                                                        {attr.name} *
                                                                    </Label>
                                                                    <Select
                                                                        value={selectedValueId === -1 ? undefined : String(selectedValueId)}
                                                                        onValueChange={(val) =>
                                                                            setAttributeValue(idx, attr.id, val)
                                                                        }
                                                                    >
                                                                        <SelectTrigger className="h-[34px] border-[#ccc] rounded-none text-[13px] bg-white shadow-none">
                                                                            <SelectValue
                                                                                placeholder={`Chọn ${attr.name}...`}
                                                                            />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="rounded-none">
                                                                            <SelectItem value="-1">
                                                                                -- Bỏ chọn --
                                                                            </SelectItem>
                                                                            {attr.values.map((v, vIdx) => (
                                                                                <SelectItem
                                                                                    key={`v${idx}-a${attr.id ?? "x"}-${vIdx}`}
                                                                                    value={String(v?.id ?? v)}
                                                                                >
                                                                                    {v?.value ?? String(v)}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Row 2: SKU + Barcode + Buttons */}
                                                <div className="grid grid-cols-12 gap-3 items-start">
                                                    <div className="col-span-4 space-y-1">
                                                        <Label className="text-[10px] font-bold text-slate-500 uppercase">
                                                            Mã SKU biến thể *
                                                        </Label>
                                                        <Input
                                                            {...register(`variants.${idx}.sku`)}
                                                            className={cn(
                                                                "h-[34px] border-[#ccc] rounded-none font-mono text-[13px] shadow-none focus:border-emerald-500",
                                                                errors.variants?.[idx]?.sku && "border-rose-500 bg-rose-50/10"
                                                            )}
                                                        />
                                                        <ErrorMessage message={errors.variants?.[idx]?.sku?.message} />
                                                    </div>
                                                    <div className="col-span-4 space-y-1">
                                                        <Label className="text-[10px] font-bold text-slate-500 uppercase">
                                                            Mã vạch / Barcode
                                                        </Label>
                                                        <Input
                                                            {...register(`variants.${idx}.barcode`)}
                                                            className="h-[34px] border-[#ccc] rounded-none font-mono text-[13px] shadow-none focus:border-emerald-500"
                                                        />
                                                    </div>
                                                    <div className="col-span-4 flex gap-2 pt-5">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => handleRemoveVariant(idx)}
                                                            className="w-full h-[34px] text-[10px] font-black text-rose-500 border-rose-100 rounded-none hover:bg-rose-50 shadow-none uppercase"
                                                        >
                                                            <Trash2 size={12} className="mr-1" />
                                                            Xóa biến thể
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Row 3: Giá */}
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-bold text-blue-600 uppercase">
                                                            Giá vốn (Giá nhập hàng) *
                                                        </Label>
                                                        <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400 font-bold pointer-events-none">
                                ₫
                              </span>
                                                            <Input
                                                                type="number"
                                                                {...register(`variants.${idx}.costPrice`)}
                                                                className={cn(
                                                                    "h-[34px] border-[#ccc] rounded-none text-right font-bold text-blue-600 bg-blue-50/20 pl-6 shadow-none focus:border-blue-500",
                                                                    errors.variants?.[idx]?.costPrice && "border-rose-500 bg-rose-50/10 focus:border-rose-500"
                                                                )}
                                                            />
                                                        </div>
                                                        <ErrorMessage message={errors.variants?.[idx]?.costPrice?.message} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-bold text-emerald-600 uppercase">
                                                            Giá bán lẻ mềm yêu *
                                                        </Label>
                                                        <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400 font-bold pointer-events-none">
                                ₫
                              </span>
                                                            <Input
                                                                type="number"
                                                                {...register(`variants.${idx}.price`)}
                                                                className={cn(
                                                                    "h-[34px] border-[#ccc] rounded-none text-right font-bold text-emerald-700 pl-6 shadow-none focus:border-emerald-500",
                                                                    errors.variants?.[idx]?.price && "border-rose-500 bg-rose-50/10 focus:border-rose-500"
                                                                )}
                                                            />
                                                        </div>
                                                        <ErrorMessage message={errors.variants?.[idx]?.price?.message} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-bold text-orange-500 uppercase">
                                                            Giá bán sỉ / Giá bán buôn
                                                        </Label>
                                                        <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400 font-bold pointer-events-none">
                                ₫
                              </span>
                                                            <Input
                                                                type="number"
                                                                {...register(`variants.${idx}.wholesalePrice`)}
                                                                className={cn(
                                                                    "h-[34px] border-[#ccc] rounded-none text-right font-bold text-orange-500 pl-6 shadow-none focus:border-orange-500",
                                                                    errors.variants?.[idx]?.wholesalePrice && "border-rose-500 bg-rose-50/10 focus:border-rose-500"
                                                                )}
                                                            />
                                                        </div>
                                                        <ErrorMessage message={errors.variants?.[idx]?.wholesalePrice?.message} />
                                                    </div>
                                                </div>

                                                {/* ✅ Row 4: KHÓA TỒN KHO VỀ 0 LÚC TẠO MỚI */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-bold text-slate-500 uppercase">
                                                            Tồn kho ban đầu
                                                        </Label>
                                                        <Input
                                                            type="number"
                                                            disabled
                                                            value={0}
                                                            className="h-[34px] border-[#ccc] rounded-none text-right shadow-none bg-slate-50 text-slate-400 cursor-not-allowed focus-visible:ring-0"
                                                        />
                                                        <p className="text-[9px] text-amber-600 italic font-medium">
                                                            * Vui lòng tạo Phiếu nhập kho sau khi lưu sản phẩm.
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-bold text-slate-500 uppercase">
                                                            Trọng lượng (kg)
                                                        </Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            {...register(`variants.${idx}.shippingWeight`)}
                                                            className="h-[34px] border-[#ccc] rounded-none text-right shadow-none focus:border-emerald-500"
                                                        />
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ─── BƯỚC 8: QUY ĐỔI ĐƠN VỊ ─── */}
                    <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-[#eee] bg-[#f8f9fa] flex justify-between items-center">
                            <h3 className="text-[11px] font-black text-slate-700 flex items-center gap-2 uppercase tracking-wider">
                                <ArrowRightLeft size={15} className="text-purple-600" />
                                Bước 8: Quy đổi đơn vị sản phẩm
                            </h3>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={addUnitConversion}
                                className="h-[28px] text-[10px] font-black text-purple-600 border-purple-200 bg-white px-4 rounded-none shadow-sm uppercase"
                            >
                                + Thêm đơn vị quy đổi
                            </Button>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Ghi chú */}
                            <div className="text-[12px] text-slate-500 space-y-1">
                                <p>
                                    <span className="font-bold text-slate-600">Lưu ý nghĩa vụ:</span>{" "}
                                    <span className="italic">
                    Đơn vị quy đổi không có tồn kho riêng mà phụ thuộc hoàn
                    toàn vào đơn vị gốc (đơn vị nhỏ nhất). Hệ thống sẽ tự động
                    tính toán tồn kho dựa trên tỷ lệ quy đổi.
                  </span>
                                </p>
                                <p className="italic">
                                    Ví dụ: 1 Thùng = 12 Chai. Khi nhập hàng đặt 1 Thùng, kho
                                    Chai sẽ tự động tăng/giảm tương ứng 12 đơn vị.
                                </p>
                            </div>

                            <div className="space-y-2">
                                {unitConversions.map((uc, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 w-4 text-right shrink-0">
                      1
                    </span>
                                        <Input
                                            value={uc.fromUnit}
                                            onChange={(e) =>
                                                updateUnitConversion(idx, "fromUnit", e.target.value)
                                            }
                                            placeholder="Đơn vị lớn (Thùng, Hộp...)"
                                            className="h-[34px] border-[#ccc] rounded-none text-[13px] shadow-none flex-1"
                                        />
                                        <span className="text-[11px] font-bold text-slate-400 shrink-0">
                      =
                    </span>
                                        <Input
                                            type="number"
                                            value={uc.rate}
                                            onChange={(e) =>
                                                updateUnitConversion(idx, "rate", e.target.value)
                                            }
                                            placeholder="SL"
                                            className="h-[34px] border-[#ccc] rounded-none text-[13px] shadow-none w-[72px] text-right"
                                        />
                                        <Input
                                            value={uc.toUnit}
                                            onChange={(e) =>
                                                updateUnitConversion(idx, "toUnit", e.target.value)
                                            }
                                            placeholder="Đơn vị nhỏ (Chai, Viên...)"
                                            className="h-[34px] border-[#ccc] rounded-none text-[13px] shadow-none flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => removeUnitConversion(idx)}
                                            className="h-8 w-8 p-0 text-slate-300 hover:text-rose-500 shrink-0"
                                        >
                                            <X size={15} />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══ CỘT PHẢI (3/12) ══ */}
                <div className="lg:col-span-3 space-y-5">

                    {/* Album hình ảnh */}
                    <div className="bg-white border border-[#dcdcdc] p-5 rounded-none shadow-sm">
                        <Label className="text-[11px] font-black text-slate-700 uppercase block mb-4 text-center tracking-widest border-b pb-3">
                            Album hình ảnh *
                        </Label>

                        {productImagePreviews.length === 0 ? (
                            <div
                                onClick={() => mainImagesRef.current?.click()}
                                className="aspect-square border border-[#e0e0e0] flex flex-col items-center justify-center bg-white hover:bg-slate-50 cursor-pointer transition-colors group rounded-none"
                            >
                                <Camera
                                    size={36}
                                    className="text-slate-200 group-hover:text-slate-300 mb-2"
                                />
                                <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-500 uppercase tracking-wider">
                  Tải ảnh lên
                </span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {productImagePreviews.map((src, i) => (
                                    <div
                                        key={i}
                                        className="relative aspect-square border border-[#eee] group overflow-hidden"
                                    >
                                        <img
                                            src={src}
                                            className="w-full h-full object-cover"
                                            alt="Product"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeMainImage(i)}
                                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={11} />
                                        </button>
                                    </div>
                                ))}
                                <div
                                    onClick={() => mainImagesRef.current?.click()}
                                    className="aspect-square border-2 border-dashed border-[#ddd] flex flex-col items-center justify-center bg-[#fcfcfc] hover:bg-emerald-50 cursor-pointer transition-colors group"
                                >
                                    <Upload
                                        size={18}
                                        className="text-slate-300 group-hover:text-emerald-500 mb-1"
                                    />
                                    <span className="text-[8px] font-black text-slate-400 group-hover:text-emerald-600 uppercase">
                    Tải thêm
                  </span>
                                </div>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={mainImagesRef}
                            multiple
                            hidden
                            onChange={handleMainImagesChange}
                            accept="image/*"
                        />
                    </div>

                    {/* Trạng thái phát hành */}
                    <div className="bg-white border border-[#dcdcdc] p-5 rounded-none shadow-sm">
                        <Label className="text-[11px] font-black text-slate-700 uppercase block mb-4 tracking-widest border-b pb-3">
                            Trạng thái phát hành
                        </Label>
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="h-[38px] text-[13px] border-[#ccc] rounded-none font-black shadow-none">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-none">
                                        <SelectItem
                                            value="ACTIVE"
                                            className="text-emerald-600 font-bold"
                                        >
                                            Đang kinh doanh
                                        </SelectItem>
                                        <SelectItem
                                            value="INACTIVE"
                                            className="text-rose-500 font-bold"
                                        >
                                            Tạm ngừng bán
                                        </SelectItem>
                                        <SelectItem
                                            value="DRAFT"
                                            className="text-slate-500 font-bold"
                                        >
                                            Lưu nháp
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* ── FOOTER CỐ ĐỊNH ── */}
            <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-white border-t border-[#ddd] p-[12px_30px] flex items-center justify-end gap-3 z-[999] shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="min-w-[100px] h-[38px] text-[12px] font-bold border-[#ccc] rounded-none uppercase"
                >
                    Hủy bỏ
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="min-w-[150px] h-[38px] text-[12px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-none shadow-md uppercase"
                >
                    {isLoading ? (
                        <Loader2 size={17} className="mr-2 animate-spin" />
                    ) : (
                        <Save size={17} className="mr-2" />
                    )}
                    Lưu dữ liệu
                </Button>
            </div>
        </form>
    );
}