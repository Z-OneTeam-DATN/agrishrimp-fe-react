"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { BadgeCheck, Loader2, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
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
      
      const letters = Array.from(new Set(data.map(b => b.name[0].toUpperCase()))).sort();
      if (letters.length > 0) {
        setActiveLetter(letters[0]);
      }
      
      setHasLoaded(true);
    } catch (err) {
      setError("Không thể tải thương hiệu");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const alphabet = useMemo(() => {
    const letters = Array.from(new Set(brands.map(b => b.name[0].toUpperCase()))).sort();
    return letters;
  }, [brands]);

  const activeBrands = useMemo(() => {
    if (!activeLetter) return [];
    return brands.filter(b => b.name[0].toUpperCase() === activeLetter).sort((a, b) => a.name.localeCompare(b.name));
  }, [brands, activeLetter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) fetchBrands();
    setIsOpen(!isOpen);
  };

  const handleMouseEnter = () => {
    fetchBrands();
    setIsOpen(true);
  };

  return (
    <div 
      className="static h-full flex items-center" 
      ref={dropdownRef}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        onClick={handleToggle}
        onMouseEnter={handleMouseEnter}
        className={`flex items-center gap-1.5 px-5 h-full cursor-pointer transition-colors duration-200 uppercase font-bold text-sm ${
            isOpen ? "text-orange-700 bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]" : "text-orange-600 hover:text-orange-700"
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
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 w-full bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-t border-gray-100 z-[100] overflow-hidden rounded-b-2xl"
          >
            <div className="max-w-screen-xl mx-auto flex min-h-[480px] border-x border-gray-50">
              {loading && (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-400">
                  <Loader2 className="animate-spin mb-4 text-orange-500" size={32} />
                  <span className="text-sm font-medium">Đang chuẩn bị thương hiệu...</span>
                </div>
              )}

              {error && (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-red-500">
                  <AlertCircle className="mb-4" size={32} />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              {!loading && !error && brands.length > 0 && (
                <>
                  {/* Left Sidebar - Alphabet */}
                  <div className="w-[180px] bg-gray-50/80 py-2 border-r border-gray-100 flex flex-col shrink-0 overflow-y-auto max-h-[500px]">
                    <div className="px-6 py-4 font-black text-gray-400 text-[10px] uppercase tracking-[0.2em] border-b border-gray-100/50 mb-2">Bảng chữ cái</div>
                    {alphabet.map((letter) => (
                      <div
                        key={letter}
                        onMouseEnter={() => setActiveLetter(letter)}
                        className={`group flex items-center justify-between px-6 py-3 cursor-pointer transition-all relative ${
                          activeLetter === letter 
                            ? "bg-white text-orange-600 font-bold" 
                            : "text-gray-600 hover:bg-gray-100/50 hover:text-orange-500"
                        }`}
                      >
                        {activeLetter === letter && (
                           <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-600" />
                        )}
                        <span className="text-[18px] uppercase tracking-tight flex-1">
                          {letter}
                        </span>
                        <ChevronRight 
                          size={16} 
                          className={`transition-all duration-300 ${
                            activeLetter === letter ? "translate-x-0 opacity-100" : "translate-x-[-4px] opacity-0 group-hover:opacity-40"
                          }`} 
                        />
                      </div>
                    ))}
                  </div>

                  {/* Right Content - Brands */}
                  <div className="flex-1 bg-white p-10 flex flex-col">
                    {activeLetter && (
                      <motion.div 
                        key={activeLetter}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col h-full"
                      >
                        <div className="mb-8 pb-5 border-b border-gray-100 flex items-baseline gap-4">
                           <span className="text-4xl font-black text-orange-600 tracking-tighter">{activeLetter}</span>
                           <span className="text-sm text-gray-400 font-bold uppercase tracking-widest">Thương hiệu bắt đầu bằng "{activeLetter}"</span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {activeBrands.map((brand) => (
                            <Link
                              key={brand.id}
                              href={`/brand/${brand.id}`}
                              className="group flex items-center gap-4 py-3 px-4 rounded-2xl hover:bg-orange-50/50 transition-all border border-gray-50 hover:border-orange-100 hover:shadow-sm"
                              onClick={() => setIsOpen(false)}
                            >
                               <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-orange-200 transition-colors">
                                  {brand.logoUrl ? (
                                    <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain p-1" />
                                  ) : (
                                    <span className="text-[14px] font-black text-orange-200">{brand.name[0]}</span>
                                  )}
                               </div>
                               <span className="text-[14px] font-bold text-gray-700 group-hover:text-orange-700 transition-colors line-clamp-1">
                                 {brand.name}
                               </span>
                            </Link>
                          ))}
                        </div>

                        {/* Optional: Promotional section */}
                        <div className="mt-auto pt-12 flex gap-6">
                           {[1,2].map(i => (
                             <div key={i} className="flex-1 h-24 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 flex items-center justify-center text-gray-300 italic text-[11px] font-bold uppercase tracking-widest overflow-hidden relative group cursor-pointer hover:border-orange-200 transition-colors">
                                <div className="absolute inset-0 bg-orange-500/0 group-hover:bg-orange-500/5 transition-colors" />
                                <span className="relative z-10">Ưu đãi thương hiệu {i}</span>
                             </div>
                           ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </>
              )}

              {!loading && !error && brands.length === 0 && hasLoaded && (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-400">
                  <span className="text-sm">Không có dữ liệu thương hiệu</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
