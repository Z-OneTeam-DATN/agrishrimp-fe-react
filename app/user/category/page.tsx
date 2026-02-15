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
  X,
  SlidersHorizontal,
  ArrowUpDown,
} from "lucide-react"; // Thêm icon X, SlidersHorizontal
import ProductCard from "@/components/ui/product-card";

// --- MOCK DATA ---
const CATEGORIES = [
  { name: "Vi sinh xử lý đáy", count: 127, active: true },
  { name: "Làm sạch nước & Cắt tảo", count: 78 },
  { name: "Dinh dưỡng & Tăng trọng", count: 74 },
  { name: "Thuốc trị bệnh gan tụy", count: 62 },
  { name: "Thuốc trị đường ruột", count: 50 },
  { name: "Khoáng tạt & Kích lột", count: 45 },
  { name: "Hóa chất xử lý nước", count: 30 },
  { name: "Vitamin & Acid Amin", count: 25 },
  { name: "Dụng cụ đo môi trường", count: 57 },
  { name: "Máy sục khí & Quạt nước", count: 15 },
];

const BRANDS = [
  { id: "apa", name: "APA", count: 127 },
  { id: "bayer", name: "Bayer", count: 78 },
  { id: "cp", name: "CP Group", count: 74 },
  { id: "thanglong", name: "Thăng Long", count: 62 },
  { id: "grobest", name: "Grobest", count: 55 },
  { id: "unipresident", name: "Uni-President", count: 40 },
];

const PRODUCTS = Array.from({ length: 20 }).map((_, i) => ({
  id: i + 1,
  name:
    i % 2 === 0
      ? "Vi sinh xử lý đáy ao APA MINER"
      : "Thức ăn tôm thẻ Grow Best 40 đạm",
  price: i % 2 === 0 ? "150.000 ₫" : "550.000 ₫",
  oldPrice: i % 3 === 0 ? "180.000 ₫" : undefined,
  image: "https://apanano.com/wp-content/uploads/APA-MINER-POX_Shrimp.jpg",
  category: i % 2 === 0 ? "Xử lý nước" : "Dinh dưỡng",
  rating: 4.5,
  reviewCount: 120,
  sold: i * 50 + 10,
  tag: i === 0 ? "BÁN CHẠY" : ((i === 3 ? "HOT" : null) as any),
}));

const VIEWED_PRODUCTS = [
  {
    id: 101,
    name: "Men vi sinh",
    price: "150.000 ₫",
    image: "https://apanano.com/wp-content/uploads/APA-MINER-POX_Shrimp.jpg",
    category: "Xử lý nước",
    rating: 5,
    reviewCount: 2,
    sold: 10,
    tag: null,
  },
  {
    id: 102,
    name: "Khoáng tạt",
    price: "90.000 ₫",
    image: "https://apanano.com/wp-content/uploads/APA-MINER-POX_Shrimp.jpg",
    category: "Khoáng chất",
    rating: 5,
    reviewCount: 1,
    sold: 5,
    tag: null,
  },
];

export default function CategoryPage() {
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);
  const [minInput, setMinInput] = useState<number | "">(0);
  const [maxInput, setMaxInput] = useState<number | "">(5000000);

  // State cho Mobile Filter Drawer
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Khóa cuộn trang khi mở filter trên mobile
  useEffect(() => {
    if (showMobileFilter) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showMobileFilter]);

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
    setShowMobileFilter(false); // Đóng filter mobile sau khi áp dụng
  };

  // --- COMPONENT CON: NỘI DUNG BỘ LỌC (Dùng chung cho Desktop Sidebar & Mobile Drawer) ---
  const FilterContent = () => (
    <>
      {/* Danh mục */}
      <div className="mb-6">
        <h6 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
          <List size={16} /> Danh Mục
        </h6>
        <ul className="space-y-2">
          {CATEGORIES.map((cat, idx) => (
            <li key={idx}>
              <Link
                href="#"
                className={`text-sm flex items-center justify-between group ${cat.active ? "text-teal-600 font-bold" : "text-gray-600 hover:text-teal-600"}`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${cat.active ? "bg-teal-600" : "bg-gray-300 group-hover:bg-teal-400"}`}
                  ></span>
                  {cat.name}
                </span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {cat.count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <hr className="border-gray-100 my-6" />

      {/* Khoảng giá */}
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
            trackStyle={[{ backgroundColor: "#0d9488" }]}
            handleStyle={[
              { borderColor: "#0d9488", backgroundColor: "#fff", opacity: 1 },
              { borderColor: "#0d9488", backgroundColor: "#fff", opacity: 1 },
            ]}
            railStyle={{ backgroundColor: "#e5e7eb" }}
          />
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div className="relative w-1/2">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
              ₫
            </span>
            <input
              type="number"
              value={minInput}
              onChange={(e) => handleInputChange(e, "min")}
              className="w-full pl-5 pr-1 py-1.5 text-xs border border-gray-200 rounded focus:border-teal-500 outline-none"
              placeholder="Từ"
            />
          </div>
          <span className="text-gray-400">-</span>
          <div className="relative w-1/2">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
              ₫
            </span>
            <input
              type="number"
              value={maxInput}
              onChange={(e) => handleInputChange(e, "max")}
              className="w-full pl-5 pr-1 py-1.5 text-xs border border-gray-200 rounded focus:border-teal-500 outline-none"
              placeholder="Đến"
            />
          </div>
        </div>
        <button
          onClick={applyPriceFilter}
          className="w-full py-2 bg-teal-600 text-white text-xs font-bold rounded hover:bg-teal-700 transition-colors uppercase"
        >
          Áp dụng
        </button>
      </div>

      <hr className="border-gray-100 my-6" />

      {/* Thương hiệu */}
      <div>
        <h6 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
          <LayoutGrid size={16} /> Thương Hiệu
        </h6>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
          {BRANDS.map((brand) => (
            <label
              key={brand.id}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <span className="text-sm text-gray-600 group-hover:text-teal-600 transition-colors flex-1">
                {brand.name}
              </span>
              <span className="text-xs text-gray-400">({brand.count})</span>
            </label>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      {/* --- MOBILE FILTER DRAWER (OVERLAY) --- */}
      {showMobileFilter && (
        <div
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={() => setShowMobileFilter(false)}
        ></div>
      )}
      <div
        className={`fixed inset-y-0 left-0 w-[85%] max-w-xs bg-white z-[51] shadow-2xl transform transition-transform duration-300 ease-in-out ${showMobileFilter ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-100 bg-gray-50">
          <h5 className="font-bold text-gray-800 uppercase">Bộ lọc tìm kiếm</h5>
          <button
            onClick={() => setShowMobileFilter(false)}
            className="p-1 hover:bg-gray-200 rounded-full text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100vh-60px)] pb-20">
          <FilterContent />
        </div>
      </div>

      {/* 1. BREADCRUMB */}
      <div className="container mx-auto px-4 py-3 md:py-4">
        <nav className="text-xs md:text-sm text-gray-500 flex items-center gap-2 whitespace-nowrap overflow-hidden text-ellipsis">
          <Link href="/" className="hover:text-teal-600 transition-colors">
            Trang chủ
          </Link>
          <span className="text-gray-400">/</span>
          <span className="font-bold text-gray-800 truncate">
            Sản phẩm nuôi tôm
          </span>
        </nav>
      </div>

      <div className="container mx-auto px-2 md:px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8">
          {/* === SIDEBAR (DESKTOP ONLY) === */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 sticky top-24">
              <FilterContent />
            </div>
          </aside>

          {/* === MAIN CONTENT === */}
          <main className="lg:col-span-3">
            {/* Header & Sort */}
            <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl shadow-sm border border-gray-100 mb-4 md:mb-6">
              {/* Mobile Header Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-base md:text-xl font-bold text-gray-800 flex flex-col md:flex-row md:items-baseline gap-0.5 md:gap-2">
                    Chăm Sóc Ao Nuôi
                    <span className="text-xs md:text-sm font-normal text-gray-500">
                      (2656 sản phẩm)
                    </span>
                  </h1>

                  {/* Nút Lọc Mobile */}
                  <button
                    onClick={() => setShowMobileFilter(true)}
                    className="lg:hidden flex items-center gap-1 text-xs font-bold bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full border border-teal-100 active:bg-teal-100"
                  >
                    <SlidersHorizontal size={14} /> Lọc
                  </button>
                </div>

                {/* Desktop/Tablet Sort Buttons */}
                <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                  <span className="text-gray-500 whitespace-nowrap hidden md:inline">
                    Sắp xếp:
                  </span>
                  <button className="font-bold text-teal-600 whitespace-nowrap bg-teal-50 md:bg-transparent px-2 py-1 rounded md:px-0 md:py-0">
                    Bán chạy
                  </button>
                  <button className="text-gray-600 hover:text-teal-600 whitespace-nowrap px-2 py-1 md:px-0">
                    Mới nhất
                  </button>
                  <button className="text-gray-600 hover:text-teal-600 whitespace-nowrap flex items-center gap-1 px-2 py-1 md:px-0">
                    Giá <ArrowUpDown size={12} className="md:hidden" />
                  </button>
                  <div className="relative group ml-auto md:ml-0">
                    <button className="text-gray-600 hover:text-teal-600 flex items-center gap-1 whitespace-nowrap px-2 py-1 md:px-0">
                      Khác <ChevronDown size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Grid - Mobile 2 col, Gap small */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 mb-8">
              {PRODUCTS.map((prod) => (
                <ProductCard key={prod.id} {...prod} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center md:justify-end mb-8">
              <nav className="flex gap-1">
                <button className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded border border-teal-600 bg-teal-600 text-white font-bold text-xs md:text-sm">
                  1
                </button>
                <button className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:border-teal-600 hover:text-teal-600 bg-white transition-colors text-xs md:text-sm">
                  2
                </button>
                <span className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-gray-400 text-xs md:text-sm">
                  ...
                </span>
                <button className="px-2 md:px-3 h-8 md:h-9 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:border-teal-600 hover:text-teal-600 bg-white transition-colors text-xs md:text-sm">
                  Cuối
                </button>
              </nav>
            </div>

            {/* Suggestion Section */}
            <div className="bg-white p-3 md:p-6 rounded-lg md:rounded-xl shadow-sm border border-gray-100 mb-6">
              <h5 className="font-bold text-gray-800 uppercase text-xs md:text-sm border-b border-gray-100 pb-3 mb-4">
                Gợi ý dành riêng cho bạn
              </h5>
              {/* Mobile: Scroll ngang, Desktop: Grid */}
              <div className="flex md:grid md:grid-cols-5 gap-2 md:gap-4 overflow-x-auto pb-2 md:pb-0 snap-x md:snap-none no-scrollbar">
                {PRODUCTS.slice(0, 5).map((prod) => (
                  <div
                    key={prod.id + 99}
                    className="min-w-[150px] md:min-w-0 snap-start"
                  >
                    <ProductCard {...prod} />
                  </div>
                ))}
              </div>
            </div>

            {/* SẢN PHẨM ĐÃ XEM */}
            <div className="bg-white p-3 md:p-6 rounded-lg md:rounded-xl shadow-sm border border-gray-100">
              <h5 className="font-bold text-gray-800 uppercase text-xs md:text-sm border-b border-gray-100 pb-3 mb-4">
                Sản phẩm đã xem
              </h5>
              <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {VIEWED_PRODUCTS.map((prod) => (
                  <div
                    key={prod.id}
                    className="min-w-[140px] w-[140px] md:min-w-[180px] md:w-[180px]"
                  >
                    <ProductCard {...(prod as any)} />
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
