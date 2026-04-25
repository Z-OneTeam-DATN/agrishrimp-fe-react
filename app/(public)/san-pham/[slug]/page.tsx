"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    ChevronRight,
    Minus,
    Plus,
    ShoppingCart,
    Phone,
    Loader2,
    PackageX,
    Star,
    Tag,
    Globe,
    Layers,
} from "lucide-react";
import { toast } from "sonner";
import { PublicProductService } from "@/app/services/publicProduct.service";
import { ReviewService } from "@/app/services/review.service";
import { cartService } from "@/app/services/cart.service";
import { getPublicCategories } from "@/app/services/CategoryService";
import { CategoryDTO } from "@/app/types/category.type";
import { useCartStore } from "@/stores/useCartStore";
import {
    PublicProductDetail,
    PublicProductListItem,
    PublicProductVariant,
} from "@/app/types/product.schema";
import { formatNumber } from "@/lib/utils";
import { ProductReviews, ReviewFilterValue } from "@/components/site/ProductReviews";
import { useSearchParams } from "next/navigation";

function getVariantLabel(variant: PublicProductVariant): string {
    if (variant.attributeValues && variant.attributeValues.length > 0) {
        return variant.attributeValues.map((av) => av.value).join(" / ");
    }
    return variant.unit || variant.sku;
}

function normalizeDescriptionHtml(description?: string): string {
    if (!description?.trim()) {
        return "<p class='text-slate-400 italic'>Đang cập nhật mô tả...</p>";
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

    return normalized;
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
    inner.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#0d9488" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22v-10"/></svg>`;
    outer.appendChild(inner);
    document.body.appendChild(outer);
    void outer.offsetWidth;
    outer.style.transform = `translateX(${endX - startX - 16}px)`;
    inner.style.transform = `translateY(${endY - startY - 16}px) scale(0.5) rotate(360deg)`;
    inner.style.opacity = "0.2";
    setTimeout(() => {
        if (document.body.contains(outer)) document.body.removeChild(outer);
        cartTarget.classList.add("scale-125", "text-teal-500");
        setTimeout(() => cartTarget.classList.remove("scale-125", "text-teal-500"), 200);
    }, 800);
}

function RelatedProductCard({ product }: { product: PublicProductListItem }) {
    const img =
        product.variants?.[0]?.imageUrl ??
        product.imageUrls?.[0] ??
        "/placeholder.svg";
    return (
        <Link
            href={`/san-pham/${product.slug}`}
            className="flex gap-3 group items-start"
        >
            <div className="w-12 h-12 relative rounded-lg bg-slate-50 overflow-hidden shrink-0 border border-slate-100 transition-transform group-hover:scale-105">
                <Image src={img} alt={product.name} fill className="object-cover" />
            </div>
            <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-bold text-slate-700 line-clamp-2 mb-0.5 group-hover:text-emerald-600 transition-colors leading-normal">
          {product.name}
        </span>
                {product.variants?.[0]?.price ? (
                    <span className="text-xs font-bold text-red-500">
                        {formatNumber(product.variants[0].price)} ₫
                    </span>
                ) : (
                    <span className="text-xs text-slate-400 italic">Liên hệ</span>
                )}
            </div>
        </Link>
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
    const [pendingSpecsScroll, setPendingSpecsScroll] = useState(false);
    const [canScrollThumbnailsLeft, setCanScrollThumbnailsLeft] = useState(false);
    const [canScrollThumbnailsRight, setCanScrollThumbnailsRight] = useState(false);
    const [hasThumbnailOverflow, setHasThumbnailOverflow] = useState(false);
    const thumbnailStripRef = React.useRef<HTMLDivElement | null>(null);
    const reviewSectionRef = React.useRef<HTMLDivElement | null>(null);
    const specsSectionRef = React.useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab === "reviews") {
            setPendingReviewScroll(true);
        }
        else if (tab === "specs") {
            setPendingSpecsScroll(true);
        }
    }, [searchParams]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setNotFound(false);
            try {
                const detail = await PublicProductService.getBySlug(slug);
                const [listResult, cats] = await Promise.all([
                    PublicProductService.getList({ categoryId: detail.category?.id, size: 6 }),
                    getPublicCategories(),
                ]);
                setProduct(detail);
                setCategories(cats);
                const firstValidIdx = detail.variants?.findIndex((v) => v.price > 0) ?? 0;
                const defaultIdx = firstValidIdx >= 0 ? firstValidIdx : 0;
                setSelectedVariantIndex(defaultIdx);
                const defaultVariant = detail.variants?.[defaultIdx];
                const galleryImages = Array.from(
                    new Set(
                        [
                            ...(detail.imageUrls ?? []),
                            ...((detail.variants ?? [])
                                .map((variant) => variant.imageUrl)
                                .filter((imageUrl): imageUrl is string => Boolean(imageUrl))),
                        ]
                            .map((imageUrl) => imageUrl.trim())
                            .filter(Boolean)
                    )
                );
                setActiveImage(
                    defaultVariant?.imageUrl ?? galleryImages[0] ?? "/placeholder.svg"
                );
                setRelated(
                    (listResult?.content ?? []).filter((p) => p.slug !== slug).slice(0, 5)
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

    // 👉 LỌC RA NHỮNG BIẾN THỂ CÒN HÀNG VÀ CÓ LÔ HÀNG (Dùng useMemo để tối ưu)
    const availableVariants = useMemo(() => {
        if (!product?.variants) return [];
        return product.variants.filter(
            (v) => v.quantity && v.quantity > 0 && v.batches && v.batches.length > 0
        );
    }, [product]);

    const productGalleryImages = useMemo(() => {
        const mergedImages = [
            ...(product?.imageUrls ?? []),
            ...((product?.variants ?? [])
                .map((variant) => variant.imageUrl)
                .filter((imageUrl): imageUrl is string => Boolean(imageUrl))),
        ];

        const uniqueImages = Array.from(
            new Set(mergedImages.map((imageUrl) => imageUrl.trim()).filter(Boolean))
        );

        return uniqueImages.length > 0 ? uniqueImages : ["/placeholder.svg"];
    }, [product]);

    useEffect(() => {
        const updateThumbnailScrollState = () => {
            const container = thumbnailStripRef.current;
            if (!container) {
                setHasThumbnailOverflow(false);
                setCanScrollThumbnailsLeft(false);
                setCanScrollThumbnailsRight(false);
                return;
            }

            const overflow = container.scrollWidth > container.clientWidth + 8;
            setHasThumbnailOverflow(overflow);
            setCanScrollThumbnailsLeft(container.scrollLeft > 8);
            setCanScrollThumbnailsRight(
                container.scrollLeft + container.clientWidth < container.scrollWidth - 8
            );
        };

        updateThumbnailScrollState();

        const container = thumbnailStripRef.current;
        container?.addEventListener("scroll", updateThumbnailScrollState);
        window.addEventListener("resize", updateThumbnailScrollState);

        return () => {
            container?.removeEventListener("scroll", updateThumbnailScrollState);
            window.removeEventListener("resize", updateThumbnailScrollState);
        };
    }, [productGalleryImages.length, activeImage]);

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
    }, [pendingReviewScroll, selectedReviewFilter]);

    useEffect(() => {
        if (!pendingSpecsScroll) return;

        const timeoutId = window.setTimeout(() => {
            specsSectionRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
            setPendingSpecsScroll(false);
        }, 120);

        return () => window.clearTimeout(timeoutId);
    }, [pendingSpecsScroll]);

    useEffect(() => {
        setSelectedReviewFilter("all");
    }, [product?.id]);

    const handleSelectVariant = (index: number) => {
        setSelectedVariantIndex(index);
        const v = availableVariants[index]; // Thay vì lấy từ product.variants, ta lấy từ availableVariants
        const img = v?.imageUrl ?? productGalleryImages[0] ?? "/placeholder.svg";
        setActiveImage(img);
    };

    const scrollThumbnailStrip = (direction: "left" | "right") => {
        const container = thumbnailStripRef.current;
        if (!container) return;

        const step = Math.max(container.clientWidth * 0.75, 180);
        container.scrollBy({
            left: direction === "left" ? -step : step,
            behavior: "smooth",
        });
    };

    const openReviewsSection = (filter: ReviewFilterValue = "all") => {
        setSelectedReviewFilter(filter);
        setPendingReviewScroll(true);
    };

    const openSpecsSection = () => {
        setPendingSpecsScroll(true);
    };

    const handleAddToCart = async (e: React.MouseEvent, buyNow: boolean) => {
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
                animateFlyToCart(e);
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
                <Loader2 className="animate-spin text-emerald-600" size={32} />
            </div>
        );
    }

    if (notFound || !product) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <PackageX size={64} className="text-gray-300" />
                <h2 className="text-xl font-bold text-gray-700">
                    Sản phẩm không tồn tại
                </h2>
                <Link
                    href="/san-pham"
                    className="text-emerald-600 font-semibold hover:underline text-sm"
                >
                    ← Quay lại danh sách
                </Link>
            </div>
        );
    }

    // Biến thể hiện tại dựa trên danh sách đã lọc
    const currentVariant = availableVariants[selectedVariantIndex];

    // Logic kiểm tra hết hàng tổng (Tất cả biến thể đều không có hàng)
    const isCompletelyOutOfStock = availableVariants.length === 0;

    const currentCategory = categories.find((c) => c.id === product.category?.id);
    const parentCategory = currentCategory?.parentId
        ? categories.find((c) => c.id === currentCategory.parentId)
        : null;
    const totalReviewCount = reviewCount ?? product.reviewCount ?? 0;
    const displayAverageRating = Number(reviewAverage ?? product.ratingAverage ?? 0);
    const soldCount = Number(product.soldCount ?? 0);
    const hasSpecsContent = Boolean(
        product.brandName || product.category?.name || currentVariant || product.origin
    );
    const relatedCategories = categories.filter((c) => c.parentId !== null);
    const visibleCategories = relatedCategories.slice(0, 7);
    const hasMoreCategories = relatedCategories.length > visibleCategories.length;
    const descriptionHtml = normalizeDescriptionHtml(product.description);

    return (
        <div className="bg-[#fcfcfc] min-h-screen pb-20 font-sans text-slate-900">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-slate-100">
                <div className="container mx-auto px-4 py-2.5">
                    <nav className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider flex-wrap">
                        <Link href="/" className="hover:text-emerald-600 transition-colors">
                            Trang chủ
                        </Link>
                        {parentCategory && (
                            <>
                                <ChevronRight size={10} />
                                <Link href={`/category/${parentCategory.id}`} className="hover:text-emerald-600 transition-colors">
                                    {parentCategory.name}
                                </Link>
                            </>
                        )}
                        {product.category?.name && (
                            <>
                                <ChevronRight size={10} />
                                <Link href={`/category/${product.category.id}`} className="hover:text-emerald-600 transition-colors">
                                    {product.category.name}
                                </Link>
                            </>
                        )}
                        <ChevronRight size={10} />
                        <span className="text-slate-600 line-clamp-1 max-w-[200px]">{product.name}</span>
                    </nav>
                </div>
            </div>

            <div className="container mx-auto px-4 mt-6">
                <div className="border-b border-slate-200 pb-10">
                    {/* Main grid: left = image+thumbs+specs, right = info */}
                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] lg:gap-10">

                        {/* ── LEFT COLUMN ── */}
                        <div className="space-y-4">
                            {/* Image + thumbnail — constrained width, centered */}
                            <div className="max-w-[420px] mx-auto space-y-3">
                                {/* Main image */}
                                <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#f5f8f6]">
                                    {isCompletelyOutOfStock && (
                                        <div className="absolute left-4 top-4 z-10 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">
                                            Hết hàng
                                        </div>
                                    )}
                                    <Image
                                        src={activeImage}
                                        alt={product.name}
                                        fill
                                        priority
                                        className={`object-contain p-6 transition-all duration-500 ${isCompletelyOutOfStock ? "opacity-45 grayscale" : ""}`}
                                        onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                                    />
                                </div>

                                {/* Thumbnail strip — centered under main image */}
                                {productGalleryImages.length > 1 && (
                                    <div className="relative">
                                        {hasThumbnailOverflow && (
                                            <>
                                                <button
                                                    type="button"
                                                    aria-label="Cuộn ảnh sang trái"
                                                    onClick={() => scrollThumbnailStrip("left")}
                                                    disabled={!canScrollThumbnailsLeft}
                                                    className="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-emerald-400 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    <ChevronLeft size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label="Cuộn ảnh sang phải"
                                                    onClick={() => scrollThumbnailStrip("right")}
                                                    disabled={!canScrollThumbnailsRight}
                                                    className="absolute right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-emerald-400 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    <ChevronRight size={14} />
                                                </button>
                                            </>
                                        )}
                                        <div
                                            ref={thumbnailStripRef}
                                            className={`flex gap-2.5 overflow-x-auto no-scrollbar scroll-smooth pb-1 ${hasThumbnailOverflow ? "px-10" : "justify-center"}`}
                                        >
                                            {productGalleryImages.map((img, idx) => (
                                                <button
                                                    key={`${img}-${idx}`}
                                                    type="button"
                                                    aria-label={`Xem ảnh ${idx + 1}`}
                                                    onMouseEnter={() => setActiveImage(img)}
                                                    onClick={() => setActiveImage(img)}
                                                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                                                        activeImage === img
                                                            ? "border-emerald-500 shadow-sm shadow-emerald-100"
                                                            : "border-slate-200 bg-white hover:border-emerald-300"
                                                    }`}
                                                >
                                                    <Image src={img} alt={`ảnh ${idx + 1}`} fill className="object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Specs section — below thumbnails */}
                            {hasSpecsContent && (
                                <section ref={specsSectionRef} className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4">
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900">Thông số sản phẩm</h2>
                                        <p className="mt-0.5 text-xs text-slate-400">Các thông tin ngắn gọn để xem nhanh ngay tại khu vực ảnh.</p>
                                    </div>
                                    <div className="grid gap-x-6 gap-y-4 grid-cols-2 sm:grid-cols-3">
                                        {product.brandName && (
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Thương hiệu</p>
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <Tag size={14} className="shrink-0 text-emerald-500" />
                                                    <span className="font-semibold text-slate-800">{product.brandName}</span>
                                                </div>
                                            </div>
                                        )}
                                        {product.origin && (
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Xuất xứ</p>
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <Globe size={14} className="shrink-0 text-emerald-500" />
                                                    <span className="font-semibold text-slate-800">{product.origin}</span>
                                                </div>
                                            </div>
                                        )}
                                        {product.category?.name && (
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Danh mục</p>
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <Layers size={14} className="shrink-0 text-emerald-500" />
                                                    <span className="font-semibold text-slate-800">{product.category.name}</span>
                                                </div>
                                            </div>
                                        )}
                                        {currentVariant && (
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Quy cách</p>
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <ShoppingCart size={14} className="shrink-0 text-emerald-500" />
                                                    <span className="font-semibold text-slate-800">{getVariantLabel(currentVariant)}</span>
                                                </div>
                                            </div>
                                        )}
                                        {currentVariant?.sku && (
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Mã SKU</p>
                                                <span className="text-sm font-semibold text-slate-800">{currentVariant.sku}</span>
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Tình trạng</p>
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <Layers size={14} className="shrink-0 text-emerald-500" />
                                                <span className={`font-semibold ${isCompletelyOutOfStock ? "text-red-500" : "text-emerald-600"}`}>
                                                    {isCompletelyOutOfStock ? "Tạm hết hàng" : "Còn hàng"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* ── RIGHT COLUMN ── */}
                        <div className="space-y-5 lg:sticky lg:top-6">
                            {/* Status + SKU */}
                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-bold tracking-wide ${
                                    isCompletelyOutOfStock ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-700"
                                }`}>
                                    {isCompletelyOutOfStock ? "Tạm hết hàng" : "Đang mở bán"}
                                </span>
                                {currentVariant?.sku && (
                                    <span className="text-sm text-slate-400">
                                        Mã SP: <span className="font-semibold text-slate-700">{currentVariant.sku}</span>
                                    </span>
                                )}
                            </div>

                            {/* Product name + brand/category */}
                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold leading-snug text-slate-950">{product.name}</h1>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                                    {product.brandName && <span className="font-medium">{product.brandName}</span>}
                                    {product.category?.name && (
                                        <Link href={`/category/${product.category.id}`}
                                            className="text-emerald-600 font-medium transition-colors hover:text-emerald-700">
                                            {product.category.name}
                                        </Link>
                                    )}
                                </div>
                                {product.shortDesc && (
                                    <p className="text-sm leading-6 text-slate-500">{product.shortDesc}</p>
                                )}
                            </div>

                            {/* Reviews + sold + specs link */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                                {totalReviewCount > 0 && (
                                    <button type="button" onClick={() => openReviewsSection("all")}
                                        className="inline-flex items-center gap-1.5 text-slate-600 transition-colors hover:text-emerald-600">
                                        <div className="flex items-center gap-0.5 text-amber-400">
                                            {[1,2,3,4,5].map((s) => (
                                                <Star key={s} size={13}
                                                    className={s <= Math.round(displayAverageRating) ? "fill-current" : "fill-slate-100 text-slate-200"} />
                                            ))}
                                        </div>
                                        <span>{displayAverageRating > 0 ? displayAverageRating.toFixed(1) : "0.0"} · {formatNumber(totalReviewCount)} đánh giá</span>
                                    </button>
                                )}
                                {soldCount > 0 && (
                                    <span className="text-slate-400">
                                        Đã mua <span className="font-semibold text-slate-700">{formatNumber(soldCount)}</span>
                                    </span>
                                )}
                                {hasSpecsContent && (
                                    <button type="button" onClick={openSpecsSection}
                                        className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700">
                                        Thông số sản phẩm
                                    </button>
                                )}
                            </div>

                            {/* Price box */}
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
                                {currentVariant?.price > 0 ? (
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Giá bán</p>
                                        <div className="text-4xl font-black tracking-tight text-slate-950">
                                            {formatNumber(currentVariant.price)}<span className="text-2xl ml-1">₫</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-xl font-semibold text-slate-400">
                                        {isCompletelyOutOfStock ? "Tạm hết hàng" : "Liên hệ"}
                                    </div>
                                )}
                                <div className="mt-3 rounded-xl border border-emerald-200/60 bg-white px-4 py-2.5 text-sm text-slate-500">
                                    Giao hàng toàn quốc, hỗ trợ tư vấn miễn phí trong giờ làm việc.
                                </div>
                            </div>

                            {/* Variant picker */}
                            {availableVariants.length > 0 && (
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-semibold text-slate-800">Phân loại</label>
                                        <span className="text-xs text-slate-400">{availableVariants.length} lựa chọn</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2.5">
                                        {availableVariants.map((v, idx) => {
                                            const isSelected = selectedVariantIndex === idx;
                                            return (
                                                <button key={v.id} onClick={() => handleSelectVariant(idx)}
                                                    className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                                                        isSelected
                                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100"
                                                            : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-600"
                                                    }`}>
                                                    {getVariantLabel(v)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Quantity */}
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                                    <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                        disabled={isCompletelyOutOfStock}
                                        className="flex h-11 w-11 items-center justify-center text-slate-500 transition-colors hover:bg-slate-50 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50">
                                        <Minus size={15} />
                                    </button>
                                    <input type="number" min={1} value={quantity} disabled={isCompletelyOutOfStock}
                                        onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1) setQuantity(v); }}
                                        onBlur={(e) => { const v = parseInt(e.target.value); if (isNaN(v) || v < 1) setQuantity(1); }}
                                        className="h-11 w-14 border-x border-slate-200 bg-white text-center text-sm font-bold focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                                    />
                                    <button onClick={() => setQuantity((q) => q + 1)}
                                        disabled={isCompletelyOutOfStock}
                                        className="flex h-11 w-11 items-center justify-center text-slate-500 transition-colors hover:bg-slate-50 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50">
                                        <Plus size={15} />
                                    </button>
                                </div>
                                <p className="text-sm text-slate-400">
                                    {isCompletelyOutOfStock ? "Hiện chưa thể đặt mua" : "Có thể chọn số lượng phù hợp nhu cầu"}
                                </p>
                            </div>

                            {/* Action buttons */}
                            <div className="space-y-2.5">
                                <div className="grid gap-2.5 sm:grid-cols-2">
                                    <button onClick={(e) => handleAddToCart(e, false)}
                                        disabled={isAdding || isCompletelyOutOfStock}
                                        className="flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl border-2 border-emerald-500 bg-white px-5 text-sm font-bold text-emerald-600 transition-all hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300">
                                        {isAdding ? <Loader2 className="animate-spin" size={17} /> : <><ShoppingCart size={17} /> Thêm vào giỏ</>}
                                    </button>
                                    <button onClick={(e) => handleAddToCart(e, true)}
                                        disabled={isAdding || isCompletelyOutOfStock}
                                        className="flex h-12 items-center justify-center whitespace-nowrap rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                                        {isAdding ? <Loader2 className="animate-spin" size={17} /> : "Mua ngay"}
                                    </button>
                                </div>
                                <button type="button" onClick={() => window.open("tel:18001234", "_self")}
                                    className="flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-slate-900 px-6 text-sm font-bold text-white transition-all hover:bg-slate-800">
                                    <Phone size={17} /> Tư vấn ngay
                                </button>
                            </div>

                            {/* Trust badges */}
                            <div className="flex flex-wrap gap-2.5 border-t border-slate-100 pt-4 text-[13px] text-slate-500">
                                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 whitespace-nowrap">
                                    <Phone size={14} className="text-emerald-600 shrink-0" />
                                    <span>Hỗ trợ kỹ thuật trong giờ làm việc</span>
                                </div>
                                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 whitespace-nowrap">
                                    <ShoppingCart size={14} className="text-emerald-600 shrink-0" />
                                    <span>Đặt hàng trực tuyến nhanh gọn</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10 space-y-6">
                    {/* Mô tả sản phẩm — card bo góc */}
                    <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h2 className="text-lg font-bold text-slate-900">Mô tả sản phẩm</h2>
                            <p className="mt-0.5 text-xs text-slate-400">Thông tin chi tiết và nội dung giới thiệu cho sản phẩm hiện tại.</p>
                        </div>
                        <div className="p-6">
                            <div
                                className="prose prose-sm sm:prose-base max-w-none w-full break-words overflow-hidden prose-emerald prose-img:rounded-xl prose-img:shadow-sm [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:p-3 [&_td]:border [&_td]:border-slate-200 [&_td]:p-3"
                                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                            />
                        </div>
                    </section>

                    {/* Đánh giá — card không bo góc */}
                    <section ref={reviewSectionRef} className="bg-white border border-slate-200">
                        <div className="px-6 py-5">
                            <ProductReviews
                                productId={product.id}
                                slug={slug}
                                activeFilter={selectedReviewFilter}
                                onFilterChange={setSelectedReviewFilter}
                            />
                        </div>
                    </section>

                    {(related.length > 0 || relatedCategories.length > 0) && (
                        <section className="grid gap-10 border-t border-slate-200 pt-10 lg:grid-cols-[minmax(0,1fr)_320px]">
                            {related.length > 0 && (
                                <div className="space-y-5">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-950">Gợi ý cho bạn</h2>
                                        <p className="mt-2 text-sm text-slate-500">
                                            Một số sản phẩm liên quan để bạn tham khảo thêm.
                                        </p>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                        {related.map((p) => (
                                            <RelatedProductCard key={p.id} product={p} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {visibleCategories.length > 0 && (
                                <div className="space-y-5">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-950">Danh mục liên quan</h2>
                                        <p className="mt-2 text-sm text-slate-500">
                                            Chọn nhanh nhóm sản phẩm gần với nhu cầu của bạn.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2.5">
                                        {visibleCategories.map((cat) => (
                                            <Link
                                                key={cat.id}
                                                href={`/category/${cat.id}`}
                                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition-colors hover:border-emerald-400 hover:text-emerald-700"
                                            >
                                                {cat.name}
                                            </Link>
                                        ))}
                                        {hasMoreCategories && (
                                            <span
                                                className="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500"
                                                title="Còn thêm danh mục"
                                            >
                                                {"<>"}
                                            </span>
                                        )}
                                    </div>
                                    <Link
                                        href="/san-pham"
                                        className="inline-flex text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                                    >
                                        Xem tất cả sản phẩm
                                    </Link>
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}
