"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 w-full bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-t border-gray-100 z-[100] overflow-hidden"
          >
            <div className="max-w-screen-xl mx-auto flex min-h-[400px]">
              {!loading && !error && brands.length > 0 ? (
                <>
                  {/* Alphabet Sidebar */}
                  <div className="w-[80px] bg-gray-50 border-r border-gray-100 py-4 shrink-0 overflow-y-auto max-h-[500px] flex flex-col items-center gap-1">
                    {alphabet.map((letter) => (
                      <button
                        key={letter}
                        onMouseEnter={() => setActiveLetter(letter)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all font-bold text-lg ${
                          activeLetter === letter 
                            ? "bg-orange-600 text-white shadow-lg shadow-orange-200 scale-110" 
                            : "text-gray-400 hover:bg-orange-50 hover:text-orange-600"
                        }`}
                      >
                        {letter}
                      </button>
                    ))}
                  </div>

                  {/* Brands Grid Area */}
                  <div className="flex-1 p-8 bg-white overflow-y-auto max-h-[500px]">
                    {activeLetter && (
                      <motion.div key={activeLetter} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="h-full flex flex-col">
                        <div className="mb-8 flex items-center justify-between border-b border-gray-50 pb-4">
                           <div className="flex items-center gap-4">
                              <span className="text-4xl font-black text-orange-600">{activeLetter}</span>
                              <div>
                                <h4 className="font-bold text-gray-800 uppercase tracking-tight">Thương hiệu bắt đầu bằng "{activeLetter}"</h4>
                                <p className="text-xs text-gray-400">Tìm thấy {activeBrands.length} đối tác</p>
                              </div>
                           </div>
                           <Link 
                            href="/brands" 
                            className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
                            onClick={() => setIsOpen(false)}
                           >
                             Xem tất cả <ChevronRight size={14} />
                           </Link>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                          {activeBrands.map((brand) => (
                            <Link
                              key={brand.id}
                              href={`/brand/${brand.id}`}
                              className="group flex flex-col items-center gap-2"
                              onClick={() => setIsOpen(false)}
                            >
                               <div className="w-full aspect-square rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden p-3 group-hover:border-orange-300 group-hover:shadow-md transition-all">
                                  {brand.logoUrl ? (
                                    <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110" />
                                  ) : (
                                    <Bookmark size={24} className="text-gray-100 group-hover:text-orange-100" />
                                  )}
                               </div>
                               <span className="text-xs font-bold text-gray-600 text-center group-hover:text-orange-700 transition-colors line-clamp-1 px-1">{brand.name}</span>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center py-20 text-gray-400">
                  {loading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="animate-spin text-orange-600" size={32} />
                      <span className="text-sm font-medium">Đang lấy danh sách...</span>
                    </div>
                  ) : <span>{error || "Không có dữ liệu"}</span>}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
