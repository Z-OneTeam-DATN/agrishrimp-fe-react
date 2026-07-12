import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminDataSyncLoaderProps = {
  className?: string;
  message?: string;
};

export default function AdminDataSyncLoader({
  className,
  message,
}: AdminDataSyncLoaderProps) {
  return (
    <div
      className={cn(
        "flex min-h-[140px] items-center justify-center bg-white px-6 py-10",
        className,
      )}
    >
      <div className="flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-9 w-9 animate-spin text-blue-600/80" />
        {message ? (
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}

