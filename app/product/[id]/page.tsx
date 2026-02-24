"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star, Minus, Plus, ShoppingCart, Phone, ChevronRight,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { HomeService } from "@/app/services/home.service";
import { cartService } from "@/app/services/cart.service"; 
import { useCartStore } from "@/stores/useCartStore";
import { ProductDetail, ProductListItem } from "@/app/types/product.schema";
import { formatNumber, formatCurrency } from "@/lib/utils";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();

  const { updateCountLocal } = useCartStore();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"desc" | "specs">("desc");
  const [isAdding, setIsAdding] = useState(false);

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

  // ✅ HÀM TẠO HIỆU ỨNG BAY VÀO GIỎ HÀNG (PHIÊN BẢN ICON GÓI HÀNG)
  const animateFlyToCart = (e: React.MouseEvent) => {
    // 1. Tìm vị trí của Giỏ hàng trên Header (Đích đến)
    const cartTarget = document.getElementById("cart-icon-target");
    if (!cartTarget) return;

    const targetRect = cartTarget.getBoundingClientRect();
    
    // 2. Lấy vị trí con chuột lúc bấm (Điểm xuất phát)
    const startX = e.clientX;
    const startY = e.clientY;

    // Tính toán điểm giữa của đích đến
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;

    // 3. Tạo một khối Div ảo (Wrapper) di chuyển theo chiều ngang (X)
    const outer = document.createElement("div");
    outer.style.position = "fixed";
    outer.style.left = `${startX}px`;
    outer.style.top = `${startY}px`;
    outer.style.zIndex = "9999";
    outer.style.pointerEvents = "none"; // Để không chặn click chuột khi đang bay
    outer.style.transition = "transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)"; // X di chuyển nhanh dần đều

    // 4. Tạo khối Div con chứa ICON SVG di chuyển theo chiều dọc (Y)
    const inner = document.createElement("div");
    // Kích thước icon box
    inner.style.width = "32px";
    inner.style.height = "32px";
    // Căn giữa icon
    inner.style.display = "flex";
    inner.style.alignItems = "center";
    inner.style.justifyContent = "center";
    // Hiệu ứng rơi xuống (Parabola) và mờ dần
    inner.style.transition = "transform 0.8s cubic-bezier(0.5, -0.5, 1, 1), opacity 0.8s ease-in"; 
    
    // 🔥 THAY ĐỔI Ở ĐÂY: Nhúng SVG Icon Gói hàng vào thay vì hình tròn
    // Sử dụng màu Teal (#0d9488) làm nền và màu trắng làm viền
    inner.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#0d9488" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package drop-shadow-md">
        <path d="m7.5 4.27 9 5.15"/>
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
        <path d="m3.3 7 8.7 5 8.7-5"/>
        <path d="M12 22v-10"/>
      </svg>
    `;

    outer.appendChild(inner);
    document.body.appendChild(outer);

    // Ép trình duyệt nhận diện trạng thái ban đầu để kích hoạt transition
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = outer.offsetWidth;

    // 5. Kích hoạt hiệu ứng bay
    // Trừ đi một nửa kích thước icon (16px) để tâm icon trùng với tâm đích đến
    const deltaX = endX - startX - 16; 
    const deltaY = endY - startY - 16;

    outer.style.transform = `translateX(${deltaX}px)`;
    // Bay đến đích thì thu nhỏ lại còn 50% và mờ đi
    inner.style.transform = `translateY(${deltaY}px) scale(0.5) rotate(360deg)`; 
    inner.style.opacity = "0.2";

    // 6. Dọn dẹp sau khi bay xong và làm icon Giỏ hàng nhún một cái
    setTimeout(() => {
      if (document.body.contains(outer)) {
        document.body.removeChild(outer);
      }
      // Hiệu ứng nhún ở icon giỏ hàng đích
      cartTarget.classList.add("scale-125", "text-teal-500"); 
      setTimeout(() => {
        cartTarget.classList.remove("scale-125", "text-teal-500"); 
      }, 200);
    }, 800); // Thời gian khớp với transition (0.8s)
  };

  // --- HÀM XỬ LÝ CHUNG: THÊM VÀO GIỎ HÀNG ---
  const handleAddToCart = async (e: React.MouseEvent, isBuyNow: boolean) => {
    if (!product || !product.variants || product.variants.length === 0) {
      toast.error("Sản phẩm chưa có phân loại!");
      return;
    }

    const currentVariant = product.variants[selectedVariantIndex];

    if (quantity > (currentVariant.quantity || 999)) {
       toast.warning("Số lượng vượt quá tồn kho!");
       return;
    }

    setIsAdding(true);
    try {
      await cartService.updateQuantity(currentVariant.id, quantity);
      
      // Cập nhật số lượng trên Header
      updateCountLocal(quantity);
      
      if (isBuyNow) {
        // MUA NGAY -> Không cần bay, đi thẳng qua giỏ hàng
        router.push("/user/cart");
      } else {
        // THÊM GIỎ HÀNG -> Kích hoạt hiệu ứng bay
        animateFlyToCart(e);
        toast.success("Đã thêm sản phẩm vào giỏ hàng!");
      }
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Vui lòng đăng nhập để mua hàng!");
        router.push("/login"); 
      } else {
        toast.error(error.response?.data?.message || "Không thể thêm vào giỏ hàng");
      }
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="animate-spin text-teal-600" size={32} /></div>
  );

  if (!product) return <div className="text-center py-20 font-bold">Sản phẩm không tồn tại!</div>;

  const currentVariant = product.variants?.[selectedVariantIndex] || product.variants?.[0];

  return (
    <div className="bg-[#fcfcfc] min-h-screen pb-20 font-sans text-slate-900">
      {/* 1. BREADCRUMB */}
      <div className="bg-white border-b border-slate-50">
        <div className="container mx-auto px-4 py-2.5">
          <nav className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider flex-wrap">
            <Link href="/" className="hover:text-teal-600 transition-colors">Trang chủ</Link>
            {product.categoryName && (
              <>
                <ChevronRight size={10} />
                <span className="text-slate-400">{product.categoryName}</span>
              </>
            )}
            <ChevronRight size={10} />
            <span className="text-slate-600 line-clamp-1 max-w-[200px]">{product.name}</span>
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
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Giá bán</span>
                      <span className="text-2xl font-extrabold text-red-600 tracking-tight">
                        {currentVariant ? formatCurrency(currentVariant.price) : "Liên hệ"}
                      </span>
                    </div>
                  </div>

                  {/* VARIANT SELECTION - Updated to match requested style */}
                  <div className="mb-6">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-3 tracking-widest">Lựa chọn phân loại (Trọng lượng / Quy cách)</label>
                    <div className="flex flex-wrap gap-2.5">
                      {product.variants?.map((v, index) => (
                        <button
                          key={v.id}
                          onClick={() => handleSelectVariant(index)}
                          className={`flex items-center px-4 py-2 border rounded-xl text-xs transition-all font-bold ${
                            selectedVariantIndex === index 
                              ? "border-teal-600 bg-teal-600 text-white shadow-md scale-[1.02]" 
                              : "border-slate-200 bg-white hover:border-teal-300 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {v.attributeValues && v.attributeValues.length > 0 
                            ? v.attributeValues.map(av => av.value).join(" / ") 
                            : v.unit || v.sku}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                      <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 text-slate-500 transition-colors"><Minus size={14} /></button>
                      <span className="w-8 text-center font-bold text-sm leading-8">{quantity}</span>
                      <button onClick={() => setQuantity(q => q + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 text-slate-500 transition-colors"><Plus size={14} /></button>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase italic">Giao hàng toàn quốc</span>
                  </div>

                  {/* CÁC NÚT ĐẶT HÀNG & THÊM GIỎ HÀNG */}
                  <div className="flex gap-3">
                    <button 
                      onClick={(e) => handleAddToCart(e, true)}  // Truyền event và true (mua ngay)
                      disabled={isAdding}
                      className="flex-[2] bg-teal-600 hover:bg-teal-700 text-white py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-teal-100 text-center flex items-center justify-center"
                    >
                      {isAdding ? <Loader2 className="animate-spin" size={16} /> : "Mua ngay"}
                    </button>
                    <button 
                      onClick={(e) => handleAddToCart(e, false)}  // Truyền event và false (chỉ thêm giỏ)
                      disabled={isAdding}
                      className="flex-1 border border-teal-600 text-teal-700 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-teal-50 transition-all flex items-center justify-center gap-2"
                    >
                      {isAdding ? <Loader2 className="animate-spin" size={16} /> : <><ShoppingCart size={16} /> Giỏ hàng</>}
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
                  <div 
                    className="prose prose-sm max-w-none prose-headings:text-slate-800 prose-a:text-teal-600"
                    dangerouslySetInnerHTML={{ __html: product.description || "<p className='text-slate-400 italic'>Đang cập nhật mô tả...</p>" }}
                  />
                ) : (
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-3">
                    <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/50">
                      <span className="text-slate-400">Thương hiệu:</span>
                      <span className="font-bold">{product.brandName || "Tomboy Feed"}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/50">
                      <span className="text-slate-400">Danh mục:</span>
                      <span className="font-bold">{product.categoryName || "Thức Ăn Tôm"}</span>
                    </div>
                    {currentVariant && (
                      <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/50">
                        <span className="text-slate-400">Quy cách:</span>
                        <span className="font-bold">
                          {currentVariant.attributeValues && currentVariant.attributeValues.length > 0 
                            ? currentVariant.attributeValues.map(av => av.value).join(" / ") 
                            : currentVariant.unit || "N/A"}
                        </span>
                      </div>
                    )}
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
                    <Link key={prod.id} href={`/san-pham/${prod.slug || prod.id}`} className="flex gap-3 group items-start">
                      <div className="w-12 h-12 relative rounded-lg bg-slate-50 overflow-hidden shrink-0 border border-slate-100 transition-transform group-hover:scale-105">
                        <Image src={prod.imageUrls?.[0] || "/placeholder.png"} alt={prod.name} fill className="object-cover" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="text-[10px] font-bold text-slate-700 line-clamp-2 mb-0.5 group-hover:text-teal-600 transition-colors leading-normal">{prod.name}</div>
                        <div className="text-xs font-bold text-red-500 tracking-tight">{formatCurrency(prod.variants?.[0]?.price || 0)}</div>
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