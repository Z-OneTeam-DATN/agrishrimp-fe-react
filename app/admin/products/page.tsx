"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AdminProductTable } from "@/components/admin/AdminProductTable";
import { ProductService } from "@/app/services/product.service";
import { PriceRoundingRule, SettingService } from "@/app/services/setting.service";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import { Loader2, ChevronLeft, ChevronRight, Settings, Percent, Save, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";
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
import { isAdminRole } from "@/lib/roles";

export default function ProductsPage() {
    const router = useRouter();

    const { user, isLoadingAuth } = useAuthStore();
    const isAdmin = isAdminRole(user?.role);

    // Hook phân quyền
    const { hasPermission } = usePermissions();

    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState<{label: string, value: string}[]>([]);
    const [brands, setBrands] = useState<string[]>([]);

    // 0. Kiểm tra quyền truy cập route
    useEffect(() => {
        if (!isLoadingAuth && !hasPermission(P.PRODUCT_VIEW)) {
            router.push("/admin/forbidden");
        }
    }, [isLoadingAuth, hasPermission, router]);

    // Filter states
    const [filters, setFilters] = useState({
        keyword: "",
        categoryId: "all",
        status: "all",
    });

    const [sort, setSort] = useState("id,desc");
    const [selectedBrand, setSelectedBrand] = useState("all");
    const [viewMode, setViewMode] = useState<"product" | "sku">("product");

    const [debouncedKeyword, setDebouncedKeyword] = useState("");

    // Phân trang
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 10;

    // State Cấu hình Lợi nhuận
    const [isSettingOpen, setIsSettingOpen] = useState(false);
    const [profitMargin, setProfitMargin] = useState("30");
    const [originalProfitMargin, setOriginalProfitMargin] = useState("30");
    const [roundingRule, setRoundingRule] = useState<PriceRoundingRule>("NONE");
    const [originalRoundingRule, setOriginalRoundingRule] = useState<PriceRoundingRule>("NONE");
    const [isSavingMargin, setIsSavingMargin] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(filters.keyword);
        }, 500);
        return () => clearTimeout(timer);
    }, [filters.keyword]);

    // Fetch categories & Profit Margin
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [data, brandData] = await Promise.all([
                    ProductService.getCategories(),
                    ProductService.getBrands(),
                ]);
                const mapped = [
                    { label: "Tất cả danh mục", value: "all" },
                    ...data.map((c: any) => ({ label: c.name, value: String(c.id) }))
                ];
                setCategories(mapped);
                setBrands(
                    Array.from(
                        new Set(
                            (Array.isArray(brandData) ? brandData : [])
                                .map((brand: any) =>
                                    typeof brand === "string" ? brand : brand?.name,
                                )
                                .filter((name: unknown): name is string =>
                                    typeof name === "string" && name.trim().length > 0,
                                ),
                        ),
                    ).sort((left, right) => left.localeCompare(right, "vi")),
                );

                if (isAdmin) {
                    const marginData = await SettingService.getProfitMargin();
                    if (marginData && marginData.margin) {
                        setProfitMargin(marginData.margin);
                        setOriginalProfitMargin(marginData.margin);
                    }
                    const ruleFromServer = marginData?.roundingRule || "NONE";
                    setRoundingRule(ruleFromServer);
                    setOriginalRoundingRule(ruleFromServer);
                }
            } catch (error) {
                console.error("Failed to fetch initial data:", error);
            }
        };
        fetchInitialData();
    }, [isAdmin]);

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
                brandName: p.brandName || "",
                origin: p.origin || "",
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
            const res = await ProductService.delete(id);
            // Nếu Backend trả về 200 OK
            if (res.success) {
                toast.success(res.message || "Đã xóa sản phẩm thành công.");
                fetchProducts();
            } else {
                toast.error(res.message);
            }
        } catch (error: any) {
            const errorMessage = getErrorMessage(error);
            toast.error(errorMessage);
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
            const res = await SettingService.updateProfitMargin(marginValue.toString(), roundingRule);
            toast.success(res.message || "Đã cập nhật cấu hình lợi nhuận!");
            setOriginalProfitMargin(marginValue.toString());
            const savedRule = (res.roundingRule || roundingRule) as PriceRoundingRule;
            setRoundingRule(savedRule);
            setOriginalRoundingRule(savedRule);
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
                selectedBrand === "all" || product.brandName === selectedBrand,
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
    const isMarginDirty = profitMargin !== originalProfitMargin || roundingRule !== originalRoundingRule;

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

    // Tránh render chớp giao diện (flickering) khi chưa check xong quyền
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

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                    {productOverviewCards.map((card) => (
                        <div
                            key={card.title}
                            className="rounded-[4px] border border-[#dcdcdc] bg-white p-3 shadow-sm"
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
                    ))}
                </div>

                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
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
                                    <SelectItem key={brand} value={brand} className="text-[13px]">
                                        {brand}
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

                    <div className="flex flex-wrap items-center justify-end gap-2">
                    {isAdmin && (
                        <Dialog open={isSettingOpen} onOpenChange={setIsSettingOpen}>
                            <DialogContent className="sm:max-w-[560px] rounded-[4px]">
                                <DialogHeader>
                                    <DialogTitle className="text-[16px] font-black uppercase tracking-tight flex items-center gap-2">
                                        <Percent size={18} className="text-emerald-600" /> Biên lợi nhuận (%)
                                    </DialogTitle>
                                    <DialogDescription className="text-[12px]">
                                        Tỷ lệ cộng thêm vào giá vốn lô hàng để ra giá bán niêm yết.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
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
                                <DialogFooter>
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
                    )}

                    {/* Chỉ show nút Thêm sản phẩm nếu có quyền */}
                    {hasPermission(P.PRODUCT_CREATE) && (
                        <Button
                            onClick={() => router.push("/admin/products/add")}
                            className="h-[38px] rounded-md bg-emerald-600 px-4 text-[13px] font-medium text-white shadow-sm hover:bg-emerald-700"
                        >
                            <Plus size={15} className="mr-2" />
                            Thêm sản phẩm
                        </Button>
                    )}
                    </div>
                </div>

                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
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

                    {isAdmin && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsSettingOpen(true)}
                            className="h-[38px] rounded-md border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-600 shadow-none"
                        >
                            <Settings size={15} className="mr-2" />
                            Cấu hình giá bán
                        </Button>
                    )}
                </div>

                <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
                {isLoading ? (
                    <AdminDataSyncLoader />
                ) : (
                    <>
                        {viewMode === "product" ? (
                            <AdminProductTable
                                products={paginatedProducts}
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
                                    <thead>
                                    <tr className="bg-[#f0f0f0] border-b border-[#ccc]">
                                        <th className="w-[56px] p-2 text-center text-[11px] font-bold uppercase text-[#1f1f1f]">STT</th>
                                        <th className="w-[74px] p-2 text-center text-[11px] font-bold uppercase text-[#1f1f1f]">Ảnh SKU</th>
                                        <th className="w-[220px] p-2 text-left text-[11px] font-bold uppercase text-[#1f1f1f]">SKU / Barcode</th>
                                        <th className="p-2 text-left text-[11px] font-bold uppercase text-[#1f1f1f]">Sản phẩm</th>
                                        <th className="w-[150px] p-2 text-left text-[11px] font-bold uppercase text-[#1f1f1f]">Thương hiệu</th>
                                        <th className="w-[100px] p-2 text-center text-[11px] font-bold uppercase text-[#1f1f1f]">Tồn kho</th>
                                        <th className="w-[130px] p-2 text-center text-[11px] font-bold uppercase text-[#1f1f1f]">Trạng thái SKU</th>
                                        <th className="w-[110px] p-2 text-right text-[11px] font-bold uppercase text-[#1f1f1f] pr-4">Hành động</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {paginatedVariants.map((variant, index) => {
                                        const stt = currentPage * pageSize + index + 1;
                                        const skuStatusLabel = variant.variantStatus === "ACTIVE" ? "Đang bán" : variant.variantStatus || "Không rõ";
                                        return (
                                            <tr key={`${variant.variantId}-${variant.sku}-${index}`} className="border-b border-[#eee] hover:bg-[#f8fbff] transition-colors">
                                                <td className="p-2 text-center text-[12px] font-bold text-slate-500">{stt}</td>
                                                <td className="p-2">
                                                    <div className="w-10 h-10 mx-auto bg-white border border-[#ddd] rounded-[3px] overflow-hidden flex items-center justify-center">
                                                        {variant.imageUrl ? (
                                                            <img src={variant.imageUrl} alt={variant.sku} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-[9px] text-slate-300 font-bold">NO IMG</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[12px] font-black text-blue-700 font-mono">{variant.sku || "—"}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono">{variant.barcode || "Không có barcode"}</span>
                                                    </div>
                                                </td>
                                                <td className="p-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[12px] font-bold text-[#1f1f1f]">{variant.productName}</span>
                                                        <span className="text-[10px] text-slate-400">{variant.categoryName || "—"}</span>
                                                    </div>
                                                </td>
                                                <td className="p-2 text-[11px] font-bold text-slate-500 uppercase">{variant.brandName || "—"}</td>
                                                <td className="p-2 text-center text-[12px] font-black text-slate-700">{variant.quantity.toLocaleString("vi-VN")}</td>
                                                <td className="p-2 text-center">
                                                        <span className={cn(
                                                            "text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase",
                                                            variant.variantStatus === "ACTIVE"
                                                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                                : "bg-slate-100 text-slate-400 border-slate-200"
                                                        )}>
                                                            {skuStatusLabel}
                                                        </span>
                                                </td>
                                                <td className="p-2 text-right pr-4">
                                                    {hasPermission(P.PRODUCT_UPDATE) ? (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 text-[10px] font-bold text-blue-600 hover:bg-blue-50"
                                                            onClick={() => handleEdit(variant.productId)}
                                                        >
                                                            Sửa SP
                                                        </Button>
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
                            <div className="flex items-center justify-between px-5 py-3 border-t border-[#eee] bg-[#f8f9fa]">
                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">
                                    {viewMode === "product"
                                        ? `Đang hiển thị ${paginatedProducts.length} / Tổng số ${sortedProducts.length} sản phẩm (${totalSkuCount} SKU)`
                                        : `Đang hiển thị ${paginatedVariants.length} / Tổng số ${sortedVariants.length} SKU thuộc ${sortedProducts.length} sản phẩm`}
                                </p>
                                {effectiveTotalPages > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={currentPage === 0}
                                            className="h-7 px-2 text-[11px] font-bold bg-white border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
                                        >
                                            <ChevronLeft size={14} className="mr-1" /> Trước
                                        </Button>

                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: effectiveTotalPages }).map((_, index) => {
                                                if (index === 0 || index === effectiveTotalPages - 1 || (index >= currentPage - 1 && index <= currentPage + 1)) {
                                                    return (
                                                        <Button
                                                            key={index}
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setCurrentPage(index)}
                                                            className={cn(
                                                                "h-7 min-w-[28px] px-2 p-0 text-[11px] font-bold shadow-sm transition-all",
                                                                currentPage === index
                                                                    ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 hover:text-white"
                                                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                                            )}
                                                        >
                                                            {index + 1}
                                                        </Button>
                                                    );
                                                }
                                                if (index === currentPage - 2 || index === currentPage + 2) {
                                                    return <span key={index} className="text-slate-400 text-[10px] px-1 tracking-widest">...</span>;
                                                }
                                                return null;
                                            })}
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            disabled={currentPage >= effectiveTotalPages - 1}
                                            className="h-7 px-2 text-[11px] font-bold bg-white border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
                                        >
                                            Sau <ChevronRight size={14} className="ml-1" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
                </div>
            </div>
        </div>
    );
}
