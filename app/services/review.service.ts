import { apiJava, buildJavaApiUrl, type ApiPath } from "@/lib/axios";

export interface ReviewDTO {
  id?: number;
  productId?: number;
  orderId?: number;
  rating: number;
  comment: string;
  imageUrls?: string[];
  userId?: number;
  userName?: string;
  userAvatar?: string;
  createdAt?: string;
}

export const ReviewService = {
  /**
   * 1.1. Lấy danh sách đánh giá theo Slug (Public)
   * Endpoint: GET /api/public/products/slug/{slug}/reviews
   */
  getReviewsBySlug: async (slug: string): Promise<ReviewDTO[]> => {
    if (!slug || slug === "undefined") return [];
    try {
      const response = await apiJava.get(
        buildJavaApiUrl(`/public/products/slug/${slug}/reviews` as ApiPath),
        {
          isPublic: true,
        } as any,
      );
      return response.data || [];
    } catch (error: any) {
      console.error("Lỗi API getReviewsBySlug:", error.response?.data || error.message);
      return [];
    }
  },

  /**
   * 1.2. Lấy danh sách đánh giá theo ID (Public)
   * Endpoint: GET /api/public/products/{productId}/reviews
   */
  getReviewsByProduct: async (productId: number): Promise<ReviewDTO[]> => {
    if (!productId || isNaN(productId)) {
      return [];
    }
    try {
      const response = await apiJava.get(
        buildJavaApiUrl(`/public/products/${productId}/reviews` as ApiPath),
        {
          isPublic: true,
        } as any,
      );
      return response.data || [];
    } catch (error: any) {
      console.error("Lỗi API getReviewsByProduct:", error.response?.data || error.message);
      return [];
    }
  },

  /**
   * Gửi đánh giá mới (Yêu cầu đăng nhập)
   * Endpoint: POST /api/reviews
   */
  submitReview: async (review: ReviewDTO): Promise<any> => {
    const payload = {
      productId: review.productId,
      orderId: review.orderId,
      rating: review.rating,
      comment: review.comment,
      imageUrls: review.imageUrls && review.imageUrls.length > 0 ? review.imageUrls : []
    };
    const response = await apiJava.post(`/reviews`, payload);
    return response.data;
  },

  /**
   * Kiểm tra xem người dùng có thể đánh giá sản phẩm không
   * Endpoint: GET /api/reviews/can-review/{productId}
   */
  checkCanReview: async (productId: number): Promise<boolean> => {
    try {
      const response = await apiJava.get(`/reviews/can-review/${productId}`);
      return response.data; 
    } catch (error) {
      return false;
    }
  }
};
