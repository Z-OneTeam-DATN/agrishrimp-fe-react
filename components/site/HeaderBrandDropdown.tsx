"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { BadgeCheck, Loader2, AlertCircle, ChevronDown, ChevronRight, Bookmark } from "lucide-react";
import { getPublicBrands } from "@/app/services/brand.service";
import { BrandDTO } from "@/app/types/brand.type";
import { motion, AnimatePresence } from "framer-motion";

export default function HeaderBrandDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [brands, setBrands] = useState<BrandDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    } catch (err) {
      setError("Không thể tải thương hiệu");
    } finally {
      setLoading(false);
    }
  };

  const alphabet = useMemo(() => Array.from(new Set(brands.map((b: BrandDTO) => b.name[0].toUpperCase()))).sort(), [brands]);
  const activeBrands = useMemo(() => {
    if (!activeLetter) return [];
    return brands.filter((b: BrandDTO) => b.name[0].toUpperCase() === activeLetter).sort((a: BrandDTO, b: BrandDTO) => a.name.localeCompare(b.name));
  }, [brands, activeLetter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="static h-full flex items-center" ref={dropdownRef} onMouseLeave={() => setIsOpen(false)}>
      <button
        onMouseEnter={() => { fetchBrands(); setIsOpen(true); }}
        onClick={() => { fetchBrands(); setIsOpen(!isOpen); }}
        className={`flex items-center gap-1.5 px-5 h-full cursor-pointer transition-all duration-200 uppercase font-bold text-sm ${
          isOpen ? "text-orange-700 bg-white" : "text-orange-600 hover:text-orange-700"
        }`}
      >
        <BadgeCheck size={16} className="text-orange-500" />
        <span className="hidden lg:block tracking-wider">Thương hiệu</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-0 right-0 w-full bg-white shadow-2xl border-t border-gray-100 z-[100] overflow-hidden"
          >
            <div className="max-w-screen-xl mx-auto flex min-h-[360px]">
              {!loading && !error && brands.length > 0 ? (
                <>
                  <div className="w-[160px] bg-gray-50/50 border-r border-gray-100 py-1 shrink-0 overflow-y-auto max-h-[480px]">
                    <div className="px-5 py-3 font-black text-gray-400 text-[10px] uppercase tracking-widest border-b border-gray-100/50 mb-1">A-Z</div>
                    {alphabet.map((letter) => (
                      <div
                        key={letter}
                        onMouseEnter={() => setActiveLetter(letter)}
                        className={`px-5 py-2 cursor-pointer transition-all flex items-center justify-between group ${
                          activeLetter === letter ? "bg-white text-orange-600 font-bold shadow-sm" : "text-gray-600 hover:text-orange-500"
                        }`}
                      >
                        <span className="text-[16px] uppercase tracking-tighter">{letter}</span>
                        <ChevronRight size={12} className={activeLetter === letter ? "opacity-100" : "opacity-0 group-hover:opacity-40"} />
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 p-6 bg-white overflow-y-auto max-h-[480px]">
                    {activeLetter && (
                      <motion.div key={activeLetter} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
                        <div className="mb-6 pb-2 border-b border-gray-50 flex items-baseline gap-3">
                           <span className="text-3xl font-black text-orange-600">{activeLetter}</span>
                           <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">THƯƠNG HIỆU THEO CHỮ CÁI</span>
                        </div>
                        
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {activeBrands.map((brand) => (
                            <Link
                              key={brand.id}
                              href={`/brand/${brand.id}`}
                              className="group flex flex-col items-center p-3 rounded-xl hover:bg-orange-50/30 transition-all border border-gray-50 hover:border-orange-100"
                              onClick={() => setIsOpen(false)}
                            >
                               <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden mb-2 group-hover:border-orange-200 transition-colors">
                                  {brand.logoUrl ? (
                                    <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain p-1" />
                                  ) : (
                                    <Bookmark size={20} className="text-orange-100" />
                                  )}
                               </div>
                               <span className="text-[11px] font-bold text-gray-700 text-center group-hover:text-orange-700 transition-colors line-clamp-1">{brand.name}</span>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center py-20 text-gray-400">
                  {loading ? <Loader2 className="animate-spin text-orange-500" size={24} /> : <span>{error || "Không có dữ liệu"}</span>}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
