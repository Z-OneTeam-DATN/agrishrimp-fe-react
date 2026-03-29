"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ChevronRight,
    Minus,
    Plus,
    ShoppingCart,
    Phone,
    Loader2,
    PackageX,
    Tag,
    Globe,
    Layers,
} from "lucide-react";
import { toast } from "sonner";
import { PublicProductService } from "@/app/services/publicProduct.service";
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
import { ProductReviews } from "@/components/site/ProductReviews";
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
    const _ = outer.offsetWidth;
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
    const [activeTab, setActiveTab] = useState<"desc" | "specs" | "reviews">("desc");
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab === "reviews") setActiveTab("reviews");
        else if (tab === "specs") setActiveTab("specs");
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
                setActiveImage(
                    defaultVariant?.imageUrl ?? detail.imageUrls?.[0] ?? "/placeholder.svg"
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

    // 👉 LỌC RA NHỮNG BIẾN THỂ CÒN HÀNG VÀ CÓ LÔ HÀNG (Dùng useMemo để tối ưu)
    const availableVariants = useMemo(() => {
        if (!product?.variants) return [];
        return product.variants.filter(
            (v) => v.quantity && v.quantity > 0 && v.batches && v.batches.length > 0
        );
    }, [product]);

    const handleSelectVariant = (index: number) => {
        setSelectedVariantIndex(index);
        const v = availableVariants[index]; // Thay vì lấy từ product.variants, ta lấy từ availableVariants
        const img = v?.imageUrl ?? product?.imageUrls?.[0] ?? "/placeholder.svg";
        setActiveImage(img);
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
        } catch (error: any) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                toast.error("Vui lòng đăng nhập để mua hàng!");
                setTimeout(() => {
                    router.push("/login");
                }, 1500);
            } else {
                toast.error(error.response?.data?.message || "Không thể thêm vào giỏ hàng");
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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT COLUMN */}
                    <div className="lg:col-span-9 space-y-6">
                        {/* Main card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                {/* Gallery */}
                                <div className="md:col-span-5 space-y-4">
                                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-white border border-slate-100 group cursor-zoom-in">
                                        {isCompletelyOutOfStock && (
                                            <div className="absolute top-4 left-4 z-10 bg-gray-900/80 text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg backdrop-blur-sm">
                                                Hết hàng
                                            </div>
                                        )}
                                        <Image
                                            src={activeImage}
                                            alt={product.name}
                                            fill
                                            priority
                                            className={`object-contain p-8 transition-all duration-700 ease-out group-hover:scale-110 ${
                                                isCompletelyOutOfStock ? "opacity-40 grayscale" : ""
                                            }`}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = "/placeholder.svg";
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                                    </div>

                                    {product.imageUrls && product.imageUrls.length > 1 && (
                                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-0.5">
                                            {product.imageUrls.map((img, idx) => (
                                                <button
                                                    key={idx}
                                                    onMouseEnter={() => setActiveImage(img)}
                                                    onClick={() => setActiveImage(img)}
                                                    className={`relative w-20 h-20 shrink-0 rounded-xl border-2 transition-all duration-300 overflow-hidden shadow-sm ${
                                                        activeImage === img
                                                            ? "border-teal-500 ring-2 ring-teal-500/20 scale-95"
                                                            : "border-transparent hover:border-slate-300 grayscale-[0.5] hover:grayscale-0"
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
                                    )}
                                </div>

                                {/* Info */}
                                <div className="md:col-span-7 flex flex-col pt-2">
                                    {/* Brand + SKU */}
                                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                                        {currentVariant?.sku && (
                                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        SKU:{" "}
                                                <span className="text-teal-600 font-mono">
                          {currentVariant.sku}
                        </span>
                      </span>
                                        )}
                                    </div>

                                    <h1 className="text-xl font-bold text-slate-800 mb-1 leading-tight">
                                        {product.name}
                                    </h1>

                                    {/* Thương hiệu */}
                                    {product.brandName && (
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="text-xs text-slate-500">Thương hiệu:</span>
                                            <span className="text-xs font-bold text-teal-600 hover:underline cursor-pointer">
                        {product.brandName}
                      </span>
                                        </div>
                                    )}

                                    {/* Danh mục */}
                                    {product.category?.name && (
                                        <div className="flex items-center gap-1.5 mb-3">
                                            <span className="text-xs text-slate-500">Danh mục:</span>
                                            <Link
                                                href={`/category/${product.category.id}`}
                                                className="text-xs font-bold text-teal-600 hover:underline transition-colors"
                                            >
                                                {product.category.name}
                                            </Link>
                                        </div>
                                    )}

                                    {product.shortDesc && (
                                        <p className="text-sm text-slate-500 mb-4 font-medium leading-relaxed">
                                            {product.shortDesc}
                                        </p>
                                    )}

                                    {/* Price block */}
                                    <div className="bg-slate-50/80 p-4 rounded-xl mb-5">
                                        {currentVariant?.price > 0 ? (
                                            <div className="space-y-1">
                                                <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Giá bán
                          </span>
                                                    <div className="text-2xl font-extrabold text-red-600 tracking-tight">
                                                        {formatNumber(currentVariant.price)} ₫
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-lg font-semibold text-slate-400">
                        {isCompletelyOutOfStock ? "Tạm hết hàng" : "Liên hệ"}
                      </span>
                                        )}
                                    </div>

                                    {/* Variant selector - Chỉ map qua mảng availableVariants */}
                                    {availableVariants.length > 0 && (
                                        <div className="mb-6 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Chọn phân loại
                                                </label>
                                                <span className="text-[10px] font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                                                    {availableVariants.length} tùy chọn
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2.5">
                                                {availableVariants.map((v, idx) => {
                                                    const isSelected = selectedVariantIndex === idx;
                                                    return (
                                                        <button
                                                            key={v.id}
                                                            onClick={() => handleSelectVariant(idx)}
                                                            className={`group relative flex items-center px-4 py-2.5 border rounded-xl text-xs transition-all duration-300 ${
                                                                isSelected
                                                                    ? "border-teal-500 bg-teal-50 text-teal-700 shadow-sm ring-1 ring-teal-500 ring-offset-0"
                                                                    : "border-slate-200 bg-white hover:border-teal-400 text-slate-600 hover:shadow-sm"
                                                            }`}
                                                        >
                              <span className={`font-bold ${isSelected ? "text-teal-700" : "text-slate-700 group-hover:text-teal-600"}`}>
                                {getVariantLabel(v)}
                              </span>
                                                            {isSelected && (
                                                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-500 rounded-full flex items-center justify-center shadow-sm">
                                                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                                </div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quantity selector */}
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                            <button
                                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                                disabled={isCompletelyOutOfStock}
                                                className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 text-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Minus size={14} />
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
                                                className="w-12 text-center font-bold text-sm border-x border-slate-200 focus:outline-none bg-white disabled:bg-slate-50 disabled:text-slate-400"
                                            />
                                            <button
                                                onClick={() => setQuantity((q) => q + 1)}
                                                disabled={isCompletelyOutOfStock}
                                                className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 text-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase italic">
                      Giao hàng toàn quốc
                    </span>
                                    </div>

                                    {/* CTA buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={(e) => handleAddToCart(e, true)}
                                            disabled={isAdding || isCompletelyOutOfStock}
                                            className="flex-[2] bg-teal-600 hover:bg-teal-700 text-white py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-teal-100 flex items-center justify-center disabled:bg-slate-300 disabled:shadow-none disabled:active:scale-100 disabled:cursor-not-allowed"
                                        >
                                            {isAdding ? (
                                                <Loader2 className="animate-spin" size={16} />
                                            ) : (
                                                "Mua ngay"
                                            )}
                                        </button>
                                        <button
                                            onClick={(e) => handleAddToCart(e, false)}
                                            disabled={isAdding || isCompletelyOutOfStock}
                                            className="flex-1 border border-teal-600 text-teal-700 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-teal-50 transition-all flex items-center justify-center gap-2 disabled:border-slate-300 disabled:text-slate-400 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                        >
                                            {isAdding ? (
                                                <Loader2 className="animate-spin" size={16} />
                                            ) : (
                                                <>
                                                    <ShoppingCart size={15} /> Giỏ hàng
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description + Specs tabs */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="flex border-b border-slate-100">
                                <button
                                    onClick={() => setActiveTab("desc")}
                                    className={`flex-1 py-3.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
                                        activeTab === "desc"
                                            ? "text-teal-600 border-b-2 border-teal-600"
                                            : "text-slate-400 hover:text-slate-600"
                                    }`}
                                >
                                    Mô tả
                                </button>
                                <button
                                    onClick={() => setActiveTab("specs")}
                                    className={`flex-1 py-3.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
                                        activeTab === "specs"
                                            ? "text-teal-600 border-b-2 border-teal-600"
                                            : "text-slate-400 hover:text-slate-600"
                                    }`}
                                >
                                    Thông số
                                </button>
                                <button
                                    onClick={() => setActiveTab("reviews")}
                                    className={`flex-1 py-3.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
                                        activeTab === "reviews"
                                            ? "text-teal-600 border-b-2 border-teal-600"
                                            : "text-slate-400 hover:text-slate-600"
                                    }`}
                                >
                                    Đánh giá {product.reviewCount ? `(${product.reviewCount})` : ""}
                                </button>
                            </div>

                            <div className="p-6 text-slate-600 text-sm leading-relaxed">
                                {activeTab === "desc" && (
                                    <div
                                        className="prose prose-sm sm:prose-base max-w-none w-full break-words overflow-hidden whitespace-pre-wrap prose-emerald prose-img:rounded-xl prose-img:shadow-sm [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:p-3 [&_td]:border [&_td]:border-slate-200 [&_td]:p-3"
                                        dangerouslySetInnerHTML={{
                                            __html: product.description || "<p class='text-slate-400 italic'>Đang cập nhật mô tả...</p>"
                                        }}
                                    />
                                )}
                                {activeTab === "specs" && (
                                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-3">
                                        {product.brandName && (
                                            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/50">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Tag size={12} /> Thương hiệu
                        </span>
                                                <span className="font-bold">{product.brandName}</span>
                                            </div>
                                        )}
                                        {product.category?.name && (
                                            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/50">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Layers size={12} /> Danh mục
                        </span>
                                                <span className="font-bold">{product.category.name}</span>
                                            </div>
                                        )}
                                        {currentVariant && (
                                            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/50">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <ShoppingCart size={12} /> Quy cách
                        </span>
                                                <span className="font-bold">{getVariantLabel(currentVariant)}</span>
                                            </div>
                                        )}
                                        {product.origin && (
                                            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/50">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Globe size={12} /> Xuất xứ
                        </span>
                                                <span className="font-bold">{product.origin}</span>
                                            </div>
                                        )}
                                        {currentVariant?.sku && (
                                            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/50">
                                                <span className="text-slate-400">Mã SKU</span>
                                                <span className="font-mono font-bold text-teal-600">
                          {currentVariant.sku}
                        </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-400">Trạng thái</span>
                                            {isCompletelyOutOfStock ? (
                                                <span className="text-red-500 font-bold">Hết hàng</span>
                                            ) : (
                                                <span className="text-emerald-600 font-bold">
                          Còn hàng
                        </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {activeTab === "reviews" && (
                                    <ProductReviews productId={product.id} slug={slug} />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="lg:col-span-3 space-y-5 lg:sticky lg:top-6">
                        {/* Contact CTA */}
                        <div className="bg-teal-600 rounded-2xl p-6 text-white shadow-md text-center">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-white/30">
                                <Phone size={24} />
                            </div>
                            <h6 className="font-bold text-sm mb-1 uppercase tracking-wide">
                                Tư vấn miễn phí
                            </h6>
                            <p className="text-[10px] text-teal-50/80 font-medium mb-4">
                                Hỗ trợ kỹ thuật 24/7
                            </p>
                            <a
                                href="tel:18001234"
                                className="block w-full py-2.5 bg-white text-teal-600 rounded-lg font-bold text-xs uppercase tracking-widest transition-transform active:scale-95"
                            >
                                1800 1234
                            </a>
                        </div>

                        {/* Related products */}
                        {related.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                                <h6 className="font-bold text-slate-800 mb-4 text-[10px] uppercase tracking-widest border-b border-slate-50 pb-2">
                                    Gợi ý cho bạn
                                </h6>
                                <div className="space-y-4">
                                    {related.map((p) => (
                                        <RelatedProductCard key={p.id} product={p} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Danh mục hấp dẫn */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                            <h6 className="font-bold text-slate-800 mb-4 text-[10px] uppercase tracking-widest border-b border-slate-50 pb-2">
                                Danh mục hấp dẫn
                            </h6>
                            <div className="flex flex-wrap gap-2">
                                {categories.filter(c => c.parentId !== null).slice(0, 10).map(cat => (
                                    <Link
                                        key={cat.id}
                                        href={`/category/${cat.id}`}
                                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-medium text-slate-600 hover:border-teal-500 hover:text-teal-600 transition-all shadow-sm"
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Navigate back */}
                        <Link
                            href="/san-pham"
                            className="block text-center text-xs font-semibold text-teal-600 hover:underline"
                        >
                            ← Xem tất cả sản phẩm
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
