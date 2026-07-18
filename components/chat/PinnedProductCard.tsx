"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Tag } from "lucide-react";
import { PinnedProductInfo } from "@/app/types/chat.types";

interface Props {
  product: PinnedProductInfo;
}

const getFullImageUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const origin = process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:8004";
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function PinnedProductCard({ product }: Props) {
  const imageUrl = product.imageUrl || product.thumbnailUrl;

  return (
    <Link
      href={`/san-pham/${product.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-2 mt-1 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-xl hover:border-blue-400 transition-colors shadow-sm max-w-xs"
    >
      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
        {imageUrl ? (
          <Image
            src={getFullImageUrl(imageUrl)!}
            alt={product.name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium mb-0.5">
          <Tag className="w-3 h-3" />
          <span>Sản phẩm được ghim</span>
        </div>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 leading-tight">
          {product.name}
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Xem sản phẩm →</p>
      </div>
    </Link>
  );
}
