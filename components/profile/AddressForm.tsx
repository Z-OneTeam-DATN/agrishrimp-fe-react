"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressSchema, AddressFormValues } from "@/app/types/address.schema";
import { Save, ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface AddressFormProps {
  initialValues?: AddressFormValues;
  onSubmit: (data: AddressFormValues) => void;
  title: string;
  isSubmitting?: boolean;
}

interface LocationOption {
  code: number;
  name: string;
}

export default function AddressForm({
  initialValues,
  onSubmit,
  title,
  isSubmitting = false,
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
      wardId: "",
      specificAddress: "",
      addressType: "Home",
      isDefault: false,
    },
  });

  // ✅ 1. CÁC STATE LƯU TRỮ DỮ LIỆU TỪ API CÔNG KHAI
  const [provinces, setProvinces] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [wards, setWards] = useState<LocationOption[]>([]);
  const [loadingLoc, setLoadingLoc] = useState(false);

  // Theo dõi giá trị các ô Select
  const provinceId = watch("provinceId");
  const districtId = watch("districtId");
  const wardId = watch("wardId");
  const specificAddress = watch("specificAddress");

  // ✅ 2. GỌI API LẤY 63 TỈNH THÀNH
  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/p/")
      .then((res) => res.json())
      .then((data) => setProvinces(data))
      .catch((err) => console.error("Lỗi tải tỉnh thành:", err));
  }, []);

  // ✅ 3. GỌI API LẤY QUẬN/HUYỆN KHI ĐỔI TỈNH
  useEffect(() => {
    if (provinceId) {
      setLoadingLoc(true);
      fetch(`https://provinces.open-api.vn/api/p/${provinceId}?depth=2`)
        .then((res) => res.json())
        .then((data) => {
          setDistricts(data.districts || []);
          setLoadingLoc(false);
        })
        .catch(() => setLoadingLoc(false));
    } else {
      setDistricts([]);
    }
  }, [provinceId]);

  // ✅ 4. GỌI API LẤY PHƯỜNG/XÃ KHI ĐỔI QUẬN/HUYỆN
  useEffect(() => {
    if (districtId) {
      setLoadingLoc(true);
      fetch(`https://provinces.open-api.vn/api/d/${districtId}?depth=2`)
        .then((res) => res.json())
        .then((data) => {
          setWards(data.wards || []);
          setLoadingLoc(false);
        })
        .catch(() => setLoadingLoc(false));
    } else {
      setWards([]);
    }
  }, [districtId]);

  // ✅ 5. LOGIC TỰ ĐỘNG ĐIỀN CHUỖI ĐỊA CHỈ CHI TIẾT
  useEffect(() => {
    // Nếu chọn đủ cả 3 cấp thì bắt đầu tự ghép chuỗi
    if (provinceId && districtId && wardId) {
      const selectedProvince = provinces.find((p) => p.code.toString() === provinceId.toString());
      const selectedDistrict = districts.find((d) => d.code.toString() === districtId.toString());
      const selectedWard = wards.find((w) => w.code.toString() === wardId.toString());

      if (selectedProvince && selectedDistrict && selectedWard) {
        // Tạo chuỗi: "Phường X, Quận Y, Tỉnh Z"
        const autoString = `${selectedWard.name}, ${selectedDistrict.name}, ${selectedProvince.name}`;
        
        // Cắt bỏ phần đuôi cũ (nếu có) để không bị lặp lại khi người dùng đổi Tỉnh/Huyện nhiều lần
        const currentStreet = specificAddress?.split(",")[0]?.trim() || "";
        
        // Ghép số nhà người dùng đã gõ (nếu có) với chuỗi Phường/Quận/Tỉnh mới
        const newAddress = currentStreet && currentStreet !== selectedWard.name 
          ? `${currentStreet}, ${autoString}` 
          : autoString;
        
        // Điền vào Form
        setValue("specificAddress", newAddress, { shouldValidate: true });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wardId, provinces, districts, wards]); // Kích hoạt khi chọn xong Phường/Xã

  // Helper CSS class
  const getInputClass = (hasError: boolean) => `
    w-full px-4 h-12 border rounded-lg text-sm outline-none transition-all
    bg-white text-gray-900 placeholder:text-gray-400
    ${
      hasError
        ? "border-red-500 focus:ring-2 focus:ring-red-200"
        : "border-gray-300 focus:border-[#329965] focus:ring-2 focus:ring-[#329965]/20"
    }
  `;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50">
        <Link
          href="/address"
          className="text-gray-500 hover:text-[#329965] transition-colors"
        >
          <ChevronLeft size={24} />
        </Link>
        <h1 className="font-bold text-gray-800 text-lg">{title}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 pb-20">
        {/* Họ tên & SĐT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              {...register("fullName")}
              className={getInputClass(!!errors.fullName)}
              placeholder="Ví dụ: Nguyễn Văn A"
            />
            {errors.fullName && (
              <span className="text-xs text-red-500 mt-1 block">
                {errors.fullName.message}
              </span>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              {...register("phone")}
              className={getInputClass(!!errors.phone)}
              placeholder="Ví dụ: 0909..."
            />
            {errors.phone && (
              <span className="text-xs text-red-500 mt-1 block">
                {errors.phone.message}
              </span>
            )}
          </div>
        </div>

        {/* Địa chính (Tỉnh/Huyện/Xã) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          {/* Hiệu ứng loading nhỏ khi fetch API */}
          {loadingLoc && (
            <div className="absolute -top-6 right-0 flex items-center text-xs text-[#329965]">
              <Loader2 size={14} className="animate-spin mr-1" /> Đang tải dữ liệu...
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Tỉnh/Thành <span className="text-red-500">*</span>
            </label>
            <select
              {...register("provinceId", {
                onChange: () => {
                  setValue("districtId", ""); // Reset Quận/Huyện
                  setValue("wardId", "");     // Reset Phường/Xã
                },
              })}
              className={getInputClass(!!errors.provinceId)}
            >
              <option value="">Chọn Tỉnh/Thành</option>
              {provinces.map((p) => (
                <option key={p.code} value={p.code}>{p.name}</option>
              ))}
            </select>
            {errors.provinceId && (
              <span className="text-xs text-red-500 mt-1 block">
                {errors.provinceId.message}
              </span>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Quận/Huyện <span className="text-red-500">*</span>
            </label>
            <select
              {...register("districtId", {
                onChange: () => {
                  setValue("wardId", ""); // Reset Phường/Xã
                },
              })}
              disabled={!provinceId}
              className={`${getInputClass(!!errors.districtId)} disabled:bg-gray-100 disabled:text-gray-400`}
            >
              <option value="">Chọn Quận/Huyện</option>
              {districts.map((d) => (
                <option key={d.code} value={d.code}>{d.name}</option>
              ))}
            </select>
            {errors.districtId && (
              <span className="text-xs text-red-500 mt-1 block">
                {errors.districtId.message}
              </span>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Phường/Xã <span className="text-red-500">*</span>
            </label>
            <select
              {...register("wardId")}
              disabled={!districtId}
              className={`${getInputClass(!!errors.wardId)} disabled:bg-gray-100 disabled:text-gray-400`}
            >
              <option value="">Chọn Phường/Xã</option>
              {wards.map((w) => (
                <option key={w.code} value={w.code}>{w.name}</option>
              ))}
            </select>
            {errors.wardId && (
              <span className="text-xs text-red-500 mt-1 block">
                {errors.wardId.message}
              </span>
            )}
          </div>
        </div>

        {/* Địa chỉ cụ thể */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Địa chỉ cụ thể <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register("specificAddress")}
            rows={3}
            className={getInputClass(!!errors.specificAddress)}
            placeholder="Ví dụ: Số 123 Đường 3/2"
          ></textarea>
          {errors.specificAddress && (
            <span className="text-xs text-red-500 mt-1 block">
              {errors.specificAddress.message}
            </span>
          )}
        </div>

        {/* Loại địa chỉ & Mặc định */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Cài đặt địa chỉ:
          </label>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1">
              <div className="flex gap-3">
                {["Home", "Office"].map((type) => (
                  <label
                    key={type}
                    className={`
                        flex-1 text-center py-2 px-4 rounded-lg border cursor-pointer transition-colors h-12 flex items-center justify-center
                        ${
                          watch("addressType") === type
                            ? "bg-[#eafef9] border-[#2d9f8d] text-[#2d9f8d] font-bold"
                            : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                        }
                    `}
                  >
                    <input
                      type="radio"
                      value={type}
                      {...register("addressType")}
                      className="hidden"
                    />
                    <span className="text-sm">
                      {type === "Home" ? "Nhà riêng" : "Văn phòng"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none h-12 px-4 bg-white border border-gray-300 rounded-lg flex-1 md:flex-none">
              <input
                type="checkbox"
                {...register("isDefault")}
                className="w-4 h-4 cursor-pointer accent-[#329965] rounded"
              />
              <span className="text-sm text-gray-700">
                Đặt làm địa chỉ mặc định
              </span>
            </label>
          </div>
        </div>

        {/* Sticky Footer Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white shadow-lg lg:relative lg:p-0 lg:bg-transparent lg:shadow-none z-10">
          <div className="flex gap-3">
            <Link href="/address" className="flex-1">
              <button
                type="button"
                className="w-full h-12 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Hủy bỏ
              </button>
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-12 text-sm font-bold text-white bg-[#329965] hover:bg-[#268050] rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
              {isSubmitting ? "Đang lưu..." : "Lưu địa chỉ"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}