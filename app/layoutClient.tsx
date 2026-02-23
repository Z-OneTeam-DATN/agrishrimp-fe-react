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
    
      // HYDRATE FULL USER PROFILE ON LOAD
      useEffect(() => {
        const hydrateAuth = async () => {
          setLoadingAuth(true);
          try {
            const user = await AuthService.meNext();
            if (user) {
              setUser(user);
            }
          } catch (err) {
            // No toast here to avoid annoying 401 messages on public pages
            clearAuth();
          } finally {
            setLoadingAuth(false);
          }
        };
        hydrateAuth();
      }, [setUser, clearAuth, setLoadingAuth]);  
    // Public pages don't need a blocking spinner
    const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/signup") || pathname?.startsWith("/reset-password");
    const isAdminPage = pathname?.startsWith("/admin");
    const isProtectedPath = ["/profile", "/orders", "/user/checkout"].some(p => pathname?.startsWith(p));
  
    // Determine if we should show a full screen loader (only for admin or protected user pages)
    const showBlockingLoader = (isAdminPage || isProtectedPath) && isLoadingAuth;
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: {
        queries: { retry: 0 },
      },
    });
  }

  const isHideLayout = isAdminPage || isAuthPage;

  if (showBlockingLoader) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#009688]/20 border-t-[#009688] rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-[#009688] animate-pulse uppercase tracking-widest">
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
  );
}
