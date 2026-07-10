"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, FileText } from "lucide-react";

import { getPublicBlogPosts } from "@/app/services/blog.service";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const HOME_BLOG_POST_LIMIT = 8;

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(value))
    : "";

const normalizeDisplayTitle = (title: string) => {
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
      const match = word.match(/^([^\p{L}\p{N}]*)([\p{L}\p{N}]+)([^\p{L}\p{N}]*)$/u);
      if (!match) return word;

      const [, prefix, core, suffix] = match;
      const shouldPreserveUppercase =
        /\d/.test(core) || (core.length <= 3 && core === core.toLocaleUpperCase("vi-VN"));

      return `${prefix}${shouldPreserveUppercase ? core : core.toLocaleLowerCase("vi-VN")}${suffix}`;
    })
    .join(" ");

  return normalized.charAt(0).toLocaleUpperCase("vi-VN") + normalized.slice(1);
};

function BlogPostCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="aspect-[16/10] animate-pulse bg-slate-100" />
      <div className="space-y-3 p-5">
        <div className="h-6 w-4/5 animate-pulse rounded bg-slate-100" />
        <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
        <div className="mt-6 h-4 w-2/5 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}

export default function HomeLatestBlogSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["home", "latest-blog-posts", HOME_BLOG_POST_LIMIT],
    queryFn: () => getPublicBlogPosts({ page: 0, size: HOME_BLOG_POST_LIMIT }),
    staleTime: 5 * 60 * 1000,
  });

  const posts = data?.content ?? [];

  if (!isLoading && posts.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto mt-10 w-full max-w-[1880px] px-3 sm:px-4 md:px-6 xl:px-8">
      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-4 py-6 shadow-sm sm:px-5 md:px-7 md:py-8 xl:px-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-[820px]">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-slate-400">
              Blog mới nhất
            </p>
            <h2 className="mt-2 text-[28px] font-black leading-tight tracking-[-0.04em] text-slate-950 sm:text-[34px] md:text-[40px]">
              &quot;Kiến thức <span className="bg-gradient-to-r from-[#3d6f47] via-[#4ca163] to-[#86d79a] bg-clip-text text-transparent">&amp; Kinh nghiệm</span>&quot; nuôi tôm
            </h2>
            <p className="mt-3 max-w-[720px] text-sm leading-6 text-slate-500 sm:text-[15px]">
              Luôn lấy tối đa {HOME_BLOG_POST_LIMIT} bài viết mới nhất để người dùng xem nhanh ngay tại trang chủ.
            </p>
          </div>

          <Link
            href="/blog"
            className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-full border border-[#9db6e4] bg-white px-5 text-sm font-semibold text-[#315f9c] transition-colors hover:bg-[#315f9c] hover:text-white"
          >
            Xem tất cả bài viết
            <ArrowRight size={16} />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <BlogPostCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="group relative">
            <Carousel
              className="w-full"
              opts={{
                align: "start",
                loop: posts.length > 4,
              }}
            >
              <CarouselContent className="-ml-4">
                {posts.map((post) => (
                  <CarouselItem
                    key={post.id}
                    className="pl-4 basis-[88%] sm:basis-1/2 xl:basis-1/4"
                  >
                    <article className="group/card flex h-full flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="relative block aspect-[16/10] overflow-hidden bg-slate-100"
                      >
                        {post.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.thumbnailUrl}
                            alt={post.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <FileText size={38} />
                          </div>
                        )}
                      </Link>

                      <div className="flex flex-1 flex-col px-5 pb-4 pt-4">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="line-clamp-2 text-[18px] font-extrabold leading-[1.3] text-slate-950 transition-colors hover:text-[#315f9c]"
                        >
                          {normalizeDisplayTitle(post.title)}
                        </Link>

                        <p className="mt-3 line-clamp-3 flex-1 text-[14px] leading-6 text-slate-500">
                          {post.excerpt || "Bài viết đang được cập nhật nội dung chi tiết."}
                        </p>

                        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm text-slate-400">
                          <span className="inline-flex min-w-0 items-center gap-2">
                            <CalendarDays size={15} className="shrink-0" />
                            <span className="truncate">
                              {formatDate(post.publishedAt ?? post.createdAt)}
                            </span>
                          </span>
                          <Link
                            href={`/blog/${post.slug}`}
                            className="shrink-0 font-semibold text-[#315f9c] transition-colors hover:text-[#1f457d]"
                          >
                            Xem thêm
                          </Link>
                        </div>
                      </div>
                    </article>
                  </CarouselItem>
                ))}
              </CarouselContent>

              <CarouselPrevious className="left-auto right-14 top-[-58px] h-11 w-11 translate-y-0 border-none bg-white/95 shadow-md transition-opacity hover:bg-white group-hover:opacity-100 disabled:opacity-40" />
              <CarouselNext className="right-0 top-[-58px] h-11 w-11 translate-y-0 border-none bg-white/95 shadow-md transition-opacity hover:bg-white group-hover:opacity-100 disabled:opacity-40" />
            </Carousel>
          </div>
        )}
      </div>
    </section>
  );
}
