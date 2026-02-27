"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import {
  Filter, List, X, SlidersHorizontal, Loader2, PackageX, LayoutGrid
} from "lucide-react";
import ProductCard from "@/components/ui/product-card";
import { PublicProductListItem } from "@/app/types/product.schema";
import { getPublicCategories } from "@/app/services/CategoryService";
import { PublicProductService } from "@/app/services/publicProduct.service";
import { CategoryDTO } from "@/app/types/category.type";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export default function CategoryPage() {
  const router = useRouter();
  const params = useParams();
  const currentCategoryId = params.id as string;

  // --- STATE ---
  const [allCategories, setAllCategories] = useState<CategoryDTO[]>([]);
  const [subCategories, setSubCategories] = useState<CategoryDTO[]>([]);
  const [currentCategoryName, setCurrentCategoryName] = useState("Tất cả sản phẩm");
  const [products, setProducts] = useState<PublicProductListItem[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // 1. Tải toàn bộ danh mục (Chỉ chạy 1 lần)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getPublicCategories();
        setAllCategories(data);
      } catch (error) {
        console.error("Lỗi danh mục:", error);
      }
    };
    fetchCategories();
  }, []);

  // 2. Logic xử lý Tải sản phẩm & Hiển thị Sidebar (Chạy khi có ID hoặc Danh mục thay đổi)
  useEffect(() => {
    const fetchProductsAndSetSidebar = async () => {
      if (!currentCategoryId || allCategories.length === 0) return;

      const idNum = Number(currentCategoryId);
      if (isNaN(idNum)) {
        console.error("Invalid category ID, redirecting...");
        router.push("/san-pham");
        return;
      }

      // --- PHÂN TÍCH DANH MỤC ---
      const currentCat = allCategories.find((c) => c.id === idNum);
      let idsToFetch = [idNum]; // Mặc định là sẽ lấy sản phẩm của ID hiện tại

      if (currentCat) {
        setCurrentCategoryName(currentCat.name);

        // Tìm xem nó có danh mục con không
        const children = allCategories.filter((c) => c.parentId === idNum && c.status === "ACTIVE");

        if (children.length > 0) {
          // TRƯỜNG HỢP 1: ĐANG Ở DANH MỤC CHA
          // Gắn menu bên trái là các danh mục con
          setSubCategories(children);
          // Gom ID của cha và TẤT CẢ các con để gọi API chung
          idsToFetch = [idNum, ...children.map(c => c.id)];
        } else if (currentCat.parentId) {
          // TRƯỜNG HỢP 2: ĐANG Ở DANH MỤC CON
          // Gắn menu bên trái là các danh mục "anh em" (cùng cha) để khách dễ bấm chuyển đổi
          const siblings = allCategories.filter((c) => c.parentId === currentCat.parentId && c.status === "ACTIVE");
          setSubCategories(siblings);
          // Đang ở danh mục con thì chỉ lấy sản phẩm của riêng nó thôi
          idsToFetch = [idNum];
        } else {
          // Danh mục độc lập (Không cha, không con)
          setSubCategories([]);
        }
      }

      // --- TIẾN HÀNH FETCH SẢN PHẨM ---
      setIsLoadingProducts(true);
      try {
        // Tạo mảng các request gọi API cho từng ID trong mảng idsToFetch
        const promises = idsToFetch.map(id => PublicProductService.getByCategory(id));
        const results = await Promise.all(promises);

        // Gộp kết quả lại thành 1 mảng phẳng và LỌC TRÙNG LẶP (Dựa vào ID sản phẩm)
        const mergedProducts: PublicProductListItem[] = [];
        const seenIds = new Set();

        results.flat().forEach((p) => {
          if (p && !seenIds.has(p.id)) {
            seenIds.add(p.id);
            mergedProducts.push(p);
          }
        });

        setProducts(mergedProducts);
      } catch (error) {
        console.error("Lỗi sản phẩm:", error);
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProductsAndSetSidebar();
  }, [currentCategoryId, allCategories, router]);

  const filteredProducts = useMemo(() => {
    return products;
  }, [products]);

  // --- BIẾN JSX BỘ LỌC TÌM KIẾM ---
  const filterContentHtml = (
    <div className="space-y-8">
      <div>
        <h6 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
          <List size={16} /> Danh Mục Liên Quan
        </h6>
        <ul className="space-y-2">
          {subCategories.length > 0 ? (
            subCategories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => router.push(`/category/${cat.id}`)}
                  className={`w-full text-left text-sm flex items-center justify-between group py-1 ${
                    Number(currentCategoryId) === cat.id ? "text-teal-600 font-bold" : "text-gray-600 hover:text-teal-600"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${Number(currentCategoryId) === cat.id ? "bg-teal-600" : "bg-gray-300 group-hover:bg-teal-400"}`}></span>
                    {cat.name}
                  </span>
                </button>
              </li>
            ))
          ) : (
            <p className="text-xs text-gray-400 italic">Không có danh mục con</p>
          )}
        </ul>
      </div>

      <hr className="border-gray-100" />

      <div>
        <h6 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
          <LayoutGrid size={16} /> Tất Cả Danh Mục
        </h6>
        <ul className="space-y-2">
          {allCategories
            .filter(c => c.parentId && c.status === "ACTIVE" && !subCategories.some(sc => sc.id === c.id))
            .map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => router.push(`/category/${cat.id}`)}
                className={`w-full text-left text-sm flex items-center justify-between group py-1 ${
                  Number(currentCategoryId) === cat.id ? "text-teal-600 font-bold" : "text-gray-600 hover:text-teal-600"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${Number(currentCategoryId) === cat.id ? "bg-teal-600" : "bg-gray-300 group-hover:bg-teal-400"}`}></span>
                  {cat.name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      {/* Mobile Sidebar Overlay */}
      {showMobileFilter && <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowMobileFilter(false)} />}
      <div className={`fixed inset-y-0 left-0 w-[85%] max-w-xs bg-white z-[51] shadow-2xl transform transition-transform duration-300 ${showMobileFilter ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 flex items-center justify-between border-b bg-gray-50">
          <h5 className="font-bold text-gray-800 uppercase text-sm">Bộ lọc sản phẩm</h5>
          <button onClick={() => setShowMobileFilter(false)}><X size={20} /></button>
        </div>
        <div className="p-5 overflow-y-auto h-full pb-24">{filterContentHtml}</div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <nav className="text-sm text-gray-500 flex items-center gap-2">
          <Link href="/" className="hover:text-teal-600">Trang chủ</Link>
          <span>/</span>
          <span className="font-bold text-gray-800 truncate">{currentCategoryName}</span>
        </nav>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="hidden lg:block lg:col-span-1">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 sticky top-24">
              {filterContentHtml}
            </div>
          </aside>

          <main className="lg:col-span-3">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex justify-between items-center">
              <h1 className="text-xl font-bold text-gray-800">
                {currentCategoryName}
                <span className="ml-2 text-sm font-normal text-gray-400">({filteredProducts.length} kết quả)</span>
              </h1>
              <button onClick={() => setShowMobileFilter(true)} className="lg:hidden bg-teal-50 text-teal-700 px-4 py-2 rounded-full font-bold flex items-center gap-2 border border-teal-100">
                <SlidersHorizontal size={16} /> Lọc
              </button>
            </div>

            {isLoadingProducts ? (
              <div className="flex justify-center items-center py-20 bg-white rounded-xl border border-gray-100">
                <Loader2 className="animate-spin text-teal-600" size={32} />
                <span className="ml-3 text-gray-500 font-medium">Đang tìm sản phẩm...</span>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {filteredProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod as any}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 text-center px-4">
                <PackageX className="text-gray-300 mb-4" size={64} />
                <h3 className="text-lg font-bold text-gray-700 mb-2">Không tìm thấy sản phẩm phù hợp</h3>
                <p className="text-sm text-gray-500 italic">Vui lòng điều chỉnh lại khoảng giá hoặc chọn danh mục khác.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}