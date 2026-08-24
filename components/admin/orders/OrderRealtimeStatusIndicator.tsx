"use client";

import { Loader2, Radio } from "lucide-react";
import {
  ORDER_REALTIME_STALE_AFTER_MS,
  isOrderRealtimeFallbackActive,
} from "@/lib/order-realtime";
import { cn } from "@/lib/utils";
import { useOrderRealtimeStore } from "@/stores/useOrderRealtimeStore";

type OrderRealtimeStatusIndicatorProps = {
  className?: string;
};

export function OrderRealtimeStatusIndicator({
  className,
}: OrderRealtimeStatusIndicatorProps) {
  const connectionState = useOrderRealtimeStore((state) => state.connectionState);
  const lastConnectedAt = useOrderRealtimeStore((state) => state.lastConnectedAt);
  const lastHeartbeatAt = useOrderRealtimeStore((state) => state.lastHeartbeatAt);
  const lastOrderEventAt = useOrderRealtimeStore((state) => state.lastOrderEventAt);

  const fallbackActive = isOrderRealtimeFallbackActive(
    {
      connectionState,
      lastConnectedAt,
      lastHeartbeatAt,
      lastOrderEventAt,
    },
    ORDER_REALTIME_STALE_AFTER_MS,
  );

  const isRecovering =
    connectionState === "connecting" || connectionState === "reconnecting";

  const title = fallbackActive
    ? isRecovering
      ? "Kết nối realtime đang phục hồi"
      : "Mất kết nối realtime"
    : connectionState === "connected"
      ? "Đang đồng bộ trực tiếp"
      : "Đang khởi tạo đồng bộ";

  const hint = fallbackActive
    ? "Trang đang tự đồng bộ nền."
    : "Đơn hàng mới sẽ tự hiển thị.";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-none border border-blue-100 bg-white px-3 py-2 text-left",
        className,
      )}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-none border border-blue-100 bg-blue-50 text-blue-600">
        {isRecovering ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Radio
            size={14}
            className={cn(
              "transition-opacity",
              fallbackActive ? "opacity-60" : "animate-pulse opacity-100",
            )}
          />
        )}
      </span>

      <div className="space-y-0.5">
        <p className="text-[12px] font-semibold text-blue-700">{title}</p>
        <p className="text-[11px] text-slate-500">{hint}</p>
      </div>
    </div>
  );
}
