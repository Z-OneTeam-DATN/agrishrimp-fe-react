import Link from "next/link";
import { ArrowRight, Waves } from "lucide-react";

import { PublicProductListItem } from "@/app/types/product.schema";
import ProductCard, { ProductCardSkeleton } from "@/components/ui/product-card";
import { formatNumber } from "@/lib/utils";

const HOME_CONTENT_CONTAINER_CLASS =
  "mx-auto w-full max-w-[1440px] px-3 sm:px-4 md:px-6 xl:px-8";

interface HomeBestSellingProductsSectionProps {
  products: PublicProductListItem[];
  failed?: boolean;
}

export default function HomeBestSellingProductsSection({
  products,
  failed = false,
}: HomeBestSellingProductsSectionProps) {
  const visibleProducts = products.slice(0, 5);

  if (failed) {
    return null;
  }

  return (
    <section className={`${HOME_CONTENT_CONTAINER_CLASS} mt-5`}>
      <div className="overflow-hidden rounded-[8px] bg-[#3f67a6] shadow-[0_18px_38px_rgba(31,82,145,0.22)]">
        <div className="relative min-h-[128px] overflow-hidden bg-gradient-to-b from-[#f7d963] via-[#8fc4ff] to-[#65a7ef] px-4 pt-4 sm:min-h-[150px] sm:px-6 md:px-8">
          <div className="absolute inset-x-0 bottom-0 h-[48%] bg-[#5f9dec]" />
          <div className="absolute -left-8 top-6 h-20 w-36 rounded-full border-[10px] border-white/45" />
          <div className="absolute right-6 top-5 h-16 w-16 rounded-full border-[9px] border-white/50 bg-sky-200/60" />
          <div className="absolute bottom-3 left-1/2 h-12 w-[62%] -translate-x-1/2 rounded-[999px] bg-white/20 blur-sm" />

          <div className="relative z-10 flex min-h-[104px] items-center justify-center sm:min-h-[126px]">
            <h2 className="text-center text-[32px] font-black uppercase leading-none tracking-normal text-white drop-shadow-[0_6px_0_rgba(42,92,177,0.78)] sm:text-[48px] md:text-[62px] lg:text-[76px]">
              Sản phẩm bán chạy
            </h2>
          </div>

          <div className="absolute left-5 top-4 flex items-center gap-2 rounded-full bg-white/35 px-3 py-1 text-[#2c5b9e] backdrop-blur-sm">
            <Waves size={16} strokeWidth={2.4} />
            <span className="text-[11px] font-extrabold uppercase leading-none">
              Hot
            </span>
          </div>
        </div>

        <div className="px-3 pb-5 pt-4 sm:px-5 md:px-6">
          {visibleProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:gap-5">
              {visibleProducts.map((product, index) => (
                <div key={product.id} className="relative min-w-0">
                  <div className="absolute left-2 top-2 z-20 rounded-r-full rounded-tl-[8px] bg-[#de4c38] px-2.5 py-1 text-xs font-extrabold text-white shadow-md">
                    #{index + 1}
                  </div>
                  {Number(product.soldCount ?? 0) > 0 && (
                    <div className="absolute right-2 top-2 z-20 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#2f5796] shadow-sm">
                      Đã bán {formatNumber(Number(product.soldCount))}
                    </div>
                  )}
                  <ProductCard
                    product={product}
                    className="overflow-hidden rounded-[8px] border-0 shadow-[0_10px_22px_rgba(25,63,117,0.16)]"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:gap-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          )}

          <div className="mt-5 flex justify-center">
            <Link
              href="/san-pham?sort=best-selling"
              className="inline-flex min-h-[44px] items-center gap-3 rounded-full border border-white/80 bg-white/10 px-4 py-2 text-base font-semibold text-white transition-colors hover:bg-white hover:text-[#2f5796]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#2f5796]">
                <ArrowRight size={22} strokeWidth={2.8} />
              </span>
              Xem tất cả
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
