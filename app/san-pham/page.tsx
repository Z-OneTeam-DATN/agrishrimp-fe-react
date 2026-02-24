"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  X,
  Loader2,
  PackageX,
  ChevronRight,
  ChevronLeft,
  Tag,
  ShoppingCart,
  Layers,
  BadgeCheck,
  Store,
  LayoutGrid,
} from "lucide-react";
import { PublicProductService } from "@/app/services/publicProduct.service";
import { getCategories } from "@/app/services/CategoryService";
import { PublicProductListItem } from "@/app/types/product.schema";
import { formatNumber } from "@/lib/utils";
import ProductCard, { ProductCardSkeleton } from "@/components/ui/product-card";

const PAGE_SIZE = 20;

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  const delta = 2;
  for (let i = 0; i < totalPages; i++) {
    if (
      i === 0 ||
      i === totalPages - 1 ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 disabled:opacity-30 hover:border-teal-500 hover:text-teal-600 transition-colors bg-white shadow-sm"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p, idx) =>
        p === "..." ? (
          <span
            key={`ellipsis-${idx}`}
            className="w-9 text-center text-gray-400 text-sm"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={`w-9 h-9 rounded-xl text-sm font-bold transition-all shadow-sm ${
              p === currentPage
                ? "bg-teal-600 text-white shadow-teal-200"
                : "bg-white border border-gray-200 text-gray-600 hover:border-teal-500 hover:text-teal-600"
            }`}
          >
            {(p as number) + 1}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 disabled:opacity-30 hover:border-teal-500 hover:text-teal-600 transition-colors bg-white shadow-sm"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export default function ProductListingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-teal-600" size={32} />
        </div>
      }
    >
      <ProductListingInner />
    </Suspense>
  );
}

function ProductListingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<PublicProductListItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<any[]>([]);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [categoryId, setCategoryId] = useState<string>(
    searchParams.get("categoryId") ?? ""
  );
  const [page, setPage] = useState(Number(searchParams.get("page") ?? "0"));

  const keywordDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    getCategories().then((data) => setCategories(data));
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await PublicProductService.getList({
        keyword: keyword || undefined,
        categoryId: categoryId || undefined,
        page,
        size: PAGE_SIZE,
      });
      setProducts(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch {
      setProducts([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [keyword, categoryId, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (categoryId) params.set("categoryId", categoryId);
    if (page > 0) params.set("page", String(page));
    router.replace(`/san-pham?${params.toString()}`, { scroll: false });
  }, [keyword, categoryId, page, router]);

  const handleKeywordChange = (val: string) => {
    if (keywordDebounceRef.current) clearTimeout(keywordDebounceRef.current);
    keywordDebounceRef.current = setTimeout(() => {
      setKeyword(val);
      setPage(0);
    }, 400);
  };

  const handleCategoryChange = (id: string) => {
    setCategoryId(id);
    setPage(0);
    setShowMobileFilter(false);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeCategory = categories.find((c) => String(c.id) === categoryId);
  const activeCategories = categories.filter(
    (c) => c.status === "ACTIVE" || c.status === undefined
  );

  const sidebarContent = (
    <div className="space-y-1">
      <h6 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2 px-2">
        <Tag size={11} /> Danh Mục Sản Phẩm
      </h6>
      <button
        onClick={() => handleCategoryChange("")}
        className={`w-full text-left text-sm px-3 py-2.5 rounded-xl transition-all flex items-center justify-between gap-2 ${
          !categoryId
            ? "bg-teal-600 text-white font-semibold shadow-sm shadow-teal-200"
            : "text-gray-600 hover:bg-teal-50 hover:text-teal-700"
        }`}
      >
        <span className="flex items-center gap-2">
          <LayoutGrid size={14} />
          Tất cả sản phẩm
        </span>
        {!categoryId && <ChevronRight size={13} />}
      </button>
      {activeCategories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => handleCategoryChange(String(cat.id))}
          className={`w-full text-left text-sm px-3 py-2.5 rounded-xl transition-all flex items-center justify-between gap-2 ${
            String(cat.id) === categoryId
              ? "bg-teal-600 text-white font-semibold shadow-sm shadow-teal-200"
              : "text-gray-600 hover:bg-teal-50 hover:text-teal-700"
          }`}
        >
          <span className="truncate">{cat.name}</span>
          {String(cat.id) === categoryId && <ChevronRight size={13} />}
        </button>
      ))}
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-16 font-sans">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-500 text-white">
        <div className="container mx-auto px-4 py-5">
          <nav className="text-[11px] font-semibold text-teal-100/80 flex items-center gap-1.5 uppercase tracking-wider mb-2">
            <Link href="/" className="hover:text-white transition-colors">
              Trang chủ
            </Link>
            <ChevronRight size={10} />
            <span className="text-white">Sản phẩm</span>
            {activeCategory && (
              <>
                <ChevronRight size={10} />
                <span className="text-white">{activeCategory.name}</span>
              </>
            )}
          </nav>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {activeCategory ? activeCategory.name : "Tất cả sản phẩm"}
          </h1>
          {!loading && (
            <p className="text-teal-100/80 text-sm mt-0.5">
              {totalElements} sản phẩm
            </p>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showMobileFilter && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setShowMobileFilter(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 w-[80%] max-w-xs bg-white z-[51] shadow-2xl transform transition-transform duration-300 ${
          showMobileFilter ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <span className="font-bold text-sm text-gray-800 uppercase tracking-wide flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-teal-600" />
            Lọc sản phẩm
          </span>
          <button
            onClick={() => setShowMobileFilter(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto h-full pb-20">{sidebarContent}</div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-24">
              {sidebarContent}
            </div>
          </aside>

          {/* Main content */}
          <main className="lg:col-span-3 space-y-4">
            {/* Search + filter bar */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center">
              <div className="flex-1 min-w-[180px] relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  defaultValue={keyword}
                  onChange={(e) => handleKeywordChange(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all bg-gray-50/50"
                />
              </div>
              <div className="flex items-center gap-3">
                {!loading && (
                  <span className="text-xs text-gray-400 font-medium whitespace-nowrap hidden sm:block">
                    {totalElements} sản phẩm
                  </span>
                )}
                <button
                  onClick={() => setShowMobileFilter(true)}
                  className="lg:hidden flex items-center gap-2 bg-teal-600 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-sm"
                >
                  <SlidersHorizontal size={14} /> Danh mục
                </button>
              </div>
            </div>

            {/* Active filters */}
            {(keyword || categoryId) && (
              <div className="flex flex-wrap gap-2">
                {keyword && (
                  <span className="inline-flex items-center gap-1.5 bg-white text-teal-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-teal-200 shadow-sm">
                    <Search size={11} />
                    &ldquo;{keyword}&rdquo;
                    <button
                      onClick={() => {
                        setKeyword("");
                        setPage(0);
                      }}
                      className="ml-0.5 hover:text-red-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {categoryId && activeCategory && (
                  <span className="inline-flex items-center gap-1.5 bg-white text-teal-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-teal-200 shadow-sm">
                    <Tag size={11} />
                    {activeCategory.name}
                    <button
                      onClick={() => handleCategoryChange("")}
                      className="ml-0.5 hover:text-red-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setKeyword("");
                    setCategoryId("");
                    setPage(0);
                  }}
                  className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors px-2"
                >
                  Xóa tất cả
                </button>
              </div>
            )}

            {/* Product grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {[...Array(6)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-gray-100 text-center px-6">
                <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                  <PackageX className="text-gray-300" size={40} />
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-1.5">
                  Không tìm thấy sản phẩm
                </h3>
                <p className="text-sm text-gray-400 max-w-xs">
                  Thử điều chỉnh từ khóa hoặc chọn danh mục khác để tìm sản
                  phẩm phù hợp.
                </p>
                {(keyword || categoryId) && (
                  <button
                    onClick={() => {
                      setKeyword("");
                      setCategoryId("");
                      setPage(0);
                    }}
                    className="mt-5 text-sm text-white bg-teal-600 hover:bg-teal-700 font-semibold px-5 py-2 rounded-xl transition-colors"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
