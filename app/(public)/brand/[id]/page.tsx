"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Loader2, PackageX, LayoutGrid, ChevronRight
} from "lucide-react";
import ProductCard from "@/components/ui/product-card";
import LoadMoreButton from "@/components/ui/load-more-button";
import { PublicProductListItem } from "@/app/types/product.schema";
import { getPublicBrands } from "@/app/services/brand.service";
import { PublicProductService } from "@/app/services/publicProduct.service";
import { BrandDTO } from "@/app/types/brand.type";
import { useResponsiveColumns } from "@/hooks/useResponsiveColumns";

const ROWS_PER_STEP = 3;

export default function BrandPage() {
  const params = useParams();
  const currentBrandId = params.id as string;

  // --- STATE ---
  const [allBrands, setAllBrands] = useState<BrandDTO[]>([]);
  const [currentBrandName, setCurrentBrandName] = useState("Thương hiệu");
  const [products, setProducts] = useState<PublicProductListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleRows, setVisibleRows] = useState(ROWS_PER_STEP);
  const gridColumns = useResponsiveColumns({
    defaultColumns: 2,
    mdColumns: 3,
    lgColumns: 4,
  });

  // 1. Tải danh sách tất cả thương hiệu để hiển thị sidebar
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const data = await getPublicBrands();
        setAllBrands(data);
        
        // Cập nhật tên thương hiệu hiện tại
        const brand = data.find(b => b.id.toString() === currentBrandId);
        if (brand) {
          setCurrentBrandName(brand.name);
        }
      } catch (error) {
        console.error("Lỗi tải thương hiệu:", error);
      }
    };
    fetchBrands();
  }, [currentBrandId]);

  // 2. Tải sản phẩm của thương hiệu hiện tại
  useEffect(() => {
    const fetchProducts = async () => {
      if (!currentBrandId) return;
      
      setIsLoading(true);
      try {
        const data = await PublicProductService.getByBrand(currentBrandId);
        setProducts(data || []);
      } catch (error) {
        console.error("Lỗi tải sản phẩm theo thương hiệu:", error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [currentBrandId]);

  useEffect(() => {
    setVisibleRows(ROWS_PER_STEP);
  }, [currentBrandId, products.length]);

  const visibleCount = visibleRows * gridColumns;
  const visibleProducts = useMemo(
    () => products.slice(0, visibleCount),
    [products, visibleCount]
  );

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-12">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex mb-6 text-sm text-gray-500 items-center">
          <Link href="/" className="hover:text-[#1965a2] transition-colors">Trang chủ</Link>
          <ChevronRight size={14} className="mx-2" />
          <Link href="/brands" className="hover:text-[#1965a2] transition-colors">Thương hiệu</Link>
          <ChevronRight size={14} className="mx-2" />
          <span className="font-bold text-gray-800">{currentBrandName}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 sticky top-24">
              <h6 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
                <LayoutGrid size={16} className="text-[#1965a2]" /> Các Thương Hiệu Khác
              </h6>
              <ul className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {allBrands.map((brand) => (
                  <li key={brand.id}>
                    <Link
                      href={`/brand/${brand.id}`}
                      className={`text-[13px] flex items-center gap-3 group py-2 px-3 rounded-xl transition-all ${
                        currentBrandId === brand.id.toString() 
                          ? "bg-blue-50 text-blue-700 font-bold border border-blue-100 shadow-sm" 
                          : "text-gray-600 hover:bg-gray-50 hover:text-blue-600 border border-transparent"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden border ${
                        currentBrandId === brand.id.toString() ? "bg-white border-blue-200" : "bg-gray-50 border-gray-100 group-hover:bg-white transition-colors"
                      }`}>
                        {brand.logoUrl ? (
                          <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center text-[10px] font-black ${
                            currentBrandId === brand.id.toString() ? "text-blue-300" : "text-gray-300 group-hover:text-blue-200"
                          }`}>
                            {brand.name[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="truncate flex-1">{brand.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <span className="bg-[#1965a2] w-2 h-8 rounded-full"></span>
                {currentBrandName}
                <span className="ml-3 text-base font-normal text-gray-400">({products.length} sản phẩm)</span>
              </h1>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-gray-100 shadow-sm">
                <Loader2 className="animate-spin text-[#1965a2] mb-4" size={40} />
                <span className="text-gray-500 font-medium">Đang tải danh sách sản phẩm...</span>
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {visibleProducts.map((prod) => (
                    <ProductCard key={prod.id} product={prod} />
                  ))}
                </div>

                {visibleProducts.length < products.length && (
                  <LoadMoreButton
                    onClick={() => setVisibleRows((prev) => prev + ROWS_PER_STEP)}
                  />
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-dashed border-gray-200 text-center px-4">
                <PackageX className="text-gray-300 mb-4" size={64} />
                <h3 className="text-xl font-bold text-gray-700 mb-2">Chưa có sản phẩm nào</h3>
                <p className="text-gray-500">Thương hiệu {currentBrandName} hiện chưa có sản phẩm nào được đăng bán.</p>
                <Link href="/store" className="mt-6 text-[#1965a2] font-bold hover:underline flex items-center gap-1">
                  Xem các sản phẩm khác <ChevronRight size={16} />
                </Link>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

