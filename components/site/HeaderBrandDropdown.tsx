"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Loader2, AlertCircle, ChevronDown } from "lucide-react";
import { getPublicBrands } from "@/app/services/brand.service";
import { BrandDTO } from "@/app/types/brand.type";
import { motion, AnimatePresence } from "framer-motion";

export default function HeaderBrandDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [brands, setBrands] = useState<BrandDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchBrands = async () => {
    if (hasLoaded) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPublicBrands();
      setBrands(data);
      setHasLoaded(true);
    } catch (err) {
      setError("Không thể tải thương hiệu");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
          isOpen ? "text-orange-700" : "text-orange-600 hover:text-orange-700"
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
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 w-full bg-white shadow-md border-t border-gray-100 z-[100]"
          >
            <div className="max-w-screen-xl mx-auto">
              {loading && (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <Loader2 className="animate-spin mr-2" size={20} />
                  <span className="text-sm">Đang tải thương hiệu...</span>
                </div>
              )}

              {error && (
                <div className="flex items-center justify-center py-12 text-red-500">
                  <AlertCircle className="mr-2" size={20} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {!loading && !error && brands.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-2 p-8 lg:px-6">
                  {brands.map((brand) => (
                    <Link
                      key={brand.id}
                      href={`/brand/${brand.id}`}
                      className="group flex items-center gap-2 py-1.5 border-b border-transparent hover:border-orange-100 transition-all"
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-200 group-hover:bg-orange-500 transition-colors"></div>
                      <span className="text-[14px] font-semibold text-gray-600 group-hover:text-orange-700 transition-colors">
                        {brand.name}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

            {!loading && !error && brands.length === 0 && hasLoaded && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <span className="text-sm">Không có thương hiệu nào khả dụng</span>
              </div>
            )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
