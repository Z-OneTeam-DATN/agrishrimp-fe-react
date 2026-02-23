"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutGrid, Loader2 } from "lucide-react";

import { getCategories } from "@/app/services/CategoryService";

interface Category {
  id: number;
  name: string;
  imageUrl?: string;
  slug?: string;
}

export default function HomeCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchParentCategories = async () => {
      try {
        setIsLoading(true);
        const data = await getCategories();

        const parentCategories = data.filter((cat: any) => !cat.parentId);
        setCategories(parentCategories);

        console.log("Dữ liệu danh mục từ API:", parentCategories);
      } catch (error) {
        console.error("Lỗi tải danh mục:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchParentCategories();
  }, []);

  const getImageUrl = (imagePath?: string) => {
      if (!imagePath) return "https://placehold.co/100x100/e2e8f0/1e293b?text=No+Image";

      if (imagePath.startsWith("data:image")) return imagePath;

      if (imagePath.startsWith("http")) return imagePath;

      return `http://localhost:8080${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
    };

  return (
    <section className="bg-white rounded-xl p-6 shadow-sm mb-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6 border-b pb-2">
        <h5 className="font-bold text-lg uppercase text-[#1b5e20] flex items-center gap-2">
          <LayoutGrid size={24} className="text-[#1b5e20]" />
          Danh Mục Vật Tư
        </h5>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="animate-spin text-green-600" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {categories.map((cat) => {
            const linkHref = cat.slug ? `/category/${cat.slug}` : `/category/${cat.id}`;
            const imgSrc = getImageUrl(cat.imageUrl);

            return (
              <Link
                key={cat.id}
                href={linkHref}
                className="group flex flex-col items-center text-center p-3 rounded-lg hover:bg-green-50/50 transition-colors border border-transparent hover:border-green-100"
              >
                <div className="w-20 h-20 relative mb-3 rounded-full border-2 border-gray-100 group-hover:border-green-500 transition-all shadow-sm group-hover:shadow-md bg-white overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={imgSrc}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/100x100/e2e8f0/1e293b?text=Loi+Anh";
                    }}
                  />
                </div>

                <span className="text-sm font-bold text-gray-700 group-hover:text-green-800 leading-tight">
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