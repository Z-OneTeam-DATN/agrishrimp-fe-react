"use client";

import React, { useEffect, useState, useCallback, Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Loader2,
  FileText,
  Eye,
  ChevronRight,
  ArrowRight,
  CalendarDays,
  User2,
  Hash,
  Newspaper,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
  const [latestPosts, setLatestPosts] = useState<BlogPostDTO[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const keyword = searchParams.get("keyword") ?? "";
  const categoryId = searchParams.get("categoryId") ? Number(searchParams.get("categoryId")) : undefined;
  const page = Number(searchParams.get("page") ?? "0");

  const [searchInput, setSearchInput] = useState(keyword);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [postsRes, cats, latestRes] = await Promise.all([
        getPublicBlogPosts({ keyword: keyword || undefined, categoryId, page, size: 9 }),
        getPublicBlogCategories(),
        getPublicBlogPosts({ page: 0, size: 8 }),
      ]);
      setPosts(postsRes.content ?? []);
      setTotalPages(postsRes.totalPages ?? 0);
      setCategories(cats);
      setLatestPosts(latestRes.content ?? []);
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

  const activeCategory = categories.find((c) => c.id === categoryId);

  const popularPosts = useMemo(
    () =>
      [...latestPosts]
        .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
        .slice(0, 4),
    [latestPosts]
  );

  const featuredTags = useMemo(() => {
    const tagMap = new Map<number, { id: number; name: string; slug: string; count: number }>();
    [...posts, ...latestPosts].forEach((post) => {
      post.tags.forEach((tag) => {
        const current = tagMap.get(tag.id);
        if (current) {
          current.count += 1;
        } else {
          tagMap.set(tag.id, { ...tag, count: 1 });
        }
      });
    });

    return Array.from(tagMap.values())
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 10);
  }, [posts, latestPosts]);

  const categoryAccent = (index: number) => {
    const palette = [
      "bg-emerald-700",
      "bg-sky-600",
      "bg-amber-500",
      "bg-rose-500",
      "bg-violet-600",
      "bg-cyan-600",
    ];

    return palette[index % palette.length];
  };

  return (
    <div className="min-h-screen bg-[#f7f7f2]">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1440px] items-center gap-1.5 px-4 py-3 text-[13px] text-slate-500 sm:px-6 lg:px-8">
          <Link href="/" className="transition-colors hover:text-emerald-700">
            Trang chủ
          </Link>
          <ChevronRight size={12} className="text-slate-300" />
          <span className="font-medium text-emerald-700">Tin tức & Blog</span>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
          <div className="min-w-0">
            <div className="mb-8 flex items-center gap-3">
              <span className="inline-block h-8 w-2 rounded-full bg-emerald-700" />
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 md:text-3xl">
                  Blog & Chia sẻ kinh nghiệm
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Kiến thức nuôi tôm, kỹ thuật thủy sản và các cập nhật mới từ AgriShrimp.
                </p>
              </div>
            </div>

            {(keyword || activeCategory) && (
              <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm">
                <span className="font-medium text-slate-500">Đang lọc theo:</span>
                {keyword && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                    Từ khóa: {keyword}
                  </span>
                )}
                {activeCategory && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                    Chủ đề: {activeCategory.name}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    navigate({ keyword: undefined, categoryId: undefined, page: undefined });
                  }}
                  className="ml-auto text-xs font-medium text-slate-400 underline transition-colors hover:text-rose-500"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}

            {loading ? (
              <div className="space-y-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex animate-pulse flex-col overflow-hidden rounded-xl border border-slate-100 bg-white md:h-52 md:flex-row"
                  >
                    <div className="h-48 bg-slate-100 md:h-full md:w-2/5" />
                    <div className="flex flex-1 flex-col justify-between p-5 md:p-6">
                      <div className="space-y-3">
                        <div className="h-5 w-24 rounded bg-slate-100" />
                        <div className="h-6 w-full rounded bg-slate-100" />
                        <div className="h-4 w-11/12 rounded bg-slate-100" />
                        <div className="h-4 w-4/5 rounded bg-slate-100" />
                      </div>
                      <div className="mt-6 h-4 w-1/2 rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length > 0 ? (
              <>
                <div className="space-y-6">
                  {posts.map((post, index) => (
                    <article
                      key={post.id}
                      className="group flex h-auto flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md md:h-52 md:flex-row"
                    >
                      <Link
                        href={`/blog/${post.slug}`}
                        className="relative h-52 w-full flex-shrink-0 overflow-hidden bg-slate-100 md:h-full md:w-2/5"
                      >
                        {post.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.thumbnailUrl}
                            alt={post.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <FileText size={36} className="text-slate-300" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "absolute left-3 top-3 rounded px-2.5 py-1 text-[11px] font-bold text-white shadow-sm",
                            categoryAccent(index)
                          )}
                        >
                          {post.category?.name ?? "Bài viết mới"}
                        </div>
                      </Link>

                      <div className="flex flex-1 flex-col justify-between p-5 md:p-6">
                        <div>
                          <Link
                            href={`/blog/${post.slug}`}
                            className="mb-2 block text-lg font-bold leading-snug text-slate-800 transition-colors group-hover:text-emerald-700 md:text-xl"
                          >
                            <span className="line-clamp-2">{post.title}</span>
                          </Link>
                          <p className="line-clamp-3 text-sm leading-relaxed text-slate-500">
                            {post.excerpt || "Nội dung đang được cập nhật."}
                          </p>
                        </div>

                        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <CalendarDays size={12} />
                              {formatDate(post.publishedAt ?? post.createdAt)}
                            </span>
                            {post.author && (
                              <span className="flex items-center gap-1.5">
                                <User2 size={12} />
                                {post.author.fullName}
                              </span>
                            )}
                            <span className="flex items-center gap-1.5">
                              <Eye size={12} />
                              {(post.viewCount ?? 0).toLocaleString("vi-VN")}
                            </span>
                          </div>

                          <Link
                            href={`/blog/${post.slug}`}
                            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-700 transition-colors hover:text-emerald-800"
                          >
                            Đọc tiếp
                            <ArrowRight size={13} />
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={page === 0}
                      onClick={() => navigate({ page: String(page - 1) })}
                      className="flex h-9 w-9 items-center justify-center rounded border border-slate-200 bg-white text-slate-400 transition-colors hover:border-emerald-100 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ChevronRight size={14} className="rotate-180" />
                    </button>

                    {Array.from({ length: totalPages }).slice(0, 3).map((_, idx) => {
                      const targetPage = idx;
                      const isActive = targetPage === page;

                      return (
                        <button
                          key={targetPage}
                          type="button"
                          onClick={() => navigate({ page: String(targetPage) })}
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded border text-sm font-semibold transition-colors",
                            isActive
                              ? "border-emerald-700 bg-emerald-700 text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:border-emerald-100 hover:bg-emerald-50 hover:text-emerald-700"
                          )}
                        >
                          {targetPage + 1}
                        </button>
                      );
                    })}

                    {totalPages > 3 && <span className="px-1 text-slate-400">...</span>}

                    <button
                      type="button"
                      disabled={page >= totalPages - 1}
                      onClick={() => navigate({ page: String(page + 1) })}
                      className="flex h-9 w-9 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 transition-colors hover:border-emerald-100 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
                <FileText size={42} className="mx-auto mb-4 text-slate-200" />
                <p className="font-medium text-slate-400">Chưa có bài viết phù hợp.</p>
              </div>
            )}
          </div>

          <aside className="w-full flex-shrink-0 space-y-6 lg:w-[320px]">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 inline-flex border-b-2 border-emerald-700 pb-1 text-[15px] font-bold uppercase tracking-wide text-slate-800">
                Tìm kiếm bài viết
              </h3>
              <form onSubmit={handleSearch} className="relative">
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Nhập từ khóa..."
                  className="h-11 rounded border-slate-200 bg-slate-50 pl-4 pr-10 text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-0 top-0 flex h-full px-3 text-slate-400 transition-colors hover:text-emerald-700"
                >
                  <Search size={15} className="my-auto" />
                </button>
              </form>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 inline-flex border-b-2 border-emerald-700 pb-1 text-[15px] font-bold uppercase tracking-wide text-slate-800">
                Chủ đề nổi bật
              </h3>
              <div className="flex flex-col space-y-2">
                <button
                  type="button"
                  onClick={() => navigate({ categoryId: undefined, page: undefined })}
                  className={cn(
                    "flex items-center justify-between py-1.5 text-left transition-colors group",
                    !categoryId ? "text-emerald-700" : "text-slate-600 hover:text-emerald-700"
                  )}
                >
                  <span className="text-[14px] font-medium">
                    <span className="mr-2 text-[10px] text-slate-400 group-hover:text-emerald-700">›</span>
                    Tất cả bài viết
                  </span>
                </button>

                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => navigate({ categoryId: String(c.id), page: undefined })}
                    className={cn(
                      "group flex items-center justify-between py-1.5 text-left transition-colors",
                      categoryId === c.id
                        ? "text-emerald-700"
                        : "text-slate-600 hover:text-emerald-700"
                    )}
                  >
                    <span className="text-[14px] font-medium">
                      <span className="mr-2 text-[10px] text-slate-400 group-hover:text-emerald-700">›</span>
                      {c.name}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-700">
                      {c.postCount}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 inline-flex border-b-2 border-emerald-700 pb-1 text-[15px] font-bold uppercase tracking-wide text-slate-800">
                Xem nhiều nhất
              </h3>
              <div className="flex flex-col gap-4">
                {popularPosts.length > 0 ? (
                  popularPosts.map((post, index) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className={cn("group flex gap-3", index > 0 && "border-t border-slate-100 pt-3")}
                    >
                      <div className="relative h-[60px] w-[80px] flex-shrink-0 overflow-hidden rounded">
                        {post.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.thumbnailUrl}
                            alt={post.title}
                            className="h-full w-full object-cover transition-transform group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-300">
                            <Newspaper size={18} />
                          </div>
                        )}
                        <div
                          className={cn(
                            "absolute left-0 top-0 flex h-4 w-4 items-center justify-center rounded-br text-[9px] font-bold text-white",
                            index === 0 ? "bg-emerald-700" : index === 1 ? "bg-slate-500" : "bg-slate-400"
                          )}
                        >
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex min-w-0 flex-col justify-center">
                        <h4 className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-800 transition-colors group-hover:text-emerald-700">
                          {post.title}
                        </h4>
                        <span className="mt-1 text-[10px] text-slate-400">
                          <CalendarDays size={10} className="mr-1 inline" />
                          {formatDate(post.publishedAt ?? post.createdAt)}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">Chưa có dữ liệu nổi bật.</p>
                )}
              </div>
            </div>

            {featuredTags.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 inline-flex border-b-2 border-emerald-700 pb-1 text-[15px] font-bold uppercase tracking-wide text-slate-800">
                  Thẻ tags nổi bật
                </h3>
                <div className="flex flex-wrap gap-2">
                  {featuredTags.map((tag, index) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => navigate({ keyword: tag.name, page: undefined })}
                      className={cn(
                        "inline-flex items-center gap-1 rounded px-3 py-1.5 text-[11px] font-medium transition-colors",
                        index === 0
                          ? "bg-emerald-700 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-emerald-700 hover:text-white"
                      )}
                    >
                      <Hash size={11} />
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
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
