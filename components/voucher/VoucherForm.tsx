"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Ticket, Save } from "lucide-react";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Vui lòng nhập mã voucher");
      return;
    }
    onSubmit(code);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Header Form */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50">
        <Link
          href="/voucher"
          className="text-gray-500 hover:text-[#2d9f8d] transition-colors"
        >
          <ChevronLeft size={24} />
        </Link>
        <h1 className="font-bold text-gray-800 text-lg">Lưu mã Voucher</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-6 pb-20">
        {" "}
        {/* Added pb-20 */}
        <p className="text-sm text-gray-500 mb-6">
          Nhập mã voucher bạn sưu tầm được để lưu vào ví và sử dụng khi thanh
          toán.
        </p>
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Mã Voucher <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Ticket size={18} />
            </div>

            {/* Input đã được fix nền trắng, chữ đen để tránh lỗi Dark Mode */}
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (error) setError("");
              }}
              className={`w-full pl-10 pr-4 h-12 border rounded-lg outline-none transition-all 
                bg-white text-gray-900 placeholder:text-gray-400 font-medium uppercase placeholder:normal-case
                ${
                  error
                    ? "border-red-500 focus:ring-2 focus:ring-red-200"
                    : "border-gray-300 focus:border-[#2d9f8d] focus:ring-2 focus:ring-[#2d9f8d]/20"
                }`}
              placeholder="VD: SALE50, AGRI2025..."
              autoFocus
            />
          </div>
          {error && (
            <p className="text-xs text-red-500 mt-1.5 font-medium">{error}</p>
          )}
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white shadow-lg lg:relative lg:p-0 lg:bg-transparent lg:shadow-none z-10">
          <div className="flex gap-3">
            <Link href="/voucher" className="flex-1">
              <button
                type="button"
                className="w-full h-12 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Hủy bỏ
              </button>
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-12 text-sm font-bold text-white bg-[#2d9f8d] hover:bg-[#248273] rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <Save size={18} /> {isSubmitting ? "Đang lưu..." : "Lưu vào ví"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
