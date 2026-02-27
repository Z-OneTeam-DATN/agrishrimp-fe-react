"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  List, Loader2, PackageX, LayoutGrid, ChevronRight
} from "lucide-react";
import ProductCard from "@/components/ui/product-card";
import { PublicProductListItem } from "@/app/types/product.schema";
import { getPublicBrands } from "@/app/services/brand.service";
import { PublicProductService } from "@/app/services/publicProduct.service";
import { BrandDTO } from "@/app/types/brand.type";

export default function BrandPage() {
  const router = useRouter();
  const params = useParams();
  const currentBrandId = params.id as string;

  // --- STATE ---
  const [allBrands, setAllBrands] = useState<BrandDTO[]>([]);
  const [currentBrandName, setCurrentBrandName] = useState("Thương hiệu");
  const [products, setProducts] = useState<PublicProductListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-12">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex mb-6 text-sm text-gray-500 items-center">
          <Link href="/" className="hover:text-[#329965] transition-colors">Trang chủ</Link>
          <ChevronRight size={14} className="mx-2" />
          <Link href="/brands" className="hover:text-[#329965] transition-colors">Thương hiệu</Link>
          <ChevronRight size={14} className="mx-2" />
          <span className="font-bold text-gray-800">{currentBrandName}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 sticky top-24">
              <h6 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
                <LayoutGrid size={16} className="text-[#329965]" /> Các Thương Hiệu Khác
              </h6>
              <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {allBrands.map((brand) => (
                  <li key={brand.id}>
                    <Link
                      href={`/brand/${brand.id}`}
                      className={`text-sm flex items-center gap-2 group py-1.5 px-2 rounded-md transition-all ${
                        currentBrandId === brand.id.toString() 
                          ? "bg-green-50 text-[#329965] font-bold" 
                          : "text-gray-600 hover:bg-gray-50 hover:text-[#329965]"
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        currentBrandId === brand.id.toString() ? "bg-[#329965]" : "bg-gray-300 group-hover:bg-[#329965]"
                      }`}></div>
                      {brand.name}
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
                <span className="bg-[#329965] w-2 h-8 rounded-full"></span>
                {currentBrandName}
                <span className="ml-3 text-base font-normal text-gray-400">({products.length} sản phẩm)</span>
              </h1>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-gray-100 shadow-sm">
                <Loader2 className="animate-spin text-[#329965] mb-4" size={40} />
                <span className="text-gray-500 font-medium">Đang tải danh sách sản phẩm...</span>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-dashed border-gray-200 text-center px-4">
                <PackageX className="text-gray-300 mb-4" size={64} />
                <h3 className="text-xl font-bold text-gray-700 mb-2">Chưa có sản phẩm nào</h3>
                <p className="text-gray-500">Thương hiệu {currentBrandName} hiện chưa có sản phẩm nào được đăng bán.</p>
                <Link href="/store" className="mt-6 text-[#329965] font-bold hover:underline flex items-center gap-1">
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
