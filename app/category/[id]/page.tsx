"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import axios from "axios";
import {
  Filter, List, X, SlidersHorizontal, Loader2, PackageX
} from "lucide-react";
import ProductCard from "@/components/ui/product-card";
import { ProductListItem } from "@/app/types/product.schema";

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
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [currentCategoryName, setCurrentCategoryName] = useState("Tất cả sản phẩm");
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // State lọc giá
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [appliedRange, setAppliedRange] = useState<[number, number]>([0, 10000000]);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // 1. Tải danh mục
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("http://localhost:8080/api/categories");
        setAllCategories(res.data);
      } catch (error) {
        console.error("Lỗi danh mục:", error);
      }
    };
    fetchCategories();
  }, []);

  // 2. Tải sản phẩm
  useEffect(() => {
    const fetchProducts = async () => {
      if (!currentCategoryId) return;
      setIsLoadingProducts(true);
      try {
        const res = await axios.get(`http://localhost:8080/api/products?categoryId=${currentCategoryId}`);
        setProducts(res.data);
      } catch (error) {
        console.error("Lỗi sản phẩm:", error);
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [currentCategoryId]);

  // 3. Xử lý logic hiển thị Sidebar
  useEffect(() => {
    if (allCategories.length > 0) {
      const idNum = Number(currentCategoryId);
      const currentCat = allCategories.find((c) => c.id === idNum);
      if (currentCat) {
        setCurrentCategoryName(currentCat.name);
        const children = allCategories.filter((c) => c.parentId === idNum && c.status === "ACTIVE");
        setSubCategories(children.length === 0 && currentCat.parentId
          ? allCategories.filter((c) => c.parentId === currentCat.parentId && c.status === "ACTIVE")
          : children);
      }
    }
  }, [allCategories, currentCategoryId]);

  // --- XỬ LÝ LỌC GIÁ ---
  const handleInputChange = (val: string, index: 0 | 1) => {
    const num = parseInt(val.replace(/\D/g, "")) || 0;
    const newRange: [number, number] = [...priceRange];
    newRange[index] = num;
    setPriceRange(newRange);
  };

  const applyPriceFilter = () => {
    setAppliedRange(priceRange);
    setShowMobileFilter(false);
  };

  // Lọc sản phẩm trên Client
  const filteredProducts = useMemo(() => {
    return products.filter(prod => {
      // Kiểm tra xem có biến thể nào nằm trong khoảng giá đã áp dụng không
      return prod.variants.some(v => v.price >= appliedRange[0] && v.price <= appliedRange[1]);
    });
  }, [products, appliedRange]);

  // --- BIẾN JSX BỘ LỌC (Ổn định để tránh lỗi slider re-render) ---
  const filterContentHtml = (
    <div className="space-y-8">
      {/* Danh mục liên quan */}
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

      {/* Khoảng giá */}
      <div>
        <h6 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
          <Filter size={16} /> Khoảng Giá
        </h6>

        {/* Slider */}
        <div className="px-2 mb-6">
          <Slider
            range
            min={0}
            max={10000000}
            step={100000}
            value={priceRange}
            onChange={(val) => setPriceRange(val as [number, number])}
            trackStyle={[{ backgroundColor: "#0d9488" }]}
            handleStyle={[{ borderColor: "#0d9488", backgroundColor: "#fff" }, { borderColor: "#0d9488", backgroundColor: "#fff" }]}
            railStyle={{ backgroundColor: "#e5e7eb" }}
          />
        </div>

        {/* Ô nhập giá */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 uppercase font-bold">Từ</label>
            <div className="relative">
              <input
                type="text"
                value={priceRange[0].toLocaleString('vi-VN')}
                onChange={(e) => handleInputChange(e.target.value, 0)}
                className="w-full pl-2 pr-5 py-2 text-xs border rounded outline-none focus:border-teal-500"
              />
              <span className="absolute right-2 top-2 text-[10px] text-gray-400">₫</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 uppercase font-bold">Đến</label>
            <div className="relative">
              <input
                type="text"
                value={priceRange[1].toLocaleString('vi-VN')}
                onChange={(e) => handleInputChange(e.target.value, 1)}
                className="w-full pl-2 pr-5 py-2 text-xs border rounded outline-none focus:border-teal-500"
              />
              <span className="absolute right-2 top-2 text-[10px] text-gray-400">₫</span>
            </div>
          </div>
        </div>

        <button
          onClick={applyPriceFilter}
          className="w-full py-2.5 bg-teal-600 text-white text-xs font-bold rounded shadow-sm hover:bg-teal-700 active:scale-95 transition-all uppercase"
        >
          Áp dụng
        </button>
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
                {filteredProducts.map((prod) => {
                  const firstVariant = prod.variants?.[0];
                  return (
                    <ProductCard
                      key={prod.id}
                      id={prod.id}
                      name={prod.name}
                      category={prod.categoryName || "Sản phẩm"}
                      imageUrls={prod.imageUrls}
                      image={prod.imageUrls?.[0] || firstVariant?.imageUrl}
                      price={formatCurrency(firstVariant?.price)}
                      oldPrice={firstVariant?.costPrice ? formatCurrency(firstVariant.costPrice) : undefined}
                      sold={firstVariant?.quantity || 0}
                      rating={5}
                      reviewCount={0}
                    />
                  );
                })}
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