"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { LayoutGrid, Loader2, AlertCircle, ChevronDown } from "lucide-react";
import { getPublicCategories } from "@/app/services/CategoryService";
import { CategoryDTO } from "@/app/types/category.type";
import { motion, AnimatePresence } from "framer-motion";

export default function HeaderCategoryDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchCategories = async () => {
    if (hasLoaded) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPublicCategories();
      setCategories(data);
      setHasLoaded(true);
    } catch (err) {
      setError("Không thể tải danh mục");
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
    if (!isOpen) fetchCategories();
    setIsOpen(!isOpen);
  };

  const handleMouseEnter = () => {
    fetchCategories();
    setIsOpen(true);
  };

  const parentCategories = categories.filter((c) => !c.parentId || c.parentId === 0);
  const getChildren = (parentId: number) => categories.filter((c) => c.parentId === parentId && c.parentId !== 0);

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
        <LayoutGrid size={16} className="text-orange-500" />
        <span className="hidden lg:block tracking-wider">Danh mục</span>
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
                  <span className="text-sm">Đang tải danh mục...</span>
                </div>
              )}

              {error && (
                <div className="flex items-center justify-center py-12 text-red-500">
                  <AlertCircle className="mr-2" size={20} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {!loading && !error && categories.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-8 p-6 lg:py-8 lg:px-4">
                  {parentCategories.map((parent) => (
                    <div key={parent.id} className="flex flex-col">
                      <Link
                        href={`/category/${parent.id}`}
                        className="font-bold text-gray-900 text-[15px] md:text-base mb-2.5 block border-b border-gray-100 pb-1.5 uppercase tracking-tight hover:text-primary transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        {parent.name}
                      </Link>

                      <div className="flex flex-col space-y-1.5">
                        {getChildren(parent.id).map((child) => (
                          <Link
                            key={child.id}
                            href={`/category/${child.id}`}
                            className="text-[13px] text-gray-600 hover:text-primary transition-colors py-0.5"
                            onClick={() => setIsOpen(false)}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            {!loading && !error && categories.length === 0 && hasLoaded && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <span className="text-sm">Không có danh mục nào khả dụng</span>
                <span className="text-[10px] mt-1 opacity-50">(Dữ liệu trả về rỗng hoặc không đúng cấu trúc)</span>
              </div>
            )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
