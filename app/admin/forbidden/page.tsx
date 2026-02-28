"use client";

import Link from "next/link";
import { ShieldX, ArrowLeft, Home } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";

export default function ForbiddenPage() {
  const { user } = useAuthStore();
  const displayName = user?.displayName || user?.fullName || "Bạn";

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center">
            <ShieldX className="w-12 h-12 text-red-400" />
          </div>
        </div>

        {/* Code */}
        <p className="text-[80px] font-black text-slate-200 leading-none select-none">
          403
        </p>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-800">
            Không có quyền truy cập
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            {displayName}, tài khoản của bạn chưa được cấp quyền xem trang này.
            <br />
            Vui lòng liên hệ quản trị viên nếu bạn cần quyền truy cập.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft size={16} />
            Quay lại
          </button>
          <Link
            href="/admin"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Home size={16} />
            Về trang chủ
          </Link>
        </div>

        {/* Footer note */}
        <p className="text-xs text-slate-400 pt-4 border-t border-slate-200">
          Nếu bạn cho rằng đây là lỗi, hãy liên hệ{" "}
          <span className="text-emerald-600 font-medium">quản trị viên hệ thống</span>.
        </p>
      </div>
    </div>
  );
}
