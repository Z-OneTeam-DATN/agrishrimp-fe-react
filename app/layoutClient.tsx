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
import { UserType } from "./types/user.schema";

const Header = dynamic(() => import("@/components/site/SiteHeader"), {
  ssr: false,
});
const Navbar = dynamic(() => import("@/components/site/SiteNavbar"), {
  ssr: false,
});
const Footer = dynamic(() => import("@/components/site/SiteFooter"), {
  ssr: false,
});
const GoogleAuthProvider = dynamic(
  () => import("@/components/providers/GoogleOAuthProvider"),
  { ssr: false },
);

const CACHE_KEY = "_u";
const PERMS_CACHE_KEY = "_p";

const readCache = (): unknown => {
  try {
    return JSON.parse(sessionStorage.getItem(CACHE_KEY) || "");
  } catch {
    return null;
  }
};

const writeCache = (user: unknown) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(user));
  } catch {}
};

const readPermissionsCache = (): string[] => {
  try {
    const data = JSON.parse(sessionStorage.getItem(PERMS_CACHE_KEY) || "");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const writePermissionsCache = (perms: string[]) => {
  try {
    sessionStorage.setItem(PERMS_CACHE_KEY, JSON.stringify(perms));
  } catch {}
};

const clearCache = () => {
  try {
    sessionStorage.removeItem(CACHE_KEY);
    sessionStorage.removeItem(PERMS_CACHE_KEY);
  } catch {}
};

export default function LayoutClient({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClientRef = useRef<QueryClient>();
  const {
    user,
    setUser,
    setAccessToken,
    setAccessAndRefreshToken,
    clearAuth,
    setLoadingAuth,
    isLoadingAuth,
    setPermissions,
  } = useAuthStore();

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
        let hasAccessToken = false;

        try {
          const tokenData = await AuthService.meTokenNext();
          if (tokenData?.accessToken) {
            setAccessToken(tokenData.accessToken);
            hasAccessToken = true;
          }
        } catch {
          try {
            const refreshData = await AuthService.refreshAuthTokenNext();
            setAccessAndRefreshToken(refreshData);
            hasAccessToken = true;
          } catch {
            clearCache();
            clearAuth();
            setLoadingAuth(false);
            return;
          }
        }

        if (!hasAccessToken) {
          clearCache();
          clearAuth();
          setLoadingAuth(false);
          return;
        }

        const cachedPerms = readPermissionsCache();
        setPermissions(cachedPerms);
        setUser(cachedUser as UserType);
        setLoadingAuth(false);

        const [freshResult, permsResult] = await Promise.allSettled([
          AuthService.meNext(),
          AuthService.getMyPermissionsNext(),
        ]);

        if (freshResult.status === "fulfilled" && freshResult.value) {
          writeCache(freshResult.value);
          setUser(freshResult.value);
        }

        if (permsResult.status === "fulfilled") {
          writePermissionsCache(permsResult.value);
          setPermissions(permsResult.value);
        }

        if (
          freshResult.status === "rejected" &&
          permsResult.status === "rejected"
        ) {
          try {
            const refreshData = await AuthService.refreshAuthTokenNext();
            setAccessAndRefreshToken(refreshData);
          } catch {
            clearCache();
            clearAuth();
          }
        }
      } else {
        setLoadingAuth(true);
        try {
          const [userResult, tokenResult, permsResult] = await Promise.allSettled(
            [
              AuthService.meNext(),
              AuthService.meTokenNext(),
              AuthService.getMyPermissionsNext(),
            ],
          );

          if (
            tokenResult.status === "fulfilled" &&
            tokenResult.value?.accessToken
          ) {
            setAccessToken(tokenResult.value.accessToken);
          }

          if (permsResult.status === "fulfilled") {
            writePermissionsCache(permsResult.value);
            setPermissions(permsResult.value);
          }

          if (userResult.status === "fulfilled" && userResult.value) {
            writeCache(userResult.value);
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
  }, [
    setUser,
    setAccessToken,
    setAccessAndRefreshToken,
    clearAuth,
    setLoadingAuth,
    setPermissions,
  ]);

  const isAuthPage =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/reset-password");
  const isChangePasswordPage = pathname === "/change-password";
  const isAdminPage = pathname?.startsWith("/admin");
  const isAiDoctorPage = pathname?.startsWith("/ai-doctor");
  const isProtectedPath = [
    "/profile",
    "/orders",
    "/checkout",
    "/user/checkout",
    "/ai-doctor",
  ].some((p) => pathname?.startsWith(p));

  useEffect(() => {
    if (!isLoadingAuth && user?.mustChangePassword && !isChangePasswordPage) {
      router.push("/change-password");
    }
  }, [user, isLoadingAuth, isChangePasswordPage, router]);

  const showBlockingLoader = (isAdminPage || isProtectedPath) && isLoadingAuth;

  if (!isLoadingAuth && user?.mustChangePassword && !isChangePasswordPage) {
    return null;
  }

  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: { queries: { retry: 0 } },
    });
  }

  const isHideLayout = isAdminPage || isAuthPage || isAiDoctorPage;

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
