"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AdminProductTable } from "@/components/admin/AdminProductTable";
import { ProductService } from "@/app/services/product.service";
import { PriceRoundingRule, SettingService } from "@/app/services/setting.service";
import { ProfitLossService } from "@/app/services/profit-loss.service";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import { getAdminBrands } from "@/app/services/brand.service";
import { Loader2, ChevronLeft, ChevronRight, Settings, Percent, Save, Plus, Search, Pencil, Brain, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn, cleanSupplierName } from "@/lib/utils";
import AdminDataSyncLoader from "@/components/admin/shared/AdminDataSyncLoader";
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

import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { resolveImageUrl } from "@/lib/resolveImageUrl";

export default function ProductsPage() {
    const router = useRouter();

    const { user, isLoadingAuth } = useAuthStore();

    const { hasPermission, hasAnyPermission } = usePermissions();
    const canManagePricingSettings = hasPermission(P.SETTING_UPDATE);
    const canViewImportPrice = hasAnyPermission([
        P.REPORT_FINANCE_VIEW,
        P.IMPORT_VIEW,
        P.EXPORT_CREATE,
        P.TRANSFER_CREATE,
        P.PURCHASE_REQUEST_VIEW,
    ]);

    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState<{label: string, value: string}[]>([]);
    const [brands, setBrands] = useState<{id: number, name: string}[]>([]);
    const [suppliers, setSuppliers] = useState<string[]>([]);

    useEffect(() => {
        if (!isLoadingAuth && !hasPermission(P.PRODUCT_VIEW)) {
            router.push("/admin/forbidden");
        }
    }, [isLoadingAuth, hasPermission, router]);

    const [filters, setFilters] = useState({
        keyword: "",
        categoryId: "all",
        status: "all",
    });

    const [sort, setSort] = useState("id,desc");
    const [selectedBrand, setSelectedBrand] = useState("all");
    const [selectedSupplier, setSelectedSupplier] = useState("all");
    const [viewMode, setViewMode] = useState<"product" | "sku">("product");

    const [debouncedKeyword, setDebouncedKeyword] = useState("");

    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 20;

    const [isSettingOpen, setIsSettingOpen] = useState(false);
    const [profitMargin, setProfitMargin] = useState("30");
    const [originalProfitMargin, setOriginalProfitMargin] = useState("30");
    const [roundingRule, setRoundingRule] = useState<PriceRoundingRule>("NONE");
    const [originalRoundingRule, setOriginalRoundingRule] = useState<PriceRoundingRule>("NONE");
    const [isSavingMargin, setIsSavingMargin] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isMultiTierEnabled, setIsMultiTierEnabled] = useState(false);
    const [originalIsMultiTierEnabled, setOriginalIsMultiTierEnabled] = useState(false);
    const [minMarginFloor, setMinMarginFloor] = useState("3.0");
    const [originalMinMarginFloor, setOriginalMinMarginFloor] = useState("3.0");
    const [categoryOffsets, setCategoryOffsets] = useState<Record<number, string>>({});
    const [originalCategoryOffsets, setOriginalCategoryOffsets] = useState<Record<number, string>>({});
    const [dbCategories, setDbCategories] = useState<any[]>([]);

    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<{
        insufficientData?: boolean;
        message?: string;
        suggestedMargin: number;
        suggestedRoundingRule: PriceRoundingRule;
        reasoning: string;
        analysis: {
            financialHealth: string;
            costImpact: string;
            competitiveness: string;
        };
    } | null>(null);

    const handleFetchAiSuggestion = async () => {
        try {
            setIsAiLoading(true);
            setAiSuggestion(null);

            const today = new Date();
            const startDate = new Date();
            startDate.setDate(today.getDate() - 30);

            const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);

            const pnlData = await ProfitLossService.getReport(
                toIsoDate(startDate),
                toIsoDate(today),
                "all"
            );

            const response = await fetch("/api/pricing-suggestion", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    pnl: pnlData,
                    currentMargin: Number(profitMargin || 30),
                    productCount: products.length,
                }),
            });

            if (!response.ok) {
                throw new Error("Không thể kết nối dịch vụ gợi ý AI.");
            }

            const data = await response.json();
            if (data.success) {
                setAiSuggestion(data);
                toast.success("AI đã phân tích và gợi ý thành công!");
            } else {
                throw new Error(data.message || "Gợi ý AI gặp lỗi.");
            }
        } catch (error: any) {
            console.error("Ai suggestion error:", error);
            toast.error(error?.message || "Lỗi khi lấy gợi ý của AI.");
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleApplyAiSuggestion = () => {
        if (!aiSuggestion) return;
        setProfitMargin(String(aiSuggestion.suggestedMargin));
        setRoundingRule(aiSuggestion.suggestedRoundingRule);
        toast.success("Đã áp dụng thông số gợi ý từ AI!");
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(filters.keyword);
        }, 500);
        return () => clearTimeout(timer);
    }, [filters.keyword]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [data, brandData] = await Promise.all([
                    ProductService.getCategories(),
                    getAdminBrands(),
                ]);
                const mapped = [
                    { label: "Tất cả danh mục", value: "all" },
                    ...data.map((c: any) => ({ label: c.name, value: String(c.id) }))
                ];
                setCategories(mapped);
                setBrands(
                    (Array.isArray(brandData) ? brandData : [])
                        .filter((b: any) => b?.name?.trim())
                        .map((b: any) => ({ id: Number(b.id), name: String(b.name) }))
                        .sort((a: any, b: any) => a.name.localeCompare(b.name, "vi"))
                );

                setDbCategories(data);

                if (canManagePricingSettings) {
                    const marginData = await SettingService.getProfitMargin();
                    if (marginData && marginData.margin) {
                        setProfitMargin(marginData.margin);
                        setOriginalProfitMargin(marginData.margin);
                    }
                    const ruleFromServer = marginData?.roundingRule || "NONE";
                    setRoundingRule(ruleFromServer);
                    setOriginalRoundingRule(ruleFromServer);

                    const mtEnabled = !!marginData?.multiTierEnabled;
                    setIsMultiTierEnabled(mtEnabled);
                    setOriginalIsMultiTierEnabled(mtEnabled);

                    const floorVal = marginData?.minMarginFloor || "3.0";
                    setMinMarginFloor(floorVal);
                    setOriginalMinMarginFloor(floorVal);

                    const offsets: Record<number, string> = {};
                    if (marginData?.categoryOffsets) {
                        Object.entries(marginData.categoryOffsets).forEach(([k, v]) => {
                            offsets[Number(k)] = String(v);
                        });
                    }
                    setCategoryOffsets(offsets);
                    setOriginalCategoryOffsets(offsets);
                }
            } catch (error) {
                console.error("Failed to fetch initial data:", error);
            }
        };
        fetchInitialData();
    }, [canManagePricingSettings]);

    const handleMarginInputChange = (value: string) => {
        const normalizedValue = value.replace(",", ".").trim();

        if (normalizedValue === "") {
            setProfitMargin("");
            return;
        }

        if (!/^\d{0,3}(\.\d{0,2})?$/.test(normalizedValue)) {
            return;
        }

        setProfitMargin(normalizedValue);
    };

    const fetchProducts = useCallback(async () => {
        try {
            setIsLoading(true);
            const apiParams: any = {};
            if (debouncedKeyword) apiParams.keyword = debouncedKeyword;
            if (filters.categoryId !== "all") apiParams.categoryId = filters.categoryId;
            if (filters.status !== "all") apiParams.status = filters.status;

            const data = await ProductService.getAll(apiParams);

            const mappedProducts = data.map((p: any) => ({
                id: p.id,
                name: p.name,
                slug: p.slug || "",
                baseSku: p.baseSku || "",
                categoryName: p.categoryName || "",
                supplierName: p.supplierName || "",
                brandName: p.brandName || "",
                brandId: p.brandId ? Number(p.brandId) : null,
                status: p.status,
                image: p.imageUrls?.[0] || "",
                imageUrls: p.imageUrls || [],
                inventory: p.inventory || 0,
                variants: (p.variants || []).map((v: any) => ({
                    id: v.id,
                    sku: v.sku || "",
                    barcode: v.barcode || "",
                    quantity: v.quantity || 0,
                    imageUrl: v.imageUrl || null,
                    status: v.status || "",
                    attributeValues: v.attributeValues || [],
                    price: v.price || 0,
                    importPrice: v.importPrice || null,
                    batches: v.batches || [],
                })),
            }));

            setProducts(mappedProducts);
            setCurrentPage(0);
        } catch (error: any) {
            console.error("Failed to fetch products:", error);
            toast.error("Không thể tải danh sách sản phẩm.");
        } finally {
            setIsLoading(false);
        }
    }, [debouncedKeyword, filters.categoryId, filters.status]);

    const handleDelete = async (id: number) => {
        try {
            setIsDeleting(true);
            const res = await ProductService.delete(id);

            if (res.success) {
                toast.success(res.message || "Đã xóa sản phẩm thành công.");
                fetchProducts();
            } else {
                toast.error(res.message);
            }
        } catch (error: any) {
            const errorMessage = getErrorMessage(error);
            toast.error(errorMessage);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDisable = async (id: number) => {
        try {
            const res = await ProductService.disable(id);
            if (res.success) {
                toast.success(res.message || "Đã ngừng kinh doanh sản phẩm.");
                fetchProducts();
            } else {
                toast.error(res.message);
            }
        } catch (error: any) {
            const errorMessage = getErrorMessage(error);
            toast.error(errorMessage);
        }
    };

    const handleEnable = async (id: number) => {
        try {
            const res = await ProductService.enable(id);
            if (res.success) {
                toast.success(res.message || "Đã kích hoạt kinh doanh sản phẩm.");
                fetchProducts();
            } else {
                toast.error(res.message);
            }
        } catch (error: any) {
            const errorMessage = getErrorMessage(error);
            toast.error(errorMessage);
        }
    };

    const handleEdit = (id: number) => {
        router.push(`/admin/products/${id}/edit`);
    };

    const handleSaveMargin = async () => {
        const marginValue = Number(profitMargin);

        if (!profitMargin || isNaN(marginValue)) {
            toast.error("Vui lòng nhập một con số hợp lệ!");
            return;
        }

        if (marginValue < 0) {
            toast.error("Biên lợi nhuận không được nhỏ hơn 0%!");
            return;
        }

        if (marginValue > 100) {
            toast.error("Biên lợi nhuận không được vượt quá 100%!");
            return;
        }

        try {
            setIsSavingMargin(true);

            const offsetsPayload: Record<number, number> = {};
            Object.entries(categoryOffsets).forEach(([k, v]) => {
                if (v && !isNaN(Number(v))) {
                    offsetsPayload[Number(k)] = Number(v);
                }
            });

            const res = await SettingService.updateProfitMargin(
                marginValue.toString(),
                roundingRule,
                isMultiTierEnabled,
                minMarginFloor,
                offsetsPayload
            );

            toast.success(res.message || "Đã cập nhật cấu hình lợi nhuận!");
            setOriginalProfitMargin(marginValue.toString());
            const savedRule = (res.roundingRule || roundingRule) as PriceRoundingRule;
            setRoundingRule(savedRule);
            setOriginalRoundingRule(savedRule);

            setOriginalIsMultiTierEnabled(isMultiTierEnabled);
            setOriginalMinMarginFloor(minMarginFloor);
            setOriginalCategoryOffsets(categoryOffsets);

            setIsSettingOpen(false);
            fetchProducts();
        } catch (error: any) {
            console.error(error);
            toast.error("Cập nhật thất bại.");
        } finally {
            setIsSavingMargin(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        setCurrentPage(0);
    }, [viewMode]);

    const sortedProducts = useMemo(() => {
        const items = products.filter(
            (product) =>
                selectedBrand === "all" || String(product.brandId) === selectedBrand,
        );

        items.sort((left, right) => {
            const leftName = (left.name || "").toString().trim().toLowerCase();
            const rightName = (right.name || "").toString().trim().toLowerCase();

            switch (sort) {
                case "id,asc":
                    return Number(left.id) - Number(right.id);
                case "name,asc":
                case "fullName,asc":
                    return leftName.localeCompare(rightName, "vi");
                case "name,desc":
                case "fullName,desc":
                    return rightName.localeCompare(leftName, "vi");
                case "id,desc":
                default:
                    return Number(right.id) - Number(left.id);
            }
        });

        return items;
    }, [products, selectedBrand, sort]);

    useEffect(() => {
        setCurrentPage(0);
    }, [selectedBrand]);

    const totalPages = Math.ceil(sortedProducts.length / pageSize);
    const currentProducts = sortedProducts.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
    const totalSkuCount = useMemo(
        () => sortedProducts.reduce((sum, product) => sum + (product.variants?.length || 0), 0),
        [sortedProducts]
    );
    const productOverviewCards = useMemo(() => {
        const activeProducts = sortedProducts.filter(
            (product) => product.status === "ACTIVE",
        ).length;
        const inactiveProducts = sortedProducts.filter(
            (product) => product.status === "INACTIVE",
        ).length;

        return [
            {
                title: "Tổng sản phẩm",
                value: sortedProducts.length,
                description: "Sản phẩm trong danh sách hiện tại",
            },
            {
                title: "Đang kinh doanh",
                value: activeProducts,
                description: "Sản phẩm đang hiển thị và bán",
            },
            {
                title: "Ngừng kinh doanh",
                value: inactiveProducts,
                description: "Sản phẩm đang tạm ngừng bán",
            },
            {
                title: "Tổng SKU",
                value: totalSkuCount,
                description: "Biến thể hàng hóa đang quản lý",
            },
        ];
    }, [sortedProducts, totalSkuCount]);
    const sortedVariants = useMemo(
        () =>
            sortedProducts.flatMap((product: any) =>
                (product.variants || []).map((variant: any) => ({
                    productId: product.id,
                    productName: product.name,
                    categoryName: product.categoryName,
                    brandName: product.brandName,
                    productStatus: product.status,
                    variantId: variant.id,
                    sku: variant.sku,
                    barcode: variant.barcode,
                    quantity: variant.quantity || 0,
                    imageUrl: variant.imageUrl || product.imageUrls?.[0] || "",
                    variantStatus: variant.status || "",
                }))
            ),
        [sortedProducts]
    );

    const totalItems = viewMode === "product" ? sortedProducts.length : sortedVariants.length;
    const effectiveTotalPages = Math.ceil(totalItems / pageSize);
    const paginatedProducts = sortedProducts.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
    const paginatedVariants = sortedVariants.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

    const applyRounding = (price: number) => {
        const roundedAmount = Math.max(0, Math.round(price));

        if (roundingRule === "STEP_500") return Math.floor((roundedAmount + 499) / 500) * 500;
        if (roundingRule === "STEP_1000") return Math.floor((roundedAmount + 999) / 1000) * 1000;
        if (roundingRule === "TAIL_99000") {
            if (roundedAmount <= 99000) return 99000;
            const band = Math.round((roundedAmount - 99000) / 100000);
            return 99000 + band * 100000;
        }
        return roundedAmount;
    };

    const marginValue = Number(profitMargin);
    const hasMarginValue = profitMargin.trim() !== "";
    const isValidMarginNumber = hasMarginValue && !Number.isNaN(marginValue);
    const isMarginInRange = isValidMarginNumber && marginValue >= 0 && marginValue <= 100;

    const isOffsetsDirty = JSON.stringify(categoryOffsets) !== JSON.stringify(originalCategoryOffsets);
    const isMarginDirty =
        profitMargin !== originalProfitMargin ||
        roundingRule !== originalRoundingRule ||
        isMultiTierEnabled !== originalIsMultiTierEnabled ||
        minMarginFloor !== originalMinMarginFloor ||
        isOffsetsDirty;

    const sampleImportPrices = [100000, 250000, 500000];
    const samplePreviewRows = isMarginInRange
        ? sampleImportPrices.map((importPrice) => {
            const rawSellingPrice = importPrice * (1 + marginValue / 100);
            const roundedSellingPrice = applyRounding(rawSellingPrice);
            return {
                importPrice,
                rawSellingPrice,
                roundedSellingPrice,
                grossProfit: roundedSellingPrice - importPrice,
            };
        })
        : [];

    const marginHint = !hasMarginValue
        ? "Nhập biên lợi nhuận trong khoảng 0% - 100%."
        : !isValidMarginNumber
            ? "Giá trị không hợp lệ. Vui lòng nhập số."
            : !isMarginInRange
                ? "Biên lợi nhuận phải nằm trong khoảng 0% - 100%."
                : marginValue < 5
                    ? "Biên lợi nhuận khá thấp, nên kiểm tra lại mức lãi mong muốn."
                    : marginValue > 70
                        ? "Biên lợi nhuận khá cao, hãy cân nhắc tính cạnh tranh giá bán."
                        : "Biên lợi nhuận đang ở mức hợp lý.";

    const marginHintClass = !hasMarginValue || !isValidMarginNumber || !isMarginInRange
        ? "text-rose-500"
        : marginValue < 5 || marginValue > 70
            ? "text-amber-600"
            : "text-emerald-600";

    if (isLoadingAuth) {
        return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-slate-400 w-8 h-8" /></div>;
    }

    return (
        <div className="space-y-3">
            <div className="mt-2 mb-8 space-y-4 px-1">
                <div>
                    <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
                        Hệ thống sản phẩm
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Select
                        value={filters.categoryId}
                        onValueChange={(value) => setFilters((current) => ({ ...current, categoryId: value }))}
                    >
                        <SelectTrigger className="h-[38px] w-full rounded-md border-slate-200 bg-white text-[13px] font-normal shadow-none focus:ring-0 lg:w-[220px]">
                            <SelectValue placeholder="Tất cả danh mục" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((category) => (
                                <SelectItem key={category.value} value={category.value} className="text-[13px]">
                                    {category.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.status}
                        onValueChange={(value) => setFilters((current) => ({ ...current, status: value }))}
                    >
                        <SelectTrigger className="h-[38px] w-full rounded-md border-slate-200 bg-white text-[13px] font-normal shadow-none focus:ring-0 lg:w-[180px]">
                            <SelectValue placeholder="Tất cả trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="text-[13px]">Tất cả trạng thái</SelectItem>
                            <SelectItem value="ACTIVE" className="text-[13px]">Đang kinh doanh</SelectItem>
                            <SelectItem value="INACTIVE" className="text-[13px]">Ngừng kinh doanh</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={selectedBrand}
                        onValueChange={(value) => {
                            setSelectedBrand(value);
                        }}
                    >
                        <SelectTrigger className="h-[38px] w-full rounded-md border-slate-200 bg-white text-[13px] font-normal shadow-none focus:ring-0 lg:w-[190px]">
                            <SelectValue placeholder="Tất cả thương hiệu" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="text-[13px]">
                                Tất cả thương hiệu
                            </SelectItem>
                            {brands.map((brand) => (
                                <SelectItem key={brand.id} value={String(brand.id)} className="text-[13px]">
                                    {brand.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="relative w-full lg:w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <Input
                            value={filters.keyword}
                            onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
                            placeholder="Tìm tên sản phẩm, mã SKU..."
                            className="h-[38px] rounded-md border-slate-200 bg-white pl-10 text-[13px] shadow-none focus-visible:ring-blue-500/20"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                    {productOverviewCards.map((card) => {
                        const statusMap: Record<string, string> = {
                            "Tổng sản phẩm": "all",
                            "Đang kinh doanh": "ACTIVE",
                            "Ngừng kinh doanh": "INACTIVE",
                            "Tổng SKU": "all"
                        };
                        const targetStatus = statusMap[card.title];

                        return (
                            <div
                                key={card.title}
                                className="rounded-[4px] border border-[#dcdcdc] bg-white p-3 shadow-sm transition-all select-none cursor-pointer hover:bg-slate-50/60"
                                onClick={() => {
                                    if (targetStatus) {
                                        setFilters((current) => ({ ...current, status: targetStatus }));
                                    }
                                }}
                            >
                                <p className="text-[11px] font-semibold text-slate-400">
                                    {card.title}
                                </p>
                                <div className="mt-3 space-y-1">
                                    <p className="text-[22px] font-semibold leading-none tracking-tight text-slate-900">
                                        {card.value.toLocaleString("vi-VN")}
                                    </p>
                                    <p className="text-[10px] leading-[18px] text-slate-500">
                                        {card.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setViewMode("product")}
                            className={cn(
                                "h-[34px] rounded-[4px] border px-3 text-[12px] font-medium transition-colors",
                                viewMode === "product"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-slate-200 bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-600",
                            )}
                        >
                            Theo sản phẩm
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("sku")}
                            className={cn(
                                "h-[34px] rounded-[4px] border px-3 text-[12px] font-medium transition-colors",
                                viewMode === "sku"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-slate-200 bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-600",
                            )}
                        >
                            Theo SKU
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                        {canManagePricingSettings && (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsSettingOpen(true)}
                                    className="h-[38px] rounded-md border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-600 shadow-none"
                                >
                                    <Settings size={15} className="mr-2" />
                                    Cấu hình giá bán
                                </Button>

                                <Dialog open={isSettingOpen} onOpenChange={(open) => { setIsSettingOpen(open); if (!open) setAiSuggestion(null); }}>
                                    <DialogContent className="sm:max-w-[560px] rounded-[4px] max-h-[90vh] flex flex-col">
                                        <DialogHeader className="shrink-0">
                                            <DialogTitle className="text-[16px] font-black uppercase tracking-tight flex items-center gap-2">
                                                <Percent size={18} className="text-emerald-600" /> Biên lợi nhuận (%)
                                            </DialogTitle>
                                            <DialogDescription className="text-[12px]">
                                                Tỷ lệ cộng thêm vào giá vốn lô hàng để ra giá bán niêm yết.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4 flex-1 min-h-0 overflow-y-auto pr-1">
                                            <Label className="text-[11px] font-bold text-slate-600 mb-2 block uppercase">Phần trăm mong muốn</Label>
                                            <div className="relative">
                                                <Input
                                                    type="text"
                                                    min="0"
                                                    max="100"
                                                    value={profitMargin}
                                                    onChange={(e) => handleMarginInputChange(e.target.value)}
                                                    className="h-[45px] text-[16px] font-black pl-4 pr-10 rounded-[3px]"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {[10, 20, 30, 40, 50].map((preset) => (
                                                    <Button
                                                        key={preset}
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setProfitMargin(String(preset))}
                                                        className={cn(
                                                            "h-7 text-[11px] px-2 rounded-[3px]",
                                                            Number(profitMargin) === preset
                                                                ? "border-emerald-400 text-emerald-700 bg-emerald-50"
                                                                : "border-slate-200 text-slate-600"
                                                        )}
                                                    >
                                                        {preset}%
                                                    </Button>
                                                ))}
                                            </div>

                                            <div className="mt-4">
                                                <Label className="text-[11px] font-bold text-slate-600 mb-2 block uppercase">Quy tắc làm tròn giá bán</Label>
                                                <div className="flex flex-wrap gap-2">
                                                    {[
                                                        { value: "NONE", label: "Không làm tròn" },
                                                        { value: "STEP_500", label: "Làm tròn bội 500" },
                                                        { value: "STEP_1000", label: "Làm tròn bội 1.000" },
                                                        { value: "TAIL_99000", label: "Đuôi 99.000 (gần nhất)" },
                                                    ].map((rule) => (
                                                        <Button
                                                            key={rule.value}
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setRoundingRule(rule.value as PriceRoundingRule)}
                                                            className={cn(
                                                                "h-7 text-[11px] px-2 rounded-[3px]",
                                                                roundingRule === rule.value
                                                                    ? "border-blue-400 text-blue-700 bg-blue-50"
                                                                    : "border-slate-200 text-slate-600"
                                                            )}
                                                        >
                                                            {rule.label}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>

                                            <p className={cn("mt-2 text-[12px] font-medium", marginHintClass)}>{marginHint}</p>

                                            <div className="mt-5 border-t border-slate-100 pt-4 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-0.5">
                                                        <Label className="text-[12px] font-bold text-slate-700 uppercase block">Định giá đa tầng (Mô hình động)</Label>
                                                        <span className="text-[10.5px] text-slate-400 block">Tự động điều chỉnh giá bán theo nhóm hàng & hạn dùng của lô.</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsMultiTierEnabled(!isMultiTierEnabled)}
                                                        className={cn(
                                                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                                            isMultiTierEnabled ? "bg-emerald-500" : "bg-slate-200"
                                                        )}
                                                    >
                                                        <span
                                                            className={cn(
                                                                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                                isMultiTierEnabled ? "translate-x-4" : "translate-x-0"
                                                            )}
                                                        />
                                                    </button>
                                                </div>

                                                {isMultiTierEnabled && (
                                                    <div className="rounded-[4px] border border-slate-200 bg-slate-50/50 p-4 space-y-4 animate-fadeIn">

                                                        <div className="grid grid-cols-2 items-center gap-4">
                                                            <div className="space-y-0.5">
                                                                <Label className="text-[11px] font-bold text-slate-600 uppercase block">Biên lợi nhuận tối thiểu sàn (%)</Label>
                                                                <span className="text-[10px] text-slate-400 block">Chặn dưới ngăn bán dưới giá vốn.</span>
                                                            </div>
                                                            <div className="relative">
                                                                <Input
                                                                    type="text"
                                                                    value={minMarginFloor}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value.replace(",", ".").trim();
                                                                        if (val === "" || /^\d*(\.\d*)?$/.test(val)) {
                                                                            setMinMarginFloor(val);
                                                                        }
                                                                    }}
                                                                    className="h-8 text-[12px] font-bold rounded-[3px] text-right pr-7"
                                                                />
                                                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">%</span>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2.5 pt-2 border-t border-slate-100">
                                                            <Label className="text-[11px] font-black text-slate-600 uppercase block">Bù trừ biên lợi nhuận theo danh mục</Label>
                                                            <div className="max-h-[160px] overflow-y-auto pr-1 space-y-2">
                                                                {dbCategories.map((cat) => (
                                                                    <div key={cat.id} className="flex items-center justify-between gap-4 py-1.5 border-b border-dashed border-slate-100 last:border-0">
                                                                        <span className="text-[11.5px] font-medium text-slate-600">{cat.name}</span>
                                                                        <div className="relative w-24">
                                                                            <Input
                                                                                type="text"
                                                                                placeholder="0.0"
                                                                                value={categoryOffsets[cat.id] || ""}
                                                                                onChange={(e) => {
                                                                                    const val = e.target.value.replace(",", ".").trim();
                                                                                    if (val === "" || /^-?\d*(\.\d*)?$/.test(val)) {
                                                                                        setCategoryOffsets(curr => ({ ...curr, [cat.id]: val }));
                                                                                    }
                                                                                }}
                                                                                className="h-7 text-[12px] text-right pr-6 rounded-[3px] font-bold"
                                                                            />
                                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">%</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-5 border-t border-slate-100 pt-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <Label className="text-[12px] font-black text-indigo-900 uppercase flex items-center gap-1.5">
                                                        <Sparkles size={14} className="text-indigo-600 animate-pulse" /> Trợ lý phân tích & Gợi ý giá AI
                                                    </Label>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleFetchAiSuggestion}
                                                        disabled={isAiLoading}
                                                        className="h-8 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-800 transition-all rounded-[3px]"
                                                    >
                                                        {isAiLoading ? (
                                                            <>
                                                                <Loader2 size={13} className="animate-spin mr-1.5" />
                                                                Đang phân tích...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Brain size={13} className="mr-1.5" />
                                                                Phân tích AI
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>

                                                {aiSuggestion && (
                                                    aiSuggestion.insufficientData ? (
                                                        <div className="rounded-[4px] border border-amber-200 bg-amber-50/50 p-4 text-[12.5px] text-amber-800 flex items-start gap-2.5 shadow-sm animate-fadeIn">
                                                            <AlertTriangle size={17} className="text-amber-600 shrink-0 mt-0.5" />
                                                            <div>
                                                                <p className="font-bold text-amber-900 mb-1 text-[13px]">Không đủ dữ liệu phân tích</p>
                                                                <p className="leading-relaxed">{aiSuggestion.message}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="rounded-[4px] border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-blue-50/40 p-4 space-y-3 shadow-inner transition-all animate-fadeIn">
                                                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100/50 pb-2">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-[11px] font-bold text-slate-500 uppercase">Sức khỏe tài chính:</span>
                                                                    <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                                                        {aiSuggestion.analysis.financialHealth}
                                                                    </span>
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    onClick={handleApplyAiSuggestion}
                                                                    className="h-6 text-[10px] font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white rounded-[3px] shadow-sm"
                                                                >
                                                                    Áp dụng gợi ý
                                                                </Button>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="bg-white/80 p-2.5 rounded border border-indigo-50/50">
                                                                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Biên lợi nhuận tối ưu</p>
                                                                    <p className="text-[18px] font-black text-indigo-700 mt-0.5">{aiSuggestion.suggestedMargin}%</p>
                                                                </div>
                                                                <div className="bg-white/80 p-2.5 rounded border border-indigo-50/50">
                                                                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Làm tròn đề xuất</p>
                                                                    <p className="text-[12px] font-bold text-slate-700 mt-1.5">
                                                                        {aiSuggestion.suggestedRoundingRule === "NONE" ? "Không làm tròn" :
                                                                         aiSuggestion.suggestedRoundingRule === "STEP_500" ? "Làm tròn bội 500" :
                                                                         aiSuggestion.suggestedRoundingRule === "STEP_1000" ? "Làm tròn bội 1.000" :
                                                                         "Đuôi 99.000"}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="text-[11.5px] leading-relaxed text-slate-600 bg-white/50 p-2.5 rounded border border-indigo-50/30 space-y-2">
                                                                <p>
                                                                    <strong className="text-slate-700">Tác động chi phí: </strong>
                                                                    {aiSuggestion.analysis.costImpact}
                                                                </p>
                                                                <p>
                                                                    <strong className="text-slate-700">Khả năng cạnh tranh: </strong>
                                                                    {aiSuggestion.analysis.competitiveness}
                                                                </p>
                                                                <p className="border-t border-indigo-50 pt-2 text-indigo-900/90 font-medium italic">
                                                                    "{aiSuggestion.reasoning}"
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>

                                            <div className="mt-4 rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                                                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                                                    Xem trước nhanh theo nhiều mốc giá vốn
                                                </p>
                                                <div className="space-y-2">
                                                    <div className="grid grid-cols-4 gap-2 text-[11px] font-bold uppercase text-slate-500">
                                                        <p>Giá vốn</p>
                                                        <p>Giá bán gốc</p>
                                                        <p>Giá bán sau làm tròn</p>
                                                        <p>Lãi gộp</p>
                                                    </div>
                                                    {samplePreviewRows.length > 0 ? (
                                                        samplePreviewRows.map((row) => (
                                                            <div key={row.importPrice} className="grid grid-cols-4 gap-2 text-[12px]">
                                                                <p className="font-semibold text-slate-700">{row.importPrice.toLocaleString("vi-VN")} ₫</p>
                                                                <p className="text-slate-600">{Math.round(row.rawSellingPrice).toLocaleString("vi-VN")} ₫</p>
                                                                <p className="font-bold text-emerald-700">{row.roundedSellingPrice.toLocaleString("vi-VN")} ₫</p>
                                                                <p className="font-bold text-blue-700">{row.grossProfit.toLocaleString("vi-VN")} ₫</p>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-[12px] text-slate-400">Nhập biên lợi nhuận hợp lệ để xem trước.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter className="shrink-0 border-t border-slate-100 pt-3">
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setProfitMargin(originalProfitMargin);
                                                    setRoundingRule(originalRoundingRule);
                                                }}
                                                className="rounded-[3px] text-[12px]"
                                                disabled={isSavingMargin || !isMarginDirty}
                                            >
                                                Khôi phục
                                            </Button>
                                            <Button variant="outline" onClick={() => setIsSettingOpen(false)} className="rounded-[3px] text-[12px]">Hủy</Button>
                                            <Button onClick={handleSaveMargin} disabled={isSavingMargin || !isMarginInRange || !isMarginDirty} className="bg-emerald-600 text-white rounded-[3px] text-[12px]">
                                                {isSavingMargin ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                                                Lưu thay đổi
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </>
                        )}

                        {hasPermission(P.PRODUCT_CREATE) && (
                            <Button
                                onClick={() => router.push("/admin/products/add")}
                                className="h-[38px] rounded-md bg-blue-600 px-4 text-[13px] font-medium text-white shadow-sm hover:bg-blue-700"
                            >
                                <Plus size={15} className="mr-2" />
                                Thêm sản phẩm
                            </Button>
                        )}
                    </div>
                </div>

                <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
                {isLoading ? (
                    <AdminDataSyncLoader />
                ) : (
                    <>
                        {viewMode === "product" ? (
                            <AdminProductTable
                                products={paginatedProducts}
                                canViewImportPrice={canViewImportPrice}
                                currentPage={currentPage}
                                pageSize={pageSize}
                                onDelete={handleDelete}
                                onEdit={handleEdit}
                                onDisable={handleDisable}
                                onEnable={handleEnable}
                            />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[980px] border-collapse table-fixed">
                                    <colgroup>
                                        <col className="w-[5%]" />
                                        <col className="w-[5%]" />
                                        <col className="w-[15%]" />
                                        <col className="w-[30%]" />
                                        <col className="w-[20%]" />
                                        <col className="w-[8%]" />
                                        <col className="w-[10%]" />
                                        <col className="w-[7%]" />
                                    </colgroup>
                                    <thead>
                                    <tr className="bg-[#f0f0f0] border-b border-[#ccc]">
                                        <th className="p-2 text-center text-[10px] font-semibold text-[#1f1f1f]">Stt</th>
                                        <th className="p-2 text-center text-[10px] font-semibold text-[#1f1f1f]">Ảnh SKU</th>
                                        <th className="p-2 text-left text-[10px] font-semibold text-[#1f1f1f]">SKU / Barcode</th>
                                        <th className="p-2 text-left text-[10px] font-semibold text-[#1f1f1f]">Sản phẩm</th>
                                        <th className="p-2 text-left text-[10px] font-semibold text-[#1f1f1f]">Thương hiệu</th>
                                        <th className="p-2 text-center text-[10px] font-semibold text-[#1f1f1f]">Tồn kho</th>
                                        <th className="p-2 text-center text-[10px] font-semibold text-[#1f1f1f]">Trạng thái SKU</th>
                                        <th className="p-2 text-right text-[10px] font-semibold text-[#1f1f1f] pr-4">Thao tác</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {paginatedVariants.map((variant, index) => {
                                        const stt = currentPage * pageSize + index + 1;
                                        const skuStatusLabel = variant.variantStatus === "ACTIVE" ? "Đang bán" : variant.variantStatus || "Không rõ";
                                        const skuImageUrl = resolveImageUrl(variant.imageUrl, "/placeholder.svg");
                                        return (
                                            <tr key={`${variant.variantId}-${variant.sku}-${index}`} className="border-b border-[#eee] hover:bg-[#f8fbff] transition-colors">
                                                <td className="p-2 text-center text-[11px] font-bold text-slate-500">{stt}</td>
                                                <td className="p-2">
                                                    <div className="w-10 h-10 mx-auto bg-white border border-[#ddd] rounded-[3px] overflow-hidden flex items-center justify-center">
                                                        <img
                                                            src={skuImageUrl}
                                                            alt={variant.sku || "SKU"}
                                                            className="w-full h-full object-cover"
                                                            onError={(event) => {
                                                                event.currentTarget.src = "/placeholder.svg";
                                                            }}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-2">
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="block truncate text-[11px] font-bold text-blue-700 font-mono" title={variant.sku || ""}>{variant.sku || "—"}</span>
                                                        <span className="block truncate text-[10px] text-slate-400 font-mono" title={variant.barcode || ""}>{variant.barcode || "Không có barcode"}</span>
                                                    </div>
                                                </td>
                                                <td className="p-2">
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="block truncate text-[11px] font-bold text-[#1f1f1f]" title={variant.productName}>{variant.productName}</span>
                                                        <span className="block truncate text-[10px] text-slate-400" title={variant.categoryName || ""}>{variant.categoryName || "—"}</span>
                                                    </div>
                                                </td>
                                                <td className="p-2">
                                                    <span className="block truncate text-[11px] font-normal text-slate-500" title={variant.brandName || ""}>
                                                        {cleanSupplierName(variant.brandName) || "—"}
                                                    </span>
                                                </td>
                                                <td className="p-2 text-center text-[11px] font-bold text-slate-700">{variant.quantity.toLocaleString("vi-VN")}</td>
                                                <td className="p-2 text-center">
                                                        <span className={cn(
                                                            "text-[10px] font-semibold px-1.5 py-0.5 rounded border",
                                                            variant.variantStatus === "ACTIVE"
                                                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                                : "bg-slate-100 text-slate-400 border-slate-200"
                                                        )}>
                                                            {skuStatusLabel}
                                                        </span>
                                                </td>
                                                <td className="p-2 text-right pr-4">
                                                    {hasPermission(P.PRODUCT_UPDATE) ? (
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 hover:bg-slate-100"
                                                                onClick={() => handleEdit(variant.productId)}
                                                                title="Chỉnh sửa"
                                                            >
                                                                <Pencil size={14} className="text-blue-600" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-300">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {totalItems > 0 && (
                            <div className="flex flex-col gap-3 border-t border-slate-100 bg-[#fcfcfc] px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
                                <p className="text-[11px] text-slate-500">
                                    Hiển thị {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalItems)} trong {totalItems}
                                </p>
                                {effectiveTotalPages > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-[11px] font-medium bg-white"
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={currentPage === 0}
                                        >
                                            ← Trước
                                        </Button>
                                        <span className="min-w-[50px] text-center text-[11px] text-slate-500 font-medium">
                                            {currentPage + 1} / {effectiveTotalPages}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-[11px] font-medium bg-white"
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            disabled={currentPage >= effectiveTotalPages - 1}
                                        >
                                            Sau →
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            {isDeleting && (
                <div className="fixed top-5 right-5 z-[9999] flex items-center gap-3 rounded-xl border border-slate-100 bg-white/95 backdrop-blur px-5 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300 border-l-4 border-l-red-500">
                    <Loader2 className="h-5 w-5 animate-spin text-red-500" />
                    <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-slate-800">Đang thực hiện</span>
                        <span className="text-[11px] text-slate-500">Đang xóa sản phẩm khỏi hệ thống...</span>
                    </div>
                </div>
            )}
                </div>
            </div>
        </div>
    );
}

