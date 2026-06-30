"use client";

import { useRouter } from "next/navigation";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function ProfilePasswordPage() {
  const router = useRouter();
  const { data: user } = useCurrentUser();

  if (user?.provider === "GOOGLE") {
    return (
      <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
        <h1 className="mb-3 text-lg font-bold text-gray-800">Đổi mật khẩu</h1>
        <p className="text-sm text-gray-600">
          Tài khoản Google không sử dụng mật khẩu nội bộ của hệ thống.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
      <h1 className="mb-6 border-b border-gray-100 pb-3 text-lg font-bold text-gray-800">
        Đổi mật khẩu
      </h1>

      <ChangePasswordForm
        onCancel={() => router.push("/edit-profile")}
        onSuccess={() => router.push("/edit-profile")}
      />
    </div>
  );
}
