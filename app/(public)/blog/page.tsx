"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Loader2,
  FileText,
  ChevronRight,
  ChevronDown,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BlogPostDTO, BlogCategoryDTO,
  getPublicBlogPosts, getPublicBlogCategories,
} from "@/app/services/blog.service";
import LatestBlogPostsCard from "@/components/site/LatestBlogPostsCard";

function normalizeDisplayTitle(title: string) {
  const trimmed = title.trim();
  if (!trimmed) return title;

  const letters = Array.from(trimmed).filter((char) => /\p{L}/u.test(char));
  const uppercaseLetters = letters.filter((char) => char === char.toLocaleUpperCase("vi-VN"));
  const lowercaseLetters = letters.filter((char) => char === char.toLocaleLowerCase("vi-VN"));
  const mostlyUppercase =
    letters.length > 0 &&
    uppercaseLetters.length / letters.length > 0.7 &&
    lowercaseLetters.length / letters.length < 0.15;

  if (!mostlyUppercase) return title;

  const normalized = trimmed
    .split(/\s+/)
    .map((word) => {
      const match = word.match(/^([^\\p{L}\\p{N}]*)([\\p{L}\\p{N}]+)([^\\p{L}\\p{N}]*)$/u);
      if (!match) return word;

      const [, prefix, core, suffix] = match;
      const shouldPreserveUppercase =
        /\d/.test(core) || (core.length <= 3 && core === core.toLocaleUpperCase("vi-VN"));

      return `${prefix}${shouldPreserveUppercase ? core : core.toLocaleLowerCase("vi-VN")}${suffix}`;
    })
    .join(" ");

  return normalized.charAt(0).toLocaleUpperCase("vi-VN") + normalized.slice(1);
}

function BlogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const keyword = searchParams.get("keyword") ?? "";
  const categoryId = searchParams.get("categoryId") ? Number(searchParams.get("categoryId")) : undefined;
  const page = Number(searchParams.get("page") ?? "0");

  const [posts, setPosts] = useState<BlogPostDTO[]>([]);
  const [categories, setCategories] = useState<BlogCategoryDTO[]>([]);
  const [latestPosts, setLatestPosts] = useState<BlogPostDTO[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(keyword);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [postsRes, cats, latestRes] = await Promise.all([
        getPublicBlogPosts({ keyword: keyword || undefined, categoryId, page, size: 9 }),
        getPublicBlogCategories(),
        getPublicBlogPosts({ page: 0, size: 5 }),
      ]);
      const visibleCategories = (cats ?? []).filter((category) => category.status === "ACTIVE");
      setPosts(postsRes.content ?? []);
      setTotalPages(postsRes.totalPages ?? 0);
      setCategories(visibleCategories);
      setLatestPosts(latestRes.content ?? []);
    } finally {
      setLoading(false);
    }
  }, [keyword, categoryId, page]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setSearchInput(keyword); }, [keyword]);

  const navigate = (params: Record<string, string | undefined>) => {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([k, v]) => {
      if (v) p.set(k, v); else p.delete(k);
    });
    router.push(`/blog?${p.toString()}`);
  };

  const submitSearch = () => {
    const normalized = searchInput.trim();
    navigate({ keyword: normalized || undefined, page: undefined });
  };

  const formatDate = (s: string | null) =>
    s ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(s)) : "";

  const activeCategory = categories.find((c) => c.id === categoryId);

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <main className="container mx-auto w-full px-4 py-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
          <div className="min-w-0">
            <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-block h-8 w-[6px] shrink-0 bg-blue-700" />
                <h1 className="text-[18px] font-bold tracking-tight text-slate-900 md:text-[22px]">
                  Bài viết và kinh nghiệm nuôi trồng thủy sản
                </h1>
              </div>

              <div className="flex w-full max-w-[420px] items-center border border-slate-200 bg-white shadow-sm transition-colors focus-within:border-blue-500 xl:w-[360px] 2xl:w-[420px]">
                <Search size={17} className="ml-3 shrink-0 text-slate-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submitSearch();
                    if (event.key === "Escape") setSearchInput(keyword);
                  }}
                  placeholder="Tìm bài viết..."
                  className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                />
                {searchInput && (
                  <button
                    type="button"
                    aria-label="Xóa từ khóa"
                    onClick={() => {
                      setSearchInput("");
                      if (keyword) navigate({ keyword: undefined, page: undefined });
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-slate-400 transition-colors hover:text-slate-700"
                  >
                    <X size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={submitSearch}
                  className="mr-1 flex h-9 shrink-0 items-center justify-center bg-blue-700 px-4 text-sm font-bold text-white transition-colors hover:bg-blue-800"
                >
                  Tìm
                </button>
              </div>
            </div>

            {(keyword || activeCategory) && (
              <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm">
                <span className="font-medium text-slate-500">Đang lọc theo:</span>
                {keyword && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
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
                    className="flex animate-pulse flex-col overflow-hidden rounded-xl border border-slate-100 bg-white md:h-[210px] md:flex-row"
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
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {posts.map((post) => (
                    <article
                      key={post.id}
                      className="group flex h-[340px] flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <Link
                        href={`/blog/${post.slug}`}
                        className="relative block h-1/2 overflow-hidden bg-slate-100"
                      >
                        {post.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.thumbnailUrl}
                            alt={post.coverImageAlt || post.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <FileText size={36} className="text-slate-300" />
                          </div>
                        )}
                      </Link>

                      <div className="flex h-1/2 flex-col gap-2 px-3.5 pb-3 pt-2.5">
                        <div className="flex items-center justify-between gap-3 text-[12px]">
                          <span className="font-semibold text-[#2f5f98]">
                            {post.category?.name ?? "Cẩm nang kinh nghiệm"}
                          </span>
                          <span className="shrink-0 text-slate-500">
                            {formatDate(post.publishedAt ?? post.createdAt)}
                          </span>
                        </div>

                        <div className="flex min-h-0 flex-1 flex-col gap-1.5">
                          <Link
                            href={`/blog/${post.slug}`}
                            className="block text-[15px] font-bold leading-[1.3] text-slate-900 transition-colors group-hover:text-blue-700 md:text-[16px]"
                          >
                            <span className="line-clamp-2">{normalizeDisplayTitle(post.title)}</span>
                          </Link>
                          <p className="line-clamp-3 flex-1 text-[12px] leading-5 text-slate-700">
                            {post.excerpt || "Nội dung đang được cập nhật."}
                          </p>
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
                      className="flex h-9 w-9 items-center justify-center rounded border border-slate-200 bg-white text-slate-400 transition-colors hover:border-blue-100 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                              ? "border-blue-700 bg-blue-700 text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:border-blue-100 hover:bg-blue-50 hover:text-blue-700"
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
                      className="flex h-9 w-9 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-100 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
            <LatestBlogPostsCard
              posts={latestPosts}
              formatDate={formatDate}
              normalizeTitle={normalizeDisplayTitle}
            />

            <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h3 className="text-[14px] font-bold text-slate-900">
                  Danh mục bài viết
                </h3>
                <ChevronDown size={18} className="text-slate-500" />
              </div>
              <div className="px-5 py-2">
                <button
                  type="button"
                  onClick={() => navigate({ categoryId: undefined, page: undefined })}
                  className={cn(
                    "w-full border-b border-dashed border-slate-200 py-4 text-left text-[12px] transition-colors",
                    !categoryId ? "text-blue-700" : "text-slate-800 hover:text-blue-700"
                  )}
                >
                  Tất cả bài viết
                </button>

                {categories.map((c, index) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => navigate({ categoryId: String(c.id), page: undefined })}
                    className={cn(
                      "w-full text-left text-[12px] transition-colors",
                      categoryId === c.id
                        ? "text-blue-700"
                        : "text-slate-800 hover:text-blue-700"
                    )}
                  >
                    <span
                      className={cn(
                        "block py-4",
                        index < categories.length - 1 && "border-b border-dashed border-slate-200"
                      )}
                    >
                      {c.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="animate-spin text-blue-600" size={28} /></div>}>
      <BlogContent />
    </Suspense>
  );
}

