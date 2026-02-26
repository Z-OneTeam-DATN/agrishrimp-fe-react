"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { MapPin, Loader2, Navigation } from "lucide-react"
import { toast } from "sonner"
import { locationService } from "@/app/services/address.service"
import { resolveUserLocation } from "@/app/services/locationService"
import type { DeliveryInfo } from "@/app/types/order.types"

const deliverySchema = z.object({
  address: z.string().min(5, "Địa chỉ quá ngắn (tối thiểu 5 ký tự)"),
  districtId: z.number({ required_error: "Vui lòng chọn quận/huyện" }).min(1, "Vui lòng chọn quận/huyện"),
  wardCode: z.string().min(1, "Vui lòng chọn phường/xã"),
  districtName: z.string().optional(),
  wardName: z.string().optional(),
})

type DeliveryFormValues = z.infer<typeof deliverySchema>

interface District {
  id: number
  name: string
}

interface Ward {
  id: number
  code: string
  name: string
}

interface DeliveryAddressFormProps {
  onSubmit: (info: DeliveryInfo) => void
  defaultValues?: DeliveryInfo
}

export function DeliveryAddressForm({ onSubmit, defaultValues }: DeliveryAddressFormProps) {
  const [districts, setDistricts] = useState<District[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false)
  const [isLoadingWards, setIsLoadingWards] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  // Can Tho province ID (hardcoded — chỉ phục vụ khu vực Cần Thơ)
  const PROVINCE_ID = 92

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      address: defaultValues?.address ?? "",
      districtId: defaultValues?.districtId ?? 0,
      wardCode: defaultValues?.wardCode ?? "",
      districtName: defaultValues?.districtName ?? "",
      wardName: defaultValues?.wardName ?? "",
    },
  })

  const selectedDistrictId = watch("districtId")

  // Load districts on mount
  useEffect(() => {
    const loadDistricts = async () => {
      setIsLoadingDistricts(true)
      try {
        const data = await locationService.getDistricts(PROVINCE_ID)
        setDistricts(data ?? [])
      } catch {
        toast.error("Không thể tải danh sách quận/huyện")
      } finally {
        setIsLoadingDistricts(false)
      }
    }
    loadDistricts()
  }, [])

  // Load wards when district changes
  useEffect(() => {
    if (!selectedDistrictId || selectedDistrictId === 0) {
      setWards([])
      return
    }
    const loadWards = async () => {
      setIsLoadingWards(true)
      try {
        const data = await locationService.getWards(selectedDistrictId)
        setWards(data ?? [])
        setValue("wardCode", "")
        setValue("wardName", "")
      } catch {
        toast.error("Không thể tải danh sách phường/xã")
      } finally {
        setIsLoadingWards(false)
      }
    }
    loadWards()
  }, [selectedDistrictId, setValue])

  const handleUseCurrentLocation = async () => {
    setIsGettingLocation(true)
    try {
      await resolveUserLocation()
      toast.info("Đã xác định vị trí. Vui lòng chọn quận/huyện và phường/xã phù hợp.")
    } catch {
      toast.error("Không thể lấy vị trí hiện tại")
    } finally {
      setIsGettingLocation(false)
    }
  }

  const onFormSubmit = (values: DeliveryFormValues) => {
    const selectedDistrict = districts.find((d) => d.id === values.districtId)
    const selectedWard = wards.find((w) => w.code === values.wardCode)

    onSubmit({
      address: values.address,
      districtId: values.districtId,
      wardCode: values.wardCode,
      districtName: selectedDistrict?.name,
      wardName: selectedWard?.name,
    })
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Địa chỉ cụ thể */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Địa chỉ cụ thể <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            {...register("address")}
            type="text"
            placeholder="Số nhà, tên đường..."
            className={`w-full pl-8 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-teal-400 ${
              errors.address ? "border-red-300 bg-red-50" : "border-gray-200"
            }`}
          />
        </div>
        {errors.address && (
          <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>
        )}
      </div>

      {/* Tỉnh/Thành phố — hardcode Cần Thơ */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Tỉnh/Thành phố
        </label>
        <div className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500">
          Cần Thơ
        </div>
      </div>

      {/* Quận/Huyện */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Quận/Huyện <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            {...register("districtId", { valueAsNumber: true })}
            disabled={isLoadingDistricts}
            className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-teal-400 appearance-none bg-white ${
              errors.districtId ? "border-red-300 bg-red-50" : "border-gray-200"
            } ${isLoadingDistricts ? "opacity-60" : ""}`}
          >
            <option value={0}>
              {isLoadingDistricts ? "Đang tải..." : "Chọn quận/huyện"}
            </option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          {isLoadingDistricts && (
            <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
          )}
        </div>
        {errors.districtId && (
          <p className="text-xs text-red-500 mt-1">{errors.districtId.message}</p>
        )}
      </div>

      {/* Phường/Xã */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Phường/Xã <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            {...register("wardCode")}
            disabled={isLoadingWards || !selectedDistrictId}
            className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-teal-400 appearance-none bg-white ${
              errors.wardCode ? "border-red-300 bg-red-50" : "border-gray-200"
            } ${isLoadingWards || !selectedDistrictId ? "opacity-60" : ""}`}
          >
            <option value="">
              {isLoadingWards
                ? "Đang tải..."
                : !selectedDistrictId
                ? "Chọn quận/huyện trước"
                : "Chọn phường/xã"}
            </option>
            {wards.map((w) => (
              <option key={w.code} value={w.code}>
                {w.name}
              </option>
            ))}
          </select>
          {isLoadingWards && (
            <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
          )}
        </div>
        {errors.wardCode && (
          <p className="text-xs text-red-500 mt-1">{errors.wardCode.message}</p>
        )}
      </div>

      {/* Nút dùng vị trí hiện tại */}
      <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={isGettingLocation}
        className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium disabled:opacity-50"
      >
        {isGettingLocation ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Navigation size={14} />
        )}
        Dùng vị trí hiện tại
      </button>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Tiếp tục
      </button>
    </form>
  )
}
