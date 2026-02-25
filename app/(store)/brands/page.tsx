"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, List, Loader2, AlertCircle } from "lucide-react";
import { getPublicBrands } from "@/app/services/brand.service";
import { BrandDTO } from "@/app/types/brand.type";

export default function BrandsPage() {
  const [brands, setBrands] = useState<BrandDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBrands = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPublicBrands();
        setBrands(data);
      } catch (err) {
        setError("Không thể tải danh sách thương hiệu");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, []);

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-12 pt-6">
      <div className="container mx-auto px-4">
        <div className="py-2 mb-6 text-sm text-gray-500 flex items-center">
          <Link href="/" className="hover:text-[#329965] transition-colors">
            Trang chủ
          </Link>
          <ChevronRight size={16} className="mx-2" />
          <span className="text-[#329965] font-bold">Thương hiệu</span>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-2">
            <List className="text-[#329965]" /> Đối tác & Thương hiệu
          </h1>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="animate-spin mb-4" size={40} />
              <span>Đang tải thương hiệu...</span>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-20 text-red-500">
              <AlertCircle className="mb-4" size={40} />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && brands.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/brand/${brand.id}`}
                  className="group flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-[#329965] hover:shadow-sm transition-all bg-gray-50/30 hover:bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#329965] group-hover:scale-125 transition-transform"></div>
                    <span className="text-base font-bold text-gray-700 group-hover:text-[#329965]">
                      {brand.name}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-[#329965] group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          )}

          {!loading && !error && brands.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              Không có thương hiệu nào được tìm thấy.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
