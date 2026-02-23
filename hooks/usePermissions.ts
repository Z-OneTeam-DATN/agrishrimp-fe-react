import { useAuthStore } from "@/stores/useAuthStore";
import { useCallback } from "react";
import { jwtDecode } from "jwt-decode";

type JwtAuthPayload = {
  exp?: number;
  sub?: string;
  // Spring Security standard: ROLE_ADMIN, USER_MANAGE, USER_CREATE...
  authorities?: string[];
  // Fallback formats
  roles?: string[];
  permissions?: string[];
  scope?: string;
  role?: string;
};

/** Decode JWT và trả về danh sách authorities (không throw) */
function getJwtAuthorities(token: string | null): string[] {
  if (!token) return [];
  try {
    const decoded = jwtDecode<JwtAuthPayload>(token);
    return (
      decoded.authorities ||
      decoded.roles ||
      decoded.permissions ||
      (decoded.scope ? decoded.scope.split(" ") : []) ||
      (decoded.role ? [decoded.role] : []) ||
      []
    );
  } catch {
    return [];
  }
}

export function usePermissions() {
  const { user, accessToken } = useAuthStore();

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) return false;

      // 1. Check role object slug (set nếu Java backend trả về slug)
      const roleSlug =
        typeof user.role === "object" ? user.role?.slug : user.role;
      if (
        roleSlug?.toLowerCase() === "admin" ||
        roleSlug?.toLowerCase() === "super_admin"
      )
        return true;

      // 2. Decode JWT để lấy authorities (Spring Security format)
      //    Ví dụ: ["ROLE_ADMIN", "USER_MANAGE", "USER_CREATE", "ROLE_MANAGE"]
      const jwtAuthorities = getJwtAuthorities(accessToken);
      if (jwtAuthorities.length > 0) {
        // Admin bypass qua JWT
        const isAdminInJwt = jwtAuthorities.some((a) => {
          const clean = a.replace(/^ROLE_/i, "").toLowerCase();
          return clean === "admin" || clean === "super_admin";
        });
        if (isAdminInJwt) return true;

        // Kiểm tra permission cụ thể trong JWT
        if (jwtAuthorities.includes(permission)) return true;
      }

      // 3. Fallback: kiểm tra permissions đã lưu trong store
      const storedPermissions =
        user.permissions ||
        (typeof user.role === "object" ? user.role?.permissions : []) ||
        [];
      return storedPermissions.includes(permission);
    },
    [user, accessToken]
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]) => {
      return permissions.some((p) => hasPermission(p));
    },
    [hasPermission]
  );

  const hasAllPermissions = useCallback(
    (permissions: string[]) => {
      return permissions.every((p) => hasPermission(p));
    },
    [hasPermission]
  );

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    role: user?.role,
  };
}
