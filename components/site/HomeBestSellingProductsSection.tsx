import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { PublicProductListItem } from "@/app/types/product.schema";
import ProductCard, { ProductCardSkeleton } from "@/components/ui/product-card";
import { formatNumber } from "@/lib/utils";

const HOME_CONTENT_CONTAINER_CLASS =
  "mx-auto w-full max-w-[1440px] px-3 sm:px-4 md:px-6 xl:px-8";
const BEST_SELLING_HEADER_IMAGE = "/images/best-selling-header.jpg";
const BEST_SELLING_BADGE_IMAGE = "/images/best-selling-badge.png";

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
        <div className="overflow-hidden bg-[#69aaf0]">
          <Image
            src={BEST_SELLING_HEADER_IMAGE}
            alt="Sản phẩm bán chạy"
            width={1280}
            height={160}
            priority
            sizes="(min-width: 1440px) 1440px, 100vw"
            className="h-auto w-full object-contain"
          />
        </div>

        <div className="px-3 pb-5 pt-4 sm:px-5 md:px-6">
          {visibleProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:gap-5">
              {visibleProducts.map((product) => (
                <div key={product.id} className="relative min-w-0">
                  {Number(product.soldCount ?? 0) > 0 && (
                    <div className="absolute right-2 top-2 z-20 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#2f5796] shadow-sm">
                      Đã bán {formatNumber(Number(product.soldCount))}
                    </div>
                  )}
                  <ProductCard
                    product={product}
                    className="overflow-hidden rounded-[8px] border-0 shadow-[0_10px_22px_rgba(25,63,117,0.16)]"
                    badgeSlot={
                      <div className="relative h-6 w-16 overflow-hidden rounded-[5px] bg-white/95 shadow-sm">
                        <Image
                          src={BEST_SELLING_BADGE_IMAGE}
                          alt="Bán chạy"
                          fill
                          sizes="64px"
                          className="scale-[1.28] object-cover object-[73%_66%] mix-blend-multiply"
                        />
                      </div>
                    }
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
