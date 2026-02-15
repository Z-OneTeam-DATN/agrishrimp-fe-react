"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  Settings,
  HelpCircle,
  Save,
  ChevronLeft,
  User,
  Mail,
  Phone,
  Building2,
  Camera,
  Calendar,
  MapPin,
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
import { cn } from "@/lib/utils";
import { EmployeeSchema, EmployeeFormValues } from "@/app/types/admin.schema";

export default function AddEmployeePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(EmployeeSchema),
    defaultValues: {
      fullName: "",
      employeeCode: "NV-" + Math.floor(1000 + Math.random() * 9000),
      email: "",
      phone: "",
      address: "",
      branchId: "",
      role: "",
      status: "active",
      startDate: new Date().toISOString().split("T")[0],
    },
  });

  const avatarPreview = watch("avatar");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setValue("avatar", event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSave = (data: EmployeeFormValues) => {
    console.log("Employee Data:", data);
    toast.success("Đã lưu thông tin nhân viên thành công!");
    router.push("/admin/employees");
  };

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-3 pb-[100px]">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-4 px-1">
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
          Thêm nhân viên mới
        </h1>
        <div className="ms-auto flex items-center gap-3 text-gray-400">
          <Settings
            size={18}
            className="cursor-pointer hover:text-emerald-600 transition-colors"
          />
          <HelpCircle
            size={18}
            className="cursor-pointer hover:text-emerald-600 transition-colors"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8"
          >
            <X size={20} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-3">
          {/* 1. Thông tin cá nhân */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
              <User size={16} /> 1. Thông tin cá nhân cơ bản
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                  Họ và tên nhân viên *
                </Label>
                <Input
                  {...register("fullName")}
                  placeholder="Nhập đầy đủ họ tên..."
                  className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none"
                />
                {errors.fullName && (
                  <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">
                    {errors.fullName.message}
                  </p>
                )}
              </div>
              <div className="space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                  Mã nhân viên *
                </Label>
                <Input
                  {...register("employeeCode")}
                  className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] font-mono shadow-none uppercase bg-slate-50"
                />
                {errors.employeeCode && (
                  <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">
                    {errors.employeeCode.message}
                  </p>
                )}
              </div>
              <div className="space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                  Email liên hệ *
                </Label>
                <div className="relative">
                  <Mail
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300"
                    size={14}
                  />
                  <Input
                    {...register("email")}
                    type="email"
                    placeholder="example@agri.com"
                    className="h-[32px] pl-8 text-[13px] border-[#ccc] rounded-[3px] shadow-none"
                  />
                </div>
                {errors.email && (
                  <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                  Số điện thoại *
                </Label>
                <div className="relative">
                  <Phone
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300"
                    size={14}
                  />
                  <Input
                    {...register("phone")}
                    placeholder="090x xxx xxx"
                    className="h-[32px] pl-8 text-[13px] border-[#ccc] rounded-[3px] shadow-none font-bold"
                  />
                </div>
                {errors.phone && (
                  <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">
                    {errors.phone.message}
                  </p>
                )}
              </div>
              <div className="md:col-span-2 space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                  Địa chỉ thường trú
                </Label>
                <div className="relative">
                  <MapPin
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300"
                    size={14}
                  />
                  <Input
                    {...register("address")}
                    placeholder="Số nhà, tên đường, phường/xã..."
                    className="h-[32px] pl-8 text-[13px] border-[#ccc] rounded-[3px] shadow-none"
                  />
                </div>
                {errors.address && (
                  <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">
                    {errors.address.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 2. Thông tin công tác */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
              <Building2 size={16} /> 2. Thông tin công tác & Phân quyền
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                  Chi nhánh làm việc *
                </Label>
                <Controller
                  name="branchId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none">
                        <SelectValue placeholder="-- Chọn chi nhánh --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ct">Chi nhánh Cần Thơ</SelectItem>
                        <SelectItem value="st">Chi nhánh Sóc Trăng</SelectItem>
                        <SelectItem value="bl">Chi nhánh Bạc Liêu</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.branchId && (
                  <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">
                    {errors.branchId.message}
                  </p>
                )}
              </div>
              <div className="space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                  Chức vụ / Quyền hạn *
                </Label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none font-bold text-emerald-600">
                        <SelectValue placeholder="-- Phân quyền --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mgr">QUẢN LÝ CHI NHÁNH</SelectItem>
                        <SelectItem value="staff">NHÂN VIÊN KHO</SelectItem>
                        <SelectItem value="sale">NHÂN VIÊN BÁN HÀNG</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.role && (
                  <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">
                    {errors.role.message}
                  </p>
                )}
              </div>
              <div className="space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                  Ngày vào làm *
                </Label>
                <div className="relative">
                  <Calendar
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300"
                    size={14}
                  />
                  <Input
                    {...register("startDate")}
                    type="date"
                    className="h-[32px] pl-8 text-[13px] border-[#ccc] rounded-[3px] shadow-none"
                  />
                </div>
                {errors.startDate && (
                  <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">
                    {errors.startDate.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-center">
            <Label className="text-[11px] font-bold text-slate-500 uppercase block mb-4 tracking-widest">
              Ảnh chân dung
            </Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative mx-auto w-32 h-32 border-2 border-dashed border-[#ddd] rounded-full flex flex-col items-center justify-center bg-[#fcfcfc] hover:bg-emerald-50 transition-all cursor-pointer overflow-hidden group"
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <Camera size={24} className="text-slate-200 mx-auto mb-1" />
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                    Tải ảnh
                  </span>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                hidden
                accept="image/*"
              />
            </div>
            <p className="text-[10px] text-slate-400 italic mt-4 leading-relaxed">
              Dung lượng tối đa 2MB.
            </p>
          </div>

          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <Label className="text-[11px] font-bold text-slate-500 uppercase block mb-3 tracking-widest">
              Trạng thái tài khoản
            </Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] font-black text-emerald-600 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">ĐANG HOẠT ĐỘNG</SelectItem>
                    <SelectItem value="locked">ĐANG TẠM KHÓA</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[8px_20px] flex items-center justify-end gap-[10px] z-[999]">
        <Button
          type="button"
          variant="outline"
          className="min-w-[100px] h-[34px] text-[12px] font-bold"
          onClick={() => router.back()}
        >
          HỦY BỎ
        </Button>
        <Button
          type="submit"
          className="min-w-[120px] h-[34px] text-[12px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-[3px] shadow-md shadow-emerald-100"
        >
          <Save size={16} className="mr-2" /> LƯU DỮ LIỆU
        </Button>
      </div>
    </form>
  );
}
