import { useAuthStore } from "@/stores/useAuthStore";
import { useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { isAdminRole } from "@/lib/roles";

type JwtAuthPayload = {
  exp?: number;
  sub?: string;
  authorities?: string[]; // Spring Security: chứa permission codes của user
};

type PermissionLike = string | { code?: string | null } | null | undefined;

function normalizePermissions(values?: PermissionLike[] | null): string[] {
  if (!Array.isArray(values)) return [];

  return values
    .map((value) => {
      if (typeof value === "string") return value;
      if (value && typeof value === "object") return value.code ?? "";
      return "";
    })
    .filter(Boolean);
}

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
 * Nguyên tắc: check permission codes, không phụ thuộc vào tên vai trò.
 * Permissions được lấy từ API /me/permissions sau khi đăng nhập,
 * lưu vào store. Fallback về JWT authorities nếu store chưa có.
 */
export function usePermissions() {
  const { user, accessToken, permissions: storePermissions, isLoadingAuth } = useAuthStore();

  /** Lấy toàn bộ permission codes của user hiện tại */
  const getAuthorities = useCallback((): string[] => {
    // Ưu tiên: permissions từ API (nguồn sự thật)
    const fromStore = normalizePermissions(storePermissions);
    if (fromStore.length > 0) return fromStore;

    // Fallback: decode từ JWT (dùng khi store chưa load xong)
    const fromJwt = getJwtAuthorities(accessToken);
    if (fromJwt.length > 0) return fromJwt;

    // Last resort: từ user object
    const fromUser = normalizePermissions(user?.permissions as PermissionLike[]);
    if (fromUser.length > 0) return fromUser;

    return normalizePermissions(
      typeof user?.role === "object"
        ? (user.role.permissions as PermissionLike[])
        : undefined
    );
  }, [storePermissions, accessToken, user]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      if (isAdminRole(user.role)) return true;
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

  return { hasPermission, hasAnyPermission, hasAllPermissions, isLoadingAuth };
}
