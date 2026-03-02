"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressSchema, AddressFormValues } from "@/app/types/address.schema";
import { locationService } from "@/app/services/address.service";
import { Save, ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface AddressFormProps {
  initialValues?: AddressFormValues;
  onSubmit: (data: AddressFormValues) => void;
  onCancel?: () => void;
  title: string;
  isSubmitting?: boolean;
  compact?: boolean;
}

interface ProvinceOption {
  id: number;
  name: string;
}

interface DistrictOption {
  id: number;
  name: string;
}

interface WardOption {
  code: string; // GHN WardCode, e.g. "550113"
  name: string;
}

export default function AddressForm({
  initialValues,
  onSubmit,
  onCancel,
  title,
  isSubmitting = false,
  compact = false,
}: AddressFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: initialValues || {
      fullName: "",
      phone: "",
      provinceId: "",
      districtId: "",
      wardCode: "",
      specificAddress: "",
      addressType: "Home",
      isDefault: false,
    },
  });

  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [wards, setWards] = useState<WardOption[]>([]);
  const [loadingLoc, setLoadingLoc] = useState(false);

  const provinceId = watch("provinceId");
  const districtId = watch("districtId");
  const wardCode = watch("wardCode");
  const specificAddress = watch("specificAddress");

  // Tải danh sách tỉnh/thành từ GHN
  useEffect(() => {
    locationService.getProvinces()
      .then((data) => setProvinces(data ?? []))
      .catch((err) => console.error("Lỗi tải tỉnh thành:", err));
  }, []);

  // Tải quận/huyện khi đổi tỉnh
  useEffect(() => {
    if (!provinceId) {
      setDistricts([]);
      return;
    }
    setLoadingLoc(true);
    locationService.getDistricts(Number(provinceId))
      .then((data) => setDistricts(data ?? []))
      .catch((err) => console.error("Lỗi tải quận/huyện:", err))
      .finally(() => setLoadingLoc(false));
  }, [provinceId]);

  // Tải phường/xã khi đổi quận/huyện
  useEffect(() => {
    if (!districtId) {
      setWards([]);
      return;
    }
    setLoadingLoc(true);
    locationService.getWards(Number(districtId))
      .then((data) => setWards(data ?? []))
      .catch((err) => console.error("Lỗi tải phường/xã:", err))
      .finally(() => setLoadingLoc(false));
  }, [districtId]);

  // Tự động ghép chuỗi địa chỉ khi chọn đủ 3 cấp
  useEffect(() => {
    if (provinceId && districtId && wardCode) {
      const selectedProvince = provinces.find((p) => p.id.toString() === provinceId.toString());
      const selectedDistrict = districts.find((d) => d.id.toString() === districtId.toString());
      const selectedWard = wards.find((w) => w.code === wardCode);

      if (selectedProvince && selectedDistrict && selectedWard) {
        const autoString = `${selectedWard.name}, ${selectedDistrict.name}, ${selectedProvince.name}`;
        const currentStreet = specificAddress?.split(",")[0]?.trim() || "";
        const newAddress =
          currentStreet && currentStreet !== selectedWard.name
            ? `${currentStreet}, ${autoString}`
            : autoString;
        setValue("specificAddress", newAddress, { shouldValidate: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wardCode, provinces, districts, wards]);

  const inputClass = (hasError: boolean) => `
    w-full px-3 border rounded-lg text-sm outline-none transition-all bg-white text-gray-900 placeholder:text-gray-400
    ${compact ? "h-9" : "h-12"}
    ${hasError ? "border-red-500 focus:ring-2 focus:ring-red-200" : "border-gray-300 focus:border-[#329965] focus:ring-2 focus:ring-[#329965]/20"}
  `;

  const labelClass = `block text-xs font-bold text-gray-700 ${compact ? "mb-1" : "mb-2"}`;

  return (
    <div className={`bg-white ${compact ? "" : "rounded-lg shadow-sm border border-gray-100 overflow-hidden"}`}>
      {/* Header — ẩn khi compact */}
      {!compact && (
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50">
          {onCancel ? (
            <button type="button" onClick={onCancel} className="text-gray-500 hover:text-[#329965] transition-colors">
              <ChevronLeft size={24} />
            </button>
          ) : (
            <Link href="/address" className="text-gray-500 hover:text-[#329965] transition-colors">
              <ChevronLeft size={24} />
            </Link>
          )}
          <h1 className="font-bold text-gray-800 text-lg">{title}</h1>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className={compact ? "p-4 space-y-3" : "p-6 space-y-6 pb-20"}>
        {/* Họ tên & SĐT */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Họ và tên <span className="text-red-500">*</span></label>
            <input {...register("fullName")} className={inputClass(!!errors.fullName)} placeholder="Nguyễn Văn A" />
            {errors.fullName && <span className="text-xs text-red-500 mt-0.5 block">{errors.fullName.message}</span>}
          </div>
          <div>
            <label className={labelClass}>Số điện thoại <span className="text-red-500">*</span></label>
            <input {...register("phone")} className={inputClass(!!errors.phone)} placeholder="0909..." />
            {errors.phone && <span className="text-xs text-red-500 mt-0.5 block">{errors.phone.message}</span>}
          </div>
        </div>

        {/* Tỉnh / Quận / Phường */}
        <div className="grid grid-cols-3 gap-2 relative">
          {loadingLoc && (
            <div className="absolute -top-5 right-0 flex items-center text-xs text-[#329965]">
              <Loader2 size={12} className="animate-spin mr-1" /> Đang tải...
            </div>
          )}

          {/* Tỉnh/Thành */}
          <div>
            <label className={labelClass}>Tỉnh/Thành <span className="text-red-500">*</span></label>
            <select
              {...register("provinceId", {
                onChange: () => {
                  setValue("districtId", "");
                  setValue("wardCode", "");
                },
              })}
              className={inputClass(!!errors.provinceId)}
            >
              <option value="">Chọn Tỉnh/Thành</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.provinceId && <span className="text-xs text-red-500 mt-0.5 block">{errors.provinceId.message}</span>}
          </div>

          {/* Quận/Huyện */}
          <div>
            <label className={labelClass}>Quận/Huyện <span className="text-red-500">*</span></label>
            <select
              {...register("districtId", {
                onChange: () => setValue("wardCode", ""),
              })}
              disabled={!provinceId}
              className={`${inputClass(!!errors.districtId)} disabled:bg-gray-100 disabled:text-gray-400`}
            >
              <option value="">Chọn Quận/Huyện</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            {errors.districtId && <span className="text-xs text-red-500 mt-0.5 block">{errors.districtId.message}</span>}
          </div>

          {/* Phường/Xã — value = WardCode (string) */}
          <div>
            <label className={labelClass}>Phường/Xã <span className="text-red-500">*</span></label>
            <select
              {...register("wardCode")}
              disabled={!districtId}
              className={`${inputClass(!!errors.wardCode)} disabled:bg-gray-100 disabled:text-gray-400`}
            >
              <option value="">Chọn Phường/Xã</option>
              {wards.map((w) => (
                <option key={w.code} value={w.code}>{w.name}</option>
              ))}
            </select>
            {errors.wardCode && <span className="text-xs text-red-500 mt-0.5 block">{errors.wardCode.message}</span>}
          </div>
        </div>

        {/* Địa chỉ cụ thể */}
        <div>
          <label className={labelClass}>Địa chỉ cụ thể <span className="text-red-500">*</span></label>
          <textarea
            {...register("specificAddress")}
            rows={compact ? 2 : 3}
            className={inputClass(!!errors.specificAddress)}
            placeholder="Số nhà, tên đường..."
          />
          {errors.specificAddress && <span className="text-xs text-red-500 mt-0.5 block">{errors.specificAddress.message}</span>}
        </div>

        {/* Loại địa chỉ & Mặc định */}
        <div className={`flex flex-wrap gap-2 ${compact ? "" : "flex-col"}`}>
          <div className="flex gap-2 flex-1">
            {["Home", "Office"].map((type) => (
              <label
                key={type}
                className={`flex-1 text-center py-1.5 px-3 rounded-lg border cursor-pointer transition-colors text-sm flex items-center justify-center
                  ${watch("addressType") === type ? "bg-[#eafef9] border-[#2d9f8d] text-[#2d9f8d] font-bold" : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"}`}
              >
                <input type="radio" value={type} {...register("addressType")} className="hidden" />
                {type === "Home" ? "Nhà riêng" : "Văn phòng"}
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 bg-white border border-gray-300 rounded-lg">
            <input type="checkbox" {...register("isDefault")} className="w-4 h-4 cursor-pointer accent-[#329965] rounded" />
            <span className="text-sm text-gray-700">Đặt làm mặc định</span>
          </label>
        </div>

        {/* Footer Actions */}
        <div className={compact ? "flex gap-2 pt-1" : "fixed bottom-0 left-0 right-0 p-4 bg-white shadow-lg lg:relative lg:p-0 lg:bg-transparent lg:shadow-none z-10"}>
          <div className={`flex gap-3 ${compact ? "w-full" : ""}`}>
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className={`flex-1 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors ${compact ? "py-2" : "h-12"}`}
              >
                Hủy bỏ
              </button>
            ) : (
              <Link href="/address" className="flex-1">
                <button type="button" className={`w-full text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors ${compact ? "py-2" : "h-12"}`}>
                  Hủy bỏ
                </button>
              </Link>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 text-sm font-bold text-white bg-[#329965] hover:bg-[#268050] rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 ${compact ? "py-2" : "h-12"}`}
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              {isSubmitting ? "Đang lưu..." : "Lưu địa chỉ"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
