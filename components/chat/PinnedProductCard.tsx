"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Tag } from "lucide-react";
import { PinnedProductInfo } from "@/app/types/chat.types";

interface Props {
  product: PinnedProductInfo;
}

export default function PinnedProductCard({ product }: Props) {
  return (
    <Link
      href={`/san-pham/${product.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-1.5 p-3.5 mt-1 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-xl hover:border-blue-400 transition-colors shadow-sm max-w-xs"
    >
      <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
        <Tag className="w-3.5 h-3.5" />
        <span>Sản phẩm được ghim</span>
      </div>
      <p className="text-sm font-bold text-gray-800 dark:text-gray-100 line-clamp-2 leading-tight">
        {product.name}
      </p>
      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 font-semibold">Xem sản phẩm →</p>
    </Link>
  );
}

