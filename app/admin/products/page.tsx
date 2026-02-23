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

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await ProductService.getAll();
      
      // Map API data to Table format
      const mappedProducts = data.map((p: any) => ({
        id: p.id,
        sku: p.baseSku,
        name: p.name,
        category: p.categoryName,
        brand: p.brandName,
        origin: p.origin || "N/A",
        priceRange: "---", // Will be calculated if variants are available
        totalSold: 0,
        inventory: p.variants?.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0) || 0,
        available: p.variants?.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0) || 0,
        createdAt: "---",
        status: p.status === "ACTIVE" ? "Đang kinh doanh" : "Ngừng kinh doanh",
        image: p.imageUrls?.[0] || "",
        imageCount: p.imageUrls?.length || 0,
        techSpecs: [],
        variants: (p.variants || []).map((v: any) => ({
          id: String(v.id || v.sku),
          formulation: v.formulation || "N/A",
          packaging: v.packaging || "N/A",
          weight: "---",
          unit: v.unit || "N/A",
          price: v.price?.toLocaleString() + " ₫" || "0 ₫",
          costPrice: "---",
          wholesalePrice: v.wholesalePrice?.toLocaleString() + " ₫" || "0 ₫",
          inventory: v.quantity || 0,
          available: v.quantity || 0,
          sold: 0,
          barcode: v.barcode || "",
          image: null,
        })),
      }));

      setProducts(mappedProducts);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Không thể tải danh sách sản phẩm.");
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const categoryFilters = [
    { label: "Tất cả danh mục", value: "all" },
    { label: "Thuốc & Chế phẩm", value: "thuoc" },
    { label: "Thức ăn", value: "thuc-an" },
  ];

  const statusFilters = [
    { label: "Đang kinh doanh", value: "active" },
    { label: "Ngừng kinh doanh", value: "inactive" },
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
          filter1Options={categoryFilters}
          filter2Placeholder="Trạng thái"
          filter2Options={statusFilters}
          onRefresh={fetchProducts}
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
