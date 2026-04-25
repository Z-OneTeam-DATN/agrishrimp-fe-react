"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Clock, Tag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import Banner from "@/components/site/SiteBanner";
import ProductCard, { ProductCardSkeleton } from "@/components/ui/product-card";
import { getPublicCategories } from "@/app/services/CategoryService";
import { getPublicBrands } from "@/app/services/brand.service";
import { getPublicBlogPosts } from "@/app/services/blog.service";
import { PublicProductService } from "@/app/services/publicProduct.service";
import { CategoryDTO } from "@/app/types/category.type";

/* Short taglines for category bar — indexed by position */
const CAT_TAGLINES = [
  "Dinh dưỡng tối ưu",
  "Phòng bệnh hiệu quả",
  "Môi trường sạch",
  "Thiết bị hiện đại",
  "Giống chất lượng cao",
  "Phụ kiện đầy đủ",
  "Giải pháp toàn diện",
];

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

  const { data: newsPage, isLoading: loadingNews } = useQuery({
    queryKey: ["home", "blog-news"],
    queryFn: () => getPublicBlogPosts({ page: 0, size: 4 }),
    staleTime: 5 * 60 * 1000,
  });

  const newsPosts = newsPage?.content ?? [];

  const parentCats: CategoryDTO[] = allCategories
    .filter((c: CategoryDTO) => !c.parentId || c.parentId === 0)
    .slice(0, 7);

  const formatNewsDate = (value?: string | null) =>
    value
      ? new Intl.DateTimeFormat("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(new Date(value))
      : "";

  return (
    <div className="bg-[#f5f5f5] pb-10">

      {/* ══ SECTION 1: Hero ══ */}
      <div className="container mx-auto px-4 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_240px] gap-3">

          {/* ── Category Sidebar ── */}
          <aside className="hidden lg:flex flex-col bg-white border border-gray-200 rounded overflow-hidden">
            <div className="bg-white px-4 py-2.5 border-b border-gray-200 shrink-0">
              <h3 className="text-[12px] font-bold text-gray-800 uppercase tracking-widest">Danh Mục</h3>
            </div>
            <ul className="flex flex-col flex-1">
              {loadingCats
                ? Array.from({ length: 5 }).map((_, i) => (
                    <li key={i} className="flex items-center gap-2.5 px-4 animate-pulse border-b border-gray-100 flex-1">
                      <div className="w-4 h-4 bg-gray-100 rounded shrink-0" />
                      <div className="h-3 bg-gray-100 rounded flex-1" />
                    </li>
                  ))
                : parentCats.slice(0, 5).map((cat) => (
                    <li key={cat.id} className="border-b border-gray-100 flex-1 flex items-center">
                      <Link
                        href={`/san-pham?categoryId=${cat.id}`}
                        className="flex items-center gap-2.5 px-4 py-3 w-full hover:bg-gray-50 hover:text-primary transition-colors group text-[13px] text-gray-700"
                      >
                        {cat.imageUrl ? (
                          <Image src={cat.imageUrl} alt={cat.name} width={18} height={18} className="object-contain shrink-0" />
                        ) : (
                          <Tag size={14} className="text-primary shrink-0" />
                        )}
                        <span className="flex-1 truncate">{cat.name}</span>
                        <ChevronRight size={12} className="text-gray-300 group-hover:text-primary shrink-0" />
                      </Link>
                    </li>
                  ))}
              <li className="mt-auto border-t border-gray-100">
                <Link
                  href="/san-pham"
                  className="flex items-center justify-center gap-1 px-4 py-3 text-[12px] text-primary font-semibold hover:bg-primary/5 transition-colors"
                >
                  Xem thêm <ChevronRight size={12} />
                </Link>
              </li>
            </ul>
          </aside>

          {/* ── Banner ── */}
          <div className="min-w-0">
            <Banner />
          </div>

          {/* ── News Sidebar ── */}
          <aside className="hidden lg:flex flex-col bg-white border border-gray-200 rounded overflow-hidden">
            <div className="bg-white px-4 py-2.5 border-b border-gray-200 shrink-0">
              <h3 className="text-[12px] font-bold text-gray-800 uppercase tracking-widest">Tin tức</h3>
            </div>
            <ul className="flex flex-col flex-1 divide-y divide-gray-100">
              {loadingNews ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className="flex-1">
                    <div className="flex gap-2.5 px-3 py-3 animate-pulse">
                      <div className="w-[60px] h-[52px] rounded bg-gray-100 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 rounded bg-gray-100 w-full" />
                        <div className="h-3 rounded bg-gray-100 w-4/5" />
                        <div className="h-2.5 rounded bg-gray-100 w-1/3" />
                      </div>
                    </div>
                  </li>
                ))
              ) : newsPosts.length > 0 ? (
                newsPosts.map((news) => (
                  <li key={news.id} className="flex-1">
                    <Link
                      href={`/blog/${news.slug}`}
                      className="flex gap-2.5 px-3 py-3 w-full hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-[60px] h-[52px] bg-gray-100 rounded overflow-hidden flex items-center justify-center shrink-0 text-[9px] text-gray-400 font-medium">
                        {news.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={news.thumbnailUrl}
                            alt={news.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          "[Tin]"
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-gray-800 line-clamp-2 leading-snug">
                          {news.title}
                        </p>
                        <div className="flex items-center gap-1 mt-1.5">
                          <Clock size={10} className="text-gray-400 shrink-0" />
                          <span className="text-[10px] text-gray-400">
                            {formatNewsDate(news.publishedAt ?? news.createdAt)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))
              ) : (
                <li className="px-4 py-6 text-center text-[12px] text-gray-400">
                  Chưa có bài viết mới.
                </li>
              )}
            </ul>
          </aside>
        </div>
      </div>

      {/* ══ SECTION 2: Brand Partners — 1-row marquee ══ */}
      {(loadingBrands || brands.length > 0) && (
        <div className="container mx-auto px-4 mt-4">
          <div className="bg-white border border-gray-200 rounded px-6 py-4 overflow-hidden">
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

        {/* Dark green tagline bar */}
        <div className="bg-primary rounded-t overflow-hidden">
          {loadingCats ? (
            <div className="h-10 animate-pulse bg-primary/80" />
          ) : (
            <div className="flex items-center justify-evenly h-10 px-4">
              {parentCats.map((cat, i) => (
                <span key={cat.id} className="text-[11px] font-semibold text-white/90 whitespace-nowrap uppercase tracking-wide">
                  {CAT_TAGLINES[i] ?? cat.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Category card grid */}
        <div className="bg-white border border-t-0 border-gray-200 rounded-b p-4">
          {loadingCats ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
                  <div className="w-full aspect-square bg-gray-100 rounded-lg" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
              {parentCats.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/san-pham?categoryId=${cat.id}`}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-full aspect-[4/3] rounded-xl overflow-hidden shadow-sm border border-gray-100 group-hover:border-primary/30 transition-colors">
                    {cat.imageUrl ? (
                      <Image
                        src={cat.imageUrl}
                        alt={cat.name}
                        width={160}
                        height={120}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                        <Tag size={28} className="text-primary/40" />
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-gray-700 text-center leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
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
