"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  Loader2, 
  AlertCircle, 
  Search, 
  Star,
  Bookmark,
  Building2,
  ArrowUp
} from "lucide-react";
import { getPublicBrands } from "@/app/services/brand.service";
import { BrandDTO } from "@/app/types/brand.type";
import { motion, AnimatePresence } from "framer-motion";

export default function BrandsPage() {
  const [brands, setBrands] = useState<BrandDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const fetchBrands = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPublicBrands();
        // Sắp xếp theo tên A-Z
        const sortedData = [...data].sort((a, b) => a.name.localeCompare(b.name));
        setBrands(sortedData);
      } catch (err) {
        setError("Không thể tải danh sách thương hiệu");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredBrands = useMemo(() => {
    return brands.filter(b => 
      b.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [brands, searchTerm]);

  const groupedBrands = useMemo(() => {
    const groups: Record<string, BrandDTO[]> = {};
    filteredBrands.forEach(brand => {
      const firstLetter = brand.name[0].toUpperCase();
      const groupKey = /[A-Z]/.test(firstLetter) ? firstLetter : "#";
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(brand);
    });
    return groups;
  }, [filteredBrands]);

  const alphabet = useMemo(() => {
    const letters = Object.keys(groupedBrands).sort();
    // Chuyển # xuống cuối
    const hashIndex = letters.indexOf("#");
    if (hashIndex > -1) {
      letters.splice(hashIndex, 1);
      letters.push("#");
    }
    return letters;
  }, [groupedBrands]);

  const scrollToLetter = (letter: string) => {
    const element = document.getElementById(`letter-${letter}`);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="bg-[#f0f4f2] min-h-screen pb-20">
      {/* Hero Header */}
      <div className="bg-[#376E60] pt-12 pb-24 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <Building2 size={300} strokeWidth={1} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-bold uppercase tracking-widest"
            >
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              Đối tác tin cậy
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-black mb-6 tracking-tight"
            >
              Thương Hiệu Đồng Hành
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-emerald-50/80 mb-8 text-lg"
            >
              Khám phá các thương hiệu thuốc thủy sản, máy móc và vật tư chất lượng hàng đầu cho ngành tôm Việt Nam.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="w-full relative"
            >
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-400">
                <Search size={20} />
              </div>
              <input 
                type="text" 
                placeholder="Tìm tên thương hiệu bà con đang cần..."
                className="w-full h-16 pl-14 pr-6 rounded-2xl bg-white text-gray-800 shadow-xl focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all text-lg font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-12 relative z-20">
        {/* Alphabet Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-8 sticky top-24 z-30 flex flex-wrap justify-center gap-1 md:gap-2 overflow-x-auto">
          {alphabet.map((letter) => (
            <button
              key={letter}
              onClick={() => scrollToLetter(letter)}
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all hover:bg-emerald-50 hover:text-emerald-700 text-gray-500"
            >
              {letter}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl shadow-sm border border-gray-100">
            <Loader2 className="animate-spin mb-4 text-emerald-600" size={48} />
            <span className="text-gray-500 font-bold uppercase tracking-widest text-sm">Đang kết nối đối tác...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-12 rounded-3xl border border-red-100 text-center">
            <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
            <h3 className="text-xl font-bold text-red-800 mb-2">Đã xảy ra lỗi</h3>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            <AnimatePresence mode="popLayout">
              {alphabet.length > 0 ? (
                alphabet.map((letter) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={letter} 
                    id={`letter-${letter}`}
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-emerald-200">
                        {letter}
                      </div>
                      <div className="h-0.5 flex-1 bg-gradient-to-r from-emerald-200 to-transparent"></div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                      {groupedBrands[letter].map((brand) => (
                        <Link
                          key={brand.id}
                          href={`/brand/${brand.id}`}
                          className="group bg-white rounded-2xl p-4 md:p-6 border border-gray-100 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300 flex flex-col items-center text-center"
                        >
                          <div className="w-full aspect-square bg-gray-50 rounded-xl mb-4 flex items-center justify-center overflow-hidden border border-gray-50 group-hover:bg-white transition-colors">
                            {brand.logoUrl ? (
                              <img 
                                src={brand.logoUrl} 
                                alt={brand.name} 
                                className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-110"
                                loading="lazy"
                              />
                            ) : (
                              <Bookmark size={32} className="text-gray-200 group-hover:text-emerald-100 transition-colors" />
                            )}
                          </div>
                          <h3 className="text-sm md:text-base font-bold text-gray-700 group-hover:text-emerald-700 transition-colors line-clamp-1">
                            {brand.name}
                          </h3>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="bg-white py-32 rounded-3xl text-center shadow-sm border border-gray-100">
                  <div className="mb-4 inline-flex w-20 h-20 items-center justify-center rounded-full bg-gray-50 text-gray-300">
                    <Search size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-700 mb-2">Không tìm thấy thương hiệu nào</h3>
                  <p className="text-gray-400">Bà con hãy thử tìm với từ khóa khác nhé.</p>
                  <button 
                    onClick={() => setSearchTerm("")}
                    className="mt-6 text-emerald-600 font-bold hover:underline"
                  >
                    Xóa tìm kiếm
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Back to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-8 right-8 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-emerald-700 transition-colors z-[60]"
          >
            <ArrowUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
