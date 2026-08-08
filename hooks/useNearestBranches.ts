"use client"

import { useQuery } from "@tanstack/react-query"
import { findNearestBranches } from "@/app/services/branchService"
import type { UserLocation } from "@/app/types/branch.types"

export function useNearestBranches(location: UserLocation | null) {
  const radiusKm = Number(process.env.NEXT_PUBLIC_DEFAULT_RADIUS_KM ?? 15)
  const limit = Number(process.env.NEXT_PUBLIC_MAX_BRANCHES ?? 5)

  return useQuery({
    queryKey: ["nearest-branches", location?.lat, location?.lng, radiusKm, limit],
    queryFn: () =>
      findNearestBranches({
        lat: location!.lat,
        lng: location!.lng,
        radiusKm,
        limit,
      }),
    enabled: !!location,
    staleTime: 0,
    refetchOnMount: "always",
    retry: 1,
  })
}
