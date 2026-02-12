"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  X, Settings, HelpCircle, Save, ChevronLeft, 
  User, MapPin, Landmark, Truck, Search
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
import { cn } from "@/lib/utils";

export default function AddSupplierPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(SupplierSchema),
    defaultValues: {
      status: "active",
      discount: 0,
      provinceId: "",
      creditLimit: 0,
    },
  });

  const onSubmit = async (data: SupplierFormValues) => {
    setIsSubmitting(true);
    try {
      console.log("Data submit:", data);
      toast.success("Đã lưu thông tin nhà cung cấp thành công!");
      router.push("/admin/suppliers");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi lưu nhà cung cấp.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLookupTaxCode = () => {
    const taxCode = watch("taxCode");
    if (!taxCode) {
      toast.error("Vui lòng nhập mã số thuế để tra cứu");
      return;
    }
    toast.info("Đang tra cứu thông tin doanh nghiệp...");
    // Giả lập API tra cứu
    setTimeout(() => {
      toast.success("Đã tìm thấy thông tin doanh nghiệp!");
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-[100px] bg-slate-50/30 p-4 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2 px-1">
        <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400">
          <ChevronLeft size={20} />
        </Button>
        <h1 className="text-[18px] font-black text-[#1f1f1f] tracking-tight uppercase">Thêm nhà cung cấp mới</h1>
        <div className="ms-auto flex items-center gap-3 text-gray-400">
          <Settings size={18} className="cursor-pointer hover:text-emerald-600 transition-colors" />
          <HelpCircle size={18} className="cursor-pointer hover:text-emerald-600 transition-colors" />
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8"><X size={20} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-9 space-y-5">

          {/* 1. Thông tin pháp nhân */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <Truck size={16} /> 1. Thông tin pháp nhân nhà cung cấp
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div className="md:col-span-2 space-y-1.5 relative">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Tên công ty / Pháp nhân *</Label>
                <Input {...register("name")} className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:border-emerald-500" />
                {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.name.message}</p>}
              </div>
              
              <div className="space-y-1.5 relative">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Mã số thuế *</Label>
                <div className="flex gap-0">
                  <Input {...register("taxCode")} placeholder="" className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none font-mono focus:border-emerald-500" />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleLookupTaxCode}
                    className="h-[34px] bg-slate-50 border-[#ccc] border-l-0 rounded-none px-3 text-[10px] font-black text-blue-600 hover:bg-blue-50"
                  >
                    <Search size={14} className="mr-1" /> TRA CỨU
                  </Button>
                </div>
                {errors.taxCode && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.taxCode.message}</p>}
              </div>

              <div className="space-y-1.5 relative">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Nhóm hàng chính *</Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:ring-0">
                        <SelectValue placeholder="-- Chọn nhóm hàng --" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="feed">Thức ăn thủy sản</SelectItem>
                        <SelectItem value="med">Thuốc & Vi sinh</SelectItem>
                        <SelectItem value="tool">Thiết bị & Phụ trợ</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.category.message}</p>}
              </div>
            </div>
          </div>

          {/* 2. Liên hệ */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <User size={16} /> 2. Thông tin liên hệ trực tiếp
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Họ và tên người đại diện *</Label>
                <Input {...register("contactName")} className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:border-emerald-500" />
                {errors.contactName && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.contactName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Số điện thoại di động *</Label>
                <Input {...register("phone")} className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:border-emerald-500" />
                {errors.phone && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.phone.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Email liên hệ</Label>
                <Input {...register("email")} className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:border-emerald-500" />
                {errors.email && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.email.message}</p>}
              </div>
            </div>
          </div>

          {/* 3. Địa chỉ */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <MapPin size={16} /> 3. Trụ sở / Kho bãi nhà cung cấp
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Tỉnh / Thành phố *</Label>
                <Controller
                  name="provinceId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:ring-0">
                        <SelectValue placeholder="-- Chọn Tỉnh/TP --" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="ct">Cần Thơ</SelectItem>
                        <SelectItem value="hcm">Hồ Chí Minh</SelectItem>
                        <SelectItem value="hn">Hà Nội</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.provinceId && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.provinceId.message}</p>}
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Địa chỉ chi tiết (Số nhà, tên đường...) *</Label>
                <Input {...register("addressDetail")} className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:border-emerald-500" />
                {errors.addressDetail && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.addressDetail.message}</p>}
              </div>
            </div>
          </div>

          {/* 4. Tài chính */}
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
              <Landmark size={16} /> 4. Chính sách thanh toán & Tài chính
            </div>
            <div className="space-y-6">
              {/* Row 1: Terms & Limits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Chu kỳ thanh toán (Payment Terms) *</Label>
                  <Controller
                    name="paymentTerms"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:ring-0">
                          <SelectValue placeholder="-- Chọn chu kỳ --" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          <SelectItem value="immediate">Thanh toán ngay</SelectItem>
                          <SelectItem value="net15">Công nợ 15 ngày</SelectItem>
                          <SelectItem value="net30">Công nợ 30 ngày (Net30)</SelectItem>
                          <SelectItem value="deferred">Gối đầu đơn hàng</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.paymentTerms && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.paymentTerms.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-rose-600 uppercase tracking-tight">Hạn mức công nợ tối đa (₫)</Label>
                  <Input {...register("creditLimit")} type="number" className="h-[34px] text-[13px] border-[#ccc] rounded-none text-right font-bold text-rose-600 bg-rose-50/10 focus:border-rose-500 shadow-none" />
                  {errors.creditLimit && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.creditLimit.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">Chiết khấu (%)</Label>
                  <Input {...register("discount")} type="number" className="h-[34px] text-[13px] border-[#ccc] rounded-none text-right font-bold text-emerald-600 bg-emerald-50/10 focus:border-emerald-500 shadow-none" />
                  {errors.discount && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.discount.message}</p>}
                </div>
              </div>

              {/* Row 2: Detailed Bank Account */}
              <div className="pt-4 border-t border-dashed border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-4 flex items-center gap-2 italic">
                   Thông tin tài khoản ngân hàng thụ hưởng (Dùng cho thanh toán đơn nhập)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Số tài khoản *</Label>
                    <Input {...register("bankAccountNumber")} className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none font-mono focus:border-blue-500" />
                    {errors.bankAccountNumber && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.bankAccountNumber.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Tên ngân hàng *</Label>
                    <Input {...register("bankName")} placeholder="Ví dụ: Vietcombank, Techcombank..." className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:border-blue-500" />
                    {errors.bankName && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.bankName.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Tên chủ tài khoản *</Label>
                    <Input {...register("bankAccountHolder")} className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none font-bold uppercase focus:border-blue-500" />
                    {errors.bankAccountHolder && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.bankAccountHolder.message}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <Label className="text-[11px] font-black text-slate-700 uppercase block mb-5 tracking-widest border-b pb-3">Trạng thái vận hành</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-[38px] text-[13px] border-[#ccc] rounded-none font-black text-emerald-600 shadow-none focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="active" className="text-emerald-600 font-bold uppercase tracking-tighter">ĐANG GIAO DỊCH</SelectItem>
                    <SelectItem value="inactive" className="text-rose-600 font-bold uppercase tracking-tighter">TẠM NGỪNG</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
            <Label className="text-[11px] font-black text-slate-700 uppercase block mb-4 tracking-widest">Ghi chú nghiệp vụ</Label>
            <Textarea {...register("note")} placeholder="Nhập các lưu ý quan trọng về nhà cung cấp này..." className="min-h-[150px] text-[13px] border-[#ccc] rounded-none shadow-none focus:border-emerald-500" />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[12px_30px] flex items-center justify-end gap-[15px] z-[999] shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        <Button type="button" variant="outline" className="min-w-[110px] h-[38px] text-[12px] font-bold border-[#ccc] bg-white rounded-none shadow-sm hover:bg-slate-50 transition-all uppercase" onClick={() => router.back()}>HỦY BỎ</Button>
        <Button type="submit" disabled={isSubmitting} className="min-w-[180px] h-[38px] text-[12px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-none shadow-md shadow-emerald-100 transition-all active:scale-[0.98] uppercase">
          <Save size={18} className="mr-2" />
          {isSubmitting ? "ĐANG LƯU..." : "LƯU NHÀ CUNG CẤP"}
        </Button>
      </div>
    </form>
  );
}
