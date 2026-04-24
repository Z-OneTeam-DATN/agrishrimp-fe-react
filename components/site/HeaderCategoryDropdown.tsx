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
  const getChildren = (parentId: number) =>
    categories.filter((c) => c.parentId === parentId && c.parentId !== 0);

  const activeParent = parentCategories.find((c) => c.id === activeParentId);
  const activeChildren = activeParentId ? getChildren(activeParentId) : [];

  return (
    <div
      className="static flex h-full items-center"
      ref={dropdownRef}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        onMouseEnter={() => {
          fetchCategories();
          setIsOpen(true);
        }}
        onClick={() => {
          fetchCategories();
          setIsOpen(!isOpen);
        }}
        className={`group flex h-12 items-center gap-2 rounded-2xl px-4 text-[15px] font-semibold transition ${
          isOpen || isActive
            ? "bg-[#f3f5f7] text-slate-900 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.18)]"
            : "text-slate-700 hover:bg-[#f3f5f7] hover:text-slate-900"
        }`}
      >
        <LayoutGrid
          size={18}
          className={isOpen || isActive ? "text-primary" : "text-slate-400 group-hover:text-primary"}
        />
        <span>Danh mục</span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute left-0 right-0 top-full z-[100] mt-3 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
          >
            <div className="mx-auto flex min-h-[360px] max-w-screen-xl">
              {!loading && !error && categories.length > 0 ? (
                <>
                  <div className="w-[260px] shrink-0 border-r border-slate-200 bg-slate-50/90 py-3">
                    {parentCategories.map((parent) => (
                      <div
                        key={parent.id}
                        onMouseEnter={() => setActiveParentId(parent.id)}
                        className={`mx-3 flex items-center justify-between rounded-2xl px-4 py-3 transition ${
                          activeParentId === parent.id
                            ? "bg-white text-primary shadow-sm"
                            : "text-slate-600 hover:bg-white hover:text-slate-900"
                        }`}
                      >
                        <Link
                          href={`/category/${parent.id}`}
                          className="truncate text-sm font-medium"
                          onClick={() => setIsOpen(false)}
                        >
                          {parent.name}
                        </Link>
                        <ChevronRight
                          size={14}
                          className={activeParentId === parent.id ? "opacity-100" : "opacity-40"}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 bg-white p-6">
                    {activeParent && (
                      <motion.div
                        key={activeParentId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-full"
                      >
                        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-3">
                          <div>
                            <h3 className="text-xl font-semibold text-slate-900">{activeParent.name}</h3>
                            <p className="mt-1 text-sm text-slate-500">
                              Chọn nhanh nhóm sản phẩm phù hợp cho trang này.
                            </p>
                          </div>
                          <Link
                            href={`/category/${activeParent.id}`}
                            className="text-sm font-semibold text-primary hover:underline"
                            onClick={() => setIsOpen(false)}
                          >
                            Xem tất cả
                          </Link>
                        </div>

                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                          {activeChildren.map((child) => (
                            <Link
                              key={child.id}
                              href={`/category/${child.id}`}
                              className="group rounded-3xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-primary/20 hover:bg-primary/5"
                              onClick={() => setIsOpen(false)}
                            >
                              <div className="mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                {child.imageUrl ? (
                                  <img
                                    src={getImageUrl(child.imageUrl) ?? ""}
                                    alt={child.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon size={22} className="text-slate-300" />
                                )}
                              </div>
                              <span className="line-clamp-2 text-sm font-semibold text-slate-700 transition group-hover:text-slate-900">
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
                <div className="flex flex-1 items-center justify-center py-20 text-slate-400">
                  {loading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="animate-spin text-primary" size={24} />
                      <span className="text-sm font-medium">Đang tải danh mục...</span>
                    </div>
                  ) : (
                    <span>{error || "Không có dữ liệu"}</span>
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
