"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { MapPin, Loader2, Navigation, ChevronDown } from "lucide-react"
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
  code: string // GHN WardCode, e.g. "550113"
  name: string
}

interface DeliveryAddressFormProps {
  onSubmit: (info: DeliveryInfo) => void
  defaultValues?: DeliveryInfo
  submitLabel?: string
  submitDisabled?: boolean
}

export function DeliveryAddressForm({ onSubmit, defaultValues, submitLabel = "Xác nhận địa chỉ", submitDisabled = false }: DeliveryAddressFormProps) {
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
  const selectedWardCode = watch("wardCode")

  // Auto-fill address logic
  useEffect(() => {
    if (selectedDistrictId && selectedWardCode) {
      const selectedDistrict = districts.find(d => d.id === selectedDistrictId)
      const selectedWard = wards.find(w => w.code === selectedWardCode)
      
      if (selectedDistrict && selectedWard) {
        // Only auto-fill if the current address is empty or just matches the previous auto-fill
        const currentAddress = watch("address")
        const autoFillValue = `${selectedWard.name}, ${selectedDistrict.name}, Cần Thơ`
        
        // If user hasn't typed anything yet, or current value is part of the sequence
        if (!currentAddress || currentAddress.includes(selectedDistrict.name) || currentAddress.includes(selectedWard.name)) {
          setValue("address", autoFillValue)
        }
      }
    }
  }, [selectedDistrictId, selectedWardCode, districts, wards, setValue])

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
        // Reset ward but don't clear address if it was manually edited
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
      {/* Nút dùng vị trí hiện tại - Shopee style: placed near address */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isGettingLocation}
          className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-semibold disabled:opacity-50"
        >
          {isGettingLocation ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Navigation size={12} />
          )}
          Sử dụng vị trí hiện tại
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Tỉnh/Thành phố — hardcode Cần Thơ */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Tỉnh/Thành phố
          </label>
          <div className="w-full px-3 py-2 border border-gray-100 rounded-sm text-sm bg-gray-50 text-gray-500 font-medium">
            Cần Thơ
          </div>
        </div>

        {/* Quận/Huyện */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Quận/Huyện <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              {...register("districtId", { valueAsNumber: true })}
              disabled={isLoadingDistricts}
              className={`w-full px-3 py-2 border rounded-sm text-sm focus:outline-none focus:border-teal-400 appearance-none bg-white font-medium ${
                errors.districtId ? "border-red-300 bg-red-50" : "border-gray-200"
              } ${isLoadingDistricts ? "opacity-60" : ""}`}
            >
              <option value={0}>
                {isLoadingDistricts ? "Đang tải..." : "Chọn Quận/Huyện"}
              </option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
               {isLoadingDistricts ? <Loader2 size={12} className="animate-spin" /> : <ChevronDown size={14} />}
            </div>
          </div>
          {errors.districtId && (
            <p className="text-[10px] text-red-500 mt-1">{errors.districtId.message}</p>
          )}
        </div>

        {/* Phường/Xã */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Phường/Xã <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              {...register("wardCode")}
              disabled={isLoadingWards || !selectedDistrictId}
              className={`w-full px-3 py-2 border rounded-sm text-sm focus:outline-none focus:border-teal-400 appearance-none bg-white font-medium ${
                errors.wardCode ? "border-red-300 bg-red-50" : "border-gray-200"
              } ${isLoadingWards || !selectedDistrictId ? "opacity-60" : ""}`}
            >
              <option value="">
                {isLoadingWards
                  ? "Đang tải..."
                  : !selectedDistrictId
                  ? "Chọn Quận/Huyện trước"
                  : "Chọn Phường/Xã"}
              </option>
              {wards.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
               {isLoadingWards ? <Loader2 size={12} className="animate-spin" /> : <ChevronDown size={14} />}
            </div>
          </div>
          {errors.wardCode && (
            <p className="text-[10px] text-red-500 mt-1">{errors.wardCode.message}</p>
          )}
        </div>
      </div>

      {/* Địa chỉ cụ thể */}
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
          Địa chỉ cụ thể <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            {...register("address")}
            type="text"
            placeholder="Số nhà, tên đường..."
            className={`w-full pl-9 pr-3 py-2.5 border rounded-sm text-sm focus:outline-none focus:border-teal-400 font-medium ${
              errors.address ? "border-red-300 bg-red-50" : "border-gray-200"
            }`}
          />
        </div>
        {errors.address && (
          <p className="text-[10px] text-red-500 mt-1">{errors.address.message}</p>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting || submitDisabled}
          className="px-8 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-sm transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
