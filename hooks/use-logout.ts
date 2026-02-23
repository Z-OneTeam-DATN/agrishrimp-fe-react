"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AuthService } from "@/app/services/auth.service";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";

/**
 * useLogout Hook
 * Handles:
 * 1. POST request to Next.js API route (/api/auth/logout)
 * 2. Clears Zustand auth store
 * 3. Clears React Query cache
 * 4. Redirects to /login
 */
export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const mutation = useMutation({
    mutationFn: () => AuthService.logoutNext(), // Gọi API Route (Xóa Cookie)
    
    onSuccess: () => {
      // 1. Xóa thông tin trong Zustand
      clearAuth();
      
      // 2. Xóa toàn bộ React Query cache (Queries + Mutations)
      queryClient.clear();
      
      // 3. Thông báo cho người dùng
      toast.success("Bạn đã đăng xuất thành công.");
      
      // 4. Điều hướng cưỡng bức về trang Login (Hard redirect)
      window.location.href = "/login";
    },
    
    onError: (error) => {
      console.error("Logout process error:", error);
      // Dù có lỗi API vẫn nên ép logout ở phía FE
      clearAuth();
      queryClient.clear();
      window.location.href = "/login";
    }
  });

  const logout = () => {
    mutation.mutate();
  };

  return {
    logout,
    isLoading: mutation.isPending
  };
};
