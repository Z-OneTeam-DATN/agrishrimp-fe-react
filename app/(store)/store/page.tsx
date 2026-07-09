"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import {
  ChevronDown,
  Filter,
  LayoutGrid,
  List,
  ChevronRight,
  Loader2,
} from "lucide-react";
import ProductCard, { ProductCardSkeleton } from "@/components/ui/product-card";
import StoreSidebar from "@/components/shop/StoreSidebar";
import StoreBanner from "@/components/site/SiteBanner_Store";
import { PublicProductService } from "@/app/services/publicProduct.service";
import { PublicProductListItem } from "@/app/types/product.schema";
import { getPublicCategories } from "@/app/services/CategoryService";
import { getPublicBrands } from "@/app/services/brand.service";
import { CategoryDTO } from "@/app/types/category.type";
import { BrandDTO } from "@/app/types/brand.type";

export default function StorePage() {
  const [products, setProducts] = useState<PublicProductListItem[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [brands, setBrands] = useState<BrandDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [minInput, setMinInput] = useState<number | "">(0);
  const [maxInput, setMaxInput] = useState<number | "">(10000000);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prodRes, catRes, brandRes] = await Promise.all([
          PublicProductService.getList({ size: 12 }),
          getPublicCategories(),
          getPublicBrands(),
        ]);
        setProducts(prodRes?.content ?? []);
        setTotalElements(prodRes?.totalElements ?? 0);
        setCategories(catRes);
        setBrands(brandRes);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSliderChange = (value: number | number[]) => {
    if (Array.isArray(value)) {
      setPriceRange([value[0], value[1]]);
      setMinInput(value[0]);
      setMaxInput(value[1]);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "min" | "max",
  ) => {
    let val = parseInt(e.target.value.replace(/\D/g, "")) || 0;
    if (val < 0) val = 0;
    if (type === "min") setMinInput(val);
    else setMaxInput(val);
  };

  const applyPriceFilter = () => {
    let min = typeof minInput === "number" ? minInput : 0;
    let max = typeof maxInput === "number" ? maxInput : 5000000;
    if (min > max) {
      const temp = min;
      min = max;
      max = temp;
    }
    setPriceRange([min, max]);
    setMinInput(min);
    setMaxInput(max);
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-12">
      <div className="container mx-auto px-4">
        <StoreBanner />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          <aside className="lg:col-span-3 hidden lg:block">
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 sticky top-24">
              <div className="mb-6">
                <h6 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
                  <List size={16} /> Danh Mục
                </h6>
                <ul className="space-y-2">
                  {loading && Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-6 bg-gray-50 animate-pulse rounded"></div>
                  ))}
                  {categories.filter(c => !c.parentId).map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={`/store?categoryId=${cat.id}`}
                        className="text-sm flex items-center justify-between group text-gray-600 hover:text-[#1965a2] transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-[#1965a2]"></span>
                          {cat.name}
                        </span>
                      </Link>
                    </li>
                  ))}
                  {!loading && categories.length === 0 && (
                    <div className="text-xs text-gray-400 italic">Không có danh mục</div>
                  )}
                </ul>
              </div>

              <hr className="border-gray-100 my-6" />

              <div className="mb-6">
                <h6 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
                  <Filter size={16} /> Khoảng Giá
                </h6>
                <div className="px-2 mb-4">
                  <Slider
                    range
                    min={0}
                    max={10000000}
                    step={10000}
                    value={priceRange}
                    onChange={handleSliderChange}
                    trackStyle={[{ backgroundColor: "#1965a2" }]}
                    handleStyle={[
                      {
                        borderColor: "#1965a2",
                        backgroundColor: "#fff",
                        opacity: 1,
                      },
                      {
                        borderColor: "#1965a2",
                        backgroundColor: "#fff",
                        opacity: 1,
                      },
                    ]}
                    railStyle={{ backgroundColor: "#e5e7eb" }}
                  />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                      ₫
                    </span>
                    <input
                      type="number"
                      value={minInput}
                      onChange={(e) => handleInputChange(e, "min")}
                      className="w-full pl-5 pr-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-[#1965a2]"
                      placeholder="Từ"
                    />
                  </div>
                  <span className="text-gray-400">-</span>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                      ₫
                    </span>
                    <input
                      type="number"
                      value={maxInput}
                      onChange={(e) => handleInputChange(e, "max")}
                      className="w-full pl-5 pr-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-[#1965a2]"
                      placeholder="Đến"
                    />
                  </div>
                </div>
                <button
                  onClick={applyPriceFilter}
                  className="w-full py-2 bg-[#1965a2] text-white text-xs font-bold rounded hover:bg-[#2a8558] transition-colors uppercase"
                >
                  Áp dụng
                </button>
              </div>

              <hr className="border-gray-100 my-6" />

              <div>
                <h6 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
                  <LayoutGrid size={16} /> Thương Hiệu
                </h6>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  {loading && Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-6 bg-gray-50 animate-pulse rounded"></div>
                  ))}
                  {brands.map((brand) => (
                    <label
                      key={brand.id}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-[#1965a2] focus:ring-[#1965a2] cursor-pointer"
                      />
                      <span className="text-sm text-gray-600 group-hover:text-[#1965a2] transition-colors flex-1">
                        {brand.name}
                      </span>
                    </label>
                  ))}
                  {!loading && brands.length === 0 && (
                    <div className="text-xs text-gray-400 italic">Không có thương hiệu</div>
                  )}
                </div>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-9">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))
                : products.map((prod) => (
                    <ProductCard key={prod.id} product={prod} />
                  ))}
            </div>

            {!loading && products.length === 0 && (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                <div className="text-gray-400 mb-2">Không tìm thấy sản phẩm nào</div>
                <button 
                  onClick={() => window.location.reload()}
                  className="text-[#1965a2] font-bold hover:underline"
                >
                  Thử lại
                </button>
              </div>
            )}

            <div className="flex justify-center md:justify-end">
              <nav className="flex gap-1">
                <button className="w-9 h-9 flex items-center justify-center rounded border border-[#1965a2] bg-[#1965a2] text-white font-bold text-sm">
                  1
                </button>
                <button className="w-9 h-9 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:border-[#1965a2] hover:text-[#1965a2] bg-white transition-colors text-sm">
                  2
                </button>
                <button className="w-9 h-9 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:border-[#1965a2] hover:text-[#1965a2] bg-white transition-colors text-sm">
                  3
                </button>
                <span className="w-9 h-9 flex items-center justify-center text-gray-400">
                  ...
                </span>
                <button className="px-3 h-9 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:border-[#1965a2] hover:text-[#1965a2] bg-white transition-colors text-sm">
                  Cuối
                </button>
              </nav>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

