"use client";

import { useState, useEffect, useCallback, useMemo, Suspense, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  Menu,
  X,
  Loader2,
  PackageX,
  ArrowUpDown,
  ChevronDown,
  Check,
  Tag,
  BadgeCheck,
} from "lucide-react";
import { PublicProductService } from "@/app/services/publicProduct.service";
import { getPublicCategories } from "@/app/services/CategoryService";
import { getPublicBrands } from "@/app/services/brand.service";
import { getPublicAttributes } from "@/app/services/AttributeService";
import { PublicProductListItem } from "@/app/types/product.schema";
import { BrandDTO } from "@/app/types/brand.type";
import { CategoryDTO } from "@/app/types/category.type";
import ProductCard, { ProductCardSkeleton } from "@/components/ui/product-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 15;

type PriceRangeOption = {
  id: "under-200" | "200-300" | "300-400" | "400-500" | "over-500";
  label: string;
  minPrice?: number;
  maxPrice?: number;
};

const PRICE_RANGES: PriceRangeOption[] = [
  { id: "under-200", label: "Dưới 200.000đ", maxPrice: 200_000 },
  { id: "200-300", label: "200.000đ - 300.000đ", minPrice: 200_000, maxPrice: 300_000 },
  { id: "300-400", label: "300.000đ - 400.000đ", minPrice: 300_000, maxPrice: 400_000 },
  { id: "400-500", label: "400.000đ - 500.000đ", minPrice: 400_000, maxPrice: 500_000 },
  { id: "over-500", label: "Trên 500.000đ", minPrice: 500_000 },
];

type PriceRangeId = PriceRangeOption["id"] | "";

type PackagingOption = {
  id: string;
  label: string;
};

type SortOption = {
  id:
    | "featured"
    | "price-asc"
    | "price-desc"
    | "name-asc"
    | "name-desc"
    | "oldest"
    | "newest"
    | "best-selling"
    | "inventory-desc";
  label: string;
};

const SORT_OPTIONS: SortOption[] = [
  { id: "featured", label: "Sản phẩm nổi bật" },
  { id: "price-asc", label: "Giá: Tăng dần" },
  { id: "price-desc", label: "Giá: Giảm dần" },
  { id: "name-asc", label: "Tên: A-Z" },
  { id: "name-desc", label: "Tên: Z-A" },
  { id: "oldest", label: "Cũ nhất" },
  { id: "newest", label: "Mới nhất" },
  { id: "best-selling", label: "Bán chạy nhất" },
  { id: "inventory-desc", label: "Tồn kho giảm dần" },
];

function parseSingleParam(value: string | null) {
  return value?.trim() ?? "";
}

function parsePageParam(value: string | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function resolveSortParam(value: string | null): SortOption["id"] {
  return SORT_OPTIONS.find((option) => option.id === value)?.id ?? "featured";
}

function buildPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 1) return [1];

  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const normalizedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const items: Array<number | "ellipsis"> = [];
  normalizedPages.forEach((page, index) => {
    if (index > 0 && page - normalizedPages[index - 1] > 1) {
      items.push("ellipsis");
    }
    items.push(page);
  });

  return items;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function resolvePriceRangeId(minPrice: string | null, maxPrice: string | null): PriceRangeId {
  const min = minPrice ? Number(minPrice) : undefined;
  const max = maxPrice ? Number(maxPrice) : undefined;
  const matched = PRICE_RANGES.find(
    (range) => range.minPrice === min && range.maxPrice === max
  );
  return matched?.id ?? "";
}

function FilterCheckbox({
  checked,
  label,
  onClick,
}: {
  checked: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] font-normal text-slate-900 transition-colors hover:bg-slate-50"
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center border text-[10px] ${
          checked ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white"
        }`}
      >
        {checked ? "✓" : ""}
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between border-b border-slate-200 px-4 py-3 text-left text-[15px] font-semibold text-slate-950"
      >
        <span>{title}</span>
        <ChevronDown
          size={16}
          className={`text-slate-600 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="py-1">{children}</div>}
    </section>
  );
}

export default function ProductListingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-blue-600" size={32} />
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

  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [brands, setBrands] = useState<BrandDTO[]>([]);
  const [packagingOptions, setPackagingOptions] = useState<PackagingOption[]>([]);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [inputValue, setInputValue] = useState(keyword);
  const [categoryId, setCategoryId] = useState<string>(
    searchParams.get("categoryId") ?? ""
  );
  const [brandId, setBrandId] = useState<string>(
    searchParams.get("brandId") ?? ""
  );
  const [priceRangeId, setPriceRangeId] = useState<PriceRangeId>(
    resolvePriceRangeId(searchParams.get("minPrice"), searchParams.get("maxPrice"))
  );
  const [selectedPackagingValueId, setSelectedPackagingValueId] = useState<string>(
    parseSingleParam(searchParams.get("packagingValueIds"))
  );
  const [currentPage, setCurrentPage] = useState<number>(
    parsePageParam(searchParams.get("page"))
  );
  const [sortBy, setSortBy] = useState<SortOption["id"]>(
    resolveSortParam(searchParams.get("sort"))
  );

  useEffect(() => {
    const urlKeyword = searchParams.get("keyword") ?? "";
    const urlCategory = searchParams.get("categoryId") ?? "";
    const urlBrand = searchParams.get("brandId") ?? "";
    const urlPriceRange = resolvePriceRangeId(
      searchParams.get("minPrice"),
      searchParams.get("maxPrice")
    );
    const urlPackagingValueId = parseSingleParam(searchParams.get("packagingValueIds"));
    const urlPage = parsePageParam(searchParams.get("page"));
    const urlSort = resolveSortParam(searchParams.get("sort"));

    setKeyword(urlKeyword);
    setInputValue(urlKeyword);
    setCategoryId(urlCategory);
    setBrandId(urlBrand);
    setPriceRangeId(urlPriceRange);
    setSelectedPackagingValueId(urlPackagingValueId);
    setCurrentPage(urlPage);
    setSortBy(urlSort);
  }, [searchParams]);

  useEffect(() => {
    getPublicCategories().then((data) => setCategories(data));
    getPublicBrands().then((data) =>
      setBrands(data.filter((brand) => brand.status !== "INACTIVE"))
    );
    getPublicAttributes().then((attributes) => {
      const packagingAttribute = attributes.find((attribute) => {
        const normalizedName = normalizeText(attribute.name || "");
        const normalizedCode = normalizeText(attribute.code || "");

        return (
          normalizedName.includes("quy cach dong goi") ||
          normalizedName.includes("dong goi") ||
          normalizedCode.includes("quy cach dong goi") ||
          normalizedCode.includes("dong goi") ||
          normalizedCode.includes("packaging")
        );
      });

      const options =
        packagingAttribute?.valueDetails
          ?.filter((item) => item.valueId && item.value)
          .map((item) => ({
            id: String(item.valueId),
            label: item.value.trim(),
          })) ?? [];

      setPackagingOptions(
        Array.from(
          new Map(
            options
              .filter((item) => item.id && item.label)
              .map((item) => [item.id, item])
          ).values()
        )
      );
    });
  }, []);

  const activePriceRange = useMemo(
    () => PRICE_RANGES.find((range) => range.id === priceRangeId),
    [priceRangeId]
  );
  const selectedPackagingOption = useMemo(
    () => packagingOptions.find((option) => option.id === selectedPackagingValueId) ?? null,
    [packagingOptions, selectedPackagingValueId]
  );
  const packagingValueIdsParam = selectedPackagingValueId;
  const packagingParam = selectedPackagingOption?.label ?? "";
  const packagingLabelById = useMemo(
    () =>
      new Map(
        packagingOptions.map((option) => [option.id, option.label])
      ),
    [packagingOptions]
  );

  const fetchProducts = useCallback(async (pageIndex: number) => {
    setLoading(true);
    try {
      const result = await PublicProductService.getList({
        keyword: keyword || undefined,
        categoryId: categoryId || undefined,
        brandId: brandId || undefined,
        minPrice: activePriceRange?.minPrice,
        maxPrice: activePriceRange?.maxPrice,
        packaging: packagingParam || undefined,
        packagingValueIds: packagingValueIdsParam || undefined,
        sort: sortBy,
        page: pageIndex,
        size: PAGE_SIZE,
      });

      const nextProducts = result?.content ?? [];
      setProducts(nextProducts);
      setTotalPages(result?.totalPages ?? 0);
      setTotalElements(result?.totalElements ?? 0);

      return result;
    } catch {
      setProducts([]);
      setTotalPages(0);
      setTotalElements(0);
      return null;
    } finally {
      setLoading(false);
    }
  }, [keyword, categoryId, brandId, activePriceRange, packagingParam, packagingValueIdsParam, sortBy]);

  useEffect(() => {
    fetchProducts(currentPage - 1);
  }, [fetchProducts, currentPage]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (categoryId) params.set("categoryId", categoryId);
    if (brandId) params.set("brandId", brandId);
    if (activePriceRange?.minPrice !== undefined) {
      params.set("minPrice", String(activePriceRange.minPrice));
    }
    if (activePriceRange?.maxPrice !== undefined) {
      params.set("maxPrice", String(activePriceRange.maxPrice));
    }
    if (packagingValueIdsParam) params.set("packagingValueIds", packagingValueIdsParam);
    if (packagingParam) params.set("packaging", packagingParam);
    if (sortBy !== "featured") params.set("sort", sortBy);
    if (currentPage > 1) params.set("page", String(currentPage));
    const queryString = params.toString();
    router.replace(queryString ? `/san-pham?${queryString}` : "/san-pham", { scroll: false });
  }, [keyword, categoryId, brandId, activePriceRange, packagingParam, packagingValueIdsParam, sortBy, currentPage, router]);

  const handleInputChange = (val: string) => {
    setInputValue(val);
    setKeyword(val);
    setCurrentPage(1);
  };

  const handleCategoryChange = (id: string) => {
    setCategoryId(id);
    setCurrentPage(1);
  };

  const handleBrandChange = (id: string) => {
    setBrandId((current) => (current === id ? "" : id));
    setCurrentPage(1);
  };

  const handlePriceRangeChange = (id: PriceRangeId) => {
    setPriceRangeId((current) => (current === id ? "" : id));
    setCurrentPage(1);
  };

  const togglePackaging = (valueId: string) => {
    setSelectedPackagingValueId((current) => (current === valueId ? "" : valueId));
    setCurrentPage(1);
  };

  const handleSortChange = (sortId: SortOption["id"]) => {
    setSortBy(sortId);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setKeyword("");
    setInputValue("");
    setCategoryId("");
    setBrandId("");
    setPriceRangeId("");
    setSelectedPackagingValueId("");
    setSortBy("featured");
    setCurrentPage(1);
  };

  const activeCategory = categories.find((c) => String(c.id) === categoryId);
  const activeBrand = brands.find((b) => String(b.id) === brandId);
  const activeSort = SORT_OPTIONS.find((option) => option.id === sortBy) ?? SORT_OPTIONS[0];
  const paginationItems = buildPaginationItems(currentPage, totalPages);

  const parentCategories = categories.filter(
    (c) => (!c.parentId || c.parentId === 0) && (c.status === "ACTIVE" || c.status === undefined)
  );
  const getChildren = (parentId: number) =>
    categories.filter((c) => c.parentId === parentId && (c.status === "ACTIVE" || c.status === undefined));

  const hasActiveFilters = Boolean(
    keyword || categoryId || brandId || priceRangeId || Boolean(selectedPackagingValueId)
  );

  const sidebarContent = (
    <div className="space-y-4">
      <FilterSection title="Danh mục sản phẩm">
        <button
          type="button"
          onClick={() => handleCategoryChange("")}
          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] transition-colors ${
            !categoryId ? "bg-blue-50 font-semibold text-blue-800" : "text-slate-900 hover:bg-slate-50"
          }`}
        >
          <span>Tất cả sản phẩm</span>
        </button>

        {parentCategories.map((parent) => {
          const children = getChildren(parent.id);
          const parentActive = String(parent.id) === categoryId;
          const childActive = children.some((child) => String(child.id) === categoryId);

          return (
            <div key={parent.id}>
              <button
                type="button"
                onClick={() => handleCategoryChange(String(parent.id))}
                className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[13px] transition-colors ${
                  parentActive || childActive
                    ? "bg-blue-50 font-semibold text-blue-800"
                    : "text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span className="min-w-0 truncate">{parent.name}</span>
                {children.length > 0 && <ChevronDown size={14} className="shrink-0 text-slate-400" />}
              </button>
              {children.length > 0 && (
                <div className="border-l border-slate-200">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => handleCategoryChange(String(child.id))}
                      className={`flex w-full items-center px-7 py-2 text-left text-[13px] transition-colors ${
                        String(child.id) === categoryId
                          ? "bg-blue-50 font-semibold text-blue-800"
                          : "text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <span className="min-w-0 truncate">{child.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </FilterSection>

      <FilterSection title="Thương hiệu">
        <FilterCheckbox
          checked={!brandId}
          label="Tất cả thương hiệu"
          onClick={() => setBrandId("")}
        />
        {brands.map((brand) => (
          <FilterCheckbox
            key={brand.id}
            checked={String(brand.id) === brandId}
            label={brand.name}
            onClick={() => handleBrandChange(String(brand.id))}
          />
        ))}
      </FilterSection>

      <FilterSection title="Lọc giá">
        {PRICE_RANGES.map((range) => (
          <FilterCheckbox
            key={range.id}
            checked={priceRangeId === range.id}
            label={range.label}
            onClick={() => handlePriceRangeChange(range.id)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Đóng gói">
        {packagingOptions.length > 0 ? (
          packagingOptions.map((option) => (
            <FilterCheckbox
              key={option.id}
              checked={selectedPackagingValueId === option.id}
              label={option.label}
              onClick={() => togglePackaging(option.id)}
            />
          ))
        ) : (
          <div className="px-4 py-3 text-[12px] text-slate-500">
            Chưa có quy cách đóng gói
          </div>
        )}
      </FilterSection>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f3f4f6] pb-16 font-sans">
      {showMobileFilter && (
        <div
          className="fixed inset-0 z-50 bg-black/45"
          onClick={() => setShowMobileFilter(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-[51] w-[84%] max-w-xs transform bg-[#f3f4f6] shadow-2xl transition-transform duration-300 ${
          showMobileFilter ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <span className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-slate-900">
            <Menu size={15} className="text-blue-700" />
            Lọc sản phẩm
          </span>
          <button
            type="button"
            onClick={() => setShowMobileFilter(false)}
            className="flex h-8 w-8 items-center justify-center border border-slate-200 bg-white hover:bg-slate-50"
            aria-label="Đóng bộ lọc"
          >
            <X size={17} className="text-slate-600" />
          </button>
        </div>
        <div className="h-full overflow-y-auto p-3 pb-20">{sidebarContent}</div>
      </div>

      <div className="container mx-auto px-2 py-5 sm:px-3 md:px-4">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-28">{sidebarContent}</div>
          </aside>

          <main className="space-y-4 lg:col-span-3">
            <div className="border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <h2 className="flex items-center gap-2 text-[16px] font-semibold text-slate-950">
                    <Search size={18} className="text-blue-700" />
                    {keyword ? (
                      <>
                        Kết quả tìm kiếm: <span className="text-blue-800">&ldquo;{keyword}&rdquo;</span>
                      </>
                    ) : (
                      "Danh mục sản phẩm"
                    )}
                  </h2>
                  {!loading && (
                    <p className="text-[12px] font-normal text-slate-500">
                      Tìm thấy <span className="font-semibold text-blue-800">{totalElements}</span> sản phẩm
                    </p>
                  )}
                </div>

                <div className="flex flex-1 items-center gap-2 md:max-w-md">
                  <button
                    type="button"
                    onClick={() => setShowMobileFilter(true)}
                    className="flex h-9 items-center gap-2 border border-blue-700 bg-white px-3 text-[12px] font-semibold text-blue-800 lg:hidden"
                  >
                    <Menu size={14} /> Lọc
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex h-9 min-w-[170px] items-center justify-between gap-2 border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-900"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <ArrowUpDown size={15} className="shrink-0 text-slate-500" />
                          <span className="truncate">{activeSort.label}</span>
                        </span>
                        <ChevronDown size={15} className="shrink-0 text-slate-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[220px] rounded-none border-slate-200 p-1">
                      {SORT_OPTIONS.map((option) => (
                        <DropdownMenuItem
                          key={option.id}
                          onClick={() => handleSortChange(option.id)}
                          className="flex cursor-pointer items-center gap-2 rounded-none px-3 py-2.5 text-[14px] text-slate-800"
                        >
                          <span className="flex h-4 w-4 items-center justify-center">
                            {sortBy === option.id ? <Check size={15} className="text-blue-700" /> : null}
                          </span>
                          <span>{option.label}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="relative flex-1">
                    {loading ? (
                      <Loader2
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 animate-spin text-blue-700"
                      />
                    ) : (
                      <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    )}
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder="Tìm sản phẩm..."
                      className="h-9 w-full border border-slate-200 bg-white pl-9 pr-3 text-[13px] outline-none transition-colors focus:border-blue-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2">
                {keyword && (
                  <span className="inline-flex items-center gap-1.5 border border-blue-200 bg-white px-3 py-1.5 text-[12px] font-medium text-blue-800">
                    <Search size={11} />
                    &ldquo;{keyword}&rdquo;
                    <button
                      type="button"
                      onClick={() => {
                        setKeyword("");
                        setInputValue("");
                      }}
                      className="hover:text-red-600"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {categoryId && activeCategory && (
                  <span className="inline-flex items-center gap-1.5 border border-blue-200 bg-white px-3 py-1.5 text-[12px] font-medium text-blue-800">
                    <Tag size={11} />
                    {activeCategory.name}
                    <button type="button" onClick={() => handleCategoryChange("")} className="hover:text-red-600">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {brandId && activeBrand && (
                  <span className="inline-flex items-center gap-1.5 border border-blue-200 bg-white px-3 py-1.5 text-[12px] font-medium text-blue-800">
                    <BadgeCheck size={11} />
                    {activeBrand.name}
                    <button type="button" onClick={() => setBrandId("")} className="hover:text-red-600">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {activePriceRange && (
                  <span className="inline-flex items-center gap-1.5 border border-blue-200 bg-white px-3 py-1.5 text-[12px] font-medium text-blue-800">
                    {activePriceRange.label}
                    <button type="button" onClick={() => setPriceRangeId("")} className="hover:text-red-600">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {selectedPackagingValueId && (
                  <span
                    className="inline-flex items-center gap-1.5 border border-blue-200 bg-white px-3 py-1.5 text-[12px] font-medium text-blue-800"
                  >
                    {packagingLabelById.get(selectedPackagingValueId) ?? selectedPackagingValueId}
                    <button
                      type="button"
                      onClick={() => setSelectedPackagingValueId("")}
                      className="hover:text-red-600"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-2 text-[12px] font-medium text-slate-500 transition-colors hover:text-red-600"
                >
                  Xóa tất cả
                </button>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-4">
                {[...Array(PAGE_SIZE)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <Pagination className="pt-2">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            if (currentPage > 1) {
                              setCurrentPage(currentPage - 1);
                            }
                          }}
                          className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>

                      {paginationItems.map((item, index) => (
                        <PaginationItem key={`${item}-${index}`}>
                          {item === "ellipsis" ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              href="#"
                              isActive={currentPage === item}
                              onClick={(event) => {
                                event.preventDefault();
                                setCurrentPage(item);
                              }}
                              className="border border-slate-200 bg-white text-slate-700"
                            >
                              {item}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            if (currentPage < totalPages) {
                              setCurrentPage(currentPage + 1);
                            }
                          }}
                          className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center border border-slate-200 bg-white px-6 py-24 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center border border-slate-200 bg-slate-50">
                  <PackageX className="text-slate-300" size={34} />
                </div>
                <h3 className="mb-1.5 text-[16px] font-semibold text-slate-800">
                  Không tìm thấy sản phẩm
                </h3>
                <p className="max-w-xs text-[13px] font-normal text-slate-500">
                  Thử điều chỉnh từ khóa, danh mục, thương hiệu hoặc khoảng giá.
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-5 border border-blue-700 bg-blue-700 px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-blue-800"
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
