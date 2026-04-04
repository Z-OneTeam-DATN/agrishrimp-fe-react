"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Trophy, Sparkles, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import Banner from "@/components/site/SiteBanner";
import SiteHomeCategories from "@/components/site/SiteHomeCategories";
import ProductCard, { ProductCardSkeleton } from "@/components/ui/product-card";
import LoadMoreButton from "@/components/ui/load-more-button";
import { HomeService } from "@/app/services/home.service";
import { useResponsiveColumns } from "@/hooks/useResponsiveColumns";

const ROWS_PER_STEP = 3;

export default function Home() {
  const { data: bestSellers = [], isLoading: loadingBest } = useQuery({
    queryKey: ["home", "best-sellers"],
    queryFn: () => HomeService.getBestSellers(5),
    staleTime: 5 * 60 * 1000, // cache 5 phút — quay về trang chủ hiển thị ngay
  });

  const { data: allProducts = [], isLoading: loadingAll } = useQuery({
    queryKey: ["home", "products"],
    queryFn: () => HomeService.getProducts(),
    staleTime: 5 * 60 * 1000,
  });

  const homeGridColumns = useResponsiveColumns({
    defaultColumns: 2,
    smColumns: 3,
    mdColumns: 4,
    lgColumns: 5,
  });
  const [visibleSuggestedRows, setVisibleSuggestedRows] = useState(ROWS_PER_STEP);

  useEffect(() => {
    setVisibleSuggestedRows(ROWS_PER_STEP);
  }, [allProducts.length]);

  const visibleSuggestedCount = visibleSuggestedRows * homeGridColumns;
  const soldBestSellers = useMemo(
    () => bestSellers.filter((product) => Number(product.soldCount ?? 0) > 0),
    [bestSellers]
  );
  const visibleSuggestedProducts = useMemo(
    () => allProducts.slice(0, visibleSuggestedCount),
    [allProducts, visibleSuggestedCount]
  );

  return (
    <div className="flex flex-col gap-6 pb-20">
      <div className="container mx-auto px-4 mt-4">
        <Banner />
      </div>

      <div className="container mx-auto px-4">
        <SiteHomeCategories />
      </div>

      {/* SECTION: TOP BÁN CHẠY */}
      {(loadingBest || soldBestSellers.length > 0) && (
        <section className="container mx-auto px-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <h5 className="font-bold text-xl uppercase text-[#d32f2f] flex items-center gap-2">
                <Trophy className="fill-red-600 text-red-600" /> Top Bán Chạy Nhất
              </h5>
              <Link href="/san-pham" className="text-sm font-medium text-gray-500 hover:text-teal-600 transition-colors">
                Xem tất cả <ChevronRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {loadingBest
                ? Array.from({ length: 5 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : soldBestSellers.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION: SẢN PHẨM GỢI Ý */}
      {(loadingAll || allProducts.length > 0) && (
        <section className="container mx-auto px-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <h5 className="font-bold text-xl uppercase text-[#009688] flex items-center gap-2">
                <Sparkles className="text-[#009688] fill-[#009688]/20" strokeWidth={2.5} /> Sản Phẩm Gợi Ý
              </h5>
              <Link href="/san-pham" className="text-sm font-medium text-gray-500 hover:text-teal-600 transition-colors">
                Xem tất cả <ChevronRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {loadingAll
                ? Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : visibleSuggestedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
            </div>

            {!loadingAll && visibleSuggestedProducts.length < allProducts.length && (
              <LoadMoreButton
                onClick={() => setVisibleSuggestedRows((prev) => prev + ROWS_PER_STEP)}
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
}
