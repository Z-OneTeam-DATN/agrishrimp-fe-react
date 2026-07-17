"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "@/app/services/auth.service";

/**
 * useLogout Hook
 * Handles:
 * 1. POST request to Next.js API route (/api/auth/logout)
 * 2. Clears client-side session cache
 * 3. Redirects straight to /login without flashing admin access-denied UI
 */
export const useLogout = () => {
  const queryClient = useQueryClient();

  const redirectToLogin = () => {
    // Do not clear the in-memory auth store before navigation.
    // Clearing it while still on /admin makes the layout briefly render
    // the "không có quyền truy cập" state before the browser leaves the page.
    try {
      sessionStorage.removeItem("_u");
      sessionStorage.removeItem("_p");
    } catch {
      // ignore sessionStorage failures
    }

    queryClient.clear();
    window.location.replace("/login");
  };

  const mutation = useMutation({
    mutationFn: () => AuthService.logoutNext(), // Gọi API Route (Xóa Cookie)
    
    onSuccess: () => {
      redirectToLogin();
    },

    onError: (error) => {
      console.error("Logout process error:", error);
      // Dù có lỗi API vẫn điều hướng rời khỏi trang hiện tại để tránh flash forbidden UI
      redirectToLogin();
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
