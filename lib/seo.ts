import type { Metadata } from "next";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ??
  "https://agrishrimp.io.vn";

export const SITE_NAME = "AgriShrimp";
export const DEFAULT_OG_IMAGE = "/images/logo_arishrimp.jpg";

type RobotsMode = "index" | "noindex";

export function absoluteUrl(path = "/") {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function internalCanonicalUrl(path: string, canonicalUrl?: string | null) {
  const value = canonicalUrl?.trim();
  if (!value) return absoluteUrl(path);

  if (value.startsWith("/")) {
    return absoluteUrl(value);
  }

  try {
    const candidate = new URL(value);
    if (candidate.origin === SITE_URL) {
      return candidate.toString();
    }
  } catch {
    return absoluteUrl(path);
  }

  return absoluteUrl(path);
}

export function truncateText(value: string | null | undefined, max = 155) {
  const text = stripHtml(value).replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

export function stripHtml(value: string | null | undefined) {
  return (value ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

export function createSeoMetadata({
  title,
  description,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  robots = "index",
  type = "website",
  canonicalUrl,
}: {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  robots?: RobotsMode;
  type?: "website" | "article";
  canonicalUrl?: string | null;
}): Metadata {
  const canonical = internalCanonicalUrl(path, canonicalUrl);
  const imageUrl = absoluteUrl(image || DEFAULT_OG_IMAGE);

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical,
    },
    robots:
      robots === "noindex"
        ? { index: false, follow: true }
        : { index: true, follow: true },
    openGraph: {
      type,
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
      images: [{ url: imageUrl }],
      locale: "vi_VN",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export function removeEmpty<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((item) => removeEmpty(item))
      .filter((item) => item !== null && item !== undefined && item !== "") as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, removeEmpty(item)])
        .filter(([, item]) => item !== null && item !== undefined && item !== ""),
    ) as T;
  }

  return value;
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return removeEmpty({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  });
}

export function organizationJsonLd() {
  return removeEmpty({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/images/logo_arishrimp.jpg"),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "1800 6324",
      contactType: "customer support",
      areaServed: "VN",
      availableLanguage: ["vi"],
    },
  });
}

export function articleJsonLd({
  title,
  description,
  path,
  image,
  datePublished,
  dateModified,
  authorName,
}: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  authorName?: string | null;
}) {
  return removeEmpty({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image: image ? [absoluteUrl(image)] : undefined,
    datePublished,
    dateModified,
    author: authorName ? { "@type": "Person", name: authorName } : undefined,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/images/logo_arishrimp.jpg"),
      },
    },
    mainEntityOfPage: absoluteUrl(path),
  });
}

export function blogPostingJsonLd({
  title,
  description,
  path,
  image,
  datePublished,
  dateModified,
  authorName,
}: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  authorName?: string | null;
}) {
  return removeEmpty({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    image: image ? [absoluteUrl(image)] : undefined,
    datePublished,
    dateModified,
    author: authorName ? { "@type": "Person", name: authorName } : undefined,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/images/logo_arishrimp.jpg"),
      },
    },
    mainEntityOfPage: absoluteUrl(path),
  });
}

export function productJsonLd({
  name,
  description,
  path,
  images,
  sku,
  brand,
  category,
  price,
  inStock,
}: {
  name: string;
  description?: string | null;
  path: string;
  images?: string[];
  sku?: string | null;
  brand?: string | null;
  category?: string | null;
  price?: number | null;
  inStock?: boolean | null;
}) {
  return removeEmpty({
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: truncateText(description, 500),
    image: images?.filter(Boolean).map((image) => absoluteUrl(image)),
    sku,
    brand: brand ? { "@type": "Brand", name: brand } : undefined,
    category,
    url: absoluteUrl(path),
    offers:
      typeof price === "number" && price > 0
        ? {
            "@type": "Offer",
            price,
            priceCurrency: "VND",
            availability:
              inStock === false
                ? "https://schema.org/OutOfStock"
                : "https://schema.org/InStock",
            url: absoluteUrl(path),
          }
        : undefined,
  });
}
