"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  Loader2,
  Star,
} from "lucide-react";

import { formatNumber } from "@/lib/utils";
import { PublicProductListItem } from "@/app/types/product.schema";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/useCartStore";
import { cartService } from "@/app/services/cart.service";
import { toast } from "sonner";

// ✅ HÀM TẠO HIỆU ỨNG BAY VÀO GIỎ HÀNG (Dùng chung)
const animateFlyToCart = (e: React.MouseEvent) => {
  const cartTarget = document.getElementById("cart-icon-target");
  if (!cartTarget) return;

  const targetRect = cartTarget.getBoundingClientRect();
  const startX = e.clientX;
  const startY = e.clientY;
  const endX = targetRect.left + targetRect.width / 2;
  const endY = targetRect.top + targetRect.height / 2;

  const outer = document.createElement("div");
  outer.style.cssText = `position:fixed;left:${startX}px;top:${startY}px;z-index:9999;pointer-events:none;transition:transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)`;

  const inner = document.createElement("div");
  inner.style.cssText = "width:32px;height:32px;display:flex;align-items:center;justify-content:center;transition:transform 0.8s cubic-bezier(0.5, -0.5, 1, 1), opacity 0.8s ease-in";
  inner.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#0d9488" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22v-10"/>
    </svg>
  `;

  outer.appendChild(inner);
  document.body.appendChild(outer);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = outer.offsetWidth;

  outer.style.transform = `translateX(${endX - startX - 16}px)`;
  inner.style.transform = `translateY(${endY - startY - 16}px) scale(0.5) rotate(360deg)`; 
  inner.style.opacity = "0.2";

  setTimeout(() => {
    if (document.body.contains(outer)) document.body.removeChild(outer);
    cartTarget.classList.add("scale-125", "text-blue-500"); 
    setTimeout(() => cartTarget.classList.remove("scale-125", "text-blue-500"), 200);
  }, 800);
};

interface ProductCardProps {
  product: PublicProductListItem;
}

export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col border border-[#ececec] bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.04)] animate-pulse">
      <div className="relative mx-auto w-full max-w-[220px] bg-gray-100 pt-[84%]"></div>
      <div className="mt-3 flex flex-1 flex-col items-center text-center">
        <div className="h-5 w-28 rounded-full bg-gray-100" />
        <div className="mt-3 h-4 w-full rounded-lg bg-gray-100" />
        <div className="mt-2 h-4 w-5/6 rounded-lg bg-gray-100" />
        <div className="mt-4 h-8 w-32 rounded-lg bg-gray-100" />
        <div className="mt-auto w-full pt-5">
          <div className="flex items-center justify-between rounded-full border border-gray-100 px-4 py-2">
            <div className="h-4 w-24 rounded-lg bg-gray-100" />
            <div className="h-9 w-9 rounded-full bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { fetchCartCount } = useCartStore();
  const [isAdding, setIsAdding] = useState(false);

  if (!product) return null;

  const firstVariant = product.variants?.[0];
  
  // Extract all valid image URLs (split by comma if multiple URLs exist)
  const allImages: string[] = Array.from(
    new Set(
      (product.variants || [])
        .flatMap((v) => (v.imageUrl || "").split(","))
        .concat(product.imageUrls || [])
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s !== "/placeholder.svg")
    )
  );
  if (allImages.length === 0) allImages.push("/placeholder.svg");

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isHovered || allImages.length <= 1) {
      setCurrentImageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    }, 1800);

    return () => clearInterval(interval);
  }, [isHovered, allImages.length]);

  const brandLabel = product.brandName || product.supplierName || product.categoryName || "";

  const prices = product.variants?.map((v) => v.price).filter(Boolean) ?? [];
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
  const hasPriceRange =
    minPrice !== null && maxPrice !== null && minPrice !== maxPrice;
  const ratingAverage = Number(product.ratingAverage ?? 0);
  const reviewCount = Number(product.reviewCount ?? 0);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!firstVariant) {
      toast.error("Sản phẩm không có phân loại!");
      return;
    }

    setIsAdding(true);
    try {
      await cartService.updateQuantity(firstVariant.id, 1);
      fetchCartCount();
      animateFlyToCart(e);
      toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
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

  return (
    <Link
      href={`/san-pham/${product.slug}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex h-full flex-col border border-[#ececec] bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#d9e4d9] hover:shadow-[0_16px_34px_rgba(15,23,42,0.1)]"
    >
      <div className="relative mx-auto w-full max-w-[220px] overflow-hidden bg-white pt-[84%]">
        {allImages.map((imgUrl, idx) => (
          <Image
            key={`card-img-${idx}`}
            src={imgUrl || "/placeholder.svg"}
            alt={product.name}
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
            className={`object-contain p-0 transition-opacity duration-700 ease-in-out group-hover:scale-[1.04] ${
              idx === currentImageIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            } ${product.isOutOfStock ? "opacity-50 grayscale" : ""}`}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
        ))}

        {allImages.length > 1 && isHovered && (
          <div className="absolute bottom-1 left-0 right-0 z-10 flex justify-center gap-1 transition-opacity duration-300">
            {allImages.map((_, idx) => (
              <span
                key={`dot-${idx}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentImageIndex ? "w-3 bg-[#1965a2]" : "w-1.5 bg-slate-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-1 flex-col items-center text-center">
        {brandLabel ? (
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#a5a5a5]">
            {brandLabel}
          </p>
        ) : (
          <div className="h-[19px]" />
        )}

        <h3
          title={product.name}
          className="mt-2 min-h-[36px] w-full overflow-hidden text-[14px] font-medium leading-[1.25] text-[#171717] line-clamp-2 transition-colors group-hover:text-[#1965a2]"
        >
          {product.name}
        </h3>

        <div className="mt-2">
          {minPrice !== null ? (
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-[18px] font-semibold text-[#3f3f3f]">
                {hasPriceRange
                  ? `${formatNumber(minPrice!)}đ - ${formatNumber(maxPrice!)}đ`
                  : `${formatNumber(minPrice!)}đ`}
              </span>
            </div>
          ) : (
            <span className="block text-sm italic text-gray-400">Liên hệ</span>
          )}
        </div>

        <div className="mt-1 flex items-center justify-center gap-1">
          {Array.from({ length: 5 }).map((_, index) => {
            const starNumber = index + 1;
            const isActive = ratingAverage > 0 ? starNumber <= Math.round(ratingAverage) : true;

            return (
              <Star
                key={starNumber}
                size={12}
                className={isActive ? "fill-[#f5b301] text-[#f5b301]" : "fill-transparent text-[#d6d6d6]"}
                strokeWidth={1.8}
              />
            );
          })}
          <span className="ml-1 text-[11px] font-medium text-[#8a8a8a]">
            ({formatNumber(reviewCount)})
          </span>
        </div>

        <div className="mt-2 w-full pt-0">
          <div className="flex items-center justify-between gap-3 rounded-full border border-transparent px-3 py-1.5 transition-colors duration-300 group-hover:border-[#4c72b7]">
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={isAdding || !firstVariant || product.isOutOfStock}
              className="min-w-0 flex-1 whitespace-nowrap text-left text-[11px] font-semibold uppercase tracking-[0.02em] text-[#111111] transition-colors hover:text-[#1965a2] disabled:cursor-not-allowed disabled:text-gray-400"
            >
              {isAdding ? "ĐANG THÊM..." : "THÊM VÀO GIỎ"}
            </button>

            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={isAdding || !firstVariant || product.isOutOfStock}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4c72b7] text-white shadow-[0_8px_18px_rgba(76,114,183,0.18)] transition-all hover:bg-[#3f63a4] active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-300"
              aria-label={`Thêm ${product.name} vào giỏ`}
            >
              {isAdding ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ShoppingBag size={14} strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}


