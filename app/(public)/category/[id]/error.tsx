"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";

export default function CategoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Category Page Error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
        <AlertCircle size={32} />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Đã xảy ra lỗi khi tải danh mục</h2>
      <p className="text-gray-500 mb-8 max-w-md">
        Chúng tôi rất tiếc vì sự cố này. Vui lòng thử lại hoặc quay về trang chủ.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 bg-teal-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-teal-700 transition-colors"
        >
          <RefreshCcw size={18} /> Thử lại
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-bold hover:bg-gray-50 transition-colors"
        >
          <Home size={18} /> Trang chủ
        </Link>
      </div>
    </div>
  );
}
