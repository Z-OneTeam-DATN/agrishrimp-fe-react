import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Mapping route prefix → permission code bắt buộc để truy cập.
 * Middleware sẽ đọc authorities từ JWT và kiểm tra theo bảng này.
 * Admin (role ADMIN) luôn bypass toàn bộ bảng này.
 */
const ADMIN_ROUTE_PERMISSIONS: { path: string; permission: string }[] = [
  { path: "/admin/reports/sales",      permission: "REPORT_REVENUE_VIEW" },
  { path: "/admin/reports/inventory",  permission: "REPORT_INVENTORY_VIEW" },
  { path: "/admin/financial",          permission: "REPORT_FINANCE_VIEW" },
  { path: "/admin/employees",          permission: "STAFF_VIEW" },
  { path: "/admin/branches",           permission: "BRANCH_VIEW" },
  { path: "/admin/roles",              permission: "ROLE_VIEW" },
  { path: "/admin/orders",             permission: "ORDER_VIEW" },
  { path: "/admin/orders-processing",  permission: "ORDER_VIEW" },
  { path: "/admin/orders-handover",    permission: "ORDER_VIEW" },
  { path: "/admin/orders-all",         permission: "ORDER_VIEW" },
  { path: "/admin/customers",          permission: "CUSTOMER_VIEW" },
  { path: "/admin/products",           permission: "PRODUCT_VIEW" },
  { path: "/admin/categories",         permission: "CATEGORY_VIEW" },
  { path: "/admin/variants",           permission: "ATTRIBUTE_VIEW" },
  { path: "/admin/suppliers",          permission: "SUPPLIER_VIEW" },
  { path: "/admin/receipts",           permission: "IMPORT_VIEW" },
  { path: "/admin/exports",            permission: "EXPORT_VIEW" },
  { path: "/admin/transfers",          permission: "TRANSFER_VIEW" },
  { path: "/admin/inventory-checks",   permission: "IMPORT_VIEW" },
  { path: "/admin/settings",           permission: "SETTING_VIEW" },
];

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
  "/checkout",
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
  const hasSession = req.cookies.get("hasSession")?.value;

  // Nếu có auth cookie nhưng thiếu hasSession (ví dụ: đăng ký qua Spring trực tiếp),
  // tự động đặt lại hasSession để frontend đồng bộ trạng thái.
  const needsSessionSync = token && !hasSession;

  const isPublicPath = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));
  const isAuthPath = AUTH_PATHS.some((p) => path.startsWith(p));
  const isProtectedPath =
    PROTECTED_PATHS.some((p) => path.startsWith(p)) ||
    path.startsWith("/admin");

  // Helper: attach hasSession cookie to any response when out of sync
  const withSessionSync = (res: NextResponse) => {
    if (needsSessionSync) {
      res.cookies.set({
        name: "hasSession",
        value: "1",
        path: "/",
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: "lax",
        secure: req.nextUrl.protocol === "https:",
      });
    }
    return res;
  };

  // 0. Nếu là trang công khai -> cho qua luôn
  if (isPublicPath) {
    return withSessionSync(NextResponse.next());
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

    // Trang 403 luôn được phép truy cập (tránh redirect loop)
    if (path === "/admin/forbidden") return NextResponse.next();

    // 1. Trích xuất Role (Dựa vào JWT)
    let role = (payload.role || "").toUpperCase();
    const authorities: string[] = Array.isArray(payload.authorities)
      ? payload.authorities.map((a: any) => (typeof a === "string" ? a : a.authority || "").toUpperCase())
      : [];
      
    // Chuẩn hóa role
    if (!role) {
      const roleAuth = authorities.find(a => a.startsWith("ROLE_"));
      if (roleAuth) role = roleAuth.replace("ROLE_", "");
    } else if (role.startsWith("ROLE_")) {
      role = role.replace("ROLE_", "");
    }

    // USER hoàn toàn không có quyền vào /admin
    if (role === "USER") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    /**
     * LƯU Ý QUAN TRỌNG:
     * Vì danh sách permissions chi tiết (REPORT_REVENUE_VIEW, v.v.) được fetch qua API /me/permissions
     * và KHÔNG nằm trong JWT, Middleware (chạy ở Edge Runtime) không thể kiểm tra granular permissions.
     *
     * Do đó:
     * 1. Middleware chỉ chặn tầng cao nhất (Role != USER).
     * 2. Việc phân quyền chi tiết (ẩn/hiện menu, chặn truy cập trang cụ thể)
     *    sẽ do Hook usePermissions() và các Component/Page đảm nhận ở phía Client.
     */
    return withSessionSync(NextResponse.next());
  }

  return withSessionSync(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
