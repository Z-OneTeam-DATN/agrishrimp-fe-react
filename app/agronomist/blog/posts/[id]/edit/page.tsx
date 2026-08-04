"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Loader2 } from "lucide-react";
import BlogPostForm from "@/components/admin/blog/BlogPostForm";
import {
  BlogCategoryDTO, BlogPostDTO,
  adminGetBlogCategories, adminGetBlogPost,
} from "@/app/services/blog.service";

export default function EditAgronomistBlogPostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPostDTO | null>(null);
  const [categories, setCategories] = useState<BlogCategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminGetBlogPost(Number(id)),
      adminGetBlogCategories(),
    ]).then(([p, cats]) => {
      setPost(p);
      setCategories(cats);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="animate-spin text-blue-600" size={28} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-16 text-slate-400 font-medium">
        Không tìm thấy bài viết.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-1.5 text-sm text-slate-400 mb-3">
          <Link href="/agronomist/blog/posts" className="hover:text-blue-600 transition-colors font-medium">
            Bài viết blog
          </Link>
          <ChevronRight size={14} />
          <span className="text-slate-600 font-medium">Chỉnh sửa</span>
        </div>
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Chỉnh sửa bài viết</h1>
        <p className="mt-1 text-sm text-slate-500 line-clamp-1">{post.title}</p>
      </div>
      <BlogPostForm categories={categories} initialData={post} redirectBasePath="/agronomist/blog/posts" />
    </div>
  );
}
