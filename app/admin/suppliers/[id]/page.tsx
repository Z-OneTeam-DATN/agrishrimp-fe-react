"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SupplierSchema, SupplierFormValues } from "@/app/types/admin.schema";
import { supplierService } from "@/app/services/supplier.service";
import { ProductService } from "@/app/services/product.service";
import { ProductListItem } from "@/app/types/product.schema";
import { SupplierProductCatalogItem, SupplierProductCatalogStatus } from "@/app/types/supplier.type";
import {
    ChevronLeft,
    Phone,
    Mail,
    MapPin,
    History,
    Info,
    Save,
    FileText,
    Warehouse,
    Search,
    PencilLine,
    Check,
    CalendarClock,
    ArrowUpRight,
    ImageOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImportHistoryItem {
    id: number;
    code: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    itemCount?: number;
    totalQuantity?: number;
}

interface SupplierMeta {
    createdAt?: string;
    updatedAt?: string;
}

const buildCatalogPayload = (
    products: ProductListItem[],
    catalogItems: SupplierProductCatalogItem[],
) => {
    const catalogMap = new Map(catalogItems.map((item) => [item.productId, item]));
    return products
        .map((product) => {
            const current = catalogMap.get(product.id);
            return {
                productId: product.id,
                status: (current?.status || "CHECKING") as SupplierProductCatalogStatus,
                note: current?.note || "",
            };
        })
        .sort((a, b) => a.productId - b.productId);
};

export default function SupplierDetailPage() {
    const router = useRouter();
    const params = useParams();
    const supplierId = Number(params.id);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isCatalogSaving, setIsCatalogSaving] = useState(false);
    const [isContactEdit, setIsContactEdit] = useState(false);
    const [supplierMeta, setSupplierMeta] = useState<SupplierMeta>({});
    const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([]);
    const [catalogItems, setCatalogItems] = useState<SupplierProductCatalogItem[]>([]);
    const [savedCatalogItems, setSavedCatalogItems] = useState<SupplierProductCatalogItem[]>([]);
    const [catalogProducts, setCatalogProducts] = useState<ProductListItem[]>([]);
    const [catalogKeyword, setCatalogKeyword] = useState("");
    const [selectedCatalogProductIds, setSelectedCatalogProductIds] = useState<number[]>([]);
    const [bulkCatalogStatus, setBulkCatalogStatus] = useState<SupplierProductCatalogStatus | "none">("none");
    const [activeTab, setActiveTab] = useState<"info" | "catalog" | "history">("info");
    const [showCatalogDraftModal, setShowCatalogDraftModal] = useState(false);
    const [pendingTabValue, setPendingTabValue] = useState<"info" | "catalog" | "history" | null>(null);
    const [pendingNavigationHref, setPendingNavigationHref] = useState<string | null>(null);
    const [pendingGoBack, setPendingGoBack] = useState(false);

    const [historyKeyword, setHistoryKeyword] = useState("");
    const [historyStatus, setHistoryStatus] = useState("all");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [catalogCurrentPage, setCatalogCurrentPage] = useState(1);
    const CATALOG_PAGE_SIZE = 8;
    const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
    const HISTORY_PAGE_SIZE = 4;
    const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
    const [pendingStatusValue, setPendingStatusValue] = useState<"active" | "inactive" | null>(null);

    const {
        control,
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<SupplierFormValues>({
        resolver: zodResolver(SupplierSchema),
    });

    const supplierData = watch();

    useEffect(() => {
        const initData = async () => {
            if (!supplierId) return;

            try {
                const [supplierInfo, historyData, catalogData, productsData] = await Promise.all([
                    supplierService.getById(supplierId),
                    supplierService.getImportHistory(supplierId),
                    supplierService.getProductCatalog(supplierId),
                    ProductService.getAll({ status: "ACTIVE" }),
                ]);

                if (supplierInfo) {
                    reset({
                        ...supplierInfo,
                        status: supplierInfo.status?.toLowerCase() as SupplierFormValues["status"],
                    });

                    setSupplierMeta({
                        createdAt: (supplierInfo as any)?.createdAt,
                        updatedAt: (supplierInfo as any)?.updatedAt,
                    });
                }

                setImportHistory(Array.isArray(historyData) ? historyData : []);
                const loadedCatalogItems = Array.isArray(catalogData) ? catalogData : [];
                const loadedProducts = Array.isArray(productsData) ? productsData : [];
                setCatalogItems(loadedCatalogItems);
                setSavedCatalogItems(loadedCatalogItems);
                setCatalogProducts(loadedProducts);
            } catch (error) {
                toast.error("Không tải được dữ liệu");
                router.push("/admin/suppliers");
            } finally {
                setIsLoading(false);
            }
        };

        initData();
    }, [supplierId, reset, router]);

    const onSave = async (data: SupplierFormValues) => {
        setIsSaving(true);
        try {
            await supplierService.update(supplierId, data);
            toast.success("Cập nhật thông tin thành công!");
            window.dispatchEvent(new Event("supplierUpdated"));
            router.push("/admin/suppliers");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Lỗi khi cập nhật";
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    const onError = () => {
        toast.error("Vui lòng kiểm tra lại! Có trường bắt buộc chưa được điền đúng.");
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "---";
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return "---";
        return `${date.toLocaleDateString("vi-VN")} ${date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
    };

    const getImportScaleLabel = (item: ImportHistoryItem) => {
        const itemCount = item.itemCount || 0;
        const totalQuantity = item.totalQuantity || 0;

        return {
            itemLabel: `${itemCount} mã hàng`,
            quantityLabel: `${totalQuantity} sản phẩm`,
        };
    };

    const getNoteStatus = (status: string) => {
        switch (status) {
            case "COMPLETED":
                return { label: "ĐÃ HOÀN THÀNH", class: "bg-emerald-50 text-emerald-600 border-emerald-200" };
            case "APPROVED":
                return { label: "ĐÃ DUYỆT", class: "bg-blue-50 text-blue-600 border-blue-200" };
            case "PENDING":
                return { label: "ĐANG XỬ LÝ", class: "bg-orange-50 text-orange-600 border-orange-200" };
            case "CANCELLED":
                return { label: "ĐÃ HỦY", class: "bg-rose-50 text-rose-600 border-rose-200" };
            default:
                return { label: status || "KHÔNG XÁC ĐỊNH", class: "bg-slate-50 text-slate-600 border-slate-200" };
        }
    };

    const latestImport = useMemo(() => {
        if (importHistory.length === 0) return null;
        return [...importHistory].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    }, [importHistory]);

    const totalImportValue = useMemo(
        () => importHistory.reduce((sum, item) => sum + (item.totalAmount || 0), 0),
        [importHistory],
    );

    const lastOperationalUpdate = supplierMeta.updatedAt || latestImport?.createdAt || supplierMeta.createdAt;

    const filteredHistory = useMemo(() => {
        return importHistory.filter((item) => {
            const keywordOk = item.code?.toLowerCase().includes(historyKeyword.toLowerCase().trim());
            const statusOk = historyStatus === "all" || item.status === historyStatus;

            const itemTime = new Date(item.createdAt).getTime();
            const fromTime = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
            const toTime = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null;

            const fromOk = fromTime == null || itemTime >= fromTime;
            const toOk = toTime == null || itemTime <= toTime;

            return keywordOk && statusOk && fromOk && toOk;
        });
    }, [importHistory, historyKeyword, historyStatus, fromDate, toDate]);

    const catalogByProductId = useMemo(() => {
        return new Map(catalogItems.map((item) => [item.productId, item]));
    }, [catalogItems]);

    const currentCatalogSignature = useMemo(() => {
        return JSON.stringify(buildCatalogPayload(catalogProducts, catalogItems));
    }, [catalogProducts, catalogItems]);

    const savedCatalogSignature = useMemo(() => {
        return JSON.stringify(buildCatalogPayload(catalogProducts, savedCatalogItems));
    }, [catalogProducts, savedCatalogItems]);

    const hasCatalogDraft = currentCatalogSignature !== savedCatalogSignature;

    const catalogStatusSummary = useMemo(() => {
        return catalogProducts.reduce(
            (acc, product) => {
                const status = catalogByProductId.get(product.id)?.status || "CHECKING";
                if (status === "AVAILABLE") acc.available += 1;
                else if (status === "UNAVAILABLE") acc.unavailable += 1;
                else acc.checking += 1;
                return acc;
            },
            { available: 0, unavailable: 0, checking: 0 },
        );
    }, [catalogProducts, catalogByProductId]);

    const filteredCatalogProducts = useMemo(() => {
        const keyword = catalogKeyword.trim().toLowerCase();
        if (!keyword) return catalogProducts;

        return catalogProducts.filter((product) => {
            return (
                product.name?.toLowerCase().includes(keyword) ||
                product.brandName?.toLowerCase().includes(keyword) ||
                product.origin?.toLowerCase().includes(keyword) ||
                product.categoryName?.toLowerCase().includes(keyword) ||
                product.baseSku?.toLowerCase().includes(keyword)
            );
        });
    }, [catalogProducts, catalogKeyword]);

    const filteredCatalogProductIds = useMemo(
        () => filteredCatalogProducts.map((product) => product.id),
        [filteredCatalogProducts],
    );

    const paginatedCatalogProducts = useMemo(() => {
        const startIndex = (catalogCurrentPage - 1) * CATALOG_PAGE_SIZE;
        const endIndex = startIndex + CATALOG_PAGE_SIZE;
        return filteredCatalogProducts.slice(startIndex, endIndex);
    }, [filteredCatalogProducts, catalogCurrentPage]);

    const catalogTotalPages = useMemo(
        () => Math.ceil(filteredCatalogProducts.length / CATALOG_PAGE_SIZE) || 1,
        [filteredCatalogProducts.length],
    );

    const paginatedHistory = useMemo(() => {
        const startIndex = (historyCurrentPage - 1) * HISTORY_PAGE_SIZE;
        const endIndex = startIndex + HISTORY_PAGE_SIZE;
        return filteredHistory.slice(startIndex, endIndex);
    }, [filteredHistory, historyCurrentPage]);

    const historyTotalPages = useMemo(
        () => Math.ceil(filteredHistory.length / HISTORY_PAGE_SIZE) || 1,
        [filteredHistory.length],
    );

    const allFilteredSelected =
        filteredCatalogProductIds.length > 0 &&
        filteredCatalogProductIds.every((id) => selectedCatalogProductIds.includes(id));

    const someFilteredSelected =
        filteredCatalogProductIds.some((id) => selectedCatalogProductIds.includes(id)) && !allFilteredSelected;

    useEffect(() => {
        setSelectedCatalogProductIds((prev) =>
            prev.filter((id) => catalogProducts.some((product) => product.id === id)),
        );
    }, [catalogProducts]);

    useEffect(() => {
        setCatalogCurrentPage(1);
    }, [catalogKeyword]);

    useEffect(() => {
        setHistoryCurrentPage(1);
    }, [historyKeyword, historyStatus, fromDate, toDate]);

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (!hasCatalogDraft) return;
            event.preventDefault();
            event.returnValue = "";
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [hasCatalogDraft]);

    useEffect(() => {
        const handleDocumentLinkClick = (event: MouseEvent) => {
            if (!hasCatalogDraft) return;

            const target = event.target as HTMLElement | null;
            const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
            if (!anchor) return;
            if (anchor.target === "_blank") return;
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

            const href = anchor.getAttribute("href");
            if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

            const samePageHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;
            const targetPath = anchor.pathname + anchor.search + anchor.hash;
            if (targetPath === samePageHref) return;

            event.preventDefault();
            setPendingNavigationHref(anchor.href);
            setPendingTabValue(null);
            setPendingGoBack(false);
            setShowCatalogDraftModal(true);
        };

        document.addEventListener("click", handleDocumentLinkClick, true);
        return () => document.removeEventListener("click", handleDocumentLinkClick, true);
    }, [hasCatalogDraft]);

    const updateCatalogItem = (productId: number, patch: Partial<{ status: SupplierProductCatalogStatus; note: string }>) => {
        setCatalogItems((prev) => {
            const existing = prev.find((item) => item.productId === productId);
            if (existing) {
                return prev.map((item) => item.productId === productId ? { ...item, ...patch } : item);
            }

            const product = catalogProducts.find((item) => item.id === productId);
            return [
                ...prev,
                {
                    id: 0,
                    supplierId,
                    supplierCode: supplierData.taxCode || "",
                    productId,
                    productName: product?.name || "",
                    productSlug: product?.slug || "",
                    brandName: product?.brandName,
                    origin: product?.origin,
                    categoryName: product?.categoryName,
                    status: patch.status || "CHECKING",
                    note: patch.note || "",
                },
            ];
        });
    };

    const toggleCatalogSelection = (productId: number, checked: boolean) => {
        setSelectedCatalogProductIds((prev) => {
            if (checked) {
                if (prev.includes(productId)) return prev;
                return [...prev, productId];
            }
            return prev.filter((id) => id !== productId);
        });
    };

    const toggleSelectAllCatalog = (checked: boolean) => {
        if (checked) {
            setSelectedCatalogProductIds((prev) => {
                const merged = new Set([...prev, ...filteredCatalogProductIds]);
                return Array.from(merged);
            });
            return;
        }

        setSelectedCatalogProductIds((prev) =>
            prev.filter((id) => !filteredCatalogProductIds.includes(id)),
        );
    };

    const applyBulkCatalogStatus = () => {
        if (bulkCatalogStatus === "none" || selectedCatalogProductIds.length === 0) {
            toast.warning("Vui lòng chọn sản phẩm và trạng thái cần áp dụng");
            return;
        }

        setCatalogItems((prev) => {
            const next = [...prev];

            selectedCatalogProductIds.forEach((productId) => {
                const existingIndex = next.findIndex((item) => item.productId === productId);
                if (existingIndex >= 0) {
                    next[existingIndex] = { ...next[existingIndex], status: bulkCatalogStatus };
                    return;
                }

                const product = catalogProducts.find((item) => item.id === productId);
                next.push({
                    id: 0,
                    supplierId,
                    supplierCode: supplierData.taxCode || "",
                    productId,
                    productName: product?.name || "",
                    productSlug: product?.slug || "",
                    brandName: product?.brandName,
                    origin: product?.origin,
                    categoryName: product?.categoryName,
                    status: bulkCatalogStatus,
                    note: "",
                });
            });

            return next;
        });

        toast.success(`Đã cập nhật trạng thái cho ${selectedCatalogProductIds.length} sản phẩm`);
    };

    const saveCatalog = async () => {
        setIsCatalogSaving(true);
        try {
            const payload = buildCatalogPayload(catalogProducts, catalogItems);
            const saved = await supplierService.saveProductCatalog(supplierId, payload);
            setCatalogItems(saved);
            setSavedCatalogItems(saved);
            toast.success("Đã lưu catalog sản phẩm của nhà cung cấp");
            return true;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Lỗi khi lưu catalog";
            toast.error(message);
            return false;
        } finally {
            setIsCatalogSaving(false);
        }
    };

    const discardCatalogDraftAndContinue = () => {
        setCatalogItems(savedCatalogItems);
        setSelectedCatalogProductIds([]);

        if (pendingTabValue) {
            setActiveTab(pendingTabValue);
        } else if (pendingNavigationHref) {
            window.location.href = pendingNavigationHref;
        } else if (pendingGoBack) {
            router.back();
        }

        setPendingTabValue(null);
        setPendingNavigationHref(null);
        setPendingGoBack(false);
        setShowCatalogDraftModal(false);
    };

    const saveCatalogAndContinue = async () => {
        const saved = await saveCatalog();
        if (!saved) return;

        if (pendingTabValue) {
            setActiveTab(pendingTabValue);
        } else if (pendingNavigationHref) {
            window.location.href = pendingNavigationHref;
        } else if (pendingGoBack) {
            router.back();
        }

        setPendingTabValue(null);
        setPendingNavigationHref(null);
        setPendingGoBack(false);
        setShowCatalogDraftModal(false);
    };

    const handleTabChange = (nextTab: string) => {
        const target = nextTab as "info" | "catalog" | "history";
        if (target === activeTab) return;

        if (hasCatalogDraft && activeTab === "catalog") {
            setPendingTabValue(target);
            setPendingNavigationHref(null);
            setPendingGoBack(false);
            setShowCatalogDraftModal(true);
            return;
        }

        setActiveTab(target);
    };

    const handleGoBack = () => {
        if (hasCatalogDraft) {
            setPendingGoBack(true);
            setPendingTabValue(null);
            setPendingNavigationHref(null);
            setShowCatalogDraftModal(true);
            return;
        }

        router.back();
    };

    const timelineEvents = useMemo(
        () => [
            {
                id: "created",
                title: "Khởi tạo nhà cung cấp",
                at: supplierMeta.createdAt,
                detail: "Hồ sơ nhà cung cấp được tạo trong hệ thống.",
            },
            {
                id: "updated",
                title: "Cập nhật hồ sơ gần nhất",
                at: lastOperationalUpdate,
                detail: "Dữ liệu vận hành được cập nhật gần nhất.",
            },
            {
                id: "latest-import",
                title: "Phiếu nhập gần nhất",
                at: latestImport?.createdAt,
                detail: latestImport ? `${latestImport.code} · ${formatCurrency(latestImport.totalAmount)}` : "Chưa có phát sinh phiếu nhập",
            },
        ],
        [supplierMeta.createdAt, lastOperationalUpdate, latestImport],
    );

    if (isLoading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 text-sm text-gray-500">
                <div className="w-8 h-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
                <p className="font-bold uppercase tracking-widest text-slate-400">Đang tải dữ liệu...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSave, onError)} className="space-y-4 pb-10">
            <div className="flex items-center gap-4 mb-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleGoBack}
                    className="h-8 w-8 text-slate-400 hover:text-emerald-600 transition-colors"
                >
                    <ChevronLeft size={20} />
                </Button>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <h1 className="text-[18px] font-black text-slate-800 uppercase tracking-tight">CHI TIẾT NHÀ CUNG CẤP</h1>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded uppercase">
                            #{supplierData.taxCode || supplierId}
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <Warehouse size={12} /> Trung tâm theo dõi hồ sơ và hiệu suất đối tác
                    </p>
                </div>
                <div className="ms-auto flex gap-2">
                    <Button type="submit" disabled={isSaving} className="h-8 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 uppercase">
                        <Save size={14} className="mr-1.5" /> {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-3 border-2 border-emerald-100">
                                <Warehouse size={32} />
                            </div>
                            <p className="text-[15px] font-black text-slate-800 uppercase leading-tight line-clamp-2">{supplierData.name || "---"}</p>
                            <p className="text-[10px] mt-2 text-slate-400 font-mono font-bold">MST: {supplierData.taxCode || "---"}</p>
                        </div>

                        <div className="p-4 grid grid-cols-2 gap-2">
                            <div className="rounded-[4px] border border-slate-200 bg-slate-50 px-2 py-2">
                                <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wide">Ngày tạo</p>
                                <p className="text-[11px] font-bold text-slate-700 mt-1">{formatDate(supplierMeta.createdAt)}</p>
                            </div>
                            <div className="rounded-[4px] border border-slate-200 bg-slate-50 px-2 py-2">
                                <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wide">Cập nhật</p>
                                <p className="text-[11px] font-bold text-slate-700 mt-1">{formatDate(lastOperationalUpdate)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-[11px] font-black uppercase tracking-wide text-slate-700">Thông tin liên hệ</h3>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsContactEdit((prev) => !prev)}
                                className="h-7 text-[10px] font-bold uppercase"
                            >
                                {isContactEdit ? <Check size={12} className="mr-1" /> : <PencilLine size={12} className="mr-1" />}
                                {isContactEdit ? "Xong" : "Chỉnh sửa"}
                            </Button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="flex items-start gap-3">
                                <FileText size={14} className="text-slate-300 mt-1.5" />
                                <div className="w-full">
                                    <p className="text-[10px] uppercase text-slate-400 font-bold">Người liên hệ</p>
                                    {isContactEdit ? (
                                        <>
                                            <Input {...register("contactName")} className="h-8 mt-1 text-[12px]" />
                                            {errors.contactName && <p className="text-[10px] text-red-500 mt-1">{errors.contactName.message}</p>}
                                        </>
                                    ) : (
                                        <p className="text-[12px] font-bold text-slate-700 mt-1">{supplierData.contactName || "---"}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Phone size={14} className="text-slate-300 mt-1.5" />
                                <div className="w-full">
                                    <p className="text-[10px] uppercase text-slate-400 font-bold">Điện thoại</p>
                                    {isContactEdit ? (
                                        <>
                                            <Input {...register("phone")} className="h-8 mt-1 text-[12px]" />
                                            {errors.phone && <p className="text-[10px] text-red-500 mt-1">{errors.phone.message}</p>}
                                        </>
                                    ) : (
                                        <p className="text-[12px] font-bold text-slate-700 mt-1">{supplierData.phone || "---"}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Mail size={14} className="text-slate-300 mt-1.5" />
                                <div className="w-full">
                                    <p className="text-[10px] uppercase text-slate-400 font-bold">Email</p>
                                    {isContactEdit ? (
                                        <>
                                            <Input {...register("email")} className="h-8 mt-1 text-[12px]" />
                                            {errors.email && <p className="text-[10px] text-red-500 mt-1">{errors.email.message}</p>}
                                        </>
                                    ) : (
                                        <p className="text-[12px] font-semibold text-slate-700 mt-1 break-all">{supplierData.email || "---"}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <MapPin size={14} className="text-slate-300 mt-1.5" />
                                <div className="w-full">
                                    <p className="text-[10px] uppercase text-slate-400 font-bold">Địa chỉ</p>
                                    {isContactEdit ? (
                                        <>
                                            <Textarea {...register("addressDetail")} className="mt-1 text-[12px] min-h-[72px]" />
                                            {errors.addressDetail && <p className="text-[10px] text-red-500 mt-1">{errors.addressDetail.message}</p>}
                                        </>
                                    ) : (
                                        <p className="text-[12px] text-slate-700 mt-1 leading-relaxed">{supplierData.addressDetail || "---"}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8">
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="bg-white border border-[#dcdcdc] rounded-[4px] p-1 w-full flex justify-start gap-1 h-auto shadow-sm">
                            <TabsTrigger value="info" className="text-[11px] font-bold uppercase py-2 px-4 rounded-[3px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                                <Info size={14} className="mr-1.5" /> Thông tin chi tiết
                            </TabsTrigger>
                            <TabsTrigger value="catalog" className="text-[11px] font-bold uppercase py-2 px-4 rounded-[3px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                                <Warehouse size={14} className="mr-1.5" /> Catalog sản phẩm ({catalogProducts.length})
                            </TabsTrigger>
                            <TabsTrigger value="history" className="text-[11px] font-bold uppercase py-2 px-4 rounded-[3px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                                <History size={14} className="mr-1.5" /> Lịch sử nhập hàng ({filteredHistory.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="info" className="space-y-4 mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="bg-white border border-[#dcdcdc] rounded-[4px] p-4 shadow-sm">
                                    <p className="text-[10px] font-bold uppercase text-slate-400">Tổng số phiếu nhập</p>
                                    <p className="text-[22px] mt-1 font-black text-slate-800">{importHistory.length}</p>
                                </div>
                                <div className="bg-white border border-[#dcdcdc] rounded-[4px] p-4 shadow-sm">
                                    <p className="text-[10px] font-bold uppercase text-slate-400">Tổng giá trị nhập</p>
                                    <p className="text-[18px] mt-1 font-black text-emerald-700 line-clamp-1">{formatCurrency(totalImportValue)}</p>
                                </div>
                                <div className="bg-white border border-[#dcdcdc] rounded-[4px] p-4 shadow-sm">
                                    <p className="text-[10px] font-bold uppercase text-slate-400">Lần nhập gần nhất</p>
                                    <p className="text-[12px] mt-2 font-bold text-slate-700">{formatDate(latestImport?.createdAt)}</p>
                                    {latestImport?.code && <p className="text-[10px] mt-1 text-slate-400 font-bold">{latestImport.code}</p>}
                                </div>
                            </div>

                            <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm p-5">
                                <Label className="text-[11px] font-black text-slate-700 uppercase block mb-4 tracking-widest border-b pb-3">Trạng thái vận hành</Label>

                                <div className="mb-4">
                                    <span className={cn("inline-flex items-center gap-1 text-[10px] font-black uppercase border px-2 py-1 rounded", "bg-slate-50 text-slate-700 border-slate-200")}>
                                        <CalendarClock size={12} /> Cập nhật: {formatDate(lastOperationalUpdate)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <Label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Trạng thái NCC</Label>
                                        <Controller
                                            name="status"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    onValueChange={(value) => {
                                                        if (value === "inactive" && field.value === "active") {
                                                            setPendingStatusValue(value as "inactive");
                                                            setShowStatusConfirmModal(true);
                                                        } else {
                                                            field.onChange(value);
                                                        }
                                                    }}
                                                    value={field.value}
                                                >
                                                    <SelectTrigger className="h-[38px] text-[13px] border-[#ccc] font-black shadow-none focus:ring-0">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="active" className="text-emerald-600 font-bold uppercase tracking-tighter">ĐANG GIAO DỊCH</SelectItem>
                                                        <SelectItem value="inactive" className="text-rose-600 font-bold uppercase tracking-tighter">TẠM NGỪNG</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm p-5">
                                <Label className="text-[11px] font-black text-slate-700 uppercase block mb-4 tracking-widest border-b pb-3">Thông tin pháp nhân</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Tên nhà cung cấp</Label>
                                        <Input {...register("name")} className="h-[38px] text-[12px] font-bold uppercase" />
                                        {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name.message}</p>}
                                    </div>
                                    <div>
                                        <Label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Mã số thuế</Label>
                                        <Input {...register("taxCode")} className="h-[38px] text-[12px] font-bold font-mono" />
                                        {errors.taxCode && <p className="text-[10px] text-red-500 mt-1">{errors.taxCode.message}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm p-5">
                                <Label className="text-[11px] font-black text-slate-700 uppercase block mb-4 tracking-widest border-b pb-3">Timeline hoạt động</Label>
                                <div className="space-y-4">
                                    {timelineEvents.map((event, index) => (
                                        <div key={event.id} className="relative pl-6">
                                            {index < timelineEvents.length - 1 && <span className="absolute left-[7px] top-4 h-[calc(100%+8px)] w-[1px] bg-slate-200" />}
                                            <span className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-emerald-200 bg-emerald-50" />
                                            <p className="text-[12px] font-black text-slate-800 uppercase">{event.title}</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">{event.detail}</p>
                                            <p className="text-[10px] font-bold text-emerald-600 mt-1">{formatDate(event.at)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="catalog" className="mt-4">
                            <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-100 bg-[#fcfcfc] flex flex-col gap-3">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-[12px] font-black text-slate-700 uppercase flex items-center gap-2">
                                            <Warehouse size={14} className="text-emerald-600" /> Danh mục sản phẩm nhà cung cấp
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={cn(
                                                    "text-[10px] font-bold uppercase px-2 py-1 rounded border",
                                                    hasCatalogDraft
                                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                                        : "bg-emerald-50 text-emerald-700 border-emerald-200",
                                                )}
                                            >
                                                {hasCatalogDraft ? "Có nháp chưa lưu" : "Đã đồng bộ"}
                                            </span>
                                            <Button
                                                type="button"
                                                className="h-8 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 uppercase"
                                                onClick={saveCatalog}
                                                disabled={isCatalogSaving}
                                            >
                                                <Save size={14} className="mr-1.5" /> {isCatalogSaving ? "Đang lưu..." : "Lưu catalog"}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <div className="rounded border border-emerald-100 bg-emerald-50 px-3 py-2">
                                            <p className="text-[10px] font-bold uppercase text-emerald-700">Có cung cấp</p>
                                            <p className="text-[16px] font-black text-emerald-700">{catalogStatusSummary.available}</p>
                                        </div>
                                        <div className="rounded border border-rose-100 bg-rose-50 px-3 py-2">
                                            <p className="text-[10px] font-bold uppercase text-rose-700">Không cung cấp</p>
                                            <p className="text-[16px] font-black text-rose-700">{catalogStatusSummary.unavailable}</p>
                                        </div>
                                        <div className="rounded border border-amber-100 bg-amber-50 px-3 py-2">
                                            <p className="text-[10px] font-bold uppercase text-amber-700">Đang kiểm tra</p>
                                            <p className="text-[16px] font-black text-amber-700">{catalogStatusSummary.checking}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                                        <div className="relative flex-1">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                value={catalogKeyword}
                                                onChange={(e) => setCatalogKeyword(e.target.value)}
                                                placeholder="Tìm theo tên sản phẩm, thương hiệu, xuất xứ, danh mục..."
                                                className="h-[34px] pl-9 text-[12px]"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Select
                                                value={bulkCatalogStatus}
                                                onValueChange={(value) => setBulkCatalogStatus(value as SupplierProductCatalogStatus | "none")}
                                            >
                                                <SelectTrigger className="h-[34px] w-[180px] text-[11px] font-bold">
                                                    <SelectValue placeholder="Chọn trạng thái" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Chọn trạng thái</SelectItem>
                                                    <SelectItem value="AVAILABLE">CÓ CUNG CẤP</SelectItem>
                                                    <SelectItem value="UNAVAILABLE">KHÔNG CUNG CẤP</SelectItem>
                                                    <SelectItem value="CHECKING">ĐANG KIỂM TRA</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="h-[34px] text-[11px] font-bold uppercase"
                                                onClick={applyBulkCatalogStatus}
                                            >
                                                Áp dụng ({selectedCatalogProductIds.length})
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-0 overflow-x-auto">
                                    <Table className="table-custom border-collapse table-fixed min-w-[1140px]">
                                        <colgroup>
                                            <col className="w-[56px]" />
                                            <col className="w-[340px]" />
                                            <col className="w-[220px]" />
                                            <col className="w-[200px]" />
                                            <col />
                                        </colgroup>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50 border-b border-slate-100">
                                                <TableHead className="py-3 pl-4">
                                                    <Checkbox
                                                        checked={allFilteredSelected ? true : someFilteredSelected ? "indeterminate" : false}
                                                        onCheckedChange={(checked) => toggleSelectAllCatalog(checked === true)}
                                                    />
                                                </TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-3">Sản phẩm</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-3">Thương hiệu / Xuất xứ</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-3">Trạng thái NCC</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-3 pr-4">Ghi chú</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedCatalogProducts.length > 0 ? (
                                                paginatedCatalogProducts.map((product) => {
                                                    const current = catalogByProductId.get(product.id);
                                                    const status = current?.status || "CHECKING";
                                                    const statusStyle =
                                                        status === "AVAILABLE"
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                            : status === "UNAVAILABLE"
                                                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                                                : "bg-amber-50 text-amber-700 border-amber-200";

                                                    const previewImage = product.imageUrls?.[0] || product.variants?.find((variant) => variant.imageUrl)?.imageUrl;
                                                    const isSelected = selectedCatalogProductIds.includes(product.id);

                                                    return (
                                                        <TableRow key={product.id} className="border-b border-slate-50 hover:bg-emerald-50/20 align-top">
                                                            <TableCell className="pl-4 py-4">
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    onCheckedChange={(checked) => toggleCatalogSelection(product.id, checked === true)}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="py-3">
                                                                <div className="flex items-start gap-3">
                                                                    <div className="h-14 w-14 rounded border border-slate-200 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center">
                                                                        {previewImage ? (
                                                                            <img
                                                                                src={previewImage}
                                                                                alt={product.name}
                                                                                className="h-full w-full object-cover"
                                                                                onError={(e) => {
                                                                                    e.currentTarget.style.display = "none";
                                                                                }}
                                                                            />
                                                                        ) : (
                                                                            <ImageOff size={16} className="text-slate-400" />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[12px] font-black text-slate-800 line-clamp-2">{product.name}</p>
                                                                        <p className="text-[10px] text-slate-400 font-mono mt-1">SKU gốc: {product.baseSku || "---"}</p>
                                                                        <p className="text-[10px] text-slate-500 mt-1">{product.categoryName || "---"} · {product.variants?.length || 0} biến thể</p>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-3">
                                                                <p className="text-[11px] font-bold text-slate-700">{product.brandName || "---"}</p>
                                                                <p className="text-[10px] text-slate-500 mt-1">Xuất xứ: {product.origin || "---"}</p>
                                                            </TableCell>
                                                            <TableCell className="py-3">
                                                                <Select
                                                                    value={status}
                                                                    onValueChange={(value) => updateCatalogItem(product.id, { status: value as SupplierProductCatalogStatus })}
                                                                >
                                                                    <SelectTrigger className="h-8 text-[11px] font-bold">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="AVAILABLE" className="text-emerald-700 font-bold">CÓ CUNG CẤP</SelectItem>
                                                                        <SelectItem value="UNAVAILABLE" className="text-rose-700 font-bold">KHÔNG CUNG CẤP</SelectItem>
                                                                        <SelectItem value="CHECKING" className="text-amber-700 font-bold">ĐANG KIỂM TRA</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <span className={cn("mt-2 inline-flex items-center rounded border px-2 py-0.5 text-[9px] font-black uppercase", statusStyle)}>
                                                                    {status === "AVAILABLE" ? "Có cung cấp" : status === "UNAVAILABLE" ? "Không cung cấp" : "Đang kiểm tra"}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="py-3 pr-4">
                                                                <Textarea
                                                                    value={current?.note || ""}
                                                                    onChange={(e) => updateCatalogItem(product.id, { note: e.target.value })}
                                                                    placeholder="Ghi chú kiểm tra / điều kiện bán..."
                                                                    className="min-h-[72px] text-[11px]"
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-8 text-[12px] text-slate-400 font-bold uppercase tracking-widest">
                                                        Không có sản phẩm phù hợp bộ lọc
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {filteredCatalogProducts.length > 0 && (
                                    <div className="px-4 py-3 border-t border-slate-100 bg-[#fcfcfc] flex items-center justify-between">
                                        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                                            Hiển thị {(catalogCurrentPage - 1) * CATALOG_PAGE_SIZE + 1} - {Math.min(catalogCurrentPage * CATALOG_PAGE_SIZE, filteredCatalogProducts.length)} trong {filteredCatalogProducts.length}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-[11px] font-bold uppercase"
                                                onClick={() => setCatalogCurrentPage((prev) => Math.max(prev - 1, 1))}
                                                disabled={catalogCurrentPage === 1}
                                            >
                                                ← Trước
                                            </Button>
                                            <span className="text-[11px] font-bold text-slate-600 uppercase min-w-[60px] text-center">
                                                {catalogCurrentPage} / {catalogTotalPages}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-[11px] font-bold uppercase"
                                                onClick={() => setCatalogCurrentPage((prev) => Math.min(prev + 1, catalogTotalPages))}
                                                disabled={catalogCurrentPage === catalogTotalPages}
                                            >
                                                Sau →
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="history" className="mt-4">
                            <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-100 bg-[#fcfcfc]">
                                    <h3 className="text-[12px] font-black text-slate-700 uppercase flex items-center gap-2 mb-3">
                                        <History size={14} className="text-emerald-600" /> Lịch sử phiếu nhập
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                        <div className="relative md:col-span-2">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                value={historyKeyword}
                                                onChange={(e) => setHistoryKeyword(e.target.value)}
                                                placeholder="Tìm mã phiếu..."
                                                className="h-[34px] pl-9 text-[12px]"
                                            />
                                        </div>

                                        <Select value={historyStatus} onValueChange={setHistoryStatus}>
                                            <SelectTrigger className="h-[34px] text-[12px]">
                                                <SelectValue placeholder="Trạng thái phiếu" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                                <SelectItem value="COMPLETED">Đã hoàn thành</SelectItem>
                                                <SelectItem value="PENDING">Đang xử lý</SelectItem>
                                                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-[34px] text-[11px] font-bold uppercase"
                                            onClick={() => {
                                                setHistoryKeyword("");
                                                setHistoryStatus("all");
                                                setFromDate("");
                                                setToDate("");
                                            }}
                                        >
                                            Đặt lại lọc
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                        <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-[34px] text-[12px]" />
                                        <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-[34px] text-[12px]" />
                                    </div>
                                </div>

                                <div className="p-0">
                                    <Table className="table-custom border-collapse table-fixed min-w-[740px]">
                                        <colgroup>
                                            <col className="w-[180px]" />
                                            <col className="w-[190px]" />
                                            <col className="w-[160px]" />
                                            <col />
                                        </colgroup>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50 border-b border-slate-100">
                                                <TableHead className="text-[10px] font-bold uppercase py-3 pl-4">Mã phiếu</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-3">Ngày tạo</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-3">Trạng thái</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-3 text-right pr-4">Tổng giá trị</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedHistory.length > 0 ? (
                                                paginatedHistory.map((item) => {
                                                    const statusInfo = getNoteStatus(item.status);
                                                    return (
                                                        <TableRow
                                                            key={item.id}
                                                            className="border-b border-slate-50 hover:bg-emerald-50/20 cursor-pointer"
                                                            onClick={() => router.push(`/admin/receipts/${item.id}`)}
                                                        >
                                                            <TableCell className="pl-4">
                                                                <button
                                                                    type="button"
                                                                    className="text-[12px] font-black text-emerald-600 hover:text-emerald-700"
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        router.push(`/admin/receipts/${item.id}`);
                                                                    }}
                                                                >
                                                                    {item.code}
                                                                </button>
                                                                <div className="mt-1 flex flex-col">
                                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                                                        {getImportScaleLabel(item).itemLabel}
                                                                    </span>
                                                                    <span className="text-[10px] font-semibold text-slate-400">
                                                                        {getImportScaleLabel(item).quantityLabel}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-[11px] text-slate-500 font-medium">{formatDate(item.createdAt)}</TableCell>
                                                            <TableCell>
                                                                <span className={cn("text-[9px] font-bold border px-1.5 py-0.5 rounded", statusInfo.class)}>
                                                                    {statusInfo.label}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-right pr-4">
                                                                <div className="flex flex-col items-end gap-1">
                                                                    <span className="text-[12px] font-black text-slate-800">
                                                                        {formatCurrency(item.totalAmount)}
                                                                    </span>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-7 px-2 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                                        onClick={(event) => {
                                                                            event.stopPropagation();
                                                                            router.push(`/admin/receipts/${item.id}`);
                                                                        }}
                                                                    >
                                                                        Xem chi tiết <ArrowUpRight size={12} className="ml-1" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-8 text-[12px] text-slate-400 font-bold uppercase tracking-widest">
                                                        Không có phiếu nhập phù hợp bộ lọc
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {filteredHistory.length > 0 && (
                                    <div className="px-4 py-3 border-t border-slate-100 bg-[#fcfcfc] flex items-center justify-between">
                                        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                                            Hiển thị {(historyCurrentPage - 1) * HISTORY_PAGE_SIZE + 1} - {Math.min(historyCurrentPage * HISTORY_PAGE_SIZE, filteredHistory.length)} trong {filteredHistory.length}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-[11px] font-bold uppercase"
                                                onClick={() => setHistoryCurrentPage((prev) => Math.max(prev - 1, 1))}
                                                disabled={historyCurrentPage === 1}
                                            >
                                                ← Trước
                                            </Button>
                                            <span className="text-[11px] font-bold text-slate-600 uppercase min-w-[60px] text-center">
                                                {historyCurrentPage} / {historyTotalPages}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-[11px] font-bold uppercase"
                                                onClick={() => setHistoryCurrentPage((prev) => Math.min(prev + 1, historyTotalPages))}
                                                disabled={historyCurrentPage === historyTotalPages}
                                            >
                                                Sau →
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            <AlertDialog
                open={showStatusConfirmModal}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowStatusConfirmModal(false);
                        setPendingStatusValue(null);
                    }
                }}
            >
                <AlertDialogContent className="rounded-[4px] border-[#dcdcdc]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-[16px] font-black uppercase tracking-tight">
                            Xác nhận ngừng giao dịch
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-[13px] text-slate-500 leading-relaxed">
                            Bạn có chắc muốn thay đổi trạng thái NCC thành "Tạm ngừng"? Lúc này nhà cung cấp sẽ không thể tiếp nhận yêu cầu mua hàng mới.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="h-9 text-[11px] font-bold uppercase">
                            Hủy
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (pendingStatusValue) {
                                    reset({ ...supplierData, status: pendingStatusValue as "active" | "inactive" });
                                }
                                setShowStatusConfirmModal(false);
                                setPendingStatusValue(null);
                            }}
                            className="h-9 text-[11px] font-bold uppercase bg-rose-600 hover:bg-rose-700"
                        >
                            Xác nhận ngừng
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={showCatalogDraftModal}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowCatalogDraftModal(false);
                        setPendingTabValue(null);
                        setPendingNavigationHref(null);
                        setPendingGoBack(false);
                    }
                }}
            >
                <AlertDialogContent className="rounded-[4px] border-[#dcdcdc]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-[16px] font-black uppercase tracking-tight">
                            Catalog chưa lưu thay đổi
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-[13px] text-slate-500 leading-relaxed">
                            Bạn có thay đổi trạng thái hoặc ghi chú catalog sản phẩm nhưng chưa lưu. Chọn cách xử lý trước khi rời tab hoặc rời trang.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="h-9 text-[11px] font-bold uppercase">
                            Ở lại chỉnh sửa
                        </AlertDialogCancel>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-9 text-[11px] font-bold uppercase"
                            onClick={discardCatalogDraftAndContinue}
                        >
                            Bỏ nháp và rời đi
                        </Button>
                        <AlertDialogAction
                            onClick={(event) => {
                                event.preventDefault();
                                void saveCatalogAndContinue();
                            }}
                            className="h-9 text-[11px] font-bold uppercase bg-emerald-600 hover:bg-emerald-700"
                            disabled={isCatalogSaving}
                        >
                            {isCatalogSaving ? "Đang lưu..." : "Lưu và rời đi"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </form>
    );
}
