import { apiJava, buildJavaApiUrl } from "@/lib/axios";

export type BlogCategoryStatus = "ACTIVE" | "INACTIVE";

export interface BlogCategoryDTO {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  status: BlogCategoryStatus;
  postCount: number;
}

export interface BlogTagDTO {
  id: number;
  name: string;
  slug: string;
  usageCount?: number;
}

export interface BlogAuthorDTO {
  id: number;
  fullName: string;
}

export interface BlogRelatedProductDTO {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  basePrice: number | null;
}

export interface BlogPostDTO {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  thumbnailUrl: string | null;
  status: "DRAFT" | "IN_REVIEW" | "PUBLISHED";
  reviewNote: string | null;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: BlogAuthorDTO | null;
  category: { id: number; name: string; slug: string } | null;
  tags: BlogTagDTO[];
  relatedProducts: BlogRelatedProductDTO[];
}

export interface BlogPageDTO {
  content: BlogPostDTO[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}

export interface BlogCommentDTO {
  id: number;
  parentId: number | null;
  authorId: number | null;
  authorName: string;
  authorAvatarUrl: string | null;
  content: string;
  mentionName: string | null;
  createdAt: string;
  replies: BlogCommentDTO[];
}

export interface BlogCommentPayload {
  content: string;
  parentId?: number | null;
}

// ─── PUBLIC ──────────────────────────────────────────────────────────────────

export const getPublicBlogPosts = async (params?: {
  keyword?: string;
  categoryId?: number;
  page?: number;
  size?: number;
}): Promise<BlogPageDTO> => {
  try {
    const res = await apiJava.get(buildJavaApiUrl("/v1/public/blog/posts"), {
      params: { ...params, sort: "publishedAt,desc" },
      isPublic: true,
    } as any);
    return res.data;
  } catch {
    return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 9, last: true };
  }
};

export const getPublicBlogPost = async (slug: string): Promise<BlogPostDTO | null> => {
  try {
    const res = await apiJava.get(buildJavaApiUrl(`/v1/public/blog/posts/${slug}` as any), {
      isPublic: true,
    } as any);
    return res.data;
  } catch {
    return null;
  }
};

export const getPublicBlogCategories = async (): Promise<BlogCategoryDTO[]> => {
  try {
    const res = await apiJava.get(buildJavaApiUrl("/v1/public/blog/categories"), {
      isPublic: true,
    } as any);
    return res.data ?? [];
  } catch {
    return [];
  }
};

export const getPublicBlogComments = async (slug: string): Promise<BlogCommentDTO[]> => {
  try {
    const res = await apiJava.get(buildJavaApiUrl(`/v1/public/blog/posts/${slug}/comments` as any), {
      isPublic: true,
    } as any);
    return res.data ?? [];
  } catch {
    return [];
  }
};

export const createPublicBlogComment = async (
  slug: string,
  payload: BlogCommentPayload
): Promise<BlogCommentDTO> => {
  const res = await apiJava.post(buildJavaApiUrl(`/v1/public/blog/posts/${slug}/comments` as any), payload);
  return res.data;
};

// ─── ADMIN ───────────────────────────────────────────────────────────────────

export const adminGetBlogPosts = async (params?: {
  keyword?: string;
  status?: string;
  categoryId?: number;
  authorId?: number;
  page?: number;
  size?: number;
  sort?: string;
}): Promise<BlogPageDTO> => {
  const res = await apiJava.get(buildJavaApiUrl("/blog/posts"), {
    params: { sort: "createdAt,desc", ...params },
  });
  return res.data?.data;
};

export const adminGetBlogPost = async (id: number): Promise<BlogPostDTO> => {
  const res = await apiJava.get(buildJavaApiUrl(`/blog/posts/${id}` as any));
  return res.data?.data;
};

export const adminCreateBlogPost = async (data: FormData): Promise<BlogPostDTO> => {
  const res = await apiJava.post(buildJavaApiUrl("/blog/posts"), data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data;
};

export const adminUpdateBlogPost = async (id: number, data: FormData): Promise<BlogPostDTO> => {
  const res = await apiJava.put(buildJavaApiUrl(`/blog/posts/${id}` as any), data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data;
};

export const adminPublishBlogPost = async (id: number): Promise<void> => {
  await apiJava.patch(buildJavaApiUrl(`/blog/posts/${id}/publish` as any));
};

export const adminDraftBlogPost = async (id: number): Promise<void> => {
  await apiJava.patch(buildJavaApiUrl(`/blog/posts/${id}/draft` as any));
};

export const adminApproveBlogPost = async (id: number): Promise<void> => {
  await apiJava.patch(buildJavaApiUrl(`/blog/posts/${id}/approve` as any));
};

export const adminRejectBlogPost = async (id: number, reason: string): Promise<void> => {
  await apiJava.patch(buildJavaApiUrl(`/blog/posts/${id}/reject` as any), { reason });
};

export const adminDeleteBlogPost = async (id: number): Promise<void> => {
  await apiJava.delete(buildJavaApiUrl(`/blog/posts/${id}` as any));
};

export const adminGetBlogCategories = async (): Promise<BlogCategoryDTO[]> => {
  const res = await apiJava.get(buildJavaApiUrl("/blog/categories"));
  return res.data?.data ?? [];
};

export const adminGetBlogAuthors = async (): Promise<BlogAuthorDTO[]> => {
  const res = await apiJava.get(buildJavaApiUrl("/blog/authors"));
  return res.data?.data ?? [];
};

export const adminGetBlogTags = async (): Promise<BlogTagDTO[]> => {
  const res = await apiJava.get(buildJavaApiUrl("/blog/tags"));
  return res.data?.data ?? [];
};

export const adminCreateBlogTag = async (data: {
  name: string;
  slug?: string;
}): Promise<BlogTagDTO> => {
  const res = await apiJava.post(buildJavaApiUrl("/blog/tags"), data);
  return res.data?.data;
};

export const adminCreateBlogCategory = async (data: {
  name: string;
  slug?: string;
  description?: string;
  status?: BlogCategoryStatus;
}): Promise<BlogCategoryDTO> => {
  const res = await apiJava.post(buildJavaApiUrl("/blog/categories"), data);
  return res.data?.data;
};

export const adminUpdateBlogCategory = async (
  id: number,
  data: { name?: string; slug?: string; description?: string; status?: BlogCategoryStatus }
): Promise<BlogCategoryDTO> => {
  const res = await apiJava.put(buildJavaApiUrl(`/blog/categories/${id}` as any), data);
  return res.data?.data;
};

export const adminDeleteBlogCategory = async (id: number): Promise<void> => {
  await apiJava.delete(buildJavaApiUrl(`/blog/categories/${id}` as any));
};
