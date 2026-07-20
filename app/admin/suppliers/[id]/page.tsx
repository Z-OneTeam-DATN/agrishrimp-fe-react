"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowUpRight,
    Copy,
    ImageOff,
    PackageSearch,
    RefreshCcw,
    Save,
    Search,
} from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { SharedDatePicker } from "@/components/admin/shared/BirthDatePicker";
import { SupplierSchema, SupplierFormValues } from "@/app/types/admin.schema";
import {
    Supplier,
    SupplierProductCatalogItem,
    SupplierProductCatalogStatus,
} from "@/app/types/supplier.type";
import { ProductListItem } from "@/app/types/product.schema";
import { ProductService } from "@/app/services/product.service";
import { supplierService } from "@/app/services/supplier.service";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ImportHistoryItem {
    id: number;
    code: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    itemCount?: number;
    totalQuantity?: number;
}

interface Province {
    id: string;
    name: string;
    full_name: string;
}

type TabValue = "info" | "catalog" | "history";
type CatalogFilterValue = "ALL" | SupplierProductCatalogStatus;

const CATALOG_PAGE_SIZE = 20;
const HISTORY_PAGE_SIZE = 20;
const STALE_CHECKING_DAYS = 14;

interface FlatVariantCatalogItem {
    id: number;
    productVariantId: number;
    sku: string;
    productName: string;
    productId: number;
    brandName?: string;
    origin?: string;
    categoryName?: string;
    imageUrl?: string;
    status?: SupplierProductCatalogStatus;
    note?: string;
    updatedAt?: string;
    statusChangedAt?: string;
    updatedByName?: string;
    version?: number;
}

const buildCatalogPayload = (items: SupplierProductCatalogItem[], flatItems: FlatVariantCatalogItem[]) => {
    const payload: { productVariantId: number; status?: SupplierProductCatalogStatus; note?: string; version?: number; isDeleted?: boolean }[] = [];

    flatItems.forEach((flatItem) => {
        const currentInState = items.find((c) => c.productVariantId === flatItem.productVariantId);
        const status = currentInState?.status;
        const note = currentInState?.note;

        if (status) {
            payload.push({
                productVariantId: flatItem.productVariantId,
                status: status,
                note: note?.trim() || undefined,
                version: flatItem.version || undefined,
                isDeleted: false,
            });
        } else if (flatItem.id > 0) {
            payload.push({
                productVariantId: flatItem.productVariantId,
                version: flatItem.version,
                isDeleted: true,
            });
        }
    });

    return payload.sort((a, b) => a.productVariantId - b.productVariantId);
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

const formatDate = (dateString?: string) => {
    if (!dateString) return "---";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "---";
    return `${date.toLocaleDateString("vi-VN")} ${date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
};

const getHistoryStatusLabel = (status: string) => {
    switch (status) {
        case "COMPLETED":
            return "Đã hoàn thành";
        case "APPROVED":
            return "Đã duyệt";
        case "PENDING":
            return "Đang xử lý";
        case "CANCELLED":
            return "Đã hủy";
        default:
            return status || "Không xác định";
    }
};

const getCheckingAgeDays = (item: { status?: SupplierProductCatalogStatus; statusChangedAt?: string; checkingAgeDays?: number }) => {
    if (!item.status || item.status !== "CHECKING") {
        return null;
    }
    if (typeof item.checkingAgeDays === "number") {
        return item.checkingAgeDays;
    }
    if (!item.statusChangedAt) {
        return null;
    }
    const diff = Date.now() - new Date(item.statusChangedAt).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

const formatDateForInput = (dateStr?: string | null): string => {
    if (!dateStr) return "";
    const cleaned = dateStr.trim();
    if (!cleaned) return "";

    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
        return cleaned;
    }
    if (/^\d{4}-\d{2}-\d{2}T/.test(cleaned)) {
        return cleaned.substring(0, 10);
    }
    const slashMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (slashMatch) {
        const day = slashMatch[1].padStart(2, "0");
        const month = slashMatch[2].padStart(2, "0");
        const year = slashMatch[3];
        return `${year}-${month}-${day}`;
    }

    try {
        const d = new Date(cleaned);
        if (!Number.isNaN(d.getTime())) {
            return d.toISOString().substring(0, 10);
        }
    } catch {
        // ignore
    }
    return "";
};

const normalizePhone = (raw?: string | null): string => {
    if (!raw) return "";
    const trimmed = raw.trim();
    if (!trimmed) return "";
    const digits = trimmed.replace(/[^0-9]/g, "");
    if (!digits) return trimmed;
    const local = digits.startsWith("84") ? "0" + digits.slice(2) : digits;
    // Số di động VN: 10 chữ số 03/05/07/08/09 → chuẩn hoá
    if (/^(0)(3|5|7|8|9)[0-9]{8}$/.test(local)) return local;
    // Số bàn hoặc khác → giữ nguyên raw (ví dụ: "02703 962736-2")
    return trimmed;
};

export default function SupplierDetailPage() {
    const router = useRouter();
    const params = useParams();
    const supplierId = Number(params.id);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isCatalogSaving, setIsCatalogSaving] = useState(false);
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
    const [provinces, setProvinces] = useState<Province[]>([]);

    const {
        control,
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<SupplierFormValues>({
        resolver: zodResolver(SupplierSchema),
        mode: "onChange",
    });

    const supplierData = watch();

    useEffect(() => {
        const loadProvinces = async () => {
            try {
                const response = await fetch("https://esgoo.net/api-tinhthanh/1/0.htm");
                const data = await response.json();
                if (data.error === 0 && Array.isArray(data.data)) {
                    setProvinces(data.data);
                }
            } catch {
                toast.error("Không thể tải danh sách tỉnh/thành phố");
            }
        };

        void loadProvinces();
    }, []);

    const loadSupplierData = useCallback(async () => {
        if (!supplierId) return;

        try {
            setHistoryLoadError(null);
            setCatalogLoadError(null);

            const supplierInfo = await supplierService.getById(supplierId);

            setSupplierRecord(supplierInfo);
            reset({
                ...supplierInfo,
                status: supplierInfo.status?.toLowerCase() as SupplierFormValues["status"],
                issueDate: formatDateForInput(supplierInfo.issueDate),
                taxAuthority: supplierInfo.taxAuthority || "",
                mainBusinessSector: supplierInfo.mainBusinessSector || "",
            });


            const [historyResult, catalogResult, productsResult] = await Promise.allSettled([
                supplierService.getImportHistory(supplierId),
                supplierService.getProductCatalog(supplierId),
                ProductService.getAll({ status: "ACTIVE" }),
            ]);

            if (historyResult.status === "fulfilled") {
                setImportHistory(Array.isArray(historyResult.value) ? historyResult.value : []);
            } else {
                setImportHistory([]);
                setHistoryLoadError("Không tải được lịch sử nhập của nhà cung cấp.");
                toast.warning("Không tải được lịch sử nhập của nhà cung cấp");
            }

            if (catalogResult.status === "fulfilled") {
                const items = Array.isArray(catalogResult.value) ? catalogResult.value : [];
                setCatalogItems(items);
                setSavedCatalogItems(items);
            } else {
                setCatalogItems([]);
                setSavedCatalogItems([]);
                setCatalogLoadError("Không tải được catalog hiện tại của nhà cung cấp.");
                toast.warning("Không tải được catalog hiện tại của nhà cung cấp");
            }

            if (productsResult.status === "fulfilled") {
                setCatalogProducts(Array.isArray(productsResult.value) ? productsResult.value : []);
            } else {
                setCatalogProducts([]);
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

    const detectProvince = (fullAddress: string) => {
        if (!fullAddress || provinces.length === 0) return "";
        const addressLower = fullAddress.toLowerCase();
        const foundProvince = provinces.find((p) => {
            const cleanName = p.name.toLowerCase().replace("tỉnh ", "").replace("thành phố ", "");
            return addressLower.includes(cleanName);
        });
        return foundProvince ? foundProvince.id : "";
    };

    const watchedAddressDetail = supplierData.addressDetail || "";
    useEffect(() => {
        if (watchedAddressDetail) {
            const detectedId = detectProvince(watchedAddressDetail);
            if (detectedId) {
                setValue("provinceId", detectedId, { shouldValidate: true });
            }
        }
    }, [watchedAddressDetail, provinces, setValue]);

    const handleLookupTaxCode = async () => {
        const taxCode = watch("taxCode");
        if (!taxCode) { toast.error("Vui lòng nhập MST"); return; }
        const loadingToast = toast.loading("Đang tra cứu từ tổng cục thuế...");

        // Clear các dữ liệu cũ trước khi bắt đầu tra cứu
        setValue("name", "", { shouldValidate: false });
        setValue("addressDetail", "", { shouldValidate: false });
        setValue("provinceId", "", { shouldValidate: false });
        setValue("contactName", "", { shouldValidate: false });
        setValue("phone", "", { shouldValidate: false });
        setValue("email", "", { shouldValidate: false });
        setValue("issueDate", "", { shouldValidate: false });
        setValue("taxAuthority", "", { shouldValidate: false });
        setValue("mainBusinessSector", "", { shouldValidate: false });

        try {
            const businessInfo = await supplierService.lookupTaxCode(taxCode);
            if (businessInfo) {
                if (businessInfo.name) setValue("name", businessInfo.name, { shouldValidate: true });
                if (businessInfo.address) {
                    setValue("addressDetail", businessInfo.address, { shouldValidate: true });
                    const detectedId = detectProvince(businessInfo.address);
                    if (detectedId) setValue("provinceId", detectedId, { shouldValidate: true });
                }
                if (businessInfo.owner) setValue("contactName", businessInfo.owner, { shouldValidate: true });
                const normalizedPhone = normalizePhone(businessInfo.phone);
                if (normalizedPhone) setValue("phone", normalizedPhone, { shouldValidate: true });
                if (businessInfo.email) setValue("email", businessInfo.email, { shouldValidate: true });
                if (businessInfo.issueDate) {
                    const formatted = formatDateForInput(businessInfo.issueDate);
                    if (formatted) setValue("issueDate", formatted, { shouldValidate: true });
                }
                if (businessInfo.taxAuthority) {
                    setValue("taxAuthority", businessInfo.taxAuthority, { shouldValidate: true });
                }
                if (businessInfo.mainBusinessSector) {
                    setValue("mainBusinessSector", businessInfo.mainBusinessSector, { shouldValidate: true });
                }
                const missingFields: string[] = [];
                const statuses = businessInfo.fieldStatuses as Record<string, string> | undefined;
                if (statuses) {
                    if (statuses.name !== "FOUND") missingFields.push("Tên công ty");
                    if (statuses.owner !== "FOUND") missingFields.push("Người đại diện");
                    if (statuses.phone !== "FOUND") missingFields.push("SĐT");
                    if (statuses.issueDate !== "FOUND") missingFields.push("Ngày thành lập");
                    if (statuses.mainBusinessSector !== "FOUND") missingFields.push("Ngành nghề");
                }
                if (missingFields.length > 0) {
                    toast.warning(`Tra cứu thành công. Một số thông tin chưa tìm được: ${missingFields.join(", ")}`);
                } else {
                    toast.success("Đã điền đầy đủ thông tin từ tra cứu MST!");
                }
            } else {
                toast.error("Không tìm thấy doanh nghiệp với MST này.");
            }
        } catch {
            toast.error("Không tìm thấy thông tin hoặc API lỗi.");
        } finally {
            toast.dismiss(loadingToast);
        }
    };


    const flatCatalogItems = useMemo(() => {
        const list: FlatVariantCatalogItem[] = [];

        // 1. Lấy toàn bộ sản phẩm hoạt động để có thể liên kết vào catalog của NCC này
        const supplierProducts = catalogProducts;

        // Theo dõi các biến thể đã được thêm vào danh sách để tránh trùng lặp
        const addedVariantIds = new Set<number>();

        if (supplierProducts.length > 0) {
            supplierProducts.forEach((product) => {
                if (product.variants && product.variants.length > 0) {
                    product.variants.forEach((variant) => {
                        if (variant.id == null) return;
                        const catalogRecord = catalogItems.find(
                            (c) => c.productVariantId === variant.id
                        );
                        list.push({
                            id: catalogRecord?.id || 0,
                            productVariantId: variant.id,
                            sku: variant.sku || `SKU-${variant.id}`,
                            productName: product.name,
                            productId: product.id,
                            brandName: product.brandName || "",
                            origin: "",
                            categoryName: product.categoryName,
                            imageUrl: variant.imageUrl || product.imageUrls?.[0],
                            status: catalogRecord?.status,
                            note: catalogRecord?.note || "",
                            updatedAt: catalogRecord?.updatedAt,
                            statusChangedAt: catalogRecord?.statusChangedAt,
                            updatedByName: catalogRecord?.updatedByName,
                            version: catalogRecord?.version,
                        });
                        addedVariantIds.add(variant.id);
                    });
                }
            });
        }

        // 2. Thêm các biến thể đã cấu hình trong catalogItems mà chưa được thêm ở trên (nếu có trường hợp đặc biệt)
        catalogItems.forEach((c) => {
            if (addedVariantIds.has(c.productVariantId)) return;

            let matchedImg: string | undefined = undefined;
            let pName = c.productName;
            let pId = c.productId;
            let cName = c.categoryName;
            let bName = c.brandName;

            const matchedProduct = catalogProducts.find((p) =>
                p.variants?.some((v) => v.id === c.productVariantId)
            );
            if (matchedProduct) {
                const matchedVariant = matchedProduct.variants?.find((v) => v.id === c.productVariantId);
                matchedImg = matchedVariant?.imageUrl || matchedProduct.imageUrls?.[0];
                pName = matchedProduct.name;
                pId = matchedProduct.id;
                cName = matchedProduct.categoryName;
                bName = matchedProduct.brandName;
            }

            list.push({
                id: c.id,
                productVariantId: c.productVariantId,
                sku: c.sku || `SKU-${c.productVariantId}`,
                productName: pName,
                productId: pId,
                brandName: bName || supplierRecord?.name || "",
                origin: c.origin || "",
                categoryName: cName,
                imageUrl: matchedImg,
                status: c.status,
                note: c.note || "",
                updatedAt: c.updatedAt,
                statusChangedAt: c.statusChangedAt,
                updatedByName: c.updatedByName,
                version: c.version,
            });
            addedVariantIds.add(c.productVariantId);
        });

        return list;
    }, [catalogItems, catalogProducts, supplierId, supplierRecord]);

    const catalogPayload = useMemo(() => buildCatalogPayload(catalogItems, flatCatalogItems), [catalogItems, flatCatalogItems]);
    const savedCatalogPayload = useMemo(() => buildCatalogPayload(savedCatalogItems, flatCatalogItems), [savedCatalogItems, flatCatalogItems]);

    const hasCatalogDraft = JSON.stringify(catalogPayload) !== JSON.stringify(savedCatalogPayload);

    const catalogSummary = useMemo(() => {
        return flatCatalogItems.reduce(
            (acc, item) => {
                acc.total += 1;
                if (item.status === "AVAILABLE") acc.available += 1;
                if (item.status === "UNAVAILABLE") acc.unavailable += 1;
                if (item.status === "CHECKING") acc.checking += 1;
                return acc;
            },
            { total: 0, available: 0, unavailable: 0, checking: 0 },
        );
    }, [flatCatalogItems]);

    const checkingTooLongItems = useMemo(() => {
        return flatCatalogItems.filter((item) => {
            if (!item.status || item.status !== "CHECKING") return false;
            const age = getCheckingAgeDays(item);
            return age != null && age >= STALE_CHECKING_DAYS;
        });
    }, [flatCatalogItems]);

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

    const historySummary = useMemo(() => {
        return importHistory.reduce(
            (summary, item) => {
                const isCancelled = item.status === "CANCELLED";
                summary.totalReceipts += 1;
                if (!isCancelled) {
                    summary.totalValue += Number(item.totalAmount) || 0;
                    summary.totalQuantity += Number(item.totalQuantity) || 0;
                }
                if (item.status === "COMPLETED") {
                    summary.completedReceipts += 1;
                }
                return summary;
            },
            {
                totalReceipts: 0,
                totalValue: 0,
                totalQuantity: 0,
                completedReceipts: 0,
            },
        );
    }, [importHistory]);

    const filteredCatalogItems = useMemo(() => {
        const normalizedKeyword = catalogKeyword.trim().toLowerCase();

        return flatCatalogItems.filter((item) => {
            const keywordOk =
                !normalizedKeyword ||
                item.productName?.toLowerCase().includes(normalizedKeyword) ||
                item.sku?.toLowerCase().includes(normalizedKeyword) ||
                item.brandName?.toLowerCase().includes(normalizedKeyword) ||
                item.origin?.toLowerCase().includes(normalizedKeyword) ||
                item.categoryName?.toLowerCase().includes(normalizedKeyword);

            const filterOk =
                catalogFilter === "ALL" ||
                item.status === catalogFilter;

            return keywordOk && filterOk;
        });
    }, [flatCatalogItems, catalogKeyword, catalogFilter]);

    const paginatedCatalogItems = useMemo(() => {
        const startIndex = (catalogCurrentPage - 1) * CATALOG_PAGE_SIZE;
        return filteredCatalogItems.slice(startIndex, startIndex + CATALOG_PAGE_SIZE);
    }, [filteredCatalogItems, catalogCurrentPage]);

    const paginatedHistory = useMemo(() => {
        const startIndex = (historyCurrentPage - 1) * HISTORY_PAGE_SIZE;
        return filteredHistory.slice(startIndex, startIndex + HISTORY_PAGE_SIZE);
    }, [filteredHistory, historyCurrentPage]);

    const catalogTotalPages = Math.max(1, Math.ceil(filteredCatalogItems.length / CATALOG_PAGE_SIZE));
    const historyTotalPages = Math.max(1, Math.ceil(filteredHistory.length / HISTORY_PAGE_SIZE));
    const filteredCatalogProductVariantIds = filteredCatalogItems.map((item) => item.productVariantId);
    const allFilteredSelected =
        filteredCatalogProductVariantIds.length > 0 &&
        filteredCatalogProductVariantIds.every((id) => selectedCatalogProductIds.includes(id));
    const someFilteredSelected =
        filteredCatalogProductVariantIds.some((id) => selectedCatalogProductIds.includes(id)) && !allFilteredSelected;

    useEffect(() => {
        setSelectedCatalogProductIds((prev) =>
            prev.filter((id) => flatCatalogItems.some((item) => item.productVariantId === id)),
        );
    }, [flatCatalogItems]);

    useEffect(() => {
        setCatalogCurrentPage(1);
    }, [catalogKeyword, catalogFilter]);

    useEffect(() => {
        setHistoryCurrentPage(1);
    }, [historyKeyword, historyStatus, fromDate, toDate]);


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

    const updateCatalogItem = (productVariantId: number, patch: Partial<Pick<SupplierProductCatalogItem, "status" | "note">>) => {
        setCatalogItems((prev) => {
            const existingIndex = prev.findIndex((item) => item.productVariantId === productVariantId);
            if (existingIndex >= 0) {
                const updated = [...prev];
                const oldItem = updated[existingIndex];
                updated[existingIndex] = {
                    ...oldItem,
                    ...patch,
                    status: ("status" in patch ? patch.status : oldItem.status) as SupplierProductCatalogStatus,
                    note: "note" in patch ? (patch.note ?? "") : (oldItem.note ?? ""),
                };
                return updated;
            }

            const flatItem = flatCatalogItems.find((item) => item.productVariantId === productVariantId);
            if (!flatItem) return prev;

            return [
                ...prev,
                {
                    id: 0,
                    supplierId,
                    supplierCode: supplierRecord?.code || "",
                    productVariantId,
                    sku: flatItem.sku,
                    productId: flatItem.productId,
                    productName: flatItem.productName,
                    productSlug: "",
                    brandName: flatItem.brandName,
                    origin: flatItem.origin,
                    categoryName: flatItem.categoryName,
                    status: patch.status || "CHECKING",
                    note: patch.note || "",
                    version: 0,
                } as SupplierProductCatalogItem,
            ];
        });
    };

    const toggleCatalogSelection = (productVariantId: number, checked: boolean) => {
        setSelectedCatalogProductIds((prev) => {
            if (checked) {
                return prev.includes(productVariantId) ? prev : [...prev, productVariantId];
            }
            return prev.filter((id) => id !== productVariantId);
        });
    };

    const toggleSelectAllCatalog = (checked: boolean) => {
        if (checked) {
            setSelectedCatalogProductIds((prev) => Array.from(new Set([...prev, ...filteredCatalogProductVariantIds])));
            return;
        }
        setSelectedCatalogProductIds((prev) => prev.filter((id) => !filteredCatalogProductVariantIds.includes(id)));
    };

    const applyBulkCatalogStatus = () => {
        if (bulkCatalogStatus === "none" || selectedCatalogProductIds.length === 0) {
            toast.warning("Vui lòng chọn sản phẩm và trạng thái cần áp dụng");
            return;
        }

        setCatalogItems((prev) => {
            const next = [...prev];

            selectedCatalogProductIds.forEach((productVariantId) => {
                const existingIndex = next.findIndex((item) => item.productVariantId === productVariantId);
                if (existingIndex >= 0) {
                    next[existingIndex] = { ...next[existingIndex], status: bulkCatalogStatus };
                    return;
                }

                const flatItem = flatCatalogItems.find((item) => item.productVariantId === productVariantId);
                if (!flatItem) return;

                next.push({
                    id: 0,
                    supplierId,
                    supplierCode: supplierRecord?.code || "",
                    productVariantId,
                    sku: flatItem.sku,
                    productId: flatItem.productId,
                    productName: flatItem.productName,
                    productSlug: "",
                    brandName: flatItem.brandName,
                    origin: flatItem.origin,
                    categoryName: flatItem.categoryName,
                    status: bulkCatalogStatus,
                    note: "",
                    version: 0,
                });
            });

            return next;
        });

        toast.success(`Đã cập nhật trạng thái cho ${selectedCatalogProductIds.length} biến thể sản phẩm`);
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
    };

    const copyValue = async (label: string, value?: string) => {
        const normalizedValue = value?.trim();
        if (!normalizedValue) {
            toast.warning(`${label} chưa có dữ liệu`);
            return;
        }

        try {
            await navigator.clipboard.writeText(normalizedValue);
            toast.success(`Đã sao chép ${label.toLowerCase()}`);
        } catch {
            toast.error(`Không thể sao chép ${label.toLowerCase()}`);
        }
    };

    const copyButton = (label: string, value?: string, multiline = false) => (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Sao chép ${label.toLowerCase()}`}
                    onClick={() => void copyValue(label, value)}
                    className={cn(
                        "absolute right-1.5 z-10 h-7 w-7 text-slate-400 hover:bg-slate-100 hover:text-blue-600",
                        multiline ? "top-1.5" : "top-1/2 -translate-y-1/2",
                    )}
                >
                    <Copy size={14} />
                </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Sao chép {label.toLowerCase()}</TooltipContent>
        </Tooltip>
    );

    if (isLoading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 text-sm text-gray-500">
                <div className="w-8 h-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                <p className="font-bold uppercase tracking-widest text-slate-400">Đang tải dữ liệu...</p>
            </div>
        );
    }

    return (
        <TooltipProvider delayDuration={150}>
        <form onSubmit={handleSubmit(onSave, onError)} className="space-y-5 pb-[104px] text-slate-800">
            <div className="px-1">
                <h1 className="text-[20px] font-semibold uppercase text-slate-900">Cập nhật nhà cung cấp</h1>
            </div>

            <div className="space-y-5 px-1">
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-slate-200 bg-transparent p-0">
                            <TabsTrigger value="info" className="rounded-none border-b-2 border-transparent px-0 py-3 text-[12px] font-medium text-slate-500 shadow-none data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-slate-900 data-[state=active]:shadow-none">
                                Thông tin
                            </TabsTrigger>
                            <TabsTrigger value="catalog" className="rounded-none border-b-2 border-transparent px-0 py-3 text-[12px] font-medium text-slate-500 shadow-none data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-slate-900 data-[state=active]:shadow-none">
                                Sản phẩm cung cấp ({catalogSummary.total})
                            </TabsTrigger>
                            <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent px-0 py-3 text-[12px] font-medium text-slate-500 shadow-none data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-slate-900 data-[state=active]:shadow-none">
                                Lịch sử nhập ({filteredHistory.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="info" className="mt-5">
                            <div className="border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="mb-6 border-b border-slate-200 pb-4">
                                    <h2 className="text-[12px] font-semibold text-slate-900">1. Thông tin nhà cung cấp</h2>
                                </div>
                                <div className="space-y-5">
                                    {/* Hàng 1 (3 cột: MST, Tên, Người đại diện) */}
                                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                                        <div>
                                            <Label className="mb-2 block text-[10.5px] font-semibold text-slate-500">Mã số thuế *</Label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Input {...register("taxCode")} className="h-[40px] pr-10 text-[13px]" />
                                                    {copyButton("Mã số thuế", supplierData.taxCode)}
                                                </div>
                                                <Button type="button" variant="outline" onClick={handleLookupTaxCode} className="h-[40px] shrink-0 rounded-md border-slate-200 bg-white px-3 text-[11px] font-medium text-blue-600 hover:bg-blue-50">
                                                    <Search size={14} className="mr-1" /> Tra cứu
                                                </Button>
                                            </div>
                                            {errors.taxCode && <p className="text-[10px] text-red-500 mt-1">{errors.taxCode.message}</p>}
                                        </div>
                                        <div>
                                            <Label className="mb-2 block text-[10.5px] font-semibold text-slate-500">Tên nhà cung cấp *</Label>
                                            <div className="relative">
                                                <Input {...register("name")} className="h-[40px] pr-10 text-[13px]" />
                                                {copyButton("Tên nhà cung cấp", supplierData.name)}
                                            </div>
                                            {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name.message}</p>}
                                        </div>
                                        <div>
                                            <Label className="mb-2 block text-[10.5px] font-semibold text-slate-500">Họ và tên người đại diện *</Label>
                                            <div className="relative">
                                                <Input {...register("contactName")} className="h-[40px] pr-10 text-[13px]" />
                                                {copyButton("Người đại diện", supplierData.contactName)}
                                            </div>
                                            {errors.contactName && <p className="mt-1 text-[10px] text-red-500">{errors.contactName.message}</p>}
                                        </div>
                                    </div>

                                    {/* Hàng 2 (3 cột: Trạng thái, Ngày cấp, SĐT) */}
                                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                                        <div>
                                            <Label className="mb-2 block text-[10.5px] font-semibold text-slate-500">Trạng thái vận hành</Label>
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
                                                        <SelectTrigger className="h-[40px] text-[13px] shadow-none">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="active">Đang giao dịch</SelectItem>
                                                            <SelectItem value="inactive">Tạm ngừng</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </div>
                                        <div>
                                            <Label className="mb-2 block text-[10.5px] font-semibold text-slate-500">Ngày cấp / Thành lập *</Label>
                                            <div className="relative">
                                                <Controller
                                                    name="issueDate"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <SharedDatePicker
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            hasError={!!errors.issueDate}
                                                            placeholder="Chọn ngày cấp / thành lập"
                                                            heading="Ngày cấp"
                                                            emptyStateLabel="Chưa chọn ngày cấp"
                                                            variant="compact"
                                                            fromDate={new Date("1900-01-01")}
                                                            toDate={new Date()}
                                                            disabledDate={(date) => date > new Date() || date < new Date("1900-01-01")}
                                                            buttonClassName={cn(
                                                                "w-full h-[40px] border-slate-200 pl-3 pr-9 text-[13px] bg-white hover:bg-slate-50",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        />
                                                    )}
                                                />
                                                {copyButton("Ngày cấp / Thành lập", supplierData.issueDate || "")}
                                            </div>
                                            {errors.issueDate && <p className="text-[10px] text-red-500 mt-1">{errors.issueDate.message}</p>}
                                        </div>
                                        <div>
                                            <Label className="mb-2 block text-[10.5px] font-semibold text-slate-500">SĐT di động *</Label>
                                            <div className="relative">
                                                <Input {...register("phone")} className="h-[40px] pr-10 text-[13px]" />
                                                {copyButton("Số điện thoại", supplierData.phone)}
                                            </div>
                                            {errors.phone && <p className="mt-1 text-[10px] text-red-500">{errors.phone.message}</p>}
                                        </div>
                                    </div>

                                    {/* Hàng 3 (3 cột) */}
                                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                                        <div>
                                            <Label className="mb-2 block text-[10.5px] font-semibold text-slate-500">Cơ quan thuế quản lý *</Label>
                                            <div className="relative">
                                                <Input {...register("taxAuthority")} className="h-[40px] pr-10 text-[13px]" />
                                                {copyButton("Cơ quan thuế quản lý", supplierData.taxAuthority || "")}
                                            </div>
                                            {errors.taxAuthority && <p className="text-[10px] text-red-500 mt-1">{errors.taxAuthority.message}</p>}
                                        </div>
                                        <div>
                                            <Label className="mb-2 block text-[10.5px] font-semibold text-slate-500">Ngành nghề kinh doanh chính *</Label>
                                            <div className="relative">
                                                <Input {...register("mainBusinessSector")} className="h-[40px] pr-10 text-[13px]" />
                                                {copyButton("Ngành nghề kinh doanh chính", supplierData.mainBusinessSector || "")}
                                            </div>
                                            {errors.mainBusinessSector && <p className="text-[10px] text-red-500 mt-1">{errors.mainBusinessSector.message}</p>}
                                        </div>
                                        <div>
                                            <Label className="mb-2 block text-[10.5px] font-semibold text-slate-500">Email liên hệ *</Label>
                                            <div className="relative">
                                                <Input {...register("email")} className="h-[40px] pr-10 text-[13px]" />
                                                {copyButton("Email", supplierData.email)}
                                            </div>
                                            {errors.email && <p className="mt-1 text-[10px] text-red-500">{errors.email.message}</p>}
                                        </div>
                                    </div>

                                    {/* Hàng 4 (Địa chỉ chi tiết / Trụ sở) */}
                                    <div>
                                        <Label className="mb-2 block text-[10.5px] font-semibold text-slate-500">Địa chỉ *</Label>
                                        <div className="relative">
                                            <Textarea {...register("addressDetail")} className="min-h-[84px] resize-none pr-10 text-[13px]" />
                                            {copyButton("Địa chỉ", supplierData.addressDetail, true)}
                                        </div>
                                        {errors.addressDetail && <p className="mt-1 text-[10px] text-red-500">{errors.addressDetail.message}</p>}
                                    </div>

                                    {/* Hàng 5 (Thông tin hệ thống) */}
                                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                        <div>
                                            <Label className="mb-2 block text-[10.5px] font-semibold text-slate-500">Mã nhà cung cấp</Label>
                                            <div className="relative">
                                                <Input value={supplierRecord?.code || `#${supplierId}`} disabled className="h-[40px] bg-slate-50 pr-10 text-[13px] text-slate-500" />
                                                {copyButton("Mã nhà cung cấp", supplierRecord?.code || `#${supplierId}`)}
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="mb-2 block text-[10.5px] font-semibold text-slate-500">Cập nhật gần nhất</Label>
                                            <Input value={formatDate(supplierRecord?.updatedAt || supplierRecord?.createdAt)} disabled className="h-[40px] bg-slate-50 text-[13px] text-slate-500" />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 border-t border-slate-100 pt-4 text-[10.5px] text-slate-400">
                                    <span>Tạo bởi: {supplierRecord?.createdByName || "Chưa rõ"}</span>
                                    <span>Cập nhật bởi: {supplierRecord?.updatedByName || "Chưa rõ"}</span>
                                    <span>Ngày tạo: {formatDate(supplierRecord?.createdAt)}</span>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="catalog" className="mt-5">
                            <div className="overflow-hidden border border-slate-200 bg-white shadow-sm">
                                <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-[12px] font-semibold text-slate-900">
                                            2. Danh mục sản phẩm cung cấp
                                        </h3>
                                        <span
                                            className={cn(
                                                "text-[10.5px] font-medium",
                                                hasCatalogDraft ? "text-amber-700" : "text-slate-400",
                                            )}
                                        >
                                            {hasCatalogDraft ? "Có thay đổi chưa lưu" : "Đã đồng bộ"}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 border border-slate-200 md:grid-cols-4">
                                        <div
                                            className={cn(
                                                "border-b border-r border-slate-200 px-4 py-3 md:border-b-0 cursor-pointer transition-all select-none",
                                                catalogFilter === "ALL" ? "bg-blue-50/60" : "hover:bg-slate-50/70"
                                            )}
                                            onClick={() => setCatalogFilter("ALL")}
                                        >
                                            <p className={cn("text-[10.5px] font-medium", catalogFilter === "ALL" ? "text-blue-700" : "text-slate-500")}>Đã khai báo</p>
                                            <p className={cn("mt-1 text-[16px] font-semibold", catalogFilter === "ALL" ? "text-blue-600 font-bold" : "text-slate-800")}>{catalogSummary.total}</p>
                                        </div>
                                        <div
                                            className={cn(
                                                "border-b border-slate-200 px-4 py-3 md:border-b-0 md:border-r cursor-pointer transition-all select-none",
                                                catalogFilter === "AVAILABLE" ? "bg-blue-50/60" : "hover:bg-slate-50/70"
                                            )}
                                            onClick={() => setCatalogFilter("AVAILABLE")}
                                        >
                                            <p className={cn("text-[10.5px] font-medium", catalogFilter === "AVAILABLE" ? "text-blue-700" : "text-slate-500")}>Có cung cấp</p>
                                            <p className={cn("mt-1 text-[16px] font-semibold", catalogFilter === "AVAILABLE" ? "text-blue-600 font-bold" : "text-slate-800")}>{catalogSummary.available}</p>
                                        </div>
                                        <div
                                            className={cn(
                                                "border-r border-slate-200 px-4 py-3 cursor-pointer transition-all select-none",
                                                catalogFilter === "UNAVAILABLE" ? "bg-blue-50/60" : "hover:bg-slate-50/70"
                                            )}
                                            onClick={() => setCatalogFilter("UNAVAILABLE")}
                                        >
                                            <p className={cn("text-[10.5px] font-medium", catalogFilter === "UNAVAILABLE" ? "text-blue-700" : "text-slate-500")}>Không cung cấp</p>
                                            <p className={cn("mt-1 text-[16px] font-semibold", catalogFilter === "UNAVAILABLE" ? "text-blue-600 font-bold" : "text-slate-800")}>{catalogSummary.unavailable}</p>
                                        </div>
                                        <div
                                            className={cn(
                                                "px-4 py-3 cursor-pointer transition-all select-none",
                                                catalogFilter === "CHECKING" ? "bg-blue-50/60" : "hover:bg-slate-50/70"
                                            )}
                                            onClick={() => setCatalogFilter("CHECKING")}
                                        >
                                            <p className={cn("text-[10.5px] font-medium", catalogFilter === "CHECKING" ? "text-blue-700" : "text-slate-500")}>Đang kiểm tra</p>
                                            <div className="mt-1 flex items-baseline gap-2">
                                                <p className={cn("text-[16px] font-semibold", catalogFilter === "CHECKING" ? "text-blue-600 font-bold" : "text-slate-800")}>{catalogSummary.checking}</p>
                                                {checkingTooLongItems.length > 0 && (
                                                    <p className="text-[10.5px] text-amber-700">
                                                        Quá {STALE_CHECKING_DAYS} ngày
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {catalogLoadError && (
                                        <div className="rounded border border-rose-200 bg-rose-50 px-3 py-3 text-[12px] text-rose-800">
                                            {catalogLoadError} Tạm thời khóa chỉnh sửa catalog để tránh ghi đè sai dữ liệu.
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
                                                    <SelectItem value="AVAILABLE">Có thể đặt mua</SelectItem>
                                                    <SelectItem value="CHECKING">Đang xác minh</SelectItem>
                                                    <SelectItem value="UNAVAILABLE">Ngừng cung cấp</SelectItem>
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
                                                    <SelectItem value="AVAILABLE">Có thể đặt mua</SelectItem>
                                                    <SelectItem value="CHECKING">Đang xác minh</SelectItem>
                                                    <SelectItem value="UNAVAILABLE">Ngừng cung cấp</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="h-[34px] text-[11px] font-medium"
                                                onClick={applyBulkCatalogStatus}
                                                disabled={Boolean(catalogLoadError)}
                                            >
                                                Áp dụng ({selectedCatalogProductIds.length})
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="min-w-0 p-0">
                                    <Table className="table-custom w-full table-fixed border-collapse">
                                        <colgroup>
                                            <col className="w-[44px]" />
                                            <col className="w-[34%]" />
                                            <col className="w-[18%]" />
                                            <col className="w-[18%]" />
                                            <col className="w-[30%]" />
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
                                                <TableHead className="py-3 text-[11px] font-medium text-slate-500">Sản phẩm</TableHead>
                                                <TableHead className="py-3 text-[11px] font-medium text-slate-500">Thương hiệu và xuất xứ</TableHead>
                                                <TableHead className="py-3 text-[11px] font-medium text-slate-500">Khả năng cung cấp</TableHead>
                                                <TableHead className="py-3 pr-4 text-[11px] font-medium text-slate-500">Ghi chú</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedCatalogItems.length > 0 ? (
                                                paginatedCatalogItems.map((item) => {
                                                    const previewImage = item.imageUrl;
                                                    const isSelected = selectedCatalogProductIds.includes(item.productVariantId);
                                                    const checkingAgeDays = getCheckingAgeDays(item);

                                                    return (
                                                        <TableRow key={`${item.productId}-${item.productVariantId}`} className="border-b border-slate-100 align-middle hover:bg-slate-50/70">
                                                            <TableCell className="py-4 pl-3">
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    onCheckedChange={(checked) => toggleCatalogSelection(item.productVariantId, checked === true)}
                                                                    disabled={Boolean(catalogLoadError)}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="py-3">
                                                                <div className="flex min-w-0 items-start gap-2.5">
                                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-50">
                                                                        {previewImage ? (
                                                                            <img
                                                                                src={previewImage}
                                                                                alt={item.productName}
                                                                                className="h-full w-full object-cover"
                                                                                onError={(event) => {
                                                                                    event.currentTarget.style.display = "none";
                                                                                }}
                                                                            />
                                                                        ) : (
                                                                            <ImageOff size={16} className="text-slate-400" />
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="line-clamp-2 text-[12.5px] font-semibold leading-5 text-slate-800">{item.productName}</p>
                                                                        <p className="mt-1 text-[10.5px] text-slate-400">SKU: {item.sku || "---"}</p>
                                                                        <p className="mt-1 text-[10.5px] text-slate-500">{item.categoryName || "---"}</p>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-3 pr-3">
                                                                <p className="text-[11.5px] font-medium text-slate-700">{item.brandName || "---"}</p>
                                                                {item.origin && (
                                                                    <p className="mt-1 text-[10.5px] text-slate-500">{item.origin}</p>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="py-3 pr-3">
                                                                <Select
                                                                    value={item.status || "CHECKING"}
                                                                    onValueChange={(value) => updateCatalogItem(item.productVariantId, { status: value as SupplierProductCatalogStatus })}
                                                                    disabled={Boolean(catalogLoadError)}
                                                                >
                                                                    <SelectTrigger className="h-9 w-full text-[11.5px] font-normal shadow-none">
                                                                        <SelectValue placeholder="Chưa thiết lập" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="AVAILABLE">Có thể đặt mua</SelectItem>
                                                                        <SelectItem value="CHECKING">Đang xác minh</SelectItem>
                                                                        <SelectItem value="UNAVAILABLE">Ngừng cung cấp</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                {checkingAgeDays != null && item.status === "CHECKING" && (
                                                                    <p className={cn("mt-1.5 text-[10.5px]", checkingAgeDays >= STALE_CHECKING_DAYS ? "text-amber-700" : "text-slate-400")}>
                                                                        Xác minh {checkingAgeDays} ngày
                                                                    </p>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="py-3 pr-3">
                                                                <Textarea
                                                                    value={item.note || ""}
                                                                    onChange={(e) => updateCatalogItem(item.productVariantId, { note: e.target.value })}
                                                                    placeholder="Điều kiện giao hàng, thông tin xác minh..."
                                                                    className="min-h-[58px] w-full resize-none px-3 py-2 text-[11px]"
                                                                    maxLength={255}
                                                                    disabled={Boolean(catalogLoadError)}
                                                                />
                                                                {(item.updatedAt || item.updatedByName) && (
                                                                    <p className="mt-1.5 text-[10px] text-slate-400">
                                                                        {item.updatedByName || "Đã cập nhật"} · {formatDate(item.updatedAt)}
                                                                    </p>
                                                                )}
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
                                                                <p className="text-[12px] font-medium text-slate-600">
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

                                {filteredCatalogItems.length > 0 && (
                                    <div className="px-4 py-3 border-t border-slate-100 bg-[#fcfcfc] flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                        <p className="text-[11px] text-slate-500">
                                            Hiển thị {(catalogCurrentPage - 1) * CATALOG_PAGE_SIZE + 1} - {Math.min(catalogCurrentPage * CATALOG_PAGE_SIZE, filteredCatalogItems.length)} trong {filteredCatalogItems.length}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-[11px] font-medium"
                                                onClick={() => setCatalogCurrentPage((prev) => Math.max(prev - 1, 1))}
                                                disabled={catalogCurrentPage === 1}
                                            >
                                                ← Trước
                                            </Button>
                                            <span className="min-w-[60px] text-center text-[11px] text-slate-500">
                                                {catalogCurrentPage} / {catalogTotalPages}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-[11px] font-medium"
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

                        <TabsContent value="history" className="mt-5">
                            <div className="overflow-hidden border border-slate-200 bg-white shadow-sm">
                                <div className="border-b border-slate-200 px-5 py-4">
                                    <h3 className="mb-4 text-[12px] font-semibold text-slate-900">
                                        3. Lịch sử phiếu nhập
                                    </h3>
                                    {historyLoadError && (
                                        <div className="mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-3 text-[12px] text-amber-900">
                                            {historyLoadError}
                                        </div>
                                    )}
                                    <div className="mb-4 grid grid-cols-2 border border-slate-200 lg:grid-cols-4">
                                        <div className="border-b border-r border-slate-200 px-4 py-3 lg:border-b-0">
                                            <p className="text-[10.5px] text-slate-500">Tổng phiếu nhập</p>
                                            <p className="mt-1 text-[16px] font-semibold text-slate-800">{historySummary.totalReceipts}</p>
                                        </div>
                                        <div className="border-b border-slate-200 px-4 py-3 lg:border-b-0 lg:border-r">
                                            <p className="text-[10.5px] text-slate-500">Tổng giá trị nhập</p>
                                            <p className="mt-1 text-[16px] font-semibold text-slate-800">{formatCurrency(historySummary.totalValue)}</p>
                                        </div>
                                        <div className="border-r border-slate-200 px-4 py-3">
                                            <p className="text-[10.5px] text-slate-500">Tổng số lượng</p>
                                            <p className="mt-1 text-[16px] font-semibold text-slate-800">{historySummary.totalQuantity.toLocaleString("vi-VN")}</p>
                                        </div>
                                        <div className="px-4 py-3">
                                            <p className="text-[10.5px] text-slate-500">Đã hoàn thành</p>
                                            <p className="mt-1 text-[16px] font-semibold text-slate-800">{historySummary.completedReceipts}</p>
                                        </div>
                                    </div>
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
                                            className="h-[34px] text-[11px] font-medium"
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
                                        <SharedDatePicker
                                            value={fromDate}
                                            onChange={setFromDate}
                                            placeholder="Từ ngày"
                                            variant="compact"
                                            buttonClassName="h-[34px] text-[12px]"
                                        />
                                        <SharedDatePicker
                                            value={toDate}
                                            onChange={setToDate}
                                            placeholder="Đến ngày"
                                            variant="compact"
                                            buttonClassName="h-[34px] text-[12px]"
                                        />
                                    </div>
                                </div>

                                <div className="min-w-0 p-0">
                                    <Table className="table-custom w-full table-fixed border-collapse">
                                        <colgroup>
                                            <col className="w-[28%]" />
                                            <col className="w-[24%]" />
                                            <col className="w-[20%]" />
                                            <col className="w-[20%]" />
                                            <col className="w-[8%]" />
                                        </colgroup>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50 border-b border-slate-100">
                                                <TableHead className="py-3 pl-4 text-[10px] font-semibold text-[#1f1f1f]">Mã phiếu</TableHead>
                                                <TableHead className="py-3 text-[10px] font-semibold text-[#1f1f1f]">Ngày tạo</TableHead>
                                                <TableHead className="py-3 text-[10px] font-semibold text-[#1f1f1f]">Trạng thái</TableHead>
                                                <TableHead className="py-3 text-right text-[10px] font-semibold text-[#1f1f1f]">Tổng giá trị</TableHead>
                                                <TableHead className="py-3 pr-4 text-right text-[10px] font-semibold text-[#1f1f1f]">Thao tác</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedHistory.length > 0 ? (
                                                paginatedHistory.map((item) => {
                                                    return (
                                                        <TableRow
                                                            key={item.id}
                                                            className="cursor-pointer border-b border-slate-100 hover:bg-slate-50/70"
                                                            onClick={() => router.push(`/admin/receipts/${item.id}`)}
                                                        >
                                                            <TableCell className="py-3 pl-4">
                                                                <button
                                                                    type="button"
                                                                    className="text-[12px] font-semibold text-slate-800 hover:text-blue-700"
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        router.push(`/admin/receipts/${item.id}`);
                                                                    }}
                                                                >
                                                                    {item.code}
                                                                </button>
                                                                <p className="mt-1 text-[10.5px] text-slate-400">
                                                                    {item.itemCount || 0} mã hàng · {item.totalQuantity || 0} sản phẩm
                                                                </p>
                                                            </TableCell>
                                                            <TableCell className="py-3 text-[11.5px] text-slate-500">{formatDate(item.createdAt)}</TableCell>
                                                            <TableCell className="py-3">
                                                                <span className="text-[11.5px] text-slate-600">
                                                                    {getHistoryStatusLabel(item.status)}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="py-3 text-right text-[12px] font-semibold text-slate-800">
                                                                {formatCurrency(item.totalAmount)}
                                                            </TableCell>
                                                            <TableCell className="py-3 pr-4 text-right">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        aria-label="Xem chi tiết phiếu nhập"
                                                                        className="h-8 w-8 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                                                                        onClick={(event) => {
                                                                            event.stopPropagation();
                                                                            router.push(`/admin/receipts/${item.id}`);
                                                                        }}
                                                                    >
                                                                        <ArrowUpRight size={15} />
                                                                    </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top">Xem chi tiết</TooltipContent>
                                                                </Tooltip>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="py-10 text-center text-[12px] text-slate-400">
                                                        Không có phiếu nhập phù hợp bộ lọc
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {filteredHistory.length > 0 && (
                                    <div className="px-4 py-3 border-t border-slate-100 bg-[#fcfcfc] flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                        <p className="text-[11px] text-slate-500">
                                            Hiển thị {(historyCurrentPage - 1) * HISTORY_PAGE_SIZE + 1} - {Math.min(historyCurrentPage * HISTORY_PAGE_SIZE, filteredHistory.length)} trong {filteredHistory.length}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-[11px] font-medium"
                                                onClick={() => setHistoryCurrentPage((prev) => Math.max(prev - 1, 1))}
                                                disabled={historyCurrentPage === 1}
                                            >
                                                ← Trước
                                            </Button>
                                            <span className="min-w-[60px] text-center text-[11px] text-slate-500">
                                                {historyCurrentPage} / {historyTotalPages}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-[11px] font-medium"
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

            {activeTab !== "history" && (
                <div className="fixed bottom-0 left-0 right-0 z-[999] border-t border-slate-200 bg-white/95 px-6 py-3 shadow-[0_-4px_14px_rgba(15,23,42,0.06)] backdrop-blur lg:left-[260px]">
                    <div className="flex items-center justify-end gap-3">
                        <Button type="button" variant="outline" onClick={handleGoBack} className="h-10 min-w-[104px] text-[12px] font-medium">
                            Hủy
                        </Button>
                        {activeTab === "info" && (
                        <Button type="submit" disabled={isSaving} className="h-10 min-w-[156px] bg-blue-600 text-[12px] font-semibold hover:bg-blue-700">
                            <Save size={15} className="mr-2" />
                            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                        )}
                        {activeTab === "catalog" && (
                            <Button
                                type="button"
                                disabled={isCatalogSaving || Boolean(catalogLoadError) || !hasCatalogDraft}
                                onClick={() => void saveCatalog()}
                                className="h-10 min-w-[156px] bg-blue-600 text-[12px] font-semibold hover:bg-blue-700"
                            >
                                <Save size={15} className="mr-2" />
                                {isCatalogSaving ? "Đang lưu..." : "Lưu catalog"}
                            </Button>
                        )}
                    </div>
                </div>
            )}

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
                            Bạn có chắc chắn muốn tạm dừng nhà cung cấp {supplierRecord?.name || supplierData.name || ""} không?
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
                            className="h-9 text-[11px] font-bold uppercase bg-blue-600 hover:bg-blue-700"
                            disabled={isCatalogSaving}
                        >
                            {isCatalogSaving ? "Đang lưu..." : "Lưu và rời đi"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </form>
        </TooltipProvider>
    );
}

