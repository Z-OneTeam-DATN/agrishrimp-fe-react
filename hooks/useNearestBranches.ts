"use client"

import { useQuery } from "@tanstack/react-query"
import { findNearestBranches } from "@/app/services/branchService"
import type { UserLocation } from "@/app/types/branch.types"

export function useNearestBranches(location: UserLocation | null) {
  return useQuery({
    queryKey: ["nearest-branches", location?.lat, location?.lng],
    queryFn: () =>
      findNearestBranches({
        lat: location!.lat,
        lng: location!.lng,
        radiusKm: Number(process.env.NEXT_PUBLIC_DEFAULT_RADIUS_KM ?? 15),
        limit: Number(process.env.NEXT_PUBLIC_MAX_BRANCHES ?? 5),
      }),
    enabled: !!location,
    staleTime: 5 * 60 * 1000, // 5 phút
    retry: 1,
  })
}
