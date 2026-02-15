"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  StarHalf,
  Minus,
  Plus,
  ShoppingCart,
  CheckCircle2,
  Phone,
  ShieldCheck,
  Truck,
  ChevronRight,
  ThumbsUp,
} from "lucide-react";

// --- MOCK DATA: Lấy 1 sản phẩm từ trang chủ làm mẫu ---
const PRODUCT = {
  id: 1,
  name: "Vi sinh xử lý đáy ao APA MINER",
  price: 150000,
  oldPrice: 180000,
  brand: "APA NANO",
  images: [
    "https://apanano.com/wp-content/uploads/APA-MINER-POX_Shrimp.jpg",
    "https://www.biopharmachemie.com/uploads/images/product/Tom/Bio-hepatol%20plus(1)%20copy.jpg", // Ảnh giả lập thêm
    "https://tepbac.com/upload/images/2022/06/cho-ca-an_1656057019.jpg", // Ảnh giả lập thêm
  ],
  rating: 4.8,
  reviewCount: 13,
  sold: 1200,
  description:
    "APA MINER là giải pháp tối ưu cho bà con nuôi tôm công nghệ cao. Sản phẩm chứa các chủng vi sinh vật có lợi giúp phân hủy mùn bã hữu cơ, thức ăn dư thừa, làm sạch đáy ao nuôi tôm cá hiệu quả.",
  ingredients: [
    { name: "Bacillus subtilis", content: "1.0 x 10^9 CFU/g" },
    { name: "Saccharomyces cerevisiae", content: "1.0 x 10^9 CFU/g" },
    { name: "Amylase", content: "1.000 UI/g" },
    { name: "Chất đệm (Dextrose)", content: "vừa đủ 1kg" },
  ],
  usage:
    "Dùng 1kg cho 5.000m3 nước, định kỳ 7-10 ngày/lần. Hòa tan với nước rồi tạt đều khắp ao.",
};

// --- MOCK DATA: Sản phẩm gợi ý (Lấy từ Trending Products trang chủ) ---
const RELATED_PRODUCTS = [
  {
    id: 6,
    name: "Máy đo pH cầm tay Hanna",
    price: 1200000,
    image: "https://apanano.com/wp-content/uploads/APA-MINER-POX_Shrimp.jpg",
  },
  {
    id: 7,
    name: "Kháng sinh thảo dược Gan Tụy",
    price: 220000,
    image: "https://apanano.com/wp-content/uploads/APA-MINER-POX_Shrimp.jpg",
  },
  {
    id: 8,
    name: "Máy đo Oxy hòa tan kỹ thuật số",
    price: 3500000,
    image: "https://apanano.com/wp-content/uploads/APA-MINER-POX_Shrimp.jpg",
  },
];

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  // --- STATES ---
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"desc" | "usage">("desc");

  // --- HANDLERS ---
  const handleQuantityChange = (delta: number) => {
    const newVal = quantity + delta;
    if (newVal >= 1) setQuantity(newVal);
  };

  const formatMoney = (amount: number) => amount.toLocaleString("vi-VN") + " ₫";

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      {/* 1. BREADCRUMB */}
      <div className="container mx-auto px-4 py-4">
        <nav className="text-sm text-gray-500 flex items-center gap-2">
          <Link href="/" className="hover:text-teal-600 transition-colors">
            Trang chủ
          </Link>
          <ChevronRight size={14} />
          <Link
            href="/category"
            className="hover:text-teal-600 transition-colors"
          >
            Xử lý nước
          </Link>
          <ChevronRight size={14} />
          <span className="font-bold text-gray-800 truncate max-w-[200px] sm:max-w-md">
            {PRODUCT.name}
          </span>
        </nav>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* === LEFT COLUMN (MAIN CONTENT) === */}
          <div className="lg:col-span-9 space-y-6">
            {/* 2. PRODUCT MAIN INFO */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Image Gallery */}
                <div className="md:col-span-5 flex flex-col gap-4">
                  <div className="relative w-full pt-[100%] border border-gray-100 rounded-lg overflow-hidden group">
                    <Image
                      src={PRODUCT.images[activeImage]}
                      alt={PRODUCT.name}
                      fill
                      className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {PRODUCT.images.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActiveImage(idx)}
                        className={`relative pt-[100%] border rounded-md cursor-pointer overflow-hidden transition-all ${activeImage === idx ? "border-teal-600 ring-1 ring-teal-600" : "border-gray-200 hover:border-teal-400"}`}
                      >
                        <Image
                          src={img}
                          alt="thumbnail"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info Details */}
                <div className="md:col-span-7">
                  <div className="inline-block bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-1 rounded mb-2 uppercase tracking-wider">
                    {PRODUCT.brand}
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-2 leading-snug">
                    {PRODUCT.name}
                  </h1>

                  <div className="flex items-center gap-4 text-sm mb-4 border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-1 text-orange-500 font-bold">
                      <span className="underline decoration-orange-500 underline-offset-2">
                        {PRODUCT.rating}
                      </span>
                      <div className="flex text-orange-500">
                        <Star size={14} fill="currentColor" />
                        <Star size={14} fill="currentColor" />
                        <Star size={14} fill="currentColor" />
                        <Star size={14} fill="currentColor" />
                        <StarHalf size={14} fill="currentColor" />
                      </div>
                    </div>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <div className="text-gray-500">
                      Đã bán{" "}
                      <span className="text-gray-900 font-bold">
                        {PRODUCT.sold / 1000}k
                      </span>
                    </div>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <div className="text-gray-500">
                      {PRODUCT.reviewCount} Đánh giá
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="flex items-end gap-3">
                      <span className="text-3xl font-bold text-red-600">
                        {formatMoney(PRODUCT.price)}
                      </span>
                      <span className="text-sm text-gray-400 line-through mb-1">
                        {formatMoney(PRODUCT.oldPrice)}
                      </span>
                      <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded mb-2">
                        -
                        {Math.round(
                          ((PRODUCT.oldPrice - PRODUCT.price) /
                            PRODUCT.oldPrice) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-4 mb-8">
                    <div>
                      <label className="text-sm font-bold text-gray-700 block mb-2">
                        Dung tích / Trọng lượng:
                      </label>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 border border-teal-600 text-teal-600 bg-teal-50 font-semibold rounded-md text-sm">
                          Gói 1kg
                        </button>
                        <button className="px-4 py-2 border border-gray-200 text-gray-600 hover:border-teal-600 hover:text-teal-600 rounded-md text-sm transition-colors">
                          Thùng 20kg
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-gray-700 block mb-2">
                        Số lượng:
                      </label>
                      <div className="flex items-center w-32 border border-gray-300 rounded-lg overflow-hidden h-10 bg-white">
                        <button
                          onClick={() => handleQuantityChange(-1)}
                          className="w-10 h-full flex items-center justify-center hover:bg-gray-100 text-gray-600"
                        >
                          <Minus size={16} />
                        </button>
                        <input
                          type="text"
                          value={quantity}
                          readOnly
                          className="w-full h-full text-center text-sm font-semibold text-gray-800 border-x border-gray-200 focus:outline-none"
                        />
                        <button
                          onClick={() => handleQuantityChange(1)}
                          className="w-10 h-full flex items-center justify-center hover:bg-gray-100 text-gray-600"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-3 px-4 rounded-lg font-bold shadow-md shadow-orange-200 transition-all active:scale-95 flex flex-col items-center justify-center">
                      <span className="text-base uppercase">Mua Ngay</span>
                      <span className="text-[10px] font-normal opacity-90">
                        Giao hàng tận nơi - Miễn phí vận chuyển
                      </span>
                    </button>
                    <button className="flex-1 border-2 border-teal-600 text-teal-700 hover:bg-teal-50 py-3 px-4 rounded-lg font-bold transition-all active:scale-95 flex items-center justify-center gap-2">
                      <ShoppingCart size={20} />
                      Thêm vào giỏ
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. TABS: INFO & SPECS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setActiveTab("desc")}
                  className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide transition-colors ${activeTab === "desc" ? "text-teal-700 border-b-2 border-teal-600 bg-teal-50/30" : "text-gray-500 hover:text-teal-600 hover:bg-gray-50"}`}
                >
                  Mô tả sản phẩm
                </button>
                <button
                  onClick={() => setActiveTab("usage")}
                  className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide transition-colors ${activeTab === "usage" ? "text-teal-700 border-b-2 border-teal-600 bg-teal-50/30" : "text-gray-500 hover:text-teal-600 hover:bg-gray-50"}`}
                >
                  Thành phần & HDSD
                </button>
              </div>

              <div className="p-6 text-gray-700 leading-relaxed text-sm">
                {activeTab === "desc" ? (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <p className="mb-4">{PRODUCT.description}</p>
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start gap-3 text-blue-800 mb-4">
                      <ShieldCheck className="shrink-0 mt-0.5" size={20} />
                      <div>
                        <div className="font-bold mb-1">Cam kết chất lượng</div>
                        <p className="text-xs opacity-90">
                          Sản phẩm đạt chuẩn GMP-WHO, an toàn sinh học, không
                          chứa kháng sinh cấm, an toàn cho tôm và người tiêu
                          dùng.
                        </p>
                      </div>
                    </div>
                    <p>
                      Công dụng chính: Phân hủy mùn bã hữu cơ, thức ăn dư thừa,
                      làm sạch đáy ao, giảm khí độc NH3, NO2, H2S.
                    </p>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h4 className="font-bold text-gray-900 mb-3">
                      1. Thành phần:
                    </h4>
                    <div className="border rounded-lg overflow-hidden mb-6">
                      <table className="w-full text-left">
                        <tbody className="divide-y divide-gray-100">
                          {PRODUCT.ingredients.map((ing, idx) => (
                            <tr
                              key={idx}
                              className={
                                idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                              }
                            >
                              <td className="p-3 font-medium text-gray-600 w-1/3">
                                {ing.name}
                              </td>
                              <td className="p-3 font-bold text-gray-800">
                                {ing.content}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <h4 className="font-bold text-gray-900 mb-3">
                      2. Hướng dẫn sử dụng:
                    </h4>
                    <p className="bg-yellow-50 border border-yellow-100 p-4 rounded text-yellow-900 italic">
                      <span className="font-bold not-italic">Liều dùng:</span>{" "}
                      {PRODUCT.usage}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 4. REVIEWS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h5 className="font-bold text-lg text-gray-800 mb-6 flex items-center gap-2">
                Đánh giá & Nhận xét{" "}
                <span className="text-sm font-normal text-gray-500">
                  ({PRODUCT.reviewCount})
                </span>
              </h5>

              {/* Review Summary */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6 flex flex-wrap items-center gap-8">
                <div className="text-center min-w-[100px]">
                  <div className="text-4xl font-extrabold text-orange-500 mb-1">
                    {PRODUCT.rating}
                  </div>
                  <div className="flex justify-center text-orange-500 text-sm mb-1">
                    <Star fill="currentColor" size={16} />
                    <Star fill="currentColor" size={16} />
                    <Star fill="currentColor" size={16} />
                    <Star fill="currentColor" size={16} />
                    <StarHalf fill="currentColor" size={16} />
                  </div>
                  <div className="text-xs text-gray-400">13 đánh giá</div>
                </div>

                <div className="flex-1 flex flex-wrap gap-2">
                  <button className="px-3 py-1.5 bg-white border border-teal-600 text-teal-700 text-xs font-bold rounded active">
                    Tất cả
                  </button>
                  <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:border-teal-600 hover:text-teal-600 text-xs rounded transition-colors">
                    5 Sao (12)
                  </button>
                  <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:border-teal-600 hover:text-teal-600 text-xs rounded transition-colors">
                    4 Sao (1)
                  </button>
                  <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:border-teal-600 hover:text-teal-600 text-xs rounded transition-colors">
                    Có hình ảnh (5)
                  </button>
                </div>
              </div>

              {/* Review Item */}
              <div className="border-b border-gray-100 pb-6 mb-6 last:mb-0 last:border-0 last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs">
                      HC
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-800">
                        Huỳnh Châu
                      </div>
                      <div className="flex text-orange-500 text-[10px]">
                        <Star fill="currentColor" size={10} />
                        <Star fill="currentColor" size={10} />
                        <Star fill="currentColor" size={10} />
                        <Star fill="currentColor" size={10} />
                        <Star fill="currentColor" size={10} />
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">11/07/2025</div>
                </div>
                <p className="text-sm text-gray-600 mb-3 ml-13 pl-13">
                  Sài đã. Thuốc tốt, tôm khỏe sau 3 ngày dùng. Giao hàng nhanh,
                  đóng gói cẩn thận.
                </p>

                {/* Seller Response */}
                <div className="bg-gray-100 p-3 rounded-lg text-xs ml-13 text-gray-600">
                  <span className="font-bold text-teal-700">AgriShrimp:</span>{" "}
                  Cảm ơn anh Châu đã tin dùng sản phẩm! Chúc anh vụ mùa bội thu
                  ạ.
                </div>
              </div>
            </div>
          </div>

          {/* === RIGHT COLUMN (SIDEBAR) === */}
          <div className="lg:col-span-3">
            <div className="sticky top-24 space-y-6">
              {/* Support Box */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
                <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Phone size={24} />
                </div>
                <h6 className="font-bold text-gray-800 mb-1">
                  Tư vấn kỹ thuật
                </h6>
                <p className="text-xs text-gray-500 mb-4">
                  Kỹ sư thủy sản hỗ trợ 24/7
                </p>
                <a
                  href="tel:18001234"
                  className="block w-full py-2 border-2 border-teal-600 text-teal-700 rounded-full font-bold text-sm hover:bg-teal-600 hover:text-white transition-colors"
                >
                  1800 1234
                </a>
              </div>

              {/* Related Products */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h6 className="font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                  Sản phẩm gợi ý
                </h6>
                <div className="space-y-4">
                  {RELATED_PRODUCTS.map((prod) => (
                    <Link
                      key={prod.id}
                      href={`/product/${prod.id}`}
                      className="flex gap-3 group"
                    >
                      <div className="w-16 h-16 relative border border-gray-100 rounded bg-gray-50 overflow-hidden shrink-0">
                        <Image
                          src={prod.image}
                          alt={prod.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-800 line-clamp-2 mb-1 group-hover:text-teal-600 transition-colors">
                          {prod.name}
                        </div>
                        <div className="text-sm font-bold text-red-600">
                          {formatMoney(prod.price)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Banner Ad */}
              <div className="rounded-xl overflow-hidden shadow-sm relative h-48">
                <Image
                  src="https://vietstock.org/wp-content/uploads/2023/09/bao-ve-moi-truong-trong-nuoi-trong-thuy-san-2.jpg"
                  alt="Banner"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <p className="text-white font-bold text-sm">
                    Giải pháp nuôi tôm bền vững
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
