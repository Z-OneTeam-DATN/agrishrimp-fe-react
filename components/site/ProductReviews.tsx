"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Star,
  MessageSquare,
  Loader2,
  User,
  CheckCircle,
  ImageIcon,
} from "lucide-react";
import { ReviewService, ReviewDTO } from "@/app/services/review.service";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export type ReviewFilterValue = "all" | "with-images" | 1 | 2 | 3 | 4 | 5;

interface ProductReviewsProps {
  productId: number;
  slug?: string;
  activeFilter?: ReviewFilterValue;
  onFilterChange?: (filter: ReviewFilterValue) => void;
}

export function ProductReviews({
  productId,
  slug,
  activeFilter,
  onFilterChange,
}: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [internalFilter, setInternalFilter] = useState<ReviewFilterValue>("all");

  const selectedFilter = activeFilter ?? internalFilter;

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      let data: ReviewDTO[] = [];

      if (slug) {
        try {
          data = await ReviewService.getReviewsBySlug(slug);
          if (data.length === 0 && productId) {
            const fallbackData = await ReviewService.getReviewsByProduct(productId);
            if (fallbackData.length > 0) data = fallbackData;
          }
        } catch {
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
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [productId, slug]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    if (activeFilter === undefined) {
      setInternalFilter("all");
    }
  }, [productId, slug, activeFilter]);

  const getFullImageUrl = (path?: string) => {
    if (!path) return "/placeholder.png";
    if (path.startsWith("http")) return path;

    if (path.startsWith("/api/public")) {
      return path;
    }

    if (path.startsWith("/api")) {
      return path.replace("/api", "/be-api");
    }

    return `/be-api${path.startsWith("/") ? "" : "/"}${path}`;
  };

  const ratingCounts = useMemo(() => {
    const counts: Record<1 | 2 | 3 | 4 | 5, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    reviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        counts[review.rating as 1 | 2 | 3 | 4 | 5] += 1;
      }
    });

    return counts;
  }, [reviews]);

  const imageReviewCount = useMemo(
    () => reviews.filter((review) => (review.imageUrls?.length ?? 0) > 0).length,
    [reviews]
  );

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / reviews.length;
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (selectedFilter === "all") return reviews;
    if (selectedFilter === "with-images") {
      return reviews.filter((review) => (review.imageUrls?.length ?? 0) > 0);
    }

    return reviews.filter((review) => review.rating === selectedFilter);
  }, [reviews, selectedFilter]);

  const handleFilterChange = (filter: ReviewFilterValue) => {
    if (activeFilter === undefined) {
      setInternalFilter(filter);
    }
    onFilterChange?.(filter);
  };

  const renderStars = (count: number, size = 18) => (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={cn(
            "transition-all duration-200",
            star <= count
              ? "fill-orange-400 text-orange-400"
              : "fill-slate-100 text-slate-200"
          )}
        />
      ))}
    </div>
  );

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 5:
        return "Rất hài lòng";
      case 4:
        return "Hài lòng";
      case 3:
        return "Tạm ổn";
      case 2:
        return "Chưa hài lòng";
      case 1:
        return "Rất tệ";
      default:
        return "";
    }
  };

  const filterSummaryLabel = (() => {
    if (selectedFilter === "all") return `${reviews.length} đánh giá cho sản phẩm này`;
    if (selectedFilter === "with-images") return `${filteredReviews.length} đánh giá có hình ảnh`;
    return `${filteredReviews.length} đánh giá ${selectedFilter} sao`;
  })();

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-[170px] text-center lg:text-left">
            <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Đánh giá <span className="font-medium text-slate-500">({reviews.length})</span>
            </h3>

            <div className="mt-4 text-5xl font-bold tracking-tight text-orange-500">
              {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
            </div>

            <div className="mt-3 flex justify-center lg:justify-start">
              {renderStars(Math.round(averageRating), 22)}
            </div>

            <p className="mt-2 text-sm text-slate-500">
              {reviews.length} đánh giá
            </p>
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleFilterChange("all")}
                className={cn(
                  "inline-flex min-w-[118px] items-center justify-center rounded-full border px-4 py-2.5 text-sm font-semibold transition-all",
                  selectedFilter === "all"
                    ? "border-orange-500 bg-orange-500 text-white shadow-sm"
                    : "border-slate-200 bg-slate-100 text-slate-600 hover:border-orange-300 hover:text-orange-500"
                )}
              >
                Tất cả ({reviews.length})
              </button>

              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleFilterChange(rating as 1 | 2 | 3 | 4 | 5)}
                  className={cn(
                    "inline-flex min-w-[118px] items-center justify-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all",
                    selectedFilter === rating
                      ? "border-orange-500 bg-orange-500 text-white shadow-sm"
                      : "border-slate-200 bg-slate-100 text-slate-600 hover:border-orange-300 hover:text-orange-500"
                  )}
                >
                  <span>{rating}</span>
                  <Star size={14} className="fill-current" />
                  <span>({ratingCounts[rating as 1 | 2 | 3 | 4 | 5]})</span>
                </button>
              ))}

              <button
                type="button"
                onClick={() => handleFilterChange("with-images")}
                className={cn(
                  "inline-flex min-w-[138px] items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all",
                  selectedFilter === "with-images"
                    ? "border-orange-500 bg-orange-500 text-white shadow-sm"
                    : "border-slate-200 bg-slate-100 text-slate-600 hover:border-orange-300 hover:text-orange-500"
                )}
              >
                <ImageIcon size={15} />
                Có hình ảnh ({imageReviewCount})
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-100 px-5 py-4">
          <span className="text-sm font-medium text-slate-700">
            {filterSummaryLabel}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="mb-4 animate-spin text-teal-600" size={32} />
            <p className="text-sm font-medium text-slate-500">Đang tải đánh giá...</p>
          </div>
        ) : reviews.length > 0 ? (
          filteredReviews.length > 0 ? (
            <div className="mt-6 divide-y divide-slate-100">
              {filteredReviews.map((review) => (
                <div key={review.id} className="py-6 first:pt-0 last:pb-0">
                  <div className="flex gap-4">
                    <div className="hidden shrink-0 sm:block">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                        {review.userAvatar ? (
                          <img
                            src={getFullImageUrl(review.userAvatar)}
                            alt={review.userName || ""}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder.png";
                            }}
                          />
                        ) : (
                          <User size={22} className="text-slate-400" />
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-lg font-bold text-slate-900">
                              {review.userName || "Khách hàng"}
                            </h4>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                              <CheckCircle size={12} /> Đã mua hàng
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-2 py-1 text-xs font-bold text-orange-600">
                              {review.rating}
                              <Star size={12} className="fill-current" />
                            </span>
                            <span className="font-medium text-orange-500">
                              {getRatingLabel(review.rating)}
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="text-slate-500">
                              {review.createdAt
                                ? format(new Date(review.createdAt), "yyyy-MM-dd, HH:mm", {
                                    locale: vi,
                                  })
                                : ""}
                            </span>
                          </div>
                        </div>

                        <div className="hidden sm:flex">
                          {renderStars(review.rating, 15)}
                        </div>
                      </div>

                      {review.comment && (
                        <p className="mt-4 text-base leading-7 text-slate-700">
                          {review.comment}
                        </p>
                      )}

                      {review.imageUrls && review.imageUrls.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-3">
                          {review.imageUrls.map((url, idx) => (
                            <button
                              key={`${review.id}-${idx}`}
                              type="button"
                              onClick={() => setSelectedImage(getFullImageUrl(url))}
                              className="relative h-24 w-24 overflow-hidden rounded-2xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.03]"
                            >
                              <img
                                src={getFullImageUrl(url)}
                                alt={`Review ${idx + 1}`}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/placeholder.png";
                                }}
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center">
              <h4 className="text-lg font-bold text-slate-800">
                Chưa có đánh giá phù hợp
              </h4>
              <p className="mt-2 text-sm text-slate-500">
                Thử chuyển sang bộ lọc khác để xem thêm nhận xét từ khách hàng.
              </p>
            </div>
          )
        ) : (
          <div className="mt-6 rounded-[32px] border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-slate-200 shadow-sm">
              <MessageSquare size={32} />
            </div>
            <h4 className="text-lg font-bold text-slate-800">Chưa có đánh giá nào</h4>
            <p className="mx-auto mt-2 max-w-xs text-sm text-slate-400">
              Sản phẩm này chưa có nhận xét công khai từ khách hàng.
            </p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="flex max-w-3xl items-center justify-center overflow-hidden border-none bg-transparent p-0 shadow-none">
          {selectedImage && (
            <div className="relative max-h-[80vh] w-full aspect-square">
              <img
                src={selectedImage}
                alt="Review Large"
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.png";
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
