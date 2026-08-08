"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2, Save, Ticket } from "lucide-react";

interface VoucherFormProps {
  onSubmit: (code: string) => void;
  isSubmitting?: boolean;
}

export default function VoucherForm({
  onSubmit,
  isSubmitting = false,
}: VoucherFormProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) {
      setError("Vui lòng nhập mã voucher");
      return;
    }

    onSubmit(code);
  };

  return (
    <div className="min-h-[500px] border border-gray-100 bg-white">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-6 py-4">
        <Link
          href="/voucher"
          className="text-gray-500 transition-colors hover:text-[#1965a2]"
        >
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-bold text-gray-800">Lưu mã voucher</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 p-6 pb-20">
        <div>
          <h6 className="mb-2 text-[15px] font-medium text-gray-900">
            Nhập voucher
          </h6>
          <p className="text-sm text-gray-500">
            Nhập mã voucher bạn sưu tầm được để lưu vào ví và sử dụng khi thanh
            toán.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold text-gray-700">
            Mã voucher <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Ticket size={18} />
            </div>

            <input
              type="text"
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                if (error) setError("");
              }}
              className={`h-10 w-full rounded-lg border bg-white pl-10 pr-4 text-sm font-medium uppercase text-gray-900 outline-none transition-all placeholder:normal-case placeholder:text-gray-400 ${
                error
                  ? "border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-gray-300 focus:border-[#1965a2] focus:ring-2 focus:ring-[#1965a2]/20"
              }`}
              placeholder="VD: SALE50, AGRI2025..."
              autoFocus
            />
          </div>
          {error && (
            <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-10 bg-white p-4 shadow-lg lg:relative lg:p-0 lg:shadow-none">
          <div className="flex gap-3">
            <Link href="/voucher" className="flex-1">
              <button
                type="button"
                className="h-12 w-full rounded-lg bg-gray-100 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-200"
              >
                Hủy bỏ
              </button>
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-[#1965a2] text-sm font-bold text-white shadow-md transition-all hover:bg-[#145486] disabled:opacity-70"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              {isSubmitting ? "Đang lưu..." : "Lưu vào ví"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
