"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import BlogPostForm from "@/components/admin/blog/BlogPostForm";
import { BlogCategoryDTO, adminGetBlogCategories } from "@/app/services/blog.service";

export default function NewBlogPostPage() {
  const [categories, setCategories] = useState<BlogCategoryDTO[]>([]);

  useEffect(() => {
    adminGetBlogCategories().then(setCategories).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-1.5 text-sm text-slate-400 mb-3">
          <Link href="/admin/blog/posts" className="hover:text-emerald-600 transition-colors font-medium">
            Bài viết blog
          </Link>
          <ChevronRight size={14} />
          <span className="text-slate-600 font-medium">Viết bài mới</span>
        </div>
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Viết bài mới</h1>
      </div>
      <BlogPostForm categories={categories} />
    </div>
  );
}
