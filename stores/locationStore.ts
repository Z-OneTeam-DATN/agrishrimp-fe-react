import { create } from "zustand"
import type { UserLocation } from "@/app/types/branch.types"

interface LocationState {
  userLocation: UserLocation | null
  isLocating: boolean
  locationError: string | null

  setLocation: (location: UserLocation) => void
  clearLocation: () => void
  startLocating: () => void
  setError: (error: string) => void
}

// KHÔNG persist — vị trí thay đổi theo thời gian
export const useLocationStore = create<LocationState>()((set) => ({
  userLocation: null,
  isLocating: false,
  locationError: null,

  setLocation: (location) =>
    set({ userLocation: location, isLocating: false, locationError: null }),

  clearLocation: () =>
    set({ userLocation: null, isLocating: false, locationError: null }),

  startLocating: () => set({ isLocating: true, locationError: null }),

  setError: (error) => set({ locationError: error, isLocating: false }),
}))
