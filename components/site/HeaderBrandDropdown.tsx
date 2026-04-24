"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { BadgeCheck, Loader2, ChevronDown, ChevronRight, Bookmark } from "lucide-react";
import { usePathname } from "next/navigation";
import { getPublicBrands } from "@/app/services/brand.service";
import { BrandDTO } from "@/app/types/brand.type";
import { motion, AnimatePresence } from "framer-motion";

export default function HeaderBrandDropdown() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [brands, setBrands] = useState<BrandDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isActive = pathname.startsWith("/brand") || pathname.startsWith("/brands");

  const fetchBrands = async () => {
    if (hasLoaded) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPublicBrands();
      setBrands(data);
      const letters = Array.from(new Set(data.map((b: BrandDTO) => b.name[0].toUpperCase()))).sort();
      if (letters.length > 0) setActiveLetter(letters[0]);
      setHasLoaded(true);
    } catch {
      setError("Không thể tải thương hiệu");
    } finally {
      setLoading(false);
    }
  };

  const alphabet = Array.from(new Set(brands.map((b: BrandDTO) => b.name[0].toUpperCase()))).sort();
  const activeBrands = activeLetter
    ? brands
        .filter((b: BrandDTO) => b.name[0].toUpperCase() === activeLetter)
        .sort((a: BrandDTO, b: BrandDTO) => a.name.localeCompare(b.name))
    : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="static flex h-full items-center"
      ref={dropdownRef}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        onMouseEnter={() => {
          fetchBrands();
          setIsOpen(true);
        }}
        onClick={() => {
          fetchBrands();
          setIsOpen(!isOpen);
        }}
        className={`group flex h-12 items-center gap-2 rounded-2xl px-4 text-[15px] font-semibold transition ${
          isOpen || isActive
            ? "bg-[#f3f5f7] text-slate-900 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.18)]"
            : "text-slate-700 hover:bg-[#f3f5f7] hover:text-slate-900"
        }`}
      >
        <BadgeCheck
          size={18}
          className={isOpen || isActive ? "text-primary" : "text-slate-400 group-hover:text-primary"}
        />
        <span>Thương hiệu</span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute left-0 right-0 top-full z-[100] mt-3 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
          >
            <div className="mx-auto flex min-h-[380px] max-w-screen-xl">
              {!loading && !error && brands.length > 0 ? (
                <>
                  <div className="flex w-[92px] shrink-0 flex-col items-center gap-2 border-r border-slate-200 bg-slate-50/90 py-5">
                    {alphabet.map((letter) => (
                      <button
                        key={letter}
                        onMouseEnter={() => setActiveLetter(letter)}
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold transition ${
                          activeLetter === letter
                            ? "bg-white text-primary shadow-sm"
                            : "text-slate-500 hover:bg-white hover:text-slate-900"
                        }`}
                      >
                        {letter}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 bg-white p-6">
                    {activeLetter && (
                      <motion.div
                        key={activeLetter}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="h-full"
                      >
                        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-xl font-bold text-primary">
                              {activeLetter}
                            </div>
                            <div>
                              <h4 className="text-xl font-semibold text-slate-900">
                                Thương hiệu bắt đầu bằng {activeLetter}
                              </h4>
                              <p className="mt-1 text-sm text-slate-500">
                                Hiện có {activeBrands.length} thương hiệu trong nhóm này.
                              </p>
                            </div>
                          </div>
                          <Link
                            href="/brands"
                            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                            onClick={() => setIsOpen(false)}
                          >
                            Xem tất cả <ChevronRight size={14} />
                          </Link>
                        </div>

                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                          {activeBrands.map((brand) => (
                            <Link
                              key={brand.id}
                              href={`/brand/${brand.id}`}
                              className="group rounded-3xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-primary/20 hover:bg-primary/5"
                              onClick={() => setIsOpen(false)}
                            >
                              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-3">
                                {brand.logoUrl ? (
                                  <img
                                    src={brand.logoUrl}
                                    alt={brand.name}
                                    className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                                  />
                                ) : (
                                  <Bookmark size={22} className="text-slate-300" />
                                )}
                              </div>
                              <span className="mt-3 block line-clamp-2 text-sm font-semibold text-slate-700 transition group-hover:text-slate-900">
                                {brand.name}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center py-20 text-slate-400">
                  {loading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="animate-spin text-primary" size={24} />
                      <span className="text-sm font-medium">Đang tải thương hiệu...</span>
                    </div>
                  ) : (
                    <span>{error || "Không có dữ liệu"}</span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
