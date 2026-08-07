"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    BadgeCheck,
    CheckCircle2,
    ChevronRight,
    FileCheck2,
    Gift,
    Headphones,
    Loader2,
    Minus,
    PackageX,
    PhoneCall,
    MessageCircle,
    Plus,
    RefreshCw,
    ShieldCheck,
    ShoppingBag,
    ShoppingCart,
    Sparkles,
    Star,
    Truck,
} from "lucide-react";
import { toast } from "sonner";
import { PublicProductService } from "@/app/services/publicProduct.service";
import { ReviewService } from "@/app/services/review.service";
import { cartService } from "@/app/services/cart.service";
import { voucherService, Voucher } from "@/app/services/voucher.service";
import { getPublicCategories } from "@/app/services/CategoryService";
import { CategoryDTO } from "@/app/types/category.type";
import { useCartStore } from "@/stores/useCartStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import {
    PublicProductDetail,
    PublicProductListItem,
    PublicProductVariant,
} from "@/app/types/product.schema";
import { formatNumber } from "@/lib/utils";
import { ProductReviews, ReviewFilterValue } from "@/components/site/ProductReviews";

const SERVICE_BADGES = [
    { icon: BadgeCheck, label: "Cam kết chính hãng" },
    { icon: Headphones, label: "Hỗ trợ kỹ thuật 24/7" },
    { icon: Truck, label: "Giao hàng toàn quốc" },
    { icon: FileCheck2, label: "Đã được cấp phép" },
    { icon: ShieldCheck, label: "An toàn với vật nuôi" },
    { icon: RefreshCw, label: "Hỗ trợ đổi trả hàng" },
];

const SAVED_VOUCHERS_KEY = "agrishrimp.savedVoucherCodes";

function getVariantLabel(variant?: PublicProductVariant | null): string {
    if (!variant) return "Tiêu chuẩn";
    if (variant.attributeValues && variant.attributeValues.length > 0) {
        return variant.attributeValues.map((av) => av.value).join(" / ");
    }
    return variant.unit || variant.sku || "Tiêu chuẩn";
}

function formatPrice(value?: number | null): string {
    if (!value || value <= 0) return "Liên hệ";
    return `${formatNumber(Math.round(value))} đ`;
}

function toVoucherNumber(value?: number | string | null): number {
    if (value === null || value === undefined || value === "") return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function isPublishedVoucher(voucher: Voucher): boolean {
    const now = Date.now();
    const startTime = voucher.startDate ? new Date(voucher.startDate).getTime() : 0;
    const endTime = voucher.endDate ? new Date(voucher.endDate).getTime() : Number.POSITIVE_INFINITY;
    const quantity = voucher.quantity === null || voucher.quantity === undefined
        ? Number.POSITIVE_INFINITY
        : toVoucherNumber(voucher.quantity);

    return voucher.status === "ACTIVE"
        && quantity > 0
        && startTime <= now
        && endTime >= now;
}

function getTopPublishedVouchers(vouchers: Voucher[]): Voucher[] {
    return vouchers
        .filter(isPublishedVoucher)
        .sort((left, right) => {
            const rightStart = right.startDate ? new Date(right.startDate).getTime() : 0;
            const leftStart = left.startDate ? new Date(left.startDate).getTime() : 0;
            if (rightStart !== leftStart) return rightStart - leftStart;
            return (right.id ?? 0) - (left.id ?? 0);
        })
        .slice(0, 3);
}

function mergeFrequentlyBoughtWithCategoryFallback(
    recommendedProducts: PublicProductListItem[],
    categoryProducts: PublicProductListItem[],
    currentProductSlug: string,
    limit = 6
): PublicProductListItem[] {
    const seen = new Set<string>();
    const merged: PublicProductListItem[] = [];

    const addProduct = (item: PublicProductListItem) => {
        const key = item.id ? `id:${item.id}` : `slug:${item.slug}`;
        if (item.slug === currentProductSlug || seen.has(key) || merged.length >= limit) return;

        seen.add(key);
        merged.push(item);
    };

    recommendedProducts.forEach(addProduct);
    categoryProducts.forEach(addProduct);

    return merged;
}

function getVoucherDisplayText(voucher: Voucher): string {
    const minOrderValue = toVoucherNumber(voucher.minOrderValue);
    const conditionText = minOrderValue > 0 ? ` - Đơn từ ${formatPrice(minOrderValue)}` : "";
    const titleText = voucher.title?.trim() || `Mã ${voucher.code}`;

    return `${titleText}${conditionText}`;
}

function normalizeVoucherCode(code?: string | null): string {
    return String(code || "").trim().toUpperCase();
}

function loadSavedVoucherCodes(): string[] {
    if (typeof window === "undefined") return [];

    try {
        const raw = window.localStorage.getItem(SAVED_VOUCHERS_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        return Array.isArray(parsed)
            ? parsed.map((code) => normalizeVoucherCode(String(code))).filter(Boolean)
            : [];
    } catch {
        return [];
    }
}

function persistSavedVoucherCodes(codes: string[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SAVED_VOUCHERS_KEY, JSON.stringify(codes));
}

function removeDescriptionOverflowStyles(html: string): string {
    return html
        .replace(/\sstyle=(["'])(.*?)\1/gi, (_match, quote: string, styleValue: string) => {
            const safeStyles = styleValue
                .split(";")
                .map((item) => item.trim())
                .filter(Boolean)
                .filter((item) => !/^(width|min-width|max-width|height|min-height|max-height|font-size|line-height|white-space|word-break|overflow|position|left|right|top|bottom)\s*:/i.test(item));

            return safeStyles.length > 0 ? ` style=${quote}${safeStyles.join("; ")}${quote}` : "";
        })
        .replace(/\s(width|height)=("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}

function extractVideoEmbedUrl(href: string): string | null {
    const youtubeMatch = href.match(
        /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
    );
    if (youtubeMatch) {
        return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    const vimeoMatch = href.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (vimeoMatch) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return null;
}

function embedVideoLinks(html: string): string {
    return html.replace(
        /<a\b[^>]*\shref=(["'])(.*?)\1[^>]*>[\s\S]*?<\/a>/gi,
        (match: string, _quote: string, href: string) => {
            const embedUrl = extractVideoEmbedUrl(href);
            if (!embedUrl) return match;

            return `<div style="position:relative;width:100%;padding-top:56.25%;margin:1rem 0;border-radius:0.75rem;overflow:hidden;background:#000;"><iframe src="${embedUrl}" title="Video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0;"></iframe></div>`;
        },
    );
}

function normalizeDescriptionHtml(description?: string): string {
    if (!description?.trim()) {
        return "<p class='text-slate-500'>Nội dung chi tiết đang được cập nhật.</p>";
    }

    let normalized = description.trim();

    if (!/<[a-z][\s\S]*>/i.test(normalized) && /&lt;[a-z!/]/i.test(normalized)) {
        normalized = normalized
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&");
    }

    if (!/<[a-z][\s\S]*>/i.test(normalized)) {
        return normalized
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\n/g, "<br />");
    }

    return embedVideoLinks(removeDescriptionOverflowStyles(normalized));
}

function animateFlyToCart(e: React.MouseEvent) {
    const cartTarget = document.getElementById("cart-icon-target");
    if (!cartTarget) return;

    const targetRect = cartTarget.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;

    const outer = document.createElement("div");
    outer.style.cssText = `position:fixed;left:${startX}px;top:${startY}px;z-index:9999;pointer-events:none;transition:transform 0.8s cubic-bezier(0.2,0.8,0.2,1)`;
    const inner = document.createElement("div");
    inner.style.cssText =
        "width:32px;height:32px;display:flex;align-items:center;justify-content:center;transition:transform 0.8s cubic-bezier(0.5,-0.5,1,1),opacity 0.8s ease-in";
    inner.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#1f5a98" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22v-10"/></svg>`;
    outer.appendChild(inner);
    document.body.appendChild(outer);
    void outer.offsetWidth;
    outer.style.transform = `translateX(${endX - startX - 16}px)`;
    inner.style.transform = `translateY(${endY - startY - 16}px) scale(0.5) rotate(360deg)`;
    inner.style.opacity = "0.2";

    setTimeout(() => {
        if (document.body.contains(outer)) document.body.removeChild(outer);
        cartTarget.classList.add("scale-125", "text-blue-700");
        setTimeout(() => cartTarget.classList.remove("scale-125", "text-blue-700"), 200);
    }, 800);
}

function RelatedProductCard({
    product,
    sourceProductId,
}: {
    product: PublicProductListItem;
    sourceProductId?: number;
}) {
    const [adding, setAdding] = useState(false);
    const firstVariantImg = (product.variants?.find((variant) => variant.imageUrl)?.imageUrl || "").split(",")[0]?.trim();
    const image =
        (firstVariantImg && firstVariantImg.length > 0 ? firstVariantImg : null) ??
        product.imageUrls?.[0] ??
        "/placeholder.svg";
    const firstVariant = product.variants?.find((variant) => (variant.quantity ?? 0) > 0) ?? product.variants?.[0];
    const price = firstVariant?.price;

    const trackRecommendationClick = () => {
        if (!sourceProductId || !product.id) return;
        void PublicProductService.trackRecommendationClick(sourceProductId, product.id).catch(() => undefined);
    };

    const handleAdd = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (!firstVariant?.id) {
            toast.error("Sản phẩm chưa có phân loại hợp lệ");
            return;
        }

        setAdding(true);
        try {
            await cartService.updateQuantity(firstVariant.id, 1);
            toast.success("Đã thêm sản phẩm mua kèm vào giỏ");
        } catch {
            toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng");
        } finally {
            setAdding(false);
        }
    };

    return (
        <article className="min-w-0 overflow-hidden border border-slate-200 bg-white">
            <Link href={`/san-pham/${product.slug}`} className="block" onClick={trackRecommendationClick}>
                <div className="relative aspect-square bg-sky-50">
                    <Image src={image} alt={product.name} fill className="object-contain p-2" />
                </div>
                <div className="space-y-1.5 p-2.5">
                    {(product.brandName || product.supplierName) && (
                        <p className="truncate text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            {product.brandName || product.supplierName}
                        </p>
                    )}
                    <h3 className="min-h-[34px] text-[12px] font-bold leading-snug text-slate-900 line-clamp-2">
                        {product.name}
                    </h3>
                </div>
            </Link>
            <div className="flex items-center justify-between gap-1.5 px-2.5 pb-2.5">
                <span className="min-w-0 truncate text-xs font-black text-blue-900">
                    {formatPrice(price)}
                </span>
                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={adding}
                    aria-label="Thêm vào giỏ"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-800 bg-white text-blue-800 transition-colors hover:bg-blue-800 hover:text-white disabled:opacity-50"
                >
                    {adding ? <Loader2 size={14} className="animate-spin" /> : <ShoppingBag size={14} />}
                </button>
            </div>
        </article>
    );
}

export default function ProductDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = React.use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { fetchCartCount } = useCartStore();

    const [product, setProduct] = useState<PublicProductDetail | null>(null);
    const [categories, setCategories] = useState<CategoryDTO[]>([]);
    const [related, setRelated] = useState<PublicProductListItem[]>([]);
    const [publishedVouchers, setPublishedVouchers] = useState<Voucher[]>([]);
    const [savedVoucherCodes, setSavedVoucherCodes] = useState<string[]>([]);
    const [breadcrumbHost, setBreadcrumbHost] = useState<HTMLElement | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
    const [activeImage, setActiveImage] = useState<string>("/placeholder.svg");
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);
    const [reviewCount, setReviewCount] = useState<number | null>(null);
    const [reviewAverage, setReviewAverage] = useState<number | null>(null);
    const [selectedReviewFilter, setSelectedReviewFilter] = useState<ReviewFilterValue>("all");
    const [pendingReviewScroll, setPendingReviewScroll] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [descriptionNeedsToggle, setDescriptionNeedsToggle] = useState(false);
    const descriptionContentRef = React.useRef<HTMLDivElement | null>(null);
    const reviewSectionRef = React.useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setBreadcrumbHost(document.getElementById("site-breadcrumb-slot"));
    }, []);

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab === "reviews") {
            setPendingReviewScroll(true);
        }
    }, [searchParams]);

    useEffect(() => {
        setSavedVoucherCodes(loadSavedVoucherCodes());
    }, []);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setNotFound(false);
            try {
                const detail = await PublicProductService.getBySlug(slug);
                const categoryId = detail.category?.id;
                const [recommendations, categoryFallback, cats, vouchers] = await Promise.all([
                    PublicProductService.getFrequentlyBoughtTogether(detail.id, 3).catch(() => []),
                    categoryId
                        ? PublicProductService.getList({ categoryId, size: 8 })
                            .then((response) => response.content ?? [])
                            .catch(() => [])
                        : Promise.resolve([]),
                    getPublicCategories(),
                    voucherService.getPublicVouchers().catch(() => [] as Voucher[]),
                ]);

                setProduct(detail);
                setCategories(cats);
                setPublishedVouchers(getTopPublishedVouchers(Array.isArray(vouchers) ? vouchers : []));

                const firstValidIdx = detail.variants?.findIndex(
                    (variant) => (variant.quantity ?? 0) > 0 && (variant.batches?.length ?? 0) > 0
                ) ?? 0;
                const defaultIdx = firstValidIdx >= 0 ? firstValidIdx : 0;
                setSelectedVariantIndex(defaultIdx);

                const galleryImages = Array.from(
                    new Set(
                        [
                            ...(detail.imageUrls ?? []),
                            ...((detail.variants ?? [])
                                .flatMap((variant) => (variant.imageUrl || "").split(","))
                                .filter((imageUrl): imageUrl is string => Boolean(imageUrl))),
                        ]
                            .map((imageUrl) => imageUrl.trim())
                            .filter(Boolean)
                    )
                );

                const defaultVariantImg = defaultVariant?.imageUrl
                    ? defaultVariant.imageUrl.split(",")[0]?.trim()
                    : null;
                setActiveImage(defaultVariantImg || galleryImages[0] || "/placeholder.svg");
                setRelated(
                    mergeFrequentlyBoughtWithCategoryFallback(
                        recommendations.map((item) => item.product),
                        categoryFallback,
                        slug,
                        3
                    )
                );
            } catch {
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [slug]);

    useEffect(() => {
        let isMounted = true;

        const loadReviewCount = async () => {
            if (!product?.id) {
                setReviewCount(null);
                setReviewAverage(null);
                return;
            }

            try {
                const reviews = await ReviewService.getReviewsByProduct(product.id);
                if (isMounted) {
                    setReviewCount(reviews.length);
                    setReviewAverage(
                        reviews.length > 0
                            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
                            : 0
                    );
                }
            } catch {
                if (isMounted) {
                    setReviewCount(null);
                    setReviewAverage(null);
                }
            }
        };

        loadReviewCount();

        return () => {
            isMounted = false;
        };
    }, [product?.id]);

    const availableVariants = useMemo(() => {
        if (!product?.variants) return [];
        return product.variants.filter(
            (variant) => (variant.quantity ?? 0) > 0 && (variant.batches?.length ?? 0) > 0
        );
    }, [product]);

    const productGalleryImages = useMemo(() => {
        const mergedImages = [
            ...(product?.imageUrls ?? []),
            ...((product?.variants ?? [])
                .flatMap((variant) => (variant.imageUrl || "").split(","))
                .filter((imageUrl): imageUrl is string => Boolean(imageUrl))),
        ];

        const uniqueImages = Array.from(
            new Set(mergedImages.map((imageUrl) => imageUrl.trim()).filter(Boolean))
        );

        return uniqueImages.length > 0 ? uniqueImages : ["/placeholder.svg"];
    }, [product]);

    const savedVoucherCodeSet = useMemo(
        () => new Set(savedVoucherCodes.map(normalizeVoucherCode)),
        [savedVoucherCodes]
    );

    useEffect(() => {
        if (!pendingReviewScroll) return;

        const timeoutId = window.setTimeout(() => {
            reviewSectionRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
            setPendingReviewScroll(false);
        }, 120);

        return () => window.clearTimeout(timeoutId);
    }, [pendingReviewScroll]);

    useEffect(() => {
        setSelectedReviewFilter("all");
        setIsDescriptionExpanded(false);
    }, [product?.id]);

    useEffect(() => {
        const element = descriptionContentRef.current;
        if (!element) {
            setDescriptionNeedsToggle(false);
            return;
        }

        const measureDescription = () => {
            setDescriptionNeedsToggle(element.scrollHeight > 430);
        };

        const frameId = window.requestAnimationFrame(measureDescription);
        const firstTimeoutId = window.setTimeout(measureDescription, 250);
        const secondTimeoutId = window.setTimeout(measureDescription, 900);

        window.addEventListener("resize", measureDescription);

        return () => {
            window.cancelAnimationFrame(frameId);
            window.clearTimeout(firstTimeoutId);
            window.clearTimeout(secondTimeoutId);
            window.removeEventListener("resize", measureDescription);
        };
    }, [product?.id, product?.description, product?.shortDesc]);

    const handleSelectVariant = (index: number) => {
        setSelectedVariantIndex(index);
        const variant = availableVariants[index];
        const variantImg = variant?.imageUrl ? variant.imageUrl.split(",")[0]?.trim() : null;
        const image = variantImg || productGalleryImages[0] || "/placeholder.svg";
        setActiveImage(image);
    };

    const openReviewsSection = (filter: ReviewFilterValue = "all") => {
        setSelectedReviewFilter(filter);
        setPendingReviewScroll(true);
    };

    const handleSaveVoucherToWallet = (code: string) => {
        const normalizedCode = normalizeVoucherCode(code);
        if (!normalizedCode) return;

        if (savedVoucherCodeSet.has(normalizedCode)) {
            toast.success("Voucher đã có trong ví");
            return;
        }

        const nextCodes = [...savedVoucherCodes, normalizedCode];
        setSavedVoucherCodes(nextCodes);
        persistSavedVoucherCodes(nextCodes);
        toast.success(`Đã lưu voucher ${normalizedCode} vào ví`);
    };

    const handleAddToCart = async (event: React.MouseEvent, buyNow: boolean) => {
        if (!product || availableVariants.length === 0) return;
        const variant = availableVariants[selectedVariantIndex];
        if (!variant?.id) {
            toast.error("Sản phẩm chưa có phân loại hợp lệ!");
            return;
        }

        setIsAdding(true);
        try {
            await cartService.updateQuantity(variant.id, quantity);
            fetchCartCount();
            if (buyNow) {
                router.push("/user/cart");
            } else {
                animateFlyToCart(event);
                toast.success("Đã thêm vào giỏ hàng!");
            }
        } catch (error: unknown) {
            const apiError = error as {
                response?: {
                    status?: number;
                    data?: { message?: string };
                };
            };

            if (apiError.response?.status === 401 || apiError.response?.status === 403) {
                toast.error("Vui lòng đăng nhập để mua hàng!");
                setTimeout(() => {
                    router.push("/login");
                }, 1500);
            } else {
                toast.error(apiError.response?.data?.message || "Không thể thêm vào giỏ hàng");
            }
        } finally {
            setIsAdding(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <Loader2 className="animate-spin text-blue-800" size={32} />
            </div>
        );
    }

    if (notFound || !product) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
                <PackageX size={64} className="text-gray-300" />
                <h2 className="text-lg font-bold text-gray-700">Sản phẩm không tồn tại</h2>
                <Link href="/san-pham" className="text-xs font-semibold text-blue-800 hover:underline">
                    Quay lại danh sách
                </Link>
            </div>
        );
    }

    const currentVariant = availableVariants[selectedVariantIndex];
    const isCompletelyOutOfStock = availableVariants.length === 0;
    const currentCategory = categories.find((category) => category.id === product.category?.id);
    const categoryId = product.category?.id ?? currentCategory?.id;
    const categoryName = product.category?.name || currentCategory?.name;
    const parentCategory = currentCategory?.parentId
        ? categories.find((category) => category.id === currentCategory.parentId)
        : null;
    const totalReviewCount = reviewCount ?? product.reviewCount ?? 0;
    const displayAverageRating = Number(reviewAverage ?? product.ratingAverage ?? 0);
    const soldCount = Number(product.soldCount ?? 0);
    const currentPrice = currentVariant?.price ?? 0;
    const descriptionHtml = normalizeDescriptionHtml(product.description || product.shortDesc);
    const thumbnailImages = productGalleryImages;
    const relatedProducts = related.slice(0, 3);
    const breadcrumbContent = (
        <div className="container mx-auto px-4 py-2.5">
            <nav className="flex min-w-0 items-center gap-1.5 overflow-hidden text-[11px] font-bold uppercase tracking-wide text-slate-400">
                {parentCategory && (
                    <Link href={`/san-pham?categoryId=${parentCategory.id}`} className="shrink-0 hover:text-blue-800">
                        {parentCategory.name}
                    </Link>
                )}
                {product.category?.name && (
                    <>
                        {parentCategory && <ChevronRight size={12} className="shrink-0" />}
                        <Link href={`/san-pham?categoryId=${product.category.id}`} className="shrink-0 hover:text-blue-800">
                            {product.category.name}
                        </Link>
                    </>
                )}
                {(parentCategory || product.category?.name) && <ChevronRight size={12} className="shrink-0" />}
                <span className="min-w-0 truncate text-slate-600">{product.name}</span>
            </nav>
        </div>
    );
    const breadcrumbBar = (
        <div className="border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
            {breadcrumbContent}
        </div>
    );

    return (
        <div className="min-h-screen overflow-x-hidden bg-[#f5f6f8] pb-20 font-sans text-slate-950">
            {breadcrumbHost
                ? createPortal(breadcrumbBar, breadcrumbHost)
                : (
                    <div className="sticky z-[49]" style={{ top: "var(--site-header-height, 96px)" }}>
                        {breadcrumbBar}
                    </div>
                )}

            <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 lg:py-8">
                <section className="grid min-w-0 gap-5 sm:gap-6 xl:grid-cols-[minmax(0,460px)_minmax(0,1fr)] xl:grid-rows-[auto_1fr] 2xl:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
                    <div className="mx-auto w-full max-w-[560px] xl:col-start-1 xl:row-start-1 xl:mx-0 xl:max-w-none">
                        <div className="bg-white p-3 shadow-sm sm:p-4">
                            <div className="grid gap-3 sm:grid-cols-[76px_minmax(0,1fr)] sm:gap-4 lg:grid-cols-[72px_minmax(0,1fr)] 2xl:grid-cols-[84px_minmax(0,1fr)]">
                                <div className="order-2 flex gap-2.5 overflow-x-auto pb-1 sm:order-1 sm:flex-col sm:overflow-visible sm:pb-0">
                                    {thumbnailImages.map((image, index) => (
                                        <button
                                            key={`${image}-${index}`}
                                            type="button"
                                            onMouseEnter={() => setActiveImage(image)}
                                            onClick={() => setActiveImage(image)}
                                            className={`relative h-16 w-16 shrink-0 overflow-hidden border bg-white transition-all sm:h-[72px] sm:w-[72px] 2xl:h-20 2xl:w-20 ${
                                                activeImage === image
                                                    ? "border-blue-800 shadow-sm"
                                                    : "border-slate-200 hover:border-blue-400"
                                            }`}
                                        >
                                            <Image src={image} alt={`Ảnh sản phẩm ${index + 1}`} fill className="object-cover" />
                                        </button>
                                    ))}
                                </div>

                                <div className="relative order-1 aspect-square overflow-hidden border border-blue-200 bg-sky-50 sm:order-2">
                                    {isCompletelyOutOfStock && (
                                        <span className="absolute left-4 top-4 z-10 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-black text-white">
                                            Tạm hết hàng
                                        </span>
                                    )}
                                    <Image
                                        src={activeImage}
                                        alt={product.name}
                                        fill
                                        priority
                                        className={`object-contain p-4 transition-all duration-300 sm:p-5 ${
                                            isCompletelyOutOfStock ? "opacity-50 grayscale" : ""
                                        }`}
                                        onError={(event) => {
                                            (event.target as HTMLImageElement).src = "/placeholder.svg";
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <section className="min-w-0 bg-white p-4 shadow-sm sm:p-5 lg:p-6 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:p-7">
                        <div className="text-base font-medium leading-snug text-slate-950 sm:text-lg md:text-xl">
                            <span
                                className={`mb-1.5 mr-2 inline-flex translate-y-[-2px] rounded-md px-2.5 py-1 align-middle text-[11px] font-black sm:mb-0 sm:mr-3 sm:text-xs ${
                                    isCompletelyOutOfStock
                                        ? "bg-slate-100 text-slate-600"
                                        : "bg-blue-100 text-blue-900"
                                }`}
                            >
                                {isCompletelyOutOfStock ? "Tạm hết hàng" : "Đang mở bán"}
                            </span>
                            <h1 className="inline font-medium">
                                {product.name}
                            </h1>
                        </div>

                        <div className="mt-3 flex flex-nowrap items-center gap-x-3 overflow-x-auto whitespace-nowrap text-[11px] text-slate-500 [scrollbar-width:none] sm:mt-4 sm:gap-x-4 sm:text-xs [&::-webkit-scrollbar]:hidden">
                            <span className="shrink-0">
                                Mã SP: <span className="font-normal text-blue-900">{currentVariant?.sku || product.slug}</span>
                            </span>
                            {totalReviewCount > 0 && (
                                <button
                                    type="button"
                                    onClick={() => openReviewsSection("all")}
                                    className="flex shrink-0 items-center gap-2 transition-colors hover:text-blue-800"
                                >
                                    <span className="flex items-center gap-0.5 text-amber-400">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                size={14}
                                                className={star <= Math.round(displayAverageRating) ? "fill-current" : "fill-slate-100 text-slate-200"}
                                            />
                                        ))}
                                    </span>
                                    {displayAverageRating > 0 ? displayAverageRating.toFixed(1) : "0.0"} ({formatNumber(totalReviewCount)})
                                </button>
                            )}
                            {soldCount > 0 && (
                                <span className="shrink-0">
                                    Lượt bán: <strong className="text-blue-900">{formatNumber(soldCount)}</strong>
                                </span>
                            )}
                            {product.brandName && (
                                <span className="shrink-0">
                                    Thương hiệu: <strong className="text-blue-900">{product.brandName}</strong>
                                </span>
                            )}
                            {categoryName && (
                                <span className="shrink-0">
                                    Danh mục:{" "}
                                    {categoryId ? (
                                        <Link
                                            href={`/san-pham?categoryId=${categoryId}`}
                                            className="font-semibold uppercase text-blue-900 hover:underline"
                                        >
                                            {categoryName}
                                        </Link>
                                    ) : (
                                        <strong className="font-semibold uppercase text-blue-900">{categoryName}</strong>
                                    )}
                                </span>
                            )}
                        </div>

                        <div className="mt-4 bg-[#f7fbff] px-4 py-3 sm:mt-5 sm:px-6 sm:py-3.5">
                            <span className="block break-words text-2xl font-semibold tracking-normal text-blue-900 sm:text-3xl">
                                {currentPrice > 0 ? formatPrice(currentPrice) : isCompletelyOutOfStock ? "Tạm hết hàng" : "Liên hệ"}
                            </span>
                        </div>

                        <div className="mt-5 flex flex-col gap-4 sm:mt-6 md:flex-row md:items-start md:justify-between">
                            <div className="flex flex-wrap items-center gap-3">
                                <label className="text-xs font-medium text-slate-700">Số lượng:</label>
                                <div className="inline-flex h-8 w-[108px] overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                                    <button
                                        type="button"
                                        onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                                        disabled={isCompletelyOutOfStock}
                                        className="flex h-full w-8 items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                                    >
                                        <Minus size={14} strokeWidth={2} />
                                    </button>
                                    <input
                                        type="number"
                                        min={1}
                                        value={quantity}
                                        disabled={isCompletelyOutOfStock}
                                        onChange={(event) => {
                                            const value = parseInt(event.target.value);
                                            if (!isNaN(value) && value >= 1) setQuantity(value);
                                        }}
                                        onBlur={(event) => {
                                            const value = parseInt(event.target.value);
                                            if (isNaN(value) || value < 1) setQuantity(1);
                                        }}
                                        className="h-full w-11 border-x border-slate-200 text-center text-xs font-medium text-slate-950 focus:outline-none disabled:bg-slate-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setQuantity((value) => value + 1)}
                                        disabled={isCompletelyOutOfStock}
                                        className="flex h-full w-8 items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                                    >
                                        <Plus size={14} strokeWidth={2} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex w-full min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3 md:w-auto md:justify-end">
                                <label className="shrink-0 text-xs font-medium text-slate-700">Biến thể</label>
                                {availableVariants.length > 0 ? (
                                    <div className="flex w-full min-w-0 flex-wrap gap-2 sm:w-auto md:justify-end">
                                        {availableVariants.map((variant, index) => {
                                            const isSelected = selectedVariantIndex === index;

                                            return (
                                                <button
                                                    key={variant.id}
                                                    type="button"
                                                    onClick={() => handleSelectVariant(index)}
                                                    className={`relative inline-flex min-h-9 min-w-0 max-w-full items-center justify-center overflow-hidden rounded-full border px-3.5 text-xs font-medium transition-all sm:min-w-[112px] ${
                                                        isSelected
                                                            ? "border-blue-800 bg-blue-50 pr-8 text-blue-950 shadow-sm shadow-blue-100"
                                                            : "border-slate-200 bg-white text-slate-700 hover:border-blue-500 hover:text-blue-900"
                                                    }`}
                                                >
                                                    <span className="min-w-0 truncate">{getVariantLabel(variant)}</span>
                                                    {isSelected && (
                                                        <span className="absolute right-0 top-0 flex h-full w-7 items-center justify-center rounded-r-full bg-blue-800 text-white">
                                                            <CheckCircle2 size={13} strokeWidth={2.4} />
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <span className="inline-flex h-9 items-center rounded-full border border-slate-200 px-3.5 text-xs text-slate-400">
                                        Không có biến thể còn hàng
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:gap-2.5">
                            <button
                                type="button"
                                onClick={(event) => handleAddToCart(event, false)}
                                disabled={isAdding || isCompletelyOutOfStock}
                                className="flex h-10 min-w-0 items-center justify-center gap-2 rounded-full border-2 border-blue-800 bg-white px-3 text-xs font-bold text-blue-900 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                            >
                                {isAdding ? <Loader2 className="animate-spin" size={15} /> : <><ShoppingCart size={15} /> Thêm vào giỏ hàng</>}
                            </button>
                            <button
                                type="button"
                                onClick={(event) => handleAddToCart(event, true)}
                                disabled={isAdding || isCompletelyOutOfStock}
                                className="flex h-10 min-w-0 items-center justify-center rounded-full bg-blue-900 px-3 text-xs font-bold text-white transition-colors hover:bg-blue-950 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                {isAdding ? <Loader2 className="animate-spin" size={15} /> : "Mua ngay"}
                            </button>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-3 border border-slate-200 px-3 py-3 min-[480px]:grid-cols-3 sm:px-4 xl:gap-x-8">
                            {SERVICE_BADGES.map((item) => (
                                <div key={item.label} className="flex min-w-0 items-center gap-2 text-[11px] text-slate-900 sm:gap-3 sm:text-xs">
                                    <item.icon className="h-5 w-5 shrink-0 text-blue-500 sm:h-7 sm:w-7 2xl:h-8 2xl:w-8" strokeWidth={1.7} />
                                    <span className="min-w-0 leading-4">{item.label}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-5 grid grid-cols-1 min-[540px]:grid-cols-3 gap-2 sm:gap-2.5">
                            <button
                                type="button"
                                onClick={() => window.open("https://zalo.me/0395024181", "_blank")}
                                className="group flex h-11 sm:h-12 items-center justify-between border border-blue-100 bg-blue-50 px-2.5 py-1 rounded-xl transition-colors hover:border-blue-300 hover:bg-blue-100/70"
                            >
                                <span className="flex min-w-0 items-center gap-2">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-blue-100">
                                        <span className="relative flex h-5 w-5 items-center justify-center rounded bg-blue-600 text-[6.5px] font-black leading-none text-white">
                                            Zalo
                                            <span className="absolute -bottom-0.5 left-1 h-1.5 w-1.5 rotate-45 rounded-[1px] bg-blue-600" />
                                        </span>
                                    </span>
                                    <span className="min-w-0 text-left">
                                        <span className="block truncate text-[11px] sm:text-xs font-bold leading-none text-blue-900">Liên hệ Zalo</span>
                                        <span className="mt-0.5 block truncate text-[9px] text-slate-500 leading-none">Tư vấn viên</span>
                                    </span>
                                </span>
                                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-blue-800 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    const isAuthenticated = useAuthStore.getState().isAuthenticated;
                                    if (!isAuthenticated) {
                                        toast.error("Vui lòng đăng nhập để chat với chăm sóc khách hàng!");
                                        router.push(`/login?redirect=/san-pham/${slug}`);
                                        return;
                                    }
                                    if (product) {
                                        useChatStore.getState().setConsultProduct({
                                            id: product.id,
                                            name: product.name,
                                            price: currentVariant?.price || 0,
                                            imageUrl: currentVariant?.imageUrl || product.variants?.find((v) => v.imageUrl)?.imageUrl || product.imageUrls?.[0] || "",
                                            slug: slug,
                                        });
                                    }
                                    useChatStore.getState().openChat();
                                }}
                                className="group flex h-11 sm:h-12 items-center justify-between border border-blue-100 bg-blue-50 px-2.5 py-1 rounded-xl transition-colors hover:border-blue-300 hover:bg-blue-100/70"
                            >
                                <span className="flex min-w-0 items-center gap-2">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-blue-100">
                                        <span className="flex h-5 w-5 items-center justify-center rounded bg-teal-650 text-teal-600">
                                            <MessageCircle size={15} strokeWidth={2.5} />
                                        </span>
                                    </span>
                                    <span className="min-w-0 text-left">
                                        <span className="block truncate text-[11px] sm:text-xs font-bold leading-none text-blue-900">Chat trực tuyến</span>
                                        <span className="mt-0.5 block truncate text-[9px] text-slate-500 leading-none">Hỗ trợ CSKH</span>
                                    </span>
                                </span>
                                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-blue-800 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                            </button>

                            <button
                                type="button"
                                onClick={() => window.open("tel:0395024181", "_self")}
                                className="group flex h-11 sm:h-12 items-center justify-between border border-blue-100 bg-blue-50 px-2.5 py-1 rounded-xl transition-colors hover:border-blue-300 hover:bg-blue-100/70"
                            >
                                <span className="flex min-w-0 items-center gap-2">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-blue-100">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-red-500 text-red-600">
                                            <PhoneCall size={12} strokeWidth={2.5} />
                                        </span>
                                    </span>
                                    <span className="min-w-0 text-left">
                                        <span className="block truncate text-[11px] sm:text-xs font-bold leading-none text-blue-900">Gọi tư vấn</span>
                                        <span className="mt-0.5 block truncate text-[9px] text-slate-500 leading-none">0395.024.181</span>
                                    </span>
                                </span>
                                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-blue-800 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                            </button>
                        </div>

                        <div className="mt-5 overflow-hidden border border-amber-200 bg-amber-50">
                            <div className="flex items-center gap-2 border-b border-amber-100 px-3 py-3 text-xs font-black text-amber-700 sm:px-4">
                                <Sparkles size={18} />
                                Khuyến mại được áp dụng
                            </div>
                            <div className="space-y-3 bg-white/70 px-3 py-3 sm:px-4 sm:py-4">
                                {publishedVouchers.length > 0 ? (
                                    publishedVouchers.map((voucher) => {
                                        const normalizedCode = normalizeVoucherCode(voucher.code);
                                        const isSaved = savedVoucherCodeSet.has(normalizedCode);

                                        return (
                                            <div
                                                key={voucher.id ?? voucher.code}
                                                className="grid min-w-0 grid-cols-1 items-start gap-2 min-[460px]:grid-cols-[minmax(0,1fr)_auto] min-[460px]:items-center sm:gap-3"
                                            >
                                                <div className="flex min-w-0 items-center gap-2 text-[11px] text-slate-800 sm:gap-3 sm:text-xs">
                                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 sm:h-9 sm:w-9">
                                                        <Gift size={15} />
                                                    </span>
                                                    <span className="min-w-0 leading-5 sm:leading-6">
                                                        <span className="break-words">{getVoucherDisplayText(voucher)}</span>
                                                        <span className="ml-1.5 inline-flex max-w-[86px] align-middle rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-800 sm:ml-2 sm:max-w-none sm:px-2 sm:text-xs">
                                                            {voucher.code}
                                                        </span>
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveVoucherToWallet(voucher.code)}
                                                    disabled={isSaved}
                                                    className={`inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-full px-2.5 text-[10px] font-semibold transition-colors min-[420px]:px-3 sm:h-9 sm:gap-1.5 sm:px-4 sm:text-xs ${
                                                        isSaved
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : "border border-blue-200 bg-white text-blue-900 hover:border-blue-500 hover:bg-blue-50"
                                                    }`}
                                                >
                                                    {isSaved ? <CheckCircle2 size={13} /> : <Gift size={13} />}
                                                    {isSaved ? "Đã lưu vào ví" : "Lưu vào ví"}
                                                </button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                                            <Gift size={18} />
                                        </span>
                                        <span>Hiện chưa có voucher đang phát hành.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {relatedProducts.length > 0 && (
                        <section className="mx-auto w-full max-w-[560px] space-y-3 xl:col-start-1 xl:row-start-2 xl:mx-0 xl:max-w-none">
                            <h2 className="text-base font-black text-slate-950">Khách hàng thường mua kèm:</h2>
                            <div className="grid grid-cols-2 gap-2.5 min-[420px]:grid-cols-3">
                                {relatedProducts.map((item) => (
                                    <RelatedProductCard key={item.id} product={item} sourceProductId={product.id} />
                                ))}
                            </div>
                        </section>
                    )}
                </section>

                <section className="mt-5 bg-white p-3 shadow-sm sm:mt-8 sm:p-4 lg:p-6">
                    <h2 className="text-lg font-black text-slate-950">Mô tả sản phẩm</h2>
                    <p className="mt-1.5 text-xs text-slate-400">
                        Thông tin chi tiết và nội dung giới thiệu cho sản phẩm hiện tại.
                    </p>
                    <div className="relative mt-4">
                        <div
                            ref={descriptionContentRef}
                            className={`prose prose-sm max-w-none overflow-hidden break-words text-[12px] text-slate-700 prose-slate [overflow-wrap:anywhere] sm:text-[13px] prose-headings:mb-3 prose-headings:mt-5 prose-headings:text-blue-900 prose-h1:text-lg sm:prose-h1:text-xl prose-h2:text-base sm:prose-h2:text-lg prose-h3:text-sm sm:prose-h3:text-base prose-p:my-2.5 prose-p:leading-6 prose-li:leading-6 prose-a:break-words prose-img:mx-auto prose-img:h-auto prose-img:max-h-[420px] prose-img:max-w-full prose-img:rounded-lg prose-img:object-contain prose-img:shadow-sm prose-pre:max-w-full prose-pre:overflow-x-auto prose-table:block prose-table:max-w-full prose-table:overflow-x-auto prose-table:whitespace-normal prose-th:break-words prose-td:break-words ${
                                descriptionNeedsToggle && !isDescriptionExpanded ? "max-h-[430px]" : "max-h-none"
                            }`}
                            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                        />
                        {descriptionNeedsToggle && !isDescriptionExpanded && (
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/95 to-transparent" />
                        )}
                    </div>
                    {descriptionNeedsToggle && (
                        <div className="mt-4 flex justify-center">
                            <button
                                type="button"
                                onClick={() => setIsDescriptionExpanded((current) => !current)}
                                className="inline-flex h-9 items-center justify-center rounded-full border border-blue-200 bg-white px-5 text-xs font-bold text-blue-900 transition-colors hover:border-blue-500 hover:bg-blue-50"
                            >
                                {isDescriptionExpanded ? "Thu gọn" : "Xem thêm"}
                            </button>
                        </div>
                    )}
                </section>

                <section ref={reviewSectionRef} className="mt-5 bg-white p-3 shadow-sm sm:mt-8 sm:p-4 lg:p-6">
                    <h2 className="text-lg font-black text-slate-950">Đánh giá sản phẩm</h2>
                    <div className="mt-5 border-t border-slate-100 pt-5">
                        <ProductReviews
                            productId={product.id}
                            slug={slug}
                            activeFilter={selectedReviewFilter}
                            onFilterChange={setSelectedReviewFilter}
                        />
                    </div>
                </section>
            </main>
        </div>
    );
}
