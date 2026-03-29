"use client";

import React, { use, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Star, Loader2, Send, Camera, X, ChevronLeft } from "lucide-react";
import { ReviewService } from "@/app/services/review.service";
import { FileService } from "@/app/services/file.service";
import { PublicProductService } from "@/app/services/publicProduct.service";
import { useFileUpload } from "@/hooks/use-file-upload";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { getErrorMessage } from "@/lib/axios";

export default function WriteReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productIdStr } = use(params);
  const productId = parseInt(productIdStr);
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const [fileState, fileActions] = useFileUpload({
    accept: "image/*",
    multiple: true,
    maxFiles: 5,
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await PublicProductService.getById(productId);
        setProduct(data);
      } catch (error) {
        toast.error("Không thể tải thông tin sản phẩm");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return toast.error("Vui lòng nhập nội dung đánh giá");
    if (!orderId) return toast.error("Không tìm thấy mã đơn hàng");

    const pId = parseInt(productIdStr);
    const oId = parseInt(orderId);

    if (isNaN(pId) || isNaN(oId)) {
      return toast.error("Dữ liệu không hợp lệ. Vui lòng thử lại.");
    }

    setSubmitting(true);
    try {
      console.log("DEBUG: Submitting review with data:", {
        productId: pId,
        orderId: oId,
        rating,
        comment,
      });

      const imageUrls: string[] = [];
      if (fileState.files.length > 0) {
        for (const fileItem of fileState.files) {
          if (fileItem.file instanceof File) {
            const formData = new FormData();
            formData.append("file", fileItem.file);
            const response = await FileService.tmpUpload(formData) as any;
            
            // Log để debug cấu trúc trả về
            console.log("DEBUG: Upload result:", response);

            // Kiểm tra các trường hợp có thể trả về: 
            // 1. response.url (Cloudinary trả về trực tiếp)
            // 2. response.data.tmpPath (Backend local)
            const imgPath = response?.url || response?.data?.url || response?.data?.tmpPath || response?.tmpPath || response?.data?.imageUrl || response?.imageUrl;
            
            if (imgPath) {
              imageUrls.push(imgPath);
            }
          }
        }
      }

      console.log("DEBUG: Final imageUrls to send:", imageUrls);

      await ReviewService.submitReview({
        productId: pId,
        orderId: oId,
        rating,
        comment,
        imageUrls,
      });

      toast.success("Đã gửi đánh giá thành công");
      router.back();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 1: return "Rất tệ";
      case 2: return "Tệ";
      case 3: return "Bình thường";
      case 4: return "Tốt";
      case 5: return "Tuyệt vời";
      default: return "";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-slate-300" size={24} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20">
      {/* Header tối giản */}
      <div className="border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
              <ChevronLeft size={20} className="text-slate-500" />
            </button>
            <h1 className="text-sm font-bold tracking-tight">Viết đánh giá</h1>
          </div>
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            Đơn hàng #{orderId}
          </span>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Cột trái: Thông tin sản phẩm gọn gàng */}
          <div className="lg:col-span-4 space-y-6">
            {product && (
              <div className="flex lg:flex-col gap-4 items-center lg:items-start">
                <div className="relative w-20 h-20 lg:w-32 lg:h-32 shrink-0 border border-slate-100 rounded-xl overflow-hidden bg-slate-50">
                  <Image 
                    src={product.imageUrls?.[0] || "/placeholder.png"} 
                    alt={product.name} 
                    fill 
                    className="object-contain p-2" 
                  />
                </div>
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-bold text-teal-600 uppercase tracking-tighter">
                    {product.category?.name}
                  </span>
                  <h2 className="text-sm font-bold leading-snug line-clamp-2">
                    {product.name}
                  </h2>
                  <p className="text-xs font-medium text-slate-400">
                    {formatCurrency(product.variants?.[0]?.price || 0)}
                  </p>
                </div>
              </div>
            )}
            
            <div className="hidden lg:block pt-6 border-t border-slate-50">
               <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                 Đánh giá của bạn sẽ được hiển thị công khai để giúp cộng đồng mua sắm tốt hơn.
               </p>
            </div>
          </div>

          {/* Cột phải: Form tối giản */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSubmit} className="space-y-10">
              
              {/* Rating */}
              <div className="space-y-4">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">1. Chất lượng sản phẩm</label>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={28}
                        className={cn(
                          "transition-colors cursor-pointer",
                          star <= (hoverRating || rating) 
                            ? "fill-orange-400 text-orange-400" 
                            : "text-slate-200 fill-transparent"
                        )}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-orange-500 w-20">
                    {getRatingLabel(hoverRating || rating)}
                  </span>
                </div>
              </div>

              {/* Hình ảnh */}
              <div className="space-y-4">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">2. Hình ảnh đính kèm ({fileState.files.length}/5)</label>
                <div className="flex flex-wrap gap-3">
                  {fileState.files.map((file) => (
                    <div key={file.id} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-100 group">
                      <Image src={file.preview || "/placeholder.png"} alt="Preview" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => fileActions.removeFile(file.id)}
                        className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-500 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {fileState.files.length < 5 && (
                    <button
                      type="button"
                      onClick={fileActions.openFileDialog}
                      className="w-20 h-20 rounded-lg border border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-all bg-slate-50/50"
                    >
                      <Camera size={20} />
                      <span className="text-[9px] font-bold uppercase">Thêm</span>
                    </button>
                  )}
                </div>
                <input {...fileActions.getInputProps()} className="hidden" />
              </div>

              {/* Comment */}
              <div className="space-y-4">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">3. Nội dung nhận xét</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Sản phẩm dùng tốt không? Đóng gói như thế nào?..."
                  className="w-full min-h-[160px] p-4 rounded-xl border border-slate-100 focus:outline-none focus:border-slate-300 transition-all text-sm resize-none bg-slate-50/30 placeholder:text-slate-300 leading-relaxed"
                />
              </div>

              {/* Submit */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full lg:w-max min-w-[180px] bg-slate-900 hover:bg-black text-white py-3.5 px-8 rounded-lg font-bold text-xs uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-3"
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      Gửi đánh giá <Send size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
}
