"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { LayoutGrid, Loader2, ChevronDown, ChevronRight, Image as ImageIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { getPublicCategories } from "@/app/services/CategoryService";
import { CategoryDTO } from "@/app/types/category.type";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "https://api.agrishrimp.io.vn";

export default function HeaderCategoryDropdown() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activeParentId, setActiveParentId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActive = pathname.startsWith("/category") || pathname.startsWith("/san-pham");

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
    } catch {
      setError("Không thể tải danh mục");
    } finally {
      setLoading(false);
    }
  };

  const openDropdown = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    fetchCategories();
    setIsOpen(true);
  };

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setIsOpen(false), 200);
  };

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

  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("data:image") || imagePath.startsWith("http")) return imagePath;
    return `${BACKEND_ORIGIN}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
  };

  const parentCategories = categories.filter((c) => !c.parentId || c.parentId === 0);
  const getChildren = (parentId: number) =>
    categories.filter((c) => c.parentId === parentId && c.parentId !== 0);

  const activeParent = parentCategories.find((c) => c.id === activeParentId);
  const activeChildren = activeParentId ? getChildren(activeParentId) : [];

  return (
    <div
      className="static flex h-full items-center"
      ref={dropdownRef}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        onMouseEnter={openDropdown}
        onClick={() => { fetchCategories(); setIsOpen((v) => !v); }}
        className={`flex items-center gap-1.5 px-3 h-8 rounded text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors ${
          isOpen || isActive
            ? "bg-primary/10 text-primary"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <LayoutGrid size={15} />
        <span>Danh mục</span>
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
              {!loading && !error && categories.length > 0 ? (
                <>
                  <div className="w-[220px] shrink-0 border-r border-slate-100 bg-slate-50/80 py-2">
                    {parentCategories.map((parent) => (
                      <div
                        key={parent.id}
                        onMouseEnter={() => setActiveParentId(parent.id)}
                        className={`mx-2 flex items-center justify-between rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
                          activeParentId === parent.id
                            ? "bg-white text-primary shadow-sm"
                            : "text-gray-600 hover:bg-white hover:text-gray-900"
                        }`}
                      >
                        <Link
                          href={`/san-pham?categoryId=${parent.id}`}
                          className="truncate text-[13px] font-medium flex-1"
                          onClick={() => setIsOpen(false)}
                        >
                          {parent.name}
                        </Link>
                        <ChevronRight
                          size={13}
                          className={activeParentId === parent.id ? "text-primary" : "text-gray-300"}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 bg-white p-5">
                    {activeParent && (
                      <motion.div
                        key={activeParentId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.1 }}
                      >
                        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                          <h3 className="text-[14px] font-bold text-gray-900">{activeParent.name}</h3>
                          <Link
                            href={`/san-pham?categoryId=${activeParent.id}`}
                            className="text-[12px] font-semibold text-primary hover:underline"
                            onClick={() => setIsOpen(false)}
                          >
                            Xem tất cả
                          </Link>
                        </div>

                        <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-5">
                          {activeChildren.map((child) => (
                            <Link
                              key={child.id}
                              href={`/san-pham?categoryId=${child.id}`}
                              className="group rounded-xl border border-gray-100 bg-gray-50/60 p-3 transition-colors hover:border-primary/20 hover:bg-primary/5"
                              onClick={() => setIsOpen(false)}
                            >
                              <div className="mb-2 flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                                {child.imageUrl ? (
                                  <img
                                    src={getImageUrl(child.imageUrl) ?? ""}
                                    alt={child.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon size={18} className="text-gray-300" />
                                )}
                              </div>
                              <span className="line-clamp-2 text-[12px] font-semibold text-gray-700 group-hover:text-primary transition-colors">
                                {child.name}
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
                      <span className="text-[13px]">Đang tải danh mục...</span>
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
