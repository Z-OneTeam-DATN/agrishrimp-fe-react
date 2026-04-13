"use client";

import { useAuthStore } from "@/stores/useAuthStore";
import AdminAccessDenied from "@/components/admin/shared/AdminAccessDenied";

export default function ForbiddenPage() {
  const { user } = useAuthStore();
  const displayName = user?.displayName || user?.fullName || "Bạn";

  return (
    <AdminAccessDenied
      title="Bạn không có quyền truy cập"
      description={`${displayName}, tài khoản của bạn chưa được cấp quyền xem trang này. Vui lòng liên hệ quản trị viên nếu bạn cần quyền truy cập.`}
    />
  );
}
