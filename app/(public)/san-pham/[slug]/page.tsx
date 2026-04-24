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
        <span className="text-[10px] font-bold text-slate-700 line-clamp-2 mb-0.5 group-hover:text-teal-600 transition-colors leading-normal">
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
                <Loader2 className="animate-spin text-teal-600" size={32} />
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
                    className="text-teal-600 font-semibold hover:underline text-sm"
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

    return (
        <div className="bg-[#fcfcfc] min-h-screen pb-20 font-sans text-slate-900">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-slate-50">
                <div className="container mx-auto px-4 py-2.5">
                    <nav className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider flex-wrap">
                        <Link href="/" className="hover:text-teal-600 transition-colors">
                            Trang chủ
                        </Link>
                        {parentCategory && (
                            <>
                                <ChevronRight size={10} />
                                <Link
                                    href={`/category/${parentCategory.id}`}
                                    className="hover:text-teal-600 transition-colors"
                                >
                                    {parentCategory.name}
                                </Link>
                            </>
                        )}
                        {product.category?.name && (
                            <>
                                <ChevronRight size={10} />
                                <Link
                                    href={`/category/${product.category.id}`}
                                    className="hover:text-teal-600 transition-colors"
                                >
                                    {product.category.name}
                                </Link>
                            </>
                        )}
                        <ChevronRight size={10} />
                        <span className="text-slate-600 line-clamp-1 max-w-[200px]">
              {product.name}
            </span>
                    </nav>
                </div>
            </div>

            <div className="container mx-auto px-4 mt-6">
                <div className="border-b border-slate-200 pb-10">
                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,430px)] lg:gap-12">
                        <div className="space-y-6">
                            <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#f4f7f5]">
                                {isCompletelyOutOfStock && (
                                    <div className="absolute left-5 top-5 z-10 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
                                        Hết hàng
                                    </div>
                                )}
                                <Image
                                    src={activeImage}
                                    alt={product.name}
                                    fill
                                    priority
                                    className={`object-contain p-6 transition-all duration-500 ${
                                        isCompletelyOutOfStock ? "opacity-45 grayscale" : ""
                                    }`}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                                    }}
                                />
                            </div>

                            {productGalleryImages.length > 1 && (
                                <div className="relative px-10">
                                    {hasThumbnailOverflow && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => scrollThumbnailStrip("left")}
                                                disabled={!canScrollThumbnailsLeft}
                                                className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-teal-500 hover:text-teal-600 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                <ChevronLeft size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => scrollThumbnailStrip("right")}
                                                disabled={!canScrollThumbnailsRight}
                                                className="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-teal-500 hover:text-teal-600 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </>
                                    )}

                                    <div
                                        ref={thumbnailStripRef}
                                        className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-2"
                                    >
                                        {productGalleryImages.map((img, idx) => (
                                            <button
                                                key={`${img}-${idx}`}
                                                onMouseEnter={() => setActiveImage(img)}
                                                onClick={() => setActiveImage(img)}
                                                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border transition-all ${
                                                    activeImage === img
                                                        ? "border-teal-500 bg-white"
                                                        : "border-slate-200 bg-white hover:border-slate-300"
                                                }`}
                                            >
                                                <Image
                                                    src={img}
                                                    alt={`ảnh ${idx + 1}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-3">
                                {product.brandName && (
                                    <div className="space-y-2">
                                        <span className="text-sm font-semibold text-slate-900">Thương hiệu</span>
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Tag size={16} className="text-orange-500" />
                                            <span>{product.brandName}</span>
                                        </div>
                                    </div>
                                )}
                                {product.origin && (
                                    <div className="space-y-2">
                                        <span className="text-sm font-semibold text-slate-900">Xuất xứ</span>
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Globe size={16} className="text-orange-500" />
                                            <span>{product.origin}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-900">Tình trạng</span>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Layers size={16} className="text-orange-500" />
                                        <span className={isCompletelyOutOfStock ? "text-red-500" : "text-emerald-600"}>
                                            {isCompletelyOutOfStock ? "Tạm hết hàng" : "Còn hàng"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 lg:sticky lg:top-6">
                            <div className="flex flex-wrap items-center gap-3">
                                <span
                                    className={`inline-flex rounded-lg px-4 py-1.5 text-sm font-semibold ${
                                        isCompletelyOutOfStock
                                            ? "bg-slate-200 text-slate-700"
                                            : "bg-orange-100 text-orange-700"
                                    }`}
                                >
                                    {isCompletelyOutOfStock ? "Tạm hết hàng" : "Đang mở bán"}
                                </span>
                                {currentVariant?.sku && (
                                    <span className="text-sm text-slate-500">
                                        Mã SP: <span className="font-medium text-slate-800">{currentVariant.sku}</span>
                                    </span>
                                )}
                            </div>

                            <div className="space-y-3">
                                <h1 className="text-3xl font-bold leading-tight text-slate-950">
                                    {product.name}
                                </h1>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                                    {product.brandName && <span>{product.brandName}</span>}
                                    {product.category?.name && (
                                        <Link
                                            href={`/category/${product.category.id}`}
                                            className="text-teal-700 transition-colors hover:text-teal-800"
                                        >
                                            {product.category.name}
                                        </Link>
                                    )}
                                </div>

                                {product.shortDesc && (
                                    <p className="max-w-xl text-base leading-7 text-slate-600">
                                        {product.shortDesc}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-sm">
                                {totalReviewCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => openReviewsSection("all")}
                                        className="inline-flex items-center gap-2 text-slate-700 transition-colors hover:text-orange-600"
                                    >
                                        <div className="flex items-center gap-0.5 text-orange-400">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    size={14}
                                                    className={
                                                        star <= Math.round(displayAverageRating)
                                                            ? "fill-current"
                                                            : "fill-slate-100 text-slate-200"
                                                    }
                                                />
                                            ))}
                                        </div>
                                        <span>
                                            {displayAverageRating > 0 ? displayAverageRating.toFixed(1) : "0.0"} ·{" "}
                                            {formatNumber(totalReviewCount)} đánh giá
                                        </span>
                                    </button>
                                )}
                                {soldCount > 0 && (
                                    <span className="text-slate-500">
                                        Đã mua <span className="font-semibold text-slate-900">{formatNumber(soldCount)}</span>
                                    </span>
                                )}
                                {hasSpecsContent && (
                                    <button
                                        type="button"
                                        onClick={openSpecsSection}
                                        className="font-medium text-blue-600 transition-colors hover:text-blue-700"
                                    >
                                        Thông số sản phẩm
                                    </button>
                                )}
                            </div>

                            <div className="rounded-xl border border-orange-100 bg-[#fffaf1] p-6">
                                {currentVariant?.price > 0 ? (
                                    <div className="space-y-1">
                                        <p className="text-sm text-slate-500">Giá bán</p>
                                        <div className="text-4xl font-bold tracking-tight text-slate-950">
                                            {formatNumber(currentVariant.price)} ₫
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-2xl font-semibold text-slate-400">
                                        {isCompletelyOutOfStock ? "Tạm hết hàng" : "Liên hệ"}
                                    </div>
                                )}

                                <div className="mt-4 rounded-lg border border-orange-200/70 bg-white px-4 py-3 text-sm text-slate-600">
                                    Giao hàng toàn quốc, hỗ trợ tư vấn miễn phí trong giờ làm việc.
                                </div>
                            </div>

                            {availableVariants.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-semibold text-slate-900">
                                            Phân loại
                                        </label>
                                        <span className="text-sm text-slate-500">
                                            {availableVariants.length} lựa chọn
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {availableVariants.map((v, idx) => {
                                            const isSelected = selectedVariantIndex === idx;
                                            return (
                                                <button
                                                    key={v.id}
                                                    onClick={() => handleSelectVariant(idx)}
                                                    className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                                                        isSelected
                                                            ? "border-red-300 bg-red-50 text-red-700"
                                                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                                                    }`}
                                                >
                                                    {getVariantLabel(v)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                                    <button
                                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                        disabled={isCompletelyOutOfStock}
                                        className="flex h-12 w-12 items-center justify-center text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <input
                                        type="number"
                                        min={1}
                                        value={quantity}
                                        disabled={isCompletelyOutOfStock}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            if (!isNaN(val) && val >= 1) setQuantity(val);
                                        }}
                                        onBlur={(e) => {
                                            const val = parseInt(e.target.value);
                                            if (isNaN(val) || val < 1) setQuantity(1);
                                        }}
                                        className="h-12 w-16 border-x border-slate-200 bg-white text-center text-base font-semibold focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                                    />
                                    <button
                                        onClick={() => setQuantity((q) => q + 1)}
                                        disabled={isCompletelyOutOfStock}
                                        className="flex h-12 w-12 items-center justify-center text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>

                                <div className="text-sm text-slate-500">
                                    {isCompletelyOutOfStock ? "Hiện chưa thể đặt mua" : "Có thể chọn số lượng phù hợp nhu cầu"}
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-[88px_minmax(0,1fr)_minmax(0,1fr)]">
                                <button
                                    onClick={(e) => handleAddToCart(e, false)}
                                    disabled={isAdding || isCompletelyOutOfStock}
                                    className="flex h-14 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition-all hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                                >
                                    {isAdding ? <Loader2 className="animate-spin" size={18} /> : <ShoppingCart size={18} />}
                                </button>
                                <button
                                    onClick={(e) => handleAddToCart(e, true)}
                                    disabled={isAdding || isCompletelyOutOfStock}
                                    className="flex h-14 items-center justify-center rounded-lg bg-[#d24335] px-6 text-base font-semibold text-white transition-all hover:bg-[#b93c2f] disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                    {isAdding ? <Loader2 className="animate-spin" size={18} /> : "Mua ngay"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => window.open("tel:18001234", "_self")}
                                    className="flex h-14 items-center justify-center gap-2 rounded-lg bg-slate-950 px-6 text-base font-semibold text-white transition-all hover:bg-slate-800"
                                >
                                    <Phone size={18} />
                                    Tư vấn
                                </button>
                            </div>

                            <div className="grid gap-3 border-t border-slate-200 pt-5 text-sm text-slate-600 sm:grid-cols-2">
                                <div className="flex items-center gap-2">
                                    <Phone size={16} className="text-teal-600" />
                                    <span>Hỗ trợ kỹ thuật trong giờ làm việc</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ShoppingCart size={16} className="text-teal-600" />
                                    <span>Đặt hàng trực tuyến nhanh gọn</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10 space-y-12">
                    <section className="space-y-5">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-950">Mô tả sản phẩm</h2>
                                <p className="mt-2 text-sm text-slate-500">
                                    Thông tin chi tiết và nội dung giới thiệu cho sản phẩm hiện tại.
                                </p>
                            </div>
                            {hasSpecsContent && (
                                <button
                                    type="button"
                                    onClick={openSpecsSection}
                                    className="rounded-lg border border-red-200 px-5 py-2 text-sm font-medium text-red-600 transition-colors hover:border-red-300 hover:bg-red-50"
                                >
                                    Xem tất cả thông số
                                </button>
                            )}
                        </div>

                        <div
                            className="prose prose-sm sm:prose-base max-w-none w-full break-words overflow-hidden whitespace-pre-wrap prose-emerald prose-img:rounded-xl prose-img:shadow-sm [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:p-3 [&_td]:border [&_td]:border-slate-200 [&_td]:p-3"
                            dangerouslySetInnerHTML={{
                                __html:
                                    product.description ||
                                    "<p class='text-slate-400 italic'>Đang cập nhật mô tả...</p>",
                            }}
                        />
                    </section>

                    {hasSpecsContent && (
                        <section ref={specsSectionRef} className="space-y-5 border-t border-slate-200 pt-10">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-950">Thông số sản phẩm</h2>
                                <p className="mt-2 text-sm text-slate-500">
                                    Các thông tin cơ bản đang có sẵn trong hệ thống.
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {product.brandName && (
                                    <div className="flex items-start justify-between gap-6 border-b border-slate-200 py-4 text-sm">
                                        <span className="flex items-center gap-2 text-slate-500">
                                            <Tag size={16} className="text-orange-500" />
                                            Thương hiệu
                                        </span>
                                        <span className="text-right font-semibold text-slate-900">{product.brandName}</span>
                                    </div>
                                )}
                                {product.category?.name && (
                                    <div className="flex items-start justify-between gap-6 border-b border-slate-200 py-4 text-sm">
                                        <span className="flex items-center gap-2 text-slate-500">
                                            <Layers size={16} className="text-orange-500" />
                                            Danh mục
                                        </span>
                                        <span className="text-right font-semibold text-slate-900">{product.category.name}</span>
                                    </div>
                                )}
                                {currentVariant && (
                                    <div className="flex items-start justify-between gap-6 border-b border-slate-200 py-4 text-sm">
                                        <span className="flex items-center gap-2 text-slate-500">
                                            <ShoppingCart size={16} className="text-orange-500" />
                                            Quy cách
                                        </span>
                                        <span className="text-right font-semibold text-slate-900">{getVariantLabel(currentVariant)}</span>
                                    </div>
                                )}
                                {product.origin && (
                                    <div className="flex items-start justify-between gap-6 border-b border-slate-200 py-4 text-sm">
                                        <span className="flex items-center gap-2 text-slate-500">
                                            <Globe size={16} className="text-orange-500" />
                                            Xuất xứ
                                        </span>
                                        <span className="text-right font-semibold text-slate-900">{product.origin}</span>
                                    </div>
                                )}
                                {currentVariant?.sku && (
                                    <div className="flex items-start justify-between gap-6 border-b border-slate-200 py-4 text-sm">
                                        <span className="text-slate-500">Mã SKU</span>
                                        <span className="text-right font-semibold text-slate-900">{currentVariant.sku}</span>
                                    </div>
                                )}
                                <div className="flex items-start justify-between gap-6 border-b border-slate-200 py-4 text-sm">
                                    <span className="text-slate-500">Tình trạng</span>
                                    <span className={`text-right font-semibold ${isCompletelyOutOfStock ? "text-red-500" : "text-emerald-600"}`}>
                                        {isCompletelyOutOfStock ? "Hết hàng" : "Còn hàng"}
                                    </span>
                                </div>
                            </div>
                        </section>
                    )}

                    <section ref={reviewSectionRef} className="border-t border-slate-200 pt-10">
                        <ProductReviews
                            productId={product.id}
                            slug={slug}
                            activeFilter={selectedReviewFilter}
                            onFilterChange={setSelectedReviewFilter}
                        />
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
                                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 transition-colors hover:border-teal-500 hover:text-teal-700"
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
                                        className="inline-flex text-sm font-semibold text-teal-700 hover:text-teal-800"
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
