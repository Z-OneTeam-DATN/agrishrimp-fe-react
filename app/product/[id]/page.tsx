"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star, Minus, Plus, ShoppingCart, Phone, ChevronRight,
  Loader2, ThumbsUp
} from "lucide-react";
import { HomeService } from "@/app/services/home.service";
import { ProductDetail, ProductListItem } from "@/app/types/product.schema";
import { formatNumber } from "@/lib/utils";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"desc" | "specs">("desc");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [detailData, allProducts] = await Promise.all([
          HomeService.getProductBySlug(id),
          HomeService.getProducts()
        ]);

        setProduct(detailData);
        if (detailData.imageUrls?.length > 0) setActiveImage(detailData.imageUrls[0]);

        const suggestions = allProducts
          .filter(p => (p.slug || p.id.toString()) !== id)
          .slice(0, 5);
        setRelatedProducts(suggestions);
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSelectVariant = (index: number) => {
    setSelectedVariantIndex(index);
    const variant = product?.variants?.[index];
    if (variant?.imageUrl) setActiveImage(variant.imageUrl);
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="animate-spin text-teal-600" size={32} /></div>
  );

  if (!product) return <div className="text-center py-20 font-bold">Sản phẩm không tồn tại!</div>;

  // Lấy biến thể hiện tại đang chọn
  const currentVariant = product.variants?.[selectedVariantIndex] || product.variants?.[0];

  return (
    <div className="bg-[#fcfcfc] min-h-screen pb-20 font-sans text-slate-900">
      {/* 1. BREADCRUMB */}
      <div className="bg-white border-b border-slate-50">
        <div className="container mx-auto px-4 py-2.5">
          <nav className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Link href="/" className="hover:text-teal-600 transition-colors">Trang chủ</Link>
            <ChevronRight size={10} />
            <span className="text-slate-400">{product.categoryName}</span>
            <ChevronRight size={10} />
            <span className="text-slate-600">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* === CỘT TRÁI === */}
          <div className="lg:col-span-9 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                {/* Gallery */}
                <div className="md:col-span-5 space-y-3">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-50 border border-slate-100 group">
                    <Image
                      src={activeImage || "/placeholder.png"}
                      alt={product.name}
                      fill
                      className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {product.imageUrls?.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(img)}
                        className={`relative w-16 h-16 shrink-0 rounded-lg border-2 transition-all overflow-hidden ${activeImage === img ? "border-teal-500" : "border-transparent hover:border-slate-200"}`}
                      >
                        <Image src={img} alt="thumb" fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Buy Info */}
                <div className="md:col-span-7 flex flex-col pt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-teal-50 text-teal-700 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      {product.brandName || "Premium"}
                    </span>
                    {/* HIỂN THỊ MÃ BIẾN THỂ ĐANG CHỌN */}
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                      • SKU: <span className="text-teal-600 font-mono">{currentVariant?.sku || "N/A"}</span>
                    </span>
                  </div>

                  <h1 className="text-xl font-bold text-slate-800 mb-2 leading-tight">
                    {product.name}
                  </h1>

                  <div className="flex items-center gap-4 mb-5">
                    <div className="flex items-center gap-1">
                      <div className="flex text-orange-400">
                        {[...Array(5)].map((_, i) => <Star key={i} size={13} fill={i < 4 ? "currentColor" : "none"} />)}
                      </div>
                      <span className="text-xs font-bold text-slate-600">{product.ratingAverage || 4.8}</span>
                    </div>
                    <div className="h-3 w-[1px] bg-slate-200"></div>
                    <span className="text-xs font-medium text-slate-500">Đã bán <span className="text-slate-800 font-bold">{product.soldCount || 120}</span></span>
                  </div>

                  <div className="bg-slate-50/80 p-4 rounded-xl mb-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Giá khuyến mãi</span>
                      <span className="text-2xl font-extrabold text-red-600 tracking-tight">
                        {currentVariant ? `${formatNumber(currentVariant.price)} ₫` : "Liên hệ"}
                      </span>
                    </div>
                  </div>

                  {/* VARIANT SELECTION */}
                  <div className="mb-6">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-3 tracking-widest">Quy cách sản phẩm</label>
                    <div className="flex flex-wrap gap-2">
                      {product.variants?.map((v, index) => (
                        <button
                          key={v.id}
                          onClick={() => handleSelectVariant(index)}
                          className={`flex items-center px-3 py-1.5 border rounded-lg transition-all ${selectedVariantIndex === index ? "border-teal-600 bg-teal-50 text-teal-700 font-bold shadow-sm" : "border-slate-200 hover:border-teal-300 text-slate-600 font-semibold"}`}
                        >
                          <span className="text-xs">{v.unit}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                      <button onClick={() => setQuantity(q => Math.max(1, q-1))} className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 text-slate-500 transition-colors"><Minus size={14} /></button>
                      <span className="w-8 text-center font-bold text-sm leading-8">{quantity}</span>
                      <button onClick={() => setQuantity(q => q+1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 text-slate-500 transition-colors"><Plus size={14} /></button>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase italic">Giao hàng toàn quốc</span>
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-[2] bg-teal-600 hover:bg-teal-700 text-white py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-teal-100 text-center">
                      Mua ngay
                    </button>
                    <button className="flex-1 border border-teal-600 text-teal-700 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-teal-50 transition-all flex items-center justify-center gap-2">
                      <ShoppingCart size={16} /> Giỏ hàng
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* TABS - HIỂN THỊ MÃ TRONG THÔNG SỐ */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="flex border-b border-slate-50">
                <button onClick={() => setActiveTab("desc")} className={`flex-1 py-3.5 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "desc" ? "text-teal-600 border-b-2 border-teal-600" : "text-slate-400 hover:text-slate-600"}`}>Mô tả</button>
                <button onClick={() => setActiveTab("specs")} className={`flex-1 py-3.5 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "specs" ? "text-teal-600 border-b-2 border-teal-600" : "text-slate-400 hover:text-slate-600"}`}>Thông số</button>
              </div>
              <div className="p-6 text-slate-600 text-sm leading-relaxed">
                {activeTab === "desc" ? (
                   <div className="whitespace-pre-line">{product.description}</div>
                ) : (
                   <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/50">
                        <span className="text-slate-400">Xuất xứ:</span>
                        <span className="font-bold">{product.origin || "Việt Nam"}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/50">
                        <span className="text-slate-400">Mã SKU hệ thống:</span>
                        <span className="font-mono font-bold text-teal-600">{product.baseSku || currentVariant?.sku || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/50">
                        <span className="text-slate-400">Mã vạch (Barcode):</span>
                        <span className="font-mono font-bold text-slate-800">{currentVariant?.barcode || "Đang cập nhật"}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Trạng thái:</span>
                        <span className="text-emerald-600 font-bold">Sẵn hàng tại kho</span>
                      </div>
                   </div>
                )}
              </div>
            </div>
          </div>

          {/* === CỘT PHẢI === */}
          <div className="lg:col-span-3 space-y-5 lg:sticky lg:top-6">
            <div className="bg-teal-600 rounded-2xl p-6 text-white shadow-md text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-white/30"><Phone size={24} /></div>
              <h6 className="font-bold text-sm mb-1 uppercase tracking-wide">Tư vấn miễn phí</h6>
              <p className="text-[10px] text-teal-50/80 font-medium mb-4">Hỗ trợ kỹ thuật 24/7</p>
              <a href="tel:18001234" className="block w-full py-2.5 bg-white text-teal-600 rounded-lg font-bold text-xs uppercase tracking-widest transition-transform active:scale-95">1800 1234</a>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h6 className="font-bold text-slate-800 mb-5 text-[10px] uppercase tracking-widest border-b border-slate-50 pb-2">Gợi ý cho bạn</h6>
              <div className="space-y-5">
                {relatedProducts.length > 0 ? (
                  relatedProducts.map((prod) => (
                    <Link key={prod.id} href={`/product/${prod.slug || prod.id}`} className="flex gap-3 group items-start">
                      <div className="w-12 h-12 relative rounded-lg bg-slate-50 overflow-hidden shrink-0 border border-slate-100 transition-transform group-hover:scale-105">
                        <Image src={prod.imageUrls?.[0] || "/placeholder.png"} alt={prod.name} fill className="object-cover" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="text-[10px] font-bold text-slate-700 line-clamp-2 mb-0.5 group-hover:text-teal-600 transition-colors leading-normal">{prod.name}</div>
                        <div className="text-xs font-bold text-red-500 tracking-tight">{formatNumber(prod.variants?.[0]?.price || 0)} ₫</div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <Loader2 className="animate-spin text-slate-200 mx-auto" size={16} />
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}