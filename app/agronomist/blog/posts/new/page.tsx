"use client";

import React, { useEffect, useState } from "react";
import BlogPostForm from "@/components/admin/blog/BlogPostForm";
import { BlogCategoryDTO, adminGetBlogCategories } from "@/app/services/blog.service";

export default function NewAgronomistBlogPostPage() {
  const [categories, setCategories] = useState<BlogCategoryDTO[]>([]);

  useEffect(() => {
    adminGetBlogCategories().then(setCategories).catch(() => {});
  }, []);

  return (
    <div className="space-y-3">
      <div className="mt-2 mb-8 space-y-4 px-1">
        <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
          Viết bài mới
        </h1>
      </div>
      <BlogPostForm categories={categories} redirectBasePath="/agronomist/blog/posts" />
    </div>
  );
}
