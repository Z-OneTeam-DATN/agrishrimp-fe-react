"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Loader2, ChevronRight, Calendar, Eye, User2, Tag, Package,
} from "lucide-react";
import { getPublicBlogPost, BlogPostDTO } from "@/app/services/blog.service";

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicBlogPost(slug).then(setPost).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  const formatDate = (s: string | null) =>
    s ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(s)) : "";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-400 font-medium text-lg">Không tìm thấy bài viết.</p>
        <Link href="/blog" className="mt-4 inline-block text-sm text-emerald-600 hover:underline font-medium">
          ← Quay về trang blog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-1.5 text-sm text-slate-400">
          <Link href="/" className="hover:text-emerald-600 transition-colors">Trang chủ</Link>
          <ChevronRight size={13} />
          <Link href="/blog" className="hover:text-emerald-600 transition-colors">Blog</Link>
          {post.category && (
            <>
              <ChevronRight size={13} />
              <Link href={`/blog?categoryId=${post.category.id}`}
                className="hover:text-emerald-600 transition-colors">
                {post.category.name}
              </Link>
            </>
          )}
          <ChevronRight size={13} />
          <span className="text-slate-600 font-medium truncate max-w-[200px]">{post.title}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <article className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Thumbnail */}
          {post.thumbnailUrl && (
            <div className="h-64 sm:h-80 bg-slate-100 overflow-hidden">
              <img src={post.thumbnailUrl} alt={post.title}
                className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-6 sm:p-8">
            {/* Category */}
            {post.category && (
              <Link href={`/blog?categoryId=${post.category.id}`}
                className="inline-block text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full mb-4 hover:bg-emerald-100 transition-colors">
                {post.category.name}
              </Link>
            )}

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 leading-tight mb-4">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-400 pb-5 border-b border-slate-100 mb-6">
              {post.author && (
                <span className="flex items-center gap-1.5">
                  <User2 size={13} /> {post.author.fullName}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar size={13} /> {formatDate(post.publishedAt ?? post.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye size={13} /> {(post.viewCount ?? 0).toLocaleString("vi-VN")} lượt xem
              </span>
            </div>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-base text-slate-600 font-medium leading-relaxed mb-6 italic border-l-4 border-emerald-400 pl-4 py-1">
                {post.excerpt}
              </p>
            )}

            {/* Content */}
            <div
              className="prose prose-slate prose-emerald max-w-none prose-headings:font-bold prose-a:text-emerald-600 prose-img:rounded-xl"
              dangerouslySetInnerHTML={{ __html: post.content ?? "" }}
            />

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="mt-8 pt-5 border-t border-slate-100 flex flex-wrap gap-2 items-center">
                <Tag size={14} className="text-slate-400" />
                {post.tags.map((t) => (
                  <span key={t.id}
                    className="text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                    {t.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </article>

        {/* Related Products */}
        {post.relatedProducts.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Package size={18} className="text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-800">Sản phẩm được nhắc đến trong bài</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {post.relatedProducts.map((p) => (
                <Link key={p.id} href={`/san-pham/${p.slug}`}
                  className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-md transition-all duration-200 group flex flex-col">
                  <div className="aspect-square bg-slate-50 overflow-hidden">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={24} className="text-slate-200" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="text-[13px] font-semibold text-slate-700 line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors">
                      {p.name}
                    </h3>
                    {p.basePrice != null && (
                      <p className="mt-1.5 text-sm font-bold text-emerald-600">
                        {p.basePrice.toLocaleString("vi-VN")}₫
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back link */}
        <div className="mt-8">
          <Link href="/blog"
            className="text-sm text-slate-500 hover:text-emerald-600 transition-colors font-medium flex items-center gap-1.5">
            ← Quay về trang blog
          </Link>
        </div>
      </div>
    </div>
  );
}
