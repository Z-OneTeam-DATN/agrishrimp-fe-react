"use client";

import Link from "next/link";
import { ChevronDown, Newspaper } from "lucide-react";
import { BlogPostDTO } from "@/app/services/blog.service";
import { cn } from "@/lib/utils";

type LatestBlogPostsCardProps = {
  posts: BlogPostDTO[];
  formatDate: (value: string | null) => string;
  normalizeTitle: (title: string) => string;
  currentSlug?: string;
  title?: string;
};

export default function LatestBlogPostsCard({
  posts,
  formatDate,
  normalizeTitle,
  currentSlug,
  title = "Bài viết mới nhất",
}: LatestBlogPostsCardProps) {
  const visiblePosts = posts.filter((post) => post.slug !== currentSlug).slice(0, 5);

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-3.5 py-3">
        <h3 className="text-[14px] font-bold text-slate-900">{title}</h3>
        <ChevronDown size={18} className="text-slate-500" />
      </div>
      <div className="px-3 py-1.5">
        {visiblePosts.length > 0 ? (
          visiblePosts.map((post, index) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className={cn(
                "group relative flex items-start gap-2 py-2.5 pl-3",
                index < visiblePosts.length - 1 && "border-b border-dashed border-slate-200"
              )}
            >
              <div className="absolute left-0 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-[#406fb7] text-[13px] font-bold text-white shadow-sm">
                {index + 1}
              </div>
              <div className="h-[54px] w-[82px] flex-shrink-0 overflow-hidden rounded-sm bg-slate-100">
                {post.thumbnailUrl ? (
                  <img
                    src={post.thumbnailUrl}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-300">
                    <Newspaper size={18} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <h4 className="line-clamp-2 text-[11px] font-semibold leading-[1.25] text-slate-900 transition-colors group-hover:text-blue-700">
                  {normalizeTitle(post.title)}
                </h4>
                <p className="mt-0.5 truncate text-[9px] text-slate-500">
                  {post.category?.name ?? "Bài viết"} - {formatDate(post.publishedAt ?? post.createdAt)}
                </p>
              </div>
            </Link>
          ))
        ) : (
          <p className="py-4 text-sm text-slate-400">Chưa có bài viết mới.</p>
        )}
      </div>
    </div>
  );
}
