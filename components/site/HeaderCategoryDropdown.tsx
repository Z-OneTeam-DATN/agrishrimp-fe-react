"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { LayoutGrid, Loader2, AlertCircle, ChevronDown, ChevronRight, Image as ImageIcon } from "lucide-react";
import { getPublicCategories } from "@/app/services/CategoryService";
import { CategoryDTO } from "@/app/types/category.type";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "https://api.agrishrimp.io.vn";

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
        const parents = data.filter((c: CategoryDTO) => !c.parentId || c.parentId === 0);
        if (parents.length > 0) setActiveParentId(parents[0].id);
      }
      setHasLoaded(true);
    } catch (err) {
      setError("Không thể tải danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("data:image") || imagePath.startsWith("http")) return imagePath;
    return `${BACKEND_ORIGIN}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
  };

  const parentCategories = categories.filter((c) => !c.parentId || c.parentId === 0);
  const getChildren = (parentId: number) => categories.filter((c) => c.parentId === parentId && c.parentId !== 0);

  const activeParent = parentCategories.find((c) => c.id === activeParentId);
  const activeChildren = activeParentId ? getChildren(activeParentId) : [];

  return (
    <div className="static h-full flex items-center" ref={dropdownRef} onMouseLeave={() => setIsOpen(false)}>
      <button
        onMouseEnter={() => { fetchCategories(); setIsOpen(true); }}
        onClick={() => { fetchCategories(); setIsOpen(!isOpen); }}
        className={`flex items-center gap-1.5 px-5 h-full cursor-pointer transition-all duration-200 uppercase font-bold text-sm ${
          isOpen ? "text-orange-700 bg-white" : "text-orange-600 hover:text-orange-700"
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
            className="absolute top-full left-0 right-0 w-full bg-white shadow-2xl border-t border-gray-100 z-[100] overflow-hidden"
          >
            <div className="max-w-screen-xl mx-auto flex min-h-[360px]">
              {!loading && !error && categories.length > 0 ? (
                <>
                  <div className="w-[240px] bg-gray-50/50 border-r border-gray-100 py-1 shrink-0">
                    {parentCategories.map((parent) => (
                      <div
                        key={parent.id}
                        onMouseEnter={() => setActiveParentId(parent.id)}
                        className={`px-5 py-2.5 cursor-pointer transition-all flex items-center justify-between group ${
                          activeParentId === parent.id ? "bg-white text-orange-600 font-bold shadow-sm" : "text-gray-600 hover:text-orange-500"
                        }`}
                      >
                        <Link href={`/category/${parent.id}`} className="text-[13px] uppercase truncate" onClick={() => setIsOpen(false)}>
                          {parent.name}
                        </Link>
                        <ChevronRight size={12} className={activeParentId === parent.id ? "opacity-100" : "opacity-0 group-hover:opacity-40"} />
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 p-6 bg-white">
                    {activeParent && (
                      <motion.div key={activeParentId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-50">
                          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">{activeParent.name}</h3>
                          <Link href={`/category/${activeParent.id}`} className="text-[11px] font-bold text-orange-600 hover:underline" onClick={() => setIsOpen(false)}>XEM TẤT CẢ</Link>
                        </div>
                        
                        <div className="grid grid-cols-3 lg:grid-cols-4 gap-6">
                          {activeChildren.map((child) => (
                            <Link
                              key={child.id}
                              href={`/category/${child.id}`}
                              className="group flex flex-col items-center text-center gap-2 p-2 rounded-xl hover:bg-orange-50/30 transition-all border border-transparent hover:border-orange-100"
                              onClick={() => setIsOpen(false)}
                            >
                              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100 group-hover:border-orange-200 transition-colors">
                                {child.imageUrl ? (
                                  <img src={getImageUrl(child.imageUrl)!} alt={child.name} className="w-full h-full object-cover" />
                                ) : (
                                  <ImageIcon size={24} className="text-gray-300" />
                                )}
                              </div>
                              <span className="text-[12px] font-bold text-gray-700 group-hover:text-orange-700 transition-colors line-clamp-2">{child.name}</span>
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
