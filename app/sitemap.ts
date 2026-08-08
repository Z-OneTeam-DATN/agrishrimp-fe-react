import type { MetadataRoute } from "next";

import { getPublicBlogPosts } from "@/app/services/blog.service";
import { getPublicCategories } from "@/app/services/CategoryService";
import { getPublicAiDiseases } from "@/app/services/publicAiDisease.service";
import { PublicProductService } from "@/app/services/publicProduct.service";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const staticRoutes = [
  "/",
  "/chan-doan-benh-tom-bang-ai",
  "/benh-tom",
  "/vat-tu-thuy-san",
  "/san-pham",
  "/blog",
  "/gioi-thieu",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products, blogPosts, diseases] = await Promise.all([
    getPublicCategories(),
    PublicProductService.getList({ page: 0, size: 1000 }),
    getPublicBlogPosts({ page: 0, size: 1000 }),
    getPublicAiDiseases(),
  ]);

  const urls: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.8,
  }));

  categories
    .filter((category) => category.slug)
    .forEach((category) => {
      urls.push({
        url: absoluteUrl(`/danh-muc/${category.slug}`),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    });

  (products.content ?? [])
    .filter((product) => product.slug)
    .forEach((product) => {
      urls.push({
        url: absoluteUrl(`/san-pham/${product.slug}`),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    });

  (blogPosts.content ?? [])
    .filter((post) => post.slug)
    .forEach((post) => {
      urls.push({
        url: absoluteUrl(`/blog/${post.slug}`),
        lastModified: post.updatedAt || post.publishedAt || undefined,
        changeFrequency: "monthly",
        priority: 0.65,
      });
    });

  diseases
    .filter((disease) => disease.slug)
    .forEach((disease) => {
      urls.push({
        url: absoluteUrl(`/benh-tom/${disease.slug}`),
        lastModified: disease.updatedAt || disease.createdAt || undefined,
        changeFrequency: "monthly",
        priority: 0.75,
      });
    });

  return urls.filter((entry) => entry.url.startsWith(SITE_URL));
}
