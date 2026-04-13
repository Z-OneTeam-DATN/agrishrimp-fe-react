"use client";

import { useAuthStore } from "@/stores/useAuthStore";
import { useMemo } from "react";
import { isAdminRole, normalizeRoleSlug } from "@/lib/roles";

/**
 * useWarehouseFilter Hook
 * Filters a list of data based on the current user's warehouseId.
 * - ADMIN: Sees all data by default.
 * - MANAGER: Sees only data belonging to their warehouseId.
 */
export function useWarehouseFilter<T extends { warehouseId?: number | string }>(
  data: T[] | undefined
) {
  const { user } = useAuthStore();
  
  // Normalize user role and warehouseId
  const role = normalizeRoleSlug(user?.role);
  const userWarehouseId = (user as any)?.warehouseId;

  const filteredData = useMemo(() => {
    if (!data) return [];
    
    // If Admin, return all data
    if (isAdminRole(user?.role)) return data;
    
    // If Manager, filter by their warehouseId
    if (role === "MANAGER" && userWarehouseId) {
      return data.filter(item => String(item.warehouseId) === String(userWarehouseId));
    }
    
    // Default fallback (e.g. for regular users or if role is missing)
    return [];
  }, [data, role, userWarehouseId]);

  return filteredData;
}
