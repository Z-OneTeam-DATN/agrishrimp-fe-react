"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Clock, Tag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import Banner from "@/components/site/SiteBanner";
import ProductCard, { ProductCardSkeleton } from "@/components/ui/product-card";
import { HomeService } from "@/app/services/home.service";
import { getPublicCategories } from "@/app/services/CategoryService";
import { getPublicBrands } from "@/app/services/brand.service";
import { CategoryDTO } from "@/app/types/category.type";

const SAMPLE_NEWS = [
  { id: 1, title: "Kỹ thuật nuôi tôm thẻ chân trắng đạt năng suất cao", date: "17/04/2026" },
  { id: 2, title: "Phòng bệnh đốm trắng trên tôm vào mùa mưa", date: "15/04/2026" },
  { id: 3, title: "Cách xử lý ao nuôi sau mỗi vụ thu hoạch", date: "14/04/2026" },
  { id: 4, title: "Tìm hiểu về chế phẩm vi sinh trong nuôi tôm", date: "08/04/2026" },
];

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

  const parentCats: CategoryDTO[] = allCategories
    .filter((c: CategoryDTO) => !c.parentId || c.parentId === 0)
    .slice(0, 7);

  return (
    <div className="bg-[#f5f5f5] pb-10">

      {/* ══ SECTION 1: Hero ══ */}
      <div className="container mx-auto px-4 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_240px] gap-3 items-start">

          {/* ── Category Sidebar ── */}
          <aside className="hidden lg:block bg-white border border-gray-200 rounded overflow-hidden self-start">
            <div className="bg-white px-4 py-2.5 border-b border-gray-200">
              <h3 className="text-[12px] font-bold text-gray-800 uppercase tracking-widest">Danh Mục</h3>
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
            <div className="bg-white px-4 py-2.5 border-b border-gray-200">
              <h3 className="text-[12px] font-bold text-gray-800 uppercase tracking-widest">Tin tức</h3>
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
        <div className="bg-white border border-gray-200 rounded-t flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-3">
            <span className="w-1 h-5 bg-primary rounded-full shrink-0" />
            <span className="text-[15px] font-black uppercase tracking-wide text-gray-900">
              Sản phẩm nổi bật
            </span>
          </div>
          <Link
            href="/san-pham"
            className="flex items-center gap-1 text-[13px] font-semibold text-gray-600 hover:text-primary transition-colors"
          >
            Xem tất cả <ChevronRight size={13} />
          </Link>
        </div>

        {/* Product grid */}
        <div className="bg-white border border-t-0 border-gray-200 rounded-b p-4">
          {loadingBest ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : bestSellers.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {bestSellers.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <p className="text-center py-10 text-sm text-gray-400">Chưa có sản phẩm</p>
          )}
        </div>
      </div>

    </div>
  );
}
