'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Star, StarHalf, Flame, Award, Truck } from 'lucide-react';

interface ProductCardProps {
  id: string | number;
  name: string;
  price: string;
  oldPrice?: string;
  image: string;
  category: string;
  rating?: number;
  reviewCount?: number;
  sold?: number;
  tag?: 'HOT' | 'NEW' | 'BEST' | null;
}

export default function ProductCard({
  id,
  name,
  price,
  oldPrice,
  image,
  category,
  rating = 5,
  reviewCount = 0,
  sold,
  tag
}: ProductCardProps) {

  // Logic màu sắc cho Tag
  const getTagColor = (type: string) => {
    switch (type) {
      case 'HOT': return 'bg-gradient-to-br from-orange-500 to-red-600';
      case 'NEW': return 'bg-gradient-to-br from-sky-400 to-blue-600';
      case 'BEST': return 'bg-gradient-to-br from-red-500 to-rose-700';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="group relative flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:border-teal-600 hover:shadow-lg hover:-translate-y-1 cursor-pointer">

      {/* 1. TAG BADGE */}
      {tag && (
        <div className={`absolute top-0 left-0 px-3 py-1 text-[10px] font-extrabold text-white rounded-br-xl z-20 shadow-md flex items-center ${getTagColor(tag)}`}>
          {tag === 'HOT' && <Flame size={12} className="mr-1" />}
          {tag === 'BEST' && <Award size={12} className="mr-1" />}
          {tag === 'BEST' ? 'TOP 1' : tag}
        </div>
      )}

      {/* 2. IMAGE SECTION */}
      <Link href={`/product/${id}`} className="relative block w-full pt-[100%] overflow-hidden bg-gray-50">
        <Image
          src={image}
          alt={name}
          fill
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
        />
        {/* Nút thêm nhanh vào giỏ */}
        <button className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-lg opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-teal-700 z-10">
          <ShoppingCart size={16} />
        </button>
      </Link>

      {/* 3. BODY SECTION */}
      <div className="flex flex-col flex-1 p-3">
        <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wide">{category}</div>

        <Link href={`/product/${id}`} className="mb-1 block">
          <h3 className="text-[14px] font-medium text-gray-800 leading-snug line-clamp-2 group-hover:text-teal-600 transition-colors h-[40px]" title={name}>
            {name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-0.5 text-yellow-400 mb-2 text-[10px]">
          {[...Array(5)].map((_, i) => (
             i < Math.floor(rating) ? <Star key={i} size={10} fill="currentColor" /> : <StarHalf key={i} size={10} fill="currentColor" />
          ))}
          <span className="text-gray-400 ml-1">({reviewCount})</span>
        </div>

        {/* Price & Action */}
        <div className="mt-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-bold text-orange-600">{price}</span>
            {oldPrice && <span className="text-xs text-gray-400 line-through">{oldPrice}</span>}
          </div>

          {/* Nếu có 'sold' thì hiện thanh tiến trình, nếu không thì hiện Giao hàng 2H */}
          {sold ? (
            <div className="relative w-full h-4 bg-orange-100 rounded-full overflow-hidden mt-1">
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 to-orange-600 w-[70%] rounded-full"></div>
              <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white uppercase drop-shadow-md z-10">
                <Flame size={10} className="mr-1 fill-white" /> Đã bán {sold}
              </div>
            </div>
          ) : (
             <div className="border-t border-dashed pt-2 mt-1">
                <div className="flex items-center gap-1 text-[10px] text-green-600 font-semibold italic">
                    <Truck size={12} /> Giao siêu tốc 2H
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}