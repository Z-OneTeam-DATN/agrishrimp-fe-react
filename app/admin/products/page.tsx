"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminProductTable } from "@/components/admin/AdminProductTable";
import { ProductService } from "@/app/services/product.service";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<{label: string, value: string}[]>([]);

  // Filter states
  const [filters, setFilters] = useState({
    keyword: "",
    categoryId: "all",
    status: "ACTIVE", // Default according to specification
  });

  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  // Debounce logic for keyword
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(filters.keyword);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.keyword]);

  // Fetch categories for filter
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await ProductService.getCategories();
        const mapped = [
          { label: "Tất cả danh mục", value: "all" },
          ...data.map((c: any) => ({ label: c.name, value: String(c.id) }))
        ];
        setCategories(mapped);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const apiParams: any = {};
      if (debouncedKeyword) apiParams.keyword = debouncedKeyword;
      if (filters.categoryId !== "all") apiParams.categoryId = filters.categoryId;
      if (filters.status !== "all") apiParams.status = filters.status;

      const data = await ProductService.getAll(apiParams);
      
      // Map API data — giữ đúng tên trường từ BE
      const mappedProducts = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug || "",
        baseSku: p.baseSku || "",
        categoryName: p.categoryName || "",
        brandName: p.brandName || "",
        origin: p.origin || "",
        status: p.status,                        // raw: ACTIVE | INACTIVE | DRAFT
        image: p.imageUrls?.[0] || "",
        imageUrls: p.imageUrls || [],
        inventory: (p.variants || []).reduce((sum: number, v: any) => sum + (v.quantity || 0), 0),
        variants: (p.variants || []).map((v: any) => ({
          id: v.id,
          sku: v.sku || "",
          barcode: v.barcode || "",
          costPrice: v.costPrice ?? null,
          price: v.price ?? 0,
          wholesalePrice: v.wholesalePrice ?? 0,
          quantity: v.quantity || 0,
          shippingWeight: v.shippingWeight ?? null,
          imageUrl: v.imageUrl || null,
          status: v.status || "",
          attributeValues: v.attributeValues || [],
          unitConversions: v.unitConversions || [],
        })),
      }));

      setProducts(mappedProducts);
    } catch (error) {
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
      const res = error.response?.data;
      if (error.response?.status === 409) {
        toast.error(
          <div className="space-y-1">
            <p className="font-bold text-[13px]">{res?.message || "Không thể xóa sản phẩm"}</p>
            <p className="text-[11px] opacity-90">Gợi ý: Hãy sử dụng tính năng "Ngừng kinh doanh" để ẩn sản phẩm này.</p>
          </div>,
          { duration: 6000 }
        );
      } else {
        toast.error(res?.message || "Lỗi khi xóa sản phẩm.");
      }
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
      const res = error.response?.data;
      toast.error(res?.message || "Lỗi khi cập nhật trạng thái sản phẩm.");
    }
  };

  const handleEdit = (id: number) => {
    // router.push(`/admin/products/${id}/edit`);
    toast.info(`Chức năng chỉnh sửa sản phẩm ${id} đang được phát triển.`);
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const statusFilters = [
    { label: "Tất cả trạng thái", value: "all" },
    { label: "Đang kinh doanh", value: "ACTIVE" },
    { label: "Ngừng kinh doanh", value: "INACTIVE" },
  ];

  return (
    <div className="space-y-3">
      <AdminPageHeader
        title="Hệ thống sản phẩm"
        addBtnLabel="Thêm sản phẩm"
        addBtnHref="/admin/products/add"
      />

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
        <AdminSearchFilter
          placeholder="Tìm tên sản phẩm, thương hiệu, mã SKU..."
          filter1Placeholder="Tất cả danh mục"
          filter1Options={categories}
          onFilter1Change={(val) => setFilters(f => ({ ...f, categoryId: val }))}
          filter2Placeholder="Trạng thái"
          filter2Options={statusFilters}
          defaultFilter2Value="ACTIVE"
          onFilter2Change={(val) => setFilters(f => ({ ...f, status: val }))}
          onSearch={(val) => setFilters(f => ({ ...f, keyword: val }))}
          onRefresh={fetchProducts}
          sortOptions={[]}
        />
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            <p className="text-sm text-slate-500 font-medium">Đang tải danh sách sản phẩm...</p>
          </div>
        ) : (
          <AdminProductTable 
            products={products} 
            onDelete={handleDelete}
            onEdit={handleEdit}
            onDisable={handleDisable}
          />
        )}
      </div>
    </div>
  );
}
