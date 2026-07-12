"use client";

import { useCallback, useEffect, useRef } from "react";
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
const AIChatButton = dynamic(() => import("@/components/site/AIChatButton"), {
  ssr: false,
});
const WebSocketProvider = dynamic(() => import("@/components/providers/WebSocketProvider"), {
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
    setRefreshToken,
    clearAuth,
    setLoadingAuth,
    isLoadingAuth,
    setPermissions,
  } = useAuthStore();

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
  const hydratePromiseRef = useRef<Promise<void> | null>(null);
  const lastHydratedAtRef = useRef(0);

  const clearClientAuth = useCallback(() => {
    clearCache();
    clearAuth();
    setLoadingAuth(false);
  }, [clearAuth, setLoadingAuth]);

  const applyTokenSnapshot = useCallback(
    (tokens?: { accessToken?: string | null; refreshToken?: string | null } | null) => {
      if (tokens?.accessToken) {
        setAccessToken(tokens.accessToken);
      }
      if (tokens?.refreshToken !== undefined) {
        setRefreshToken(tokens.refreshToken);
      }
    },
    [setAccessToken, setRefreshToken],
  );

  const fetchFreshAuthSnapshot = useCallback(async () => {
    const [tokenData, freshUser, permissions] = await Promise.all([
      AuthService.meTokenNext().catch(() => null),
      AuthService.meNext(),
      AuthService.getMyPermissionsNext(),
    ]);

    applyTokenSnapshot(tokenData);
    writeCache(freshUser);
    writePermissionsCache(permissions);
    setUser(freshUser);
    setPermissions(permissions);
  }, [applyTokenSnapshot, setPermissions, setUser]);

  const refreshAndFetchAuthSnapshot = useCallback(async () => {
    const refreshData = await AuthService.refreshAuthTokenNext();
    applyTokenSnapshot(refreshData);
    await fetchFreshAuthSnapshot();
  }, [applyTokenSnapshot, fetchFreshAuthSnapshot]);

  const detectServerSession = useCallback(async () => {
    if (Cookies.get("hasSession")) {
      return true;
    }

    try {
      const tokenData = await AuthService.meTokenNext();
      const hasServerSession = Boolean(
        tokenData?.accessToken || tokenData?.refreshToken,
      );

      if (hasServerSession) {
        applyTokenSnapshot(tokenData);
      }

      return hasServerSession;
    } catch {
      return false;
    }
  }, [applyTokenSnapshot]);

  const hydrateAuth = useCallback(
    async ({
      preferCache = true,
      background = false,
    }: {
      preferCache?: boolean;
      background?: boolean;
    } = {}) => {
      if (hydratePromiseRef.current) {
        return hydratePromiseRef.current;
      }

      const cachedUser = preferCache ? readCache() : null;
      const cachedPermissions = preferCache ? readPermissionsCache() : [];

      if (cachedUser) {
        setUser(cachedUser as UserType);
        setPermissions(cachedPermissions);
      } else if (background) {
        setLoadingAuth(false);
      } else {
        setLoadingAuth(true);
      }

      const hydrateTask = (async () => {
        try {
          const hasServerSession = await detectServerSession();

          if (!hasServerSession) {
            clearClientAuth();
            return;
          }

          try {
            await fetchFreshAuthSnapshot();
          } catch {
            await refreshAndFetchAuthSnapshot();
          }

          lastHydratedAtRef.current = Date.now();
        } catch {
          clearClientAuth();
        } finally {
          setLoadingAuth(false);
          hydratePromiseRef.current = null;
        }
      })();

      hydratePromiseRef.current = hydrateTask;
      return hydrateTask;
    },
    [
      clearClientAuth,
      detectServerSession,
      fetchFreshAuthSnapshot,
      refreshAndFetchAuthSnapshot,
      setLoadingAuth,
      setPermissions,
      setUser,
    ],
  );

  useEffect(() => {
    const hasSessionCookie = Boolean(Cookies.get("hasSession"));
    const cachedUser = readCache();

    if (!isAdminPage && !isProtectedPath && !hasSessionCookie && !cachedUser) {
      setLoadingAuth(false);
      return;
    }

    const shouldBlockOnFirstLoad = Boolean(
      hasSessionCookie || cachedUser || isAdminPage || isProtectedPath,
    );

    void hydrateAuth({
      preferCache: true,
      background: !shouldBlockOnFirstLoad,
    });
  }, [hydrateAuth, isAdminPage, isProtectedPath, setLoadingAuth]);

  useEffect(() => {
    const revalidateAuth = () => {
      if (document.visibilityState === "hidden") {
        return;
      }

      const state = useAuthStore.getState();
      const sessionHint = Boolean(
        Cookies.get("hasSession") || state.user || state.accessToken,
      );
      const missingUser = !state.user || !state.isAuthenticated;
      const staleHydration = Date.now() - lastHydratedAtRef.current > 60_000;

      if (!sessionHint || (!missingUser && !staleHydration)) {
        return;
      }

      void hydrateAuth({
        preferCache: !missingUser,
        background: !missingUser,
      });
    };

    window.addEventListener("focus", revalidateAuth);
    document.addEventListener("visibilitychange", revalidateAuth);

    return () => {
      window.removeEventListener("focus", revalidateAuth);
      document.removeEventListener("visibilitychange", revalidateAuth);
    };
  }, [hydrateAuth]);

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
      defaultOptions: {
        queries: {
          retry: 0,
          staleTime: 60_000,
          gcTime: 10 * 60 * 1000,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
        },
      },
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
                {user ? <WebSocketProvider /> : null}
                <div className="sticky top-0 z-50">
                  <Header />
                  <Navbar />
                </div>
                <main className="flex-1 pb-[60px] md:pb-0">{children}</main>
                <Footer />
                <AIChatButton />
              </div>
            )}
            <Toaster position="top-right" richColors closeButton />
          </ThemeProvider>
        </QueryClientProvider>
      )}
    </GoogleAuthProvider>
  );
}
