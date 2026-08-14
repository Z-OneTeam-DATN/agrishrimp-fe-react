import Link from "next/link";
import Image from "next/image";
import { Tag } from "lucide-react";

import Banner from "@/components/site/SiteBanner";
import HomeBestSellingProductsSection from "@/components/site/HomeBestSellingProductsSection";
import HomeFeaturedProductsSection from "@/components/site/HomeFeaturedProductsSection";
import HomeRecommendedProductsSection from "@/components/site/HomeRecommendedProductsSection";
import HomeLatestBlogSection from "@/components/site/HomeLatestBlogSection";
import { getPublicCategories } from "@/app/services/CategoryService";
import { getPublicBrands } from "@/app/services/brand.service";
import { getPublicBanners } from "@/app/services/banner.service";
import { getPublicBlogPosts } from "@/app/services/blog.service";
import { PublicProductService } from "@/app/services/publicProduct.service";
import { CategoryDTO } from "@/app/types/category.type";

export const dynamic = "force-dynamic";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "https://api.agrishrimp.io.vn";
const CATEGORY_FALLBACK_IMAGE = "/placeholder.svg";
const HOME_CONTENT_CONTAINER_CLASS =
  "mx-auto w-full max-w-[1440px] px-3 sm:px-4 md:px-6 xl:px-8";

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
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-sm bg-slate-50">
        <Tag size={30} className="text-primary/35" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
    />
  );
}

export default async function Home() {
  const [firstPage, bestSellerPage, allCategories, brands, banners, latestPosts] =
    await Promise.all([
      PublicProductService.getList({ page: 0, size: 18 }),
      PublicProductService.getList({ page: 0, size: 5, sort: "best-selling" }),
      getPublicCategories(),
      getPublicBrands(),
      getPublicBanners(),
      getPublicBlogPosts({ page: 0, size: 8 }),
    ]);

  const partnerBrands = Object.values(
    brands.reduce<Record<string, (typeof brands)[number]>>((acc, brand) => {
      const normalizedName = brand.name.trim().toLowerCase();
      const key = normalizedName || String(brand.id);
      const current = acc[key];

      if (!current || (!current.logoUrl && brand.logoUrl)) {
        acc[key] = brand;
      }

      return acc;
    }, {}),
  ).sort((a, b) => {
    const logoPriority =
      Number(Boolean(b.logoUrl)) - Number(Boolean(a.logoUrl));
    if (logoPriority !== 0) {
      return logoPriority;
    }

    return a.name.localeCompare(b.name, "vi");
  });

  const showcaseCategories: CategoryDTO[] = allCategories
    .filter((category) => !category.parentId || category.parentId === 0)
    .slice(0, 7);

  const resolveCategoryImage = (imagePath?: string | null) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http") || imagePath.startsWith("data:")) {
      return imagePath;
    }

    return `${BACKEND_ORIGIN}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
  };

  return (
    <div className="bg-[#f5f5f5] pb-10">
      <div className="w-full pt-0">
        <div className="mx-auto w-full max-w-[1440px] px-0 sm:px-4 md:px-6 xl:px-8">
          <div className="overflow-hidden">
            <Banner banners={banners} />
          </div>
        </div>
      </div>

      {partnerBrands.length > 0 && (
        <div className="mt-4 w-full">
          <div className={HOME_CONTENT_CONTAINER_CLASS}>
            <div className="w-full overflow-hidden border-y border-gray-200 bg-white px-4 pb-0.5 pt-1 md:px-6 md:pb-1 md:pt-1.5 lg:px-8">
              <p className="mb-0.5 text-center text-[11px] font-semibold leading-none text-gray-400">
                Đơn vị đồng hành cùng chúng tôi
              </p>

              <div className="animate-marquee items-center gap-x-12 md:gap-x-20">
                {[...partnerBrands, ...partnerBrands].map((brand, index) => (
                  <Link
                    key={`${brand.id}-${index}`}
                    href={`/san-pham?brandId=${brand.id}`}
                    className="flex min-h-[36px] shrink-0 items-center justify-center px-3 transition-opacity hover:opacity-60 md:min-h-[44px]"
                  >
                    {brand.logoUrl ? (
                      <Image
                        src={brand.logoUrl}
                        alt={brand.name}
                        width={380}
                        height={170}
                        className="h-20 w-auto object-contain md:h-24"
                      />
                    ) : (
                      <span className="whitespace-nowrap text-[24px] font-extrabold tracking-normal text-gray-700 md:text-[32px]">
                        {brand.name}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showcaseCategories.length > 0 && (
        <div className={`${HOME_CONTENT_CONTAINER_CLASS} mt-4`}>
          <div className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex snap-x snap-mandatory gap-3 md:grid md:grid-cols-4 md:gap-5 xl:gap-6">
              {showcaseCategories.map((category) => {
                const style = CATEGORY_SHOWCASE_STYLE;
                const imageSrc =
                  resolveCategoryImage(category.imageUrl) ??
                  CATEGORY_FALLBACK_IMAGE;

                return (
                  <Link
                    key={category.id}
                    href={`/san-pham?categoryId=${category.id}`}
                    className="group block h-full w-[38vw] min-w-[138px] max-w-[158px] shrink-0 snap-start sm:w-[30vw] sm:min-w-[150px] sm:max-w-[176px] md:w-full md:max-w-[360px] md:justify-self-center"
                  >
                    <div
                      className={`border-x-[6px] border-t-[6px] ${style.frameClass} bg-white px-2 pt-2.5 shadow-sm transition-transform duration-300 group-hover:-translate-y-1 sm:px-3 sm:pt-3 md:border-x-[8px] md:border-t-[8px] md:px-4 md:pt-4`}
                    >
                      <div className="flex aspect-square items-center justify-center overflow-hidden bg-white md:aspect-[1.18/0.86]">
                        <CategoryShowcaseImage
                          src={imageSrc}
                          alt={category.name}
                        />
                      </div>
                    </div>
                    <div
                      className={`relative z-10 -mt-2 flex min-h-[42px] items-center justify-center rounded-[10px] border bg-white px-2 py-2 text-center text-[11px] font-bold leading-tight tracking-normal shadow-sm transition-colors sm:px-3 sm:text-[12px] md:min-h-[48px] md:py-2 md:text-[13px] ${style.buttonClass}`}
                    >
                      {category.name}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <HomeRecommendedProductsSection />

      <HomeBestSellingProductsSection
        products={bestSellerPage.content ?? []}
        failed={bestSellerPage.failed}
      />

      <HomeFeaturedProductsSection initialPage={firstPage} />

      <HomeLatestBlogSection initialPosts={latestPosts.content ?? []} />
    </div>
  );
}
