"use client";

import Link from "next/link";
import { ArrowLeft, Home, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

type AdminAccessDeniedProps = {
  title?: string;
  description?: string;
  compact?: boolean;
};

export default function AdminAccessDenied({
  title = "Bạn không có quyền truy cập",
  description = "Tài khoản của bạn chưa được cấp quyền xem khu vực này. Vui lòng liên hệ quản trị viên nếu bạn cần quyền truy cập.",
  compact = false,
}: AdminAccessDeniedProps) {
  return (
    <div
      className={
        compact
          ? "flex min-h-[60vh] items-center justify-center p-6"
          : "min-h-screen bg-[#f1f5f9] flex items-center justify-center p-6"
      }
    >
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center">
            <ShieldX className="w-12 h-12 text-red-400" />
          </div>
        </div>

        {!compact && (
          <p className="text-[80px] font-black text-slate-200 leading-none select-none">
            403
          </p>
        )}

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
          <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
        </div>

        <div className="flex gap-3 justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Quay lại
          </Button>
          <Link href="/admin">
            <Button type="button" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Home size={16} />
              Về trang chủ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
