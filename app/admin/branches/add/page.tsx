"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X, Settings, HelpCircle, Save, ChevronLeft,
  Building2, User, Mail, Phone, MapPin,
  Map, AlertCircle
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
      area: "west" // Mặc định khu vực Miền Tây
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pb-[100px]">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-4 px-1">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Main Content - Left */}
        <div className="lg:col-span-8 space-y-3">

          {/* 1. Thông tin định danh */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
              <Building2 size={16} /> 1. Thông tin định danh chi nhánh
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Tên chi nhánh *</Label>
                <Input {...register("name")} placeholder="Ví dụ: Chi nhánh Cần Thơ 1..." className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] font-bold shadow-none" />
                {errors.name && <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">{errors.name.message}</p>}
              </div>
              <div className="space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Mã chi nhánh *</Label>
                <Input {...register("id")} placeholder="CN-000" className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] font-mono uppercase bg-slate-50" />
                {errors.id && <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">{errors.id.message}</p>}
              </div>
            </div>
          </div>

          {/* 2. Địa chỉ & Vị trí */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
              <MapPin size={16} /> 2. Vị trí địa lý & Kho hàng
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-4">
              <div className="space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Tỉnh / Thành phố *</Label>
                <Controller
                  name="province"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-[32px] text-[12px] border-[#ccc] rounded-[3px]"><SelectValue placeholder="Chọn Tỉnh/TP" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ct">Cần Thơ</SelectItem>
                        <SelectItem value="st">Sóc Trăng</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.province && <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">{errors.province.message}</p>}
              </div>
              <div className="space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Quận / Huyện *</Label>
                <Controller
                  name="district"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-[32px] text-[12px] border-[#ccc] rounded-[3px]"><SelectValue placeholder="Chọn Quận/Huyện" /></SelectTrigger>
                      <SelectContent><SelectItem value="nk">Ninh Kiều</SelectItem></SelectContent>
                    </Select>
                  )}
                />
                {errors.district && <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">{errors.district.message}</p>}
              </div>
              <div className="space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Phường / Xã *</Label>
                <Controller
                  name="ward"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-[32px] text-[12px] border-[#ccc] rounded-[3px]"><SelectValue placeholder="Chọn Phường/Xã" /></SelectTrigger>
                      <SelectContent><SelectItem value="xk">Xuân Khánh</SelectItem></SelectContent>
                    </Select>
                  )}
                />
                {errors.ward && <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">{errors.ward.message}</p>}
              </div>
              <div className="md:col-span-3 space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Địa chỉ chi tiết *</Label>
                <Input {...register("addressDetail")} placeholder="Nhập địa chỉ chính xác..." className="h-[32px] text-[13px] border-[#ccc] rounded-[3px]" />
                {errors.addressDetail && <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">{errors.addressDetail.message}</p>}
              </div>
            </div>
          </div>

          {/* 3. Phụ trách & Liên hệ */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
              <User size={16} /> 3. Nhân sự phụ trách & Liên hệ
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-4">
              <div className="space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Người quản lý *</Label>
                <Controller
                  name="managerId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-[32px] text-[13px] border-[#ccc] rounded-[3px]">
                        <SelectValue placeholder="-- Chọn nhân sự --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Nguyễn Văn An (NV-001)</SelectItem>
                        <SelectItem value="2">Trần Thị Bích (NV-002)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.managerId && <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">{errors.managerId.message}</p>}
              </div>
              <div className="space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Số điện thoại *</Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <Input {...register("phone")} placeholder="090x xxx xxx" className="h-[32px] pl-8 text-[13px] border-[#ccc] rounded-[3px] font-bold" />
                </div>
                {errors.phone && <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">{errors.phone.message}</p>}
              </div>
              <div className="space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Email liên hệ *</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <Input {...register("email")} type="email" placeholder="branch@agri.com" className="h-[32px] pl-8 text-[13px] border-[#ccc] rounded-[3px]" />
                </div>
                {errors.email && <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">{errors.email.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Right */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <Label className="text-[11px] font-bold text-slate-500 uppercase block mb-3 tracking-widest">Khu vực quản lý *</Label>
            <Controller
              name="area"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-[32px] text-[13px] border-[#ccc] rounded-[3px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="west">MIỀN TÂY</SelectItem>
                    <SelectItem value="east">MIỀN ĐÔNG</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <Label className="text-[11px] font-bold text-slate-500 uppercase block mb-3 tracking-widest">Trạng thái vận hành</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] font-black text-emerald-600 shadow-none uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">ĐANG HOẠT ĐỘNG</SelectItem>
                    <SelectItem value="maint">ĐANG BẢO TRÌ</SelectItem>
                    <SelectItem value="inactive">NGỪNG HOẠT ĐỘNG</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="p-4 bg-amber-50 border border-amber-100 rounded-[4px]">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-[11px] uppercase mb-2">
              <AlertCircle size={14} /> Lưu ý
            </div>
            <p className="text-[11px] text-amber-600 leading-relaxed italic">
              * Vui lòng kiểm tra kỹ Mã chi nhánh vì đây là định danh duy nhất không thể thay đổi sau khi tạo.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[8px_20px] flex items-center justify-end gap-[10px] z-[999]">
        <Button type="button" variant="outline" className="min-w-[100px] h-[34px] text-[12px] font-bold border-[#ccc] bg-white" onClick={() => router.back()}>
          HỦY BỎ
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-[120px] h-[34px] text-[12px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-[3px] shadow-md shadow-emerald-100"
        >
          <Save size={16} className="mr-2" />
          {isSubmitting ? "ĐANG LƯU..." : "LƯU CHI NHÁNH"}
        </Button>
      </div>
    </form>
  );
}