"use client";

import React, { useState } from "react";
import Link from "next/link";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import {
  ChevronDown,
  Filter,
  LayoutGrid,
  List,
  ChevronRight,
} from "lucide-react";
import ProductCard from "@/components/ui/product-card";
import StoreSidebar from "@/components/shop/StoreSidebar";
import StoreBanner from "@/components/site/SiteBanner_Store";

// --- MOCK DATA: DANH MỤC & THƯƠNG HIỆU ---
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
      : "Thức ăn tôm thẻ Grow Best",
  price: i % 2 === 0 ? "150.000 ₫" : "550.000 ₫",
  oldPrice: i % 3 === 0 ? "180.000 ₫" : undefined,
  image: "https://apanano.com/wp-content/uploads/APA-MINER-POX_Shrimp.jpg",
  category: i % 2 === 0 ? "Xử lý nước" : "Dinh dưỡng",
  rating: 4.5,
  reviewCount: 120,
  sold: i * 50 + 10,
  tag: i === 0 ? "BÁN CHẠY" : ((i === 3 ? "HOT" : null) as any),
}));

export default function StorePage() {
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);
  const [minInput, setMinInput] = useState<number | "">(0);
  const [maxInput, setMaxInput] = useState<number | "">(5000000);

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

        <div className="py-2 mb-6 text-sm text-gray-500 flex items-center">
          <Link href="/" className="hover:text-[#329965] transition-colors">
            Trang chủ
          </Link>
          <ChevronRight size={16} className="mx-2" />
          <span className="text-[#329965] font-bold">Cửa hàng vật tư</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3 hidden lg:block">
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 sticky top-24">
              <div className="mb-6">
                <h6 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
                  <List size={16} /> Danh Mục
                </h6>
                <ul className="space-y-2">
                  {CATEGORIES.map((cat, idx) => (
                    <li key={idx}>
                      <Link
                        href="#"
                        className={`text-sm flex items-center justify-between group ${cat.active ? "text-[#329965] font-bold" : "text-gray-600 hover:text-[#329965]"}`}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${cat.active ? "bg-[#329965]" : "bg-gray-300 group-hover:bg-[#329965]"}`}
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
                    trackStyle={[{ backgroundColor: "#329965" }]}
                    handleStyle={[
                      {
                        borderColor: "#329965",
                        backgroundColor: "#fff",
                        opacity: 1,
                      },
                      {
                        borderColor: "#329965",
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
                      className="w-full pl-5 pr-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-[#329965]"
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
                      className="w-full pl-5 pr-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-[#329965]"
                      placeholder="Đến"
                    />
                  </div>
                </div>
                <button
                  onClick={applyPriceFilter}
                  className="w-full py-2 bg-[#329965] text-white text-xs font-bold rounded hover:bg-[#2a8558] transition-colors uppercase"
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
                  {BRANDS.map((brand) => (
                    <label
                      key={brand.id}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-[#329965] focus:ring-[#329965] cursor-pointer"
                      />
                      <span className="text-sm text-gray-600 group-hover:text-[#329965] transition-colors flex-1">
                        {brand.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({brand.count})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-9">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-800 flex items-baseline gap-2">
                  Tất cả sản phẩm
                  <span className="text-sm font-normal text-gray-500">
                    (2656 sản phẩm)
                  </span>
                </h1>
              </div>

              <div className="flex items-center gap-4 text-sm overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                <span className="text-gray-500 whitespace-nowrap">
                  Sắp xếp:
                </span>
                <button className="font-bold text-[#329965] whitespace-nowrap">
                  Bán chạy
                </button>
                <button className="text-gray-600 hover:text-[#329965] whitespace-nowrap">
                  Mới nhất
                </button>
                <button className="text-gray-600 hover:text-[#329965] whitespace-nowrap">
                  Giá thấp ➜ cao
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {PRODUCTS.map((prod) => (
                <ProductCard key={prod.id} {...prod} />
              ))}
            </div>

            <div className="flex justify-center md:justify-end">
              <nav className="flex gap-1">
                <button className="w-9 h-9 flex items-center justify-center rounded border border-[#329965] bg-[#329965] text-white font-bold text-sm">
                  1
                </button>
                <button className="w-9 h-9 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:border-[#329965] hover:text-[#329965] bg-white transition-colors text-sm">
                  2
                </button>
                <button className="w-9 h-9 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:border-[#329965] hover:text-[#329965] bg-white transition-colors text-sm">
                  3
                </button>
                <span className="w-9 h-9 flex items-center justify-center text-gray-400">
                  ...
                </span>
                <button className="px-3 h-9 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:border-[#329965] hover:text-[#329965] bg-white transition-colors text-sm">
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
