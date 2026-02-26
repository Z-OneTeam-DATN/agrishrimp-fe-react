"use client"

import { useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useLocationStore } from "@/stores/locationStore"
import { resolveUserLocation, getGPSLocation } from "@/app/services/locationService"

export function useUserLocation() {
  const { userLocation, isLocating, locationError, setLocation, startLocating, setError } =
    useLocationStore()

  const fetchLocation = useCallback(async () => {
    startLocating()
    try {
      const location = await resolveUserLocation()
      setLocation(location)
      if (location.source === "ip") {
        toast.warning("Đang dùng vị trí ước tính từ IP. Cho phép GPS để có kết quả chính xác hơn.")
      }
    } catch (err: any) {
      setError(err.message ?? "Không thể xác định vị trí")
    }
  }, [startLocating, setLocation, setError])

  /** Thử lại bằng GPS (user tự kích hoạt) */
  const refetch = useCallback(async () => {
    startLocating()
    try {
      const location = await getGPSLocation()
      setLocation(location)
    } catch (err: any) {
      setError(err.message ?? "Không thể lấy GPS")
      toast.error("Không thể lấy vị trí GPS. Vui lòng kiểm tra quyền truy cập.")
    }
  }, [startLocating, setLocation, setError])

  useEffect(() => {
    // Chỉ fetch khi chưa có location và không đang loading
    if (!userLocation && !isLocating) {
      fetchLocation()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { location: userLocation, isLocating, error: locationError, refetch }
}
