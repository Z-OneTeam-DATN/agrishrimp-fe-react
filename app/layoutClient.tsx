"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { ToastContainer } from "react-toastify";
import Cookies from "js-cookie";

import { useAuthStore } from "@/stores/useAuthStore";
import { AuthService } from "./services/auth.service";

import "react-toastify/dist/ReactToastify.css";

const Header = dynamic(() => import("@/components/site/SiteHeader"), { ssr: false });
const Navbar = dynamic(() => import("@/components/site/SiteNavbar"), { ssr: false });
const Footer = dynamic(() => import("@/components/site/SiteFooter"), { ssr: false });
const GoogleAuthProvider = dynamic(() => import("@/components/providers/GoogleOAuthProvider"), { ssr: false });

export default function LayoutClient({
  children,
}: Readonly<{ children: React.ReactNode }>) {
    const pathname = usePathname();
    const router = useRouter();
    const queryClientRef = useRef<QueryClient>();
    const { user, setUser, setAccessToken, setAccessAndRefreshToken, clearAuth, setLoadingAuth, isLoadingAuth } = useAuthStore();

      // HYDRATE FULL USER PROFILE + TOKEN ON LOAD
      useEffect(() => {
        const hydrateAuth = async () => {
          // Chỉ thực hiện hydrate nếu có refreshToken trong cookie
          const hasToken = Cookies.get("hasSession");
          if (!hasToken) {
            setLoadingAuth(false);
            return;
          }

          setLoadingAuth(true);
          try {
            // Chạy song song: lấy profile và token từ cookie
            const [userResult, tokenResult] = await Promise.allSettled([
              AuthService.meNext(),
              AuthService.meTokenNext(),
            ]);

            // Khôi phục access token vào Zustand (cần cho usePermissions decode JWT)
            if (tokenResult.status === "fulfilled" && tokenResult.value?.accessToken) {
              setAccessToken(tokenResult.value.accessToken);
            }

            if (userResult.status === "fulfilled" && userResult.value) {
              // Access token còn hợp lệ, hydrate bình thường
              setUser(userResult.value);
            } else {
              // Access token hết hạn → thử refresh bằng HttpOnly refreshToken cookie
              try {
                const refreshData = await AuthService.refreshAuthTokenNext();
                setAccessAndRefreshToken(refreshData);
                // Thử lại sau khi có token mới
                const retryUser = await AuthService.meNext();
                setUser(retryUser);
              } catch {
                // Refresh cũng thất bại → hết phiên, xóa auth
                clearAuth();
              }
            }
          } catch {
            clearAuth();
          } finally {
            setLoadingAuth(false);
          }
        };
        hydrateAuth();
      }, [setUser, setAccessToken, setAccessAndRefreshToken, clearAuth, setLoadingAuth]);  
    // Public pages don't need a blocking spinner
      const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/signup") || pathname?.startsWith("/reset-password");
      const isChangePasswordPage = pathname === "/change-password";
      const isAdminPage = pathname?.startsWith("/admin");
      const isProtectedPath = ["/profile", "/orders", "/user/checkout"].some(p => pathname?.startsWith(p));
    
      // Redirect to mandatory password change page if needed
      useEffect(() => {
        if (!isLoadingAuth && user?.mustChangePassword && !isChangePasswordPage) {
          router.push("/change-password");
        }
      }, [user, isLoadingAuth, isChangePasswordPage, router]);
    
      // Determine if we should show a full screen loader (only for admin or protected user pages)
      const showBlockingLoader = (isAdminPage || isProtectedPath) && isLoadingAuth;
    
      // Block rendering if must change password but not on the page
      if (!isLoadingAuth && user?.mustChangePassword && !isChangePasswordPage) {
        return null; // Let the useEffect handle redirection
      }

      if (!queryClientRef.current) {
        queryClientRef.current = new QueryClient({
          defaultOptions: {
            queries: { retry: 0 },
          },
        });
      }

  const isHideLayout = isAdminPage || isAuthPage;

  return (
    <GoogleAuthProvider>
      {showBlockingLoader ? (
        <div className="h-screen w-full flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#009688]/20 border-t-[#009688] rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-[#009688] animate-pulse uppercase tracking-widest">
              AGRISHRIMP
            </p>
          </div>
        </div>
      ) : (
        <QueryClientProvider client={queryClientRef.current}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {isHideLayout ? (
              <>{children}</>
            ) : (
              <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
                <Header />
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
            )}
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
            <Toaster position="top-right" />
          </ThemeProvider>
        </QueryClientProvider>
      )}
    </GoogleAuthProvider>
  );
}
