"use client";

import { usePermissions } from "@/hooks/usePermissions";
import type { PermissionCode } from "@/lib/permissions";

interface CanProps {
  /** Kiểm tra 1 quyền cụ thể */
  permission?: PermissionCode | string;
  /** Kiểm tra có ít nhất 1 trong các quyền (OR) */
  anyOf?: (PermissionCode | string)[];
  /** Kiểm tra phải có TẤT CẢ các quyền (AND) */
  allOf?: (PermissionCode | string)[];
  children: React.ReactNode;
  /** Nội dung thay thế khi không có quyền (mặc định: null = ẩn hoàn toàn) */
  fallback?: React.ReactNode;
}

/**
 * Component ẩn/hiện UI dựa trên quyền.
 *
 * @example
 * // Ẩn nút nếu không có quyền tạo nhân viên
 * <Can permission="STAFF_CREATE">
 *   <Button>Thêm nhân viên</Button>
 * </Can>
 *
 * @example
 * // Hiện UI thay thế nếu không có quyền
 * <Can permission="ORDER_REFUND" fallback={<span>Không có quyền hoàn tiền</span>}>
 *   <RefundButton />
 * </Can>
 *
 * @example
 * // Kiểm tra OR: có 1 trong các quyền
 * <Can anyOf={["REPORT_REVENUE_VIEW", "REPORT_FINANCE_VIEW"]}>
 *   <ReportSection />
 * </Can>
 */
export function Can({ permission, anyOf, allOf, children, fallback = null }: CanProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  let allowed = false;

  if (permission) {
    allowed = hasPermission(permission);
  } else if (anyOf && anyOf.length > 0) {
    allowed = hasAnyPermission(anyOf);
  } else if (allOf && allOf.length > 0) {
    allowed = hasAllPermissions(allOf);
  } else {
    // Không truyền prop nào → luôn hiển thị
    allowed = true;
  }

  return allowed ? <>{children}</> : <>{fallback}</>;
}
