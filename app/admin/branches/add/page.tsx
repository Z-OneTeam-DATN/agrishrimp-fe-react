"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X, Settings, HelpCircle, Save, ChevronLeft,
  Building2, User, Mail, Phone, MapPin,
  Map, AlertCircle, LayoutGrid, Tags
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AdminBranchSchema, AdminBranchForm } from "@/app/types/admin.schema";

export default function AddBranchPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AdminBranchForm>({
    resolver: zodResolver(AdminBranchSchema),
    defaultValues: {
      id: "CN-" + Math.floor(100 + Math.random() * 900),
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
      area: "west",
      priceList: "standard"
    }
  });

  const onSubmit = async (data: AdminBranchForm) => {
    setIsSubmitting(true);
    try {
      console.log("Branch Data:", data);
      toast.success("Đã khởi tạo chi nhánh mới thành công!");
      router.push("/admin/branches");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi lưu dữ liệu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-[100px] bg-slate-50/30 p-4 min-h-screen">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-2 px-1">
        <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400">
          <ChevronLeft size={20} />
        </Button>
        <h1 className="text-[18px] font-black text-[#1f1f1f] tracking-tight uppercase">
          Khởi tạo chi nhánh mới
        </h1>
        <div className="ms-auto flex items-center gap-3 text-gray-400">
          <Settings size={18} className="cursor-pointer hover:text-emerald-600 transition-colors" />
          <HelpCircle size={18} className="cursor-pointer hover:text-emerald-600 transition-colors" />
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8"><X size={20} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Content - Left */}
        <div className="lg:col-span-9 space-y-5">

          {/* 1. Thông tin định danh */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <Building2 size={16} /> 1. Thông tin định danh chi nhánh
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <div className="md:col-span-2 space-y-1.5 relative">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Tên chi nhánh / Kho hàng *</Label>
                <Input {...register("name")} placeholder="" className="h-[34px] text-[13px] border-[#ccc] rounded-none font-bold shadow-none focus:border-emerald-500" />
                {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.name.message}</p>}
              </div>
              
              <div className="space-y-1.5 relative">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Loại hình chi nhánh *</Label>
                <Controller
                  name="branchType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="hub" className="font-bold text-blue-600">KHO TRUNG TÂM / TRỤ SỞ</SelectItem>
                        <SelectItem value="store" className="font-bold text-slate-600">CỬA HÀNG BÁN LẺ</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.branchType && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.branchType.message}</p>}
              </div>

              <div className="space-y-1.5 relative">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Mã chi nhánh (Định danh) *</Label>
                <Input {...register("id")} className="h-[34px] text-[13px] border-[#ccc] rounded-none font-mono uppercase bg-slate-50 shadow-none" />
                {errors.id && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.id.message}</p>}
              </div>
            </div>
          </div>

          {/* 2. Địa chỉ & Vị trí */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <MapPin size={16} /> 2. Vị trí địa lý & Địa chỉ kho
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <div className="space-y-1.5 relative">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Tỉnh / Thành phố *</Label>
                <Controller
                  name="province"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-[34px] text-[12px] border-[#ccc] rounded-none focus:ring-0"><SelectValue placeholder="-- Chọn Tỉnh/TP --" /></SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="ct">Cần Thơ</SelectItem>
                        <SelectItem value="st">Sóc Trăng</SelectItem>
                        <SelectItem value="bl">Bạc Liêu</SelectItem>
                        <SelectItem value="hcm">TP. Hồ Chí Minh</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.province && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.province.message}</p>}
              </div>
              <div className="space-y-1.5 relative">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Quận / Huyện *</Label>
                <Controller
                  name="district"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-[34px] text-[12px] border-[#ccc] rounded-none focus:ring-0"><SelectValue placeholder="-- Chọn Quận/Huyện --" /></SelectTrigger>
                      <SelectContent className="rounded-none"><SelectItem value="nk">Ninh Kiều</SelectItem></SelectContent>
                    </Select>
                  )}
                />
                {errors.district && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.district.message}</p>}
              </div>
              <div className="space-y-1.5 relative">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Phường / Xã *</Label>
                <Controller
                  name="ward"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-[34px] text-[12px] border-[#ccc] rounded-none focus:ring-0"><SelectValue placeholder="-- Chọn Phường/Xã --" /></SelectTrigger>
                      <SelectContent className="rounded-none"><SelectItem value="xk">Xuân Khánh</SelectItem></SelectContent>
                    </Select>
                  )}
                />
                {errors.ward && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.ward.message}</p>}
              </div>
              <div className="md:col-span-3 space-y-1.5 relative">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Số nhà, tên đường (Địa chỉ chi tiết) *</Label>
                <Input {...register("addressDetail")} placeholder="" className="h-[34px] text-[13px] border-[#ccc] rounded-none focus:border-emerald-500 shadow-none" />
                {errors.addressDetail && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.addressDetail.message}</p>}
              </div>
            </div>
          </div>

          {/* 3. Phụ trách & Liên hệ */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <User size={16} /> 3. Nhân sự phụ trách & Liên hệ hệ thống
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <div className="space-y-1.5 relative">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Người quản lý chi nhánh *</Label>
                <Controller
                  name="managerId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-[34px] text-[13px] border-[#ccc] rounded-none focus:ring-0">
                        <SelectValue placeholder="-- Chọn nhân sự --" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="1">Nguyễn Văn An (NV-001)</SelectItem>
                        <SelectItem value="2">Trần Thị Bích (NV-002)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.managerId && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.managerId.message}</p>}
              </div>
              <div className="space-y-1.5 relative">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Số điện thoại liên hệ *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <Input {...register("phone")} placeholder="" className="h-[34px] pl-9 text-[13px] border-[#ccc] rounded-none font-bold focus:border-emerald-500 shadow-none" />
                </div>
                {errors.phone && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.phone.message}</p>}
              </div>
              <div className="space-y-1.5 relative">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Email chi nhánh *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <Input {...register("email")} type="email" placeholder="" className="h-[34px] pl-9 text-[13px] border-[#ccc] rounded-none focus:border-emerald-500 shadow-none" />
                </div>
                {errors.email && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.email.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Right */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <Label className="text-[11px] font-black text-slate-700 uppercase block mb-5 tracking-widest border-b pb-3">Trạng thái vận hành</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-[38px] text-[13px] border-[#ccc] rounded-none font-black text-emerald-600 shadow-none uppercase focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none font-bold text-[11px]">
                    <SelectItem value="active">ĐANG HOẠT ĐỘNG</SelectItem>
                    <SelectItem value="maint">ĐANG BẢO TRÌ</SelectItem>
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
              * Mã chi nhánh là định danh duy nhất và <span className="underline font-black text-amber-800">KHÔNG THỂ THAY ĐỔI</span> sau khi đã khởi tạo trên hệ thống.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[12px_30px] flex items-center justify-end gap-[15px] z-[999] shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        <Button type="button" variant="outline" className="min-w-[110px] h-[38px] text-[12px] font-bold border-[#ccc] bg-white rounded-none shadow-sm hover:bg-slate-50 transition-all uppercase" onClick={() => router.back()}>
          HỦY BỎ
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-[160px] h-[38px] text-[12px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-none shadow-md shadow-emerald-100 transition-all active:scale-[0.98] uppercase"
        >
          <Save size={18} className="mr-2" />
          {isSubmitting ? "ĐANG LƯU..." : "LƯU CHI NHÁNH"}
        </Button>
      </div>
    </form>
  );
}
