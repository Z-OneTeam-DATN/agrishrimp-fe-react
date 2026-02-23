"use client";

import { useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { usePathname } from "next/navigation";

import Header from "@/components/site/SiteHeader";
import Navbar from "@/components/site/SiteNavbar";
import Footer from "@/components/site/SiteFooter";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { AuthService } from "./services/auth.service";

export default function LayoutClient({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const queryClientRef = useRef<QueryClient>();
  const { setUser, clearAuth, setLoadingAuth, isLoadingAuth } = useAuthStore();
  const [isHydrating, setIsHydrating] = useState(true);

  // HYDRATE FULL USER PROFILE ON LOAD
  useEffect(() => {
    const hydrateAuth = async () => {
      setLoadingAuth(true);
      try {
        const user = await AuthService.meNext();
        if (user) {
          // Token is already in cookie, meTokenNext can be called if we need tokens in Zustand too
          // For now meNext gets the profile which sets isAuthenticated
          setUser(user);
          
          // Try fetching tokens to sync them to Zustand (optional, but good for interceptors)
          try {
            const tokens = await AuthService.meTokenNext();
            if (tokens) {
              useAuthStore.getState().setAuth(tokens.accessToken, tokens.refreshToken);
            }
          } catch (tokenErr) {
            console.warn("User profile fetched but tokens not synced to Zustand.");
          }
        }
      } catch (err) {
        console.warn("No active session or session expired.");
        clearAuth();
      } finally {
        setLoadingAuth(false);
        setIsHydrating(false);
      }
    };
    hydrateAuth();
  }, [setUser, clearAuth, setLoadingAuth]);

  // Kiểm tra các route không hiển thị Header/Footer chung của trang chủ
  const isHideLayout =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/reset-password");

  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          retry: 0,
        },
      },
    });
  }

  if (isHydrating) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#009688]/20 border-t-[#009688] rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-[#009688] animate-pulse">
            AGRISHRIMP
          </p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {isHideLayout ? (
          // Giao diện cho trang quản lý/xác thực (Không Header/Footer trang chủ)
          <>{children}</>
        ) : (
          // Giao diện chính cho trang khách (Landing, Home...)
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
  );
}
