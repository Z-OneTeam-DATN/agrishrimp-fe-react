"use client";

import { Loader2 } from "lucide-react";

type LoadMoreButtonProps = {
  onClick: () => void;
  loading?: boolean;
  label?: string;
};

export default function LoadMoreButton({
  onClick,
  loading = false,
  label = "Xem thêm",
}: LoadMoreButtonProps) {
  return (
    <div className="mt-8 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="inline-flex min-w-[220px] items-center justify-center rounded-full bg-[#d6ebde] px-8 py-3 text-lg font-bold text-[#3d6e5d] shadow-sm transition-all hover:bg-[#c8e3d3] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? <Loader2 size={20} className="animate-spin" /> : label}
      </button>
    </div>
  );
}
