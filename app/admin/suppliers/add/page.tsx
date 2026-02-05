"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  X, Settings, HelpCircle, Save, ChevronLeft, 
  User, MapPin, Landmark, Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { SupplierSchema, SupplierFormValues } from "@/app/types/admin.schema";
import { SupplierService } from "@/app/services/supplier.service";

export default function AddSupplierPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(SupplierSchema),
    defaultValues: {
      status: "active",
      discount: 0,
      provinceId: "", // Khởi tạo rỗng để Zod bắt lỗi yêu cầu chọn
      category: undefined,
    },
  });

  const onSubmit = async (data: SupplierFormValues) => {
    setIsSubmitting(true);
    try {
      // await SupplierService.createSupplier(data);
      console.log("Data submit:", data);
      toast.success("Đã lưu thông tin nhà cung cấp thành công!");
      router.push("/admin/suppliers");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi lưu nhà cung cấp.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pb-[100px]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4 px-1">
        <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400">
          <ChevronLeft size={20} />
        </Button>
        <h1 className="text-[18px] font-black text-[#1f1f1f] tracking-tight uppercase">Thêm nhà cung cấp mới</h1>
        <div className="ms-auto flex items-center gap-3 text-gray-400">
          <Settings size={18} />
          <HelpCircle size={18} />
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8"><X size={20} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-9 space-y-3">

          {/* 1. Thông tin pháp nhân */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
              <Truck size={16} /> 1. Thông tin pháp nhân nhà cung cấp
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="md:col-span-2 space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Tên công ty *</Label>
                <Input {...register("name")} placeholder="Ví dụ: TỔNG CÔNG TY C.P. VIỆT NAM..." className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none" />
                {errors.name && <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">{errors.name.message}</p>}
              </div>
              <div className="space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Mã số thuế *</Label>
                <Input {...register("taxCode")} placeholder="Nhập mã số thuế..." className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none font-mono" />
                {errors.taxCode && <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">{errors.taxCode.message}</p>}
              </div>
              <div className="space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Nhóm hàng chính *</Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none">
                        <SelectValue placeholder="Chọn nhóm hàng" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feed">Thức ăn thủy sản</SelectItem>
                        <SelectItem value="med">Thuốc & Vi sinh</SelectItem>
                        <SelectItem value="tool">Thiết bị & Phụ trợ</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">{errors.category.message}</p>}
              </div>
            </div>
          </div>

          {/* 2. Liên hệ */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
              <User size={16} /> 2. Thông tin liên hệ trực tiếp
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-4">
              <div className="space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Họ và tên *</Label>
                <Input {...register("contactName")} placeholder="Tên người đại diện..." className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none" />
                {errors.contactName && <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">{errors.contactName.message}</p>}
              </div>
              <div className="space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Số điện thoại *</Label>
                <Input {...register("phone")} placeholder="090x xxx xxx" className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none" />
                {errors.phone && <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">{errors.phone.message}</p>}
              </div>
              <div className="space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Email</Label>
                <Input {...register("email")} placeholder="example@supplier.com" className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none" />
                {errors.email && <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">{errors.email.message}</p>}
              </div>
            </div>
          </div>

          {/* 3. Địa chỉ */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
              <MapPin size={16} /> 3. Trụ sở / Kho bãi nhà cung cấp
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-4">
              <div className="md:col-span-1 space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Tỉnh / Thành phố *</Label>
                <Controller
                  name="provinceId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-[32px] text-[12px] border-[#ccc] rounded-[3px] shadow-none">
                        <SelectValue placeholder="Chọn Tỉnh/TP" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ct">Cần Thơ</SelectItem>
                        <SelectItem value="hcm">Hồ Chí Minh</SelectItem>
                        <SelectItem value="hn">Hà Nội</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.provinceId && <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">{errors.provinceId.message}</p>}
              </div>
              <div className="md:col-span-2 space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Địa chỉ chi tiết *</Label>
                <Input {...register("addressDetail")} placeholder="Số nhà, tên đường..." className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none" />
                {errors.addressDetail && <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">{errors.addressDetail.message}</p>}
              </div>
            </div>
          </div>

          {/* 4. Tài chính */}
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-emerald-700 font-black text-[11px] uppercase tracking-wider">
              <Landmark size={16} /> 4. Chính sách thanh toán & Tài chính
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-4">
              <div className="space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Chiết khấu (%)</Label>
                <Input {...register("discount")} type="number" className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none text-right font-bold text-emerald-600" />
                {errors.discount && <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">{errors.discount.message}</p>}
              </div>
              <div className="md:col-span-2 space-y-[2px] relative pb-5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Tài khoản thanh toán</Label>
                <Input {...register("bankAccount")} placeholder="Số tài khoản - Ngân hàng..." className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] shadow-none" />
                {errors.bankAccount && <p className="absolute bottom-0 text-[11px] text-red-500 font-bold">{errors.bankAccount.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <Label className="text-[11px] font-bold text-slate-500 uppercase block mb-3 tracking-widest">Trạng thái</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-[32px] text-[13px] border-[#ccc] rounded-[3px] font-black text-emerald-600 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">ĐANG GIAO DỊCH</SelectItem>
                    <SelectItem value="inactive">TẠM NGỪNG</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="bg-white border border-[#dcdcdc] p-[15px_20px] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <Label className="text-[11px] font-bold text-slate-500 uppercase block mb-2 tracking-widest">Ghi chú</Label>
            <Textarea {...register("note")} placeholder="Lưu ý..." className="min-h-[100px] text-[12px] border-[#ccc] rounded-[3px] shadow-none" />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[8px_20px] flex items-center justify-end gap-[10px] z-[999]">
        <Button type="button" variant="outline" className="min-w-[100px] h-[34px] text-[12px] font-bold" onClick={() => router.back()}>HỦY BỎ</Button>
        <Button type="submit" disabled={isSubmitting} className="min-w-[160px] h-[34px] text-[12px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-[3px] shadow-md">
          <Save size={16} className="mr-2" />
          {isSubmitting ? "ĐANG LƯU..." : "LƯU NHÀ CUNG CẤP"}
        </Button>
      </div>
    </form>
  );
}