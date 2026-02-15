"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X, Settings, HelpCircle, Save, ChevronLeft,
  Building2, User, Mail, Phone, MapPin,
  AlertCircle, Loader2, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { AdminBranchSchema, AdminBranchForm } from "@/app/types/admin.schema";
import { BranchService } from '@/app/services/branchService';
import axios from "axios";

export default function AddBranchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const idFromUrl = searchParams.get("id");
  const isEditMode = Boolean(idFromUrl);
  const branchId = idFromUrl;

  const [isLoading, setIsLoading] = useState(false);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [isInitialLoaded, setIsInitialLoaded] = useState(false);

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
      branchType: "store",
    }
  });

  const selectedProvince = watch("province");
  const selectedDistrict = watch("district");

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

  // 1. Khởi tạo
  useEffect(() => {
    const initData = async () => {
      try {
        const [staffRes, provinceRes] = await Promise.all([
          BranchService.getAllStaff(),
          axios.get("https://provinces.open-api.vn/api/p/")
        ]);
        setStaffs(staffRes.data);
        setProvinces(provinceRes.data);
        setIsInitialLoaded(true);
      } catch (error) { console.error(error); }
    };
    initData();
  }, []);

  // 2. Lấy Quận/Huyện
  useEffect(() => {
    if (selectedProvince && selectedProvince !== "none" && !isLoading) {
      const fetchDistricts = async () => {
        try {
          const res = await axios.get(`https://provinces.open-api.vn/api/p/${selectedProvince}?depth=2`);
          setDistricts(res.data.districts || []);
        } catch (error) { console.error(error); }
      };
      fetchDistricts();
    }
  }, [selectedProvince, isLoading]);

  // 3. Lấy Phường/Xã
  useEffect(() => {
    if (selectedDistrict && selectedDistrict !== "none" && !isLoading) {
      const fetchWards = async () => {
        try {
          const res = await axios.get(`https://provinces.open-api.vn/api/d/${selectedDistrict}?depth=2`);
          setWards(res.data.wards || []);
        } catch (error) { console.error(error); }
      };
      fetchWards();
    }
  }, [selectedDistrict, isLoading]);

  // 4. Reset dữ liệu khi SỬA
  useEffect(() => {
    if (isEditMode && branchId && isInitialLoaded) {
      const fetchFullDetail = async () => {
        try {
          setIsLoading(true);
          const res = await BranchService.getById(branchId);
          const data = res.data;
          const [distRes, wardRes] = await Promise.all([
            axios.get(`https://provinces.open-api.vn/api/p/${data.provinceId}?depth=2`),
            axios.get(`https://provinces.open-api.vn/api/d/${data.districtId}?depth=2`)
          ]);
          setDistricts(distRes.data.districts || []);
          setWards(wardRes.data.wards || []);
          reset({
            id: data.branchCode,
            name: data.name,
            branchType: data.branchType,
            phone: data.phone,
            email: data.email || "",
            addressDetail: data.addressDetail,
            province: String(data.provinceId),
            district: String(data.districtId),
            ward: String(data.wardId),
            status: data.status.toLowerCase(),
            managerId: data.managerIds && data.managerIds.length > 0 ? String(data.managerIds[0]) : "",
          });
        } catch (error) { toast.error("Lỗi tải thông tin!"); }
        finally { setIsLoading(false); }
      };
      fetchFullDetail();
    } else if (!isEditMode && isInitialLoaded) {
      setValue("id", "CN-" + Math.floor(100 + Math.random() * 900));
    }
  }, [isEditMode, branchId, isInitialLoaded, reset, setValue]);

  const onSubmit = async (data: AdminBranchForm) => {
    try {
      setIsLoading(true);
      const payload = {
        branchCode: data.id,
        name: data.name,
        branchType: data.branchType,
        phone: data.phone,
        email: data.email,
        addressDetail: data.addressDetail,
        provinceId: Number(data.province),
        districtId: Number(data.district),
        wardId: Number(data.ward),
        status: data.status.toUpperCase(),
        managerIds: data.managerId ? [Number(data.managerId)] : [],
      };
      if (isEditMode) {
        await BranchService.update(branchId!, payload);
        toast.success("Cập nhật thành công!");
      } else {
        await BranchService.create(payload);
        toast.success("Tạo thành công!");
      }
      router.push("/admin/branches");
    } catch (error: any) { toast.error("Lỗi dữ liệu"); }
    finally { setIsLoading(false); }
  };

  // Hàm helper để render Search Input trong Select
  const renderSearchInput = (placeholder: string) => (
    <div className="sticky top-0 z-10 bg-white p-2 border-b border-slate-100">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        <Input
          placeholder={placeholder}
          className="h-8 pl-8 text-[12px] rounded-none focus-visible:ring-0 focus-visible:border-emerald-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()} // Quan trọng: Tránh đóng Select khi bấm phím
        />
      </div>
    </div>
  );

  if (isEditMode && isLoading && districts.length === 0) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-[100px] bg-slate-50/30 p-4 min-h-screen">
      <div className="flex items-center gap-4 mb-2 px-1">
        <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400">
          <ChevronLeft size={20} />
        </Button>
        <h1 className="text-[18px] font-black text-[#1f1f1f] tracking-tight uppercase">
          {isEditMode ? "Cập nhật chi nhánh" : "Khởi tạo chi nhánh mới"}
        </h1>
        <div className="ms-auto flex items-center gap-3 text-gray-400">
          <Settings size={18} className="cursor-pointer" />
          <HelpCircle size={18} className="cursor-pointer" />
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8"><X size={20} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-9 space-y-5">
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <Building2 size={16} /> 1. Thông tin định danh chi nhánh
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase">Tên chi nhánh *</Label>
                <Input {...register("name")} className="h-[34px] text-[13px] border-[#ccc] rounded-none font-bold" />
                {errors.name && <p className="text-[10px] text-red-500 font-bold">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase">Loại hình *</Label>
                <Controller
                  name="branchType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="hub">KHO TRUNG TÂM</SelectItem>
                        <SelectItem value="store">CỬA HÀNG BÁN LẺ</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase">Mã chi nhánh *</Label>
                <Input {...register("id")} disabled={isEditMode} className="h-[34px] text-[13px] border-[#ccc] rounded-none font-mono uppercase bg-slate-50" />
              </div>
            </div>
          </div>

          {/* 2. Địa chỉ & Vị trí - TÍCH HỢP TÌM KIẾM */}
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
                      <SelectTrigger className="h-[34px] text-[12px] border-[#ccc] rounded-none">
                        <SelectValue placeholder="-- Chọn Tỉnh --" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none z-[1000] p-0">
                        {renderSearchInput("Tìm tỉnh...")}
                        <div className="max-h-[200px] overflow-y-auto">
                          {filteredProvinces.map(p => <SelectItem key={p.code} value={String(p.code)}>{p.name}</SelectItem>)}
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
                    >
                      <SelectTrigger className="h-[34px] text-[12px] border-[#ccc] rounded-none">
                        <SelectValue placeholder="-- Chọn Huyện --" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none z-[1000] p-0">
                        {renderSearchInput("Tìm huyện...")}
                        <div className="max-h-[200px] overflow-y-auto">
                          {filteredDistricts.map(d => <SelectItem key={d.code} value={String(d.code)}>{d.name}</SelectItem>)}
                        </div>
                      </SelectContent>
                    </Select>
                  )}
                />
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
                    >
                      <SelectTrigger className="h-[34px] text-[12px] border-[#ccc] rounded-none">
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
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase">Địa chỉ chi tiết *</Label>
                <Input {...register("addressDetail")} className="h-[34px] text-[13px] border-[#ccc] rounded-none focus:border-emerald-500 shadow-none" />
              </div>
            </div>
          </div>

          {/* 3. Phụ trách - TÍCH HỢP TÌM KIẾM */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <User size={16} /> 3. Nhân sự phụ trách & Liên hệ
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Người quản lý *</Label>
                <Controller
                  name="managerId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(val) => { field.onChange(val); setSearchTerm(""); }}
                      value={field.value ? String(field.value) : undefined}
                      onOpenChange={(open) => !open && setSearchTerm("")}
                    >
                      <SelectTrigger className="h-[34px] text-[13px] border-[#ccc] rounded-none">
                        <SelectValue placeholder="-- Tìm nhân sự --" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none z-[1050] p-0">
                        {renderSearchInput("Nhập tên quản lý...")}
                        <div className="max-h-[200px] overflow-y-auto">
                          {filteredStaffs.map(staff => (
                            <SelectItem key={staff.id} value={String(staff.id)}>{staff.fullName}</SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase">Số điện thoại *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <Input {...register("phone")} className="h-[34px] pl-9 text-[13px] border-[#ccc] rounded-none font-bold" />
                </div>
              </div>
              <div className="space-y-1.5 relative">
                <Label className="text-[10px] font-black text-slate-500 uppercase">Email chi nhánh</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <Input {...register("email")} className="h-[34px] pl-9 text-[13px] border-[#ccc] rounded-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <Label className="text-[11px] font-black text-slate-700 uppercase block mb-5 border-b pb-3">Trạng thái vận hành</Label>
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
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t p-[12px_30px] flex items-center justify-end gap-[15px] z-[999]">
        <Button type="button" variant="outline" className="min-w-[110px] h-[38px] text-[12px] font-bold border-[#ccc] bg-white rounded-none" onClick={() => router.back()}>
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