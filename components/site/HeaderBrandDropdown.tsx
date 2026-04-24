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
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActive = pathname.startsWith("/brand") || pathname.startsWith("/brands");

  const fetchBrands = async () => {
    if (hasLoaded) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPublicBrands();
      setBrands(data);
      const letters = Array.from(new Set(data.map((b: BrandDTO) => b.name[0].toUpperCase()))).sort();
      if (letters.length > 0) setActiveLetter(letters[0] as string);
      setHasLoaded(true);
    } catch {
      setError("Không thể tải thương hiệu");
    } finally {
      setLoading(false);
    }
  };

  const openDropdown = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    fetchBrands();
    setIsOpen(true);
  };

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setIsOpen(false), 200);
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  return (
    <div
      className="static flex h-full items-center"
      ref={dropdownRef}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        onMouseEnter={openDropdown}
        onClick={() => { fetchBrands(); setIsOpen((v) => !v); }}
        className={`flex items-center gap-1.5 px-3 h-8 rounded text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors ${
          isOpen || isActive
            ? "bg-primary/10 text-primary"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <BadgeCheck size={15} />
        <span>Thương hiệu</span>
        <ChevronDown
          size={13}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            onMouseEnter={() => { if (closeTimer.current) clearTimeout(closeTimer.current); }}
            onMouseLeave={scheduleClose}
            className="absolute left-0 right-0 top-full z-[100] mt-1 overflow-hidden rounded-b-2xl border border-slate-200 bg-white shadow-[0_16px_48px_rgba(15,23,42,0.12)]"
          >
            <div className="mx-auto flex min-h-[320px] max-w-screen-xl">
              {!loading && !error && brands.length > 0 ? (
                <>
                  <div className="flex w-[80px] shrink-0 flex-col items-center gap-1 border-r border-slate-100 bg-slate-50/80 py-3">
                    {alphabet.map((letter) => (
                      <button
                        key={letter}
                        type="button"
                        onMouseEnter={() => setActiveLetter(letter)}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg text-[13px] font-semibold transition-colors ${
                          activeLetter === letter
                            ? "bg-white text-primary shadow-sm"
                            : "text-gray-500 hover:bg-white hover:text-gray-900"
                        }`}
                      >
                        {letter}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 bg-white p-5">
                    {activeLetter && (
                      <motion.div
                        key={activeLetter}
                        initial={{ opacity: 0, x: 6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.1 }}
                      >
                        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-[16px] font-bold text-primary">
                              {activeLetter}
                            </div>
                            <div>
                              <p className="text-[14px] font-bold text-gray-900">
                                Thương hiệu — {activeLetter}
                              </p>
                              <p className="text-[11px] text-gray-400">{activeBrands.length} thương hiệu</p>
                            </div>
                          </div>
                          <Link
                            href="/brands"
                            className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline"
                            onClick={() => setIsOpen(false)}
                          >
                            Xem tất cả <ChevronRight size={13} />
                          </Link>
                        </div>

                        <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-6">
                          {activeBrands.map((brand) => (
                            <Link
                              key={brand.id}
                              href={`/san-pham?brandId=${brand.id}`}
                              className="group rounded-xl border border-gray-100 bg-gray-50/60 p-3 transition-colors hover:border-primary/20 hover:bg-primary/5"
                              onClick={() => setIsOpen(false)}
                            >
                              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white p-2 mb-2">
                                {brand.logoUrl ? (
                                  <img
                                    src={brand.logoUrl}
                                    alt={brand.name}
                                    className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-200"
                                  />
                                ) : (
                                  <Bookmark size={18} className="text-gray-300" />
                                )}
                              </div>
                              <span className="block line-clamp-2 text-[12px] font-semibold text-gray-700 group-hover:text-primary transition-colors">
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
                <div className="flex flex-1 items-center justify-center py-16 text-gray-400">
                  {loading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin text-primary" size={20} />
                      <span className="text-[13px]">Đang tải thương hiệu...</span>
                    </div>
                  ) : (
                    <span className="text-[13px]">{error || "Không có dữ liệu"}</span>
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
