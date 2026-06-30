"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Tag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import Banner from "@/components/site/SiteBanner";
import ProductCard, { ProductCardSkeleton } from "@/components/ui/product-card";
import { getPublicCategories } from "@/app/services/CategoryService";
import { getPublicBrands } from "@/app/services/brand.service";
import { PublicProductService } from "@/app/services/publicProduct.service";
import { CategoryDTO } from "@/app/types/category.type";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "https://api.agrishrimp.io.vn";
const CATEGORY_FALLBACK_IMAGE = "/placeholder.svg";

const CATEGORY_SHOWCASE_STYLE = {
  frameClass: "border-[#4c72b7]",
  buttonClass:
    "border-[#9db6e4] text-[#4c72b7] hover:bg-[#4c72b7] hover:text-white",
};

function CategoryShowcaseImage({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-sm bg-slate-50">
        <Tag size={30} className="text-primary/35" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
      onError={() => setHasError(true)}
    />
  );
}

export default function Home() {
  const [productPage, setProductPage] = useState(0);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const { data: firstPage, isLoading: loadingBest } = useQuery({
    queryKey: ["home", "products", 0],
    queryFn: () => PublicProductService.getList({ page: 0, size: 18 }),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (firstPage) {
      setAllProducts(firstPage.content ?? []);
      setHasMore((firstPage as any).last === false || (productPage + 1) < firstPage.totalPages);
    }
  }, [firstPage]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = productPage + 1;
      const data = await PublicProductService.getList({ page: next, size: 18 });
      setAllProducts((prev) => [...prev, ...(data.content ?? [])]);
      setHasMore((next + 1) < data.totalPages);
      setProductPage(next);
    } finally {
      setLoadingMore(false);
    }
  };

  const { data: allCategories = [], isLoading: loadingCats } = useQuery({
    queryKey: ["home", "categories"],
    queryFn: getPublicCategories,
    staleTime: 10 * 60 * 1000,
  });

  const { data: brands = [], isLoading: loadingBrands } = useQuery({
    queryKey: ["home", "brands"],
    queryFn: getPublicBrands,
    staleTime: 10 * 60 * 1000,
  });

  const parentCats: CategoryDTO[] = allCategories
    .filter((c: CategoryDTO) => !c.parentId || c.parentId === 0)
    .slice(0, 7);
  const showcaseCategories = parentCats;

  const resolveCategoryImage = (imagePath?: string | null) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http") || imagePath.startsWith("data:")) return imagePath;
    return `${BACKEND_ORIGIN}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
  };

  return (
    <div className="bg-[#f5f5f5] pb-10">

      {/* ══ SECTION 1: Hero ══ */}
      <div className="w-full pt-0">
        <div className="overflow-hidden">
          <Banner />
        </div>
      </div>

      {/* ══ SECTION 2: Brand Partners — 1-row marquee ══ */}
      {(loadingBrands || brands.length > 0) && (
        <div className="mt-4 w-full">
          <div className="w-full overflow-hidden border-y border-gray-200 bg-white px-4 py-4 md:px-6 lg:px-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center mb-4">
              Đơn vị đồng hành cùng chúng tôi
            </p>
            {loadingBrands ? (
              <div className="flex items-center justify-center gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-20 h-7 bg-gray-100 rounded animate-pulse shrink-0" />
                ))}
              </div>
            ) : (
              <div className="overflow-hidden">
                <div className="animate-marquee">
                  {[...brands, ...brands].map((brand, idx) => (
                    <Link
                      key={`${brand.id}-${idx}`}
                      href={`/san-pham?brandId=${brand.id}`}
                      className="flex items-center justify-center px-8 hover:opacity-60 transition-opacity shrink-0"
                    >
                      {brand.logoUrl ? (
                        <Image
                          src={brand.logoUrl}
                          alt={brand.name}
                          width={90}
                          height={36}
                          className="object-contain max-h-9"
                        />
                      ) : (
                        <span className="text-[13px] font-extrabold text-gray-700 uppercase tracking-tight whitespace-nowrap">
                          {brand.name}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ SECTION 3: Category Showcase ══ */}
      <div className="container mx-auto px-4 mt-4">
        {loadingCats ? (
          <div className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex snap-x snap-mandatory gap-3 md:grid md:grid-cols-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[38vw] min-w-[138px] max-w-[158px] shrink-0 snap-start animate-pulse sm:w-[30vw] sm:min-w-[150px] sm:max-w-[176px] md:min-w-0 md:max-w-none md:w-auto">
                <div className="aspect-square rounded-t-[14px] bg-gray-100 md:aspect-[1.08/1]" />
                <div className="mt-2.5 h-10 rounded-[10px] bg-gray-100 md:mt-4 md:h-11" />
              </div>
            ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex snap-x snap-mandatory gap-3 md:grid md:grid-cols-4 md:gap-6">
              {showcaseCategories.map((cat) => {
                const style = CATEGORY_SHOWCASE_STYLE;
                const imageSrc = resolveCategoryImage(cat.imageUrl);

                return (
                <Link
                  key={cat.id}
                  href={`/san-pham?categoryId=${cat.id}`}
                  className="group block h-full w-[38vw] min-w-[138px] max-w-[158px] shrink-0 snap-start sm:w-[30vw] sm:min-w-[150px] sm:max-w-[176px] md:min-w-0 md:max-w-none md:w-auto"
                >
                  <div className={`border-x-[6px] border-t-[6px] ${style.frameClass} bg-white px-2 pt-2.5 shadow-sm transition-transform duration-300 group-hover:-translate-y-1 sm:px-3 sm:pt-3 md:border-x-[10px] md:border-t-[10px] md:px-5 md:pt-6`}>
                    <div className="flex aspect-square items-center justify-center overflow-hidden bg-white md:aspect-[1.14/1]">
                      <CategoryShowcaseImage
                        src={imageSrc ?? CATEGORY_FALLBACK_IMAGE}
                        alt={cat.name}
                      />
                    </div>
                  </div>
                  <div className={`relative z-10 -mt-2 flex min-h-[42px] items-center justify-center rounded-[10px] border bg-white px-2 py-2 text-center text-[10px] font-extrabold uppercase leading-tight tracking-tight shadow-sm transition-colors sm:px-3 sm:text-[11px] md:-mt-3 md:min-h-[56px] md:py-2.5 md:text-[13px] ${style.buttonClass}`}>
                    {cat.name}
                  </div>
                </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ══ SECTION 4: Khuyến Mãi / Best Sellers ══ */}
      <div className="container mx-auto px-4 mt-4">

        {/* Section header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="w-1 h-5 bg-primary rounded-full shrink-0" />
            <span className="text-[15px] font-black uppercase tracking-wide text-gray-900">
              Sản phẩm nổi bật
            </span>
          </div>
        </div>

        {/* Product grid */}
        {loadingBest ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 18 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : allProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {allProducts.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
            {hasMore && (
              <div className="text-center mt-5">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-8 py-2.5 border border-primary text-primary text-[13px] font-semibold rounded-full hover:bg-primary hover:text-white transition-colors disabled:opacity-60"
                >
                  {loadingMore ? "Đang tải..." : "Xem thêm sản phẩm"}
                  {!loadingMore && <ChevronRight size={14} />}
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-center py-10 text-sm text-gray-400">Chưa có sản phẩm</p>
        )}
      </div>

    </div>
  );
}
