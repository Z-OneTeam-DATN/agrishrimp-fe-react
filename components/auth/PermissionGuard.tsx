"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/stores/useAuthStore";
import type { PermissionCode } from "@/lib/permissions";

interface PermissionGuardProps {
  /** Yêu cầu 1 quyền cụ thể */
  permission?: PermissionCode | string;
  /** Yêu cầu có ít nhất 1 trong các quyền */
  anyOf?: (PermissionCode | string)[];
  /** Trang redirect khi không có quyền (mặc định: /admin/forbidden) */
  redirectTo?: string;
  children: React.ReactNode;
}

/**
 * Bọc toàn bộ nội dung trang admin.
 * Nếu user không có quyền → redirect sang trang 403.
 * Nếu đang load auth → hiển thị skeleton.
 *
 * @example
 * // Bảo vệ trang quản lý nhân viên
 * export default function EmployeesPage() {
 *   return (
 *     <PermissionGuard permission="STAFF_VIEW">
 *       <EmployeeList />
 *     </PermissionGuard>
 *   );
 * }
 */
export function PermissionGuard({
  permission,
  anyOf,
  redirectTo = "/admin/forbidden",
  children,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission } = usePermissions();
  const { isLoadingAuth } = useAuthStore();
  const router = useRouter();

  const isAllowed = (() => {
    if (isLoadingAuth) return true; // chờ load xong mới quyết định
    if (permission) return hasPermission(permission);
    if (anyOf && anyOf.length > 0) return hasAnyPermission(anyOf);
    return true;
  })();

  useEffect(() => {
    if (!isLoadingAuth && !isAllowed) {
      router.replace(redirectTo);
    }
  }, [isLoadingAuth, isAllowed, redirectTo, router]);

  if (isLoadingAuth) {
    return <PageLoadingSkeleton />;
  }

  if (!isAllowed) {
    // Trả về null trong lúc chờ redirect
    return null;
  }

  return <>{children}</>;
}

function PageLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse p-6">
      <div className="h-8 bg-slate-200 rounded w-1/3" />
      <div className="h-4 bg-slate-200 rounded w-2/3" />
      <div className="grid grid-cols-3 gap-4 mt-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-200 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-slate-200 rounded-xl mt-4" />
    </div>
  );
}
