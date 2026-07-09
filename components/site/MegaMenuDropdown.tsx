"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { getPublicCategories } from "@/app/services/CategoryService";
import { CategoryDTO } from "@/app/types/category.type";
import { motion, AnimatePresence } from "framer-motion";

function formatCategoryLabel(label?: string | null) {
  if (!label) return "";

  const normalized = label.trim().toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export default function MegaMenuDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activeParentId, setActiveParentId] = useState<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    if (hasLoaded) return;
    setLoading(true);
    try {
      const cats = await getPublicCategories();
      setCategories(cats);
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
  return (
    <div ref={wrapperRef} className="relative flex h-full items-center" onMouseLeave={scheduleClose}>
      <button
        type="button"
        onMouseEnter={open}
        onClick={() => { fetchData(); setIsOpen((v) => !v); }}
        className={`flex items-center gap-1 py-4 text-[12px] font-semibold uppercase tracking-[0.06em] whitespace-nowrap transition-colors ${
          isOpen
            ? "text-[#2f5f98]"
            : "text-[#1f1f1f] hover:text-[#2f5f98]"
        }`}
      >
        <span>Danh mục</span>
        <ChevronDown size={12} strokeWidth={2.2} />
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
            className="absolute top-full left-0 z-[100] mt-0.5 w-[300px] overflow-visible border border-gray-200 bg-white shadow-[0_18px_44px_rgba(15,23,42,0.18)]"
          >
            <div className="bg-white">
              {loading ? (
                <div className="flex min-h-[320px] items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-primary" />
                </div>
              ) : (
                parents.map((cat) => {
                  const children = getChildren(cat.id);
                  const isActive = activeParentId === cat.id;

                  return (
                    <div
                      key={cat.id}
                      className="relative"
                      onMouseEnter={() => setActiveParentId(cat.id)}
                    >
                      <Link
                        href={`/san-pham?categoryId=${cat.id}`}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-3 transition-colors ${
                          isActive
                            ? "bg-slate-50 text-[#1f1f1f]"
                            : "text-gray-700 hover:bg-slate-50 hover:text-[#1f1f1f]"
                        }`}
                      >
                        <span className="truncate pr-2 text-[12px] font-medium normal-case">
                          {formatCategoryLabel(cat.name)}
                        </span>
                        {children.length > 0 ? (
                          <ChevronRight
                            size={13}
                            className={isActive ? "text-[#2f5f98]" : "text-gray-300"}
                          />
                        ) : null}
                      </Link>

                      {children.length > 0 && isActive ? (
                        <div className="absolute left-full top-2 ml-2 min-w-[220px] overflow-hidden border border-gray-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
                          {children.map((child) => (
                            <Link
                              key={child.id}
                              href={`/san-pham?categoryId=${child.id}`}
                              onClick={() => setIsOpen(false)}
                              className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5 text-[12px] text-gray-700 transition-colors last:border-b-0 hover:bg-slate-50 hover:text-[#2f5f98]"
                            >
                              <span className="truncate pr-2 normal-case">
                                {formatCategoryLabel(child.name)}
                              </span>
                              <ChevronRight size={12} className="text-gray-300" />
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
