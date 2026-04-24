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
  ShoppingCart,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cartService } from "@/app/services/cart.service";
import { PublicProductService } from "@/app/services/publicProduct.service";
import {
  BlogCategoryDTO,
  BlogPostDTO,
  getPublicBlogCategories,
  getPublicBlogPost,
  getPublicBlogPosts,
} from "@/app/services/blog.service";
import { PublicProductDetail, PublicProductVariant } from "@/app/types/product.schema";
import { useCartStore } from "@/stores/useCartStore";
import { cn, formatNumber } from "@/lib/utils";

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

const stripHtml = (html?: string | null) =>
  (html ?? "").replace(/<[^>]*>?/gm, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const decodeHtmlIfNeeded = (html: string) => {
  if (!html.trim()) return html;

  if (!/<[a-z][\s\S]*>/i.test(html) && /&lt;[a-z!/]/i.test(html)) {
    return html
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&");
  }

  return html;
};

const getYoutubeEmbedUrl = (rawUrl?: string | null) => {
  if (!rawUrl?.trim()) return null;

  try {
    const url = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    let videoId = "";

    if (host === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] ?? "";
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v") ?? "";
      } else if (url.pathname.startsWith("/embed/")) {
        videoId = url.pathname.split("/embed/")[1] ?? "";
      } else if (url.pathname.startsWith("/shorts/")) {
        videoId = url.pathname.split("/shorts/")[1] ?? "";
      }
    }

    const cleanVideoId = videoId.split(/[?&/]/)[0]?.trim();

    if (!cleanVideoId) return null;

    return `https://www.youtube.com/embed/${cleanVideoId}`;
  } catch {
    return null;
  }
};

const createYouTubeEmbed = (doc: Document, embedUrl: string, title: string) => {
  const wrapper = doc.createElement("div");
  wrapper.className = "blog-video-embed not-prose";

  const iframe = doc.createElement("iframe");
  iframe.setAttribute("src", embedUrl);
  iframe.setAttribute("title", title || "YouTube video");
  iframe.setAttribute("loading", "lazy");
  iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
  iframe.setAttribute("allowfullscreen", "true");
  iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");

  wrapper.appendChild(iframe);
  return wrapper;
};

const normalizeBlogContentHtml = (content?: string | null) => {
  if (!content?.trim()) {
    return "<p class='text-slate-400 italic'>Nội dung đang được cập nhật.</p>";
  }

  let normalized = decodeHtmlIfNeeded(content.trim());

  if (!/<[a-z][\s\S]*>/i.test(normalized)) {
    const escaped = escapeHtml(normalized)
      .replace(/\n{2,}/g, "</p><p>")
      .replace(/\n/g, "<br />");

    normalized = `<p>${escaped}</p>`;
  }

  if (typeof window === "undefined") {
    return normalized;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="blog-content-root">${normalized}</div>`, "text/html");
  const root = doc.getElementById("blog-content-root");

  if (!root) {
    return normalized;
  }

  root.querySelectorAll("script, style").forEach((element) => element.remove());

  root.querySelectorAll("*").forEach((node) => {
    const element = node as HTMLElement;
    const tag = element.tagName;

    if (tag !== "IFRAME") {
      element.removeAttribute("style");
    }

    if (!["SVG", "PATH", "IFRAME"].includes(tag)) {
      element.removeAttribute("class");
    }

    if (tag === "IMG") {
      element.removeAttribute("width");
      element.removeAttribute("height");
      element.setAttribute("loading", "lazy");
      element.setAttribute("decoding", "async");
    }

    if (tag === "A") {
      element.setAttribute("target", "_blank");
      element.setAttribute("rel", "noreferrer noopener");
    }

    if (tag === "IFRAME") {
      element.removeAttribute("width");
      element.removeAttribute("height");
      element.removeAttribute("style");
      element.removeAttribute("class");
    }
  });

  Array.from(root.querySelectorAll("span, font")).forEach((node) => {
    const element = node as HTMLElement;

    if (element.attributes.length === 0 && !element.querySelector("img, iframe, video, table")) {
      element.replaceWith(...Array.from(element.childNodes));
    }
  });

  Array.from(root.querySelectorAll("oembed[url]")).forEach((node) => {
    const url = node.getAttribute("url");
    const embedUrl = getYoutubeEmbedUrl(url);

    if (!embedUrl) return;

    const replacement = createYouTubeEmbed(doc, embedUrl, "YouTube video");
    const container = node.parentElement?.tagName === "FIGURE" ? node.parentElement : node;
    container.replaceWith(replacement);
  });

  Array.from(root.querySelectorAll("a[href]")).forEach((node) => {
    const anchor = node as HTMLAnchorElement;
    const embedUrl = getYoutubeEmbedUrl(anchor.getAttribute("href"));

    if (!embedUrl) return;

    const container = anchor.parentElement;
    const isStandaloneLink = Boolean(
      container &&
        ["P", "DIV", "FIGURE"].includes(container.tagName) &&
        container.textContent?.trim() === anchor.textContent?.trim()
    );

    if (!isStandaloneLink || !container) return;

    container.replaceWith(createYouTubeEmbed(doc, embedUrl, anchor.textContent?.trim() || "YouTube video"));
  });

  Array.from(root.querySelectorAll("p, div")).forEach((node) => {
    const element = node as HTMLElement;

    if (element.querySelector("*")) return;

    const embedUrl = getYoutubeEmbedUrl(element.textContent?.trim());
    if (!embedUrl) return;

    element.replaceWith(createYouTubeEmbed(doc, embedUrl, "YouTube video"));
  });

  Array.from(root.querySelectorAll("iframe")).forEach((node) => {
    const iframe = node as HTMLIFrameElement;
    const embedUrl = getYoutubeEmbedUrl(iframe.getAttribute("src")) ?? iframe.getAttribute("src");

    if (embedUrl) {
      iframe.setAttribute("src", embedUrl);
    }

    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
    iframe.setAttribute("allowfullscreen", "true");
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");

    if (!iframe.parentElement?.classList.contains("blog-video-embed")) {
      const wrapper = doc.createElement("div");
      wrapper.className = "blog-video-embed not-prose";
      iframe.parentNode?.insertBefore(wrapper, iframe);
      wrapper.appendChild(iframe);
    }
  });

  Array.from(root.querySelectorAll("table")).forEach((node) => {
    const table = node as HTMLTableElement;

    if (table.parentElement?.classList.contains("blog-table-wrap")) return;

    const wrapper = doc.createElement("div");
    wrapper.className = "blog-table-wrap not-prose";
    table.parentNode?.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });

  Array.from(root.querySelectorAll("p")).forEach((node) => {
    const paragraph = node as HTMLParagraphElement;

    if (!paragraph.textContent?.trim() && !paragraph.querySelector("img, iframe, video")) {
      paragraph.remove();
    }
  });

  return root.innerHTML.trim() || normalized;
};

const getPreferredVariant = (detail?: PublicProductDetail | null): PublicProductVariant | null => {
  const variants = detail?.variants ?? [];

  return (
    variants.find((variant) => (variant.quantity ?? 0) > 0 && (variant.batches?.length ?? 0) > 0) ??
    variants.find((variant) => (variant.quantity ?? 0) > 0) ??
    variants.find((variant) => (variant.price ?? 0) > 0) ??
    variants[0] ??
    null
  );
};

const animateFlyToCart = (event: React.MouseEvent) => {
  const cartTarget = document.getElementById("cart-icon-target");
  if (!cartTarget) return;

  const targetRect = cartTarget.getBoundingClientRect();
  const startX = event.clientX;
  const startY = event.clientY;
  const endX = targetRect.left + targetRect.width / 2;
  const endY = targetRect.top + targetRect.height / 2;

  const outer = document.createElement("div");
  outer.style.cssText = `position:fixed;left:${startX}px;top:${startY}px;z-index:9999;pointer-events:none;transition:transform 0.8s cubic-bezier(0.2,0.8,0.2,1)`;

  const inner = document.createElement("div");
  inner.style.cssText =
    "width:32px;height:32px;display:flex;align-items:center;justify-content:center;transition:transform 0.8s cubic-bezier(0.5,-0.5,1,1),opacity 0.8s ease-in";
  inner.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#0d9488" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22v-10"/></svg>';

  outer.appendChild(inner);
  document.body.appendChild(outer);
  void outer.offsetWidth;

  outer.style.transform = `translateX(${endX - startX - 16}px)`;
  inner.style.transform = `translateY(${endY - startY - 16}px) scale(0.5) rotate(360deg)`;
  inner.style.opacity = "0.2";

  setTimeout(() => {
    if (document.body.contains(outer)) {
      document.body.removeChild(outer);
    }

    cartTarget.classList.add("scale-125", "text-teal-500");
    setTimeout(() => cartTarget.classList.remove("scale-125", "text-teal-500"), 200);
  }, 800);
};

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { fetchCartCount } = useCartStore();

  const [post, setPost] = useState<BlogPostDTO | null>(null);
  const [categories, setCategories] = useState<BlogCategoryDTO[]>([]);
  const [latestPosts, setLatestPosts] = useState<BlogPostDTO[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<BlogPostDTO[]>([]);
  const [relatedProductDetails, setRelatedProductDetails] = useState<Record<number, PublicProductDetail | null>>({});
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [addingProductId, setAddingProductId] = useState<number | null>(null);

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

  useEffect(() => {
    let cancelled = false;

    const loadRelatedProductDetails = async () => {
      if (!post?.relatedProducts.length) {
        setRelatedProductDetails({});
        return;
      }

      const entries = await Promise.all(
        post.relatedProducts.map(async (product) => {
          try {
            const detail = await PublicProductService.getBySlug(product.slug);
            return [product.id, detail] as const;
          } catch {
            return [product.id, null] as const;
          }
        })
      );

      if (!cancelled) {
        setRelatedProductDetails(Object.fromEntries(entries));
      }
    };

    loadRelatedProductDetails().catch(() => {
      if (!cancelled) {
        setRelatedProductDetails({});
      }
    });

    return () => {
      cancelled = true;
    };
  }, [post]);

  const normalizedContentHtml = useMemo(() => normalizeBlogContentHtml(post?.content), [post?.content]);

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

  const handleQuickAddProduct = async (
    event: React.MouseEvent<HTMLButtonElement>,
    product: BlogPostDTO["relatedProducts"][number]
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const detail = relatedProductDetails[product.id];
    const variant = getPreferredVariant(detail);

    if (!variant?.id) {
      toast.error("Sản phẩm này hiện chưa có biến thể để thêm vào giỏ.");
      return;
    }

    setAddingProductId(product.id);

    try {
      await cartService.updateQuantity(variant.id, 1);
      await fetchCartCount();
      animateFlyToCart(event);
      toast.success(`Đã thêm ${detail?.name ?? product.name} vào giỏ hàng`);
    } catch (error: unknown) {
      const apiError = error as {
        response?: {
          status?: number;
          data?: { message?: string };
        };
      };

      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        toast.error("Vui lòng đăng nhập để mua hàng!");
        window.setTimeout(() => router.push("/login"), 1200);
      } else {
        toast.error(apiError.response?.data?.message || "Không thể thêm vào giỏ hàng");
      }
    } finally {
      setAddingProductId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#fcfcfc]">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bg-[#fcfcfc]">
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
    <div className="min-h-screen bg-[#fcfcfc]">
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
            <article className="rounded-2xl border border-slate-200/80 bg-white px-5 py-6 shadow-[0_16px_50px_-28px_rgba(15,23,42,0.25)] md:px-8 md:py-8">
              <div className="mb-6">
                {post.category && (
                  <Link
                    href={`/blog?categoryId=${post.category.id}`}
                    className="mb-4 inline-block rounded bg-emerald-700 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-emerald-800"
                  >
                    {post.category.name}
                  </Link>
                )}

                <h1 className="max-w-[980px] break-words text-[28px] font-black leading-[1.06] tracking-[-0.03em] text-slate-900 [text-wrap:balance] md:text-[34px] lg:text-[38px]">
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
                <div className="mb-8 overflow-hidden rounded-xl bg-slate-100 shadow-sm">
                  <img src={post.thumbnailUrl} alt={post.title} className="aspect-[16/9] w-full object-cover" />
                </div>
              )}

              {post.excerpt && (
                <p className="mb-8 rounded-xl border border-emerald-100 bg-emerald-50/70 px-5 py-4 text-[15px] font-medium leading-7 text-slate-700 md:text-base">
                  {post.excerpt}
                </p>
              )}

              <div
                className={cn(
                  "prose prose-sm prose-slate max-w-none break-words text-slate-700 sm:prose-base",
                  "prose-headings:mt-8 prose-headings:mb-4 prose-headings:font-bold prose-headings:leading-tight prose-headings:text-slate-900",
                  "prose-p:my-4 prose-p:text-[15px] prose-p:leading-7 prose-p:text-slate-700",
                  "prose-h1:text-[1.85rem] prose-h2:text-[1.55rem] prose-h3:text-[1.25rem]",
                  "prose-a:font-semibold prose-a:text-emerald-700 prose-a:break-all",
                  "prose-strong:text-slate-900",
                  "prose-img:mx-auto prose-img:h-auto prose-img:w-full prose-img:rounded-xl prose-img:object-contain prose-img:shadow-sm",
                  "prose-ul:pl-5 prose-ol:pl-5 prose-li:my-1 prose-li:leading-7 prose-li:text-slate-700",
                  "prose-blockquote:rounded-r-xl prose-blockquote:border-l-4 prose-blockquote:border-emerald-700 prose-blockquote:bg-emerald-50 prose-blockquote:px-5 prose-blockquote:py-3 prose-blockquote:text-slate-700 prose-blockquote:not-italic",
                  "[overflow-wrap:anywhere] [&_*]:max-w-full [&_h1]:[text-wrap:balance] [&_h2]:[text-wrap:balance] [&_h3]:[text-wrap:balance]",
                  "[&_figure]:mx-0 [&_figcaption]:text-center [&_figcaption]:text-xs [&_figcaption]:text-slate-500",
                  "[&_iframe]:w-full [&_.blog-video-embed]:my-6 [&_.blog-video-embed]:overflow-hidden [&_.blog-video-embed]:rounded-xl [&_.blog-video-embed]:bg-slate-950 [&_.blog-video-embed_iframe]:aspect-video [&_.blog-video-embed_iframe]:border-0",
                  "[&_.blog-table-wrap]:my-6 [&_.blog-table-wrap]:overflow-x-auto [&_table]:min-w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:p-3 [&_td]:border [&_td]:border-slate-200 [&_td]:p-3",
                  "[&_span]:whitespace-normal [&_img]:mx-auto"
                )}
                dangerouslySetInnerHTML={{ __html: normalizedContentHtml }}
              />

              {post.relatedProducts.length > 0 && (
                <section className="mt-10">
                  <div className="mb-5 flex items-center gap-2">
                    <Package size={18} className="text-emerald-700" />
                    <h2 className="text-lg font-bold text-slate-900">Sản phẩm được nhắc đến trong bài</h2>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {post.relatedProducts.map((product) => {
                      const detail = relatedProductDetails[product.id];
                      const variant = getPreferredVariant(detail);
                      const detailLoaded = Object.prototype.hasOwnProperty.call(relatedProductDetails, product.id);
                      const displayImage =
                        detail?.imageUrls?.[0] ??
                        detail?.variants?.[0]?.imageUrl ??
                        product.imageUrl ??
                        "/placeholder.svg";
                      const displayPrice = variant?.price ?? product.basePrice ?? null;
                      const displayUnit = variant?.unit;
                      const shortDescription =
                        stripHtml(detail?.shortDesc) ||
                        "Thêm nhanh sản phẩm này vào giỏ hàng ngay trong lúc đọc bài viết.";

                      return (
                        <article
                          key={product.id}
                          className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                        >
                          <Link
                            href={`/san-pham/${product.slug}`}
                            className="group relative block aspect-square overflow-hidden bg-slate-50"
                          >
                            {displayImage ? (
                              <img
                                src={displayImage}
                                alt={product.name}
                                className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-300">
                                <Package size={28} />
                              </div>
                            )}
                          </Link>

                          <div className="flex flex-1 flex-col p-4">
                            <Link href={`/san-pham/${product.slug}`} className="group">
                              <h3 className="line-clamp-2 min-h-[44px] text-[15px] font-bold leading-[1.45] text-slate-800 transition-colors group-hover:text-emerald-700">
                                {product.name}
                              </h3>
                            </Link>

                            <p className="mt-2 line-clamp-2 min-h-[40px] text-[13px] leading-5 text-slate-500">
                              {shortDescription}
                            </p>

                            <div className="mt-4 flex items-end justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-lg font-black text-emerald-700">
                                  {displayPrice != null ? `${formatNumber(displayPrice)}₫` : "Liên hệ"}
                                </p>
                                <p className="mt-1 text-[11px] text-slate-400">
                                  {displayUnit ? `Đơn vị: ${displayUnit}` : "Xem chi tiết sản phẩm"}
                                </p>
                              </div>

                              <Link
                                href={`/san-pham/${product.slug}`}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 transition-colors hover:text-emerald-800"
                              >
                                Xem
                                <ArrowUpRight size={13} />
                              </Link>
                            </div>

                            <button
                              type="button"
                              onClick={(event) => handleQuickAddProduct(event, product)}
                              disabled={addingProductId === product.id || !detailLoaded || !variant}
                              className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              {addingProductId === product.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <ShoppingCart size={16} />
                              )}
                              {detailLoaded ? "Thêm vào giỏ" : "Đang tải..."}
                            </button>
                          </div>
                        </article>
                      );
                    })}
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
                      className="group flex gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
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
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
