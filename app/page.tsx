"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Clock, Tag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import Banner from "@/components/site/SiteBanner";
import ProductCard, { ProductCardSkeleton } from "@/components/ui/product-card";
import { HomeService } from "@/app/services/home.service";
import { getPublicCategories } from "@/app/services/CategoryService";
import { getPublicBrands } from "@/app/services/brand.service";
import { PublicProductService } from "@/app/services/publicProduct.service";
import { CategoryDTO } from "@/app/types/category.type";

/* ── Sample news (chức năng blog làm sau) ── */
const SAMPLE_NEWS = [
  { id: 1, title: "Kỹ thuật nuôi tôm thẻ chân trắng đạt năng suất cao", date: "17/04/2026" },
  { id: 2, title: "Phòng bệnh đốm trắng trên tôm vào mùa mưa", date: "15/04/2026" },
  { id: 3, title: "Cách xử lý ao nuôi sau mỗi vụ thu hoạch", date: "14/04/2026" },
  { id: 4, title: "Tìm hiểu về chế phẩm vi sinh trong nuôi tôm", date: "08/04/2026" },
];

export default function Home() {
  const [activeCatId, setActiveCatId] = useState<number | null>(null);

  const { data: bestSellers = [], isLoading: loadingBest } = useQuery({
    queryKey: ["home", "best-sellers"],
    queryFn: () => HomeService.getBestSellers(12),
    staleTime: 5 * 60 * 1000,
  });

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

  const { data: catPage, isLoading: loadingCatProds } = useQuery({
    queryKey: ["home", "cat-products", activeCatId],
    queryFn: () => PublicProductService.getList({ categoryId: activeCatId!, page: 0, size: 12 }),
    enabled: activeCatId !== null,
    staleTime: 5 * 60 * 1000,
  });

  const parentCats: CategoryDTO[] = allCategories
    .filter((c: CategoryDTO) => !c.parentId || c.parentId === 0)
    .slice(0, 7);

  const tabProducts = catPage?.content ?? [];

  return (
    <div className="bg-[#f5f5f5] pb-10">

      {/* ══ SECTION 1: Hero ══ */}
      <div className="container mx-auto px-4 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-[210px_1fr_260px] gap-3">

          {/* ── Category Sidebar ── */}
          <aside className="hidden lg:block bg-white border border-gray-200 rounded overflow-hidden self-start">
            <div className="bg-gray-800 px-4 py-2.5">
              <h3 className="text-[12px] font-bold text-white uppercase tracking-widest">Danh Mục</h3>
            </div>
            <ul>
              {loadingCats
                ? Array.from({ length: 7 }).map((_, i) => (
                    <li key={i} className="flex items-center gap-2.5 px-4 py-2.5 animate-pulse border-b border-gray-100">
                      <div className="w-4 h-4 bg-gray-100 rounded shrink-0" />
                      <div className="h-3 bg-gray-100 rounded flex-1" />
                    </li>
                  ))
                : parentCats.map((cat) => (
                    <li key={cat.id} className="border-b border-gray-100 last:border-0">
                      <Link
                        href={`/san-pham?categoryId=${cat.id}`}
                        className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 hover:text-primary transition-colors group text-[13px] text-gray-700"
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
              <li>
                <Link
                  href="/san-pham"
                  className="flex items-center justify-center gap-1 px-4 py-2.5 text-[12px] text-primary font-semibold hover:bg-primary/5 transition-colors"
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
          <aside className="hidden lg:block bg-white border border-gray-200 rounded overflow-hidden self-start">
            <div className="flex border-b border-gray-200">
              <button type="button" className="flex-1 py-2.5 text-[13px] font-bold text-primary border-b-2 border-primary bg-primary/5">
                Tin tức
              </button>
              <button type="button" className="flex-1 py-2.5 text-[13px] text-gray-500 hover:bg-gray-50 transition-colors">
                Khuyến mãi
              </button>
            </div>
            <ul className="divide-y divide-gray-100">
              {SAMPLE_NEWS.map((news) => (
                <li key={news.id} className="p-3 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex gap-2.5">
                    <div className="w-[60px] h-[50px] bg-gray-100 rounded flex items-center justify-center shrink-0 text-[9px] text-gray-400 font-medium">
                      [Tin]
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-gray-800 line-clamp-2 leading-snug">{news.title}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Clock size={10} className="text-gray-400 shrink-0" />
                        <span className="text-[10px] text-gray-400">{news.date}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>

      {/* ══ SECTION 2: Brand Partners ══ */}
      {(loadingBrands || brands.length > 0) && (
        <div className="container mx-auto px-4 mt-4">
          <div className="bg-white border border-gray-200 rounded px-6 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center mb-4">
              Đơn vị đồng hành cùng chúng tôi
            </p>
            <div className="flex items-center justify-center gap-8 flex-wrap overflow-x-auto scrollbar-hide">
              {loadingBrands
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="w-20 h-7 bg-gray-100 rounded animate-pulse" />
                  ))
                : brands.map((brand) => (
                    <Link
                      key={brand.id}
                      href={`/san-pham?brandId=${brand.id}`}
                      className="flex items-center justify-center hover:opacity-60 transition-opacity shrink-0"
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
                        <span className="text-[13px] font-extrabold text-gray-700 uppercase tracking-tight">
                          {brand.name}
                        </span>
                      )}
                    </Link>
                  ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ SECTION 3: Category Tabs + Products ══ */}
      <div className="container mx-auto px-4 mt-4">

        {/* Tab bar */}
        <div className="bg-gray-800 rounded-t overflow-x-auto scrollbar-hide">
          <div className="flex items-center h-11 px-2 gap-1 min-w-max">
            <button
              type="button"
              onClick={() => setActiveCatId(null)}
              className={`px-4 h-7 rounded text-[11px] font-bold uppercase tracking-wide whitespace-nowrap transition-colors ${
                activeCatId === null
                  ? "bg-primary text-white"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
            >
              Bán chạy nhất
            </button>
            {parentCats.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCatId(cat.id)}
                className={`px-4 h-7 rounded text-[11px] font-bold uppercase tracking-wide whitespace-nowrap transition-colors ${
                  activeCatId === cat.id
                    ? "bg-primary text-white"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        <div className="bg-white border border-t-0 border-gray-200 rounded-b p-4">
          {activeCatId === null ? (
            /* Best sellers */
            loadingBest ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : bestSellers.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {bestSellers.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            ) : (
              <p className="text-center py-10 text-sm text-gray-400">Chưa có sản phẩm bán chạy</p>
            )
          ) : (
            /* Category products */
            loadingCatProds ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : tabProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {tabProducts.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            ) : (
              <p className="text-center py-10 text-sm text-gray-400">Chưa có sản phẩm trong danh mục này</p>
            )
          )}

          <div className="text-center mt-5 pt-4 border-t border-gray-100">
            <Link
              href={activeCatId ? `/san-pham?categoryId=${activeCatId}` : "/san-pham"}
              className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline"
            >
              Xem tất cả sản phẩm <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
