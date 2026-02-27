"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import Cookies from "js-cookie";

import { useAuthStore } from "@/stores/useAuthStore";
import { AuthService } from "./services/auth.service";

const Header = dynamic(() => import("@/components/site/SiteHeader"), { ssr: false });
const Navbar = dynamic(() => import("@/components/site/SiteNavbar"), { ssr: false });
const Footer = dynamic(() => import("@/components/site/SiteFooter"), { ssr: false });
const GoogleAuthProvider = dynamic(() => import("@/components/providers/GoogleOAuthProvider"), { ssr: false });

// ── Cache helpers (sessionStorage, xóa khi đóng tab) ──────────────────────
const CACHE_KEY = "_u";

const readCache = (): unknown => {
  try { return JSON.parse(sessionStorage.getItem(CACHE_KEY) || ""); } catch { return null; }
};

const writeCache = (user: unknown) => {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(user)); } catch {}
};

const clearCache = () => {
  try { sessionStorage.removeItem(CACHE_KEY); } catch {}
};
// ──────────────────────────────────────────────────────────────────────────

export default function LayoutClient({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClientRef = useRef<QueryClient>();
  const { user, setUser, setAccessToken, setAccessAndRefreshToken, clearAuth, setLoadingAuth, isLoadingAuth } = useAuthStore();

  // Chạy đồng bộ trước khi browser paint:
  // Nếu không có session cookie → tắt spinner và xóa cache ngay
  useLayoutEffect(() => {
    if (!Cookies.get("hasSession")) {
      clearCache();
      setLoadingAuth(false);
    }
  }, [setLoadingAuth]);

  useEffect(() => {
    const hydrateAuth = async () => {
      if (!Cookies.get("hasSession")) return;

      const cachedUser = readCache();

      if (cachedUser) {
        // ── FAST PATH: Có cache → không hiện spinner ──────────────────
        // Bước 1: Lấy access token ngay (chỉ đọc cookie, không gọi Java)
        try {
          const tokenData = await AuthService.meTokenNext();
          if (tokenData?.accessToken) setAccessToken(tokenData.accessToken);
        } catch {}

        // Bước 2: Hiện trang ngay với dữ liệu cũ
        setUser(cachedUser as any);
        setLoadingAuth(false);

        // Bước 3: Xác minh + cập nhật ở background (không block UI)
        try {
          const fresh = await AuthService.meNext();
          writeCache(fresh);
          setUser(fresh);
        } catch {
          // Token hết hạn → refresh
          try {
            const refreshData = await AuthService.refreshAuthTokenNext();
            setAccessAndRefreshToken(refreshData);
          } catch {
            clearCache();
            clearAuth();
          }
        }
      } else {
        // ── SLOW PATH: Lần đầu đăng nhập, chưa có cache → hiện spinner ─
        setLoadingAuth(true);
        try {
          const [userResult, tokenResult] = await Promise.allSettled([
            AuthService.meNext(),
            AuthService.meTokenNext(),
          ]);

          if (tokenResult.status === "fulfilled" && tokenResult.value?.accessToken) {
            setAccessToken(tokenResult.value.accessToken);
          }

          if (userResult.status === "fulfilled" && userResult.value) {
            writeCache(userResult.value); // Lưu cache cho các lần sau
            setUser(userResult.value);
          } else {
            try {
              const refreshData = await AuthService.refreshAuthTokenNext();
              setAccessAndRefreshToken(refreshData);
            } catch {
              clearCache();
              clearAuth();
            }
          }
        } catch {
          clearCache();
          clearAuth();
        } finally {
          setLoadingAuth(false);
        }
      }
    };

    hydrateAuth();
  }, [setUser, setAccessToken, setAccessAndRefreshToken, clearAuth, setLoadingAuth]);

  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/signup") || pathname?.startsWith("/reset-password");
  const isChangePasswordPage = pathname === "/change-password";
  const isAdminPage = pathname?.startsWith("/admin");
  const isProtectedPath = ["/profile", "/orders", "/user/checkout"].some(p => pathname?.startsWith(p));

  // Redirect bắt buộc đổi mật khẩu
  useEffect(() => {
    if (!isLoadingAuth && user?.mustChangePassword && !isChangePasswordPage) {
      router.push("/change-password");
    }
  }, [user, isLoadingAuth, isChangePasswordPage, router]);

  // Spinner toàn màn hình chỉ xuất hiện khi CHƯA có cache (lần đầu đăng nhập)
  const showBlockingLoader = (isAdminPage || isProtectedPath) && isLoadingAuth;

  if (!isLoadingAuth && user?.mustChangePassword && !isChangePasswordPage) {
    return null;
  }

  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: { queries: { retry: 0 } },
    });
  }

  const isHideLayout = isAdminPage || isAuthPage;

  return (
    <GoogleAuthProvider>
      {showBlockingLoader ? (
        <div className="h-screen w-full flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#009688]/20 border-t-[#009688] rounded-full animate-spin" />
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
            <Toaster position="top-right" richColors closeButton />
          </ThemeProvider>
        </QueryClientProvider>
      )}
    </GoogleAuthProvider>
  );
}
