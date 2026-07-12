"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

import ProductCard, { ProductCardSkeleton } from "@/components/ui/product-card";
import { PublicProductService } from "@/app/services/publicProduct.service";
import {
  PageResponse,
  PublicProductListItem,
} from "@/app/types/product.schema";

const HOME_FEATURE_BANNER = "/images/category-banner-fallback.svg";
const HOME_CONTENT_CONTAINER_CLASS =
  "mx-auto w-full max-w-[1440px] px-3 sm:px-4 md:px-6 xl:px-8";

interface HomeFeaturedProductsSectionProps {
  initialPage: PageResponse<PublicProductListItem>;
}

export default function HomeFeaturedProductsSection({
  initialPage,
}: HomeFeaturedProductsSectionProps) {
  const [productPage, setProductPage] = useState(initialPage.number ?? 0);
  const [allProducts, setAllProducts] = useState(initialPage.content ?? []);
  const [hasMore, setHasMore] = useState(
    (initialPage.number ?? 0) + 1 < (initialPage.totalPages ?? 0),
  );
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = productPage + 1;
      const data = await PublicProductService.getList({
        page: next,
        size: initialPage.size || 18,
      });

      setAllProducts((prev) => [...prev, ...(data.content ?? [])]);
      setHasMore((next + 1) < data.totalPages);
      setProductPage(next);
    } finally {
      setLoadingMore(false);
    }
  };

  const featuredDesktopProducts = allProducts.slice(0, 10);
  const featuredFirstRowProducts = featuredDesktopProducts.slice(
    0,
    Math.min(featuredDesktopProducts.length, 5),
  );
  const featuredSecondRowProducts = featuredDesktopProducts.slice(5, 10);
  const shouldUseFeaturedShowcase = featuredDesktopProducts.length >= 10;

  return (
    <div className={`${HOME_CONTENT_CONTAINER_CLASS} mt-4`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="h-5 w-1 shrink-0 rounded-full bg-primary" />
          <span className="text-[17px] font-black uppercase tracking-wide text-gray-900">
            Sản phẩm nổi bật
          </span>
        </div>
      </div>

      {allProducts.length > 0 ? (
        <>
          {shouldUseFeaturedShowcase ? (
            <div className="hidden xl:flex xl:items-stretch xl:gap-4">
              <div className="relative row-span-2 min-h-[760px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <Image
                  src={HOME_FEATURE_BANNER}
                  alt="Banner san pham noi bat"
                  fill
                  sizes="(min-width: 1280px) 320px, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-slate-950/50" />
                <div className="absolute inset-x-0 top-0 p-5">
                  <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-700 backdrop-blur">
                    Banner noi bat
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <div className="rounded-[24px] border border-white/40 bg-white/88 p-4 shadow-lg backdrop-blur-md">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                      San pham noi bat
                    </p>
                    <h2 className="mt-2 text-2xl font-bold leading-tight text-slate-900">
                      Bo cuc 5 san pham moi hang
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Desktop hien thi 1 banner dung va 10 san pham dau tien theo
                      dung bo cuc 2 hang x 5 cot.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-4">
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${Math.max(
                      featuredFirstRowProducts.length,
                      1,
                    )}, minmax(0, 1fr))`,
                  }}
                >
                  {featuredFirstRowProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {featuredSecondRowProducts.length > 0 && (
                  <div
                    className="grid gap-4"
                    style={{
                      gridTemplateColumns: `repeat(${featuredSecondRowProducts.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {featuredSecondRowProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <div
            className={`grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 ${
              shouldUseFeaturedShowcase ? "xl:hidden" : "xl:grid"
            }`}
          >
            {allProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-full border border-primary px-8 py-2.5 text-[13px] font-semibold text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-60"
              >
                {loadingMore ? "Đang tải..." : "Xem thêm sản phẩm"}
                {!loadingMore && <ChevronRight size={14} />}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      )}
    </div>
  );
}
