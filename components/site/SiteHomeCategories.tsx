"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { getPublicCategories } from "@/app/services/CategoryService";
import { CategoryDTO } from "@/app/types/category.type";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "https://api.agrishrimp.io.vn";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "https://api.agrishrimp.io.vn";

export default function HomeCategories() {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const visibleParentCategories = useMemo(() => {
    const activeCategories = categories.filter(
      (category) => category.status === "ACTIVE"
    );
    const childProductCounts = new Map<number, number>();

    activeCategories.forEach((category) => {
      if (category.parentId) {
        childProductCounts.set(
          category.parentId,
          (childProductCounts.get(category.parentId) ?? 0) +
            (category.productCount ?? 0)
        );
      }
    });

    return activeCategories.filter(
      (category) => (!category.parentId || category.parentId === 0)
    );
  }, [categories]);

  useEffect(() => {
    const fetchParentCategories = async () => {
      try {
        setIsLoading(true);
        const data = await getPublicCategories();
        setCategories(data);
      } catch (error) {
        console.error("Lỗi tải danh mục:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchParentCategories();
  }, []);

  useEffect(() => {
    const updateScrollState = () => {
      const container = scrollRef.current;
      if (!container) return;

      const nextHasOverflow = container.scrollWidth > container.clientWidth + 8;
      setHasOverflow(nextHasOverflow);
      setCanScrollLeft(container.scrollLeft > 8);
      setCanScrollRight(
        container.scrollLeft + container.clientWidth < container.scrollWidth - 8
      );
    };

    updateScrollState();

    const container = scrollRef.current;
    container?.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);

    return () => {
      container?.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [visibleParentCategories.length, isLoading]);

  const getImageUrl = (imagePath?: string) => {
      if (!imagePath) return "https://placehold.co/100x100/e2e8f0/1e293b?text=No+Image";

      if (imagePath.startsWith("data:image")) return imagePath;

      if (imagePath.startsWith("http")) return imagePath;

      return `${BACKEND_ORIGIN}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
    };

  const scrollCategories = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;

    const step = Math.max(container.clientWidth * 0.8, 240);
    container.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  };

  if (!isLoading && visibleParentCategories.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">
          Danh mục
        </h2>
        {hasOverflow && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollCategories("left")}
              disabled={!canScrollLeft}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-teal-500 hover:text-teal-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollCategories("right")}
              disabled={!canScrollRight}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-teal-500 hover:text-teal-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="animate-spin text-green-600" size={32} />
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2"
        >
          {visibleParentCategories.map((cat) => {
            const linkHref = `/category/${cat.id}`;
            const imgSrc = getImageUrl(cat.imageUrl);

            return (
              <Link
                key={cat.id}
                href={linkHref}
                className="group flex w-[140px] shrink-0 flex-col items-center rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
              >
                <div className="mb-3 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 transition-all group-hover:border-teal-300">
                  <img
                    src={imgSrc}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/100x100/e2e8f0/1e293b?text=Loi+Anh";
                    }}
                  />
                </div>

                <span className="text-sm font-semibold text-slate-700 group-hover:text-teal-700 leading-tight">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
