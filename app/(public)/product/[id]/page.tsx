"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star, Minus, Plus, ShoppingCart, Phone, ChevronRight,
  Loader2, MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { HomeService } from "@/app/services/home.service";
import { getPublicCategories } from "@/app/services/CategoryService";
import { CategoryDTO } from "@/app/types/category.type";
import { cartService } from "@/app/services/cart.service"; 
import { useCartStore } from "@/stores/useCartStore";
import { ProductDetail, PublicProductListItem } from "@/app/types/product.schema";
import { formatCurrency } from "@/lib/utils";
import { ProductReviews } from "@/components/site/ProductReviews";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";

type VariantLabelSource = {
  attributeValues?: Array<{ value: string }>;
  unit?: string;
  sku?: string;
};

function getVariantOptionLabel(variant?: VariantLabelSource | null) {
  if (!variant) return "N/A";
  if (variant.attributeValues && variant.attributeValues.length > 0) {
    return variant.attributeValues.map((av) => av.value).join(" / ");
  }
  return variant.unit || variant.sku || "N/A";
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();

  const { fetchCartCount } = useCartStore(); // ✅ Thay đổi ở đây

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<PublicProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"desc" | "specs" | "reviews">("desc");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [detailData, allProducts, cats] = await Promise.all([
          HomeService.getProductBySlug(id),
          HomeService.getProducts(),
          getPublicCategories()
        ]);

        setProduct(detailData);
        setCategories(cats);
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

    setIsAdding(true);
    try {
      await cartService.updateQuantity(currentVariant.id!, quantity);
      
      // Cập nhật số lượng trên Header
      fetchCartCount(); // ✅ Cập nhật lại số lượng ở Header bằng cách gọi API
      
      if (isBuyNow) {
        // MUA NGAY -> Không cần bay, đi thẳng qua giỏ hàng
        router.push("/user/cart");
      } else {
        // THÊM GIỎ HÀNG -> Kích hoạt hiệu ứng bay
        animateFlyToCart(e);
        toast.success("Đã thêm sản phẩm vào giỏ hàng!");
      }
        } catch (error: unknown) {
          const apiError = error as {
            response?: {
              status?: number;
              data?: { message?: string };
            };
          };

          if (apiError.response?.status === 401 || apiError.response?.status === 403) {
            toast.error("Vui lòng đăng nhập để mua hàng!");
            setTimeout(() => {
              router.push("/login");
            }, 1500);
          } else {
            toast.error(apiError.response?.data?.message || "Không thể thêm vào giỏ hàng");
          }
        } finally {
    
      setIsAdding(false);
    }
  };

  const { isAuthenticated } = useAuthStore();
  const openChat = useChatStore((s) => s.openChat);
  const setConsultProduct = useChatStore((s) => s.setConsultProduct);

  const handleChatConsult = () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để chat với shop!");
      setTimeout(() => {
        router.push("/login");
      }, 1000);
      return;
    }
    if (!product) return;
    const currentVar = product.variants?.[selectedVariantIndex] || product.variants?.[0];
    setConsultProduct({
      id: product.id,
      name: product.name,
      price: currentVar?.price || 0,
      imageUrl: product.imageUrls?.[0] || "",
      slug: id,
    });
    openChat();
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="animate-spin text-teal-600" size={32} /></div>
  );

  if (!product) return <div className="text-center py-20 font-bold">Sản phẩm không tồn tại!</div>;

  const currentVariant = product.variants?.[selectedVariantIndex] || product.variants?.[0];

  const currentCategory = categories.find(c => c.id === product.category?.id);
  const parentCategory = currentCategory?.parentId 
    ? categories.find(c => c.id === currentCategory.parentId) 
    : null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fcfcfc] pb-20 font-sans text-slate-900">
      {/* 1. BREADCRUMB */}
      <div className="bg-white border-b border-slate-50">
        <div className="container mx-auto px-3 py-2.5 sm:px-4">
          <nav className="flex min-w-0 flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <Link href="/" className="hover:text-teal-600 transition-colors">Trang chủ</Link>
            {parentCategory && (
              <>
                <ChevronRight size={10} />
                <Link href={`/category/${parentCategory.id}`} className="hover:text-teal-600 transition-colors">
                  {parentCategory.name}
                </Link>
              </>
            )}
            {product.category?.name && (
              <>
                <ChevronRight size={10} />
                <Link href={`/category/${product.category?.id}`} className="hover:text-teal-600 transition-colors">
                  {product.category?.name}
                </Link>
              </>
            )}
            <ChevronRight size={10} />
            <span className="min-w-0 max-w-full truncate text-slate-600 sm:max-w-[260px]">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto mt-4 px-3 sm:mt-6 sm:px-4">
        <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-12 lg:gap-6">

          {/* === CỘT TRÁI === */}
          <div className="min-w-0 space-y-4 lg:col-span-9 lg:space-y-6">
            <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:p-5 lg:p-6">
              <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-12 md:gap-6 lg:gap-8">

                {/* Gallery */}
                <div className="min-w-0 space-y-3 md:col-span-5">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-50 border border-slate-100 group">
                    <Image
                      src={activeImage || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-contain p-3 transition-transform duration-500 group-hover:scale-105 sm:p-6"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                <div className="flex min-w-0 flex-col pt-1 md:col-span-7 md:pt-2">
                  <div className="mb-3 flex min-w-0 flex-wrap items-center gap-2">
                    <span className="bg-teal-50 text-teal-700 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      {product.supplierName || "Premium"}
                    </span>
                    <span className="min-w-0 break-words text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      • SKU: <span className="text-teal-600 font-mono">{currentVariant?.sku || "N/A"}</span>
                    </span>
                  </div>

                  <h1 className="mb-2 break-words text-lg font-bold leading-tight text-slate-800 sm:text-xl">
                    {product.name}
                  </h1>

                  <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="flex items-center gap-1">
                      <div className="flex text-orange-400">
                        {[...Array(5)].map((_, i) => <Star key={i} size={13} fill={i < 4 ? "currentColor" : "none"} />)}
                      </div>
                      <span className="text-xs font-bold text-slate-600">{product.ratingAverage || 4.8}</span>
                    </div>
                    <div className="h-3 w-[1px] bg-slate-200"></div>
                    <span className="text-xs font-medium text-slate-500">Đã bán <span className="text-slate-800 font-bold">{product.soldCount || 120}</span></span>
                  </div>

                  <div className="mb-5 rounded-xl bg-slate-50/80 p-3 sm:mb-6 sm:p-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Giá bán</span>
                      <span className="break-words text-xl font-extrabold tracking-tight text-red-600 sm:text-2xl">
                        {currentVariant ? formatCurrency(currentVariant.price) : "Liên hệ"}
                      </span>
                    </div>
                  </div>

                  {/* Danh mục hấp dẫn */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-4 w-1 bg-teal-600 rounded-full"></div>
                      <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Danh mục hấp dẫn</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {categories.filter(c => c.parentId !== null).slice(0, 10).map(cat => (
                        <Link 
                          key={cat.id} 
                          href={`/category/${cat.id}`}
                          className="max-w-full break-words rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm transition-all hover:border-teal-500 hover:text-teal-600"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* VARIANT SELECTION - Updated to match requested style */}
                  <div className="mb-6">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-3 tracking-widest">Lựa chọn phân loại (Trọng lượng / Quy cách)</label>
                    <div className="flex min-w-0 flex-wrap gap-2.5">
                      {product.variants?.map((v, index) => (
                        <button
                          key={v.id}
                          onClick={() => handleSelectVariant(index)}
                          className={`flex min-w-0 max-w-full items-center rounded-xl border px-3 py-2 text-xs font-bold transition-all sm:px-4 ${
                            selectedVariantIndex === index 
                              ? "border-teal-600 bg-teal-600 text-white shadow-md scale-[1.02]" 
                              : "border-slate-200 bg-white hover:border-teal-300 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span className="min-w-0 truncate">
                            {getVariantOptionLabel(v)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6 flex flex-wrap items-center gap-3 sm:mb-8 sm:gap-4">
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                      <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 text-slate-500 transition-colors"><Minus size={14} /></button>
                      <input
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val >= 1) setQuantity(val);
                        }}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value);
                          if (isNaN(val) || val < 1) setQuantity(1);
                        }}
                        className="w-12 text-center font-bold text-sm border-x border-slate-200 focus:outline-none bg-white"
                      />
                      <button onClick={() => setQuantity(q => q + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 text-slate-500 transition-colors"><Plus size={14} /></button>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase italic">Giao hàng toàn quốc</span>
                  </div>

                  {/* CÁC NÚT ĐẶT HÀNG & THÊM GIỎ HÀNG */}
                  <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-[auto_minmax(0,1fr)] sm:grid-cols-[auto_minmax(0,2fr)_minmax(0,1.4fr)] sm:gap-3">
                    <button
                      onClick={handleChatConsult}
                      className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-teal-600 px-4 text-xs font-bold uppercase tracking-widest text-teal-700 transition-all hover:bg-teal-50 min-[420px]:px-5"
                      title="Chat tư vấn sản phẩm"
                    >
                      <MessageSquare size={16} />
                      <span>Chat</span>
                    </button>
                    <button 
                      onClick={(e) => handleAddToCart(e, true)}  // Truyền event và true (mua ngay)
                      disabled={isAdding}
                      className="flex min-h-11 min-w-0 items-center justify-center rounded-xl bg-teal-600 px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-teal-100 transition-all hover:bg-teal-700 active:scale-[0.98] min-[420px]:px-6"
                    >
                      {isAdding ? <Loader2 className="animate-spin" size={16} /> : "Mua ngay"}
                    </button>
                    <button 
                      onClick={(e) => handleAddToCart(e, false)}  // Truyền event và false (chỉ thêm giỏ)
                      disabled={isAdding}
                      className="flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl border border-teal-600 px-4 py-3 text-xs font-bold uppercase tracking-widest text-teal-700 transition-all hover:bg-teal-50 min-[420px]:col-span-2 sm:col-span-1"
                    >
                      {isAdding ? <Loader2 className="animate-spin" size={16} /> : <><ShoppingCart size={16} /> Giỏ hàng</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* TABS - HIỂN THỊ MÃ TRONG THÔNG SỐ */}
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="flex overflow-x-auto border-b border-slate-50 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button onClick={() => setActiveTab("desc")} className={`min-w-[92px] flex-1 px-3 py-3.5 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "desc" ? "text-teal-600 border-b-2 border-teal-600" : "text-slate-400 hover:text-slate-600"}`}>Mô tả</button>
                <button onClick={() => setActiveTab("specs")} className={`min-w-[92px] flex-1 px-3 py-3.5 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "specs" ? "text-teal-600 border-b-2 border-teal-600" : "text-slate-400 hover:text-slate-600"}`}>Thông số</button>
                <button onClick={() => setActiveTab("reviews")} className={`min-w-[116px] flex-1 px-3 py-3.5 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "reviews" ? "text-teal-600 border-b-2 border-teal-600" : "text-slate-400 hover:text-slate-600"}`}>
                  Đánh giá {product.reviewCount ? `(${product.reviewCount})` : ""}
                </button>
              </div>
              <div className="min-w-0 p-3 text-sm leading-relaxed text-slate-600 sm:p-5 lg:p-6">
                {activeTab === "desc" && (
                  <div 
                    className="prose prose-sm max-w-none overflow-hidden break-words prose-headings:text-slate-800 prose-a:break-words prose-a:text-teal-600 prose-img:h-auto prose-img:max-w-full prose-img:object-contain prose-pre:max-w-full prose-pre:overflow-x-auto prose-table:block prose-table:max-w-full prose-table:overflow-x-auto prose-th:break-words prose-td:break-words [overflow-wrap:anywhere]"
                    dangerouslySetInnerHTML={{ __html: product.description || "<p className='text-slate-400 italic'>Đang cập nhật mô tả...</p>" }}
                  />
                )}
                {activeTab === "specs" && (
                  <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:p-5">
                    <div className="flex flex-col gap-1 border-b border-slate-200/50 pb-2 text-xs min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                      <span className="shrink-0 text-slate-400">Nhà cung cấp:</span>
                      <span className="break-words font-bold min-[420px]:text-right">{product.supplierName || "—"}</span>
                    </div>
                    <div className="flex flex-col gap-1 border-b border-slate-200/50 pb-2 text-xs min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                      <span className="shrink-0 text-slate-400">Danh mục:</span>
                      <span className="break-words font-bold min-[420px]:text-right">{product.category?.name || "Thức Ăn Tôm"}</span>
                    </div>
                    {currentVariant && (
                      <div className="flex flex-col gap-1 border-b border-slate-200/50 pb-2 text-xs min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                        <span className="shrink-0 text-slate-400">Quy cách:</span>
                        <span className="break-words font-bold min-[420px]:text-right">
                          {getVariantOptionLabel(currentVariant)}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col gap-1 border-b border-slate-200/50 pb-2 text-xs min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                      <span className="shrink-0 text-slate-400">Mã SKU hệ thống:</span>
                      <span className="break-all font-mono font-bold text-teal-600 min-[420px]:text-right">{product.baseSku || currentVariant?.sku || "N/A"}</span>
                    </div>
                    <div className="flex flex-col gap-1 border-b border-slate-200/50 pb-2 text-xs min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                      <span className="shrink-0 text-slate-400">Mã vạch (Barcode):</span>
                      <span className="break-all font-mono font-bold text-slate-800 min-[420px]:text-right">{currentVariant?.barcode || "Đang cập nhật"}</span>
                    </div>
                    <div className="flex flex-col gap-1 text-xs min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                      <span className="shrink-0 text-slate-400">Trạng thái:</span>
                      <span className="break-words font-bold text-emerald-600 min-[420px]:text-right">Sẵn hàng tại kho</span>
                    </div>
                  </div>
                )}
                {activeTab === "reviews" && (
                  <ProductReviews productId={product.id} />
                )}
              </div>
            </div>
          </div>

          {/* === CỘT PHẢI === */}
          <div className="min-w-0 space-y-4 lg:sticky lg:top-6 lg:col-span-3 lg:space-y-5">
            <div className="rounded-2xl bg-teal-600 p-4 text-center text-white shadow-md sm:p-6">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-white/30"><Phone size={24} /></div>
              <h6 className="font-bold text-sm mb-1 uppercase tracking-wide">Tư vấn miễn phí</h6>
              <p className="text-[10px] text-teal-50/80 font-medium mb-4">Hỗ trợ kỹ thuật 24/7</p>
              <a href="tel:18001234" className="block w-full py-2.5 bg-white text-teal-600 rounded-lg font-bold text-xs uppercase tracking-widest transition-transform active:scale-95 mb-2.5">1800 1234</a>
              <button 
                onClick={handleChatConsult}
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 border border-teal-500/30 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-transform active:scale-95 flex items-center justify-center gap-1.5"
              >
                <MessageSquare size={14} />
                <span>Chat trực tuyến</span>
              </button>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
              <h6 className="font-bold text-slate-800 mb-5 text-[10px] uppercase tracking-widest border-b border-slate-50 pb-2">Gợi ý cho bạn</h6>
              <div className="space-y-5">
                {relatedProducts.length > 0 ? (
                  relatedProducts.map((prod) => (
                    <Link key={prod.id} href={`/san-pham/${prod.slug || prod.id}`} className="flex gap-3 group items-start">
                      <div className="w-12 h-12 relative rounded-lg bg-slate-50 overflow-hidden shrink-0 border border-slate-100 transition-transform group-hover:scale-105">
                        <Image src={prod.imageUrls?.[0] || "/placeholder.svg"} alt={prod.name} fill className="object-cover" />
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
