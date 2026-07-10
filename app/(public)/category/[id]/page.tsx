"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Loader2, PackageX } from "lucide-react";
import ProductCard from "@/components/ui/product-card";
import LoadMoreButton from "@/components/ui/load-more-button";
import { PublicProductListItem } from "@/app/types/product.schema";
import { getPublicCategories } from "@/app/services/CategoryService";
import { PublicProductService } from "@/app/services/publicProduct.service";
import { CategoryDTO } from "@/app/types/category.type";
import { useResponsiveColumns } from "@/hooks/useResponsiveColumns";

const ROWS_PER_STEP = 2;
const SHOWCASE_CARD_LIMIT = 10;
const CATEGORY_BANNER_FALLBACK = "/images/category-banner-fallback.svg";

export default function CategoryPage() {
  const router = useRouter();
  const params = useParams();
  const currentCategoryId = params.id as string;

  const [allCategories, setAllCategories] = useState<CategoryDTO[]>([]);
  const [subCategories, setSubCategories] = useState<CategoryDTO[]>([]);
  const [currentCategoryName, setCurrentCategoryName] = useState("Tất cả sản phẩm");
  const [products, setProducts] = useState<PublicProductListItem[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [visibleRows, setVisibleRows] = useState(ROWS_PER_STEP);

  const gridColumns = useResponsiveColumns({
    defaultColumns: 2,
    mdColumns: 3,
    lgColumns: 4,
    xlColumns: 5,
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getPublicCategories();
        setAllCategories(data);
      } catch (error) {
        console.error("Lỗi danh mục:", error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProductsAndSetGroups = async () => {
      if (!currentCategoryId || allCategories.length === 0) return;

      const idNum = Number(currentCategoryId);
      if (Number.isNaN(idNum)) {
        console.error("Invalid category ID, redirecting...");
        router.push("/san-pham");
        return;
      }

      const currentCat = allCategories.find((category) => category.id === idNum);
      let idsToFetch = [idNum];

      if (currentCat) {
        setCurrentCategoryName(currentCat.name);

        const children = allCategories.filter(
          (category) => category.parentId === idNum && category.status === "ACTIVE"
        );

        if (children.length > 0) {
          setSubCategories(children);
          idsToFetch = [idNum, ...children.map((category) => category.id)];
        } else if (currentCat.parentId) {
          const siblings = allCategories.filter(
            (category) =>
              category.parentId === currentCat.parentId &&
              category.status === "ACTIVE"
          );
          setSubCategories(siblings);
          idsToFetch = [idNum];
        } else {
          setSubCategories([]);
        }
      }

      setIsLoadingProducts(true);

      try {
        const results = await Promise.all(
          idsToFetch.map((id) => PublicProductService.getByCategory(id))
        );

        const mergedProducts: PublicProductListItem[] = [];
        const seenIds = new Set<number>();

        results.flat().forEach((product) => {
          if (product && !seenIds.has(product.id)) {
            seenIds.add(product.id);
            mergedProducts.push(product);
          }
        });

        setProducts(mergedProducts);
      } catch (error) {
        console.error("Lỗi sản phẩm:", error);
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProductsAndSetGroups();
  }, [currentCategoryId, allCategories, router]);

  const currentCategoryNumber = Number(currentCategoryId);

  const currentCategory = useMemo(
    () =>
      allCategories.find((category) => category.id === currentCategoryNumber) ?? null,
    [allCategories, currentCategoryNumber]
  );

  const parentCategory = useMemo(() => {
    if (!currentCategory?.parentId) return null;
    return (
      allCategories.find((category) => category.id === currentCategory.parentId) ?? null
    );
  }, [allCategories, currentCategory]);

  const filteredProducts = useMemo(() => products, [products]);

  useEffect(() => {
    setVisibleRows(ROWS_PER_STEP);
  }, [filteredProducts.length, currentCategoryId]);

  const visibleCount = visibleRows * gridColumns;
  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount]
  );

  const showcaseProducts = useMemo(
    () => visibleProducts.slice(0, SHOWCASE_CARD_LIMIT),
    [visibleProducts]
  );

  const remainingProducts = useMemo(
    () => visibleProducts.slice(SHOWCASE_CARD_LIMIT),
    [visibleProducts]
  );

  const tabCategories = subCategories.length > 0
    ? subCategories
    : currentCategory
      ? [currentCategory]
      : [];

  const headlineSegments = parentCategory
    ? [parentCategory.name, currentCategoryName]
    : [currentCategoryName];

  const bannerImage =
    currentCategory?.imageUrl ||
    parentCategory?.imageUrl ||
    CATEGORY_BANNER_FALLBACK;

  const headlinePrimaryHref = parentCategory
    ? `/category/${parentCategory.id}`
    : Number.isFinite(currentCategoryNumber)
      ? `/category/${currentCategoryNumber}`
      : "/san-pham";

  return (
    <div className="min-h-screen bg-[#f6f8fb] pb-12">
      <div className="mx-auto max-w-[1680px] px-4 py-6 sm:px-6 xl:px-8 xl:py-8">
        <div className="mb-6 space-y-5">
          <nav className="flex flex-wrap items-center gap-2 text-[26px] font-bold tracking-[-0.03em] text-slate-900 sm:text-[32px]">
            {headlineSegments.map((segment, index) => (
              <React.Fragment key={`${segment}-${index}`}>
                {index > 0 && <ChevronRight className="h-6 w-6 text-slate-300 sm:h-7 sm:w-7" />}
                {index === 0 ? (
                  <Link
                    href={headlinePrimaryHref}
                    className="transition-colors hover:text-blue-600"
                  >
                    {segment}
                  </Link>
                ) : (
                  <span>{segment}</span>
                )}
              </React.Fragment>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-3 overflow-x-auto pb-1">
            {tabCategories.map((category) => {
              const isActive = category.id === currentCategoryNumber;

              return (
                <button
                  key={category.id}
                  onClick={() => router.push(`/category/${category.id}`)}
                  className={`whitespace-nowrap rounded-full border px-5 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? "border-[#4d7fcb] bg-[#4d7fcb] text-white shadow-[0_10px_24px_rgba(77,127,203,0.22)]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>{filteredProducts.length} sản phẩm trong chuyên mục này</span>
          </div>
        </div>

        {isLoadingProducts ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-slate-200 bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-sm font-medium text-slate-500">
              Đang tải danh sách sản phẩm...
            </span>
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            <div className="hidden xl:grid xl:grid-cols-[minmax(240px,320px)_repeat(5,minmax(0,1fr))] xl:gap-4">
              <div className="relative row-span-2 min-h-[760px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <Image
                  src={bannerImage}
                  alt={currentCategoryName}
                  fill
                  sizes="(min-width: 1280px) 320px, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-slate-950/50" />
                <div className="absolute inset-x-0 top-0 p-5">
                  <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-700 backdrop-blur">
                    Bộ sưu tập nổi bật
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <div className="rounded-[24px] border border-white/40 bg-white/88 p-4 shadow-lg backdrop-blur-md">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                      Danh mục đang xem
                    </p>
                    <h2 className="mt-2 text-2xl font-bold leading-tight text-slate-900">
                      {currentCategoryName}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Bố cục desktop hiển thị 5 sản phẩm mỗi hàng, 2 hàng kèm banner
                      dọc theo đúng hướng thiết kế.
                    </p>
                  </div>
                </div>
              </div>

              {showcaseProducts.map((product) => (
                <div key={product.id} className="min-w-0">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:hidden">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {remainingProducts.length > 0 && (
              <div className="mt-4 hidden xl:grid xl:grid-cols-5 xl:gap-4">
                {remainingProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {visibleProducts.length < filteredProducts.length && (
              <div className="mt-8">
                <LoadMoreButton
                  onClick={() => setVisibleRows((previousRows) => previousRows + ROWS_PER_STEP)}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[28px] border border-slate-200 bg-white px-4 text-center">
            <PackageX className="mb-4 h-16 w-16 text-slate-300" />
            <h3 className="text-lg font-bold text-slate-700">
              Chưa có sản phẩm trong chuyên mục này
            </h3>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Hãy chọn danh mục khác hoặc cập nhật thêm sản phẩm để khối hiển thị 2
              hàng xuất hiện đúng như thiết kế.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
