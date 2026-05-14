"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import {
    AlertTriangle,
    ArrowUpRight,
    CalendarClock,
    Check,
    ChevronLeft,
    Copy,
    FileText,
    History,
    ImageOff,
    Info,
    Mail,
    MapPin,
    PackageSearch,
    PencilLine,
    Phone,
    RefreshCcw,
    Save,
    Search,
    ShieldCheck,
    Warehouse,
} from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { SupplierSchema, SupplierFormValues } from "@/app/types/admin.schema";
import {
    Supplier,
    SupplierProductCatalogItem,
    SupplierProductCatalogStatus,
    SupplierWarning,
} from "@/app/types/supplier.type";
import { ProductListItem } from "@/app/types/product.schema";
import { supplierService } from "@/app/services/supplier.service";
import { ProductService } from "@/app/services/product.service";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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

interface ImportHistoryItem {
    id: number;
    code: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    itemCount?: number;
    totalQuantity?: number;
}

type TabValue = "info" | "catalog" | "history";
type CatalogFilterValue = "ALL" | "TRACKED" | "NOT_IN_CATALOG" | SupplierProductCatalogStatus;

const CATALOG_PAGE_SIZE = 8;
const HISTORY_PAGE_SIZE = 4;
const STALE_CHECKING_DAYS = 14;

const catalogStatusLabels: Record<SupplierProductCatalogStatus, string> = {
    AVAILABLE: "Có cung cấp",
    UNAVAILABLE: "Không cung cấp",
    CHECKING: "Đang kiểm tra",
};

const catalogStatusStyles: Record<SupplierProductCatalogStatus, string> = {
    AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    UNAVAILABLE: "bg-rose-50 text-rose-700 border-rose-200",
    CHECKING: "bg-amber-50 text-amber-700 border-amber-200",
};

const shouldPersistCatalogItem = (item: Pick<SupplierProductCatalogItem, "id" | "productId" | "status" | "note">) => {
    const normalizedNote = item.note?.trim() || "";
    return Boolean(item.productId) && (item.id > 0 || normalizedNote.length > 0 || item.status !== "CHECKING");
};

const buildCatalogPayload = (items: SupplierProductCatalogItem[]) => {
    const map = new Map<number, { productId: number; status: SupplierProductCatalogStatus; note?: string }>();

    items.forEach((item) => {
        if (!shouldPersistCatalogItem(item)) {
            return;
        }

        const normalizedNote = item.note?.trim() || "";
        map.set(item.productId, {
            productId: item.productId,
            status: item.status || "CHECKING",
            note: normalizedNote || undefined,
        });
    });

    return Array.from(map.values()).sort((a, b) => a.productId - b.productId);
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

const formatDate = (dateString?: string) => {
    if (!dateString) return "---";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "---";
    return `${date.toLocaleDateString("vi-VN")} ${date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
};

const getSupplierStatusMeta = (status?: Supplier["status"]) => {
    if (status === "ACTIVE") {
        return { label: "Đang giao dịch", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }
    return { label: "Tạm dừng", className: "bg-slate-100 text-slate-600 border-slate-200" };
};

const getHistoryStatusMeta = (status: string) => {
    switch (status) {
        case "COMPLETED":
            return { label: "Đã hoàn thành", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
        case "APPROVED":
            return { label: "Đã duyệt", className: "bg-blue-50 text-blue-700 border-blue-200" };
        case "PENDING":
            return { label: "Đang xử lý", className: "bg-orange-50 text-orange-700 border-orange-200" };
        case "CANCELLED":
            return { label: "Đã hủy", className: "bg-rose-50 text-rose-700 border-rose-200" };
        default:
            return { label: status || "Không xác định", className: "bg-slate-50 text-slate-600 border-slate-200" };
    }
};

const getCheckingAgeDays = (item: SupplierProductCatalogItem) => {
    if (item.status !== "CHECKING") {
        return null;
    }
    if (typeof item.checkingAgeDays === "number") {
        return item.checkingAgeDays;
    }
    if (!item.updatedAt) {
        return null;
    }
    const diff = Date.now() - new Date(item.updatedAt).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

const buildWarningMap = (warnings: SupplierWarning[]) => {
    const map = new Map<string, SupplierWarning>();
    warnings.forEach((warning) => {
        map.set(warning.code, warning);
    });
    return Array.from(map.values());
};

const buildCatalogFallbackProduct = (item: SupplierProductCatalogItem) =>
    ({
        id: item.productId,
        name: item.productName || `Sản phẩm #${item.productId}`,
        slug: item.productSlug || "",
        brandName: item.brandName || "",
        origin: item.origin || "",
        categoryName: item.categoryName || "",
        baseSku: "",
        imageUrls: [],
        variants: [],
    } as ProductListItem);

export default function SupplierDetailPage() {
    const router = useRouter();
    const params = useParams();
    const supplierId = Number(params.id);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isCatalogSaving, setIsCatalogSaving] = useState(false);
    const [isContactEdit, setIsContactEdit] = useState(false);
    const [supplierRecord, setSupplierRecord] = useState<Supplier | null>(null);
    const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([]);
    const [catalogItems, setCatalogItems] = useState<SupplierProductCatalogItem[]>([]);
    const [savedCatalogItems, setSavedCatalogItems] = useState<SupplierProductCatalogItem[]>([]);
    const [catalogProducts, setCatalogProducts] = useState<ProductListItem[]>([]);
    const [catalogKeyword, setCatalogKeyword] = useState("");
    const [catalogFilter, setCatalogFilter] = useState<CatalogFilterValue>("ALL");
    const [selectedCatalogProductIds, setSelectedCatalogProductIds] = useState<number[]>([]);
    const [bulkCatalogStatus, setBulkCatalogStatus] = useState<SupplierProductCatalogStatus | "none">("none");
    const [activeTab, setActiveTab] = useState<TabValue>("info");
    const [showCatalogDraftModal, setShowCatalogDraftModal] = useState(false);
    const [pendingTabValue, setPendingTabValue] = useState<TabValue | null>(null);
    const [pendingNavigationHref, setPendingNavigationHref] = useState<string | null>(null);
    const [pendingGoBack, setPendingGoBack] = useState(false);
    const [historyKeyword, setHistoryKeyword] = useState("");
    const [historyStatus, setHistoryStatus] = useState("all");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [catalogCurrentPage, setCatalogCurrentPage] = useState(1);
    const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
    const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
    const [pendingStatusValue, setPendingStatusValue] = useState<"active" | "inactive" | null>(null);
    const [historyLoadError, setHistoryLoadError] = useState<string | null>(null);
    const [catalogLoadError, setCatalogLoadError] = useState<string | null>(null);
    const [productLoadError, setProductLoadError] = useState<string | null>(null);

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

    const loadSupplierData = useCallback(async () => {
        if (!supplierId) return;

        try {
            setHistoryLoadError(null);
            setCatalogLoadError(null);
            setProductLoadError(null);

            const supplierInfo = await supplierService.getById(supplierId);

            setSupplierRecord(supplierInfo);
            reset({
                ...supplierInfo,
                status: supplierInfo.status?.toLowerCase() as SupplierFormValues["status"],
            });

            const [historyResult, catalogResult, productsResult] = await Promise.allSettled([
                supplierService.getImportHistory(supplierId),
                supplierService.getProductCatalog(supplierId),
                ProductService.getAll({ status: "ACTIVE" }),
            ]);

            let nextCatalogItems: SupplierProductCatalogItem[] = [];

            if (historyResult.status === "fulfilled") {
                setImportHistory(Array.isArray(historyResult.value) ? historyResult.value : []);
            } else {
                setImportHistory([]);
                setHistoryLoadError("Không tải được lịch sử nhập của nhà cung cấp.");
                toast.warning("Không tải được lịch sử nhập của nhà cung cấp");
            }

            if (catalogResult.status === "fulfilled") {
                nextCatalogItems = Array.isArray(catalogResult.value) ? catalogResult.value : [];
                setCatalogItems(nextCatalogItems);
                setSavedCatalogItems(nextCatalogItems);
            } else {
                setCatalogItems([]);
                setSavedCatalogItems([]);
                setCatalogLoadError("Không tải được catalog hiện tại của nhà cung cấp.");
                toast.warning("Không tải được catalog hiện tại của nhà cung cấp");
            }

            if (productsResult.status === "fulfilled") {
                setCatalogProducts(Array.isArray(productsResult.value) ? productsResult.value : []);
            } else {
                setCatalogProducts(nextCatalogItems.map(buildCatalogFallbackProduct));
                setProductLoadError("Không tải được danh mục sản phẩm tổng. Tab catalog chỉ hiển thị các sản phẩm đã có trong catalog hiện tại.");
                toast.warning("Không tải được danh mục sản phẩm tổng cho tab catalog");
            }
        } catch (error) {
            toast.error(getErrorMessage(error as AxiosError));
            router.push("/admin/suppliers");
        } finally {
            setIsLoading(false);
        }
    }, [reset, router, supplierId]);

    useEffect(() => {
        void loadSupplierData();
    }, [loadSupplierData]);

    const catalogPayload = useMemo(() => buildCatalogPayload(catalogItems), [catalogItems]);
    const savedCatalogPayload = useMemo(() => buildCatalogPayload(savedCatalogItems), [savedCatalogItems]);
    const catalogSourceProducts = useMemo(() => {
        if (catalogProducts.length > 0) {
            return catalogProducts;
        }
        return catalogItems.map(buildCatalogFallbackProduct);
    }, [catalogItems, catalogProducts]);

    const catalogByProductId = useMemo(() => {
        const map = new Map<number, SupplierProductCatalogItem>();
        catalogItems.forEach((item) => {
            if (shouldPersistCatalogItem(item)) {
                map.set(item.productId, {
                    ...item,
                    note: item.note?.trim() || "",
                });
            }
        });
        return map;
    }, [catalogItems]);

    const hasCatalogDraft = JSON.stringify(catalogPayload) !== JSON.stringify(savedCatalogPayload);

    const latestImport = useMemo(() => {
        if (importHistory.length === 0) return null;
        return [...importHistory].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    }, [importHistory]);

    const supplierStatusMeta = getSupplierStatusMeta(supplierRecord?.status);

    const catalogSummary = useMemo(() => {
        return catalogPayload.reduce(
            (acc, item) => {
                acc.total += 1;
                if (item.status === "AVAILABLE") acc.available += 1;
                if (item.status === "UNAVAILABLE") acc.unavailable += 1;
                if (item.status === "CHECKING") acc.checking += 1;
                return acc;
            },
            { total: 0, available: 0, unavailable: 0, checking: 0 },
        );
    }, [catalogPayload]);

    const checkingTooLongItems = useMemo(() => {
        return Array.from(catalogByProductId.values()).filter((item) => {
            const checkingAgeDays = getCheckingAgeDays(item);
            return checkingAgeDays != null && checkingAgeDays >= STALE_CHECKING_DAYS;
        });
    }, [catalogByProductId]);

    const supplierWarnings = useMemo(() => {
        const mergedWarnings: SupplierWarning[] = [...(supplierRecord?.warnings ?? [])];

        if (supplierData.status === "active" && catalogSummary.total === 0) {
            mergedWarnings.push({
                code: "ACTIVE_WITHOUT_CATALOG_LOCAL",
                severity: "WARNING",
                message: "Supplier đang ở trạng thái hoạt động nhưng chưa có catalog sản phẩm nào được lưu.",
            });
        }

        if (checkingTooLongItems.length > 0) {
            mergedWarnings.push({
                code: "CHECKING_TOO_LONG_LOCAL",
                severity: "WARNING",
                message: `${checkingTooLongItems.length} sản phẩm đang ở trạng thái CHECKING quá ${STALE_CHECKING_DAYS} ngày.`,
            });
        }

        return buildWarningMap(mergedWarnings);
    }, [supplierRecord?.warnings, supplierData.status, catalogSummary.total, checkingTooLongItems.length]);

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

    const filteredCatalogProducts = useMemo(() => {
        const normalizedKeyword = catalogKeyword.trim().toLowerCase();

        return catalogSourceProducts.filter((product) => {
            const current = catalogByProductId.get(product.id);
            const isTracked = Boolean(current);
            const currentStatus = current?.status || "CHECKING";

            const keywordOk =
                !normalizedKeyword ||
                product.name?.toLowerCase().includes(normalizedKeyword) ||
                product.brandName?.toLowerCase().includes(normalizedKeyword) ||
                product.origin?.toLowerCase().includes(normalizedKeyword) ||
                product.categoryName?.toLowerCase().includes(normalizedKeyword) ||
                product.baseSku?.toLowerCase().includes(normalizedKeyword);

            let filterOk = true;
            if (catalogFilter === "TRACKED") {
                filterOk = isTracked;
            } else if (catalogFilter === "NOT_IN_CATALOG") {
                filterOk = !isTracked;
            } else if (catalogFilter !== "ALL") {
                filterOk = isTracked && currentStatus === catalogFilter;
            }

            return keywordOk && filterOk;
        });
    }, [catalogSourceProducts, catalogByProductId, catalogKeyword, catalogFilter]);

    const paginatedCatalogProducts = useMemo(() => {
        const startIndex = (catalogCurrentPage - 1) * CATALOG_PAGE_SIZE;
        return filteredCatalogProducts.slice(startIndex, startIndex + CATALOG_PAGE_SIZE);
    }, [filteredCatalogProducts, catalogCurrentPage]);

    const paginatedHistory = useMemo(() => {
        const startIndex = (historyCurrentPage - 1) * HISTORY_PAGE_SIZE;
        return filteredHistory.slice(startIndex, startIndex + HISTORY_PAGE_SIZE);
    }, [filteredHistory, historyCurrentPage]);

    const catalogTotalPages = Math.max(1, Math.ceil(filteredCatalogProducts.length / CATALOG_PAGE_SIZE));
    const historyTotalPages = Math.max(1, Math.ceil(filteredHistory.length / HISTORY_PAGE_SIZE));
    const filteredCatalogProductIds = filteredCatalogProducts.map((product) => product.id);
    const allFilteredSelected =
        filteredCatalogProductIds.length > 0 &&
        filteredCatalogProductIds.every((id) => selectedCatalogProductIds.includes(id));
    const someFilteredSelected =
        filteredCatalogProductIds.some((id) => selectedCatalogProductIds.includes(id)) && !allFilteredSelected;

    const timelineEvents = useMemo(
        () => [
            {
                id: "created",
                title: "Khởi tạo nhà cung cấp",
                at: supplierRecord?.createdAt,
                detail: supplierRecord?.createdByName
                    ? `Hồ sơ được tạo bởi ${supplierRecord.createdByName}.`
                    : "Hồ sơ nhà cung cấp được tạo trong hệ thống.",
            },
            {
                id: "updated",
                title: "Cập nhật hồ sơ gần nhất",
                at: supplierRecord?.updatedAt,
                detail: supplierRecord?.updatedByName
                    ? `Người cập nhật gần nhất: ${supplierRecord.updatedByName}.`
                    : "Thông tin supplier đã được cập nhật gần nhất.",
            },
            {
                id: "latest-import",
                title: "Phiếu nhập gần nhất",
                at: latestImport?.createdAt,
                detail: latestImport
                    ? `${latestImport.code} · ${formatCurrency(latestImport.totalAmount)}`
                    : "Chưa có phát sinh phiếu nhập nào.",
            },
        ],
        [supplierRecord?.createdAt, supplierRecord?.createdByName, supplierRecord?.updatedAt, supplierRecord?.updatedByName, latestImport],
    );

    useEffect(() => {
        setSelectedCatalogProductIds((prev) =>
            prev.filter((id) => catalogSourceProducts.some((product) => product.id === id)),
        );
    }, [catalogSourceProducts]);

    useEffect(() => {
        setCatalogCurrentPage(1);
    }, [catalogKeyword, catalogFilter]);

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

    const copyValue = async (label: string, value?: string) => {
        if (!value) {
            toast.warning(`Chưa có ${label.toLowerCase()} để sao chép`);
            return;
        }

        try {
            await navigator.clipboard.writeText(value);
            toast.success(`Đã sao chép ${label.toLowerCase()}`);
        } catch {
            toast.error(`Không thể sao chép ${label.toLowerCase()}`);
        }
    };

    const updateCatalogItem = (productId: number, patch: Partial<Pick<SupplierProductCatalogItem, "status" | "note">>) => {
        setCatalogItems((prev) => {
            const existing = prev.find((item) => item.productId === productId);
            if (existing) {
                return prev.map((item) =>
                    item.productId === productId
                        ? {
                            ...item,
                            ...patch,
                            note: patch.note ?? item.note ?? "",
                        }
                        : item,
                );
            }

            const product = catalogSourceProducts.find((item) => item.id === productId);
            return [
                ...prev,
                {
                    id: 0,
                    supplierId,
                    supplierCode: supplierRecord?.code || "",
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
                return prev.includes(productId) ? prev : [...prev, productId];
            }
            return prev.filter((id) => id !== productId);
        });
    };

    const toggleSelectAllCatalog = (checked: boolean) => {
        if (checked) {
            setSelectedCatalogProductIds((prev) => Array.from(new Set([...prev, ...filteredCatalogProductIds])));
            return;
        }
        setSelectedCatalogProductIds((prev) => prev.filter((id) => !filteredCatalogProductIds.includes(id)));
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

                const product = catalogSourceProducts.find((item) => item.id === productId);
                next.push({
                    id: 0,
                    supplierId,
                    supplierCode: supplierRecord?.code || "",
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
            const saved = await supplierService.saveProductCatalog(supplierId, catalogPayload);
            const refreshedSupplier = await supplierService.getById(supplierId);
            setCatalogItems(saved);
            setSavedCatalogItems(saved);
            setSupplierRecord(refreshedSupplier);
            toast.success("Đã lưu catalog sản phẩm của nhà cung cấp");
            return true;
        } catch (error) {
            toast.error(getErrorMessage(error as AxiosError));
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
        const target = nextTab as TabValue;
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

    const onSave = async (data: SupplierFormValues) => {
        setIsSaving(true);
        try {
            const updated = await supplierService.update(supplierId, data);
            if (updated.warnings?.length) {
                toast.warning(updated.warnings[0].message);
            }
            toast.success("Cập nhật thông tin thành công");
            window.dispatchEvent(new Event("supplierUpdated"));
            router.push("/admin/suppliers");
        } catch (error) {
            toast.error(getErrorMessage(error as AxiosError));
        } finally {
            setIsSaving(false);
        }
    };

    const onError = () => {
        toast.error("Vui lòng kiểm tra lại các trường bắt buộc");
    };

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
            <div className="flex flex-col gap-3 md:flex-row md:items-start">
                <div className="flex items-start gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleGoBack}
                        className="h-8 w-8 text-slate-400 hover:text-emerald-600"
                    >
                        <ChevronLeft size={20} />
                    </Button>
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-[18px] font-black text-slate-800 uppercase tracking-tight">CHI TIẾT NHÀ CUNG CẤP</h1>
                            <span className={cn("inline-flex items-center rounded border px-2 py-1 text-[10px] font-black uppercase", supplierStatusMeta.className)}>
                                {supplierStatusMeta.label}
                            </span>
                            <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase text-slate-600">
                                {supplierRecord?.code || `#${supplierId}`}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">
                            Hồ sơ supplier, catalog sản phẩm và lịch sử nhập hàng được quản lý riêng trong phạm vi module nhà cung cấp.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="outline" size="sm" className="h-8 text-[11px] font-bold uppercase" onClick={() => void copyValue("Mã NCC", supplierRecord?.code)}>
                                <Copy size={13} className="mr-1.5" /> Mã NCC
                            </Button>
                            <Button type="button" variant="outline" size="sm" className="h-8 text-[11px] font-bold uppercase" onClick={() => void copyValue("MST", supplierData.taxCode)}>
                                <Copy size={13} className="mr-1.5" /> MST
                            </Button>
                            <Button type="button" variant="outline" size="sm" className="h-8 text-[11px] font-bold uppercase" onClick={() => void copyValue("SĐT", supplierData.phone)}>
                                <Copy size={13} className="mr-1.5" /> SĐT
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="md:ml-auto">
                    <Button type="submit" disabled={isSaving} className="h-9 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 uppercase">
                        <Save size={14} className="mr-1.5" />
                        {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
                <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sản phẩm trong catalog</p>
                    <p className="mt-2 text-[22px] font-black text-slate-800">{catalogSummary.total}</p>
                </div>
                <div className="rounded-[4px] border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Có cung cấp</p>
                    <p className="mt-2 text-[22px] font-black text-emerald-700">{catalogSummary.available}</p>
                </div>
                <div className="rounded-[4px] border border-rose-100 bg-rose-50 p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-rose-700">Không cung cấp</p>
                    <p className="mt-2 text-[22px] font-black text-rose-700">{catalogSummary.unavailable}</p>
                </div>
                <div className="rounded-[4px] border border-amber-100 bg-amber-50 p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Đang kiểm tra</p>
                    <p className="mt-2 text-[22px] font-black text-amber-700">{catalogSummary.checking}</p>
                </div>
                <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tổng phiếu nhập</p>
                    <p className="mt-2 text-[22px] font-black text-slate-800">{importHistory.length}</p>
                </div>
                <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Lần nhập gần nhất</p>
                    <p className="mt-2 text-[12px] font-black text-slate-700">{formatDate(latestImport?.createdAt)}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{latestImport?.code || "Chưa phát sinh"}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-4">
                    <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border-2 border-emerald-100 shrink-0">
                                    <Warehouse size={30} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[15px] font-black text-slate-800 uppercase leading-tight line-clamp-2">{supplierData.name || "---"}</p>
                                    <p className="text-[11px] text-slate-500 font-mono mt-2">{supplierRecord?.code || `#${supplierId}`}</p>
                                    <p className="text-[10px] text-slate-400 font-mono mt-1">MST: {supplierData.taxCode || "---"}</p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 p-4">
                            <div className="rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-3">
                                <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wide">Ngày tạo</p>
                                <p className="text-[11px] font-bold text-slate-700 mt-1">{formatDate(supplierRecord?.createdAt)}</p>
                            </div>
                            <div className="rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-3">
                                <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wide">Cập nhật</p>
                                <p className="text-[11px] font-bold text-slate-700 mt-1">{formatDate(supplierRecord?.updatedAt)}</p>
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
                        <div className="space-y-4 p-4">
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
                                        <div className="mt-1 flex items-center gap-2">
                                            <p className="text-[12px] font-bold text-slate-700">{supplierData.phone || "---"}</p>
                                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-emerald-600" onClick={() => void copyValue("SĐT", supplierData.phone)}>
                                                <Copy size={12} />
                                            </Button>
                                        </div>
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
                                            <Textarea {...register("addressDetail")} className="mt-1 text-[12px] min-h-[80px]" />
                                            {errors.addressDetail && <p className="text-[10px] text-red-500 mt-1">{errors.addressDetail.message}</p>}
                                        </>
                                    ) : (
                                        <p className="text-[12px] text-slate-700 mt-1 leading-relaxed">{supplierData.addressDetail || "---"}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm p-4">
                        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-700 border-b border-slate-100 pb-3">
                            <ShieldCheck size={14} className="text-emerald-600" /> Audit supplier
                        </div>
                        <div className="mt-4 space-y-3 text-[12px] text-slate-600">
                            <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                                <p className="text-[10px] font-bold uppercase text-slate-400">Tạo bởi</p>
                                <p className="mt-1 font-semibold text-slate-700">{supplierRecord?.createdByName || "Chưa rõ"}</p>
                            </div>
                            <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                                <p className="text-[10px] font-bold uppercase text-slate-400">Cập nhật gần nhất</p>
                                <p className="mt-1 font-semibold text-slate-700">{supplierRecord?.updatedByName || "Chưa rõ"}</p>
                                <p className="mt-1 text-[10px] text-slate-400">{formatDate(supplierRecord?.updatedAt)}</p>
                            </div>
                        </div>
                    </div>

                    {supplierWarnings.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-[4px] shadow-sm p-4 space-y-3">
                            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-amber-800">
                                <AlertTriangle size={14} /> Cảnh báo dữ liệu supplier
                            </div>
                            <div className="space-y-2">
                                {supplierWarnings.map((warning) => (
                                    <div key={warning.code} className="rounded border border-amber-200 bg-white/70 px-3 py-2 text-[12px] text-amber-900">
                                        {warning.message}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-8">
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="bg-white border border-[#dcdcdc] rounded-[4px] p-1 w-full flex justify-start gap-1 h-auto shadow-sm">
                            <TabsTrigger value="info" className="text-[11px] font-bold uppercase py-2 px-4 rounded-[3px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                                <Info size={14} className="mr-1.5" /> Thông tin
                            </TabsTrigger>
                            <TabsTrigger value="catalog" className="text-[11px] font-bold uppercase py-2 px-4 rounded-[3px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                                <Warehouse size={14} className="mr-1.5" /> Catalog ({catalogSummary.total})
                            </TabsTrigger>
                            <TabsTrigger value="history" className="text-[11px] font-bold uppercase py-2 px-4 rounded-[3px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                                <History size={14} className="mr-1.5" /> Lịch sử ({filteredHistory.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="info" className="space-y-4 mt-4">
                            <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm p-5">
                                <Label className="text-[11px] font-black text-slate-700 uppercase block mb-4 tracking-widest border-b pb-3">Trạng thái vận hành</Label>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase border px-2 py-1 rounded bg-slate-50 text-slate-700 border-slate-200">
                                            <CalendarClock size={12} /> Cập nhật: {formatDate(supplierRecord?.updatedAt || supplierRecord?.createdAt)}
                                        </span>
                                    </div>
                                    <div>
                                        <Label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Trạng thái NCC</Label>
                                        <Controller
                                            name="status"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    onValueChange={(value) => {
                                                        if (value === "inactive" && field.value === "active") {
                                                            setPendingStatusValue("inactive");
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
                                    <div>
                                        <Label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Mã tỉnh / thành</Label>
                                        <Input {...register("provinceId")} className="h-[38px] text-[12px] font-semibold" />
                                        {errors.provinceId && <p className="text-[10px] text-red-500 mt-1">{errors.provinceId.message}</p>}
                                    </div>
                                    <div className="rounded border border-slate-200 bg-slate-50 px-4 py-3">
                                        <p className="text-[10px] font-bold uppercase text-slate-400">Độ sẵn sàng catalog</p>
                                        <p className="mt-2 text-[14px] font-black text-slate-800">{catalogSummary.total > 0 ? "Đã khai báo" : "Chưa khai báo"}</p>
                                        <p className="mt-1 text-[11px] text-slate-500">Theo số sản phẩm đã lưu trong catalog supplier</p>
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
                                                onClick={() => void saveCatalog()}
                                                disabled={isCatalogSaving || Boolean(catalogLoadError)}
                                            >
                                                <Save size={14} className="mr-1.5" />
                                                {isCatalogSaving ? "Đang lưu..." : "Lưu catalog"}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                                            <p className="text-[10px] font-bold uppercase text-slate-600">Đã khai báo</p>
                                            <p className="text-[16px] font-black text-slate-800">{catalogSummary.total}</p>
                                        </div>
                                        <div className="rounded border border-emerald-100 bg-emerald-50 px-3 py-2">
                                            <p className="text-[10px] font-bold uppercase text-emerald-700">Có cung cấp</p>
                                            <p className="text-[16px] font-black text-emerald-700">{catalogSummary.available}</p>
                                        </div>
                                        <div className="rounded border border-rose-100 bg-rose-50 px-3 py-2">
                                            <p className="text-[10px] font-bold uppercase text-rose-700">Không cung cấp</p>
                                            <p className="text-[16px] font-black text-rose-700">{catalogSummary.unavailable}</p>
                                        </div>
                                        <div className="rounded border border-amber-100 bg-amber-50 px-3 py-2">
                                            <p className="text-[10px] font-bold uppercase text-amber-700">Đang kiểm tra</p>
                                            <p className="text-[16px] font-black text-amber-700">{catalogSummary.checking}</p>
                                        </div>
                                    </div>

                                    {checkingTooLongItems.length > 0 && (
                                        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-3 text-[12px] text-amber-900">
                                            {checkingTooLongItems.length} sản phẩm ở trạng thái CHECKING đã quá {STALE_CHECKING_DAYS} ngày. Nên rà soát lại nguồn cung hoặc cập nhật ghi chú kiểm tra.
                                        </div>
                                    )}

                                    {catalogLoadError && (
                                        <div className="rounded border border-rose-200 bg-rose-50 px-3 py-3 text-[12px] text-rose-800">
                                            {catalogLoadError} Tạm thời khóa chỉnh sửa catalog để tránh ghi đè sai dữ liệu.
                                        </div>
                                    )}

                                    {productLoadError && !catalogLoadError && (
                                        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-3 text-[12px] text-amber-900">
                                            {productLoadError}
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
                                        <div className="relative flex-1">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                value={catalogKeyword}
                                                onChange={(e) => setCatalogKeyword(e.target.value)}
                                                placeholder="Tìm theo tên sản phẩm, thương hiệu, xuất xứ, danh mục..."
                                                className="h-[34px] pl-9 text-[12px]"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:w-auto">
                                            <Select value={catalogFilter} onValueChange={(value) => setCatalogFilter(value as CatalogFilterValue)}>
                                                <SelectTrigger className="h-[34px] text-[11px] font-bold">
                                                    <SelectValue placeholder="Lọc catalog" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ALL">Tất cả sản phẩm</SelectItem>
                                                    <SelectItem value="TRACKED">Đã có trong catalog</SelectItem>
                                                    <SelectItem value="NOT_IN_CATALOG">Chưa đưa vào catalog</SelectItem>
                                                    <SelectItem value="AVAILABLE">Có cung cấp</SelectItem>
                                                    <SelectItem value="UNAVAILABLE">Không cung cấp</SelectItem>
                                                    <SelectItem value="CHECKING">Đang kiểm tra</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Select
                                                value={bulkCatalogStatus}
                                                onValueChange={(value) => setBulkCatalogStatus(value as SupplierProductCatalogStatus | "none")}
                                            >
                                                <SelectTrigger className="h-[34px] text-[11px] font-bold">
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
                                                disabled={Boolean(catalogLoadError)}
                                            >
                                                Áp dụng ({selectedCatalogProductIds.length})
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-0 overflow-x-auto">
                                    <Table className="table-custom border-collapse table-fixed min-w-[1180px]">
                                        <colgroup>
                                            <col className="w-[56px]" />
                                            <col className="w-[340px]" />
                                            <col className="w-[220px]" />
                                            <col className="w-[210px]" />
                                            <col />
                                        </colgroup>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50 border-b border-slate-100">
                                                <TableHead className="py-3 pl-4">
                                                    <Checkbox
                                                        checked={allFilteredSelected ? true : someFilteredSelected ? "indeterminate" : false}
                                                        onCheckedChange={(checked) => toggleSelectAllCatalog(checked === true)}
                                                        disabled={Boolean(catalogLoadError)}
                                                    />
                                                </TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-3">Sản phẩm</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-3">Thương hiệu / Xuất xứ</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-3">Trạng thái NCC</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-3 pr-4">Ghi chú & audit</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedCatalogProducts.length > 0 ? (
                                                paginatedCatalogProducts.map((product) => {
                                                    const current = catalogByProductId.get(product.id);
                                                    const status = current?.status || "CHECKING";
                                                    const previewImage = product.imageUrls?.[0] || product.variants?.find((variant) => variant.imageUrl)?.imageUrl;
                                                    const isTracked = Boolean(current);
                                                    const isSelected = selectedCatalogProductIds.includes(product.id);
                                                    const checkingAgeDays = current ? getCheckingAgeDays(current) : null;

                                                    return (
                                                        <TableRow key={product.id} className="border-b border-slate-50 hover:bg-emerald-50/20 align-top">
                                                            <TableCell className="pl-4 py-4">
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    onCheckedChange={(checked) => toggleCatalogSelection(product.id, checked === true)}
                                                                    disabled={Boolean(catalogLoadError)}
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
                                                                                onError={(event) => {
                                                                                    event.currentTarget.style.display = "none";
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
                                                                        <span className={cn(
                                                                            "mt-2 inline-flex items-center rounded border px-2 py-0.5 text-[9px] font-black uppercase",
                                                                            isTracked ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-50 text-slate-500 border-slate-200",
                                                                        )}>
                                                                            {isTracked ? "Đã vào catalog" : "Chưa đưa vào catalog"}
                                                                        </span>
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
                                                                    disabled={Boolean(catalogLoadError)}
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
                                                                <span className={cn("mt-2 inline-flex items-center rounded border px-2 py-0.5 text-[9px] font-black uppercase", catalogStatusStyles[status])}>
                                                                    {catalogStatusLabels[status]}
                                                                </span>
                                                                {checkingAgeDays != null && status === "CHECKING" && (
                                                                    <p className={cn("mt-2 text-[10px] font-medium", checkingAgeDays >= STALE_CHECKING_DAYS ? "text-amber-700" : "text-slate-500")}>
                                                                        Đã kiểm tra {checkingAgeDays} ngày
                                                                    </p>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="py-3 pr-4">
                                                                <Textarea
                                                                    value={current?.note || ""}
                                                                    onChange={(e) => updateCatalogItem(product.id, { note: e.target.value })}
                                                                    placeholder="Ghi chú ngắn: điều kiện giao, đang xác minh, ưu tiên thương hiệu..."
                                                                    className="min-h-[72px] text-[11px]"
                                                                    maxLength={255}
                                                                    disabled={Boolean(catalogLoadError)}
                                                                />
                                                                <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                                                                    <span>{(current?.note || "").length}/255 ký tự</span>
                                                                    {current?.updatedByName ? <span>Người sửa: {current.updatedByName}</span> : <span>Chưa có lịch sử sửa</span>}
                                                                </div>
                                                                <p className="mt-1 text-[10px] text-slate-400">
                                                                    {current?.updatedAt ? `Cập nhật: ${formatDate(current.updatedAt)}` : "Chưa lưu thay đổi vào catalog"}
                                                                </p>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="py-12 text-center">
                                                        <div className="flex flex-col items-center gap-3 text-slate-400">
                                                            <PackageSearch size={28} />
                                                            <div>
                                                                <p className="text-[12px] font-black uppercase tracking-widest">
                                                                    {catalogLoadError ? "Không tải được catalog supplier" : "Không có sản phẩm phù hợp bộ lọc"}
                                                                </p>
                                                                <p className="mt-1 text-[11px]">
                                                                    {catalogLoadError
                                                                        ? "Tải lại trang hoặc kiểm tra API catalog trước khi chỉnh sửa."
                                                                        : "Thử đổi bộ lọc catalog hoặc tìm theo tên sản phẩm / thương hiệu."}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {filteredCatalogProducts.length > 0 && (
                                    <div className="px-4 py-3 border-t border-slate-100 bg-[#fcfcfc] flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
                                    {historyLoadError && (
                                        <div className="mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-3 text-[12px] text-amber-900">
                                            {historyLoadError}
                                        </div>
                                    )}
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
                                            <RefreshCcw size={13} className="mr-1.5" /> Đặt lại lọc
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                        <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-[34px] text-[12px]" />
                                        <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-[34px] text-[12px]" />
                                    </div>
                                </div>

                                <div className="p-0 overflow-x-auto">
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
                                                    const statusMeta = getHistoryStatusMeta(item.status);
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
                                                                        {item.itemCount || 0} mã hàng
                                                                    </span>
                                                                    <span className="text-[10px] font-semibold text-slate-400">
                                                                        {item.totalQuantity || 0} sản phẩm
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-[11px] text-slate-500 font-medium">{formatDate(item.createdAt)}</TableCell>
                                                            <TableCell>
                                                                <span className={cn("text-[9px] font-bold border px-1.5 py-0.5 rounded uppercase", statusMeta.className)}>
                                                                    {statusMeta.label}
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
                                                    <TableCell colSpan={4} className="text-center py-10 text-[12px] text-slate-400 font-bold uppercase tracking-widest">
                                                        Không có phiếu nhập phù hợp bộ lọc
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {filteredHistory.length > 0 && (
                                    <div className="px-4 py-3 border-t border-slate-100 bg-[#fcfcfc] flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
                            Bạn có chắc muốn chuyển supplier sang trạng thái "Tạm ngừng"? Thao tác này chỉ ảnh hưởng hồ sơ supplier, không thay đổi logic nhập kho, FIFO hay giá vốn.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="h-9 text-[11px] font-bold uppercase">Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (pendingStatusValue) {
                                    reset({ ...supplierData, status: pendingStatusValue });
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
                            Bạn có thay đổi trạng thái hoặc ghi chú catalog nhưng chưa lưu. Chọn cách xử lý trước khi rời tab hoặc rời trang.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="h-9 text-[11px] font-bold uppercase">Ở lại chỉnh sửa</AlertDialogCancel>
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
