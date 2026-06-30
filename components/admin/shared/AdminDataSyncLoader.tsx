"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminDataSyncLoaderProps = {
  className?: string;
  message?: string;
};

export default function AdminDataSyncLoader({
  className,
  message = "ĐANG ĐỒNG BỘ DỮ LIỆU...",
}: AdminDataSyncLoaderProps) {
  return (
    <div
      className={cn(
        "flex min-h-[320px] flex-col items-center justify-center gap-6 bg-white px-6 text-center",
        className,
      )}
    >
      <Loader2 className="h-12 w-12 animate-spin text-blue-600/80" />
      <p className="text-[12px] font-medium uppercase tracking-[0.28em] text-slate-400">
        {message}
      </p>
    </div>
  );
}

