import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Các trang công khai (Public pages - KHÔNG cần đăng nhập)
const PUBLIC_PATHS = [
  "/",
  "/san-pham",
  "/product",
  "/category",
  "/store",
  "/about",
  "/contact",
];

// Các trang chỉ dành cho người chưa đăng nhập (Auth pages)
const AUTH_PATHS = ["/login", "/signup", "/reset-password"];

// Các trang yêu cầu phải đăng nhập (Private pages)
const PROTECTED_PATHS = [
  "/profile",
  "/edit-profile",
  "/address",
  "/orders",
  "/ponds",
  "/voucher",
  "/ai-doctor",
  "/user/cart",
  "/user/checkout",
];

// Helper to decode JWT payload without external library
function decodeJwt(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // Decode base64url to base64
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Redirect /store to /account as requested by user
  if (path === "/store") {
    return NextResponse.redirect(new URL("/account", req.url));
  }

  // Bỏ qua các đường dẫn static và api
  if (
    path.startsWith("/_next") ||
    path.startsWith("/api") ||
    path.startsWith("/images") ||
    path === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const accessToken = req.cookies.get("accessToken")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;
  const token = accessToken ?? refreshToken;

  const isPublicPath = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));
  const isAuthPath = AUTH_PATHS.some((p) => path.startsWith(p));
  const isProtectedPath =
    PROTECTED_PATHS.some((p) => path.startsWith(p)) ||
    path.startsWith("/admin");

  // 0. Nếu là trang công khai -> cho qua luôn
  if (isPublicPath) {
    return NextResponse.next();
  }

  // 1. Nếu đã đăng nhập mà cố vào trang login/signup -> về trang chủ
  if (token && isAuthPath) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 2. Nếu chưa đăng nhập mà vào trang yêu cầu tài khoản -> về trang login
  if (!token && isProtectedPath) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 3. RBAC Check for /admin
  if (accessToken && path.startsWith("/admin")) {
    const payload = decodeJwt(accessToken);
    if (!payload) return NextResponse.next();

    const role = (payload.role || "").toUpperCase();

    // USER không được vào admin
    if (role === "USER") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // MANAGER bị hạn chế một số khu vực hệ thống
    if (role === "MANAGER") {
      const restrictedForManager = [
        "/admin/employees",
        "/admin/branches",
        "/admin/categories",
        "/admin/variants",
        "/admin/financial",
      ];

      if (restrictedForManager.some((p) => path.startsWith(p))) {
        // Redirect về Dashboard admin hoặc trang 403
        return NextResponse.redirect(new URL("/admin", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
