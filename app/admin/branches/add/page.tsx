"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X, Settings, HelpCircle, Save, ChevronLeft,
  Building2, User, Mail, Phone, MapPin,
  AlertCircle, Loader2, Search, Navigation, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { AdminBranchSchema, AdminBranchForm } from "@/app/types/admin.schema";
import { branchService } from '@/app/services/branchService';
import { EmployeeService } from "@/app/services/employee.service";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";

// --- HELPERS TRÍCH XUẤT DỮ LIỆU ---
const getProvId = (item: any) => item?.ProvinceID ?? item?.province_id ?? item?.id ?? "";
const getProvName = (item: any) => item?.ProvinceName ?? item?.province_name ?? item?.name ?? "";
const getDistId = (item: any) => item?.DistrictID ?? item?.district_id ?? item?.id ?? "";
const getDistName = (item: any) => item?.DistrictName ?? item?.district_name ?? item?.name ?? "";
const getWardId = (item: any) => item?.WardCode ?? item?.ward_code ?? item?.code ?? item?.WardID ?? item?.id ?? "";
const getWardName = (item: any) => item?.WardName ?? item?.ward_name ?? item?.name ?? "";

const extractArray = (res: any) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.content)) return res.content;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

const fetchWithAuth = async (url: string) => {
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  }
  return fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token.replace(/"/g, '')}` } : {})
    }
  });
};

export default function AddBranchPage() {
  const { hasPermission, isLoadingAuth } = usePermissions();
  const router = useRouter();
  const searchParams = useSearchParams();
  const branchId = searchParams.get("id");
  const isEditMode = Boolean(branchId);

  const [isLoading, setIsLoading] = useState(false);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [isInitialLoaded, setIsInitialLoaded] = useState(false);
  const [isGettingGPS, setIsGettingGPS] = useState(false);

  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, control, setValue, reset, watch, formState: { errors } } = useForm<AdminBranchForm>({
    resolver: zodResolver(AdminBranchSchema),
    defaultValues: {
      id: "", name: "", managerId: "", phone: "", email: "", province: "", district: "", ward: "",
      addressDetail: "", status: "active", branchType: "STORE",
    },
  });

  const watchedProvince = watch("province");
  const watchedDistrict = watch("district");
  const watchedWard = watch("ward");
  const addressDetailValue = watch("addressDetail");
  const watchedLat = watch("lat");
  const watchedLng = watch("lng");

  const currentProvince = useMemo(() => provinces.find(p => String(getProvId(p)) === watchedProvince), [provinces, watchedProvince]);
  const currentDistrict = useMemo(() => districts.find(d => String(getDistId(d)) === watchedDistrict), [districts, watchedDistrict]);
  const currentWard = useMemo(() => wards.find(w => String(getWardId(w)) === watchedWard), [wards, watchedWard]);

  // --- 1. KHỞI TẠO DỮ LIỆU & LỌC ROLE ID (1,2,3) ---
  useEffect(() => {
    const initData = async () => {
      try {
        const [empRes, provResponse] = await Promise.all([
          EmployeeService.getAll({ size: 500, status: 'ACTIVE' }),
          fetchWithAuth("/api/ghn/province"),
        ]);

        // Lọc chỉ lấy nhân viên có Role ID 1, 2, 3
        const rawStaffs = extractArray(empRes);
        const filtered = rawStaffs.filter((s: any) => [1, 2, 3].includes(s.roleId || s.role?.id));
        setStaffs(filtered);

        if (provResponse.ok) {
          const provinceRes = await provResponse.json();
          setProvinces(extractArray(provinceRes));
          setIsInitialLoaded(true);
        }
      } catch (error) {
        console.error(error);
        toast.error("Lỗi tải danh sách khởi tạo.");
      }
    };
    initData();
  }, []);

  // --- 2. HIỆN LẠI THÔNG TIN KHI SỬA (FIXED) ---
  useEffect(() => {
    if (isEditMode && branchId && isInitialLoaded) {
      const fetchDetail = async () => {
        try {
          setIsLoading(true);
          const data = await branchService.getById(branchId);

          // Fetch districts/wards trước để reset form không bị mất label
          if (data.provinceId) {
            const [distRes, wardRes] = await Promise.all([
              fetchWithAuth(`/api/ghn/district?province_id=${data.provinceId}`),
              fetchWithAuth(`/api/ghn/ward?district_id=${data.districtId}`)
            ]);
            setDistricts(extractArray(await distRes.json()));
            setWards(extractArray(await wardRes.json()));
          }

          reset({
            id: data.branchCode,
            name: data.name,
            branchType: data.branchType,
            phone: data.phone,
            email: data.email || "",
            addressDetail: data.addressDetail,
            province: String(data.provinceId || ""),
            district: String(data.districtId || ""),
            ward: String(data.wardCode || data.wardId || ""),
            status: (data.status || "active").toLowerCase(),
            managerId: data.managerIds?.[0] ? String(data.managerIds[0]) : "",
            lat: data.lat,
            lng: data.lng,
          });
        } catch (error) {
          toast.error("Không thể tải thông tin chi nhánh!");
        } finally {
          setIsLoading(false);
        }
      };
      fetchDetail();
    } else if (!isEditMode && isInitialLoaded) {
        setValue("id", "CN-" + Math.floor(1000 + Math.random() * 9000));
    }
  }, [isEditMode, branchId, isInitialLoaded, reset, setValue]);

  // Logic lấy huyện/xã khi thay đổi select tay
  useEffect(() => {
    if (watchedProvince && isInitialLoaded && !isLoading) {
      fetchWithAuth(`/api/ghn/district?province_id=${watchedProvince}`)
        .then(r => r.json()).then(data => setDistricts(extractArray(data)));
    }
  }, [watchedProvince, isInitialLoaded, isLoading]);

  useEffect(() => {
    if (watchedDistrict && isInitialLoaded && !isLoading) {
      fetchWithAuth(`/api/ghn/ward?district_id=${watchedDistrict}`)
        .then(r => r.json()).then(data => setWards(extractArray(data)));
    }
  }, [watchedDistrict, isInitialLoaded, isLoading]);

  // Logic gợi ý địa chỉ (Không đổi)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (addressDetailValue && addressDetailValue.length > 2 && watchedProvince) {
        try {
          const query = `${addressDetailValue}, ${currentWard ? getWardName(currentWard) : ''}, ${currentDistrict ? getDistName(currentDistrict) : ''}, ${getProvName(currentProvince)}`;
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=vn&limit=5`);
          if (response.ok) {
            const data = await response.json();
            setAddressSuggestions(data);
            setShowSuggestions(true);
          }
        } catch (e) { console.error(e); }
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [addressDetailValue, currentProvince, currentDistrict, currentWard]);

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) setShowSuggestions(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const buildFullAddressQuery = () => {
    return `${addressDetailValue}, ${currentWard ? getWardName(currentWard) + ', ' : ''}${currentDistrict ? getDistName(currentDistrict) + ', ' : ''}${getProvName(currentProvince)}`;
  };

  const fetchCoordinatesFromAddress = async () => {
    // Không bắt buộc province nếu addressDetail đã đủ thông tin
    if (!addressDetailValue || addressDetailValue.trim().length < 3) {
      toast.error("Vui lòng nhập địa chỉ chi tiết đủ thông tin!");
      return null;
    }

    setIsGettingGPS(true);
    try {
      // Ưu tiên 1: Cố gắng geocode trực tiếp từ addressDetail (e.g., Google Maps format)
      const directResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressDetailValue)}&countrycodes=vn&limit=1`
      );
      const directData = await directResponse.json();

      if (directData && directData.length > 0 && directData[0].lat && directData[0].lon) {
        const lat = parseFloat(directData[0].lat);
        const lng = parseFloat(directData[0].lon);
        setValue("lat", lat);
        setValue("lng", lng);
        return { lat, lng };
      }

      // Ưu tiên 2: Nếu có province/district/ward, thử kết hợp full address
      if (watchedProvince) {
        const fullAddr = buildFullAddressQuery();
        const fullResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddr)}&limit=1`
        );
        const fullData = await fullResponse.json();

        if (fullData && fullData.length > 0 && fullData[0].lat && fullData[0].lon) {
          const lat = parseFloat(fullData[0].lat);
          const lng = parseFloat(fullData[0].lon);
          setValue("lat", lat);
          setValue("lng", lng);
          return { lat, lng };
        }
      }

      return null;
    } catch (error) {
      console.error("Error fetching coordinates", error);
      return null;
    } finally {
      setIsGettingGPS(false);
    }
  };

  const handleFetchCoordsFromAddress = async () => {
    const coords = await fetchCoordinatesFromAddress();
    if (coords) {
      toast.success("✓ Đã lấy tọa độ từ địa chỉ!");
    } else {
      toast.error("Không tìm thấy tọa độ. Vui lòng kiểm tra lại địa chỉ.");
    }
  };

  const onSubmit = async (data: AdminBranchForm) => {
    try {
      setIsLoading(true);

      let lat = data.lat;
      let lng = data.lng;
      const hasLatLng = typeof lat === "number" && typeof lng === "number";

      if (!hasLatLng && data.addressDetail) {
        const coords = await fetchCoordinatesFromAddress();
        if (!coords) {
          toast.error("Không thể lấy tọa độ tự động. Vui lòng kiểm tra lại địa chỉ hoặc chọn gợi ý.");
          return;
        }
        lat = coords.lat;
        lng = coords.lng;
      }

      const selectedWardObj = wards.find((w: any) => String(getWardId(w)) === data.ward);
      const payload = {
        branchCode: data.id,
        name: data.name,
        branchType: data.branchType,
        phone: data.phone,
        email: data.email,
        addressDetail: data.addressDetail,
        provinceId: Number(data.province),
        districtId: Number(data.district),
        wardId: selectedWardObj?.WardID ?? Number(data.ward),
        wardCode: selectedWardObj?.WardCode ?? selectedWardObj?.code ?? String(data.ward),
        status: data.status.toUpperCase(),
        managerIds: data.managerId ? [Number(data.managerId)] : [],
        lat,
        lng,
      };

      isEditMode ? await branchService.update(branchId!, payload) : await branchService.create(payload);
      toast.success("Thành công!");
      router.push("/admin/branches");
    } catch (error: any) {
      toast.error("Lỗi lưu dữ liệu.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderSearchInput = (placeholder: string) => (
    <div className="sticky top-0 z-10 bg-white p-2 border-b">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        <Input placeholder={placeholder} className="h-8 pl-8 text-[12px] rounded-none focus-visible:ring-0" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.stopPropagation()} />
      </div>
    </div>
  );

  const filteredProvinces = useMemo(() => provinces.filter(p => getProvName(p).toLowerCase().includes(searchTerm.toLowerCase())), [provinces, searchTerm]);
  const filteredDistricts = useMemo(() => districts.filter(d => getDistName(d).toLowerCase().includes(searchTerm.toLowerCase())), [districts, searchTerm]);
  const filteredWards = useMemo(() => wards.filter(w => getWardName(w).toLowerCase().includes(searchTerm.toLowerCase())), [wards, searchTerm]);
  const filteredStaffs = useMemo(() => staffs.filter(s => (s?.fullName || "").toLowerCase().includes(searchTerm.toLowerCase())), [staffs, searchTerm]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-[100px] bg-slate-50/30 p-4 min-h-screen">
      <div className="flex items-center gap-4 mb-2 px-1">
        <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400"><ChevronLeft size={20} /></Button>
        <h1 className="text-[18px] font-black text-[#1f1f1f] tracking-tight uppercase">{isEditMode ? "Cập nhật chi nhánh" : "Khởi tạo chi nhánh mới"}</h1>
        <div className="ms-auto flex items-center gap-3 text-gray-400">
          <Settings size={18} className="cursor-pointer hover:text-emerald-600 transition-colors" />
          <HelpCircle size={18} className="cursor-pointer hover:text-emerald-600 transition-colors" />
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8"><X size={20} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-9 space-y-5">
          {/* Section 1 */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3"><Building2 size={16} /> 1. Thông tin định danh</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500">Tên chi nhánh *</Label>
                <Input {...register("name")} className={`h-[34px] text-[13px] border-[#ccc] rounded-none font-bold ${errors.name ? 'border-red-500' : ''}`} />
                {errors.name && <span className="text-[10px] text-red-500 font-bold">{errors.name.message}</span>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500">Loại hình *</Label>
                <Controller name="branchType" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-[34px] border-[#ccc] rounded-none"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-none font-bold">
                        <SelectItem value="WAREHOUSE" className="text-blue-600">KHO TRUNG TÂM / TRỤ SỞ</SelectItem>
                        <SelectItem value="STORE" className="text-slate-600">CỬA HÀNG BÁN LẺ</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500">Mã chi nhánh *</Label>
                <Input {...register("id")} readOnly className="h-[34px] text-[13px] border-[#ccc] rounded-none font-mono bg-slate-100 cursor-not-allowed" />
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3"><MapPin size={16} /> 2. Vị trí địa lý & Địa chỉ kho</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500">Tỉnh / Thành phố *</Label>
                <Controller name="province" control={control} render={({ field }) => (
                    <Select onValueChange={(val) => { field.onChange(val); setValue("district", ""); setValue("ward", ""); }} value={field.value}>
                      <SelectTrigger className={`h-[34px] text-[12px] border-[#ccc] rounded-none ${errors.province ? 'border-red-500' : ''}`}><SelectValue placeholder="-- Chọn Tỉnh --" /></SelectTrigger>
                      <SelectContent className="rounded-none z-[1000] p-0">
                        {renderSearchInput("Tìm tỉnh...")}
                        <div className="max-h-[200px] overflow-y-auto">
                          {filteredProvinces.map(p => <SelectItem key={getProvId(p)} value={String(getProvId(p))}>{getProvName(p)}</SelectItem>)}
                        </div>
                      </SelectContent>
                    </Select>
                  )} />
                {errors.province && <span className="text-[10px] text-red-500 font-bold">{errors.province.message}</span>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500">Quận / Huyện *</Label>
                <Controller name="district" control={control} render={({ field }) => (
                    <Select onValueChange={(val) => { field.onChange(val); setValue("ward", ""); }} value={field.value} disabled={!watchedProvince}>
                      <SelectTrigger className="h-[34px] text-[12px] border-[#ccc] rounded-none"><SelectValue placeholder="-- Chọn Huyện --" /></SelectTrigger>
                      <SelectContent className="rounded-none z-[1000] p-0">
                        {renderSearchInput("Tìm huyện...")}
                        <div className="max-h-[200px] overflow-y-auto">
                          {filteredDistricts.map(d => <SelectItem key={getDistId(d)} value={String(getDistId(d))}>{getDistName(d)}</SelectItem>)}
                        </div>
                      </SelectContent>
                    </Select>
                  )} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500">Phường / Xã *</Label>
                <Controller name="ward" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={!watchedDistrict}>
                      <SelectTrigger className="h-[34px] text-[12px] border-[#ccc] rounded-none"><SelectValue placeholder="-- Chọn Xã --" /></SelectTrigger>
                      <SelectContent className="rounded-none z-[1000] p-0">
                        {renderSearchInput("Tìm xã...")}
                        <div className="max-h-[200px] overflow-y-auto">
                          {filteredWards.map(w => <SelectItem key={getWardId(w)} value={String(getWardId(w))}>{getWardName(w)}</SelectItem>)}
                        </div>
                      </SelectContent>
                    </Select>
                  )} />
              </div>

              <div className="md:col-span-3 space-y-1.5 relative" ref={suggestionRef}>
                <Label className="text-[10px] font-black uppercase text-slate-500">Địa chỉ chi tiết (Số nhà, tên đường) *</Label>
                <Input {...register("addressDetail")} autoComplete="off" className={`h-[34px] text-[13px] border-[#ccc] rounded-none ${errors.addressDetail ? 'border-red-500' : ''}`} />
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-[1100] bg-white border border-[#ccc] shadow-xl max-h-[200px] overflow-y-auto mt-1">
                    {addressSuggestions.map((item: any, idx: number) => (
                      <div key={idx} className="px-4 py-2 text-[12px] hover:bg-slate-50 cursor-pointer border-b"
                        onClick={() => {
                          const parts = item.display_name.split(',');
                          setValue("addressDetail", `${parts[0].trim()}${parts[1] ? ', ' + parts[1].trim() : ''}`);
                          setValue("lat", parseFloat(item.lat));
                          setValue("lng", parseFloat(item.lon));
                          setShowSuggestions(false);
                        }}>
                        <p className="font-bold">{item.display_name.split(',')[0]}</p>
                        <p className="text-[10px] text-slate-400 truncate">{item.display_name}</p>
                      </div>
                    ))}
                  </div>
                )}
                {errors.addressDetail && <span className="text-[10px] text-red-500 font-bold">{errors.addressDetail.message}</span>}
              </div>

              {/* Tọa độ */}
              <div className="md:col-span-3 border-t border-dashed border-slate-200 pt-4 mt-1">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-[10px] font-black text-slate-500 flex items-center gap-1.5 uppercase"><Navigation size={12} /> Tọa độ địa lý</Label>
                  <div className="flex items-center gap-2">
                    <Button type="button" onClick={handleFetchCoordsFromAddress} disabled={isGettingGPS} className="h-7 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3">
                    {isGettingGPS ? <Loader2 size={11} className="animate-spin mr-1" /> : <Navigation size={11} className="mr-1" />} Lấy tọa độ
                    </Button>
                    {watchedLat && watchedLng && (
                      <a href={`https://www.google.com/maps?q=${watchedLat},${watchedLng}`} target="_blank" rel="noopener noreferrer" className="h-7 flex items-center gap-1 px-3 text-[10px] font-bold text-blue-600 border border-blue-200 bg-blue-50">
                        <ExternalLink size={11} /> Xem bản đồ
                      </a>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input {...register("lat", { valueAsNumber: true })} type="text" placeholder="Vĩ độ" className="h-[34px] font-mono text-[12px] bg-slate-50" />
                  <Input {...register("lng", { valueAsNumber: true })} type="text" placeholder="Kinh độ" className="h-[34px] font-mono text-[12px] bg-slate-50" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase border-b pb-3"><User size={16} /> 3. Nhân sự phụ trách & Liên hệ</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500">Người quản lý chi nhánh</Label>
                <Controller name="managerId" control={control} render={({ field }) => (
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val === "__none__" ? "" : val);
                      setSearchTerm("");
                    }}
                    value={field.value || "__none__"}
                  >
                    <SelectTrigger className={`h-[34px] text-[13px] border-[#ccc] rounded-none ${errors.managerId ? 'border-red-500' : ''}`}><SelectValue placeholder="-- Tìm nhân sự --" /></SelectTrigger>
                    <SelectContent className="rounded-none z-[1050] p-0">
                      {renderSearchInput("Nhập tên quản lý...")}
                      <div className="max-h-[200px] overflow-y-auto">
                        <SelectItem value="__none__">Chưa gán người quản lý</SelectItem>
                        {filteredStaffs.length > 0 ? (
                          filteredStaffs.map(staff => (
                              <SelectItem key={staff.id} value={String(staff.id)}>
                                  {staff.fullName} (ID: {staff.id})
                              </SelectItem>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-[12px] text-slate-400">
                            Chưa có nhân viên phù hợp để chọn.
                          </div>
                        )}
                      </div>
                    </SelectContent>
                  </Select>
                )} />
                <span className="text-[10px] text-slate-400">
                  Có thể để trống lúc khởi tạo chi nhánh và gán sau khi đã có nhân viên.
                </span>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase">Số điện thoại *</Label>
                <Input {...register("phone")} className={`h-[34px] border-[#ccc] rounded-none font-bold ${errors.phone ? 'border-red-500' : ''}`} />
                {errors.phone && <span className="text-[10px] text-red-500 font-bold">{errors.phone.message}</span>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase">Email *</Label>
                <Input {...register("email")} type="email" className={`h-[34px] border-[#ccc] rounded-none ${errors.email ? 'border-red-500' : ''}`} />
                {errors.email && <span className="text-[10px] text-red-500 font-bold">{errors.email.message}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <Label className="text-[11px] font-black text-slate-700 uppercase block mb-5 border-b pb-3">Trạng thái vận hành</Label>
            <Controller name="status" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-[38px] border-[#ccc] rounded-none font-black text-emerald-600 uppercase"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-none font-bold">
                    <SelectItem value="active">ĐANG HOẠT ĐỘNG</SelectItem>
                    <SelectItem value="inactive">NGỪNG HOẠT ĐỘNG</SelectItem>
                  </SelectContent>
                </Select>
              )} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[12px_30px] flex items-center justify-end gap-[15px] z-[999] shadow-lg">
        <Button type="button" variant="outline" className="min-w-[110px] h-[38px] text-[12px] font-bold border-[#ccc] rounded-none uppercase shadow-sm bg-white" onClick={() => router.back()}>HỦY BỎ</Button>
        <Button type="submit" disabled={isLoading} className="min-w-[160px] h-[38px] text-[12px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-none shadow-md">
          {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
          {isEditMode ? "CẬP NHẬT DỮ LIỆU" : "KHỞI TẠO CHI NHÁNH"}
        </Button>
      </div>
    </form>
  );
}
