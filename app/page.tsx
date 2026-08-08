import Link from "next/link";
import Image from "next/image";
import { Tag } from "lucide-react";

import JsonLd from "@/components/seo/JsonLd";
import Banner from "@/components/site/SiteBanner";
import HomeFeaturedProductsSection from "@/components/site/HomeFeaturedProductsSection";
import HomeRecommendedProductsSection from "@/components/site/HomeRecommendedProductsSection";
import HomeLatestBlogSection from "@/components/site/HomeLatestBlogSection";
import { getPublicCategories } from "@/app/services/CategoryService";
import { getPublicBrands } from "@/app/services/brand.service";
import { getPublicBanners } from "@/app/services/banner.service";
import { getPublicBlogPosts } from "@/app/services/blog.service";
import { PublicProductService } from "@/app/services/publicProduct.service";
import { CategoryDTO } from "@/app/types/category.type";
import { breadcrumbJsonLd, organizationJsonLd } from "@/lib/seo";

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
  const [firstPage, allCategories, brands, banners, latestPosts] =
    await Promise.all([
      PublicProductService.getList({ page: 0, size: 18 }),
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
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Trang chủ", path: "/" }])} />
      <div className="bg-[#f5f5f5] pb-10">
      <div className="w-full pt-0">
        <div className="mx-auto w-full max-w-[1440px] px-0 sm:px-4 md:px-6 xl:px-8">
          <div className="overflow-hidden">
            <Banner banners={banners} />
          </div>
        </div>
      </div>

      <section className={`${HOME_CONTENT_CONTAINER_CLASS} mt-4`}>
        <div className="rounded-md border border-blue-100 bg-white px-4 py-6 shadow-sm md:px-8 md:py-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-blue-700">
            AgriShrimp
          </p>
          <h1 className="mt-2 max-w-4xl text-2xl font-black leading-tight text-slate-950 md:text-4xl">
            AI Chẩn Đoán Bệnh Tôm & Giải Pháp Nuôi Tôm AgriShrimp
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-700 md:text-base">
            AgriShrimp kết nối AI Doctor, kho tri thức bệnh tôm, blog kỹ thuật
            nuôi tôm và catalog vật tư thủy sản để hỗ trợ bà con tra cứu thông
            tin và sản phẩm phù hợp.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/chan-doan-benh-tom-bang-ai"
              className="rounded-md bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800"
            >
              Chẩn đoán bệnh tôm bằng AI
            </Link>
            <Link
              href="/benh-tom"
              className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-800 hover:border-blue-500 hover:text-blue-700"
            >
              Kho bệnh tôm
            </Link>
            <Link
              href="/vat-tu-thuy-san"
              className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-800 hover:border-blue-500 hover:text-blue-700"
            >
              Vật tư thủy sản
            </Link>
            <Link
              href="/blog"
              className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-800 hover:border-blue-500 hover:text-blue-700"
            >
              Blog kiến thức nuôi tôm
            </Link>
          </div>
        </div>
      </section>

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
                    href={category.slug ? `/danh-muc/${category.slug}` : `/san-pham?categoryId=${category.id}`}
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

      <HomeFeaturedProductsSection initialPage={firstPage} />

      <HomeLatestBlogSection initialPosts={latestPosts.content ?? []} />
      </div>
    </>
  );
}
