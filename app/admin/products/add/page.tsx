"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import dynamic from "next/dynamic";
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
    Check,
    Info,
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { ProductService } from "@/app/services/product.service";
import { updateAttribute } from "@/app/services/AttributeService";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// 👉 1. IMPORT THƯ VIỆN ĐÃ ĐƯỢC FIX LỖI (react-quill-new)
import "react-quill-new/dist/quill.snow.css";
const ReactQuill = dynamic(() => import("react-quill-new"), {
    ssr: false,
    loading: () => <div className="h-[250px] flex items-center justify-center bg-slate-50 text-slate-400 border border-dashed border-slate-300">Đang tải trình soạn thảo...</div>
});

const quillModules = {
    toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["link", "image"],
        ["clean"],
    ],
};

// ─── VALIDATION SCHEMA ───
const variantSchema = z.object({
    sku: z.string().min(3, "SKU phải có ít nhất 3 ký tự"),
    barcode: z.string().optional(),
    attributeValueIds: z.array(z.number()).optional(),
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

type AttributeOption = {
    valueId: number;
    value: string;
};

type AttributeEditorState = {
    attributeId: number;
    attributeName: string;
    attributeCode: string;
    status: "ACTIVE" | "INACTIVE";
    values: string[];
    initialValues: string[];
    variantIndex: number;
};

const DEFAULT_VARIANT = {
    sku: "",
    barcode: "",
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
                                    key={`brand-opt-${option}-${index}`}
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

const generateBaseSku = () => {
    const d = new Date();
    const dateStr = `${d.getFullYear().toString().slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const rnd = Math.floor(100 + Math.random() * 900);
    return `SP${dateStr}-${rnd}`;
};

const generateBarcode = () => {
    const random9 = Math.floor(100000000 + Math.random() * 900000000).toString();
    return `893${random9}0`;
};

const normalizeAttributeValues = (attribute: any): string[] => {
    if (!Array.isArray(attribute?.values)) return [];

    return attribute.values
        .map((item: any) => {
            if (typeof item === "string") return item.trim();
            if (item && typeof item.value === "string") return item.value.trim();
            return "";
        })
        .filter((value: string, index: number, array: string[]) => value.length > 0 && array.indexOf(value) === index);
};

const findLatestAddedValueDetail = (
    valueDetails: AttributeOption[],
    initialValues: string[],
    currentValues: string[]
) => {
    const normalizedInitialValues = new Set(initialValues.map((value) => value.trim().toLowerCase()));
    const addedValues = currentValues.filter((value) => !normalizedInitialValues.has(value.trim().toLowerCase()));

    if (addedValues.length === 0) return null;

    const targetValue = addedValues[addedValues.length - 1].trim().toLowerCase();
    return valueDetails.find((detail) => detail.value.trim().toLowerCase() === targetValue) || null;
};

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
    const [attributes, setAttributes] = useState<any[]>([]);
    const [attributeEditor, setAttributeEditor] = useState<AttributeEditorState | null>(null);
    const [newAttributeValue, setNewAttributeValue] = useState("");
    const [isSavingAttribute, setIsSavingAttribute] = useState(false);

    const { isLoadingAuth, isAuthenticated } = useAuthStore();
    const { hasPermission } = usePermissions();
    const canUpdateAttribute = hasPermission(P.ATTRIBUTE_UPDATE);

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

    const openAttributeEditor = (attribute: any, variantIndex: number) => {
        setAttributeEditor({
            attributeId: Number(attribute.id),
            attributeName: attribute.name || "",
            attributeCode: attribute.code || "",
            status: attribute.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
            values: normalizeAttributeValues(attribute),
            initialValues: normalizeAttributeValues(attribute),
            variantIndex,
        });
        setNewAttributeValue("");
    };

    const closeAttributeEditor = () => {
        setAttributeEditor(null);
        setNewAttributeValue("");
    };

    const addAttributeValueDraft = () => {
        if (!attributeEditor) return;

        const trimmedValue = newAttributeValue.trim();
        if (!trimmedValue) return;

        const duplicated = attributeEditor.values.some(
            (value) => value.trim().toLowerCase() === trimmedValue.toLowerCase()
        );
        if (duplicated) {
            toast.error("Giá trị này đã tồn tại trong thuộc tính.");
            return;
        }

        setAttributeEditor((prev) =>
            prev
                ? {
                    ...prev,
                    values: [...prev.values, trimmedValue],
                }
                : prev
        );
        setNewAttributeValue("");
    };

    const handleSaveAttributeValues = async () => {
        if (!attributeEditor) return;
        if (attributeEditor.values.length === 0) {
            toast.error("Thuộc tính phải có ít nhất 1 giá trị.");
            return;
        }

        try {
            setIsSavingAttribute(true);

            await updateAttribute(attributeEditor.attributeId, {
                name: attributeEditor.attributeName,
                code: attributeEditor.attributeCode,
                status: attributeEditor.status,
                values: attributeEditor.values,
            });

            const refreshedAttributes: any[] = (await ProductService.getAttributes()) || [];
            setAttributes(refreshedAttributes);

            const refreshedAttribute = refreshedAttributes.find(
                (item) => Number(item.id) === attributeEditor.attributeId
            );
            const refreshedValueDetails: AttributeOption[] = refreshedAttribute?.valueDetails || [];
            const latestAddedValue = findLatestAddedValueDetail(
                refreshedValueDetails,
                attributeEditor.initialValues,
                attributeEditor.values
            );

            if (latestAddedValue) {
                const fieldName = `variants.${attributeEditor.variantIndex}.attributeValueIds` as const;
                const currentSelectedIds = getValues(fieldName) || [];
                const otherAttributeValueIds = currentSelectedIds.filter(
                    (id: number) => !refreshedValueDetails.some((detail) => Number(detail.valueId) === id)
                );

                setValue(fieldName, [...otherAttributeValueIds, Number(latestAddedValue.valueId)], {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                });
            }

            toast.success("Đã cập nhật giá trị thuộc tính.");
            closeAttributeEditor();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể cập nhật thuộc tính.");
        } finally {
            setIsSavingAttribute(false);
        }
    };

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
            baseSku: generateBaseSku(),
            description: "",
            status: "ACTIVE",
            variants: [{ ...DEFAULT_VARIANT, sku: `${generateBaseSku()}-V1`, barcode: generateBarcode() }],
        },
    });

    const baseSkuWatch = watch("baseSku");

    const { fields, append, remove } = useFieldArray({
        control,
        name: "variants",
    });

    useEffect(() => {
        fields.forEach((_, idx) => {
            setValue(`variants.${idx}.sku`, `${baseSkuWatch}-V${idx + 1}`);
        });
    }, [baseSkuWatch, fields.length, setValue]);

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

    const handleAppendVariant = () => {
        append({ ...DEFAULT_VARIANT, sku: `${baseSkuWatch}-V${fields.length + 1}`, barcode: generateBarcode() });
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

    // ── SUBMIT ──
    const onSubmit = async (data: ProductFormData) => {
        if (productImageFiles.length === 0) {
            toast.error("Vui lòng tải lên ít nhất 1 ảnh sản phẩm.");
            return;
        }

        const skus = data.variants.map(v => v.sku.toLowerCase().trim());
        const uniqueSkus = new Set(skus);
        if (skus.length !== uniqueSkus.size) {
            toast.error("Mã SKU giữa các biến thể không được trùng lặp.");
            return;
        }

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

            const productData: any = {
                name: data.name.trim(),
                categoryId: Number(data.categoryId),
                ...(data.brand?.trim() && { brand: data.brand.trim() }),
                ...(data.origin?.trim() && { origin: data.origin.trim() }),
                ...(data.baseSku?.trim() && { baseSku: data.baseSku.trim() }),
                ...(data.description?.trim() && { description: data.description }),
                ...(data.status && { status: data.status }),
                variants: rawVariants.map((v: any) => {
                    return {
                        sku: v.sku.trim(),
                        ...(v.barcode?.trim() && { barcode: v.barcode.trim() }),
                        attributeValueIds: v.attributeValueIds || [],
                    };
                }),
            };

            const formData = new FormData();
            formData.append(
                "data",
                new Blob([JSON.stringify(productData)], {
                    type: "application/json",
                })
            );

            productImageFiles.forEach((file) => {
                formData.append("productImages", file);
            });

            variantImageFiles.forEach((file) => {
                if (file) {
                    formData.append("variantImages", file);
                } else {
                    formData.append("variantImages", new Blob([], { type: "image/png" }));
                }
            });

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
                <div className="lg:col-span-9 space-y-5">

                    <div className="bg-white border border-[#dcdcdc] p-5 rounded-none shadow-sm">
                        <SectionHeader num="1" icon={AlertCircle} title="Thông tin sản phẩm chính" />
                        <div className="space-y-4">
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
                                                        {categories.map((cat, catIdx) => {
                                                            const uniqueVal = cat.id != null ? String(cat.id) : `cat-idx-${catIdx}`;
                                                            return (
                                                                <SelectItem key={`cat-select-${uniqueVal}`} value={uniqueVal}>
                                                                    {cat.name}
                                                                </SelectItem>
                                                            );
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                                <ErrorMessage message={errors.categoryId?.message} />
                                            </div>
                                        )}
                                    />
                                </div>
                            </div>

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
                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center gap-1">
                                        Mã SKU gốc
                                        <span title="Hệ thống tự động sinh, không được sửa"><Info size={11} className="text-slate-400" /></span>
                                    </Label>
                                    <Input
                                        {...register("baseSku")}
                                        readOnly
                                        className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-inner font-mono font-bold bg-slate-50 text-slate-400 cursor-not-allowed focus-visible:ring-0"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-[#dcdcdc] p-5 rounded-none shadow-sm">
                        <SectionHeader num="2" icon={FileText} title="Đặc tính & Bài viết mô tả" />

                        <div className="bg-white [&_.ql-container]:min-h-[250px] [&_.ql-container]:text-[14px] [&_.ql-editor]:min-h-[250px] [&_.ql-toolbar]:border-[#ccc] [&_.ql-container]:border-[#ccc]">
                            <Controller
                                name="description"
                                control={control}
                                render={({ field: { ref, ...fieldProps } }) => (
                                    <ReactQuill
                                        theme="snow"
                                        value={fieldProps.value || ""}
                                        onChange={fieldProps.onChange}
                                        modules={quillModules}
                                        placeholder="Nhập nội dung mô tả chi tiết sản phẩm (Hỗ trợ chèn ảnh, bảng, link...)"
                                    />
                                )}
                            />
                        </div>

                    </div>

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
                                // Lấy mảng ID hiện tại
                                const variantAttributeIds = watch(`variants.${idx}.attributeValueIds`) || [];

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

                                            <div className="flex-1 space-y-4">

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
                                                        {attributes.map((attr, attrIdx) => {
                                                            const attributeOptions = attr.valueDetails || []; // Dùng mảng mới tạo ở backend
                                                            const matchedValue = attributeOptions.find((v: any) => variantAttributeIds.includes(Number(v.valueId)));
                                                            const currentValStr = matchedValue ? String(matchedValue.valueId) : "none";

                                                            return (
                                                                <div key={`attr-group-${idx}-${attr.id ?? attrIdx}`} className="space-y-1">
                                                                    <Label className="text-[10px] font-bold text-slate-500 uppercase">
                                                                        {attr.name} *
                                                                    </Label>
                                                                    <Controller
                                                                        name={`variants.${idx}.attributeValueIds`}
                                                                        control={control}
                                                                        render={({ field: selectField }) => (
                                                                            <Select
                                                                                onValueChange={(val) => {
                                                                                    if (val === `manage-${attr.id}`) {
                                                                                        openAttributeEditor(attr, idx);
                                                                                        return;
                                                                                    }

                                                                                    const current = selectField.value || [];

                                                                                    const others = current.filter((id: number) => !attributeOptions.some((v: any) => Number(v.valueId) === id));

                                                                                    const newValue = val !== "none" ? [...others, Number(val)] : others;
                                                                                    selectField.onChange(newValue);
                                                                                }}
                                                                                value={currentValStr}
                                                                            >
                                                                                <SelectTrigger className="h-[34px] border-[#ccc] rounded-none text-[13px] bg-white shadow-none">
                                                                                    <SelectValue placeholder={`-- Chọn --`} />
                                                                                </SelectTrigger>
                                                                                <SelectContent className="rounded-none">
                                                                                    <SelectItem value="none">-- Bỏ chọn --</SelectItem>
                                                                                    {attributeOptions.map((v: any, vIdx: number) => {

                                                                                        const safeId = v.valueId ?? vIdx;
                                                                                        const valString = String(safeId);
                                                                                        const displayValue = v.value || String(v);

                                                                                        return (
                                                                                            <SelectItem key={`safe-val-${idx}-${attr.id}-${valString}-${vIdx}`} value={valString}>
                                                                                                {displayValue}
                                                                                            </SelectItem>
                                                                                        );
                                                                                    })}
                                                                                    {canUpdateAttribute && (
                                                                                        <SelectItem value={`manage-${attr.id}`}>
                                                                                            + Thêm giá trị mới cho {attr.name}
                                                                                        </SelectItem>
                                                                                    )}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        )}
                                                                    />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-12 gap-3 items-start">
                                                    <div className="col-span-5 space-y-1">
                                                        <Label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                                            Mã SKU biến thể
                                                            <span title="Hệ thống tự động sinh"><Info size={11} className="text-slate-400" /></span>
                                                        </Label>
                                                        <Input
                                                            {...register(`variants.${idx}.sku`)}
                                                            readOnly
                                                            className={cn(
                                                                "h-[34px] border-[#ccc] rounded-none font-mono text-[13px] shadow-inner bg-slate-50 text-slate-400 font-bold cursor-not-allowed focus-visible:ring-0",
                                                                errors.variants?.[idx]?.sku && "border-rose-500 bg-rose-50/10"
                                                            )}
                                                        />
                                                        <ErrorMessage message={errors.variants?.[idx]?.sku?.message} />
                                                    </div>

                                                    <div className="col-span-5 space-y-1 relative">
                                                        <Label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                                            Mã vạch / Barcode
                                                            <span title="Hệ thống tự động sinh"><Info size={11} className="text-slate-400" /></span>
                                                        </Label>
                                                        <Input
                                                            {...register(`variants.${idx}.barcode`)}
                                                            readOnly
                                                            className="h-[34px] border-[#ccc] rounded-none font-mono text-[13px] shadow-inner bg-slate-50 text-slate-400 cursor-not-allowed focus-visible:ring-0 w-full"
                                                        />
                                                    </div>

                                                    <div className="col-span-2 flex justify-end pt-5">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => handleRemoveVariant(idx)}
                                                            className="w-full h-[34px] text-[10px] font-black text-rose-500 border-rose-100 rounded-none hover:bg-rose-50 shadow-none uppercase px-2"
                                                        >
                                                            <Trash2 size={12} className="mr-1" />
                                                            Xóa
                                                        </Button>
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
                                        key={`main-img-preview-${i}`}
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

            <Dialog
                open={!!attributeEditor}
                onOpenChange={(open) => {
                    if (!open && !isSavingAttribute) {
                        closeAttributeEditor();
                    }
                }}
            >
                <DialogContent className="sm:max-w-[560px] bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-[18px] font-black text-slate-800">
                            Cập nhật giá trị thuộc tính
                        </DialogTitle>
                        <DialogDescription className="text-[13px] text-slate-500">
                            Thêm nhanh giá trị mới cho biến thể đang chỉnh sửa mà không cần rời trang tạo sản phẩm.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-[11px] font-bold uppercase text-slate-500">
                                    Tên thuộc tính
                                </Label>
                                <Input
                                    value={attributeEditor?.attributeName || ""}
                                    readOnly
                                    className="h-9 bg-slate-50 text-[13px]"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[11px] font-bold uppercase text-slate-500">
                                    Mã code
                                </Label>
                                <Input
                                    value={attributeEditor?.attributeCode || ""}
                                    readOnly
                                    className="h-9 bg-slate-50 text-[13px] font-mono"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold uppercase text-slate-500">
                                Giá trị hiện có
                            </Label>
                            <div className="min-h-[88px] rounded-md border border-slate-200 bg-slate-50 p-3">
                                {attributeEditor?.values.length ? (
                                    <div className="flex flex-wrap gap-2">
                                        {attributeEditor.values.map((value) => (
                                            <span
                                                key={value}
                                                className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-[12px] font-semibold text-slate-700"
                                            >
                                                {value}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[12px] text-slate-400">Chưa có giá trị nào.</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold uppercase text-slate-500">
                                Thêm giá trị mới
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    value={newAttributeValue}
                                    onChange={(e) => setNewAttributeValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            addAttributeValueDraft();
                                        }
                                    }}
                                    placeholder="Ví dụ: 20kg, Màu xanh..."
                                    className="h-9 text-[13px]"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addAttributeValueDraft}
                                    className="h-9 shrink-0 border-emerald-200 text-emerald-700"
                                >
                                    Thêm vào danh sách
                                </Button>
                            </div>
                            <p className="text-[12px] text-slate-500">
                                Sau khi lưu, giá trị mới nhất sẽ được chọn tự động cho biến thể hiện tại.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={closeAttributeEditor}
                            disabled={isSavingAttribute}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSaveAttributeValues}
                            disabled={isSavingAttribute}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {isSavingAttribute ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                            Lưu giá trị
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
