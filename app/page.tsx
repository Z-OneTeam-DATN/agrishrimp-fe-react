"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Tag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import Banner from "@/components/site/SiteBanner";
import HomeLatestBlogSection from "@/components/site/HomeLatestBlogSection";
import ProductCard, { ProductCardSkeleton } from "@/components/ui/product-card";
import { getPublicCategories } from "@/app/services/CategoryService";
import { getPublicBrands } from "@/app/services/brand.service";
import { PublicProductService } from "@/app/services/publicProduct.service";
import { CategoryDTO } from "@/app/types/category.type";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "https://api.agrishrimp.io.vn";
const CATEGORY_FALLBACK_IMAGE = "/placeholder.svg";
const HOME_FEATURE_BANNER = "/images/category-banner-fallback.svg";

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

  const partnerBrands = Object.values(
    brands.reduce<Record<string, (typeof brands)[number]>>((acc, brand) => {
      const normalizedName = brand.name.trim().toLowerCase();
      const key = normalizedName || String(brand.id);
      const current = acc[key];

      if (!current || (!current.logoUrl && brand.logoUrl)) {
        acc[key] = brand;
      }

      return acc;
    }, {})
  ).sort((a, b) => {
    const logoPriority = Number(Boolean(b.logoUrl)) - Number(Boolean(a.logoUrl));
    if (logoPriority !== 0) {
      return logoPriority;
    }

    return a.name.localeCompare(b.name, "vi");
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

  const featuredDesktopProducts = allProducts.slice(0, 10);
  const featuredFirstRowProducts = featuredDesktopProducts.slice(
    0,
    Math.min(featuredDesktopProducts.length, 5)
  );
  const featuredSecondRowProducts = featuredDesktopProducts.slice(5, 10);
  const shouldUseFeaturedShowcase = featuredDesktopProducts.length >= 10;

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
              <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5 md:gap-x-14">
                {partnerBrands.map((brand) => (
                  <Link
                    key={brand.id}
                    href={`/san-pham?brandId=${brand.id}`}
                    className="flex min-h-14 items-center justify-center px-2 transition-opacity hover:opacity-60"
                  >
                    {brand.logoUrl ? (
                      <Image
                        src={brand.logoUrl}
                        alt={brand.name}
                        width={140}
                        height={64}
                        className="h-12 w-auto object-contain md:h-14"
                      />
                    ) : (
                      <span className="whitespace-nowrap text-[15px] font-extrabold uppercase tracking-tight text-gray-700">
                        {brand.name}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ SECTION 3: Category Showcase ══ */}
      <div className="mx-auto mt-4 w-full max-w-[1880px] px-3 sm:px-4 md:px-6 xl:px-8">
        {loadingCats ? (
          <div className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex snap-x snap-mandatory gap-3 md:grid md:grid-cols-4 md:gap-5 xl:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[38vw] min-w-[138px] max-w-[158px] shrink-0 snap-start animate-pulse sm:w-[30vw] sm:min-w-[150px] sm:max-w-[176px] md:w-full md:max-w-[360px] md:justify-self-center">
                <div className="aspect-square rounded-t-[14px] bg-gray-100 md:aspect-[1.18/0.86]" />
                <div className="mt-2.5 h-10 rounded-[10px] bg-gray-100 md:mt-3 md:h-10" />
              </div>
            ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex snap-x snap-mandatory gap-3 md:grid md:grid-cols-4 md:gap-5 xl:gap-6">
              {showcaseCategories.map((cat) => {
                const style = CATEGORY_SHOWCASE_STYLE;
                const imageSrc = resolveCategoryImage(cat.imageUrl);

                return (
                <Link
                  key={cat.id}
                  href={`/san-pham?categoryId=${cat.id}`}
                  className="group block h-full w-[38vw] min-w-[138px] max-w-[158px] shrink-0 snap-start sm:w-[30vw] sm:min-w-[150px] sm:max-w-[176px] md:w-full md:max-w-[360px] md:justify-self-center"
                >
                  <div className={`border-x-[6px] border-t-[6px] ${style.frameClass} bg-white px-2 pt-2.5 shadow-sm transition-transform duration-300 group-hover:-translate-y-1 sm:px-3 sm:pt-3 md:border-x-[8px] md:border-t-[8px] md:px-4 md:pt-4`}>
                    <div className="flex aspect-square items-center justify-center overflow-hidden bg-white md:aspect-[1.18/0.86]">
                      <CategoryShowcaseImage
                        src={imageSrc ?? CATEGORY_FALLBACK_IMAGE}
                        alt={cat.name}
                      />
                    </div>
                  </div>
                  <div className={`relative z-10 -mt-2 flex min-h-[42px] items-center justify-center rounded-[10px] border bg-white px-2 py-2 text-center text-[10px] font-extrabold uppercase leading-tight tracking-tight shadow-sm transition-colors sm:px-3 sm:text-[11px] md:-mt-2 md:min-h-[48px] md:py-2 md:text-[12px] ${style.buttonClass}`}>
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
      <div className="mx-auto mt-4 w-full max-w-[1880px] px-3 sm:px-4 md:px-6 xl:px-8">

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
                        1
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

      <HomeLatestBlogSection />

    </div>
  );
}
