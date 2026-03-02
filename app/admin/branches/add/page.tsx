"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X, Settings, HelpCircle, Save, ChevronLeft,
  Building2, User, Mail, Phone, MapPin,
  AlertCircle, Loader2, Search, Map, LayoutGrid, Tags,
  Navigation, ExternalLink,
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

import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";

export default function AddBranchPage() {
  const { hasPermission, isLoadingAuth } = usePermissions();
  const router = useRouter();
  const searchParams = useSearchParams();

  const idFromUrl = searchParams.get("id");
  const isEditMode = Boolean(idFromUrl);
  const branchId = idFromUrl;

  const [isLoading, setIsLoading] = useState(false);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [isInitialLoaded, setIsInitialLoaded] = useState(false);
  const [isGettingGPS, setIsGettingGPS] = useState(false);

  // 0. Kiểm tra quyền truy cập
  useEffect(() => {
    if (!isLoadingAuth) {
      if (isEditMode && !hasPermission(P.BRANCH_UPDATE)) {
        router.push("/admin/forbidden");
      } else if (!isEditMode && !hasPermission(P.BRANCH_CREATE)) {
        router.push("/admin/forbidden");
      }
    }
  }, [isLoadingAuth, isEditMode, hasPermission, router]);

  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<AdminBranchForm>({
    resolver: zodResolver(AdminBranchSchema),
    defaultValues: {
      id: "",
      name: "",
      managerId: "",
      phone: "",
      email: "",
      province: "",
      district: "",
      ward: "",
      addressDetail: "",
      status: "active",
      branchType: "STORE",
      lat: undefined,
      lng: undefined,
    },
  });

  const selectedProvince = watch("province");
  const selectedDistrict = watch("district");
  const watchedLat = watch("lat");
  const watchedLng = watch("lng");

  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ định vị GPS");
      return;
    }
    setIsGettingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("lat", parseFloat(pos.coords.latitude.toFixed(6)));
        setValue("lng", parseFloat(pos.coords.longitude.toFixed(6)));
        toast.success("Đã lấy tọa độ GPS thành công!");
        setIsGettingGPS(false);
      },
      () => {
        toast.error("Không thể lấy vị trí. Vui lòng nhập thủ công.");
        setIsGettingGPS(false);
      }
    );
  };

  // Logic lọc dữ liệu dựa trên searchTerm
  const filteredProvinces = useMemo(() =>
    provinces.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
  [provinces, searchTerm]);

  const filteredDistricts = useMemo(() =>
    districts.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase())),
  [districts, searchTerm]);

  const filteredWards = useMemo(() =>
    wards.filter(w => w.name.toLowerCase().includes(searchTerm.toLowerCase())),
  [wards, searchTerm]);

  const filteredStaffs = useMemo(() =>
    staffs.filter(s => s.fullName.toLowerCase().includes(searchTerm.toLowerCase())),
  [staffs, searchTerm]);

  // 1. Khởi tạo dữ liệu ban đầu
  useEffect(() => {
    const initData = async () => {
      try {
        const [staffRes, provinceRes] = await Promise.all([
          branchService.getAllStaff(),
          fetch("/api/ghn/province").then(r => r.json()),
        ]);
        setStaffs(staffRes?.content || staffRes || []);
        setProvinces(provinceRes);
        setIsInitialLoaded(true);
      } catch (error) { console.error(error); }
    };
    initData();
  }, []);

  // 2. Lấy Quận/Huyện khi chọn Tỉnh
  useEffect(() => {
    if (selectedProvince && selectedProvince !== "" && !isLoading) {
      const fetchDistricts = async () => {
        try {
          const data = await fetch(`/api/ghn/district?province_id=${selectedProvince}`).then(r => r.json());
          setDistricts(data || []);
        } catch (error) { console.error(error); }
      };
      fetchDistricts();
    }
  }, [selectedProvince, isLoading]);

  // 3. Lấy Phường/Xã khi chọn Huyện
  useEffect(() => {
    if (selectedDistrict && selectedDistrict !== "" && !isLoading) {
      const fetchWards = async () => {
        try {
          const data = await fetch(`/api/ghn/ward?district_id=${selectedDistrict}`).then(r => r.json());
          setWards(data || []);
        } catch (error) { console.error(error); }
      };
      fetchWards();
    }
  }, [selectedDistrict, isLoading]);

  // 4. Fill dữ liệu khi ở chế độ Edit
useEffect(() => {
  if (isEditMode && branchId && isInitialLoaded) {
    const fetchFullDetail = async () => {
      try {
        setIsLoading(true);
        // 1. Lấy dữ liệu chi nhánh từ Backend
        const data = await branchService.getById(branchId);

        // 2. Kiểm tra dữ liệu hợp lệ trước khi gọi API tỉnh thành
        if (!data.provinceId) {
          console.warn("Chi nhánh này chưa có dữ liệu tỉnh thành");
          // Vẫn cho phép hiện thông tin cơ bản
          reset({
            id: data.branchCode,
            name: data.name,
            branchType: data.branchType,
            phone: data.phone,
            email: data.email || "",
            addressDetail: data.addressDetail,
            status: data.status.toLowerCase(),
            managerId: data.managerIds?.[0] ? String(data.managerIds[0]) : "",
          });
          return;
        }

        // 3. Chỉ gọi API tỉnh thành khi đã có ID chắc chắn (tránh lỗi null)
        const [distData, wardData] = await Promise.all([
          fetch(`/api/ghn/district?province_id=${data.provinceId}`).then(r => r.json()),
          fetch(`/api/ghn/ward?district_id=${data.districtId}`).then(r => r.json()),
        ]);

        // 4. Cập nhật state danh sách trước khi reset form
        setDistricts(distData || []);
        setWards(wardData || []);

        // 5. Reset form với đầy đủ dữ liệu để các ô Select hiển thị đúng nhãn (label)
        reset({
          id: data.branchCode,
          name: data.name,
          branchType: data.branchType,
          phone: data.phone,
          email: data.email || "",
          addressDetail: data.addressDetail,
          province: String(data.provinceId),
          district: String(data.districtId),
          ward: String(data.wardCode ?? data.wardId),
          status: data.status.toLowerCase(),
          managerId: data.managerIds?.[0] ? String(data.managerIds[0]) : "",
          lat: data.lat ?? undefined,
          lng: data.lng ?? undefined,
        });
      } catch (error) {
        console.error("Lỗi fetch chi tiết:", error);
        toast.error("Không thể tải thông tin chi nhánh!");
      } finally {
        setIsLoading(false);
      }
    };
    fetchFullDetail();
  } else if (!isEditMode && isInitialLoaded) {
    setValue("id", "CN-" + Math.floor(100 + Math.random() * 900));
  }
}, [isEditMode, branchId, isInitialLoaded, reset]);

  const onSubmit = async (data: AdminBranchForm) => {
    try {
      setIsLoading(true);
      // Tìm ward đã chọn để lấy cả wardId (int) lẫn wardCode (string)
      const selectedWard = wards.find((w: any) => w.code === data.ward);
      const payload = {
        branchCode: data.id,
        name: data.name,
        branchType: data.branchType,
        phone: data.phone,
        email: data.email,
        addressDetail: data.addressDetail,
        provinceId: Number(data.province),
        districtId: Number(data.district),
        wardId: selectedWard?.wardId ?? Number(data.ward),   // GHN WardID (int)
        wardCode: selectedWard?.code ?? String(data.ward),   // GHN WardCode (string)
        status: data.status.toUpperCase(),
        managerIds: data.managerId ? [Number(data.managerId)] : [],
        lat: data.lat ?? null,
        lng: data.lng ?? null,
      };

      if (isEditMode) {
        // Đã sửa: branchService chữ thường
        await branchService.update(branchId!, payload);
        toast.success("Cập nhật chi nhánh thành công!");
      } else {
        // Đã sửa: branchService chữ thường
        await branchService.create(payload);
        toast.success("Khởi tạo chi nhánh mới thành công!");
      }
      router.push("/admin/branches");
    } catch (error: any) {
      toast.error("Lỗi lưu dữ liệu. Vui lòng kiểm tra lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderSearchInput = (placeholder: string) => (
    <div className="sticky top-0 z-10 bg-white p-2 border-b border-slate-100">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        <Input
          placeholder={placeholder}
          className="h-8 pl-8 text-[12px] rounded-none focus-visible:ring-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );

  if (isEditMode && isLoading && districts.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto text-emerald-600 mb-2" size={32} />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Đang tải dữ liệu chi nhánh...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-[100px] bg-slate-50/30 p-4 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2 px-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-8 w-8 text-slate-400"
        >
          <ChevronLeft size={20} />
        </Button>
        <h1 className="text-[18px] font-black text-[#1f1f1f] tracking-tight uppercase">
          {isEditMode ? "Cập nhật chi nhánh" : "Khởi tạo chi nhánh mới"}
        </h1>
        <div className="ms-auto flex items-center gap-3 text-gray-400">
          <Settings size={18} className="cursor-pointer hover:text-emerald-600 transition-colors" />
          <HelpCircle size={18} className="cursor-pointer hover:text-emerald-600 transition-colors" />
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
            <X size={20} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-9 space-y-5">
          {/* Section 1: Định danh */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <Building2 size={16} /> 1. Thông tin định danh chi nhánh
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase">Tên chi nhánh / Kho hàng *</Label>
                <Input
                  {...register("name")}
                  className="h-[34px] text-[13px] border-[#ccc] rounded-none font-bold focus:border-emerald-500 shadow-none"
                />
                {errors.name && <p className="text-[10px] text-red-500 font-bold">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase">Loại hình chi nhánh *</Label>
                <Controller
                  name="branchType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="WAREHOUSE" className="font-bold text-blue-600">KHO TRUNG TÂM / TRỤ SỞ</SelectItem>
                            <SelectItem value="STORE" className="font-bold text-slate-600">CỬA HÀNG BÁN LẺ</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase">Mã chi nhánh *</Label>
               <Input
                 {...register("id")}
                 readOnly={isEditMode} // <-- Đổi thành readOnly
                 className="h-[34px] text-[13px] border-[#ccc] rounded-none font-mono uppercase bg-slate-50"
               />
                {errors.id && <p className="text-[10px] text-red-500 font-bold">{errors.id.message}</p>}
              </div>

            </div>
          </div>

          {/* Section 2: Vị trí */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <MapPin size={16} /> 2. Vị trí địa lý & Địa chỉ kho
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase">Tỉnh / Thành phố *</Label>
                <Controller
                  name="province"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(val) => { field.onChange(val); setSearchTerm(""); }}
                      value={field.value}
                      onOpenChange={(open) => !open && setSearchTerm("")}
                    >
                      <SelectTrigger className="h-[34px] text-[12px] border-[#ccc] rounded-none focus:ring-0">
                        <SelectValue placeholder="-- Chọn Tỉnh --" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none z-[1000] p-0">
                        {renderSearchInput("Tìm tỉnh...")}
                        <div className="max-h-[200px] overflow-y-auto">
                          {filteredProvinces.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                        </div>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.province && <p className="text-[10px] text-red-500 font-bold">{errors.province.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase">Quận / Huyện *</Label>
                <Controller
                  name="district"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(val) => { field.onChange(val); setSearchTerm(""); }}
                      value={field.value}
                      onOpenChange={(open) => !open && setSearchTerm("")}
                      disabled={!selectedProvince}
                    >
                      <SelectTrigger className="h-[34px] text-[12px] border-[#ccc] rounded-none focus:ring-0">
                        <SelectValue placeholder="-- Chọn Huyện --" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none z-[1000] p-0">
                        {renderSearchInput("Tìm huyện...")}
                        <div className="max-h-[200px] overflow-y-auto">
                          {filteredDistricts.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                        </div>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.district && <p className="text-[10px] text-red-500 font-bold">{errors.district.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase">Phường / Xã *</Label>
                <Controller
                  name="ward"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(val) => { field.onChange(val); setSearchTerm(""); }}
                      value={field.value}
                      onOpenChange={(open) => !open && setSearchTerm("")}
                      disabled={!selectedDistrict}
                    >
                      <SelectTrigger className="h-[34px] text-[12px] border-[#ccc] rounded-none focus:ring-0">
                        <SelectValue placeholder="-- Chọn Xã --" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none z-[1000] p-0">
                        {renderSearchInput("Tìm xã...")}
                        <div className="max-h-[200px] overflow-y-auto">
                          {filteredWards.map(w => <SelectItem key={w.code} value={String(w.code)}>{w.name}</SelectItem>)}
                        </div>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.ward && <p className="text-[10px] text-red-500 font-bold">{errors.ward.message}</p>}
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase">Địa chỉ chi tiết (Số nhà, tên đường) *</Label>
                <Input
                  {...register("addressDetail")}
                  className="h-[34px] text-[13px] border-[#ccc] rounded-none focus:border-emerald-500 shadow-none"
                />
                {errors.addressDetail && <p className="text-[10px] text-red-500 font-bold">{errors.addressDetail.message}</p>}
              </div>

              {/* Tọa độ GPS */}
              <div className="md:col-span-3 border-t border-dashed border-slate-200 pt-4 mt-1">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Navigation size={12} /> Tọa độ địa lý (dùng cho tìm chi nhánh gần nhất)
                  </Label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGetGPS}
                      disabled={isGettingGPS}
                      className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                    >
                      {isGettingGPS ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <Navigation size={11} />
                      )}
                      Lấy GPS hiện tại
                    </button>
                    {watchedLat && watchedLng && (
                      <a
                        href={`https://www.google.com/maps?q=${watchedLat},${watchedLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1 text-[11px] font-bold text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <ExternalLink size={11} /> Xem bản đồ
                      </a>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black text-slate-400 uppercase">Vĩ độ (Latitude)</Label>
                    <Input
                      {...register("lat", { valueAsNumber: true })}
                      type="number"
                      step="0.000001"
                      placeholder="Ví dụ: 10.045162"
                      className="h-[34px] text-[13px] border-[#ccc] rounded-none font-mono focus:border-emerald-500 shadow-none"
                    />
                    {errors.lat && <p className="text-[10px] text-red-500 font-bold">{errors.lat.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black text-slate-400 uppercase">Kinh độ (Longitude)</Label>
                    <Input
                      {...register("lng", { valueAsNumber: true })}
                      type="number"
                      step="0.000001"
                      placeholder="Ví dụ: 105.746857"
                      className="h-[34px] text-[13px] border-[#ccc] rounded-none font-mono focus:border-emerald-500 shadow-none"
                    />
                    {errors.lng && <p className="text-[10px] text-red-500 font-bold">{errors.lng.message}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Nhân sự & Liên hệ */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <User size={16} /> 3. Nhân sự phụ trách & Liên hệ hệ thống
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Người quản lý chi nhánh *</Label>
                <Controller
                  name="managerId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(val) => { field.onChange(val); setSearchTerm(""); }}
                      value={field.value}
                      onOpenChange={(open) => !open && setSearchTerm("")}
                    >
                      <SelectTrigger className="h-[34px] text-[13px] border-[#ccc] rounded-none focus:ring-0">
                        <SelectValue placeholder="-- Tìm nhân sự --" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none z-[1050] p-0">
                        {renderSearchInput("Nhập tên quản lý...")}
                        <div className="max-h-[200px] overflow-y-auto">
                          {filteredStaffs.map(staff => (
                            <SelectItem key={staff.id} value={String(staff.id)}>{staff.fullName} (NV-{staff.id})</SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.managerId && <p className="text-[10px] text-red-500 font-bold">{errors.managerId.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase">Số điện thoại liên hệ *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <Input
                    {...register("phone")}
                    className="h-[34px] pl-9 text-[13px] border-[#ccc] rounded-none font-bold focus:border-emerald-500"
                  />
                </div>
                {errors.phone && <p className="text-[10px] text-red-500 font-bold">{errors.phone.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase">Email chi nhánh *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <Input
                    {...register("email")}
                    type="email"
                    className="h-[34px] pl-9 text-[13px] border-[#ccc] rounded-none focus:border-emerald-500"
                  />
                </div>
                {errors.email && <p className="text-[10px] text-red-500 font-bold">{errors.email.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <Label className="text-[11px] font-black text-slate-700 uppercase block mb-5 tracking-widest border-b pb-3">
              Trạng thái vận hành
            </Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-[38px] border-[#ccc] rounded-none font-black text-emerald-600 uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none font-bold">
                    <SelectItem value="active">ĐANG HOẠT ĐỘNG</SelectItem>
                    <SelectItem value="inactive">NGỪNG HOẠT ĐỘNG</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="p-5 bg-amber-50 border border-amber-100 rounded-none">
            <div className="flex items-center gap-2 text-amber-700 font-black text-[10px] uppercase mb-3 tracking-widest border-b border-amber-200 pb-1.5">
              <AlertCircle size={14} /> Lưu ý quan trọng
            </div>
            <p className="text-[11px] text-amber-700/80 leading-relaxed font-medium italic">
              * Mã chi nhánh là định danh duy nhất và{" "}
              <span className="underline font-black text-amber-800">KHÔNG THỂ THAY ĐỔI</span>{" "}
              sau khi đã khởi tạo trên hệ thống.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[12px_30px] flex items-center justify-end gap-[15px] z-[999] shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        <Button
          type="button"
          variant="outline"
          className="min-w-[110px] h-[38px] text-[12px] font-bold border-[#ccc] bg-white rounded-none shadow-sm hover:bg-slate-50 transition-all uppercase"
          onClick={() => router.back()}
        >
          HỦY BỎ
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="min-w-[160px] h-[38px] text-[12px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-none shadow-md"
        >
          {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
          {isEditMode ? "CẬP NHẬT DỮ LIỆU" : "KHỞI TẠO CHI NHÁNH"}
        </Button>
      </div>
    </form>
  );
}