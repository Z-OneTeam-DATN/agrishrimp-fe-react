"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  Copy,
  Eye,
  Hash,
  Loader2,
  Newspaper,
  Package,
  Search,
  Tag,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  BlogCategoryDTO,
  BlogPostDTO,
  getPublicBlogCategories,
  getPublicBlogPost,
  getPublicBlogPosts,
} from "@/app/services/blog.service";

const RELATED_POST_LIMIT = 2;
const SIDEBAR_POST_LIMIT = 8;

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(value))
    : "";

const getInitials = (name?: string | null) =>
  (name ?? "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "AG";

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [post, setPost] = useState<BlogPostDTO | null>(null);
  const [categories, setCategories] = useState<BlogCategoryDTO[]>([]);
  const [latestPosts, setLatestPosts] = useState<BlogPostDTO[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<BlogPostDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }
  }, [slug]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);

      try {
        const [postData, categoriesData, latestRes] = await Promise.all([
          getPublicBlogPost(slug),
          getPublicBlogCategories(),
          getPublicBlogPosts({ page: 0, size: SIDEBAR_POST_LIMIT }),
        ]);

        if (cancelled) return;

        const latest = latestRes.content ?? [];
        setPost(postData);
        setCategories(categoriesData);
        setLatestPosts(latest);

        if (!postData) {
          setRelatedPosts([]);
          return;
        }

        const fallbackRelated = latest.filter((item) => item.slug !== postData.slug);

        if (!postData.category?.id) {
          setRelatedPosts(fallbackRelated.slice(0, RELATED_POST_LIMIT));
          return;
        }

        const categoryRes = await getPublicBlogPosts({
          categoryId: postData.category.id,
          page: 0,
          size: 6,
        });

        if (cancelled) return;

        const sameCategoryPosts = (categoryRes.content ?? []).filter((item) => item.slug !== postData.slug);
        const mergedRelated = [
          ...sameCategoryPosts,
          ...fallbackRelated.filter((item) => !sameCategoryPosts.some((candidate) => candidate.id === item.id)),
        ].slice(0, RELATED_POST_LIMIT);

        setRelatedPosts(mergedRelated);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData().catch(() => {
      if (cancelled) return;
      setPost(null);
      setCategories([]);
      setLatestPosts([]);
      setRelatedPosts([]);
    });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const popularPosts = useMemo(
    () =>
      [...latestPosts]
        .filter((item) => item.slug !== slug)
        .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
        .slice(0, 3),
    [latestPosts, slug]
  );

  const featuredTags = useMemo(() => {
    const tagMap = new Map<number, { id: number; name: string; count: number }>();
    const sources = [post, ...latestPosts, ...relatedPosts].filter(Boolean) as BlogPostDTO[];

    sources.forEach((entry) => {
      entry.tags.forEach((tag) => {
        const current = tagMap.get(tag.id);
        if (current) {
          current.count += 1;
        } else {
          tagMap.set(tag.id, { id: tag.id, name: tag.name, count: 1 });
        }
      });
    });

    return Array.from(tagMap.values())
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 8);
  }, [post, latestPosts, relatedPosts]);

  const resolvedShareUrl = shareUrl || `https://agrishrimp.io.vn/blog/${slug}`;
  const encodedShareUrl = encodeURIComponent(resolvedShareUrl);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const keyword = searchInput.trim();
    router.push(keyword ? `/blog?keyword=${encodeURIComponent(keyword)}` : "/blog");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(resolvedShareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#f7f7f2]">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bg-[#f7f7f2]">
        <div className="mx-auto max-w-[1440px] px-4 py-20 text-center sm:px-6 lg:px-8">
          <p className="text-lg font-medium text-slate-400">Không tìm thấy bài viết.</p>
          <Link href="/blog" className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline">
            ← Quay về trang blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f2]">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1440px] items-center gap-1.5 px-4 py-3 text-[13px] text-slate-500 sm:px-6 lg:px-8">
          <Link href="/" className="transition-colors hover:text-emerald-700">
            Trang chủ
          </Link>
          <ChevronRight size={12} className="text-slate-300" />
          <Link href="/blog" className="transition-colors hover:text-emerald-700">
            Tin tức & Blog
          </Link>
          <ChevronRight size={12} className="text-slate-300" />
          <span className="max-w-[220px] truncate font-medium text-emerald-700 md:max-w-none">{post.title}</span>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          <div className="min-w-0 flex-1">
            <article className="rounded-[28px] border border-slate-200/80 bg-white px-5 py-6 shadow-[0_16px_50px_-28px_rgba(15,23,42,0.25)] md:px-8 md:py-8">
              <div className="mb-6">
                {post.category && (
                  <Link
                    href={`/blog?categoryId=${post.category.id}`}
                    className="mb-4 inline-block rounded bg-emerald-700 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-emerald-800"
                  >
                    {post.category.name}
                  </Link>
                )}

                <h1 className="text-2xl font-black leading-tight text-slate-900 md:text-3xl lg:text-[40px]">
                  {post.title}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-slate-100 pb-4 text-[13px] text-slate-500">
                  <span className="flex items-center gap-2 font-medium text-slate-700">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold uppercase text-emerald-700">
                      {getInitials(post.author?.fullName)}
                    </span>
                    {post.author?.fullName ?? "AgriShrimp"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={14} />
                    {formatDate(post.publishedAt ?? post.createdAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye size={14} />
                    {(post.viewCount ?? 0).toLocaleString("vi-VN")} lượt xem
                  </span>
                </div>
              </div>

              {post.thumbnailUrl && (
                <div className="mb-8 overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
                  <img src={post.thumbnailUrl} alt={post.title} className="aspect-[16/9] w-full object-cover" />
                </div>
              )}

              {post.excerpt && (
                <p className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-5 py-4 text-base font-medium leading-8 text-slate-700 md:text-[17px]">
                  {post.excerpt}
                </p>
              )}

              <div
                className={cn(
                  "prose prose-slate max-w-none text-[15px] leading-7",
                  "prose-headings:font-bold prose-headings:text-slate-900",
                  "prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-[1.55rem]",
                  "prose-h3:mt-8 prose-h3:mb-3",
                  "prose-p:text-slate-700 prose-p:leading-8",
                  "prose-a:font-semibold prose-a:text-emerald-700",
                  "prose-strong:text-slate-900",
                  "prose-img:rounded-2xl prose-img:shadow-sm",
                  "prose-li:text-slate-700",
                  "prose-blockquote:rounded-r-2xl prose-blockquote:border-l-4 prose-blockquote:border-emerald-700",
                  "prose-blockquote:bg-emerald-50 prose-blockquote:px-5 prose-blockquote:py-3 prose-blockquote:text-slate-700 prose-blockquote:not-italic"
                )}
                dangerouslySetInnerHTML={{ __html: post.content ?? "" }}
              />

              {post.relatedProducts.length > 0 && (
                <section className="mt-10">
                  <div className="mb-4 flex items-center gap-2">
                    <Package size={18} className="text-emerald-700" />
                    <h2 className="text-lg font-bold text-slate-900">Sản phẩm được nhắc đến trong bài</h2>
                  </div>

                  <div className="space-y-4">
                    {post.relatedProducts.map((product) => (
                      <Link
                        key={product.id}
                        href={`/san-pham/${product.slug}`}
                        className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:flex-row sm:items-center"
                      >
                        <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-2">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain" />
                          ) : (
                            <Package size={24} className="text-slate-300" />
                          )}
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <h3 className="text-sm font-bold text-slate-800 sm:text-[15px]">{product.name}</h3>
                          <p className="mt-1 text-xs leading-6 text-slate-500 sm:text-[13px]">
                            Sản phẩm đang được giới thiệu trong nội dung bài viết. Xem chi tiết để kiểm tra công dụng,
                            cách dùng và thông tin giá bán mới nhất.
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                          <span className="text-base font-bold text-emerald-700">
                            {product.basePrice != null ? `${product.basePrice.toLocaleString("vi-VN")}₫` : "Liên hệ"}
                          </span>
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                            Xem sản phẩm
                            <ArrowUpRight size={14} />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <div className="mt-10 flex flex-col gap-4 border-t border-slate-100 pt-6 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 inline-flex items-center gap-1 text-sm font-semibold text-slate-800">
                    <Tag size={14} className="text-slate-400" />
                    Tags:
                  </span>
                  {post.tags.length > 0 ? (
                    post.tags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => router.push(`/blog?keyword=${encodeURIComponent(tag.name)}`)}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-emerald-700 hover:text-white"
                      >
                        {tag.name}
                      </button>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">Chưa có thẻ tag.</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-sm font-semibold text-slate-800">Chia sẻ:</span>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodedShareUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    Facebook
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodedShareUrl}&text=${encodeURIComponent(post.title)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    X
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedShareUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    LinkedIn
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? "Đã copy" : "Copy link"}
                  </button>
                </div>
              </div>
            </article>

            <div className="mt-8 rounded-[28px] border border-emerald-100 bg-emerald-50/60 p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-emerald-700 text-lg font-bold uppercase text-white shadow-sm">
                  {getInitials(post.author?.fullName)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-bold text-slate-900">{post.author?.fullName ?? "Đội ngũ AgriShrimp"}</h3>
                  <p className="mt-1 text-sm font-medium text-emerald-700">Biên tập nội dung thủy sản</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Bài viết được biên tập nhằm chia sẻ kiến thức nuôi trồng thủy sản, kinh nghiệm thực tế và các cập
                    nhật hữu ích để bà con dễ theo dõi, áp dụng và đối chiếu trong quá trình chăm sóc ao nuôi.
                  </p>
                </div>
              </div>
            </div>

            {relatedPosts.length > 0 && (
              <section className="mt-10">
                <div className="mb-6 flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
                  <h2 className="text-xl font-bold text-slate-900">Bài viết liên quan</h2>
                  <Link href="/blog" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                    Xem tất cả
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {relatedPosts.map((item) => (
                    <Link
                      key={item.id}
                      href={`/blog/${item.slug}`}
                      className="group flex gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="relative h-24 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <Newspaper size={20} />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="line-clamp-2 text-sm font-semibold leading-6 text-slate-800 transition-colors group-hover:text-emerald-700">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-[11px] text-slate-400">
                          <CalendarDays size={12} className="mr-1 inline" />
                          {formatDate(item.publishedAt ?? item.createdAt)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="w-full flex-shrink-0 space-y-6 lg:w-[320px]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 inline-flex border-b-2 border-emerald-700 pb-1 text-[15px] font-bold uppercase tracking-wide text-slate-800">
                Tìm kiếm bài viết
              </h3>
              <form onSubmit={handleSearch} className="relative">
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Nhập từ khóa..."
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-4 pr-10 text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-0 top-0 flex h-full px-3 text-slate-400 transition-colors hover:text-emerald-700"
                >
                  <Search size={15} className="my-auto" />
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 inline-flex border-b-2 border-emerald-700 pb-1 text-[15px] font-bold uppercase tracking-wide text-slate-800">
                Chủ đề nổi bật
              </h3>

              <div className="flex flex-col space-y-2">
                {categories.map((category) => {
                  const isActive = post.category?.id === category.id;

                  return (
                    <Link
                      key={category.id}
                      href={`/blog?categoryId=${category.id}`}
                      className={cn(
                        "group flex items-center justify-between py-1.5 text-left transition-colors",
                        isActive ? "text-emerald-700" : "text-slate-600 hover:text-emerald-700"
                      )}
                    >
                      <span className="text-[14px] font-medium">
                        <span className="mr-2 text-[10px] text-slate-400 group-hover:text-emerald-700">›</span>
                        {category.name}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px]",
                          isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-700"
                        )}
                      >
                        {category.postCount}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 inline-flex border-b-2 border-emerald-700 pb-1 text-[15px] font-bold uppercase tracking-wide text-slate-800">
                Xem nhiều nhất
              </h3>

              <div className="flex flex-col gap-4">
                {popularPosts.length > 0 ? (
                  popularPosts.map((item, index) => (
                    <Link
                      key={item.id}
                      href={`/blog/${item.slug}`}
                      className={cn("group flex gap-3", index > 0 && "border-t border-slate-100 pt-3")}
                    >
                      <div className="relative h-[60px] w-[80px] flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
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

                      <div className="min-w-0">
                        <h4 className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-800 transition-colors group-hover:text-emerald-700">
                          {item.title}
                        </h4>
                        <span className="mt-1 inline-block text-[10px] text-slate-400">
                          <CalendarDays size={10} className="mr-1 inline" />
                          {formatDate(item.publishedAt ?? item.createdAt)}
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
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 inline-flex border-b-2 border-emerald-700 pb-1 text-[15px] font-bold uppercase tracking-wide text-slate-800">
                  Thẻ tags nổi bật
                </h3>

                <div className="flex flex-wrap gap-2">
                  {featuredTags.map((tag, index) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => router.push(`/blog?keyword=${encodeURIComponent(tag.name)}`)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors",
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
