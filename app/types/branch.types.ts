export interface NearestBranch {
  id: number
  name: string
  addressText: string
  phone: string
  distanceKm: number
  durationMinutes: number
}

export interface FindNearestBranchPayload {
  lat: number
  lng: number
  radiusKm?: number
  limit?: number
}

export interface UserLocation {
  lat: number
  lng: number
  source: 'gps' | 'ip' | 'manual'
  city?: string
}
