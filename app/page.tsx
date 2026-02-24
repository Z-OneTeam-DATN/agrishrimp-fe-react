"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Sparkles, ChevronRight, Loader2 } from "lucide-react";

import Banner from "@/components/site/SiteBanner";
import SiteHomeCategories from "@/components/site/SiteHomeCategories";
import ProductCard from "@/components/ui/product-card";
import { HomeService } from "@/app/services/home.service";

export default function Home() {
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const [bestRes, allRes] = await Promise.all([
          HomeService.getBestSellers(5),
          HomeService.getProducts(),
        ]);
        setBestSellers(bestRes);
        setAllProducts(allRes);
      } catch (error) {
        console.error("Lỗi khi load dữ liệu trang chủ:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-20">
      <div className="container mx-auto px-4 mt-4">
        <Banner />
      </div>

      <div className="container mx-auto px-4">
        <SiteHomeCategories />
      </div>

      {/* SECTION: TOP BÁN CHẠY */}
      <section className="container mx-auto px-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <h5 className="font-bold text-xl uppercase text-[#d32f2f] flex items-center gap-2">
              <Trophy className="fill-red-600 text-red-600" /> Top Bán Chạy Nhất
            </h5>
            <Link href="/store?sort=best-sell" className="text-sm font-medium text-gray-500 hover:text-teal-600 transition-colors">
              Xem tất cả <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {bestSellers.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION: SẢN PHẨM GỢI Ý */}
      <section className="container mx-auto px-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <h5 className="font-bold text-xl uppercase text-[#009688] flex items-center gap-2">
              <Sparkles className="text-[#009688] fill-[#009688]/20" strokeWidth={2.5} /> Sản Phẩm Gợi Ý
            </h5>
            <Link href="/store" className="text-sm font-medium text-gray-500 hover:text-teal-600 transition-colors">
              Xem tất cả <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {allProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}