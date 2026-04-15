"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
    Copy,
    ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
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

type ProductFormStep = "info" | "description" | "variants" | "images" | "status";

const ADD_PRODUCT_DRAFT_KEY = "admin-product-add-draft-v2";
const PRODUCT_DRAFT_INDEX_KEY = "admin-product-draft-index-v1";
const PRODUCT_BULK_PRESETS_KEY = "admin-product-bulk-presets-v1";
const VARIANT_RENDER_CHUNK = 20;
const VARIANT_VIRTUAL_THRESHOLD = 24;

type DraftIndexEntry = {
    key: string;
    label: string;
    savedAt: number;
};

type VariantBulkPreset = {
    id: string;
    name: string;
    attributeId: number;
    attributeValueId: number;
    savedAt: number;
    isDefault?: boolean;
};

const normalizeBulkPreset = (preset: any): VariantBulkPreset | null => {
    if (!preset || typeof preset !== "object") return null;

    const attributeId = Number(preset.attributeId);
    const attributeValueId = Number(preset.attributeValueId);
    if (Number.isNaN(attributeId) || Number.isNaN(attributeValueId)) return null;

    return {
        id: String(preset.id || `${Date.now()}`),
        name: String(preset.name || "Preset"),
        attributeId,
        attributeValueId,
        savedAt: Number(preset.savedAt || Date.now()),
        isDefault: Boolean(preset.isDefault),
    };
};

const sortBulkPresets = (presets: VariantBulkPreset[]) =>
    [...presets].sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return b.savedAt - a.savedAt;
    });

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

const filterActiveAttributes = (attributes: any[] = []) =>
    attributes.filter((attribute) => (attribute?.status ?? "ACTIVE") === "ACTIVE");

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
    const infoSectionRef = useRef<HTMLDivElement>(null);
    const descriptionSectionRef = useRef<HTMLDivElement>(null);
    const variantsSectionRef = useRef<HTMLDivElement>(null);
    const imagesSectionRef = useRef<HTMLDivElement>(null);
    const statusSectionRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeStep, setActiveStep] = useState<ProductFormStep>("info");
    const [collapsedVariantIds, setCollapsedVariantIds] = useState<Record<string, boolean>>({});
    const [selectedVariantIds, setSelectedVariantIds] = useState<Record<string, boolean>>({});
    const [bulkAttributeId, setBulkAttributeId] = useState("none");
    const [bulkAttributeValueId, setBulkAttributeValueId] = useState("none");
    const [bulkPresetName, setBulkPresetName] = useState("");
    const [selectedBulkPresetId, setSelectedBulkPresetId] = useState("none");
    const [bulkPresets, setBulkPresets] = useState<VariantBulkPreset[]>([]);
    const [draftPromptOpen, setDraftPromptOpen] = useState(false);
    const [pendingDraftData, setPendingDraftData] = useState<any>(null);
    const [recentDrafts, setRecentDrafts] = useState<DraftIndexEntry[]>([]);
    const [variantScrollTop, setVariantScrollTop] = useState(0);
    const [variantViewportHeight, setVariantViewportHeight] = useState(720);
    const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string>("");
    const [mediaDirty, setMediaDirty] = useState(false);
    const [allowUnload, setAllowUnload] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [pendingLeaveAction, setPendingLeaveAction] = useState<(() => void) | null>(null);

    const [variantImageFiles, setVariantImageFiles] = useState<(File | null)[]>([null]);
    const [variantImagePreviews, setVariantImagePreviews] = useState<string[]>([""]);

    const [categories, setCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<string[]>([]);
    const [attributes, setAttributes] = useState<any[]>([]);
    const [attributeEditor, setAttributeEditor] = useState<AttributeEditorState | null>(null);
    const [newAttributeValue, setNewAttributeValue] = useState("");
    const [isSavingAttribute, setIsSavingAttribute] = useState(false);
    const variantListRef = useRef<HTMLDivElement>(null);

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
                    setAttributes(filterActiveAttributes(attrRes || []));
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

            const refreshedAttributes: any[] = filterActiveAttributes((await ProductService.getAttributes()) || []);
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
        reset,
        formState: { errors, isDirty },
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
    const nameWatch = watch("name");
    const categoryWatch = watch("categoryId");
    const statusWatch = watch("status");
    const descriptionWatch = watch("description");
    const variantsWatch = watch("variants");

    const { fields, append, remove } = useFieldArray({
        control,
        name: "variants",
    });

    const firstVariantImagePreview = (variantImagePreviews[0] || "").trim();

    const steps = useMemo(
        () => [
            { key: "info" as ProductFormStep, label: "Thông tin chính", ref: infoSectionRef },
            { key: "description" as ProductFormStep, label: "Mô tả", ref: descriptionSectionRef },
            { key: "variants" as ProductFormStep, label: "Biến thể", ref: variantsSectionRef },
            { key: "images" as ProductFormStep, label: "Ảnh", ref: imagesSectionRef },
            { key: "status" as ProductFormStep, label: "Trạng thái", ref: statusSectionRef },
        ],
        []
    );

    const hasUnsavedChanges = (isDirty || mediaDirty) && !allowUnload;
    const selectedVariantIndexes = useMemo(
        () => fields.map((field, idx) => (selectedVariantIds[field.id] ? idx : -1)).filter((idx) => idx >= 0),
        [fields, selectedVariantIds]
    );
    const selectedVariantCount = selectedVariantIndexes.length;

    const selectedBulkAttribute = useMemo(
        () => attributes.find((attr: any) => String(attr.id) === bulkAttributeId),
        [attributes, bulkAttributeId]
    );
    const bulkAttributeOptions = selectedBulkAttribute?.valueDetails || [];
    const estimateVariantHeight = useCallback((idx: number) => {
        const isCollapsed = !!collapsedVariantIds[fields[idx]?.id];
        const attributeRows = Math.max(1, Math.ceil(Math.max(attributes.length, 1) / 3));
        return isCollapsed ? 186 : 270 + attributeRows * 96;
    }, [attributes.length, collapsedVariantIds, fields]);

    const variantMeasurements = useMemo(() => {
        const starts: number[] = [];
        let total = 0;

        fields.forEach((_, idx) => {
            starts.push(total);
            total += estimateVariantHeight(idx);
        });

        return { starts, total };
    }, [estimateVariantHeight, fields]);

    const variantWindow = useMemo(() => {
        if (fields.length <= VARIANT_VIRTUAL_THRESHOLD) {
            return {
                start: 0,
                end: fields.length,
                topPadding: 0,
                bottomPadding: 0,
                virtual: false,
            };
        }

        const overscan = 600;
        const starts = variantMeasurements.starts;

        const findStart = (target: number) => {
            let low = 0;
            let high = starts.length;
            while (low < high) {
                const mid = (low + high) >> 1;
                if (starts[mid] < target) low = mid + 1;
                else high = mid;
            }
            return Math.max(0, low - 1);
        };

        const startPixel = Math.max(0, variantScrollTop - overscan);
        const endPixel = variantScrollTop + variantViewportHeight + overscan;
        const start = findStart(startPixel);
        const end = Math.min(fields.length, findStart(endPixel) + 2);
        const topPadding = starts[start] || 0;
        const bottomPadding = Math.max(0, variantMeasurements.total - (starts[end] ?? variantMeasurements.total));

        return {
            start,
            end,
            topPadding,
            bottomPadding,
            virtual: true,
        };
    }, [fields.length, variantMeasurements, variantScrollTop, variantViewportHeight]);

    const renderedVariantEntries = useMemo(() => {
        const entries = fields.map((field, idx) => ({ field, idx }));
        return entries.slice(variantWindow.start, variantWindow.end);
    }, [fields, variantWindow.end, variantWindow.start]);

    const variantValidationMap = useMemo(() => {
        const map: Record<number, { missing: boolean; duplicate: boolean }> = {};
        const comboMap = new Map<string, number[]>();

        (variantsWatch || []).forEach((variant, idx) => {
            const ids = variant?.attributeValueIds || [];
            const missing = attributes.length > 0 && ids.length < attributes.length;
            map[idx] = { missing, duplicate: false };

            if (ids.length > 0) {
                const combo = [...ids].sort((a, b) => a - b).join("_");
                const list = comboMap.get(combo) || [];
                list.push(idx);
                comboMap.set(combo, list);
            }
        });

        comboMap.forEach((indexes) => {
            if (indexes.length > 1) {
                indexes.forEach((idx) => {
                    if (!map[idx]) map[idx] = { missing: false, duplicate: false };
                    map[idx].duplicate = true;
                });
            }
        });

        return map;
    }, [variantsWatch, attributes.length]);

    const variantWarningCount = useMemo(
        () => Object.values(variantValidationMap).filter((item) => item.missing || item.duplicate).length,
        [variantValidationMap]
    );

    const syncDraftIndex = useCallback((entry: DraftIndexEntry) => {
        const raw = localStorage.getItem(PRODUCT_DRAFT_INDEX_KEY);
        const list: DraftIndexEntry[] = raw ? JSON.parse(raw) : [];
        const merged = [entry, ...list.filter((item) => item.key !== entry.key)]
            .sort((a, b) => b.savedAt - a.savedAt)
            .slice(0, 8);
        localStorage.setItem(PRODUCT_DRAFT_INDEX_KEY, JSON.stringify(merged));
        setRecentDrafts(merged);
    }, []);

    const missingWarnings = useMemo(() => {
        const warnings: string[] = [];
        if (!nameWatch?.trim()) warnings.push("Thiếu tên sản phẩm");
        if (!categoryWatch) warnings.push("Chưa chọn danh mục");
        if (!firstVariantImagePreview) warnings.push("Chưa có ảnh biến thể đầu tiên");
        if (fields.length === 0) warnings.push("Chưa có biến thể");
        return warnings;
    }, [nameWatch, categoryWatch, firstVariantImagePreview, fields.length]);

    const sectionStates = useMemo(() => {
        const infoDone = !!nameWatch?.trim() && !!categoryWatch;
        const descriptionDone = (descriptionWatch || "").replace(/<[^>]+>/g, "").trim().length > 20;
        const variantsDone = (variantsWatch || []).length > 0;
        const variantsWarning = variantWarningCount > 0;
        const imagesDone = !!firstVariantImagePreview;
        const statusDone = !!statusWatch;

        return {
            info: infoDone ? "done" : "warning",
            description: descriptionDone ? "done" : "warning",
            variants: variantsWarning ? "warning" : variantsDone ? "done" : "warning",
            images: imagesDone ? "done" : "warning",
            status: statusDone ? "done" : "warning",
        } as Record<ProductFormStep, "done" | "warning">;
    }, [nameWatch, categoryWatch, descriptionWatch, variantsWatch, variantWarningCount, firstVariantImagePreview, statusWatch]);

    useEffect(() => {
        const rawPreset = localStorage.getItem(PRODUCT_BULK_PRESETS_KEY);
        if (rawPreset) {
            try {
                const parsed: VariantBulkPreset[] = JSON.parse(rawPreset);
                const normalized = sortBulkPresets(parsed.map((preset) => normalizeBulkPreset(preset)).filter(Boolean) as VariantBulkPreset[]);
                setBulkPresets(normalized);
                setSelectedBulkPresetId(normalized.find((preset) => preset.isDefault)?.id || normalized[0]?.id || "none");
            } catch {
                localStorage.removeItem(PRODUCT_BULK_PRESETS_KEY);
            }
        }

        const rawIndex = localStorage.getItem(PRODUCT_DRAFT_INDEX_KEY);
        if (rawIndex) {
            try {
                const list: DraftIndexEntry[] = JSON.parse(rawIndex);
                setRecentDrafts(list.slice(0, 6));
            } catch {
                localStorage.removeItem(PRODUCT_DRAFT_INDEX_KEY);
            }
        }

        const saved = localStorage.getItem(ADD_PRODUCT_DRAFT_KEY);
        if (!saved) return;

        try {
            const parsed = JSON.parse(saved);
            if (!parsed?.formData) return;
            setPendingDraftData(parsed);
            setDraftPromptOpen(true);
        } catch {
            localStorage.removeItem(ADD_PRODUCT_DRAFT_KEY);
        }
    }, []);

    useEffect(() => {
        if (allowUnload) return;
        const timer = window.setTimeout(() => {
            const payload = {
                formData: getValues(),
                savedAt: Date.now(),
            };
            localStorage.setItem(ADD_PRODUCT_DRAFT_KEY, JSON.stringify(payload));
            syncDraftIndex({
                key: ADD_PRODUCT_DRAFT_KEY,
                label: "Thêm sản phẩm mới",
                savedAt: payload.savedAt,
            });
            setLastDraftSavedAt(new Date(payload.savedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
        }, 900);

        return () => window.clearTimeout(timer);
    }, [allowUnload, getValues, nameWatch, categoryWatch, statusWatch, descriptionWatch, fields.length, variantsWatch, mediaDirty, syncDraftIndex]);

    useEffect(() => {
        fields.forEach((_, idx) => {
            setValue(`variants.${idx}.sku`, `${baseSkuWatch}-V${idx + 1}`);
        });
    }, [baseSkuWatch, fields.length, setValue]);

    useEffect(() => {
        const onScroll = () => {
            let currentStep: ProductFormStep = "info";
            for (const step of steps) {
                const top = step.ref.current?.getBoundingClientRect().top;
                if (typeof top === "number" && top <= 180) {
                    currentStep = step.key;
                }
            }
            setActiveStep(currentStep);
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [steps]);

    useEffect(() => {
        if (!hasUnsavedChanges) return;

        const onBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };

        window.addEventListener("beforeunload", onBeforeUnload);
        return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, [hasUnsavedChanges]);

    useEffect(() => {
        if (!hasUnsavedChanges) return;
        const timer = window.setTimeout(() => {
            setLastDraftSavedAt(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
        }, 800);

        return () => window.clearTimeout(timer);
    }, [hasUnsavedChanges, nameWatch, categoryWatch, statusWatch, fields.length, firstVariantImagePreview]);

    useEffect(() => {
        const container = variantListRef.current;
        if (!container) return;

        const updateViewport = () => {
            setVariantScrollTop(container.scrollTop);
            setVariantViewportHeight(container.clientHeight || 720);
        };

        updateViewport();

        let frame = 0;
        const onScroll = () => {
            window.cancelAnimationFrame(frame);
            frame = window.requestAnimationFrame(updateViewport);
        };

        container.addEventListener("scroll", onScroll, { passive: true });

        const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateViewport) : null;
        observer?.observe(container);

        return () => {
            container.removeEventListener("scroll", onScroll);
            window.cancelAnimationFrame(frame);
            observer?.disconnect();
        };
    }, [fields.length]);

    const confirmLeaveIfDirty = useCallback((onConfirm: () => void) => {
        if (!hasUnsavedChanges) {
            onConfirm();
            return;
        }
        setPendingLeaveAction(() => onConfirm);
        setConfirmDialogOpen(true);
    }, [hasUnsavedChanges]);

    const scrollToStep = useCallback((step: ProductFormStep) => {
        const target = steps.find((item) => item.key === step)?.ref.current;
        if (!target) return;
        window.scrollTo({ top: window.scrollY + target.getBoundingClientRect().top - 120, behavior: "smooth" });
    }, [steps]);

    useEffect(() => {
        setSelectedVariantIds((prev) => {
            const next: Record<string, boolean> = {};
            fields.forEach((field) => {
                if (prev[field.id]) next[field.id] = true;
            });
            return next;
        });
    }, [fields]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!window.matchMedia("(max-width: 767px)").matches) return;

        setCollapsedVariantIds((prev) => {
            const next = { ...prev };
            fields.forEach((field) => {
                if (typeof next[field.id] === "undefined") {
                    next[field.id] = true;
                }
            });
            return next;
        });
    }, [fields]);

    const toggleSelectVariant = (fieldId: string) => {
        setSelectedVariantIds((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }));
    };

    const toggleSelectAllVariants = () => {
        if (selectedVariantCount === fields.length) {
            setSelectedVariantIds({});
            return;
        }

        const next: Record<string, boolean> = {};
        fields.forEach((field) => {
            next[field.id] = true;
        });
        setSelectedVariantIds(next);
    };

    const applyAttributeValueToVariant = (variantIndex: number, attributeId: number, valueId: number | null) => {
        const targetAttribute = attributes.find((attr: any) => Number(attr.id) === Number(attributeId));
        const options = targetAttribute?.valueDetails || [];
        const fieldName = `variants.${variantIndex}.attributeValueIds` as const;
        const current = getValues(fieldName) || [];
        const others = current.filter((id: number) => !options.some((opt: any) => Number(opt.valueId) === id));
        const next = valueId ? [...others, Number(valueId)] : others;

        setValue(fieldName, next, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
        });
    };

    const handleBulkAssignAttribute = () => {
        if (selectedVariantCount === 0) {
            toast.error("Vui lòng chọn ít nhất 1 biến thể.");
            return;
        }
        if (bulkAttributeId === "none" || bulkAttributeValueId === "none") {
            toast.error("Vui lòng chọn thuộc tính và giá trị để gán nhanh.");
            return;
        }

        selectedVariantIndexes.forEach((idx) => {
            applyAttributeValueToVariant(idx, Number(bulkAttributeId), Number(bulkAttributeValueId));
        });
        toast.success(`Đã gán nhanh cho ${selectedVariantCount} biến thể.`);
    };

    const handleBulkDuplicateSelected = () => {
        if (selectedVariantCount === 0) {
            toast.error("Vui lòng chọn ít nhất 1 biến thể để nhân bản.");
            return;
        }

        const snapshotIndexes = [...selectedVariantIndexes].sort((a, b) => a - b);
        snapshotIndexes.forEach((idx) => handleDuplicateVariant(idx));
        toast.success(`Đã nhân bản ${snapshotIndexes.length} biến thể.`);
    };

    const handleBulkDeleteSelected = () => {
        if (selectedVariantCount === 0) {
            toast.error("Vui lòng chọn ít nhất 1 biến thể để xóa.");
            return;
        }
        if (fields.length - selectedVariantCount < 1) {
            toast.error("Cần giữ lại ít nhất 1 biến thể.");
            return;
        }

        const removeIndexes = [...selectedVariantIndexes].sort((a, b) => b - a);
        removeIndexes.forEach((idx) => handleRemoveVariant(idx));
        setSelectedVariantIds({});
        toast.success(`Đã xóa ${removeIndexes.length} biến thể.`);
    };

    const handleRestoreDraft = () => {
        if (!pendingDraftData?.formData) {
            setDraftPromptOpen(false);
            return;
        }

        const draftData = pendingDraftData.formData;
        reset({
            name: draftData.name || "",
            categoryId: draftData.categoryId || "",
            brand: draftData.brand || "",
            origin: draftData.origin || "",
            baseSku: draftData.baseSku || generateBaseSku(),
            description: draftData.description || "",
            status: draftData.status || "ACTIVE",
            variants: Array.isArray(draftData.variants) && draftData.variants.length > 0
                ? draftData.variants
                : [{ ...DEFAULT_VARIANT, sku: `${generateBaseSku()}-V1`, barcode: generateBarcode() }],
        });

        const variantLength = Array.isArray(draftData.variants) && draftData.variants.length > 0 ? draftData.variants.length : 1;
        setVariantImageFiles(Array(variantLength).fill(null));
        setVariantImagePreviews(Array(variantLength).fill(""));

        if (pendingDraftData.savedAt) {
            setLastDraftSavedAt(new Date(pendingDraftData.savedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
        }
        setDraftPromptOpen(false);
        toast.success("Đã khôi phục bản nháp.");
    };

    const handleDiscardDraft = () => {
        localStorage.removeItem(ADD_PRODUCT_DRAFT_KEY);
        const raw = localStorage.getItem(PRODUCT_DRAFT_INDEX_KEY);
        if (raw) {
            try {
                const list: DraftIndexEntry[] = JSON.parse(raw);
                const next = list.filter((item) => item.key !== ADD_PRODUCT_DRAFT_KEY);
                localStorage.setItem(PRODUCT_DRAFT_INDEX_KEY, JSON.stringify(next));
                setRecentDrafts(next.slice(0, 6));
            } catch {
                localStorage.removeItem(PRODUCT_DRAFT_INDEX_KEY);
                setRecentDrafts([]);
            }
        }
        setPendingDraftData(null);
        setDraftPromptOpen(false);
    };

    const handleSaveBulkPreset = () => {
        if (bulkAttributeId === "none" || bulkAttributeValueId === "none") {
            toast.error("Chọn thuộc tính và giá trị trước khi lưu preset.");
            return;
        }

        const name = bulkPresetName.trim() || `Preset ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
        const preset: VariantBulkPreset = {
            id: `${Date.now()}`,
            name,
            attributeId: Number(bulkAttributeId),
            attributeValueId: Number(bulkAttributeValueId),
            savedAt: Date.now(),
            isDefault: bulkPresets.length === 0,
        };
        const next = sortBulkPresets([preset, ...bulkPresets].slice(0, 12));
        setBulkPresets(next);
        localStorage.setItem(PRODUCT_BULK_PRESETS_KEY, JSON.stringify(next));
        setBulkPresetName("");
        setSelectedBulkPresetId(preset.id);
        toast.success("Đã lưu preset bulk.");
    };

    const handleDeleteBulkPreset = () => {
        if (selectedBulkPresetId === "none") {
            toast.error("Vui lòng chọn preset để xóa.");
            return;
        }

        const current = bulkPresets.find((item) => item.id === selectedBulkPresetId);
        if (!current) {
            toast.error("Preset không hợp lệ.");
            return;
        }

        if (!window.confirm(`Xóa preset \"${current.name}\"?`)) {
            return;
        }

        const next = bulkPresets.filter((item) => item.id !== selectedBulkPresetId);
        if (current.isDefault && next.length > 0) {
            next[0] = { ...next[0], isDefault: true };
        }

        const sorted = sortBulkPresets(next);
        localStorage.setItem(PRODUCT_BULK_PRESETS_KEY, JSON.stringify(sorted));
        setBulkPresets(sorted);
        setSelectedBulkPresetId(sorted.find((item) => item.isDefault)?.id || sorted[0]?.id || "none");
        toast.success("Đã xóa preset.");
    };

    const handleSetDefaultBulkPreset = () => {
        if (selectedBulkPresetId === "none") {
            toast.error("Vui lòng chọn preset để đặt mặc định.");
            return;
        }

        const current = bulkPresets.find((item) => item.id === selectedBulkPresetId);
        if (!current) {
            toast.error("Preset không hợp lệ.");
            return;
        }

        const next = sortBulkPresets(
            bulkPresets.map((item) => ({
                ...item,
                isDefault: item.id === selectedBulkPresetId,
            }))
        );
        localStorage.setItem(PRODUCT_BULK_PRESETS_KEY, JSON.stringify(next));
        setBulkPresets(next);
        setSelectedBulkPresetId(current.id);
        toast.success("Đã đặt preset mặc định.");
    };

    const handleApplyBulkPreset = () => {
        if (selectedVariantCount === 0) {
            toast.error("Vui lòng chọn ít nhất 1 biến thể.");
            return;
        }
        const preset = bulkPresets.find((item) => item.id === selectedBulkPresetId) || bulkPresets.find((item) => item.isDefault);
        if (!preset) {
            toast.error("Vui lòng chọn preset hợp lệ.");
            return;
        }

        selectedVariantIndexes.forEach((idx) => {
            applyAttributeValueToVariant(idx, preset.attributeId, preset.attributeValueId);
        });
        toast.success(`Đã áp preset cho ${selectedVariantCount} biến thể.`);
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
        setMediaDirty(true);
    };

    const handleAppendVariant = () => {
        append({ ...DEFAULT_VARIANT, sku: `${baseSkuWatch}-V${fields.length + 1}`, barcode: generateBarcode() });
        setVariantImageFiles((prev) => [...prev, null]);
        setVariantImagePreviews((prev) => [...prev, ""]);
    };

    const handleToggleVariant = (fieldId: string) => {
        setCollapsedVariantIds((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }));
    };

    const handleDuplicateVariant = (idx: number) => {
        const source = getValues(`variants.${idx}`);
        const nextIndex = fields.length + 1;
        append({
            ...DEFAULT_VARIANT,
            sku: `${baseSkuWatch}-V${nextIndex}`,
            barcode: generateBarcode(),
            attributeValueIds: [...(source?.attributeValueIds || [])],
        });

        const sourceFile = variantImageFiles[idx];
        const sourcePreview = variantImagePreviews[idx] || "";
        setVariantImageFiles((prev) => [...prev, sourceFile ?? null]);
        setVariantImagePreviews((prev) => [...prev, sourcePreview]);
        setMediaDirty(true);
    };

    const handleRemoveVariant = (idx: number) => {
        if (fields.length === 1) {
            toast.error("Phải có ít nhất 1 biến thể.");
            return;
        }
        remove(idx);
        setVariantImageFiles((prev) => prev.filter((_, i) => i !== idx));
        setVariantImagePreviews((prev) => prev.filter((_, i) => i !== idx));
        setMediaDirty(true);
    };

    // ── SUBMIT ──
    const onSubmit = async (data: ProductFormData) => {
        const firstVariantImageFile = variantImageFiles[0];
        if (!firstVariantImageFile) {
            toast.error("Vui lòng tải ảnh cho biến thể đầu tiên.");
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

            formData.append("productImages", firstVariantImageFile);

            variantImageFiles.forEach((file) => {
                if (file) {
                    formData.append("variantImages", file);
                } else {
                    formData.append("variantImages", new Blob([], { type: "image/png" }));
                }
            });

            await ProductService.create(formData);
            setAllowUnload(true);
            localStorage.removeItem(ADD_PRODUCT_DRAFT_KEY);
            const rawIndex = localStorage.getItem(PRODUCT_DRAFT_INDEX_KEY);
            if (rawIndex) {
                try {
                    const list: DraftIndexEntry[] = JSON.parse(rawIndex);
                    const next = list.filter((item) => item.key !== ADD_PRODUCT_DRAFT_KEY);
                    localStorage.setItem(PRODUCT_DRAFT_INDEX_KEY, JSON.stringify(next));
                } catch {
                    localStorage.removeItem(PRODUCT_DRAFT_INDEX_KEY);
                }
            }
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
            className="space-y-5 pb-[170px] sm:pb-[150px] bg-slate-50/30 p-3 sm:p-4 lg:p-5 max-w-[1680px] mx-auto"
        >
            <div className="flex items-center gap-3 mb-2 px-1">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                        confirmLeaveIfDirty(() => {
                            setAllowUnload(true);
                            router.back();
                        });
                    }}
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
                    onClick={() => {
                        confirmLeaveIfDirty(() => {
                            setAllowUnload(true);
                            router.back();
                        });
                    }}
                    className="h-8 w-8 text-slate-400"
                >
                    <X size={18} />
                </Button>
            </div>

            <div className="sticky top-2 z-30 bg-slate-50/90 backdrop-blur rounded-xl border border-slate-200 px-3 py-2">
                <div className="flex items-center gap-2 overflow-x-auto">
                    {steps.map((step, idx) => {
                        const isActive = activeStep === step.key;
                        const stepState = sectionStates[step.key];
                        return (
                            <button
                                key={step.key}
                                type="button"
                                onClick={() => scrollToStep(step.key)}
                                className={cn(
                                    "flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-colors border",
                                    isActive
                                        ? "bg-emerald-600 text-white border-emerald-600"
                                        : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700"
                                )}
                            >
                                {stepState === "done" ? (
                                    <Check size={12} className={isActive ? "text-white" : "text-emerald-600"} />
                                ) : (
                                    <AlertCircle size={12} className={isActive ? "text-white" : "text-amber-600"} />
                                )}
                                <span className={cn("inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px]", isActive ? "bg-white/20" : "bg-slate-100")}>{idx + 1}</span>
                                {step.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-9 space-y-5">

                    <div ref={infoSectionRef} className="bg-white border border-[#dcdcdc] p-5 rounded-xl shadow-sm">
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

                    <div ref={descriptionSectionRef} className="bg-white border border-[#dcdcdc] p-5 rounded-xl shadow-sm">
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

                    <div ref={variantsSectionRef} className="bg-white border border-[#dcdcdc] rounded-xl shadow-sm overflow-hidden">
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

                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70 space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-black uppercase tracking-wide text-slate-600">Bulk actions biến thể</p>
                                <button type="button" onClick={toggleSelectAllVariants} className="text-[11px] font-bold text-blue-600 hover:underline">
                                    {selectedVariantCount === fields.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                <Select value={bulkAttributeId} onValueChange={(value) => {
                                    setBulkAttributeId(value);
                                    setBulkAttributeValueId("none");
                                }}>
                                    <SelectTrigger className="h-9 bg-white"><SelectValue placeholder="Chọn thuộc tính" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Chọn thuộc tính</SelectItem>
                                        {attributes.map((attr: any) => (
                                            <SelectItem key={`bulk-attr-${attr.id}`} value={String(attr.id)}>{attr.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={bulkAttributeValueId} onValueChange={setBulkAttributeValueId}>
                                    <SelectTrigger className="h-9 bg-white"><SelectValue placeholder="Chọn giá trị" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Chọn giá trị</SelectItem>
                                        {bulkAttributeOptions.map((option: any) => (
                                            <SelectItem key={`bulk-value-${option.valueId}`} value={String(option.valueId)}>{option.value}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button type="button" variant="outline" onClick={handleBulkAssignAttribute} className="h-9 text-[11px] font-black uppercase border-emerald-200 text-emerald-700">Gán nhanh đã chọn</Button>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button type="button" variant="outline" onClick={handleBulkDuplicateSelected} className="h-9 text-[11px] font-black uppercase border-blue-200 text-blue-700">Nhân bản</Button>
                                    <Button type="button" variant="outline" onClick={handleBulkDeleteSelected} className="h-9 text-[11px] font-black uppercase border-rose-200 text-rose-600">Xóa</Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <Input value={bulkPresetName} onChange={(e) => setBulkPresetName(e.target.value)} placeholder="Tên preset (tùy chọn)" className="h-9 bg-white text-[12px]" />
                                <Button type="button" variant="outline" onClick={handleSaveBulkPreset} className="h-9 text-[11px] font-black uppercase border-indigo-200 text-indigo-700">Lưu preset</Button>
                                <div className="flex gap-2">
                                    <Select value={selectedBulkPresetId} onValueChange={setSelectedBulkPresetId}>
                                        <SelectTrigger className="h-9 bg-white"><SelectValue placeholder="Chọn preset" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Chọn preset</SelectItem>
                                            {bulkPresets.map((preset) => (
                                                <SelectItem key={`preset-${preset.id}`} value={preset.id}>
                                                    <span className="flex items-center gap-2">
                                                        <span>{preset.name}</span>
                                                        {preset.isDefault && <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-emerald-700">Mặc định</span>}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button type="button" variant="outline" onClick={handleApplyBulkPreset} className="h-9 text-[11px] font-black uppercase border-indigo-200 text-indigo-700">Áp</Button>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button type="button" variant="outline" onClick={handleSetDefaultBulkPreset} className="h-9 text-[11px] font-black uppercase border-emerald-200 text-emerald-700">Đặt preset mặc định</Button>
                                <Button type="button" variant="outline" onClick={handleDeleteBulkPreset} className="h-9 text-[11px] font-black uppercase border-rose-200 text-rose-600">Xóa preset</Button>
                            </div>
                            {variantWarningCount > 0 && (
                                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700">
                                    Có {variantWarningCount} biến thể thiếu thuộc tính hoặc trùng tổ hợp. Vui lòng kiểm tra trước khi lưu.
                                </div>
                            )}
                            <p className="text-[11px] text-slate-400">Đang chọn {selectedVariantCount}/{fields.length} biến thể.</p>
                            {variantWindow.virtual && (
                                <p className="text-[11px] font-semibold text-slate-500">Đang hiển thị {variantWindow.start + 1}-{Math.min(variantWindow.end, fields.length)} / {fields.length} biến thể theo cửa sổ cuộn.</p>
                            )}
                        </div>

                        <div ref={variantListRef} className={cn("divide-y divide-slate-100", fields.length > VARIANT_VIRTUAL_THRESHOLD && "max-h-[calc(100vh-430px)] lg:max-h-[calc(100vh-360px)] overflow-y-auto overscroll-contain pr-1")}>
                            {variantWindow.virtual && <div style={{ height: variantWindow.topPadding }} />}
                            {renderedVariantEntries.map(({ field, idx }) => {
                                // Lấy mảng ID hiện tại
                                const variantAttributeIds = watch(`variants.${idx}.attributeValueIds`) || [];
                                const isCollapsed = !!collapsedVariantIds[field.id];
                                const isSelected = !!selectedVariantIds[field.id];
                                const variantIssue = variantValidationMap[idx] || { missing: false, duplicate: false };

                                return (
                                    <div key={field.id} className={cn("p-5 bg-white", isSelected && "bg-blue-50/40")}>
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
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="inline-flex items-center gap-2 text-[12px] font-bold text-slate-700 cursor-pointer">
                                                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelectVariant(field.id)} className="h-4 w-4 accent-emerald-600" />
                                                        Biến thể #{idx + 1}
                                                    </label>
                                                    <div className="flex items-center gap-1.5 mr-auto ml-3">
                                                        {variantIssue.missing && <span className="text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700 uppercase">Thiếu thuộc tính</span>}
                                                        {variantIssue.duplicate && <span className="text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-200 bg-rose-50 text-rose-700 uppercase">Trùng tổ hợp</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button type="button" variant="outline" onClick={() => handleDuplicateVariant(idx)} className="h-[28px] text-[10px] uppercase font-black px-3 border-blue-200 text-blue-600 hover:bg-blue-50">
                                                            <Copy size={12} className="mr-1" /> Nhân bản
                                                        </Button>
                                                        <Button type="button" variant="outline" onClick={() => handleToggleVariant(field.id)} className="h-[28px] text-[10px] uppercase font-black px-3">
                                                            {isCollapsed ? <ChevronDown size={12} className="mr-1" /> : <ChevronUp size={12} className="mr-1" />}
                                                            {isCollapsed ? "Mở rộng" : "Thu gọn"}
                                                        </Button>
                                                    </div>
                                                </div>

                                                {!isCollapsed && attributes.length > 0 && (
                                                    <div
                                                        className={cn(
                                                            "grid gap-4",
                                                            attributes.length === 1
                                                                ? "grid-cols-1 max-w-xs"
                                                                : attributes.length === 2
                                                                    ? "grid-cols-1 sm:grid-cols-2"
                                                                    : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
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
                                                                                <SelectContent className="rounded-none max-h-[280px]" position="item-aligned">
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
                                                                                        <>
                                                                                            <SelectSeparator className="my-1 bg-slate-200" />
                                                                                            <SelectItem
                                                                                                value={`manage-${attr.id}`}
                                                                                                className="mt-1 bg-emerald-50 text-emerald-700 font-semibold focus:bg-emerald-100 focus:text-emerald-800"
                                                                                            >
                                                                                                + Thêm giá trị mới cho {attr.name}
                                                                                            </SelectItem>
                                                                                        </>
                                                                                    )}
                                                                                    {attributeOptions.length > 8 && (
                                                                                        <div className="px-2 py-1 text-[11px] text-slate-400 border-t border-dashed border-slate-200 mt-1">
                                                                                            Lướt để xem thêm giá trị
                                                                                        </div>
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

                                                {!isCollapsed && (
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                                                    <div className="md:col-span-5 space-y-1">
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

                                                    <div className="md:col-span-5 space-y-1 relative">
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

                                                    <div className="md:col-span-2 flex justify-end md:pt-5">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => handleRemoveVariant(idx)}
                                                            className="w-full h-[34px] text-[10px] font-black text-rose-500 border-rose-100 rounded-md hover:bg-rose-50 shadow-none uppercase px-2"
                                                        >
                                                            <Trash2 size={12} className="mr-1" />
                                                            Xóa
                                                        </Button>
                                                    </div>
                                                </div>
                                                )}

                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {variantWindow.virtual && <div style={{ height: variantWindow.bottomPadding }} />}
                        </div>
                    </div>

                </div>

                <div className="lg:col-span-3 space-y-5">
                    <div className="bg-white border border-[#dcdcdc] p-4 rounded-xl shadow-sm lg:sticky lg:top-4">
                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-3">Tóm tắt nhanh</p>
                        <div className="space-y-2 text-[12px]">
                            <div className="flex items-center justify-between"><span className="text-slate-500">Số biến thể</span><span className="font-black text-slate-700">{fields.length}</span></div>
                            <div className="flex items-center justify-between"><span className="text-slate-500">Ảnh sản phẩm</span><span className="font-black text-slate-700">{firstVariantImagePreview ? 1 : 0}</span></div>
                            <div className="flex items-center justify-between"><span className="text-slate-500">Trạng thái</span><span className={cn("font-black", statusWatch === "ACTIVE" ? "text-emerald-600" : statusWatch === "INACTIVE" ? "text-rose-500" : "text-slate-500")}>{statusWatch === "ACTIVE" ? "Đang kinh doanh" : statusWatch === "INACTIVE" ? "Tạm ngừng" : "Lưu nháp"}</span></div>
                        </div>
                        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                            <p className="text-[10px] font-black uppercase tracking-wide text-slate-500 mb-2">Preview realtime</p>
                            <div className="flex items-center gap-2.5">
                                <div className="h-12 w-12 rounded-md bg-white border border-slate-200 overflow-hidden shrink-0">
                                    {firstVariantImagePreview ? (
                                        <img src={firstVariantImagePreview} alt="Preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-[9px] font-bold text-slate-300">NO IMG</div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[12px] font-bold text-slate-700 truncate">{nameWatch?.trim() || "Sản phẩm chưa đặt tên"}</p>
                                    <p className="text-[11px] text-slate-500">{fields.length} SKU · {firstVariantImagePreview ? 1 : 0} ảnh</p>
                                </div>
                            </div>
                        </div>
                        {missingWarnings.length > 0 && (
                            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                                <p className="text-[11px] font-black text-amber-700 uppercase mb-1">Cần bổ sung</p>
                                <ul className="text-[11px] text-amber-700 space-y-0.5">
                                    {missingWarnings.map((warning) => (
                                        <li key={warning}>- {warning}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <p className="mt-3 text-[11px] text-slate-400">{lastDraftSavedAt ? `Đã lưu nháp cục bộ lúc ${lastDraftSavedAt}` : "Chưa có bản nháp cục bộ"}</p>
                    </div>

                    <div ref={imagesSectionRef} className="bg-white border border-[#dcdcdc] p-5 rounded-xl shadow-sm">
                        <Label className="text-[11px] font-black text-slate-700 uppercase block mb-4 text-center tracking-widest border-b pb-3">
                            Ảnh sản phẩm (tự lấy từ biến thể đầu tiên)
                        </Label>
                        <div className="space-y-3">
                            <p className="text-[12px] text-slate-500">
                                Hệ thống sẽ tự dùng ảnh của <span className="font-bold text-slate-700">biến thể #1</span> làm ảnh sản phẩm.
                            </p>
                            <div className="aspect-square border border-[#e0e0e0] bg-white rounded-none overflow-hidden flex items-center justify-center">
                                {firstVariantImagePreview ? (
                                    <img
                                        src={firstVariantImagePreview}
                                        className="w-full h-full object-cover"
                                        alt="Ảnh sản phẩm tự động"
                                    />
                                ) : (
                                    <div className="text-center px-4">
                                        <Camera size={32} className="mx-auto text-slate-300 mb-2" />
                                        <p className="text-[11px] font-bold text-slate-400 uppercase">Chưa có ảnh biến thể #1</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div ref={statusSectionRef} className="bg-white border border-[#dcdcdc] p-5 rounded-xl shadow-sm">
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

            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogContent className="sm:max-w-[460px] bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-[18px] font-black text-slate-800">Bạn có thay đổi chưa lưu</DialogTitle>
                        <DialogDescription className="text-[13px] text-slate-500">
                            Các thay đổi của bạn sẽ bị mất nếu rời khỏi trang này.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setConfirmDialogOpen(false)}
                        >
                            Ở lại
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                setConfirmDialogOpen(false);
                                pendingLeaveAction?.();
                            }}
                            className="bg-rose-600 hover:bg-rose-700"
                        >
                            Rời khỏi trang
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={draftPromptOpen} onOpenChange={setDraftPromptOpen}>
                <DialogContent className="sm:max-w-[560px] bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-[18px] font-black text-slate-800">Khôi phục bản nháp gần nhất?</DialogTitle>
                        <DialogDescription className="text-[13px] text-slate-500">
                            Hệ thống phát hiện bạn có bản nháp chưa hoàn tất cho form thêm sản phẩm.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <p className="text-[12px] text-slate-600">Nháp hiện tại: {pendingDraftData?.savedAt ? new Date(pendingDraftData.savedAt).toLocaleString("vi-VN") : "Không rõ thời gian"}</p>
                        </div>
                        <div>
                            <p className="text-[11px] font-black uppercase text-slate-500 mb-2">Các nháp gần đây</p>
                            <div className="max-h-[160px] overflow-y-auto rounded-md border border-slate-200">
                                {recentDrafts.length === 0 ? (
                                    <p className="text-[12px] text-slate-400 p-3">Chưa có nháp gần đây.</p>
                                ) : (
                                    <ul className="divide-y divide-slate-100">
                                        {recentDrafts.map((item) => (
                                            <li key={item.key} className="px-3 py-2 text-[12px]">
                                                <p className="font-semibold text-slate-700">{item.label}</p>
                                                <p className="text-slate-400">{new Date(item.savedAt).toLocaleString("vi-VN")}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={handleDiscardDraft}>Bỏ nháp</Button>
                        <Button type="button" onClick={handleRestoreDraft} className="bg-emerald-600 hover:bg-emerald-700">Khôi phục nháp</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                            Thêm nhanh giá trị mới cho biến thể đang chỉnh sửa mà không cần rời trang sản phẩm.
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

            <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-[#ddd] p-3 sm:p-[12px_20px] lg:p-[12px_30px] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 z-20 shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        confirmLeaveIfDirty(() => {
                            setAllowUnload(true);
                            router.back();
                        });
                    }}
                    className="w-full sm:w-auto min-w-[110px] h-[38px] text-[12px] font-bold border-[#ccc] rounded-md uppercase"
                >
                    Hủy bỏ
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto min-w-[160px] h-[38px] text-[12px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-md uppercase"
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
