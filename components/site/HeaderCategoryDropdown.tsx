"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { LayoutGrid, Loader2, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import { getPublicCategories } from "@/app/services/CategoryService";
import { CategoryDTO } from "@/app/types/category.type";
import { motion, AnimatePresence } from "framer-motion";

export default function HeaderCategoryDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activeParentId, setActiveParentId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchCategories = async () => {
    if (hasLoaded) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPublicCategories();
      setCategories(data);
      if (data.length > 0) {
        const parents = data.filter((c) => !c.parentId || c.parentId === 0);
        if (parents.length > 0) {
          setActiveParentId(parents[0].id);
        }
      }
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

  const activeParent = parentCategories.find((c) => c.id === activeParentId);
  const activeChildren = activeParentId ? getChildren(activeParentId) : [];

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
        <LayoutGrid size={16} className="text-orange-500" />
        <span className="hidden lg:block tracking-wider">Danh mục</span>
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
                  <span className="text-sm font-medium">Đang chuẩn bị danh mục...</span>
                </div>
              )}

              {error && (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-red-500">
                  <AlertCircle className="mb-4" size={32} />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              {!loading && !error && categories.length > 0 && (
                <>
                  {/* Left Sidebar - Parent Categories */}
                  <div className="w-[260px] bg-gray-50/80 py-2 border-r border-gray-100 flex flex-col shrink-0">
                    {parentCategories.map((parent) => (
                      <div
                        key={parent.id}
                        onMouseEnter={() => setActiveParentId(parent.id)}
                        className={`group flex items-center justify-between px-5 py-3.5 cursor-pointer transition-all relative ${
                          activeParentId === parent.id 
                            ? "bg-white text-orange-600 font-bold" 
                            : "text-gray-600 hover:bg-gray-100/50 hover:text-orange-500"
                        }`}
                      >
                        {activeParentId === parent.id && (
                           <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-600" />
                        )}
                        <Link
                          href={`/category/${parent.id}`}
                          className="text-[14px] uppercase tracking-tight flex-1 line-clamp-1"
                          onClick={() => setIsOpen(false)}
                        >
                          {parent.name}
                        </Link>
                        <ChevronRight 
                          size={16} 
                          className={`transition-all duration-300 ${
                            activeParentId === parent.id ? "translate-x-0 opacity-100" : "translate-x-[-4px] opacity-0 group-hover:opacity-40"
                          }`} 
                        />
                      </div>
                    ))}
                  </div>

                  {/* Right Content - Children Categories */}
                  <div className="flex-1 bg-white p-10 flex flex-col">
                    {activeParent && (
                      <motion.div 
                        key={activeParentId}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col h-full"
                      >
                        <div className="mb-8 pb-5 border-b border-gray-100 flex items-center justify-between">
                           <Link 
                            href={`/category/${activeParent.id}`}
                            className="text-2xl font-black text-gray-900 hover:text-orange-600 transition-colors uppercase tracking-tighter"
                            onClick={() => setIsOpen(false)}
                           >
                            {activeParent.name}
                           </Link>
                           <Link 
                            href={`/category/${activeParent.id}`}
                            className="text-xs font-bold text-orange-600 hover:underline uppercase tracking-widest"
                            onClick={() => setIsOpen(false)}
                           >
                            Xem tất cả
                           </Link>
                        </div>
                        
                        {activeChildren.length > 0 ? (
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                            {activeChildren.map((child) => (
                              <div key={child.id} className="flex flex-col space-y-4">
                                <Link
                                  href={`/category/${child.id}`}
                                  className="text-[16px] font-extrabold text-gray-800 hover:text-orange-600 transition-colors uppercase tracking-tight"
                                  onClick={() => setIsOpen(false)}
                                >
                                  {child.name}
                                </Link>
                                
                                {/* Placeholder for deeper levels if needed */}
                                <div className="flex flex-col space-y-2">
                                   <Link href={`/category/${child.id}`} className="text-[13px] text-gray-500 hover:text-orange-500 transition-colors">Sản phẩm nổi bật</Link>
                                   <Link href={`/category/${child.id}`} className="text-[13px] text-gray-500 hover:text-orange-500 transition-colors">Hàng mới về</Link>
                                   <Link href={`/category/${child.id}`} className="text-[13px] text-gray-500 hover:text-orange-500 transition-colors">Khuyến mãi</Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                           <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-400 bg-gray-50/30 rounded-3xl border border-dashed border-gray-100">
                              <p className="text-sm font-medium italic">Hiện chưa có danh mục chi tiết cho {activeParent.name}</p>
                           </div>
                        )}

                        <div className="mt-auto pt-10 flex items-center justify-between">
                           <div className="flex gap-4">
                              <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 font-bold">AS</div>
                              <div className="flex flex-col justify-center">
                                 <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">AgriShrimp</span>
                                 <span className="text-sm font-black text-gray-900">GIẢI PHÁP THỦY SẢN THÔNG MINH</span>
                              </div>
                           </div>
                           <div className="relative w-40 h-16 opacity-30 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
                               <img src="/logo_long.png" alt="AgriShrimp" className="object-contain w-full h-full" />
                           </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </>
              )}

              {!loading && !error && categories.length === 0 && hasLoaded && (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-400">
                  <span className="text-sm">Không có dữ liệu danh mục</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
