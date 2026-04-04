"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  X,
  Loader2,
  PackageX,
  ChevronRight,
  Tag,
  BadgeCheck,
  LayoutGrid,
} from "lucide-react";
import { PublicProductService } from "@/app/services/publicProduct.service";
import { getPublicCategories } from "@/app/services/CategoryService";
import { getPublicBrands } from "@/app/services/brand.service";
import { PublicProductListItem } from "@/app/types/product.schema";
import { BrandDTO } from "@/app/types/brand.type";
import ProductCard, { ProductCardSkeleton } from "@/components/ui/product-card";
import LoadMoreButton from "@/components/ui/load-more-button";
import { useResponsiveColumns } from "@/hooks/useResponsiveColumns";
import { motion, AnimatePresence } from "framer-motion";

const PAGE_SIZE = 60;
const ROWS_PER_STEP = 3;

function mergeUniqueProducts(
  existing: PublicProductListItem[],
  incoming: PublicProductListItem[]
) {
  const merged = [...existing];
  const seenIds = new Set(existing.map((product) => product.id));

  incoming.forEach((product) => {
    if (!seenIds.has(product.id)) {
      seenIds.add(product.id);
      merged.push(product);
    }
  });

  return merged;
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
  const gridColumns = useResponsiveColumns({
    defaultColumns: 2,
    smColumns: 3,
  });

  const [products, setProducts] = useState<PublicProductListItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [fetchedPages, setFetchedPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<BrandDTO[]>([]);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [inputValue, setInputValue] = useState(keyword);
  const [categoryId, setCategoryId] = useState<string>(
    searchParams.get("categoryId") ?? ""
  );
  const [brandId, setBrandId] = useState<string>(
    searchParams.get("brandId") ?? ""
  );
  const [visibleRows, setVisibleRows] = useState(ROWS_PER_STEP);

  // Sync state with URL parameters (e.g. when searching from Header)
  useEffect(() => {
    const urlKeyword = searchParams.get("keyword") ?? "";
    const urlCategory = searchParams.get("categoryId") ?? "";
    const urlBrand = searchParams.get("brandId") ?? "";

    setKeyword(urlKeyword);
    setInputValue(urlKeyword);
    setCategoryId(urlCategory);
    setBrandId(urlBrand);
    setVisibleRows(ROWS_PER_STEP);
  }, [searchParams]);

  useEffect(() => {
    getPublicCategories().then((data) => setCategories(data));
    getPublicBrands().then((data) => setBrands(data));
  }, []);

  const fetchProducts = useCallback(async (pageIndex: number, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await PublicProductService.getList({
        keyword: keyword || undefined,
        categoryId: categoryId || undefined,
        brandId: brandId || undefined,
        page: pageIndex,
        size: PAGE_SIZE,
      });

      const nextProducts = result?.content ?? [];

      setProducts((prev) =>
        append ? mergeUniqueProducts(prev, nextProducts) : nextProducts
      );
      setTotalPages(result?.totalPages ?? 0);
      setTotalElements(result?.totalElements ?? 0);
      setFetchedPages((result?.totalPages ?? 0) > 0 ? pageIndex + 1 : 0);

      return result;
    } catch {
      if (!append) {
        setProducts([]);
        setTotalPages(0);
        setTotalElements(0);
        setFetchedPages(0);
      }

      return null;
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [keyword, categoryId, brandId]);

  useEffect(() => {
    setVisibleRows(ROWS_PER_STEP);
    fetchProducts(0);
  }, [fetchProducts]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (categoryId) params.set("categoryId", categoryId);
    if (brandId) params.set("brandId", brandId);
    const queryString = params.toString();
    router.replace(queryString ? `/san-pham?${queryString}` : "/san-pham", { scroll: false });
  }, [keyword, categoryId, brandId, router]);

  const handleInputChange = (val: string) => {
    setInputValue(val);
    setKeyword(val);
  };

  const handleCategoryChange = (id: string) => {
    setCategoryId(id);
    setShowMobileFilter(false);
  };

  const handleBrandChange = (id: string) => {
    setBrandId(id);
    setShowMobileFilter(false);
  };

  const visibleCount = visibleRows * gridColumns;
  const visibleProducts = useMemo(
    () => products.slice(0, visibleCount),
    [products, visibleCount]
  );
  const hasMoreProducts = visibleProducts.length < totalElements;

  const handleLoadMore = async () => {
    const nextRows = visibleRows + ROWS_PER_STEP;
    const targetVisibleCount = nextRows * gridColumns;

    if (products.length < targetVisibleCount && fetchedPages < totalPages) {
      await fetchProducts(fetchedPages, true);
    }

    setVisibleRows(nextRows);
  };

  const activeCategory = categories.find((c) => String(c.id) === categoryId);
  const activeBrand = brands.find((b) => String(b.id) === brandId);
  
  const parentCategories = categories.filter(
    (c) => (!c.parentId || c.parentId === 0) && (c.status === "ACTIVE" || c.status === undefined)
  );
  const getChildren = (parentId: number) => 
    categories.filter((c) => c.parentId === parentId && (c.status === "ACTIVE" || c.status === undefined));

  const sidebarContent = (
    <div className="space-y-6">
      <div className="space-y-1">
        <h6 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2 px-2">
          <Tag size={11} /> Danh Mục Sản Phẩm
        </h6>
        <button
          onClick={() => handleCategoryChange("")}
          className={`w-full text-left text-sm px-3 py-2.5 rounded-xl transition-all flex items-center justify-between gap-2 group ${
            !categoryId
              ? "bg-teal-50 text-teal-700 font-bold border border-teal-100 shadow-sm"
              : "text-gray-600 hover:bg-teal-50/50 hover:text-teal-700"
          }`}
        >
          <span className="flex items-center gap-2">
            <LayoutGrid size={14} className={!categoryId ? "text-teal-600" : "text-gray-400"} />
            Tất cả sản phẩm
          </span>
          {!categoryId && <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />}
        </button>

        {parentCategories.map((parent) => {
          const children = getChildren(parent.id);
          const hasChildren = children.length > 0;
          const isParentActive = String(parent.id) === categoryId;
          const isChildActive = children.some(child => String(child.id) === categoryId);
          const isActive = isParentActive || isChildActive;

          return (
            <div key={parent.id} className="space-y-1">
              <button
                onClick={() => handleCategoryChange(String(parent.id))}
                className={`w-full text-left text-sm px-3 py-2.5 rounded-xl transition-all flex items-center justify-between gap-2 group ${
                  isActive
                    ? "bg-teal-50 text-teal-700 font-bold border border-teal-100 shadow-sm"
                    : "text-gray-600 hover:bg-teal-50/50 hover:text-teal-700"
                }`}
              >
                <span className="truncate">{parent.name}</span>
                {hasChildren && (
                   <ChevronRight size={13} className={`transition-transform duration-300 ${isActive ? "rotate-90 text-teal-600" : "text-gray-300 group-hover:translate-x-0.5"}`} />
                )}
              </button>

              <AnimatePresence initial={false}>
                {hasChildren && isActive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="ml-4 pl-2 border-l border-teal-100 space-y-1 my-1">
                      {children.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => handleCategoryChange(String(child.id))}
                          className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-all ${
                            String(child.id) === categoryId
                              ? "bg-teal-100/50 text-teal-700 font-bold"
                              : "text-gray-500 hover:text-teal-600 hover:bg-gray-50"
                          }`}
                        >
                          {child.name}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="space-y-1">
        <h6 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2 px-2 pt-4 border-t border-gray-100">
          <BadgeCheck size={11} /> Thương hiệu
        </h6>
        <div className="grid grid-cols-1 gap-1">
          <button
            onClick={() => handleBrandChange("")}
            className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-all flex items-center justify-between gap-2 group ${
              !brandId
                ? "bg-teal-50 text-teal-700 font-bold border border-teal-100 shadow-sm"
                : "text-gray-600 hover:bg-teal-50/50 hover:text-teal-700"
            }`}
          >
            <span>Tất cả thương hiệu</span>
            {!brandId && <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />}
          </button>
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => handleBrandChange(String(brand.id))}
              className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-all flex items-center justify-between gap-2 group ${
                String(brand.id) === brandId
                  ? "bg-teal-50 text-teal-700 font-bold border border-teal-100 shadow-sm"
                  : "text-gray-600 hover:bg-teal-50/50 hover:text-teal-700"
              }`}
            >
              <span className="truncate">{brand.name}</span>
              {String(brand.id) === brandId && <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-16 font-sans">
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
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 md:items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Search size={20} className="text-teal-600" />
                  {keyword ? (
                    <>
                      Kết quả tìm kiếm cho: <span className="text-teal-600">&ldquo;{keyword}&rdquo;</span>
                    </>
                  ) : (
                    "Tất cả sản phẩm"
                  )}
                </h2>
                {!loading && (
                   <p className="text-xs text-gray-500 font-medium">
                    Tìm thấy <span className="text-teal-600 font-bold">{totalElements}</span> sản phẩm trùng khớp
                  </p>
                )}
              </div>

              <div className="flex flex-1 max-w-md items-center gap-3">
                <div className="relative flex-1">
                  {loading ? (
                    <Loader2
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-600 animate-spin"
                    />
                  ) : (
                    <Search
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  )}
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Tìm sản phẩm khác..."
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all bg-gray-50/50"
                  />
                </div>
                
                <button
                  onClick={() => setShowMobileFilter(true)}
                  className="lg:hidden flex items-center gap-2 bg-teal-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm whitespace-nowrap"
                >
                  <SlidersHorizontal size={14} /> Lọc
                </button>
              </div>
            </div>

            {/* Active filters */}
            {(keyword || categoryId || brandId) && (
              <div className="flex flex-wrap gap-2">
                {keyword && (
                  <span className="inline-flex items-center gap-1.5 bg-white text-teal-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-teal-200 shadow-sm">
                    <Search size={11} />
                    &ldquo;{keyword}&rdquo;
                    <button
                      onClick={() => {
                        setKeyword("");
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
                {brandId && activeBrand && (
                  <span className="inline-flex items-center gap-1.5 bg-white text-teal-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-teal-200 shadow-sm">
                    <BadgeCheck size={11} />
                    {activeBrand.name}
                    <button
                      onClick={() => handleBrandChange("")}
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
                    setBrandId("");
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
                  {visibleProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {hasMoreProducts && (
                  <LoadMoreButton
                    onClick={handleLoadMore}
                    loading={loadingMore}
                  />
                )}
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
                {(keyword || categoryId || brandId) && (
                  <button
                    onClick={() => {
                      setKeyword("");
                      setCategoryId("");
                      setBrandId("");
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
