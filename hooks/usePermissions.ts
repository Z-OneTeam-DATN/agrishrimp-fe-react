import { useAuthStore } from "@/stores/useAuthStore";
import { useCallback } from "react";
import { jwtDecode } from "jwt-decode";

type JwtAuthPayload = {
  exp?: number;
  sub?: string;
  authorities?: string[]; // Spring Security: chứa permission codes của user
};

/** Decode JWT, trả về authorities[] (không throw) */
function getJwtAuthorities(token: string | null): string[] {
  if (!token) return [];
  try {
    const { authorities } = jwtDecode<JwtAuthPayload>(token);
    return Array.isArray(authorities) ? authorities : [];
  } catch {
    return [];
  }
}

/**
 * Hook kiểm tra phân quyền động.
 *
 * Nguyên tắc: KHÔNG check role slug — chỉ check permission codes.
 * Permissions được lấy từ API /me/permissions sau khi đăng nhập,
 * lưu vào store. Fallback về JWT authorities nếu store chưa có.
 */
export function usePermissions() {
  const { user, accessToken, permissions: storePermissions } = useAuthStore();

  /** Lấy toàn bộ permission codes của user hiện tại */
  const getAuthorities = useCallback((): string[] => {
    // Ưu tiên: permissions từ API (nguồn sự thật)
    if (storePermissions.length > 0) return storePermissions;

    // Fallback: decode từ JWT (dùng khi store chưa load xong)
    const fromJwt = getJwtAuthorities(accessToken);
    if (fromJwt.length > 0) return fromJwt;

    // Last resort: từ user object
    return (
      user?.permissions ??
      (typeof user?.role === "object" ? user?.role?.permissions : undefined) ??
      []
    );
  }, [storePermissions, accessToken, user]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      
      // Admin bypass: Nếu role là ADMIN thì luôn có quyền
      const role = (typeof user.role === "object" ? user.role.slug : user.role)?.toUpperCase() || "";
      if (role === "ADMIN" || role === "ROLE_ADMIN") return true;
      
      return getAuthorities().includes(permission);
    },
    [user, getAuthorities]
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => permissions.some(hasPermission),
    [hasPermission]
  );

  const hasAllPermissions = useCallback(
    (permissions: string[]): boolean => permissions.every(hasPermission),
    [hasPermission]
  );

  return { hasPermission, hasAnyPermission, hasAllPermissions };
}
