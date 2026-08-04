"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CalendarDays,
  Check,
  Copy,
  Eye,
  Loader2,
  Package,
  ShoppingCart,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
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
import { cn } from "@/lib/utils";
import BlogComments from "@/components/site/BlogComments";
import LatestBlogPostsCard from "@/components/site/LatestBlogPostsCard";

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

    // Reset text-transform from CMS content so text doesn't render as all-caps.
    element.style.textTransform = "none";

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

    cartTarget.classList.add("scale-125", "text-blue-500");
    setTimeout(() => cartTarget.classList.remove("scale-125", "text-blue-500"), 200);
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
        setCategories((categoriesData ?? []).filter((category) => category.status === "ACTIVE"));
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

  const resolvedShareUrl = shareUrl || `https://agrishrimp.io.vn/blog/${slug}`;
  const encodedShareUrl = encodeURIComponent(resolvedShareUrl);

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
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bg-[#fcfcfc]">
        <div className="mx-auto max-w-[1440px] px-4 py-20 text-center sm:px-6 lg:px-8">
          <p className="text-lg font-medium text-slate-400">Không tìm thấy bài viết.</p>
          <Link href="/blog" className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline">
            ← Quay về trang blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="w-full bg-[linear-gradient(135deg,#eff8f1_0%,#f2fbf7_28%,#f4f9ff_62%,#eef4ff_100%)]">
        <div className="mx-auto w-full max-w-[1440px] px-4 pb-8 pt-10 sm:px-6 lg:px-8 lg:pb-10 lg:pt-12">
          <div className="max-w-[1260px]">
            {post.category && (
              <Link
                href={`/blog?categoryId=${post.category.id}`}
                className="inline-block text-sm font-medium text-slate-700 transition-colors hover:text-blue-700"
              >
                {normalizeDisplayTitle(post.category.name)}
              </Link>
            )}

            <h1 className="mt-2.5 max-w-[1240px] text-[16px] font-bold leading-[1.34] tracking-[-0.005em] text-slate-950 [text-wrap:pretty] md:text-[21px] lg:text-[24px] xl:text-[28px]">
              {normalizeDisplayTitle(post.title)}
            </h1>

            <div className="mt-3.5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
              <span className="flex items-center gap-2">
                <CalendarDays size={16} />
                {formatDate(post.publishedAt ?? post.createdAt)}
              </span>
              <span className="flex items-center gap-2">
                <Eye size={16} />
                {(post.viewCount ?? 0).toLocaleString("vi-VN")} lượt xem
              </span>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          <div className="min-w-0 flex-1">
            <article>
              {post.thumbnailUrl && (
                <div className="mb-8 overflow-hidden rounded-[24px] bg-slate-100">
                  <img src={post.thumbnailUrl} alt={post.title} className="aspect-[16/9] w-full object-cover" />
                </div>
              )}

              {post.excerpt && (
                <p className="mb-8 text-[15px] font-medium leading-8 text-slate-700 md:text-[16px]">
                  {post.excerpt}
                </p>
              )}

              <div
                className={cn(
                  "prose prose-sm prose-slate max-w-none break-words text-slate-700 sm:prose-base",
                  "prose-headings:mt-6 prose-headings:mb-3 prose-headings:font-bold prose-headings:leading-[1.3] prose-headings:text-slate-900",
                  "prose-p:my-3 prose-p:text-[13.5px] prose-p:leading-[1.85] prose-p:text-slate-700 md:prose-p:text-[14.5px]",
                  "prose-h1:text-[1.32rem] md:prose-h1:text-[1.55rem] prose-h2:text-[1.18rem] md:prose-h2:text-[1.32rem] prose-h3:text-[1.02rem] md:prose-h3:text-[1.12rem]",
                  "prose-a:font-semibold prose-a:text-blue-700 prose-a:break-all",
                  "prose-strong:font-semibold prose-strong:text-slate-900",
                  "prose-img:mx-auto prose-img:h-auto prose-img:w-full prose-img:max-w-2xl prose-img:rounded-xl prose-img:object-contain prose-img:shadow-sm",
                  "prose-ul:pl-5 prose-ol:pl-5 prose-li:my-1 prose-li:text-[13.5px] prose-li:leading-[1.85] prose-li:text-slate-700 md:prose-li:text-[14.5px]",
                  "prose-blockquote:rounded-r-xl prose-blockquote:border-l-4 prose-blockquote:border-blue-700 prose-blockquote:bg-blue-50 prose-blockquote:px-5 prose-blockquote:py-3 prose-blockquote:text-slate-700 prose-blockquote:not-italic",
                  "[overflow-wrap:anywhere] [&_*]:max-w-full [&_*]:normal-case [&_h1]:[text-wrap:balance] [&_h2]:[text-wrap:balance] [&_h3]:[text-wrap:balance]",
                  "[&_b]:font-semibold [&_strong]:font-semibold [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-bold",
                  "[&_span]:text-inherit [&_p]:normal-case [&_h1]:normal-case [&_h2]:normal-case [&_h3]:normal-case",
                  "[&_figure]:mx-0 [&_figcaption]:text-center [&_figcaption]:text-xs [&_figcaption]:text-slate-500",
                  "[&_iframe]:w-full [&_.blog-video-embed]:my-6 [&_.blog-video-embed]:overflow-hidden [&_.blog-video-embed]:rounded-xl [&_.blog-video-embed]:bg-slate-950 [&_.blog-video-embed_iframe]:aspect-video [&_.blog-video-embed_iframe]:border-0",
                  "[&_.blog-table-wrap]:my-6 [&_.blog-table-wrap]:overflow-x-auto [&_table]:min-w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:p-3 [&_td]:border [&_td]:border-slate-200 [&_td]:p-3",
                  "[&_span]:whitespace-normal [&_img]:mx-auto"
                )}
                dangerouslySetInnerHTML={{ __html: normalizedContentHtml }}
              />

              {post.relatedProducts.length > 0 && (
                <section className="mt-12 border-t border-slate-200 pt-8">
                  <div className="mb-5 flex items-center gap-2">
                    <Package size={18} className="text-blue-700" />
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
                      return (
                        <article
                          key={product.id}
                          className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
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
                              <h3 className="line-clamp-2 min-h-[44px] text-[15px] font-bold leading-[1.45] text-slate-800 transition-colors group-hover:text-blue-700">
                                {detail?.name ?? product.name}
                              </h3>
                            </Link>

                            <button
                              type="button"
                              onClick={(event) => handleQuickAddProduct(event, product)}
                              disabled={addingProductId === product.id || !detailLoaded || !variant}
                              className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-bold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
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

              <div className="mt-12 flex flex-col gap-4 border-t border-slate-200 pt-6 md:flex-row md:items-center md:justify-between">
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
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-blue-700 hover:text-white"
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
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    Facebook
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodedShareUrl}&text=${encodeURIComponent(post.title)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    X
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedShareUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    LinkedIn
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? "Đã copy" : "Copy link"}
                  </button>
                </div>
              </div>

              <BlogComments slug={slug} />
            </article>

          </div>

          <aside className="w-full flex-shrink-0 space-y-6 lg:sticky lg:top-[calc(var(--site-header-height,96px)+1rem)] lg:max-h-[calc(100vh-var(--site-header-height,96px)-2rem)] lg:w-[320px] lg:self-start lg:overflow-y-auto lg:pr-1">
            <LatestBlogPostsCard
              posts={latestPosts}
              currentSlug={slug}
              formatDate={formatDate}
              normalizeTitle={normalizeDisplayTitle}
            />

            <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="text-[14px] font-bold text-slate-900">Danh mục bài viết</h3>
              </div>
              <div className="px-5 py-2">
                <Link
                  href="/blog"
                  className="block w-full border-b border-dashed border-slate-200 py-4 text-left text-[12px] transition-colors text-slate-800 hover:text-blue-700"
                >
                  Tất cả bài viết
                </Link>

                {categories.map((category, index) => {
                  const isActive = post.category?.id === category.id;

                  return (
                    <Link
                      key={category.id}
                      href={`/blog?categoryId=${category.id}`}
                      className={cn(
                        "block w-full text-left text-[12px] transition-colors",
                        isActive ? "text-blue-700" : "text-slate-800 hover:text-blue-700"
                      )}
                    >
                      <span
                        className={cn(
                          "block py-4",
                          index < categories.length - 1 && "border-b border-dashed border-slate-200"
                        )}
                      >
                        {category.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {relatedPosts.length > 0 && (
              <LatestBlogPostsCard
                title="Bài viết liên quan"
                posts={relatedPosts}
                currentSlug={slug}
                formatDate={formatDate}
                normalizeTitle={normalizeDisplayTitle}
              />
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

