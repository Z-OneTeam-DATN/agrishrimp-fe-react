"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminProductTable } from "@/components/admin/AdminProductTable";
import { ProductService } from "@/app/services/product.service";
import { SettingService } from "@/app/services/setting.service";
import { toast } from "sonner";
import { Loader2, ChevronLeft, ChevronRight, Settings, Percent, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";

export default function ProductsPage() {
    const router = useRouter();

    const { user, isLoadingAuth } = useAuthStore();
    const isAdmin = user?.role?.slug === "ADMIN";

    // Hook phân quyền
    const { hasPermission } = usePermissions();

    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState<{label: string, value: string}[]>([]);

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
        status: "ACTIVE", // Default theo specification
    });

    const [debouncedKeyword, setDebouncedKeyword] = useState("");

    // Phân trang
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 5;

    // State Cấu hình Lợi nhuận
    const [isSettingOpen, setIsSettingOpen] = useState(false);
    const [profitMargin, setProfitMargin] = useState("30");
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
                const data = await ProductService.getCategories();
                const mapped = [
                    { label: "Tất cả danh mục", value: "all" },
                    ...data.map((c: any) => ({ label: c.name, value: String(c.id) }))
                ];
                setCategories(mapped);

                if (isAdmin) {
                    const marginData = await SettingService.getProfitMargin();
                    if (marginData && marginData.margin) {
                        setProfitMargin(marginData.margin);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch initial data:", error);
            }
        };
        fetchInitialData();
    }, [isAdmin]);

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
            if (res.success) {
                toast.success(res.message || "Đã xóa sản phẩm thành công.");
                fetchProducts();
            } else {
                toast.error(res.message);
            }
        } catch (error: any) {
            console.error("Failed to delete product:", error);
            toast.error("Lỗi khi xóa sản phẩm.");
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
            console.error("Failed to disable product:", error);
            toast.error("Lỗi khi cập nhật trạng thái.");
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
            const res = await SettingService.updateProfitMargin(marginValue.toString());
            toast.success(res.message || "Đã cập nhật cấu hình lợi nhuận!");
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

    const totalPages = Math.ceil(products.length / pageSize);
    const currentProducts = products.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

    // Tránh render chớp giao diện (flickering) khi chưa check xong quyền
    if (isLoadingAuth) {
        return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-slate-400 w-8 h-8" /></div>;
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-[#dcdcdc] rounded-[4px] shadow-sm">
                <div>
                    <h1 className="text-[18px] font-black uppercase text-[#1f1f1f] tracking-tight">Hệ thống sản phẩm</h1>
                    <p className="text-[12px] text-slate-500 font-medium mt-1">Quản lý danh sách và biến thể hàng hóa</p>
                </div>
                <div className="flex items-center gap-3">
                    {isAdmin && (
                        <Dialog open={isSettingOpen} onOpenChange={setIsSettingOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="h-[38px] text-[12px] font-bold border-[#ccc] rounded-[3px]">
                                    <Settings size={16} className="mr-2" /> Cấu hình Giá Bán
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] rounded-[4px]">
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
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="1"
                                            value={profitMargin}
                                            onChange={(e) => setProfitMargin(e.target.value)}
                                            className="h-[45px] text-[16px] font-black pl-4 pr-10 rounded-[3px]"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsSettingOpen(false)} className="rounded-[3px] text-[12px]">Hủy</Button>
                                    <Button onClick={handleSaveMargin} disabled={isSavingMargin} className="bg-emerald-600 text-white rounded-[3px] text-[12px]">
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
                            className="h-[38px] text-[12px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-[3px] uppercase px-5"
                        >
                            + Thêm sản phẩm
                        </Button>
                    )}
                </div>
            </div>

            <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-sm overflow-hidden mb-8">
                <AdminSearchFilter
                    placeholder="Tìm tên sản phẩm, mã SKU..."
                    filter1Placeholder="Danh mục"
                    filter1Options={categories}
                    onFilter1Change={(val) => setFilters(f => ({ ...f, categoryId: val }))}
                    filter2Placeholder="Trạng thái"
                    filter2Options={[
                        { label: "Tất cả trạng thái", value: "all" },
                        { label: "Đang kinh doanh", value: "ACTIVE" },
                        { label: "Ngừng kinh doanh", value: "INACTIVE" },
                    ]}
                    defaultFilter2Value="ACTIVE"
                    onFilter2Change={(val) => setFilters(f => ({ ...f, status: val }))}
                    onSearch={(val) => setFilters(f => ({ ...f, keyword: val }))}
                    onRefresh={fetchProducts}
                />

                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                        <p className="text-sm text-slate-500 font-medium">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <>
                        <AdminProductTable
                            products={currentProducts}
                            currentPage={currentPage}
                            pageSize={pageSize}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            onDisable={handleDisable}
                        />

                        {products.length > 0 && (
                            <div className="flex items-center justify-between px-5 py-3 border-t border-[#eee] bg-[#f8f9fa]">
                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">
                                    Đang hiển thị {currentProducts.length} / Tổng số {products.length} kết quả
                                </p>
                                {totalPages > 0 && (
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
                                            {Array.from({ length: totalPages }).map((_, index) => {
                                                if (index === 0 || index === totalPages - 1 || (index >= currentPage - 1 && index <= currentPage + 1)) {
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
                                            disabled={currentPage >= totalPages - 1}
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
    );
}