"use client";

import { useEffect, useState } from "react";

import ProductCard, { ProductCardSkeleton } from "@/components/ui/product-card";
import { PublicProductService } from "@/app/services/publicProduct.service";
import { PublicProductListItem } from "@/app/types/product.schema";
import { useAuthStore } from "@/stores/useAuthStore";

const HOME_CONTENT_CONTAINER_CLASS =
  "mx-auto w-full max-w-[1440px] px-3 sm:px-4 md:px-6 xl:px-8";

/**
 * Ca nhan hoa theo tai khoan — dua tren san pham da mua (association-rule/market-basket that qua
 * bang product_recommendations, khong phai tinh moi). An hoan toan khi khach chua dang nhap hoac
 * chua co goi y nao (tranh lap lai y nghia "pho bien chung" cua khoi "San pham noi bat" ben duoi).
 */
export default function HomeRecommendedProductsSection() {
  const { isAuthenticated, accessToken } = useAuthStore();
  const [products, setProducts] = useState<PublicProductListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    PublicProductService.getRecommendedForMe(8)
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, accessToken]);

  if (!isAuthenticated || (!loading && products.length === 0)) {
    return null;
  }

  return (
    <div className={`${HOME_CONTENT_CONTAINER_CLASS} mt-6`}>
      <div className="mb-3 flex items-center gap-3">
        <span className="h-5 w-1 shrink-0 rounded-full bg-primary" />
        <span className="text-[18px] font-extrabold leading-tight tracking-normal text-gray-900">
          Gợi ý dành cho bạn
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))
          : products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
      </div>
    </div>
  );
}
