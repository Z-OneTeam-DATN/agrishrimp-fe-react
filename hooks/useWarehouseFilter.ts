"use client";

import { useAuthStore } from "@/stores/useAuthStore";
import { useMemo } from "react";

/**
 * useWarehouseFilter Hook
 * Filters a list of data based on the current user's branch/warehouse scope.
 * - Tài khoản không gắn kho/chi nhánh: thấy toàn bộ dữ liệu.
 * - Tài khoản có warehouseId: chỉ thấy dữ liệu thuộc kho đó.
 */
export function useWarehouseFilter<T extends { warehouseId?: number | string }>(
  data: T[] | undefined
) {
  const { warehouseId } = useAuthStore();

  const filteredData = useMemo(() => {
    if (!data) return [];

    if (!warehouseId) {
      return data;
    }

    return data.filter(
      (item) => String(item.warehouseId) === String(warehouseId),
    );
  }, [data, warehouseId]);

  return filteredData;
}
