"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart,
  Layers,
  BadgeCheck,
  Loader2,
} from "lucide-react";

import { formatNumber } from "@/lib/utils";
import { PublicProductListItem } from "@/app/types/product.schema";
import { useState } from "react";
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
    cartTarget.classList.add("scale-125", "text-teal-500"); 
    setTimeout(() => cartTarget.classList.remove("scale-125", "text-teal-500"), 200);
  }, 800);
};

interface ProductCardProps {
  product: PublicProductListItem;
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="relative w-full pt-[90%] bg-gray-100"></div>
      <div className="flex flex-col flex-1 p-3.5 gap-2.5">
        <div className="flex gap-2">
          <div className="h-4 bg-gray-100 rounded-full w-16"></div>
          <div className="h-4 bg-gray-100 rounded-full w-12"></div>
        </div>
        <div className="h-5 bg-gray-100 rounded-lg w-full"></div>
        <div className="h-4 bg-gray-100 rounded-lg w-2/3"></div>
        <div className="mt-auto pt-2.5 border-t border-dashed border-gray-100 flex flex-col gap-2">
          <div className="h-6 bg-gray-100 rounded-lg w-24"></div>
          <div className="h-4 bg-gray-100 rounded-lg w-20"></div>
        </div>
      </div>
    </div>
  );
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { fetchCartCount } = useCartStore(); // ✅ Thay đổi ở đây
  const [isAdding, setIsAdding] = useState(false);

  if (!product) return null;

  const firstVariant = product.variants?.[0];
  const displayImage =
    firstVariant?.imageUrl ?? product.imageUrls?.[0] ?? "/placeholder.svg";

  const variantCount = product.variants?.length ?? 0;
  const hasAttributes = product.variants?.some(
    (v) => v.attributeValues && v.attributeValues.length > 0
  );
  const shortDescription = product.shortDesc || product.description;
  const soldCount = Number(product.soldCount ?? 0);

  const prices = product.variants?.map((v) => v.price).filter(Boolean) ?? [];
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
  const hasPriceRange =
    minPrice !== null && maxPrice !== null && minPrice !== maxPrice;

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
      fetchCartCount(); // ✅ Cập nhật lại số lượng ở Header bằng cách gọi API
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
      className="group relative flex flex-col h-full bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:border-teal-400 hover:shadow-xl hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative w-full pt-[90%] bg-gradient-to-br from-slate-50 via-teal-50/20 to-emerald-50/30 overflow-hidden">
        <Image
          src={displayImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-contain p-4 transition-transform duration-500 group-hover:scale-[1.06] ${
            product.isOutOfStock ? "opacity-50 grayscale" : ""
          }`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.isOutOfStock && (
            <span className="bg-gray-700/85 backdrop-blur-sm text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wide">
              Hết hàng
            </span>
          )}
        </div>

        {/* Cart hover button */}
        <button
          onClick={handleQuickAdd}
          disabled={isAdding}
          className="hidden md:flex absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full bg-teal-600 text-white items-center justify-center shadow-lg opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 z-10 active:scale-90 disabled:opacity-50"
        >
          {isAdding ? <Loader2 size={15} className="animate-spin" /> : <ShoppingCart size={15} />}
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3.5 gap-1.5">
        {/* Category + Brand */}
        <div className="flex items-center gap-1.5 flex-wrap min-h-[18px]">
          {product.categoryName && (
            <span className="inline-flex items-center text-[9px] uppercase font-bold tracking-widest text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
              {product.categoryName}
            </span>
          )}
          {product.brandName && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-gray-400">
              <BadgeCheck size={9} className="text-blue-400" />
              {product.brandName}
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="text-[13px] font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-teal-600 transition-colors min-h-[36px]">
          {product.name}
        </h3>

        {/* Short description */}
        {shortDescription && (
          <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed min-h-[32px]">
            {shortDescription}
          </p>
        )}

        {/* Variant info */}
        {variantCount > 1 ? (
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <Layers size={10} />
            <span>
              {variantCount} tùy chọn
            </span>
          </div>
        ) : firstVariant?.unit ? (
          <div className="text-[10px] text-gray-400">
            Đơn vị:{" "}
            <span className="font-medium text-gray-600">
              {firstVariant.unit}
            </span>
          </div>
        ) : null}

        {/* Price */}
        <div className="mt-auto pt-2.5 border-t border-dashed border-gray-100">
          {minPrice !== null ? (
            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="text-base font-extrabold text-orange-500">
                {hasPriceRange
                  ? `${formatNumber(minPrice!)} – ${formatNumber(maxPrice!)} ₫`
                  : `${formatNumber(minPrice!)} ₫`}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-400 italic block mb-1.5">Liên hệ</span>
          )}

          <div className="text-[10px] font-medium text-gray-500">
            {soldCount > 0 ? `Đã mua ${formatNumber(soldCount)}` : "Chưa có lượt mua"}
          </div>
        </div>
      </div>
    </Link>
  );
}

