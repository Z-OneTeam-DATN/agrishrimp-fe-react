"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { LayoutGrid, ChevronRight, Image as ImageIcon, Loader2 } from "lucide-react";
import { getPublicCategories } from "@/app/services/CategoryService";
import { getPublicBrands } from "@/app/services/brand.service";
import { CategoryDTO } from "@/app/types/category.type";
import { BrandDTO } from "@/app/types/brand.type";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "https://api.agrishrimp.io.vn";

function resolveImgUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  return `${BACKEND_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}

export default function MegaMenuDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [brands, setBrands] = useState<BrandDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activeParentId, setActiveParentId] = useState<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    if (hasLoaded) return;
    setLoading(true);
    try {
      const [cats, brnds] = await Promise.all([getPublicCategories(), getPublicBrands()]);
      setCategories(cats);
      setBrands(brnds);
      const parents = cats.filter((c: CategoryDTO) => !c.parentId || c.parentId === 0);
      if (parents.length > 0) setActiveParentId(parents[0].id);
      setHasLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const open = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    fetchData();
    setIsOpen(true);
  };

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setIsOpen(false), 180);
  };

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const parents = categories.filter((c) => !c.parentId || c.parentId === 0);
  const getChildren = (pid: number) => categories.filter((c) => c.parentId === pid && c.parentId !== 0);
  const activeParent = parents.find((p) => p.id === activeParentId);
  const activeChildren = activeParentId ? getChildren(activeParentId) : [];

  return (
    <div ref={wrapperRef} className="static flex h-full items-center" onMouseLeave={scheduleClose}>
      {/* Trigger button — styled dark like FPT */}
      <button
        type="button"
        onMouseEnter={open}
        onClick={() => { fetchData(); setIsOpen((v) => !v); }}
        className={`flex items-center gap-2 px-3 h-8 rounded text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors ${
          isOpen
            ? "bg-primary text-white"
            : "bg-gray-800 text-white hover:bg-gray-700"
        }`}
      >
        <LayoutGrid size={14} />
        <span>Danh mục</span>
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
            className="absolute left-0 right-0 top-full z-[100] mt-0 border-t-2 border-primary bg-white shadow-[0_16px_48px_rgba(0,0,0,0.15)]"
            style={{ maxHeight: "520px" }}
          >
            <div className="mx-auto flex max-w-screen-xl" style={{ height: "480px" }}>

              {/* ── LEFT: Parent Categories ── */}
              <div className="w-[220px] shrink-0 border-r border-gray-100 bg-gray-50 overflow-y-auto py-2">
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 size={20} className="animate-spin text-primary" />
                  </div>
                ) : (
                  parents.map((cat) => (
                    <div
                      key={cat.id}
                      onMouseEnter={() => setActiveParentId(cat.id)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 mx-2 rounded-lg cursor-pointer transition-colors ${
                        activeParentId === cat.id
                          ? "bg-white text-primary shadow-sm"
                          : "text-gray-700 hover:bg-white hover:text-gray-900"
                      }`}
                    >
                      {cat.imageUrl ? (
                        <img
                          src={resolveImgUrl(cat.imageUrl) ?? ""}
                          alt={cat.name}
                          className="w-6 h-6 object-contain shrink-0"
                        />
                      ) : (
                        <ImageIcon size={16} className="text-gray-300 shrink-0" />
                      )}
                      <Link
                        href={`/san-pham?categoryId=${cat.id}`}
                        className="flex-1 text-[13px] font-semibold truncate"
                        onClick={() => setIsOpen(false)}
                      >
                        {cat.name}
                      </Link>
                      <ChevronRight size={12} className={activeParentId === cat.id ? "text-primary" : "text-gray-300"} />
                    </div>
                  ))
                )}
              </div>

              {/* ── RIGHT: Subcategories + Brands ── */}
              <div className="flex-1 overflow-y-auto bg-white">
                {activeParent && (
                  <motion.div
                    key={activeParentId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1 }}
                    className="p-5"
                  >
                    {/* Brand logos row */}
                    {brands.length > 0 && (
                      <div className="mb-5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                          Thương hiệu
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {brands.slice(0, 10).map((brand) => (
                            <Link
                              key={brand.id}
                              href={`/san-pham?brandId=${brand.id}`}
                              onClick={() => setIsOpen(false)}
                              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-full text-[12px] font-semibold text-gray-700 hover:border-primary hover:text-primary transition-colors bg-white"
                            >
                              {brand.logoUrl ? (
                                <img src={brand.logoUrl} alt={brand.name} className="h-4 object-contain max-w-[40px]" />
                              ) : (
                                brand.name
                              )}
                            </Link>
                          ))}
                          <Link
                            href="/san-pham"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-1 px-3 py-1.5 border border-dashed border-gray-300 rounded-full text-[11px] text-gray-400 hover:text-primary hover:border-primary transition-colors"
                          >
                            Xem tất cả <ChevronRight size={11} />
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Category header */}
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="w-0.5 h-4 bg-primary rounded-full" />
                        <Link
                          href={`/san-pham?categoryId=${activeParent.id}`}
                          onClick={() => setIsOpen(false)}
                          className="text-[14px] font-bold text-gray-900 hover:text-primary transition-colors"
                        >
                          {activeParent.name}
                        </Link>
                      </div>
                      <Link
                        href={`/san-pham?categoryId=${activeParent.id}`}
                        onClick={() => setIsOpen(false)}
                        className="text-[12px] text-primary font-semibold hover:underline flex items-center gap-1"
                      >
                        Xem tất cả <ChevronRight size={12} />
                      </Link>
                    </div>

                    {/* Child categories grid */}
                    {activeChildren.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 lg:grid-cols-4">
                        {activeChildren.map((child) => (
                          <Link
                            key={child.id}
                            href={`/san-pham?categoryId=${child.id}`}
                            onClick={() => setIsOpen(false)}
                            className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50/60 hover:border-primary/20 hover:bg-primary/5 transition-colors"
                          >
                            {child.imageUrl ? (
                              <img
                                src={resolveImgUrl(child.imageUrl) ?? ""}
                                alt={child.name}
                                className="w-7 h-7 object-contain shrink-0"
                              />
                            ) : (
                              <ImageIcon size={14} className="text-gray-300 shrink-0" />
                            )}
                            <span className="text-[12px] font-medium text-gray-700 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                              {child.name}
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[13px] text-gray-400 py-6 text-center">Chưa có danh mục con</p>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
