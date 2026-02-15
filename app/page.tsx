import React from "react";
import Link from "next/link";
import { Trophy, TrendingUp, ChevronRight } from "lucide-react";

// Import các Components
import Banner from "@/components/site/SiteBanner";
import SiteHomeCategories from "@/components/site/SiteHomeCategories";
import ProductCard from "@/components/ui/product-card";

// --- MOCK DATA ---
const BEST_SELLERS = [
  {
    id: 1,
    name: "Vi sinh xử lý đáy ao APA MINER",
    price: "150.000 ₫",
    oldPrice: "180.000 ₫",
    image: "https://apanano.com/wp-content/uploads/APA-MINER-POX_Shrimp.jpg",
    category: "Xử lý nước",
    sold: 1200,
    tag: "BEST" as const,
  },
  {
    id: 2,
    name: "Thức ăn tôm thẻ Grow Best 40 đạm",
    price: "550.000 ₫",
    image: "https://apanano.com/wp-content/uploads/APA-MINER-POX_Shrimp.jpg",
    category: "Dinh dưỡng",
    sold: 890,
    tag: "BEST" as const,
  },
  {
    id: 3,
    name: "Vôi nông nghiệp Super Calci",
    price: "80.000 ₫",
    image: "https://apanano.com/wp-content/uploads/APA-MINER-POX_Shrimp.jpg",
    category: "Hóa chất",
    sold: 500,
    tag: "BEST" as const,
  },
  {
    id: 4,
    name: "Khoáng tạt định kỳ Mix-Mineral",
    price: "90.000 ₫",
    image: "https://apanano.com/wp-content/uploads/APA-MINER-POX_Shrimp.jpg",
    category: "Khoáng chất",
    sold: 450,
    tag: "BEST" as const,
  },
  {
    id: 5,
    name: "Vitamin C tạt tăng đề kháng",
    price: "120.000 ₫",
    image: "https://apanano.com/wp-content/uploads/APA-MINER-POX_Shrimp.jpg",
    category: "Thuốc bổ",
    sold: 300,
    tag: "BEST" as const,
  },
];

const TRENDING_PRODUCTS = [
  {
    id: 6,
    name: "Máy đo pH cầm tay Hanna",
    price: "1.200.000 ₫",
    image: "https://apanano.com/wp-content/uploads/APA-MINER-POX_Shrimp.jpg",
    category: "Thiết bị",
    reviewCount: 58,
    tag: "HOT" as const,
  },
  {
    id: 7,
    name: "Kháng sinh thảo dược Gan Tụy",
    price: "220.000 ₫",
    image: "https://apanano.com/wp-content/uploads/APA-MINER-POX_Shrimp.jpg",
    category: "Thuốc trị bệnh",
    reviewCount: 12,
    tag: "HOT" as const,
  },
  {
    id: 8,
    name: "Máy đo Oxy hòa tan kỹ thuật số",
    price: "3.500.000 ₫",
    image: "https://apanano.com/wp-content/uploads/APA-MINER-POX_Shrimp.jpg",
    category: "Thiết bị",
    reviewCount: 5,
    tag: "HOT" as const,
  },
  {
    id: 9,
    name: "Men tiêu hóa đường ruột",
    price: "180.000 ₫",
    image: "https://apanano.com/wp-content/uploads/APA-MINER-POX_Shrimp.jpg",
    category: "Dinh dưỡng",
    reviewCount: 89,
    tag: "HOT" as const,
  },
  {
    id: 10,
    name: "Lưới lan che nắng 70%",
    price: "45.000 ₫",
    image: "https://apanano.com/wp-content/uploads/APA-MINER-POX_Shrimp.jpg",
    category: "Vật tư",
    reviewCount: 200,
    tag: null,
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* 1. HERO BANNER SECTION */}
      <div className="container mx-auto px-4 mt-4">
        <Banner />
      </div>

      {/* 2. DANH MỤC VẬT TƯ */}
      <div className="container mx-auto px-4">
        <SiteHomeCategories />
      </div>

      {/* 3. SECTION: TOP BÁN CHẠY */}
      <section className="container mx-auto px-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <h5 className="font-bold text-xl uppercase text-[#d32f2f] flex items-center gap-2">
              <Trophy className="fill-red-600 text-red-600" /> Top Bán Chạy Nhất
            </h5>
            <Link
              href="/store?sort=best-sell"
              className="text-sm text-gray-500 hover:text-teal-600 flex items-center transition-colors font-medium"
            >
              Xem tất cả <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {BEST_SELLERS.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. SECTION: XU HƯỚNG TÌM KIẾM */}
      <section className="container mx-auto px-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <h5 className="font-bold text-xl uppercase text-[#ff9800] flex items-center gap-2">
              <TrendingUp className="text-[#ff9800]" strokeWidth={2.5} /> Xu
              Hướng Tìm Kiếm
            </h5>
            <Link
              href="/store?sort=trending"
              className="text-sm text-gray-500 hover:text-teal-600 flex items-center transition-colors font-medium"
            >
              Xem tất cả <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {TRENDING_PRODUCTS.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
