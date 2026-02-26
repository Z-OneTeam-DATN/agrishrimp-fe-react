import type { UserLocation } from "@/app/types/branch.types"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000/api"

/** Lấy GPS từ trình duyệt (timeout 6s) */
export async function getGPSLocation(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Trình duyệt không hỗ trợ GPS"))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: "gps",
        })
      },
      (err) => {
        reject(new Error(err.message || "Không thể lấy vị trí GPS"))
      },
      { timeout: 6000, enableHighAccuracy: false }
    )
  })
}

/** Lấy vị trí từ IP qua Next.js API Route (server-side, không lộ ra client) */
export async function getIPLocation(): Promise<UserLocation> {
  const res = await fetch(`${APP_URL}/location`)
  if (!res.ok) {
    throw new Error("Không thể lấy vị trí từ IP")
  }
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return {
    lat: data.lat,
    lng: data.lng,
    city: data.city,
    source: "ip",
  }
}

/** Wrapper chính: thử GPS trước, fallback sang IP */
export async function resolveUserLocation(): Promise<UserLocation> {
  try {
    return await getGPSLocation()
  } catch {
    return await getIPLocation()
  }
}
