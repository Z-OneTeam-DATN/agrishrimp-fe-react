"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import dynamic from "next/dynamic";
import {
    X, Trash2, Save, ChevronLeft, Camera, Upload, AlertCircle, FileText, Layers, Loader2, ChevronDown, Check, Package, Info, Copy, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ProductService } from "@/app/services/product.service";
import { updateAttribute } from "@/app/services/AttributeService";
import { SettingService } from "@/app/services/setting.service";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// 👉 TÍCH HỢP TRỰC TIẾP REACT QUILL NEW (Tắt SSR)
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

const EDIT_PRODUCT_DRAFT_KEY_PREFIX = "admin-product-edit-draft-v2";
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

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const infoSectionRef = useRef<HTMLDivElement>(null);
    const descriptionSectionRef = useRef<HTMLDivElement>(null);
    const variantsSectionRef = useRef<HTMLDivElement>(null);
    const imagesSectionRef = useRef<HTMLDivElement>(null);
    const statusSectionRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
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
    const [lastDraftSavedAt, setLastDraftSavedAt] = useState("");
    const [mediaDirty, setMediaDirty] = useState(false);
    const [allowUnload, setAllowUnload] = useState(false);

    const [variantImageFiles, setVariantImageFiles] = useState<(File | string | null)[]>([]);
    const [variantImagePreviews, setVariantImagePreviews] = useState<string[]>([]);

    const [categories, setCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<string[]>([]);
    const [attributes, setAttributes] = useState<any[]>([]);
    const [attributeEditor, setAttributeEditor] = useState<AttributeEditorState | null>(null);
    const [newAttributeValue, setNewAttributeValue] = useState("");
    const [isSavingAttribute, setIsSavingAttribute] = useState(false);
    const variantListRef = useRef<HTMLDivElement>(null);

    // 👉 Bỏ biến systemProfitMargin vì giờ Backend đã tự động tính sellingPrice

    const { isLoadingAuth, isAuthenticated, user } = useAuthStore();
    const { hasPermission } = usePermissions();
    const isAdmin = user?.role?.slug === "ADMIN";
    const canUpdateAttribute = hasPermission(P.ATTRIBUTE_UPDATE);

    const { register, handleSubmit, control, setValue, watch, getValues, reset, formState: { errors, isDirty } } = useForm<ProductFormData>({
        resolver: zodResolver(AdminProductSchema),
        defaultValues: { name: "", categoryId: "", brand: "", origin: "", baseSku: "", description: "", status: "ACTIVE", variants: [DEFAULT_VARIANT] },
    });
    const nameWatch = watch("name");
    const categoryWatch = watch("categoryId");
    const statusWatch = watch("status");
    const descriptionWatch = watch("description");
    const variantsWatch = watch("variants");

    const { fields, append, remove } = useFieldArray({ control, name: "variants" });
    const [variantDataMap, setVariantDataMap] = useState<Record<number, any>>({});
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
    const draftStorageKey = `${EDIT_PRODUCT_DRAFT_KEY_PREFIX}-${id}`;
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
        const batchCount = Number(variantDataMap[idx]?.batches?.length || 0);
        const batchHeight = isCollapsed ? 0 : (batchCount > 0 ? Math.min(batchCount, 4) * 28 + 128 : 126);
        return isCollapsed ? 188 : 272 + attributeRows * 96 + batchHeight;
    }, [attributes.length, collapsedVariantIds, fields, variantDataMap]);

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

        const overscan = 700;
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
    }, []);

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

                    const vImages = (productDetail.variants || []).map((v: any) => v.imageUrl || null);
                    setVariantImageFiles(vImages);
                    setVariantImagePreviews(vImages.map((img: string | null) => img || ""));

                    const savedDraft = localStorage.getItem(draftStorageKey);
                    if (savedDraft) {
                        try {
                            const parsed = JSON.parse(savedDraft);
                            if (parsed?.formData) {
                                setPendingDraftData({ ...parsed, fallbackData: mappedData });
                                setDraftPromptOpen(true);
                            }
                        } catch {
                            localStorage.removeItem(draftStorageKey);
                        }
                    }

                } catch (error) {
                    toast.error("Không thể tải thông tin sản phẩm.");
                } finally {
                    setIsFetching(false);
                }
            };
            fetchData();
        }
    }, [isLoadingAuth, isAuthenticated, id, reset, draftStorageKey]);

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

    useEffect(() => {
        if (allowUnload || isFetching) return;

        const timer = window.setTimeout(() => {
            const payload = {
                formData: getValues(),
                savedAt: Date.now(),
            };
            localStorage.setItem(draftStorageKey, JSON.stringify(payload));
            syncDraftIndex({
                key: draftStorageKey,
                label: `Cập nhật sản phẩm #${id}`,
                savedAt: payload.savedAt,
            });
            setLastDraftSavedAt(new Date(payload.savedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
        }, 900);

        return () => window.clearTimeout(timer);
    }, [allowUnload, isFetching, getValues, draftStorageKey, id, nameWatch, categoryWatch, statusWatch, descriptionWatch, fields.length, variantsWatch, mediaDirty, syncDraftIndex]);

    const confirmLeaveIfDirty = useCallback(() => {
        if (!hasUnsavedChanges) return true;
        return window.confirm("Bạn có thay đổi chưa lưu. Bạn chắc chắn muốn rời khỏi trang?");
    }, [hasUnsavedChanges]);

    const scrollToStep = useCallback((step: ProductFormStep) => {
        const target = steps.find((item) => item.key === step)?.ref.current;
        if (!target) return;
        window.scrollTo({ top: window.scrollY + target.getBoundingClientRect().top - 120, behavior: "smooth" });
    }, [steps]);

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

        const blocked = selectedVariantIndexes.filter((idx) => (variantDataMap[idx]?.quantity || 0) > 0);
        if (blocked.length > 0) {
            toast.error("Có biến thể còn tồn kho nên không thể xóa hàng loạt.");
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

        const fallbackData = pendingDraftData.fallbackData;
        const draftData = pendingDraftData.formData;
        reset({
            name: draftData.name || fallbackData?.name || "",
            categoryId: draftData.categoryId || fallbackData?.categoryId || "",
            brand: draftData.brand || fallbackData?.brand || "",
            origin: draftData.origin || fallbackData?.origin || "",
            baseSku: draftData.baseSku || fallbackData?.baseSku || "",
            description: draftData.description || fallbackData?.description || "",
            status: draftData.status || fallbackData?.status || "ACTIVE",
            variants: Array.isArray(draftData.variants) && draftData.variants.length > 0
                ? draftData.variants
                : fallbackData?.variants || [DEFAULT_VARIANT],
        });

        const variantLength = Array.isArray(draftData.variants) && draftData.variants.length > 0
            ? draftData.variants.length
            : fallbackData?.variants?.length || 1;
        setVariantImageFiles((prev) => {
            const next = [...prev];
            while (next.length < variantLength) next.push(null);
            return next.slice(0, variantLength);
        });
        setVariantImagePreviews((prev) => {
            const next = [...prev];
            while (next.length < variantLength) next.push("");
            return next.slice(0, variantLength);
        });

        if (pendingDraftData.savedAt) {
            setLastDraftSavedAt(new Date(pendingDraftData.savedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
        }
        setDraftPromptOpen(false);
        toast.success("Đã khôi phục bản nháp.");
    };

    const handleDiscardDraft = () => {
        localStorage.removeItem(draftStorageKey);
        const raw = localStorage.getItem(PRODUCT_DRAFT_INDEX_KEY);
        if (raw) {
            try {
                const list: DraftIndexEntry[] = JSON.parse(raw);
                const next = list.filter((item) => item.key !== draftStorageKey);
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

    const handleVariantImageChange = (variantIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setVariantImageFiles((prev) => { const n = [...prev]; n[variantIndex] = file; return n; });
        setVariantImagePreviews((prev) => { const n = [...prev]; n[variantIndex] = URL.createObjectURL(file); return n; });
        setMediaDirty(true);
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

    const handleToggleVariant = (fieldId: string) => {
        setCollapsedVariantIds((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }));
    };

    const handleDuplicateVariant = (idx: number) => {
        const source = getValues(`variants.${idx}`);
        const currentBaseSku = getValues("baseSku") || "SP";
        const currentVariants = getValues("variants") || [];

        let maxSuffix = 0;
        currentVariants.forEach((variant: any) => {
            if (variant.sku) {
                const parts = variant.sku.split("-");
                const num = parseInt(parts[parts.length - 1]);
                if (!isNaN(num) && num > maxSuffix) maxSuffix = num;
            }
        });

        const newSku = `${currentBaseSku}-${maxSuffix + 1}`;
        const newBarcode = `893${Math.floor(100000000 + Math.random() * 900000000)}`;
        append({
            ...DEFAULT_VARIANT,
            sku: newSku,
            barcode: newBarcode,
            attributeValueIds: [...(source?.attributeValueIds || [])],
        });

        const sourceFile = variantImageFiles[idx];
        const sourcePreview = variantImagePreviews[idx] || "";
        setVariantImageFiles((prev) => [...prev, sourceFile ?? null]);
        setVariantImagePreviews((prev) => [...prev, sourcePreview]);
        setVariantDataMap((prev) => ({ ...prev, [fields.length]: { quantity: 0, batches: [] } }));
        setMediaDirty(true);
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
        setMediaDirty(true);

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
        const firstVariantImage = variantImageFiles[0];
        if (!firstVariantImage) return toast.error("Vui lòng tải ảnh cho biến thể đầu tiên.");
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
            const existingFirstVariantImage = typeof firstVariantImage === 'string' ? firstVariantImage : null;
            const newFirstVariantImageFile = typeof firstVariantImage === 'string' ? null : firstVariantImage;

            const productData: any = {
                name: data.name.trim(), categoryId: Number(data.categoryId), brand: data.brand?.trim() || "",
                origin: data.origin?.trim() || "", description: data.description || "", status: data.status,
                images: existingFirstVariantImage ? [existingFirstVariantImage] : [],
                variants: rawVariants.map((v: any, vIdx: number) => {
                    const img = variantImageFiles[vIdx];
                    return {
                        sku: v.sku.trim(), barcode: v.barcode?.trim() || "",
                        image: typeof img === 'string' ? img : null,
                        attributeValueIds: v.attributeValueIds || [],
                    };
                }),
            };

            const formData = new FormData();
            formData.append("data", new Blob([JSON.stringify(productData)], { type: "application/json" }));

            if (newFirstVariantImageFile) {
                formData.append("productImages", newFirstVariantImageFile as File);
            }

            variantImageFiles.forEach((file) => {
                if (file && typeof file !== 'string') {
                    formData.append("variantImages", file as File);
                } else {
                    formData.append("variantImages", new Blob([], { type: "image/png" }));
                }
            });

            await ProductService.update(id, formData);
            setAllowUnload(true);
            localStorage.removeItem(draftStorageKey);
            const rawIndex = localStorage.getItem(PRODUCT_DRAFT_INDEX_KEY);
            if (rawIndex) {
                try {
                    const list: DraftIndexEntry[] = JSON.parse(rawIndex);
                    const next = list.filter((item) => item.key !== draftStorageKey);
                    localStorage.setItem(PRODUCT_DRAFT_INDEX_KEY, JSON.stringify(next));
                } catch {
                    localStorage.removeItem(PRODUCT_DRAFT_INDEX_KEY);
                }
            }
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-[170px] sm:pb-[150px] bg-slate-50/30 p-3 sm:p-4 lg:p-5 max-w-[1680px] mx-auto">
            <div className="flex items-center gap-3 mb-2 px-1">
                <Button type="button" variant="ghost" size="icon" onClick={() => {
                    if (confirmLeaveIfDirty()) {
                        setAllowUnload(true);
                        router.back();
                    }
                }} className="h-8 w-8 text-slate-400"><ChevronLeft size={20} /></Button>
                <h1 className="text-[17px] font-black text-[#1f1f1f] tracking-tight uppercase flex-1">Chỉnh sửa: {watch("name")}</h1>
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

                    <div ref={descriptionSectionRef} className="bg-white border border-[#dcdcdc] p-5 rounded-xl shadow-sm">
                        <SectionHeader num="2" icon={FileText} title="Mô tả hàng hóa" />

                        {/* 👉 TÍCH HỢP SOẠN THẢO VĂN BẢN VÀO ĐÂY, SỬ DỤNG { ref, ...fieldProps } */}
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
                        <div className="px-5 py-3 border-b bg-[#f8f9fa] flex justify-between items-center">
                            <h3 className="text-[11px] font-black text-slate-700 flex items-center gap-2 uppercase"><Layers size={15} className="text-emerald-600" />3. Biến thể và Lô hàng</h3>
                            <Button type="button" variant="outline" onClick={handleAppendVariant} className="h-[28px] text-[10px] font-black text-emerald-600 border-emerald-200 bg-white uppercase">+ Thêm biến thể</Button>
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
                                const extraData = variantDataMap[idx] || { quantity: 0, batches: [] };
                                const currentStock = extraData.quantity;
                                const batches = extraData.batches;
                                const variantAttributeIds = watch(`variants.${idx}.attributeValueIds`) || [];
                                const isCollapsed = !!collapsedVariantIds[field.id];
                                const isSelected = !!selectedVariantIds[field.id];
                                const variantIssue = variantValidationMap[idx] || { missing: false, duplicate: false };

                                return (
                                    <div key={field.id} className={cn("p-5 bg-white", isSelected && "bg-blue-50/40")}>
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
                                                    <label className="inline-flex items-center gap-2 text-[12px] font-bold text-slate-700 cursor-pointer">
                                                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelectVariant(field.id)} className="h-4 w-4 accent-emerald-600" />
                                                        Phân loại & Định danh SKU
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
                                                        <Button type="button" variant="outline" onClick={() => handleRemoveVariant(idx)} className={cn("h-[28px] text-[10px] uppercase font-black px-3", currentStock > 0 ? "text-slate-400 border-slate-200 cursor-not-allowed bg-slate-50" : "text-rose-500 border-rose-100 hover:bg-rose-50")}>
                                                            <Trash2 size={12} className="mr-1" /> {currentStock > 0 ? "Kẹt tồn kho" : "Xóa SKU này"}
                                                        </Button>
                                                    </div>
                                                </div>

                                                {!isCollapsed && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                                )}

                                                {!isCollapsed && attributes.length > 0 && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 bg-slate-50 p-3 border border-dashed border-slate-200 mt-2">
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
                                                                                <SelectTrigger className="h-[30px] border-[#ccc] bg-white">
                                                                                    <SelectValue placeholder={`-- Chọn --`} />
                                                                                </SelectTrigger>
                                                                                <SelectContent className="max-h-[280px]" position="item-aligned">
                                                                                    <SelectItem value="none">-- Bỏ chọn --</SelectItem>
                                                                                    {attributeOptions.map((v: any, vIdx: number) => {
                                                                                        const uniqueValId = v.valueId != null ? String(v.valueId) : `val-idx-${vIdx}`;
                                                                                        return (
                                                                                            <SelectItem key={`attr-val-${uniqueValId}`} value={uniqueValId}>
                                                                                                {v.value}
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
                                                                    // 👉 FIX LỖI TÍNH GIÁ BÁN (Lấy trực tiếp từ Backend)
                                                                    const importPrice = b.importPrice;
                                                                    const sellingPrice = b.sellingPrice || 0;

                                                                    return (
                                                                        <tr key={`batch-${field.id}-${b.inventoryId || bIdx}`} className="hover:bg-slate-50">
                                                                            <td className="p-2 text-[11px] font-mono font-bold text-slate-700">{b.batchNumber || "Mặc định"}</td>
                                                                            <td className="p-2 text-[10px] font-medium text-slate-500">{b.branchName}</td>
                                                                            <td className="p-2 text-[11px] font-black text-slate-700 text-center">{b.quantity}</td>
                                                                            {isAdmin && (
                                                                                <td className="p-2 text-[11px] font-bold text-blue-600 text-right">
                                                                                    {importPrice != null ? `${importPrice.toLocaleString('vi-VN')} ₫` : "—"}
                                                                                </td>
                                                                            )}
                                                                            <td className="p-2 text-[11px] font-black text-emerald-600 text-right">{sellingPrice.toLocaleString('vi-VN')} ₫</td>
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
                        <Label className="text-[11px] font-black text-slate-700 uppercase block mb-4 text-center border-b pb-3 tracking-widest">Ảnh sản phẩm (tự lấy từ biến thể đầu tiên)</Label>
                        <div className="space-y-3">
                            <p className="text-[12px] text-slate-500">
                                Hệ thống sẽ tự dùng ảnh của <span className="font-bold text-slate-700">biến thể #1</span> làm ảnh sản phẩm.
                            </p>
                            <div className="aspect-square border border-[#e0e0e0] bg-white rounded-none overflow-hidden flex items-center justify-center">
                                {firstVariantImagePreview ? (
                                    <img src={firstVariantImagePreview} className="w-full h-full object-cover" alt="Ảnh sản phẩm tự động" />
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

            <Dialog
                open={draftPromptOpen}
                onOpenChange={setDraftPromptOpen}
            >
                <DialogContent className="sm:max-w-[560px] bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-[18px] font-black text-slate-800">Khôi phục bản nháp gần nhất?</DialogTitle>
                        <DialogDescription className="text-[13px] text-slate-500">
                            Hệ thống phát hiện bạn có bản nháp chưa hoàn tất cho form cập nhật sản phẩm này.
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

            <div className="sticky bottom-0 right-0 left-0 bg-white/95 backdrop-blur border-t p-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                <Button type="button" variant="outline" onClick={() => {
                    if (confirmLeaveIfDirty()) {
                        setAllowUnload(true);
                        router.back();
                    }
                }} className="w-full sm:w-auto rounded-md font-bold px-8">HỦY</Button>
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto bg-emerald-600 text-white rounded-md font-bold px-10">
                    {isLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />} CẬP NHẬT
                </Button>
            </div>
        </form>
    );
}