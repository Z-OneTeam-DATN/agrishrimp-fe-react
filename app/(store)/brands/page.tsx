'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, LayoutGrid } from 'lucide-react';
import StoreBanner from '@/components/site/SiteBanner_Store';

const BRANDS = [
  { name: 'APA', logo: 'https://apanano.com/wp-content/uploads/logo-apa.png', count: 120 },
  { name: 'Bayer', logo: 'https://www.bayer.com/themes/custom/bayer_c_and_i/logo.svg', count: 85 },
  { name: 'CP Group', logo: 'https://www.cpvietnam.com/Templates/images/logo.png', count: 150 },
  { name: 'Thăng Long', logo: 'https://thanglonginst.com/wp-content/uploads/2021/05/logo-thang-long.png', count: 90 },
  { name: 'Grobest', logo: 'https://www.grobest.com/uploads/allimg/210512/1-210512102119.png', count: 110 },
  { name: 'Uni-President', logo: 'https://www.uni-president.com.vn/images/logo.png', count: 70 },
];

export default function BrandsPage() {
  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-12">
      <div className="container mx-auto px-4">
        <StoreBanner />

        <div className="py-2 mb-6 text-sm text-gray-500 flex items-center">
          <Link href="/" className="hover:text-[#329965] transition-colors">Trang chủ</Link>
          <ChevronRight size={16} className="mx-2" />
          <span className="text-[#329965] font-bold">Thương hiệu</span>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
           <h1 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-2">
              <LayoutGrid className="text-[#329965]" /> Đối tác & Thương hiệu
           </h1>

           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {BRANDS.map((brand, idx) => (
                <Link 
                  key={idx} 
                  href={`/store?brand=${brand.name.toLowerCase()}`}
                  className="group p-6 border border-gray-100 rounded-xl hover:border-[#329965] hover:shadow-md transition-all text-center"
                >
                   <div className="h-20 flex items-center justify-center mb-4">
                      {/* Logo placeholder */}
                      <div className="text-xl font-bold text-gray-400 group-hover:text-[#329965]">{brand.name}</div>
                   </div>
                   <div className="text-sm font-semibold text-gray-700">{brand.name}</div>
                   <div className="text-xs text-gray-400 mt-1">{brand.count} sản phẩm</div>
                </Link>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
