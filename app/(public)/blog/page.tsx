"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Loader2, FileText, FolderOpen, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BlogPostDTO, BlogCategoryDTO,
  getPublicBlogPosts, getPublicBlogCategories,
} from "@/app/services/blog.service";

function BlogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [posts, setPosts] = useState<BlogPostDTO[]>([]);
  const [categories, setCategories] = useState<BlogCategoryDTO[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const keyword = searchParams.get("keyword") ?? "";
  const categoryId = searchParams.get("categoryId") ? Number(searchParams.get("categoryId")) : undefined;
  const page = Number(searchParams.get("page") ?? "0");

  const [searchInput, setSearchInput] = useState(keyword);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [postsRes, cats] = await Promise.all([
        getPublicBlogPosts({ keyword: keyword || undefined, categoryId, page, size: 9 }),
        getPublicBlogCategories(),
      ]);
      setPosts(postsRes.content ?? []);
      setTotalPages(postsRes.totalPages ?? 0);
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  }, [keyword, categoryId, page]);

  useEffect(() => { loadData(); }, [loadData]);

  const navigate = (params: Record<string, string | undefined>) => {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([k, v]) => {
      if (v) p.set(k, v); else p.delete(k);
    });
    router.push(`/blog?${p.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ keyword: searchInput || undefined, page: undefined });
  };

  const formatDate = (s: string | null) =>
    s ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(s)) : "";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 py-12 px-4 text-center">
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Blog AgriShrimp</h1>
        <p className="text-emerald-100 text-base font-medium">Kiến thức nuôi tôm, công nghệ thủy sản và chia sẻ từ chuyên gia</p>
        <form onSubmit={handleSearch} className="mt-6 flex gap-2 max-w-md mx-auto">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm bài viết..."
              className="pl-9 h-10 bg-white text-sm border-0"
            />
          </div>
          <Button type="submit" className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold h-10 px-5 text-sm">
            Tìm
          </Button>
        </form>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-8">
        {/* Main content */}
        <main className="flex-1 min-w-0">
          {keyword && (
            <div className="mb-5 flex items-center gap-2">
              <span className="text-sm text-slate-500">Kết quả tìm kiếm cho:</span>
              <span className="text-sm font-semibold text-slate-800 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">{keyword}</span>
              <button onClick={() => navigate({ keyword: undefined, page: undefined })}
                className="text-xs text-slate-400 hover:text-rose-500 transition-colors underline">
                Xóa bộ lọc
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-100 animate-pulse">
                  <div className="h-44 bg-slate-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 w-20 bg-slate-100 rounded" />
                    <div className="h-5 w-full bg-slate-100 rounded" />
                    <div className="h-4 w-3/4 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {posts.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`}
                    className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-md transition-all duration-200 group flex flex-col">
                    <div className="h-44 bg-slate-100 overflow-hidden shrink-0">
                      {post.thumbnailUrl ? (
                        <img src={post.thumbnailUrl} alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText size={32} className="text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      {post.category && (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mb-2 self-start">
                          {post.category.name}
                        </span>
                      )}
                      <h2 className="text-[15px] font-bold text-slate-800 leading-snug line-clamp-2 mb-2 group-hover:text-emerald-700 transition-colors">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-sm text-slate-500 line-clamp-2 flex-1">{post.excerpt}</p>
                      )}
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                        <span>{formatDate(post.publishedAt)}</span>
                        <span className="flex items-center gap-1">
                          <Eye size={12} /> {(post.viewCount ?? 0).toLocaleString("vi-VN")}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <Button variant="outline" size="sm" disabled={page === 0}
                    onClick={() => navigate({ page: String(page - 1) })}>
                    Trước
                  </Button>
                  <span className="text-sm text-slate-500 flex items-center px-3">
                    Trang {page + 1} / {totalPages}
                  </span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages - 1}
                    onClick={() => navigate({ page: String(page + 1) })}>
                    Sau
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <FileText size={40} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">Chưa có bài viết nào.</p>
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside className="hidden lg:block w-60 shrink-0 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <FolderOpen size={15} className="text-emerald-600" /> Danh mục
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => navigate({ categoryId: undefined, page: undefined })}
                className={cn("w-full flex justify-between items-center text-sm px-2 py-1.5 rounded-lg transition-colors",
                  !categoryId ? "text-emerald-700 font-semibold bg-emerald-50" : "text-slate-600 hover:bg-slate-50"
                )}>
                <span>Tất cả</span>
              </button>
              {categories.map((c) => (
                <button key={c.id}
                  onClick={() => navigate({ categoryId: String(c.id), page: undefined })}
                  className={cn("w-full flex justify-between items-center text-sm px-2 py-1.5 rounded-lg transition-colors",
                    categoryId === c.id ? "text-emerald-700 font-semibold bg-emerald-50" : "text-slate-600 hover:bg-slate-50"
                  )}>
                  <span className="truncate">{c.name}</span>
                  <span className="text-xs text-slate-400 ml-1 shrink-0">{c.postCount}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="animate-spin text-emerald-600" size={28} /></div>}>
      <BlogContent />
    </Suspense>
  );
}
