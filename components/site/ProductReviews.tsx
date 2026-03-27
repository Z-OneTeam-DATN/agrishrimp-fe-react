"use client";

import React, { useState, useEffect } from "react";
import { Star, MessageSquare, Loader2, Send, User, CheckCircle, Camera, X } from "lucide-react";
import { ReviewService, ReviewDTO } from "@/app/services/review.service";
import { FileService } from "@/app/services/file.service";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useFileUpload } from "@/hooks/use-file-upload";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface ProductReviewsProps {
  productId: number;
  slug?: string;
}

export function ProductReviews({ productId, slug }: ProductReviewsProps) {
  const { data: user, isAuthenticated } = useCurrentUser();
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    fetchReviews();
    if (isAuthenticated && productId) {
       checkPermission();
    }
  }, [productId, slug, isAuthenticated]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      let data: ReviewDTO[] = [];
      if (slug) {
        try {
          data = await ReviewService.getReviewsBySlug(slug);
          if (data && data.length === 0 && productId) {
             // Thử fallback sang ID nếu slug trả về rỗng (để an toàn)
             const fallbackData = await ReviewService.getReviewsByProduct(productId);
             if (fallbackData.length > 0) data = fallbackData;
          }
        } catch (slugError) {
          // Fallback sang ID nếu API slug bị 500
          if (productId) {
            data = await ReviewService.getReviewsByProduct(productId);
          }
        }
      } else if (productId) {
        data = await ReviewService.getReviewsByProduct(productId);
      }
      setReviews(data);
    } catch (error) {
      console.error("Lỗi khi tải đánh giá:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkPermission = async () => {
    try {
      const allowed = await ReviewService.checkCanReview(productId);
      setCanReview(allowed);
    } catch (error) {
      setCanReview(false);
    }
  };

  const renderStars = (count: number) => {
    return (
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={cn(
              "transition-all duration-200",
              star <= count 
                ? "fill-orange-400 text-orange-400" 
                : "text-slate-200 fill-slate-50"
            )}
          />
        ))}
      </div>
    );
  };

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 1: return "Rất tệ";
      case 2: return "Tệ";
      case 3: return "Bình thường";
      case 4: return "Tốt";
      case 5: return "Rất tốt";
      default: return "";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Danh sách Đánh giá */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-slate-800">Đánh giá từ khách hàng</h3>
            <div className="bg-teal-50 text-teal-600 text-xs px-3 py-1 rounded-full font-bold border border-teal-100">
              {reviews.length} nhận xét
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50/30 rounded-3xl border border-dashed border-slate-200">
            <Loader2 className="animate-spin text-teal-600 mb-4" size={32} />
            <p className="text-sm text-slate-500 font-medium">Đang tải đánh giá...</p>
          </div>
        ) : reviews.length > 0 ? (
          <div className="grid gap-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white p-6 rounded-3xl border border-slate-100 hover:border-teal-100 transition-colors group">
                <div className="flex gap-4">
                  <div className="shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 group-hover:border-teal-200 transition-colors">
                      {review.userAvatar ? (
                        <Image src={review.userAvatar} alt={review.userName || ""} width={48} height={48} className="object-cover" />
                      ) : (
                        <User size={24} className="text-slate-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-bold text-slate-800">{review.userName || "Khách hàng"}</h5>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            <CheckCircle size={10} /> Đã mua hàng
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {review.createdAt ? format(new Date(review.createdAt), "dd/MM/yyyy", { locale: vi }) : ""}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {renderStars(review.rating)}
                        <span className="text-[10px] font-bold text-orange-400">{getRatingLabel(review.rating)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-50 italic">
                      &ldquo;{review.comment}&rdquo;
                    </p>

                    {/* Hiển thị ảnh đánh giá */}
                    {review.imageUrls && review.imageUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {review.imageUrls.map((url, idx) => (
                          <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-100 shadow-sm cursor-zoom-in hover:scale-105 transition-transform">
                            <Image src={url} alt={`Review ${idx}`} fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-200 shadow-sm">
              <MessageSquare size={32} />
            </div>
            <h4 className="text-slate-800 font-bold mb-1">Chưa có đánh giá nào</h4>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">Hãy là người đầu tiên trải nghiệm và để lại đánh giá cho sản phẩm này nhé!</p>
            {!canReview && (
              <div className="mt-6">
                 <p className="text-[11px] text-teal-600 font-bold uppercase tracking-widest px-4 py-2 bg-teal-50 rounded-full inline-block">Mua sản phẩm để đánh giá</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
