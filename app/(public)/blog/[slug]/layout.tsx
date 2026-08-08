import type { Metadata } from "next";

import JsonLd from "@/components/seo/JsonLd";
import { getPublicBlogPost } from "@/app/services/blog.service";
import {
  blogPostingJsonLd,
  breadcrumbJsonLd,
  createSeoMetadata,
  stripHtml,
  truncateText,
} from "@/lib/seo";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

type MetadataProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicBlogPost(slug);

  if (!post) {
    return createSeoMetadata({
      title: "Bài viết | AgriShrimp",
      description: "Bài viết kiến thức thủy sản tại AgriShrimp.",
      path: `/blog/${slug}`,
      robots: "noindex",
    });
  }

  const title = post.seoTitle || `${post.title} | Blog AgriShrimp`;
  const description =
    post.metaDescription ||
    truncateText(post.excerpt || stripHtml(post.content), 155) ||
    "Bài viết kiến thức thủy sản tại AgriShrimp.";

  return createSeoMetadata({
    title,
    description,
    path: `/blog/${post.slug}`,
    canonicalUrl: post.canonicalUrl,
    image: post.thumbnailUrl,
    type: "article",
  });
}

export default async function BlogPostLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  const post = await getPublicBlogPost(slug);

  if (!post) {
    return <>{children}</>;
  }

  const description =
    post.metaDescription ||
    truncateText(post.excerpt || stripHtml(post.content), 250) ||
    "Bài viết kiến thức thủy sản tại AgriShrimp.";

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Trang chủ", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />
      <JsonLd
        data={blogPostingJsonLd({
          title: post.title,
          description,
          path: `/blog/${post.slug}`,
          image: post.thumbnailUrl,
          datePublished: post.publishedAt,
          dateModified: post.updatedAt,
          authorName: post.author?.fullName,
        })}
      />
      {children}
    </>
  );
}
